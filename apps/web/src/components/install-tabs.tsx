"use client";

/**
 * The MCP page's hero install module. Front and centre: pick your
 * client from a pill row, get the exact snippet, copy it in one
 * click. Pure UI state (which tab is active, copied flash); all
 * snippet content ships from the server component that renders this.
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

export function InstallTabs({ tabs }: { tabs: InstallTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const [copied, setCopied] = useState(false);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];
  if (!current) return null;

  async function copy() {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(current.snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* Clipboard can be blocked in embedded contexts - the snippet
       * is on screen, manual copy still works. */
    }
  }

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
              onClick={() => {
                setActive(t.id);
                setCopied(false);
              }}
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
        <div className="relative rounded-[calc(var(--radius-card)-0.5rem)] border rule bg-[var(--color-bg)] px-5 py-5 sm:px-6">
          <pre className="overflow-x-auto pr-20 text-left font-mono text-sm leading-relaxed">
            <code>{current.snippet}</code>
          </pre>
          <button
            type="button"
            onClick={copy}
            aria-label={`Copy ${current.label} install snippet`}
            className={`absolute right-3 top-3 inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
              copied
                ? "border-[var(--color-link)] bg-[color-mix(in_oklab,var(--color-link)_10%,transparent)] text-[var(--color-link)]"
                : "rule bg-[var(--color-bg)] text-[var(--color-fg-muted)] hover:border-[var(--color-link)] hover:text-[var(--color-link)]"
            }`}
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-2 pt-3 pb-1">
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
      </div>
    </div>
  );
}
