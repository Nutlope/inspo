/**
 * /examples — "Made with Inspo". A full-bleed bento wall of real pages
 * an agent built using only the catalogue. Tiles vary in size; three
 * render the page at its mobile viewport (portrait tiles) to show the
 * builds are responsive. Hover reveals the one-line prompt + build
 * stats; click opens the case study (prompt, references, MCP calls,
 * traced palette).
 *
 * Previews are live (scaled) iframes of the actual shipped HTML — not
 * screenshots — so the wall never goes stale. The lg layout uses
 * explicit grid-line placement so it tessellates with no dead space.
 */

import Link from "next/link";
import type { Metadata } from "next";
import { EXAMPLES, type Example } from "@/lib/examples";
import { ExampleTile } from "@/components/example-tile";
import styles from "./bento.module.css";

export const metadata: Metadata = {
  title: "Examples — Made with Inspo",
  description:
    "Real landing pages built by an agent with nothing but the Inspo MCP. See the prompt, the references it studied, and the design system it traced.",
};

/** One tile's placement. `cs/rs` = span on the sm 6-col grid; `col/row`
 *  = explicit grid-line ranges on the lg 12-col grid (chosen so the
 *  wall tessellates to 100%). `phone` renders the mobile viewport. */
type Tile = {
  slug: string;
  cs: number;
  rs: number;
  col: string;
  row: string;
  phone?: boolean;
};

/** Examples whose HTML is verified responsive — a phone tile only
 *  renders the mobile layout for these (else it falls back to desktop
 *  so a phone tile never shows a broken squish). */
const RESPONSIVE = new Set<string>([
  "still-app",
  "meridian-bank",
  "the-fold-quarterly",
  "subtone-records",
  "osteria-nera",
  "vox-runtime",
]);

/** Curated wall. lg lines map to a gap-free 12×24 tessellation:
 *  hero (8×8) + 3 portrait phones (4×8) + wides (8×4) + square 3-ups.
 *  Examples not listed here auto-flow at the end as small tiles. */
const LAYOUT: Tile[] = [
  { slug: "subtone-records", cs: 6, rs: 4, col: "1 / 9", row: "1 / 9" }, // hero
  { slug: "still-app", cs: 3, rs: 5, col: "9 / 13", row: "1 / 9", phone: true },
  { slug: "osteria-nera", cs: 3, rs: 5, col: "1 / 5", row: "9 / 17", phone: true },
  { slug: "vox-runtime", cs: 6, rs: 3, col: "5 / 13", row: "9 / 13" }, // wide
  { slug: "conduit", cs: 3, rs: 3, col: "5 / 9", row: "13 / 17" },
  { slug: "slowboat-coffee", cs: 3, rs: 3, col: "9 / 13", row: "13 / 17" },
  { slug: "meridian-bank", cs: 6, rs: 3, col: "1 / 9", row: "17 / 21" }, // wide
  { slug: "the-fold-quarterly", cs: 3, rs: 5, col: "9 / 13", row: "17 / 25", phone: true },
  { slug: "rohe-and-earl", cs: 3, rs: 3, col: "1 / 5", row: "21 / 25" },
  { slug: "kiln-and-bough", cs: 3, rs: 3, col: "5 / 9", row: "21 / 25" },
];

function buildTiles(): { ex: Example; tile: Tile }[] {
  const bySlug = new Map(EXAMPLES.map((e) => [e.slug, e]));
  const out: { ex: Example; tile: Tile }[] = [];
  const seen = new Set<string>();
  for (const tile of LAYOUT) {
    const ex = bySlug.get(tile.slug);
    if (ex) {
      out.push({ ex, tile });
      seen.add(tile.slug);
    }
  }
  // Append any examples not in the curated layout as default tiles.
  for (const ex of EXAMPLES) {
    if (!seen.has(ex.slug)) {
      out.push({ ex, tile: { slug: ex.slug, cs: 3, rs: 3, col: "auto", row: "auto" } });
    }
  }
  return out;
}

export default function ExamplesPage() {
  const tiles = buildTiles();

  return (
    <div>
      {/* Masthead ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-[120rem] px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-y-8 pt-16 pb-10 sm:pt-24 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-3">
            <p className="text-meta">Examples</p>
            <p className="text-meta mt-2 max-w-[22ch] text-[var(--color-fg-muted)]">
              {EXAMPLES.length} pages · built with nothing but the Inspo MCP
            </p>
          </div>
          <div className="lg:col-span-9">
            <h1 className="font-display max-w-[20ch] text-balance text-[clamp(2.5rem,5.5vw,5rem)] leading-[0.95] tracking-tight">
              Made with <em className="italic">Inspo</em>.
            </h1>
            <p className="mt-6 max-w-[64ch] text-[var(--color-fg-muted)]">
              Each page below was built by a coding agent given one
              sentence and nothing but the Inspo MCP — no design skill, no
              templates, no component library. Hover any tile for the
              prompt; open it for the references it studied, every tool
              call it made, and the palette it traced back to real sites.
              The portrait tiles render at phone width — the builds are
              responsive.
            </p>
          </div>
        </div>
      </section>

      {/* Bento wall (full-bleed) ──────────────────────────── */}
      <section className="px-3 pb-24 sm:px-6">
        <ul className={styles.bento}>
          {tiles.map(({ ex, tile }) => {
            const device =
              tile.phone && RESPONSIVE.has(ex.slug) ? "mobile" : "desktop";
            return (
              <li
                key={ex.slug}
                className={styles.tile}
                style={
                  {
                    "--cs": tile.cs,
                    "--rs": tile.rs,
                    "--col": tile.col,
                    "--row": tile.row,
                  } as React.CSSProperties
                }
              >
                <Link
                  href={`/examples/${ex.slug}`}
                  className="group block h-full w-full focus:outline-none"
                  aria-label={`${ex.brand} — ${ex.prompt}`}
                >
                  <div
                    className={`${styles.frame} overflow-hidden border rule transition-[transform,box-shadow] duration-300 ease-out group-hover:-translate-y-0.5 group-hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.35)] group-focus-visible:-translate-y-0.5`}
                    data-device={device}
                  >
                    <ExampleTile
                      src={`/examples/${ex.slug}/index.html`}
                      title={`${ex.brand} — preview`}
                      device={device}
                    />

                    {/* Device + open affordances (appear on hover) */}
                    <div className="pointer-events-none absolute right-3 top-3 z-10 flex items-center gap-2">
                      {device === "mobile" && (
                        <span className="rounded-full bg-black/55 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white/90 backdrop-blur-sm">
                          mobile
                        </span>
                      )}
                      <span className="translate-y-1 rounded-full bg-white/90 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-black opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        Open ↗
                      </span>
                    </div>

                    {/* Hover tooltip: scrim + brand + prompt + stats */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
                      <div className="relative p-4 sm:p-5">
                        <h2 className="font-display text-lg leading-tight text-white sm:text-xl">
                          {ex.brand}
                        </h2>
                        <div className="grid grid-rows-[0fr] opacity-0 transition-all duration-300 ease-out group-hover:grid-rows-[1fr] group-hover:opacity-100">
                          <div className="overflow-hidden">
                            <p className="mt-2 max-w-[46ch] text-sm leading-snug text-white/90">
                              “{ex.prompt}”
                            </p>
                            <p className="mt-2.5 font-mono text-[11px] uppercase tracking-wide text-white/65">
                              {ex.references.length} refs · {ex.mcpCalls.length}+
                              calls · {ex.scoreSelf.toFixed(1)}/10 · {ex.mode}
                            </p>
                          </div>
                        </div>
                      </div>
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
