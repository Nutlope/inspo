/**
 * Categorise the output of `audit-disk.ts`.
 *
 * The audit's 10-item prompt is intentionally trigger-happy (designed
 * to drive recapture, not deletion). For removal decisions we need to
 * separate "small cookie strip" (keep, harmless) from real blockers
 * ("centered modal", "blank page", "splash"). This script reads a
 * flagged-list JSON, bucketises by the reason text, prints counts +
 * samples, and optionally writes per-bucket lists.
 *
 *   pnpm tsx src/audit-categorize.ts <path-to-disk-audit-report.json>
 *   pnpm tsx src/audit-categorize.ts <path> --write
 */

import { readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

interface Flag {
  slug: string;
  reason: string;
}

type Bucket = "blocker_modal" | "splash_blank" | "paywall_ad" | "chat_open" | "cookie_strip" | "newsletter_promo" | "region_age" | "uncategorised";

const ORDER: Bucket[] = [
  "blocker_modal",
  "splash_blank",
  "paywall_ad",
  "chat_open",
  "newsletter_promo",
  "region_age",
  "cookie_strip",
  "uncategorised",
];

// Buckets we'd default to DELETING. Cookie strips and newsletter
// pop-ups are kept — they don't actually destroy the hero shot's
// usefulness as a design reference, and removing them all would gut
// the catalogue.
const DELETE_BUCKETS: Bucket[] = ["splash_blank", "paywall_ad", "chat_open"];

// "blocker_modal" is ambiguous — covers both "huge centered dialog"
// and "small cookie modal that happens to be centered". Reported but
// not auto-deleted by default; user picks.
const REVIEW_BUCKETS: Bucket[] = ["blocker_modal"];

function classify(reason: string): Bucket {
  const r = reason.toLowerCase();
  // Order matters — earlier rules win.
  if (/(blank|empty white|loading state|hasn'?t rendered|no visible content)/.test(r)) return "splash_blank";
  if (/(splash|forcing action before content|trial.*signup.*splash|signup.*splash|login splash)/.test(r)) return "splash_blank";
  if (/(paywall|interstitial|\bad overlay|advertisement)/.test(r)) return "paywall_ad";
  if (/(open chat|chat conversation)/.test(r)) return "chat_open";
  if (/(age gate|21\+|are you 18)/.test(r)) return "region_age";
  if (/(region|country|currency|language selector)/.test(r)) return "region_age";
  if (/(newsletter|email[- ]capture|subscribe|promo|discount|sale ends|save \d|10% off|20% off)/.test(r)) return "newsletter_promo";
  if (/(cookie|gdpr|ccpa|privacy|consent|"we use)/.test(r)) {
    // Distinguish "small strip" hints from "modal overlay"
    if (/(modal|dialog|backdrop|overlay|popup|covers content|covering content|full[- ]screen)/.test(r)) {
      return "blocker_modal";
    }
    return "cookie_strip";
  }
  if (/(centered modal|dialog box|backdrop dimming|modal dialog)/.test(r)) return "blocker_modal";
  return "uncategorised";
}

function main() {
  const [reportPath, ...rest] = process.argv.slice(2);
  if (!reportPath) {
    console.error("usage: audit-categorize.ts <flagged-report.json> [--write]");
    process.exit(1);
  }
  const write = rest.includes("--write");

  const data: Flag[] = JSON.parse(readFileSync(reportPath, "utf8"));
  const buckets = new Map<Bucket, Flag[]>();
  for (const b of ORDER) buckets.set(b, []);
  for (const f of data) {
    const b = classify(f.reason);
    buckets.get(b)!.push(f);
  }

  console.log(`\n=== AUDIT CATEGORISATION: ${basename(reportPath)} ===`);
  console.log(`total flagged: ${data.length}\n`);
  for (const b of ORDER) {
    const list = buckets.get(b)!;
    const tag = DELETE_BUCKETS.includes(b)
      ? "[DELETE]"
      : REVIEW_BUCKETS.includes(b)
        ? "[REVIEW]"
        : "[KEEP]  ";
    console.log(`${tag} ${b.padEnd(20)} ${String(list.length).padStart(4)}`);
  }
  console.log("");
  for (const b of ORDER) {
    const list = buckets.get(b)!;
    if (!list.length) continue;
    console.log(`\n── ${b} (${list.length}) — sample 8 ──`);
    for (const f of list.slice(0, 8)) {
      console.log(`  ${f.slug.padEnd(36)} ${f.reason.slice(0, 100)}`);
    }
  }

  console.log("\n── totals by action ──");
  const deleteN = DELETE_BUCKETS.reduce((n, b) => n + buckets.get(b)!.length, 0);
  const reviewN = REVIEW_BUCKETS.reduce((n, b) => n + buckets.get(b)!.length, 0);
  const keepN = data.length - deleteN - reviewN;
  console.log(`  default DELETE: ${deleteN} (${DELETE_BUCKETS.join(", ")})`);
  console.log(`  default REVIEW: ${reviewN} (${REVIEW_BUCKETS.join(", ")})`);
  console.log(`  default KEEP:   ${keepN}`);

  if (write) {
    const dir = dirname(reportPath);
    for (const b of ORDER) {
      const list = buckets.get(b)!;
      if (!list.length) continue;
      const p = join(dir, `bucket-${b}.json`);
      writeFileSync(p, JSON.stringify(list, null, 2));
      console.log(`  wrote ${p}`);
    }
  } else {
    console.log("\n(pass --write to dump per-bucket JSON files)");
  }
}

main();
