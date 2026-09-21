"use client";

import { useRef, useState } from "react";
import ChapterHeader from "../ChapterHeader";
import { ChoiceList } from "../Choice";
import MarginNote from "@/components/MarginNote";
import StampButton from "@/components/StampButton";
import { AREAS, communitiesFor } from "@/lib/areas";
import styles from "./Chapter.module.css";

/** Area first, then only the communities inside it. Parish is never asked. */
export default function Community({
  area,
  community,
  onArea,
  onCommunity,
  onContinue,
  quiet = false,
}: {
  area: string;
  community: string;
  onArea: (v: string) => void;
  onCommunity: (v: string) => void;
  onContinue: () => void;
  quiet?: boolean;
}) {
  const [areaError, setAreaError] = useState<string>();
  const [communityError, setCommunityError] = useState<string>();
  const areaRef = useRef<HTMLInputElement>(null);
  const communityRef = useRef<HTMLInputElement>(null);

  const communities = communitiesFor(area);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!area) {
      setAreaError("Choose your area.");
      areaRef.current?.focus();
      return;
    }
    if (!community) {
      setCommunityError("Choose your community.");
      communityRef.current?.focus();
      return;
    }
    setAreaError(undefined);
    setCommunityError(undefined);
    onContinue();
  }

  return (
    <form onSubmit={submit} noValidate>
      <ChapterHeader chapter={4} name="Community" title="Where you're from" />

      <div className={styles.fields}>
        <ChoiceList
          legend="Your area"
          name="area"
          options={AREAS.map((a) => ({ value: a.name, label: a.name }))}
          value={area}
          onChange={(v) => {
            setAreaError(undefined);
            onArea(v);
            // Changing area invalidates the community below it.
            if (community && !communitiesFor(v).includes(community)) onCommunity("");
          }}
          error={areaError}
          firstRef={areaRef}
        />

        {area ? (
          <ChoiceList
            legend={`Your community in ${area}`}
            name="community"
            options={communities.map((c) => ({ value: c, label: c }))}
            value={community}
            onChange={(v) => {
              setCommunityError(undefined);
              onCommunity(v);
            }}
            error={communityError}
            firstRef={communityRef}
          />
        ) : null}
      </div>

      <MarginNote quiet={quiet} className={styles.note} rotate={-1.5}>
        Everyone here is CTM Parish. We won't make you tell us that.
      </MarginNote>

      <div className={styles.actions}>
        <StampButton type="submit">Continue</StampButton>
      </div>
    </form>
  );
}
