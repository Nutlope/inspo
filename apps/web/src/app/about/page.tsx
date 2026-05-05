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
              A thousand real production sites, filed by hand, queryable by
              your coding agent over MCP. Agents have tools but not taste —
              and the open web already holds every reference one could need.
              We just had to assemble, tag, and address it.
            </p>
            <p>
              Inspo is{" "}
              <strong className="text-[var(--color-fg)]">open source</strong>,
              MIT, owned and operated by{" "}
              <a
                href="https://www.together.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-4 hover:text-[var(--color-link)] hover:underline"
              >
                Together&nbsp;AI
              </a>
              . The hosted instance is free for everyone. No tiers, no paywall.
              The pair to Hallmark — its{" "}
              <a
                href="https://github.com/Luffixos/hallmark"
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-4 hover:text-[var(--color-link)] hover:underline"
              >
                sibling skill
              </a>{" "}
              gives your agent a design process; Inspo gives it the
              reference.
            </p>
          </div>

          <div className="space-y-6 border-t rule pt-12">
            <p className="text-meta">Self-host & contribute</p>
            <div className="prose-style max-w-[64ch] space-y-4 text-[var(--color-fg)]">
              <p>
                Every dependency has a free tier — Postgres on Neon, gallery
                on Vercel, MCP on Cloudflare Workers, capture worker on
                Fly.io (or any Node host with Chromium). One Together AI key,
                one Neon URL, one{" "}
                <code className="font-mono text-[0.95em]">
                  pnpm capture:seed
                </code>
                {" "}— you have your own instance.
              </p>
              <p>
                Want to add a site you love? Append it to{" "}
                <code className="font-mono text-[0.95em]">
                  apps/worker/src/seed-urls.ts
                </code>{" "}
                and open a PR at{" "}
                <a
                  href="https://github.com/Luffixos/inspo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-4 hover:text-[var(--color-link)] hover:underline"
                >
                  github.com/Luffixos/inspo
                </a>
                . The bar: does this make the archive better for someone
                building a website?
              </p>
            </div>
          </div>

          <div className="space-y-6 border-t rule pt-12">
            <p className="text-meta">Credit</p>
            <p className="prose-style max-w-[64ch] text-[var(--color-fg)]">
              Every screen credits the designer or studio when known and
              links the source. Want yours taken down? Reach us at{" "}
              <Link
                href="/dmca"
                className="underline-offset-4 hover:text-[var(--color-link)] hover:underline"
              >
                /dmca
              </Link>{" "}
              — we&rsquo;ll honour it.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
