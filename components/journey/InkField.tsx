"use client";

import { useId } from "react";
import styles from "./InkField.module.css";

/**
 * A single line on a printed form. No box, no rounded rectangle: label in mono
 * above, the typed value on a 2px ruled line below.
 *
 * Errors are plain text next to the field, linked with aria-describedby and
 * marked role="alert" so they are announced when they appear. The field is
 * also marked aria-invalid, so the state is not carried by colour alone.
 */
export default function InkField({
  label,
  value,
  onChange,
  error,
  hint,
  prefix,
  inputRef,
  ...input
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: React.ReactNode;
  /** Printed on the line before the input, e.g. "+91". Not editable. */
  prefix?: string;
  inputRef?: React.Ref<HTMLInputElement>;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "ref">) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");

  return (
    <div className={`${styles.field} ${error ? styles.fieldInvalid : ""}`}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <div className={styles.line}>
        {prefix ? (
          <span className={styles.prefix} aria-hidden="true">
            {prefix}
          </span>
        ) : null}
        <input
          {...input}
          id={id}
          ref={inputRef}
          className={styles.input}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
        />
      </div>
      {hint ? (
        <p className={styles.hint} id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className={styles.error} id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export type DateFieldValue = { day: string; month: string; year: string };

/**
 * Date of birth as three ruled boxes rather than a native date picker. A
 * picker built for choosing next Tuesday is a poor way to reach 2009, and
 * three short lines match the printed form the flow replaces.
 */
export function DateField({
  legend,
  value,
  onChange,
  error,
  hint,
  dayRef,
}: {
  legend: string;
  value: DateFieldValue;
  onChange: (value: DateFieldValue) => void;
  error?: string;
  hint?: React.ReactNode;
  dayRef?: React.Ref<HTMLInputElement>;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");

  const digits = (raw: string, max: number) => raw.replace(/\D/g, "").slice(0, max);

  return (
    <fieldset
      className={`${styles.dateGroup} ${error ? styles.dateInvalid : ""}`}
      aria-describedby={describedBy || undefined}
    >
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.dateParts}>
        <span className={styles.datePart}>
          <label className={styles.datePartLabel} htmlFor={`${id}-d`}>
            Day
          </label>
          <input
            id={`${id}-d`}
            ref={dayRef}
            className={`${styles.dateInput} ${styles.dd}`}
            value={value.day}
            onChange={(e) => onChange({ ...value, day: digits(e.target.value, 2) })}
            inputMode="numeric"
            autoComplete="bday-day"
            enterKeyHint="next"
            aria-invalid={error ? true : undefined}
          />
        </span>
        <span className={styles.datePart}>
          <label className={styles.datePartLabel} htmlFor={`${id}-m`}>
            Month
          </label>
          <input
            id={`${id}-m`}
            className={`${styles.dateInput} ${styles.mm}`}
            value={value.month}
            onChange={(e) => onChange({ ...value, month: digits(e.target.value, 2) })}
            inputMode="numeric"
            autoComplete="bday-month"
            enterKeyHint="next"
            aria-invalid={error ? true : undefined}
          />
        </span>
        <span className={styles.datePart}>
          <label className={styles.datePartLabel} htmlFor={`${id}-y`}>
            Year
          </label>
          <input
            id={`${id}-y`}
            className={`${styles.dateInput} ${styles.yyyy}`}
            value={value.year}
            onChange={(e) => onChange({ ...value, year: digits(e.target.value, 4) })}
            inputMode="numeric"
            autoComplete="bday-year"
            enterKeyHint="done"
            aria-invalid={error ? true : undefined}
          />
        </span>
      </div>
      {hint ? (
        <p className={styles.hint} id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className={styles.error} id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
