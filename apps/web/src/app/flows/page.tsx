/**
 * /flows — journeys, not just heroes.
 *
 * gallery's edge is that it shows full multi-screen user flows, which
 * teach an agent how a product walks a user from landing to conversion
 * — richer signal than a single page. We capture multiple pages per
 * site already; this surface reframes those as ordered journeys and
 * routes into the existing /sites/[slug] master-detail viewer.
 *
 * Server-side: one pass over all screens, grouped by site, keeping
 * sites with 2+ distinct page types, ranked by journey richness.
 */

import Link from "next/link";
import type { Metadata } from "next";
import { getAllScreens } from "@inspo/db";
import type { ScreenSummary } from "@inspo/shared";
import { ScreenTile } from "@/components/screen-tile";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Flows — Inspo",
  description:
    "Full multi-page journeys from real products — landing to pricing to sign-up. The arc, not just the hero.",
};

const PAGE_TYPE_ORDER: Record<string, number> = {
  landing: 0,
  features: 1,
  pricing: 2,
  auth: 3,
  about: 4,
  blog: 5,
  changelog: 6,
  docs: 7,
  other: 8,
};

const PAGE_TYPE_LABEL: Record<string, string> = {
  landing: "landing",
  features: "features",
  pricing: "pricing",
  auth: "sign-up",
  about: "about",
  blog: "blog",
  changelog: "changelog",
  docs: "docs",
  other: "more",
};

interface Journey {
  siteSlug: string;
  hero: ScreenSummary;
  steps: string[]; // ordered distinct page types
  pageCount: number;
}

export default async function FlowsPage() {
  const all = await getAllScreens();
  const bySite = new Map<string, ScreenSummary[]>();
  for (const s of all) {
    const g = bySite.get(s.siteSlug) ?? [];
    g.push(s);
    bySite.set(s.siteSlug, g);
  }

  const journeys: Journey[] = [];
  for (const [siteSlug, rows] of bySite.entries()) {
    const types = new Set(rows.map((r) => r.pageType));
    if (types.size < 2) continue; // a journey needs more than one stop
    const hero = rows.find((r) => r.slug === siteSlug) ?? rows[0]!;
    const steps = [...types].sort(
      (a, b) => (PAGE_TYPE_ORDER[a] ?? 9) - (PAGE_TYPE_ORDER[b] ?? 9),
    );
    journeys.push({ siteSlug, hero, steps, pageCount: rows.length });
  }
  // Richest journeys first; tiebreak by total pages.
  journeys.sort(
    (a, b) => b.steps.length - a.steps.length || b.pageCount - a.pageCount,
  );

  return (
    <div className="mx-auto max-w-[120rem] px-6 sm:px-10">
      {/* Masthead ─────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-y-8 pt-16 pb-12 sm:pt-24 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-2">
          <p className="text-meta">Flows</p>
          <p className="text-meta mt-2 max-w-[18ch] text-[var(--color-fg-muted)]">
            {journeys.length} multi-page journeys
          </p>
        </div>
        <div className="lg:col-span-10">
          <h1 className="font-display max-w-[18ch] text-balance text-[clamp(2.5rem,5.5vw,5rem)] leading-[0.95] tracking-tight">
            The arc, <em className="italic">not just the hero.</em>
          </h1>
          <p className="mt-6 max-w-[62ch] text-[var(--color-fg-muted)]">
            A landing page is one moment. A journey — landing → features →
            pricing → sign-up — shows how a real product earns a user step
            by step. Open any one to walk its pages. Agents can pull the
            same arc with{" "}
            <code className="font-mono text-[0.95em] text-[var(--color-fg)]">
              get_flow(siteSlug)
            </code>
            .
          </p>
        </div>
      </section>

      {/* Grid ─────────────────────────────────────────────── */}
      <section className="border-t rule pt-12 pb-24">
        <ul className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
          {journeys.map((j) => (
            <li key={j.siteSlug} className="group">
              <Link href={`/sites/${j.siteSlug}`} className="block focus:outline-none">
                <ScreenTile
                  screen={j.hero}
                  variant="hero"
                  showCaption={false}
                  hoverScroll
                />
                <div className="mt-4 flex items-baseline justify-between gap-3">
                  <h2 className="font-display text-xl leading-tight">
                    <span className="transition-colors group-hover:text-[var(--color-link)]">
                      {j.hero.title}
                    </span>
                  </h2>
                  <span className="text-meta whitespace-nowrap text-[var(--color-fg-muted)]">
                    {j.pageCount} pages
                  </span>
                </div>
                {/* Journey chips */}
                <ol className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1.5">
                  {j.steps.map((t, i) => (
                    <li key={t} className="flex items-center gap-1.5">
                      {i > 0 && (
                        <span aria-hidden className="text-meta text-[var(--color-fg-muted)]">
                          →
                        </span>
                      )}
                      <span className="border rule px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--color-fg-muted)]">
                        {PAGE_TYPE_LABEL[t] ?? t}
                      </span>
                    </li>
                  ))}
                </ol>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
