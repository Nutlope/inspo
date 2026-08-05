"use client";

/**
 * A tile's image box: the resting frame and the hover-scroll reveal.
 *
 * The two used to live in separate components, which is how they
 * drifted apart. The resting frame rendered `thumbVariants` - a
 * 768x1024 PORTRAIT tablet capture - inside a 16:10 box with
 * `object-fit: cover` and a centred origin, so every tile showed a
 * magnified middle slice of the page. Hovering then swapped in a 16:10
 * image, which read as the tile abruptly zooming out onto a different
 * screenshot. Same site, two framings, no relationship between them.
 *
 * The fix is to make one rule true for every layer: **every image in
 * this box is 1440 wide and anchored to its top edge.**
 *
 *   resting   hero capture, 1440x900, exactly 16:10 - fills the box
 *             with no crop at all
 *   hover     full-page capture, also 1440 wide, pinned to 50% 0% and
 *             animated downward
 *
 * Because both are captured at the same width, the first 900px of the
 * full-page image IS the hero image. The hover begins on the exact
 * frame the tile was already showing and scrolls away from it, which is
 * the effect that was intended all along.
 */

import { useCallback, useState } from "react";
import type { RoleVariants } from "@inspo/shared";

const FULL_SIZES =
  "(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw";

function buildSrcSet(entries: { w: number; url: string }[]): string {
  return entries.map((e) => `${e.url} ${e.w}w`).join(", ");
}

/** Shared by the resting frame and the hover layer. `object-position:
 *  50% 0%` is the whole trick - it is what makes the two agree. */
const FRAME_CLASS = "absolute inset-0 h-full w-full object-cover object-top";

export function TileMedia({
  imageUrl,
  heroVariants,
  fullPageUrl,
  fullVariants,
  alt,
  sizes,
  priority = false,
  hoverScroll = false,
  durationMs = 5500,
  children,
}: {
  imageUrl: string;
  heroVariants?: RoleVariants;
  fullPageUrl?: string;
  fullVariants?: RoleVariants;
  alt: string;
  sizes: string;
  priority?: boolean;
  hoverScroll?: boolean;
  durationMs?: number;
  /** The tile's link overlay. It has to be rendered INSIDE this
   *  component, not as a sibling above it: an overlay sibling covers
   *  this element, and `pointerenter` does not fire for an element the
   *  cursor never actually enters. */
  children?: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  const [activated, setActivated] = useState(false);

  /* The full-page image is fetched only once the user actually hovers,
     so a grid nobody touches costs nothing beyond the resting frames.
     After that the CSS :hover state drives every show/hide cycle for
     free - no React state per hover. */
  const activate = useCallback(() => {
    setActivated((a) => a || true);
  }, []);

  return (
    <div
      className="hover-scroll absolute inset-0"
      onPointerEnter={activate}
      onFocus={activate}
      style={{ ["--hover-scroll-duration" as string]: `${durationMs}ms` }}
    >
      {!failed && (
        <picture>
          {heroVariants?.avif?.length ? (
            <source
              type="image/avif"
              srcSet={buildSrcSet(heroVariants.avif)}
              sizes={sizes}
            />
          ) : null}
          {heroVariants?.webp?.length ? (
            <source
              type="image/webp"
              srcSet={buildSrcSet(heroVariants.webp)}
              sizes={sizes}
            />
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={alt}
            className={FRAME_CLASS}
            loading={priority ? "eager" : "lazy"}
            decoding={priority ? "sync" : "async"}
            fetchPriority={priority ? "high" : undefined}
            onError={() => setFailed(true)}
          />
        </picture>
      )}

      {/* Hover-scroll layer. Same width, same top anchor, so it begins
          on the frame above it. */}
      {hoverScroll && activated && fullPageUrl ? (
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fullPageUrl}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            className="hover-scroll-img"
          />
        </picture>
      ) : null}

      {children}
    </div>
  );
}
