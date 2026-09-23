"use client";

import { useEffect, useRef, useState } from "react";
import RegMarks from "@/components/RegMarks";
import PageStrip from "./PageStrip";
import Welcome from "./screens/Welcome";
import Verify from "./screens/Verify";
import Identity from "./screens/Identity";
import Connection from "./screens/Connection";
import Community from "./screens/Community";
import Life from "./screens/Life";
import Interests from "./screens/Interests";
import Purpose from "./screens/Purpose";
import Guardian from "./screens/Guardian";
import Guidelines from "./screens/Guidelines";
import Review from "./screens/Review";
import Done from "./screens/Done";
import DoneAfterRefresh from "./screens/DoneAfterRefresh";
import {
  clearDraft,
  emptyDraft,
  readDraft,
  writeDraft,
  type Draft,
  type RegistrationPath,
} from "@/lib/registration/draft";
import type { SavedMember } from "@/lib/registration/member";
import { GUARDIAN_AGE } from "@/lib/registration/constants";
import { validateDateOfBirth } from "@/lib/registration/validate";
import type { Season } from "@/lib/season";
import styles from "./JourneyShell.module.css";

type Chapter =
  | "welcome"
  | "verify"
  | "identity"
  | "connection"
  | "community"
  | "life"
  | "interests"
  | "purpose"
  | "guardian"
  | "guidelines"
  | "review"
  | "done";

/** Chapters that carry a page number, in order. */
const PAGE_ORDER: Chapter[] = [
  "welcome",
  "identity",
  "connection",
  "community",
  "life",
  "interests",
  "purpose",
  "guardian",
  "guidelines",
  "review",
];

/**
 * The reference id survives a refresh; nothing else does. It is not member
 * data and, by design, it cannot retrieve anything, so keeping it is what lets
 * the page still say "You're registered" and show it after a reload.
 */
const REF_KEY = "lyg:last-reference";

