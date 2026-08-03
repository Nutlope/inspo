"use client";

/**
 * Time-machine scrubber. Receives a list of revisions (oldest first)
 * and lets the user step through them with:
 *   - a horizontal timeline rule with one tick per revision
 *   - prev/next buttons
 *   - keyboard left/right
 *
 * The currently-selected hero loads via /api/captures/<slug>/<file>;
 * neighbours are link-prefetched once the index changes so scrubbing
 * to the next/prev is instant after the first move.
 *
 * Note on the slider: we use a real <input type=range> so the OS
 * accessibility tree picks it up and keyboard works for free. The
 * visible "ticks + dot" is a styled track underneath.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface Rev {
  file: string;
  hash: string;
  mtime: number; // ms epoch
  sizeKb: number;
}

export function TimeMachine({
  slug,
  revisions,
}: {
  slug: string;
  revisions: Rev[];
}) {
  const last = revisions.length - 1;
  // Default to the newest - that's what /screens/<slug> already shows
  // and it's the most familiar starting point.
  const [i, setI] = useState(last);

  const cur = revisions[i]!;
  const prev = i > 0 ? revisions[i - 1] : null;
  const next = i < last ? revisions[i + 1] : null;

  // Pre-warm neighbours so an arrow keypress feels instant.
  const seen = useRef(new Set<string>([cur.file]));
  useEffect(() => {
    function prewarm(r: Rev | null) {
      if (!r || seen.current.has(r.file)) return;
      seen.current.add(r.file);
      const img = new Image();
      img.src = `/api/captures/${slug}/${r.file}`;
    }
    prewarm(prev);
    prewarm(next);
  }, [slug, prev, next]);

  // Keyboard arrows step through revisions when the page is focused.
  const step = useCallback(
    (delta: number) => {
      setI((x) => Math.max(0, Math.min(last, x + delta)));
    },
    [last],
  );
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  // Pretty dates / deltas.
  const dateStr = useMemo(
    () => new Date(cur.mtime).toISOString().slice(0, 10),
    [cur.mtime],
  );
  const range = useMemo(() => {
    const first = revisions[0]!;
    const lastRev = revisions[last]!;
    const days = Math.max(
      1,
      Math.round((lastRev.mtime - first.mtime) / 86_400_000),
    );
    return { days, firstDate: new Date(first.mtime).toISOString().slice(0, 10) };
  }, [revisions, last]);

  return (
    <div>
      {/* Viewer */}
      <div className="overflow-hidden border rule bg-[color-mix(in_oklab,var(--color-fg)_4%,var(--color-bg))]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={cur.file}
          src={`/api/captures/${slug}/${cur.file}`}
          alt={`${slug} - capture ${dateStr}`}
          className="h-auto w-full"
          loading="eager"
          decoding="async"
        />
      </div>

      {/* Meta row */}
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 text-meta">
        <span>
          Revision {i + 1} of {revisions.length} · {dateStr} · {cur.hash} ·{" "}
          {cur.sizeKb} KB
        </span>
        <span className="text-[var(--color-fg-muted)]">
          Spans {range.days} day{range.days === 1 ? "" : "s"} since{" "}
          {range.firstDate} · use ← / → to step
        </span>
      </div>

      {/* Scrubber */}
      <div className="mt-10 border-y rule py-8">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={i === 0}
            aria-label="Previous revision"
            className="font-mono text-xs tracking-normal border rule px-3 py-1.5 hover:text-[var(--color-link)] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Prev
          </button>

          <div className="relative flex-1">
            {/* Tick rule underneath the slider */}
            <div className="pointer-events-none absolute inset-x-0 top-1/2 flex items-center justify-between -translate-y-1/2">
              {revisions.map((r, idx) => (
                <span
                  key={r.file}
                  aria-hidden
                  className={`block h-3 w-px ${
                    idx === i
                      ? "bg-[var(--color-link)]"
                      : "bg-[var(--color-fg)]/30"
                  }`}
                />
              ))}
            </div>
            <input
              type="range"
              min={0}
              max={last}
              step={1}
              value={i}
              onChange={(e) => setI(Number(e.target.value))}
              aria-label="Capture revision"
              className="relative w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:bg-[var(--color-link)] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-[var(--color-link)] [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:bg-[var(--color-link)] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0"
            />
          </div>

          <button
            type="button"
            onClick={() => step(1)}
            disabled={i === last}
            aria-label="Next revision"
            className="font-mono text-xs tracking-normal border rule px-3 py-1.5 hover:text-[var(--color-link)] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>

        {/* Date labels under the rule */}
        <div className="mt-3 flex justify-between text-meta text-[var(--color-fg-muted)]">
          <span>{new Date(revisions[0]!.mtime).toISOString().slice(0, 10)}</span>
          <span>{new Date(revisions[last]!.mtime).toISOString().slice(0, 10)}</span>
        </div>
      </div>

      {/* All revisions table */}
      <div className="mt-12">
        <p className="text-meta mb-4">All captures on disk</p>
        <ul className="divide-y rule border rule">
          {revisions.map((r, idx) => (
            <li
              key={r.file}
              className={`flex items-center justify-between gap-4 px-4 py-3 transition-colors ${
                idx === i ? "bg-[color-mix(in_oklab,var(--color-link)_8%,var(--color-bg))]" : ""
              }`}
            >
              <button
                type="button"
                onClick={() => setI(idx)}
                className="flex-1 text-left text-sm hover:text-[var(--color-link)]"
              >
                <span className="font-mono">
                  {new Date(r.mtime).toISOString().slice(0, 10)}
                </span>
                <span className="ml-3 text-[var(--color-fg-muted)] font-mono text-xs">
                  {r.hash}
                </span>
              </button>
              <span className="text-meta text-[var(--color-fg-muted)]">
                {r.sizeKb} KB
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
