"use server";

import { redirect } from "next/navigation";
import { authClient } from "@/lib/supabase/server";
import { isCommitteeEmail } from "@/lib/committee/access";

export type LoginResult = { ok: false; message: string };

export async function committeeLogin(
  _previous: LoginResult | null,
  formData: FormData,
): Promise<LoginResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { ok: false, message: "Enter your email and password." };
  }

  // Checked before the password is even tried, so an account that is not on the
  // list can never hold a committee session.
  if (!isCommitteeEmail(email)) {
    return { ok: false, message: "You don't have access." };
  }

  const supabase = await authClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // One message for a wrong password and an unknown account alike.
    return { ok: false, message: "That email and password did not match." };
  }

  redirect("/committee");
}

export async function committeeLogout(): Promise<void> {
  const supabase = await authClient();
  await supabase.auth.signOut();
  redirect("/committee/login");
}
