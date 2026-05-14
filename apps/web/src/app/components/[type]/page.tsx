import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { findComponents } from "@inspo/db";
import type { ComponentType } from "@inspo/shared";
import { Dateline } from "@/components/dateline";

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
  hero: "Above-the-fold statements — the line everyone reads first.",
  pricing: "Plan comparisons, price cards, billing toggles.",
  features: "Bento grids, feature trios, product blocks.",
  cta: "Mid-page conversion sections — usually one or two big buttons.",
  nav: "Top navigation rows.",
  footer: "Site colophons, link maps, fine print.",
  testimonial: "Customer quotes, reviews, social proof.",
  "logo-cloud": "The strip of partner / customer logos.",
  faq: "Question stacks, accordion-style FAQ blocks.",
  stat: "Rows of big numbers — usage stats, revenue, scale.",
};

const TYPES = Object.keys(TYPE_LABELS) as ComponentType[];

export function generateStaticParams() {
  return TYPES.map((type) => ({ type }));
}

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

  const hits = await findComponents({ type, limit: 120 });
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
          <p className="text-meta mt-2">{hits.length} on file</p>
        </div>
        <div className="lg:col-span-10 space-y-4">
          <h1 className="font-display max-w-[24ch] text-balance text-5xl leading-[1] tracking-tight sm:text-6xl">
            {label}
          </h1>
          <p className="max-w-[60ch] text-[var(--color-fg-muted)]">{hint}</p>
        </div>
      </section>

      {/* Grid ───────────────────────────────────────────────── */}
      <section className="border-t rule pb-24 pt-10">
        {hits.length === 0 ? (
          <p className="text-meta py-20 text-center">
            No examples extracted yet — backfill is still running.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {hits.map((h) => (
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
        )}
      </section>
    </div>
  );
}
