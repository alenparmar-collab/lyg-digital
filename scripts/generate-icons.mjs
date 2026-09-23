/**
 * Renders the home-screen icons from the one-ink LYG mark.
 *
 * The one-ink file is the right source: below about 40px the two-ink
 * separation turns to mud, and a home-screen icon is read at 40px or less on
 * most phones. The mark sits on unfilled paper, never on a panel of ink,
 * because the cross at its centre is negative space.
 *
 *   npm run icons:app
 */

import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const root = process.cwd();
const BRAND = path.join(root, "public", "brand", "lyg-logo-one-ink.svg");
const OUT = path.join(root, "public", "icons");

const PAPER = "#F4EFE4";
const INK = "#2447A8"; // the constant Marian blue, as app/icon.svg already uses

/**
 * size    pixel square to render
 * inset   share of the square left as paper around the mark. Maskable icons
 *         are cropped to a circle by Android, so they need the safe margin.
 */
const ICONS = [
  { file: "icon-192.png", size: 192, inset: 0.06 },
  { file: "icon-512.png", size: 512, inset: 0.06 },
  { file: "icon-maskable-512.png", size: 512, inset: 0.2 },
  { file: "apple-icon-180.png", size: 180, inset: 0.1 },
];

const raw = fs.readFileSync(BRAND, "utf8");
const inner = raw
  .slice(raw.indexOf(">", raw.indexOf("<svg")) + 1, raw.lastIndexOf("</svg>"))
  .replace(/<script[\s\S]*?<\/script>/gi, "")
  .replace(/\son\w+="[^"]*"/gi, "")
  .replaceAll("var(--logo-ink, #1B1A17)", INK)
  .replaceAll("var(--logo-accent, #2447A8)", INK);
const viewBox = /viewBox="([^"]+)"/.exec(raw)?.[1];
if (!viewBox) throw new Error("the one-ink logo has no viewBox");

fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? undefined,
});

for (const { file, size, inset } of ICONS) {
  const page = await browser.newPage({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });
  const pad = Math.round(size * inset);
  await page.setContent(
    `<!doctype html><html><body style="margin:0;background:${PAPER}">
       <div style="width:${size}px;height:${size}px;display:grid;place-items:center;padding:${pad}px;box-sizing:border-box">
         <svg viewBox="${viewBox}" width="${size - pad * 2}" height="${size - pad * 2}">${inner}</svg>
       </div>
     </body></html>`,
    { waitUntil: "load" },
  );
  await page.screenshot({ path: path.join(OUT, file), omitBackground: false });
  const { size: bytes } = fs.statSync(path.join(OUT, file));
  console.log(`${file.padEnd(24)} ${size}x${size}  ${String(bytes).padStart(6)} bytes`);
  await page.close();
}

await browser.close();
console.log(`\n${ICONS.length} icons written to public/icons`);
