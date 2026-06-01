/**
 * Re-export of the shared colour math. Web-side callers continue to
 * `import from "@/lib/color"` so we don't churn every component when
 * the implementation moves. Keep this file as a passthrough; if the
 * web needs web-only helpers later, add them here and keep the
 * shared maths in @inspo/shared.
 */

export {
  HEX_FAMILY_THRESHOLD,
  colorDistanceHex,
  formatOklch,
  hexToOklab,
  hexToOklch,
  hexToRgb,
  normalizeHex,
  oklabToOklch,
  paletteDistance,
  rgbToOklab,
} from "@inspo/shared";
export type { OkLab, OkLch } from "@inspo/shared";
