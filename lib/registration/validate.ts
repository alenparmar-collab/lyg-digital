import {
  GUARDIAN_AGE,
  MAX_AGE,
  MIN_AGE,
  PHONE_COUNTRY_CODE,
  SOFT_MAX_AGE,
  TIME_ZONE,
} from "./constants";

/**
 * Field checks for the registration chapters. The server will re-run the same
 * rules on submit through a Zod schema built from this file, whatever the
 * client already checked.
 */

export type FieldError = string | undefined;

/** Today's date in Asia/Kolkata, as whole calendar days, so a member
 *  registering at 23:40 IST on their eighteenth birthday is eighteen. */
export function todayInIndia(now: Date = new Date()): {
  year: number;
  month: number;
  day: number;
} {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

export function ageOn(
  birth: { year: number; month: number; day: number },
  today: { year: number; month: number; day: number },
): number {
  let age = today.year - birth.year;
  if (today.month < birth.month || (today.month === birth.month && today.day < birth.day)) {
    age -= 1;
  }
  return age;
}

export function validateFullName(value: string): FieldError {
  const name = value.trim().replace(/\s+/g, " ");
  if (!name) return "We need your full name.";
  if (name.length < 2) return "That looks too short to be a full name.";
  if (name.length > 120) return "That is longer than we can store. Shorten it a little.";
  if (!/\p{L}/u.test(name)) return "Your name needs at least one letter in it.";
  return undefined;
}

export function normaliseFullName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export type DateParts = { day: string; month: string; year: string };

export type DateResult = {
  error: FieldError;
  /** Set only when the date is real and inside the age limits. */
  iso?: string;
  age?: number;
  /** A real date and a plausible age, but old enough to be worth a second look. */
  confirmAge?: number;
  needsGuardian?: boolean;
};

export function validateDateOfBirth(parts: DateParts, now?: Date): DateResult {
  const { day, month, year } = parts;

  if (!day.trim() && !month.trim() && !year.trim()) {
    return { error: "We need your date of birth." };
  }
  if (!day.trim() || !month.trim() || !year.trim()) {
    return { error: "Your date of birth needs a day, a month and a year." };
  }
  if (!/^\d{1,2}$/.test(day.trim()) || !/^\d{1,2}$/.test(month.trim()) || !/^\d{4}$/.test(year.trim())) {
    return { error: "Use numbers only, with four digits for the year." };
  }

  const d = Number(day);
  const m = Number(month);
  const y = Number(year);

  // Reject dates that do not exist, like 31 February.
  const asDate = new Date(Date.UTC(y, m - 1, d));
  const real =
    asDate.getUTCFullYear() === y && asDate.getUTCMonth() === m - 1 && asDate.getUTCDate() === d;
  if (!real) return { error: "That date does not exist. Check the day and month." };

  const today = todayInIndia(now);
  const age = ageOn({ year: y, month: m, day: d }, today);

  if (age < 0) return { error: "That date is in the future." };
  if (age < MIN_AGE) {
    return { error: `You need to be at least ${MIN_AGE} to join LYG. Ask at the parish office about the children's groups.` };
  }
  if (age > MAX_AGE) {
    return { error: `Check the year. That would make you over ${MAX_AGE}.` };
  }

  const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return {
    error: undefined,
    iso,
    age,
    confirmAge: age >= SOFT_MAX_AGE ? age : undefined,
    needsGuardian: age < GUARDIAN_AGE,
  };
}

/** Accepts what people actually type, stores E.164. */
export function normalisePhone(value: string): string | undefined {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  if (!/^[6-9]\d{9}$/.test(digits)) return undefined;
  return `${PHONE_COUNTRY_CODE}${digits}`;
}

export function validatePhone(value: string): FieldError {
  if (!value.trim()) return "We need a mobile number. This is how the group reaches you.";
  if (!normalisePhone(value)) return "That does not look like a 10-digit Indian mobile number.";
  return undefined;
}

/** Email is optional: most school members do not have one they use. */
export function validateEmail(value: string): FieldError {
  const email = value.trim();
  if (!email) return undefined;
  if (email.length > 254) return "That email address is too long.";
  if (!/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email)) {
    return "That email address does not look right.";
  }
  return undefined;
}

/**
 * Area and community are free text, so they are tidied rather than matched
 * against a list: trimmed, repeated spaces collapsed, and title-cased so
 * "naranpura  east" and "NARANPURA EAST" both store as "Naranpura East".
 *
 * Words are lowercased before their first letter is capitalised, because
 * all-caps typing is common. That does mean a name like "McDonald" comes back
 * as "Mcdonald"; the committee can correct those in Supabase.
 */
export function titleCasePlace(value: string): string {
  const tidied = value.trim().replace(/\s+/g, " ").toLowerCase();

  // First letter of each word, and of each hyphenated part: "anand-nagar"
  // becomes "Anand-Nagar".
  let out = tidied.replace(
    /(^|[\s\-])(\p{L})/gu,
    (_m, sep: string, letter: string) => sep + letter.toUpperCase(),
  );

  // A name like D'Souza or O'Brien takes a capital after the apostrophe. A
  // possessive like Anne's does not. What tells them apart is the single
  // letter before the apostrophe, so only that case is capitalised.
  out = out.replace(
    /(^|[\s\-])(\p{L})(['\u2019])(\p{L})/gu,
    (_m, sep: string, first: string, mark: string, letter: string) =>
      sep + first.toUpperCase() + mark + letter.toUpperCase(),
  );

  return out;
}
