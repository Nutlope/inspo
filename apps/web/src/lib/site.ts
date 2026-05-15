export const site = {
  name: "Inspo",
  marker: "Nº",
  tagline: "A thousand websites worth studying.",
  description:
    "A reference layer for AI coding agents — a thousand real production sites, twenty-eight canonical reference components, and a DESIGN.md per site, all queryable from one MCP server.",
  issue: {
    number: "01",
    date: "04 — 2026",
    title: "Editorial Layouts",
  },
  colophon: {
    typefaces: ["Fraunces", "Inter Tight", "JetBrains Mono"],
    stack: ["Next.js", "Tailwind", "Postgres", "Together AI"],
    year: new Date().getFullYear(),
  },
  nav: [
    { label: "Archive", href: "/screens" },
    { label: "Components", href: "/components" },
    { label: "MCP", href: "/mcp" },
    { label: "About", href: "/about" },
  ],
} as const;
