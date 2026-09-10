/**
 * Vision QA for fresh captures, before they are merged. For every
 * capture it asks one question of three images: does anything visible
 * make this unfit for the archive? A cookie banner, a popup or modal, a
 * sign-in wall, an error or bot-check page, or a broken render.
 *
 *   pnpm exec tsx src/qa-captures.ts <slugs-file> [--concurrency=6] [--out=<json>]
 *
 * The three images: the desktop view above the fold, the phone view
 * above the fold, and the whole desktop page scaled to one strip (so a
 * section that failed to render shows as a blank band). Model:
 * gemma-4-31B-it with reasoning off. It is a first filter, not the last
 * word: flagged captures still get looked at by a person.
 */

import "./env.js";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import sharp from "sharp";
import Together from "together-ai";

const CAPTURES_DIR = resolve(
  process.env.INSPO_CAPTURES_DIR ?? join(process.cwd(), "captures"),
);
const MODEL = process.env.INSPO_QA_MODEL ?? "google/gemma-4-31B-it";
const ISSUES = ["cookie-banner", "popup", "sign-in-wall", "error-page", "blank-or-broken"] as const;
type Issue = (typeof ISSUES)[number];

const SYSTEM = [
  "You check screenshots of real websites before they go into a design archive.",
  "You get three images of ONE page: 1) the desktop view above the fold, 2) the phone view above the fold, 3) the whole desktop page scaled down into one tall strip.",
  "For each image, list only the problems you can clearly SEE, using these labels:",
  "- cookie-banner: any cookie, consent or privacy notice, whether a bar, a corner card or a dialog.",
  "- popup: anything floating over the page content: a newsletter or signup modal, a promo, discount or app-download popup, a region or language picker, an age gate, an open chat window, or a dimmed backdrop.",
  "- sign-in-wall: the main content is a login, sign-up, password or account form instead of the page itself.",
  "- error-page: a 404, access denied, bot check, captcha, 'enable JavaScript' message, or a blank loading screen.",
  "- blank-or-broken: large empty areas where content clearly failed to render, missing images or sections, overlapping or broken layout.",
  "NOT problems: a navigation bar with 'Log in' or 'Sign up' buttons; a small closed chat bubble; deliberately minimal, sparse or dark designs; big hero images; bold full-bleed sections.",
  "Return an empty list for an image with no problems.",
].join("\n");

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    desktop: { type: "array", items: { type: "string", enum: [...ISSUES] } },
    mobile: { type: "array", items: { type: "string", enum: [...ISSUES] } },
    full: { type: "array", items: { type: "string", enum: [...ISSUES] } },
    notes: { type: "string" },
  },
  required: ["desktop", "mobile", "full", "notes"],
} as const;

type Verdict = {
  slug: string;
  desktop: Issue[];
  mobile: Issue[];
  full: Issue[];
  notes: string;
  error?: string;
};

function newest(slug: string, prefix: string): string | null {
  const dir = join(CAPTURES_DIR, slug);
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir).filter((f) => f.startsWith(prefix) && f.endsWith(".png"));
  if (files.length === 0) return null;
  files.sort((a, b) => statSync(join(dir, b)).mtimeMs - statSync(join(dir, a)).mtimeMs);
  return join(dir, files[0]!);
}

async function asDataUrl(path: string | null, width: number, maxH?: number): Promise<string | null> {
  if (!path) return null;
  let img = sharp(path, { limitInputPixels: false }).resize({ width });
  if (maxH) {
    const buf = await img.png().toBuffer();
    const h = Math.min((await sharp(buf).metadata()).height ?? maxH, maxH);
    img = sharp(buf).extract({ left: 0, top: 0, width, height: h });
  }
  const webp = await img.webp({ quality: 70 }).toBuffer();
  return `data:image/webp;base64,${webp.toString("base64")}`;
}

const keepIssues = (v: unknown): Issue[] =>
  Array.isArray(v) ? (v.filter((x) => (ISSUES as readonly string[]).includes(x)) as Issue[]) : [];

