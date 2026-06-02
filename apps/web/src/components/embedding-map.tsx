"use client";

/**
 * Canvas-based 2D embedding map — the catalogue projected via UMAP.
 *
 * Renders ~1.3k sites as dots; pan / zoom / hover / click-to-detail.
 * On top of the base scatter it adds three things that make it a real
 * exploration tool rather than a pretty cloud:
 *   - Search → highlights matches, dims the rest (find a vibe in space).
 *   - Clickable legend → isolate one group.
 *   - Zoom-to-thumbnails → past a zoom threshold, dots become the actual
 *     site thumbnails, so the map reads as a spatial gallery.
 * Cluster labels float the dominant group names over the cloud so the
 * space is legible at a glance.
 *
 * Canvas (not SVG): 1.3k dots stay smooth under pan/zoom with no per-dot
 * DOM. Hit testing is a linear scan (microseconds at this size).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export interface MapPoint {
  slug: string;
  title: string;
  thumbUrl: string;
  x: number;
  y: number;
  group: string;
}

const DOT_RADIUS = 3;
const DOT_HOVER_RADIUS = 6;
const HIT_RADIUS = 9;
const THUMB_W = 92; // thumbnail cell width (px) at thumbnail zoom
const THUMB_ZOOM = 2.6; // show thumbnails once scale > base * this

/** Curated categorical palette — distinct, harmonious OKLCH hues
 *  (leads with the brand clay). Far cleaner than hashed hues. The top
 *  groups by frequency take palette slots; the long tail goes neutral. */
