import Link from "next/link";
import type { Metadata } from "next";
import { Dateline } from "@/components/dateline";
import { ScreenTile } from "@/components/screen-tile";
import { findScreen, getAllCollections } from "@inspo/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Collections",
  description:
    "Editor-curated issues from the archive - themed sets of real sites worth studying together.",
};

export default async function CollectionsIndex() {
  const collections = await getAllCollections();
  const withCovers = await Promise.all(
    collections.map(async (c) => ({
      ...c,
      cover: await findScreen(c.coverScreenSlug),
    })),
  );

  return (
    <div className="mx-auto max-w-[120rem] px-6 sm:px-10">
      <section className="grid grid-cols-1 gap-y-8 pt-16 pb-12 sm:pt-24 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-2">
          <Dateline label="Collections" />
        </div>
        <div className="lg:col-span-10">
          <h1 className="font-display max-w-[18ch] text-balance text-5xl leading-[1] tracking-tight sm:text-6xl">
            Issues, <em className="not-italic text-[var(--color-link)]">filed by hand</em>.
          </h1>
          <p className="mt-6 max-w-[52ch] text-lg text-[var(--color-fg-muted)]">
            Themed sets of real sites the editors keep returning to. Each
            issue is a short argument about one way the web can look.
          </p>
        </div>
      </section>

      <section className="border-t rule pb-24">
        <ul>
          {withCovers.map((c) => (
            <li
              key={c.slug}
              className="grid grid-cols-1 gap-y-6 border-b rule py-10 lg:grid-cols-12 lg:gap-x-10"
            >
              <div className="lg:col-span-2">
                <p className="text-meta">Issue Nº{c.number}</p>
                <p className="text-meta mt-1 text-[var(--color-fg-muted)]">
                  {c.date}
                </p>
              </div>
              <div className="lg:col-span-6">
                <h2 className="font-display text-3xl leading-tight tracking-tight sm:text-4xl">
                  <Link
                    href={`/collections/${c.slug}`}
                    className="transition-colors hover:text-[var(--color-link)]"
                  >
                    {c.title}
                  </Link>
                </h2>
                <p className="mt-4 max-w-[52ch] text-[var(--color-fg-muted)]">
                  {c.editorBlurb}
                </p>
                <p className="text-meta mt-6">
                  <Link
                    href={`/collections/${c.slug}`}
                    className="hover:text-[var(--color-link)]"
                  >
                    {c.screens.length} plates →
                  </Link>
                </p>
              </div>
              <div className="lg:col-span-4">
                {c.cover && <ScreenTile screen={c.cover} variant="hero" />}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
