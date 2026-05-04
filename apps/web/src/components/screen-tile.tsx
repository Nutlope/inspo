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
  priority = false,
}: {
  screen: ScreenSummary;
  variant?: Variant;
  index?: number;
  showCaption?: boolean;
  className?: string;
  /** First 12 tiles get loading="eager" + fetchpriority="high" so the
   *  above-the-fold grid paints crisp. Below the fold stays lazy. */
  priority?: boolean;
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
          className={`relative w-full overflow-hidden border rule transition-transform duration-[280ms] ease-out group-hover:scale-[1.012] ${ASPECT[variant]}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={`${screen.title} — ${screen.description}`}
            className="h-full w-full object-cover"
            loading={priority ? "eager" : "lazy"}
            decoding={priority ? "sync" : "async"}
            // @ts-expect-error — fetchpriority is valid HTML, React types lag
            fetchpriority={priority ? "high" : undefined}
          />

          {/* Hover strip — palette swatches + macrostructure caption.
              Opacity-fades in (no slide), calmer than translate. Reads
              on focus too for keyboard users. */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-[color-mix(in_oklab,var(--color-bg)_94%,transparent)] px-3 py-2 opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100 group-focus-within:opacity-100"
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
