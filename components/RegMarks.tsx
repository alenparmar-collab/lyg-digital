/**
 * Registration marks in the page corners: the crosshair circles a printer uses
 * to line up plates. They are also a quiet cross, and they are the signature
 * mark of the system. Decorative, so hidden from assistive tech.
 */
import styles from "./RegMarks.module.css";

export default function RegMarks() {
  return (
    <div className={styles.marks} aria-hidden="true">
      <span className="reg-mark" />
      <span className="reg-mark" />
      <span className="reg-mark" />
      <span className="reg-mark" />
    </div>
  );
}
