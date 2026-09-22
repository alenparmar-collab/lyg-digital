"use client";

import { useState } from "react";
import RegistrationDocument from "@/components/RegistrationDocument";
import DownloadPdfButton from "@/components/DownloadPdfButton";
import StampButton from "@/components/StampButton";
import type { SavedMember } from "@/lib/registration/member";
import type { Season } from "@/lib/season";
import { MEDIA_SECRETARY } from "@/lib/content/contacts";
import styles from "./Done.module.css";

/**
 * The completion screen. The member data here came straight back from their own
 * submission and lives only in React state: it is never written to
 * sessionStorage, localStorage or a cookie, so re-opening the page on a shared
 * phone shows nothing.
 *
 * The sheet is always in the DOM, even while the welcome half is on screen.
 * That is what the browser's own Print picks up: print hides everything marked
 * data-print-hide, so if the sheet were only mounted in the other half of this
 * ternary, Print would have nothing left to put on the page.
 */
export default function Done({
  member,
  logo,
  season,
}: {
  member: SavedMember;
  logo: React.ReactNode;
  season: Season;
}) {
  const [showDocument, setShowDocument] = useState(false);
  const firstName = member.full_name.split(" ")[0] ?? member.full_name;

  return (
    <div className={styles.done}>
      {showDocument ? (
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
        </div>
      ) : (
        <>
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
              <DownloadPdfButton member={member} season={season} />
            </div>

            <p className={styles.sendNote}>
              That&apos;s all. Your registration has reached the LYG committee. Keep the PDF for
              your own records.
            </p>
            <p className={styles.contact}>
              Questions? WhatsApp {MEDIA_SECRETARY.name}, {MEDIA_SECRETARY.role}:{" "}
              <a
                className={styles.contactLink}
                href={MEDIA_SECRETARY.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {MEDIA_SECRETARY.whatsapp}
              </a>
            </p>
          </div>

          {/* Off screen, but there for the browser's own Print. */}
          <div className={styles.documentForPrint} aria-hidden>
            <RegistrationDocument member={member} logo={logo} />
          </div>
        </>
      )}
    </div>
  );
}
