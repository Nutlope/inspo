"use client";

/**
 * Hover-scroll overlay. Sits absolutely inside a `group` parent (the
 * outer tile) and reveals the full-page screenshot of the site on
 * hover, scrolled from top to bottom over a few seconds.
 *
 * Why this lives as a client component:
 *   - The tile itself is server-rendered for hydration cost reasons
 *     (60 tiles × hydration was a real perf bug, see screen-tile.tsx).
 *   - We can't render the full-page <picture> server-side because
 *     that would force all 60 tiles to fetch their 1440-wide full
 *     PNGs upfront — ~12 MB of dead-weight payload on a viewport
 *     where the user may never hover anything.
 *   - Trick: render nothing until the first pointerenter. The CSS
 *     hover state on the parent `.group` handles every subsequent
 *     show/hide/scroll cycle for free — no React state per hover.
 *
 * The actual scroll animation is driven by `object-position` going
 * from `50% 0%` → `50% 100%`, which the browser interpolates over
 * an image rendered with `object-fit: cover`. No JS-driven timeline,
 * no IntersectionObserver — the cheapest possible mechanism.
 *
 * Respects prefers-reduced-motion via the class rules in globals.css.
 */

import { useState } from "react";
import type { RoleVariants } from "@inspo/shared";

const FULL_SIZES =
  "(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw";

function buildSrcSet(entries: { w: number; url: string }[]): string {
  return entries.map((e) => `${e.url} ${e.w}w`).join(", ");
}

export function HoverScrollOverlay({
  fullUrl,
  fullVariants,
  /** Animation length when scrolling top → bottom on hover. ~5.5 s
   *  feels right for a typical desktop hero (≈ 4–6× the visible tile
   *  height). Shorter sites finish early; taller sites still convey
   *  the bulk of the page within the budget. */
  durationMs = 5500,
}: {
  fullUrl: string;
  fullVariants?: RoleVariants;
  durationMs?: number;
}) {
  const [activated, setActivated] = useState(false);

  function handleEnter() {
    if (!activated) setActivated(true);
  }

  return (
    <div
      className="hover-scroll absolute inset-0"
      onPointerEnter={handleEnter}
      onFocus={handleEnter}
      aria-hidden
      style={{ ["--hover-scroll-duration" as string]: `${durationMs}ms` }}
    >
      {activated && (
        <picture>
          {fullVariants?.avif?.length ? (
            <source
              type="image/avif"
              srcSet={buildSrcSet(fullVariants.avif)}
              sizes={FULL_SIZES}
            />
          ) : null}
          {fullVariants?.webp?.length ? (
            <source
              type="image/webp"
              srcSet={buildSrcSet(fullVariants.webp)}
              sizes={FULL_SIZES}
            />
          ) : null}
          <img
            src={fullUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="hover-scroll-img"
          />
        </picture>
      )}
    </div>
  );
}
