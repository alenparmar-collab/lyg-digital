"use client";

import { committeeLogout } from "./actions";
import styles from "./committee.module.css";

export default function LogoutButton() {
  return (
    <form action={committeeLogout}>
      <button type="submit" className={styles.logout}>
        Log out
      </button>
    </form>
  );
}
