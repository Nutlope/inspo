/**
 * Convert a query-layer result into the wire format the MCP returns.
 * Always returns absolute image URLs so the agent can fetch / pass to
 * a vision model directly.
 */

import type { ScreenSummary, Collection } from "@inspo/shared";
import type { CaptureDevice } from "@inspo/taxonomy";
import { MACROSTRUCTURE_LABELS } from "@inspo/taxonomy";
import { absolute } from "./url";

type RoleVariants = NonNullable<ScreenSummary["thumbVariants"]>;

/** Smallest WebP variant URL for a role, if the seed carries one. */
function smallestWebp(v: RoleVariants | undefined): string | undefined {
  const list = v?.webp;
  if (!list || list.length === 0) return undefined;
  return [...list].sort((a, b) => a.w - b.w)[0]!.url;
}

/** Largest WebP variant URL for a role, if the seed carries one. */
function largestWebp(v: RoleVariants | undefined): string | undefined {
  const list = v?.webp;
  if (!list || list.length === 0) return undefined;
  return [...list].sort((a, b) => b.w - a.w)[0]!.url;
}

/**
 * Ordered inline-thumbnail candidates for one screen: cheapest first.
 * device="mobile" prefers the mobile capture (its 384 WebP is live on
 * Blob for nearly every row); desktop prefers the seed's thumb WebP
 * variant, then the synthesized `.384.webp` sibling (inline-images
 * derives it), then the PNG thumb which always exists.
 */
export function inlineThumbCandidates(
  s: ScreenSummary,
  device?: CaptureDevice,
): string[] {
  const out: string[] = [];
  if (device === "mobile") {
    const mobileWebp = smallestWebp(s.mobileVariants);
    if (mobileWebp) out.push(absolute(mobileWebp));
    if (s.mobileImageUrl) out.push(absolute(s.mobileImageUrl));
  }
  const thumbWebp = smallestWebp(s.thumbVariants);
  if (thumbWebp) out.push(absolute(thumbWebp));
  out.push(absolute(s.thumbUrl));
  return out;
}

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
    // Small WebP variants when encoded - fetch these instead of the PNGs
    // to spend ~5x fewer bytes/tokens per image.
    ...(smallestWebp(s.thumbVariants)
      ? { thumbWebp: absolute(smallestWebp(s.thumbVariants)!) }
      : {}),
    ...(largestWebp(s.heroVariants)
      ? { imageWebp: absolute(largestWebp(s.heroVariants)!) }
      : {}),
    // Mobile (375px) capture, when backfilled - pass both breakpoints so
    // the agent can study how the design reflows, not just the desktop.
    ...(s.mobileImageUrl ? { mobile: absolute(s.mobileImageUrl) } : {}),
    ...(s.mobileFullUrl ? { mobileFull: absolute(s.mobileFullUrl) } : {}),
    ...(smallestWebp(s.mobileVariants)
      ? { mobileThumb: absolute(smallestWebp(s.mobileVariants)!) }
      : {}),
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
    theme: s.tags.hallmarkTheme ?? null,
    ...(why ? { whyThisMatches: why } : {}),
  };
}

/**
 * Lean result shape for the text-first profile (images=none). Drops the
 * long autopsy + description + full tags + tech so a multi-result search
 * stays a few hundred tokens instead of a few thousand; keeps the
 * pick-the-right-one essentials (northstar one-liner, palette, fonts,
 * mode, macrostructure, thumb). The agent drills into get_screen, or
 * passes detail:"full", for the complete breakdown.
 */
export function formatScreenConcise(s: ScreenSummary, why?: string) {
  return {
    slug: s.slug,
    title: s.title,
    sourceUrl: s.sourceUrl,
    thumb: absolute(s.thumbUrl),
    ...(smallestWebp(s.thumbVariants)
      ? { thumbWebp: absolute(smallestWebp(s.thumbVariants)!) }
      : {}),
    ...(s.mobileImageUrl ? { mobile: absolute(s.mobileImageUrl) } : {}),
    ...(smallestWebp(s.mobileVariants)
      ? { mobileThumb: absolute(smallestWebp(s.mobileVariants)!) }
      : {}),
    ...(s.northstar ? { northstar: s.northstar } : {}),
    palette: s.palette,
    fonts: s.fonts,
    mode: s.mode,
    macrostructure: s.tags.macrostructure
      ? {
          slug: s.tags.macrostructure,
          label: MACROSTRUCTURE_LABELS[s.tags.macrostructure],
        }
      : null,
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
 * content block per provided thumbnail URL - fetched in parallel,
 * WebP-preferred with PNG fallback, in-process LRU-cached. Agents
 * see the thumbnails directly in the tool response instead of having
 * to curl each one and Read it.
 *
 * Order of image blocks matches the order of `imageUrls` (which the
 * caller is expected to pass in the same order as the `results`
 * array in `value`), so agents can correlate JSON ↔ image by index.
 *
 * Failed fetches are silently dropped - the JSON text always still
 * comes back, the agent can fall back to the URLs in the payload.
 *
 * `inline=false` (the text-first profile: most OSS harnesses either
 * drop image blocks or run text-only models) skips the fetches and
 * returns the JSON text alone.
 */
export async function withImages(
  value: unknown,
  imageUrls: ReadonlyArray<string | ReadonlyArray<string>>,
  inline = true,
) {
  if (!inline) return asTextContent(value);
  const { thumbnailBlocks, MAX_INLINE_PER_CALL, MAX_INLINE_TOTAL_BYTES } =
    await import("./inline-images");
  const slice = imageUrls.slice(0, MAX_INLINE_PER_CALL);
  const fetched = await thumbnailBlocks(slice);
  const blocks = fetched.filter((b) => b !== null);
  // Enforce a total decoded-byte budget across the whole response.
  // Order is result order, so what survives is the top of the list.
  const kept: typeof blocks = [];
  let spent = 0;
  for (const b of blocks) {
    const bytes = Math.ceil((b.data.length * 3) / 4);
    if (spent + bytes > MAX_INLINE_TOTAL_BYTES && kept.length > 0) continue;
    kept.push(b);
    spent += bytes;
  }
  const dropped = blocks.length - kept.length;
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(value, null, 2),
      },
      ...kept,
      ...(dropped > 0
        ? [
            {
              type: "text" as const,
              text: `(${dropped} inline thumbnail${dropped === 1 ? "" : "s"} omitted to fit the response budget; every result still carries its image URLs.)`,
            },
          ]
        : []),
    ],
  };
}
