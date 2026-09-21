"use client";

import { useRef, useState } from "react";
import ChapterHeader from "../ChapterHeader";
import StampButton from "@/components/StampButton";
import type { RegistrationPath } from "@/lib/registration/draft";
import styles from "./Welcome.module.css";

const PATHS: { value: RegistrationPath; num: string; eyebrow: string; title: string }[] = [
  { value: "new", num: "01", eyebrow: "New to LYG?", title: "Join Lourdes Youth Group" },
  { value: "update", num: "02", eyebrow: "Already part of LYG?", title: "Update your details" },
];

export default function Welcome({
  path,
  onChange,
  onContinue,
}: {
  path: RegistrationPath | null;
  onChange: (path: RegistrationPath) => void;
  onContinue: () => void;
}) {
  const [error, setError] = useState<string>();
  const firstRadio = useRef<HTMLInputElement>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!path) {
      // Not a disabled button: a member who taps and gets nothing has no idea
      // why. Say what is missing and put the cursor where it is missing.
      setError("Pick one of the two lines above so we know where to take you.");
      firstRadio.current?.focus();
      return;
    }
    setError(undefined);
    onContinue();
  }

  return (
    <form onSubmit={submit} noValidate>
      <ChapterHeader
        chapter={1}
        name="Welcome"
        title="Two ways in"
        lead="This is where you join Lourdes Youth Group at CTM Parish, or update the details we already have. It takes about three minutes."
      />

      <fieldset className={styles.coupon}>
        <legend className="visually-hidden">
          Are you new to LYG, or updating details we already have?
        </legend>

        {PATHS.map((option, i) => {
          const selected = path === option.value;
          return (
            <label
              key={option.value}
              className={`${styles.row} ${selected ? styles.rowOn : ""}`}
            >
              <input
                ref={i === 0 ? firstRadio : undefined}
                className={styles.radio}
                type="radio"
                name="registration-path"
                value={option.value}
                checked={selected}
                onChange={() => {
                  setError(undefined);
                  onChange(option.value);
                }}
              />
              <span className={styles.num} aria-hidden="true">
                {option.num}
              </span>
              <span className={styles.body}>
                <span className={styles.eyebrow}>{option.eyebrow}</span>
                <span
                  className={`${styles.rowTitle} ${selected ? "misreg" : ""}`}
                  data-text={option.title}
                >
                  {option.title}
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>

      <div className={styles.actions}>
        {error ? (
          <p className={styles.formError} role="alert">
            {error}
          </p>
        ) : null}
        <StampButton type="submit">Continue</StampButton>
      </div>
    </form>
  );
}
