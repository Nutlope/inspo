"use client";

/**
 * Tabbed export block - replaces the bare <pre> for CSS variables on
 * the detail page. Three tabs:
 *   - CSS    :root { … }
 *   - Tailwind v4 @theme block (palette + spacing tokens)
 *   - Markdown DESIGN.md (fetched from /api/design/[slug])
 *
 * Markdown is fetched lazily on first switch so we don't pay for it
 * if the user never opens that tab. The other two are generated
 * inline from the props.
 */

import { useRef, useState } from "react";
import { CopyValue } from "@/components/copy-value";

type Tab = "css" | "tailwind" | "md";

function paletteAsCss(palette: string[]): string {
  const roles = ["dominant", "surface", "ink", "accent", "detail"];
  const lines = palette.map(
    (hex, i) => `  --color-${roles[i] ?? `extra-${i}`}: ${hex};`,
  );
  return `:root {\n${lines.join("\n")}\n}`;
}

function paletteAsTailwind(palette: string[]): string {
  const roles = ["dominant", "surface", "ink", "accent", "detail"];
  const lines = palette.map(
    (hex, i) => `  --color-${roles[i] ?? `extra-${i}`}: ${hex};`,
  );
  return `@theme {\n${lines.join("\n")}\n}`;
}

function cssVarsBlock(cssVariables: Record<string, string>): string {
  const entries = Object.entries(cssVariables);
  if (!entries.length) return "";
  const lines = entries.map(([k, v]) => `  ${k}: ${v};`);
  return `\n\n/* CSS variables exposed by source */\n:root {\n${lines.join("\n")}\n}`;
}

export function ExportBlock({
  slug,
  palette,
  cssVariables,
}: {
  slug: string;
  palette: string[];
  cssVariables: Record<string, string>;
}) {
  const [tab, setTab] = useState<Tab>("css");
  const [md, setMd] = useState<string | null>(null);
  // Avoid cascading-render warning by using a ref for the in-flight
  // flag instead of state. The user only needs to see "Loading…" once,
  // and the markdown either resolves or sticks at the error message -
  // both via setState calls that don't fire during render.
  const mdFetchedRef = useRef(false);

  function selectTab(next: Tab) {
    setTab(next);
    if (next === "md" && !mdFetchedRef.current) {
      mdFetchedRef.current = true;
      fetch(`/api/design/${slug}`)
        .then((r) =>
          r.ok ? r.text() : Promise.reject(new Error(String(r.status))),
        )
        .then((text) => setMd(text))
        .catch(() => setMd("# Could not load DESIGN.md"));
    }
  }

  const cssContent = paletteAsCss(palette) + cssVarsBlock(cssVariables);
  const twContent = paletteAsTailwind(palette);

  const content =
    tab === "css" ? cssContent : tab === "tailwind" ? twContent : md ?? "Loading…";

  return (
    <div className="rounded-card border rule overflow-hidden">
      <div className="flex items-center justify-between border-b rule bg-[color-mix(in_oklab,var(--color-fg)_4%,var(--color-bg))] px-4 py-2">
        <div role="tablist" className="flex gap-1">
          {(
            [
              ["css", "CSS"],
              ["tailwind", "Tailwind v4"],
              ["md", "DESIGN.md"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => selectTab(id)}
              className={
                `rounded-full font-mono text-xs tracking-normal px-3 py-1 transition-colors ` +
                (tab === id
                  ? "bg-[var(--color-fg)] text-[var(--color-bg)]"
                  : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]")
              }
            >
              {label}
            </button>
          ))}
        </div>
        <CopyValue
          value={content}
          label={`Copy ${tab.toUpperCase()}`}
          className="font-mono text-xs tracking-normal"
        />
      </div>
      <pre className="max-h-96 overflow-auto p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
        <code>{content}</code>
      </pre>
    </div>
  );
}
