/**
 * Visual ruler for an extracted spacing or radius scale. Each value
 * gets a square of side n × min(1, scale-factor) so big values don't
 * overflow the container; the px label sits underneath in mono.
 */

export function ScaleRuler({
  values,
  unit = "px",
  capPx = 96,
}: {
  values: number[];
  unit?: string;
  capPx?: number;
}) {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  const scale = max > capPx ? capPx / max : 1;

  return (
    <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
      {values.map((v) => {
        const visualPx = Math.max(4, Math.round(v * scale));
        return (
          <div key={v} className="flex flex-col items-start">
            <div
              className="bg-[var(--color-fg)]/15 border-l border-[var(--color-fg-muted)]/40"
              style={{ width: visualPx, height: visualPx }}
            />
            <span className="text-meta mt-2">
              {v}
              {unit}
            </span>
          </div>
        );
      })}
    </div>
  );
}
