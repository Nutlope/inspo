/**
 * Tool registration — shared by both transports (stdio + Cloudflare Worker).
 *
 * Pulled out so adding a tool means editing exactly one file.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  findCollection,
  findComponents,
  findScreen,
  findSimilar,
  getAllCollections,
  getAllScreens,
  renderDesignMd,
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

export function registerTools(server: McpServer) {
  /* ────────────── search_screens ────────────── */
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

  /* ────────────── get_screen ────────────── */
  server.registerTool(
    "get_screen",
    {
      description:
        "Fetch the full record for one screen by slug — every viewport variant, palette, fonts, tech stack, designer credit.",
      inputSchema: { slug: z.string().describe("Screen slug, e.g. 'atelier-mira'") },
    },
    async ({ slug }) => {
      const s = await findScreen(slug);
      if (!s) return asTextContent({ error: `No screen with slug '${slug}'` });
      return asTextContent(formatScreen(s));
    },
  );

  /* ────────────── get_design_system ────────────── */
  server.registerTool(
    "get_design_system",
    {
      description:
        "Return the full DESIGN.md for one screen — color tokens (with role guesses), type ramp (size / weight / line-height), spacing scale, radius scale, container width, raw CSS variables. This is the artifact you should read BEFORE writing any UI code referencing this site. Pairs with the Hallmark skill: Hallmark gives the design process, get_design_system gives the visual reference. Returns markdown text, ready to feed back into your reasoning.",
      inputSchema: {
        slug: z
          .string()
          .describe("Screen slug, e.g. 'linear-app'. Use search_screens or find_similar first to discover slugs."),
      },
    },
    async ({ slug }) => {
      const s = await findScreen(slug);
      if (!s) {
        return {
          content: [
            { type: "text" as const, text: `No screen with slug '${slug}'.` },
          ],
          isError: true,
        };
      }
      return {
        content: [{ type: "text" as const, text: renderDesignMd(s) }],
      };
    },
  );

  /* ────────────── find_similar ────────────── */
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
      if (!target) return asTextContent({ error: `No screen with slug '${slug}'` });
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

  /* ────── find_examples_for_macrostructure (Hallmark-aware) ────── */
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
      const slug = name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]/g, "");
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

  /* ────────────── list_collections ────────────── */
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

  /* ────────────── get_collection ────────────── */
  /* ────────────── find_components ────────────── */
  server.registerTool(
    "find_components",
    {
      description:
        "Find specific UI components (hero, pricing, features, cta, nav, footer, testimonial, logo-cloud, faq, stat) cropped from real sites. Returns image URLs the agent can fetch — perfect for 'show me 12 pricing cards' or 'study how 8 sites do their CTAs'.",
      inputSchema: {
        type: z
          .enum([
            "hero",
            "pricing",
            "features",
            "cta",
            "nav",
            "footer",
            "testimonial",
            "logo-cloud",
            "faq",
            "stat",
          ])
          .describe("Which component type to find"),
        industry: z
          .enum(INDUSTRIES as unknown as [string, ...string[]])
          .optional(),
        macrostructure: z
          .enum(MACROSTRUCTURES as unknown as [string, ...string[]])
          .optional(),
        mode: z.enum(MODES as unknown as [string, ...string[]]).optional(),
        limit: z.number().int().min(1).max(40).default(12),
      },
    },
    async (args) => {
      const hits = await findComponents({
        type: args.type as Parameters<typeof findComponents>[0]["type"],
        industry: args.industry as Industry | undefined,
        macrostructure: args.macrostructure as Macrostructure | undefined,
        mode: args.mode as Mode | undefined,
        limit: args.limit,
      });
      const base = process.env.INSPO_BASE_URL ?? "https://inspo.design";
      return asTextContent({
        type: args.type,
        count: hits.length,
        components: hits.map((h) => ({
          siteSlug: h.screen.siteSlug,
          siteTitle: h.screen.title,
          siteHost: (() => {
            try {
              return new URL(h.screen.sourceUrl).host.replace(/^www\./, "");
            } catch {
              return h.screen.sourceUrl;
            }
          })(),
          imageUrl: `${base}/api/component/${h.screen.slug}/${h.idx}`,
          siteUrl: `${base}/sites/${h.screen.siteSlug}`,
          width: h.region.width,
          height: h.region.height,
          label: h.region.label ?? null,
          palette: h.screen.palette.slice(0, 5),
          mode: h.screen.mode,
        })),
      });
    },
  );

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
      return asTextContent({ ...formatCollection(c), screens: enriched });
    },
  );
}

export const SERVER_INSTRUCTIONS = [
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
].join(" ");
