"use client";

/**
 * ⌘K command palette — Linear / Vercel / Mobbin pattern.
 *
 * - Cmd+K (Ctrl+K on Windows/Linux) toggles
 * - Esc closes
 * - Up/Down + Enter navigate
 * - Fuzzy match across 1000 sites + nav + quick actions
 * - Index loads on first open and caches for the session
 *
 * Built on cmdk (the headless palette used by Linear's). Styling is
 * editorial — mono caption text, paper bg, accent-red highlight on
 * the active row, no shadows, hairline rule borders.
 */

import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

type IndexEntry = {
  slug: string;
  title: string;
  host: string;
  pageCount: number;
  accent: string;
};

const STATIC_NAV = [
  { label: "Archive", href: "/screens", hint: "Browse every site" },
  { label: "MCP", href: "/mcp", hint: "Install for Claude Code, Cursor, …" },
  { label: "MCP use cases", href: "/mcp/use-cases", hint: "What an agent does with Inspo" },
  { label: "About", href: "/about", hint: "Open source, Together AI" },
];

const QUICK_ACTIONS = [
  {
    label: "Copy MCP install command",
    href: "#",
    hint: "npx inspo init → clipboard",
    action: "copy-install",
  },
] as const;

const RECENT_KEY = "inspo:cmdk:recent";
const RECENT_MAX = 6;

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function pushRecent(slug: string) {
  if (typeof window === "undefined") return;
  const existing = loadRecent().filter((s) => s !== slug);
  const next = [slug, ...existing].slice(0, RECENT_MAX);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState<IndexEntry[] | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();
  const router = useRouter();

  /* ─── keyboard: ⌘K toggle, Esc close ─── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const cmdK = (isMac ? e.metaKey : e.ctrlKey) && e.key === "k";
      if (cmdK) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  /* ─── load index lazily on first open ─── */
  useEffect(() => {
    if (!open) return;
    setRecent(loadRecent());
    if (index !== null) return;
    fetch("/api/index", { cache: "force-cache" })
      .then((r) => r.json())
      .then((j: { entries: IndexEntry[] }) => setIndex(j.entries))
      .catch(() => setIndex([]));
  }, [open, index]);

  /* ─── lock body scroll while open ─── */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const recentSites = useMemo(() => {
    if (!index) return [];
    const map = new Map(index.map((e) => [e.slug, e] as const));
    return recent.flatMap((s) => {
      const e = map.get(s);
      return e ? [e] : [];
    });
  }, [recent, index]);

  function go(href: string, slug?: string) {
    if (slug) pushRecent(slug);
    setOpen(false);
    setQuery("");
    startTransition(() => router.push(href));
  }

  function onAction(name: string) {
    if (name === "copy-install") {
      navigator.clipboard.writeText("npx inspo init").catch(() => {});
    }
    setOpen(false);
    setQuery("");
  }

  if (!open) return null;

  return (
    <div
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
      className="fixed inset-0 z-[100] flex items-start justify-center bg-[color-mix(in_oklab,var(--color-fg)_30%,transparent)] px-4 pt-[12vh] backdrop-blur-sm"
    >
      <Command
        loop
        className="font-mono w-full max-w-xl border rule bg-[var(--color-bg)] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.2)]"
        label="Command palette"
      >
        <div className="relative flex items-center border-b rule">
          <span aria-hidden className="pl-5 pr-3 text-[var(--color-fg-muted)]">
            ⌕
          </span>
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder="search sites, pages, or commands…"
            autoFocus
            className="flex-1 bg-transparent py-4 pr-5 text-base placeholder:text-[var(--color-fg-muted)] focus:outline-none"
          />
          <kbd className="pr-5 text-meta text-[var(--color-fg-muted)]">esc</kbd>
        </div>

        <Command.List className="max-h-[60vh] overflow-y-auto p-2">
          <Command.Empty className="px-4 py-6 text-meta">
            nothing matches.
          </Command.Empty>

          {/* Recent (only when no query) */}
          {query === "" && recentSites.length > 0 && (
            <Command.Group heading="Recent">
              {recentSites.map((e) => (
                <PaletteRow
                  key={`recent-${e.slug}`}
                  entry={e}
                  onSelect={() => go(`/sites/${e.slug}`, e.slug)}
                />
              ))}
            </Command.Group>
          )}

          {/* Navigation */}
          <Command.Group heading="Navigation">
            {STATIC_NAV.map((n) => (
              <Command.Item
                key={n.href}
                value={`${n.label} ${n.hint}`}
                onSelect={() => go(n.href)}
                className="group flex cursor-pointer items-baseline justify-between gap-4 rounded-sm px-4 py-3 text-sm aria-selected:bg-[var(--color-fg)]/4 aria-selected:text-[var(--color-link)]"
              >
                <span className="font-display text-base">{n.label}</span>
                <span className="text-meta text-[var(--color-fg-muted)]">
                  {n.hint}
                </span>
              </Command.Item>
            ))}
          </Command.Group>

          {/* Quick actions */}
          <Command.Group heading="Actions">
            {QUICK_ACTIONS.map((a) => (
              <Command.Item
                key={a.action}
                value={`${a.label} ${a.hint}`}
                onSelect={() => onAction(a.action)}
                className="group flex cursor-pointer items-baseline justify-between gap-4 rounded-sm px-4 py-3 text-sm aria-selected:bg-[var(--color-fg)]/4 aria-selected:text-[var(--color-link)]"
              >
                <span className="font-display text-base">{a.label}</span>
                <span className="text-meta text-[var(--color-fg-muted)]">
                  {a.hint}
                </span>
              </Command.Item>
            ))}
          </Command.Group>

          {/* Sites */}
          {index === null ? (
            <div className="px-4 py-3 text-meta text-[var(--color-fg-muted)]">
              loading sites…
            </div>
          ) : (
            <Command.Group heading={`Sites · ${index.length}`}>
              {index.map((e) => (
                <PaletteRow
                  key={e.slug}
                  entry={e}
                  onSelect={() => go(`/sites/${e.slug}`, e.slug)}
                />
              ))}
            </Command.Group>
          )}
        </Command.List>

        <div className="flex items-center justify-between border-t rule px-5 py-3 text-meta text-[var(--color-fg-muted)]">
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> navigate · <kbd>↵</kbd> open
          </span>
          <span>
            <kbd>⌘</kbd>
            <kbd>K</kbd> toggle
          </span>
        </div>
      </Command>
    </div>
  );
}

function PaletteRow({
  entry,
  onSelect,
}: {
  entry: IndexEntry;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      value={`${entry.title} ${entry.host} ${entry.slug}`}
      onSelect={onSelect}
      className="group flex cursor-pointer items-baseline justify-between gap-4 rounded-sm px-4 py-3 text-sm aria-selected:bg-[var(--color-fg)]/4 aria-selected:text-[var(--color-link)]"
    >
      <span className="flex items-baseline gap-3 truncate">
        <span
          aria-hidden
          className="h-2.5 w-2.5 shrink-0 self-center border rule"
          style={{ background: entry.accent }}
        />
        <span className="font-display truncate text-base">{entry.title}</span>
        <span className="text-meta hidden truncate text-[var(--color-fg-muted)] sm:inline">
          {entry.host}
        </span>
      </span>
      <span className="text-meta whitespace-nowrap text-[var(--color-fg-muted)]">
        {entry.pageCount > 1 ? `${entry.pageCount} pages` : ""}
      </span>
    </Command.Item>
  );
}
