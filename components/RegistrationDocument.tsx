import type { SavedMember } from "@/lib/registration/member";
import { INTERESTS, PURPOSE, labelFor, statusLabel } from "@/lib/registration/options";
import { JOHN_15_15 } from "@/lib/content/scripture";
import { seasonLabel, type Season } from "@/lib/season";
import styles from "./RegistrationDocument.module.css";

/**
 * The official LYG registration sheet. One component, two homes: the member's
 * own completion screen and the committee viewer.
 *
 * It is ALWAYS built from a saved, server-validated row. Never from form state
 * in the browser, so what a member prints is exactly what LYG holds.
 *
 * No hooks, so it renders in a server component and inside the client wizard.
 */

const IST = "Asia/Kolkata";

function longDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

function dateAndTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** A date-only column, so it must not be shifted by a timezone. */
function plainDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  if (!y || !m || !d) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

function phoneDisplay(e164: string): string {
  const digits = e164.replace(/^\+91/, "");
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.row}>
      <dt className={styles.rowLabel}>{label}</dt>
      <dd className={styles.rowValue}>{children}</dd>
    </div>
  );
}

function Tags({ values, list }: { values: string[]; list: readonly { value: string; label: string }[] }) {
  if (!values.length) return <span className={styles.none}>None given</span>;
  return (
    <span className={styles.tags}>
      {values.map((v) => (
        <span key={v} className={styles.tag}>
          {labelFor(list, v)}
        </span>
      ))}
    </span>
  );
}

export default function RegistrationDocument({
  member,
  logo,
}: {
  member: SavedMember;
  /** The two-ink mark. Rendered on the server and passed in as an element. */
  logo: React.ReactNode;
}) {
  const isUpdate = member.membership_status === "updated";
  const hasGuardian = Boolean(member.guardian_name || member.guardian_phone);

  return (
    <article className={styles.sheet} aria-label="LYG member registration">
      <header className={styles.header}>
        <span className={styles.logo}>{logo}</span>
        <div>
          <p className={styles.org}>Lourdes Youth Group</p>
          <p className={styles.parish}>CTM Parish · Ahmedabad</p>
          <p className={styles.docTitle}>Member Registration</p>
        </div>
      </header>

      <div className={styles.band}>
        <p className={styles.ref}>
          <span className={styles.refLabel}>Reference</span>
          {member.reference_id}
        </p>
        <p className={styles.type}>{isUpdate ? "Updated Details" : "New Member"}</p>
      </div>

      <dl className={styles.rows}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Registration</h2>
          <Row label="Registered on">{longDate(member.created_at)}</Row>
          {isUpdate ? <Row label="Details updated on">{dateAndTime(member.updated_at)}</Row> : null}
          <Row label="Joined in">
            {seasonLabel[member.join_season as Season] ?? member.join_season}, {member.join_year}
          </Row>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Member</h2>
          <Row label="Full name">{member.full_name}</Row>
          <Row label="Date of birth">{plainDate(member.dob)}</Row>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Contact</h2>
          <Row label="Mobile / WhatsApp">{phoneDisplay(member.phone)}</Row>
          {member.email ? <Row label="Email">{member.email}</Row> : null}
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Community</h2>
          <Row label="Area">{member.area}</Row>
          {member.community ? <Row label="Community">{member.community}</Row> : null}
          <Row label="Parish">CTM Parish</Row>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Study and work</h2>
          <Row label="Currently">{statusLabel(member.current_status)}</Row>
          {member.institution_or_workplace ? (
            <Row label="Where">{member.institution_or_workplace}</Row>
          ) : null}
          <Row label="Previous youth group">{member.previous_youth_group ? "Yes" : "No"}</Row>
          {member.previous_youth_group_details ? (
            <Row label="Details">{member.previous_youth_group_details}</Row>
          ) : null}
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Interests and skills</h2>
          <Row label="Interested in">
            <Tags values={member.interests} list={INTERESTS} />
          </Row>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Purpose and involvement</h2>
          <Row label="Hoping to">
            <Tags values={member.purpose} list={PURPOSE} />
          </Row>
        </div>

        {hasGuardian ? (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Parent or guardian</h2>
            <Row label="Name">{member.guardian_name ?? "—"}</Row>
            <Row label="Mobile">
              {member.guardian_phone ? phoneDisplay(member.guardian_phone) : "—"}
            </Row>
            <Row label="Consent">
              {member.guardian_consent ? "Given" : "Not given"}
            </Row>
          </div>
        ) : null}

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Guidelines</h2>
          <Row label="Accepted">{dateAndTime(member.guidelines_accepted_at)}</Row>
          <Row label="Version">{member.consent_version}</Row>
        </div>
      </dl>

      <footer className={styles.footer}>
        <p className={styles.verse}>
          {JOHN_15_15.text}
          <span className={styles.verseRef}>{JOHN_15_15.reference}</span>
        </p>
        <p className={styles.footNote}>
          <span>Lourdes Youth Group · CTM Parish, Ahmedabad</span>
          <span>For LYG committee use</span>
        </p>
      </footer>
    </article>
  );
}
