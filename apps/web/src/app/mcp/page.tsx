import Link from "next/link";
import type { Metadata } from "next";
import { Dateline } from "@/components/dateline";

export const metadata: Metadata = {
  title: "MCP",
  description:
    "Install Inspo as an MCP server for Claude Code, Cursor, Codex, and Zed. Your agent gains taste.",
};

const tools = [
  {
    name: "search_screens",
    sig: "(query, filters?, limit=8)",
    desc: "Natural-language search over the archive. Returns curated screenshots, palettes, fonts, and component breakdowns.",
    example: 'search_screens("dark editorial agency hero", { mode: "dark" })',
  },
  {
    name: "get_screen",
    sig: "(id)",
    desc: "Full record for a single screen — every viewport variant, the curator note, the linked sources.",
    example: 'get_screen("atelier-mira")',
  },
  {
    name: "find_similar",
    sig: "(id_or_url, limit=8)",
    desc: "Visual + structural similarity. Hand it a screen you like; get its neighbours.",
    example: 'find_similar("compass-bento")',
  },
  {
    name: "find_examples_for_macrostructure",
    sig: '(name: "Bento" | "Specimen" | …)',
    desc: "Hallmark-aware. Pass any of the 21 named macrostructures and get real production sites that exemplify it. Made to be called from the Hallmark skill.",
    example: 'find_examples_for_macrostructure("Bento Grid")',
    accent: true,
  },
  {
    name: "list_collections",
    sig: "()",
    desc: "All editor-curated issues, in publication order.",
    example: "list_collections()",
  },
  {
    name: "get_collection",
    sig: "(slug)",
    desc: "One issue with the editor's blurb and ordered screens.",
    example: 'get_collection("editorial-layouts")',
  },
];

const clients = [
  { name: "Claude Code", config: "~/.claude.json" },
  { name: "Cursor", config: "~/.cursor/mcp.json" },
  { name: "Codex", config: "~/.codex/config.toml" },
  { name: "Zed", config: "~/.config/zed/settings.json" },
  { name: "VS Code (Copilot)", config: ".vscode/mcp.json" },
];

