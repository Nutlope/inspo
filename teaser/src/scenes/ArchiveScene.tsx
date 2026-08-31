import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { CARD, cellRect, GRID, GRID_SLUGS, PICKS, RESULT, tileSrc } from "../shots";
import { colors, EXPO, fonts } from "../theme";

/* Local timeline (scene starts at global frame 70):
   0-14    the archive grid pops in, a cascade from the top-left
   18/32/46  Inspo selects three references: ring + check, one by one
   52-64   everything unselected falls away
   62-88   the three picks fly to the center and stack like pulled cards
   88-98   the stack snaps into perfect alignment
   100-122 the stack expands full-bleed and becomes the new page
   until end: the result holds with a slow push-in */

const SEL_AT = [18, 32, 46];
const CONV_START = 62;
const BUILD_START = 100;
const BUILD_END = 122;

/* Fanned offsets for the card stack: two behind, the last pick in front. */
const STACK = [
  { dx: -36, dy: 20, rot: -5 },
  { dx: 34, dy: -14, rot: 4 },
  { dx: 0, dy: 0, rot: 0 },
];

const expo = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
  easing: Easing.bezier(...EXPO),
};

export const ArchiveScene: React.FC = () => {
  const frame = useCurrentFrame();

  /* Slow forward drift while the grid is up, so nothing ever sits still. */
  const drift = interpolate(frame, [0, CONV_START], [1, 1.015], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.linear,
  });

  const build = interpolate(frame, [BUILD_START, BUILD_END], [0, 1], expo);

  return (
    <AbsoluteFill style={{ backgroundColor: colors.paper }}>
      <AbsoluteFill style={{ scale: String(drift) }}>
        {GRID_SLUGS.map((slug, i) => {
          const pick = PICKS.indexOf(i);
          if (pick !== -1) {
            return null; /* picks render after, on top */
          }
          const rect = cellRect(i);
          const col = i % GRID.cols;
          const row = Math.floor(i / GRID.cols);
          const inAt = (row + col) * 2;
          /* Once the picking starts, the rest of the archive recedes,
             then falls away entirely. */
          const dimmed = interpolate(frame, [SEL_AT[0], 50], [1, 0.75], expo);
          const gone = 52 + i * 0.5;
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
                opacity:
                  interpolate(frame, [inAt, inAt + 10], [0, 1], expo) *
                  dimmed *
                  interpolate(frame, [gone, gone + 10], [1, 0], expo),
                scale: String(
                  interpolate(frame, [inAt, inAt + 14], [0.86, 1], expo) *
                    interpolate(frame, [gone, gone + 12], [1, 0.94], expo),
                ),
                translate: `0px ${
                  interpolate(frame, [inAt, inAt + 12], [16, 0], expo) +
                  interpolate(frame, [gone, gone + 12], [0, 16], expo)
                }px`,
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

        {/* ── The three picks ─────────────────────────────────── */}
        {PICKS.map((cellIndex, k) => {
          const slug = GRID_SLUGS[cellIndex];
          const rect = cellRect(cellIndex);
          const col = cellIndex % GRID.cols;
          const row = Math.floor(cellIndex / GRID.cols);
          const inAt = (row + col) * 2;
          const s = SEL_AT[k];

          /* Fly from the grid cell to the fanned card stack... */
          const conv = interpolate(
            frame,
            [CONV_START + k * 4, CONV_START + k * 4 + 24],
            [0, 1],
            expo,
          );
          /* ...then snap into perfect alignment before the build. */
          const align = interpolate(frame, [88, 98], [0, 1], expo);
          const dx = STACK[k].dx * (1 - align);
          const dy = STACK[k].dy * (1 - align);
          const rot = STACK[k].rot * (1 - align);

          const left = interpolate(conv, [0, 1], [rect.x, CARD.x + dx]);
          const top = interpolate(conv, [0, 1], [rect.y, CARD.y + dy]);
          const w = interpolate(conv, [0, 1], [rect.w, CARD.w]);
          const h = interpolate(conv, [0, 1], [rect.h, CARD.h]);
          const radius = interpolate(conv, [0, 1], [GRID.radius, CARD.radius]);

          /* Selection pulse, eased back out as the card starts to fly. */
          const pulse =
            interpolate(frame, [s, s + 6], [1, 1.035], expo) *
            interpolate(
              frame,
              [CONV_START + k * 4, CONV_START + k * 4 + 10],
              [1, 1 / 1.035],
              expo,
            );

          const trimOn = interpolate(frame, [s, s + 4], [0, 1], expo);
          const trimOff = interpolate(frame, [58, 68], [1, 0], expo);

          return (
            <div
              key={slug}
              style={{
                position: "absolute",
                left,
                top,
                width: w,
                height: h,
                rotate: `${rot * conv}deg`,
                scale: String(
                  interpolate(frame, [inAt, inAt + 14], [0.86, 1], expo) *
                    pulse,
                ),
                opacity:
                  interpolate(frame, [inAt, inAt + 10], [0, 1], expo) *
                  /* the result container takes over from here */
                  (frame >= BUILD_START ? 0 : 1),
                translate: `0px ${interpolate(frame, [inAt, inAt + 12], [16, 0], expo)}px`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: radius,
                  overflow: "hidden",
                  boxShadow:
                    conv > 0.05
                      ? "0 30px 80px rgba(26, 26, 26, 0.28)"
                      : "none",
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

              {/* Selection ring */}
              <div
                style={{
                  position: "absolute",
                  inset: -9,
                  borderRadius: radius + 9,
                  border: `5px solid ${colors.accent}`,
                  opacity: trimOn * trimOff,
                  scale: String(interpolate(frame, [s, s + 9], [1.1, 1], expo)),
                }}
              />

              {/* Check badge */}
              <div
                style={{
                  position: "absolute",
                  top: -16,
                  right: -16,
                  width: 52,
                  height: 52,
                  borderRadius: 9999,
                  backgroundColor: colors.accent,
                  color: colors.accentInk,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: fonts.sans,
                  fontWeight: 600,
                  fontSize: 28,
                  opacity: trimOff * (frame >= s + 2 ? 1 : 0),
                  scale: String(
                    interpolate(frame, [s + 2, s + 7, s + 12], [0, 1.2, 1], expo),
                  ),
                }}
              >
                ✓
              </div>
            </div>
          );
        })}

        {/* ── The result: the stack becomes the new page ──────── */}
        {frame >= BUILD_START && (
          <div
            style={{
              position: "absolute",
              left: interpolate(build, [0, 1], [CARD.x, 0]),
              top: interpolate(build, [0, 1], [CARD.y, 0]),
              width: interpolate(build, [0, 1], [CARD.w, 1920]),
              height: interpolate(build, [0, 1], [CARD.h, 1080]),
              borderRadius: interpolate(build, [0, 1], [CARD.radius, 0]),
              overflow: "hidden",
              boxShadow:
                build < 1 ? "0 30px 80px rgba(26, 26, 26, 0.28)" : "none",
            }}
          >
            {/* The front reference, still visible for a beat... */}
            <Img
              src={tileSrc(GRID_SLUGS[PICKS[2]])}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "top",
              }}
            />
            {/* ...becomes the new page as the card grows. */}
            <Img
              src={RESULT}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "top",
                opacity: interpolate(frame, [102, 112], [0, 1], expo),
                scale: String(
                  interpolate(frame, [104, 150], [1.06, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    easing: Easing.linear,
                  }),
                ),
              }}
            />
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
