import Link from "next/link";
import type { Metadata } from "next";
import { Dateline } from "@/components/dateline";
import { McpPlayground } from "@/components/mcp-playground";
import { InstallTabs, type InstallTab } from "@/components/install-tabs";
import { getArchiveStats } from "@inspo/db";

export const metadata: Metadata = {
  title: "MCP",
  description:
    "Install Inspo as an MCP server for Claude Code, Cursor, Windsurf, Codex, and Zed. Your agent gains taste.",
};

// Counts come from the live seed; re-render at most daily.
export const revalidate = 86400;

type ToolEntry = {
  name: string;
  sig: string;
  desc: string;
  example: string;
  lite?: boolean;
  accent?: boolean;
};

const toolGroups: { group: string; tools: ToolEntry[] }[] = [
  {
    group: "Start here",
    tools: [
      {
        name: "recommend",
        sig: "(brief, filters?)",
        desc: "The orchestrator. One call returns a macrostructure pick, five real exemplars, canonical reference JSX, and a palette suggestion for a plain-English brief.",
        example: 'recommend({ brief: "calm banking app for families" })',
        lite: true,
        accent: true,
      },
    ],
  },
  {
    group: "Search",
    tools: [
      {
        name: "search_screens",
        sig: "(query, filters?, device?, limit=6)",
        desc: "Search the archive in plain language. Returns screenshots, palettes, fonts, components; device: \"mobile\" surfaces the 375px pairs.",
        example: 'search_screens("dark editorial agency hero", { mode: "dark" })',
        lite: true,
      },
      {
        name: "find_similar",
        sig: "(slug, sameSite?, limit=8)",
        desc: "Hand it a screen you like, get its nearest design neighbours, ranked by design-similarity embeddings with a tag fallback.",
        example: 'find_similar("novu-co")',
      },
      {
        name: "find_by_color",
        sig: "(hex, tolerance?)",
        desc: "Perceptual colour search in OKLAB: real sites whose extracted palette sits near a brand colour.",
        example: 'find_by_color("#C7402F")',
      },
      {
        name: "find_examples_for_macrostructure",
        sig: '(name: "Bento Grid" | "Specimen" | …)',
        desc: "Pass one of the 21 named macrostructures, get real sites that embody it.",
        example: 'find_examples_for_macrostructure("Bento Grid")',
        lite: true,
        accent: true,
      },
    ],
  },
  {
    group: "Study",
    tools: [
      {
        name: "get_screen",
        sig: "(slug)",
        desc: "One screen's full record - every viewport, the fold-by-fold autopsy, the source link.",
        example: 'get_screen("novu-co")',
        lite: true,
      },
      {
        name: "get_design_system",
        sig: "(slug, live?)",
        desc: "The DESIGN.md: real fonts, frequency-ranked palette with role guesses, type ramp, spacing and radius scales, CSS variables.",
        example: 'get_design_system("linear-app")',
        lite: true,
      },
      {
        name: "study",
        sig: "(url)",
        desc: "Fetch any live URL and return its design system - for brands not in the catalogue. SSRF-guarded.",
        example: 'study("https://stripe.com")',
        lite: true,
      },
      {
        name: "compare",
        sig: "(slugs[2..4])",
        desc: "Side-by-side breakdown of 2 to 4 sites: palettes, typefaces, scales, container widths, plus what they share.",
        example: 'compare(["linear-app", "novu-co"])',
      },
    ],
  },
  {
    group: "Components",
    tools: [
      {
        name: "find_components",
        sig: "(type, filters?)",
        desc: "Real sites featuring a component type - pricing tables, heroes, FAQs - with crops where the region dataset is populated.",
        example: 'find_components({ type: "pricing" })',
      },
      {
        name: "find_reference_components",
        sig: "(type?, macro?)",
        desc: "The canonical reference JSX catalogue: named archetypes per component type, each stamped with its macrostructure.",
        example: 'find_reference_components({ type: "hero" })',
        lite: true,
      },
      {
        name: "get_reference_jsx",
        sig: "(type, id)",
        desc: "Full source for one reference component, copy-pasteable into a React project.",
        example: 'get_reference_jsx({ type: "hero", id: "marquee" })',
      },
    ],
  },
  {
    group: "Flows and collections",
    tools: [
      {
        name: "get_site_pages",
        sig: "(siteSlug?)",
        desc: "A site's captured pages as an ordered flow with step numbers and a page sequence. Call with no arguments for a directory of flow-capable sites.",
        example: 'get_site_pages({ siteSlug: "linear-app" })',
        lite: true,
      },
      {
        name: "list_collections",
        sig: "()",
        desc: "Every editor-curated issue, in publication order.",
        example: "list_collections()",
      },
      {
        name: "get_collection",
        sig: "(slug)",
        desc: "One issue - the editor's blurb plus its ordered screens.",
        example: 'get_collection("editorial-layouts")',
      },
    ],
  },
  {
    group: "Meta",
    tools: [
      {
        name: "get_filters",
        sig: "()",
        desc: "Zero input. Lists every accepted filter and enum value, so the agent never guesses.",
        example: "get_filters()",
        lite: true,
      },
    ],
  },
];

