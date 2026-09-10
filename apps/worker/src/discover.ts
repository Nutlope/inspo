/**
 * URL discovery: for a given site root, return up to N additional page
 * URLs that a designer studying this brand should see.
 *
 * Strategy:
 *   1. Collect same-site links from the homepage HTML. On small studio
 *      and portfolio sites these ARE the real pages, and many of those
 *      sites publish no sitemap at all.
 *   2. Read /robots.txt for Sitemap: directives, falling back to
 *      /sitemap.xml, and parse the sitemap (or a sitemap index, one level).
 *   3. Filter to same-host URLs; drop junk (files, feeds, pagination),
 *      sign-in / account / checkout pages, legal pages and locale homes.
 *   4. Cap the candidates at 50: homepage links first, then sitemap URLs
 *      sampled shortest-path first.
 *   5. Ask a Together chat model to pick up to MAX and classify each by
 *      page type.
 *   6. If both sources are empty, probe a small set of common paths.
 *
 * Returns { url, pageType }[], never the root itself. Sign-in, sign-up
 * and account pages are excluded outright: a login card shows nothing of
 * the brand, and 245 of them had to be pruned from the archive in August.
 */

import Together from "together-ai";

const TIMEOUT_MS = 10_000;
const MAX_CANDIDATES = 50;
const MAX_HOMEPAGE_LINKS = 30;
const MAX_PICKS_DEFAULT = 7;

const COMMON_PATHS = [
  "/pricing",
  "/features",
  "/product",
  "/about",
  "/about-us",
  "/work",
  "/projects",
  "/case-studies",
  "/studio",
  "/services",
  "/company",
  "/customers",
  "/blog",
  "/journal",
  "/changelog",
  "/docs",
  "/shop",
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

  // 1-3. Homepage links and sitemap URLs, filtered the same way.
  const homepage = filterCandidates(await readHomepageLinks(root), host, root.href);
  let sitemap = filterCandidates(await readSitemaps(root), host, root.href);
  console.log(`    homepage links ${homepage.length} · sitemap ${sitemap.length}`);

  // 6. Nothing from either source: probe common paths.
  if (homepage.length === 0 && sitemap.length === 0) {
    sitemap = filterCandidates(await probeCommonPaths(root), host, root.href);
    console.log(`    common-path probe returned ${sitemap.length} URLs`);
  }

  // 4. Homepage links lead; the sitemap fills the rest of the budget.
  const lead = homepage.slice(0, MAX_HOMEPAGE_LINKS);
  const leadSet = new Set(lead);
  const rest = sitemap.filter((u) => !leadSet.has(u));
  const candidates = [...lead, ...sampleCandidates(rest, MAX_CANDIDATES - lead.length)];
  if (candidates.length === 0) return [];
  console.log(`    ${candidates.length} candidates → ranker`);

  // 5. Rank + classify.
  return rankWithLLM(host, candidates, maxPicks);
}

/* ───────────────────── homepage links ───────────────────── */

/** Same-site <a href> targets from the homepage's served HTML. */
async function readHomepageLinks(root: URL): Promise<string[]> {
  const html = await fetchText(root.href, "text/html,application/xhtml+xml");
  if (!html) return [];
  const out: string[] = [];
  for (const m of html.matchAll(/<a\b[^>]*?\bhref\s*=\s*["']([^"'#][^"']*)["']/gi)) {
    try {
      out.push(new URL(m[1]!.replace(/&amp;/g, "&"), root).href);
    } catch {
      /* not a URL */
    }
  }
  return out;
}

/* ───────────────────── sitemap reading ───────────────────── */

async function readSitemaps(root: URL): Promise<string[]> {
  const sitemapUrls = new Set<string>();

  // /robots.txt → Sitemap: directives.
  const robotsTxt = await fetchText(`${root.origin}/robots.txt`);
  if (robotsTxt) {
    for (const line of robotsTxt.split(/\r?\n/)) {
      const m = line.match(/^\s*Sitemap:\s*(\S+)/i);
      if (m) sitemapUrls.add(m[1]!);
    }
  }
  // Default locations.
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
      // Each <loc> is itself a sitemap URL: enqueue up to 5 of them.
      for (const child of locs.slice(0, 5)) queue.push(child);
      recursedOnce = true;
    } else {
      // Plain urlset.
      collected.push(...locs);
    }
  }

  return collected;
}

