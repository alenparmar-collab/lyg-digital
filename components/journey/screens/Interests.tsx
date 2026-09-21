"use client";

import ChapterHeader from "../ChapterHeader";
import { StickerPicker } from "../Choice";
import MarginNote from "@/components/MarginNote";
import StampButton from "@/components/StampButton";
import { INTERESTS } from "@/lib/registration/options";
import styles from "./Chapter.module.css";

/** No minimum. Someone who picks nothing is still a member. */
export default function Interests({
  values,
  onToggle,
  onContinue,
  quiet = false,
}: {
  values: string[];
  onToggle: (v: string) => void;
  onContinue: () => void;
  quiet?: boolean;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onContinue();
      }}
      noValidate
    >
      <ChapterHeader chapter={6} name="Interests" title="What are you into?" />

      <div className={styles.fields}>
        <StickerPicker
          legend="Pick anything that fits"
          options={INTERESTS}
          values={values}
          onToggle={onToggle}
        />
      </div>

      <MarginNote quiet={quiet} className={styles.note} rotate={2}>
        Pick as many as you like. We won&apos;t hold you to all of them.
      </MarginNote>

      <div className={styles.actions}>
        <StampButton type="submit">Continue</StampButton>
      </div>
    </form>
  );
}
