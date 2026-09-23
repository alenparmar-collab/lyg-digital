/**
 * Renders sample registration PDFs from fabricated records.
 *
 * Every member here is invented. The script never touches Supabase and never
 * reads a real row, so it can be run on any machine, in CI, or with no database
 * configured at all. It exists so the PDF can be checked without going through
 * a public page or a real registration.
 *
 *   npx tsx scripts/generate-sample-pdfs.tsx [outDir]
 */

import fs from "node:fs";
import path from "node:path";
import { renderToFile } from "@react-pdf/renderer";
import RegistrationPdf, { pdfFileName, registerPdfFonts } from "@/components/pdf/RegistrationPdf";
import { parseLogoSvg } from "@/lib/pdf/logo";
import type { SavedMember } from "@/lib/registration/member";
import { getSeason } from "@/lib/season";

const root = process.cwd();
const outDir = process.argv[2] ?? path.join(root, "tmp", "sample-pdfs");

const base: SavedMember = {
  reference_id: "LYG-2026-0001",
  full_name: "Sample Adult",
  dob: "2001-04-12",
  phone: "+919812345670",
  email: null,
  area: "Naranpura East",
  community: "St Joseph's Community",
  current_status: "working",
  institution_or_workplace: "A Sample Office",
  previous_youth_group: false,
  previous_youth_group_details: null,
  interests: [],
  purpose: [],
  guardian_name: null,
  guardian_phone: null,
  guardian_consent: null,
  join_season: "ordinary",
  join_year: 2026,
  membership_status: "new",
  guidelines_accepted_at: "2026-09-21T09:15:00.000Z",
  consent_version: "2026-09-v1",
  created_at: "2026-09-21T09:15:00.000Z",
  updated_at: "2026-09-21T09:15:00.000Z",
};

const samples: { name: string; member: SavedMember }[] = [
  {
    name: "adult",
    member: {
      ...base,
      reference_id: "LYG-2026-0001",
      full_name: "Maria D'Souza",
      email: "maria.sample@example.com",
      interests: ["music", "choir", "liturgy", "social_service"],
      purpose: ["grow_in_faith", "serve_others"],
      previous_youth_group: true,
      previous_youth_group_details: "Two years with the parish youth group in Vadodara.",
    },
  },
  {
    name: "under-18",
    member: {
      ...base,
      reference_id: "LYG-2026-0002",
      full_name: "Liam Fernandes",
      dob: "2011-03-08",
      phone: "+919812345671",
      area: "Ghatlodia",
      community: null,
      current_status: "school",
      institution_or_workplace: "St Xavier's High School",
      interests: ["sports", "technology"],
      purpose: ["find_community", "join_activities"],
      guardian_name: "Anita Fernandes",
      guardian_phone: "+919812345672",
      guardian_consent: true,
    },
  },
  {
    name: "updated",
    member: {
      ...base,
      reference_id: "LYG-2026-0003",
      full_name: "Rohan Patel",
      phone: "+919812345673",
      email: "rohan.sample@example.com",
      area: "Vastrapur",
      community: "Our Lady's Community",
      current_status: "college",
      institution_or_workplace: "Sample College of Commerce",
      interests: ["media", "photography", "video", "graphic_design", "public_speaking"],
      purpose: ["go_deeper", "find_direction", "serve_others"],
      membership_status: "updated",
      updated_at: "2026-09-21T14:40:00.000Z",
    },
  },
];

async function main() {
  registerPdfFonts(path.join(root, "public", "fonts"));
  const logo = parseLogoSvg(
    fs.readFileSync(path.join(root, "public", "brand", "lyg-logo-two-ink.svg"), "utf8"),
  );
  const season = getSeason();

  fs.mkdirSync(outDir, { recursive: true });

  for (const { name, member } of samples) {
    const file = path.join(outDir, `${name}--${pdfFileName(member)}`);
    await renderToFile(<RegistrationPdf member={member} logo={logo} season={season} />, file);
    const { size } = fs.statSync(file);
    console.log(`${name.padEnd(9)} ${member.reference_id}  ${String(size).padStart(7)} bytes  ${file}`);
  }

  console.log(`\nSeason used: ${season}`);
  console.log(`${samples.length} sample PDFs written to ${outDir}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
