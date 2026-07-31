export const site = {
  name: "Inspo",
  marker: "Nº",
  tagline: "Real websites worth studying.",
  description:
    "A reference layer for AI coding agents - real production sites with desktop and mobile captures, canonical reference components, and a DESIGN.md per site, all queryable from one MCP server.",
  issue: {
    number: "01",
    date: "04 - 2026",
    title: "Editorial Layouts",
  },
  colophon: {
    typefaces: ["Fraunces", "Inter Tight"],
    stack: ["Next.js", "Tailwind", "Postgres", "Together AI"],
    year: new Date().getFullYear(),
  },
  nav: [
    { label: "Archive", href: "/screens" },
    { label: "Examples", href: "/examples" },
    { label: "Map", href: "/map" },
    { label: "MCP", href: "/mcp" },
    { label: "About", href: "/about" },
  ],
  github: {
    owner: "Luffixos",
    repo: "inspo",
    url: "https://github.com/Luffixos/inspo",
  },
  // Where DMCA / takedown requests land (see /dmca).
  contact: {
    dmca: "speedyoussef@gmail.com",
  },
} as const;
