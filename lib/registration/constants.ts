/**
 * Shared registration constants. The server will validate against these same
 * values once submission exists, so they live here rather than in a component.
 */

/** Chapters in order. WELCOME is p.1. The page number shown is index + 1. */
export const STEPS = [
  "welcome",
  "verify",
  "identity",
  "connection",
  "community",
  "life",
  "interests",
  "purpose",
  "guardian",
  "guidelines",
  "review",
  "done",
] as const;

export type Step = (typeof STEPS)[number];

/** Chapters that carry a page number and the progress strip. */
export const NUMBERED_STEPS: Step[] = [
  "welcome",
  "identity",
  "connection",
  "community",
  "life",
  "interests",
  "purpose",
  "guardian",
  "guidelines",
];

/**
 * Age limits. These are typo guards, not a policy: LYG runs from school
 * students to young working people around 28, but a 30-year-old helper should
 * not be blocked by a date checker, so the hard ceiling sits well above the
 * group's description. Anything at or above SOFT_MAX_AGE gets a gentle "is
 * that right?" rather than an error.
 */
export const MIN_AGE = 12;
export const MAX_AGE = 35;
export const SOFT_MAX_AGE = 29;

/** Under this age on the day they register, the guardian chapter appears. */
export const GUARDIAN_AGE = 18;

/** Everything is stored against the parish. Never asked. */
export const PARISH = "CTM Parish";

export const TIME_ZONE = "Asia/Kolkata";

/** Indian mobile numbers: ten digits starting 6 to 9, stored as E.164. */
export const PHONE_COUNTRY_CODE = "+91";