export default function JourneyShell({
  logo,
  season,
  quiet = false,
}: {
  /** The two-ink mark for the registration document, rendered on the server. */
  logo: React.ReactNode;
  /** Today's liturgical season, resolved on the server so the PDF matches the page. */
  season: Season;
  quiet?: boolean;
}) {
  const [chapter, setChapter] = useState<Chapter>("welcome");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [member, setMember] = useState<SavedMember | null>(null);
  const [lastReference, setLastReference] = useState<string | null>(null);
  const [goingBack, setGoingBack] = useState(false);
  const draftLoaded = useRef(false);
  const focusedChapter = useRef<Chapter | null>(null);
  const screenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft(readDraft());
    try {
      setLastReference(sessionStorage.getItem(REF_KEY));
    } catch {
      // Ignore: the page simply shows no reference.
    }
    const restored = (history.state as { lygChapter?: Chapter } | null)?.lygChapter;
    if (restored) setChapter(restored);
    else history.replaceState({ ...history.state, lygChapter: "welcome" }, "");

    function onPop(e: PopStateEvent) {
      const next = (e.state as { lygChapter?: Chapter } | null)?.lygChapter;
      setGoingBack(true);
      setChapter(next ?? "welcome");
    }
    addEventListener("popstate", onPop);
    return () => removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (!draftLoaded.current) {
      draftLoaded.current = true;
      return;
    }
    writeDraft(draft);
  }, [draft]);

  useEffect(() => {
    const previous = focusedChapter.current;
    focusedChapter.current = chapter;
    if (previous !== null && previous !== chapter) screenRef.current?.focus();
  }, [chapter]);

  function update(patch: Partial<Draft>) {
    setDraft((d) => ({ ...d, ...patch }));
  }

  function go(next: Chapter) {
    setGoingBack(false);
    history.pushState({ ...history.state, lygChapter: next }, "");
    setChapter(next);
  }

  const dobParts = { day: draft.dobDay, month: draft.dobMonth, year: draft.dobYear };
  const dobCheck = validateDateOfBirth(dobParts);
  const underage = dobCheck.age !== undefined && dobCheck.age < GUARDIAN_AGE;
  const isUpdate = draft.path === "update";

  const order = PAGE_ORDER.filter((s) => s !== "guardian" || underage);
  const index = order.indexOf(chapter);
  const page = index === -1 ? 1 : index + 1;

  function toggle(key: "interests" | "purpose", value: string) {
    setDraft((d) => {
      const list = d[key];
      return {
        ...d,
        [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
      };
    });
  }

  function finish(saved: SavedMember) {
    // Answers go; only the reference id is kept.
    clearDraft();
    try {
      sessionStorage.setItem(REF_KEY, saved.reference_id);
    } catch {
      // Ignore.
    }
    setLastReference(saved.reference_id);
    setMember(saved);
    go("done");
  }

  return (
    <main className={styles.page}>
      <RegMarks />

      {chapter !== "done" ? (
        <div className={styles.top}>
          <PageStrip
            page={page}
            total={order.length}
            backHref={chapter === "welcome" ? "/" : undefined}
            onBack={() => history.back()}
          />
          <p className={styles.tag}>LYG 2026</p>
        </div>
      ) : (
        <div />
      )}

      <div className={styles.body}>
        <div
          key={chapter}
          ref={screenRef}
          tabIndex={-1}
          className={`${styles.screen} ${goingBack ? styles.screenBack : ""}`}
        >
          {chapter === "welcome" && (
            <Welcome
              path={draft.path}
              onChange={(path: RegistrationPath) => update({ path, verified: false })}
              onContinue={() => go(draft.path === "update" ? "verify" : "identity")}
            />
          )}

          {chapter === "verify" && (
            <Verify
              phone={draft.phone}
              dob={dobParts}
              onPhone={(phone) => update({ phone })}
              onDob={(v) => update({ dobDay: v.day, dobMonth: v.month, dobYear: v.year })}
              onVerified={() => {
                update({ verified: true });
                go("identity");
              }}
              onRegisterInstead={() => {
                update({ path: "new", verified: false });
                go("identity");
              }}
            />
          )}

          {chapter === "identity" && (
            <Identity
              fullName={draft.fullName}
              dob={dobParts}
              onFullName={(fullName) => update({ fullName })}
              onDob={(v) => update({ dobDay: v.day, dobMonth: v.month, dobYear: v.year })}
              onContinue={() => go("connection")}
              lockedDob={isUpdate && draft.verified}
            />
          )}

          {chapter === "connection" && (
            <Connection
              phone={draft.phone}
              email={draft.email}
              onPhone={(phone) => update({ phone })}
              onEmail={(email) => update({ email })}
              onContinue={() => go("community")}
              quiet={quiet}
              lockedPhone={isUpdate && draft.verified}
            />
          )}

          {chapter === "community" && (
            <Community
              area={draft.area}
              community={draft.community}
              onArea={(area) => update({ area })}
              onCommunity={(community) => update({ community })}
              onContinue={() => go("life")}
              quiet={quiet}
            />
          )}

          {chapter === "life" && (
            <Life
              currentStatus={draft.currentStatus}
              place={draft.institutionOrWorkplace}
              previous={draft.previousYouthGroup}
              previousDetails={draft.previousYouthGroupDetails}
              onStatus={(currentStatus) => update({ currentStatus })}
              onPlace={(institutionOrWorkplace) => update({ institutionOrWorkplace })}
              onPrevious={(previousYouthGroup) => update({ previousYouthGroup })}
              onPreviousDetails={(previousYouthGroupDetails) =>
                update({ previousYouthGroupDetails })
              }
              onContinue={() => go("interests")}
            />
          )}

          {chapter === "interests" && (
            <Interests
              values={draft.interests}
              onToggle={(v) => toggle("interests", v)}
              onContinue={() => go("purpose")}
              quiet={quiet}
            />
          )}

          {chapter === "purpose" && (
            <Purpose
              values={draft.purpose}
              onToggle={(v) => toggle("purpose", v)}
              onContinue={() => go(underage ? "guardian" : "guidelines")}
            />
          )}

          {chapter === "guardian" && (
            <Guardian
              name={draft.guardianName}
              phone={draft.guardianPhone}
              consent={draft.guardianConsent}
              onName={(guardianName) => update({ guardianName })}
              onPhone={(guardianPhone) => update({ guardianPhone })}
              onConsent={(guardianConsent) => update({ guardianConsent })}
              onContinue={() => go("guidelines")}
            />
          )}

          {chapter === "guidelines" && (
            <Guidelines
              accepted={draft.guidelinesAccepted}
              onAccepted={(guidelinesAccepted) => update({ guidelinesAccepted })}
              onContinue={() => go("review")}
            />
          )}

          {chapter === "review" && (
            <Review
              draft={draft}
              underage={underage}
              onEdit={(step) => go(step as Chapter)}
              onDone={finish}
              onDuplicate={() => {
                update({ path: "update", verified: false });
                go("verify");
              }}
              onVerifyAgain={() => {
                update({ verified: false });
                go("verify");
              }}
            />
          )}

          {chapter === "done" &&
            (member ? (
              <Done member={member} logo={logo} season={season} />
            ) : (
              // Reached by a refresh: the saved row was never stored, so there
              // is nothing to rebuild the document from.
              <DoneAfterRefresh referenceId={lastReference} />
            ))}
        </div>
      </div>
    </main>
  );
}
