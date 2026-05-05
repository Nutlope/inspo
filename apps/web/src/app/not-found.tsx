import Link from "next/link";
import type { Metadata } from "next";
import { Dateline } from "@/components/dateline";
import { HomeSearch } from "@/components/home-search";

export const metadata: Metadata = {
  title: "Not on file",
};

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[120rem] px-6 sm:px-10">
      <section className="grid grid-cols-1 gap-y-10 pt-20 pb-32 sm:pt-32 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-2">
          <Dateline label="Not on file" />
        </div>

        <div className="lg:col-span-9 space-y-8">
          <h1 className="font-display max-w-[18ch] text-balance text-6xl leading-[0.95] tracking-tight sm:text-7xl">
            Not on file.
          </h1>
          <p className="max-w-[60ch] text-lg leading-relaxed text-[var(--color-fg-muted)]">
            We can&rsquo;t find that page. Either the URL is wrong, or the
            screen got pruned in a curator pass.
          </p>

          <div className="max-w-[36rem] pt-4">
            <HomeSearch />
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-3 pt-2 text-meta">
            <Link href="/" className="hover:text-[var(--color-link)]">
              ← Back to the front
            </Link>
            <Link href="/screens" className="hover:text-[var(--color-link)]">
              Browse the archive →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
