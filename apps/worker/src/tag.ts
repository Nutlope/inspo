/**
 * Vision-LLM tagging via Together AI.
 *
 * Model: google/gemma-4-31B-it, the serverless vision model on Together
 * as of 2026-09 (gemma-3n-E4B-it, the old default, is no longer served;
 * the Qwen-VL and Llama-4 SKUs need dedicated endpoints). Gemma 4
 * reasons before answering unless told not to, which costs ~80s a call,
 * so every request sends `reasoning: { enabled: false }` (~10s, same tags).
 *
 * Output is constrained via `response_format: { type: "json_object",
 * schema }` AND the textual schema in the prompt (Together's
 * belt-and-braces pattern). Every value is validated against the
 * @inspo/taxonomy allow-lists before we trust it.
 */

import Together from "together-ai";
import {
  STYLES,
  INDUSTRIES,
  COMPONENTS,
  VIBES,
  COLOR_WORDS,
  MACROSTRUCTURES,
  isStyle,
  isIndustry,
  isComponent,
  isVibe,
  isMacrostructure,
} from "@inspo/taxonomy";
import type { ColorWord } from "@inspo/taxonomy";
import type { AITags } from "./types";

const isColorWord = (v: string): v is ColorWord =>
  (COLOR_WORDS as readonly string[]).includes(v);

const MODEL = process.env.INSPO_VISION_MODEL ?? "google/gemma-4-31B-it";

/** Em and en dashes never ship in archive copy; rewrite with a hyphen.
 *  Built from char codes so this file itself contains neither. */
const DASHES = String.fromCharCode(0x2013, 0x2014);
const DASH_BETWEEN_DIGITS = new RegExp(`(\\d)\\s*[${DASHES}]\\s*(\\d)`, "g");
const DASH_ANYWHERE = new RegExp(`\\s*[${DASHES}]\\s*`, "g");
const undash = (s: string) =>
  s.replace(DASH_BETWEEN_DIGITS, "$1-$2").replace(DASH_ANYWHERE, " - ");

/**
 * One-line definitions for each named macrostructure in the
 * taxonomy. Surfaced in the prompt so the vision
 * model picks based on the actual page shape rather than reaching for
 * whichever enum label happened to be listed first.
 *
 * Concrete observation that motivates this: on the first 41-site
 * eval run, ~63% of pages were tagged "bento-grid" because Gemma
 * defaulted to the first enum value. With these definitions in the
 * prompt + the per-call shuffle below, distribution flattens.
 */
const MACROSTRUCTURE_DEFINITIONS: Record<(typeof MACROSTRUCTURES)[number], string> = {
  "bento-grid": "Modular blocks of VARYING sizes in an irregular grid (≥4 tiles). Visual rhythm from size variation, not card uniformity. If the page is mostly one column or has a single dominant element, it is NOT bento.",
  "long-document": "Reads like a memo, letter, or journal: continuous prose with inline section heads. No marketing structure.",
  "marquee-hero": "One bold statement or visual fills the viewport above the fold. Below the fold the page becomes something else (list, grid, prose).",
  "stat-led": "The hero is a giant NUMBER (metric, count, percentage). Everything below supports or qualifies it.",
  "conversational-faq": "Bold questions, brief answers. Reads like an honest interview. Often accordions.",
  "manifesto": "Polemical large type. Declaration energy. Tells the reader what to BELIEVE before what to buy.",
  "photographic": "A single huge IMAGE dominates each fold. Text is small annotation. Says LOOK before it says read.",
  "specimen": "Numbered left-margin labels, huge serif display, asymmetric column spans, hairline rules, typographic-only CTA. Editorial / type-foundry energy.",
  "catalogue": "Uniform grid of variations of the same thing: typefaces, SKUs, swatches. A visual index of inventory.",
  "letter": "First-person, written, intimate. Opens with a greeting (\"Dear friend,\"). No buttons in fold.",
  "index-first": "The page IS a list of links. No hero image, no narrative flow. Pure navigation as design.",
  "narrative-workflow": "Numbered stages (1.0 → 2.0 → 3.0) tell the story of how the user uses the product over time.",
  "split-studio": "Diptych. Every major block divides the screen: text one side, proof the other. Pairing alternates direction.",
  "feature-stack": "Sticky left pane (label) + scroll-synced right pane (screenshots cycling through related details).",
  "type-specimen": "The typeface IS the design. Foundry homepage or design-system page where a custom typeface is the brand's proof.",
  "portfolio-grid": "Filterable cards of projects. Studio or designer homepage where the WORK is the product.",
  "map-diagram": "A single large spatial diagram organises the page: flowchart, floor plan, system map. Information is spatial, not linear.",
  "ecosystem-index": "Multiple discovery surfaces: featured / latest / by category / by people. Browsing IS the value.",
  "component-playground": "Interactive code-and-preview blocks are the primary content. Each previews a thing and shows how to copy-paste it.",
};

/** Shuffle helper - Fisher-Yates. Used to pass the macrostructure
 *  enum to the model in a fresh order each call so no single label
 *  sits at position 0 every time (small VLMs anchor on the first enum
 *  option). */
