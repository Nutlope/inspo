"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ScreenSummary } from "@inspo/shared";

const PAGE_TYPE_LABELS: Record<ScreenSummary["pageType"], string> = {
  landing: "Landing",
  pricing: "Pricing",
  features: "Features",
  auth: "Sign up & sign in",
  about: "About",
  blog: "Blog",
  changelog: "Changelog",
  docs: "Docs",
  other: "Other",
};

/**
 * Renders the hero plate + grouped sub-pages for /sites/[slug].
 * Every page opens in an in-page lightbox — no route change, arrow keys
 * cycle siblings, Esc closes. URL syncs via history.replaceState so the
 * open page is deep-linkable.
 */
export function SiteGallery({
  hero,
  pages,
}: {
  hero: ScreenSummary;
  pages: ScreenSummary[];
}) {
  // Flat order is what arrow-key navigation walks. Hero first, then sub-pages
  // in the order the server already sorted them.
  const flat = useMemo<ScreenSummary[]>(() => {
    const sub = pages.filter((p) => p.slug !== hero.slug);
    return [hero, ...sub];
  }, [hero, pages]);

  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const open = useCallback((slug: string) => {
    setOpenIdx((curr) => {
      const idx = flatRef.current.findIndex((p) => p.slug === slug);
      return idx >= 0 ? idx : curr;
    });
  }, []);

  const close = useCallback(() => setOpenIdx(null), []);
  const step = useCallback(
    (delta: number) =>
      setOpenIdx((curr) =>
        curr === null
          ? curr
          : Math.min(flatRef.current.length - 1, Math.max(0, curr + delta)),
      ),
    [],
  );

  // Keep a ref so the keydown handler doesn't re-bind on every render.
  const flatRef = useMemo(() => ({ current: flat }), [flat]);
  flatRef.current = flat;

  // Hydrate from ?page=<slug> on first mount; syncs URL when nav changes.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initial = params.get("page");
    if (initial) {
      const idx = flat.findIndex((p) => p.slug === initial);
      if (idx >= 0) setOpenIdx(idx);
    }
    // first-mount only — intentionally no deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (openIdx === null) {
      url.searchParams.delete("page");
    } else {
      url.searchParams.set("page", flat[openIdx]!.slug);
    }
    window.history.replaceState({}, "", url.toString());
  }, [openIdx, flat]);

  useEffect(() => {
    if (openIdx === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      }
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [openIdx, close, step]);

  // Group sub-pages by pageType — server already did this work but we
  // need it client-side to render below the hero.
  const groups = useMemo(() => {
    const m = new Map<ScreenSummary["pageType"], ScreenSummary[]>();
    for (const p of pages) {
      if (p.slug === hero.slug) continue;
      if (!m.has(p.pageType)) m.set(p.pageType, []);
      m.get(p.pageType)!.push(p);
    }
    return m;
  }, [pages, hero.slug]);

  const current = openIdx === null ? null : flat[openIdx]!;
  const prev = openIdx === null || openIdx <= 0 ? null : flat[openIdx - 1]!;
  const next =
    openIdx === null || openIdx >= flat.length - 1 ? null : flat[openIdx + 1]!;

  return (
    <>
      {/* Hero plate ─────────────────────────────────────────────── */}
      <div className="mx-auto mt-12 max-w-[120rem] px-6 sm:mt-16 sm:px-10">
        <button
          type="button"
          onClick={() => open(hero.slug)}
          className="group block w-full text-left focus:outline-none"
        >
          <div className="overflow-hidden border rule">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hero.imageUrl}
              alt={hero.description}
              className="h-auto w-full transition-transform duration-[280ms] ease-out group-hover:scale-[1.005]"
              loading="eager"
              decoding="async"
            />
          </div>
          <p className="text-meta mt-3 flex items-baseline justify-between">
            <span>Homepage — 1440 × 900</span>
            <span className="transition-colors group-hover:text-[var(--color-link)]">
              Open this page →
            </span>
          </p>
        </button>
      </div>

      {/* Grouped sub-pages ──────────────────────────────────────── */}
      {groups.size > 0 ? (
        <div className="mx-auto mt-20 max-w-[120rem] space-y-20 px-6 pb-24 sm:px-10">
          {[...groups.entries()].map(([type, ps]) => (
            <section key={type}>
              <div className="grid grid-cols-1 gap-y-6 lg:grid-cols-12 lg:gap-x-10">
                <div className="lg:col-span-2">
                  <p className="text-meta">{PAGE_TYPE_LABELS[type]}</p>
                  <p className="text-meta mt-2">
                    {ps.length} page{ps.length === 1 ? "" : "s"}
                  </p>
                </div>
                <ul className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:col-span-10 lg:grid-cols-3">
                  {ps.map((p) => (
                    <li key={p.slug}>
                      <GalleryTile screen={p} onOpen={() => open(p.slug)} />
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="mx-auto mt-16 max-w-[120rem] px-6 pb-24 sm:px-10">
          <p className="text-meta">
            Only the homepage is captured for this site. More pages may land in
            the next discovery pass.
          </p>
        </div>
      )}

      {/* Lightbox ──────────────────────────────────────────────── */}
      {current && (
        <Lightbox
          screen={current}
          index={openIdx!}
          total={flat.length}
          onClose={close}
          onPrev={prev ? () => step(-1) : undefined}
          onNext={next ? () => step(1) : undefined}
        />
      )}
    </>
  );
}

function GalleryTile({
  screen,
  onOpen,
}: {
  screen: ScreenSummary;
  onOpen: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const p0 = screen.palette[0] ?? "#eee";
  const p2 = screen.palette[2] ?? screen.palette[1] ?? "#ddd";

  return (
    <article className="group">
      <button
        type="button"
        onClick={onOpen}
        className="block w-full text-left focus:outline-none"
      >
        <div
          className="relative aspect-[16/10] w-full overflow-hidden border rule transition-transform duration-[280ms] ease-out group-hover:scale-[1.012]"
          style={{ background: `linear-gradient(135deg, ${p0}, ${p2})` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={screen.imageUrl}
            alt={`${screen.title} — ${screen.description}`}
            className={`h-full w-full object-cover transition-opacity duration-[400ms] ease-out ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
          />
        </div>
        <div className="mt-3 flex items-baseline justify-between gap-3">
          <p className="font-display text-lg leading-tight">
            <span className="transition-colors group-hover:text-[var(--color-link)]">
              {screen.title}
            </span>
          </p>
          <p className="text-meta whitespace-nowrap">
            {PAGE_TYPE_LABELS[screen.pageType]}
          </p>
        </div>
      </button>
    </article>
  );
}

function Lightbox({
  screen,
  index,
  total,
  onClose,
  onPrev,
  onNext,
}: {
  screen: ScreenSummary;
  index: number;
  total: number;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${screen.title} — full page`}
      className="fixed inset-0 z-[100] flex flex-col bg-[color-mix(in_oklab,var(--color-fg)_92%,transparent)] backdrop-blur-md"
      onClick={onClose}
    >
      {/* Top bar — title, counter, close */}
      <div
        className="flex items-baseline justify-between px-6 py-4 text-[var(--color-bg)] sm:px-10"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-display text-xl leading-tight sm:text-2xl">
          {screen.title}
          <span className="text-meta ml-3 text-[color-mix(in_oklab,var(--color-bg)_70%,transparent)]">
            {PAGE_TYPE_LABELS[screen.pageType]}
          </span>
        </p>
        <div className="flex items-center gap-6">
          <p className="text-meta text-[color-mix(in_oklab,var(--color-bg)_70%,transparent)]">
            {index + 1} / {total}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-meta uppercase tracking-wider hover:text-[var(--color-link)]"
          >
            Close ✕
          </button>
        </div>
      </div>

      {/* Scrollable canvas — full-page PNG, click backdrop to close */}
      <div
        className="flex-1 overflow-auto px-6 pb-12 sm:px-10"
        onClick={onClose}
      >
        <div
          className="mx-auto max-w-[100rem]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={screen.fullPageUrl ?? screen.imageUrl}
            alt={screen.description}
            className="w-full border rule"
            loading="eager"
            decoding="async"
          />
        </div>
      </div>

      {/* Prev / Next — fixed at vertical center, edges */}
      {onPrev && (
        <button
          type="button"
          aria-label="Previous page"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="fixed left-4 top-1/2 -translate-y-1/2 rounded-full border rule bg-[color-mix(in_oklab,var(--color-bg)_92%,transparent)] px-4 py-3 text-[var(--color-fg)] transition-opacity hover:opacity-80 sm:left-8"
        >
          ←
        </button>
      )}
      {onNext && (
        <button
          type="button"
          aria-label="Next page"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="fixed right-4 top-1/2 -translate-y-1/2 rounded-full border rule bg-[color-mix(in_oklab,var(--color-bg)_92%,transparent)] px-4 py-3 text-[var(--color-fg)] transition-opacity hover:opacity-80 sm:right-8"
        >
          →
        </button>
      )}
    </div>
  );
}
