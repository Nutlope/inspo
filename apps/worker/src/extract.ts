/**
 * Per-page metadata extraction: palette (from the hero crop), fonts
 * (from computed styles), tech fingerprint (from script srcs / meta /
 * cookie names), light/dark mode (from luminance of hero).
 *
 * Phase 2 also extracts the design-system block: type ramp, spacing
 * scale, radius scale, container width, raw CSS variables. All values
 * are heuristic, derived from `getComputedStyle` over a representative
 * sample of elements; we get what we get and reject obvious garbage.
 */

import { Vibrant } from "node-vibrant/node";
import type { Page } from "playwright";
import type { TypeRampEntry } from "@inspo/shared";
import type { ExtractedMetadata } from "./types";
import { extractComponents } from "./components.js";
import { cleanFontList, cleanRampFamily } from "./font-names.js";

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

  // In-page font + meta extraction. Implementation is fully inlined:
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

  // Design-system extraction. Same in-page-as-string pattern as above:
  // tsx wraps named inner functions with __name which the browser
  // context doesn't have. Returns a freeform object; we sanity-check on
  // the host side.
  const ds = (await page.evaluate(DESIGN_SYSTEM_SCRIPT)) as RawDesignSystem;

  const typeRamp = sanitiseTypeRamp(ds.typeRamp ?? []);
  const spacingScale = sanitiseScale(ds.spacingScale ?? [], 4, 256);
  const radiusScale = sanitiseScale(ds.radiusScale ?? [], 0, 64);
  const containerWidth =
    typeof ds.containerWidth === "number" &&
    ds.containerWidth >= 320 &&
    ds.containerWidth <= 2400
      ? Math.round(ds.containerWidth)
      : null;
  const cssVariables = ds.cssVariables ?? {};

  // Component-region scan (page-absolute coords). Best-effort: if a
  // detector throws we still ship the rest of the metadata.
  let components: ExtractedMetadata["components"] = [];
  try {
    components = await extractComponents(page);
  } catch (err) {
    console.warn(
      `  ⚠ component scan failed: ${err instanceof Error ? err.message : err}`,
    );
  }

  return {
    palette,
    fonts: cleanFontList(inPage.fonts),
    tech,
    mode,
    pageTitle: inPage.title,
    pageDescription: inPage.ogDescription,
    designSystem: {
      typeRamp,
      spacingScale,
      radiusScale,
      containerWidth,
      cssVariables,
    },
    components,
  };
}

/* ───────────── design-system extractor ───────────── */

type RawDesignSystem = {
  typeRamp: Array<Partial<TypeRampEntry>>;
  spacingScale: number[];
  radiusScale: number[];
  containerWidth: number | null;
  cssVariables: Record<string, string>;
};

