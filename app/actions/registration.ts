"use server";

import { headers } from "next/headers";
import { adminClient } from "@/lib/supabase/admin";
import { clientIp } from "@/lib/committee/attempts";
import { registrationSchema, verifySchema, ageFromIso } from "@/lib/registration/schema";
import { SAVED_MEMBER_COLUMNS, type SavedMember } from "@/lib/registration/member";
import { GUARDIAN_AGE } from "@/lib/registration/constants";
import { CONSENT_VERSION } from "@/lib/content/guidelines";
import { getSeason } from "@/lib/season";

/**
 * Every read and write of member data happens here or in a server component.
 * The browser never touches Supabase.
 */

const LOCKOUT_WINDOW_MINUTES = 15;
const LOCKOUT_ATTEMPTS = 5;

/**
 * The breadth limit on the CONNECTION check. The per-phone counter stops
 * someone probing one number over and over; it does nothing about someone
 * walking a list of numbers, which is the whole point of an enumeration
 * attack. This catches that.
 */
const CHECK_IP_WINDOW_MINUTES = 60;
const CHECK_IP_ATTEMPTS = 20;

/** Same wording whether the phone is unknown or the date of birth is wrong. */
const NEUTRAL =
  "We could not find a member with that mobile number and date of birth. Check both, or register as a new member.";
const LOCKED =
  "Too many tries. For safety, wait 15 minutes before trying again, or register as a new member.";

export type VerifyResult =
  | { ok: true }
  | { ok: false; message: string; locked?: boolean };

export type SubmitResult =
  | { ok: true; member: SavedMember }
  | { ok: false; message: string; duplicate?: boolean; verifyAgain?: boolean }
  | { ok: false; message: string; fieldErrors: Record<string, string> };

async function isLockedOut(phone: string): Promise<boolean> {
  const since = new Date(Date.now() - LOCKOUT_WINDOW_MINUTES * 60_000).toISOString();
  const { count, error } = await adminClient()
    .from("update_attempts")
    .select("id", { count: "exact", head: true })
    .eq("phone", phone)
    .gte("created_at", since);
  if (error) throw error;
  return (count ?? 0) >= LOCKOUT_ATTEMPTS;
}

async function recordFailure(phone: string, ip: string | null = null): Promise<void> {
  await adminClient().from("update_attempts").insert({ phone, ip });
}

