"use client";

/**
 * Inline "Add to compare" button - sits on the detail page so the
 * user can build a compare set as they browse. Mirrors the dock's
 * state so toggling here updates the floating dock instantly.
 */

import { useEffect, useState } from "react";
import {
  compareHas,
  compareToggle,
  useCompareSet,
} from "@/components/compare-dock";

export function AddToCompare({ slug, title }: { slug: string; title: string }) {
  const items = useCompareSet();
  const [mounted, setMounted] = useState(false);
  const [bumpAtCap, setBumpAtCap] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // SSR / first paint: render a stable placeholder so the click
    // target's geometry doesn't reshuffle on hydration.
    return <Skeleton />;
  }

  const isIn = items.some((x) => x.slug === slug) || compareHas(slug);

  function click() {
    const added = compareToggle({ slug, title });
    if (!added && !isIn && items.length >= 4) {
      // At-capacity case: compareToggle returns true (= signal). We
      // shake the button for a beat to flag it.
      setBumpAtCap(true);
      setTimeout(() => setBumpAtCap(false), 600);
    }
  }

  return (
    <button
      type="button"
      onClick={click}
      aria-pressed={isIn}
      className={
        `inline-flex items-center gap-2 rounded-full border rule px-3 py-1.5 ` +
        `font-mono text-xs tracking-normal transition-colors ` +
        (isIn
          ? "bg-[var(--color-fg)] text-[var(--color-bg)]"
          : "hover:text-[var(--color-link)]") +
        (bumpAtCap ? " animate-pulse" : "")
      }
    >
      {isIn ? "✓ in compare" : "+ add to compare"}
    </button>
  );
}

function Skeleton() {
  return (
    <span
      aria-hidden
      className="inline-block h-7 w-32 rounded-full border rule"
    />
  );
}
