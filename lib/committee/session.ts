import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { COMMITTEE_VIEWS, type CommitteeUser, type CommitteeView } from "./users";

/**
 * The committee session cookie.
 *
 * There is no session table. The cookie carries who signed in, which entry in
 * the list they signed in as, and when it expires, all under one HMAC-SHA256
 * signature. The server can therefore tell a cookie it issued from one someone
 * typed, without storing anything.
 *
 * Three separate things end a session:
 *   - the expiry passing;
 *   - COMMITTEE_SESSION_SECRET changing, which invalidates every cookie ever
 *     issued, and is how to sign everyone out at once;
 *   - the entry behind the fingerprint no longer being in the list, or its
 *     view having changed, which is what makes removing a person, changing
 *     their password, or narrowing what they may see take effect on their very
 *     next request rather than in twelve hours.
 *
 * The signature covers all of it, so nothing in the cookie can be edited: not
 * the expiry, not the fingerprint, not the name, and not the view. A cookie
 * claiming "all" is worth nothing once the list says "summary".
 */

export const COMMITTEE_COOKIE = "lyg_committee";
export const COMMITTEE_COOKIE_PATH = "/committee";

/**
 * v2 carries a name and a fingerprint; v1 carried only an expiry. A v1 cookie
 * simply fails to verify, so the one effect of this change on a signed-in
 * person is that they sign in again once.
 */
const VERSION = "v2";
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

const encodeName = (name: string) => Buffer.from(name, "utf8").toString("base64url");
const decodeName = (raw: string) => Buffer.from(raw, "base64url").toString("utf8");

export type IssuedSession = { value: string; expires: Date };

export function issueSession(
  user: CommitteeUser,
  secret: string,
  now: number = Date.now(),
): IssuedSession {
  const expiresAt = now + TWELVE_HOURS_MS;
  const payload =
    `${VERSION}.${expiresAt}.${encodeName(user.name)}.${user.fingerprint}.${user.view}`;
  return { value: `${payload}.${sign(payload, secret)}`, expires: new Date(expiresAt) };
}

export type SessionClaims = { name: string; fingerprint: string; view: CommitteeView };

/**
 * The claims inside a cookie this server signed and which has not expired, or
 * null. It says nothing about whether that person is still on the list: that
 * is a separate check, against the list as it is right now.
 */
export function readSession(
  value: string | undefined | null,
  secret: string,
  now: number = Date.now(),
): SessionClaims | null {
  if (!value) return null;

  const parts = value.split(".");
  if (parts.length !== 6) return null;

  const [version, expiresRaw, nameRaw, fingerprint, viewRaw, signature] = parts as [
    string,
    string,
    string,
    string,
    string,
    string,
  ];
  if (version !== VERSION) return null;

  // Signature first: never trust anything in an unsigned cookie.
  const payload = `${version}.${expiresRaw}.${nameRaw}.${fingerprint}.${viewRaw}`;
  if (!sha256Equal(signature, sign(payload, secret))) return null;

  if (!COMMITTEE_VIEWS.includes(viewRaw as CommitteeView)) return null;

  const expiresAt = Number(expiresRaw);
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return null;

  let name: string;
  try {
    name = decodeName(nameRaw);
  } catch {
    return null;
  }
  if (!name) return null;

  return { name, fingerprint, view: viewRaw as CommitteeView };
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
    path: COMMITTEE_COOKIE_PATH,
    expires,
  };
}
