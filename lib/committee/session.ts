import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * The committee session cookie.
 *
 * There is no session table. The cookie carries its own expiry and an
 * HMAC-SHA256 signature over it, so the server can tell a cookie it issued from
 * one someone typed, without storing anything. Change
 * COMMITTEE_SESSION_SECRET and every cookie ever issued stops verifying, which
 * is the way to sign everyone out at once.
 *
 * The signature covers the expiry, so moving the expiry forward invalidates the
 * cookie. Both halves are checked on every committee request.
 */

export const COMMITTEE_COOKIE = "lyg_committee";

const VERSION = "v1";
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/**
 * Compare two strings without leaking, through timing, how much of them
 * matched. Hashing first makes both sides the same 32 bytes, so
 * timingSafeEqual never throws on a length mismatch and the length itself
 * gives nothing away.
 */
export function sha256Equal(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a, "utf8").digest();
  const hb = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(ha, hb);
}

export type IssuedSession = { value: string; expires: Date };

export function issueSession(secret: string, now: number = Date.now()): IssuedSession {
  const expiresAt = now + TWELVE_HOURS_MS;
  const payload = `${VERSION}.${expiresAt}`;
  return { value: `${payload}.${sign(payload, secret)}`, expires: new Date(expiresAt) };
}

/** True only for a cookie this server signed, which has not yet expired. */
export function verifySession(
  value: string | undefined | null,
  secret: string,
  now: number = Date.now(),
): boolean {
  if (!value) return false;

  const parts = value.split(".");
  if (parts.length !== 3) return false;

  const [version, expiresRaw, signature] = parts as [string, string, string];
  if (version !== VERSION) return false;

  // Signature first: never trust the expiry in an unsigned cookie.
  if (!sha256Equal(signature, sign(`${version}.${expiresRaw}`, secret))) return false;

  const expiresAt = Number(expiresRaw);
  if (!Number.isFinite(expiresAt)) return false;
  return expiresAt > now;
}

/**
 * Path is /committee, so the cookie is never sent with a member's registration
 * request and never reaches a public page.
 *
 * Secure is on wherever the site actually runs. It is relaxed only for local
 * http development, where a Secure cookie would never come back and signing in
 * would be impossible.
 */
export function committeeCookieOptions(expires: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/committee",
    expires,
  };
}

export const COMMITTEE_COOKIE_PATH = "/committee";
