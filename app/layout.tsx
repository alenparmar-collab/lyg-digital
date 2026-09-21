import type { Metadata, Viewport } from "next";
import "./globals.css";
import { fontVars } from "./fonts";
import { resolveSeason, seasonLabel } from "@/lib/season";

export const metadata: Metadata = {
  title: "Lourdes Youth Group · CTM Parish",
  description:
    "Register with Lourdes Youth Group, the Catholic youth group of CTM Parish, Ahmedabad.",
};

// The season is worked out at render time, so a statically prerendered page
// would freeze whatever season it was built in. Re-render hourly: the ink then
// changes within an hour of midnight in Asia/Kolkata on the day a season turns.
export const revalidate = 3600;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Members zoom. Never lock that away.
  maximumScale: 5,
  themeColor: "#F4EFE4",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // The season is decided on the server so the first paint is already the right
  // ink. Pass a Supabase season_override here once that setting exists.
  const season = resolveSeason(null);

  return (
    <html
      lang="en-IN"
      data-season={season}
      // Light paper only for V1. Dark paper flattens every season's text ink to
      // cream and breaks the printed member record. See tokens.css.
      data-theme="light"
      className={fontVars}
      data-season-name={seasonLabel[season]}
    >
      <body>
        <div className="grain" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
