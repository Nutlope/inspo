/**
 * Build a static seed file (`packages/db/src/static-screens.json`) from
 * the on-disk captures directory. Ships as part of the deployed bundle
 * so the gallery + ⌘K + /sites pages stay rich even when the DB is
 * unreachable.
 *
 * Schema-compatible with the fixtures path used by `getAllScreens` when
 * DATABASE_URL is missing or the connection fails — each entry is a
 * full ScreenSummary with image URLs pointing at the public Vercel
 * Blob store.
 *
 *   pnpm build:static-seed
 *
 * No Neon hits. No vision-LLM calls. Cheap and idempotent.
 */

import "./env.js";
import { readdirSync, writeFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const CAPTURES_DIR = resolve(
  process.env.INSPO_CAPTURES_DIR ?? join(process.cwd(), "captures"),
);

const BLOB_BASE =
  process.env.INSPO_BLOB_BASE_URL ??
  "https://0nme3pk5am3urwa9.public.blob.vercel-storage.com/captures";

type PageType =
  | "landing"
  | "pricing"
  | "features"
  | "auth"
  | "about"
  | "blog"
  | "changelog"
  | "docs"
  | "other";

function titleCaseFromSlug(slug: string): string {
  return slug
    .replace(/-com$|-org$|-net$|-io$|-app$|-co$|-dev$|-ai$|-design$/, "")
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function pageTypeFromSlug(siteSlug: string, slug: string): PageType {
  if (slug === siteSlug) return "landing";
  const tail = slug.replace(`${siteSlug}--`, "");
  if (/^(pricing|plans)$/.test(tail)) return "pricing";
  if (/^(features?|product|api|developers?)$/.test(tail)) return "features";
  if (/^(sign|signup|signin|login|register|get-started)/.test(tail)) return "auth";
  if (/^(about|company|story)$/.test(tail)) return "about";
  if (/^(blog|news|press)$/.test(tail)) return "blog";
  if (/^(changelog|releases?|whats-new)$/.test(tail)) return "changelog";
  if (/^(docs?|reference|guides?)/.test(tail)) return "docs";
  return "other";
}

function pageTitle(siteTitle: string, pageType: PageType): string {
  switch (pageType) {
    case "landing":
      return siteTitle;
    case "pricing":
      return `${siteTitle} — Pricing`;
    case "features":
      return `${siteTitle} — Features`;
    case "auth":
      return `${siteTitle} — Sign up`;
    case "about":
      return `${siteTitle} — About`;
    case "blog":
      return `${siteTitle} — Blog`;
    case "changelog":
      return `${siteTitle} — Changelog`;
    case "docs":
      return `${siteTitle} — Docs`;
    default:
      return siteTitle;
  }
}

function makeEntry(slug: string, capturedAt: string, mtime: number) {
  const siteSlug = slug.includes("--") ? slug.split("--")[0]! : slug;
  const pageType = pageTypeFromSlug(siteSlug, slug);
  const siteTitle = titleCaseFromSlug(siteSlug);
  const title = pageTitle(siteTitle, pageType);

  // Cache-buster — recaptured slugs get a fresh mtime, which mints a
  // fresh URL. Unchanged slugs keep their old mtime → CDN keeps
  // serving the cached PNG. Use unix seconds (compact).
  const v = Math.floor(mtime / 1000);
  const imageUrl = `${BLOB_BASE}/${slug}/hero.png?v=${v}`;
  const fullPageUrl = `${BLOB_BASE}/${slug}/full.png?v=${v}`;
  const thumbUrl = `${BLOB_BASE}/${slug}/thumb.png?v=${v}`;

  // Cheap fallback palette — gradient is wired in the tile blur-up; an
  // exact extraction would require Sharp on every file (~10 min for 4K
  // captures). Skip for static-seed v1.
  const palette = ["#1A1A1A", "#6b6862", "#C7402F", "#d8d3c8", "#F4F1EC"];

  return {
    id: slug,
    slug,
    siteSlug,
    title,
    sourceUrl: `https://${siteSlug.replace(/-(com|org|net|io|app|co|dev|ai|design)$/, ".$1").replace(/-/g, ".")}`,
    designerCredit: undefined,
    capturedAt,
    imageUrl,
    fullPageUrl,
    thumbUrl,
    description: "",
    palette,
    fonts: [] as string[],
    tech: [] as string[],
    mode: "light" as const,
    pageType,
    tags: {
      style: [] as never[],
      industry: [] as never[],
      components: [] as never[],
      vibe: [] as never[],
    },
    designSystem: {
      typeRamp: [] as never[],
      spacingScale: [] as never[],
      radiusScale: [] as never[],
      containerWidth: null,
      cssVariables: {},
      colorWords: [] as never[],
    },
    components: [] as never[],
  };
}

async function main() {
  const dirs = readdirSync(CAPTURES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_") && !d.name.startsWith("."))
    .map((d) => d.name)
    .sort();

  const entries = dirs.map((slug) => {
    let mtime = Date.now();
    try {
      const files = readdirSync(join(CAPTURES_DIR, slug))
        .filter((f) => f.startsWith("desktop-hero-") && f.endsWith(".png"));
      if (files.length > 0) {
        mtime = Math.max(
          ...files.map((f) => statSync(join(CAPTURES_DIR, slug, f)).mtimeMs),
        );
      }
    } catch {
      /* keep default */
    }
    return makeEntry(slug, new Date(mtime).toISOString().slice(0, 10), mtime);
  });

  const out = resolve("..", "..", "packages", "db", "src", "static-screens.json");
  writeFileSync(out, JSON.stringify(entries, null, 0));
  console.log(`wrote ${entries.length} entries to ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
