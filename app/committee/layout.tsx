import type { Metadata } from "next";

/**
 * Committee pages are never indexed, never cached and always rendered per
 * request, so nothing lingers after a logout or comes back with the back
 * button.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "LYG committee",
  robots: { index: false, follow: false, nocache: true },
};

export default function CommitteeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
