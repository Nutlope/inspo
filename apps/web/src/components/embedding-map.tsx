"use client";

/**
 * Canvas-based 2D embedding map. Renders ~1.2k dots from a UMAP
 * projection of the catalogue's text embeddings, with pan / zoom and
 * a hover tooltip showing the site title + thumbnail.
 *
 * Why canvas, not SVG: at 1.2k dots an SVG works but each interaction
 * (pan, zoom, hover) re-laysout the DOM. Canvas paints in one go and
 * stays smooth. We pay no per-dot React render either.
 *
 * Hit testing: linear scan of all points per pointer event. At 1.2k
 * that's microseconds; no quadtree needed yet. If the catalogue grows
 * past 10k we should swap in a quadtree.
 *
 * Coordinate spaces:
 *   - World: (x,y) in [0,1] from the sidecar
 *   - Screen: (sx, sy) in pixels = (x - offsetX) * scale, (y - offsetY) * scale
 *   - Scale + offset move with pan/zoom; scale is also clamped to a
 *     sensible min/max so the user can't get lost.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export interface MapPoint {
  slug: string;
  title: string;
  thumbUrl: string;
  x: number; // world [0,1]
  y: number; // world [0,1]
  group: string;
}

const DOT_RADIUS = 3.2; // px at scale=1
const DOT_HOVER_RADIUS = 6.5;
const HIT_RADIUS = 8; // generous click target

/** Stable colour per group. djb2 → hue, fixed saturation/lightness so
 *  every group gets a distinct but harmonious colour. */
