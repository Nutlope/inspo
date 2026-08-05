/**
 * The three diversification axes, measured from data every catalogue
 * row already carries.
 *
 * This replaces the old `hallmarkTheme` tag. That tag named a theme
 * from one version of one design skill, was written by the LLM tagger
 * (so it cost tokens and drifted), and went stale the moment the skill
 * renamed a theme. Two of its twelve names no longer exist anywhere.
 *
 * The axes are better on every count that matters here:
 *
 *   - Orthogonal. Three independent dimensions instead of one enum, so
 *     "dark but warm" and "dark but cool" stop collapsing together.
 *   - Free. Paper band and accent hue are pure arithmetic over the
 *     palette; only the display class needs a lookup, and that lookup
 *     is a pure function of the font name. No model call, no drift.
 *   - Version-independent. They describe the design, not somebody's
 *     name for the design.
 *
 * They are also the exact vocabulary a design skill's own rotation and
 * custom-system rituals speak, which is the point: an agent asks Inspo
 * what a genre actually looks like along these three, then takes a
 * deliberate position with or against that measurement.
 */

import type {
  AccentHueBand,
  DisplayClass,
  Mode,
  PaperBand,
} from "@inspo/taxonomy";
import { hexToOklch } from "./color";

export type Axes = {
  paperBand: PaperBand;
  displayClass: DisplayClass;
  accentHue: AccentHueBand;
  /** Median lightness of the capture, 0-100. Measured from the row's
   *  LQIP where one exists; a coarse guess from `mode` where none
   *  does. */
  paperL: number;
  /** OKLCH hue angle of the accent, 0-360. Null when the accent is
   *  neutral (there is no meaningful angle on a grey). */
  accentDeg: number | null;
  /** The font the display class was read off, for auditability. Null
   *  when the row carried no usable font data. */
  displayFace: string | null;
};

/* ────────────────────────── paper band ────────────────────────── */

/** Bands per the design-skill contract: dark < 30% L, mid 30-85%,
 *  light > 85%. */
function bandOf(L100: number): PaperBand {
  if (L100 < 30) return "dark";
  if (L100 <= 85) return "mid";
  return "light";
}

/**
 * Fallback surface lightness, used only when no measured value is
 * available.
 *
 * The good number comes from the row's LQIP: decode the thumbnail and
 * take the median pixel lightness. That is the actual page. This
 * function is what runs when there is no LQIP to decode, and it is a
 * guess, because neither of its inputs is trustworthy on its own:
 *
 *   - `palette` is a saturated-colour extraction, not a frequency
 *     ranking. Linear's palette is gold and olive; its page is nearly
 *     black. The background is simply not in there.
 *   - `mode` is tagged, and wrong often enough to matter: linear.app
 *     and vercel.com are both tagged `light`.
 *
 * So this returns the coarse band `mode` implies and nothing finer.
 * Callers that can measure should measure.
 */
function fallbackPaperL(mode: Mode): number {
  return mode === "dark" ? 12 : 97;
}

/* ────────────────────────── accent hue ────────────────────────── */

/** Below this chroma a colour reads as a grey, and its hue angle is
 *  noise rather than signal. Matches the skill contract's threshold. */
const NEUTRAL_CHROMA = 0.05;

function accentOf(palette: string[]): { band: AccentHueBand; deg: number | null } {
  let best: { C: number; h: number } | null = null;
  for (const hex of palette) {
    const c = hexToOklch(hex);
    if (!c) continue;
    if (!best || c.C > best.C) best = { C: c.C, h: c.h };
  }
  if (!best || best.C < NEUTRAL_CHROMA) return { band: "neutral", deg: null };
  const h = best.h;
  // Warm 10-60, cool 200-300, everything else chromatic-other. The
  // exact angle rides along so a caller can sub-tag ("chromatic-moss
  // ~140") the way the skill contract asks.
  if (h >= 10 && h <= 60) return { band: "warm", deg: h };
  if (h >= 200 && h <= 300) return { band: "cool", deg: h };
  return { band: "chromatic-other", deg: h };
}

/* ──────────────────────── display class ───────────────────────── */

/** Stack fallbacks and generic families. These are what a site names
 *  when it has NOT chosen a face, so they can never be the display
 *  face unless nothing else is on offer. */
const GENERIC = new Set([
  "sans-serif",
  "serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui",
  "ui-sans-serif",
  "ui-serif",
  "ui-monospace",
  "ui-rounded",
  "-apple-system",
  "blinkmacsystemfont",
  "segoe ui",
  "apple color emoji",
  "segoe ui emoji",
  "twemoji country flags",
  "inherit",
  "initial",
  "unset",
  "arial",
  "helvetica",
  "helvetica neue",
  "roboto",
  "times",
  "times new roman",
]);

