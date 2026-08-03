import type { TypeRampEntry } from "@inspo/shared";

export function TypeRamp({ ramp }: { ramp: TypeRampEntry[] }) {
  if (!ramp.length) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-meta border-b rule">
            <th className="py-2.5 pr-4 text-left font-normal">Role</th>
            <th className="py-2.5 pr-4 text-left font-normal">Family</th>
            <th className="py-2.5 pr-4 text-right font-normal">Size</th>
            <th className="py-2.5 pr-4 text-right font-normal">Weight</th>
            <th className="py-2.5 pr-4 text-right font-normal">Leading</th>
            <th className="py-2.5 pr-8 text-right font-normal">Tracking</th>
            <th className="py-2.5 text-left font-normal">Sample</th>
          </tr>
        </thead>
        <tbody>
          {ramp.map((r) => (
            <tr key={r.role} className="border-b rule align-baseline">
              <td className="py-3 pr-4 text-xs tracking-normal text-[var(--color-fg-muted)] whitespace-nowrap">
                {r.role}
              </td>
              <td className="py-3 pr-4 text-xs whitespace-nowrap">{r.family}</td>
              <td className="py-3 pr-4 text-right text-xs tabular-nums">{r.sizePx}px</td>
              <td className="py-3 pr-4 text-right text-xs tabular-nums">{r.weight}</td>
              <td className="py-3 pr-4 text-right text-xs tabular-nums">{r.lineHeight}</td>
              <td className="py-3 pr-8 text-right text-xs tabular-nums">
                {r.letterSpacing}
              </td>
              <td className="py-3">
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
