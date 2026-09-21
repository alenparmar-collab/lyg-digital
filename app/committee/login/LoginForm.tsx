"use client";

import { useActionState } from "react";
import { committeeLogin, type LoginResult } from "../actions";
import styles from "./login.module.css";

export default function LoginForm({ denied }: { denied: boolean }) {
  const [state, action, pending] = useActionState<LoginResult | null, FormData>(
    committeeLogin,
    null,
  );

  const message = state?.message ?? (denied ? "You don't have access." : undefined);

  return (
    <form action={action} className={styles.form} noValidate>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="email">
          Email
        </label>
        <input
          className={styles.input}
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
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

      {message ? (
        <p className={styles.error} role="alert">
          {message}
        </p>
      ) : null}

      <button className={styles.submit} type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
