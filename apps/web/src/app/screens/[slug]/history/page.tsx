/**
 * Time machine - `/screens/<slug>/history`.
 *
 * Lists every desktop-hero-*.png revision of a site on disk, oldest →
 * newest, and lets the user scrub between them. We already keep every
 * recapture without overwriting (see Step 1 of the dedupe report -
 * 447 dirs had >1 hero). Surfacing this is a differentiator: few
 * archives show how a site evolves over time.
 *
 * Server side: enumerate the files, sort by mtime, pass to the client
 * scrubber. The client component manages the selected revision +
 * pre-fetches neighbours so scrubbing feels instant.
 *
 * Dev-only for now - the streamer at /api/captures/[slug]/[file]
 * reads from the worker captures dir, which isn't part of the deploy.
 * Marked clearly in the empty-state.
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { findScreen } from "@inspo/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { TimeMachine } from "@/components/time-machine";

export const dynamic = "force-dynamic";

const CAPTURES_ROOT = resolve(
  process.env.INSPO_CAPTURES_DIR ??
    join(process.cwd(), "..", "worker", "captures"),
);

interface Revision {
  file: string;
  mtime: number;
  contentHash: string;
  sizeBytes: number;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: `${slug} - history - Inspo` };
}

function listRevisions(slug: string): Revision[] {
  // Dev-only: the captures dir never ships to prod. Skip the fs work
  // there entirely (the page already renders an empty state).
  if (process.env.NODE_ENV === "production") return [];
  const dir = join(CAPTURES_ROOT, slug);
  if (!existsSync(dir)) return [];
  let files: string[];
  try {
    files = readdirSync(dir);
  } catch {
    return [];
  }
  const out: Revision[] = [];
  for (const f of files) {
    if (!f.startsWith("desktop-hero-") || !f.endsWith(".png")) continue;
    const m = f.match(/^desktop-hero-([0-9a-f]{16})\.png$/);
    if (!m) continue;
    try {
      const s = statSync(join(dir, f));
      out.push({
        file: f,
        mtime: s.mtimeMs,
        contentHash: m[1]!,
        sizeBytes: s.size,
      });
    } catch {
      /* skip */
    }
  }
  out.sort((a, b) => a.mtime - b.mtime);
  return out;
}

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const screen = await findScreen(slug);
  if (!screen) notFound();

  const revisions = listRevisions(slug);

  return (
    <div className="pb-24">
      {/* Masthead ─────────────────────────────────────────── */}
      <div className="mx-auto max-w-[120rem] px-6 pt-10 sm:px-10">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <div>
            <p className="text-meta">Time machine · {slug}</p>
            <h1 className="mt-2 font-display text-h1 leading-[0.95]">
              {screen.title}
            </h1>
          </div>
          <Link
            href={`/screens/${slug}`}
            className="text-meta hover:text-[var(--color-link)]"
          >
            ← Back to detail
          </Link>
        </div>
        <p className="mt-4 max-w-prose text-[var(--color-fg-muted)]">
          Every time we recapture a site we keep the previous hero on
          disk, named after the file&rsquo;s content hash. Scrub the
          timeline to see how this page has changed across our visits.
        </p>
      </div>

      {/* Body ─────────────────────────────────────────────── */}
      <div className="mx-auto mt-12 max-w-[120rem] px-6 sm:px-10">
        {revisions.length === 0 ? (
          <EmptyState slug={slug} />
        ) : revisions.length === 1 ? (
          <SingleRev slug={slug} rev={revisions[0]!} />
        ) : (
          <TimeMachine
            slug={slug}
            revisions={revisions.map((r) => ({
              file: r.file,
              hash: r.contentHash,
              mtime: r.mtime,
              sizeKb: Math.round(r.sizeBytes / 1024),
            }))}
          />
        )}
      </div>
    </div>
  );
}

function EmptyState({ slug }: { slug: string }) {
  return (
    <div className="rounded-card border rule p-8 sm:p-12">
      <p className="text-meta">No revisions found on disk</p>
      <p className="mt-3 max-w-prose text-[var(--color-fg-muted)]">
        The time machine reads from the worker&rsquo;s captures
        directory. In a fresh dev environment or a production deploy
        (where captures aren&rsquo;t shipped), no files are visible
        here. Run a capture or re-capture for{" "}
        <code className="font-mono">{slug}</code> to see entries
        appear.
      </p>
    </div>
  );
}

function SingleRev({ slug, rev }: { slug: string; rev: Revision }) {
  return (
    <div className="space-y-4">
      <p className="text-meta">Only one revision on disk</p>
      <div className="overflow-hidden rounded-tile border rule">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/captures/${slug}/${rev.file}`}
          alt={`${slug} - latest capture`}
          className="h-auto w-full"
          loading="eager"
          decoding="async"
        />
      </div>
      <p className="text-meta text-[var(--color-fg-muted)]">
        Captured {new Date(rev.mtime).toISOString().slice(0, 10)} ·{" "}
        {rev.contentHash} · {Math.round(rev.sizeBytes / 1024)} KB
      </p>
    </div>
  );
}
