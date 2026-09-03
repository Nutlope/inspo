import Link from "next/link";
import type { Metadata } from "next";
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
        desc: "The orchestrator. One call turns a plain-English brief into a macrostructure pick, five real exemplars, reference JSX, and a palette.",
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
        sig: "(query, filters?)",
        desc: "Plain-language archive search: screenshots, palettes, fonts, components.",
        lite: true,
      },
      {
        name: "find_similar",
        sig: "(slug)",
        desc: "Nearest design neighbours of a screen, by embedding.",
      },
      {
        name: "find_by_color",
        sig: "(hex)",
        desc: "Perceptual OKLAB colour search near a brand colour.",
      },
      {
        name: "find_examples_for_macrostructure",
        sig: "(name)",
        desc: "Real sites embodying one of the 19 named macrostructures.",
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
        desc: "One screen's full record - every viewport, the fold-by-fold autopsy.",
        lite: true,
      },
      {
        name: "get_design_system",
        sig: "(slug)",
        desc: "The DESIGN.md: fonts, ranked palette, type ramp, spacing, radii.",
        lite: true,
      },
      {
        name: "study",
        sig: "(url)",
        desc: "Extract a design system from any live URL. SSRF-guarded.",
        lite: true,
      },
      {
        name: "compare",
        sig: "(slugs[])",
        desc: "Side-by-side breakdown of 2 to 4 sites, plus what they share.",
      },
    ],
  },
  {
    group: "Components",
    tools: [
      {
        name: "find_components",
        sig: "(type)",
        desc: "Real sites featuring a component type, with crops.",
      },
      {
        name: "find_reference_components",
        sig: "(type?)",
        desc: "The canonical reference JSX catalogue, stamped by macrostructure.",
        lite: true,
      },
      {
        name: "get_reference_jsx",
        sig: "(type, id)",
        desc: "Full source for one reference component, copy-pasteable.",
      },
    ],
  },
  {
    group: "Flows and collections",
    tools: [
      {
        name: "get_site_pages",
        sig: "(siteSlug?)",
        desc: "A site's captured pages as an ordered flow.",
        lite: true,
      },
      {
        name: "list_collections",
        sig: "()",
        desc: "Every editor-curated issue, in publication order.",
      },
      {
        name: "get_collection",
        sig: "(slug)",
        desc: "One issue - the blurb plus its ordered screens.",
      },
    ],
  },
  {
    group: "Meta",
    tools: [
      {
        name: "get_filters",
        sig: "()",
        desc: "Every accepted filter and enum value, so the agent never guesses.",
        lite: true,
      },
    ],
  },
];

const HOSTED_URL = "https://inspo-three.vercel.app/api/mcp";
// base64 of {"url": HOSTED_URL} - Cursor's documented deeplink payload.
// Keep in sync with HOSTED_URL: a stale payload silently installs a dead
// server (it pointed at the retired Cloudflare Worker until 2026-09-03).
const CURSOR_DEEPLINK =
  "cursor://anysphere.cursor-deeplink/mcp/install?name=inspo&config=eyJ1cmwiOiJodHRwczovL2luc3BvLXRocmVlLnZlcmNlbC5hcHAvYXBpL21jcCJ9";

const AGENT_PROMPT =
  `Add the Inspo MCP server to my setup. It is a free, hosted, no-auth ` +
  `streamable-HTTP endpoint at ${HOSTED_URL}, and it should be registered ` +
  `under the name "inspo" in whatever MCP config my client uses. If you ` +
  `cannot reach a remote server, use the local stdio form instead: ` +
  `command "npx", args ["-y", "inspo-mcp"]. When you are done, list the ` +
  `inspo tools back to me so I know it connected.`;

/**
 * Install paths, loosest to tightest. The first tab is the one command
 * that works everywhere (it detects the client and writes the config),
 * the second hands the job to the agent already sitting in the editor,
 * and the rest are the exact per-client lines for anyone who would
 * rather wire it themselves.
 *
 * `npx -y inspo-mcp` WITHOUT `install` is not an install command - it
 * boots the stdio server and waits on stdin, which reads as a hang.
 * Never surface the bare form as something to paste into a shell.
 */
