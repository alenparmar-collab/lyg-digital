import "server-only";
import { adminClient } from "@/lib/supabase/admin";

/**
 * The rate limit on committee sign-in.
 *
 * Five failures in fifteen minutes and the login closes, whoever is asking.
 * There is one committee account, so there is nothing to key the limit on and
 * nothing to be gained by keying it on the number someone typed: that would let
 * an attacker keep their own counter empty by varying it.
 *
 * The count lives in Supabase rather than in memory because the app runs
 * serverless: separate requests are separate instances, and an in-memory
 * counter would reset under exactly the load it is meant to stop.
 */

const WINDOW_MINUTES = 15;
const MAX_FAILURES = 5;

export type LoginGate =
  | { ok: true }
  /** The table is missing, or Supabase is not configured: fail closed. */
  | { ok: false; reason: "unconfigured" }
  | { ok: false; reason: "locked" };

export async function loginGate(): Promise<LoginGate> {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();

  try {
    const { count, error } = await adminClient()
      .from("login_attempts")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since);

    // A missing table lands here (42P01). So does a bad service role key.
    if (error) return { ok: false, reason: "unconfigured" };

    // No count and no error means the limit could not be established. Treating
    // that as "zero failures so far" would open the login exactly when the
    // store is broken, so an unknown count is a closed door, not an empty one.
    if (typeof count !== "number") return { ok: false, reason: "unconfigured" };

    return count >= MAX_FAILURES ? { ok: false, reason: "locked" } : { ok: true };
  } catch {
    // adminClient() throws when Supabase is not configured at all.
    return { ok: false, reason: "unconfigured" };
  }
}

export async function recordLoginFailure(): Promise<void> {
  try {
    await adminClient()
      .from("login_attempts")
      .insert({ created_at: new Date().toISOString() });
  } catch {
    // Never let a logging failure turn a refused sign-in into an accepted one.
  }
}
