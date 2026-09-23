import Logo from "@/components/Logo";
import Link from "next/link";
import CommitteeHeader from "./CommitteeHeader";
import { requireCommittee } from "./guard";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import {
  EMPTY_SUMMARY,
  MIN_VISIBLE_COUNT,
  loadSummary,
  type Breakdown,
} from "@/lib/committee/summary";
import styles from "./summary.module.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * The summary sheet, and the first thing a committee member sees.
 *
 * It answers "who are the young people of this parish" without naming one of
 * them. Everything on it is a count, worked out on the server; nothing
 * identifying is sent to the browser at all, displayed or not.
 *
 * Built to be printed. Father is most likely to want this on paper at a
 * meeting, so it is a sheet with a masthead rather than a dashboard, and the
 * print rules below put it on one A4 page.
 */

const IST = "Asia/Kolkata";

function longDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

function Figure({ value, label }: { value: number; label: string }) {
  return (
    <div className={styles.figure}>
      <p className={styles.figureNum}>{value}</p>
      <p className={styles.figureLabel}>{label}</p>
    </div>
  );
}

function Split({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: number }[];
}) {
  return (
    <div className={styles.split}>
      <h2 className={styles.splitTitle}>{title}</h2>
      <dl className={styles.splitRows}>
        {rows.map((r) => (
          <div key={r.label} className={styles.splitRow}>
            <dt>{r.label}</dt>
            <dd>{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Bars({
  title,
  breakdown,
  empty,
}: {
  title: string;
  breakdown: Breakdown;
  empty: string;
}) {
  const { rows, other, max } = breakdown;
  const width = (count: number) => `${Math.max(2, Math.round((count / max) * 100))}%`;

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {rows.length === 0 && other === 0 ? (
        <p className={styles.none}>{empty}</p>
      ) : (
        <div className={styles.bars}>
          {rows.map((row) => (
            <div key={row.label} className={styles.barRow}>
              <p className={styles.barLabel}>{row.label}</p>
              <div className={styles.barTrack}>
                <div className={styles.barFill} style={{ width: width(row.count) }} />
              </div>
              <p className={styles.barCount}>{row.count}</p>
            </div>
          ))}
          {other > 0 ? (
            <div className={`${styles.barRow} ${styles.barOther}`}>
              <p className={styles.barLabel}>Other</p>
              <div className={styles.barTrack}>
                <div className={styles.barFillOther} style={{ width: width(other) }} />
              </div>
              <p className={styles.barCount}>{other}</p>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

export default async function CommitteeSummaryPage() {
  const user = await requireCommittee();
  const configured = isSupabaseConfigured();
  const summary = configured ? await loadSummary() : EMPTY_SUMMARY;

  return (
    <main className={styles.page}>
      <CommitteeHeader name={user.name} />

      {user.view === "all" ? (
        <div className={styles.actions} data-print-hide>
          <Link className={styles.toList} href="/committee/registrations">
            See the full list of registrations
          </Link>
        </div>
      ) : null}

      <article className={styles.sheet} aria-label="LYG registration summary">
        <header className={styles.masthead}>
          <span className={styles.logo}>
            <Logo variant="two-ink" width="46px" decorative />
          </span>
          <div>
            <p className={styles.org}>Lourdes Youth Group</p>
            <p className={styles.parish}>CTM Parish · Ahmedabad</p>
            <p className={styles.docTitle}>Registration summary</p>
          </div>
        </header>

        {!configured ? (
          <p className={styles.notice}>
            Supabase is not configured in this environment, so there is nothing to summarise.
          </p>
        ) : null}

        <section className={styles.headline}>
          <Figure value={summary.total} label="Registered" />
          <Figure value={summary.last7} label="In the last 7 days" />
        </section>

        <section className={styles.splits}>
          <Split
            title="Membership"
            rows={[
              { label: "New members", value: summary.newCount },
              { label: "Updated their details", value: summary.updatedCount },
            ]}
          />
          <Split
            title="Age"
            rows={[
              { label: "Under 18", value: summary.under18 },
              { label: "18 and over", value: summary.adults },
            ]}
          />
        </section>

        <Bars title="By area" breakdown={summary.areas} empty="No areas yet." />
        <Bars
          title="Interests and skills"
          breakdown={summary.interests}
          empty="Nobody has picked an interest yet."
        />
        <Bars
          title="Hoping for"
          breakdown={summary.purposes}
          empty="Nobody has said what they are hoping for yet."
        />

        <footer className={styles.footer}>
          <p className={styles.footNote}>
            Most recent registration: {longDate(summary.latest)}
          </p>
          <p className={styles.footNote}>
            Groups of fewer than {MIN_VISIBLE_COUNT} are counted under Other, so no one person
            can be picked out. Ages are worked out in Asia/Kolkata.
          </p>
        </footer>
      </article>
    </main>
  );
}