const installTabs: InstallTab[] = [
  {
    id: "one-command",
    label: "One command",
    note: "Detects Claude Code, Cursor, Codex, VS Code, Windsurf, Zed and Claude Desktop, then writes the config. Add --dry-run to see the plan first.",
    snippet: "npx -y inspo-mcp install",
  },
  {
    id: "agent",
    label: "Ask your agent",
    note: "Paste into the agent you already have open - it wires itself up.",
    variant: "prose",
    snippet: AGENT_PROMPT,
  },
  {
    id: "claude-code",
    label: "Claude Code",
    note: "Applies to the current project - add --scope user for everywhere.",
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
    id: "codex",
    label: "Codex",
    note: "Writes ~/.codex/config.toml for you.",
    snippet: `codex mcp add inspo --url ${HOSTED_URL}`,
  },
  {
    id: "vscode",
    label: "VS Code",
    note: "Copilot agent mode - adds it to your user profile.",
    snippet: `code --add-mcp '{"name":"inspo","type":"http","url":"${HOSTED_URL}"}'`,
  },
  {
    id: "windsurf",
    label: "Windsurf",
    note: "~/.codeium/windsurf/mcp_config.json - remote servers use serverUrl.",
    snippet: `{\n  "mcpServers": {\n    "inspo": { "serverUrl": "${HOSTED_URL}" }\n  }\n}`,
  },
  {
    id: "zed",
    label: "Zed",
    note: "~/.config/zed/settings.json",
    snippet: `{\n  "context_servers": {\n    "inspo": { "url": "${HOSTED_URL}" }\n  }\n}`,
  },
  {
    id: "endpoint",
    label: "Endpoint",
    note: "Any other client: hand it the URL, or run it locally over stdio. Both free, no auth.",
    variant: "code",
    snippet: `${HOSTED_URL}\n\n// or local stdio, no hosting in the loop\n{ "command": "npx", "args": ["-y", "inspo-mcp"] }`,
  },
];

