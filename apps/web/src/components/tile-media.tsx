"use client";

/**
 * Everything inside a tile's image box: the resting frame, the
 * hover-scroll reveal, and the page-pager arrows.
 *
 * These three used to be separate, which is how they drifted apart.
 * The resting frame rendered `thumbVariants` - a 768x1024 PORTRAIT
 * tablet capture - inside a 16:10 box with `object-fit: cover` and a
 * centred origin, so every tile showed a magnified middle slice of the
 * page. Hovering then swapped in a 16:10 image, which read as the tile
 * abruptly zooming out onto a different screenshot. Same site, two
 * framings, no relationship between them.
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
 * full-page image IS the hero image. The hover now begins on the exact
 * frame the tile was already showing and scrolls away from it, which is
 * the effect that was intended all along.
 *
 * The pager reuses the same contract: paging to another page of the
 * site swaps in that page's hero, and its hover-scroll uses that page's
 * full capture. Sibling pages are fetched once, on first hover.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { RoleVariants } from "@inspo/shared";

type SitePage = {
  slug: string;
  pageType: string;
  imageUrl: string;
  heroVariants?: RoleVariants;
  fullPageUrl: string;
  fullVariants?: RoleVariants;
};

const FULL_SIZES =
  "(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw";

function buildSrcSet(entries: { w: number; url: string }[]): string {
  return entries.map((e) => `${e.url} ${e.w}w`).join(", ");
}

/** Shared by the resting frame and the hover layer. `object-position:
 *  50% 0%` is the whole trick - it is what makes the two agree. */
const FRAME_CLASS = "absolute inset-0 h-full w-full object-cover object-top";

