/**
 * Seed catalogue — 50 hand-picked production websites (2024–2026) spanning
 * industries, design moods, and Hallmark macrostructures. Editorial choices,
 * not exhaustive — meant to bootstrap the archive with sites the design
 * community already considers reference-quality.
 *
 * Curators: edit this file, then `pnpm capture:seed` from the repo root.
 */

export type SeedUrl = {
  url: string;
  /** Optional override slug (otherwise derived from host). */
  slug?: string;
  /** One-liner that helps when reviewing the resulting capture. */
  note?: string;
};

export const seedUrls: SeedUrl[] = [
  // ── Dev tools / SaaS ───────────────────────────────────────────
  { url: "https://linear.app", note: "Issue tracking; dark editorial product page." },
  { url: "https://vercel.com", note: "Frontend cloud; pure-black, type-led." },
  { url: "https://supabase.com", note: "Backend; bento heavy, oversized type." },
  { url: "https://neon.tech", note: "Postgres; technical/almanac." },
  { url: "https://railway.com", note: "Infra; brutalist accent on dark." },
  { url: "https://cloudflare.com", note: "Edge platform; dense home." },
  { url: "https://modal.com", note: "Compute; technical/midnight." },
  { url: "https://replicate.com", note: "AI hosting; bento-led." },
  { url: "https://attio.com", note: "CRM; soft/salon-ish." },
  { url: "https://raycast.com", note: "Launcher; component-playground vibe." },
  { url: "https://arc.net", note: "Browser; portrait-of-product." },
  { url: "https://granola.ai", note: "AI notes; minimal, soft." },
  { url: "https://resend.com", note: "Email API; dark + technical/midnight." },
  { url: "https://n8n.io", note: "Workflow automation; dense bento." },
  { url: "https://val.town", note: "Cloud functions; loud, brutal." },

  // ── AI / research labs ─────────────────────────────────────────
  { url: "https://www.anthropic.com", note: "AI lab; editorial newsprint." },
  { url: "https://openai.com", note: "AI; clean swiss / index-first." },
  { url: "https://mistral.ai", note: "AI; technical/almanac." },
  { url: "https://www.perplexity.ai", note: "Search AI; bento + dark." },
  { url: "https://runwayml.com", note: "Creative AI; photographic." },

  // ── Fintech ────────────────────────────────────────────────────
  { url: "https://mercury.com", note: "Banking; quote-led + soft." },
  { url: "https://ramp.com", note: "Spend; stat-led." },
  { url: "https://stripe.com", note: "Payments; gradient-driven." },
  { url: "https://monzo.com", note: "Bank; loud + photographic." },
  { url: "https://www.brex.com", note: "Spend; technical/midnight." },

  // ── Agency / studio ────────────────────────────────────────────
  { url: "https://locomotive.ca", note: "Agency; specimen + scroll." },
  { url: "https://hellomonday.com", note: "Agency; portfolio grid." },
  { url: "https://studio.design", note: "Studio; portfolio grid." },
  { url: "https://merci-michel.com", note: "Studio; photographic." },
  { url: "https://www.toomas.studio", note: "Studio; specimen + brand." },

  // ── Portfolio ──────────────────────────────────────────────────
  { url: "https://www.robin-noguier.com", note: "Portfolio; portfolio-grid + photo." },
  { url: "https://exo.ape", note: "Tobias van Schneider; manifesto." },
  { url: "https://kosintsev.com", note: "Designer portfolio; index-first." },
  { url: "https://daniel.do", note: "Designer portfolio; long document." },

  // ── Editorial / archive / media ────────────────────────────────
  { url: "https://www.are.na", note: "Network of ideas; editorial newsprint." },
  { url: "https://mubi.com", note: "Cinema; photographic + manifesto." },
  { url: "https://a24films.com", note: "Cinema; photographic / catalogue." },
  { url: "https://www.itsnicethat.com", note: "Editorial; long-document magazine." },
  { url: "https://thecreativeindependent.com", note: "Long-form; long-document." },
  { url: "https://works.studio", note: "Editorial agency; specimen." },

  // ── E-commerce / hospitality ───────────────────────────────────
  { url: "https://www.studio-arhoj.com", note: "Ceramics; photographic + warm." },
  { url: "https://www.glossier.com", note: "Beauty; soft/salon." },
  { url: "https://www.tableware.studio", note: "Goods; soft/linen." },
  { url: "https://aplaceofmyown.shop", note: "Furniture; editorial soft." },

  // ── Education / non-profit / museum ────────────────────────────
  { url: "https://www.notion.com", note: "Productivity; soft, conversational-FAQ." },
  { url: "https://www.figma.com", note: "Design tool; bento-grid." },
  { url: "https://www.framer.com", note: "Design tool; component-playground." },

  // ── Tools that exemplify Hallmark macrostructures (intentional picks)
  { url: "https://magicui.design", note: "Component-playground macrostructure." },
  { url: "https://ui.shadcn.com", note: "Component-playground; technical/almanac." },
  { url: "https://once.tools", note: "Tools list; index-first." },
];

if (seedUrls.length !== 50) {
  // Sanity check at module load — easier to spot edits that break the count.
  console.warn(`[seed-urls] expected 50, got ${seedUrls.length}`);
}
