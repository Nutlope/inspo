/**
 * Convert a query-layer result into the wire format the MCP returns.
 * Always returns absolute image URLs so the agent can fetch / pass to
 * a vision model directly.
 */

import type { ScreenSummary, Collection } from "@inspo/shared";
import { MACROSTRUCTURE_LABELS } from "@inspo/taxonomy";
import { absolute } from "./url";

export function formatScreen(s: ScreenSummary, why?: string) {
  return {
    slug: s.slug,
    title: s.title,
    sourceUrl: s.sourceUrl,
    designerCredit: s.designerCredit,
    capturedAt: s.capturedAt,
    image: absolute(s.imageUrl),
    fullPage: absolute(s.fullPageUrl),
    thumb: absolute(s.thumbUrl),
    // Mobile (375px) capture, when backfilled — pass both breakpoints so
    // the agent can study how the design reflows, not just the desktop.
    ...(s.mobileImageUrl ? { mobile: absolute(s.mobileImageUrl) } : {}),
    ...(s.mobileFullUrl ? { mobileFull: absolute(s.mobileFullUrl) } : {}),
    ...(s.northstar ? { northstar: s.northstar } : {}),
    ...(s.autopsy ? { autopsy: s.autopsy } : {}),
    description: s.description,
    palette: s.palette,
    fonts: s.fonts,
    tech: s.tech,
    mode: s.mode,
    tags: {
      style: s.tags.style,
      industry: s.tags.industry,
      components: s.tags.components,
      vibe: s.tags.vibe,
    },
    macrostructure: s.tags.macrostructure
      ? {
          slug: s.tags.macrostructure,
          label: MACROSTRUCTURE_LABELS[s.tags.macrostructure],
        }
      : null,
    hallmarkTheme: s.tags.hallmarkTheme ?? null,
    ...(why ? { whyThisMatches: why } : {}),
  };
}

export function formatCollection(c: Collection) {
  return {
    slug: c.slug,
    title: c.title,
    number: c.number,
    date: c.date,
    editorBlurb: c.editorBlurb,
    coverScreenSlug: c.coverScreenSlug,
    screens: c.screens.map((e) => ({
      slug: e.slug,
      editorNote: e.editorNote,
      span: e.span,
    })),
  };
}

export function asTextContent(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}

/**
 * Same JSON text payload as `asTextContent`, plus a native `image`
 * content block per provided thumbnail URL — fetched in parallel,
 * WebP-preferred with PNG fallback, in-process LRU-cached. Agents
 * see the thumbnails directly in the tool response instead of having
 * to curl each one and Read it.
 *
 * Order of image blocks matches the order of `imageUrls` (which the
 * caller is expected to pass in the same order as the `results`
 * array in `value`), so agents can correlate JSON ↔ image by index.
 *
 * Failed fetches are silently dropped — the JSON text always still
 * comes back, the agent can fall back to the URLs in the payload.
 *
 * `inline=false` (the text-first profile: most OSS harnesses either
 * drop image blocks or run text-only models) skips the fetches and
 * returns the JSON text alone.
 */
export async function withImages(
  value: unknown,
  imageUrls: ReadonlyArray<string>,
  inline = true,
) {
  if (!inline) return asTextContent(value);
  const { thumbnailBlocks, MAX_INLINE_PER_CALL } = await import("./inline-images");
  const slice = imageUrls.slice(0, MAX_INLINE_PER_CALL);
  const blocks = await thumbnailBlocks(slice);
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(value, null, 2),
      },
      ...blocks.filter((b): b is NonNullable<typeof b> => b !== null),
    ],
  };
}
