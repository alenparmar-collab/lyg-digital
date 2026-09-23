import Link from "next/link";
import Logo from "@/components/Logo";
import LogoutButton from "./LogoutButton";
import DownloadPdfButton from "@/components/DownloadPdfButton";
import { requireCommittee } from "./guard";
import { getMemberForPdf } from "./actions";
import { adminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { formatIndianMobile, normalisePhone } from "@/lib/registration/validate";
import { resolveSeason } from "@/lib/season";
import styles from "./committee.module.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * What the browser is allowed to know about each registration: enough to find
 * the right one, and nothing more. Phone numbers, dates of birth and guardian
 * details stay on the server until someone opens a single record or asks for a
 * single PDF.
 */
type Row = {
  id: string;
  reference_id: string;
  full_name: string;
  area: string;
  community: string | null;
  membership_status: string;
  created_at: string;
};

const IST = "Asia/Kolkata";

function shortDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

/** Escape the characters that mean something inside a PostgREST or() filter. */
function forFilter(value: string): string {
  return value.replace(/[%,()\\]/g, " ").trim();
}

export default async function CommitteeListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const who = await requireCommittee();
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const season = resolveSeason(null);

  if (!isSupabaseConfigured()) {
    return (
      <Shell who={who}>
        <h1 className={styles.title}>LYG registrations</h1>
        <p className={styles.notice}>
          Supabase is not configured in this environment, so there is nothing to list. Set
          NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
        </p>
      </Shell>
    );
  }

  const db = adminClient();

  // The total is every registration, not the filtered count.
  const { count: total } = await db.from("members").select("id", { count: "exact", head: true });

  let select = db
    .from("members")
    .select("id, reference_id, full_name, area, community, membership_status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (query) {
    const safe = forFilter(query);
    // Search by name, phone or reference id. A phone is normalised first, so
    // "98765 43210" finds +919876543210.
    const asPhone = normalisePhone(query);
    const clauses = [`full_name.ilike.%${safe}%`, `reference_id.ilike.%${safe}%`];
    if (asPhone) clauses.push(`phone.eq.${asPhone}`);
    else if (/^\d{3,}$/.test(safe)) clauses.push(`phone.ilike.%${safe}%`);
    select = select.or(clauses.join(","));
  }

  const { data, error } = await select;
  if (error) throw error;
  const rows = (data ?? []) as Row[];

  return (
    <Shell who={who}>
      <h1 className={styles.title}>LYG registrations</h1>
      <p className={styles.count}>
        {total ?? 0} {total === 1 ? "registration" : "registrations"}
        {query ? ` · ${rows.length} matching` : ""}
      </p>

      <form className={styles.search} method="get" role="search">
        <div className={styles.searchField}>
          <label className={styles.searchLabel} htmlFor="q">
            Search by name, phone or reference
          </label>
          <input
            className={styles.searchInput}
            id="q"
            name="q"
            type="search"
            defaultValue={query}
            autoCapitalize="none"
            spellCheck={false}
          />
        </div>
        <button className={styles.searchGo} type="submit">
          Search
        </button>
        {query ? (
          <Link className={styles.clear} href="/committee">
            Clear
          </Link>
        ) : null}
      </form>

      {rows.length === 0 ? (
        <p className={styles.empty}>
          {query ? "Nothing matched that search." : "No registrations yet."}
        </p>
      ) : (
        <div className={styles.list}>
          {rows.map((row) => (
            <div key={row.id} className={styles.row}>
              <Link href={`/committee/${row.id}`} className={styles.rowMain}>
                <p className={styles.rowRef}>{row.reference_id}</p>
                <p className={styles.rowName}>{row.full_name}</p>
                <p className={styles.rowWhere}>
                  {row.community ? `${row.area} · ${row.community}` : row.area}
                </p>
              </Link>
              <div className={styles.rowMeta}>
                <p className={styles.rowDate}>{shortDate(row.created_at)}</p>
                <span
                  className={`${styles.badge} ${
                    row.membership_status === "updated" ? styles.badgeUpdated : ""
                  }`}
                >
                  {row.membership_status === "updated" ? "Updated Details" : "New Member"}
                </span>
                {/* The action is bound to this one id and checks the session
                    before it reads anything. */}
                <DownloadPdfButton
                  variant="link"
                  season={season}
                  load={getMemberForPdf.bind(null, row.id)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}

function Shell({ who, children }: { who: string; children: React.ReactNode }) {
  return (
    <main className={styles.page}>
      <div className={styles.top}>
        <Logo variant="two-ink" width="44px" className={styles.logo} decorative />
        <p className={styles.who}>{formatIndianMobile(who)}</p>
        <LogoutButton />
      </div>
      {children}
    </main>
  );
}
