import { NextResponse, type NextRequest } from "next/server";
import { committeeConfig } from "@/lib/committee/config";
import { COMMITTEE_COOKIE, verifySession } from "@/lib/committee/session";

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

function isLogin(pathname: string): boolean {
  return pathname === LOGIN || pathname.startsWith(`${LOGIN}/`);
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

  const config = committeeConfig();
  if (!config) {
    // Not configured means nobody can be signed in, so committee routes are
    // closed rather than open. Failing open here would expose every member
    // record the moment an environment variable went missing.
    return onLogin ? NextResponse.next() : to(request, LOGIN, "?unconfigured=1");
  }

  const signedIn = verifySession(request.cookies.get(COMMITTEE_COOKIE)?.value, config.secret);

  if (!signedIn && !onLogin) return to(request, LOGIN);

  // Someone already signed in has no reason to sit on the login page.
  if (signedIn && onLogin) return to(request, "/committee");

  return NextResponse.next();
}

export const config = {
  matcher: ["/committee", "/committee/:path*"],
};
