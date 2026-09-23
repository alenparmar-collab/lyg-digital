import { notFound } from "next/navigation";
import Logo from "@/components/Logo";
import RegistrationDocument from "@/components/RegistrationDocument";
import DownloadPdfButton from "@/components/DownloadPdfButton";
import CommitteeHeader from "../CommitteeHeader";
import { requireFullAccess } from "../guard";
import { adminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { SAVED_MEMBER_COLUMNS, type SavedMember } from "@/lib/registration/member";
import { resolveSeason } from "@/lib/season";
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
  const user = await requireFullAccess();
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
  const season = resolveSeason(null);

  return (
    <main className={styles.page}>
      <CommitteeHeader
        name={user.name}
        back={{ href: "/committee/registrations", label: "Back to all registrations" }}
      />

      <RegistrationDocument
        member={member}
        logo={<Logo variant="two-ink" width="64px" decorative />}
      />

      <div className={styles.docActions} data-print-hide>
        <DownloadPdfButton member={member} season={season} />
      </div>
    </main>
  );
}