export function TileMedia({
  siteSlug,
  imageUrl,
  heroVariants,
  fullPageUrl,
  fullVariants,
  alt,
  title,
  sizes,
  priority = false,
  hoverScroll = false,
  pageCount = 1,
  durationMs = 5500,
  children,
}: {
  siteSlug: string;
  imageUrl: string;
  heroVariants?: RoleVariants;
  fullPageUrl?: string;
  fullVariants?: RoleVariants;
  alt: string;
  /** Just the site name. The arrows' accessible names are built from
   *  this rather than from `alt`, which on the archive is
   *  "<title> - <description>" with an empty description, so reusing it
   *  gave screen readers "Next page of Algolia - ". */
  title: string;
  sizes: string;
  priority?: boolean;
  hoverScroll?: boolean;
  /** Pages captured for this site. Arrows appear only when > 1. */
  pageCount?: number;
  durationMs?: number;
  /** The tile's link overlay. It has to be rendered INSIDE this
   *  component, not as a sibling above it: an overlay sibling covers
   *  this element, and `pointerenter` does not fire for an element the
   *  cursor never actually enters. Nesting it here means one hover
   *  region owns the images, the link and the arrows. */
  children?: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  const [activated, setActivated] = useState(false);
  const [pages, setPages] = useState<SitePage[] | null>(null);
  const [idx, setIdx] = useState(0);
  const fetchedRef = useRef(false);

  const multi = pageCount > 1;

  /* First hover does two things: mounts the hover-scroll layer (so the
     full-page image is never fetched for tiles nobody touches) and
     warms the sibling-page list, so an arrow click has data already. */
  const activate = useCallback(() => {
    if (!activated) setActivated(true);
    if (!multi || fetchedRef.current) return;
    fetchedRef.current = true;
    fetch(`/api/site-pages/${siteSlug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.pages?.length > 1) setPages(d.pages as SitePage[]);
      })
      .catch(() => {
        /* Arrows simply stay hidden - the tile is still a tile. */
      });
  }, [activated, multi, siteSlug]);

  const total = pages?.length ?? 0;
  const step = useCallback(
    (delta: number) => {
      if (!total) return;
      setIdx((i) => (i + delta + total) % total);
    },
    [total],
  );

  /* Reset to the site's own hero when the pointer leaves, so a grid of
     tiles never ends up in a jumble of half-remembered states. */
  const reset = useCallback(() => setIdx(0), []);

  /* Left/right arrows while the tile has focus-within. Bound to the
     wrapper rather than the document so several tiles never fight. */
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!total) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        e.stopPropagation();
        step(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        e.stopPropagation();
        step(-1);
      }
    },
    [step, total],
  );

  const current = pages?.[idx];
  // Page 0 is always the server-rendered hero: no flash, no refetch.
  const showingSibling = idx > 0 && !!current;

  const restingVariants = showingSibling ? current.heroVariants : heroVariants;
  const restingSrc = showingSibling ? current.imageUrl : imageUrl;
  const scrollUrl = showingSibling ? current.fullPageUrl : fullPageUrl;
  const scrollVariants = showingSibling ? current.fullVariants : fullVariants;

  return (
    <div
      className="hover-scroll absolute inset-0"
      onPointerEnter={activate}
      onPointerLeave={reset}
      onFocus={activate}
      onKeyDown={onKeyDown}
      style={{ ["--hover-scroll-duration" as string]: `${durationMs}ms` }}
    >
      {/* Resting frame. Keyed on the source so paging swaps cleanly
          rather than leaving a stale decode on screen. */}
      {!failed && (
        <picture key={restingSrc}>
          {restingVariants?.avif?.length ? (
            <source
              type="image/avif"
              srcSet={buildSrcSet(restingVariants.avif)}
              sizes={sizes}
            />
          ) : null}
          {restingVariants?.webp?.length ? (
            <source
              type="image/webp"
              srcSet={buildSrcSet(restingVariants.webp)}
              sizes={sizes}
            />
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={restingSrc}
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
      {hoverScroll && activated && scrollUrl ? (
        <picture key={scrollUrl}>
          {scrollVariants?.avif?.length ? (
            <source
              type="image/avif"
              srcSet={buildSrcSet(scrollVariants.avif)}
              sizes={FULL_SIZES}
            />
          ) : null}
          {scrollVariants?.webp?.length ? (
            <source
              type="image/webp"
              srcSet={buildSrcSet(scrollVariants.webp)}
              sizes={FULL_SIZES}
            />
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={scrollUrl}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            className="hover-scroll-img"
          />
        </picture>
      ) : null}

      {/* The link overlay, beneath the arrows in stacking order. */}
      {children}

      {/* Pager. Only once the sibling list is in hand, so the arrows
          never appear on a tile that cannot honour them. */}
      {total > 1 && (
        <>
          <PagerButton
            side="left"
            label={`Previous page of ${title}`}
            onClick={() => step(-1)}
          />
          <PagerButton
            side="right"
            label={`Next page of ${title}`}
            onClick={() => step(1)}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-2 z-20 -translate-x-1/2 rounded-full border border-[color-mix(in_oklab,var(--color-fg)_12%,transparent)] bg-[color-mix(in_oklab,var(--color-bg)_70%,transparent)] px-2 py-[3px] font-mono text-[10px] leading-none tracking-normal text-[var(--color-fg-muted)] opacity-0 backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
          >
            {idx + 1}/{total}
          </span>
        </>
      )}
    </div>
  );
}

/**
 * One arrow.
 *
 * Deliberately quiet: the screenshot is the content and the control is
 * furniture. A 32px disc at 70% ground with a hairline reads as glass
 * over the image rather than as a button parked on top of it, and it
 * firms up to full opacity only under the cursor. Sits above the tile's
 * link overlay so a click pages instead of navigating.
 */
function PagerButton({
  side,
  label,
  onClick,
}: {
  side: "left" | "right";
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={`absolute top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[color-mix(in_oklab,var(--color-fg)_12%,transparent)] bg-[color-mix(in_oklab,var(--color-bg)_70%,transparent)] text-[var(--color-fg)] opacity-0 shadow-[0_1px_6px_-2px_rgba(0,0,0,0.25)] backdrop-blur-md transition-[opacity,background-color] duration-200 ease-out hover:bg-[color-mix(in_oklab,var(--color-bg)_92%,transparent)] focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-link)] group-hover:opacity-100 group-focus-within:opacity-100 ${
        side === "left" ? "left-2" : "right-2"
      }`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d={side === "left" ? "m14 6-6 6 6 6" : "m10 6 6 6-6 6"} />
      </svg>
    </button>
  );
}
