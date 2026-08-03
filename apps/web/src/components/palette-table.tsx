/**
 * Palette table - replaces the chip+hex row in the detail page's
 * palette band. Renders each colour as: large swatch · hex · OKLCH
 * equivalent · suggested role · per-row copy buttons (hex + CSS var).
 *
 * Roles are inferred from index: extracted palettes (node-vibrant)
 * are returned roughly sorted by prominence, so index 0 = dominant,
 * 1 = secondary surface, 2 = ink, 3 = accent candidate, 4 = detail.
 * This is a heuristic, not a contract - the column is labelled
 * "Suggested role" to be honest about it.
 *
 * The OKLCH conversion is best-effort. We accept #rgb / #rrggbb only
 * (which is what the seed contains); any other format renders blank
 * in the OKLCH column without breaking the row.
 */

import Link from "next/link";
import { CopyValue } from "@/components/copy-value";
import { formatOklch, normalizeHex } from "@/lib/color";

const ROLE_HINTS = ["Dominant", "Surface", "Ink", "Accent", "Detail"];

function tokenize(hex: string, role: string): string {
  return `--color-${role.toLowerCase()}: ${hex};`;
}

export function PaletteTable({
  palette,
  colorWords,
}: {
  palette: string[];
  /** Optional descriptive words from the vision tagger (e.g.
   *  "monochrome, warm, high-contrast"). Shown as a caption above
   *  the table so the table itself stays scannable. */
  colorWords?: string[];
}) {
  if (!palette.length) return null;

  return (
    <div>
      {colorWords && colorWords.length > 0 && (
        <p className="text-meta mb-4">
          Reads as:{" "}
          {colorWords.map((w, i) => (
            <span key={w}>
              {i > 0 ? " · " : ""}
              <span className="text-[var(--color-fg)]">{w}</span>
            </span>
          ))}
        </p>
      )}

      <div className="border rule overflow-hidden">
        {/* Header - visible on lg, hidden on small (the rows label
            themselves with inline meta). */}
        <div
          className="hidden lg:grid lg:grid-cols-[5.5rem_minmax(7rem,1fr)_minmax(11rem,1.4fr)_minmax(6rem,0.8fr)_auto] gap-x-6 items-center border-b rule bg-[color-mix(in_oklab,var(--color-fg)_4%,var(--color-bg))] px-4 py-3"
        >
          <span className="text-meta">Swatch</span>
          <span className="text-meta">Hex</span>
          <span className="text-meta">OKLCH</span>
          <span className="text-meta">Suggested role</span>
          <span className="text-meta">Copy</span>
        </div>

        <ul>
          {palette.map((hex, i) => {
            const role = ROLE_HINTS[i] ?? "Detail";
            const oklch = formatOklch(hex);
            const isLast = i === palette.length - 1;
            return (
              <li
                key={`${hex}-${i}`}
                className={`group flex flex-col gap-3 px-4 py-4 lg:grid lg:grid-cols-[5.5rem_minmax(7rem,1fr)_minmax(11rem,1.4fr)_minmax(6rem,0.8fr)_auto] lg:items-center lg:gap-x-6 ${isLast ? "" : "border-b rule"}`}
              >
                <div
                  className="h-14 w-full lg:w-20 border rule"
                  style={{ background: hex }}
                  aria-hidden
                />
                <div className="flex items-baseline gap-3 lg:gap-0 lg:flex-col lg:items-start">
                  <span className="lg:hidden text-meta">Hex</span>
                  <span className="font-mono text-sm">{hex}</span>
                </div>
                <div className="flex items-baseline gap-3 lg:gap-0 lg:flex-col lg:items-start">
                  <span className="lg:hidden text-meta">OKLCH</span>
                  <span className="font-mono text-xs text-[var(--color-fg-muted)] break-all">
                    {oklch ?? "-"}
                  </span>
                </div>
                <div className="flex items-baseline gap-3 lg:gap-0 lg:flex-col lg:items-start">
                  <span className="lg:hidden text-meta">Role</span>
                  <span className="text-sm">{role}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 lg:opacity-0 lg:group-hover:opacity-100 lg:transition-opacity">
                  <CopyValue value={hex} label={`Copy hex ${hex}`} />
                  {oklch && <CopyValue value={oklch} label={`Copy OKLCH for ${hex}`} />}
                  <CopyValue
                    value={tokenize(hex, role)}
                    label={`Copy CSS variable for ${hex}`}
                  />
                  {(() => {
                    const norm = normalizeHex(hex);
                    return norm ? (
                      <Link
                        href={`/screens?hex=${encodeURIComponent(norm)}`}
                        className="font-mono text-xs tracking-normal text-[var(--color-fg-muted)] hover:text-[var(--color-link)]"
                        aria-label={`Find sites with colour ${hex}`}
                      >
                        find sites →
                      </Link>
                    ) : null;
                  })()}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
