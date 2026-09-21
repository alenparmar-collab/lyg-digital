import { z } from "zod";
import {
  CURRENT_STATUS_VALUES,
  INTEREST_VALUES,
  PURPOSE_VALUES,
  statusNeedsPlace,
} from "./options";
import { GUARDIAN_AGE, MAX_AGE, MIN_AGE } from "./constants";
import { ageOn, todayInIndia } from "./validate";

/**
 * The server's definition of a valid registration. Whatever the browser
 * checked, every submission is re-validated here.
 */

export const PHONE_E164 = /^\+91[6-9][0-9]{9}$/;

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

/** Accepts what people type; returns E.164 or undefined. */
export function normalisePhone(value: string): string | undefined {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  if (!/^[6-9]\d{9}$/.test(digits)) return undefined;
  return `+91${digits}`;
}

const phoneField = z
  .string()
  .transform((v) => normalisePhone(v) ?? v)
  .refine((v) => PHONE_E164.test(v), "That does not look like a 10-digit Indian mobile number.");

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "We need a valid date of birth.")
  .refine((v) => {
    const [y, m, d] = v.split("-").map(Number) as [number, number, number];
    const asDate = new Date(Date.UTC(y, m - 1, d));
    return (
      asDate.getUTCFullYear() === y && asDate.getUTCMonth() === m - 1 && asDate.getUTCDate() === d
    );
  }, "That date does not exist.");

export const verifySchema = z.object({
  phone: phoneField,
  dob: isoDate,
});

export const registrationSchema = z
  .object({
    fullName: z
      .string()
      .transform((v) => v.trim().replace(/\s+/g, " "))
      .refine((v) => v.length >= 2, "We need your full name.")
      .refine((v) => v.length <= 120, "That name is longer than we can store.")
      .refine((v) => /\p{L}/u.test(v), "Your name needs at least one letter in it."),

    dob: isoDate,
    phone: phoneField,

    email: z
      .string()
      .transform((v) => v.trim())
      .refine((v) => v === "" || v.length <= 254, "That email address is too long.")
      .refine(
        (v) => v === "" || /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(v),
        "That email address does not look right.",
      )
      .transform((v) => (v === "" ? null : v)),

    area: z
      .string()
      .transform(titleCasePlace)
      .refine((v) => v.length >= 2, "We need your area.")
      .refine((v) => v.length <= 80, "That is longer than we can store."),

    // Optional: plenty of members will not know a community name, and an
    // empty answer is stored as null rather than an empty string.
    community: z
      .string()
      .transform(titleCasePlace)
      .refine((v) => v.length <= 80, "That is longer than we can store.")
      .transform((v) => (v === "" ? null : v)),

    currentStatus: z.enum(CURRENT_STATUS_VALUES as [string, ...string[]], {
      message: "Choose what you are doing at the moment.",
    }),
    institutionOrWorkplace: z
      .string()
      .transform((v) => v.trim())
      .refine((v) => v.length <= 160, "That is longer than we can store.")
      .transform((v) => (v === "" ? null : v)),

    previousYouthGroup: z.boolean(),
    previousYouthGroupDetails: z
      .string()
      .transform((v) => v.trim())
      .refine((v) => v.length <= 500, "Please keep this shorter.")
      .transform((v) => (v === "" ? null : v)),

    interests: z
      .array(z.enum(INTEREST_VALUES as [string, ...string[]]))
      .max(INTEREST_VALUES.length)
      .refine((v) => new Set(v).size === v.length, "Duplicate interest."),
    purpose: z
      .array(z.enum(PURPOSE_VALUES as [string, ...string[]]))
      .max(PURPOSE_VALUES.length)
      .refine((v) => new Set(v).size === v.length, "Duplicate answer."),

    guardianName: z
      .string()
      .transform((v) => v.trim().replace(/\s+/g, " "))
      .refine((v) => v.length <= 120, "That name is longer than we can store.")
      .transform((v) => (v === "" ? null : v)),
    guardianPhone: z
      .string()
      .transform((v) => (v.trim() === "" ? "" : (normalisePhone(v) ?? v)))
      .refine(
        (v) => v === "" || PHONE_E164.test(v),
        "That does not look like a 10-digit Indian mobile number.",
      )
      .transform((v) => (v === "" ? null : v)),
    guardianConsent: z.boolean(),

    guidelinesAccepted: z.literal(true, {
      message: "Please read and accept the guidelines to finish.",
    }),
  })
  // Age bounds. Recalculated here, in Asia/Kolkata, on every submission.
  .refine(
    (d) => {
      const [y, m, day] = d.dob.split("-").map(Number) as [number, number, number];
      const age = ageOn({ year: y, month: m, day }, todayInIndia());
      return age >= MIN_AGE && age <= MAX_AGE;
    },
    {
      path: ["dob"],
      message: `Check the date of birth. LYG registration is for ages ${MIN_AGE} to ${MAX_AGE}.`,
    },
  )
  // The guardian rule. The browser only decides whether to SHOW the guardian
  // page; this is what actually enforces it.
  .refine(
    (d) => {
      const [y, m, day] = d.dob.split("-").map(Number) as [number, number, number];
      const age = ageOn({ year: y, month: m, day }, todayInIndia());
      if (age >= GUARDIAN_AGE) return true;
      return Boolean(d.guardianName && d.guardianPhone && d.guardianConsent);
    },
    {
      path: ["guardianName"],
      message:
        "Anyone under 18 needs a parent or guardian's name, phone number and consent before we can register them.",
    },
  )
  // A place only when the status makes one meaningful.
  .refine((d) => !statusNeedsPlace(d.currentStatus) || Boolean(d.institutionOrWorkplace), {
    path: ["institutionOrWorkplace"],
    message: "Tell us where, so the committee knows.",
  })
  .refine((d) => !d.previousYouthGroup || Boolean(d.previousYouthGroupDetails), {
    path: ["previousYouthGroupDetails"],
    message: "Tell us a little about it.",
  });

export type RegistrationInput = z.input<typeof registrationSchema>;
export type RegistrationParsed = z.output<typeof registrationSchema>;

/** Age in whole calendar days, Asia/Kolkata. Used by the actions too. */
export function ageFromIso(dob: string): number {
  const [y, m, d] = dob.split("-").map(Number) as [number, number, number];
  return ageOn({ year: y, month: m, day: d }, todayInIndia());
}
