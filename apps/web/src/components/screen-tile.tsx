import type { ScreenSummary } from "@inspo/shared";
import { MACROSTRUCTURE_LABELS } from "@inspo/taxonomy";
import { TransitionLink as Link } from "@/components/transition-link";

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

function buildSrcSet(entries: { w: number; url: string }[]): string {
  return entries.map((e) => `${e.url} ${e.w}w`).join(", ");
}

export function ScreenTile({
  screen,
  variant = "thumb",
  index,
  showCaption = true,
  className = "",
  priority = false,
  pageCount,
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
   *  - link routes to /sites/[siteSlug] (Mobbin-style)
   *  - small "N pages" badge in the caption row
   *  Otherwise link routes to /screens/[slug] (single screen detail). */
  pageCount?: number;
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <picture>
            {variants?.avif?.length ? (
              <source
                type="image/avif"
                srcSet={buildSrcSet(variants.avif)}
                sizes={TILE_SIZES}
              />
            ) : null}
            {variants?.webp?.length ? (
              <source
                type="image/webp"
                srcSet={buildSrcSet(variants.webp)}
                sizes={TILE_SIZES}
              />
            ) : null}
            <img
              src={fallbackSrc}
              alt={`${screen.title} — ${screen.description}`}
              className="h-full w-full object-cover"
              loading={priority ? "eager" : "lazy"}
              decoding={priority ? "sync" : "async"}
              // @ts-expect-error — fetchpriority is valid HTML, React types lag
              fetchpriority={priority ? "high" : undefined}
            />
          </picture>

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
