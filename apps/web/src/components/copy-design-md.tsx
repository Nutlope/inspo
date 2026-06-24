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
      ? "Couldn't copy - try the download"
      : "Copy DESIGN.md";

  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
      <button
        type="button"
        onClick={copy}
        disabled={state === "copying"}
        className="
          font-mono inline-flex items-center gap-2
          bg-[var(--color-fg)] !text-white
          px-5 py-3 text-sm font-medium tracking-wide uppercase
          transition-opacity hover:opacity-90
          disabled:opacity-50
          dark:!text-[var(--color-bg)]
        "
      >
        {state === "ok" ? <span aria-hidden>✓</span> : null}
        <span>{label}</span>
      </button>
      <a
        href={`/api/design/${slug}`}
        download={`DESIGN-${slug}.md`}
        className="text-meta hover:text-[var(--color-link)]"
      >
        Download .md
      </a>
      <a
        href={`/api/design/${slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-meta hover:text-[var(--color-link)]"
      >
        View raw ↗
      </a>
    </div>
  );
}
