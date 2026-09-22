import {
  Document,
  Font,
  G,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";
import type { SavedMember } from "@/lib/registration/member";
import { INTERESTS, PURPOSE, labelFor, statusLabel } from "@/lib/registration/options";
import { JOHN_15_15 } from "@/lib/content/scripture";
import { seasonLabel, type Season } from "@/lib/season";
import { formatIndianMobile } from "@/lib/registration/validate";
import { logoBox, type PdfLogo } from "@/lib/pdf/logo";
import {
  INK_BLACK,
  INK_SOFT,
  PAPER,
  PAPER_EDGE,
  PDF_FONTS,
  SEASON_INK,
} from "@/lib/pdf/tokens";

/**
 * The registration document as a real PDF: the same sheet as
 * components/RegistrationDocument.tsx, drawn by @react-pdf/renderer instead of
 * the browser.
 *
 * Two rules it exists to keep. The text is text, not a picture of text, so it
 * can be selected, searched and read by a screen reader. And it is built from a
 * saved, server-validated row, never from form state, so what a member keeps
 * is exactly what LYG holds.
 */

/** A4 in points, less the 12mm margin the print stylesheet uses. */
const PAGE_PADDING = 34;

/**
 * The four faces the sheet uses, bundled in public/fonts/ as static, Latin
 * subset TTFs. next/font cannot reach inside a PDF, and @react-pdf/renderer
 * reads neither woff2 nor variable fonts, so these are instanced to one weight
 * each. Registration is idempotent, and the files are only fetched when
 * someone actually asks for a PDF.
 */
export function registerPdfFonts(base: string): void {
  const at = (file: string) => `${base}/${file}`;
  Font.register({
    family: PDF_FONTS.display,
    fonts: [{ src: at("BricolageGrotesque-ExtraBold.ttf"), fontWeight: 800 }],
  });
  Font.register({
    family: PDF_FONTS.serif,
    fonts: [{ src: at("InstrumentSerif-Italic.ttf"), fontStyle: "italic" }],
  });
  Font.register({ family: PDF_FONTS.body, fonts: [{ src: at("Geist-Regular.ttf") }] });
  Font.register({ family: PDF_FONTS.mono, fonts: [{ src: at("GeistMono-Regular.ttf") }] });

  // The sheet sets its own line breaks; never hyphenate a member's name.
  Font.registerHyphenationCallback((word) => [word]);
}

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

/** The filename a member ends up with in their downloads. */
export function pdfFileName(member: SavedMember): string {
  return `${member.reference_id}-Registration.pdf`;
}

function sheet(season: Season) {
  const ink = SEASON_INK[season];
  return StyleSheet.create({
    page: {
      backgroundColor: PAPER,
      color: INK_BLACK,
      padding: PAGE_PADDING,
      fontFamily: PDF_FONTS.body,
      fontSize: 9.5,
      lineHeight: 1.35,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingBottom: 8,
      borderBottomWidth: 2,
      borderBottomColor: INK_BLACK,
      borderBottomStyle: "solid",
    },
    org: { fontFamily: PDF_FONTS.display, fontWeight: 800, fontSize: 15, letterSpacing: -0.3 },
    parish: {
      fontFamily: PDF_FONTS.mono,
      fontSize: 7,
      letterSpacing: 0.56,
      textTransform: "uppercase",
      color: INK_SOFT,
      marginTop: 2,
    },
    docTitle: {
      fontFamily: PDF_FONTS.mono,
      fontSize: 7,
      letterSpacing: 0.84,
      textTransform: "uppercase",
      color: ink.inkText,
      marginTop: 2,
    },

    band: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: PAPER_EDGE,
      borderBottomStyle: "solid",
    },
    refLabel: {
      fontFamily: PDF_FONTS.mono,
      fontSize: 7,
      letterSpacing: 0.56,
      textTransform: "uppercase",
      color: INK_SOFT,
      marginBottom: 1,
    },
    ref: { fontFamily: PDF_FONTS.mono, fontSize: 12, letterSpacing: 0.72 },
    type: {
      fontFamily: PDF_FONTS.mono,
      fontSize: 7,
      letterSpacing: 0.56,
      textTransform: "uppercase",
      backgroundColor: ink.stickerFill,
      color: ink.stickerText,
      borderWidth: 1,
      borderColor: ink.stickerFill,
      borderStyle: "solid",
      paddingVertical: 2,
      paddingHorizontal: 6,
    },

    section: { paddingTop: 7 },
    sectionTitle: {
      fontFamily: PDF_FONTS.mono,
      fontSize: 7.5,
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: ink.inkText,
      marginBottom: 1,
    },

    row: {
      flexDirection: "row",
      gap: 8,
      paddingVertical: 2,
      borderBottomWidth: 1,
      borderBottomColor: PAPER_EDGE,
      borderBottomStyle: "solid",
    },
    rowLabel: {
      width: 108,
      flexShrink: 0,
      fontFamily: PDF_FONTS.mono,
      fontSize: 7.5,
      color: INK_SOFT,
      paddingTop: 1.5,
    },
    rowValue: { flex: 1, fontSize: 9.5 },

    tags: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
    tag: {
      fontSize: 7.5,
      borderWidth: 1,
      borderColor: INK_BLACK,
      borderStyle: "solid",
      borderRadius: 6,
      paddingVertical: 1,
      paddingHorizontal: 5,
    },
    none: { color: INK_SOFT },

    footer: {
      // Pushed to the foot of the sheet, so a short record does not leave the
      // verse floating in the middle of the page.
      marginTop: "auto",
      paddingTop: 7,
      borderTopWidth: 2,
      borderTopColor: INK_BLACK,
      borderTopStyle: "solid",
    },
    verse: {
      fontFamily: PDF_FONTS.serif,
      fontStyle: "italic",
      fontSize: 11,
    },
    verseRef: {
      fontFamily: PDF_FONTS.mono,
      fontSize: 7,
      letterSpacing: 0.56,
      color: INK_SOFT,
      marginTop: 2,
    },
    footNote: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 10,
      fontFamily: PDF_FONTS.mono,
      fontSize: 7,
      letterSpacing: 0.56,
      textTransform: "uppercase",
      color: INK_SOFT,
    },
  });
}

