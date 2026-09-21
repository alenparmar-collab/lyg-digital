/**
 * The answer lists. One source of truth: the screens render from these and the
 * server validates against these, so the two can never drift.
 */

export const CURRENT_STATUS = [
  { value: "school", label: "School student", needsPlace: true, placeLabel: "School" },
  { value: "college", label: "College / university student", needsPlace: true, placeLabel: "College or university" },
  { value: "working", label: "Working", needsPlace: true, placeLabel: "Where you work" },
  { value: "self_employed", label: "Self-employed", needsPlace: true, placeLabel: "What you do" },
  { value: "looking_for_work", label: "Looking for work", needsPlace: false },
  { value: "other", label: "Other", needsPlace: false },
] as const;

export type CurrentStatus = (typeof CURRENT_STATUS)[number]["value"];

export const CURRENT_STATUS_VALUES = CURRENT_STATUS.map((s) => s.value) as CurrentStatus[];

export function statusLabel(value: string): string {
  return CURRENT_STATUS.find((s) => s.value === value)?.label ?? value;
}

export function statusNeedsPlace(value: string): boolean {
  return CURRENT_STATUS.find((s) => s.value === value)?.needsPlace ?? false;
}

export function statusPlaceLabel(value: string): string {
  const found = CURRENT_STATUS.find((s) => s.value === value);
  return (found && "placeLabel" in found ? found.placeLabel : undefined) ?? "Institution or workplace";
}

export const INTERESTS = [
  { value: "media", label: "Media" },
  { value: "photography", label: "Photography" },
  { value: "video", label: "Video" },
  { value: "graphic_design", label: "Graphic design" },
  { value: "music", label: "Music" },
  { value: "choir", label: "Choir" },
  { value: "liturgy", label: "Liturgy" },
  { value: "event_management", label: "Event management" },
  { value: "sports", label: "Sports" },
  { value: "social_service", label: "Social service" },
  { value: "bible_faith", label: "Bible and faith activities" },
  { value: "public_speaking", label: "Public speaking" },
  { value: "writing", label: "Writing" },
  { value: "technology", label: "Technology" },
  { value: "leadership", label: "Leadership" },
  { value: "other", label: "Other" },
] as const;

export const INTEREST_VALUES = INTERESTS.map((i) => i.value) as string[];

export const PURPOSE = [
  { value: "grow_in_faith", label: "Grow in faith" },
  { value: "find_community", label: "Find community" },
  { value: "serve_others", label: "Serve others" },
  { value: "explore_questions", label: "Explore questions" },
  { value: "find_direction", label: "Find direction" },
  { value: "go_deeper", label: "Go deeper" },
  { value: "join_activities", label: "Join activities" },
  { value: "not_sure_yet", label: "Not sure yet" },
] as const;

export const PURPOSE_VALUES = PURPOSE.map((p) => p.value) as string[];

export function labelFor(list: readonly { value: string; label: string }[], value: string): string {
  return list.find((i) => i.value === value)?.label ?? value;
}
