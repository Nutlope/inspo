/**
 * Per-page metadata extraction — palette (from the hero crop), fonts
 * (from computed styles), tech fingerprint (from script srcs / meta /
 * cookie names), light/dark mode (from luminance of hero).
 */

import { Vibrant } from "node-vibrant/node";
import type { Page } from "playwright";
import type { ExtractedMetadata } from "./types";

const gen = (c: Clues, needle: string) =>
  Boolean(c.metaGenerator && c.metaGenerator.toLowerCase().includes(needle));

const TECH_FINGERPRINTS: { name: string; test: (clues: Clues) => boolean }[] = [
  { name: "Next.js", test: (c) => c.scripts.some((s) => s.includes("/_next/")) || gen(c, "next.js") },
  { name: "Vercel", test: (c) => c.headers.has("x-vercel-id") || c.scripts.some((s) => s.includes("vercel")) },
  { name: "Astro", test: (c) => gen(c, "astro") || c.scripts.some((s) => s.includes("astro")) },
  { name: "SvelteKit", test: (c) => c.scripts.some((s) => s.includes("/_app/")) },
  { name: "Webflow", test: (c) => c.scripts.some((s) => s.includes("webflow")) || gen(c, "webflow") },
  { name: "Framer", test: (c) => gen(c, "framer") || c.scripts.some((s) => s.includes("framer.com")) },
  { name: "Shopify", test: (c) => c.scripts.some((s) => s.includes("shopify")) || gen(c, "shopify") },
  { name: "Tailwind", test: (c) => c.classNames.some((n) => /\b(?:flex|grid|p-\d|m-\d|text-(?:xs|sm|base|lg|xl)|bg-(?:white|black|gray|slate|zinc))\b/.test(n)) },
  { name: "Cloudflare", test: (c) => c.headers.has("cf-ray") },
];

type Clues = {
  scripts: string[];
  classNames: string[];
  metaGenerator: string | null;
  headers: Map<string, string>;
};

export async function extract(
  page: Page,
  responseHeaders: Record<string, string>,
  heroPng: Buffer,
): Promise<ExtractedMetadata> {
  // Palette via vibrant on the hero crop
  let palette: string[] = [];
  try {
    const v = await Vibrant.from(heroPng).getPalette();
    palette = [
      v.Vibrant?.hex,
      v.LightVibrant?.hex,
      v.DarkVibrant?.hex,
      v.Muted?.hex,
      v.LightMuted?.hex,
      v.DarkMuted?.hex,
    ]
      .filter((x): x is string => Boolean(x))
      .slice(0, 5);
  } catch {
    palette = [];
  }

  // In-page font + meta extraction. Implementation is fully inlined —
  // tsx/esbuild rewrites named inner functions to use a `__name` helper
  // that doesn't exist in the page context, so we keep this monolithic.
  const inPage = await page.evaluate(`(() => {
    const ffOf = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      return window.getComputedStyle(el).fontFamily.split(',')[0].replace(/['"]/g,'').trim();
    };
    const fonts = ['h1','h2','p, body','button']
      .map(ffOf)
      .filter((x) => x && x !== 'inherit');
    const unique = Array.from(new Set(fonts));
    const metaGenerator = document.querySelector('meta[name="generator"]') && document.querySelector('meta[name="generator"]').getAttribute('content') || null;
    const ogDescription =
      (document.querySelector('meta[property="og:description"]') && document.querySelector('meta[property="og:description"]').getAttribute('content')) ||
      (document.querySelector('meta[name="description"]') && document.querySelector('meta[name="description"]').getAttribute('content')) ||
      '';
    const title = document.title || '';
    const scripts = Array.from(document.scripts).map((s) => s.src).filter(Boolean);
    const classNames = Array.from(document.querySelectorAll('[class]'))
      .slice(0, 200)
      .reduce((acc, el) => acc.concat(String(el.className).split(/\\s+/)), []);
    const bg = window.getComputedStyle(document.body).backgroundColor;
    return { fonts: unique, metaGenerator, ogDescription, title, scripts, classNames, bgColor: bg };
  })()`) as {
    fonts: string[];
    metaGenerator: string | null;
    ogDescription: string;
    title: string;
    scripts: string[];
    classNames: string[];
    bgColor: string;
  };

  // Mode from bg color
  const mode = isLightColor(inPage.bgColor) ? ("light" as const) : ("dark" as const);

  // Tech detection
  const headersMap = new Map(
    Object.entries(responseHeaders).map(([k, v]) => [k.toLowerCase(), v]),
  );
  const clues: Clues = {
    scripts: inPage.scripts,
    classNames: inPage.classNames,
    metaGenerator: inPage.metaGenerator,
    headers: headersMap,
  };
  const tech = TECH_FINGERPRINTS.filter((f) => f.test(clues)).map((f) => f.name);

  return {
    palette,
    fonts: inPage.fonts,
    tech,
    mode,
    pageTitle: inPage.title,
    pageDescription: inPage.ogDescription,
  };
}

function isLightColor(rgb: string): boolean {
  const m = rgb.match(/\d+/g);
  if (!m || m.length < 3) return true;
  const [r, g, b] = m.map(Number);
  // Per-channel relative luminance approximation
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.55;
}
