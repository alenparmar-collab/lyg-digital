import "server-only";

/**
 * Who is allowed into /committee. A server-only comma-separated environment
 * variable, checked on every committee request. No roles table and no shared
 * password: an account exists because the parish created it in Supabase, and it
 * gets in because its email is on this list.
 */

export function committeeEmails(): string[] {
  return (process.env.COMMITTEE_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isCommitteeEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return committeeEmails().includes(email.trim().toLowerCase());
}
