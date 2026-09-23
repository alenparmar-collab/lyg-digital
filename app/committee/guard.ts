import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { committeeAccess, findUser, type CommitteeUser } from "@/lib/committee/users";
import { COMMITTEE_COOKIE, readSession } from "@/lib/committee/session";

/**
 * The checks that actually protect committee data. Called at the top of every
 * committee page and every committee action, after the proxy has already had a
 * go. The proxy is a convenience and never the last word: these run again on
 * the server for each request that reaches real data.
 *
 * requireCommittee is the door into the viewer at all. requireFullAccess is
 * the door into anything that names a member, and a summary-only person never
 * gets through it.
 */

/**
 * Four gates, in order:
 *   1. the deployment is configured at all;
 *   2. the cookie is one this server signed and still in date;
 *   3. the person it names is still in the list as it stands right now;
 *   4. the view in the cookie still matches the list.
 *
 * Three and four are what make removing someone, changing their password, or
 * narrowing what they may see take effect on their next request. A cookie
 * issued when someone could see everything is worthless the moment the list
 * says otherwise.
 *
 * Returns the signed-in person, or redirects. It never returns on a failure.
 */
export async function requireCommittee(): Promise<CommitteeUser> {
  const access = committeeAccess();
  if (!access.ok) redirect("/committee/login?unconfigured=1");

  const store = await cookies();
  const claims = readSession(store.get(COMMITTEE_COOKIE)?.value, access.secret);
  if (!claims) redirect("/committee/login");

  const user = findUser(access.users, claims.name, claims.fingerprint);
  if (!user) redirect("/committee/login");

  // A cookie that disagrees with the list is stale, whichever way it disagrees.
  if (claims.view !== user.view) redirect("/committee/login");

  return user;
}

/**
 * For the list, a member's record, and the download action behind it: anything
 * that shows who someone is. A summary-only person is sent back to the summary
 * rather than to the login, because they are signed in perfectly well; this
 * simply is not theirs to see.
 */
export async function requireFullAccess(): Promise<CommitteeUser> {
  const user = await requireCommittee();
  if (user.view !== "all") redirect("/committee");
  return user;
}
