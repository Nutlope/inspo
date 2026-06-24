import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  findCollection,
  getAllCollections,
  screensInCollection,
} from "@inspo/db";
import { ScreenTile } from "@/components/screen-tile";

// Runtime-rendered.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = await findCollection(slug);
  if (!c) return { title: "Not found" };
  return { title: c.title, description: c.editorBlurb };
}

const SPAN_CLASSES: Record<1 | 2 | 3, string> = {
  1: "lg:col-span-4",
  2: "lg:col-span-6",
  3: "lg:col-span-8",
};

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [collection, entries] = await Promise.all([
    findCollection(slug),
    screensInCollection(slug),
  ]);
  if (!collection) notFound();

  return (
    <div className="mx-auto max-w-[120rem] px-6 sm:px-10">
      {/* Issue cover ───────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-y-10 border-b rule pt-16 pb-20 sm:pt-24 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-3">
          <p className="text-meta">
            <Link
              href="/collections"
              className="hover:text-[var(--color-link)]"
            >
              ← All issues
            </Link>
          </p>
          <p className="mt-8 font-display text-7xl leading-none tracking-tight sm:text-8xl lg:text-[8rem]">
            Nº{collection.number}
          </p>
          <p className="text-meta mt-4">{collection.date}</p>
        </div>

        <div className="lg:col-span-9">
          <h1 className="font-display max-w-[18ch] text-balance text-6xl leading-[0.95] tracking-tight sm:text-7xl lg:text-[8rem]">
            <em className="not-italic">{collection.title}</em>
          </h1>
          <p className="mt-10 max-w-[62ch] text-xl leading-relaxed text-[var(--color-fg-muted)]">
            {collection.editorBlurb}
          </p>
        </div>
      </section>

      {/* The pages - asymmetric magazine layout ───────────── */}
      <section className="grid grid-cols-1 gap-x-6 gap-y-16 pt-20 pb-24 lg:grid-cols-12 lg:gap-y-24">
        {entries.map(({ screen, editorNote, span }, i) => {
          const colSpan = SPAN_CLASSES[span ?? 2];
          // Alternate offset to break the rhythm - odd indices push right
          const offset = i % 3 === 1 ? "lg:col-start-3" : i % 3 === 2 ? "lg:col-start-6" : "lg:col-start-2";

          return (
            <article key={screen.slug} className={`${colSpan} ${offset}`}>
              <p className="text-meta mb-4">
                Plate {String(i + 1).padStart(2, "0")} -{" "}
                <Link
                  href={`/screens/${screen.slug}`}
                  className="text-[var(--color-fg)] hover:text-[var(--color-link)]"
                >
                  {screen.title}
                </Link>
              </p>

              <ScreenTile
                screen={screen}
                variant="hero"
                showCaption={false}
              />

              {editorNote && (
                <p className="mt-5 max-w-[40ch] font-display text-xl italic leading-snug text-[var(--color-fg)]">
                  {editorNote}
                </p>
              )}

              <div className="mt-3 flex items-baseline justify-between text-meta">
                <span>{screen.designerCredit ?? "-"}</span>
                <span>{screen.tags.style[0]}</span>
              </div>
            </article>
          );
        })}
      </section>

      {/* Footer pointer */}
      <section className="border-t rule pt-10 pb-24">
        <div className="grid grid-cols-1 gap-y-6 lg:grid-cols-12 lg:gap-x-10">
          <p className="text-meta lg:col-span-2">End of issue</p>
          <div className="lg:col-span-10">
            <Link
              href="/collections"
              className="font-display text-3xl underline-offset-8 hover:text-[var(--color-link)] hover:underline"
            >
              Back to all issues →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
