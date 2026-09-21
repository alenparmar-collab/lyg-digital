import styles from "./Done.module.css";

/**
 * What a refresh shows. The saved row is deliberately not kept anywhere the
 * browser can read again, so after a reload there is nothing to render but the
 * fact of it. The reference id is the only thing carried across, and it opens
 * nothing.
 */
export default function DoneAfterRefresh({ referenceId }: { referenceId: string | null }) {
  return (
    <div className={styles.done}>
      <p className={styles.kicker}>Already sent</p>
      <h1 className={styles.headline}>You&apos;re registered.</h1>
      {referenceId ? (
        <div className={styles.refBlock}>
          <p className={styles.refLabel}>Your reference</p>
          <p className={styles.refValue}>{referenceId}</p>
        </div>
      ) : null}
    </div>
  );
}
