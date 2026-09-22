import type { Season } from "@/lib/season";

/**
 * The Ordinary Time tokens, as plain values.
 *
 * The PDF is drawn by @react-pdf/renderer, which has no CSS engine and cannot
 * read the custom properties in app/tokens.css. These must therefore be kept in
 * step with that file by hand: if a season ink changes there, change it here.
 */

export const PAPER = "#F4EFE4";
export const PAPER_EDGE = "#D8CDB5";
export const INK_BLACK = "#1B1A17";
export const INK_SOFT = "#55514A";

export type SeasonInk = {
  /** Fills, shapes and large display only. */
  ink: string;
  /** The text-safe version of the same ink. */
  inkText: string;
  /** The pair used by any ink fill that carries a label. */
  stickerFill: string;
  stickerText: string;
};

export const SEASON_INK: Record<Season, SeasonInk> = {
  advent: { ink: "#6A3FA3", inkText: "#5A3290", stickerFill: "#5A3290", stickerText: PAPER },
  // Gold is the season signal, so the fill stays gold and the text flips to black.
  christmas: { ink: "#E6A817", inkText: INK_BLACK, stickerFill: "#E6A817", stickerText: INK_BLACK },
  ordinary: { ink: "#12A05C", inkText: "#0B6B3D", stickerFill: "#0B6B3D", stickerText: PAPER },
  lent: { ink: "#6A3FA3", inkText: "#5A3290", stickerFill: "#5A3290", stickerText: PAPER },
  triduum: { ink: "#C8302A", inkText: "#A3241F", stickerFill: "#A3241F", stickerText: PAPER },
  easter: { ink: "#E6A817", inkText: INK_BLACK, stickerFill: "#E6A817", stickerText: INK_BLACK },
  pentecost: { ink: "#E0402E", inkText: "#A3241F", stickerFill: "#A3241F", stickerText: PAPER },
  lourdes: { ink: "#7FB2F0", inkText: "#2447A8", stickerFill: "#2447A8", stickerText: PAPER },
};

export const PDF_FONTS = {
  display: "Bricolage Grotesque",
  serif: "Instrument Serif",
  body: "Geist",
  mono: "Geist Mono",
} as const;
