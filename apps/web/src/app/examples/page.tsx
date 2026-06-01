/**
 * /examples — "Made with Inspo". A gallery of real pages an agent
 * built using only the catalogue, each linking to a case study that
 * shows the prompt, the references it studied, the MCP calls it made,
 * and the palette it traced.
 *
 * The cards show live (scaled) iframes of the actual generated HTML —
 * not screenshots — so what you see is exactly what shipped.
 */

import Link from "next/link";
import type { Metadata } from "next";
import { EXAMPLES } from "@/lib/examples";
import { ExamplePreview } from "@/components/example-preview";

export const metadata: Metadata = {
  title: "Examples — Made with Inspo",
  description:
    "Real landing pages built by an agent with nothing but the Inspo MCP. See the prompt, the references it studied, and the design system it traced.",
};

export default function ExamplesPage() {
  return (
    <div className="mx-auto max-w-[120rem] px-6 sm:px-10">
      {/* Masthead ─────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-y-8 pt-16 pb-12 sm:pt-24 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-2">
          <p className="text-meta">Examples</p>
          <p className="text-meta mt-2 max-w-[18ch] text-[var(--color-fg-muted)]">
            {EXAMPLES.length} pages · pure Inspo MCP
          </p>
        </div>
        <div className="lg:col-span-10">
          <h1 className="font-display max-w-[20ch] text-balance text-[clamp(2.5rem,5.5vw,5rem)] leading-[0.95] tracking-tight">
            Made with <em className="italic">Inspo</em>.
          </h1>
          <p className="mt-6 max-w-[62ch] text-[var(--color-fg-muted)]">
            Each page below was built by a coding agent given one
            sentence and nothing but the Inspo MCP — no design skill, no
            templates, no component library. Open any one to see the
            prompt, the real captures it studied, every tool call it
            made, and the palette it traced back to specific sites.
          </p>
        </div>
      </section>

      {/* Grid ─────────────────────────────────────────────── */}
      <section className="border-t rule pt-12 pb-24">
        <ul className="grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-2">
          {EXAMPLES.map((ex) => (
            <li key={ex.slug} className="group">
              <Link
                href={`/examples/${ex.slug}`}
                className="block focus:outline-none"
              >
                <div className="overflow-hidden border rule transition-transform duration-300 ease-out group-hover:scale-[1.008]">
                  <ExamplePreview
                    src={`/examples/${ex.slug}/index.html`}
                    title={`${ex.brand} — preview`}
                  />
                </div>
                <div className="mt-4 flex items-baseline justify-between gap-4">
                  <h2 className="font-display text-2xl leading-tight">
                    <span className="transition-colors group-hover:text-[var(--color-link)]">
                      {ex.brand}
                    </span>
                  </h2>
                  <span className="text-meta whitespace-nowrap text-[var(--color-fg-muted)]">
                    {ex.references.length} refs · {ex.mcpCalls.length}+ calls
                  </span>
                </div>
                <p className="mt-2 max-w-[52ch] text-[var(--color-fg-muted)]">
                  <span className="text-[var(--color-fg)]">“{ex.prompt}”</span>{" "}
                  {ex.tagline}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-meta">
                  <span className="capitalize">{ex.stack.replace("-", " + ")}</span>
                  <span className="text-[var(--color-fg-muted)]">·</span>
                  <span>{ex.mode} mode</span>
                  <span className="text-[var(--color-fg-muted)]">·</span>
                  <span>self-score {ex.scoreSelf.toFixed(1)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
