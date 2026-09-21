import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * First gate on /committee. It refreshes the Supabase session cookie and turns
 * anyone away who is not signed in or not on COMMITTEE_EMAILS.
 *
 * Next.js 16 calls this a proxy rather than middleware. Its own docs say a
 * proxy is for optimistic checks and not a session or authorization solution,
 * which is exactly how it is used here: every committee page and action calls
 * requireCommittee() again on the server. This layer is a convenience and
 * never the last word.
 */

const PUBLIC = ["/committee/login", "/committee/auth"];

function allowed(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.COMMITTEE_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  const path0 = request.nextUrl.pathname;
  const isPublic0 = PUBLIC.some((p) => path0 === p || path0.startsWith(`${p}/`));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    // Not configured means nobody can be authenticated, so committee routes are
    // closed rather than open. Failing open here would expose the viewer to
    // anyone the moment an environment variable went missing.
    if (isPublic0) return response;
    const to = request.nextUrl.clone();
    to.pathname = "/committee/login";
    to.search = "?unconfigured=1";
    return NextResponse.redirect(to);
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC.some((p) => path === p || path.startsWith(`${p}/`));

  if (!isPublic && !allowed(user?.email)) {
    const to = request.nextUrl.clone();
    to.pathname = "/committee/login";
    to.search = user ? "?denied=1" : "";
    return NextResponse.redirect(to);
  }

  // A signed-in committee member has no reason to sit on the login page.
  if (path === "/committee/login" && allowed(user?.email)) {
    const to = request.nextUrl.clone();
    to.pathname = "/committee";
    to.search = "";
    return NextResponse.redirect(to);
  }

  return response;
}

export const config = {
  matcher: ["/committee", "/committee/:path*"],
};
