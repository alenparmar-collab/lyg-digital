/**
 * Turns the brand SVG into something @react-pdf/renderer can draw.
 *
 * The mark stays a vector in the PDF rather than a rasterised image, so it is
 * sharp at any zoom and at print resolution, and the ring can still take the
 * season ink. The artwork is read from public/brand/ exactly as components/
 * Logo.tsx reads it, so replacing those files needs no change here.
 *
 * Both variants are two <g> elements sharing one transform: the first holds the
 * figures (--logo-accent), the second the text, inner shapes and the cross
 * (--logo-ink).
 */

export type LogoGroup = {
  role: "accent" | "ink";
  transform?: string;
  d: string;
};

export type PdfLogo = { viewBox: string; groups: LogoGroup[] };

export function parseLogoSvg(raw: string): PdfLogo {
  const viewBox = /viewBox="([^"]+)"/.exec(raw)?.[1];
  if (!viewBox) throw new Error("The LYG logo SVG has no viewBox.");

  const groups: LogoGroup[] = [];
  for (const m of raw.matchAll(/<g\b([^>]*)>([\s\S]*?)<\/g>/g)) {
    const attrs = m[1] ?? "";
    const body = m[2] ?? "";
    const d = /<path[^>]*\bd="([^"]+)"/.exec(body)?.[1];
    if (!d) continue;
    groups.push({
      role: /fill="var\(--logo-accent/.test(attrs) ? "accent" : "ink",
      transform: /transform="([^"]+)"/.exec(attrs)?.[1],
      d,
    });
  }

  if (!groups.length) throw new Error("The LYG logo SVG has no drawable paths.");
  return { viewBox, groups };
}

/** Width and height in points for a mark drawn at a given width. */
export function logoBox(viewBox: string, width: number): { width: number; height: number } {
  const [, , vw, vh] = viewBox.split(/[\s,]+/).map(Number);
  if (!vw || !vh) return { width, height: width };
  return { width, height: (width * vh) / vw };
}
