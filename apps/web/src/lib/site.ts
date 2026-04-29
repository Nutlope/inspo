export const site = {
  name: "Inspo",
  marker: "Nº",
  tagline: "An archive of websites, served to your agent.",
  description:
    "A curated, editorial archive of real-website screenshots. Browse the gallery — or query it from Claude Code, Cursor, and other coding agents over MCP.",
  issue: {
    number: "01",
    date: "04 — 2026",
    title: "Editorial Layouts",
  },
  colophon: {
    typefaces: ["Fraunces", "Inter Tight", "JetBrains Mono"],
    stack: ["Next.js", "Tailwind", "Postgres", "Cloudflare"],
    year: new Date().getFullYear(),
  },
  nav: [
    { label: "Archive", href: "/screens" },
    { label: "Issues", href: "/collections" },
    { label: "MCP", href: "/mcp" },
    { label: "Sign in", href: "/signin" },
  ],
} as const;
