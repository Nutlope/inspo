import type { NextRequest } from "next/server";
import { findScreen } from "@inspo/db";

/**
 * Stylized SVG placeholder generator.
 *
 * Renders each screen as a stylized "site mockup" using its own palette,
 * so the gallery feels populated before real screenshots land. Every
 * screen has a deterministic-but-distinct composition seeded from its
 * slug, so reloads are stable.
 */

type Variant = "hero" | "full" | "thumb";
type RouteParams = { slug: string; variant: string };
const VARIANTS: readonly Variant[] = ["hero", "full", "thumb"];
const isVariant = (v: string): v is Variant => (VARIANTS as readonly string[]).includes(v);

const VIEWPORT = {
  hero: { w: 1440, h: 900 },
  thumb: { w: 600, h: 450 },
  full: { w: 1440, h: 3600 },
} as const;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let s = seed || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function render(
  slug: string,
  variant: Variant,
  palette: string[],
  title: string,
  mode: "light" | "dark",
) {
  const { w, h } = VIEWPORT[variant];
  const r = rng(hash(slug + variant));

  const [bg, ink, accent, neutral] = [
    palette[0] ?? (mode === "dark" ? "#0E0E0C" : "#F4F1EC"),
    palette[1] ?? (mode === "dark" ? "#E8E4DD" : "#1A1A1A"),
    palette[2] ?? "#C7402F",
    palette[3] ?? (mode === "dark" ? "#2A2825" : "#D8D3C8"),
  ];

  const isFull = variant === "full";
  const padX = Math.round(w * 0.08);
  const navY = Math.round(h * (isFull ? 0.012 : 0.05));
  const heroTop = Math.round(h * (isFull ? 0.08 : 0.22));
  const heroH = Math.round(h * (isFull ? 0.18 : 0.4));

  // Hero text width — varied by slug for compositional variety
  const headlineW = Math.round((w - padX * 2) * (0.55 + r() * 0.35));
  const subW = Math.round((w - padX * 2) * (0.35 + r() * 0.2));

  // Decide a composition flavour
  const flavour = Math.floor(r() * 5);
  // 0 = stat strip, 1 = bento, 2 = feature trio, 3 = single image, 4 = manifesto

  let body = "";
  const sectionTop = heroTop + heroH + Math.round(h * 0.06);
  const usableW = w - padX * 2;

  if (isFull) {
    // For full-page, stack multiple sections of varied flavours
    let y = sectionTop;
    for (let i = 0; y < h - 200 && i < 8; i++) {
      const f = (flavour + i) % 5;
      y = drawSection(f, y);
    }
  } else {
    drawSection(flavour, sectionTop);
  }

  function drawSection(f: number, y: number): number {
    let next = y;
    if (f === 0) {
      // stat strip — 4 big numbers
      const cols = 4;
      const gap = 24;
      const cellW = Math.round((usableW - gap * (cols - 1)) / cols);
      const cellH = Math.round(cellW * 0.5);
      for (let i = 0; i < cols; i++) {
        const x = padX + i * (cellW + gap);
        body += `<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" fill="${neutral}" opacity="0.5"/>`;
        body += `<rect x="${x + 24}" y="${y + 24}" width="${Math.round(cellW * 0.5)}" height="${Math.round(cellH * 0.4)}" fill="${ink}" opacity="0.85"/>`;
        body += `<rect x="${x + 24}" y="${y + 24 + Math.round(cellH * 0.45)}" width="${Math.round(cellW * 0.7)}" height="6" fill="${ink}" opacity="0.5"/>`;
      }
      next = y + cellH + 96;
    } else if (f === 1) {
      // bento — varied tile sizes
      const rowH = 200;
      const gap = 16;
      // row 1: big + small + small
      const big = Math.round(usableW * 0.55) - gap;
      const small = Math.round((usableW - big - gap * 2) / 2);
      body += `<rect x="${padX}" y="${y}" width="${big}" height="${rowH * 1.2}" fill="${accent}" opacity="0.85"/>`;
      body += `<rect x="${padX + big + gap}" y="${y}" width="${small}" height="${rowH * 0.55}" fill="${neutral}"/>`;
      body += `<rect x="${padX + big + gap + small + gap}" y="${y}" width="${small}" height="${rowH * 0.55}" fill="${ink}" opacity="0.9"/>`;
      body += `<rect x="${padX + big + gap}" y="${y + rowH * 0.6}" width="${small * 2 + gap}" height="${rowH * 0.6}" fill="${neutral}" opacity="0.6"/>`;
      next = y + rowH * 1.3 + 64;
    } else if (f === 2) {
      // feature trio
      const cols = 3;
      const gap = 32;
      const cellW = Math.round((usableW - gap * (cols - 1)) / cols);
      const cellH = Math.round(cellW * 0.85);
      for (let i = 0; i < cols; i++) {
        const x = padX + i * (cellW + gap);
        body += `<rect x="${x}" y="${y}" width="${cellW}" height="${Math.round(cellH * 0.55)}" fill="${neutral}"/>`;
        body += `<rect x="${x}" y="${y + cellH * 0.6}" width="${Math.round(cellW * 0.7)}" height="14" fill="${ink}" opacity="0.85"/>`;
        body += `<rect x="${x}" y="${y + cellH * 0.65 + 16}" width="${Math.round(cellW * 0.95)}" height="6" fill="${ink}" opacity="0.4"/>`;
        body += `<rect x="${x}" y="${y + cellH * 0.65 + 28}" width="${Math.round(cellW * 0.85)}" height="6" fill="${ink}" opacity="0.4"/>`;
      }
      next = y + cellH + 96;
    } else if (f === 3) {
      // single image / photographic
      const imgH = 360;
      body += `<rect x="${padX}" y="${y}" width="${usableW}" height="${imgH}" fill="${ink}" opacity="0.92"/>`;
      body += `<rect x="${padX}" y="${y + imgH}" width="${Math.round(usableW * 0.4)}" height="40" fill="transparent"/>`;
      next = y + imgH + 96;
    } else {
      // manifesto — oversized type
      body += `<rect x="${padX}" y="${y}" width="${Math.round(usableW * 0.85)}" height="68" fill="${ink}" opacity="0.92"/>`;
      body += `<rect x="${padX}" y="${y + 84}" width="${Math.round(usableW * 0.7)}" height="68" fill="${ink}" opacity="0.92"/>`;
      body += `<rect x="${padX}" y="${y + 168}" width="${Math.round(usableW * 0.5)}" height="68" fill="${accent}" opacity="0.85"/>`;
      next = y + 280;
    }
    return next;
  }

  // Top nav
  const nav = `
    <rect x="${padX}" y="${navY}" width="120" height="14" fill="${ink}" opacity="0.9"/>
    <rect x="${w - padX - 280}" y="${navY + 4}" width="60" height="6" fill="${ink}" opacity="0.5"/>
    <rect x="${w - padX - 200}" y="${navY + 4}" width="60" height="6" fill="${ink}" opacity="0.5"/>
    <rect x="${w - padX - 120}" y="${navY + 4}" width="60" height="6" fill="${ink}" opacity="0.5"/>
    <line x1="${padX}" y1="${navY + 30}" x2="${w - padX}" y2="${navY + 30}" stroke="${ink}" stroke-opacity="0.12"/>
  `;

  // Hero — display headline + subhead + CTA
  const cta = padX + headlineW * 0.0;
  const hero = `
    <rect x="${padX}" y="${heroTop}" width="${headlineW}" height="42" rx="2" fill="${ink}" opacity="0.95"/>
    <rect x="${padX}" y="${heroTop + 56}" width="${Math.round(headlineW * 0.85)}" height="42" rx="2" fill="${ink}" opacity="0.95"/>
    <rect x="${padX}" y="${heroTop + 132}" width="${subW}" height="10" fill="${ink}" opacity="0.5"/>
    <rect x="${padX}" y="${heroTop + 150}" width="${Math.round(subW * 0.85)}" height="10" fill="${ink}" opacity="0.5"/>
    <rect x="${padX}" y="${heroTop + 200}" width="160" height="42" rx="2" fill="${accent}"/>
    <rect x="${cta + 200}" y="${heroTop + 200}" width="120" height="42" rx="2" fill="transparent" stroke="${ink}" stroke-opacity="0.7"/>
  `;

  // Footer-ish bottom rule
  const footer = `<line x1="${padX}" y1="${h - 32}" x2="${w - padX}" y2="${h - 32}" stroke="${ink}" stroke-opacity="0.15"/>`;

  // Marker label (mono caption — subtle)
  const label = `<text x="${padX}" y="${h - 8}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11" fill="${ink}" fill-opacity="0.4" letter-spacing="1">${escapeXml(title.toUpperCase())} · PLACEHOLDER</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${escapeXml(title)} placeholder">
  <rect width="${w}" height="${h}" fill="${bg}"/>
  ${nav}
  ${hero}
  ${body}
  ${footer}
  ${label}
</svg>`.trim();
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<RouteParams> },
) {
  const { slug, variant } = await ctx.params;
  const screen = await findScreen(slug);

  if (!screen || !isVariant(variant)) {
    return new Response("Not found", { status: 404 });
  }

  const svg = render(slug, variant, screen.palette, screen.title, screen.mode);

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
