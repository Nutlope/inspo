/**
 * Loading state for /screens. Shows the editorial header shell + a
 * 12-tile skeleton grid while the SSR HTML hydrates. Mobbin-style:
 * something is always on screen, never an empty page.
 */

import { Dateline } from "@/components/dateline";
import { SkeletonGrid } from "@/components/skeleton-tile";

export default function ScreensLoading() {
  return (
    <div className="mx-auto max-w-[120rem] px-6 sm:px-10">
      <section className="pt-10 pb-8 sm:pt-14">
        <div className="grid grid-cols-1 gap-y-6 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-2">
            <Dateline label="The archive" />
          </div>
          <div className="lg:col-span-10 space-y-4">
            <p className="text-meta">Loading the archive…</p>
            <div className="max-w-[40rem]">
              <div className="h-[60px] border-b border-[var(--color-border)]/60" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t rule pt-10 pb-24">
        <div className="grid grid-cols-1 gap-y-12 lg:grid-cols-12 lg:gap-x-10">
          {/* Filter rail skeleton */}
          <aside className="lg:col-span-2">
            <div className="space-y-10">
              {[1, 2, 3, 4, 5, 6].map((g) => (
                <div key={g} className="space-y-3">
                  <span className="block h-[10px] w-16 bg-[color-mix(in_oklab,var(--color-fg)_8%,var(--color-bg))]" />
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span
                      key={i}
                      className="block h-[12px] bg-[color-mix(in_oklab,var(--color-fg)_5%,var(--color-bg))]"
                      style={{ width: `${50 + ((i * 17) % 35)}%` }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </aside>

          {/* Grid skeleton */}
          <div className="lg:col-span-10">
            <div className="mb-6 flex items-baseline justify-between border-b rule pb-4">
              <span className="block h-[10px] w-24 bg-[color-mix(in_oklab,var(--color-fg)_8%,var(--color-bg))]" />
              <span className="block h-[10px] w-16 bg-[color-mix(in_oklab,var(--color-fg)_8%,var(--color-bg))]" />
            </div>
            <SkeletonGrid count={12} />
          </div>
        </div>
      </section>
    </div>
  );
}
