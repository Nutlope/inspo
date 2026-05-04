import Link from "next/link";

/**
 * A second strip beneath the home sort tabs — quick filter chips that
 * route directly to /screens with a Mood or Color filter pre-applied.
 *
 * Curated subset, not the full taxonomy: showing every Mood × Color
 * combo would be busy. These are the eight axes a designer reaches for
 * most often when starting a brief. The /screens filter rail still
 * exposes the full set.
 */

const MOODS = ["technical", "calm", "loud", "soft", "luxe"] as const;
const COLORS = ["warm", "cool", "monochrome", "neon", "earthy"] as const;

export function HomeChips() {
  return (
    <div className="mt-4 flex flex-col items-center gap-3">
      <Chips kind="mood" options={MOODS} label="Mood" />
      <Chips kind="color" options={COLORS} label="Color" />
    </div>
  );
}

function Chips({
  kind,
  options,
  label,
}: {
  kind: "mood" | "color";
  options: readonly string[];
  label: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
      <span className="text-meta w-14 text-right text-[var(--color-fg-muted)]">
        {label}
      </span>
      {options.map((opt) => (
        <Link
          key={opt}
          href={`/screens?${kind}=${encodeURIComponent(opt)}`}
          className="text-meta border rule px-3 py-1 leading-none transition-colors hover:border-[var(--color-link)] hover:text-[var(--color-link)]"
        >
          {opt}
        </Link>
      ))}
    </div>
  );
}
