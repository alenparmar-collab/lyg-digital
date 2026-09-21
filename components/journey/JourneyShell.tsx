"use client";

import { useEffect, useRef, useState } from "react";
import RegMarks from "@/components/RegMarks";
import PageStrip from "./PageStrip";
import NotBuiltYet from "./NotBuiltYet";
import Welcome from "./screens/Welcome";
import Identity from "./screens/Identity";
import Connection from "./screens/Connection";
import {
  emptyDraft,
  readDraft,
  writeDraft,
  type Draft,
  type RegistrationPath,
} from "@/lib/registration/draft";
import type { DateResult } from "@/lib/registration/validate";
import styles from "./JourneyShell.module.css";

/** Chapters that carry a page number, in order. "guardian" only counts for
 *  members under 18, which is known as soon as the date of birth is in. */
const PAGE_ORDER = [
  "welcome",
  "identity",
  "connection",
  "community",
  "life",
  "interests",
  "purpose",
  "guardian",
  "guidelines",
] as const;

type Chapter = (typeof PAGE_ORDER)[number] | "verify" | "review" | "done";

function pageNumbers(chapter: Chapter, needsGuardian: boolean) {
  const order = PAGE_ORDER.filter((s) => s !== "guardian" || needsGuardian);
  const index = order.indexOf(chapter as (typeof PAGE_ORDER)[number]);
  return { page: index + 1, total: order.length, numbered: index !== -1 };
}

export default function JourneyShell({ quiet = false }: { quiet?: boolean }) {
  const [chapter, setChapter] = useState<Chapter>("welcome");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [needsGuardian, setNeedsGuardian] = useState(false);
  const [goingBack, setGoingBack] = useState(false);
  const draftLoaded = useRef(false);
  const focusedChapter = useRef<Chapter | null>(null);
  const screenRef = useRef<HTMLDivElement>(null);

  // Restore answers, and the chapter, after a refresh. history.state survives a
  // reload, so someone who pulls to refresh mid-flow lands back where they were.
  useEffect(() => {
    setDraft(readDraft());
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

  // Don't write the empty draft back over a restored one on first render.
  useEffect(() => {
    if (!draftLoaded.current) {
      draftLoaded.current = true;
      return;
    }
    writeDraft(draft);
  }, [draft]);

  // Move focus to the new chapter so a screen reader announces it instead of
  // leaving the user on a button that no longer exists.
  useEffect(() => {
    // Only on a real chapter change. A "first render" flag is not enough:
    // Strict Mode mounts, cleans up and mounts again, so the flag is already
    // spent on the second pass and focus jumps on page load. Focusing the
    // container on load also moves the tab start point past the back control.
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

  const { page, total, numbered } = pageNumbers(chapter, needsGuardian);

  return (
    <main className={styles.page}>
      <RegMarks />

      <div className={styles.top}>
        {numbered ? (
          <PageStrip
            page={page}
            total={total}
            backHref={chapter === "welcome" ? "/" : undefined}
            onBack={() => history.back()}
          />
        ) : (
          <PageStrip page={1} total={total} onBack={() => history.back()} />
        )}
        {/* A mono tag, not the mark. At the size this corner allows, the
            logo's ring text is unreadable and it reads as a smudge; the words
            do the orientation job the mark cannot do small. */}
        <p className={styles.tag}>LYG 2026</p>
      </div>

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
              onChange={(path: RegistrationPath) => update({ path })}
              onContinue={() => go(draft.path === "update" ? "verify" : "identity")}
            />
          )}

          {chapter === "identity" && (
            <Identity
              fullName={draft.fullName}
              dob={{ day: draft.dobDay, month: draft.dobMonth, year: draft.dobYear }}
              onFullName={(fullName) => update({ fullName })}
              onDob={(v) => update({ dobDay: v.day, dobMonth: v.month, dobYear: v.year })}
              onContinue={(result: DateResult) => {
                setNeedsGuardian(Boolean(result.needsGuardian));
                go("connection");
              }}
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
            />
          )}

          {chapter === "verify" && (
            <NotBuiltYet
              chapter={1}
              name="Welcome back"
              what="Verifying a returning member needs the database, so this chapter is not built. It will ask for the mobile number and date of birth on file and check both on the server."
            />
          )}

          {chapter === "community" && (
            <NotBuiltYet
              chapter={4}
              name="Community"
              what="Area, then the communities inside it. Not built: the areas and communities come from the parish list, which has not arrived yet."
            />
          )}
        </div>
      </div>
    </main>
  );
}
