/**
 * /map - the catalogue's design space, projected to 2D via UMAP.
 *
 * Server: loads the umap-2d.json sidecar (offline-computed) and joins
 * it with the SiteTile list (for thumb URLs + titles + macrostructure
 * for colouring). Sends a compact list to the client - title, slug,
 * thumbUrl, coords, and one tag for category colour.
 *
 * Client: canvas-based plot in <EmbeddingMap>. Pan / zoom / hover
 * tooltip / click-to-detail. No DOM nodes per dot, so 1,200+ is fine.
 *
 * Why no SSR of the plot itself: server-rendered canvas pixels make
 * zero sense here, and SVG dots would balloon initial HTML. The page
 * paints the title + caption instantly, then the canvas mounts.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getAllSites } from "@inspo/db";
import { EmbeddingMap } from "@/components/embedding-map";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Map - Inspo",
  description:
    "A 2D projection of the catalogue's text embeddings. Wander the design space.",
};

interface UmapSidecar {
  version: string;
  generatedAt: string;
  dims: number;
  count: number;
  slugs: string[];
  coords: [number, number][];
}

interface MapPoint {
  slug: string;
  title: string;
  thumbUrl: string;
  imageUrl: string;
  x: number;
  y: number;
  /** Coarse colour key for visual clustering - defaults to
   *  macrostructure but falls back to first style tag. */
  group: string;
}

function loadSidecar(): UmapSidecar | null {
  // Sidecar ships next to the seed in @inspo/db. Resolve from the
  // package source directly so we don't double-bundle in the web
  // build.
  try {
    const path = resolve(
      process.cwd(),
      "..",
      "..",
      "packages",
      "db",
      "src",
      "umap-2d.json",
    );
    const raw = readFileSync(path, "utf8");
    return JSON.parse(raw) as UmapSidecar;
  } catch {
    return null;
  }
}

export default async function MapPage() {
  const sidecar = loadSidecar();
  if (!sidecar) notFound();

  // Build a slug → tile lookup from the catalogue. We need thumb URLs
  // and a group key (macrostructure for colour). getAllSites returns
  // SiteTile = ScreenSummary & { pageCount }.
  const sites = await getAllSites();
  const bySlug = new Map(sites.map((s) => [s.siteSlug, s]));

  const points: MapPoint[] = [];
  for (let i = 0; i < sidecar.slugs.length; i++) {
    const slug = sidecar.slugs[i]!;
    const s = bySlug.get(slug);
    if (!s) continue; // sidecar may include deleted slugs; just skip
    const [x, y] = sidecar.coords[i]!;
    const group =
      (s.tags.macrostructure as string | undefined) ??
      s.tags.style[0] ??
      "other";
    points.push({
      slug,
      title: s.title,
      thumbUrl: s.thumbUrl,
      imageUrl: s.imageUrl,
      x,
      y,
      group,
    });
  }

  // Sort groups by frequency so the colour legend is intuitive.
  const groupCounts = new Map<string, number>();
  for (const p of points) {
    groupCounts.set(p.group, (groupCounts.get(p.group) ?? 0) + 1);
  }
  const orderedGroups = [...groupCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([g]) => g);

  return (
    <div className="px-4 sm:px-6">
      {/* Compact header - the map itself is the page. */}
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3 pt-9 pb-5">
        <div>
          <p className="text-meta text-[var(--color-fg-muted)]">
            Map · {points.length.toLocaleString()} sites · UMAP of 1024-dim
            embeddings · built {sidecar.generatedAt.slice(0, 10)}
          </p>
          <h1 className="font-display mt-1.5 text-[length:var(--text-h2)] leading-[1.02] tracking-tight">
            The catalogue&rsquo;s <em className="not-italic text-[var(--color-link)]">visual neighbourhood.</em>
          </h1>
        </div>
        <p className="text-meta max-w-[52ch] text-[var(--color-fg-muted)]">
          Semantically + visually similar sites cluster. Search to highlight ·
          click a group to isolate · zoom in for thumbnails · click a site to open.
        </p>
      </div>

      {/* Map fills the rest of the viewport. */}
      <div className="relative h-[calc(100svh-12.5rem)] min-h-[560px] w-full overflow-hidden border rule">
        <EmbeddingMap points={points} groupOrder={orderedGroups} />
      </div>

      <div className="py-5 text-meta">
        <Link href="/screens" className="hover:text-[var(--color-link)]">
          ← Back to the archive
        </Link>
      </div>
    </div>
  );
}
