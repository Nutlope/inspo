"use client";

/**
 * The <picture> for a tile, with graceful failure. If every source
 * 404s (e.g. a freshly-captured site whose images aren't on Blob yet,
 * pre-upload), the <img> onError hides the element so the parent's
 * LQIP / palette-gradient background shows through instead of the
 * browser's broken-image glyph.
 *
 * Split out of ScreenTile (which stays a server component for the 60×
 * hydration win) — this is the one piece that genuinely needs client
 * behaviour. It's tiny, so the per-tile hydration cost is negligible.
 */

import { useState } from "react";
import type { RoleVariants } from "@inspo/shared";

function buildSrcSet(entries: { w: number; url: string }[]): string {
  return entries.map((e) => `${e.url} ${e.w}w`).join(", ");
}

export function TileImage({
  variants,
  fallbackSrc,
  alt,
  sizes,
  priority = false,
}: {
  variants?: RoleVariants;
  fallbackSrc: string;
  alt: string;
  sizes: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  // Hidden on total load failure → parent bg (LQIP / palette gradient)
  // is what the user sees. Tasteful, never a broken glyph.
  if (failed) return null;

  return (
    <picture>
      {variants?.avif?.length ? (
        <source type="image/avif" srcSet={buildSrcSet(variants.avif)} sizes={sizes} />
      ) : null}
      {variants?.webp?.length ? (
        <source type="image/webp" srcSet={buildSrcSet(variants.webp)} sizes={sizes} />
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={fallbackSrc}
        alt={alt}
        className="h-full w-full object-cover"
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        // @ts-expect-error — fetchpriority is valid HTML, React types lag
        fetchpriority={priority ? "high" : undefined}
        onError={() => setFailed(true)}
      />
    </picture>
  );
}
