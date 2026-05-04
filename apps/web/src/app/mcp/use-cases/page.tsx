import Link from "next/link";
import type { Metadata } from "next";
import { Dateline } from "@/components/dateline";
import { findScreen } from "@inspo/db";

export const metadata: Metadata = {
  title: "Use cases · MCP",
  description:
    "Three concrete examples of how the Inspo MCP changes what your coding agent produces — including the design briefs and the screens it pulls.",
};

type UseCase = {
  slug: string;
  prompt: string;
  withoutMCP: string;
  withMCP: {
    toolCalls: Array<{ tool: string; args: string; returns: string }>;
    designSummary: string;
    referenceSlugs: string[];
  };
  takeaway: string;
};

const USE_CASES: UseCase[] = [
  {
    slug: "fintech-dashboard",
    prompt: "Design a fintech dashboard with editorial typography.",
    withoutMCP:
      "The agent generates from training-time priors: it imagines a generic dark-mode SaaS dashboard with Inter, three stat cards, a sidebar nav, and gradient brand colour. No specific reference; output looks like every other fintech dashboard the model has seen.",
    withMCP: {
      toolCalls: [
        {
          tool: "search_screens",
          args: '{ query: "fintech editorial typography dashboard" }',
          returns: "8 hits — top: mercury-com, ramp-com, brex-com, linear-app, longbow-fintech",
        },
        {
          tool: "get_design_system",
          args: '{ slug: "mercury-com" }',
          returns: "DESIGN.md with Mercury's actual type ramp, palette, spacing scale, CSS variables, and Hallmark macrostructure (Quote-Led).",
        },
      ],
      designSummary:
        "Agent receives Mercury's real type ramp (h1 60px / 510 weight / -1.5px tracking), real spacing (8 / 12 / 16 / 24 / 40 / 64 / 96), the warm-paper palette, and the macrostructure pick. It now generates a dashboard that looks like a deliberate Mercury-class design — not an AI's imagination of one.",
      referenceSlugs: ["mercury-com", "ramp-com", "linear-app", "longbow-fintech"],
    },
    takeaway:
      "Without the MCP the agent invents a fintech dashboard. With the MCP it studies four real ones, picks one to reference, and inherits its actual typographic taste.",
  },
  {
    slug: "photographer-portfolio",
    prompt: "Build a portfolio landing page for a photographer.",
    withoutMCP:
      "Default photographer portfolio: full-bleed hero image, three-column thumbnail grid, contact section. Type is Inter or Playfair, palette is black-on-white. Identical to every Squarespace template.",
    withMCP: {
      toolCalls: [
        {
          tool: "find_examples_for_macrostructure",
          args: '{ name: "Photographic" }',
          returns: "75 matches — top: salon-east, ruby-archive, robin-noguier, boulevard-bar, a24films-com",
        },
        {
          tool: "get_design_system",
          args: '{ slug: "ruby-archive" }',
          returns: "Ruby Archive's actual type ramp (Garamond display + Inter Tight body), warm-grey palette, asymmetric grid metrics.",
        },
      ],
      designSummary:
        "Agent picks Ruby Archive as its reference because the brief asks for 'photographer portfolio' — the macrostructure is genuinely Photographic. Receives real Garamond/Inter pairing, the actual hover-reveal index pattern, and the asymmetric crop ratios. Output is index-first not grid-first — a real editorial choice the LLM wouldn't make alone.",
      referenceSlugs: ["ruby-archive", "salon-east", "robin-noguier"],
    },
    takeaway:
      "Hallmark's macrostructure vocabulary points the agent at the right shape (Photographic vs Portfolio Grid). Inspo gives it 75 real ones to study. Pairing matters.",
  },
  {
    slug: "saas-bento",
    prompt: "Make a SaaS landing page using a bento grid.",
    withoutMCP:
      "Bento grid in the abstract — three columns, varying card sizes, a stat in the middle, a logo cloud at the bottom. No taste; just the abstraction.",
    withMCP: {
      toolCalls: [
        {
          tool: "find_examples_for_macrostructure",
          args: '{ name: "Bento Grid" }',
          returns: "240 matches — top: linear-app, ui-shadcn-com, magicui-design, supabase-com, vercel-com",
        },
        {
          tool: "search_screens",
          args: '{ query: "bento dark dev tool", filters: { mode: "dark" } }',
          returns: "50 hits, sharper to the brief.",
        },
        {
          tool: "get_design_system",
          args: '{ slug: "linear-app" }',
          returns: "Linear's actual asymmetric bento — large hero card 55% width, three small support cards alternating right.",
        },
      ],
      designSummary:
        "Agent learns Linear's specific asymmetric bento ratio (one big, two small × two rows) instead of the generic 3-equal-column bento. Picks up Linear's Inter Variable + 510 weight, container 1440, accent #c49e04 gold. The output reads as an intentional Linear-class page, not a Tailwind component-library demo.",
      referenceSlugs: ["linear-app", "ui-shadcn-com", "magicui-design", "supabase-com"],
    },
    takeaway:
      "Bento Grid is 240 captures wide. The macrostructure name alone isn't enough — picking *which* Bento to study is the design decision. Inspo lets the agent make that decision with real data.",
  },
];

