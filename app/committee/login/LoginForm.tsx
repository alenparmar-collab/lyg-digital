"use client";

import { useActionState } from "react";
import { committeeLogin, type LoginResult } from "../actions";
import styles from "./login.module.css";

/**
 * One mobile number and one password. There is no sign-up, no reset and no
 * account list: the parish sets the two values in Vercel, and this checks what
 * was typed against them on the server.
 *
 * The number is typed however people actually type a number. The server
 * normalises it to +91 E.164 before comparing, exactly as the registration
 * form does.
 */
export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginResult | null, FormData>(
    committeeLogin,
    null,
  );

  return (
    <form action={action} className={styles.form} noValidate>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="phone">
          Mobile number
        </label>
        <input
          className={styles.input}
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="username tel"
          autoCapitalize="none"
          spellCheck={false}
          required
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="password">
          Password
        </label>
        <input
          className={styles.input}
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      {state?.message ? (
        <p className={styles.error} role="alert">
          {state.message}
        </p>
      ) : null}

      <button className={styles.submit} type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
