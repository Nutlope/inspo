/**
 * Server profiles: tune the tool surface and response shape to the
 * connecting harness, so the same server works for Claude Code AND for
 * open-source-model harnesses (Kimi CLI, OpenCode, Cline, Roo, ...).
 *
 * Two independent axes:
 *
 *   profile  "full" | "lite"
 *     full: all 16 tools (today's behaviour).
 *     lite: the 9 highest-leverage tools. Small models degrade as the
 *     tool count grows (selection accuracy falls off past ~10 tools),
 *     and most OSS harnesses are used with small-to-mid models.
 *
 *   images   "thumbs" | "none"
 *     thumbs: inline WebP/PNG thumbnail blocks in tool results.
 *     none: text-only responses. Most OSS harnesses either drop MCP
 *     image blocks before the model sees them (Cline, OpenCode with a
 *     non-vision model) or pair the harness with text-only models
 *     (MiniMax, DeepSeek). Text-only also keeps a search inside a few
 *     KB instead of a few hundred.
 *
 * Resolution order, per axis:
 *   1. explicit RegisterOptions (HTTP hosts pass ?profile= / ?images=)
 *   2. env: INSPO_PROFILE=lite|full, INSPO_IMAGES=none|thumbs
 *   3. client auto-detection from the MCP initialize clientInfo.name
 *   4. default: full + thumbs (unknown clients keep today's behaviour)
 *
 * Client detection is best-effort substring matching and only an
 * auto-default; the env vars always win. On the stateless HTTP
 * transport clientInfo never reaches the instance serving tools/list,
 * so remote callers use the query params instead.
 */

import type { McpServer, RegisteredTool } from "@modelcontextprotocol/sdk/server/mcp.js";

export type Profile = "full" | "lite";
export type ImagesMode = "thumbs" | "none";

export interface RegisterOptions {
  profile?: Profile;
  images?: ImagesMode;
  /** Per-tool-call metrics hook (name, success, duration). Wired by
   *  the hosted Worker into Analytics Engine; stdio/npm servers pass
   *  nothing, so local users emit zero telemetry. Must never throw
   *  into the response path (callers wrap it defensively anyway). */
  onToolCall?: (m: { tool: string; ok: boolean; ms: number }) => void;
}

/** The lite tool surface. Everything an agent needs to go from brief
 *  to page: orchestrate (recommend), browse (search_screens), drill in
 *  (get_screen), harvest tokens (get_design_system, study), pick a
 *  macrostructure (find_examples_for_macrostructure), and grab canonical
 *  code (find_reference_components, which returns full JSX when
 *  filtered by type). */
export const LITE_TOOLS: ReadonlySet<string> = new Set([
  "recommend",
  "search_screens",
  "get_screen",
  "get_design_system",
  "find_examples_for_macrostructure",
  "find_reference_components",
  "study",
  "get_site_pages",
  "get_filters",
]);

/** Harnesses that are predominantly used with OSS models AND either
 *  drop MCP image content before the model sees it or are commonly
 *  paired with text-only models. Get lite + no inline images. */
const TEXT_FIRST_CLIENTS = [
  "kimi",
  "opencode",
  "open-code",
  "cline",
  "roo",
  "crush",
  "goose",
  "aider",
  "continue",
  "droid",
  "factory",
  "iflow",
] as const;

/** OSS-model harnesses with a working image-in-tool-result path
 *  (per their docs). Get the lite tool surface but keep thumbnails. */
const VISION_LITE_CLIENTS = ["kilo", "qwen"] as const;

function parseProfile(v: string | undefined): Profile | null {
  const s = v?.trim().toLowerCase();
  return s === "lite" || s === "full" ? s : null;
}

function parseImages(v: string | undefined): ImagesMode | null {
  const s = v?.trim().toLowerCase();
  if (s === "none" || s === "off" || s === "text") return "none";
  if (s === "thumbs" || s === "on") return "thumbs";
  return null;
}

