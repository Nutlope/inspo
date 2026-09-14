import Link from "next/link";
import type { Metadata } from "next";
import { Dateline } from "@/components/dateline";
import { site } from "@/lib/site";
import { getArchiveStats } from "@inspo/db";

export const metadata: Metadata = {
  title: "Colophon",
  description:
    "How Inspo is made: the typefaces, the stack, how the captures are taken, and who to credit.",
};

// Counts come from the bundled seed; re-render at most daily.
export const revalidate = 86400;

export default async function ColophonPage() {
  const stats = await getArchiveStats();
  return (
    <div className="mx-auto max-w-[120rem] px-6 sm:px-10">
      <section className="grid grid-cols-1 gap-y-10 pt-16 pb-24 sm:pt-24 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-2">
          <Dateline label="Colophon" />
        </div>

        <div className="lg:col-span-9 space-y-12">
          <h1 className="font-display max-w-[20ch] text-balance text-5xl leading-[1] tracking-tight sm:text-6xl lg:text-7xl">
            How this archive is{" "}
            <em className="not-italic text-[var(--color-link)]">made</em>.
          </h1>

          <dl className="grid max-w-[64ch] grid-cols-1 gap-y-8 sm:grid-cols-[10rem_1fr] sm:gap-x-8 sm:gap-y-10">
            <dt className="text-meta">Typefaces</dt>
            <dd className="text-lg leading-relaxed">
              {site.colophon.typefaces.join(" and ")}. One serif for the
              headlines, one sans for everything else.
            </dd>

            <dt className="text-meta">Stack</dt>
            <dd className="text-lg leading-relaxed">
              {site.colophon.stack.join(", ")}. The gallery reads from a
              static seed bundled into the deploy, so it keeps working
              when the database does not.
            </dd>

            <dt className="text-meta">Captures</dt>
            <dd className="text-lg leading-relaxed">
              {stats.sites.toLocaleString()} sites and{" "}
              {stats.screens.toLocaleString()} pages, each shot in a real
              browser at 1440 wide and again at 375, then measured: the
              palette from the pixels, the fonts and CSS variables from
              the page, the structure from a fold-by-fold read.
            </dd>

            <dt className="text-meta">Credit</dt>
            <dd className="text-lg leading-relaxed">
              Every screenshot is the work of the people who designed and
              built the site it shows. Each screen links to its source.
              Takedown requests go through{" "}
              <Link
                href="/dmca"
                className="underline-offset-4 hover:text-[var(--color-link)] hover:underline"
              >
                /dmca
              </Link>
              .
            </dd>

            <dt className="text-meta">People</dt>
            <dd className="text-lg leading-relaxed">
              Made by Youssef and Hassan at{" "}
              <a
                href="https://www.together.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-4 hover:text-[var(--color-link)] hover:underline"
              >
                Together&nbsp;AI
              </a>
              . The code is MIT at{" "}
              <a
                href={site.github.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-4 hover:text-[var(--color-link)] hover:underline"
              >
                github.com/{site.github.owner}/{site.github.repo}
              </a>
              .
            </dd>
          </dl>
        </div>
      </section>
    </div>
  );
}
