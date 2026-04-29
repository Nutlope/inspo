#!/usr/bin/env node
/**
 * Inspo MCP server — local stdio transport.
 *
 * Tools exposed:
 *   • search_screens(query, filters?, limit?)
 *   • get_screen(slug)
 *   • find_similar(slug, limit?)
 *   • find_examples_for_macrostructure(name, limit?)   ← Hallmark-aware
 *   • list_collections()
 *   • get_collection(slug)
 *
 * URLs returned point at INSPO_BASE_URL (default http://localhost:3000)
 * — agents can fetch them or pass them to a vision model directly.
 */

import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  findCollection,
  findScreen,
  findSimilar,
  getAllCollections,
  getAllScreens,
} from "@inspo/db";
import {
  STYLES,
  INDUSTRIES,
  MACROSTRUCTURES,
  MACROSTRUCTURE_LABELS,
  MODES,
  isMacrostructure,
  type Style,
  type Industry,
  type Macrostructure,
  type Mode,
} from "@inspo/taxonomy";
import { asTextContent, formatCollection, formatScreen } from "./format.js";
import { lexicalSearch } from "./search.js";

const server = new McpServer(
  { name: "inspo", version: "0.0.1" },
  {
    instructions: [
      "Inspo is a curated archive of real-website screenshots, designed",
      "to give an agent visual reference before it writes UI. When the",
      "user asks you to design or build something with a particular",
      "vibe (editorial, brutalist, bento, dark SaaS, agency portfolio,",
      "etc.) call `search_screens` first and study the returned palette,",
      "fonts, and component breakdowns before generating code.",
      "",
      "If the user is following the Hallmark design skill, call",
      "`find_examples_for_macrostructure` at the macrostructure-pick step",
      "to get exemplars of e.g. 'Bento Grid' or 'Specimen'.",
    ].join(" "),
  },
);

/* ────────────────── search_screens ────────────────── */

server.registerTool(
  "search_screens",
  {
    description:
      "Search the curated archive of real website screenshots. Returns up to N screens with palette, fonts, components, and image URLs the agent can fetch or pass to a vision model.",
    inputSchema: {
      query: z
        .string()
        .describe(
          "Natural-language description of what you're looking for. e.g. 'minimalist editorial agency portfolio'",
        )
        .default(""),
      style: z
        .enum(STYLES as unknown as [string, ...string[]])
        .optional()
        .describe("Filter to one visual style"),
      industry: z
        .enum(INDUSTRIES as unknown as [string, ...string[]])
        .optional()
        .describe("Filter to one industry"),
      macrostructure: z
        .enum(MACROSTRUCTURES as unknown as [string, ...string[]])
        .optional()
        .describe("Filter to a Hallmark macrostructure (e.g. 'bento-grid')"),
      mode: z
        .enum(MODES as unknown as [string, ...string[]])
        .optional()
        .describe("light or dark"),
      limit: z.number().int().min(1).max(20).default(8),
    },
  },
  async (args) => {
    const screens = await getAllScreens({
      style: args.style as Style | undefined,
      industry: args.industry as Industry | undefined,
      macrostructure: args.macrostructure as Macrostructure | undefined,
      mode: args.mode as Mode | undefined,
    });

    const matched = lexicalSearch(screens, args.query, args.limit);
    return asTextContent({
      query: args.query,
      filters: {
        style: args.style ?? null,
        industry: args.industry ?? null,
        macrostructure: args.macrostructure ?? null,
        mode: args.mode ?? null,
      },
      count: matched.length,
      tip:
        matched.length > 0
          ? "Each result includes palette, fonts, components, and image URLs. Fetch the `image` URL or pass it to your vision model before generating UI."
          : "No matches. Try fewer filters or a broader query.",
      results: matched.map((s) => formatScreen(s)),
    });
  },
);

/* ────────────────── get_screen ────────────────── */

server.registerTool(
  "get_screen",
  {
    description:
      "Fetch the full record for one screen by slug — every viewport variant, palette, fonts, tech stack, designer credit.",
    inputSchema: {
      slug: z.string().describe("Screen slug, e.g. 'atelier-mira'"),
    },
  },
  async ({ slug }) => {
    const s = await findScreen(slug);
    if (!s) {
      return asTextContent({ error: `No screen with slug '${slug}'` });
    }
    return asTextContent(formatScreen(s));
  },
);

