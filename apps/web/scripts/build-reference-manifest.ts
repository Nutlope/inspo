/**
 * Build a static manifest of the canonical reference components so
 * the MCP can return their JSX without having to load apps/web's React
 * tree at request time.
 *
 *   pnpm --filter @inspo/web exec tsx scripts/build-reference-manifest.ts
 *
 * Reads:
 *   apps/web/src/components/reference/index.ts (the typed registry)
 *   apps/web/src/components/reference/<type>/<id>.tsx (source files)
 *
 * Writes:
 *   packages/db/src/reference-components.json
 *
 * Shape per row: { id, type, label, macro, note, source, tokens }.
 *
 * The MCP's get_reference_jsx / find_reference_components tools read
 * this manifest. Self-hosters get it bundled in @inspo/db; no need
 * to ship the apps/web tree alongside the MCP.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { REFERENCE } from "../src/components/reference/index";
import type { ComponentType } from "@inspo/shared";

const REF_ROOT = resolve("src/components/reference");
const OUT = resolve("../../packages/db/src/reference-components.json");

type ManifestEntry = {
  id: string;
  type: ComponentType;
  label: string;
  macro: string;
  note: string;
  source: string;
  tokens: { needs: string[]; aliasBlock: string | null };
};

/**
 * How this component's token names map onto the ones a design system
 * built from scratch will have declared.
 *
 * `--color-accent` and `--color-accent-ink` are deliberately absent
 * from this map: the components emit those two under their canonical
 * names already, because they are the only colour tokens an external
 * design linter resolves BY NAME (everything else it reads off
 * computed CSS). Renaming the rest would buy nothing and would cost
 * the gallery its dark mode, since `--color-bg`/`--color-fg` are the
 * layer that flips.
 *
 * The remaining four are published as a paste-ready alias block. A
 * consumer dropping this JSX into a page with role-named tokens gets
 * working styles; without it the component renders with invisible
 * borders and a transparent background, silently, because an
 * undefined custom property is not an error.
 */
const CANONICAL: Record<string, string> = {
  "--color-bg": "--color-paper",
  "--color-fg": "--color-ink",
  "--color-fg-muted": "--color-muted",
  "--color-border": "--color-rule",
};

function tokensFor(source: string): ManifestEntry["tokens"] {
  const needs = [...new Set(source.match(/--[a-z0-9-]+/g) ?? [])].sort();
  const mapped = needs.filter((t) => t in CANONICAL);
  if (mapped.length === 0) return { needs, aliasBlock: null };
  const lines = mapped.map((t) => `  ${t}: var(${CANONICAL[t]});`);
  return {
    needs,
    aliasBlock: [
      "/* Paste into :root if your tokens are named for their roles. */",
      ":root {",
      ...lines,
      "}",
    ].join("\n"),
  };
}

function readSource(type: ComponentType, id: string): string {
  // Convention: apps/web/src/components/reference/<type>/<id>.tsx
  const path = resolve(REF_ROOT, type, `${id}.tsx`);
  try {
    return readFileSync(path, "utf8");
  } catch (err) {
    throw new Error(
      `Reference source missing: ${type}/${id} → ${path} (${err instanceof Error ? err.message : err})`,
    );
  }
}

function main() {
  const out: ManifestEntry[] = [];
  let totalSourceBytes = 0;
  const byType: Record<string, number> = {};

  for (const [type, refs] of Object.entries(REFERENCE) as Array<[ComponentType, Array<{ id: string; label: string; macro: string; note: string }>]>) {
    if (!refs) continue;
    for (const r of refs) {
      const source = readSource(type, r.id);
      out.push({
        id: r.id,
        type,
        label: r.label,
        macro: r.macro,
        note: r.note,
        source,
        tokens: tokensFor(source),
      });
      totalSourceBytes += source.length;
      byType[type] = (byType[type] ?? 0) + 1;
    }
  }

  out.sort((a, b) => (a.type === b.type ? a.id.localeCompare(b.id) : a.type.localeCompare(b.type)));

  writeFileSync(OUT, JSON.stringify(out, null, 0));

  console.log(`\n  reference manifest → ${OUT}`);
  console.log(`  entries: ${out.length}`);
  console.log(`  total source bytes: ${(totalSourceBytes / 1024).toFixed(0)} KB`);
  for (const [type, n] of Object.entries(byType).sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(`    ${type.padEnd(12)} ${n}`);
  }
  console.log();
}

main();
