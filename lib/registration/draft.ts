/**
 * In-progress answers, kept in sessionStorage so a refresh does not wipe the
 * chapter someone just filled in. Cleared on success.
 *
 * What is NEVER kept here: the saved member returned by the server, and the
 * registration document. Those exist only in React state for the life of the
 * completion screen, so a shared or re-opened phone shows nothing.
 *
 * Every read and write is wrapped: sessionStorage throws in some private
 * browsing modes, and losing the flow to an exception is worse than losing the
 * draft.
 */

const KEY = "lyg:registration-draft:v2";

export type RegistrationPath = "new" | "update";

export type Draft = {
  path: RegistrationPath | null;
  /** True once the server has confirmed this phone + dob is on file. */
  verified: boolean;
  fullName: string;
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  phone: string;
  email: string;
  area: string;
  community: string;
  currentStatus: string;
  institutionOrWorkplace: string;
  previousYouthGroup: "" | "yes" | "no";
  previousYouthGroupDetails: string;
  interests: string[];
  purpose: string[];
  guardianName: string;
  guardianPhone: string;
  guardianConsent: boolean;
  guidelinesAccepted: boolean;
};

export const emptyDraft: Draft = {
  path: null,
  verified: false,
  fullName: "",
  dobDay: "",
  dobMonth: "",
  dobYear: "",
  phone: "",
  email: "",
  area: "",
  community: "",
  currentStatus: "",
  institutionOrWorkplace: "",
  previousYouthGroup: "",
  previousYouthGroupDetails: "",
  interests: [],
  purpose: [],
  guardianName: "",
  guardianPhone: "",
  guardianConsent: false,
  guidelinesAccepted: false,
};

export function readDraft(): Draft {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return emptyDraft;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return emptyDraft;

    const out: Draft = { ...emptyDraft };
    for (const key of Object.keys(emptyDraft) as (keyof Draft)[]) {
      const value = parsed[key];
      const fallback = emptyDraft[key];
      if (Array.isArray(fallback)) {
        if (Array.isArray(value)) {
          (out[key] as string[]) = value.filter((v): v is string => typeof v === "string");
        }
      } else if (typeof fallback === "boolean") {
        if (typeof value === "boolean") (out[key] as boolean) = value;
      } else if (key === "path") {
        out.path = value === "new" || value === "update" ? value : null;
      } else if (key === "previousYouthGroup") {
        out.previousYouthGroup = value === "yes" || value === "no" ? value : "";
      } else if (typeof value === "string") {
        (out[key] as string) = value;
      }
    }
    return out;
  } catch {
    return emptyDraft;
  }
}

export function writeDraft(draft: Draft): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // The flow still works from React state.
  }
}

export function clearDraft(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Ignore.
  }
}

/** Draft to the shape the zod schema expects. */
export function draftToSubmission(d: Draft) {
  const iso = `${d.dobYear}-${d.dobMonth.padStart(2, "0")}-${d.dobDay.padStart(2, "0")}`;
  return {
    fullName: d.fullName,
    dob: iso,
    phone: d.phone,
    email: d.email,
    area: d.area,
    community: d.community,
    currentStatus: d.currentStatus,
    institutionOrWorkplace: d.institutionOrWorkplace,
    previousYouthGroup: d.previousYouthGroup === "yes",
    previousYouthGroupDetails: d.previousYouthGroupDetails,
    interests: d.interests,
    purpose: d.purpose,
    guardianName: d.guardianName,
    guardianPhone: d.guardianPhone,
    guardianConsent: d.guardianConsent,
    guidelinesAccepted: d.guidelinesAccepted,
  };
}
