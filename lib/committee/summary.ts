import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { INTERESTS, PURPOSE, labelFor } from "@/lib/registration/options";
import { ageOn, todayInIndia } from "@/lib/registration/validate";

/**
 * The numbers behind the summary sheet.
 *
 * Everything here is worked out on the server and leaves as counts. No name,
 * phone, email, date of birth, reference id or guardian detail is returned,
 * so there is nothing identifying for the page to render even by accident.
 *
 * Small groups are the risk in a parish this size: "one 16-year-old in
 * Ghatlodia" identifies a child. So any row in the area, interest and
 * hoping-for lists with fewer than MIN_VISIBLE_COUNT people is not shown on
 * its own; those rows are added together into a single Other row. The totals
 * and the two splits are plain counts over everybody and carry no such risk.
 */

/** Below this, a row is folded into Other rather than shown on its own. */
export const MIN_VISIBLE_COUNT = 3;

/** Interests are capped so the sheet stays one page. */
const INTEREST_LIMIT = 10;

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/** Only the columns the summary needs. Nothing identifying is even read. */
const SUMMARY_COLUMNS = "dob, area, interests, purpose, membership_status, created_at";

const PAGE_SIZE = 1000;

type SummaryRow = {
  dob: string;
  area: string;
  interests: string[] | null;
  purpose: string[] | null;
  membership_status: string;
  created_at: string;
};

export type BreakdownRow = { label: string; count: number };

export type Breakdown = {
  rows: BreakdownRow[];
  /** Everything not shown on its own: the small rows, and any past the cap. */
  other: number;
  /** The largest shown count, for scaling the bars. Never zero. */
  max: number;
};

export type Summary = {
  total: number;
  last7: number;
  newCount: number;
  updatedCount: number;
  under18: number;
  adults: number;
  areas: Breakdown;
  interests: Breakdown;
  purposes: Breakdown;
  /** ISO timestamp of the most recent registration, or null when there are none. */
  latest: string | null;
};

export const EMPTY_SUMMARY: Summary = {
  total: 0,
  last7: 0,
  newCount: 0,
  updatedCount: 0,
  under18: 0,
  adults: 0,
  areas: { rows: [], other: 0, max: 1 },
  interests: { rows: [], other: 0, max: 1 },
  purposes: { rows: [], other: 0, max: 1 },
  latest: null,
};

function tally(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

/**
 * Turns raw counts into what the sheet may show. Sorted highest first, ties
 * broken alphabetically so the same data always renders the same way.
 */
export function buildBreakdown(counts: Map<string, number>, limit?: number): Breakdown {
  const everything = [...counts.entries()].reduce((sum, [, c]) => sum + c, 0);

  const sorted = [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );

  const eligible = sorted.filter(([, count]) => count >= MIN_VISIBLE_COUNT);
  const shown = limit === undefined ? eligible : eligible.slice(0, limit);

  const shownTotal = shown.reduce((sum, [, c]) => sum + c, 0);

  return {
    rows: shown.map(([label, count]) => ({ label, count })),
    other: everything - shownTotal,
    max: Math.max(1, ...shown.map(([, c]) => c)),
  };
}

/** Reads every registration in pages, so a full parish is never truncated. */
async function readAll(): Promise<SummaryRow[]> {
  const db = adminClient();
  const rows: SummaryRow[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await db
      .from("members")
      .select(SUMMARY_COLUMNS)
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    const page = (data ?? []) as unknown as SummaryRow[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

export function summarise(rows: readonly SummaryRow[], now: Date = new Date()): Summary {
  if (rows.length === 0) return EMPTY_SUMMARY;

  const today = todayInIndia(now);
  const since = now.getTime() - SEVEN_DAYS_MS;

  const areas = new Map<string, number>();
  const interests = new Map<string, number>();
  const purposes = new Map<string, number>();

  let last7 = 0;
  let newCount = 0;
  let updatedCount = 0;
  let under18 = 0;
  let latest: string | null = null;

  for (const row of rows) {
    const created = new Date(row.created_at).getTime();
    if (Number.isFinite(created) && created >= since) last7 += 1;
    if (latest === null || row.created_at > latest) latest = row.created_at;

    if (row.membership_status === "updated") updatedCount += 1;
    else newCount += 1;

    // Age in whole calendar days, Asia/Kolkata, the same rule registration uses.
    const [y, m, d] = row.dob.split("-").map(Number) as [number, number, number];
    if (y && m && d && ageOn({ year: y, month: m, day: d }, today) < 18) under18 += 1;

    if (row.area) tally(areas, row.area);
    for (const value of row.interests ?? []) tally(interests, labelFor(INTERESTS, value));
    for (const value of row.purpose ?? []) tally(purposes, labelFor(PURPOSE, value));
  }

  return {
    total: rows.length,
    last7,
    newCount,
    updatedCount,
    under18,
    adults: rows.length - under18,
    areas: buildBreakdown(areas),
    interests: buildBreakdown(interests, INTEREST_LIMIT),
    purposes: buildBreakdown(purposes),
    latest,
  };
}

export async function loadSummary(now: Date = new Date()): Promise<Summary> {
  return summarise(await readAll(), now);
}
