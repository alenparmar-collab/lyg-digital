import "server-only";
import { redirect } from "next/navigation";
import { authClient } from "@/lib/supabase/server";
import { isCommitteeEmail } from "@/lib/committee/access";

/**
 * The check that actually protects committee data. Called at the top of every
 * committee page and action, after the middleware has already had a go.
 * Returns the signed-in email, or redirects.
 */
export async function requireCommittee(): Promise<string> {
  let user: { email?: string | null } | null = null;
  try {
    const supabase = await authClient();
    ({
      data: { user },
    } = await supabase.auth.getUser());
  } catch {
    // Supabase not configured. Closed, not open, and not a 500.
    redirect("/committee/login?unconfigured=1");
  }

  if (!user) redirect("/committee/login");
  if (!isCommitteeEmail(user.email)) redirect("/committee/login?denied=1");
  return user.email as string;
}
