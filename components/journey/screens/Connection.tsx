"use client";

import { useRef, useState, useTransition } from "react";
import ChapterHeader from "../ChapterHeader";
import InkField from "../InkField";
import MarginNote from "@/components/MarginNote";
import StampButton from "@/components/StampButton";
import { checkExistingMember } from "@/app/actions/registration";
import {
  formatIndianMobile,
  normalisePhone,
  validateEmail,
  validatePhone,
} from "@/lib/registration/validate";
import styles from "./Chapter.module.css";

export default function Connection({
  phone,
  email,
  onPhone,
  onEmail,
  onContinue,
  quiet = false,
  lockedPhone = false,
  checkExisting = false,
  dobIso,
  onAlreadyRegistered,
  onMissingDob,
}: {
  phone: string;
  email: string;
  onPhone: (value: string) => void;
  onEmail: (value: string) => void;
  onContinue: () => void;
  quiet?: boolean;
  /** Update path: the mobile number came from verification and is fixed. */
  lockedPhone?: boolean;
  /** New path only: ask the server whether this person is already on file. */
  checkExisting?: boolean;
  /** The date of birth captured on IDENTITY, as stored. */
  dobIso?: string;
  /** Switch to the update path, carrying the number and date of birth over. */
  onAlreadyRegistered?: () => void;
  /** Send them back to IDENTITY rather than guessing at a missing date. */
  onMissingDob?: () => void;
}) {
  const [phoneError, setPhoneError] = useState<string>();
  const [emailError, setEmailError] = useState<string>();
  /** Set when the server says this phone and date of birth are already on file. */
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  /** Anything else the server wants to say: the rate limit, mostly. */
  const [notice, setNotice] = useState<string>();
  const [pending, startTransition] = useTransition();
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  /**
   * Put the tidied number back in the field, so what someone sees is what we
   * will store. 07567659834, 075676 59834 and 91 75676 59834 all become
   * 75676 59834 under the printed +91.
   */
  function tidyPhone() {
    if (lockedPhone) return;
    const e164 = normalisePhone(phone);
    if (!e164) return;
    const tidy = e164.replace(/^\+91/, "");
    if (tidy !== phone) onPhone(tidy);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setNotice(undefined);

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

    tidyPhone();

    // The update path has already verified who this is, so there is nothing
    // to check.
    if (!checkExisting) {
      onContinue();
      return;
    }

    // By now we hold the pair the unique constraint uses. Without a date of
    // birth there is nothing to check, so go back and ask rather than guess.
    if (!dobIso) {
      onMissingDob?.();
      return;
    }

    startTransition(async () => {
      try {
        const result = await checkExistingMember(phone, dobIso);
        if (result.status === "exists") {
          setAlreadyRegistered(true);
          return;
        }
        if (result.status === "not-found") {
          onContinue();
          return;
        }
        setNotice(result.message);
      } catch {
        setNotice("Something went wrong at our end. Please try again in a moment.");
      }
    });
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
            <span className={styles.lockedValue}>{formatIndianMobile(phone)}</span>
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
              // Correcting the number is how someone recovers from a mistyped
              // one, so the block clears as soon as they start editing.
              setAlreadyRegistered(false);
              setNotice(undefined);
              onPhone(v);
            }}
            onBlur={tidyPhone}
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
        {alreadyRegistered ? (
          <div role="alert">
            <p className={styles.noticeInfo}>
              You&apos;re already registered with LYG. Changes are made through
              &ldquo;Update your details&rdquo; rather than by registering again.
            </p>
            <div className={styles.noticeAction}>
              <StampButton type="button" onClick={() => onAlreadyRegistered?.()}>
                Update your details
              </StampButton>
            </div>
            <p className={styles.noticeAside}>
              Mistyped the number? Correct it above and tap Continue again.
            </p>
          </div>
        ) : null}

        {notice ? (
          <div role="alert">
            <p className={styles.notice}>{notice}</p>
          </div>
        ) : null}

        {alreadyRegistered ? null : (
          <StampButton type="submit" disabled={pending}>
            {pending ? "Checking…" : "Continue"}
          </StampButton>
        )}
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
