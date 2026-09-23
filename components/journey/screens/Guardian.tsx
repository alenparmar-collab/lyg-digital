"use client";

import { useRef, useState } from "react";
import ChapterHeader from "../ChapterHeader";
import InkField from "../InkField";
import { CheckField } from "../Choice";
import StampButton from "@/components/StampButton";
import { normalisePhone, validatePhone } from "@/lib/registration/validate";
import styles from "./Chapter.module.css";

/**
 * Only shown to members under 18. The server enforces the same rule regardless
 * of whether this screen appeared, so skipping it changes nothing.
 *
 * No jokes on this screen: safeguarding and consent are not where humour goes.
 */
export default function Guardian({
  name,
  phone,
  consent,
  onName,
  onPhone,
  onConsent,
  onContinue,
}: {
  name: string;
  phone: string;
  consent: boolean;
  onName: (v: string) => void;
  onPhone: (v: string) => void;
  onConsent: (v: boolean) => void;
  onContinue: () => void;
}) {
  const [nameError, setNameError] = useState<string>();
  const [phoneError, setPhoneError] = useState<string>();
  const [consentError, setConsentError] = useState<string>();
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);

  /** Put the tidied number back in the field, as CONNECTION does. */
  function tidyPhone() {
    const e164 = normalisePhone(phone);
    if (!e164) return;
    const tidy = e164.replace(/^\+91/, "");
    if (tidy !== phone) onPhone(tidy);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setNameError("We need your parent or guardian's name.");
      nameRef.current?.focus();
      return;
    }
    const p = validatePhone(phone);
    if (p) {
      setPhoneError(p);
      phoneRef.current?.focus();
      return;
    }
    tidyPhone();
    if (!consent) {
      setConsentError("We need your parent or guardian to agree before we can register you.");
      consentRef.current?.focus();
      return;
    }
    onContinue();
  }

  return (
    <form onSubmit={submit} noValidate>
      <ChapterHeader
        chapter={8}
        name="Guardian"
        title="A grown-up's turn"
        lead="You're under 18, so we need a parent or guardian's details and their agreement. Please hand them the phone for this page."
      />

      <div className={styles.fields}>
        <InkField
          label="Parent or guardian's name"
          value={name}
          onChange={(v) => {
            setNameError(undefined);
            onName(v);
          }}
          error={nameError}
          inputRef={nameRef}
          type="text"
          autoCapitalize="words"
          enterKeyHint="next"
        />

        <InkField
          label="Their mobile number"
          value={phone}
          onChange={(v) => {
            setPhoneError(undefined);
            onPhone(v);
          }}
          onBlur={tidyPhone}
          error={phoneError}
          inputRef={phoneRef}
          prefix="+91"
          type="tel"
          inputMode="tel"
          autoComplete="off"
          enterKeyHint="done"
          placeholder="98765 43210"
        />

        <CheckField
          checked={consent}
          onChange={(v) => {
            setConsentError(undefined);
            onConsent(v);
          }}
          error={consentError}
          inputRef={consentRef}
        >
          I am this person&apos;s parent or guardian, and I agree to them joining Lourdes Youth
          Group and to LYG holding the details on this form.
        </CheckField>
      </div>

      <div className={styles.actions}>
        <StampButton type="submit">Continue</StampButton>
      </div>
    </form>
  );
}