async function fetchText(
  url: string,
  accept = "text/xml,application/xml,text/plain,*/*",
): Promise<string | null> {
  try {
    const ac = new AbortController();
    const tm = setTimeout(() => ac.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      signal: ac.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        accept,
      },
    });
    clearTimeout(tm);
    if (!res.ok) return null;
    const text = await res.text();
    return text.slice(0, 2_000_000); // 2MB cap: big sitemaps exist
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
  /\/sitemap[^/]*\//i, // /sitemap/, /sitemap_v2/: sitemap-style index pages
  /\/sitemap[^/]*$/i, // /sitemap or /sitemap.xml or /sitemap_index
  /\/cgc\//i, // cloud.google.com directory listings
  /\/wayfinding/i, // misc site-index pages
  /\/page\/\d+/i, // /blog/page/12 style pagination
  /\/p\/\d+/i,
  /\/\d{4}\/\d{2}\/\d{2}\//, // /2024/03/15/ style date archives
  /\/tag\/[^/]+/i,
  /\/category\/[^/]+/i,
  /\/author\/[^/]+/i,
  /\/search\?/i,
  /[?&]utm_/i,
  /#[^/]+$/, // fragment-only
  // Sign-in, sign-up and account pages show a login card, not the brand.
  /\/(?:log-?in|sign-?in|sign-?up|signup|register|join|account|accounts|auth|oauth|sso|dashboard|app|console|portal|checkout|cart|basket|password|reset|verify)(?:\/|$)/i,
  // Legal and cookie pages are the same boilerplate everywhere.
  /\/(?:privacy|privacy-policy|terms|terms-of-service|terms-and-conditions|tos|legal|cookies?|cookie-policy|imprint|impressum|gdpr|dpa|accessibility)(?:\/|$)/i,
  // A locale root ("/en", "/de-ch") is the homepage again.
  /^https?:\/\/[^/]+\/[a-z]{2}(?:[-_][a-z]{2})?$/i,
];

function filterCandidates(urls: string[], host: string, rootHref: string): string[] {
  const out = new Set<string>();
  const rootNorm = rootHref.replace(/\/$/, "");
  for (const raw of urls) {
    let u: URL;
    try {
      u = new URL(raw);
    } catch {
      continue;
    }
    if (!/^https?:$/.test(u.protocol)) continue;
    if (u.host.replace(/^www\./, "") !== host) continue;
    // Strip trailing slash and query string for dedupe.
    u.hash = "";
    u.search = "";
    const norm = u.href.replace(/\/$/, "");
    if (norm === rootNorm || norm === u.origin) continue;
    if (JUNK_PATTERNS.some((re) => re.test(norm))) continue;
    out.add(norm);
  }
  return [...out];
}

function sampleCandidates(urls: string[], max: number): string[] {
  if (max <= 0) return [];
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
  process.env.INSPO_RANKER_MODEL ?? "google/gemma-4-31B-it";

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
  "You help curate a design archive of real websites.",
  "Given a website's host and candidate URLs from its homepage links and sitemap, pick the pages a senior designer would want to study to understand the brand's design language beyond the homepage.",
  "Pick up to the requested limit. Fewer is fine when the site has few distinct pages.",
  "PREFER, roughly in this order: pricing; product, features or platform pages; about, company or studio; a work or projects index; one or two standout case studies or project pages; customers; a blog or journal index (not posts); a changelog index; a docs landing; a shop or collection page for stores.",
  "NEVER pick: sign in, log in, sign up, register, account, dashboard, app, checkout or cart pages; legal pages (privacy, terms, cookies, imprint); individual blog posts, press releases or job listings; help articles; near-duplicates of the homepage such as the same page in another language.",
  "Prefer pages likely to look different from each other and from the homepage.",
  "Each pick must include the URL verbatim from the candidate list and a pageType from: " +
    PAGE_TYPES.join(", ") +
    ".",
  "Return JSON only: no prose, no fences.",
].join(" ");

async function rankWithLLM(
  host: string,
  candidates: string[],
  maxPicks: number,
): Promise<DiscoveredUrl[]> {
  const naive = () =>
    candidates
      .map((url) => ({ url, pageType: naivePageType(url) }))
      .filter((d) => d.pageType !== "auth")
      .slice(0, maxPicks);

  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) {
    console.log("    ⨯ no TOGETHER_API_KEY, falling back to naive typing");
    return naive();
  }

  const client = new Together({
    apiKey,
    baseURL: process.env.TOGETHER_BASE_URL ?? "https://api.together.ai/v1",
    timeout: 60_000,
  });

  const userText = [
    `Site host: ${host}`,
    `Pick up to ${maxPicks} URLs from this list:`,
    "",
    candidates.map((u) => `- ${u}`).join("\n"),
  ].join("\n");

  let raw: { picks?: { url: string; pageType: string }[] } = {};
  try {
    // Retry transient capacity errors (503 / 429) with backoff: without
    // it a busy minute on the serverless endpoint silently downgrades
    // every site in the batch to the naive picker.
    for (let attempt = 1; ; attempt++) {
      try {
        const completion = await client.chat.completions.create({
          model: RANKER_MODEL,
          max_tokens: 1024,
          temperature: 0.2,
          // @ts-expect-error Together's reasoning switch is not in the SDK's types yet.
          reasoning: { enabled: false },
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
        break;
      } catch (err) {
        const status = (err as { status?: number }).status ?? 0;
        const retryable = status === 408 || status === 429 || status >= 500;
        if (!retryable || attempt >= 4) throw err;
        await new Promise((r) => setTimeout(r, 2000 * 2 ** (attempt - 1)));
      }
    }
  } catch (err) {
    console.warn(
      `    ⚠ ranker LLM failed: ${err instanceof Error ? err.message : String(err)}, falling back`,
    );
    return naive();
  }

  const candidateSet = new Set(candidates);
  const out: DiscoveredUrl[] = [];
  for (const p of raw.picks ?? []) {
    if (!candidateSet.has(p.url)) continue; // never trust URLs not in our list
    const pt = isPageType(p.pageType) ? p.pageType : naivePageType(p.url);
    if (pt === "auth") continue; // a login card is not a page of the brand
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