/** How many checks this address has made in the last hour. Null if unknowable. */
async function countByIp(ip: string): Promise<number | null> {
  const since = new Date(Date.now() - CHECK_IP_WINDOW_MINUTES * 60_000).toISOString();
  const { count, error } = await adminClient()
    .from("update_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("created_at", since);
  if (error) return null;
  return typeof count === "number" ? count : null;
}

/** Does a member exist with exactly this phone AND this date of birth? */
async function matches(phone: string, dob: string): Promise<boolean> {
  const { data, error } = await adminClient()
    .from("members")
    .select("id")
    .eq("phone", phone)
    .eq("dob", dob)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

/**
 * Returns whether a member is on file, and nothing else. Never their details:
 * knowing a phone number and a date of birth is enough to reach this, so it
 * must not become a way to read anyone's record.
 */
export async function verifyMember(rawPhone: string, rawDob: string): Promise<VerifyResult> {
  const parsed = verifySchema.safeParse({ phone: rawPhone, dob: rawDob });
  if (!parsed.success) return { ok: false, message: NEUTRAL };

  const { phone, dob } = parsed.data;

  if (await isLockedOut(phone)) return { ok: false, message: LOCKED, locked: true };

  if (await matches(phone, dob)) return { ok: true };

  await recordFailure(phone);
  return { ok: false, message: NEUTRAL };
}

/**
 * Whether this person is already on file, and nothing else.
 *
 * The answer is one of four words. No name, no area, no reference id, not even
 * a first initial: knowing a mobile number and a date of birth is enough to
 * reach this, so it must never become a way to read someone's record. That is
 * the same exposure the verify step already has, and this deliberately does not
 * widen it.
 */
export type ExistingCheck =
  | { status: "exists" }
  | { status: "not-found" }
  | { status: "locked"; message: string }
  | { status: "unchecked"; message: string };

/**
 * Called when Continue is tapped on CONNECTION, by which point we hold the
 * same pair the unique constraint uses. Catching it here saves an existing
 * member filling in seven more screens before being told at submit.
 *
 * Counted against the same per-phone limit as verify. Every check counts, not
 * only the ones that find nothing: both answers tell you something about that
 * number. A mistyped number lands on its own counter, so someone correcting a
 * typo never locks themselves out, while five checks of one number in fifteen
 * minutes does.
 */
export async function checkExistingMember(
  rawPhone: string,
  rawDob: string,
): Promise<ExistingCheck> {
  const parsed = verifySchema.safeParse({ phone: rawPhone, dob: rawDob });
  if (!parsed.success) {
    // Nothing to check against. The screen keeps its own field errors; this is
    // only a guard against being called with rubbish.
    return { status: "unchecked", message: NEUTRAL };
  }

  const { phone, dob } = parsed.data;

  // Vercel sets this itself, so it cannot be spoofed. Without it the breadth
  // limit cannot be enforced, and this refuses rather than counting nothing.
  const ip = clientIp(await headers());
  if (!ip) return { status: "locked", message: LOCKED };

  // Either limit is enough to refuse: five checks of one number in fifteen
  // minutes, or twenty checks from one address in an hour.
  if (await isLockedOut(phone)) return { status: "locked", message: LOCKED };

  const byIp = await countByIp(ip);
  if (byIp === null) return { status: "unchecked", message: LOCKED };
  if (byIp >= CHECK_IP_ATTEMPTS) return { status: "locked", message: LOCKED };

  await recordFailure(phone, ip);

  return (await matches(phone, dob)) ? { status: "exists" } : { status: "not-found" };
}

export async function submitRegistration(
  data: unknown,
  mode: "new" | "update",
): Promise<SubmitResult> {
  const parsed = registrationSchema.safeParse(data);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      ok: false,
      message: "Some answers need another look.",
      fieldErrors,
    };
  }

  const d = parsed.data;
  const underage = ageFromIso(d.dob) < GUARDIAN_AGE;

  // Guardian fields are only ever stored for members who need them, so an
  // adult who somehow posted them does not end up with a guardian on record.
  const guardian = underage
    ? {
        guardian_name: d.guardianName,
        guardian_phone: d.guardianPhone,
        guardian_consent: d.guardianConsent,
      }
    : { guardian_name: null, guardian_phone: null, guardian_consent: null };

  const common = {
    full_name: d.fullName,
    dob: d.dob,
    phone: d.phone,
    email: d.email,
    area: d.area,
    community: d.community,
    current_status: d.currentStatus,
    institution_or_workplace: d.institutionOrWorkplace,
    previous_youth_group: d.previousYouthGroup,
    previous_youth_group_details: d.previousYouthGroup ? d.previousYouthGroupDetails : null,
    interests: d.interests,
    purpose: d.purpose,
    ...guardian,
    guidelines_accepted_at: new Date().toISOString(),
    consent_version: CONSENT_VERSION,
  };

  const db = adminClient();

  if (mode === "new") {
    const season = getSeason();
    const { data: row, error } = await db
      .from("members")
      .insert({
        ...common,
        join_season: season,
        join_year: Number(
          new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric" }).format(
            new Date(),
          ),
        ),
        membership_status: "new",
      })
      .select(SAVED_MEMBER_COLUMNS)
      .single();

    if (error) {
      // 23505 is the unique violation on (phone, dob).
      if (error.code === "23505") {
        return {
          ok: false,
          message: "You're already registered with LYG. Use the update path to change your details.",
          duplicate: true,
        };
      }
      throw error;
    }
    return { ok: true, member: row as unknown as SavedMember };
  }

  // Update. The verify result from earlier is not trusted: the lockout and the
  // phone + date of birth match are both re-checked here, on the server.
  if (await isLockedOut(d.phone)) {
    return { ok: false, message: LOCKED, verifyAgain: true };
  }
  if (!(await matches(d.phone, d.dob))) {
    await recordFailure(d.phone);
    return { ok: false, message: NEUTRAL, verifyAgain: true };
  }

  // Never an insert, and never a change to reference_id, join_season,
  // join_year or created_at: the before-update trigger restores those.
  const { data: row, error } = await db
    .from("members")
    .update({ ...common, membership_status: "updated" })
    .eq("phone", d.phone)
    .eq("dob", d.dob)
    .select(SAVED_MEMBER_COLUMNS)
    .single();

  if (error) throw error;
  return { ok: true, member: row as unknown as SavedMember };
}
