/**
 * Loading state for /screens/[slug]. Shows the page shell with
 * placeholder bands while the detail page hydrates, so the
 * navigation feels instant and the content fills in.
 */

import { Dateline } from "@/components/dateline";

export default function ScreenLoading() {
  return (
    <div>
      <div className="mx-auto max-w-[120rem] px-6 pt-12 sm:px-10 sm:pt-16">
        <div className="grid grid-cols-1 gap-y-8 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-2">
            <Dateline label="Loading" />
          </div>
          <div className="lg:col-span-10 space-y-6">
            <span className="block h-[60px] w-[60%] bg-[color-mix(in_oklab,var(--color-fg)_8%,var(--color-bg))]" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="block h-[24px] w-16 bg-[color-mix(in_oklab,var(--color-fg)_5%,var(--color-bg))]"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-[120rem] px-6 sm:mt-16 sm:px-10">
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-card border rule bg-[color-mix(in_oklab,var(--color-fg)_5%,var(--color-bg))]">
          <span className="screens-skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}