export default async function UseCasesPage() {
  // Pull the referenced screens server-side so the use-cases page can
  // link to live detail pages and show real palettes.
  const enriched = await Promise.all(
    USE_CASES.map(async (uc) => ({
      ...uc,
      refs: (
        await Promise.all(uc.withMCP.referenceSlugs.map((s) => findScreen(s)))
      ).flatMap((s) => (s ? [s] : [])),
    })),
  );

  return (
    <div className="mx-auto max-w-[120rem] px-6 sm:px-10">
      <section className="grid grid-cols-1 gap-y-10 pt-12 pb-16 sm:pt-20 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-2">
          <Dateline label="MCP · Use cases" />
        </div>
        <div className="lg:col-span-10">
          <h1 className="font-display max-w-[20ch] text-balance text-5xl leading-[1] tracking-tight sm:text-6xl">
            What the MCP <em className="italic">actually</em> does.
          </h1>
          <p className="mt-8 max-w-[60ch] text-lg leading-relaxed text-[var(--color-fg-muted)]">
            Three real prompts an agent might receive — once without the
            Inspo MCP, once with. Same prompt, two different outputs. The
            MCP doesn&rsquo;t make the agent smarter; it gives it real
            production sites to study before it writes a line.
          </p>
          <div className="mt-8">
            <Link
              href="/mcp"
              className="text-meta hover:text-[var(--color-link)]"
            >
              ← Install instructions
            </Link>
          </div>
        </div>
      </section>

      {/* Use-case cards ─────────────────────────────────────── */}
      <section className="space-y-24 border-t rule pt-12 pb-32">
        {enriched.map((uc, i) => (
          <article key={uc.slug} className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-10">
            <div className="lg:col-span-2">
              <p className="font-display text-4xl">№{String(i + 1).padStart(2, "0")}</p>
            </div>

            <div className="lg:col-span-10 space-y-12">
              <div>
                <p className="text-meta">Prompt</p>
                <p className="mt-3 font-display text-3xl leading-tight">
                  &ldquo;{uc.prompt}&rdquo;
                </p>
              </div>

              <div className="grid grid-cols-1 gap-x-10 gap-y-10 lg:grid-cols-2">
                {/* Without */}
                <div className="border-t-2 border-[var(--color-fg-muted)]/30 pt-6">
                  <p className="text-meta">Without Inspo</p>
                  <p className="mt-4 max-w-[40ch] text-[var(--color-fg-muted)]">
                    {uc.withoutMCP}
                  </p>
                </div>

                {/* With */}
                <div className="border-t-2 border-[var(--color-link)] pt-6">
                  <p className="text-meta text-[var(--color-link)]">
                    With Inspo
                  </p>

                  <div className="mt-4 space-y-3 font-mono text-xs">
                    {uc.withMCP.toolCalls.map((c, j) => (
                      <div key={j} className="border rule px-3 py-2">
                        <p>
                          <span className="text-[var(--color-link)]">
                            {c.tool}
                          </span>
                          <span className="text-[var(--color-fg-muted)]">
                            {" "}
                            ({c.args})
                          </span>
                        </p>
                        <p className="text-meta mt-1">→ {c.returns}</p>
                      </div>
                    ))}
                  </div>

                  <p className="mt-5 max-w-[44ch] text-[var(--color-fg)]">
                    {uc.withMCP.designSummary}
                  </p>
                </div>
              </div>

              {/* Reference plates */}
              {uc.refs.length > 0 && (
                <div>
                  <p className="text-meta mb-4">Reference plates the agent studied</p>
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
                    {uc.refs.map((s) => (
                      <li key={s.slug}>
                        <Link
                          href={`/screens/${s.slug}`}
                          className="group block"
                        >
                          <div className="aspect-[4/3] overflow-hidden border rule">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={s.imageUrl}
                              alt={s.title}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover transition-transform duration-[280ms] ease-out group-hover:scale-[1.012]"
                            />
                          </div>
                          <p className="text-meta mt-2 truncate transition-colors group-hover:text-[var(--color-link)]">
                            {s.title}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Takeaway */}
              <p className="border-l-2 border-[var(--color-link)] pl-4 font-display italic text-xl leading-snug">
                {uc.takeaway}
              </p>
            </div>
          </article>
        ))}
      </section>

      {/* Footer pointer */}
      <section className="border-t rule pt-10 pb-24">
        <div className="grid grid-cols-1 gap-y-6 lg:grid-cols-12 lg:gap-x-10">
          <p className="text-meta lg:col-span-2">Install</p>
          <div className="lg:col-span-10 space-y-4">
            <p className="font-display text-3xl leading-snug">
              One <code className="font-mono">npx inspo init</code> and your
              agent has Inspo&rsquo;s tools too.
            </p>
            <p className="text-meta">
              <Link
                href="/mcp"
                className="hover:text-[var(--color-link)]"
              >
                Tool reference + install →
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
