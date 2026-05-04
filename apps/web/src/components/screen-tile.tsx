import Link from "next/link";
import type { ScreenSummary } from "@inspo/shared";
import { MACROSTRUCTURE_LABELS } from "@inspo/taxonomy";

type Variant = "thumb" | "hero" | "feature";

const ASPECT: Record<Variant, string> = {
  thumb: "aspect-[4/3]",
  hero: "aspect-[16/10]",
  feature: "aspect-[16/9]",
};

export function ScreenTile({
  screen,
  variant = "thumb",
  index,
  showCaption = true,
  className = "",
}: {
  screen: ScreenSummary;
  variant?: Variant;
  index?: number;
  showCaption?: boolean;
  className?: string;
}) {
  const macroKey = screen.tags.macrostructure;
  const macro = macroKey ? MACROSTRUCTURE_LABELS[macroKey] : null;

  const indexLabel =
    typeof index === "number" ? String(index).padStart(3, "0") : screen.id;

  const src =
    variant === "thumb" ? screen.thumbUrl : screen.imageUrl;

  return (
    <article className={`group ${className}`}>
      <Link
        href={`/screens/${screen.slug}`}
        className="block focus:outline-none"
      >
        <div
          className={`relative w-full overflow-hidden border rule transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:rotate-[0.15deg] ${ASPECT[variant]}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={`${screen.title} — ${screen.description}`}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />

          {/* Hover strip — palette swatches + macrostructure caption.
              Slides up from the bottom on hover (motion respects
              prefers-reduced-motion via globals.css). Read on focus
              too for keyboard users. */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-between gap-3 bg-[color-mix(in_oklab,var(--color-bg)_92%,transparent)] px-3 py-2 backdrop-blur-sm transition-transform duration-200 ease-out group-hover:translate-y-0 group-focus-within:translate-y-0"
            aria-hidden
          >
            <div className="flex items-center gap-1">
              {screen.palette.slice(0, 5).map((hex, i) => (
                <span
                  key={`${hex}-${i}`}
                  title={hex}
                  className="block h-3 w-3 border rule"
                  style={{ background: hex }}
                />
              ))}
            </div>
            <p className="text-meta truncate text-[var(--color-fg)]">
              {macro ?? screen.tags.style[0] ?? "—"}
            </p>
          </div>
        </div>

        {showCaption && (
          <div className="mt-3 flex items-baseline justify-between gap-3">
            <p className="font-display text-lg leading-tight">
              <span className="text-meta mr-2">{indexLabel}</span>
              <span className="transition-colors group-hover:text-[var(--color-link)]">
                {screen.title}
              </span>
            </p>
            <p className="text-meta whitespace-nowrap">
              {macro ?? screen.tags.style[0] ?? "—"}
            </p>
          </div>
        )}
      </Link>
    </article>
  );
}
