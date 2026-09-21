import styles from "./ChapterHeader.module.css";

export default function ChapterHeader({
  chapter,
  name,
  title,
  lead,
  id,
}: {
  /** Chapter number, e.g. 2 renders "Ch. 02". */
  chapter: number;
  /** The chapter's name, shown after the number. */
  name: string;
  title: string;
  lead?: React.ReactNode;
  id?: string;
}) {
  const padded = String(chapter).padStart(2, "0");

  return (
    <header className={styles.header}>
      <span className={styles.numeral} aria-hidden="true">
        {padded}
      </span>
      <p className={styles.label}>
        Ch. {padded} · {name}
      </p>
      <h1 className={styles.title} id={id}>
        {title}
      </h1>
      {lead ? <p className={styles.lead}>{lead}</p> : null}
    </header>
  );
}
