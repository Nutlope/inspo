import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { findComponents } from "@inspo/db";
import type { ComponentType } from "@inspo/shared";
import { getReferences } from "@/components/reference";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<ComponentType, string> = {
  hero: "Heroes",
  pricing: "Pricing",
  features: "Features",
  cta: "CTAs",
  nav: "Nav bars",
  footer: "Footers",
  testimonial: "Testimonials",
  "logo-cloud": "Logo clouds",
  faq: "FAQ",
  stat: "Stat strips",
};

const TYPE_HINTS: Record<ComponentType, string> = {
  hero: "The line everyone reads first - and the macrostructure that frames it.",
  pricing: "Plan comparisons, price cards, billing toggles.",
  features: "Bento grids, feature trios, product blocks.",
  cta: "Mid-page conversion sections - earn loudness by being singular.",
  nav: "Top navigation rows.",
  footer: "Site colophons, link maps, fine print.",
  testimonial: "Customer quotes, reviews, social proof.",
  "logo-cloud": "The strip of partner / customer logos.",
  faq: "Question stacks, accordion-style FAQ blocks.",
  stat: "Rows of big numbers - usage stats, revenue, scale.",
};

const TYPES = Object.keys(TYPE_LABELS) as ComponentType[];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}): Promise<Metadata> {
  const { type } = await params;
  const label = TYPE_LABELS[type as ComponentType];
  if (!label) return { title: "Not found" };
  return {
    title: label,
    description: TYPE_HINTS[type as ComponentType],
  };
}

export default async function ComponentTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type: rawType } = await params;
  if (!TYPES.includes(rawType as ComponentType)) notFound();
  const type = rawType as ComponentType;

  const references = getReferences(type);
  const crops = await findComponents({ type, limit: 60 });
  // Only genuine per-element crops belong in the "from the archive" grid.
  // Tag-based fallback hits carry idx:-1 (no crop), and
  // /api/component/<slug>/-1 returns HTTP 400 - rendering them paints a
  // wall of broken images. Until the crop backfill lands, drop them.
  const realCrops = crops.filter((h) => !h.fallback && h.idx >= 0);
  const label = TYPE_LABELS[type];
  const hint = TYPE_HINTS[type];

  return (
    <div className="mx-auto max-w-[120rem] px-6 sm:px-10">
      {/* Header ─────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-y-8 pt-12 pb-12 sm:pt-16 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-2">
          <p className="text-meta">
            <Link href="/components" className="hover:text-[var(--color-link)]">
              ← Components
            </Link>
          </p>
          <p className="text-meta mt-2">
            {references.length} reference{references.length === 1 ? "" : "s"}
            {realCrops.length > 0 ? ` · ${realCrops.length} captured` : ""}
          </p>
        </div>
        <div className="lg:col-span-10 space-y-4">
          <h1 className="font-display max-w-[24ch] text-balance text-5xl leading-[1] tracking-tight sm:text-6xl">
            {label}
          </h1>
          <p className="max-w-[60ch] text-[var(--color-fg-muted)]">{hint}</p>
        </div>
      </section>

      {/* References: canonical reference components, live examples ── */}
      {references.length > 0 && (
        <section className="border-t rule pb-24 pt-16 space-y-24">
          {references.map((ref, i) => (
            <article key={ref.id} id={ref.id} className="space-y-6">
              <header className="grid grid-cols-1 gap-y-3 lg:grid-cols-12 lg:gap-x-10">
                <div className="lg:col-span-2">
                  <p className="text-meta">
                    {String(i + 1).padStart(2, "0")} ·{" "}
                    <span className="text-[var(--color-fg)]">{ref.label}</span>
                  </p>
                </div>
                <div className="lg:col-span-10">
                  <p className="text-meta tracking-normal text-[var(--color-fg)]">
                    {ref.macro}
                  </p>
                  <p className="mt-2 max-w-[60ch] text-[var(--color-fg-muted)]">
                    {ref.note}
                  </p>
                </div>
              </header>
              <div className="grid grid-cols-1 gap-x-10 lg:grid-cols-12">
                <div className="lg:col-span-12">
                  {/* Live render. The example IS the artifact - no crop,
                      no screenshot, no PNG. Designers can inspect, copy,
                      and read hover behaviour in their devtools. */}
                  <ref.Component />
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Real captures - extracted crops from production sites.
          Empty in production today (no component coords in the static
          seed). Kept so when the backfill lands the grid populates
          without code changes. */}
      {realCrops.length > 0 && (
        <section className="border-t rule pt-16 pb-24">
          <div className="mb-10 grid grid-cols-1 gap-y-3 lg:grid-cols-12 lg:gap-x-10">
            <div className="lg:col-span-2">
              <p className="text-meta">From the archive</p>
            </div>
            <p className="text-meta tracking-normal text-[var(--color-fg-muted)] lg:col-span-10">
              The same pattern, cropped from real production sites.
            </p>
          </div>

          <ul className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {realCrops.map((h) => (
              <li key={`${h.screen.slug}-${h.idx}`}>
                <Link
                  href={`/sites/${h.screen.siteSlug}`}
                  className="group block"
                >
                  <div className="aspect-[16/10] overflow-hidden border rule bg-[color-mix(in_oklab,var(--color-fg)_5%,var(--color-bg))] transition-transform duration-[280ms] ease-out group-hover:scale-[1.012]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/component/${h.screen.slug}/${h.idx}`}
                      alt={h.region.label ?? `${type} from ${h.screen.title}`}
                      className="h-full w-full object-cover object-top"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="mt-3 flex items-baseline justify-between gap-3">
                    <p className="font-display text-lg leading-tight transition-colors group-hover:text-[var(--color-link)]">
                      {h.screen.title}
                    </p>
                    <p className="text-meta whitespace-nowrap">
                      {Math.round(h.region.width)}×{Math.round(h.region.height)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {references.length === 0 && realCrops.length === 0 && (
        <section className="border-t rule pb-24 pt-16">
          <p className="text-meta py-20 text-center">
            Nothing on file for {label.toLowerCase()} yet.
          </p>
        </section>
      )}
    </div>
  );
}
