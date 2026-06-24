/**
 * Colour math - hex → OKLAB → perceptual distance.
 *
 * Shared across @inspo/web (palette UI, `?hex=` filter) and
 * @inspo/mcp (`find_by_color` tool). Lives here so both consume the
 * same conversion + distance function rather than drifting copies.
 *
 * Distance is Euclidean in OKLAB - the colour space where Euclidean
 * distance best correlates with perceived difference. Threshold
 * defaults are tuned by spot-checking the catalogue: looser than
 * 0.10 (too strict on warm-paper palettes), tighter than 0.20 (which
 * starts matching half the archive on bright accent hex).
 *
 * Source: Björn Ottosson's Oklab matrices (2020), CSS Color 4.
 */

export interface OkLab {
  L: number;
  a: number;
  b: number;
}
export interface OkLch {
  L: number;
  C: number;
  h: number;
}

export function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  let h = m[1]!;
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function toLinear(v: number): number {
  const n = v / 255;
  return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
}

export function rgbToOklab(r: number, g: number, b: number): OkLab {
  const rl = toLinear(r);
  const gl = toLinear(g);
  const bl = toLinear(b);
  const l_ = Math.cbrt(0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl);
  const m_ = Math.cbrt(0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl);
  const s_ = Math.cbrt(0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl);
  return {
    L: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  };
}

export function oklabToOklch(lab: OkLab): OkLch {
  const C = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
  const hRaw = (Math.atan2(lab.b, lab.a) * 180) / Math.PI;
  return { L: lab.L, C, h: hRaw < 0 ? hRaw + 360 : hRaw };
}

export function hexToOklab(hex: string): OkLab | null {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToOklab(rgb[0]!, rgb[1]!, rgb[2]!) : null;
}

export function hexToOklch(hex: string): OkLch | null {
  const lab = hexToOklab(hex);
  return lab ? oklabToOklch(lab) : null;
}

export function formatOklch(hex: string): string | null {
  const c = hexToOklch(hex);
  if (!c) return null;
  return `oklch(${(c.L * 100).toFixed(1)}% ${c.C.toFixed(3)} ${c.h.toFixed(0)})`;
}

export function colorDistanceHex(a: string, b: string): number {
  const la = hexToOklab(a);
  const lb = hexToOklab(b);
  if (!la || !lb) return Infinity;
  const dL = la.L - lb.L;
  const da = la.a - lb.a;
  const db = la.b - lb.b;
  return Math.sqrt(dL * dL + da * da + db * db);
}

export function paletteDistance(target: string, palette: string[]): number {
  if (!palette.length) return Infinity;
  let best = Infinity;
  for (const p of palette) {
    const d = colorDistanceHex(target, p);
    if (d < best) best = d;
  }
  return best;
}

export const HEX_FAMILY_THRESHOLD = 0.15;

export function normalizeHex(input: string): string | null {
  const rgb = hexToRgb(input);
  if (!rgb) return null;
  const [r, g, b] = rgb;
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}