function colorFor(group: string, dark: boolean): string {
  let h = 5381;
  for (let i = 0; i < group.length; i++) h = ((h << 5) + h + group.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  // OKLCH for perceptual evenness; chroma trimmed for cohesion.
  const L = dark ? 70 : 52;
  const C = 0.13;
  return `oklch(${L}% ${C} ${hue})`;
}

export function EmbeddingMap({
  points,
  groupOrder,
}: {
  points: MapPoint[];
  groupOrder: string[];
}) {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Camera state (world units for offsets, scale = px per world-unit).
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  // Pan tracking.
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  // Hover state.
  const [hovered, setHovered] = useState<{
    point: MapPoint;
    screenX: number;
    screenY: number;
  } | null>(null);

  const [size, setSize] = useState({ w: 800, h: 600 });
  const [dark, setDark] = useState(false);

  // Detect dark mode by checking the html class (the global theme is
  // driven by `.dark` on the root, see globals.css). Updates on
  // class change via MutationObserver so colour flips when the user
  // toggles theme.
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setDark(root.classList.contains("dark"));
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // Resize observer for the wrapper. Canvas always matches its
  // bounding rect; we draw at devicePixelRatio for crisp dots.
  useEffect(() => {
    if (!wrapRef.current) return;
    const el = wrapRef.current;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({ w: Math.floor(r.width), h: Math.floor(r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // First fit: centre the 1-unit world inside the viewport.
  useEffect(() => {
    if (!size.w || !size.h) return;
    const padding = 32;
    const targetScale = Math.min(
      (size.w - 2 * padding),
      (size.h - 2 * padding),
    );
    setScale(targetScale);
    setOffsetX((size.w / targetScale - 1) / 2);
    setOffsetY((size.h / targetScale - 1) / 2);
    // Run once on first mount-with-size; later resizes don't reset.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.w && size.h ? "init" : "wait"]);

  // Draw whenever camera or hover changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size.w || !size.h) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.w * dpr;
    canvas.height = size.h * dpr;
    canvas.style.width = `${size.w}px`;
    canvas.style.height = `${size.h}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.w, size.h);

    // Background — a subtle vignette so the edges feel like canvas
    // rather than terminating at the chrome.
    const bg = dark ? "#0e0e0c" : "#f4f1ec";
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size.w, size.h);

    // Dots.
    const hoveredSlug = hovered?.point.slug;
    for (const p of points) {
      const sx = (p.x + offsetX) * scale;
      const sy = (p.y + offsetY) * scale;
      if (sx < -10 || sy < -10 || sx > size.w + 10 || sy > size.h + 10) continue;
      const isHover = p.slug === hoveredSlug;
      ctx.beginPath();
      ctx.arc(sx, sy, isHover ? DOT_HOVER_RADIUS : DOT_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = colorFor(p.group, dark);
      ctx.globalAlpha = isHover ? 1 : 0.78;
      ctx.fill();
      if (isHover) {
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = dark ? "#fff" : "#1a1a1a";
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }, [points, scale, offsetX, offsetY, size.w, size.h, hovered?.point.slug, dark]);

  /* ─────────── Interaction handlers ─────────── */

  const hitTest = useCallback(
    (clientX: number, clientY: number): MapPoint | null => {
      const r = canvasRef.current?.getBoundingClientRect();
      if (!r) return null;
      const sx = clientX - r.left;
      const sy = clientY - r.top;
      let best: { p: MapPoint; d2: number } | null = null;
      const hitR2 = HIT_RADIUS * HIT_RADIUS;
      for (const p of points) {
        const px = (p.x + offsetX) * scale;
        const py = (p.y + offsetY) * scale;
        const d2 = (px - sx) ** 2 + (py - sy) ** 2;
        if (d2 <= hitR2 && (!best || d2 < best.d2)) best = { p, d2 };
      }
      return best?.p ?? null;
    },
    [points, scale, offsetX, offsetY],
  );

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      ox: offsetX,
      oy: offsetY,
    };
    setDragging(true);
  }
  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (dragging && dragStart.current) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setOffsetX(dragStart.current.ox + dx / scale);
      setOffsetY(dragStart.current.oy + dy / scale);
      // While panning, suppress hover noise.
      setHovered(null);
      return;
    }
    const hit = hitTest(e.clientX, e.clientY);
    if (hit) {
      setHovered({ point: hit, screenX: e.clientX, screenY: e.clientY });
    } else if (hovered) {
      setHovered(null);
    }
  }
  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (dragging && dragStart.current) {
      const moved =
        Math.abs(e.clientX - dragStart.current.x) > 4 ||
        Math.abs(e.clientY - dragStart.current.y) > 4;
      setDragging(false);
      dragStart.current = null;
      if (moved) return; // treated as drag, not click
    }
    const hit = hitTest(e.clientX, e.clientY);
    if (hit) router.push(`/screens/${hit.slug}`);
  }
  function onWheel(e: React.WheelEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const r = canvasRef.current?.getBoundingClientRect();
    if (!r) return;
    const sx = e.clientX - r.left;
    const sy = e.clientY - r.top;
    // World coord at cursor — preserve it across the zoom so the dot
    // under the pointer stays put.
    const worldX = sx / scale - offsetX;
    const worldY = sy / scale - offsetY;
    const factor = Math.exp(-e.deltaY * 0.0015);
    const next = Math.max(0.3 * size.w, Math.min(40 * size.w, scale * factor));
    setScale(next);
    setOffsetX(sx / next - worldX);
    setOffsetY(sy / next - worldY);
  }

  function resetView() {
    const padding = 32;
    const target = Math.min(size.w - 2 * padding, size.h - 2 * padding);
    setScale(target);
    setOffsetX((size.w / target - 1) / 2);
    setOffsetY((size.h / target - 1) / 2);
  }

  /* ─────────── Render ─────────── */

  return (
    <div className="relative">
      <div
        ref={wrapRef}
        className="relative h-[70vh] min-h-[480px] w-full overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={() => setHovered(null)}
          onWheel={onWheel}
          style={{ cursor: dragging ? "grabbing" : hovered ? "pointer" : "grab" }}
        />

        {hovered && (
          <HoverCard
            point={hovered.point}
            x={hovered.screenX}
            y={hovered.screenY}
            container={wrapRef.current}
          />
        )}

        {/* Toolbar */}
        <div className="pointer-events-none absolute right-3 top-3 flex flex-col items-end gap-2">
          <div className="pointer-events-auto flex items-center gap-2 border rule bg-[var(--color-bg)] px-2 py-1.5 text-meta">
            <span>{points.length.toLocaleString()} sites</span>
            <span className="text-[var(--color-fg-muted)]">·</span>
            <button
              type="button"
              onClick={resetView}
              className="hover:text-[var(--color-link)]"
            >
              reset view
            </button>
          </div>
        </div>

        {/* Group legend */}
        <Legend groups={groupOrder.slice(0, 12)} dark={dark} />
      </div>
    </div>
  );
}

function HoverCard({
  point,
  x,
  y,
  container,
}: {
  point: MapPoint;
  x: number;
  y: number;
  container: HTMLElement | null;
}) {
  if (!container) return null;
  const r = container.getBoundingClientRect();
  // Offset the card from the cursor; flip when near the right/bottom
  // edge so it stays in-view.
  const cardW = 220;
  const cardH = 200;
  let lx = x - r.left + 14;
  let ly = y - r.top + 14;
  if (lx + cardW > r.width) lx = x - r.left - cardW - 14;
  if (ly + cardH > r.height) ly = y - r.top - cardH - 14;
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-10 border rule bg-[var(--color-bg)]"
      style={{
        left: lx,
        top: ly,
        width: cardW,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={point.thumbUrl}
        alt=""
        className="aspect-[4/3] w-full object-cover"
      />
      <div className="border-t rule p-2">
        <p className="font-display text-sm leading-tight truncate">
          {point.title}
        </p>
        <p className="text-meta mt-1 text-[var(--color-fg-muted)] truncate">
          {point.group.replace(/-/g, " ")}
        </p>
      </div>
    </div>
  );
}

function Legend({ groups, dark }: { groups: string[]; dark: boolean }) {
  if (groups.length === 0) return null;
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 max-w-[18rem] border rule bg-[var(--color-bg)] px-3 py-2">
      <p className="text-meta mb-2">Top groups</p>
      <ul className="flex flex-wrap gap-x-3 gap-y-1.5 text-meta">
        {groups.map((g) => (
          <li key={g} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="block h-2.5 w-2.5"
              style={{ background: colorFor(g, dark) }}
            />
            <span className="capitalize">{g.replace(/-/g, " ")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