export default function MCPPage() {
  return (
    <div className="mx-auto max-w-[120rem] px-6 sm:px-10">
      {/* Header ───────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-y-8 pt-16 pb-16 sm:pt-24 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-2">
          <Dateline label="For agents" />
        </div>
        <div className="lg:col-span-10">
          <h1 className="font-display max-w-[18ch] text-balance text-5xl leading-[1] tracking-tight sm:text-6xl lg:text-[6.5rem]">
            Your agent doesn&rsquo;t have taste.{" "}
            <em className="italic">Lend it some.</em>
          </h1>
          <p className="mt-10 max-w-[58ch] text-xl leading-relaxed text-[var(--color-fg-muted)]">
            Inspo is an MCP server. Install it once and Claude Code, Cursor,
            Codex, and Zed gain a small set of tools that hand the model real,
            curated screenshots — palettes, typefaces, component breakdowns —
            before it writes a line.
          </p>
        </div>
      </section>

      {/* Install ─────────────────────────────────────────── */}
      <section className="border-t rule pt-12 pb-24">
        <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-2">
            <p className="text-meta">Install</p>
            <p className="text-meta mt-2 max-w-[18ch]">
              One command. Authenticates in the browser.
            </p>
          </div>
          <div className="lg:col-span-10">
            <pre className="overflow-x-auto border rule bg-[color-mix(in_oklab,var(--color-fg)_4%,var(--color-bg))] px-5 py-4 font-mono text-sm leading-relaxed">
              <code className="text-[var(--color-fg)]">{"$ npx inspo init"}</code>
              {"\n"}
              <code className="text-[var(--color-fg-muted)]">
                {"  ✓ detected Claude Code, Cursor"}
              </code>
              {"\n"}
              <code className="text-[var(--color-fg-muted)]">
                {"  ✓ added inspo MCP server"}
              </code>
              {"\n"}
              <code className="text-[var(--color-fg-muted)]">
                {"  → opening browser to authenticate…"}
              </code>
            </pre>

            <ul className="mt-8 grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
              {clients.map((c) => (
                <li key={c.name} className="border-l rule pl-3">
                  <p className="text-sm">{c.name}</p>
                  <p className="text-meta">{c.config}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Tool reference ──────────────────────────────────── */}
      <section className="border-t rule pt-12 pb-24">
        <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-2">
            <p className="text-meta">Tools exposed</p>
            <p className="text-meta mt-2 max-w-[20ch]">
              Six. Sharp. Returns URLs, not base64 — agents fetch only what
              they need.
            </p>
          </div>

          <ul className="space-y-12 lg:col-span-10">
            {tools.map((t) => (
              <li key={t.name}>
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <code
                    className={`font-mono text-2xl ${
                      t.accent ? "text-[var(--color-link)]" : ""
                    }`}
                  >
                    {t.name}
                  </code>
                  <code className="font-mono text-sm text-[var(--color-fg-muted)]">
                    {t.sig}
                  </code>
                </div>
                <p className="mt-3 max-w-[68ch] text-[var(--color-fg-muted)]">
                  {t.desc}
                </p>
                <pre className="mt-4 overflow-x-auto border rule px-4 py-3 font-mono text-sm">
                  <code>{t.example}</code>
                </pre>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Hallmark ────────────────────────────────────────── */}
      <section className="border-y rule pt-12 pb-24">
        <div className="grid grid-cols-1 gap-y-8 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-2">
            <p className="text-meta">Pairs with</p>
          </div>

          <div className="lg:col-span-10">
            <h2 className="font-display max-w-[20ch] text-balance text-4xl leading-tight tracking-tight sm:text-5xl">
              Hallmark gives the agent a process.{" "}
              <em className="italic">Inspo gives it the reference.</em>
            </h2>
            <p className="mt-6 max-w-[60ch] text-[var(--color-fg-muted)]">
              The{" "}
              <a
                href="https://github.com/Luffixos/hallmark"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-fg)] underline-offset-4 hover:text-[var(--color-link)] hover:underline"
              >
                Hallmark skill
              </a>{" "}
              forces the agent through a design-context gate and asks it to
              pick one of 21 named macrostructures —{" "}
              <em className="italic">Bento, Specimen, Manifesto, Workbench…</em>
              — before writing code. With Inspo installed, the same agent can
              call <code className="font-mono text-[0.95em] text-[var(--color-fg)]">find_examples_for_macrostructure</code>{" "}
              at that exact step and get four real production sites that
              embody it. Process and reference, in one prompt. Both stacks
              run on{" "}
              <a
                href="https://www.together.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-fg)] underline-offset-4 hover:text-[var(--color-link)] hover:underline"
              >
                Together AI
              </a>.
            </p>

            <pre className="mt-8 overflow-x-auto border rule px-5 py-4 font-mono text-sm leading-relaxed">
              <code className="text-[var(--color-fg-muted)]">{"// Inside a Hallmark run"}</code>
              {"\n"}
              <code>{'agent.call("find_examples_for_macrostructure", { name: "Bento Grid" })'}</code>
              {"\n"}
              <code className="text-[var(--color-fg-muted)]">{"// → 4 real sites the agent can study before generating one"}</code>
            </pre>

            <p className="text-meta mt-8">
              <Link
                href="/screens?macro=bento-grid"
                className="hover:text-[var(--color-link)]"
              >
                See Bento Grid examples in the archive →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Posture */}
      <section className="pt-16 pb-24">
        <div className="grid grid-cols-1 gap-y-6 lg:grid-cols-12 lg:gap-x-10">
          <p className="text-meta lg:col-span-2">Free. Open.</p>
          <div className="lg:col-span-10 space-y-4">
            <p className="font-display max-w-[40ch] text-3xl leading-tight">
              Inspo is open source, MIT, owned and operated by{" "}
              <a
                href="https://www.together.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-4 hover:text-[var(--color-link)] hover:underline"
              >
                Together&nbsp;AI
              </a>
              . Free for everyone. No tiers, no paywall.
            </p>
            <p className="text-meta">
              <Link href="/about" className="hover:text-[var(--color-link)]">
                About + self-host →
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
