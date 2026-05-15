/* Hallmark · macrostructure: Index Hub · theme: Inspo-paper
 * Diverges from /screens (Marquee Hero) on macrostructure type — a
 * grid of type-cards with live mini-previews acts as a deliberate
 * sibling page, not a copy.
 */

import Link from "next/link";
import type { Metadata } from "next";
import { findComponents } from "@inspo/db";
import type { ComponentType } from "@inspo/shared";
import { getReferences } from "@/components/reference";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Components",
  description:
    "Canonical patterns — heroes, pricing, footers, CTAs — built fresh, Hallmark-disciplined, distinct macrostructures.",
};

const TYPES: { type: ComponentType; label: string; hint: string }[] = [
  { type: "hero", label: "Heroes", hint: "Marquee · Stat-Led · Manifesto" },
  { type: "footer", label: "Footers", hint: "Colophon · Statement · Index" },
  { type: "cta", label: "CTAs", hint: "Quiet · Banded · Form-led" },
  { type: "pricing", label: "Pricing", hint: "Plan comparisons & price cards" },
  { type: "features", label: "Features", hint: "Bento grids, feature blocks" },
  { type: "nav", label: "Nav bars", hint: "Top navigation rows" },
  { type: "testimonial", label: "Testimonials", hint: "Quotes & social proof" },
  { type: "logo-cloud", label: "Logo clouds", hint: "Trust strips" },
  { type: "faq", label: "FAQ", hint: "Accordion question stacks" },
  { type: "stat", label: "Stat strips", hint: "Big-number rows" },
];

export default async function ComponentsIndex() {
  // Per-type teasers: count of references + any crop in the catalogue.
  const teasers = await Promise.all(
    TYPES.map(async (t) => {
      const refs = getReferences(t.type);
      const crops = await findComponents({ type: t.type, limit: 1 });
      return {
        ...t,
        refCount: refs.length,
        firstRef: refs[0],
        cropCount: crops.length,
        firstCrop: crops[0],
      };
    }),
  );

  const totalRefs = teasers.reduce((n, t) => n + t.refCount, 0);

  return (
    <div className="mx-auto max-w-[120rem] px-6 sm:px-10">
      {/* Header ─────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-y-10 pt-16 pb-16 sm:pt-24 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-2">
          <p className="text-meta">Components</p>
          <p className="text-meta mt-2 text-[var(--color-fg-muted)]">
            {totalRefs} reference{totalRefs === 1 ? "" : "s"} on file
          </p>
        </div>
        <div className="lg:col-span-10 space-y-6">
          <h1 className="font-display max-w-[20ch] text-balance text-5xl leading-[1] tracking-tight sm:text-6xl lg:text-7xl">
            The building blocks,{" "}
            <em className="italic">filed by archetype</em>.
          </h1>
          <p className="max-w-[60ch] text-[var(--color-fg-muted)]">
            Canonical patterns built fresh — each one a distinct
            macrostructure, each one rendered live so you can inspect the
            markup. Real captures from the archive sit alongside as
            cropped reference once the backfill catches up.
          </p>
        </div>
      </section>

      {/* Type tiles ─────────────────────────────────────────── */}
      <section className="border-t rule pb-24 pt-12">
        <ul className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {teasers.map((t) => {
            const populated = t.refCount > 0;
            return (
              <li key={t.type}>
                <Link
                  href={`/components/${t.type}`}
                  className="group block"
                  aria-disabled={!populated}
                >
                  <div
                    className={`
                      relative aspect-[16/10] overflow-hidden border rule
                      bg-[color-mix(in_oklab,var(--color-fg)_3%,var(--color-bg))]
                      transition-transform duration-[280ms] ease-out
                      ${populated ? "group-hover:scale-[1.012]" : "opacity-60"}
                    `}
                  >
                    {populated && t.firstRef ? (
                      /* Mini live render — scaled-down view of the first
                         reference. transform: scale flattens it into a
                         miniature; pointer-events-none so the tile itself
                         remains the click target. */
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 origin-top-left"
                        style={{
                          transform: "scale(0.32)",
                          width: "calc(100% / 0.32)",
                          height: "calc(100% / 0.32)",
                        }}
                      >
                        <t.firstRef.Component />
                      </div>
                    ) : t.firstCrop ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={`/api/component/${t.firstCrop.screen.slug}/${t.firstCrop.idx}`}
                        alt={`${t.label} example`}
                        className="h-full w-full object-cover object-top"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <p className="text-meta">In the queue</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-baseline justify-between gap-3">
                    <p
                      className={`
                        font-display text-lg leading-tight transition-colors
                        ${populated ? "group-hover:text-[var(--color-link)]" : ""}
                      `}
                    >
                      {t.label}
                    </p>
                    <p className="text-meta whitespace-nowrap">
                      {populated
                        ? `${t.refCount} ref${t.refCount === 1 ? "" : "s"}`
                        : "—"}
                    </p>
                  </div>
                  <p className="text-meta mt-1 normal-case tracking-normal text-[var(--color-fg-muted)]">
                    {t.hint}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
