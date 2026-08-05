"use client";

/**
 * The MCP page's hero install module. Front and centre: pick your
 * client from a pill row, get the exact snippet, copy it in one
 * click. Pure UI state (which tab is active, copied flashes); all
 * snippet content ships from the server component that renders this.
 *
 * Two install paths, both always visible:
 *  - the per-client snippet (hosted HTTP endpoint - zero setup)
 *  - a persistent "run it locally" npx row (same server over stdio)
 */

import { useState } from "react";

export type InstallTab = {
  id: string;
  label: string;
  /** Short natural-case note under the snippet (config path etc). */
  note?: string;
  /** The copy-pasteable snippet. */
  snippet: string;
  /** Optional one-click deeplink (Cursor). */
  deeplink?: { href: string; label: string };
};

const LOCAL_CMD = "npx -y inspo-mcp";

function CopyPill({
  value,
  label,
  className = "",
}: {
  value: string;
  label: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* Clipboard can be blocked in embedded contexts - the snippet
       * is on screen, manual copy still works. */
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      className={`inline-flex items-center justify-center rounded-full border px-3.5 py-1.5 text-xs leading-none transition-colors ${
        copied
          ? "border-[var(--color-link)] bg-[color-mix(in_oklab,var(--color-link)_10%,transparent)] text-[var(--color-link)]"
          : "rule bg-[var(--color-bg)] text-[var(--color-fg-muted)] hover:border-[var(--color-link)] hover:text-[var(--color-link)]"
      } ${className}`}
    >
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}

export function InstallTabs({ tabs }: { tabs: InstallTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const current = tabs.find((t) => t.id === active) ?? tabs[0];
  if (!current) return null;

  const multiline = current.snippet.includes("\n");

  return (
    <div className="rounded-card border rule bg-[color-mix(in_oklab,var(--color-fg)_3%,var(--color-bg))] p-3 sm:p-4">
      <div
        role="tablist"
        aria-label="Install instructions per client"
        className="flex flex-wrap justify-center gap-1.5 p-1 sm:p-2"
      >
        {tabs.map((t) => {
          const selected = t.id === current.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(t.id)}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                selected
                  ? "bg-[var(--color-fg)] text-[var(--color-bg)]"
                  : "text-[var(--color-fg-muted)] hover:bg-[color-mix(in_oklab,var(--color-fg)_7%,transparent)] hover:text-[var(--color-fg)]"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className="mt-2">
        <div
          className={`flex gap-3 rounded-[calc(var(--radius-card)-0.5rem)] border rule bg-[var(--color-bg)] py-4 pl-5 pr-3 sm:pl-6 ${
            multiline ? "items-start" : "items-center"
          }`}
        >
          <pre className="min-w-0 flex-1 overflow-x-auto py-0.5 text-left font-mono text-sm leading-relaxed">
            <code>{current.snippet}</code>
          </pre>
          <CopyPill
            value={current.snippet}
            label={`Copy ${current.label} install snippet`}
            className="shrink-0"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-2 pt-3">
          {current.note && (
            <p className="text-sm text-[var(--color-fg-muted)]">
              {current.note}
            </p>
          )}
          {current.deeplink && (
            <a
              href={current.deeplink.href}
              className="text-sm text-[var(--color-link)] underline-offset-4 hover:underline"
            >
              {current.deeplink.label}
            </a>
          )}
        </div>

        {/* Local path - always visible, whatever the client. */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-card border rule bg-[var(--color-bg)] px-5 py-3 sm:rounded-full sm:py-2 sm:pl-5 sm:pr-2">
          <p className="flex min-w-0 flex-wrap items-baseline gap-x-3 text-sm text-[var(--color-fg-muted)]">
            <span>Prefer local? Same server, over stdio:</span>
            <code className="font-mono text-[var(--color-fg)]">{LOCAL_CMD}</code>
          </p>
          <CopyPill value={LOCAL_CMD} label="Copy local npx command" />
        </div>
      </div>
    </div>
  );
}
