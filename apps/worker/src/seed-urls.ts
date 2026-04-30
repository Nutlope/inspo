/**
 * Seed catalogue — hand-picked production websites (2024–2026)
 * spanning industries, design moods, and Hallmark macrostructures.
 * Editorial choices, not exhaustive — sites the design community
 * already considers reference-quality, plus a layer of hidden gems
 * that exemplify specific Hallmark macrostructures.
 *
 * Curators: edit this file, then `pnpm capture:seed` from repo root.
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
  { url: "https://www.cloudflare.com", note: "Edge platform; dense home." },
  { url: "https://modal.com", note: "Compute; technical/midnight." },
  { url: "https://replicate.com", note: "AI hosting; bento-led." },
  { url: "https://attio.com", note: "CRM; soft/salon-ish." },
  { url: "https://www.raycast.com", note: "Launcher; component-playground vibe." },
  { url: "https://arc.net", note: "Browser; portrait-of-product." },
  { url: "https://granola.ai", note: "AI notes; minimal, soft." },
  { url: "https://resend.com", note: "Email API; dark + technical/midnight." },
  { url: "https://n8n.io", note: "Workflow automation; dense bento." },
  { url: "https://www.val.town", note: "Cloud functions; loud, brutal." },
  { url: "https://bun.com", note: "JS runtime; raw, bold display type." },
  { url: "https://deno.com", note: "JS runtime; soft + technical." },
  { url: "https://htmx.org", note: "Minimal frontend; brutalist + index-first." },
  { url: "https://biomejs.dev", note: "JS toolchain; technical + clean." },
  { url: "https://www.cursor.com", note: "AI IDE; portrait-of-product." },
  { url: "https://zed.dev", note: "Editor; technical/midnight." },
  { url: "https://www.warp.dev", note: "Terminal; dark + bento." },
  { url: "https://gitbutler.com", note: "Git client; soft + portrait." },
  { url: "https://graphite.dev", note: "Code review; serious + stat-led." },
  { url: "https://posthog.com", note: "Analytics; loud + bento, hand-drawn." },
  { url: "https://sentry.io", note: "Errors; dark, dense product." },
  { url: "https://liveblocks.io", note: "Realtime collab; soft + bento." },
  { url: "https://e2b.dev", note: "Sandboxes for AI; technical." },
  { url: "https://cleanshot.com", note: "Mac screenshot tool; soft + product." },

  // ── AI / research labs / consumer ─────────────────────────────
  { url: "https://www.together.ai", note: "Inference platform; powers our stack." },
  { url: "https://huggingface.co", note: "Open-weights hub; dense + index-first." },
  { url: "https://www.anthropic.com", note: "AI lab; editorial newsprint." },
  { url: "https://openai.com", note: "AI; clean swiss / index-first." },
  { url: "https://mistral.ai", note: "AI; technical/almanac." },
  { url: "https://www.perplexity.ai", note: "Search AI; bento + dark." },
  { url: "https://runwayml.com", note: "Creative AI; photographic." },
  { url: "https://groq.com", note: "Inference; dark + bold." },
  { url: "https://elevenlabs.io", note: "Voice AI; soft + photographic." },
  { url: "https://suno.com", note: "Music AI; loud + photographic." },
  { url: "https://www.midjourney.com", note: "Image AI; quiet + index-first." },
  { url: "https://pika.art", note: "Video AI; bold + photographic." },
  { url: "https://claude.ai", note: "Claude product; editorial soft." },
  { url: "https://pi.ai", note: "Inflection's Pi; soft + manifesto." },
  { url: "https://lovable.dev", note: "AI builder; bento + product." },
  { url: "https://v0.dev", note: "AI UI gen; component-playground." },
  { url: "https://bolt.new", note: "AI builder; portrait-of-product." },
  { url: "https://www.dust.tt", note: "AI workspace; soft + product." },

  // ── Fintech ────────────────────────────────────────────────────
  { url: "https://mercury.com", note: "Banking; quote-led + soft." },
  { url: "https://ramp.com", note: "Spend; stat-led." },
  { url: "https://stripe.com", note: "Payments; gradient-driven." },
  { url: "https://monzo.com", note: "Bank; loud + photographic." },
  { url: "https://www.brex.com", note: "Spend; technical/midnight." },

  // ── Agency / studio (well-known) ──────────────────────────────
  { url: "https://locomotive.ca", note: "Agency; specimen + scroll." },
  { url: "https://hellomonday.com", note: "Agency; portfolio grid." },
  { url: "https://studio.design", note: "Studio; portfolio grid." },
  { url: "https://merci-michel.com", note: "Studio; photographic." },
  { url: "https://pentagram.com", note: "Pentagram; index-first design archive." },
  { url: "https://work.co", note: "Work & Co; editorial agency." },
  { url: "https://www.collins.is", note: "Collins; bold + manifesto." },
  { url: "https://area17.com", note: "Area 17; portfolio grid." },
  { url: "https://www.instrument.com", note: "Instrument; portfolio." },
  { url: "https://2x4.org", note: "2x4; editorial brand archive." },

  // ── Designer / engineer portfolios (gems) ─────────────────────
  { url: "https://www.robin-noguier.com", note: "Portfolio; portfolio-grid + photo." },
  { url: "https://www.vanschneider.com", note: "Tobias van Schneider; manifesto." },
  { url: "https://daniel.do", note: "Designer portfolio; long document." },
  { url: "https://rauno.me", note: "Rauno Freiberg; technical micro-interactions." },
  { url: "https://emilkowal.ski", note: "Emil Kowalski; animation portfolio." },
  { url: "https://paco.me", note: "Paco Coursey; soft + minimal." },
  { url: "https://tobiasahlin.com", note: "Tobias Ahlin; long-document blog." },
  { url: "https://lynnandtonic.com", note: "Lynn Fisher; experimental yearly redesign." },
  { url: "https://read.cv", note: "Read.cv; soft + portfolio platform." },
  { url: "https://leerob.com", note: "Lee Robinson; minimal long-document." },
  { url: "https://luca.computer", note: "Luca; experimental portfolio." },
  { url: "https://www.shadcn.com", note: "shadcn; technical/almanac." },
  { url: "https://craigmod.com", note: "Craig Mod; long-document journal." },

  // ── Type foundries ────────────────────────────────────────────
  { url: "https://ohnotype.co", note: "OH no Type; specimen + playful." },
  { url: "https://klim.co.nz", note: "Klim Type Foundry; editorial specimen." },
  { url: "https://www.typotheque.com", note: "Typotheque; specimen + dense." },
  { url: "https://www.fontshare.com", note: "Fontshare; soft + index-first." },
  { url: "https://commercialtype.com", note: "Commercial Type; specimen." },
  { url: "https://abcdinamo.com", note: "Dinamo; experimental specimen." },
  { url: "https://displaay.net", note: "Displaay; quiet specimen." },
  { url: "https://pangrampangram.com", note: "Pangram Pangram; specimen + bold." },

  // ── Editorial / archive / media / culture ─────────────────────
  { url: "https://www.are.na", note: "Network of ideas; editorial newsprint." },
  { url: "https://mubi.com", note: "Cinema; photographic + manifesto." },
  { url: "https://a24films.com", note: "Cinema; photographic / catalogue." },
  { url: "https://www.itsnicethat.com", note: "Editorial; long-document magazine." },
  { url: "https://thecreativeindependent.com", note: "Long-form; long-document." },
  { url: "https://works.studio", note: "Editorial agency; specimen." },
  { url: "https://www.e-flux.com", note: "Art journal; brutalist editorial." },
  { url: "https://www.frieze.com", note: "Art magazine; editorial." },
  { url: "https://kottke.org", note: "Kottke; long-document blog." },
  { url: "https://daringfireball.net", note: "Daring Fireball; brutal long-document." },

  // ── Music labels ──────────────────────────────────────────────
  { url: "https://4ad.com", note: "4AD; photographic + catalogue." },
  { url: "https://warp.net", note: "Warp Records; editorial brand." },
  { url: "https://ninjatune.net", note: "Ninja Tune; bold + photographic." },
  { url: "https://pitchfork.com", note: "Pitchfork; editorial magazine." },

  // ── E-commerce / hospitality (high design) ────────────────────
  { url: "https://www.glossier.com", note: "Beauty; soft/salon." },
  { url: "https://www.aesop.com", note: "Aesop; quiet editorial commerce." },
  { url: "https://www.buly1803.com", note: "Buly 1803; vintage editorial." },
  { url: "https://www.snowpeak.com", note: "Snow Peak; photographic outdoor." },
  { url: "https://www.freitag.ch", note: "Freitag; brutalist commerce." },
  { url: "https://www.patagonia.com", note: "Patagonia; editorial mission-led." },

  // ── Tools / design systems / open source ──────────────────────
  { url: "https://www.notion.com", note: "Productivity; soft, conversational-FAQ." },
  { url: "https://www.figma.com", note: "Design tool; bento-grid." },
  { url: "https://www.framer.com", note: "Design tool; component-playground." },
  { url: "https://magicui.design", note: "Component-playground macrostructure." },
  { url: "https://ui.shadcn.com", note: "Component-playground; technical/almanac." },
  { url: "https://once.tools", note: "Tools list; index-first." },
  { url: "https://tldraw.com", note: "Whiteboard; component-playground." },
  { url: "https://excalidraw.com", note: "Drawing; soft + product." },

  // ── Mission / climate ─────────────────────────────────────────
  { url: "https://watershed.com", note: "Carbon platform; serious + stat-led." },
  { url: "https://www.allbirds.com", note: "Sustainable shoes; soft commerce." },
];

if (seedUrls.length < 100) {
  // Sanity check at module load.
  console.warn(`[seed-urls] expected 100+, got ${seedUrls.length}`);
}
