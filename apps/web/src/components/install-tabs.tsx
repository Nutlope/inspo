"use client";

/**
 * Per-client MCP install snippets as a tabbed strip. Pure UI state
 * (which tab is active); all snippet content ships from the server
 * component that renders this.
 */

import { useState } from "react";

export type InstallTab = {
  id: string;
  label: string;
  /** Short natural-case note above the snippet (config path etc). */
  note?: string;
  /** The copy-pasteable snippet. */
  snippet: string;
  /** Optional one-click deeplink (Cursor). */
  deeplink?: { href: string; label: string };
};

export function InstallTabs({ tabs }: { tabs: InstallTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const current = tabs.find((t) => t.id === active) ?? tabs[0];
  if (!current) return null;

  return (
    <div className="mt-8">
      <div
        role="tablist"
        aria-label="Install instructions per client"
        className="flex flex-wrap gap-x-1 gap-y-2 border-b rule"
      >
        {tabs.map((t) => {
          const selected = t.id === current.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(t.id)}
              className={`-mb-px border-b-2 px-3 pb-2.5 pt-1 text-sm transition-colors ${
                selected
                  ? "border-[var(--color-link)] text-[var(--color-fg)]"
                  : "border-transparent text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className="pt-5">
        {current.note && (
          <p className="mb-3 text-sm text-[var(--color-fg-muted)]">
            {current.note}
          </p>
        )}
        <pre className="overflow-x-auto border rule bg-[color-mix(in_oklab,var(--color-fg)_4%,var(--color-bg))] px-5 py-4 font-mono text-sm leading-relaxed">
          <code>{current.snippet}</code>
        </pre>
        {current.deeplink && (
          <p className="mt-3 text-sm">
            <a
              href={current.deeplink.href}
              className="text-[var(--color-link)] underline-offset-4 hover:underline"
            >
              {current.deeplink.label}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
