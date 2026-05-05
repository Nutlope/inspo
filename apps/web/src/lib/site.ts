export const site = {
  name: "Inspo",
  marker: "Nº",
  tagline: "A thousand websites worth studying.",
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
    { label: "Issues", href: "/collections" },
    { label: "MCP", href: "/mcp" },
    { label: "About", href: "/about" },
    { label: "Sign in", href: "/signin" },
  ],
} as const;
