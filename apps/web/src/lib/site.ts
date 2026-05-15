export const site = {
  name: "Inspo",
  marker: "Nº",
  tagline: "A thousand websites worth studying.",
  // bumped 2026-05-15 to force a deploy with blob URLs live.
  description:
    "A thousand real production sites, filed by hand. Browse here, or query the catalogue from your coding agent over MCP.",
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
