import fs from "node:fs";
import path from "node:path";

/**
 * The LYG mark: eight figures holding hands, their joined arms forming a cross
 * in the negative space at the centre.
 *
 * The artwork is read from public/brand/ at runtime rather than pasted into
 * this file, so replacing those SVGs with a better trace needs no code change.
 * Never redraw, retrace or tidy the paths, and never recolour beyond the two
 * CSS variables the files expose:
 *   --logo-accent  the figures      -> var(--ink-season), so the ring follows the Church year
 *   --logo-ink     text, inner shapes and the cross -> var(--ink-black)
 *
 * The centre cross is negative space, so the mark only reads on unfilled paper.
 *
 * This is a server component: it touches the filesystem. To use the mark inside
 * a client component, render <Logo /> in the server parent and pass the element
 * down as a prop.
 */

export type LogoVariant = "two-ink" | "one-ink";

type ParsedLogo = { viewBox: string; inner: string };

const cache = new Map<LogoVariant, ParsedLogo>();

function load(variant: LogoVariant): ParsedLogo {
  const cached = cache.get(variant);
  if (cached) return cached;

  const file = path.join(process.cwd(), "public", "brand", `lyg-logo-${variant}.svg`);
  const raw = fs.readFileSync(file, "utf8");

  const viewBox = /viewBox="([^"]+)"/.exec(raw)?.[1];
  const open = raw.indexOf(">", raw.indexOf("<svg"));
  const close = raw.lastIndexOf("</svg>");
  if (!viewBox || open === -1 || close === -1) {
    throw new Error(`public/brand/lyg-logo-${variant}.svg is not an SVG this component can read`);
  }

  // Repo-controlled brand art, but it arrived as a trace from a messaging app,
  // so strip anything executable rather than trust the file shape.
  const inner = raw
    .slice(open + 1, close)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "");

  const parsed = { viewBox, inner };
  cache.set(variant, parsed);
  return parsed;
}

export default function Logo({
  variant = "two-ink",
  width,
  className,
  title = "Lourdes Youth Group, CTM Ahmedabad",
  decorative = false,
}: {
  variant?: LogoVariant;
  /** CSS width. Use the one-ink variant below 40px, where two inks turn to mud. */
  width?: string;
  className?: string;
  title?: string;
  /** true when the mark sits next to the same words in text and would be read twice. */
  decorative?: boolean;
}) {
  const { viewBox, inner } = load(variant);

  return (
    <svg
      viewBox={viewBox}
      className={className}
      style={width ? { width, height: "auto" } : undefined}
      role={decorative ? "presentation" : "img"}
      aria-label={decorative ? undefined : title}
      aria-hidden={decorative || undefined}
      focusable="false"
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}
