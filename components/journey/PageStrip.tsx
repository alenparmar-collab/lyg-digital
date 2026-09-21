"use client";

import Link from "next/link";
import styles from "./PageStrip.module.css";

/**
 * Fixed at the top of every numbered chapter: the page number in mono, a back
 * control that never loses answers, and a perforated line that fills with the
 * season ink. Deliberately not a stepper with circles, and deliberately
 * without "of 9": the fill carries the sense of progress, and a total that
 * changes for under-18s would only wobble.
 *
 * The visible label is just "p. 3". The progressbar role still carries the
 * real numbers, so assistive tech gets a proportion rather than a guess.
 */
export default function PageStrip({
  page,
  total,
  onBack,
  backHref,
}: {
  page: number;
  total: number;
  onBack?: () => void;
  /** Used instead of onBack on the first chapter, where back means the cover. */
  backHref?: string;
}) {
  const pct = Math.round((page / total) * 100);

  return (
    <nav className={styles.strip}>
      {backHref ? (
        <Link href={backHref} className={styles.back} aria-label="Back to the cover">
          <BackArrow />
        </Link>
      ) : (
        <button type="button" className={styles.back} onClick={onBack} aria-label="Back a page">
          <BackArrow />
        </button>
      )}

      <p className={styles.page}>p. {page}</p>

      <div
        className={styles.perf}
        role="progressbar"
        aria-label="Registration progress"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={page}
      >
        <span className={styles.perfFill} style={{ width: `${pct}%` }} aria-hidden="true" />
      </div>
    </nav>
  );
}

function BackArrow() {
  // Drawn rather than a glyph so it sits in the riso line style.
  return (
    <svg width="22" height="14" viewBox="0 0 22 14" fill="none" aria-hidden="true" focusable="false">
      <path
        d="M21 7H1.5M1.5 7 7 1.5M1.5 7 7 12.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
