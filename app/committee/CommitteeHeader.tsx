import Link from "next/link";
import Logo from "@/components/Logo";
import LogoutButton from "./LogoutButton";
import styles from "./committee.module.css";

/**
 * The bar across the top of every committee page: who is signed in, and the
 * way out. Marked data-print-hide, because the summary sheet carries its own
 * masthead and nobody wants a sign-out button on a printed page.
 */
export default function CommitteeHeader({
  name,
  back,
}: {
  name: string;
  /** Where the "back" link goes, when this page is not the summary. */
  back?: { href: string; label: string };
}) {
  return (
    <div data-print-hide>
      <div className={styles.top}>
        <Logo variant="two-ink" width="44px" className={styles.logo} decorative />
        <p className={styles.who}>{name}</p>
        <LogoutButton />
      </div>
      {back ? (
        <Link className={styles.back} href={back.href}>
          {back.label}
        </Link>
      ) : null}
    </div>
  );
}
