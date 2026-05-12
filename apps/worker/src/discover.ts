/**
 * URL discovery — for a given site root, return up to N additional
 * page URLs that a designer studying this brand should see.
 *
 * Strategy:
 *   1. Read /robots.txt for Sitemap: directives. Fall back to /sitemap.xml.
 *   2. Parse sitemap (or sitemap-index — recurse one level).
 *   3. Filter to same-host URLs, drop junk (PDFs, RSS, /api, deep pagination).
 *   4. Cap candidate list to 50 (shortest-path first, then by sample stride).
 *   5. Ask Gemma 3n to pick up to MAX picks and classify each by page_type.
 *   6. If sitemap missing/empty, try a small set of common paths.
 *
 * Returns an array of { url, pageType } — never includes the root URL
 * itself (caller already has the homepage). May return fewer than MAX
 * if the site genuinely doesn't have that many design-relevant pages.
 */

import Together from "together-ai";

const TIMEOUT_MS = 10_000;
const MAX_CANDIDATES = 50;
const MAX_PICKS_DEFAULT = 7;

const COMMON_PATHS = [
  "/pricing",
  "/features",
  "/product",
  "/about",
  "/about-us",
  "/sign-up",
  "/signup",
  "/login",
  "/sign-in",
  "/signin",
  "/blog",
  "/changelog",
  "/docs",
  "/customers",
  "/use-cases",
] as const;

export type PageType =
  | "landing"
  | "pricing"
  | "features"
  | "auth"
  | "about"
  | "blog"
  | "changelog"
  | "docs"
  | "other";

const PAGE_TYPES: readonly PageType[] = [
  "landing",
  "pricing",
  "features",
  "auth",
  "about",
  "blog",
  "changelog",
  "docs",
  "other",
];

export type DiscoveredUrl = { url: string; pageType: PageType };

export async function discoverUrls(
  rootUrl: string,
  maxPicks: number = MAX_PICKS_DEFAULT,
): Promise<DiscoveredUrl[]> {
  const root = new URL(rootUrl);
  const host = root.host.replace(/^www\./, "");

  console.log(`  ⚲ discovering pages for ${host}`);

  // 1. Try sitemaps via robots.txt + /sitemap.xml.
  let urls = await readSitemaps(root);
  console.log(`    sitemap returned ${urls.length} URLs`);

  // 2. If sitemap is empty, probe common paths.
  if (urls.length === 0) {
    urls = await probeCommonPaths(root);
    console.log(`    common-path probe returned ${urls.length} URLs`);
  }

  // 3. Filter: same host (root or www), no junk, no homepage itself.
  const filtered = filterCandidates(urls, host, root.href);
  if (filtered.length === 0) return [];

  // 4. Cap to MAX_CANDIDATES sampled across the path-depth distribution.
  const candidates = sampleCandidates(filtered, MAX_CANDIDATES);
  console.log(`    ${candidates.length} candidates → Gemma ranker`);

  // 5. Rank + classify via Gemma.
  return rankWithLLM(host, candidates, maxPicks);
}

/* ───────────────────── sitemap reading ───────────────────── */

async function readSitemaps(root: URL): Promise<string[]> {
  const sitemapUrls = new Set<string>();

  // 5a. /robots.txt → Sitemap: directives.
  const robotsTxt = await fetchText(`${root.origin}/robots.txt`);
  if (robotsTxt) {
    for (const line of robotsTxt.split(/\r?\n/)) {
      const m = line.match(/^\s*Sitemap:\s*(\S+)/i);
      if (m) sitemapUrls.add(m[1]!);
    }
  }
  // 5b. Default location.
  sitemapUrls.add(`${root.origin}/sitemap.xml`);
  sitemapUrls.add(`${root.origin}/sitemap_index.xml`);

  const collected: string[] = [];
  const seen = new Set<string>();
  const queue = [...sitemapUrls];
  let recursedOnce = false;

  while (queue.length > 0 && collected.length < 2000) {
    const sm = queue.shift()!;
    if (seen.has(sm)) continue;
    seen.add(sm);

    const xml = await fetchText(sm);
    if (!xml) continue;

    // Two shapes: <sitemapindex>...<sitemap><loc>...</> or
    // <urlset>...<url><loc>...</>. We just grep all <loc>.
    const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map(
      (m) => m[1]!,
    );

    const isIndex = /<sitemapindex/i.test(xml);
    if (isIndex && !recursedOnce) {
      // Each <loc> is itself a sitemap URL — enqueue up to 5 of them.
      for (const child of locs.slice(0, 5)) queue.push(child);
      recursedOnce = true;
    } else {
      // Plain urlset.
      collected.push(...locs);
    }
  }

  return collected;
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const ac = new AbortController();
    const tm = setTimeout(() => ac.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      signal: ac.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        accept: "text/xml,application/xml,text/plain,*/*",
      },
    });
    clearTimeout(tm);
    if (!res.ok) return null;
    const text = await res.text();
    return text.slice(0, 2_000_000); // 2MB cap — big sitemaps exist
  } catch {
    return null;
  }
}

