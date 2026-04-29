export function PaletteStrip({
  palette,
  size = "md",
  showHex = true,
}: {
  palette: string[];
  size?: "sm" | "md" | "lg";
  showHex?: boolean;
}) {
  const dim = size === "sm" ? "h-6 w-6" : size === "lg" ? "h-12 w-12" : "h-9 w-9";

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {palette.map((hex) => (
        <span
          key={hex}
          className="flex items-center gap-2"
          aria-label={`Color ${hex}`}
        >
          <span
            className={`${dim} border rule`}
            style={{ background: hex }}
            aria-hidden
          />
          {showHex && (
            <span className="text-meta uppercase tracking-wider">{hex.replace("#", "")}</span>
          )}
        </span>
      ))}
    </div>
  );
}
