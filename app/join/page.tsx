import JourneyShell from "@/components/journey/JourneyShell";
import { resolveSeason } from "@/lib/season";

export const metadata = {
  title: "Join Lourdes Youth Group · CTM Parish",
};

export default function JoinPage() {
  const season = resolveSeason(null);

  // Jokes stop from Holy Thursday to Holy Saturday.
  return <JourneyShell quiet={season === "triduum"} />;
}
