"use client";

import { useState, useTransition } from "react";
import ChapterHeader from "../ChapterHeader";
import StampButton from "@/components/StampButton";
import { submitRegistration } from "@/app/actions/registration";
import type { SavedMember } from "@/lib/registration/member";
import { INTERESTS, PURPOSE, labelFor, statusLabel } from "@/lib/registration/options";
import { draftToSubmission, type Draft } from "@/lib/registration/draft";
import chapter from "./Chapter.module.css";
import styles from "./Review.module.css";

type Section = { title: string; step: string; rows: [string, React.ReactNode][] };

export default function Review({
  draft,
  underage,
  onEdit,
  onDone,
  onDuplicate,
  onVerifyAgain,
}: {
  draft: Draft;
  underage: boolean;
  onEdit: (step: string) => void;
  onDone: (member: SavedMember) => void;
  onDuplicate: () => void;
  onVerifyAgain: (message: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [failure, setFailure] = useState<{ message: string; details: string[] }>();

  const mode = draft.path === "update" ? "update" : "new";
  const dob = `${draft.dobDay.padStart(2, "0")} / ${draft.dobMonth.padStart(2, "0")} / ${draft.dobYear}`;

  const sections: Section[] = [
    {
      title: "Member",
      step: "identity",
      rows: [
        ["Full name", draft.fullName],
        ["Date of birth", dob],
      ],
    },
    {
      title: "Contact",
      step: "connection",
      rows: [
        ["Mobile", `+91 ${draft.phone.replace(/\D/g, "").slice(-10)}`],
        ["Email", draft.email || <span className={styles.none}>Not given</span>],
      ],
    },
    {
      title: "Community",
      step: "community",
      rows: [
        ["Area", draft.area],
        ...(draft.community.trim()
          ? ([["Community", draft.community]] as [string, React.ReactNode][])
          : []),
      ],
    },
    {
      title: "Study and work",
      step: "life",
      rows: [
        ["Currently", statusLabel(draft.currentStatus)],
        ...(draft.institutionOrWorkplace
          ? ([["Where", draft.institutionOrWorkplace]] as [string, React.ReactNode][])
          : []),
        ["Previous youth group", draft.previousYouthGroup === "yes" ? "Yes" : "No"],
        ...(draft.previousYouthGroupDetails
          ? ([["Details", draft.previousYouthGroupDetails]] as [string, React.ReactNode][])
          : []),
      ],
    },
    {
      title: "Interests and skills",
      step: "interests",
      rows: [
        [
          "Interested in",
          draft.interests.length ? (
            draft.interests.map((v) => labelFor(INTERESTS, v)).join(", ")
          ) : (
            <span className={styles.none}>None picked</span>
          ),
        ],
      ],
    },
    {
      title: "Purpose",
      step: "purpose",
      rows: [
        [
          "Hoping to",
          draft.purpose.length ? (
            draft.purpose.map((v) => labelFor(PURPOSE, v)).join(", ")
          ) : (
            <span className={styles.none}>None picked</span>
          ),
        ],
      ],
    },
    ...(underage
      ? [
          {
            title: "Parent or guardian",
            step: "guardian",
            rows: [
              ["Name", draft.guardianName],
              ["Mobile", `+91 ${draft.guardianPhone.replace(/\D/g, "").slice(-10)}`],
              ["Consent", draft.guardianConsent ? "Given" : "Not given"],
            ] as [string, React.ReactNode][],
          },
        ]
      : []),
    {
      title: "Guidelines",
      step: "guidelines",
      rows: [["Accepted", draft.guidelinesAccepted ? "Yes" : "Not yet"]],
    },
  ];

  function send() {
    setFailure(undefined);
    startTransition(async () => {
      try {
        const result = await submitRegistration(draftToSubmission(draft), mode);
        if (result.ok) {
          onDone(result.member);
          return;
        }
        if ("duplicate" in result && result.duplicate) {
          onDuplicate();
          return;
        }
        if ("verifyAgain" in result && result.verifyAgain) {
          onVerifyAgain(result.message);
          return;
        }
        const details =
          "fieldErrors" in result ? Object.values(result.fieldErrors) : [];
        setFailure({ message: result.message, details });
      } catch {
        setFailure({
          message: "We could not save your registration just now.",
          details: ["Check your connection and try again. Your answers are still here."],
        });
      }
    });
  }

  return (
    <div>
      <ChapterHeader
        chapter={10}
        name="Review"
        title="Your LYG profile"
        lead="Have a last look. Change anything that isn't right."
      />

      <div className={styles.summary}>
        {sections.map((section) => (
          <section key={section.title} className={styles.block}>
            <div className={styles.blockHead}>
              <h2 className={styles.blockTitle}>{section.title}</h2>
              <button
                type="button"
                className={styles.edit}
                onClick={() => onEdit(section.step)}
              >
                Edit {section.title.toLowerCase()}
              </button>
            </div>
            <dl className={styles.rows}>
              {section.rows.map(([label, value]) => (
                <div className={styles.row} key={label}>
                  <dt className={styles.label}>{label}</dt>
                  <dd className={styles.value}>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      {failure ? (
        <div className={styles.failure} role="alert">
          <p className={styles.failureText}>{failure.message}</p>
          {failure.details.map((d) => (
            <p className={styles.failureText} key={d}>
              {d}
            </p>
          ))}
        </div>
      ) : null}

      <div className={chapter.actions}>
        <StampButton type="button" onClick={send} disabled={pending}>
          {pending ? "Sending…" : "Send my registration"}
        </StampButton>
      </div>
    </div>
  );
}
