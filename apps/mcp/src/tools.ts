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
  findReferenceComponent,
  findScreen,
  findSimilar,
  findSite,
  getAllCollections,
  getAllScreens,
  getReferenceComponents,
  renderDesignMd,
} from "@inspo/db";
import {
  HEX_FAMILY_THRESHOLD,
  normalizeHex,
  paletteDistance,
  study,
} from "@inspo/shared";
import {
  STYLES,
  INDUSTRIES,
  MACROSTRUCTURES,
  MACROSTRUCTURE_LABELS,
  MODES,
  VIBES,
  COLOR_WORDS,
  isMacrostructure,
  type Style,
  type Industry,
  type Macrostructure,
  type Mode,
  type Vibe,
  type ColorWord,
} from "@inspo/taxonomy";

const PAGE_TYPES = [
  "landing",
  "pricing",
  "features",
  "auth",
  "about",
  "blog",
  "changelog",
  "docs",
  "other",
] as const;

const REFERENCE_TYPES = [
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
] as const;
import { asTextContent, formatCollection, formatScreen, withImages } from "./format.js";
import { absolute } from "./url.js";
import { searchScreens } from "./search.js";
// study() was moved to @inspo/shared so the web playground can call
// it without depending on the MCP-SDK side of @inspo/mcp.

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
          .describe("Filter to one visual style (e.g. 'minimalism', 'editorial')"),
        industry: z
          .enum(INDUSTRIES as unknown as [string, ...string[]])
          .optional()
          .describe("Filter to one industry (e.g. 'saas', 'fintech', 'portfolio')"),
        macrostructure: z
          .enum(MACROSTRUCTURES as unknown as [string, ...string[]])
          .optional()
          .describe("Filter to a Hallmark macrostructure (e.g. 'bento-grid')"),
        mode: z
          .enum(MODES as unknown as [string, ...string[]])
          .optional()
          .describe("light or dark"),
        vibe: z
          .enum(VIBES as unknown as [string, ...string[]])
          .optional()
          .describe("Mood / vibe — 'calm', 'loud', 'luxe', 'technical', 'soft', etc."),
        color: z
          .enum(COLOR_WORDS as unknown as [string, ...string[]])
          .optional()
          .describe("Color word — 'warm', 'cool', 'monochrome', 'neon', 'earthy'"),
        pageType: z
          .enum(PAGE_TYPES)
          .optional()
          .describe(
            "Filter to a page kind: 'landing' (default homepages), 'pricing', 'features', 'auth', 'about', 'blog', 'changelog', 'docs', 'other'",
          ),
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

      // Apply the new in-JS filters that the DB layer doesn't index.
      let filtered = screens;
      if (args.vibe) {
        const v = args.vibe as Vibe;
        filtered = filtered.filter((s) => s.tags.vibe.includes(v));
      }
      if (args.color) {
        const c = args.color as ColorWord;
        filtered = filtered.filter((s) => s.designSystem.colorWords.includes(c));
      }
      if (args.pageType) {
        const p = args.pageType;
        filtered = filtered.filter((s) => s.pageType === p);
      }

      const matched = await searchScreens(filtered, args.query, args.limit);
      const results = matched.map((s) => formatScreen(s));
      return withImages(
        {
          query: args.query,
          filters: {
            style: args.style ?? null,
            industry: args.industry ?? null,
            macrostructure: args.macrostructure ?? null,
            mode: args.mode ?? null,
            vibe: args.vibe ?? null,
            color: args.color ?? null,
            pageType: args.pageType ?? null,
          },
          count: matched.length,
          tip:
            matched.length > 0
              ? "Each result has an inline thumbnail (image block) plus full-resolution URLs. The thumbnails are AVIF when available, PNG otherwise."
              : "No matches. Try fewer filters or a broader query.",
          results,
        },
        results.map((r) => r.thumb),
      );
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
      const formatted = formatScreen(s);
      return withImages(formatted, [formatted.thumb]);
    },
  );

  /* ────────────── get_design_system ────────────── */
  server.registerTool(
    "get_design_system",
    {
      description:
        "Return the full DESIGN.md for one screen — real fonts, frequency-ranked palette, CSS variables, detected tech, role-guessed colour tokens, type ramp where extracted. Two-stage strategy: (1) any tokens extracted at capture time are returned immediately; (2) if those are thin, the tool fetches the source URL live and runs the same extraction `study(url)` does, merging the result. Set `live=false` to skip the live fetch and return only the captured-time tokens. Pairs with Hallmark.",
      inputSchema: {
        slug: z
          .string()
          .describe("Screen slug, e.g. 'linear-app'. Use search_screens or find_similar first to discover slugs."),
        live: z
          .boolean()
          .default(true)
          .describe(
            "If true (default), supplement thin captured tokens by fetching the source URL via study(). Set false to skip the network round-trip.",
          ),
      },
    },
    async ({ slug, live }) => {
      const s = await findScreen(slug);
      if (!s) {
        return {
          content: [
            { type: "text" as const, text: `No screen with slug '${slug}'.` },
          ],
          isError: true,
        };
      }

      // Captured-time DESIGN.md (palette + role guesses + whatever
      // type ramp / spacing scale extract.ts produced). Often thin
      // for legacy rows.
      const capturedMd = renderDesignMd(s);
      const hasRichCaptured =
        s.fonts.length > 0 ||
        s.designSystem.typeRamp.length > 0 ||
        Object.keys(s.designSystem.cssVariables).length > 0;

      // If the captured data is already rich, return it as-is —
      // saves a network call on hot rows.
      if (!live || hasRichCaptured) {
        return {
          content: [{ type: "text" as const, text: capturedMd }],
        };
      }

      // Live-fetch the source URL. Best-effort: if study() fails or
      // returns thin data (SPA shell, bot wall), we still return the
      // captured-time DESIGN.md with a note.
      const liveStudy = await study(s.sourceUrl).catch(() => null);
      if (!liveStudy || !liveStudy.ok) {
        const note =
          liveStudy?.warnings.join(" · ") ?? "live fetch unavailable";
        return {
          content: [
            {
              type: "text" as const,
              text:
                capturedMd +
                "\n\n---\n\n_Live fetch attempted but returned no usable tokens (" +
                note +
                "). Returning captured-time DESIGN.md only._",
            },
          ],
        };
      }

      // Merge: keep the role-guessed palette + macrostructure from
      // captured data (those came from vision tagging) AND attach the
      // freshly-extracted fonts / CSS variables / tech from the live
      // page. The caller reads the live block underneath the
      // captured one.
      const merged =
        capturedMd +
        "\n\n---\n\n## Live-extracted (just fetched)\n\n" +
        liveStudy.designMd.replace(/^# .+\n+>.+\n+Source.+\n+/, "");
      return {
        content: [{ type: "text" as const, text: merged }],
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
      const results = similar.map((s) =>
        formatScreen(
          s,
          s.tags.macrostructure === target.tags.macrostructure
            ? `Same macrostructure (${target.tags.macrostructure})`
            : "Overlapping industry / style / mode",
        ),
      );
      return withImages(
        {
          reference: { slug: target.slug, title: target.title },
          count: similar.length,
          results,
        },
        results.map((r) => r.thumb),
      );
    },
  );

  /* ────────────── get_flow ────────────── */
  server.registerTool(
    "get_flow",
    {
      description:
        "Return a site's full multi-page JOURNEY — the ordered sequence of captured pages (landing → features → pricing → sign-up → docs …), each with its page type, title, palette, and an inline thumbnail. Where a single screen shows one moment, a flow shows how a real product walks a user from first touch to conversion — far richer signal for an agent that has to design more than a hero. Use it after search_screens/recommend to study how a reference structures its whole experience, not just its landing page. Only sites with multiple captured pages return a journey; single-page sites return just their landing.",
      inputSchema: {
        siteSlug: z
          .string()
          .describe(
            "Site slug (the brand, not a sub-page), e.g. 'linear-app', 'clerk-com'. This is the `siteSlug` field on any screen result.",
          ),
      },
    },
    async ({ siteSlug }) => {
      const site = await findSite(siteSlug);
      if (!site) {
        return asTextContent({
          error: `No site '${siteSlug}'. Use the siteSlug field from a search result.`,
        });
      }
      const steps = site.pages.map((p, i) => ({
        step: i + 1,
        slug: p.slug,
        pageType: p.pageType,
        title: p.title,
        palette: p.palette.slice(0, 5),
        thumb: absolute(p.thumbUrl),
        ...(p.northstar ? { northstar: p.northstar } : {}),
      }));
      const payload = {
        site: site.siteSlug,
        title: site.title,
        sourceUrl: site.sourceUrl,
        pageCount: site.pageCount,
        journey: steps.map((s) => s.pageType).join(" → "),
        steps,
      };
      // Inline every step's thumbnail in journey order so the agent can
      // see the whole arc at a glance.
      return withImages(payload, steps.map((s) => s.thumb));
    },
  );

  /* ────────────── compare ────────────── */
  server.registerTool(
    "compare",
    {
      description:
        "Compare 2–4 captured sites side by side across design dimensions — palette, typefaces, macrostructure, mode, style tags, type-scale + spacing + radius scales, container width. Returns a per-site breakdown plus a `shared` block (style tags every site has in common, the set of distinct macrostructures, whether they share a light/dark register). Use it to answer 'what do linear, stripe, and vercel share visually' or to triangulate a house style from a few references. Inline thumbnails included.",
      inputSchema: {
        slugs: z
          .array(z.string())
          .min(2)
          .max(4)
          .describe(
            "2–4 screen slugs to compare, e.g. ['linear-app','stripe-com','vercel-com']. Discover slugs with search_screens / find_similar.",
          ),
      },
    },
    async ({ slugs }) => {
      const found = await Promise.all(slugs.map((s) => findScreen(s)));
      const missing = slugs.filter((_, i) => !found[i]);
      const screens = found.filter((s): s is NonNullable<typeof s> => s != null);
      if (screens.length < 2) {
        return asTextContent({
          error: `Need at least 2 valid slugs to compare. Missing: ${missing.join(", ") || "none"}.`,
        });
      }

      const sites = screens.map((s) => ({
        slug: s.slug,
        title: s.title,
        sourceUrl: s.sourceUrl,
        macrostructure: s.tags.macrostructure
          ? MACROSTRUCTURE_LABELS[s.tags.macrostructure]
          : null,
        mode: s.mode,
        styles: s.tags.style,
        vibe: s.tags.vibe,
        palette: s.palette.slice(0, 6),
        fonts: s.fonts,
        tech: s.tech,
        typeScaleSteps: s.designSystem.typeRamp.length,
        spacingScale: s.designSystem.spacingScale,
        radiusScale: s.designSystem.radiusScale,
        containerWidth: s.designSystem.containerWidth,
      }));

      // Shared signals — intersection of style tags, set of distinct
      // macrostructures, register agreement.
      const styleSets = screens.map((s) => new Set(s.tags.style));
      const commonStyles = [...styleSets[0]!].filter((st) =>
        styleSets.every((set) => set.has(st)),
      );
      const macros = [
        ...new Set(
          screens
            .map((s) => s.tags.macrostructure)
            .filter((m): m is NonNullable<typeof m> => m != null)
            .map((m) => MACROSTRUCTURE_LABELS[m]),
        ),
      ];
      const modes = [...new Set(screens.map((s) => s.mode))];

      const payload = {
        count: sites.length,
        ...(missing.length ? { missing } : {}),
        sites,
        shared: {
          commonStyles,
          distinctMacrostructures: macros,
          sameRegister: modes.length === 1 ? modes[0] : false,
        },
      };
      return withImages(
        payload,
        screens.map((s) => absolute(s.thumbUrl)),
      );
    },
  );

  /* ────────────── find_by_color ────────────── */
  server.registerTool(
    "find_by_color",
    {
      description:
        "Given a hex colour, return real production sites whose extracted palette includes a close match. Distance is Euclidean in OKLAB — the colour space where perceived difference and numeric distance line up — so 'close' means same family of colour, not just same hue. Useful when a brief specifies a particular accent / brand colour and you want sites already living near it. Pairs with `get_design_system` to harvest the matching palette tokens.",
      inputSchema: {
        hex: z
          .string()
          .describe(
            "Target colour as a hex string ('#c7402f', 'c7402f', '#fff'). Case-insensitive. 3- or 6-digit.",
          ),
        tolerance: z
          .number()
          .min(0.02)
          .max(0.5)
          .default(HEX_FAMILY_THRESHOLD)
          .describe(
            "Max OKLAB distance to count as a match. Defaults to 0.15 ('same family'). 0.05 ≈ 'near-identical', 0.30 ≈ 'in the same hue zip code'.",
          ),
        limit: z.number().int().min(1).max(40).default(12),
      },
    },
    async ({ hex, tolerance, limit }) => {
      const target = normalizeHex(hex);
      if (!target) {
        return asTextContent({
          error: `Invalid hex '${hex}'. Use #rrggbb, #rgb, or the same without the #.`,
        });
      }
      const all = await getAllScreens();
      // Score one row per site — sub-pages inherit the parent's palette
      // so scoring all 3,000+ rows is wasted work + would double-list
      // sites whose sub-pages share the same hex. Group by siteSlug,
      // take the landing row (slug === siteSlug) as the canonical one.
      const bySite = new Map<string, typeof all[number]>();
      for (const s of all) {
        if (s.slug !== s.siteSlug) continue;
        bySite.set(s.siteSlug, s);
      }
      const scored: { d: number; s: typeof all[number] }[] = [];
      for (const s of bySite.values()) {
        const d = paletteDistance(target, s.palette ?? []);
        if (d <= tolerance) scored.push({ d, s });
      }
      scored.sort((a, b) => a.d - b.d);
      const top = scored.slice(0, limit);
      const results = top.map(({ s, d }) =>
        formatScreen(s, `Δ ${d.toFixed(3)} from ${target}`),
      );
      return withImages(
        {
          anchor: target,
          tolerance,
          count: results.length,
          results,
        },
        results.map((r) => r.thumb),
      );
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
      const results = top.map((s) => formatScreen(s));
      return withImages(
        {
          macrostructure: { slug, label: MACROSTRUCTURE_LABELS[slug] },
          count: top.length,
          tip:
            top.length > 0
              ? `Each result has an inline thumbnail (image block) below the JSON. Study them — they're real production captures embodying ${MACROSTRUCTURE_LABELS[slug]}.`
              : `No screens tagged ${MACROSTRUCTURE_LABELS[slug]} yet. Try search_screens with a broader query.`,
          results,
        },
        results.map((r) => r.thumb),
      );
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
        style: z
          .enum(STYLES as unknown as [string, ...string[]])
          .optional()
          .describe("Filter the parent site's style"),
        industry: z
          .enum(INDUSTRIES as unknown as [string, ...string[]])
          .optional(),
        macrostructure: z
          .enum(MACROSTRUCTURES as unknown as [string, ...string[]])
          .optional(),
        mode: z.enum(MODES as unknown as [string, ...string[]]).optional(),
        vibe: z
          .enum(VIBES as unknown as [string, ...string[]])
          .optional()
          .describe("Mood — 'calm', 'loud', 'luxe', etc."),
        color: z
          .enum(COLOR_WORDS as unknown as [string, ...string[]])
          .optional()
          .describe("Color word — 'warm', 'cool', 'monochrome', etc."),
        pageType: z
          .enum(PAGE_TYPES)
          .optional()
          .describe("Only components from this page kind (e.g. 'pricing')"),
        limit: z.number().int().min(1).max(40).default(12),
      },
    },
    async (args) => {
      const hits = await findComponents({
        type: args.type as Parameters<typeof findComponents>[0]["type"],
        style: args.style as Style | undefined,
        industry: args.industry as Industry | undefined,
        macrostructure: args.macrostructure as Macrostructure | undefined,
        mode: args.mode as Mode | undefined,
        limit: args.limit,
      });
      // In-JS filter for the axes findComponents doesn't index.
      const vibe = args.vibe as Vibe | undefined;
      const color = args.color as ColorWord | undefined;
      const pageType = args.pageType as
        | (typeof PAGE_TYPES)[number]
        | undefined;
      const filtered = hits.filter((h) => {
        if (vibe && !h.screen.tags.vibe.includes(vibe)) return false;
        if (color && !h.screen.designSystem.colorWords.includes(color))
          return false;
        if (pageType && h.screen.pageType !== pageType) return false;
        return true;
      });
      const base = process.env.INSPO_BASE_URL ?? "https://inspo.design";
      const components = filtered.map((h) => ({
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
        // Fallback for inline preview — the parent site's whole-page
        // thumb. The cropped imageUrl serves the actual component
        // (e.g. just the pricing table); the thumb gives the agent
        // page-level context.
        thumb: h.screen.thumbUrl,
        siteUrl: `${base}/sites/${h.screen.siteSlug}`,
        width: h.region.width,
        height: h.region.height,
        label: h.region.label ?? null,
        palette: h.screen.palette.slice(0, 5),
        mode: h.screen.mode,
      }));
      return withImages(
        {
          type: args.type,
          filters: {
            style: args.style ?? null,
            industry: args.industry ?? null,
            macrostructure: args.macrostructure ?? null,
            mode: args.mode ?? null,
            vibe: args.vibe ?? null,
            color: args.color ?? null,
            pageType: args.pageType ?? null,
          },
          count: filtered.length,
          components,
        },
        components.map((c) => c.thumb),
      );
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

  /* ────── find_reference_components (canonical-JSX catalogue) ──────
   *
   * Lists the 68 Hallmark-stamped reference components — the canonical
   * shapes for hero / pricing / footer / etc. Without filters, returns
   * a list view (no source) so the agent can scan. Filtered by type,
   * returns the full source for each match.
   */
  server.registerTool(
    "find_reference_components",
    {
      description:
        "List the Hallmark-stamped reference components — canonical JSX shapes for hero / pricing / cta / nav / footer / etc. Each entry stamps which macrostructure it embodies. Filter by `type` to get the full JSX source for that category; without filters you get a scan-view with names + notes. After picking, call `get_reference_jsx` for the full source of a specific one. Pairs perfectly with the Hallmark skill: Hallmark picks the macrostructure → this returns the canonical code shape that embodies it.",
      inputSchema: {
        type: z
          .enum(REFERENCE_TYPES)
          .optional()
          .describe("Component category (hero, pricing, cta, …). Omit to scan all types."),
        macro: z
          .string()
          .optional()
          .describe(
            "Substring match on the component's macro field — e.g. 'Marquee' matches 'Marquee Hero'.",
          ),
      },
    },
    async ({ type, macro }) => {
      const list = getReferenceComponents({
        type: type as Parameters<typeof getReferenceComponents>[0] extends infer T
          ? T extends { type?: infer U }
            ? U
            : never
          : never,
        macroQuery: macro,
      });
      // Without a `type` filter the catalogue is heavy (68 × ~2 KB);
      // return a list view (id/label/macro/note + tiny preview) and
      // let the caller fetch full source via get_reference_jsx.
      if (!type) {
        return asTextContent({
          count: list.length,
          tip: "Filter by `type` to get full JSX source. Currently showing list view only.",
          components: list.map((r) => ({
            id: r.id,
            type: r.type,
            label: r.label,
            macro: r.macro,
            note: r.note,
            sourcePreview: r.source.slice(0, 240).replace(/\s+/g, " ") + "…",
          })),
        });
      }
      return asTextContent({
        count: list.length,
        tip: "Each result includes the full canonical JSX. Stamp + JSDoc are inside the source — read them; they explain when to reach for this archetype.",
        components: list,
      });
    },
  );

  /* ────────────── study (live URL → DESIGN.md) ──────────
   *
   * Fetch any live URL and return the brand's design system —
   * fonts / palette / CSS variables / tech, extracted from HTML and
   * CSS at request time. The MCP doesn't need the URL to be in the
   * catalogue.
   *
   * Pairs directly with Hallmark's `study <url>` verb: the agent
   * passes the brand URL, gets a DESIGN.md, then uses it as the
   * token block when writing code.
   */
  server.registerTool(
    "study",
    {
      description:
        "Fetch any live URL and return its design system — real fonts, frequency-ranked colour palette, CSS variables, detected tech, title + meta. Use this for brands NOT in the catalogue (the user pastes a URL, a competitor, a partner). Lightweight: HTML + linked stylesheets only, no Playwright. Falls back gracefully on JS-rendered SPAs (flags it in the response). Pairs with Hallmark's `study` verb.",
      inputSchema: {
        url: z
          .string()
          .url()
          .describe(
            "Full URL to study. E.g. 'https://stripe.com', 'https://aesop.com'.",
          ),
      },
    },
    async ({ url }) => {
      const r = await study(url);
      // Return the structured shape so agents can read individual
      // fields, plus the formatted DESIGN.md as a sibling block.
      return asTextContent(r);
    },
  );

  /* ────────────── recommend (Hallmark-aware orchestrator) ──────────
   *
   * One call that returns everything an agent needs to start writing
   * a page: a macrostructure pick, 5 real exemplars (with inline
   * thumbnails), 1–3 canonical reference JSX components matching that
   * macrostructure, and a palette suggestion extracted from the top
   * exemplar.
   *
   * Hallmark-compatible:
   *   - If `macrostructure` is passed (Hallmark already picked one)
   *     the recommend tool uses it directly — no pick, no LLM call.
   *   - If omitted, recommend runs the hybrid search on the brief
   *     and the top result's macrostructure becomes the pick.
   *
   * No LLM call inside. Composes search_screens + find_examples_for_
   * macrostructure + find_reference_components — anything you could
   * do by hand, but in one round-trip.
   */
  server.registerTool(
    "recommend",
    {
      description:
        "Hallmark-compatible orchestrator. One call returns: a macrostructure pick, 5 real exemplars (inline thumbs), 1–3 canonical reference JSX components, and a palette suggestion — everything an agent needs to start a page. If you're following Hallmark, pass the macrostructure you've picked; otherwise the tool picks one from the brief via hybrid search. No LLM call — composes search + find_examples + find_reference_components.",
      inputSchema: {
        brief: z
          .string()
          .min(2)
          .describe(
            "The user's design brief in plain English. E.g. 'calm meditation app', 'dark dev-tool that helps teams ship faster'.",
          ),
        macrostructure: z
          .enum(MACROSTRUCTURES as unknown as [string, ...string[]])
          .optional()
          .describe(
            "Optional: a macrostructure already picked (typically by Hallmark). Skips the pick step.",
          ),
        pageType: z
          .enum(PAGE_TYPES)
          .optional()
          .describe("Optional: 'landing', 'pricing', 'features', etc."),
        mode: z
          .enum(MODES as unknown as [string, ...string[]])
          .optional()
          .describe("Optional: 'light' or 'dark'."),
        vibe: z
          .enum(VIBES as unknown as [string, ...string[]])
          .optional()
          .describe("Optional vibe filter."),
        color: z
          .enum(COLOR_WORDS as unknown as [string, ...string[]])
          .optional()
          .describe("Optional colour word."),
      },
    },
    async (args) => {
      const all = await getAllScreens();
      // Apply any caller-supplied filters before searching.
      let pool = all;
      if (args.mode) {
        const m = args.mode as Mode;
        pool = pool.filter((s) => s.mode === m);
      }
      if (args.vibe) {
        const v = args.vibe as Vibe;
        pool = pool.filter((s) => s.tags.vibe.includes(v));
      }
      if (args.color) {
        const c = args.color as ColorWord;
        pool = pool.filter((s) => s.designSystem.colorWords.includes(c));
      }
      if (args.pageType) {
        const p = args.pageType;
        pool = pool.filter((s) => s.pageType === p);
      }

      // Rank against the brief. The hybrid ranker (PR 7) embeds the
      // query and blends cosine with lexical; results are deduped per
      // site so the top of the list is genuinely diverse.
      const ranked = await searchScreens(pool, args.brief, 24);

      // Pick a macrostructure. If Hallmark gave us one, honour it.
      // Otherwise: take the most common macrostructure among the top
      // 6 ranked results (defends against one outlier dragging the
      // pick toward an unrelated macro).
      let picked: Macrostructure | undefined;
      let rationale: string;
      if (args.macrostructure) {
        picked = args.macrostructure as Macrostructure;
        rationale = `Honouring the macrostructure passed in by the caller (typically Hallmark's pick).`;
      } else {
        const top = ranked.slice(0, 6);
        const counts = new Map<Macrostructure, number>();
        for (const s of top) {
          const m = s.tags.macrostructure;
          if (m) counts.set(m, (counts.get(m) ?? 0) + 1);
        }
        let bestN = 0;
        for (const [m, n] of counts) {
          if (n > bestN) {
            bestN = n;
            picked = m;
          }
        }
        if (!picked && top[0]) picked = top[0].tags.macrostructure;
        rationale = picked
          ? `Picked ${MACROSTRUCTURE_LABELS[picked]} — most common macrostructure (${bestN} of ${top.length}) among the top hybrid-search hits for the brief.`
          : "No macrostructure could be inferred from the brief; consider passing one explicitly or refining the brief.";
      }

      // 5 exemplars OF the picked macro from the ranked pool. Fall
      // back to the ranked top if filtering yields nothing.
      let exemplars = picked
        ? ranked.filter((s) => s.tags.macrostructure === picked).slice(0, 5)
        : ranked.slice(0, 5);
      if (exemplars.length === 0) exemplars = ranked.slice(0, 5);
      const exemplarsFmt = exemplars.map((s) => formatScreen(s));

      // Canonical reference component(s) that match the picked
      // macrostructure. Substring-match on the first word of the
      // display label (e.g. "Marquee" → matches hero/marquee) AND
      // on the slug. Returns 0–3 matches.
      const refMatches: ReturnType<typeof getReferenceComponents> = [];
      if (picked) {
        const label = MACROSTRUCTURE_LABELS[picked];
        const firstWord = label.split(/[\s-]+/)[0]!.toLowerCase();
        const slugTokens = picked.split("-");
        const all = getReferenceComponents();
        for (const r of all) {
          const hay = `${r.id} ${r.macro}`.toLowerCase();
          if (hay.includes(firstWord)) {
            refMatches.push(r);
            continue;
          }
          if (slugTokens.every((t) => hay.includes(t))) refMatches.push(r);
        }
      }
      // De-duplicate; prefer hero matches first (they define page
      // shape) then everything else.
      const seenRef = new Set<string>();
      const referencePicks = [
        ...refMatches.filter((r) => r.type === "hero"),
        ...refMatches.filter((r) => r.type !== "hero"),
      ]
        .filter((r) => {
          const k = `${r.type}/${r.id}`;
          if (seenRef.has(k)) return false;
          seenRef.add(k);
          return true;
        })
        .slice(0, 3);

      // Palette suggestion — top exemplar's palette is the safest
      // signal. If somehow empty, fall back to the second.
      const palette =
        (exemplarsFmt[0]?.palette?.length ?? 0) > 0
          ? exemplarsFmt[0]!.palette
          : (exemplarsFmt[1]?.palette ?? []);

      return withImages(
        {
          brief: args.brief,
          filters: {
            pageType: args.pageType ?? null,
            mode: args.mode ?? null,
            vibe: args.vibe ?? null,
            color: args.color ?? null,
          },
          pick: picked
            ? {
                macrostructure: {
                  slug: picked,
                  label: MACROSTRUCTURE_LABELS[picked],
                },
                rationale,
              }
            : { macrostructure: null, rationale },
          exemplars: exemplarsFmt,
          referenceComponents: referencePicks,
          paletteSuggestion: palette,
          tip:
            referencePicks.length > 0
              ? "Read the referenceComponents source(s) for the canonical structure that embodies this macrostructure. Study the inline exemplar thumbnails for palette + type + density choices specific to your brief."
              : "No canonical reference matched the picked macrostructure. Study the inline exemplar thumbnails and write the page shape by hand.",
        },
        exemplarsFmt.map((r) => r.thumb),
      );
    },
  );

  /* ────────────── get_reference_jsx ────────────── */
  server.registerTool(
    "get_reference_jsx",
    {
      description:
        "Return the full canonical JSX source for one Hallmark-stamped reference component. Use after `find_reference_components` to fetch the one you'll use. The source is the file's full content — including the Hallmark `/* … */` stamp at the top that names the macrostructure / theme / states / contrast pass. Copy-pasteable into a React project as-is; tweak tokens to match the target brand.",
      inputSchema: {
        type: z
          .enum(REFERENCE_TYPES)
          .describe("Component category"),
        id: z
          .string()
          .describe("Reference id within that type (e.g. 'marquee', 'three-card')."),
      },
    },
    async ({ type, id }) => {
      const r = findReferenceComponent(type, id);
      if (!r) {
        return asTextContent({
          error: `No reference component with type='${type}' id='${id}'.`,
          hint: "Call find_reference_components({ type: '" + type + "' }) to list available ids.",
        });
      }
      return asTextContent({
        id: r.id,
        type: r.type,
        label: r.label,
        macro: r.macro,
        note: r.note,
        source: r.source,
      });
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
