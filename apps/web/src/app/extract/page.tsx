import Link from "next/link";
import type { Metadata } from "next";
import { Dateline } from "@/components/dateline";
import { ExtractClient } from "./client";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Extract a design system",
  description:
    "Paste any URL and Inspo extracts its design system — palette, type ramp, spacing scale, components — and writes a DESIGN.md your coding agent can consume.",
};

export const dynamic = "force-dynamic";

export default async function ExtractPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>;
}) {
  const session = await getSession();
  const sp = await searchParams;

  return (
    <div className="mx-auto max-w-[120rem] px-6 sm:px-10">
      <section className="grid grid-cols-1 gap-y-10 pt-16 pb-32 sm:pt-24 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-2">
          <Dateline label="Extract" />
        </div>

        <div className="lg:col-span-9 space-y-12">
          <div className="space-y-6">
            <h1 className="font-display max-w-[18ch] text-balance text-5xl leading-[1] tracking-tight sm:text-6xl lg:text-7xl">
              Paste a URL.{" "}
              <em className="italic">Take a design system.</em>
            </h1>
            <p className="max-w-[58ch] text-lg leading-relaxed text-[var(--color-fg-muted)]">
              Inspo will visit the page, capture three viewports, extract its
              palette, type ramp, spacing scale, components, and CSS variables,
              and hand you a <code className="font-mono text-[0.95em] text-[var(--color-fg)]">DESIGN.md</code> your
              coding agent can consume directly. Powered by{" "}
              <a
                href="https://www.together.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-fg)] underline-offset-4 hover:text-[var(--color-link)] hover:underline"
              >
                Together&nbsp;AI
              </a>
              . Free. Open source.
            </p>
          </div>

          {!session?.user ? (
            <div className="space-y-6 border rule px-6 py-8">
              <p className="font-display text-2xl">
                Sign in to extract.
              </p>
              <p className="max-w-[52ch] text-sm text-[var(--color-fg-muted)]">
                Together AI absorbs the inference cost on the hosted instance,
                so we ask you to sign in (anti-abuse) before kicking off a
                capture. No paywall, no tier — sign-in is the only gate.
                Self-host the project to remove this entirely.
              </p>
              <Link
                href={`/signin?redirect=${encodeURIComponent("/extract" + (sp.url ? `?url=${encodeURIComponent(sp.url)}` : ""))}`}
                className="font-mono text-meta border rule bg-[var(--color-fg)] inline-block px-5 py-3 text-[var(--color-bg)] transition-opacity hover:opacity-80"
              >
                Sign in →
              </Link>
            </div>
          ) : (
            <ExtractClient initialUrl={sp.url ?? ""} />
          )}

          <div className="border-t rule pt-12 space-y-4 text-meta">
            <p>What you&rsquo;ll get</p>
            <ul className="space-y-2 text-sm text-[var(--color-fg)]">
              <li>· Palette — five hex values, role-guessed (surface / ink / accent / muted)</li>
              <li>· Typography — six roles × family / size / weight / line-height / letter-spacing</li>
              <li>· Spacing scale — every distinct gap / padding / margin clustered</li>
              <li>· Radius scale — every distinct border-radius from buttons / cards / inputs</li>
              <li>· Container width — body content max-width</li>
              <li>· Raw CSS variables — every <code className="font-mono">--*</code> the source declared</li>
              <li>· Components present — taxonomy-tagged list</li>
              <li>· The full <code className="font-mono">DESIGN.md</code> — agent-readable, copy or download</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
