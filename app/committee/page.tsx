import Link from "next/link";
import Logo from "@/components/Logo";
import LogoutButton from "./LogoutButton";
import { requireCommittee } from "./guard";
import { adminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { normalisePhone } from "@/lib/registration/schema";
import styles from "./committee.module.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = {
  id: string;
  reference_id: string;
  full_name: string;
  area: string;
  community: string;
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
  const email = await requireCommittee();
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  if (!isSupabaseConfigured()) {
    return (
      <Shell email={email}>
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
    <Shell email={email}>
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
            <Link key={row.id} href={`/committee/${row.id}`} className={styles.row}>
              <div>
                <p className={styles.rowRef}>{row.reference_id}</p>
                <p className={styles.rowName}>{row.full_name}</p>
                <p className={styles.rowWhere}>
                  {row.area} · {row.community}
                </p>
              </div>
              <div className={styles.rowMeta}>
                <p className={styles.rowDate}>{shortDate(row.created_at)}</p>
                <span
                  className={`${styles.badge} ${
                    row.membership_status === "updated" ? styles.badgeUpdated : ""
                  }`}
                >
                  {row.membership_status === "updated" ? "Updated Details" : "New Member"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Shell>
  );
}

function Shell({ email, children }: { email: string; children: React.ReactNode }) {
  return (
    <main className={styles.page}>
      <div className={styles.top}>
        <Logo variant="two-ink" width="44px" className={styles.logo} decorative />
        <p className={styles.who}>{email}</p>
        <LogoutButton />
      </div>
      {children}
    </main>
  );
}
