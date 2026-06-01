/**
 * /map — the catalogue's design space, projected to 2D via UMAP.
 *
 * Server: loads the umap-2d.json sidecar (offline-computed) and joins
 * it with the SiteTile list (for thumb URLs + titles + macrostructure
 * for colouring). Sends a compact list to the client — title, slug,
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
  title: "Map — Inspo",
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
  x: number;
  y: number;
  /** Coarse colour key for visual clustering — defaults to
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
    <div className="mx-auto max-w-[120rem] px-6 sm:px-10">
      <section className="grid grid-cols-1 gap-y-8 pt-16 pb-8 sm:pt-24 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-2">
          <p className="text-meta">Map</p>
          <p className="text-meta mt-2 max-w-[18ch] text-[var(--color-fg-muted)]">
            Sidecar built {sidecar.generatedAt.slice(0, 10)} ·{" "}
            {points.length.toLocaleString()} sites
          </p>
        </div>
        <div className="lg:col-span-10">
          <h1 className="font-display max-w-[18ch] text-balance text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.95] tracking-tight">
            The catalogue&rsquo;s{" "}
            <em className="italic">visual neighbourhood.</em>
          </h1>
          <p className="mt-6 max-w-[60ch] text-[var(--color-fg-muted)]">
            Every site&rsquo;s description, tags, and palette were embedded
            into a 1024-dim space. UMAP reduces those to 2D so visually +
            semantically similar sites cluster. Drag to pan. Scroll to zoom.
            Hover to peek. Click to open a detail page.
          </p>
        </div>
      </section>

      <section className="border-y rule">
        <EmbeddingMap points={points} groupOrder={orderedGroups} />
      </section>

      <section className="pt-10 pb-16">
        <p className="text-meta">
          <Link
            href="/screens"
            className="hover:text-[var(--color-link)]"
          >
            ← Back to the archive
          </Link>
        </p>
      </section>
    </div>
  );
}
