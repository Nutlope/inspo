"use client";

/**
 * Live MCP playground - embedded on /mcp so visitors (and recruiters)
 * can see what the agent actually receives without installing anything.
 *
 * Two tabs:
 *   - search_screens: hits /api/mcp-demo/search → top results inline
 *   - study(url):     hits /api/mcp-demo/study → live-extracted palette,
 *                     fonts, tech, CSS variables
 *
 * Both routes import the same code paths the MCP tools call (searchScreens
 * from @inspo/db, study from @inspo/shared) so the playground is a
 * faithful simulator, not a marketing approximation.
 *
 * The output is deliberately rendered as a JSON-ish card stack rather
 * than a fake chat bubble. The point is: "this is what your agent
 * gets" - and what your agent gets is structured data, not prose.
 */

import { useCallback, useState } from "react";
import Link from "next/link";

type Tab = "search" | "study";

interface SearchResult {
  slug: string;
  siteSlug: string;
  title: string;
  sourceUrl: string;
  thumbUrl: string;
  palette: string[];
  description: string;
  tags: {
    style: string[];
    industry: string[];
    macrostructure?: string | null;
  };
}

interface StudyResult {
  url: string;
  ok: boolean;
  status: number;
  title: string;
  description: string;
  fonts: string[];
  palette: string[];
  cssVariables: Record<string, string>;
  tech: string[];
  designMd: string;
  warnings: string[];
}

const SEARCH_EXAMPLES = [
  "warm editorial photography studio",
  "dark developer tools landing page",
  "bento grid agency portfolio",
  "minimal type specimen",
];

const STUDY_EXAMPLES = [
  "https://linear.app",
  "https://stripe.com",
  "https://fey.com",
  "https://granola.ai",
];

export function McpPlayground() {
  const [tab, setTab] = useState<Tab>("search");
  return (
    <div className="rounded-card border rule">
      <div className="flex items-center justify-between border-b rule px-5 py-3">
        <div role="tablist" className="flex gap-2">
          <TabButton active={tab === "search"} onClick={() => setTab("search")}>
            search_screens
          </TabButton>
          <TabButton active={tab === "study"} onClick={() => setTab("study")}>
            study
          </TabButton>
        </div>
        <p className="text-meta hidden sm:block text-[var(--color-fg-muted)]">
          Hits the same code as the MCP tool
        </p>
      </div>
      {tab === "search" ? <SearchTab /> : <StudyTab />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={
        "font-mono text-xs tracking-normal rounded-full px-3.5 py-1.5 transition-colors " +
        (active
          ? "bg-[var(--color-fg)] text-[var(--color-bg)]"
          : "text-[var(--color-fg-muted)] hover:bg-[color-mix(in_oklab,var(--color-fg)_7%,transparent)] hover:text-[var(--color-fg)]")
      }
    >
      {children}
    </button>
  );
}

/* ────────────────────── search_screens ────────────────────── */

function SearchTab() {
  const [q, setQ] = useState("warm editorial photography studio");
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "loading" }
    | { kind: "ok"; data: { query: string; count: number; results: SearchResult[] } }
    | { kind: "err"; message: string }
  >({ kind: "idle" });

  const run = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;
      setState({ kind: "loading" });
      try {
        const res = await fetch("/api/mcp-demo/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: trimmed, limit: 6 }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as {
          query: string;
          count: number;
          results: SearchResult[];
        };
        setState({ kind: "ok", data });
      } catch (e) {
        setState({
          kind: "err",
          message: e instanceof Error ? e.message : String(e),
        });
      }
    },
    [],
  );

  return (
    <div className="p-4 lg:p-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(q);
        }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <code className="font-mono text-xs text-[var(--color-fg-muted)]">
          search_screens(
        </code>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="warm editorial photography studio"
          aria-label="Search query"
          className="flex-1 min-w-0 border-b border-[var(--color-border)] bg-transparent font-mono text-sm outline-none focus:border-[var(--color-link)] py-1"
        />
        <code className="font-mono text-xs text-[var(--color-fg-muted)]">)</code>
        <button
          type="submit"
          className="font-mono text-xs tracking-normal rounded-full bg-[var(--color-fg)] text-[var(--color-bg)] px-5 py-2 hover:opacity-90 transition-opacity disabled:opacity-40"
          disabled={state.kind === "loading"}
        >
          {state.kind === "loading" ? "Running…" : "Run"}
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-meta text-[var(--color-fg-muted)]">
        <span>Try:</span>
        {SEARCH_EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => {
              setQ(ex);
              run(ex);
            }}
            className="underline-offset-4 hover:text-[var(--color-link)] hover:underline"
          >
            {ex}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {state.kind === "idle" && (
          <p className="text-meta text-[var(--color-fg-muted)]">
            Press Run, or pick an example above.
          </p>
        )}
        {state.kind === "loading" && <Loading />}
        {state.kind === "err" && <ErrorBox message={state.message} />}
        {state.kind === "ok" && <SearchResults data={state.data} />}
      </div>
    </div>
  );
}