/* ────────────────── find_similar ────────────────── */

server.registerTool(
  "find_similar",
  {
    description:
      "Given a screen slug, return its visual + structural neighbours — same macrostructure first, then overlapping industry / style / mode.",
    inputSchema: {
      slug: z.string(),
      limit: z.number().int().min(1).max(20).default(8),
    },
  },
  async ({ slug, limit }) => {
    const target = await findScreen(slug);
    if (!target) {
      return asTextContent({ error: `No screen with slug '${slug}'` });
    }
    const similar = await findSimilar(slug, limit);
    return asTextContent({
      reference: { slug: target.slug, title: target.title },
      count: similar.length,
      results: similar.map((s) =>
        formatScreen(
          s,
          s.tags.macrostructure === target.tags.macrostructure
            ? `Same macrostructure (${target.tags.macrostructure})`
            : "Overlapping industry / style / mode",
        ),
      ),
    });
  },
);

/* ────── find_examples_for_macrostructure ─── Hallmark-aware ─────── */

server.registerTool(
  "find_examples_for_macrostructure",
  {
    description:
      "Hallmark-aware. Given one of the 21 named macrostructures, return real production sites that exemplify it. Designed to be called from inside a Hallmark design flow at the macrostructure-pick step. Accepts both kebab-case slugs ('bento-grid') and Hallmark display names ('Bento Grid').",
    inputSchema: {
      name: z
        .string()
        .describe(
          "Macrostructure name. e.g. 'bento-grid', 'Bento Grid', 'specimen', 'Marquee Hero'.",
        ),
      limit: z.number().int().min(1).max(20).default(4),
    },
  },
  async ({ name, limit }) => {
    // Accept "Bento Grid", "bento-grid", "BENTO GRID" — normalise to slug.
    const slug = name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]/g, "");

    if (!isMacrostructure(slug)) {
      return asTextContent({
        error: `Unknown macrostructure '${name}'.`,
        valid: MACROSTRUCTURES.map((m) => ({
          slug: m,
          label: MACROSTRUCTURE_LABELS[m],
        })),
      });
    }

    const screens = await getAllScreens({ macrostructure: slug });
    const top = screens.slice(0, limit);

    return asTextContent({
      macrostructure: { slug, label: MACROSTRUCTURE_LABELS[slug] },
      count: top.length,
      tip:
        top.length > 0
          ? `Study the palette, fonts, and components of these ${top.length} ${MACROSTRUCTURE_LABELS[slug]} examples before generating one yourself. Fetch each 'image' URL.`
          : `No screens tagged ${MACROSTRUCTURE_LABELS[slug]} yet. Try search_screens with a broader query.`,
      results: top.map((s) => formatScreen(s)),
    });
  },
);

/* ────────────────── list_collections ────────────────── */

server.registerTool(
  "list_collections",
  {
    description:
      "List every editor-curated issue. Use this for thematic browsing — e.g. all 'Editorial Layouts' or 'Dark Product Pages'.",
    inputSchema: {},
  },
  async () => {
    const collections = await getAllCollections();
    return asTextContent({
      count: collections.length,
      issues: collections.map(formatCollection),
    });
  },
);

/* ────────────────── get_collection ────────────────── */

server.registerTool(
  "get_collection",
  {
    description:
      "Fetch one issue by slug, including the editor's blurb and ordered screen list.",
    inputSchema: {
      slug: z.string().describe("Collection slug, e.g. 'editorial-layouts'"),
    },
  },
  async ({ slug }) => {
    const c = await findCollection(slug);
    if (!c) return asTextContent({ error: `No collection with slug '${slug}'` });
    const screens = await getAllScreens();
    const enriched = c.screens
      .map((entry) => {
        const s = screens.find((x) => x.slug === entry.slug);
        return s ? { ...formatScreen(s), editorNote: entry.editorNote } : null;
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);
    return asTextContent({
      ...formatCollection(c),
      screens: enriched,
    });
  },
);

/* ────────────────── transport ────────────────── */

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // The transport keeps the process alive; nothing else to do.
}

main().catch((err) => {
  console.error("[inspo-mcp] fatal:", err);
  process.exit(1);
});