const HOSTED_URL = "https://inspo-mcp.luffixos.workers.dev/mcp";
const CURSOR_DEEPLINK =
  "cursor://anysphere.cursor-deeplink/mcp/install?name=inspo&config=eyJ1cmwiOiJodHRwczovL2luc3BvLW1jcC5sdWZmaXhvcy53b3JrZXJzLmRldi9tY3AifQ==";

const installTabs: InstallTab[] = [
  {
    id: "claude-code",
    label: "Claude Code",
    note: "One command; applies to the current project (add --scope user for everywhere).",
    snippet: `claude mcp add --transport http inspo ${HOSTED_URL}`,
  },
  {
    id: "cursor",
    label: "Cursor",
    note: "~/.cursor/mcp.json",
    snippet: `{\n  "mcpServers": {\n    "inspo": { "url": "${HOSTED_URL}" }\n  }\n}`,
    deeplink: {
      href: CURSOR_DEEPLINK,
      label: "Or install in one click from Cursor →",
    },
  },
  {
    id: "windsurf",
    label: "Windsurf",
    note: "~/.codeium/windsurf/mcp_config.json",
    snippet: `{\n  "mcpServers": {\n    "inspo": { "serverUrl": "${HOSTED_URL}" }\n  }\n}`,
  },
  {
    id: "codex",
    label: "Codex",
    note: "~/.codex/config.toml",
    snippet: `[mcp_servers.inspo]\ncommand = "npx"\nargs = ["-y", "inspo-mcp"]`,
  },
  {
    id: "zed",
    label: "Zed",
    note: "~/.config/zed/settings.json",
    snippet: `{\n  "context_servers": {\n    "inspo": {\n      "command": { "path": "npx", "args": ["-y", "inspo-mcp"] }\n    }\n  }\n}`,
  },
  {
    id: "vscode",
    label: "VS Code",
    note: ".vscode/mcp.json (Copilot agent mode)",
    snippet: `{\n  "servers": {\n    "inspo": { "type": "http", "url": "${HOSTED_URL}" }\n  }\n}`,
  },
  {
    id: "json",
    label: "Raw JSON",
    note: "Hosted HTTP endpoint, or local stdio via npx - both free, no auth.",
    snippet: `{\n  "mcpServers": {\n    "inspo": { "url": "${HOSTED_URL}" }\n  }\n}\n\n// or run locally over stdio\n{\n  "mcpServers": {\n    "inspo": { "command": "npx", "args": ["-y", "inspo-mcp"] }\n  }\n}`,
  },
];

