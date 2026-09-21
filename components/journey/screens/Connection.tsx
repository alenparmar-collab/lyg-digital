"use client";

import { useRef, useState } from "react";
import ChapterHeader from "../ChapterHeader";
import InkField from "../InkField";
import MarginNote from "@/components/MarginNote";
import StampButton from "@/components/StampButton";
import { validateEmail, validatePhone } from "@/lib/registration/validate";
import styles from "./Chapter.module.css";

export default function Connection({
  phone,
  email,
  onPhone,
  onEmail,
  onContinue,
  quiet = false,
  lockedPhone = false,
}: {
  phone: string;
  email: string;
  onPhone: (value: string) => void;
  onEmail: (value: string) => void;
  onContinue: () => void;
  quiet?: boolean;
  /** Update path: the mobile number came from verification and is fixed. */
  lockedPhone?: boolean;
}) {
  const [phoneError, setPhoneError] = useState<string>();
  const [emailError, setEmailError] = useState<string>();
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = lockedPhone ? undefined : validatePhone(phone);
    const em = validateEmail(email);
    setPhoneError(p);
    setEmailError(em);

    if (p) {
      phoneRef.current?.focus();
      return;
    }
    if (em) {
      emailRef.current?.focus();
      return;
    }
    onContinue();
  }

  return (
    <form onSubmit={submit} noValidate>
      <ChapterHeader
        chapter={3}
        name="Connection"
        title="How do we reach you?"
      />

      <div className={styles.fields}>
        {lockedPhone ? (
          <div className={styles.locked}>
            <span className={styles.lockedLabel}>Mobile, on WhatsApp</span>
            <span className={styles.lockedValue}>
              +91 {phone.replace(/\D/g, "").slice(-10)}
            </span>
            <p className={styles.lockedNote}>
              This is the number you verified with. To change it, speak to the LYG committee.
            </p>
          </div>
        ) : (
        <InkField
          label="Mobile, on WhatsApp"
          value={phone}
          onChange={(v) => {
            setPhoneError(undefined);
            onPhone(v);
          }}
          error={phoneError}
          inputRef={phoneRef}
          prefix="+91"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          enterKeyHint="next"
          placeholder="98765 43210"
        />
        )}

        <Ripple />

        <InkField
          label="Email, if you use one"
          value={email}
          onChange={(v) => {
            setEmailError(undefined);
            onEmail(v);
          }}
          error={emailError}
          inputRef={emailRef}
          hint="Leave this empty if you would rather not. The mobile number is enough."
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="done"
          placeholder="you@example.com"
        />
      </div>

      <MarginNote quiet={quiet} className={styles.note} rotate={-1.5}>
        We will not add you to seventeen WhatsApp groups. Two, maybe.
      </MarginNote>

      <div className={styles.actions}>
        <StampButton type="submit">Continue</StampButton>
      </div>
    </form>
  );
}

/** Water ripple lines as a divider: the required line above, the optional
 *  one below, without drawing a box around either. */
function Ripple() {
  return (
    <svg className={styles.ripple} viewBox="0 0 320 12" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path
        d="M0 6c13-6 27-6 40 0s27 6 40 0 27-6 40 0 27 6 40 0 27-6 40 0 27 6 40 0 27-6 40 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
