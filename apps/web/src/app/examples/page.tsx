/**
 * /examples - "Made with Inspo". A clean, uniform gallery of real pages
 * an agent built using only the catalogue. Every card shows the actual
 * page (live, scaled iframe) at a fixed 16:10 hero - crisp, consistent,
 * never cropped to a sliver, moderate size. Hover reveals the one-line
 * prompt + build stats; click opens the case study (prompt, references,
 * MCP calls, traced palette).
 *
 * (The desktop↔mobile responsiveness showcase lives on the catalogue
 * detail pages - /screens/[slug] - as a paired view.)
 */

import Link from "next/link";
import type { Metadata } from "next";
import { EXAMPLES, type Example } from "@/lib/examples";

export const metadata: Metadata = {
  title: "Examples - Made with Inspo",
  description:
    "Real landing pages built by an agent with nothing but the Inspo MCP. See the prompt, the references it studied, and the design system it traced.",
};

/** Curated display order. Examples not listed are appended in source
 *  order, so the page stays correct as the set grows. */
const ORDER = [
  "nocturne-festival",
  "spark-hall",
  "wavecast",
  "setwidth-foundry",
  "nightjar-sleeper",
  "alder-money",
  "northline-transit",
  "sable-patisserie",
  "attract-mode",
  "coldframe-seedbank",
  "coire-dubh",
  "long-table-essay",
  "driftmail",
  "saltgate-lido",
  "tidepool-trust",
  "loom-audio",
  "studio-volta",
  "meridian-review",
  "halcyon-optics",
  "atelier-grau",
  "rill-radio",
  "aureole-parfum",
  "vaultline-pricing",
  "fieldnote-db",
  "ember-and-ash",
];

function ordered(): Example[] {
  const bySlug = new Map(EXAMPLES.map((e) => [e.slug, e]));
  const out: Example[] = [];
  const seen = new Set<string>();
  for (const slug of ORDER) {
    const e = bySlug.get(slug);
    if (e) {
      out.push(e);
      seen.add(slug);
    }
  }
  for (const e of EXAMPLES) if (!seen.has(e.slug)) out.push(e);
  return out;
}

export default function ExamplesPage() {
  const examples = ordered();

  return (
    <div className="mx-auto max-w-[88rem] px-4 sm:px-6">
      {/* Masthead ─────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-y-8 pt-16 pb-12 sm:pt-24 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-3">
          <p className="text-meta">Examples</p>
          <p className="text-meta mt-2 max-w-[22ch] text-[var(--color-fg-muted)]">
            {EXAMPLES.length} pages · built with nothing but the Inspo MCP
          </p>
        </div>
        <div className="lg:col-span-9">
          <h1 className="font-display max-w-[20ch] text-balance text-[length:var(--text-h1)] leading-[0.95] tracking-tight">
            Made with <em className="not-italic text-[var(--color-link)]">Inspo</em>.
          </h1>
          <p className="mt-6 max-w-[64ch] text-[var(--color-fg-muted)]">
            Each page below was built by a coding agent given one sentence
            and nothing but the Inspo MCP - no design skill, no templates,
            no component library. Hover any card for the prompt; open it
            for the references it studied, every tool call it made, and the
            palette it traced back to real sites.
          </p>
        </div>
      </section>

      {/* Gallery ──────────────────────────────────────────── */}
      <section className="border-t rule pt-10 pb-24">
        <ul className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {examples.map((ex) => (
            <li key={ex.slug}>
              <Link
                href={`/examples/${ex.slug}`}
                className="group block focus:outline-none"
              >
                <div className="relative overflow-hidden border rule transition-[transform,box-shadow] duration-300 ease-out group-hover:-translate-y-0.5 group-hover:shadow-[0_14px_44px_-16px_rgba(0,0,0,0.4)] group-focus-visible:-translate-y-0.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/examples/${ex.slug}/thumb.jpg`}
                    alt={`${ex.brand} - preview`}
                    className="block aspect-[16/10] w-full bg-[color-mix(in_oklab,var(--color-fg)_5%,var(--color-bg))] object-cover object-top"
                    loading="lazy"
                    decoding="async"
                  />

                  {/* Hover tooltip - prompt + build stats */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 translate-y-2 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100">
                    <div className="bg-gradient-to-t from-black/85 via-black/55 to-transparent p-4 pt-10">
                      <p className="max-w-[42ch] text-sm leading-snug text-white">
                        “{ex.prompt}”
                      </p>
                      <p className="mt-2 font-mono text-xs tracking-normal text-white/65">
                        {ex.references.length} refs · {ex.mcpCalls.length}+ calls
                        · {ex.scoreSelf.toFixed(1)}/10
                      </p>
                    </div>
                  </div>
                </div>

                {/* Caption */}
                <div className="mt-3 flex items-baseline justify-between gap-3">
                  <h2 className="font-display text-lg leading-tight">
                    <span className="transition-colors group-hover:text-[var(--color-link)]">
                      {ex.brand}
                    </span>
                  </h2>
                  <span className="text-meta whitespace-nowrap text-[var(--color-fg-muted)]">
                    {ex.stack.replace("-", " + ")} · {ex.mode}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