/* ───────────────────── common-path probing ───────────────────── */

async function probeCommonPaths(root: URL): Promise<string[]> {
  // HEAD-request each common path. Keep ones that return 2xx.
  const checks = COMMON_PATHS.map(async (path) => {
    try {
      const url = `${root.origin}${path}`;
      const ac = new AbortController();
      const tm = setTimeout(() => ac.abort(), 5_000);
      const res = await fetch(url, {
        signal: ac.signal,
        method: "HEAD",
        redirect: "follow",
      });
      clearTimeout(tm);
      return res.ok ? url : null;
    } catch {
      return null;
    }
  });
  const settled = await Promise.all(checks);
  return settled.filter((u): u is string => u !== null);
}

/* ───────────────────── candidate filtering ───────────────────── */

const JUNK_PATTERNS = [
  /\.(?:pdf|xml|jpg|jpeg|png|gif|webp|svg|ico|css|js|mp4|webm|zip|rss|gz|tar|bz2)$/i,
  /\.xml\.gz$/i,
  /\/(?:api|cdn-cgi|assets?|static|wp-content|wp-admin|wp-json|feed|rss|atom)\//i,
  /\/page\/\d+/i, // /blog/page/12 style pagination
  /\/p\/\d+/i,
  /\/\d{4}\/\d{2}\/\d{2}\//, // /2024/03/15/ style date archives
  /\/tag\/[^/]+/i,
  /\/category\/[^/]+/i,
  /\/author\/[^/]+/i,
  /\/search\?/i,
  /[?&]utm_/i,
  /#[^/]+$/, // fragment-only
];

function filterCandidates(urls: string[], host: string, rootHref: string): string[] {
  const out = new Set<string>();
  for (const raw of urls) {
    let u: URL;
    try {
      u = new URL(raw);
    } catch {
      continue;
    }
    if (u.host.replace(/^www\./, "") !== host) continue;
    if (u.href === rootHref) continue;
    // Strip trailing slash and query string for dedupe.
    u.hash = "";
    u.search = "";
    const norm = u.href.replace(/\/$/, "");
    if (JUNK_PATTERNS.some((re) => re.test(norm))) continue;
    out.add(norm);
  }
  return [...out];
}

function sampleCandidates(urls: string[], max: number): string[] {
  if (urls.length <= max) return urls;
  // Sort by path depth (shorter = more likely to be a primary page),
  // then take the top half + sample the rest with even stride to keep
  // some diversity (some sites bury features under /product/foo).
  const byDepth = [...urls].sort(
    (a, b) => pathDepth(a) - pathDepth(b) || a.length - b.length,
  );
  const top = byDepth.slice(0, Math.ceil(max / 2));
  const rest = byDepth.slice(Math.ceil(max / 2));
  const stride = Math.max(1, Math.floor(rest.length / (max - top.length)));
  const sampled: string[] = [];
  for (let i = 0; i < rest.length && sampled.length + top.length < max; i += stride) {
    sampled.push(rest[i]!);
  }
  return [...top, ...sampled];
}

function pathDepth(url: string): number {
  try {
    return new URL(url).pathname.split("/").filter(Boolean).length;
  } catch {
    return 99;
  }
}