/**
 * Name-pattern classifier, ordered most-specific first.
 *
 * A lookup table over 837 distinct families would be mostly tail and
 * mostly wrong within a month of new captures. Patterns generalise:
 * anything with "Mono" in the name IS a mono, whether or not we have
 * seen it before. The fallback is `grotesk-sans` because the neo-
 * grotesque is the default of the modern web, so it is the guess that
 * is right most often when nothing else fires.
 */
const PATTERNS: ReadonlyArray<[RegExp, DisplayClass]> = [
  [/mono|\bcode\b|courier|consolas|menlo|iosevka|hack\b/i, "mono"],
  [/script|handwrit|brush|caveat|pacifico|marker|dancing/i, "handwritten"],
  [/condensed|\bcond\b|narrow|compressed|extended.*bold/i, "display-condensed-bold"],
  [/slab|rockwell|zilla|museo slab|clarendon|courier slab/i, "slab-serif"],
  [/\b(black|heavy|ultra|fat|poster|playbill)\b/i, "display-heavy"],
  [/italic|oblique/i, "italic-serif"],
  [
    /serif|times|georgia|garamond|caslon|baskerville|playfair|didot|bodoni|minion|freight|tiempos|canela|newsreader|charter|lora|merriweather|crimson|spectral|literata|kansas|plantin|goudy|etbook|ambroise|chercan|reith serif|karnak|mackinac|fraunces|instrument serif|young serif|source serif|pt serif/i,
    "roman-serif",
  ],
  [
    /futura|avenir|poppins|montserrat|circular|geist|geometr|century gothic|jost|questrial|sora|urbanist|outfit|gilroy|nunito|museo sans|dm sans|figtree|manrope|plus jakarta|sofia|proxima|azo|gravity|lemonmilk/i,
    "geometric-sans",
  ],
];

export function classifyDisplayFace(face: string): DisplayClass {
  const f = face.trim();
  if (GENERIC.has(f.toLowerCase())) return "system-native";
  for (const [re, cls] of PATTERNS) if (re.test(f)) return cls;
  return "grotesk-sans";
}

/** The display face is the first entry a site actually chose. Font
 *  arrays come off the CSS stack in declaration order, so the head is
 *  the display face and the tail is fallbacks; we skip past generics
 *  rather than trusting position alone. */
export function pickDisplayFace(fonts: string[]): string | null {
  for (const f of fonts) {
    const t = String(f).trim();
    if (t && !GENERIC.has(t.toLowerCase())) return t;
  }
  const first = fonts.map((f) => String(f).trim()).find(Boolean);
  return first ?? null;
}

/* ───────────────────────────── derive ─────────────────────────── */

export type DeriveInput = {
  palette: string[];
  fonts: string[];
  mode: Mode;
  /** Median pixel lightness of the capture, 0-100. Supply it whenever
   *  you can decode the image (see `measurePaperL` in the worker); the
   *  fallback without it is coarse. */
  paperL?: number;
};

/**
 * Measure all three axes for one row.
 *
 * Deliberately pure and dependency-free: no image decoding, no model
 * call, no network. That keeps it usable in the workerd runtime and in
 * the browser, and it means the axes can be recomputed for any row, at
 * any time, from data the row already carries.
 *
 * Safe on empty or malformed input, which matters: about 4% of rows
 * carry no usable font data at all.
 */
export function deriveAxes(input: DeriveInput): Axes {
  const { palette = [], fonts = [], mode, paperL: measured } = input;
  const paperL = measured ?? fallbackPaperL(mode);
  const { band: accentHue, deg: accentDeg } = accentOf(palette);
  const displayFace = pickDisplayFace(fonts);

  return {
    paperBand: bandOf(paperL),
    displayClass: displayFace ? classifyDisplayFace(displayFace) : "system-native",
    accentHue,
    paperL: Math.round(paperL * 10) / 10,
    accentDeg: accentDeg === null ? null : Math.round(accentDeg),
    displayFace,
  };
}

/** The compact form a design skill logs and rotates on:
 *  `dark / grotesk-sans / cool`. Chromatic accents carry their angle,
 *  per the contract's "sub-tag the hue" note. */
export function axesKey(a: Axes): string {
  const accent =
    a.accentHue === "chromatic-other" && a.accentDeg !== null
      ? `chromatic-other (~${a.accentDeg})`
      : a.accentHue;
  return `${a.paperBand} / ${a.displayClass} / ${accent}`;
}
