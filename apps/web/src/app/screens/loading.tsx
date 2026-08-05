/**
 * Loading state for /screens.
 *
 * Must mirror the shipped layout exactly or the page visibly jumps when
 * the real grid swaps in. The search capsule used to be a wide centred
 * bar in its own section; it now sits at the LEFT of a single row with
 * the filter pills pushed right, inside the same padded section as the
 * grid. The numbers below are measured off the live page rather than
 * guessed:
 *
 *   section padding   pt-6 px-2 pb-24 · sm:pt-8 sm:px-3
 *   row               40px tall, mb-5
 *   search capsule    max-w-[26rem], 40px tall
 *   filter pills      40px tall, right-aligned
 *   grid              gap-2.5 sm:gap-3, minmax(20rem, 1fr)
 */

import { SkeletonGrid } from "@/components/skeleton-tile";

/** Pill widths in rem, eyeballed to the real labels (Style, Industry,
 *  Shape, Mode, Mood, Colour, Device) so the bar has the same rhythm
 *  rather than a row of identical blocks. */
const PILL_REMS = [6.2, 5, 5.3, 5.1, 6.6, 5.3, 6.6];

export default function ScreensLoading() {
  return (
    <section className="px-2 pt-6 pb-24 sm:px-3 sm:pt-8">
      {/* Search left, filter pills right - one row, same as the grid's
          own header. */}
      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="w-full min-w-[15rem] flex-1 sm:w-auto sm:max-w-[26rem]">
          <div className="h-10 rounded-full border rule bg-[color-mix(in_oklab,var(--color-fg)_3%,var(--color-bg))]" />
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {PILL_REMS.map((w, i) => (
              <span
                key={i}
                className="block h-10 rounded-full border rule bg-[color-mix(in_oklab,var(--color-fg)_4%,var(--color-bg))]"
                style={{ width: `${w}rem` }}
              />
            ))}
          </div>
          <span className="block h-[13px] w-20 rounded-full bg-[color-mix(in_oklab,var(--color-fg)_8%,var(--color-bg))]" />
        </div>
      </div>

      <SkeletonGrid count={16} />
    </section>
  );
}