/* ───────────────────── LLM ranker ───────────────────── */

const RANKER_MODEL =
  process.env.INSPO_RANKER_MODEL ?? "google/gemma-3n-E4B-it";

const rankerSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    picks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          url: { type: "string" },
          pageType: { type: "string", enum: [...PAGE_TYPES] },
        },
        required: ["url", "pageType"],
      },
    },
  },
  required: ["picks"],
} as const;

const RANKER_SYSTEM = [
  "You help curate a design archive.",
  "Given a website's host and a sitemap of candidate URLs, pick the URLs a senior designer would want to study to understand the brand's design language.",
  "Pick up to the requested limit — fewer is fine if the site doesn't have many design-relevant pages.",
  "PREFER: pricing, product/features, sign up, sign in, about, blog index (not posts), changelog index, docs landing.",
  "AVOID: individual blog posts, legal pages (privacy/terms/cookies), help/support articles, individual job listings, press releases, individual customer stories, anything that looks like a repeat of the homepage with different copy.",
  "Each pick must include the URL verbatim from the candidate list and a pageType from: " +
    PAGE_TYPES.join(", ") +
    ".",
  "Return JSON only — no prose, no fences.",
].join(" ");

async function rankWithLLM(
  host: string,
  candidates: string[],
  maxPicks: number,
): Promise<DiscoveredUrl[]> {
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) {
    // No API key — return the first maxPicks candidates with naive typing.
    console.log("    ⨯ no TOGETHER_API_KEY — falling back to naive typing");
    return candidates.slice(0, maxPicks).map((url) => ({
      url,
      pageType: naivePageType(url),
    }));
  }

  const client = new Together({
    apiKey,
    baseURL: process.env.TOGETHER_BASE_URL ?? "https://api.together.ai/v1",
    timeout: 30_000,
  });

  const userText = [
    `Site host: ${host}`,
    `Pick up to ${maxPicks} URLs from this list:`,
    "",
    candidates.map((u) => `- ${u}`).join("\n"),
  ].join("\n");

  let raw: { picks?: { url: string; pageType: string }[] };
  try {
    const completion = await client.chat.completions.create({
      model: RANKER_MODEL,
      max_tokens: 1024,
      temperature: 0.2,
      response_format: {
        type: "json_object",
        schema: rankerSchema as unknown as Record<string, unknown>,
      },
      messages: [
        { role: "system", content: RANKER_SYSTEM },
        { role: "user", content: userText },
      ],
    });
    const text = completion.choices?.[0]?.message?.content ?? "";
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "");
    raw = JSON.parse(cleaned);
  } catch (err) {
    console.warn(
      `    ⚠ ranker LLM failed: ${err instanceof Error ? err.message : String(err)} — falling back`,
    );
    return candidates.slice(0, maxPicks).map((url) => ({
      url,
      pageType: naivePageType(url),
    }));
  }

  const candidateSet = new Set(candidates);
  const out: DiscoveredUrl[] = [];
  for (const p of raw.picks ?? []) {
    if (!candidateSet.has(p.url)) continue; // never trust URLs not in our list
    const pt = isPageType(p.pageType) ? p.pageType : naivePageType(p.url);
    if (out.some((x) => x.url === p.url)) continue;
    out.push({ url: p.url, pageType: pt });
    if (out.length >= maxPicks) break;
  }
  return out;
}

function isPageType(v: string): v is PageType {
  return (PAGE_TYPES as readonly string[]).includes(v);
}

function naivePageType(url: string): PageType {
  const p = new URL(url).pathname.toLowerCase();
  if (/pricing|plans/.test(p)) return "pricing";
  if (/features?|product/.test(p)) return "features";
  if (/sign.?(up|in)|log.?in|auth/.test(p)) return "auth";
  if (/about/.test(p)) return "about";
  if (/changelog|releases/.test(p)) return "changelog";
  if (/^\/blog\/?$|^\/news\/?$/.test(p)) return "blog";
  if (/^\/docs?\/?$/.test(p)) return "docs";
  return "other";
}
