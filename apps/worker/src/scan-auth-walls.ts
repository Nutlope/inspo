/**
 * Look at every capture and decide whether it is really a sign-in wall.
 *
 * A page filed as "pricing" whose screenshot is a login box is worthless
 * twice over: it shows none of the page it claims to be, and one centred
 * login card looks like every other centred login card.
 *
 * Text scoring over the autopsy field was tried first and is not good
 * enough for this. It cannot separate "has a Sign up button in the nav"
 * from "IS a sign-up page", so at a threshold loose enough to catch 70%
 * of the captures already filed as `auth` it also flagged 184 perfectly
 * good landing pages. The question is visual, so it gets asked visually.
 *
 *   pnpm exec tsx src/scan-auth-walls.ts            # all captures
 *   pnpm exec tsx src/scan-auth-walls.ts --limit 40 # pilot
 *   pnpm exec tsx src/scan-auth-walls.ts --resume   # skip done rows
 *
 * Writes auth-scan.json next to this script incrementally, so a long
 * run can be interrupted and resumed without losing work.
 */

import "./env.js";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import Together from "together-ai";

type Row = {
  slug: string;
  siteSlug: string;
  title: string;
  sourceUrl: string;
  pageType: string;
  thumbUrl: string;
  imageUrl: string;
  heroVariants?: { webp?: { w: number; url: string }[]; avif?: { w: number; url: string }[] };
  qualityScore?: number;
  qualityFlags?: string[];
};

type Verdict = {
  slug: string;
  siteSlug: string;
  title: string;
  sourceUrl: string;
  pageType: string;
  /** locked = the page is gated behind auth; partial = real content is
   *  present but a login panel dominates; open = a normal page. */
  verdict: "locked" | "partial" | "open" | "error";
  confidence: number;
  what: string;
  thumb: string;
  hero: string;
  qualityScore?: number;
};

const SEED = resolve(import.meta.dirname, "../../../packages/db/src/static-screens.json");
const OUT = resolve(import.meta.dirname, "auth-scan.json");
const MODEL = process.env.INSPO_VISION_MODEL ?? "google/gemma-4-31B-it";
const CONCURRENCY = 8;

const argv = process.argv.slice(2);
const limitArg = argv.indexOf("--limit");
const LIMIT = limitArg >= 0 ? Number(argv[limitArg + 1]) : Infinity;
const RESUME = argv.includes("--resume");

const rows = JSON.parse(readFileSync(SEED, "utf8")) as Row[];
const done = new Map<string, Verdict>();
if (RESUME && existsSync(OUT)) {
  for (const v of JSON.parse(readFileSync(OUT, "utf8")).verdicts as Verdict[]) {
    if (v.verdict !== "error") done.set(v.slug, v);
  }
  console.log(`resuming - ${done.size} already scanned`);
}

const queue = rows.filter((r) => !done.has(r.slug)).slice(0, LIMIT);
console.log(`scanning ${queue.length} captures with ${MODEL}\n`);

const client = new Together({ apiKey: process.env.TOGETHER_API_KEY });

const SYSTEM = [
  "You look at one screenshot of a web page and decide whether a visitor would actually see the page's content, or whether it is gated.",
  "",
  'Answer "locked" when the dominant thing on screen is a sign-in / sign-up / create-account form, a password prompt, an SSO chooser, a paywall, or an age gate - i.e. the real page is NOT visible.',
  'Answer "partial" when real page content is visible but a login panel, modal or overlay covers a large part of it.',
  'Answer "open" for any normal page. A marketing page with a "Sign up" or "Log in" BUTTON in its navigation is OPEN, not locked - a button is not a wall. A pricing table, feature grid, blog post, docs page or landing hero is OPEN.',
  "",
  "Return ONE JSON object, no prose:",
  '{"verdict":"locked|partial|open","confidence":0-100,"what":"<=12 words describing what is actually on screen"}',
].join("\n");

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    verdict: { type: "string", enum: ["locked", "partial", "open"] },
    confidence: { type: "integer" },
    what: { type: "string" },
  },
  required: ["verdict", "confidence", "what"],
} as const;

/** Smallest encoded hero if present - the fold is where a wall shows,
 *  and a 384-wide WebP is plenty to see a centred login card. */
function imageFor(r: Row): string {
  const webp = r.heroVariants?.webp?.slice().sort((a, b) => a.w - b.w)[0]?.url;
  const avif = r.heroVariants?.avif?.slice().sort((a, b) => a.w - b.w)[0]?.url;
  return webp ?? avif ?? r.imageUrl;
}

async function scanOne(r: Row): Promise<Verdict> {
  const base: Omit<Verdict, "verdict" | "confidence" | "what"> = {
    slug: r.slug,
    siteSlug: r.siteSlug,
    title: r.title,
    sourceUrl: r.sourceUrl,
    pageType: r.pageType,
    thumb: r.thumbUrl,
    hero: r.imageUrl,
    qualityScore: r.qualityScore,
  };
  try {
    const c = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 160,
      // @ts-expect-error Together's reasoning switch is not in the SDK's types yet.
      reasoning: { enabled: false },
      temperature: 0,
      response_format: {
        type: "json_object",
        schema: SCHEMA as unknown as Record<string, unknown>,
      },
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: imageFor(r) } },
            {
              type: "text",
              text: `URL: ${r.sourceUrl}\nFiled as page type: ${r.pageType}\n\nIs this page gated?`,
            },
          ],
        },
      ],
    });
    const txt = (c.choices?.[0]?.message?.content ?? "")
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```$/i, "");
    const p = JSON.parse(txt) as { verdict: string; confidence: number; what: string };
    const v = ["locked", "partial", "open"].includes(p.verdict)
      ? (p.verdict as Verdict["verdict"])
      : "open";
    return {
      ...base,
      verdict: v,
      confidence: Math.max(0, Math.min(100, Number(p.confidence) || 0)),
      what: String(p.what ?? "").slice(0, 120),
    };
  } catch (err) {
    return {
      ...base,
      verdict: "error",
      confidence: 0,
      what: err instanceof Error ? err.message.slice(0, 100) : "failed",
    };
  }
}

const verdicts: Verdict[] = [...done.values()];
let i = 0;
let processed = 0;

function save() {
  writeFileSync(
    OUT,
    JSON.stringify({ model: MODEL, total: rows.length, verdicts }, null, 2),
  );
}

async function worker() {
  while (i < queue.length) {
    const r = queue[i++]!;
    const v = await scanOne(r);
    verdicts.push(v);
    processed++;
    if (v.verdict === "locked" || v.verdict === "partial") {
      console.log(
        `  ${v.verdict.padEnd(7)} ${String(v.confidence).padStart(3)}  ${v.pageType.padEnd(9)} ${v.slug.padEnd(40)} ${v.what}`,
      );
    }
    if (processed % 50 === 0) {
      save();
      console.log(`  … ${processed}/${queue.length}`);
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));
save();

const tally: Record<string, number> = {};
for (const v of verdicts) tally[v.verdict] = (tally[v.verdict] ?? 0) + 1;
console.log(`\ndone - ${verdicts.length} verdicts`);
console.log(" ", JSON.stringify(tally));
console.log(`\nwrote ${OUT}`);
