"use client";

import { useRef, useState } from "react";
import ChapterHeader from "../ChapterHeader";
import { CheckField } from "../Choice";
import StampButton from "@/components/StampButton";
import { DATA_NOTE, POINTS } from "@/lib/content/guidelines";
import chapter from "./Chapter.module.css";
import styles from "./Guidelines.module.css";

export default function Guidelines({
  accepted,
  onAccepted,
  onContinue,
}: {
  accepted: boolean;
  onAccepted: (v: boolean) => void;
  onContinue: () => void;
}) {
  const [error, setError] = useState<string>();
  const ref = useRef<HTMLInputElement>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!accepted) {
      setError("Please read and accept the guidelines to finish.");
      ref.current?.focus();
      return;
    }
    onContinue();
  }

  return (
    <form onSubmit={submit} noValidate>
      <ChapterHeader chapter={9} name="The small print" title="Worth actually reading" />

      <ol className={styles.points}>
        {POINTS.map((point) => (
          <li key={point} className={styles.point}>
            <span>{point}</span>
          </li>
        ))}
      </ol>

      <section className={styles.dataNote} aria-labelledby="data-note-title">
        <h2 className={styles.dataNoteTitle} id="data-note-title">
          What we do with your details
        </h2>
        {DATA_NOTE.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </section>

      <div className={styles.accept}>
        <CheckField checked={accepted} onChange={(v) => { setError(undefined); onAccepted(v); }} error={error} inputRef={ref}>
          I have read and understood the LYG guidelines.
        </CheckField>
      </div>

      <div className={chapter.actions}>
        <StampButton type="submit">Continue</StampButton>
      </div>
    </form>
  );
}