export interface ServerContext {
  /** Profile when it is knowable before the client connects
   *  (options or env). null means "decide per client at initialize". */
  staticProfile: Profile | null;
  profile(): Profile;
  inlineImages(): boolean;
  /** True when list results should default to the lean concise shape
   *  (the text-only profile, images=none). Overridable per call via a
   *  `detail` arg. Keeps a search a few hundred tokens for small models. */
  concise(): boolean;
}

export function createServerContext(
  server: McpServer,
  opts: RegisterOptions = {},
): ServerContext {
  const env = typeof process !== "undefined" ? process.env : undefined;
  const staticProfile = opts.profile ?? parseProfile(env?.INSPO_PROFILE) ?? null;
  const staticImages = opts.images ?? parseImages(env?.INSPO_IMAGES) ?? null;

  const clientName = (): string => {
    try {
      return server.server.getClientVersion()?.name?.toLowerCase() ?? "";
    } catch {
      return "";
    }
  };
  const isTextFirst = () => {
    const n = clientName();
    return n !== "" && TEXT_FIRST_CLIENTS.some((c) => n.includes(c));
  };
  const isVisionLite = () => {
    const n = clientName();
    return n !== "" && VISION_LITE_CLIENTS.some((c) => n.includes(c));
  };

  const inlineImages = (): boolean => {
    if (staticImages) return staticImages === "thumbs";
    if (isTextFirst()) return false;
    return true;
  };

  return {
    staticProfile,
    profile() {
      if (staticProfile) return staticProfile;
      return isTextFirst() || isVisionLite() ? "lite" : "full";
    },
    inlineImages,
    // Concise list shape is the default whenever images are off (the
    // text-only profile). Vision profiles (thumbs) keep the full shape.
    concise: () => !inlineImages(),
  };
}

/** When the profile could not be resolved statically, resolve it once
 *  the client introduces itself (initialize) and hide the non-lite
 *  tools if it lands on lite. Runs before the client's first
 *  tools/list, so no listChanged notification is needed; we flip the
 *  `enabled` flag directly instead of calling disable() to avoid
 *  spraying notifications at clients that never asked for a list yet. */
export function applyProfileOnInitialize(
  server: McpServer,
  ctx: ServerContext,
  handles: ReadonlyMap<string, RegisteredTool>,
): void {
  if (ctx.staticProfile !== null) return;
  const prev = server.server.oninitialized;
  server.server.oninitialized = () => {
    prev?.();
    if (ctx.profile() === "lite") {
      for (const [name, handle] of handles) {
        if (!LITE_TOOLS.has(name)) handle.enabled = false;
      }
    }
  };
}

/**
 * Post-process the tools/list response the SDK builds from the zod
 * shapes: strip the JSON-Schema keys that strict or quirky validators
 * choke on. `$schema` and `additionalProperties:false` are exactly the
 * keys Together's function-calling validator rejects, and they carry
 * zero signal for tool selection; several OSS stacks (vLLM/xgrammar
 * constrained decoding, Moonshot's schema linter) are happiest with
 * the bare {type, properties, required, enum, description} subset.
 *
 * Wraps the SDK's own handler rather than rebuilding it, so enabled-
 * filtering and zod conversion stay the SDK's job. Reaches into the
 * private `_requestHandlers` map (pinned SDK 1.29.x); if the internals
 * move, the worst case is schemas going out unsanitized again.
 */
export function sanitizeListedToolSchemas(server: McpServer): void {
  type Handler = (req: unknown, extra: unknown) => Promise<unknown>;
  const low = server.server as unknown as {
    _requestHandlers?: Map<string, Handler>;
  };
  const handlers = low._requestHandlers;
  if (!handlers) return;
  const orig = handlers.get("tools/list");
  if (!orig) return;
  handlers.set("tools/list", async (req, extra) => {
    const res = (await orig(req, extra)) as {
      tools?: Array<{ inputSchema?: unknown }>;
    };
    for (const t of res?.tools ?? []) {
      if (t.inputSchema) t.inputSchema = sanitizeSchema(t.inputSchema);
    }
    return res;
  });
}

function sanitizeSchema(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(sanitizeSchema);
  if (node && typeof node === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node)) {
      if (k === "$schema" || k === "additionalProperties") continue;
      out[k] = sanitizeSchema(v);
    }
    return out;
  }
  return node;
}
