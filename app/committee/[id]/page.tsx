import Link from "next/link";
import { notFound } from "next/navigation";
import Logo from "@/components/Logo";
import RegistrationDocument from "@/components/RegistrationDocument";
import PrintButton from "@/components/PrintButton";
import LogoutButton from "../LogoutButton";
import { requireCommittee } from "../guard";
import { adminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { SAVED_MEMBER_COLUMNS, type SavedMember } from "@/lib/registration/member";
import styles from "../committee.module.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * One registration, by internal UUID. Committee only: the guard runs before
 * any data is read, and the id is never exposed on a public page.
 */
export default async function CommitteeRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const email = await requireCommittee();
  const { id } = await params;

  if (!UUID.test(id)) notFound();
  if (!isSupabaseConfigured()) notFound();

  const { data, error } = await adminClient()
    .from("members")
    .select(SAVED_MEMBER_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) notFound();

  const member = data as unknown as SavedMember;

  return (
    <main className={styles.page}>
      <div className={styles.top} data-print-hide>
        <Logo variant="two-ink" width="44px" className={styles.logo} decorative />
        <p className={styles.who}>{email}</p>
        <LogoutButton />
      </div>

      <div data-print-hide>
        <Link className={styles.back} href="/committee">
          Back to all registrations
        </Link>
      </div>

      <RegistrationDocument
        member={member}
        logo={<Logo variant="two-ink" width="64px" decorative />}
      />

      <div className={styles.docActions} data-print-hide>
        <PrintButton>Print / save PDF</PrintButton>
      </div>
    </main>
  );
}
