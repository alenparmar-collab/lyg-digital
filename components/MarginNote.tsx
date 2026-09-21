import styles from "./MarginNote.module.css";

/**
 * One per screen at most. Hidden during the Triduum, when the jokes stop.
 * aria-hidden because handwriting at a rotation is not for everyone to read,
 * and nothing here is needed to complete a chapter.
 */
export default function MarginNote({
  children,
  quiet = false,
  className,
  rotate = -2,
}: {
  children: React.ReactNode;
  quiet?: boolean;
  className?: string;
  rotate?: number;
}) {
  if (quiet) return null;
  return (
    <p
      className={[styles.note, className].filter(Boolean).join(" ")}
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden="true"
    >
      {children}
    </p>
  );
}