const HUES = [28, 250, 150, 322, 58, 200, 292, 95, 348, 172, 262, 120, 38, 308];
function paletteColor(i: number, dark: boolean): string {
  const h = HUES[i % HUES.length]!;
  return `oklch(${dark ? 72 : 49}% 0.135 ${h})`;
}
function neutralColor(dark: boolean): string {
  return dark ? "oklch(58% 0.012 60)" : "oklch(64% 0.012 60)";
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

  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [hovered, setHovered] = useState<{ point: MapPoint; screenX: number; screenY: number } | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [dark, setDark] = useState(false);
  const [query, setQuery] = useState("");
  const [isolated, setIsolated] = useState<string | null>(null);
  const [frame, setFrame] = useState(0); // bumped to redraw after a thumb loads

  const baseScale = useRef(1);
  const imgCache = useRef<Map<string, HTMLImageElement | "err">>(new Map());

  // Data extent (UMAP coords aren't guaranteed to fill [0,1]).
  const bounds = useMemo(() => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    if (!isFinite(minX)) return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
    return { minX, maxX, minY, maxY };
  }, [points]);

  // Colour per group: top groups → palette, tail → neutral.
  const groupColor = useMemo(() => {
    const m = new Map<string, string>();
    groupOrder.forEach((g, i) => {
      m.set(g, i < HUES.length ? paletteColor(i, dark) : neutralColor(dark));
    });
    return m;
  }, [groupOrder, dark]);

  // Cluster label anchors — centroid of each top group with enough points.
  const labels = useMemo(() => {
    const acc = new Map<string, { x: number; y: number; n: number }>();
    for (const p of points) {
      const a = acc.get(p.group) ?? { x: 0, y: 0, n: 0 };
      a.x += p.x; a.y += p.y; a.n += 1;
      acc.set(p.group, a);
    }
    return groupOrder
      .slice(0, HUES.length)
      .map((g) => {
        const a = acc.get(g);
        return a && a.n >= 14 ? { group: g, x: a.x / a.n, y: a.y / a.n, n: a.n } : null;
      })
      .filter((v): v is { group: string; x: number; y: number; n: number } => v !== null);
  }, [points, groupOrder]);

  const matches = useCallback(
    (p: MapPoint) => {
      if (isolated && p.group !== isolated) return false;
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.group.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
      );
    },
    [query, isolated],
  );
  const matchCount = useMemo(
    () => (query.trim() || isolated ? points.filter(matches).length : points.length),
    [points, matches, query, isolated],
  );
  const filtering = query.trim().length > 0 || isolated !== null;

  /* dark-mode sync */
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setDark(root.classList.contains("dark"));
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  /* resize */
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

  const fit = useCallback(() => {
    if (!size.w || !size.h) return;
    const pad = 48;
    const bx = Math.max(1e-6, bounds.maxX - bounds.minX);
    const by = Math.max(1e-6, bounds.maxY - bounds.minY);
    const s = Math.min((size.w - 2 * pad) / bx, (size.h - 2 * pad) / by);
    baseScale.current = s;
    const dcx = (bounds.minX + bounds.maxX) / 2;
    const dcy = (bounds.minY + bounds.maxY) / 2;
    setScale(s);
    setOffsetX(size.w / (2 * s) - dcx);
    setOffsetY(size.h / (2 * s) - dcy);
  }, [size.w, size.h, bounds]);

  // First fit once we have a size.
  useEffect(() => {
    fit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.w && size.h ? "ready" : "wait", bounds]);

  /* draw */
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
    ctx.fillStyle = dark ? "#0e0e0c" : "#f4f1ec";
    ctx.fillRect(0, 0, size.w, size.h);

    const showThumbs = scale > baseScale.current * THUMB_ZOOM;
    const hoveredSlug = hovered?.point.slug;
    const thumbH = (THUMB_W * 3) / 4;

    // Cluster labels (only when zoomed-out enough to read the whole cloud).
    if (!showThumbs && !filtering) {
      ctx.textAlign = "center";
      ctx.font = "600 12px ui-sans-serif, system-ui, sans-serif";
      for (const l of labels) {
        const sx = (l.x + offsetX) * scale;
        const sy = (l.y + offsetY) * scale;
        if (sx < 0 || sy < 0 || sx > size.w || sy > size.h) continue;
        ctx.fillStyle = dark ? "rgba(244,241,236,0.34)" : "rgba(26,26,26,0.32)";
        ctx.fillText(l.group.replace(/-/g, " ").toUpperCase(), sx, sy);
      }
      ctx.textAlign = "start";
    }

    for (const p of points) {
      const sx = (p.x + offsetX) * scale;
      const sy = (p.y + offsetY) * scale;
      if (sx < -THUMB_W || sy < -THUMB_W || sx > size.w + THUMB_W || sy > size.h + THUMB_W) continue;
      const active = matches(p);
      const isHover = p.slug === hoveredSlug;

      if (showThumbs && active) {
        // Lazy-load + draw the actual thumbnail.
        let img = imgCache.current.get(p.slug);
        if (img === undefined) {
          const el = new Image();
          el.onload = () => { imgCache.current.set(p.slug, el); setFrame((f) => f + 1); };
          el.onerror = () => imgCache.current.set(p.slug, "err");
          el.src = p.thumbUrl;
          imgCache.current.set(p.slug, "err"); // placeholder until onload swaps it
          img = "err";
        }
        const dw = isHover ? THUMB_W * 1.18 : THUMB_W;
        const dh = isHover ? thumbH * 1.18 : thumbH;
        if (img instanceof HTMLImageElement) {
          ctx.save();
          ctx.globalAlpha = 1;
          ctx.drawImage(img, sx - dw / 2, sy - dh / 2, dw, dh);
          ctx.lineWidth = isHover ? 2 : 1;
          ctx.strokeStyle = isHover ? (dark ? "#fff" : "#1a1a1a") : (dark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.18)");
          ctx.strokeRect(sx - dw / 2, sy - dh / 2, dw, dh);
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(sx, sy, DOT_RADIUS, 0, Math.PI * 2);
          ctx.fillStyle = groupColor.get(p.group) ?? neutralColor(dark);
          ctx.fill();
        }
        continue;
      }

      ctx.beginPath();
      ctx.arc(sx, sy, isHover ? DOT_HOVER_RADIUS : DOT_RADIUS, 0, Math.PI * 2);
      if (!active) {
        ctx.fillStyle = neutralColor(dark);
        ctx.globalAlpha = 0.1;
      } else {
        ctx.fillStyle = groupColor.get(p.group) ?? neutralColor(dark);
        ctx.globalAlpha = isHover ? 1 : filtering ? 0.95 : 0.8;
      }
      ctx.fill();
      if (isHover && active) {
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = dark ? "#fff" : "#1a1a1a";
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }, [points, scale, offsetX, offsetY, size.w, size.h, hovered?.point.slug, dark, matches, filtering, groupColor, labels, frame]);

  /* interaction */
  const hitTest = useCallback(
    (clientX: number, clientY: number): MapPoint | null => {
      const r = canvasRef.current?.getBoundingClientRect();
      if (!r) return null;
      const sx = clientX - r.left;
      const sy = clientY - r.top;
      const showThumbs = scale > baseScale.current * THUMB_ZOOM;
      const hitR = showThumbs ? THUMB_W / 2 : HIT_RADIUS;
      const hitR2 = hitR * hitR;
      let best: { p: MapPoint; d2: number } | null = null;
      for (const p of points) {
        if (!matches(p)) continue;
        const px = (p.x + offsetX) * scale;
        const py = (p.y + offsetY) * scale;
        const d2 = (px - sx) ** 2 + (py - sy) ** 2;
        if (d2 <= hitR2 && (!best || d2 < best.d2)) best = { p, d2 };
      }
      return best?.p ?? null;
    },
    [points, scale, offsetX, offsetY, matches],
  );

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offsetX, oy: offsetY };
    setDragging(true);
  }
  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (dragging && dragStart.current) {
      setOffsetX(dragStart.current.ox + (e.clientX - dragStart.current.x) / scale);
      setOffsetY(dragStart.current.oy + (e.clientY - dragStart.current.y) / scale);
      setHovered(null);
      return;
    }
    const hit = hitTest(e.clientX, e.clientY);
    if (hit) setHovered({ point: hit, screenX: e.clientX, screenY: e.clientY });
    else if (hovered) setHovered(null);
  }
  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (dragging && dragStart.current) {
      const moved = Math.abs(e.clientX - dragStart.current.x) > 4 || Math.abs(e.clientY - dragStart.current.y) > 4;
      setDragging(false);
      dragStart.current = null;
      if (moved) return;
    }
    const hit = hitTest(e.clientX, e.clientY);
    if (hit) router.push(`/screens/${hit.slug}`);
  }
  function zoomAt(sx: number, sy: number, factor: number) {
    const worldX = sx / scale - offsetX;
    const worldY = sy / scale - offsetY;
    const next = Math.max(0.3 * baseScale.current, Math.min(60 * baseScale.current, scale * factor));
    setScale(next);
    setOffsetX(sx / next - worldX);
    setOffsetY(sy / next - worldY);
  }
  function onWheel(e: React.WheelEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const r = canvasRef.current?.getBoundingClientRect();
    if (!r) return;
    zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.0015));
  }
  const zoomBtn = (f: number) => zoomAt(size.w / 2, size.h / 2, f);

  /* render */
  return (
    <div
      ref={wrapRef}
      className="relative h-full w-full overflow-hidden"
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

      {hovered && <HoverCard point={hovered.point} x={hovered.screenX} y={hovered.screenY} container={wrapRef.current} />}

      {/* Top bar: search + count */}
      <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-wrap items-start justify-between gap-2">
        <div className="pointer-events-auto flex items-center gap-2 border rule bg-[var(--color-bg)]/90 px-2.5 py-1.5 backdrop-blur-sm">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="text-[var(--color-fg-muted)]" aria-hidden>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the space…"
            className="w-36 bg-transparent text-sm outline-none placeholder:text-[var(--color-fg-muted)] sm:w-48"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="text-meta text-[var(--color-fg-muted)] hover:text-[var(--color-link)]" aria-label="Clear search">×</button>
          )}
        </div>
        <div className="pointer-events-auto flex items-center gap-2 border rule bg-[var(--color-bg)]/90 px-2.5 py-1.5 text-meta backdrop-blur-sm">
          <span className={filtering ? "text-[var(--color-link)]" : ""}>
            {matchCount.toLocaleString()}{filtering ? ` / ${points.length.toLocaleString()}` : ""} sites
          </span>
          {isolated && (
            <button type="button" onClick={() => setIsolated(null)} className="text-[var(--color-fg-muted)] hover:text-[var(--color-link)]">clear</button>
          )}
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1.5">
        <div className="flex flex-col overflow-hidden border rule bg-[var(--color-bg)]/90 backdrop-blur-sm">
          <button type="button" onClick={() => zoomBtn(1.4)} className="px-2.5 py-1 text-sm hover:text-[var(--color-link)]" aria-label="Zoom in">+</button>
          <button type="button" onClick={() => zoomBtn(1 / 1.4)} className="border-t rule px-2.5 py-1 text-sm hover:text-[var(--color-link)]" aria-label="Zoom out">−</button>
        </div>
        <button type="button" onClick={fit} className="border rule bg-[var(--color-bg)]/90 px-2.5 py-1 text-meta backdrop-blur-sm hover:text-[var(--color-link)]">reset</button>
      </div>

      <Legend
        groups={groupOrder.slice(0, 10)}
        groupColor={groupColor}
        isolated={isolated}
        onPick={(g) => setIsolated((cur) => (cur === g ? null : g))}
      />

      {scale > baseScale.current * THUMB_ZOOM && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 border rule bg-[var(--color-bg)]/90 px-2.5 py-1 text-meta backdrop-blur-sm">
          zoom out for the full map
        </div>
      )}
    </div>
  );
}

