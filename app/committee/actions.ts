"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireCommittee } from "./guard";
import { committeeConfig } from "@/lib/committee/config";
import { loginGate, recordLoginFailure } from "@/lib/committee/attempts";
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

export type LoginResult = { ok: false; message: string };

/** One message for a wrong number and a wrong password alike. */
const NO_MATCH = "That didn't match.";
const LOCKED = "Too many tries. Wait 15 minutes and try again.";
const UNCONFIGURED = "Committee access isn't configured.";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function committeeLogin(
  _previous: LoginResult | null,
  formData: FormData,
): Promise<LoginResult> {
  const config = committeeConfig();
  if (!config) return { ok: false, message: UNCONFIGURED };

  const typedPhone = String(formData.get("phone") ?? "").trim();
  const typedPassword = String(formData.get("password") ?? "");

  if (!typedPhone || !typedPassword) {
    return { ok: false, message: "Enter your mobile number and password." };
  }

  // The limit is checked before the credentials, so a locked login costs an
  // attacker a request and tells them nothing about what they typed. A missing
  // login_attempts table closes the door rather than opening it.
  const gate = await loginGate();
  if (!gate.ok) {
    return { ok: false, message: gate.reason === "locked" ? LOCKED : UNCONFIGURED };
  }

  // Typed the way people actually type a number; stored and compared as E.164.
  const phone = normalisePhone(typedPhone);

  // Both comparisons run whatever the first one says, so how long this takes
  // never reveals which half was wrong.
  const phoneMatches = phone !== undefined && sha256Equal(phone, config.phone);
  const passwordMatches = sha256Equal(typedPassword, config.password);

  if (!phoneMatches || !passwordMatches) {
    await recordLoginFailure();
    return { ok: false, message: NO_MATCH };
  }

  const { value, expires } = issueSession(config.secret);
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
 * only after the session has been checked here, on the server, first.
 */
export async function getMemberForPdf(id: string): Promise<SavedMember | null> {
  await requireCommittee();

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
