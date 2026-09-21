// Copied from .claude/skills/ordinary-time/references/fonts.ts. Load the Ordinary Time fonts once, then add the variables to <html>.
import { Bricolage_Grotesque, Instrument_Serif, Caveat } from "next/font/google";
import { Geist, Geist_Mono } from "next/font/google";

export const bricolage = Bricolage_Grotesque({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-bricolage", display: "swap" });
export const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument", display: "swap" });
export const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
export const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
export const caveat = Caveat({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-caveat", display: "swap" });

export const fontVars = [bricolage, instrument, geist, geistMono, caveat].map((f) => f.variable).join(" ");