function HoverCard({ point, x, y, container }: { point: MapPoint; x: number; y: number; container: HTMLElement | null }) {
  if (!container) return null;
  const r = container.getBoundingClientRect();
  const cardW = 220, cardH = 200;
  let lx = x - r.left + 14, ly = y - r.top + 14;
  if (lx + cardW > r.width) lx = x - r.left - cardW - 14;
  if (ly + cardH > r.height) ly = y - r.top - cardH - 14;
  return (
    <div role="tooltip" className="pointer-events-none absolute z-10 border rule bg-[var(--color-bg)] shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)]" style={{ left: lx, top: ly, width: cardW }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={point.thumbUrl} alt="" className="aspect-[4/3] w-full object-cover" />
      <div className="border-t rule p-2">
        <p className="font-display text-sm leading-tight truncate">{point.title}</p>
        <p className="text-meta mt-1 text-[var(--color-fg-muted)] truncate">{point.group.replace(/-/g, " ")}</p>
      </div>
    </div>
  );
}

function Legend({
  groups,
  groupColor,
  isolated,
  onPick,
}: {
  groups: string[];
  groupColor: Map<string, string>;
  isolated: string | null;
  onPick: (g: string) => void;
}) {
  if (groups.length === 0) return null;
  return (
    <div className="absolute bottom-3 left-3 max-w-[20rem] border rule bg-[var(--color-bg)]/90 px-3 py-2 backdrop-blur-sm">
      <p className="text-meta mb-2 text-[var(--color-fg-muted)]">Groups · click to isolate</p>
      <ul className="flex flex-wrap gap-x-3 gap-y-1.5 text-meta">
        {groups.map((g) => {
          const on = isolated === g;
          return (
            <li key={g}>
              <button
                type="button"
                onClick={() => onPick(g)}
                className={`flex items-center gap-1.5 transition-opacity ${isolated && !on ? "opacity-40 hover:opacity-100" : ""}`}
              >
                <span aria-hidden className="block h-2.5 w-2.5 rounded-[1px]" style={{ background: groupColor.get(g) }} />
                <span className={`capitalize ${on ? "text-[var(--color-link)]" : ""}`}>{g.replace(/-/g, " ")}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