function shuffled<T>(arr: readonly T[]): T[] {
  const a = arr.slice() as T[];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Build the tag schema with the macrostructure enum shuffled per
 *  call. All other enums stay in their declared order (they're
 *  multi-select, less sensitive to ordering).
 *
 *  The theme tag used to live here too. It is gone: the three
 *  diversification axes replaced it, and they are *measured* from the
 *  palette, the fonts and the capture rather than guessed by a model.
 *  That removed a stale enum, a source of drift, and a chunk of every
 *  tagging call's output budget. See `deriveAxes` in @inspo/shared and
 *  `backfill-axes.ts`. */
function buildTagSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      style: { type: "array", items: { type: "string", enum: [...STYLES] } },
      industry: { type: "array", items: { type: "string", enum: [...INDUSTRIES] } },
      components: { type: "array", items: { type: "string", enum: [...COMPONENTS] } },
      vibe: { type: "array", items: { type: "string", enum: [...VIBES] } },
      colorWords: { type: "array", items: { type: "string", enum: [...COLOR_WORDS] } },
      macrostructure: { type: "string", enum: shuffled(MACROSTRUCTURES) },
      description: { type: "string" },
      altText: { type: "string" },
      searchKeywords: { type: "array", items: { type: "string" } },
    },
    required: [
      "style",
      "industry",
      "components",
      "vibe",
      "colorWords",
      "description",
      "altText",
      "searchKeywords",
    ],
  } as const;
}

const MACRO_RUBRIC = MACROSTRUCTURES.map(
  (m) => `  - ${m}: ${MACROSTRUCTURE_DEFINITIONS[m]}`,
).join("\n");

const SYSTEM = [
  "You are a senior design critic tagging screenshots of real websites for a curated archive.",
  "Output a single JSON object matching the schema. No prose, no markdown fences.",
  "Every enum tag MUST come from the supplied enums; never invent values.",
  "",
  "MACROSTRUCTURE: pick exactly ONE that genuinely matches the page shape. Use the rubric below.",
  "Do NOT default to bento-grid: only pick bento-grid if there are 4+ small modular tiles in an irregular grid. A page with a single hero image, a single long column, a numbered list, or a code-window-as-hero is NOT bento.",
  "Read every definition before deciding. The page shape, not the industry, drives the macrostructure choice.",
  "",
  "Macrostructure rubric:",
  MACRO_RUBRIC,
  "",
  "description: 1 or 2 sentences in a designer's voice. Talk about the actual visual choices on this page (typography, colour, density, mood). No marketing fluff. Never describe yourself or the task.",
  "altText: ≤140 chars, screen-reader accurate, focuses on the visible content.",
  "searchKeywords: 5 to 10 short freeform keywords a designer would actually search for, e.g. 'editorial agency hero', 'dark saas bento'. Lowercase.",
  "Never use em dashes or en dashes in any text field; use commas, colons or hyphens.",
].join("\n");

export async function tagWithLLM(args: {
  heroPng: Buffer;
  pageTitle: string;
  pageDescription: string;
  sourceUrl: string;
}): Promise<AITags> {
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) throw new Error("TOGETHER_API_KEY is not set");

  const client = new Together({
    apiKey,
    baseURL: process.env.TOGETHER_BASE_URL ?? "https://api.together.ai/v1",
    timeout: 90_000,
  });
  const dataUrl = `data:image/png;base64,${args.heroPng.toString("base64")}`;

  // Build a fresh schema per call so the macrostructure enum is
  // shuffled, which defends against first-position bias.
  const tagSchema = buildTagSchema();
  const schemaText = JSON.stringify(tagSchema, null, 2);

  const userText = [
    `Page: ${args.sourceUrl}`,
    `Title: ${args.pageTitle}`,
    `Meta description: ${args.pageDescription}`,
    "",
    "Tag this screenshot. Return ONE JSON object matching this schema exactly:",
    schemaText,
  ].join("\n");

  // Serverless capacity comes and goes: a 503 or 429 mid-batch is routine
  // and usually clears within seconds, so back off and retry before a
  // capture is left untagged.
  let text = "";
  for (let attempt = 1; ; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model: MODEL,
        max_tokens: 1024,
        temperature: 0.2,
        // @ts-expect-error Together's reasoning switch is not in the SDK's types yet.
        reasoning: { enabled: false },
        response_format: {
          type: "json_object",
          schema: tagSchema as unknown as Record<string, unknown>,
        },
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: dataUrl } },
              { type: "text", text: userText },
            ],
          },
        ],
      });
      text = completion.choices?.[0]?.message?.content ?? "";
      break;
    } catch (err) {
      const status = (err as { status?: number }).status ?? 0;
      const retryable = status === 0 || status === 408 || status === 429 || status >= 500;
      if (!retryable || attempt >= 5) throw err;
      await new Promise((r) => setTimeout(r, 1500 * 2 ** (attempt - 1)));
    }
  }
  if (!text) throw new Error("Together vision: empty response");

  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(text);
  } catch {
    // Some VLMs still wrap output in markdown fences; strip and retry.
    const stripped = text
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```$/i, "");
    raw = JSON.parse(stripped) as Record<string, unknown>;
  }

  // Defence in depth: even with response_format, validate every value
  // against the allow-lists. Drift creeps in fast.
  return {
    style: Array.isArray(raw.style) ? (raw.style as string[]).filter(isStyle) : [],
    industry: Array.isArray(raw.industry) ? (raw.industry as string[]).filter(isIndustry) : [],
    components: Array.isArray(raw.components)
      ? (raw.components as string[]).filter(isComponent)
      : [],
    vibe: Array.isArray(raw.vibe) ? (raw.vibe as string[]).filter(isVibe) : [],
    colorWords: Array.isArray(raw.colorWords)
      ? (raw.colorWords as string[]).filter(isColorWord)
      : [],
    macrostructure:
      typeof raw.macrostructure === "string" && isMacrostructure(raw.macrostructure)
        ? raw.macrostructure
        : undefined,
    description: typeof raw.description === "string" ? undash(raw.description) : "",
    altText: typeof raw.altText === "string" ? undash(raw.altText).slice(0, 140) : "",
    searchKeywords: Array.isArray(raw.searchKeywords)
      ? (raw.searchKeywords as unknown[])
          .filter((s): s is string => typeof s === "string")
          .map(undash)
      : [],
  };
}
