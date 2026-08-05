/**
 * Loading state for /screens. Mirrors the shipped layout: a search
 * capsule up top, a pill filter bar, then the full-bleed skeleton
 * grid. gallery-style: something is always on screen, never an empty
 * page.
 */

import { SkeletonGrid } from "@/components/skeleton-tile";

export default function ScreensLoading() {
  return (
    <>
      <section className="px-4 pt-8 pb-6 sm:pt-10">
        <div className="mx-auto max-w-[48rem]">
          <div className="h-[54px] rounded-full border rule bg-[color-mix(in_oklab,var(--color-fg)_3%,var(--color-bg))]" />
        </div>
      </section>

      <section className="px-2 pb-24 sm:px-3">
        {/* Filter pill bar skeleton */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {[16, 12, 14, 13, 20, 12].map((w, i) => (
            <span
              key={i}
              className="block h-9 rounded-full border rule bg-[color-mix(in_oklab,var(--color-fg)_4%,var(--color-bg))]"
              style={{ width: `${w * 0.25}rem` }}
            />
          ))}
        </div>

        <SkeletonGrid count={15} />
      </section>
    </>
  );
}
