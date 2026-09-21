import ChapterHeader from "./ChapterHeader";
import styles from "./NotBuiltYet.module.css";

/**
 * A stub, marked as a stub. It exists so the chapters that ARE built can be
 * walked end to end, and it is styled to be impossible to mistake for
 * finished work.
 */
export default function NotBuiltYet({
  chapter,
  name,
  what,
}: {
  chapter: number;
  name: string;
  what: string;
}) {
  return (
    <div>
      <ChapterHeader chapter={chapter} name={name} title="Not built yet" />
      <div className={styles.panel}>
        <p className={styles.tag}>Placeholder · not implemented</p>
        <p className={styles.text}>{what}</p>
        <p className={styles.text}>
          The answers you have given so far are kept. Use back to change them.
        </p>
      </div>
    </div>
  );
}
