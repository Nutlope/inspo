"use client";

import { useState } from "react";

export function CopyDesignMd({ slug }: { slug: string }) {
  const [state, setState] = useState<"idle" | "copying" | "ok" | "err">("idle");

  async function copy() {
    setState("copying");
    try {
      const res = await fetch(`/api/design/${slug}`);
      if (!res.ok) throw new Error(String(res.status));
      const md = await res.text();
      await navigator.clipboard.writeText(md);
      setState("ok");
      setTimeout(() => setState("idle"), 1800);
    } catch {
      setState("err");
      setTimeout(() => setState("idle"), 1800);
    }
  }

  const label =
    state === "copying"
      ? "Copying…"
      : state === "ok"
      ? "Copied to clipboard"
      : state === "err"
      ? "Couldn't copy — try the download"
      : "Copy DESIGN.md";

  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 text-meta">
      <button
        type="button"
        onClick={copy}
        disabled={state === "copying"}
        className="font-mono text-meta border rule bg-[var(--color-fg)] px-4 py-2 text-[var(--color-bg)] transition-opacity hover:opacity-80 disabled:opacity-40"
      >
        {state === "ok" ? "✓ " : ""}
        {label}
      </button>
      <a
        href={`/api/design/${slug}`}
        download={`DESIGN-${slug}.md`}
        className="hover:text-[var(--color-link)]"
      >
        Download .md
      </a>
      <a
        href={`/api/design/${slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-[var(--color-link)]"
      >
        View raw ↗
      </a>
    </div>
  );
}