function Row({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof sheet>;
}) {
  return (
    <View style={styles.row} wrap={false}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function TagRow({
  label,
  values,
  list,
  styles,
}: {
  label: string;
  values: string[];
  list: readonly { value: string; label: string }[];
  styles: ReturnType<typeof sheet>;
}) {
  return (
    <View style={styles.row} wrap={false}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={[styles.rowValue, styles.tags]}>
        {values.length === 0 ? (
          <Text style={styles.none}>None given</Text>
        ) : (
          values.map((v) => (
            <Text key={v} style={styles.tag}>
              {labelFor(list, v)}
            </Text>
          ))
        )}
      </View>
    </View>
  );
}

export default function RegistrationPdf({
  member,
  logo,
  season,
}: {
  member: SavedMember;
  /** The brand mark, parsed from public/brand/ by lib/pdf/logo.ts. */
  logo: PdfLogo;
  season: Season;
}) {
  const styles = sheet(season);
  const ink = SEASON_INK[season];
  const isUpdate = member.membership_status === "updated";
  const hasGuardian = Boolean(member.guardian_name || member.guardian_phone);
  const mark = logoBox(logo.viewBox, 46);

  return (
    <Document
      title={`${member.reference_id} · LYG member registration`}
      author="Lourdes Youth Group, CTM Parish"
      subject="LYG member registration"
      language="en-IN"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed={false}>
          <Svg viewBox={logo.viewBox} style={{ width: mark.width, height: mark.height }}>
            {logo.groups.map((g, i) => (
              <G key={i} transform={g.transform}>
                <Path d={g.d} fill={g.role === "accent" ? ink.ink : INK_BLACK} />
              </G>
            ))}
          </Svg>
          <View>
            <Text style={styles.org}>Lourdes Youth Group</Text>
            <Text style={styles.parish}>CTM Parish · Ahmedabad</Text>
            <Text style={styles.docTitle}>Member Registration</Text>
          </View>
        </View>

        <View style={styles.band}>
          <View>
            <Text style={styles.refLabel}>Reference</Text>
            <Text style={styles.ref}>{member.reference_id}</Text>
          </View>
          <Text style={styles.type}>{isUpdate ? "Updated Details" : "New Member"}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Registration</Text>
          <Row label="Registered on" value={longDate(member.created_at)} styles={styles} />
          {isUpdate ? (
            <Row label="Details updated on" value={dateAndTime(member.updated_at)} styles={styles} />
          ) : null}
          <Row
            label="Joined in"
            value={`${seasonLabel[member.join_season as Season] ?? member.join_season}, ${member.join_year}`}
            styles={styles}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Member</Text>
          <Row label="Full name" value={member.full_name} styles={styles} />
          <Row label="Date of birth" value={plainDate(member.dob)} styles={styles} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <Row label="Mobile / WhatsApp" value={formatIndianMobile(member.phone)} styles={styles} />
          {member.email ? <Row label="Email" value={member.email} styles={styles} /> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Community</Text>
          <Row label="Area" value={member.area} styles={styles} />
          {member.community ? (
            <Row label="Community" value={member.community} styles={styles} />
          ) : null}
          <Row label="Parish" value="CTM Parish" styles={styles} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Study and work</Text>
          <Row label="Currently" value={statusLabel(member.current_status)} styles={styles} />
          {member.institution_or_workplace ? (
            <Row label="Where" value={member.institution_or_workplace} styles={styles} />
          ) : null}
          <Row
            label="Previous youth group"
            value={member.previous_youth_group ? "Yes" : "No"}
            styles={styles}
          />
          {member.previous_youth_group_details ? (
            <Row label="Details" value={member.previous_youth_group_details} styles={styles} />
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests and skills</Text>
          <TagRow
            label="Interested in"
            values={member.interests}
            list={INTERESTS}
            styles={styles}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Purpose and involvement</Text>
          <TagRow label="Hoping to" values={member.purpose} list={PURPOSE} styles={styles} />
        </View>

        {hasGuardian ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Parent or guardian</Text>
            <Row label="Name" value={member.guardian_name ?? "—"} styles={styles} />
            <Row
              label="Mobile"
              value={member.guardian_phone ? formatIndianMobile(member.guardian_phone) : "—"}
              styles={styles}
            />
            <Row
              label="Consent"
              value={member.guardian_consent ? "Given" : "Not given"}
              styles={styles}
            />
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Guidelines</Text>
          <Row label="Accepted" value={dateAndTime(member.guidelines_accepted_at)} styles={styles} />
          <Row label="Version" value={member.consent_version} styles={styles} />
        </View>

        <View style={styles.footer} wrap={false}>
          <Text style={styles.verse}>{JOHN_15_15.text}</Text>
          <Text style={styles.verseRef}>{JOHN_15_15.reference}</Text>
          <View style={styles.footNote}>
            <Text>Lourdes Youth Group · CTM Parish, Ahmedabad</Text>
            <Text>For LYG committee use</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
