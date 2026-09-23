import "server-only";
import { adminClient } from "@/lib/supabase/admin";

/**
 * The rate limit on committee sign-in.
 *
 * Two counters, kept independently, either one enough to refuse:
 *
 *   per number   five failures in fifteen minutes against one mobile number
 *   per address  twenty failures in an hour from one client address
 *
 * They are separate because a single shared counter meant one stranger
 * guessing at one number could lock out all six committee members. Keying only
 * on the number would be no better the other way round: an attacker varying
 * the number would keep every counter empty, which is what the address limit
 * is there to catch.
 *
 * The counts live in Supabase rather than in memory because the app runs
 * serverless: separate requests are separate instances, and an in-memory
 * counter would reset under exactly the load it is meant to stop.
 */

const PHONE_WINDOW_MINUTES = 15;
const PHONE_MAX_FAILURES = 5;

const IP_WINDOW_MINUTES = 60;
const IP_MAX_FAILURES = 20;

export type LoginGate =
  | { ok: true }
  /** The table is missing, Supabase is unreachable, or there is no client address. */
  | { ok: false; reason: "unconfigured" }
  | { ok: false; reason: "locked" };

const UNCONFIGURED = { ok: false, reason: "unconfigured" } as const;
const LOCKED = { ok: false, reason: "locked" } as const;

/**
 * The address the request came from.
 *
 * Vercel sets x-vercel-forwarded-for itself and it cannot be spoofed by the
 * client, which is why it is preferred over the x-forwarded-for anyone can
 * send. Locally there is no platform in front of the app at all, so rather
 * than refuse every sign-in during development, that one case falls back to a
 * fixed label. In production a missing address is a refusal.
 */
export function clientIp(headers: Headers): string | null {
  const first = (value: string) => value.split(",")[0]?.trim() || null;

  const vercel = headers.get("x-vercel-forwarded-for");
  if (vercel) return first(vercel);

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return first(forwarded);

  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;

  if (process.env.NODE_ENV !== "production") return "local-development";
  return null;
}

/** Counts rows in a window, or null when the count cannot be established. */
async function countSince(
  column: "phone" | "ip",
  value: string,
  minutes: number,
): Promise<number | null> {
  const since = new Date(Date.now() - minutes * 60_000).toISOString();

  const { count, error } = await adminClient()
    .from("login_attempts")
    .select("id", { count: "exact", head: true })
    .eq(column, value)
    .gte("created_at", since);

  // A missing table or column lands here. So does a bad service role key.
  if (error) return null;

  // No count and no error means the limit could not be established. Treating
  // that as "zero failures so far" would open the login exactly when the store
  // is broken, so an unknown count is a closed door, not an empty one.
  return typeof count === "number" ? count : null;
}

/**
 * Checked before the credentials, so a refused attempt costs an attacker a
 * request and tells them nothing about what they typed.
 *
 * `phone` is the normalised number, or undefined when what was typed is not a
 * mobile number at all. There is then nothing to key the per-number counter
 * on, and the per-address one carries the whole weight.
 */
export async function loginGate(
  phone: string | undefined,
  ip: string | null,
): Promise<LoginGate> {
  // No address means the limit cannot be enforced, so nobody gets in.
  if (!ip) return UNCONFIGURED;

  try {
    if (phone) {
      const byPhone = await countSince("phone", phone, PHONE_WINDOW_MINUTES);
      if (byPhone === null) return UNCONFIGURED;
      if (byPhone >= PHONE_MAX_FAILURES) return LOCKED;
    }

    const byIp = await countSince("ip", ip, IP_WINDOW_MINUTES);
    if (byIp === null) return UNCONFIGURED;
    if (byIp >= IP_MAX_FAILURES) return LOCKED;

    return { ok: true };
  } catch {
    // adminClient() throws when Supabase is not configured at all.
    return UNCONFIGURED;
  }
}

export async function recordLoginFailure(
  phone: string | undefined,
  ip: string | null,
): Promise<void> {
  try {
    await adminClient().from("login_attempts").insert({
      created_at: new Date().toISOString(),
      phone: phone ?? null,
      ip: ip ?? null,
    });
  } catch {
    // Never let a logging failure turn a refused sign-in into an accepted one.
  }
}
