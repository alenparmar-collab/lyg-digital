"use client";

import ChapterHeader from "../ChapterHeader";
import { StripPicker } from "../Choice";
import StampButton from "@/components/StampButton";
import { PURPOSE } from "@/lib/registration/options";
import styles from "./Chapter.module.css";

/**
 * An honest question, not a faith test. There is no minimum, no "right"
 * combination, and "Not sure yet" sits in the list like any other answer.
 */
export default function Purpose({
  values,
  onToggle,
  onContinue,
}: {
  values: string[];
  onToggle: (v: string) => void;
  onContinue: () => void;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onContinue();
      }}
      noValidate
    >
      <ChapterHeader
        chapter={7}
        name="Purpose"
        title="What are you hoping for?"
        lead="Whatever you tick here, nobody checks up on it. Not sure yet is honestly fine."
      />

      <div className={styles.fields}>
        <StripPicker
          legend="Anything that sounds like you"
          options={PURPOSE}
          values={values}
          onToggle={onToggle}
        />
      </div>

      <div className={styles.actions}>
        <StampButton type="submit">Continue</StampButton>
      </div>
    </form>
  );
}
