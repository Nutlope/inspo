"use client";

/**
 * Tiny inline copy button. Mirrors the visual rhythm of the existing
 * CopyDesignMd component but trimmed for inline use next to a hex /
 * px / token. Two-state spring: "copy" → "✓ copied" → fades back.
 *
 * Why a fresh component instead of reusing CopyDesignMd: the existing
 * copy is a primary CTA with full-bleed type. This one needs to be
 * unobtrusive - visible on hover, ghost-quiet otherwise.
 */

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyValue({
  value,
  label,
  caption,
  className = "",
}: {
  value: string;
  /** Accessible label, e.g. "Copy hex". Falls back to "Copy". */
  label?: string;
  /** Optional short word rendered after the icon ("hex", "oklch").
   *  For spots where several copy buttons sit side by side and bare
   *  icons would be indistinguishable. */
  caption?: string;
  className?: string;
}) {
  const [done, setDone] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      setTimeout(() => setDone(false), 1400);
    } catch {
      /* Quietly fail - clipboard API can be blocked by permission
       *  policy in some embedded contexts. The value is still
       *  visible on screen so the user can copy manually. */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label ?? "Copy"}
      title={label ?? "Copy"}
      className={
        `inline-flex items-center justify-center rounded-full p-1 ` +
        `text-[var(--color-fg-muted)] hover:text-[var(--color-link)] ` +
        `transition-colors ${className}`
      }
    >
      {/* Icon-only: the word "copy" next to every value read as
          clutter. The check confirms; colour does the celebrating. */}
      {done ? (
        <Check size={14} strokeWidth={2} aria-hidden className="text-[var(--color-link)]" />
      ) : (
        <Copy size={14} strokeWidth={1.75} aria-hidden />
      )}
      {caption && (
        <span className="ml-1.5 font-mono text-xs tracking-normal">
          {caption}
        </span>
      )}
    </button>
  );
}
