/**
 * In-progress answers, kept in sessionStorage so a refresh or an accidental
 * swipe does not wipe the chapter someone just filled in. Cleared on submit.
 *
 * Every read and write is wrapped: sessionStorage throws in some private
 * browsing modes, and a member losing the flow to an exception is worse than
 * losing the draft.
 */

const KEY = "lyg:registration-draft:v1";

export type RegistrationPath = "new" | "update";

export type Draft = {
  path: RegistrationPath | null;
  fullName: string;
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  phone: string;
  email: string;
};

export const emptyDraft: Draft = {
  path: null,
  fullName: "",
  dobDay: "",
  dobMonth: "",
  dobYear: "",
  phone: "",
  email: "",
};

export function readDraft(): Draft {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return emptyDraft;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return emptyDraft;
    const out = { ...emptyDraft };
    for (const key of Object.keys(emptyDraft) as (keyof Draft)[]) {
      const value = (parsed as Record<string, unknown>)[key];
      if (key === "path") {
        out.path = value === "new" || value === "update" ? value : null;
      } else if (typeof value === "string") {
        out[key] = value;
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
    // Nothing to do. The flow still works from React state.
  }
}

export function clearDraft(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Ignore.
  }
}