function SearchResults({
  data,
}: {
  data: { query: string; count: number; results: SearchResult[] };
}) {
  if (data.count === 0) {
    return (
      <p className="text-meta">
        Nothing matched. The agent would see an empty result and try a
        different query.
      </p>
    );
  }
  return (
    <div>
      <p className="text-meta mb-3 text-[var(--color-fg-muted)]">
        Top {data.count} for{" "}
        <span className="font-mono text-[var(--color-fg)]">{data.query}</span>
      </p>
      <ul className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        {data.results.map((r) => (
          <li key={r.slug} className="overflow-hidden rounded-tile border rule">
            <Link
              href={`/screens/${r.slug}`}
              className="block focus:outline-none"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={r.thumbUrl}
                alt={r.title}
                loading="lazy"
                decoding="async"
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="border-t rule p-3">
                <p className="font-display text-base leading-tight">
                  {r.title}
                </p>
                <p className="mt-1 text-meta text-[var(--color-fg-muted)] line-clamp-2">
                  {r.description.split("·")[0]!.trim()}
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  {r.palette.slice(0, 5).map((hex, i) => (
                    <span
                      key={`${hex}-${i}`}
                      title={hex}
                      className="block h-3 w-3 rounded-full border rule"
                      style={{ background: hex }}
                    />
                  ))}
                </div>
                {r.tags.macrostructure && (
                  <p className="text-meta mt-2 text-[var(--color-fg-muted)] capitalize">
                    {r.tags.macrostructure.replace(/-/g, " ")}
                  </p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ────────────────────── study(url) ────────────────────── */

function StudyTab() {
  const [u, setU] = useState("https://linear.app");
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "loading" }
    | { kind: "ok"; data: StudyResult }
    | { kind: "err"; message: string }
  >({ kind: "idle" });

  const run = useCallback(
    async (url: string) => {
      const trimmed = url.trim();
      if (!trimmed) return;
      setState({ kind: "loading" });
      try {
        const res = await fetch("/api/mcp-demo/study", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: trimmed }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as StudyResult;
        setState({ kind: "ok", data });
      } catch (e) {
        setState({
          kind: "err",
          message: e instanceof Error ? e.message : String(e),
        });
      }
    },
    [],
  );

  return (
    <div className="p-4 lg:p-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(u);
        }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <code className="font-mono text-xs text-[var(--color-fg-muted)]">
          study(
        </code>
        <input
          type="text"
          value={u}
          onChange={(e) => setU(e.target.value)}
          placeholder="https://linear.app"
          aria-label="URL"
          className="flex-1 min-w-0 border-b border-[var(--color-border)] bg-transparent font-mono text-sm outline-none focus:border-[var(--color-link)] py-1"
        />
        <code className="font-mono text-xs text-[var(--color-fg-muted)]">)</code>
        <button
          type="submit"
          className="font-mono text-xs tracking-normal rounded-full bg-[var(--color-fg)] text-[var(--color-bg)] px-5 py-2 hover:opacity-90 transition-opacity disabled:opacity-40"
          disabled={state.kind === "loading"}
        >
          {state.kind === "loading" ? "Fetching…" : "Run"}
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-meta text-[var(--color-fg-muted)]">
        <span>Try:</span>
        {STUDY_EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => {
              setU(ex);
              run(ex);
            }}
            className="underline-offset-4 hover:text-[var(--color-link)] hover:underline"
          >
            {ex}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {state.kind === "idle" && (
          <p className="text-meta text-[var(--color-fg-muted)]">
            Press Run, or pick an example above. Most sites finish in 2-5 s.
          </p>
        )}
        {state.kind === "loading" && <Loading />}
        {state.kind === "err" && <ErrorBox message={state.message} />}
        {state.kind === "ok" && <StudyResultCard data={state.data} />}
      </div>
    </div>
  );
}

function StudyResultCard({ data }: { data: StudyResult }) {
  const cssVarCount = Object.keys(data.cssVariables).length;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <div>
          <p className="font-display text-xl leading-tight">
            {data.title || data.url}
          </p>
          {data.description && (
            <p className="text-meta mt-1 max-w-[60ch] text-[var(--color-fg-muted)]">
              {data.description}
            </p>
          )}
        </div>
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-meta hover:text-[var(--color-link)]"
        >
          {new URL(data.url).host} ↗
        </a>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
        <Box label="Palette" empty={data.palette.length === 0}>
          <div className="flex flex-wrap gap-2">
            {data.palette.slice(0, 8).map((hex, i) => (
              <div
                key={`${hex}-${i}`}
                className="flex items-center gap-2 rounded-full border rule px-2.5 py-1"
                title={hex}
              >
                <span
                  aria-hidden
                  className="block h-4 w-4 rounded-full border rule"
                  style={{ background: hex }}
                />
                <span className="font-mono text-xs">{hex}</span>
              </div>
            ))}
          </div>
        </Box>
        <Box label="Fonts" empty={data.fonts.length === 0}>
          <ul className="space-y-1 font-mono text-sm">
            {data.fonts.slice(0, 6).map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </Box>
        <Box label="Tech" empty={data.tech.length === 0}>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-sm">
            {data.tech.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </Box>
        <Box
          label={`CSS variables (${cssVarCount})`}
          empty={cssVarCount === 0}
        >
          <pre className="max-h-40 overflow-auto font-mono text-xs leading-relaxed">
            {Object.entries(data.cssVariables)
              .slice(0, 20)
              .map(([k, v]) => `${k}: ${v};`)
              .join("\n")}
            {cssVarCount > 20 ? `\n/* …${cssVarCount - 20} more */` : ""}
          </pre>
        </Box>
      </div>

      {data.warnings.length > 0 && (
        <p className="text-meta text-[var(--color-fg-muted)]">
          Note: {data.warnings.join(" · ")}
        </p>
      )}
    </div>
  );
}

function Box({
  label,
  empty,
  children,
}: {
  label: string;
  empty?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-meta mb-2">{label}</p>
      {empty ? (
        <p className="text-meta text-[var(--color-fg-muted)]">none</p>
      ) : (
        children
      )}
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center gap-3 text-meta text-[var(--color-fg-muted)]">
      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--color-link)]" />
      Running tool…
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <p className="text-meta rounded-full border rule px-4 py-2 text-[var(--color-fg-muted)]">
      Error: {message}
    </p>
  );
}
