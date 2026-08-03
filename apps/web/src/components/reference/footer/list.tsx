/* Inspo · component: footer · genre: editorial · theme: Inspo-paper
 * archetype: Ft1 Index · diversification: differs from Statement on
 *   density (high vs airy) + structure (typographic list vs proclamation)
 * states: default + hover (every link gets accent shift)
 * contrast: pass (46-50)
 */

import Link from "next/link";

/**
 * Index footer - a hand-set table of contents at the foot of a long
 * scroll. Numbered, mono, no underlines. Reads like the back-matter of
 * a magazine. Good for sites with deep content (docs, archives, atlases)
 * where the footer needs to navigate, not narrate.
 */
const SECTIONS = [
  { num: "01", label: "The archive", href: "/screens", note: "1,000 captures" },
  { num: "02", label: "Components", href: "/components", note: "Patterns, sliced" },
  { num: "03", label: "Collections", href: "/collections", note: "Editor's issues" },
  { num: "04", label: "MCP server", href: "/mcp", note: "For Claude Code, Cursor, …" },
  { num: "05", label: "About", href: "/about", note: "Open source, Together AI" },
];

export function FooterList() {
  return (
    <footer className="border-t rule bg-[var(--color-bg)] px-8 py-14 sm:px-14">
      <p className="text-meta">Index</p>
      <ul className="mt-6 grid grid-cols-1 gap-y-2">
        {SECTIONS.map((s) => (
          <li key={s.num}>
            <Link
              href={s.href}
              className="group grid grid-cols-[3rem_1fr_auto] items-baseline gap-x-6 border-b rule py-3 transition-colors"
            >
              <span className="font-mono text-meta text-[var(--color-fg-muted)]">
                {s.num}
              </span>
              <span className="font-display text-2xl leading-tight transition-colors group-hover:text-[var(--color-link)] sm:text-3xl">
                {s.label}
              </span>
              <span className="text-meta hidden text-right text-[var(--color-fg-muted)] sm:inline">
                {s.note}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="text-meta mt-10">
        © {new Date().getFullYear()} · MIT · Together AI
      </p>
    </footer>
  );
}
