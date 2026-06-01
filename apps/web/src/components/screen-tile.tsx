import type { ScreenSummary } from "@inspo/shared";
import { MACROSTRUCTURE_LABELS } from "@inspo/taxonomy";
import { TransitionLink as Link } from "@/components/transition-link";
import { HoverScrollOverlay } from "@/components/hover-scroll-overlay";
import { TileImage } from "@/components/tile-image";

/**
 * Server-rendered tile. No `"use client"`, no `useState`. The previous
 * client-component version paid React hydration cost per tile ×
 * ~1000 tiles on `/screens` — a measurable chunk of TTI for no
 * functional benefit.
 *
 * Image strategy:
 *   - `<picture>` chooses AVIF (smallest) → WebP (broad fallback) →
 *     PNG (universal). The browser picks the first format it supports
 *     AND the right width from each `<source>`'s `srcset`.
 *   - When the encoder has run (variants are populated on the seed),
 *     a 300-wide tile pulls ~5 KB AVIF instead of ~50 KB PNG.
 *   - When variants are absent (legacy row), the `<img>` falls back
 *     to the original PNG — nothing breaks.
 *
 * Background while loading:
 *   - If `screen.lqip` is present, it's a 16-wide AVIF base64. Painted
 *     as the parent div's `background-image`; the real image just
 *     swaps in on top once it decodes. Native browser lazy-loading
 *     handles the timing; no fade animation needed.
 *   - If absent (legacy row), the parent gets a CSS gradient from the
 *     palette's first and third colours — the original behaviour,
 *     preserved.
 */

type Variant = "thumb" | "hero" | "feature";

const ASPECT: Record<Variant, string> = {
  thumb: "aspect-[4/3]",
  hero: "aspect-[16/10]",
  feature: "aspect-[16/9]",
};

/**
 * Default `sizes` attribute. Mirrors the grid breakpoints in
 * `/screens` and the home page (1 / 2 / 3 / 4 columns). Telling the
 * browser the rendered width lets it pick the smallest variant that
 * still looks crisp — without this it assumes 100vw and pulls the
 * widest variant every time.
 */
const TILE_SIZES =
  "(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw";

export function ScreenTile({
  screen,
  variant = "thumb",
  index,
  showCaption = true,
  className = "",
  priority = false,
  pageCount,
  hoverScroll = false,
}: {
  screen: ScreenSummary;
  variant?: Variant;
  /** 1-based index. Used for `data-index` only — no rendering. */
  index?: number;
  showCaption?: boolean;
  className?: string;
  /** First 12 tiles get loading="eager" + fetchpriority="high" so the
   *  above-the-fold grid paints crisp. Below the fold stays lazy. */
  priority?: boolean;
  /** When set and > 1, the tile represents a multi-page site:
   *  - link routes to /sites/[siteSlug] (gallery-style)
   *  - small "N pages" badge in the caption row
   *  Otherwise link routes to /screens/[slug] (single screen detail). */
  pageCount?: number;
  /** When true, on first hover the tile loads the full-page screenshot
   *  and slowly scrolls it top→bottom over ~5.5 s. Adds a tiny client
   *  island per tile but no upfront network cost — the full PNG is
   *  fetched only after the user actually hovers. Default off so
   *  callers opt in (we don't want this on cards in tight grids like
   *  /collections summaries). */
  hoverScroll?: boolean;
}) {
  const macroKey = screen.tags.macrostructure;
  const macro = macroKey ? MACROSTRUCTURE_LABELS[macroKey] : null;

  // Pick the variant set: tile-sized for "thumb" (smaller srcset, no
  // wasted bytes on a 1440 download for a 300-wide cell), hero-sized
  // for "hero"/"feature" (used on the home page where tiles are
  // larger). Falls back to whichever set is populated.
  const variants =
    variant === "thumb"
      ? screen.thumbVariants ?? screen.heroVariants
      : screen.heroVariants ?? screen.thumbVariants;

  const fallbackSrc =
    variant === "thumb" ? screen.thumbUrl : screen.imageUrl;

  const isMultiPage = (pageCount ?? 0) > 1;
  const href = isMultiPage
    ? `/sites/${screen.siteSlug}`
    : `/screens/${screen.slug}`;

  // Background — LQIP if encoded, otherwise the palette gradient that
  // shipped before. Both render instantly with no network round-trip.
  const palette0 = screen.palette[0] ?? "#eee";
  const palette2 = screen.palette[2] ?? screen.palette[1] ?? "#ddd";
  const bgStyle: React.CSSProperties = screen.lqip
    ? {
        backgroundImage: `url("${screen.lqip}")`,
        backgroundSize: "cover",
        backgroundPosition: "top center",
      }
    : {
        background: `linear-gradient(135deg, ${palette0}, ${palette2})`,
      };

  return (
    <article className={`group ${className}`} data-index={index ?? undefined}>
      <Link href={href} className="block focus:outline-none">
        <div
          className={`relative w-full overflow-hidden border rule transition-transform duration-[280ms] ease-out group-hover:scale-[1.012] ${ASPECT[variant]}`}
          style={bgStyle}
        >
          <TileImage
            variants={variants}
            fallbackSrc={fallbackSrc}
            alt={`${screen.title} — ${screen.description}`}
            sizes={TILE_SIZES}
            priority={priority}
          />

          {/* Hover-scroll overlay — full page screenshot, lazy. Renders
              nothing on first paint; fetches the 1440-wide AVIF only on
              first pointerenter. The overlay sits above the hero image
              and below the caption strip (caption uses pointer-events:
              none so hover still bubbles to the parent group). */}
          {hoverScroll && screen.fullPageUrl ? (
            <HoverScrollOverlay
              fullUrl={screen.fullPageUrl}
              fullVariants={screen.fullVariants}
            />
          ) : null}

          {/* Hover strip — palette swatches + macrostructure caption.
              Opacity-fades in (no slide), calmer than translate. Reads
              on focus too for keyboard users. */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-[color-mix(in_oklab,var(--color-bg)_94%,transparent)] px-3 py-2 opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100 group-focus-within:opacity-100"
            aria-hidden
          >
            <div className="flex items-center gap-1">
              {screen.palette.slice(0, 5).map((hex, i) => (
                <span
                  key={`${hex}-${i}`}
                  title={hex}
                  className="block h-3 w-3 border rule"
                  style={{ background: hex }}
                />
              ))}
            </div>
            <p className="text-meta truncate text-[var(--color-fg)]">
              {macro ?? screen.tags.style[0] ?? "—"}
            </p>
          </div>
        </div>

        {showCaption && (
          <div className="mt-3 flex items-baseline justify-between gap-3">
            <p className="font-display text-lg leading-tight">
              <span className="transition-colors group-hover:text-[var(--color-link)]">
                {screen.title}
              </span>
            </p>
            <p className="text-meta whitespace-nowrap">
              {isMultiPage ? `${pageCount} pages` : (macro ?? screen.tags.style[0] ?? "—")}
            </p>
          </div>
        )}
      </Link>
    </article>
  );
}
