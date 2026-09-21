import Logo from "@/components/Logo";
import RegMarks from "@/components/RegMarks";
import LoginForm from "./LoginForm";
import styles from "./login.module.css";

export const dynamic = "force-dynamic";

export default async function CommitteeLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string; unconfigured?: string }>;
}) {
  const { denied, unconfigured } = await searchParams;

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

      {unconfigured === "1" ? (
        <p className={styles.error} role="alert">
          Sign in is unavailable: this deployment has no Supabase configuration yet.
        </p>
      ) : (
        <LoginForm denied={denied === "1"} />
      )}

      <p className={styles.note}>
        Committee accounts are created by the parish in Supabase. There is no sign-up.
      </p>
    </main>
  );
}
