"use client";

import { useRef, useState } from "react";
import ChapterHeader from "../ChapterHeader";
import InkField, { DateField } from "../InkField";
import StampButton from "@/components/StampButton";
import {
  validateDateOfBirth,
  validateFullName,
  type DateResult,
} from "@/lib/registration/validate";
import styles from "./Chapter.module.css";

export default function Identity({
  fullName,
  dob,
  onFullName,
  onDob,
  onContinue,
}: {
  fullName: string;
  dob: { day: string; month: string; year: string };
  onFullName: (value: string) => void;
  onDob: (value: { day: string; month: string; year: string }) => void;
  onContinue: (result: DateResult) => void;
}) {
  const [nameError, setNameError] = useState<string>();
  const [dobError, setDobError] = useState<string>();
  const [confirmAge, setConfirmAge] = useState<number>();
  const nameRef = useRef<HTMLInputElement>(null);
  const dayRef = useRef<HTMLInputElement>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = validateFullName(fullName);
    const d = validateDateOfBirth(dob);
    setNameError(n);
    setDobError(d.error);
    setConfirmAge(d.confirmAge);

    if (n) {
      nameRef.current?.focus();
      return;
    }
    if (d.error) {
      dayRef.current?.focus();
      return;
    }
    onContinue(d);
  }

  return (
    <form onSubmit={submit} noValidate>
      <ChapterHeader
        chapter={2}
        name="Identity"
        title="Start with your name"
      />

      <div className={styles.fields}>
        <InkField
          label="Full name"
          value={fullName}
          onChange={(v) => {
            setNameError(undefined);
            onFullName(v);
          }}
          error={nameError}
          inputRef={nameRef}
          type="text"
          autoComplete="name"
          autoCapitalize="words"
          enterKeyHint="next"
          placeholder="Rhea Fernandes"
        />

        <div>
          <DateField
            legend="Date of birth"
            value={dob}
            onChange={(v) => {
              setDobError(undefined);
              setConfirmAge(undefined);
              onDob(v);
            }}
            error={dobError}
            hint="We ask because anyone under 18 needs a parent or guardian to add their details too."
            dayRef={dayRef}
          />
          {confirmAge !== undefined && !dobError ? (
            <p className={styles.confirm} style={{ marginTop: "var(--s-4)" }}>
              That makes you {confirmAge}. If that is right, carry on.
            </p>
          ) : null}
        </div>
      </div>

      <div className={styles.actions}>
        <StampButton type="submit">Continue</StampButton>
      </div>
    </form>
  );
}
