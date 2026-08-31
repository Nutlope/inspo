"use client";

/**
 * ⌘K command palette - Linear / Vercel / gallery pattern.
 *
 * - Cmd+K (Ctrl+K on Windows/Linux) toggles
 * - Esc closes
 * - Up/Down + Enter navigate; right-arrow on a site opens the action menu
 * - Fuzzy match across 1000 sites + nav + quick actions
 * - Recent + Saved groups persist in localStorage
 * - Per-site quick actions: open, copy DESIGN.md, save/unsave
 *
 * Built on cmdk (the headless palette used by Linear's). Styling is
 * editorial - mono caption text, paper bg, accent-red highlight on
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
  { label: "Components", href: "/components", hint: "Heroes, pricing, footers, sliced" },
  { label: "MCP", href: "/mcp", hint: "Install for Claude Code, Cursor, …" },
  // /mcp/use-cases is dev-only - it 404s in a production build, so it is
  // only offered here when one is running locally.
  ...(process.env.NODE_ENV !== "production"
    ? [{ label: "MCP use cases", href: "/mcp/use-cases", hint: "What an agent does with Inspo" }]
    : []),
  { label: "About", href: "/about", hint: "Open source, Together AI" },
];

const QUICK_ACTIONS = [
  {
    label: "Copy MCP install command",
    href: "#",
    hint: "claude mcp add … → clipboard",
    action: "copy-install",
  },
  {
    label: "Toggle dark mode",
    href: "#",
    hint: "Flip the surface tokens",
    action: "toggle-theme",
  },
] as const;

const RECENT_KEY = "inspo:cmdk:recent";
const SAVED_KEY = "inspo:cmdk:saved";
const RECENT_MAX = 6;

function readList(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
function writeList(key: string, list: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

function pushRecent(slug: string) {
  const next = [slug, ...readList(RECENT_KEY).filter((s) => s !== slug)].slice(
    0,
    RECENT_MAX,
  );
  writeList(RECENT_KEY, next);
}

function toggleSaved(slug: string): string[] {
  const cur = readList(SAVED_KEY);
  const next = cur.includes(slug)
    ? cur.filter((s) => s !== slug)
    : [slug, ...cur];
  writeList(SAVED_KEY, next);
  return next;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState<IndexEntry[] | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
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

  /* ─── load index lazily on first open + re-read recent/saved ─── */
  useEffect(() => {
    if (!open) return;
    setRecent(readList(RECENT_KEY));
    setSaved(readList(SAVED_KEY));
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

  const byMap = useMemo(() => {
    if (!index) return new Map<string, IndexEntry>();
    return new Map(index.map((e) => [e.slug, e] as const));
  }, [index]);
  const recentSites = useMemo(
    () => recent.flatMap((s) => (byMap.get(s) ? [byMap.get(s)!] : [])),
    [recent, byMap],
  );
  const savedSites = useMemo(
    () => saved.flatMap((s) => (byMap.get(s) ? [byMap.get(s)!] : [])),
    [saved, byMap],
  );

  function go(href: string, slug?: string) {
    if (slug) pushRecent(slug);
    setOpen(false);
    setQuery("");
    startTransition(() => router.push(href));
  }

  async function copyDesignMd(slug: string, title: string) {
    try {
      const res = await fetch(`/api/design/${slug}`);
      const text = await res.text();
      await navigator.clipboard.writeText(text);
    } catch {
      /* swallow - user will see no change */
    }
    setOpen(false);
    setQuery("");
    // Tiny visual breadcrumb in the URL - no, just close. Title arg kept for future toast.
    void title;
  }

  function onSavedToggle(slug: string) {
    setSaved(toggleSaved(slug));
  }

  function onAction(name: string) {
    if (name === "copy-install") {
      navigator.clipboard
        .writeText(
          "claude mcp add --transport http inspo https://inspo-three.vercel.app/api/mcp",
        )
        .catch(() => {});
    } else if (name === "toggle-theme") {
      const html = document.documentElement;
      const dark = !html.classList.contains("dark");
      html.classList.toggle("dark", dark);
      try {
        localStorage.setItem("inspo:theme", dark ? "dark" : "light");
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
    setQuery("");
  }

  if (!open) return null;
  const savedSet = new Set(saved);

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
        className="font-mono w-full max-w-xl overflow-hidden rounded-card border rule bg-[var(--color-bg)] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.2)]"
        label="Command palette"
      >
        <div className="relative flex items-center border-b rule">
          <span
            aria-hidden
            className="inline-flex shrink-0 pl-5 pr-3 text-[var(--color-fg-muted)]"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </span>
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder="search sites, pages, commands - or save / copy DESIGN.md"
            autoFocus
            className="flex-1 bg-transparent py-4 pr-5 text-base placeholder:text-[var(--color-fg-muted)] focus:outline-none"
          />
          <kbd className="pr-5 text-meta text-[var(--color-fg-muted)]">esc</kbd>
        </div>

        <Command.List className="max-h-[60vh] overflow-y-auto p-2">
          <Command.Empty className="px-4 py-6 text-meta">
            nothing matches.
          </Command.Empty>

          {/* Saved */}
          {query === "" && savedSites.length > 0 && (
            <Command.Group heading="saved">
              {savedSites.map((e) => (
                <SiteRow
                  key={`saved-${e.slug}`}
                  entry={e}
                  saved
                  onOpen={() => go(`/sites/${e.slug}`, e.slug)}
                  onCopy={() => copyDesignMd(e.slug, e.title)}
                  onToggleSave={() => onSavedToggle(e.slug)}
                />
              ))}
            </Command.Group>
          )}

          {/* Recent */}
          {query === "" && recentSites.length > 0 && (
            <Command.Group heading="recent">
              {recentSites.map((e) => (
                <SiteRow
                  key={`recent-${e.slug}`}
                  entry={e}
                  saved={savedSet.has(e.slug)}
                  onOpen={() => go(`/sites/${e.slug}`, e.slug)}
                  onCopy={() => copyDesignMd(e.slug, e.title)}
                  onToggleSave={() => onSavedToggle(e.slug)}
                />
              ))}
            </Command.Group>
          )}

          {/* Navigation */}
          <Command.Group heading="navigate">
            {STATIC_NAV.map((n) => (
              <Command.Item
                key={n.href}
                value={`${n.label} ${n.hint}`}
                onSelect={() => go(n.href)}
                className="group flex cursor-pointer items-baseline justify-between gap-4 rounded-xl px-4 py-3 text-sm aria-selected:bg-[var(--color-fg)]/4 aria-selected:text-[var(--color-link)]"
              >
                <span className="font-display text-base">{n.label}</span>
                <span className="text-meta text-[var(--color-fg-muted)]">
                  {n.hint}
                </span>
              </Command.Item>
            ))}
          </Command.Group>

          {/* Quick actions */}
          <Command.Group heading="actions">
            {QUICK_ACTIONS.map((a) => (
              <Command.Item
                key={a.action}
                value={`${a.label} ${a.hint}`}
                onSelect={() => onAction(a.action)}
                className="group flex cursor-pointer items-baseline justify-between gap-4 rounded-xl px-4 py-3 text-sm aria-selected:bg-[var(--color-fg)]/4 aria-selected:text-[var(--color-link)]"
              >
                <span className="font-display text-base">{a.label}</span>
                <span className="text-meta text-[var(--color-fg-muted)]">
                  {a.hint}
                </span>
              </Command.Item>
            ))}
          </Command.Group>

          {/* Sites - each has 3 hidden actions: open, copy DESIGN.md, save */}
          {index === null ? (
            <div className="px-4 py-3 text-meta text-[var(--color-fg-muted)]">
              loading sites…
            </div>
          ) : (
            <Command.Group heading="sites">
              {index.map((e) => (
                <SiteRow
                  key={e.slug}
                  entry={e}
                  saved={savedSet.has(e.slug)}
                  onOpen={() => go(`/sites/${e.slug}`, e.slug)}
                  onCopy={() => copyDesignMd(e.slug, e.title)}
                  onToggleSave={() => onSavedToggle(e.slug)}
                />
              ))}
            </Command.Group>
          )}
        </Command.List>

        <div className="flex items-center justify-between border-t rule px-5 py-3 text-meta text-[var(--color-fg-muted)]">
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> nav · <kbd>↵</kbd> open · <kbd>⌘C</kbd> copy DESIGN.md · <kbd>⌘S</kbd> save
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

function SiteRow({
  entry,
  saved,
  onOpen,
  onCopy,
  onToggleSave,
}: {
  entry: IndexEntry;
  saved: boolean;
  onOpen: () => void;
  onCopy: () => void;
  onToggleSave: () => void;
}) {
  // Single Command.Item - the keyboard shortcuts ⌘C / ⌘S below the
  // input route to onCopy / onToggleSave when this row is highlighted.
  return (
    <Command.Item
      value={`${entry.title} ${entry.host} ${entry.slug}`}
      onSelect={onOpen}
      onKeyDown={(e) => {
        const isMac = navigator.platform.toLowerCase().includes("mac");
        const mod = isMac ? e.metaKey : e.ctrlKey;
        if (mod && e.key.toLowerCase() === "c") {
          e.preventDefault();
          onCopy();
        } else if (mod && e.key.toLowerCase() === "s") {
          e.preventDefault();
          onToggleSave();
        }
      }}
      className="group flex cursor-pointer items-baseline justify-between gap-4 rounded-xl px-4 py-3 text-sm aria-selected:bg-[var(--color-fg)]/4 aria-selected:text-[var(--color-link)]"
    >
      <span className="flex items-baseline gap-3 truncate">
        <span
          aria-hidden
          className="h-2.5 w-2.5 shrink-0 self-center rounded-full border rule"
          style={{ background: entry.accent }}
        />
        <span className="font-display truncate text-base">{entry.title}</span>
        <span className="text-meta hidden truncate text-[var(--color-fg-muted)] sm:inline">
          {entry.host}
        </span>
      </span>
      <span className="flex items-baseline gap-3 whitespace-nowrap text-meta text-[var(--color-fg-muted)]">
        {saved && <span title="Saved" className="text-[var(--color-link)]">★</span>}
        {entry.pageCount > 1 ? `${entry.pageCount} pages` : ""}
      </span>
    </Command.Item>
  );
}