async function check(client: Together, slug: string): Promise<Verdict> {
  const desktop = await asDataUrl(newest(slug, "desktop-hero-"), 960);
  const mobile = await asDataUrl(newest(slug, "mobile-hero-"), 375);
  const full = await asDataUrl(newest(slug, "desktop-full-"), 320, 2600);
  if (!desktop || !mobile || !full) {
    return { slug, desktop: [], mobile: [], full: [], notes: "", error: "missing capture files" };
  }
  let url = "";
  try {
    url = (JSON.parse(readFileSync(join(CAPTURES_DIR, slug, "meta.json"), "utf8")) as { sourceUrl: string }).sourceUrl;
  } catch {
    /* no sidecar yet */
  }
  const completion = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 400,
    temperature: 0,
    // @ts-expect-error Together's reasoning switch is not in the SDK's types yet.
    reasoning: { enabled: false },
    response_format: { type: "json_object", schema: SCHEMA as unknown as Record<string, unknown> },
    messages: [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: [
          { type: "text", text: "Image 1: desktop, above the fold." },
          { type: "image_url", image_url: { url: desktop } },
          { type: "text", text: "Image 2: phone, above the fold." },
          { type: "image_url", image_url: { url: mobile } },
          { type: "text", text: "Image 3: the whole desktop page, scaled down." },
          { type: "image_url", image_url: { url: full } },
          { type: "text", text: `Page: ${url || slug}\nList the visible problems per image.` },
        ],
      },
    ],
  });
  const text = (completion.choices?.[0]?.message?.content ?? "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "");
  const p = JSON.parse(text) as Record<string, unknown>;
  return {
    slug,
    desktop: keepIssues(p.desktop),
    mobile: keepIssues(p.mobile),
    full: keepIssues(p.full),
    notes: typeof p.notes === "string" ? p.notes.slice(0, 300) : "",
  };
}

async function main() {
  const argv = process.argv.slice(2);
  const file = argv.find((a) => !a.startsWith("--"));
  if (!file) {
    console.error("usage: qa-captures.ts <slugs-file> [--concurrency=6] [--out=<json>]");
    process.exit(1);
  }
  const concurrency = Number(argv.find((a) => a.startsWith("--concurrency="))?.split("=")[1] ?? 6);
  const out = resolve(
    argv.find((a) => a.startsWith("--out="))?.split("=")[1] ??
      join(CAPTURES_DIR, "_reports", `qa-${new Date().toISOString().replace(/[:.]/g, "-")}.json`),
  );
  const slugs = readFileSync(file, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  const client = new Together({
    apiKey: process.env.TOGETHER_API_KEY,
    baseURL: process.env.TOGETHER_BASE_URL ?? "https://api.together.ai/v1",
    timeout: 120_000,
  });
  console.log(`\n  qa-captures · ${slugs.length} captures · ${MODEL} · concurrency=${concurrency}\n`);

  const verdicts: Verdict[] = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (i < slugs.length) {
        const slug = slugs[i++]!;
        let v: Verdict;
        try {
          v = await check(client, slug);
        } catch {
          try {
            v = await check(client, slug); // one retry: transient 5xx / parse slips
          } catch (err) {
            v = { slug, desktop: [], mobile: [], full: [], notes: "", error: err instanceof Error ? err.message.slice(0, 160) : "failed" };
          }
        }
        verdicts.push(v);
        const issues = [...v.desktop.map((x) => `desktop:${x}`), ...v.mobile.map((x) => `mobile:${x}`), ...v.full.map((x) => `full:${x}`)];
        if (issues.length || v.error) {
          console.log(`  ⚠ ${slug.padEnd(40)} ${v.error ? `ERROR ${v.error}` : issues.join(" ")}  ${v.notes.slice(0, 90)}`);
        }
      }
    }),
  );

  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(verdicts, null, 2));
  const flagged = verdicts.filter((v) => v.error || v.desktop.length || v.mobile.length || v.full.length);
  console.log(`\n  ${verdicts.length} checked · ${flagged.length} flagged · report → ${out}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
