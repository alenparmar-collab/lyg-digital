import Logo from "@/components/Logo";
import JourneyShell from "@/components/journey/JourneyShell";
import { resolveSeason } from "@/lib/season";

export const metadata = {
  title: "Join Lourdes Youth Group · CTM Parish",
};

export default function JoinPage() {
  const season = resolveSeason(null);

  return (
    <JourneyShell
      // Logo reads the SVG from disk, so it renders here on the server and
      // travels into the client wizard as an element.
      logo={<Logo variant="two-ink" width="56px" decorative />}
      season={season}
      // Jokes stop from Holy Thursday to Holy Saturday.
      quiet={season === "triduum"}
    />
  );
}
