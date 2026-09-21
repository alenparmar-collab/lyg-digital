/**
 * The shape of a saved member as it may travel to the browser: everything the
 * completion screen and the registration document need, and never the internal
 * id. The id is the only key to a committee record, so it stays on the server.
 */
export type SavedMember = {
  reference_id: string;
  full_name: string;
  dob: string;
  phone: string;
  email: string | null;
  area: string;
  community: string;
  current_status: string;
  institution_or_workplace: string | null;
  previous_youth_group: boolean;
  previous_youth_group_details: string | null;
  interests: string[];
  purpose: string[];
  guardian_name: string | null;
  guardian_phone: string | null;
  guardian_consent: boolean | null;
  join_season: string;
  join_year: number;
  membership_status: "new" | "updated";
  guidelines_accepted_at: string;
  consent_version: string;
  created_at: string;
  updated_at: string;
};

/** Columns to select for a member-facing or committee-facing document. */
export const SAVED_MEMBER_COLUMNS =
  "reference_id, full_name, dob, phone, email, area, community, current_status, " +
  "institution_or_workplace, previous_youth_group, previous_youth_group_details, " +
  "interests, purpose, guardian_name, guardian_phone, guardian_consent, join_season, " +
  "join_year, membership_status, guidelines_accepted_at, consent_version, created_at, updated_at";
