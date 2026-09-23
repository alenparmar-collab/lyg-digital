import "server-only";
import { createHash } from "node:crypto";
import { normalisePhone } from "@/lib/registration/validate";

/**
 * Who may sign in to /committee.
 *
 * One entry per person, read from a single server-only variable. The parish
 * priest and each committee member get their own number and password, so the
 * viewer no longer depends on one individual and removing someone is an edit
 * to one variable rather than a code change.
 *
 * The whole list is rejected if any entry is wrong. A list where one password
 * is too short is a list someone has got wrong, and guessing which half of it
 * was meant seriously is worse than letting nobody in until it is fixed.
 *
 * Nothing here is ever logged beyond the name of the rule that failed. A
 * password never reaches a log line, an error message or a page.
 */

/** Short enough to type on a phone, long enough not to be guessed. */
export const MIN_PASSWORD_LENGTH = 12;

/**
 * How much of the viewer someone gets. "summary" is for anyone who should see
 * the shape of the parish's youth without seeing individual members: the
 * numbers, and nothing that names a person.
 */
export type CommitteeView = "all" | "summary";

export const COMMITTEE_VIEWS: readonly CommitteeView[] = ["all", "summary"];

export type CommitteeUser = {
  name: string;
  /** Normalised to +91 E.164, exactly as a member's number is. */
  phone: string;
  password: string;
  /** Defaults to "all" when the entry does not say. */
  view: CommitteeView;
  /**
   * Identifies this exact entry in a session cookie without putting the
   * password in it. Change the password and the fingerprint changes, so the
   * cookie stops matching and the session ends.
   */
  fingerprint: string;
};

export type CommitteeAccess =
  | { ok: true; users: CommitteeUser[]; secret: string; source: "list" | "single" }
  | { ok: false; reason: string };

export function fingerprintOf(phone: string, password: string): string {
  return createHash("sha256")
    .update(`${phone}\u0000${password}`, "utf8")
    .digest("hex")
    .slice(0, 16);
}

type RawEntry = { name?: unknown; phone?: unknown; password?: unknown; view?: unknown };

/** Validates one entry. Returns the reason it is unusable, or null. */
function entryProblem(entry: RawEntry, index: number): string | null {
  const at = `entry ${index + 1}`;

  if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
    return `${at} is not an object`;
  }
  if (typeof entry.name !== "string" || entry.name.trim() === "") {
    return `${at} has no name`;
  }
  if (typeof entry.phone !== "string" || !normalisePhone(entry.phone)) {
    return `${at} (${entry.name.trim()}) has a phone that is not a valid +91 mobile number`;
  }
  if (typeof entry.password !== "string" || entry.password.length < MIN_PASSWORD_LENGTH) {
    return `${at} (${entry.name.trim()}) has a password shorter than ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (
    entry.view !== undefined &&
    (typeof entry.view !== "string" || !COMMITTEE_VIEWS.includes(entry.view as CommitteeView))
  ) {
    return `${at} (${entry.name.trim()}) has a view that is not "all" or "summary"`;
  }
  return null;
}

function reject(reason: string): CommitteeAccess {
  // The rule, never the value. Deliberately not console.error: a misconfigured
  // deployment is a closed one, not a crashing one.
  console.warn(`[committee] sign-in disabled: ${reason}`);
  return { ok: false, reason };
}

/**
 * Parsed once per distinct set of environment values. Vercel fixes these for
 * the life of a deployment, so this is "once at startup" in practice, while
 * still re-deriving if the values ever differ, which is what lets a removed
 * person's cookie stop matching on their very next request.
 */
let cache: { key: string; value: CommitteeAccess } | null = null;

export function committeeAccess(): CommitteeAccess {
  const rawUsers = process.env.COMMITTEE_USERS ?? "";
  const rawPhone = process.env.COMMITTEE_PHONE ?? "";
  const rawPassword = process.env.COMMITTEE_PASSWORD ?? "";
  const secret = process.env.COMMITTEE_SESSION_SECRET ?? "";

  const key = `${rawUsers}\u0001${rawPhone}\u0001${rawPassword}\u0001${secret}`;
  if (cache && cache.key === key) return cache.value;

  const value = resolve(rawUsers, rawPhone, rawPassword, secret);
  cache = { key, value };
  return value;
}

function resolve(
  rawUsers: string,
  rawPhone: string,
  rawPassword: string,
  secret: string,
): CommitteeAccess {
  if (!secret) return reject("COMMITTEE_SESSION_SECRET is not set");

  // ---------------------------------------------------------------- the list
  if (rawUsers.trim() !== "") {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawUsers);
    } catch {
      return reject("COMMITTEE_USERS is not valid JSON");
    }

    if (!Array.isArray(parsed)) return reject("COMMITTEE_USERS is not a JSON array");
    if (parsed.length === 0) return reject("COMMITTEE_USERS is an empty list");

    const users: CommitteeUser[] = [];
    const seen = new Set<string>();

    for (const [index, raw] of parsed.entries()) {
      const problem = entryProblem(raw as RawEntry, index);
      if (problem) return reject(problem);

      const entry = raw as { name: string; phone: string; password: string; view?: CommitteeView };
      const phone = normalisePhone(entry.phone) as string;

      if (seen.has(phone)) {
        return reject(`entry ${index + 1} repeats a phone number already in the list`);
      }
      seen.add(phone);

      users.push({
        name: entry.name.trim(),
        phone,
        password: entry.password,
        view: entry.view ?? "all",
        fingerprint: fingerprintOf(phone, entry.password),
      });
    }

    return { ok: true, users, secret, source: "list" };
  }

  // ----------------------------------------------- the single-login fallback
  // Kept so the deployment cannot lock itself out between this merge and the
  // moment COMMITTEE_USERS is set in Vercel. Remove the two old variables once
  // the list is in place.
  if (rawPhone.trim() !== "" || rawPassword !== "") {
    const phone = normalisePhone(rawPhone);
    if (!phone) return reject("COMMITTEE_PHONE is not a valid +91 mobile number");
    if (rawPassword.length < MIN_PASSWORD_LENGTH) {
      return reject(`COMMITTEE_PASSWORD is shorter than ${MIN_PASSWORD_LENGTH} characters`);
    }
    return {
      ok: true,
      secret,
      source: "single",
      users: [
        {
          name: "LYG committee",
          phone,
          password: rawPassword,
          view: "all",
          fingerprint: fingerprintOf(phone, rawPassword),
        },
      ],
    };
  }

  return reject("neither COMMITTEE_USERS nor COMMITTEE_PHONE/COMMITTEE_PASSWORD is set");
}

export function isCommitteeConfigured(): boolean {
  return committeeAccess().ok;
}

/** The entry a signed-in cookie still refers to, or null if it no longer does. */
export function findUser(
  users: readonly CommitteeUser[],
  name: string,
  fingerprint: string,
): CommitteeUser | null {
  return users.find((u) => u.name === name && u.fingerprint === fingerprint) ?? null;
}
