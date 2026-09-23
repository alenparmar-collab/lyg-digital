"use client";

import { useRef, useState, useTransition } from "react";
import ChapterHeader from "../ChapterHeader";
import InkField, { DateField } from "../InkField";
import StampButton from "@/components/StampButton";
import { verifyMember } from "@/app/actions/registration";
import { validateDateOfBirth, validatePhone } from "@/lib/registration/validate";
import styles from "./Chapter.module.css";

/**
 * Returning members prove who they are with the mobile number and date of
 * birth on file, checked on the server. A match returns nothing but "yes":
 * no details come back, so this is not a way to read anybody's record.
 */
export default function Verify({
  phone,
  dob,
  onPhone,
  onDob,
  onVerified,
  onRegisterInstead,
}: {
  phone: string;
  dob: { day: string; month: string; year: string };
  onPhone: (v: string) => void;
  onDob: (v: { day: string; month: string; year: string }) => void;
  onVerified: () => void;
  onRegisterInstead: () => void;
}) {
  const [phoneError, setPhoneError] = useState<string>();
  const [dobError, setDobError] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [pending, startTransition] = useTransition();
  const phoneRef = useRef<HTMLInputElement>(null);
  const dayRef = useRef<HTMLInputElement>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(undefined);

    const p = validatePhone(phone);
    const d = validateDateOfBirth(dob);
    setPhoneError(p);
    setDobError(d.error);
    if (p) { phoneRef.current?.focus(); return; }
    if (d.error || !d.iso) {
      // validateDateOfBirth always sets one or the other, but if that ever
      // stopped being true this would refuse to advance with nothing on
      // screen, which is the one thing a form must never do.
      if (!d.error) setDobError("We need a valid date of birth.");
      dayRef.current?.focus();
      return;
    }

    const iso = d.iso;
    startTransition(async () => {
      try {
        const result = await verifyMember(phone, iso);
        if (result.ok) onVerified();
        else setMessage(result.message);
      } catch {
        setMessage("Something went wrong at our end. Please try again in a moment.");
      }
    });
  }

  return (
    <form onSubmit={submit} noValidate>
      <ChapterHeader
        chapter={1}
        name="Welcome back"
        title="Let's check it's you"
        lead="The mobile number and date of birth we have on file. We'll ask for the rest again on the next pages."
      />

      <div className={styles.fields}>
        <InkField
          label="Mobile, on WhatsApp"
          value={phone}
          onChange={(v) => { setPhoneError(undefined); onPhone(v); }}
          error={phoneError}
          inputRef={phoneRef}
          prefix="+91"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          enterKeyHint="next"
          placeholder="98765 43210"
        />

        <DateField
          legend="Date of birth"
          value={dob}
          onChange={(v) => { setDobError(undefined); onDob(v); }}
          error={dobError}
          dayRef={dayRef}
        />
      </div>

      <div className={styles.actions}>
        {message ? (
          <div role="alert">
            <p className={styles.notice}>{message}</p>
            <button type="button" className={styles.plainLink} onClick={onRegisterInstead}>
              Register as a new member instead
            </button>
          </div>
        ) : null}
        <StampButton type="submit" disabled={pending}>
          {pending ? "Checking…" : "Check my details"}
        </StampButton>
      </div>
    </form>
  );
}
