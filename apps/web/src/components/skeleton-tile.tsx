/**
 * Skeleton placeholder for a ScreenTile. Same border + aspect-ratio,
 * faint shimmer animation. Used as a Suspense fallback while a /screens
 * route hydrates and as the inner fallback for tiles whose images
 * haven't finished loading yet.
 *
 * Animation lives in globals.css under `screens-grid-shimmer`.
 */

type Variant = "thumb" | "hero" | "feature";

const ASPECT: Record<Variant, string> = {
  thumb: "aspect-[4/3]",
  hero: "aspect-[16/10]",
  feature: "aspect-[16/9]",
};

export function SkeletonTile({
  variant = "hero",
  showCaption = false,
}: {
  variant?: Variant;
  showCaption?: boolean;
}) {
  return (
    <div className="screens-skeleton-item" aria-hidden>
      <div
        className={`relative w-full overflow-hidden rounded-tile border rule bg-[color-mix(in_oklab,var(--color-fg)_5%,var(--color-bg))] ${ASPECT[variant]}`}
      >
        <span className="screens-skeleton-shimmer" />
      </div>
      {showCaption && (
        <div className="mt-3 flex items-baseline justify-between gap-3">
          <span className="block h-[18px] w-[55%] rounded-full bg-[color-mix(in_oklab,var(--color-fg)_8%,var(--color-bg))]" />
          <span className="block h-[10px] w-14 rounded-full bg-[color-mix(in_oklab,var(--color-fg)_8%,var(--color-bg))]" />
        </div>
      )}
    </div>
  );
}

export function SkeletonGrid({ count = 15 }: { count?: number }) {
  return (
    // Gap tracks the real grid in screens-grid.tsx: 2.5 at mobile,
    // 3 from sm up. A mismatched gap reflows every tile the moment the
    // real grid mounts.
    <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] sm:gap-3">
      {Array.from({ length: count }, (_, i) => (
        <li
          key={i}
          className="screens-skeleton-item"
          style={{ ["--idx" as string]: Math.min(i, 11) }}
        >
          <SkeletonTile />
        </li>
      ))}
    </ul>
  );
}
