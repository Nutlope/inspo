import type { ScreenSummary } from "@inspo/shared";
import { MACROSTRUCTURE_LABELS } from "@inspo/taxonomy";
import { TransitionLink as Link } from "@/components/transition-link";
import { TileMedia } from "@/components/tile-media";

/**
 * Server-rendered tile. No `"use client"`, no `useState`. The previous
 * client-component version paid React hydration cost per tile ×
 * ~1000 tiles on `/screens` - a measurable chunk of TTI for no
 * functional benefit.
 *
 * Image strategy:
 *   - `<picture>` chooses AVIF (smallest) → WebP (broad fallback) →
 *     PNG (universal). The browser picks the first format it supports
 *     AND the right width from each `<source>`'s `srcset`.
 *   - When the encoder has run (variants are populated on the seed),
 *     a 300-wide tile pulls ~5 KB AVIF instead of ~50 KB PNG.
 *   - When variants are absent (legacy row), the `<img>` falls back
 *     to the original PNG - nothing breaks.
 *
 * Background while loading:
 *   - If `screen.lqip` is present, it's a 16-wide AVIF base64. Painted
 *     as the parent div's `background-image`; the real image just
 *     swaps in on top once it decodes. Native browser lazy-loading
 *     handles the timing; no fade animation needed.
 *   - If absent (legacy row), the parent gets a CSS gradient from the
 *     palette's first and third colours - the original behaviour,
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
 * still looks crisp - without this it assumes 100vw and pulls the
 * widest variant every time.
 */
const TILE_SIZES =
  "(min-width: 1920px) 18vw, (min-width: 1280px) 24vw, (min-width: 1024px) 32vw, (min-width: 640px) 48vw, 95vw";

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
  /** 1-based index. Used for `data-index` only - no rendering. */
  index?: number;
  showCaption?: boolean;
  className?: string;
  /** First 12 tiles get loading="eager" + fetchPriority="high" so the
   *  above-the-fold grid paints crisp. Below the fold stays lazy. */
  priority?: boolean;
  /** When set and > 1, the tile represents a multi-page site:
   *  - link routes to /sites/[siteSlug] (gallery-style)
   *  - small "N pages" badge in the caption row
   *  Otherwise link routes to /screens/[slug] (single screen detail). */
  pageCount?: number;
  /** When true, on first hover the tile loads the full-page screenshot
   *  and slowly scrolls it top→bottom over ~5.5 s. Adds a tiny client
   *  island per tile but no upfront network cost - the full PNG is
   *  fetched only after the user actually hovers. Default off so
   *  callers opt in (we don't want this on cards in tight grids like
   *  /collections summaries). */
  hoverScroll?: boolean;
}) {
  const macroKey = screen.tags.macrostructure;
  const macro = macroKey ? MACROSTRUCTURE_LABELS[macroKey] : null;

  // The 4:3 and 16:9 boxes take the thumb capture; the 16:10 box takes
  // the hero, which IS 16:10 (1440x900) and therefore fills it without
  // any crop.
  //
  // Never silently fall back from hero to thumb here. The thumb is a
  // 768x1024 PORTRAIT tablet shot, and letting it stand in for the hero
  // is what made every archive tile render as a magnified middle slice
  // of the page. If a row has no heroVariants the plain <img> src is
  // still the right capture; a missing srcset costs bytes, a wrong
  // srcset costs the whole framing.
  const variants =
    variant === "thumb" ? screen.thumbVariants : screen.heroVariants;

  const fallbackSrc =
    variant === "thumb" ? screen.thumbUrl : screen.imageUrl;

  const isMultiPage = (pageCount ?? 0) > 1;
  const href = isMultiPage
    ? `/sites/${screen.siteSlug}`
    : `/screens/${screen.slug}`;

  // Background - LQIP if encoded, otherwise the palette gradient that
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
    <article
      className={`group relative ${className}`}
      data-index={index ?? undefined}
    >
      {/* The media box is no longer wrapped in the link. The pager puts
          real <button>s over the screenshot, and a button inside an
          anchor is invalid HTML with genuinely unpredictable hit-
          testing. Instead the link is an overlay that covers the box,
          and the arrows sit one layer above it. */}
      <div
        className={`relative w-full overflow-hidden rounded-tile border rule transition-transform duration-[280ms] ease-out group-hover:scale-[1.012] ${ASPECT[variant]}`}
        style={bgStyle}
      >
        <TileMedia
          siteSlug={screen.siteSlug}
          imageUrl={fallbackSrc}
          heroVariants={variants}
          fullPageUrl={hoverScroll ? screen.fullPageUrl : undefined}
          fullVariants={screen.fullVariants}
          alt={
            screen.description
              ? `${screen.title} - ${screen.description}`
              : screen.title
          }
          title={screen.title}
          sizes={TILE_SIZES}
          priority={priority}
          hoverScroll={hoverScroll}
          pageCount={pageCount ?? 1}
        >
          <Link
            href={href}
            aria-label={screen.title}
            className="absolute inset-0 z-10 rounded-tile focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-link)]"
          />
        </TileMedia>

        {/* Hover pills - the tile stays caption-free at rest (the
            grid is the point); on hover two floating capsules fade
            in INSIDE the image: title (+ page count) bottom-left,
            palette dots bottom-right. Reads on focus too for
            keyboard users. */}
        <div
          className="pointer-events-none absolute inset-x-2.5 bottom-2.5 z-20 flex items-center justify-between gap-2 opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100 group-focus-within:opacity-100"
          aria-hidden
        >
          <span className="flex min-w-0 items-baseline gap-2 rounded-full border rule bg-[color-mix(in_oklab,var(--color-bg)_86%,transparent)] px-3.5 py-1.5 backdrop-blur-md">
            <span className="truncate font-display text-sm leading-snug text-[var(--color-fg)]">
              {screen.title}
            </span>
            <span className="text-meta hidden whitespace-nowrap sm:inline">
              {isMultiPage
                ? `${pageCount} pages`
                : (macro ?? screen.tags.style[0] ?? "")}
            </span>
          </span>
          <span className="hidden shrink-0 items-center gap-1 rounded-full border rule bg-[color-mix(in_oklab,var(--color-bg)_86%,transparent)] px-2.5 py-2 backdrop-blur-md sm:flex">
            {screen.palette.slice(0, 4).map((hex, i) => (
              <span
                key={`${hex}-${i}`}
                title={hex}
                className="block h-2.5 w-2.5 rounded-full"
                style={{ background: hex }}
              />
            ))}
          </span>
        </div>
      </div>

      {showCaption && (
        // Second link to the same target. Kept out of the tab order so
        // the tile is one stop, not two.
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden
          className="mt-3 flex items-baseline justify-between gap-3"
        >
          <p className="font-display text-lg leading-tight">
            <span className="transition-colors group-hover:text-[var(--color-link)]">
              {screen.title}
            </span>
          </p>
          <p className="text-meta whitespace-nowrap">
            {isMultiPage ? `${pageCount} pages` : (macro ?? screen.tags.style[0] ?? "-")}
          </p>
        </Link>
      )}
    </article>
  );
}
