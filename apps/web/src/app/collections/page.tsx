import Link from "next/link";
import type { Metadata } from "next";
import { Dateline } from "@/components/dateline";
import { findScreen, getAllCollections } from "@inspo/db";

export const metadata: Metadata = {
  title: "Issues",
  description:
    "Curated issues — themed sets that frame what's in the archive.",
};

export default async function CollectionsPage() {
  const collections = await getAllCollections();
  const covers = await Promise.all(
    collections.map((c) =>
      c.coverScreenSlug ? findScreen(c.coverScreenSlug) : Promise.resolve(null),
    ),
  );
  const coverBySlug = new Map(
    collections.map((c, i) => [c.slug, covers[i]] as const),
  );
  return (
    <div className="mx-auto max-w-[120rem] px-6 sm:px-10">
      {/* Header */}
      <section className="grid grid-cols-1 gap-y-8 pt-16 pb-12 sm:pt-24 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-2">
          <Dateline label="Issues" />
        </div>
        <div className="lg:col-span-10">
          <h1 className="font-display max-w-[16ch] text-balance text-5xl leading-[1] tracking-tight sm:text-6xl lg:text-7xl">
            Issues — <em className="italic">themed sets</em> from the archive.
          </h1>
          <p className="mt-8 max-w-[58ch] text-lg text-[var(--color-fg-muted)]">
            Each issue picks a posture — a macrostructure, a mood, a context —
            and frames {collections.length} or so sites against it. New issues
            land most weeks.
          </p>
        </div>
      </section>

      {/* List ─ Magazine TOC ─────────────────────────────── */}
      <section className="border-t rule">
        <ul>
          {collections.map((c) => {
            const cover = coverBySlug.get(c.slug);
            return (
              <li key={c.slug} className="border-b rule">
                <Link
                  href={`/collections/${c.slug}`}
                  className="group block py-10 transition-colors lg:py-14"
                >
                  <div className="grid grid-cols-1 items-end gap-y-6 lg:grid-cols-12 lg:gap-x-10">
                    <div className="lg:col-span-2">
                      <p className="text-meta">
                        Issue
                        <br />
                        <span className="font-display text-3xl text-[var(--color-fg)]">
                          Nº{c.number}
                        </span>
                      </p>
                      <p className="text-meta mt-3">{c.date}</p>
                    </div>

                    <div className="lg:col-span-7">
                      <h2 className="font-display text-balance text-4xl leading-[1.05] tracking-tight transition-colors group-hover:text-[var(--color-link)] sm:text-5xl lg:text-6xl">
                        {c.title}
                      </h2>
                      <p className="mt-5 max-w-[55ch] text-[var(--color-fg-muted)]">
                        {c.editorBlurb}
                      </p>
                      <p className="text-meta mt-6">
                        {c.screens.length} entries — read the issue →
                      </p>
                    </div>

                    {/* Cover thumbnail */}
                    <div className="lg:col-span-3">
                      {cover && (
                        <div className="aspect-[4/3] overflow-hidden border rule transition-transform duration-300 group-hover:-translate-y-0.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={cover.thumbUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
