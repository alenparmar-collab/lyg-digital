import Logo from "@/components/Logo";
import RegMarks from "@/components/RegMarks";
import LoginForm from "./LoginForm";
import { isCommitteeConfigured } from "@/lib/committee/config";
import styles from "./login.module.css";

export const dynamic = "force-dynamic";

export default async function CommitteeLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ unconfigured?: string }>;
}) {
  const { unconfigured } = await searchParams;

  // Checked here as well as in the query string, so a deployment missing its
  // variables shows the same thing however someone arrived at this page.
  const configured = isCommitteeConfigured() && unconfigured !== "1";

  return (
    <main className={styles.page}>
      <RegMarks />
      <div className={styles.head}>
        <Logo variant="two-ink" width="72px" className={styles.logo} />
        <div>
          <p className={styles.sub}>Lourdes Youth Group · CTM Parish</p>
          <h1 className={styles.title}>Committee sign in</h1>
        </div>
      </div>

      {configured ? (
        <>
          <LoginForm />
          <p className={styles.note}>
            One login, for the committee member who manages registrations.
          </p>
        </>
      ) : (
        <p className={styles.error} role="alert">
          Committee access isn&apos;t configured.
        </p>
      )}
    </main>
  );
}
