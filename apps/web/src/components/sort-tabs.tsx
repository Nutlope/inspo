import Link from "next/link";
import type { ScreenSort } from "@inspo/db";

/**
 * Three text-tab links beneath the home hero. Active gets the accent-red
 * underline; the rest stay muted. Mono caption typography.
 *
 * "Most varied" is the editorial answer to refero's "Trending" — Inspo
 * doesn't track view counts (no telemetry, per the open-source posture),
 * so we curate variety instead of popularity.
 */

const TABS: { value: ScreenSort; label: string }[] = [
  { value: "latest", label: "Latest" },
  { value: "varied", label: "Most varied" },
  { value: "random", label: "Random" },
];

export function SortTabs({ active }: { active: ScreenSort }) {
  return (
    <nav aria-label="Sort grid" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-meta">
      <span aria-hidden className="text-[var(--color-fg-muted)]">·</span>
      {TABS.map((t) => {
        const isActive = active === t.value;
        const href = t.value === "latest" ? "/" : `/?sort=${t.value}`;
        return (
          <Link
            key={t.value}
            href={href}
            className={`underline-offset-[6px] transition-colors ${
              isActive
                ? "text-[var(--color-link)] underline decoration-[var(--color-link)]"
                : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
            }`}
            scroll={false}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
