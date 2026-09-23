"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireFullAccess } from "./guard";
import { committeeAccess } from "@/lib/committee/users";
import { clientIp, loginGate, recordLoginFailure } from "@/lib/committee/attempts";
import {
  COMMITTEE_COOKIE,
  COMMITTEE_COOKIE_PATH,
  committeeCookieOptions,
  issueSession,
  sha256Equal,
} from "@/lib/committee/session";
import { adminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { normalisePhone } from "@/lib/registration/validate";
import { SAVED_MEMBER_COLUMNS, type SavedMember } from "@/lib/registration/member";
import type { CommitteeUser } from "@/lib/committee/users";

export type LoginResult = { ok: false; message: string };

/**
 * One message for a wrong number, a wrong password and a rate-limited attempt
 * alike. Which of the two limits was hit, and whether a limit was hit at all,
 * are things an attacker would like to know and a committee member does not
 * need to be told apart from a typo.
 */
const NO_MATCH = "That didn't match.";
const UNCONFIGURED = "Committee access isn't configured.";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function committeeLogin(
  _previous: LoginResult | null,
  formData: FormData,
): Promise<LoginResult> {
  const access = committeeAccess();
  if (!access.ok) return { ok: false, message: UNCONFIGURED };

  const typedPhone = String(formData.get("phone") ?? "").trim();
  const typedPassword = String(formData.get("password") ?? "");

  if (!typedPhone || !typedPassword) {
    return { ok: false, message: "Enter your mobile number and password." };
  }

  // Typed the way people actually type a number; stored and compared as E.164.
  const normalised = normalisePhone(typedPhone);

  // Vercel sets this itself, so it cannot be spoofed. Without it the limit
  // cannot be enforced, and loginGate refuses rather than counting nothing.
  const ip = clientIp(await headers());

  // The limits are checked before the credentials, so a refused attempt costs
  // an attacker a request and tells them nothing about what they typed. A
  // missing login_attempts table closes the door rather than opening it.
  const gate = await loginGate(normalised, ip);
  if (!gate.ok) {
    if (gate.reason === "unconfigured") return { ok: false, message: UNCONFIGURED };
    // Deliberately the same wording as a wrong password.
    return { ok: false, message: NO_MATCH };
  }

  // A number that is not a valid mobile at all still gets compared, against a
  // value it cannot equal, so an unparseable number costs the same time as a
  // parseable one.
  const phone = normalised ?? "\u0000not-a-number";

  // Every entry is compared, and both halves of every entry are compared, with
  // no early exit. How long this takes therefore reveals neither which entry
  // was matched nor which half was wrong.
  let matched: CommitteeUser | null = null;
  for (const user of access.users) {
    const phoneMatches = sha256Equal(phone, user.phone);
    const passwordMatches = sha256Equal(typedPassword, user.password);
    if (phoneMatches && passwordMatches) matched = user;
  }

  if (!matched) {
    await recordLoginFailure(normalised, ip);
    return { ok: false, message: NO_MATCH };
  }

  const { value, expires } = issueSession(matched, access.secret);
  const store = await cookies();
  store.set(COMMITTEE_COOKIE, value, committeeCookieOptions(expires));

  redirect("/committee");
}

export async function committeeLogout(): Promise<void> {
  const store = await cookies();
  store.delete({ name: COMMITTEE_COOKIE, path: COMMITTEE_COOKIE_PATH });
  redirect("/committee/login");
}

/**
 * One member record, for the Download PDF link on a committee list row.
 *
 * The list itself sends the browser only what it shows. A full record crosses
 * to the browser exactly when a committee member asks for that one PDF, and
 * only after the session has been checked here, on the server, first. A
 * summary-only person never gets past that check, so the action cannot be used
 * to reach a member record the pages would not show them.
 */
export async function getMemberForPdf(id: string): Promise<SavedMember | null> {
  await requireFullAccess();

  if (!UUID.test(id)) return null;
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await adminClient()
    .from("members")
    .select(SAVED_MEMBER_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return (data as unknown as SavedMember) ?? null;
}
