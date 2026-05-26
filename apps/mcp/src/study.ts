/**
 * `study(url)` — fetch any live URL and return what a designer would
 * want to know about its design system: real fonts, real palette,
 * real CSS variables, detected tech, title + meta.
 *
 * Why this exists: until now the MCP could only return facts about
 * sites in the curated archive. `study(url)` lets agents look at any
 * brand — competitors, references the user pastes in, partners not
 * yet captured. Direct match for Hallmark's `study` verb.
 *
 * Stays light: pure `fetch` + regex extraction. No Playwright (the
 * MCP also ships on Cloudflare Workers, where native deps don't
 * work). No cheerio (1 MB of deps for what regex does in 100 LOC).
 *
 * What's extracted:
 *   - Title + meta description
 *   - Detected fonts (Google Fonts links, font-family declarations
 *     inline + in <style>)
 *   - Palette guesses (CSS color tokens in inline styles + <style>
 *     blocks, plus colour-named CSS custom properties)
 *   - CSS custom properties (the real --tokens of the design system)
 *   - Tech fingerprint (Next/React/Vue/Astro/etc., from meta tags,
 *     `__NEXT_DATA__`, script sources)
 *
 * Limitations (be honest):
 *   - Sites that ship CSS in linked stylesheets we don't fetch will
 *     under-report tokens. v2 could follow up to 3 stylesheets.
 *   - JS-rendered SPAs return empty bodies. We detect this and flag
 *     it in the response.
 *   - No screenshot, no macrostructure — those would need Playwright.
 */

const FETCH_TIMEOUT_MS = 10_000;
const MAX_HTML_BYTES = 1_500_000;
const MAX_STYLESHEETS = 3;
const MAX_STYLESHEET_BYTES = 400_000;

export type StudyResult = {
  url: string;
  fetchedAt: string;
  ok: boolean;
  status: number;
  title: string;
  description: string;
  fonts: string[];
  palette: string[];
  cssVariables: Record<string, string>;
  tech: string[];
  signals: {
    htmlBytes: number;
    looksJsSpa: boolean;
    stylesheetsFetched: number;
    stylesheetUrls: string[];
  };
  designMd: string;
  warnings: string[];
};

function uniqueLower(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const k = v.trim().toLowerCase();
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(v.trim());
  }
  return out;
}

/* ──────────────────── HTML extractors ──────────────────── */

function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m?.[1]?.replace(/\s+/g, " ").trim() ?? "";
}

function extractMeta(html: string, name: string): string {
  const re = new RegExp(
    `<meta[^>]+(?:name|property)\\s*=\\s*["']${name}["'][^>]+content\\s*=\\s*["']([^"']+)["']`,
    "i",
  );
  const m = html.match(re);
  return m?.[1]?.trim() ?? "";
}

function extractStylesheetUrls(html: string, base: URL): string[] {
  const out: string[] = [];
  const re = /<link[^>]+rel\s*=\s*["']stylesheet["'][^>]+href\s*=\s*["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      out.push(new URL(m[1]!, base).toString());
    } catch {
      /* skip */
    }
  }
  // Also catch the reverse attribute order (href before rel).
  const re2 = /<link[^>]+href\s*=\s*["']([^"']+)["'][^>]+rel\s*=\s*["']stylesheet["']/gi;
  while ((m = re2.exec(html)) !== null) {
    try {
      out.push(new URL(m[1]!, base).toString());
    } catch {
      /* skip */
    }
  }
  return uniqueLower(out);
}

function extractGoogleFonts(html: string): string[] {
  const out: string[] = [];
  const re = /fonts\.googleapis\.com\/css2?\?([^"'\s>]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const q = m[1]!;
    const fams = q.match(/family=([^&]+)/gi);
    if (!fams) continue;
    for (const f of fams) {
      const name = decodeURIComponent(f.replace(/^family=/i, ""))
        .split(":")[0]!
        .replace(/\+/g, " ")
        .trim();
      if (name) out.push(name);
    }
  }
  return out;
}

function extractFontFamilies(cssOrHtml: string): string[] {
  const out: string[] = [];
  const re = /font-family\s*:\s*([^;}"']+)[;}"']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cssOrHtml)) !== null) {
    // Take only the first family in the stack — it's the actual brand
    // choice; everything after is fallback chain noise.
    const first = m[1]!.split(",")[0]!.replace(/["']/g, "").trim();
    // Skip CSS vars and obvious system stacks.
    if (
      !first ||
      first.startsWith("var(") ||
      /^(inherit|initial|unset|system-ui|sans-serif|serif|monospace|ui-)/i.test(first)
    ) {
      continue;
    }
    out.push(first);
  }
  return uniqueLower(out);
}

function extractCssVariables(cssOrHtml: string): Record<string, string> {
  const out: Record<string, string> = {};
  // Capture --name: value; (value can contain functions, parens).
  const re = /--([a-zA-Z0-9-_]+)\s*:\s*([^;{}]+)[;}]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cssOrHtml)) !== null) {
    const name = m[1]!;
    const value = m[2]!.trim();
    if (value.length > 160) continue;
    if (!out[name]) out[name] = value;
  }
  return out;
}

