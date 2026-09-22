import "server-only";
import { normalisePhone } from "@/lib/registration/validate";

/**
 * The committee credentials, read from the environment and checked before
 * anything else happens.
 *
 * There is one committee login, not a table of accounts: the parish sets three
 * variables in Vercel and that is the whole of it. All three are server-only.
 * None may ever be prefixed NEXT_PUBLIC_, logged, or rendered into a page.
 *
 * Anything missing or too weak means the door does not open. A half-configured
 * deployment is treated as a closed one, never as an open one.
 */

/** Short enough to type on a phone, long enough not to be guessed. */
export const MIN_PASSWORD_LENGTH = 12;

export type CommitteeConfig = {
  /** COMMITTEE_PHONE, normalised to E.164. */
  phone: string;
  password: string;
  secret: string;
};

/** The config, or null when the deployment is not set up to let anyone in. */
export function committeeConfig(): CommitteeConfig | null {
  const phone = normalisePhone(process.env.COMMITTEE_PHONE ?? "");
  const password = process.env.COMMITTEE_PASSWORD ?? "";
  const secret = process.env.COMMITTEE_SESSION_SECRET ?? "";

  if (!phone) return null;
  if (password.length < MIN_PASSWORD_LENGTH) return null;
  if (!secret) return null;

  return { phone, password, secret };
}

export function isCommitteeConfigured(): boolean {
  return committeeConfig() !== null;
}
