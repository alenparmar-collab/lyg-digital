"use client";

import { useRef, useState } from "react";
import ChapterHeader from "../ChapterHeader";
import InkField from "../InkField";
import MarginNote from "@/components/MarginNote";
import StampButton from "@/components/StampButton";
import { titleCasePlace } from "@/lib/registration/validate";
import styles from "./Chapter.module.css";

/**
 * Area and community as free text. Parish is always CTM Parish: stored
 * implicitly, never asked.
 *
 * Community is optional on purpose. Plenty of members will not know a
 * community name, and a required field they guess at is worse data than a
 * blank one.
 *
 * Both fields are tidied when they lose focus, using the same function the
 * server uses, so REVIEW shows what will actually be stored rather than the
 * raw typing. The server still normalises whatever arrives, whether or not
 * this ever ran.
 */
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

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedArea = area.trim();
    if (trimmedArea.length < 2) {
      setAreaError("We need your area.");
      areaRef.current?.focus();
      return;
    }
    if (trimmedArea.length > 80) {
      setAreaError("That is longer than we can store. Shorten it a little.");
      areaRef.current?.focus();
      return;
    }
    if (community.trim().length > 80) {
      setCommunityError("That is longer than we can store. Shorten it a little.");
      communityRef.current?.focus();
      return;
    }
    // Tidy on submit as well: pressing Enter can leave a field without ever
    // firing blur.
    onArea(titleCasePlace(area));
    onCommunity(titleCasePlace(community));
    setAreaError(undefined);
    setCommunityError(undefined);
    onContinue();
  }

  return (
    <form onSubmit={submit} noValidate>
      <ChapterHeader chapter={4} name="Community" title="Where you're from" />

      <div className={styles.fields}>
        <InkField
          label="Your area"
          value={area}
          onChange={(v) => {
            setAreaError(undefined);
            onArea(v);
          }}
          onBlur={() => onArea(titleCasePlace(area))}
          error={areaError}
          inputRef={areaRef}
          type="text"
          autoCapitalize="words"
          autoComplete="address-level3"
          enterKeyHint="next"
        />

        <InkField
          label="Your community (optional)"
          value={community}
          onChange={(v) => {
            setCommunityError(undefined);
            onCommunity(v);
          }}
          onBlur={() => onCommunity(titleCasePlace(community))}
          error={communityError}
          inputRef={communityRef}
          hint="Leave this empty if you are not sure, or if your area has no separate community."
          type="text"
          autoCapitalize="words"
          enterKeyHint="done"
        />
      </div>

      <MarginNote quiet={quiet} className={styles.note} rotate={-1.5}>
        Everyone here is CTM Parish. We won&apos;t make you tell us that.
      </MarginNote>

      <div className={styles.actions}>
        <StampButton type="submit">Continue</StampButton>
      </div>
    </form>
  );
}
