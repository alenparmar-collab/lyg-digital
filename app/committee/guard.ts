import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { committeeConfig } from "@/lib/committee/config";
import { COMMITTEE_COOKIE, verifySession } from "@/lib/committee/session";

/**
 * The check that actually protects committee data. Called at the top of every
 * committee page and every committee action, after the proxy has already had a
 * go. The proxy is a convenience and never the last word: this runs again on
 * the server for each request that reaches real data.
 *
 * Returns the signed-in mobile number, or redirects. It never returns on the
 * failure paths.
 */
export async function requireCommittee(): Promise<string> {
  const config = committeeConfig();
  if (!config) redirect("/committee/login?unconfigured=1");

  const store = await cookies();
  const cookie = store.get(COMMITTEE_COOKIE)?.value;

  if (!verifySession(cookie, config.secret)) redirect("/committee/login");

  return config.phone;
}
