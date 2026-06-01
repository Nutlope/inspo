/**
 * /flows — real captured user journeys (signup / onboarding), the
 * thing gallery's flows feature does and the gallery's single-page
 * captures can't. Each card previews the journey's first frame + its
 * step count; the detail page plays the whole walk.
 *
 * Reads the worker's captures/_flows (dev-only). Empty state when no
 * flows have been captured yet.
 */

import Link from "next/link";
import type { Metadata } from "next";
import { getAllFlows, stopLabel } from "@/lib/flows";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Flows — Inspo",
  description:
    "Real signup + onboarding journeys, captured step by step with video. The arc a product walks a user through — not just a hero.",
};

export default function FlowsPage() {
  const flows = getAllFlows();

  return (
    <div className="mx-auto max-w-[120rem] px-6 sm:px-10">
      <section className="grid grid-cols-1 gap-y-8 pt-16 pb-12 sm:pt-24 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-2">
          <p className="text-meta">Flows</p>
          <p className="text-meta mt-2 max-w-[18ch] text-[var(--color-fg-muted)]">
            {flows.length} journeys captured
          </p>
        </div>
        <div className="lg:col-span-10">
          <h1 className="font-display max-w-[20ch] text-balance text-[clamp(2.5rem,5.5vw,5rem)] leading-[0.95] tracking-tight">
            Watch a product <em className="italic">earn a user.</em>
          </h1>
          <p className="mt-6 max-w-[62ch] text-[var(--color-fg-muted)]">
            Each of these was captured by actually walking the funnel —
            clicking “Sign up”, filling a throwaway account, advancing
            step by step — and recording every screen + the video. The
            real onboarding arc, not a single landing page.
          </p>
        </div>
      </section>

      {flows.length === 0 ? (
        <section className="border-t rule py-24">
          <p className="text-meta">No flows captured yet</p>
          <p className="mt-3 max-w-prose text-[var(--color-fg-muted)]">
            Run{" "}
            <code className="font-mono text-[var(--color-fg)]">
              pnpm --filter @inspo/worker exec tsx src/capture-flows-batch.ts
            </code>{" "}
            to populate this page.
          </p>
        </section>
      ) : (
        <section className="border-t rule pt-12 pb-24">
          <ul className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
            {flows.map((f) => {
              const first = f.steps[0];
              const reached = f.reachedSignupForm;
              return (
                <li key={f.slug} className="group">
                  <Link href={`/flows/${f.slug}`} className="block focus:outline-none">
                    <div className="relative aspect-[16/10] overflow-hidden border rule bg-[color-mix(in_oklab,var(--color-fg)_5%,var(--color-bg))]">
                      {first?.screenshot ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/api/flows/${f.slug}/${first.screenshot}`}
                          alt={`${f.slug} flow — first frame`}
                          className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : null}
                      <span className="absolute left-3 top-3 border rule bg-[var(--color-bg)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider">
                        {f.steps.length} steps
                      </span>
                      {f.video ? (
                        <span className="absolute right-3 top-3 border rule bg-[var(--color-bg)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider">
                          ▶ video
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-4 flex items-baseline justify-between gap-3">
                      <h2 className="font-display text-xl leading-tight">
                        <span className="transition-colors group-hover:text-[var(--color-link)]">
                          {hostOf(f.startUrl)}
                        </span>
                      </h2>
                      <span
                        className={`text-meta whitespace-nowrap ${reached ? "text-[var(--color-fg)]" : "text-[var(--color-fg-muted)]"}`}
                      >
                        {reached ? "signup walked" : "entry only"}
                      </span>
                    </div>
                    <p className="mt-2 text-meta text-[var(--color-fg-muted)]">
                      {stopLabel(f.stoppedReason)}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}
