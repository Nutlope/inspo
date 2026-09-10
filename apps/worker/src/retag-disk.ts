/**
 * Re-tag disk captures whose meta.json came out without tags or an
 * embedding (the vision or embedding call failed during capture, for
 * example a long burst of 503s from the serverless endpoint). Reads the
 * desktop hero PNG plus the extracted title and description, tags,
 * re-embeds, and writes the sidecar back. Nothing is re-shot.
 *
 *   pnpm exec tsx src/retag-disk.ts <slugs-file> [--concurrency=4] [--force]
 */

import "./env.js";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tagWithLLM } from "./tag.js";
import { embedText } from "./embed.js";

const CAPTURES_DIR = resolve(
  process.env.INSPO_CAPTURES_DIR ?? join(process.cwd(), "captures"),
);

type Sidecar = {
  sourceUrl: string;
  meta: { pageTitle?: string; pageDescription?: string };
  tags: { style?: string[]; description?: string; searchKeywords?: string[] } | null;
  embeddings: { text: number[] } | null;
  [k: string]: unknown;
};

function newestHero(slug: string): string | null {
  const dir = join(CAPTURES_DIR, slug);
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir).filter((f) => f.startsWith("desktop-hero-") && f.endsWith(".png"));
  if (files.length === 0) return null;
  files.sort((a, b) => statSync(join(dir, b)).mtimeMs - statSync(join(dir, a)).mtimeMs);
  return join(dir, files[0]!);
}

async function main() {
  const argv = process.argv.slice(2);
  const file = argv.find((a) => !a.startsWith("--"));
  if (!file) {
    console.error("usage: retag-disk.ts <slugs-file> [--concurrency=4] [--force]");
    process.exit(1);
  }
  const force = argv.includes("--force");
  const concurrency = Number(argv.find((a) => a.startsWith("--concurrency="))?.split("=")[1] ?? 4);
  const slugs = readFileSync(file, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  const targets = slugs.filter((slug) => {
    const p = join(CAPTURES_DIR, slug, "meta.json");
    if (!existsSync(p)) return false;
    const m = JSON.parse(readFileSync(p, "utf8")) as Sidecar;
    return force || !m.tags || !(m.tags.style?.length) || !m.embeddings;
  });
  console.log(`\n  retag-disk · ${targets.length} of ${slugs.length} need tags or an embedding\n`);

  let i = 0;
  let ok = 0;
  let failed = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (i < targets.length) {
        const slug = targets[i++]!;
        const metaPath = join(CAPTURES_DIR, slug, "meta.json");
        const hero = newestHero(slug);
        if (!hero) {
          failed++;
          console.log(`  ✗ ${slug}: no desktop hero`);
          continue;
        }
        try {
          const m = JSON.parse(readFileSync(metaPath, "utf8")) as Sidecar;
          const tags = await tagWithLLM({
            heroPng: readFileSync(hero),
            pageTitle: m.meta.pageTitle ?? "",
            pageDescription: m.meta.pageDescription ?? "",
            sourceUrl: m.sourceUrl,
          });
          const text = [
            m.meta.pageTitle,
            m.meta.pageDescription,
            tags.description,
            tags.searchKeywords.join(" "),
          ]
            .filter(Boolean)
            .join(" · ");
          const vec = await embedText(text || m.sourceUrl);
          m.tags = tags;
          m.embeddings = { text: vec };
          writeFileSync(metaPath, JSON.stringify(m, null, 2));
          ok++;
          console.log(`  ✓ ${slug.padEnd(44)} ${tags.style.join(",")} · ${tags.macrostructure ?? "-"}`);
        } catch (err) {
          failed++;
          console.log(`  ✗ ${slug}: ${err instanceof Error ? err.message.slice(0, 100) : String(err)}`);
        }
      }
    }),
  );
  console.log(`\n  retagged ${ok} · failed ${failed}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
