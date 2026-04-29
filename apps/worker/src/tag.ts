/**
 * Vision-LLM tagging via Claude Sonnet 4.6 with tool-use as structured
 * output. The tool's input schema is the source of truth for the wire
 * format; all values are validated against the @inspo/taxonomy
 * allow-lists before we trust them.
 */

import Anthropic from "@anthropic-ai/sdk";
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

const MODEL = "claude-sonnet-4-6";

const tagToolSchema = {
  name: "report_tags",
  description: "Report structured tags + description for the captured page.",
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      style: {
        type: "array",
        items: { type: "string", enum: [...STYLES] },
      },
      industry: {
        type: "array",
        items: { type: "string", enum: [...INDUSTRIES] },
      },
      components: {
        type: "array",
        items: { type: "string", enum: [...COMPONENTS] },
      },
      vibe: {
        type: "array",
        items: { type: "string", enum: [...VIBES] },
      },
      macrostructure: {
        type: "string",
        enum: [...MACROSTRUCTURES],
      },
      hallmarkTheme: {
        type: "string",
        enum: [...HALLMARK_THEMES],
      },
      description: { type: "string" },
      altText: { type: "string" },
      searchKeywords: { type: "array", items: { type: "string" } },
    },
    required: ["style", "industry", "components", "vibe", "description", "altText", "searchKeywords"],
  },
} as const;

export async function tagWithClaude(args: {
  heroPng: Buffer;
  pageTitle: string;
  pageDescription: string;
  sourceUrl: string;
}): Promise<AITags> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    tools: [tagToolSchema],
    tool_choice: { type: "tool", name: "report_tags" },
    system: [
      "You tag screenshots of websites for a curated archive.",
      "All tags must come from the provided enums — never invent values.",
      "Pick exactly one Hallmark macrostructure and one Hallmark theme.",
      "description: 1–2 sentences, designer voice, no marketing fluff.",
      "altText: ≤140 chars, screen-reader accurate.",
      "searchKeywords: 5–10 short freeform keywords used for BM25.",
    ].join(" "),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/png",
              data: args.heroPng.toString("base64"),
            },
          },
          {
            type: "text",
            text: `Page: ${args.sourceUrl}\nTitle: ${args.pageTitle}\nMeta description: ${args.pageDescription}\n\nTag this page.`,
          },
        ],
      },
    ],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude did not return a tool_use block");
  }
  const raw = toolUse.input as Record<string, unknown>;

  // Defence-in-depth — validate every value against allow-lists
  const out: AITags = {
    style: Array.isArray(raw.style) ? (raw.style as string[]).filter(isStyle) : [],
    industry: Array.isArray(raw.industry) ? (raw.industry as string[]).filter(isIndustry) : [],
    components: Array.isArray(raw.components) ? (raw.components as string[]).filter(isComponent) : [],
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

  return out;
}
