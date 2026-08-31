import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Sequence,
  useCurrentFrame,
} from "remotion";
import {
  cellRect,
  EMBER,
  EMBER_CELL,
  GRID,
  GRID_SLUGS,
  MONTAGE,
  tileSrc,
} from "../shots";
import { colors, EXPO } from "../theme";

/* Local timeline (scene starts at global frame 63):
   0-67    seven full-bleed cuts, each shorter than the last
   67-     ember-and-ash lands full-bleed
   72-96   it shrinks into its grid cell
   76-112  the other eleven tiles spring in, radiating from the center
   until end: the whole grid drifts forward */

const montageStarts = MONTAGE.reduce<number[]>((acc, s, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + MONTAGE[i - 1].duration);
  return acc;
}, []);

const SHRINK_START = 73;
const SHRINK_END = 100;

const emberRect = cellRect(EMBER_CELL);
const emberCol = EMBER_CELL % GRID.cols;
const emberRow = Math.floor(EMBER_CELL / GRID.cols);

export const ArchiveScene: React.FC = () => {
  const frame = useCurrentFrame();

  const shrink = interpolate(frame, [SHRINK_START, SHRINK_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...EXPO),
  });

  /* Slow forward drift once the grid exists, so the hold never sits still. */
  const drift = interpolate(frame, [SHRINK_START, 150], [1, 1.045], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.linear,
  });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.paper }}>
      {/* ── The cuts ────────────────────────────────────────── */}
      {MONTAGE.map((s, i) => (
        <Sequence
          key={s.src}
          from={montageStarts[i]}
          durationInFrames={s.duration}
          layout="absolute-fill"
          name={`Cut ${i + 1}`}
        >
          <MontageCut src={s.src} duration={s.duration} />
        </Sequence>
      ))}

      {/* ── Ember + grid ────────────────────────────────────── */}
      <Sequence from={67} layout="absolute-fill" name="Archive grid">
        <AbsoluteFill style={{ scale: String(drift) }}>
          {GRID_SLUGS.map((slug, i) => {
            if (slug === null) {
              return null;
            }
            const rect = cellRect(i);
            const col = i % GRID.cols;
            const row = Math.floor(i / GRID.cols);
            /* Radiate outward from the ember cell. */
            const dist = Math.abs(col - emberCol) + Math.abs(row - emberRow);
            /* Neighbors are already flying in while ember shrinks, so
               the frame is never mostly empty paper. */
            const start = 69 + dist * 4;
            return (
              <div
                key={slug}
                style={{
                  position: "absolute",
                  left: rect.x,
                  top: rect.y,
                  width: rect.w,
                  height: rect.h,
                  borderRadius: GRID.radius,
                  overflow: "hidden",
                  opacity: interpolate(frame, [start, start + 10], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    easing: Easing.bezier(...EXPO),
                  }),
                  scale: String(
                    interpolate(frame, [start, start + 16], [0.82, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                      easing: Easing.bezier(...EXPO),
                    }),
                  ),
                }}
              >
                <Img
                  src={tileSrc(slug)}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "top",
                  }}
                />
              </div>
            );
          })}

          {/* Ember: full-bleed cut that becomes a tile. */}
          <div
            style={{
              position: "absolute",
              left: interpolate(shrink, [0, 1], [0, emberRect.x]),
              top: interpolate(shrink, [0, 1], [0, emberRect.y]),
              width: interpolate(shrink, [0, 1], [1920, emberRect.w]),
              height: interpolate(shrink, [0, 1], [1080, emberRect.h]),
              borderRadius: interpolate(shrink, [0, 1], [0, GRID.radius]),
              overflow: "hidden",
            }}
          >
            <Img
              src={EMBER}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "top",
              }}
            />
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

/* One full-bleed cut with a touch of forward drift so no frame is static. */
const MontageCut: React.FC<{ src: string; duration: number }> = ({
  src,
  duration,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        scale: String(
          interpolate(frame, [0, duration], [1.06, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.linear,
          }),
        ),
      }}
    >
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "top",
        }}
      />
    </AbsoluteFill>
  );
};
