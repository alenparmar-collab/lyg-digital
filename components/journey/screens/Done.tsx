"use client";

import { useState } from "react";
import RegistrationDocument from "@/components/RegistrationDocument";
import PrintButton from "@/components/PrintButton";
import StampButton from "@/components/StampButton";
import type { SavedMember } from "@/lib/registration/member";
import { MEDIA_SECRETARY } from "@/lib/content/contacts";
import styles from "./Done.module.css";

/**
 * The completion screen. The member data here came straight back from their own
 * submission and lives only in React state: it is never written to
 * sessionStorage, localStorage or a cookie, so re-opening the page on a shared
 * phone shows nothing.
 */
export default function Done({
  member,
  logo,
}: {
  member: SavedMember;
  logo: React.ReactNode;
}) {
  const [showDocument, setShowDocument] = useState(false);
  const firstName = member.full_name.split(" ")[0] ?? member.full_name;

  return (
    <div className={styles.done}>
      {!showDocument ? (
        <div data-print-hide>
          <p className={styles.kicker}>{firstName}, that&apos;s it</p>
          <h1 className={`${styles.headline} misreg`} data-text="You're in.">
            You&apos;re in.
          </h1>

          <p className={styles.welcome}>Welcome to Lourdes Youth Group.</p>

          <div className={styles.refBlock}>
            <p className={styles.refLabel}>Your reference</p>
            <p className={styles.refValue}>{member.reference_id}</p>
          </div>

          <div className={styles.actions}>
            <StampButton type="button" onClick={() => setShowDocument(true)}>
              View registration
            </StampButton>
            <PrintButton />
          </div>

          <p className={styles.sendNote}>
            Save it as a PDF and send it to the LYG media secretary on WhatsApp.
          </p>
          <p className={styles.contact}>
            {MEDIA_SECRETARY.role}: {MEDIA_SECRETARY.name} · {MEDIA_SECRETARY.whatsapp}
          </p>
        </div>
      ) : (
        <div className={styles.documentWrap}>
          <button
            type="button"
            className={styles.docBack}
            onClick={() => setShowDocument(false)}
            data-print-hide
          >
            Back to the welcome
          </button>
          <RegistrationDocument member={member} logo={logo} />
          <div className={styles.actions} data-print-hide>
            <PrintButton />
          </div>
        </div>
      )}
    </div>
  );
}
