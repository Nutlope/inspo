/**
 * Capture-quality gating.
 *
 * `qualityScore` (0-100) and `qualityFlags` are written by the
 * generate-quality vision pass (apps/worker/src/generate-quality.ts).
 * Coverage is incremental: rows WITHOUT a score are treated as clean so
 * an unscored catalogue behaves exactly as before the pass existed.
 *
 * Gating philosophy: nothing is ever hidden from direct access
 * (findScreen / get_screen / get_site_pages stay ungated); low-quality
 * rows are only down-weighted or skipped on DISCOVERY surfaces (search
 * ranking, exemplar picks, similarity candidates).
 */

import type { ScreenSummary } from "@inspo/shared";

/** Scores below this are excluded from exemplar surfaces. */
export const QUALITY_FLOOR = 35;

/** Flags that mean the capture itself is broken, not just mediocre. */
const DAMAGE_FLAGS = new Set([
  "blank-or-loading",
  "error-page",
  "broken-images",
  "nsfw",
]);

export function isDamaged(s: ScreenSummary): boolean {
  return (s.qualityFlags ?? []).some((f) => DAMAGE_FLAGS.has(f));
}

export function isLowQuality(s: ScreenSummary): boolean {
  if (isDamaged(s)) return true;
  return typeof s.qualityScore === "number" && s.qualityScore < QUALITY_FLOOR;
}
