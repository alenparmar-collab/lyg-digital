"use client";

import { useState } from "react";
import StampButton from "./StampButton";
import type { SavedMember } from "@/lib/registration/member";
import type { Season } from "@/lib/season";
import styles from "./DownloadPdfButton.module.css";

/**
 * Builds the registration PDF in the browser and hands it to the member.
 *
 * @react-pdf/renderer and the document component are imported only when the
 * button is pressed, so nobody downloads a PDF engine just for reading a page.
 *
 * Two ways to get the record. The completion screen already has it in memory
 * and passes it straight in. The committee list has only an id, so it passes a
 * server action instead, and that action checks the committee session before it
 * reads anything: a member record never travels to the browser until someone
 * has asked for that one record.
 */

type Props = {
  season: Season;
  label?: string;
  variant?: "stamp" | "link";
} & (
  | { member: SavedMember; load?: never }
  | { member?: never; load: () => Promise<SavedMember | null> }
);

/**
 * iOS Safari will not save a blob through a download link, so the PDF is opened
 * in a tab instead, where it can be shared or saved. The tab has to be opened
 * inside the click itself, before any await, or it is treated as a popup.
 */
function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export default function DownloadPdfButton({
  season,
  member,
  load,
  label = "Download PDF",
  variant = "stamp",
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function run() {
    if (busy) return;
    setBusy(true);
    setError(undefined);

    const tab = isIOS() ? window.open("", "_blank") : null;

    try {
      const [{ pdf }, pdfModule, logoSvg, record] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./pdf/RegistrationPdf"),
        fetch("/brand/lyg-logo-two-ink.svg").then((r) => {
          if (!r.ok) throw new Error("logo");
          return r.text();
        }),
        member ? Promise.resolve(member) : load(),
      ]);

      if (!record) throw new Error("no record");

      const { default: RegistrationPdf, pdfFileName, registerPdfFonts } = pdfModule;
      const { parseLogoSvg } = await import("@/lib/pdf/logo");

      registerPdfFonts("/fonts");
      const blob = await pdf(
        <RegistrationPdf member={record} logo={parseLogoSvg(logoSvg)} season={season} />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const name = pdfFileName(record);

      if (tab) {
        tab.location.href = url;
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }

      // Long enough for the tab or the download to take hold.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      tab?.close();
      setError("We could not make the PDF just then. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const text = busy ? "Making the PDF…" : label;

  if (variant === "link") {
    return (
      <span className={styles.linkWrap}>
        <button type="button" className={styles.link} onClick={run} disabled={busy}>
          {text}
        </button>
        {error ? (
          <span className={styles.linkError} role="alert">
            {error}
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <span className={styles.wrap}>
      <StampButton type="button" onClick={run} disabled={busy}>
        {text}
      </StampButton>
      {error ? (
        <span className={styles.error} role="alert">
          {error}
        </span>
      ) : null}
    </span>
  );
}
