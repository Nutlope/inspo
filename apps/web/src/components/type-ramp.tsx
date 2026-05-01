import type { TypeRampEntry } from "@inspo/shared";

export function TypeRamp({ ramp }: { ramp: TypeRampEntry[] }) {
  if (!ramp.length) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-meta border-b rule">
            <th className="py-2 text-left font-normal">Role</th>
            <th className="py-2 text-left font-normal">Family</th>
            <th className="py-2 text-right font-normal">Size</th>
            <th className="py-2 text-right font-normal">Weight</th>
            <th className="py-2 text-right font-normal">Leading</th>
            <th className="py-2 text-right font-normal">Tracking</th>
            <th className="py-2 text-left font-normal">Sample</th>
          </tr>
        </thead>
        <tbody>
          {ramp.map((r) => (
            <tr key={r.role} className="border-b rule align-baseline">
              <td className="py-3 pr-3 font-mono text-xs uppercase tracking-wide text-[var(--color-fg-muted)]">
                {r.role}
              </td>
              <td className="py-3 pr-3 font-mono text-xs">{r.family}</td>
              <td className="py-3 pr-3 text-right font-mono text-xs">{r.sizePx}px</td>
              <td className="py-3 pr-3 text-right font-mono text-xs">{r.weight}</td>
              <td className="py-3 pr-3 text-right font-mono text-xs">{r.lineHeight}</td>
              <td className="py-3 pr-3 text-right font-mono text-xs">
                {r.letterSpacing}
              </td>
              <td className="py-3 pr-3">
                <span
                  style={{
                    fontFamily: r.family,
                    fontSize: `min(${r.sizePx}px, 2.25rem)`,
                    fontWeight: r.weight,
                    lineHeight: r.lineHeight,
                    letterSpacing: r.letterSpacing,
                  }}
                  className="text-[var(--color-fg)]"
                >
                  Aa Bb Cc
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
