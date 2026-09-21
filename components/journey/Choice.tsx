"use client";

import { useId } from "react";
import styles from "./Choice.module.css";

type Option = { value: string; label: string };

function Tick() {
  return (
    <svg width="14" height="11" viewBox="0 0 14 11" fill="none" aria-hidden="true" focusable="false">
      <path d="M1 5.5 5 9.5 13 1.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Single choice as ruled lines. Radios underneath. */
export function ChoiceList({
  legend,
  name,
  options,
  value,
  onChange,
  error,
  firstRef,
}: {
  legend: string;
  name: string;
  options: readonly Option[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  firstRef?: React.Ref<HTMLInputElement>;
}) {
  const id = useId();
  return (
    <fieldset className={styles.group} aria-describedby={error ? `${id}-err` : undefined}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.list}>
        {options.map((o, i) => {
          const on = value === o.value;
          return (
            <label key={o.value} className={`${styles.item} ${on ? styles.itemOn : ""}`}>
              <input
                ref={i === 0 ? firstRef : undefined}
                className={styles.input}
                type="radio"
                name={name}
                value={o.value}
                checked={on}
                onChange={() => onChange(o.value)}
                aria-invalid={error ? true : undefined}
              />
              <span>{o.label}</span>
              <span className={styles.mark} aria-hidden="true">{on ? <Tick /> : null}</span>
            </label>
          );
        })}
      </div>
      {error ? (
        <p className={styles.error} id={`${id}-err`} role="alert">{error}</p>
      ) : null}
    </fieldset>
  );
}

/** Multi-select stickers on a paper-deep sheet. Checkboxes underneath. */
export function StickerPicker({
  legend,
  options,
  values,
  onToggle,
  error,
}: {
  legend: string;
  options: readonly Option[];
  values: string[];
  onToggle: (value: string) => void;
  error?: string;
}) {
  const id = useId();
  return (
    <fieldset className={styles.group} aria-describedby={error ? `${id}-err` : undefined}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.sheet}>
        {options.map((o) => {
          const on = values.includes(o.value);
          // A fixed angle from the label, so it never jumps on re-render.
          const angle = ((o.value.charCodeAt(0) + o.value.length * 7) % 9) - 4;
          return (
            <label
              key={o.value}
              className={`${styles.sticker} ${on ? styles.stickerOn : ""}`}
              style={{ rotate: `${angle * 0.6}deg` }}
            >
              <input
                className={styles.input}
                type="checkbox"
                checked={on}
                onChange={() => onToggle(o.value)}
              />
              {o.label}
            </label>
          );
        })}
      </div>
      {error ? (
        <p className={styles.error} id={`${id}-err`} role="alert">{error}</p>
      ) : null}
    </fieldset>
  );
}

/** Multi-select as torn paper strips, one per line. Checkboxes underneath. */
export function StripPicker({
  legend,
  options,
  values,
  onToggle,
}: {
  legend: string;
  options: readonly Option[];
  values: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.strips}>
        {options.map((o) => {
          const on = values.includes(o.value);
          return (
            <label key={o.value} className={`${styles.strip} ${on ? styles.stripOn : ""}`}>
              <input
                className={styles.input}
                type="checkbox"
                checked={on}
                onChange={() => onToggle(o.value)}
              />
              <span className={styles.stripDot} aria-hidden="true" />
              <span>{o.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function CheckField({
  children,
  checked,
  onChange,
  error,
  inputRef,
}: {
  children: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  const id = useId();
  return (
    <div>
      <label className={styles.check}>
        <input
          ref={inputRef}
          className={styles.input}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-err` : undefined}
        />
        <span className={`${styles.mark} ${styles.checkMark}`} aria-hidden="true">
          {checked ? <Tick /> : null}
        </span>
        <span>{children}</span>
      </label>
      {error ? (
        <p className={styles.error} id={`${id}-err`} role="alert">{error}</p>
      ) : null}
    </div>
  );
}
