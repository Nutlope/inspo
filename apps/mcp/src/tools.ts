/**
 * Tool registration - shared by both transports (stdio + Cloudflare Worker).
 *
 * Pulled out so adding a tool means editing exactly one file.
 */

import { z, type ZodRawShape } from "zod";
import type {
  McpServer,
  RegisteredTool,
  ToolCallback,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  LITE_TOOLS,
  applyProfileOnInitialize,
  createServerContext,
  sanitizeListedToolSchemas,
  type RegisterOptions,
} from "./profile";
import {
  findCollection,
  findComponents,
  findReferenceComponent,
  findScreen,
  findSimilarDetailed,
  findSite,
  getAllCollections,
  getAllScreens,
  getMultiPageSites,
  getAllSites,
  getReferenceComponents,
  isLowQuality,
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
  COMPONENTS,
  CAPTURE_DEVICES,
  PAPER_BANDS,
  DISPLAY_CLASSES,
  ACCENT_HUE_BANDS,
  isMacrostructure,
  type Style,
  type Industry,
  type Macrostructure,
  type Mode,
  type Vibe,
  type ColorWord,
  type CaptureDevice,
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
import {
  asTextContent,
  formatCollection,
  formatScreen,
  formatScreenConcise,
  inlineThumbCandidates,
  withImages,
} from "./format";
import { absolute } from "./url";
import {
  MAX_BUDGET_TOKENS,
  MIN_BUDGET_TOKENS,
  resolveBudget,
} from "./budget";
import { searchScreens } from "./search";
import {
  buildEvidence,
  macrostructureCoverage,
  macrostructureShortlist,
} from "./evidence";
// study() was moved to @inspo/shared so the web playground can call
// it without depending on the MCP-SDK side of @inspo/mcp.

/** How many of `recommend`'s exemplars come back with an inline
 *  thumbnail. All 5 stay in the JSON with their image URLs; only the
 *  top few are inlined, and an agent writing one page studies the
 *  first one or two.
 *
 *  This used to say images were ~85% of the response's token cost.
 *  They are not: a 384px thumb is ~123 tokens, so three of them are
 *  3.9% of a recommend, against 441 tokens for a single exemplar's
 *  autopsy. Bytes are not tokens, and the old number was reading the
 *  KB column. What the cap actually buys is LATENCY - each thumb is a
 *  network fetch, ~80ms cold - which is a real reason to keep it at 3,
 *  just not the reason written here before. */
const RECOMMEND_INLINE_EXEMPLARS = 3;

/** Guidance every Inspo consumer should honour when composing a page's
 *  hero. Real production sites compose their first screen to the fold;
 *  agents tend to overflow it with oversized type, so the hero (and its
 *  thumbnail) reads as cut-off and unfinished. Surfaced in the server
 *  instructions + recommend() so it reaches any agent building a page. */
const HERO_GUIDANCE =
  // Deliberately does NOT enumerate an eyebrow among the hero's parts.
  // It used to, and several design skills ban eyebrows outright as a
  // hallmark of machine-made pages - so naming one here put a
  // contradiction in the agent's prompt on every session. This rule is
  // about the fold, and it has no business taking a side on which
  // elements a hero contains.
  "Compose the hero to fit the FIRST VIEWPORT (~1280×800, i.e. min-height:100svh): the nav, headline, supporting line, primary CTA, and any hero visual/product mock must be visually COMPLETE above the fold - nothing important cut off. Size display type to land in 2-3 balanced lines within that height; never let an oversized wordmark or heading eat the viewport (the single most common failure). Lead with modest top spacing, not a tall empty gap. Study how the exemplars balance headline against visual inside their own first screen and match that restraint.";

/** Companion rule for everything below the fold. The two failures
 *  agents actually produce down-page are cramped section seams (two
 *  sections reading as one dense block) and text touching the viewport
 *  edge. The numbers are measured from the archive, not taste: across
 *  the 671 sites with an extracted spacing scale, the large steps
 *  cluster at 64-120px and the median site's biggest step is 96px.
 *  Travels next to HERO_GUIDANCE in recommend() and the server
 *  instructions, because server instructions alone never reach the
 *  model in several MCP clients. */
const SPACING_GUIDANCE =
  "Below the fold, keep two spacing systems deliberate. VERTICAL: separate adjacent sections with real block space - production sites run 80-160px between sections (measured median for the biggest step: 96px); under ~64px two sections read as one crammed block. Pick ONE rhythm (e.g. clamp(72px, 10vw, 140px)) and apply it at every section seam instead of improvising per section. HORIZONTAL: run content in a centered max-width column with symmetric padding-inline (24px minimum on mobile, more at desktop) so text never touches the viewport edge; full-bleed is for backgrounds, not copy. Declare the two separately: a container's padding SHORTHAND (.wrap{padding:0 32px}) outranks a bare section{padding:96px 0} on any element carrying both, silently zeroing the rhythm - give the container padding-inline only, and put block spacing on its own rule. Verify after writing: a mid-page section's computed block padding or margin must not be 0px.";

/** Below this many distinct sites, a macrostructure's exemplar set is
 *  too small to read a consensus off, and callers are told so.
 *
 *  Set against the real distribution rather than picked round: nine of
 *  the twenty-one shapes have four sites or fewer (two have none), and
 *  the gap between `letter` at 6 and `long-document` at 11 is where
 *  "here are some examples" starts being defensible. */
const THIN_COVERAGE = 8;

/** Nearest covered shapes per macrostructure, for when coverage is
 *  thin. Adjacency is by composition, not by name: Workbench and
 *  Component Playground both put the product's own surface on the
 *  page, so one teaches the other. Rotation constraints push callers
 *  toward exactly the rare shapes, so this path is hit more than the
 *  raw distribution suggests. */
const MACRO_NEIGHBOURS: Record<string, Macrostructure[]> = {
  "bento-grid": ["split-studio", "feature-stack"],
  "long-document": ["letter", "specimen"],
  "marquee-hero": ["manifesto", "photographic"],
  "stat-led": ["marquee-hero", "split-studio"],
  workbench: ["feature-stack", "component-playground"],
  "conversational-faq": ["long-document", "index-first"],
  manifesto: ["marquee-hero", "specimen"],
  photographic: ["marquee-hero", "portfolio-grid"],
  "quote-led": ["long-document", "letter"],
  specimen: ["type-specimen", "long-document"],
  catalogue: ["portfolio-grid", "type-specimen"],
  letter: ["long-document", "manifesto"],
  "index-first": ["ecosystem-index", "long-document"],
  "narrative-workflow": ["feature-stack", "split-studio"],
  "split-studio": ["feature-stack", "bento-grid"],
  "feature-stack": ["split-studio", "workbench"],
  "type-specimen": ["specimen", "catalogue"],
  "portfolio-grid": ["catalogue", "photographic"],
  "map-diagram": ["ecosystem-index", "feature-stack"],
  "ecosystem-index": ["index-first", "portfolio-grid"],
  "component-playground": ["workbench", "catalogue"],
};

/* ────────────── tolerant argument parsing ──────────────
 *
 * OSS models mangle tool arguments in predictable ways: wrong case
 * ("Dark"), display names for slugs ("Bento Grid"), numbers as strings
 * ("8"), out-of-range limits, bare domains for URLs. Every one of
 * those is unambiguous, so accept them instead of bouncing the call.
 * The preprocessors run before zod validation; zod-to-json-schema
 * reads through z.preprocess, so the advertised schema (enum lists,
 * integer bounds) is unchanged.
 */

const looseTrim = (v: unknown) => (typeof v === "string" ? v.trim() : v);

const looseSlugify = (v: unknown) =>
  typeof v === "string" ? v.trim().toLowerCase().replace(/\s+/g, "-") : v;

/** Case/whitespace-tolerant enum: "Dark Mode" → "dark-mode". */
function flexEnum<T extends [string, ...string[]]>(values: T) {
  return z.preprocess(looseSlugify, z.enum(values));
}

/** Integer that accepts numeric strings, rounds floats, and clamps to
 *  [min, max] instead of rejecting an over-eager limit=50. */
function flexInt(min: number, max: number) {
  return z.preprocess((v) => {
    const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v;
    if (typeof n !== "number" || !Number.isFinite(n)) return v;
    return Math.min(max, Math.max(min, Math.round(n)));
  }, z.number().int().min(min).max(max));
}

/** Float that accepts numeric strings and clamps to [min, max]. */
function flexNum(min: number, max: number) {
  return z.preprocess((v) => {
    const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v;
    if (typeof n !== "number" || !Number.isFinite(n)) return v;
    return Math.min(max, Math.max(min, n));
  }, z.number().min(min).max(max));
}

const flexBool = () =>
  z.preprocess((v) => {
    if (typeof v === "string") {
      const s = v.trim().toLowerCase();
      if (s === "true" || s === "1" || s === "yes") return true;
      if (s === "false" || s === "0" || s === "no") return false;
    }
    return v;
  }, z.boolean());

/** Slug-ish identifier: trims, lowercases, hyphenates inner spaces. */
const flexSlug = () => z.preprocess(looseSlugify, z.string());

/** URL that tolerates a bare domain ("stripe.com" → "https://stripe.com"). */
const flexUrl = () =>
  z.preprocess((v) => {
    if (typeof v !== "string") return v;
    const s = v.trim();
    if (s && !/^[a-z][a-z0-9+.-]*:\/\//i.test(s) && /^[\w-]+(\.[\w-]+)+/.test(s)) {
      return `https://${s}`;
    }
    return s;
  }, z.string().url().max(2048));

/** Tip line for screen-list responses, phrased for whichever response
 *  shape the connecting harness actually receives. */
function resultsTip(inline: boolean, concise: boolean): string {
  const mobile =
    " Each result also carries `mobile` (375px) image URLs where captured, so you can study how the design reflows, not just the desktop look.";
  const search =
    typeof process !== "undefined" && process.env?.TOGETHER_API_KEY
      ? ""
      : " Ranking is lexical-only right now (no TOGETHER_API_KEY set, so semantic vector search is off); set it for sharper relevance.";
  if (inline) {
    return (
      "Each result has an inline thumbnail (image block) plus full-resolution URLs (WebP when available, PNG otherwise)." +
      mobile +
      search
    );
  }
  const base = concise
    ? 'Text-only profile, concise results: each carries `northstar` (one-line essence), palette, fonts, mode and macrostructure. Call get_screen(slug), or pass detail:"full", for the full `autopsy` (fold breakdown) + description + tags + tech.'
    : "Text-only profile: read each result's `autopsy` (fold composition breakdown), `northstar`, palette and fonts; they carry the visual essence.";
  return base + mobile + search + " Image URLs are included if your harness can fetch them.";
}

/** Error payload for a slug miss, with close-match suggestions so the
 *  model can self-correct in one step instead of re-searching. */
async function unknownSlug(slug: string) {
  const all = await getAllScreens();
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const n = norm(slug);
  const didYouMean =
    n.length >= 3
      ? all
          .filter((s) => s.slug === s.siteSlug)
          .map((s) => s.slug)
          .filter((x) => {
            const nx = norm(x);
            return nx.includes(n) || n.includes(nx);
          })
          .slice(0, 5)
      : [];
  return {
    error: `No screen with slug '${slug}'.`,
    ...(didYouMean.length ? { didYouMean } : {}),
    hint: "Slugs come from search_screens / recommend / find_similar results.",
  };
}

export function registerTools(server: McpServer, opts: RegisterOptions = {}) {
  const ctx = createServerContext(server, opts);
  const handles = new Map<string, RegisteredTool>();

  // Result-shape control. The text-only profile (images=none) defaults
  // to the lean concise shape so a multi-result search stays a few
  // hundred tokens for small models; vision profiles keep the full
  // shape. A maxTokens budget also implies concise, because a full
  // result runs ~3 KB and a tight budget would otherwise spend the
  // whole allowance on one row when the caller clearly wanted several
  // lean ones. An explicit `detail` arg always wins over both.
  const fmt = (detail?: string, maxTokens?: number | null) =>
    (detail
      ? detail === "concise"
      : ctx.concise() || resolveBudget(maxTokens, opts.maxTokens) !== null)
      ? formatScreenConcise
      : formatScreen;
  const detailArg = () => ({
    detail: flexEnum(["concise", "full"])
      .optional()
      .describe(
        "Result verbosity. Defaults to concise on the text-only profile, full otherwise. 'full' adds the autopsy (fold breakdown), description, all tags and tech; 'concise' keeps northstar + palette + fonts. Use get_screen for one screen's full record.",
      ),
  });
  const deviceArg = () => ({
    device: flexEnum(CAPTURE_DEVICES as unknown as [string, ...string[]])
      .optional()
      .describe(
        "'mobile' restricts to sites with a mobile (375px) capture pair and inlines the mobile thumbnail instead of the desktop one - use it when designing phone-first. Nearly the whole archive has mobile pairs; 'desktop' is the default behavior.",
      ),
  });
  // Hard ceiling on what one call may spend. Trims the tail of the
  // ranked results, then the inline thumbnails, keeping the top hit and
  // every scalar field intact. Server-wide default: INSPO_MAX_TOKENS.
  const budgetArg = () => ({
    maxTokens: flexInt(MIN_BUDGET_TOKENS, MAX_BUDGET_TOKENS)
      .optional()
      .describe(
        "Approximate token ceiling for this response. Trims lower-ranked results and inline thumbnails to fit; the top result and all URLs always survive. Use it when context is tight.",
      ),
  });
  /** Budget for one response: the per-call `maxTokens` when the tool
   *  exposes it, else the server-wide default. Pass trimResults:false
   *  when the caller named the list entries explicitly. */
  const budget = (perCall?: number, trimResults = true) => ({
    maxTokens: resolveBudget(perCall, opts.maxTokens),
    trimResults,
  });

  /** registerTool, minus the tools excluded by a statically-known lite
   *  profile. When the profile is client-detected instead, everything
   *  registers and applyProfileOnInitialize() hides the rest. */
  const reg = <Args extends ZodRawShape>(
    name: string,
    config: { description?: string; inputSchema?: Args },
    cb: ToolCallback<Args>,
  ): void => {
    if (ctx.staticProfile === "lite" && !LITE_TOOLS.has(name)) return;
    // Metrics wrapper: time every call and report name/ok/duration to
    // the host's hook (Analytics Engine on the Worker; nothing on
    // stdio). The hook is fire-and-forget and can never break a
    // response or turn a success into a failure.
    const onToolCall = opts.onToolCall;
    const wrapped = (onToolCall
      ? async (...cbArgs: Parameters<ToolCallback<Args>>) => {
          const started = Date.now();
          let ok = true;
          try {
            const result = await (cb as (...a: unknown[]) => Promise<{ isError?: boolean }>)(
              ...(cbArgs as unknown[]),
            );
            ok = result?.isError !== true;
            return result;
          } catch (err) {
            ok = false;
            throw err;
          } finally {
            try {
              onToolCall({ tool: name, ok, ms: Date.now() - started });
            } catch {
              /* metrics must never break the response */
            }
          }
        }
      : cb) as ToolCallback<Args>;
    handles.set(name, server.registerTool(name, config, wrapped));
  };
  /* ────────────── search_screens ────────────── */
  reg(
    "search_screens",
    {
      description:
        "Search the curated archive of real website screenshots. Returns up to N screens with palette, fonts, components, and image URLs the agent can fetch or pass to a vision model.",
      inputSchema: {
        query: z
          .preprocess(looseTrim, z.string())
          .describe(
            "Natural-language description of what you're looking for. e.g. 'minimalist editorial agency portfolio'",
          )
          .default(""),
        style: flexEnum(STYLES as unknown as [string, ...string[]])
          .optional()
          .describe("Filter to one visual style (e.g. 'minimalism', 'editorial')"),
        industry: flexEnum(INDUSTRIES as unknown as [string, ...string[]])
          .optional()
          .describe("Filter to one industry (e.g. 'saas', 'fintech', 'portfolio')"),
        macrostructure: flexEnum(MACROSTRUCTURES as unknown as [string, ...string[]])
          .optional()
          .describe("Filter to a macrostructure (e.g. 'bento-grid')"),
        mode: flexEnum(MODES as unknown as [string, ...string[]])
          .optional()
          .describe("light or dark"),
        vibe: flexEnum(VIBES as unknown as [string, ...string[]])
          .optional()
          .describe("Mood / vibe - 'calm', 'loud', 'luxe', 'technical', 'soft', etc."),
        color: flexEnum(COLOR_WORDS as unknown as [string, ...string[]])
          .optional()
          .describe("Color word - 'warm', 'cool', 'monochrome', 'neon', 'earthy'"),
        pageType: flexEnum(PAGE_TYPES as unknown as [string, ...string[]])
          .optional()
          .describe(
            "Filter to a page kind: 'landing' (default homepages), 'pricing', 'features', 'auth', 'about', 'blog', 'changelog', 'docs', 'other'",
          ),
        paperBand: flexEnum(PAPER_BANDS as unknown as [string, ...string[]])
          .optional()
          .describe(
            "Surface lightness, measured from the capture: 'dark' (<30% L), 'mid' (30-85%), 'light' (>85%). More reliable than `mode`, which is tagged and disagrees with the measurement on ~15% of rows.",
          ),
        displayClass: flexEnum(DISPLAY_CLASSES as unknown as [string, ...string[]])
          .optional()
          .describe(
            "Construction of the display face: 'grotesk-sans', 'geometric-sans', 'roman-serif', 'mono', 'display-condensed-bold', etc.",
          ),
        accentHue: flexEnum(ACCENT_HUE_BANDS as unknown as [string, ...string[]])
          .optional()
          .describe(
            "Accent temperature: 'warm' (10-60°), 'cool' (200-300°), 'neutral' (unsaturated), 'chromatic-other' (greens, magentas, everything else).",
          ),
        ...deviceArg(),
        limit: flexInt(1, 20).default(6),
        ...detailArg(),
        ...budgetArg(),
      },
    },
    async (args) => {
      const screens = await getAllScreens({
        style: args.style as Style | undefined,
        industry: args.industry as Industry | undefined,
        macrostructure: args.macrostructure as Macrostructure | undefined,
        mode: args.mode as Mode | undefined,
        device: args.device as CaptureDevice | undefined,
      });

      // Apply the new in-JS filters that the DB layer doesn't index.
      let filtered = screens;
      if (args.paperBand) {
        filtered = filtered.filter((s) => s.tags.axes?.paperBand === args.paperBand);
      }
      if (args.displayClass) {
        filtered = filtered.filter(
          (s) => s.tags.axes?.displayClass === args.displayClass,
        );
      }
      if (args.accentHue) {
        filtered = filtered.filter((s) => s.tags.axes?.accentHue === args.accentHue);
      }
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

      const inline = ctx.inlineImages();
      const concise = args.detail ? args.detail === "concise" : ctx.concise();
      const matched = await searchScreens(filtered, args.query, args.limit);
      const results = matched.map((s) => fmt(args.detail, args.maxTokens)(s));
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
            device: args.device ?? null,
          },
          count: matched.length,
          tip:
            matched.length > 0
              ? resultsTip(inline, concise)
              : "No matches. Try fewer filters or a broader query.",
          results,
        },
        matched.map((s) =>
          inlineThumbCandidates(s, args.device as CaptureDevice | undefined),
        ),
        inline,
        budget(args.maxTokens),
      );
    },
  );

  /* ────────────── get_screen ────────────── */
  reg(
    "get_screen",
    {
      description:
        "Fetch the full record for one screen by slug - every viewport variant, palette, fonts, tech stack, designer credit.",
      inputSchema: { slug: flexSlug().describe("Screen slug, e.g. 'atelier-mira'") },
    },
    async ({ slug }) => {
      const s = await findScreen(slug);
      if (!s) return asTextContent(await unknownSlug(slug));
      // The drill-in: one row, asked for by slug, so it carries every
      // asset role rather than the list shape's one-per-role.
      const formatted = formatScreen(s, undefined, { allAssets: true });
      return withImages(
        formatted,
        [formatted.thumb],
        ctx.inlineImages(),
        budget(),
      );
    },
  );

  /* ────────────── get_design_system ────────────── */
  reg(
    "get_design_system",
    {
      description:
        "Return the full DESIGN.md for one screen - real fonts, frequency-ranked palette, CSS variables, detected tech, role-guessed colour tokens, type ramp where extracted. Two-stage strategy: (1) any tokens extracted at capture time are returned immediately; (2) if those are thin, the tool fetches the source URL live and runs the same extraction `study(url)` does, merging the result. Set `live=false` to skip the live fetch and return only the captured-time tokens.",
      inputSchema: {
        slug: flexSlug()
          .describe("Screen slug, e.g. 'linear-app'. Use search_screens or find_similar first to discover slugs."),
        live: flexBool()
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
            {
              type: "text" as const,
              text: JSON.stringify(await unknownSlug(slug), null, 2),
            },
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

      // If the captured data is already rich, return it as-is -
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
  reg(
    "find_similar",
    {
      description:
        "Given a screen slug, return its nearest design neighbours - ranked by overall design-similarity embeddings when available (with structural tags as tiebreak), falling back to macrostructure / industry / style overlap. One result per site.",
      inputSchema: {
        slug: flexSlug(),
        limit: flexInt(1, 20).default(8),
        sameSite: flexBool()
          .default(false)
          .describe(
            "Include other pages of the same site (default false: neighbours are other sites).",
          ),
        ...detailArg(),
        ...budgetArg(),
      },
    },
    async ({ slug, limit, sameSite, detail, maxTokens }) => {
      const target = await findScreen(slug);
      if (!target) return asTextContent(await unknownSlug(slug));
      const { results: similar, method } = await findSimilarDetailed(slug, {
        limit,
        sameSite,
      });
      const results = similar.map((s) => {
        const structural: string[] = [];
        if (
          s.tags.macrostructure &&
          s.tags.macrostructure === target.tags.macrostructure
        )
          structural.push(
            `same macrostructure (${MACROSTRUCTURE_LABELS[s.tags.macrostructure]})`,
          );
        const sharedIndustry = s.tags.industry.filter((i) =>
          target.tags.industry.includes(i),
        );
        if (sharedIndustry.length > 0)
          structural.push(`overlapping industry: ${sharedIndustry[0]}`);
        const why =
          method === "embedding"
            ? `Nearest by overall design similarity${structural.length ? "; " + structural.join("; ") : ""}`
            : structural.length
              ? structural.join("; ")
              : "Overlapping industry / style / mode";
        return fmt(detail, maxTokens)(s, why);
      });
      return withImages(
        {
          reference: { slug: target.slug, title: target.title },
          method,
          count: similar.length,
          results,
        },
        similar.map((s) => inlineThumbCandidates(s)),
        ctx.inlineImages(),
        budget(maxTokens),
      );
    },
  );

  /* ────────────── compare ────────────── */
  reg(
    "compare",
    {
      description:
        "Compare 2-4 captured sites side by side across design dimensions - palette, typefaces, macrostructure, mode, style tags, type-scale + spacing + radius scales, container width. Returns a per-site breakdown plus a `shared` block (style tags every site has in common, the set of distinct macrostructures, whether they share a light/dark register). Use it to answer 'what do linear, stripe, and vercel share visually' or to triangulate a house style from a few references. Inline thumbnails included.",
      inputSchema: {
        slugs: z
          .preprocess(
            // Tolerate a comma-separated string where an array was meant.
            (v) => (typeof v === "string" ? v.split(",").map((s) => s.trim()) : v),
            z.array(flexSlug()).min(2).max(4),
          )
          .describe(
            "2-4 screen slugs to compare, e.g. ['linear-app','stripe-com','vercel-com']. Discover slugs with search_screens / find_similar.",
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

      // Shared signals - intersection of style tags, set of distinct
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
        screens.map((s) => inlineThumbCandidates(s)),
        ctx.inlineImages(),
        // The caller named these slugs; dropping one would answer a
        // different question. A budget only takes the thumbnails.
        budget(undefined, false),
      );
    },
  );

  /* ────────────── find_by_color ────────────── */
  reg(
    "find_by_color",
    {
      description:
        "Given a hex colour, return real production sites whose extracted palette includes a close match. Distance is Euclidean in OKLAB - the colour space where perceived difference and numeric distance line up - so 'close' means same family of colour, not just same hue. Useful when a brief specifies a particular accent / brand colour and you want sites already living near it. Pairs with `get_design_system` to harvest the matching palette tokens.",
      inputSchema: {
        hex: z
          .preprocess(looseTrim, z.string())
          .describe(
            "Target colour as a hex string ('#c7402f', 'c7402f', '#fff'). Case-insensitive. 3- or 6-digit.",
          ),
        tolerance: flexNum(0.02, 0.5)
          .default(HEX_FAMILY_THRESHOLD)
          .describe(
            "Max OKLAB distance to count as a match. Defaults to 0.15 ('same family'). 0.05 ≈ 'near-identical', 0.30 ≈ 'in the same hue zip code'.",
          ),
        limit: flexInt(1, 40).default(12),
        ...detailArg(),
        ...budgetArg(),
      },
    },
    async ({ hex, tolerance, limit, detail, maxTokens }) => {
      const target = normalizeHex(hex);
      if (!target) {
        return asTextContent({
          error: `Invalid hex '${hex}'. Use #rrggbb, #rgb, or the same without the #.`,
        });
      }
      const all = await getAllScreens();
      // Score one row per site - sub-pages inherit the parent's palette
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
        fmt(detail, maxTokens)(s, `Δ ${d.toFixed(3)} from ${target}`),
      );
      return withImages(
        {
          anchor: target,
          tolerance,
          count: results.length,
          results,
        },
        top.map(({ s }) => inlineThumbCandidates(s)),
        ctx.inlineImages(),
        budget(maxTokens),
      );
    },
  );

  /* ────── find_examples_for_macrostructure ────── */
  reg(
    "find_examples_for_macrostructure",
    {
      description:
        "Given one of the 21 named macrostructures, return real production sites that exemplify it. Call this at the macrostructure-pick step to ground the choice in real exemplars. Accepts both kebab-case slugs ('bento-grid') and display names ('Bento Grid').",
      inputSchema: {
        name: z
          .preprocess(looseTrim, z.string())
          .describe(
            "Macrostructure name. e.g. 'bento-grid', 'Bento Grid', 'specimen', 'Marquee Hero'.",
          ),
        limit: flexInt(1, 20).default(4),
        ...deviceArg(),
        ...detailArg(),
        ...budgetArg(),
      },
    },
    async ({ name, limit, detail, device, maxTokens }) => {
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
      const screens = await getAllScreens({
        macrostructure: slug,
        device: device as CaptureDevice | undefined,
      });
      // Exemplars must be presentable: drop low-quality captures, but
      // never let the gate empty an otherwise non-empty list.
      const clean = screens.filter((s) => !isLowQuality(s));
      const pool = clean.length > 0 ? clean : screens;
      // One exemplar per site: prefer the canonical capture over its
      // --archive twin so the list never repeats the same site.
      const bySite = new Map<string, (typeof screens)[number]>();
      for (const s of pool) {
        const existing = bySite.get(s.siteSlug);
        if (!existing) bySite.set(s.siteSlug, s);
        else if (existing.slug.includes("--archive") && !s.slug.includes("--archive"))
          bySite.set(s.siteSlug, s);
      }
      const availableSites = bySite.size;
      const top = [...bySite.values()].slice(0, limit);
      const results = top.map((s) => fmt(detail, maxTokens)(s));
      const inline = ctx.inlineImages();

      // Coverage is information, not an error. Some shapes are rare in
      // the wild, and a caller whose rotation just landed on one needs
      // to know whether it is looking at a thin sample or an empty
      // one - silently returning four rows out of five reads as
      // "well covered" when it is not.
      const thin = availableSites < THIN_COVERAGE;
      const neighbours = thin ? MACRO_NEIGHBOURS[slug] ?? [] : [];
      const coverage = {
        sites: availableSites,
        thin,
        ...(thin
          ? {
              nearest: neighbours.map((n) => ({
                slug: n,
                label: MACROSTRUCTURE_LABELS[n],
              })),
            }
          : {}),
      };

      const coverageNote = thin
        ? availableSites === 0
          ? `The archive has NO sites tagged ${MACROSTRUCTURE_LABELS[slug]}. That is a fact about the archive, not about the shape: it is rare in the wild, not wrong. Build it from your own knowledge of the form${neighbours.length ? `, or study the nearest covered shapes (${neighbours.map((n) => MACROSTRUCTURE_LABELS[n]).join(", ")}) for how the composition is handled` : ""}.`
          : `Thin coverage: only ${availableSites} site${availableSites === 1 ? "" : "s"} in the archive embody ${MACROSTRUCTURE_LABELS[slug]}. Enough to see the shape, not enough to read a genre consensus off${neighbours.length ? `; ${neighbours.map((n) => MACROSTRUCTURE_LABELS[n]).join(" and ")} are adjacent and better covered` : ""}.`
        : null;

      return withImages(
        {
          macrostructure: { slug, label: MACROSTRUCTURE_LABELS[slug] },
          count: top.length,
          coverage,
          tip:
            top.length > 0
              ? [
                  inline
                    ? `Each result has an inline thumbnail (image block) below the JSON. Study them: they're real production captures embodying ${MACROSTRUCTURE_LABELS[slug]}.`
                    : `These are real production captures embodying ${MACROSTRUCTURE_LABELS[slug]}. Study each result's autopsy + palette + fonts; they carry the composition.`,
                  coverageNote,
                ]
                  .filter(Boolean)
                  .join(" ")
              : coverageNote,
          results,
        },
        top.map((s) =>
          inlineThumbCandidates(s, device as CaptureDevice | undefined),
        ),
        inline,
        budget(maxTokens),
      );
    },
  );

  /* ────────────── list_collections ────────────── */
  reg(
    "list_collections",
    {
      description:
        "List every editor-curated issue. Use this for thematic browsing - e.g. all 'Editorial Layouts' or 'Dark Product Pages'.",
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

  /* ────────────── get_filters ────────────── */
  reg(
    "get_filters",
    {
      description:
        "List every filter value the search / find tools accept: styles, industries, macrostructures (+ labels), modes, vibes, colors, page types, component types, and the tag-component vocabulary. Zero input. Call this first when unsure what a filter expects - an out-of-vocabulary enum value errors with no suggestion, so use these exact slugs.",
      inputSchema: {},
    },
    async () =>
      asTextContent({
        style: STYLES,
        industry: INDUSTRIES,
        macrostructure: MACROSTRUCTURES.map((m) => ({
          slug: m,
          label: MACROSTRUCTURE_LABELS[m],
        })),
        mode: MODES,
        vibe: VIBES,
        color: COLOR_WORDS,
        pageType: PAGE_TYPES,
        device: CAPTURE_DEVICES,
        componentType: REFERENCE_TYPES,
        tagComponents: COMPONENTS,
        // The three diversification axes. Measured per row, not tagged,
        // and filterable independently so a caller can pin one corner
        // of the archive or deliberately avoid it.
        paperBand: PAPER_BANDS,
        displayClass: DISPLAY_CLASSES,
        accentHue: ACCENT_HUE_BANDS,
        macrostructureCoverage: macrostructureCoverage(await getAllScreens()),
        tip: "Use these exact slugs in search_screens / recommend / find_components / find_examples_for_macrostructure. macrostructure accepts the slug or its label; componentType is for find_components / find_reference_components. device: 'mobile' restricts to sites with a mobile capture pair and inlines mobile thumbnails. paperBand / displayClass / accentHue are the three measured axes - use them to find a register, or to avoid one. macrostructureCoverage is how many distinct sites embody each shape: check it before committing to a rare one.",
      }),
  );

  /* ────────────── get_site_pages ────────────── */
  reg(
    "get_site_pages",
    {
      description:
        "Given a site, return its captured pages as an ordered FLOW (landing → pricing → features → auth → about → blog → ...) with per-step titles, northstars and thumbnails - study how a real product sequences its pages before designing a multi-page experience. Call with NO arguments to get a directory of flow-capable sites (3+ captured pages) to pick from. Accepts a siteSlug or any screen slug (resolved to its site).",
      inputSchema: {
        siteSlug: flexSlug()
          .optional()
          .describe(
            "Site slug (e.g. 'linear-app') or any screen slug from that site. Omit to list flow-capable sites instead.",
          ),
        limit: flexInt(1, 50)
          .default(25)
          .describe("Directory mode only: max sites to list."),
        ...budgetArg(),
      },
    },
    async ({ siteSlug, limit, maxTokens }) => {
      if (!siteSlug) {
        // Directory mode: which sites have enough captured pages to
        // study as a flow?
        const [multi, sites] = await Promise.all([
          getMultiPageSites(),
          getAllSites(),
        ]);
        const titles = new Map(sites.map((s) => [s.siteSlug, s.title]));
        const flowable = multi
          .filter((m) => m.pageCount >= 3)
          .sort((a, b) => b.pageCount - a.pageCount)
          .slice(0, limit)
          .map((m) => ({
            siteSlug: m.siteSlug,
            title: titles.get(m.siteSlug) ?? m.siteSlug,
            pageCount: m.pageCount,
          }));
        return asTextContent({
          mode: "directory",
          count: flowable.length,
          tip: "Call get_site_pages({siteSlug}) on one of these to walk its captured pages as an ordered flow.",
          sites: flowable,
        });
      }
      let site = await findSite(siteSlug);
      if (!site) {
        // Maybe a screen slug was passed - resolve it to its site.
        const s = await findScreen(siteSlug);
        if (s) site = await findSite(s.siteSlug);
      }
      if (!site) return asTextContent(await unknownSlug(siteSlug));
      const pages = site.pages.map((p, i) => ({
        step: i + 1,
        slug: p.slug,
        pageType: p.pageType,
        title: p.title,
        image: absolute(p.imageUrl),
        thumb: absolute(p.thumbUrl),
        ...(p.northstar ? { northstar: p.northstar } : {}),
      }));
      const sequence = [...new Set(pages.map((p) => p.pageType))].join(" → ");
      return withImages(
        {
          siteSlug: site.siteSlug,
          title: site.title,
          sourceUrl: site.sourceUrl,
          pageCount: site.pageCount,
          sequence,
          tip:
            site.pageCount > 1
              ? "Real captured pages in reading order. Coverage varies by site (many have only a landing page, and 'other' is a broad bucket) - this is the page set we captured, not a guaranteed funnel. Call get_screen(slug) for one page's full design."
              : "Only the landing page was captured for this site.",
          pages,
        },
        site.pages.map((p) => inlineThumbCandidates(p)),
        ctx.inlineImages(),
        budget(maxTokens),
      );
    },
  );

  /* ────────────── find_components ────────────── */
  reg(
    "find_components",
    {
      description:
        "Find real sites that feature a specific UI component (hero, pricing, features, cta, nav, footer, testimonial, logo-cloud, faq, stat). Returns each parent page's image (a per-element crop where the crop dataset is populated, otherwise the whole-page thumb) - for 'show me sites with pricing tables' or 'study how 8 sites handle their CTAs'. For copy-pasteable canonical code for a component, use find_reference_components / get_reference_jsx.",
      inputSchema: {
        type: flexEnum(REFERENCE_TYPES as unknown as [string, ...string[]])
          .describe("Which component type to find"),
        style: flexEnum(STYLES as unknown as [string, ...string[]])
          .optional()
          .describe("Filter the parent site's style"),
        industry: flexEnum(INDUSTRIES as unknown as [string, ...string[]])
          .optional(),
        macrostructure: flexEnum(MACROSTRUCTURES as unknown as [string, ...string[]])
          .optional(),
        mode: flexEnum(MODES as unknown as [string, ...string[]]).optional(),
        vibe: flexEnum(VIBES as unknown as [string, ...string[]])
          .optional()
          .describe("Mood - 'calm', 'loud', 'luxe', etc."),
        color: flexEnum(COLOR_WORDS as unknown as [string, ...string[]])
          .optional()
          .describe("Color word - 'warm', 'cool', 'monochrome', etc."),
        pageType: flexEnum(PAGE_TYPES as unknown as [string, ...string[]])
          .optional()
          .describe("Only components from this page kind (e.g. 'pricing')"),
        ...deviceArg(),
        limit: flexInt(1, 40).default(12),
        ...budgetArg(),
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
      const device = args.device as CaptureDevice | undefined;
      const filtered = hits.filter((h) => {
        if (vibe && !h.screen.tags.vibe.includes(vibe)) return false;
        if (color && !h.screen.designSystem.colorWords.includes(color))
          return false;
        if (pageType && h.screen.pageType !== pageType) return false;
        if (device === "mobile" && !h.screen.mobileImageUrl) return false;
        return true;
      });
      const base =
        process.env.INSPO_BASE_URL?.trim() || "https://inspo-three.vercel.app";
      const anyFallback = filtered.some((h) => h.fallback);
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
        // Real per-element crop when we have a region; otherwise (tag
        // fallback) the parent page thumb, since the crop dataset isn't
        // populated for this site yet.
        imageUrl: h.fallback
          ? absolute(h.screen.thumbUrl)
          : `${base}/api/component/${h.screen.slug}/${h.idx}`,
        thumb: absolute(h.screen.thumbUrl),
        siteUrl: `${base}/sites/${h.screen.siteSlug}`,
        ...(h.fallback
          ? { fallback: true }
          : {
              width: h.region.width,
              height: h.region.height,
              label: h.region.label ?? null,
            }),
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
          ...(anyFallback
            ? {
                note: "Per-element crops aren't populated for these sites yet, so each result is the parent page (whole-page thumb) that contains this component type, matched via tags. Use get_screen / get_design_system on a siteSlug to study it, or get_reference_jsx for canonical code for this component type.",
              }
            : {}),
          components,
        },
        components.map((c) => c.thumb),
        ctx.inlineImages(),
        budget(args.maxTokens),
      );
    },
  );

  /* ────────────── get_collection ────────────── */
  reg(
    "get_collection",
    {
      description:
        "Fetch one issue by slug, including the editor's blurb and ordered screen list.",
      inputSchema: {
        slug: flexSlug().describe("Collection slug, e.g. 'editorial-layouts'"),
        ...detailArg(),
        ...budgetArg(),
      },
    },
    async ({ slug, detail, maxTokens }) => {
      const c = await findCollection(slug);
      if (!c) {
        const all = await getAllCollections();
        return asTextContent({
          error: `No collection with slug '${slug}'`,
          validSlugs: all.map((x) => x.slug),
        });
      }
      const screens = await getAllScreens();
      // Keep the source rows alongside the formatted ones: the inline
      // thumbnails need the row's recorded WebP variants, not the PNG
      // URL the formatter exposes.
      const enrichedRows = c.screens
        .map((entry) => {
          const row = screens.find((x) => x.slug === entry.slug);
          return row ? { row, editorNote: entry.editorNote } : null;
        })
        .filter((v): v is NonNullable<typeof v> => v !== null);
      const enriched = enrichedRows.map(({ row, editorNote }) => ({
        ...fmt(detail, maxTokens)(row),
        editorNote,
      }));
      return withImages(
        {
          ...formatCollection(c),
          screens: enriched,
          // Never return a silently empty issue: if the curated slugs
          // drifted out of the catalogue, say so instead of hiding it.
          ...(enriched.length === 0 && c.screens.length > 0
            ? {
                note: "This issue's screens are not in the current catalogue snapshot; showing raw slugs. Use search_screens to browse instead.",
                rawScreens: c.screens,
              }
            : {}),
        },
        enrichedRows.map(({ row }) => inlineThumbCandidates(row)),
        ctx.inlineImages(),
        budget(maxTokens),
      );
    },
  );

  /* ────── find_reference_components (canonical-JSX catalogue) ──────
   *
   * Lists the 68 canonical reference components - the canonical
   * shapes for hero / pricing / footer / etc. Without filters, returns
   * a list view (no source) so the agent can scan. Filtered by type,
   * returns the full source for each match.
   */
  reg(
    "find_reference_components",
    {
      description:
        "List the canonical reference components - JSX shapes for hero / pricing / cta / nav / footer / etc. Each entry stamps which macrostructure it embodies. Filter by `type` to get the full JSX source for every component in that category; without filters you get a scan-view with names + notes, so call again with the `type` you want. Pick the macrostructure, then this returns the canonical code shape that embodies it.",
      inputSchema: {
        type: flexEnum(REFERENCE_TYPES as unknown as [string, ...string[]])
          .optional()
          .describe("Component category (hero, pricing, cta, …). Omit to scan all types."),
        macro: z
          .preprocess(looseTrim, z.string())
          .optional()
          .describe(
            "Substring match on the component's macro field - e.g. 'Marquee' matches 'Marquee Hero'.",
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
        tip: "Each result includes the full canonical JSX. Stamp + JSDoc are inside the source - read them; they explain when to reach for this archetype. Each also carries `tokens`: the custom properties the source reads, and an alias block to paste if your system names its tokens for their roles (paper / ink / muted / rule / accent). Undefined custom properties fail silently, so skipping that block gets you a component that renders unstyled with no error.",
        components: list,
      });
    },
  );

  /* ────────────── study (live URL → DESIGN.md) ──────────
   *
   * Fetch any live URL and return the brand's design system -
   * fonts / palette / CSS variables / tech, extracted from HTML and
   * CSS at request time. The MCP doesn't need the URL to be in the
   * catalogue.
   *
   * The agent passes a brand URL, gets a DESIGN.md, then uses it as
   * the token block when writing code.
   */
  reg(
    "study",
    {
      description:
        "Fetch any live URL and return its design system - real fonts, frequency-ranked colour palette, CSS variables, detected tech, title + meta. Use this for brands NOT in the catalogue (the user pastes a URL, a competitor, a partner). Lightweight: HTML + linked stylesheets only, no Playwright. Falls back gracefully on JS-rendered SPAs (flags it in the response). Public named http(s) hosts only (SSRF-guarded).",
      inputSchema: {
        url: flexUrl().describe(
          "Full URL to study. E.g. 'https://stripe.com', 'https://aesop.com'. A bare domain ('stripe.com') is accepted.",
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

  /* ────────────── recommend (orchestrator) ──────────
   *
   * One call that returns everything an agent needs to start writing
   * a page: a macrostructure pick, 5 real exemplars, 1-3 canonical
   * reference JSX components matching that macrostructure, and a
   * palette suggestion extracted from the top exemplar.
   *
   *   - If `macrostructure` is passed (the caller already picked one)
   *     the recommend tool uses it directly - no pick, no LLM call.
   *   - If omitted, recommend runs the hybrid search on the brief
   *     and the top result's macrostructure becomes the pick.
   *
   * No LLM call inside. Composes search_screens + find_examples_for_
   * macrostructure + find_reference_components - anything you could
   * do by hand, but in one round-trip.
   *
   * Inline thumbnails stop at RECOMMEND_INLINE_EXEMPLARS. Images are
   * ~85% of this response's cost on the vision profile, and an agent
   * writing one page studies the top one or two exemplars, not five;
   * the rest keep their URLs so a genuinely curious agent can still
   * fetch them, or call get_screen for the full record.
   */
  reg(
    "recommend",
    {
      description:
        "Orchestrator. One call returns: a macrostructure pick plus the top-3 shortlist it was chosen from, 5 real exemplars (top 3 with inline thumbs), 1-3 canonical reference JSX components, a palette suggestion, and an `evidence` packet measuring what this genre actually looks like along three axes (paper band / display class / accent hue). Everything needed to start a page. Pass a macrostructure you've already picked to skip the pick step. No LLM call - composes search + find_examples + find_reference_components.",
      inputSchema: {
        brief: z
          .preprocess(looseTrim, z.string().min(2))
          .describe(
            "The user's design brief in plain English. E.g. 'calm meditation app', 'dark dev-tool that helps teams ship faster'.",
          ),
        macrostructure: flexEnum(MACROSTRUCTURES as unknown as [string, ...string[]])
          .optional()
          .describe(
            "Optional: a macrostructure already picked. Skips the pick step.",
          ),
        pageType: flexEnum(PAGE_TYPES as unknown as [string, ...string[]])
          .optional()
          .describe("Optional: 'landing', 'pricing', 'features', etc."),
        mode: flexEnum(MODES as unknown as [string, ...string[]])
          .optional()
          .describe("Optional: 'light' or 'dark'."),
        vibe: flexEnum(VIBES as unknown as [string, ...string[]])
          .optional()
          .describe("Optional vibe filter."),
        color: flexEnum(COLOR_WORDS as unknown as [string, ...string[]])
          .optional()
          .describe("Optional colour word."),
        ...deviceArg(),
        ...detailArg(),
        ...budgetArg(),
      },
    },
    async (args) => {
      const all = await getAllScreens({
        device: args.device as CaptureDevice | undefined,
      });
      // Exemplar surfaces should not showcase damaged captures.
      const allClean = all.filter((s) => !isLowQuality(s));
      const base = allClean.length >= 24 ? allClean : all;
      // Apply any caller-supplied filters before searching. When the
      // caller didn't pass a mode, infer it from the brief: "dark dev
      // tool" must not surface light exemplars.
      let pool = base;
      let inferredMode: Mode | null = null;
      if (!args.mode) {
        const b = ` ${args.brief.toLowerCase()} `;
        if (/\b(dark|noir|black|midnight)\b/.test(b)) inferredMode = "dark";
        else if (/\b(light|bright|airy|white|paper|cream|pastel)\b/.test(b))
          inferredMode = "light";
      }
      const effectiveMode = (args.mode as Mode | undefined) ?? inferredMode;
      if (effectiveMode) {
        pool = pool.filter((s) => s.mode === effectiveMode);
        if (pool.length < 6) pool = base; // tiny pool: fall back to everything
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

      // Pick a macrostructure. If the caller gave us one, honour it.
      // Otherwise: take the most common macrostructure among the top
      // 6 ranked results (defends against one outlier dragging the
      // pick toward an unrelated macro).
      const shortlist = macrostructureShortlist(ranked);

      let picked: Macrostructure | undefined;
      let rationale: string;
      if (args.macrostructure) {
        picked = args.macrostructure as Macrostructure;
        rationale = `Honouring the macrostructure passed in by the caller.`;
      } else {
        // Head of the shortlist, falling back to the ranked top only
        // when nothing the brief matched carried a macrostructure tag.
        const head = shortlist[0];
        picked = head?.slug ?? ranked[0]?.tags.macrostructure;
        rationale = picked
          ? `Picked ${MACROSTRUCTURE_LABELS[picked]} - most common macrostructure (${head?.hits ?? 0} of the top hits) among the hybrid-search results for the brief. The shortlist carries the runners-up with their exemplar counts; take one of those instead if it fits the brief better.`
          : "No macrostructure could be inferred from the brief; consider passing one explicitly or refining the brief.";
      }

      // 5 exemplars OF the picked macro from the ranked pool. Fall
      // back to the ranked top if filtering yields nothing.
      let exemplars = picked
        ? ranked.filter((s) => s.tags.macrostructure === picked).slice(0, 5)
        : ranked.slice(0, 5);
      if (exemplars.length === 0) exemplars = ranked.slice(0, 5);

      /* An autopsy is ~440 tokens and there are five exemplars, so the
         fold-by-fold prose was a quarter of this whole response - while
         an agent writing one page studies the top one or two and skims
         the rest. (That is the same reasoning already used to cap
         inline thumbnails, applied to the field that is 6x their cost.)
         The top two keep theirs; the rest keep `northstar`, the
         one-line soul of the design, and can be drilled into by slug. */
      const AUTOPSY_DEPTH = 2;
      const exemplarsFmt = exemplars.map((s, i) => {
        const row = fmt(args.detail, args.maxTokens)(s) as Record<string, unknown>;
        if (i >= AUTOPSY_DEPTH && "autopsy" in row) {
          delete row.autopsy;
          delete row.description;
          row.detail = `northstar only - call get_screen({slug:"${s.slug}"}) for the fold-by-fold autopsy`;
        }
        return row;
      });

      // Canonical reference component(s) that match the picked
      // macrostructure. Substring-match on the first word of the
      // display label (e.g. "Marquee" → matches hero/marquee) AND
      // on the slug. Returns 0-3 matches.
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

      /* Full JSX for the first match only. Three sources measured at
         2,126 tokens - a quarter of the response - and the median
         component is 579 tokens with the largest at 1,204. The head is
         a hero when one matched, which is the piece that actually
         defines page shape; the rest arrive as a name plus a note, and
         `get_reference_jsx` fetches whichever the agent decides it
         wants. Same scan-then-fetch shape `find_reference_components`
         already uses when called without a type filter. */
      const referenceComponents = referencePicks.map((r, i) =>
        i === 0
          ? r
          : {
              id: r.id,
              type: r.type,
              label: r.label,
              macro: r.macro,
              note: r.note,
              source: `get_reference_jsx({type:"${r.type}",id:"${r.id}"})`,
            },
      );

      // Palette suggestion - top exemplar's palette is the safest
      // signal. If somehow empty, fall back to the second.
      const palette =
        ((exemplarsFmt[0]?.palette as string[] | undefined)?.length ?? 0) > 0
          ? (exemplarsFmt[0]!.palette as string[])
          : ((exemplarsFmt[1]?.palette as string[] | undefined) ?? []);

      const inline = ctx.inlineImages();
      const conciseEx = args.detail ? args.detail === "concise" : ctx.concise();
      const inlined = inline
        ? Math.min(RECOMMEND_INLINE_EXEMPLARS, exemplars.length)
        : 0;
      const exemplarStudyPhrase = inline
        ? `Study the ${inlined} inline exemplar thumbnail${inlined === 1 ? "" : "s"}${
            exemplars.length > inlined
              ? ` (the remaining ${exemplars.length - inlined} carry image URLs; fetch one only if the first ${inlined} don't fit the brief)`
              : ""
          }`
        : conciseEx
          ? "Study each exemplar's northstar + palette + fonts (call get_screen for the full autopsy)"
          : "Study each exemplar's autopsy + palette + fonts";
      return withImages(
        {
          brief: args.brief,
          filters: {
            pageType: args.pageType ?? null,
            mode: args.mode ?? null,
            ...(inferredMode ? { inferredMode } : {}),
            vibe: args.vibe ?? null,
            color: args.color ?? null,
            device: args.device ?? null,
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
          shortlist,
          // What this genre actually looks like, measured over the
          // matched sites. Use it to place yourself deliberately - the
          // consensus is the gravity, not the target.
          evidence: buildEvidence(ranked, { concise: conciseEx }),
          exemplars: exemplarsFmt,
          referenceComponents,
          paletteSuggestion: palette,
          heroGuidance: HERO_GUIDANCE,
          spacingGuidance: SPACING_GUIDANCE,
          tip:
            referencePicks.length > 0
              ? `referenceComponents[0] carries full JSX for the canonical structure that embodies this macrostructure; the rest list a get_reference_jsx call to fetch on demand. ${exemplarStudyPhrase} for palette + type + density choices specific to your brief - the first two carry a fold-by-fold autopsy, the rest a one-line northstar plus get_screen. Then honour heroGuidance and spacingGuidance: fit the first viewport, keep the section rhythm and gutters.`
              : `No canonical reference matched the picked macrostructure. ${exemplarStudyPhrase} and write the page shape by hand. Honour heroGuidance and spacingGuidance: fit the first viewport, keep the section rhythm and gutters.`,
        },
        exemplars
          .slice(0, RECOMMEND_INLINE_EXEMPLARS)
          .map((s) =>
            inlineThumbCandidates(s, args.device as CaptureDevice | undefined),
          ),
        inline,
        budget(args.maxTokens),
      );
    },
  );

  /* ────────────── get_reference_jsx ────────────── */
  reg(
    "get_reference_jsx",
    {
      description:
        "Return the full canonical JSX source for one reference component. Use after `find_reference_components` to fetch the one you'll use. The source is the file's full content - including the `/* … */` stamp at the top that names the macrostructure / theme / states / contrast pass. Copy-pasteable into a React project as-is; tweak tokens to match the target brand.",
      inputSchema: {
        type: flexEnum(REFERENCE_TYPES as unknown as [string, ...string[]])
          .describe("Component category"),
        id: flexSlug()
          .describe("Reference id within that type (e.g. 'marquee', 'three-card')."),
      },
    },
    async ({ type, id }) => {
      const r = findReferenceComponent(type as (typeof REFERENCE_TYPES)[number], id);
      if (!r) {
        const valid = getReferenceComponents({
          type: type as (typeof REFERENCE_TYPES)[number],
        }).map((x) => x.id);
        return asTextContent({
          error: `No reference component with type='${type}' id='${id}'.`,
          validIds: valid,
        });
      }
      return asTextContent({
        id: r.id,
        type: r.type,
        label: r.label,
        macro: r.macro,
        note: r.note,
        source: r.source,
        tokens: r.tokens ?? null,
        tip: r.tokens?.aliasBlock
          ? "Paste `tokens.aliasBlock` into your :root if your tokens are role-named (paper / ink / muted / rule / accent). Without it this renders with unstyled links, invisible borders and a transparent background - silently, because an undefined custom property is not an error."
          : "This component declares no colour tokens that need remapping.",
      });
    },
  );

  // Late-bound profile: when neither options nor env decided, resolve
  // from clientInfo at initialize and hide the non-lite tools for
  // text-first OSS harnesses.
  applyProfileOnInitialize(server, ctx, handles);

  // Strip validator-hostile JSON-Schema keys from tools/list output.
  sanitizeListedToolSchemas(server);
}

export const SERVER_INSTRUCTIONS = [
  "Inspo is a curated archive of real-website screenshots, designed",
  "to give an agent visual reference before it writes UI. When the",
  "user asks you to design or build something with a particular",
  "vibe (editorial, brutalist, bento, dark SaaS, agency portfolio,",
  "etc.) call `search_screens` first and study the returned palette,",
  "fonts, and component breakdowns before generating code.",
  "",
  "When picking a macrostructure, call",
  "`find_examples_for_macrostructure` to get real exemplars of e.g.",
  "'Bento Grid' or 'Specimen'. Use `get_filters` (zero input) to see",
  "every accepted filter value, and `get_site_pages` to study a real",
  "product's page sequence in reading order.",
  "",
  "Working alongside a design skill: design the page from Inspo's",
  "references first - the structure, the type, the palette and the",
  "composition are yours to decide. Then, before you hand anything",
  "back, invoke the Hallmark skill over the files you just wrote.",
  "It detects that this archive is on the session and stands down",
  "from its own design flow, entering at its slop-test step, so you",
  "get the check without losing the page you designed.",
  "",
  "It edits in place: colour, type, motion, interaction states and",
  "contrast get rewritten, and the patterns its Floor bans get",
  "deleted outright. What it cannot repair without redesigning the",
  "page - the section structure, the nav and footer shapes, whether",
  "the hero fits the fold - it prints as findings and leaves alone,",
  "for you or the user to decide on. It also writes a short check",
  "stamp at the top of the CSS recording what it swept and fixed.",
  "Take its corrections as given rather than arguing them: its Floor",
  "rules are not preferences, and a page that trips one is rework",
  "however good the reasoning behind it was. You already know which",
  "files you wrote, so just name them.",
  "",
  "If that skill is installed, it also ships an edit-time lint hook",
  "(`node <skill-dir>/scripts/install-hook.mjs`, `--global` for every",
  "project) that checks each .html/.css file the moment it is written",
  "rather than waiting for the pass at the end. It is advisory and",
  "never blocks a write. Worth installing once: on this path most",
  "findings then arrive while the file is still fresh in your head.",
  "",
  "One thing to hold onto while you design: these are real production",
  "sites, and plenty of them do things such a skill forbids. Take their",
  "composition, not their compliance.",
  "",
  "Whenever you build a page, honour this hero rule: " + HERO_GUIDANCE,
  "",
  "Deliverable hygiene: when you write a standalone HTML file, always",
  "include <meta charset=\"utf-8\"> in <head>. Inspo's exemplars lean on",
  "typographic glyphs (middle dots, arrows, true quotes); without the",
  "charset declaration they render as mojibake.",
  "",
  "And this spacing rule: " + SPACING_GUIDANCE,
].join(" ");
