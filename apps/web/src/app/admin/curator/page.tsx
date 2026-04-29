import Link from "next/link";
import { Dateline } from "@/components/dateline";
import { PaletteStrip } from "@/components/palette-strip";
import { TagPill } from "@/components/tag-pill";
import { getPendingScreens } from "@inspo/db";
import { hasDatabase } from "@inspo/db";
import { MACROSTRUCTURE_LABELS, type Macrostructure } from "@inspo/taxonomy";
import { CuratorActions } from "./client";

export const dynamic = "force-dynamic";

export default async function CuratorQueuePage() {
  const pending = await getPendingScreens();

  return (
    <div className="mx-auto max-w-[120rem] px-6 sm:px-10">
      <section className="grid grid-cols-1 gap-y-8 pt-12 pb-10 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-2">
          <Dateline label="Curator queue" />
        </div>
        <div className="lg:col-span-10">
          <h1 className="font-display max-w-[20ch] text-balance text-5xl leading-[1] tracking-tight sm:text-6xl">
            Pending review.
          </h1>
          <p className="mt-6 max-w-[60ch] text-[var(--color-fg-muted)]">
            New captures land here. Approve to publish into the archive,
            re-capture if the worker missed a banner, edit tags before
            publishing, or reject with a note.{" "}
            {!hasDatabase() && (
              <em className="not-italic text-[var(--color-link)]">
                — DEMO MODE: showing pending fixtures. Set DATABASE_URL to use real captures.
              </em>
            )}
          </p>
        </div>
      </section>

      <section className="border-t rule pt-8 pb-24">
        {pending.length === 0 ? (
          <div className="border rule px-8 py-20 text-center">
            <p className="font-display text-2xl">Nothing pending.</p>
            <p className="text-meta mt-3">
              Run{" "}
              <code className="font-mono text-[var(--color-fg)]">
                pnpm capture &lt;url&gt;
              </code>{" "}
              to enqueue a site for review.
            </p>
          </div>
        ) : (
          <ul className="space-y-16">
            {pending.map((s, i) => {
              const macroLabel = s.tags.macrostructure
                ? MACROSTRUCTURE_LABELS[s.tags.macrostructure as Macrostructure]
                : null;

              return (
                <li
                  key={s.slug}
                  className="grid grid-cols-1 gap-y-6 border-b rule pb-16 lg:grid-cols-12 lg:gap-x-10"
                >
                  <p className="text-meta lg:col-span-2">
                    <span className="font-display text-2xl text-[var(--color-fg)]">
                      №{String(i + 1).padStart(2, "0")}
                    </span>
                    <br />
                    {s.capturedAt}
                  </p>

                  {/* Hero crop */}
                  <div className="lg:col-span-6">
                    <div className="aspect-[16/10] overflow-hidden border rule">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={s.imageUrl}
                        alt={s.description}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="mt-3 flex items-baseline justify-between text-meta">
                      <a
                        href={s.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[var(--color-link)]"
                      >
                        {(() => {
                          try {
                            return new URL(s.sourceUrl).host;
                          } catch {
                            return s.sourceUrl;
                          }
                        })()}{" "}
                        ↗
                      </a>
                      <span>
                        {s.mode} · {s.fonts.slice(0, 2).join(" / ") || "no fonts detected"}
                      </span>
                    </div>
                  </div>

                  {/* Side panel: title + tags + palette + actions */}
                  <div className="lg:col-span-4">
                    <h2 className="font-display text-3xl leading-tight">
                      {s.title}
                    </h2>
                    <p className="mt-2 max-w-[40ch] text-[var(--color-fg-muted)]">
                      {s.description}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {macroLabel && (
                        <TagPill label={macroLabel} variant="macro" />
                      )}
                      {s.tags.style.map((x) => (
                        <TagPill key={x} label={x.replace(/-/g, " ")} />
                      ))}
                      {s.tags.industry.map((x) => (
                        <TagPill key={x} label={x.replace(/-/g, " ")} />
                      ))}
                    </div>

                    <div className="mt-5">
                      <p className="text-meta mb-2">Palette</p>
                      <PaletteStrip palette={s.palette} size="sm" showHex={false} />
                    </div>

                    <div className="mt-5">
                      <p className="text-meta mb-2">Tech</p>
                      <p className="text-sm">
                        {s.tech.length ? s.tech.join(" · ") : "—"}
                      </p>
                    </div>

                    <div className="mt-8">
                      <CuratorActions slug={s.slug} sourceUrl={s.sourceUrl} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
