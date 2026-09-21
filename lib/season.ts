// Liturgical season helper for the Ordinary Time design system (LYG, CTM Parish).
// Follows the calendar used in India: Epiphany is kept on the Sunday between 2 and 8 January.
// Copy to lib/season.ts. No dependencies.

export type Season =
  | "advent" | "christmas" | "ordinary" | "lent"
  | "triduum" | "easter" | "pentecost" | "lourdes";

const DAY = 86_400_000;

// Work in whole calendar days (UTC midnight) so time zones never shift the result.
const d = (y: number, m: number, day: number) => Date.UTC(y, m - 1, day);
const addDays = (t: number, n: number) => t + n * DAY;
const weekday = (t: number) => new Date(t).getUTCDay(); // 0 = Sunday

// Easter Sunday (Gregorian), anonymous algorithm.
export function easter(y: number): number {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100;
  const dd = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - dd - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return d(y, month, day);
}

// First Sunday of Advent: the Sunday falling between 27 November and 3 December.
export function adventStart(y: number): number {
  const nov27 = d(y, 11, 27);
  return addDays(nov27, (7 - weekday(nov27)) % 7);
}

// Baptism of the Lord, which closes the Christmas season.
export function baptismOfTheLord(y: number): number {
  const jan2 = d(y, 1, 2);
  const epiphany = addDays(jan2, (7 - weekday(jan2)) % 7); // Sunday 2 to 8 Jan
  const epiphanyDay = new Date(epiphany).getUTCDate();
  return epiphanyDay >= 7 ? addDays(epiphany, 1) : addDays(epiphany, 7);
}

function todayIn(tz: string, date: Date): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return d(get("year"), get("month"), get("day"));
}

export function getSeason(date: Date = new Date(), tz = "Asia/Kolkata"): Season {
  const t = todayIn(tz, date);
  const y = new Date(t).getUTCFullYear();

  if (t >= d(y, 12, 25)) return "christmas";
  if (t >= adventStart(y)) return "advent";
  if (t <= baptismOfTheLord(y)) return "christmas";

  const e = easter(y);
  const ash = addDays(e, -46);
  const pentecost = addDays(e, 49);

  if (t >= ash && t < addDays(e, -3)) return "lent";
  if (t >= addDays(e, -3) && t < e) return "triduum";
  if (t >= e && t < pentecost) return "easter";
  if (t === pentecost) return "pentecost";

  // Our Lady of Lourdes, 11 February, only when it falls in Ordinary Time.
  if (t === d(y, 2, 11)) return "lourdes";
  return "ordinary";
}

export const seasonLabel: Record<Season, string> = {
  advent: "Advent",
  christmas: "Christmas",
  ordinary: "Ordinary Time",
  lent: "Lent",
  triduum: "The Triduum",
  easter: "Easter",
  pentecost: "Pentecost",
  lourdes: "Our Lady of Lourdes",
};

// Admin override: if a parish setting (for example a Supabase row) holds a season, prefer it.
export function resolveSeason(override?: Season | null, date?: Date): Season {
  return override ?? getSeason(date);
}