function extractColorLiterals(cssOrHtml: string): string[] {
  const out: string[] = [];
  // Hex (#rgb / #rgba / #rrggbb / #rrggbbaa)
  const hex = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6,8})\b/g;
  let m: RegExpExecArray | null;
  while ((m = hex.exec(cssOrHtml)) !== null) {
    out.push(m[0]!.toLowerCase());
  }
  // rgb / rgba / hsl / hsla / oklch / lab / lch — keep first 12 of each
  const fn = /(?:rgb|rgba|hsl|hsla|oklch|oklab|lab|lch)\([^)]+\)/gi;
  while ((m = fn.exec(cssOrHtml)) !== null) {
    out.push(m[0]!.replace(/\s+/g, " ").toLowerCase());
  }
  // Frequency-rank: a colour that appears once is decorative noise;
  // colours that appear 3+ times are the actual brand palette.
  const counts = new Map<string, number>();
  for (const c of out) counts.set(c, (counts.get(c) ?? 0) + 1);
  const ranked = [...counts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([c]) => c);
  return ranked.slice(0, 12);
}

function detectTech(html: string, headers: Headers): string[] {
  const tech = new Set<string>();
  const lower = html.toLowerCase();

  // From meta + script signals
  if (/__next_data__|"_next\//.test(lower) || lower.includes('id="__next"')) tech.add("Next.js");
  if (lower.includes("data-reactroot") || lower.includes('id="root"')) tech.add("React");
  if (lower.includes("nuxt-data") || lower.includes('id="__nuxt"')) tech.add("Nuxt");
  if (lower.includes("data-astro-cid") || lower.includes("astro-island")) tech.add("Astro");
  if (lower.includes("data-svelte-h=")) tech.add("Svelte");
  if (lower.includes('id="__vue_app__"')) tech.add("Vue");
  if (lower.includes("solid-")) tech.add("SolidJS");
  if (lower.includes("/_remix/")) tech.add("Remix");
  if (lower.includes("gatsby-")) tech.add("Gatsby");
  if (/cdn\.shopify|x-shopify-stage/i.test(html)) tech.add("Shopify");
  if (lower.includes("webflow.com")) tech.add("Webflow");
  if (lower.includes("framer.com")) tech.add("Framer");
  if (lower.includes("squarespace") || lower.includes("static.squarespace")) tech.add("Squarespace");
  if (lower.includes("wp-content/")) tech.add("WordPress");
  if (lower.includes("notion-frontend") || lower.includes("notion.so")) tech.add("Notion");

  // From <meta name="generator">
  const gen = html.match(/<meta[^>]+name\s*=\s*["']generator["'][^>]+content\s*=\s*["']([^"']+)["']/i);
  if (gen?.[1]) tech.add(gen[1]!.split(" ")[0]!);

  // From headers
  for (const key of ["x-powered-by", "server", "x-vercel-id", "cf-ray"]) {
    const v = headers.get(key);
    if (!v) continue;
    if (key === "x-vercel-id") tech.add("Vercel");
    else if (key === "cf-ray") tech.add("Cloudflare");
    else tech.add(v.split("/")[0]!);
  }

  return [...tech].slice(0, 8);
}

/* ──────────────────── DESIGN.md formatter ──────────────────── */

function renderDesignMd(r: Omit<StudyResult, "designMd">): string {
  const lines: string[] = [];
  lines.push(`# ${r.title || new URL(r.url).host}`);
  lines.push("");
  lines.push(`> ${r.description || "(no meta description)"}`);
  lines.push("");
  lines.push(`Source · \`${r.url}\``);
  lines.push("");

  if (r.tech.length > 0) {
    lines.push("## Tech");
    lines.push(r.tech.map((t) => `- ${t}`).join("\n"));
    lines.push("");
  }

  if (r.fonts.length > 0) {
    lines.push("## Fonts");
    lines.push(r.fonts.map((f) => `- ${f}`).join("\n"));
    lines.push("");
  }

  if (r.palette.length > 0) {
    lines.push("## Palette (frequency-ranked)");
    lines.push(r.palette.map((c) => `- \`${c}\``).join("\n"));
    lines.push("");
  }

  const cssEntries = Object.entries(r.cssVariables);
  if (cssEntries.length > 0) {
    lines.push("## CSS variables");
    lines.push(
      cssEntries
        .slice(0, 40)
        .map(([k, v]) => `- \`--${k}\`: \`${v}\``)
        .join("\n"),
    );
    if (cssEntries.length > 40) {
      lines.push(`_…and ${cssEntries.length - 40} more._`);
    }
    lines.push("");
  }

  if (r.warnings.length > 0) {
    lines.push("## Notes");
    lines.push(r.warnings.map((w) => `- ${w}`).join("\n"));
  }

  return lines.join("\n");
}

/* ──────────────────── main entry ──────────────────── */

async function safeFetch(
  url: string,
  maxBytes: number,
): Promise<{ ok: boolean; status: number; body: string; headers: Headers } | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        // Pretend to be a recent desktop browser so sites don't serve
        // bot-fallback HTML.
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        accept: "text/html,*/*",
      },
      redirect: "follow",
    });
    const text = await res.text();
    return {
      ok: res.ok,
      status: res.status,
      body: text.slice(0, maxBytes),
      headers: res.headers,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export async function study(rawUrl: string): Promise<StudyResult> {
  const fetchedAt = new Date().toISOString();
  const warnings: string[] = [];

  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return {
      url: rawUrl,
      fetchedAt,
      ok: false,
      status: 0,
      title: "",
      description: "",
      fonts: [],
      palette: [],
      cssVariables: {},
      tech: [],
      signals: { htmlBytes: 0, looksJsSpa: false, stylesheetsFetched: 0, stylesheetUrls: [] },
      designMd: "",
      warnings: ["Invalid URL — could not parse."],
    };
  }

  const root = await safeFetch(url.toString(), MAX_HTML_BYTES);
  if (!root) {
    return {
      url: url.toString(),
      fetchedAt,
      ok: false,
      status: 0,
      title: "",
      description: "",
      fonts: [],
      palette: [],
      cssVariables: {},
      tech: [],
      signals: { htmlBytes: 0, looksJsSpa: false, stylesheetsFetched: 0, stylesheetUrls: [] },
      designMd: "",
      warnings: ["Fetch failed — request timed out or hit a network error."],
    };
  }

  const html = root.body;
  const headers = root.headers;
  const htmlBytes = html.length;

  // Heuristic: a JS SPA shell typically has <200 bytes of body text
  // after stripping tags. Flag it but still extract whatever links
  // and meta tags are present.
  const stripped = html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  const looksJsSpa = stripped.length < 200 && htmlBytes < 50_000;
  if (looksJsSpa) {
    warnings.push(
      "Site looks like a JS-rendered SPA — extracted tokens may be partial. Render via the worker capture pipeline for the full picture.",
    );
  }

  const title = extractTitle(html);
  const description =
    extractMeta(html, "description") ||
    extractMeta(html, "og:description") ||
    "";

  // Stylesheet URLs (we'll fetch up to MAX_STYLESHEETS of them).
  const stylesheetUrls = extractStylesheetUrls(html, url).slice(0, MAX_STYLESHEETS);
  const cssBlocks: string[] = [];

  // Inline <style> blocks.
  const styleBlockRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let mm: RegExpExecArray | null;
  while ((mm = styleBlockRe.exec(html)) !== null) {
    cssBlocks.push(mm[1]!);
  }

  // Also: style="..." attributes (less structured but real colours).
  const styleAttrRe = /\sstyle\s*=\s*["']([^"']+)["']/gi;
  while ((mm = styleAttrRe.exec(html)) !== null) {
    cssBlocks.push(mm[1]!);
  }

  // Pull the linked stylesheets in parallel.
  const stylesheetResults = await Promise.all(
    stylesheetUrls.map((s) => safeFetch(s, MAX_STYLESHEET_BYTES)),
  );
  for (const r of stylesheetResults) {
    if (r?.ok && r.body) cssBlocks.push(r.body);
  }
  const stylesheetsFetched = stylesheetResults.filter((r) => r?.ok).length;
  const combinedCss = cssBlocks.join("\n");

  const fonts = uniqueLower([
    ...extractGoogleFonts(html),
    ...extractFontFamilies(html),
    ...extractFontFamilies(combinedCss),
  ]).slice(0, 8);

  const palette = extractColorLiterals(combinedCss + " " + html);

  const cssVariables = {
    ...extractCssVariables(html),
    ...extractCssVariables(combinedCss),
  };

  const tech = detectTech(html, headers);

  const partial: Omit<StudyResult, "designMd"> = {
    url: url.toString(),
    fetchedAt,
    ok: root.ok,
    status: root.status,
    title,
    description,
    fonts,
    palette,
    cssVariables,
    tech,
    signals: { htmlBytes, looksJsSpa, stylesheetsFetched, stylesheetUrls },
    warnings,
  };

  return { ...partial, designMd: renderDesignMd(partial) };
}