export default async function MCPPage() {
  const stats = await getArchiveStats();
  const liteCount = toolGroups
    .flatMap((g) => g.tools)
    .filter((t) => t.lite).length;
  const toolCount = toolGroups.flatMap((g) => g.tools).length;

  return (
    <div className="mx-auto max-w-[120rem] px-4 sm:px-10">
      {/* Hero ─ headline straight into the install module. The pitch
          and the one-liner share the first viewport: pick a client,
          copy, done. ─────────────────────────────────────────── */}
      <section className="pt-14 pb-16 sm:pt-20">
        <div className="mx-auto max-w-[62rem] text-center">
          <p className="text-meta">For coding agents · free, hosted, no auth</p>
          <h1 className="font-display mx-auto mt-5 max-w-[20ch] text-balance text-[length:var(--text-h1)] leading-[0.95] tracking-tight">
            Your agent doesn&rsquo;t have taste.{" "}
            <em className="not-italic text-[var(--color-link)]">Lend it some.</em>
          </h1>
          <p className="mx-auto mt-6 max-w-[54ch] text-[var(--color-fg-muted)]">
            One install gives your agent{" "}
            <strong className="font-normal text-[var(--color-fg)]">
              {stats.screens.toLocaleString()} real screens
            </strong>{" "}
            across{" "}
            <strong className="font-normal text-[var(--color-fg)]">
              {stats.sites.toLocaleString()} curated sites
            </strong>
            ,{" "}
            <strong className="font-normal text-[var(--color-fg)]">
              {stats.references} reference components
            </strong>
            , and a DESIGN.md per site - palette roles, type ramp, spacing,
            already extracted.
          </p>

          <div className="mt-10 text-left">
            <InstallTabs tabs={installTabs} />
          </div>
        </div>
      </section>

      {/* Playground ───────────────────────────────────────── */}
      <section className="border-t rule py-16">
        <div className="mx-auto max-w-[68rem]">
          <div className="mb-8 text-center">
            <h2 className="font-display text-3xl leading-tight tracking-tight sm:text-4xl">
              Try it before you install.
            </h2>
            <p className="mt-3 text-[var(--color-fg-muted)]">
              Real MCP calls, right here in the browser.
            </p>
          </div>
          <McpPlayground />
        </div>
      </section>

      {/* Macrostructures ─────────────────────────────────── */}
      <section className="border-t rule py-16">
        <div className="mx-auto max-w-[68rem] text-center">
          <h2 className="font-display mx-auto max-w-[24ch] text-balance text-3xl leading-tight tracking-tight sm:text-4xl">
            Name the macrostructure.{" "}
            <em className="not-italic text-[var(--color-link)]">
              Inspo gives you the reference.
            </em>
          </h2>
          <p className="mx-auto mt-5 max-w-[58ch] text-[var(--color-fg-muted)]">
            Before writing code, an agent picks one of 19 named shapes -
            Bento, Specimen, Manifesto, Workbench… - and gets four real
            production sites that embody it. Shape and reference, in one
            prompt.
          </p>

          <pre className="mx-auto mt-8 max-w-[44rem] overflow-x-auto rounded-card border rule bg-[color-mix(in_oklab,var(--color-fg)_3%,var(--color-bg))] px-6 py-5 text-left font-mono text-sm leading-relaxed">
            <code className="text-[var(--color-fg-muted)]">{"// Pick a shape, get exemplars"}</code>
            {"\n"}
            <code>{'find_examples_for_macrostructure({ name: "Bento Grid" })'}</code>
          </pre>

          <p className="mt-7">
            <Link
              href="/screens?macro=bento-grid"
              className="inline-flex items-center gap-2 rounded-full border rule px-6 py-3 text-sm transition-colors hover:border-[var(--color-link)] hover:text-[var(--color-link)]"
            >
              See Bento Grid examples in the archive
              <span aria-hidden>→</span>
            </Link>
          </p>
        </div>
      </section>

      {/* Tool reference ─ tucked away. The agent is the caller, not
          the reader, so the full catalogue folds into one compact
          disclosure instead of a long scroll. ────────────────── */}
      <section className="border-t rule py-16">
        <div className="mx-auto max-w-[68rem]">
          <details className="group rounded-card border rule bg-[color-mix(in_oklab,var(--color-fg)_3%,var(--color-bg))] open:bg-[var(--color-bg)]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 sm:px-8 [&::-webkit-details-marker]:hidden">
              <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-display text-2xl leading-tight">
                  Under the hood: the {toolCount} tools
                </span>
                <span className="text-sm text-[var(--color-fg-muted)]">
                  your agent calls these for you - nothing to memorise
                </span>
              </span>
              <span
                aria-hidden
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border rule text-[var(--color-fg-muted)] transition-transform duration-200 group-open:rotate-180"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 10 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <path d="m2 3.5 3 3 3-3" />
                </svg>
              </span>
            </summary>

            <div className="border-t rule px-6 pt-6 pb-8 sm:px-8">
              <p className="max-w-[68ch] text-sm text-[var(--color-fg-muted)]">
                Ask your agent for &ldquo;a calm banking hero&rdquo; and it
                picks the right call itself. The {liteCount} marked{" "}
                <span className="rounded-full border rule px-2 py-0.5 text-xs">
                  lite
                </span>{" "}
                form the lean profile served to text-first clients; every
                list tool takes a <code className="font-mono text-xs">maxTokens</code>{" "}
                ceiling.
              </p>

              <div className="mt-8 space-y-10">
                {toolGroups.map((g) => (
                  <div key={g.group}>
                    <p className="text-meta mb-4">{g.group}</p>
                    <ul className="grid grid-cols-1 gap-x-10 gap-y-4 lg:grid-cols-2">
                      {g.tools.map((t) => (
                        <li key={t.name} className="flex flex-col gap-1">
                          <span className="flex flex-wrap items-baseline gap-x-2">
                            <code
                              className={`font-mono text-sm ${
                                t.accent ? "text-[var(--color-link)]" : ""
                              }`}
                            >
                              {t.name}
                            </code>
                            <code className="font-mono text-xs text-[var(--color-fg-muted)]">
                              {t.sig}
                            </code>
                            {t.lite && (
                              <span className="rounded-full border rule px-2 py-0.5 text-xs text-[var(--color-fg-muted)]">
                                lite
                              </span>
                            )}
                          </span>
                          <p className="text-sm text-[var(--color-fg-muted)]">
                            {t.desc}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </details>
        </div>
      </section>

      {/* Posture. The closing band. Its bottom padding accounts for the
          Colophon's own mt-12 (48px): pb-4 (16px) + 48px = 64px below
          the button, matching the pt-16 above the heading and the
          py-16 rhythm every other section on this page runs on. */}
      <section className="border-t rule pt-16 pb-4">
        <div className="mx-auto max-w-[62rem] text-center">
          <p className="font-display mx-auto max-w-[40ch] text-2xl leading-snug sm:text-3xl">
            Open source, MIT, owned and operated by{" "}
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
          <p className="mx-auto mt-4 max-w-[60ch] text-sm text-[var(--color-fg-muted)]">
            The catalogue is read-only. The hosted endpoint is free and
            unauthenticated but abuse-resistant:{" "}
            <code className="font-mono">study(url)</code> is SSRF-guarded and
            rate-limited per IP.
          </p>
          <p className="mt-6">
            <Link
              href="/about"
              className="inline-flex items-center gap-2 rounded-full border rule px-6 py-3 text-sm transition-colors hover:border-[var(--color-link)] hover:text-[var(--color-link)]"
            >
              About + self-host
              <span aria-hidden>→</span>
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
