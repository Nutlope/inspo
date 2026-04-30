/**
 * Vision-LLM tagging via Together AI.
 *
 * Model: google/gemma-3n-E4B-it — Google's open-weights vision model,
 * the actual serverless option on Together's catalogue (the bigger
 * Qwen-VL and Llama-Vision SKUs require dedicated endpoints, $$$).
 * Cheap ($0.06 / M tokens), fast, and good enough to read UI.
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
  MACROSTRUCTURES,
  HALLMARK_THEMES,
  isStyle,
  isIndustry,
  isComponent,
  isVibe,
  isMacrostructure,
  isHallmarkTheme,
} from "@inspo/taxonomy";
import type { AITags } from "./types";

const MODEL = process.env.INSPO_VISION_MODEL ?? "google/gemma-3n-E4B-it";

const tagSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    style: { type: "array", items: { type: "string", enum: [...STYLES] } },
    industry: { type: "array", items: { type: "string", enum: [...INDUSTRIES] } },
    components: { type: "array", items: { type: "string", enum: [...COMPONENTS] } },
    vibe: { type: "array", items: { type: "string", enum: [...VIBES] } },
    macrostructure: { type: "string", enum: [...MACROSTRUCTURES] },
    hallmarkTheme: { type: "string", enum: [...HALLMARK_THEMES] },
    description: { type: "string" },
    altText: { type: "string" },
    searchKeywords: { type: "array", items: { type: "string" } },
  },
  required: [
    "style",
    "industry",
    "components",
    "vibe",
    "description",
    "altText",
    "searchKeywords",
  ],
} as const;

const SYSTEM = [
  "You are a senior design critic tagging screenshots of real websites for a curated archive.",
  "Output a single JSON object matching the schema. No prose, no markdown fences.",
  "Every enum tag MUST come from the supplied enums — never invent values.",
  "Pick exactly one Hallmark macrostructure (the named whole-page shape) and one Hallmark theme (category:theme).",
  "description: 1–2 sentences in a designer's voice. Talk about the actual visual choices on this page (typography, colour, density, mood). No marketing fluff. Never describe yourself or the task.",
  "altText: ≤140 chars, screen-reader accurate, focuses on the visible content.",
  "searchKeywords: 5–10 short freeform keywords a designer would actually search for, e.g. 'editorial agency hero', 'dark saas bento'. Lowercase.",
].join(" ");

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
    timeout: 60_000,
  });
  const dataUrl = `data:image/png;base64,${args.heroPng.toString("base64")}`;

  const schemaText = JSON.stringify(tagSchema, null, 2);

  const userText = [
    `Page: ${args.sourceUrl}`,
    `Title: ${args.pageTitle}`,
    `Meta description: ${args.pageDescription}`,
    "",
    "Tag this screenshot. Return ONE JSON object matching this schema exactly:",
    schemaText,
  ].join("\n");

  const completion = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 1024,
    temperature: 0.2,
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

  const text = completion.choices?.[0]?.message?.content ?? "";
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

  // Defence-in-depth — even with response_format, validate every value
  // against the allow-lists. Drift creeps in fast.
  return {
    style: Array.isArray(raw.style) ? (raw.style as string[]).filter(isStyle) : [],
    industry: Array.isArray(raw.industry) ? (raw.industry as string[]).filter(isIndustry) : [],
    components: Array.isArray(raw.components)
      ? (raw.components as string[]).filter(isComponent)
      : [],
    vibe: Array.isArray(raw.vibe) ? (raw.vibe as string[]).filter(isVibe) : [],
    macrostructure:
      typeof raw.macrostructure === "string" && isMacrostructure(raw.macrostructure)
        ? raw.macrostructure
        : undefined,
    hallmarkTheme:
      typeof raw.hallmarkTheme === "string" && isHallmarkTheme(raw.hallmarkTheme)
        ? raw.hallmarkTheme
        : undefined,
    description: typeof raw.description === "string" ? raw.description : "",
    altText: typeof raw.altText === "string" ? raw.altText.slice(0, 140) : "",
    searchKeywords: Array.isArray(raw.searchKeywords)
      ? (raw.searchKeywords as unknown[]).filter((s): s is string => typeof s === "string")
      : [],
  };
}
