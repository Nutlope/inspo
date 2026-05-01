/**
 * One-shot cleanup: re-fetch each published screen's source URL and
 * pull the real `<title>` (or og:title) from the HTML, replacing the
 * description-derived placeholder titles persist.ts wrote during the
 * first recapture pass.
 *
 * No Playwright, no Together, no embeddings — just `fetch` + regex.
 * ~1s per row.
 *
 * Run: pnpm --filter @inspo/worker cleanup:titles            (dry-run)
 *      pnpm --filter @inspo/worker cleanup:titles --apply    (write)
 */

import "./env.js";
import { neon } from "@neondatabase/serverless";

const APPLY = process.argv.includes("--apply");

const TITLE_RE = /<title[^>]*>([\s\S]*?)<\/title>/i;
const OG_TITLE_RE =
  /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i;
const OG_TITLE_RE2 =
  /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i;
const TWITTER_TITLE_RE =
  /<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i;

function extractTitle(html: string): string | null {
  const og =
    html.match(OG_TITLE_RE)?.[1] ??
    html.match(OG_TITLE_RE2)?.[1] ??
    html.match(TWITTER_TITLE_RE)?.[1] ??
    html.match(TITLE_RE)?.[1] ??
    null;
  if (!og) return null;
  return og
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Trim trailing brand-tag bits ("— Foo", "| Bar", "· Baz") so cards
 * stay compact. Same heuristic as persist.ts's cleanedPageTitle.
 */
function clean(title: string): string {
  return title.split(/\s[—|·–-]\s/)[0]?.trim() ?? title;
}

/** A title looks bad when it's a sentence (>= 8 words OR ends in "."/has comma). */
function isLikelySentence(title: string): boolean {
  const words = title.trim().split(/\s+/);
  if (words.length >= 8) return true;
  if (/[.,]\s/.test(title)) return true;
  if (/^The\s/.test(title)) return true; // "The page employs…"
  return false;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  const sql = neon(url);
  const rows = (await sql`
    SELECT id, slug, title, source_url
    FROM screens
    WHERE status='published'
    ORDER BY captured_at DESC
  `) as Array<{ id: string; slug: string; title: string; source_url: string }>;

  console.log(`Inspecting ${rows.length} rows · ${APPLY ? "APPLY" : "dry-run"}`);
  console.log();

  let changed = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    if (!isLikelySentence(row.title)) {
      skipped++;
      continue;
    }

    let html: string;
    try {
      const r = await fetch(row.source_url, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 Inspo/0.1",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(15_000),
      });
      if (!r.ok) {
        console.log(`  ✗ ${row.slug}  HTTP ${r.status}`);
        failed++;
        continue;
      }
      html = await r.text();
    } catch (err) {
      console.log(
        `  ✗ ${row.slug}  ${err instanceof Error ? err.message.slice(0, 80) : "fetch failed"}`,
      );
      failed++;
      continue;
    }

    const raw = extractTitle(html);
    if (!raw) {
      console.log(`  ✗ ${row.slug}  no <title> found`);
      failed++;
      continue;
    }
    const cleaned = clean(raw);
    if (!cleaned || cleaned.length < 2 || cleaned.length > 100) {
      console.log(`  ✗ ${row.slug}  unusable title: ${raw.slice(0, 60)}`);
      failed++;
      continue;
    }

    console.log(
      `  ✓ ${row.slug.padEnd(28)} ${row.title.slice(0, 30).padEnd(32)} → ${cleaned}`,
    );
    if (APPLY) {
      await sql`UPDATE screens SET title=${cleaned} WHERE id=${row.id}`;
    }
    changed++;
  }

  console.log();
  console.log(
    `${APPLY ? "Updated" : "Would update"} ${changed} · skipped ${skipped} · failed ${failed}`,
  );
  if (!APPLY && changed > 0) {
    console.log("Re-run with --apply to commit the changes.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