export default async function MCPPage() {
  const stats = await getArchiveStats();
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
            <em className="not-italic text-[var(--color-link)]">Lend it some.</em>
          </h1>
          <p className="mt-10 max-w-[64ch] text-xl leading-relaxed text-[var(--color-fg-muted)]">
            Install once and Claude Code, Cursor, Windsurf, Codex, and Zed
            get a handful of new tools. Your agent gets three things from one
            server: <strong className="text-[var(--color-fg)]">{stats.screens.toLocaleString()} real screens across {stats.sites.toLocaleString()} curated sites</strong> to study (most with a desktop and mobile pair),{" "}
            <strong className="text-[var(--color-fg)]">{stats.references} canonical reference components</strong> to copy from, and a{" "}
            <strong className="text-[var(--color-fg)]"><code className="font-mono text-[0.95em]">DESIGN.md</code> per site</strong> with palette roles, type ramp, and spacing scale already extracted.
          </p>
        </div>
      </section>

      {/* Install ─────────────────────────────────────────── */}
      <section className="border-t rule pt-12 pb-24">
        <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-2">
            <p className="mcp-section-label">Install</p>
            <p className="mt-2 max-w-[20ch] text-sm leading-relaxed text-[var(--color-fg-muted)]">
              One command. Free, hosted, no auth.
            </p>
          </div>
          <div className="lg:col-span-10">
            <pre className="overflow-x-auto border rule bg-[color-mix(in_oklab,var(--color-fg)_4%,var(--color-bg))] px-5 py-4 font-mono text-sm leading-relaxed">
              <code className="text-[var(--color-fg-muted)]">{"# Hosted endpoint - live, free, no auth"}</code>
              {"\n"}
              <code className="text-[var(--color-fg)]">{"$ claude mcp add --transport http inspo https://inspo-mcp.luffixos.workers.dev/mcp"}</code>
              {"\n"}
              {"\n"}
              <code className="text-[var(--color-fg-muted)]">{"# Or run it locally over stdio"}</code>
              {"\n"}
              <code className="text-[var(--color-fg)]">{"$ npx -y inspo-mcp"}</code>
            </pre>

            <InstallTabs tabs={installTabs} />
          </div>
        </div>
      </section>

      {/* Tool reference ──────────────────────────────────── */}
      <section className="border-t rule pt-12 pb-24">
        <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-2">
            <p className="mcp-section-label">Tools exposed</p>
            <p className="mt-2 max-w-[26ch] text-sm leading-relaxed text-[var(--color-fg-muted)]">
              All sixteen, grouped by job. The nine marked{" "}
              <span className="border rule px-1.5 py-0.5 text-xs">lite</span>{" "}
              form the lean profile served to text-first clients. Each
              returns URLs, so your agent fetches only what it needs.
            </p>
          </div>

          <div className="space-y-16 lg:col-span-10">
            {toolGroups.map((g) => (
              <div key={g.group}>
                <p className="text-meta mb-8 border-b rule pb-3">{g.group}</p>
                <ul className="space-y-12">
                  {g.tools.map((t) => (
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
                        {t.lite && (
                          <span className="border rule px-1.5 py-0.5 text-xs text-[var(--color-fg-muted)]">
                            lite
                          </span>
                        )}
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
            ))}
          </div>
        </div>
      </section>

      {/* Playground ───────────────────────────────────────── */}
      <section className="border-t rule pt-12 pb-24">
        <div className="grid grid-cols-1 gap-y-8 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-2">
            <p className="mcp-section-label">Try it now</p>
            <p className="mt-3 max-w-[22ch] text-sm leading-relaxed text-[var(--color-fg-muted)]">
              Real MCP code, in the browser. No install.
            </p>
          </div>
          <div className="lg:col-span-10">
            <McpPlayground />
          </div>
        </div>
      </section>

      {/* Macrostructures ─────────────────────────────────── */}
      <section className="border-y rule pt-12 pb-24">
        <div className="grid grid-cols-1 gap-y-8 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-2">
            <p className="mcp-section-label">Pick a shape</p>
          </div>

          <div className="lg:col-span-10">
            <h2 className="font-display max-w-[20ch] text-balance text-4xl leading-tight tracking-tight sm:text-5xl">
              Name the macrostructure.{" "}
              <em className="not-italic text-[var(--color-link)]">Inspo gives you the reference.</em>
            </h2>
            <p className="mt-6 max-w-[60ch] text-[var(--color-fg-muted)]">
              Before writing code, an agent can pick one of the 21 named
              macrostructures -{" "}
              <em className="not-italic text-[var(--color-link)]">Bento, Specimen, Manifesto, Workbench…</em>
              {" "}- and call{" "}
              <code className="font-mono text-[0.95em] text-[var(--color-fg)]">find_examples_for_macrostructure</code>{" "}
              at that exact step to get four real production sites that
              embody it. Shape and reference, in one prompt. Inspo is open
              source, owned and operated by{" "}
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
              <code className="text-[var(--color-fg-muted)]">{"// Pick a shape, get exemplars"}</code>
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
          <p className="mcp-section-label lg:col-span-2">Free. Open.</p>
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
            <p className="max-w-[60ch] text-[var(--color-fg-muted)]">
              The catalogue is read-only. The hosted endpoint is free and
              unauthenticated but abuse-resistant:{" "}
              <code className="font-mono text-[0.95em] text-[var(--color-fg)]">study(url)</code>{" "}
              is SSRF-guarded (public named http(s) hosts only) and rate-limited
              per IP.
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
