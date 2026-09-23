import Link from "next/link";
import Logo from "@/components/Logo";
import RegMarks from "@/components/RegMarks";
import StampButton from "@/components/StampButton";
import MarginNote from "@/components/MarginNote";
import { resolveSeason, seasonLabel } from "@/lib/season";
import styles from "./page.module.css";

/**
 * The cover of the zine. Scripture, the mark, one action. No navigation.
 * This is where the QR codes on the parish posters land.
 */
export default function CoverPage() {
  const season = resolveSeason(null);
  const quiet = season === "triduum";
  const year = new Date().getFullYear();

  return (
    <main className={styles.cover}>
      <RegMarks />

      <header className={styles.head}>
        {/* Big enough that the ring text reads and the season shows in the
            figures. No wordmark line beside it: the ring already says
            "Lourdes Youth Group, CTM Ahmedabad", and printing the same words
            twice is what turns a masthead into a template header bar. */}
        <Logo variant="two-ink" width="104px" className={styles.logo} />
      </header>

      <div className={styles.spread}>
        {/* The spans are laid out as a vertical spine caption, so they need an
            explicit space or the accessible name runs together. */}
        <p className={styles.scripture}>
          <span className={styles.verse}>Come and see.</span>{" "}
          <cite className={styles.ref}>John 1:39</cite>
        </p>

        <h1 className={styles.headline}>
          <span className={`${styles.word} misreg`} data-text="Come">
            Come
          </span>{" "}
          <span className={`${styles.word} ${styles.word2} misreg`} data-text="&amp; see">
            &amp; see
          </span>
        </h1>
      </div>

      <footer className={styles.foot}>
        <MarginNote quiet={quiet} className={styles.note}>
          Takes about three minutes. Less if you type fast.
        </MarginNote>

        <StampButton href="/join">Pull up a chair</StampButton>

        {/* The committee's way in, and only on this page: it never appears on
            the journey, the completion screen or the registration document.
            Below "Pull up a chair" and styled as a link rather than a button,
            so nobody arriving from a QR poster mistakes it for the way to
            register. Wrapped, because .foot > a is the primary button's rule. */}
        <div className={styles.committeeRow}>
          <Link className={styles.committee} href="/committee">
            Committee login
          </Link>
        </div>

        <p className={styles.printline}>
          Printed in {seasonLabel[season]}, {year}
        </p>
      </footer>
    </main>
  );
}
