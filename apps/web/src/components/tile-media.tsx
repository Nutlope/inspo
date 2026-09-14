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
  const [ready, setReady] = useState(false);

  /* The full-page image is fetched only once the user actually hovers,
     so a grid nobody touches costs nothing beyond the resting frames.
     After that the CSS :hover state drives every show/hide cycle for
     free - no React state per hover. */
  const activate = useCallback(() => {
    setActivated((a) => a || true);
  }, []);

  /* The scroll must not start until the image can actually paint.
     The <img> mounts into a parent that is ALREADY :hover, so the
     keyframes begin at insertion - but the bytes are still in flight.
     By the time the first frame paints, the animation clock has run
     several hundred ms and the image appears mid-page: the hero and
     the section under it are skipped. On the second hover the file is
     decoded, paint and animation coincide, and it looks fine - which
     is why this only ever showed up on the first hover.

     So gate the whole rule on `is-ready` and set it only after decode
     resolves. If the cursor left in the meantime, `.group:hover` no
     longer matches and nothing plays; if it is still there, the rule
     starts applying now and the animation runs from its first frame. */
  const markReady = useCallback((el: HTMLImageElement | null) => {
    if (!el) return;
    const done = () => setReady(true);
    const decode = () => el.decode().then(done, done);
    if (el.complete) {
      decode();
      return;
    }
    el.addEventListener("load", decode, { once: true });
    el.addEventListener("error", done, { once: true });
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
          { }
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
          { }
          <img
            ref={markReady}
            src={fullPageUrl}
            alt=""
            aria-hidden
            /* Mounted only on hover, so there is nothing to defer: lazy
               would just add a beat before the fetch even starts. */
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className={`hover-scroll-img${ready ? " is-ready" : ""}`}
          />
        </picture>
      ) : null}

      {children}
    </div>
  );
}
