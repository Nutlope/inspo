"use client";

/**
 * Gallery tile preview — a live (scaled) iframe of a generated example
 * page that FILLS its bento cell. Unlike <ExamplePreview> (which fixes
 * an aspect ratio for the detail hero), this one measures its container
 * and scales the page to the container width, top-aligned, letting the
 * cell clip the overflow. So a wide 2×1 cell shows a wide band of the
 * hero and a tall phone cell shows a long vertical slice — both crisp.
 *
 *   device="desktop" → renders the page at a 1280px design viewport
 *   device="mobile"  → renders it at a 402px viewport (its real mobile
 *                      layout), proving the example is responsive.
 *
 * Pointer-events are off — the tile is a preview; the wrapping <Link>
 * owns the click. Sandboxed allow-scripts, no same-origin.
 */

import { useEffect, useRef, useState } from "react";

export function ExampleTile({
  src,
  title,
  device = "desktop",
}: {
  src: string;
  title: string;
  device?: "desktop" | "mobile";
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0);

  const designWidth = device === "mobile" ? 402 : 1280;
  // Tall enough that the scaled height always covers the tallest cell
  // (row-span 5 ≈ 27rem) at every column width we render.
  const designHeight = device === "mobile" ? 1500 : 1380;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      if (w > 0) setScale(w / designWidth);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [designWidth]);

  return (
    <div
      ref={wrapRef}
      className="absolute inset-0 overflow-hidden bg-[var(--color-bg)]"
    >
      {scale > 0 && (
        <iframe
          src={src}
          title={title}
          loading="lazy"
          sandbox="allow-scripts"
          tabIndex={-1}
          aria-hidden
          style={{
            width: designWidth,
            height: designHeight,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            border: "0",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}
