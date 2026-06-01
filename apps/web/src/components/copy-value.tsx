"use client";

/**
 * Tiny inline copy button. Mirrors the visual rhythm of the existing
 * CopyDesignMd component but trimmed for inline use next to a hex /
 * px / token. Two-state spring: "copy" → "✓ copied" → fades back.
 *
 * Why a fresh component instead of reusing CopyDesignMd: the existing
 * copy is a primary CTA with full-bleed type. This one needs to be
 * unobtrusive — visible on hover, ghost-quiet otherwise.
 */

import { useState } from "react";

export function CopyValue({
  value,
  label,
  className = "",
}: {
  value: string;
  /** Accessible label, e.g. "Copy hex". Falls back to "Copy". */
  label?: string;
  className?: string;
}) {
  const [done, setDone] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      setTimeout(() => setDone(false), 1400);
    } catch {
      /* Quietly fail — clipboard API can be blocked by permission
       *  policy in some embedded contexts. The value is still
       *  visible on screen so the user can copy manually. */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label ?? "Copy"}
      className={
        `inline-flex items-center justify-center font-mono text-[10px] uppercase tracking-wider ` +
        `text-[var(--color-fg-muted)] hover:text-[var(--color-link)] ` +
        `transition-colors ${className}`
      }
    >
      {done ? "✓ copied" : "copy"}
    </button>
  );
}
