"use client";

import { useRef, useState } from "react";
import ChapterHeader from "../ChapterHeader";
import { ChoiceList } from "../Choice";
import InkField from "../InkField";
import StampButton from "@/components/StampButton";
import { CURRENT_STATUS, statusNeedsPlace, statusPlaceLabel } from "@/lib/registration/options";
import styles from "./Chapter.module.css";

export default function Life({
  currentStatus,
  place,
  previous,
  previousDetails,
  onStatus,
  onPlace,
  onPrevious,
  onPreviousDetails,
  onContinue,
}: {
  currentStatus: string;
  place: string;
  previous: "" | "yes" | "no";
  previousDetails: string;
  onStatus: (v: string) => void;
  onPlace: (v: string) => void;
  onPrevious: (v: "yes" | "no") => void;
  onPreviousDetails: (v: string) => void;
  onContinue: () => void;
}) {
  const [statusError, setStatusError] = useState<string>();
  const [placeError, setPlaceError] = useState<string>();
  const [previousError, setPreviousError] = useState<string>();
  const [detailsError, setDetailsError] = useState<string>();
  const statusRef = useRef<HTMLInputElement>(null);
  const placeRef = useRef<HTMLInputElement>(null);
  const previousRef = useRef<HTMLInputElement>(null);
  const detailsRef = useRef<HTMLInputElement>(null);

  const needsPlace = statusNeedsPlace(currentStatus);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentStatus) {
      setStatusError("Choose what you're doing at the moment.");
      statusRef.current?.focus();
      return;
    }
    if (needsPlace && !place.trim()) {
      setPlaceError("Tell us where, so the committee knows.");
      placeRef.current?.focus();
      return;
    }
    if (!previous) {
      setPreviousError("Let us know either way.");
      previousRef.current?.focus();
      return;
    }
    if (previous === "yes" && !previousDetails.trim()) {
      setDetailsError("Tell us a little about it.");
      detailsRef.current?.focus();
      return;
    }
    onContinue();
  }

  return (
    <form onSubmit={submit} noValidate>
      <ChapterHeader chapter={5} name="Life" title="Study, work, and what came before" />

      <div className={styles.fields}>
        <ChoiceList
          legend="At the moment you are"
          name="current-status"
          options={CURRENT_STATUS.map((s) => ({ value: s.value, label: s.label }))}
          value={currentStatus}
          onChange={(v) => {
            setStatusError(undefined);
            setPlaceError(undefined);
            onStatus(v);
          }}
          error={statusError}
          firstRef={statusRef}
        />

        {needsPlace ? (
          <InkField
            label={statusPlaceLabel(currentStatus)}
            value={place}
            onChange={(v) => {
              setPlaceError(undefined);
              onPlace(v);
            }}
            error={placeError}
            inputRef={placeRef}
            type="text"
            autoCapitalize="words"
            enterKeyHint="next"
          />
        ) : null}

        <ChoiceList
          legend="Been part of a youth group before?"
          name="previous-youth-group"
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No, this is my first" },
          ]}
          value={previous}
          onChange={(v) => {
            setPreviousError(undefined);
            onPrevious(v as "yes" | "no");
          }}
          error={previousError}
          firstRef={previousRef}
        />

        {previous === "yes" ? (
          <InkField
            label="Which one, and what did you do?"
            value={previousDetails}
            onChange={(v) => {
              setDetailsError(undefined);
              onPreviousDetails(v);
            }}
            error={detailsError}
            inputRef={detailsRef}
            type="text"
            enterKeyHint="done"
          />
        ) : null}
      </div>

      <div className={styles.actions}>
        <StampButton type="submit">Continue</StampButton>
      </div>
    </form>
  );
}
