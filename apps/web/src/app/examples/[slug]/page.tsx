/**
 * /examples/[slug] - case study for one Inspo-built page.
 *
 * Top to bottom: the prompt, the live generated page, the standout
 * move, the catalogue references it studied (real tiles linking back
 * to /screens), the MCP calls it made, and the palette traced to
 * source. Everything is transcribed from the build's NOTES.md.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { findScreen } from "@inspo/db";
import type { ScreenSummary } from "@inspo/shared";
import { EXAMPLES, getExample } from "@/lib/examples";
import { ExamplePreview } from "@/components/example-preview";
import { ScreenTile } from "@/components/screen-tile";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return EXAMPLES.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const ex = getExample(slug);
  if (!ex) return { title: "Not found" };
  return {
    title: `${ex.brand} - Made with Inspo`,
    description: `“${ex.prompt}” → ${ex.tagline} Built with the Inspo MCP.`,
  };
}

export default async function ExampleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ex = getExample(slug);
  if (!ex) notFound();

  // Resolve each reference to a real catalogue screen for the tiles.
  const refScreens = await Promise.all(
    ex.references.map(async (r) => ({
      ref: r,
      screen: await findScreen(r.slug),
    })),
  );

  const src = `/examples/${ex.slug}/index.html`;

  return (
    <div className="pb-24">
      {/* Masthead ─────────────────────────────────────────── */}
      <div className="mx-auto max-w-[120rem] px-6 pt-10 sm:px-10">
        <Link
          href="/examples"
          className="text-meta hover:text-[var(--color-link)]"
        >
          ← All examples
        </Link>
        <div className="mt-6 grid grid-cols-1 gap-y-6 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-8">
            <p className="text-meta">Prompt</p>
            <h1 className="mt-2 font-display text-[length:var(--text-h1)] leading-[1.02] tracking-tight">
              “{ex.prompt}”
            </h1>
            <p className="mt-5 max-w-[58ch] text-lg text-[var(--color-fg-muted)]">
              The agent invented{" "}
              <span className="text-[var(--color-fg)]">{ex.brand}</span> -{" "}
              {ex.tagline}
            </p>
          </div>
          <div className="lg:col-span-4 lg:pt-8">
            <dl className="space-y-3 border-t rule pt-4">
              <Row label="Toolchain">{ex.stack.replace("-", " + ")}</Row>
              <Row label="Register">{ex.mode} mode</Row>
              <Row label="Build effort">
                {ex.mcpCalls.length}+ MCP calls · {ex.references.length} sites studied
              </Row>
              <Row label="Self-score">{ex.scoreSelf.toFixed(1)} / 10</Row>
            </dl>
          </div>
        </div>
      </div>

      {/* The page itself ──────────────────────────────────── */}
      <div className="mx-auto mt-12 max-w-[120rem] px-6 sm:mt-16 sm:px-10">
        <div className="flex items-baseline justify-between text-meta mb-3">
          <span>The page it shipped - live, scaled</span>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--color-link)]"
          >
            Open full page ↗
          </a>
        </div>
        <div className="border rule">
          <ExamplePreview
            src={src}
            title={`${ex.brand} - full preview`}
            aspect={16 / 11}
            interactive
          />
        </div>
      </div>

      {/* Highlight ────────────────────────────────────────── */}
      <div className="mx-auto mt-16 max-w-[120rem] px-6 sm:px-10">
        <div className="grid grid-cols-1 gap-y-4 lg:grid-cols-12 lg:gap-x-10">
          <p className="text-meta lg:col-span-2">The move</p>
          <p className="lg:col-span-10 font-display text-2xl leading-snug lg:text-2xl">
            {ex.highlight}
          </p>
        </div>
      </div>

      {/* References ───────────────────────────────────────── */}
      <div className="mx-auto mt-24 max-w-[120rem] border-t rule px-6 pt-12 sm:px-10">
        <div className="grid grid-cols-1 gap-y-8 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-2">
            <p className="text-meta">What Inspo gave it</p>
            <p className="text-meta mt-2 max-w-[20ch] text-[var(--color-fg-muted)]">
              The captures it studied, and exactly what each one
              contributed.
            </p>
          </div>
          <ul className="lg:col-span-10 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
            {refScreens.map(({ ref, screen }) => (
              <li key={ref.slug}>
                {screen ? (
                  <ScreenTile screen={screen as ScreenSummary} variant="hero" hoverScroll />
                ) : (
                  <div className="aspect-[16/10] border rule bg-[color-mix(in_oklab,var(--color-fg)_5%,var(--color-bg))]" />
                )}
                <p className="mt-3 text-sm text-[var(--color-fg-muted)]">
                  {/* A reference can outlive its capture: sites get pruned from
                      the archive, but what they contributed is still true. Name
                      it without linking rather than pointing at a dead page. */}
                  {screen ? (
                    <Link
                      href={`/screens/${ref.slug}`}
                      className="text-[var(--color-fg)] underline-offset-4 hover:text-[var(--color-link)] hover:underline"
                    >
                      {screen.title}
                    </Link>
                  ) : (
                    <span className="text-[var(--color-fg)]">{ref.slug}</span>
                  )}{" "}
                  - {ref.took}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* MCP calls ────────────────────────────────────────── */}
      <div className="mx-auto mt-24 max-w-[120rem] border-t rule px-6 pt-12 sm:px-10">
        <div className="grid grid-cols-1 gap-y-8 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-2">
            <p className="text-meta">How it was built</p>
            <p className="text-meta mt-2 max-w-[20ch] text-[var(--color-fg-muted)]">
              The actual MCP calls, in order.
            </p>
          </div>
          <ol className="lg:col-span-10 divide-y rule border-y rule">
            {ex.mcpCalls.map((call, i) => (
              <li key={i} className="grid grid-cols-1 gap-y-2 py-5 lg:grid-cols-12 lg:gap-x-6">
                <div className="lg:col-span-5">
                  <code className="font-mono text-sm text-[var(--color-link)]">
                    {call.tool}
                  </code>
                  <pre className="mt-1 overflow-x-auto font-mono text-xs text-[var(--color-fg-muted)]">
                    {call.args}
                  </pre>
                </div>
                <p className="lg:col-span-7 text-sm text-[var(--color-fg-muted)]">
                  {call.took}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Palette ──────────────────────────────────────────── */}
      <div className="mx-auto mt-24 max-w-[120rem] border-t rule px-6 pt-12 sm:px-10">
        <div className="grid grid-cols-1 gap-y-8 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-2">
            <p className="text-meta">Palette, traced</p>
            <p className="text-meta mt-2 max-w-[20ch] text-[var(--color-fg-muted)]">
              Every token, and the reference it came from.
            </p>
          </div>
          <ul className="lg:col-span-10 space-y-px border rule">
            {ex.palette.map((p) => (
              <li
                key={p.token}
                className="flex flex-col gap-3 px-4 py-4 sm:grid sm:grid-cols-[3rem_8rem_minmax(7rem,1fr)_2fr] sm:items-center sm:gap-x-6"
              >
                <span
                  aria-hidden
                  className="h-10 w-full sm:w-10 border rule"
                  style={{ background: p.hex }}
                />
                <code className="font-mono text-sm">{p.token}</code>
                <code className="font-mono text-sm text-[var(--color-fg-muted)]">
                  {p.hex}
                </code>
                <span className="text-sm text-[var(--color-fg-muted)]">
                  {p.from}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Outro ────────────────────────────────────────────── */}
      <div className="mx-auto mt-20 max-w-[120rem] px-6 sm:px-10">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-t rule pt-6 text-meta">
          <span>
            Built with the{" "}
            <Link href="/mcp" className="hover:text-[var(--color-link)]">
              Inspo MCP
            </Link>{" "}
            - try it on your own brief.
          </span>
          <Link href="/examples" className="hover:text-[var(--color-link)]">
            ← All examples
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-meta">{label}</dt>
      <dd className="text-sm text-right capitalize">{children}</dd>
    </div>
  );
}