const DESIGN_SYSTEM_SCRIPT = `(() => {
  const norm = (s) => (s || '').toString();

  const px = (v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };

  const familyOf = (cs) => {
    const ff = norm(cs.fontFamily).split(',')[0].replace(/['"]/g, '').trim();
    return ff || 'inherit';
  };

  const lhOf = (cs, sizePx) => {
    const v = norm(cs.lineHeight);
    if (!v || v === 'normal') return 1.4;
    if (v.endsWith('px')) return sizePx > 0 ? Math.round((px(v) / sizePx) * 100) / 100 : 1.4;
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 1.4;
  };

  const rampFor = (sel, role) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const cs = window.getComputedStyle(el);
    const size = px(cs.fontSize);
    if (size < 8 || size > 200) return null;
    return {
      role,
      family: familyOf(cs),
      sizePx: Math.round(size),
      weight: parseInt(cs.fontWeight, 10) || 400,
      lineHeight: lhOf(cs, size),
      letterSpacing: cs.letterSpacing === 'normal' ? '0' : norm(cs.letterSpacing),
    };
  };

  const ramp = [
    rampFor('h1', 'h1'),
    rampFor('h2', 'h2'),
    rampFor('h3', 'h3'),
    rampFor('p, article p, main p, body', 'body'),
    rampFor('small, caption, .text-sm, .caption', 'caption'),
    rampFor('button, [role="button"], a.button, .btn', 'button'),
  ].filter(Boolean);

  // Spacing: pull padding-y / margin-y / gap from a sample of layout
  // elements. Keep only sensible values (4-256px).
  const spaceSample = new Set();
  const spaceSelectors = ['main', 'section', 'header', 'footer', 'article', 'nav', '[class*="container"]', '[class*="section"]'];
  spaceSelectors.forEach((s) => {
    document.querySelectorAll(s).forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      const cs = window.getComputedStyle(el);
      [cs.paddingTop, cs.paddingBottom, cs.marginTop, cs.marginBottom, cs.gap, cs.rowGap, cs.columnGap].forEach((v) => {
        const n = px(v);
        if (n >= 4 && n <= 256) spaceSample.add(Math.round(n));
      });
    });
  });

  // Radius: pull border-radius from buttons, cards, inputs.
  const radSample = new Set();
  document.querySelectorAll('button, [role="button"], input, .card, [class*="card"], [class*="button"], [class*="rounded"]').forEach((el) => {
    if (!(el instanceof HTMLElement)) return;
    const cs = window.getComputedStyle(el);
    const n = px(cs.borderTopLeftRadius);
    if (n >= 0 && n <= 64) radSample.add(Math.round(n));
  });

  // Container width: read max-width of <main> / .container / body content.
  let containerWidth = null;
  const containerCandidates = [document.querySelector('main'), document.querySelector('[class*="container"]'), document.querySelector('article')].filter(Boolean);
  for (const el of containerCandidates) {
    if (!(el instanceof HTMLElement)) continue;
    const cs = window.getComputedStyle(el);
    const mw = px(cs.maxWidth);
    if (mw >= 320 && mw <= 2400) { containerWidth = Math.round(mw); break; }
    if (el.offsetWidth >= 320 && el.offsetWidth <= 2400) { containerWidth = Math.round(el.offsetWidth); break; }
  }

  // CSS variables: every --* declared on :root / documentElement.
  const cssVariables = {};
  const rootCs = window.getComputedStyle(document.documentElement);
  for (let i = 0; i < rootCs.length; i++) {
    const name = rootCs.item(i);
    if (name && name.startsWith('--')) {
      const val = rootCs.getPropertyValue(name).trim();
      if (val && val.length < 200) cssVariables[name] = val;
    }
  }

  return {
    typeRamp: ramp,
    spacingScale: Array.from(spaceSample).sort((a, b) => a - b),
    radiusScale: Array.from(radSample).sort((a, b) => a - b),
    containerWidth,
    cssVariables,
  };
})()`;

function sanitiseTypeRamp(raw: Array<Partial<TypeRampEntry>>): TypeRampEntry[] {
  return raw
    .filter(
      (r): r is TypeRampEntry =>
        typeof r === "object" &&
        r !== null &&
        typeof r.role === "string" &&
        typeof r.sizePx === "number" &&
        r.sizePx >= 8 &&
        r.sizePx <= 200,
    )
    .map((r) => ({
      role: r.role,
      family: cleanRampFamily(r.family),
      sizePx: Math.round(r.sizePx),
      weight: Math.max(100, Math.min(900, r.weight || 400)),
      lineHeight: r.lineHeight,
      letterSpacing: r.letterSpacing || "0",
    }));
}

function sanitiseScale(raw: number[], min: number, max: number): number[] {
  if (!Array.isArray(raw)) return [];
  return Array.from(
    new Set(
      raw
        .filter((n) => typeof n === "number" && n >= min && n <= max)
        .map((n) => Math.round(n)),
    ),
  ).sort((a, b) => a - b);
}

function isLightColor(rgb: string): boolean {
  const m = rgb.match(/\d+/g);
  if (!m || m.length < 3) return true;
  const [r, g, b] = m.map(Number);
  // Per-channel relative luminance approximation
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.55;
}
