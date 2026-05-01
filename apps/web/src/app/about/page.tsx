import Link from "next/link";
import type { Metadata } from "next";
import { Dateline } from "@/components/dateline";

export const metadata: Metadata = {
  title: "About",
  description:
    "Inspo is an open-source, editorial archive of real-website screenshots queryable by AI coding agents over MCP. Owned and operated by Together AI.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[120rem] px-6 sm:px-10">
      <section className="grid grid-cols-1 gap-y-10 pt-16 pb-24 sm:pt-24 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-2">
          <Dateline label="About" />
        </div>

        <div className="lg:col-span-9 space-y-12">
          <h1 className="font-display max-w-[20ch] text-balance text-5xl leading-[1] tracking-tight sm:text-6xl lg:text-7xl">
            An archive, <em className="italic">in public</em>.
          </h1>

          <div className="prose-style max-w-[64ch] space-y-6 text-lg leading-relaxed text-[var(--color-fg)]">
            <p>
              Inspo is a curated, editorial archive of real-website
              screenshots — queryable by your coding agent over MCP. It exists
              because agents have access to tools but not taste, and because
              the open web already contains every reference an agent should
              ever need: it just has to be assembled, tagged, and addressable.
            </p>
            <p>
              Inspo is{" "}
              <strong className="text-[var(--color-fg)]">open source</strong>,
              licensed under MIT, owned and operated by{" "}
              <a
                href="https://www.together.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-4 hover:text-[var(--color-link)] hover:underline"
              >
                Together&nbsp;AI
              </a>
              . The hosted instance at this domain is free for everyone. There
              is no commercial tier. There is no paywall. There never will be.
            </p>
            <p>
              Inspo runs on Together AI&rsquo;s open-weights inference for
              both vision tagging (Gemma 3n) and text embeddings
              (multilingual-e5). The same stack powers{" "}
              <a
                href="https://github.com/Luffixos/hallmark"
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-4 hover:text-[var(--color-link)] hover:underline"
              >
                Hallmark
              </a>{" "}
              — Inspo&rsquo;s sibling skill, which gives the agent a design
              process while Inspo gives it visual reference.
            </p>
          </div>

          <div className="space-y-6 border-t rule pt-12">
            <p className="text-meta">Self-host</p>
            <div className="prose-style max-w-[64ch] space-y-4 text-[var(--color-fg)]">
              <p>
                Every dependency has a free or local-equivalent tier:
                Postgres on Neon, the gallery on Vercel, the MCP on
                Cloudflare Workers, the capture worker on Fly.io (or any
                Node host with Chromium). The repo at{" "}
                <a
                  href="https://github.com/Luffixos/inspo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-4 hover:text-[var(--color-link)] hover:underline"
                >
                  github.com/Luffixos/inspo
                </a>{" "}
                ships a complete{" "}
                <code className="font-mono text-[0.95em]">DEPLOY.md</code>{" "}
                runbook.
              </p>
              <p>
                One Together AI key, one Neon URL, one{" "}
                <code className="font-mono text-[0.95em]">
                  pnpm capture:seed
                </code>{" "}
                — your own gallery, your own MCP endpoint, your own taste
                pre-curated for whatever niche you care about.
              </p>
            </div>
          </div>

          <div className="space-y-6 border-t rule pt-12">
            <p className="text-meta">Contribute</p>
            <div className="prose-style max-w-[64ch] space-y-4 text-[var(--color-fg)]">
              <p>
                Add a site you love to{" "}
                <code className="font-mono text-[0.95em]">
                  apps/worker/src/seed-urls.ts
                </code>{" "}
                and open a PR. Improve banner-dismissal heuristics in{" "}
                <code className="font-mono text-[0.95em]">dismiss.ts</code>.
                Tighten the tag taxonomy. Curate an editorial issue. The bar
                is &ldquo;does this make the archive better for someone
                building a website?&rdquo;
              </p>
            </div>
          </div>

          <div className="space-y-6 border-t rule pt-12">
            <p className="text-meta">Credit</p>
            <p className="prose-style max-w-[64ch] text-[var(--color-fg)]">
              Every screen credits the designer or studio when known and
              links the source URL. Anyone can request a takedown via{" "}
              <Link
                href="/dmca"
                className="underline-offset-4 hover:text-[var(--color-link)] hover:underline"
              >
                /dmca
              </Link>{" "}
              and we&rsquo;ll honour it.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
