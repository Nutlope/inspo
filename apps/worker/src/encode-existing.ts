/**
 * Backfill AVIF/WebP variants for every slug in captures/. Idempotent
 * — files that already have variants are skipped. Safe to re-run.
 *
 *   pnpm --filter @inspo/worker exec tsx src/encode-existing.ts          dry-run summary
 *   pnpm --filter @inspo/worker exec tsx src/encode-existing.ts --go     encode missing variants
 *   pnpm --filter @inspo/worker exec tsx src/encode-existing.ts --go --concurrency=8
 *   pnpm --filter @inspo/worker exec tsx src/encode-existing.ts --go --slug=linear-app
 *   pnpm --filter @inspo/worker exec tsx src/encode-existing.ts --go --force   re-encode even if outputs exist
 *
 * This is meant to be paired with `pnpm capture:upload-to-blob -- --go`
 * afterwards — uploading the freshly-encoded variants to Vercel Blob.
 */

import "./env.js";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { encodeVariants, type EncodeRole } from "./encode-variants.js";

const CAPTURES_DIR = resolve(
  process.env.INSPO_CAPTURES_DIR ?? join(process.cwd(), "captures"),
);

type RoleSpec = { prefix: string; role: EncodeRole };

// What we encode per slug. Mirrors what upload-to-blob ships: desktop-
// hero → hero.png, desktop-full → full.png, tablet-hero → thumb.png.
// We encode tablet-hero as `thumb` so its 384-wide variant is the
// natural tile asset; encoding desktop-hero as `hero` covers the
// detail-page plate at three widths.
const ROLES: RoleSpec[] = [
  { prefix: "desktop-hero-", role: "hero" },
  { prefix: "desktop-full-", role: "full" },
  { prefix: "tablet-hero-", role: "thumb" },
];

function newestPng(dir: string, prefix: string): string | null {
  let files: string[];
  try {
    files = readdirSync(dir).filter(
      (f) => f.startsWith(prefix) && f.endsWith(".png"),
    );
  } catch {
    return null;
  }
  if (files.length === 0) return null;
  files.sort((a, b) => statSync(join(dir, b)).mtimeMs - statSync(join(dir, a)).mtimeMs);
  return join(dir, files[0]!);
}

async function main() {
  const argv = process.argv.slice(2);
  const go = argv.includes("--go");
  const force = argv.includes("--force");
  const slugFilter = argv.find((a) => a.startsWith("--slug="))?.split("=")[1];
  const concurrency = Number(
    argv.find((a) => a.startsWith("--concurrency="))?.split("=")[1] ?? 4,
  );

  if (!existsSync(CAPTURES_DIR)) {
    throw new Error(`No captures dir at ${CAPTURES_DIR}`);
  }

  const allSlugs = readdirSync(CAPTURES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_") && !d.name.startsWith("."))
    .map((d) => d.name);
  const slugs = (slugFilter ? allSlugs.filter((s) => s === slugFilter) : allSlugs).sort();

  console.log(`\n  encode-existing · ${slugs.length} slugs · go=${go} · force=${force}\n`);

  if (!go) {
    // Probe a small sample to estimate how many encodes will run.
    const sample = slugs.slice(0, 20);
    let needs = 0;
    let already = 0;
    for (const slug of sample) {
      for (const { prefix, role } of ROLES) {
        const png = newestPng(join(CAPTURES_DIR, slug), prefix);
        if (!png) continue;
        // Each role emits 2 formats × N widths. We don't actually run
        // the encoder in dry mode — just check the first output.
        const stem = png.slice(0, -".png".length);
        const probeW = role === "thumb" ? 384 : role === "hero" ? 384 : 768;
        const probe = `${stem}.${probeW}.avif`;
        if (existsSync(probe)) already += 1;
        else needs += 1;
      }
    }
    const ratio = (needs + already) > 0 ? needs / (needs + already) : 0;
    const eta = Math.round(slugs.length * ROLES.length * ratio);
    console.log(`  sampled ${sample.length} slugs: ${needs} need encoding, ${already} done`);
    console.log(`  rough estimate: ~${eta} encode passes across ${slugs.length} slugs`);
    console.log(`\n  dry-run. re-run with --go to encode.\n`);
    return;
  }

  let cursor = 0;
  let totalWritten = 0;
  let totalSkipped = 0;
  let errors = 0;
  const startedAt = Date.now();

  async function worker() {
    while (cursor < slugs.length) {
      const i = cursor++;
      const slug = slugs[i]!;
      const tag = `[${String(i + 1).padStart(4, " ")}/${slugs.length}]`;
      try {
        let wrote = 0;
        let skip = 0;
        for (const { prefix, role } of ROLES) {
          const png = newestPng(join(CAPTURES_DIR, slug), prefix);
          if (!png) continue;
          const r = await encodeVariants(png, { role, force });
          wrote += r.written.length;
          skip += r.skipped.length;
        }
        totalWritten += wrote;
        totalSkipped += skip;
        if (wrote > 0) {
          console.log(`${tag} ✓ ${slug.padEnd(40)} wrote ${wrote} · reused ${skip}`);
        } else if ((i + 1) % 100 === 0) {
          console.log(`${tag}   ${slug.padEnd(40)} all variants already present`);
        }
      } catch (err) {
        errors += 1;
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`${tag} ✗ ${slug.padEnd(40)} ${msg.slice(0, 70)}`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const mins = ((Date.now() - startedAt) / 1000 / 60).toFixed(1);
  console.log();
  console.log(`  wrote ${totalWritten} files · reused ${totalSkipped} · errors ${errors} · ${mins} min`);
  console.log(`\n  next: pnpm --filter @inspo/worker capture:upload-to-blob -- --go`);
  console.log();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
