import Link from "next/link";
import type { Metadata } from "next";
import { findComponents } from "@inspo/db";
import type { ComponentType } from "@inspo/shared";
import { Dateline } from "@/components/dateline";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Components",
  description:
    "Browse the building blocks of real production sites — heroes, pricing tables, nav bars, footers — cropped from captures.",
};

const TYPES: { type: ComponentType; label: string; hint: string }[] = [
  { type: "hero", label: "Heroes", hint: "Above-the-fold statements" },
  { type: "pricing", label: "Pricing", hint: "Plan comparisons & price cards" },
  { type: "features", label: "Features", hint: "Bento grids, feature blocks" },
  { type: "cta", label: "CTAs", hint: "Mid-page call-to-action sections" },
  { type: "nav", label: "Nav bars", hint: "Top navigation rows" },
  { type: "footer", label: "Footers", hint: "Site colophons & link maps" },
  { type: "testimonial", label: "Testimonials", hint: "Quotes & social proof" },
  { type: "logo-cloud", label: "Logo clouds", hint: "Trust strips" },
  { type: "faq", label: "FAQ", hint: "Accordion question stacks" },
  { type: "stat", label: "Stat strips", hint: "Big-number rows" },
];

export default async function ComponentsIndex() {
  // Get one example crop per type to render as a teaser tile.
  const teasers = await Promise.all(
    TYPES.map(async (t) => {
      const hits = await findComponents({ type: t.type, limit: 1 });
      return { ...t, hit: hits[0] };
    }),
  );

  return (
    <div className="mx-auto max-w-[120rem] px-6 sm:px-10">
      {/* Header ─────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-y-10 pt-16 pb-16 sm:pt-24 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-2">
          <Dateline label="Components" />
        </div>
        <div className="lg:col-span-10 space-y-6">
          <h1 className="font-display max-w-[20ch] text-balance text-5xl leading-[1] tracking-tight sm:text-6xl lg:text-7xl">
            The building blocks, <em className="italic">sliced</em>.
          </h1>
          <p className="max-w-[60ch] text-[var(--color-fg-muted)]">
            Designers don&rsquo;t copy whole sites — they study patterns. Each
            tile below is a component cropped from a real captured page. Open
            one to compare how dozens of teams handle pricing, heroes, footers,
            CTAs.
          </p>
        </div>
      </section>

      {/* Type tiles ─────────────────────────────────────────── */}
      <section className="border-t rule pb-24 pt-12">
        <ul className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {teasers.map((t) => (
            <li key={t.type}>
              <Link href={`/components/${t.type}`} className="group block">
                <div className="aspect-[16/10] overflow-hidden border rule bg-[color-mix(in_oklab,var(--color-fg)_5%,var(--color-bg))] transition-transform duration-[280ms] ease-out group-hover:scale-[1.012]">
                  {t.hit ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={`/api/component/${t.hit.screen.slug}/${t.hit.idx}`}
                      alt={`${t.label} example`}
                      className="h-full w-full object-cover object-top"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-meta">
                      no examples yet
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-baseline justify-between gap-3">
                  <p className="font-display text-lg leading-tight transition-colors group-hover:text-[var(--color-link)]">
                    {t.label}
                  </p>
                  <p className="text-meta">{t.hint}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
