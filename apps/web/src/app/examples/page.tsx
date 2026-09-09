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
  "halyard-marine",
  "shirakawa-kiln",
  "ravensgate-opera",
  "calder-frameworks",
  "ferrite-terminal",
  "copo-torto",
  "halden-robotics",
  "rook-lane",
  "chalkline-gym",
  "brenna-alpine",
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
    <>
      {/* Hero - compact and centered, same voice as the home page ── */}
      <section className="px-6 pt-16 pb-12 sm:px-10 sm:pt-24 sm:pb-16">
        <div className="mx-auto max-w-[68rem] text-center">
          <p className="text-meta">
            {EXAMPLES.length} pages · built with nothing but the Inspo MCP
          </p>
          <h1 className="font-display mx-auto mt-5 max-w-[20ch] text-balance text-[length:var(--text-h1)] leading-[0.95] tracking-tight">
            Made with <em className="not-italic text-[var(--color-link)]">Inspo</em>.
          </h1>
          <p className="mx-auto mt-6 max-w-[52ch] text-[var(--color-fg-muted)]">
            One sentence, one agent, no templates. Hover any card for the
            prompt; open it for the references, tool calls, and traced
            palette.
          </p>
        </div>
      </section>

      {/* Gallery - full-bleed, screenshots only. Brand + prompt live
          in the hover overlay, not under the tile. ─────────────── */}
      <section className="px-2 pb-14 sm:px-3">
        <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] sm:gap-3">
          {examples.map((ex) => (
            <li key={ex.slug}>
              <Link
                href={`/examples/${ex.slug}`}
                className="group block rounded-tile focus:outline-none"
              >
                <div className="relative overflow-hidden rounded-tile border rule transition-transform duration-[280ms] ease-out group-hover:scale-[1.012]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/examples/${ex.slug}/thumb.jpg`}
                    alt={`${ex.brand} - preview`}
                    className="block aspect-[16/10] w-full bg-[color-mix(in_oklab,var(--color-fg)_5%,var(--color-bg))] object-cover object-top"
                    loading="lazy"
                    decoding="async"
                  />

                  {/* Hover overlay - brand, prompt, build stats */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 translate-y-2 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                    <div className="rounded-b-tile bg-gradient-to-t from-black/85 via-black/55 to-transparent p-4 pt-12">
                      <p className="font-display text-base leading-tight text-white">
                        {ex.brand}
                      </p>
                      <p className="mt-1.5 max-w-[42ch] text-sm leading-snug text-white/90">
                        “{ex.prompt}”
                      </p>
                      <p className="mt-2 font-mono text-xs tracking-normal text-white/65">
                        {ex.references.length} refs · {ex.mcpCalls.length}+ calls
                        · {ex.scoreSelf.toFixed(1)}/10 · {ex.stack.replace("-", " + ")}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
