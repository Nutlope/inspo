"use client";

/**
 * Scaled live-iframe preview of a generated example page. Renders the
 * real HTML at a fixed desktop viewport width and scales it down to
 * fit the container, so every card shows a crisp, consistent
 * above-the-fold thumbnail of the actual page (not a screenshot that
 * can go stale).
 *
 * Scale is measured from the container width via ResizeObserver so a
 * 320px card and a 900px detail hero both render the page at the same
 * 1280px design viewport — only the zoom differs.
 *
 *   interactive=false (default): pointer-events off — it's a preview.
 *   interactive=true: the iframe is live and scrollable (detail page).
 */

import { useEffect, useRef, useState } from "react";

export function ExamplePreview({
  src,
  title,
  designWidth = 1280,
  /** Visible aspect ratio of the framed preview (w / h). */
  aspect = 16 / 10,
  interactive = false,
  className = "",
}: {
  src: string;
  title: string;
  designWidth?: number;
  aspect?: number;
  interactive?: boolean;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0);

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

  // The design-space height that fills the framed aspect ratio.
  const designHeight = designWidth / aspect;

  return (
    <div
      ref={wrapRef}
      className={`relative w-full overflow-hidden bg-[var(--color-bg)] ${className}`}
      style={{ aspectRatio: String(aspect) }}
    >
      {scale > 0 && (
        <iframe
          src={src}
          title={title}
          loading="lazy"
          // Sandbox: allow the page's own scripts (the eval pages have
          // tiny vanilla-JS interactions) but nothing that could reach
          // back into the host. No allow-same-origin → it can't touch
          // our cookies / storage.
          sandbox="allow-scripts"
          tabIndex={interactive ? 0 : -1}
          aria-hidden={interactive ? undefined : true}
          style={{
            width: designWidth,
            height: designHeight,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            border: "0",
            pointerEvents: interactive ? "auto" : "none",
          }}
        />
      )}
    </div>
  );
}
