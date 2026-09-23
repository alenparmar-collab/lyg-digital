import { NextResponse, type NextRequest } from "next/server";
import { committeeAccess, findUser } from "@/lib/committee/users";
import { COMMITTEE_COOKIE, readSession } from "@/lib/committee/session";

/**
 * First gate on /committee. It turns away anyone whose session cookie is
 * missing, forged or expired, before the request reaches a page that reads
 * member data.
 *
 * Next.js 16 calls this a proxy rather than middleware. Its own docs say a
 * proxy is for optimistic checks and not an authorization solution, which is
 * exactly how it is used here: every committee page and action calls
 * requireCommittee() again on the server. This layer is a convenience and
 * never the last word.
 *
 * Proxy runs on the Node.js runtime in Next 16, so this shares the same
 * node:crypto verification the pages use rather than a second implementation.
 */

const LOGIN = "/committee/login";
const SUMMARY = "/committee";

function isLogin(pathname: string): boolean {
  return pathname === LOGIN || pathname.startsWith(`${LOGIN}/`);
}

/** The only committee page a summary-only person may open. */
function isSummaryOnlyPath(pathname: string): boolean {
  return pathname === SUMMARY || pathname === `${SUMMARY}/`;
}

function to(request: NextRequest, pathname: string, search = "") {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = search;
  return NextResponse.redirect(url);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const onLogin = isLogin(pathname);

  const access = committeeAccess();
  if (!access.ok) {
    // Not configured means nobody can be signed in, so committee routes are
    // closed rather than open. Failing open here would expose every member
    // record the moment an environment variable went missing or the list was
    // mistyped.
    return onLogin ? NextResponse.next() : to(request, LOGIN, "?unconfigured=1");
  }

  // Signed by this server, still in date, still someone on the list, and with
  // a view that still matches the list. A cookie that disagrees is stale.
  const claims = readSession(request.cookies.get(COMMITTEE_COOKIE)?.value, access.secret);
  const user = claims && findUser(access.users, claims.name, claims.fingerprint);
  const signedIn = Boolean(claims && user && claims.view === user.view);

  if (!signedIn && !onLogin) return to(request, LOGIN);

  // Someone already signed in has no reason to sit on the login page.
  if (signedIn && onLogin) return to(request, SUMMARY);

  // Summary-only people get the summary and nothing that names a member. The
  // pages and the download action check this again on the server.
  if (signedIn && user && user.view === "summary" && !isSummaryOnlyPath(pathname)) {
    return to(request, SUMMARY);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/committee", "/committee/:path*"],
};
