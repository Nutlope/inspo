import React from "react";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { colors, EXPO, fonts } from "../theme";

/* Local timeline (scene starts at global frame 205, runs to 300):
   0-8     paper washes over the result
   8-22    "Your agent doesn't have taste."
   18-32   "Lend it some."
   44-54   both lines leave
   50-     "Inspo." wordmark, then the deck line */
export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();

  const linesOut = interpolate(frame, [44, 54], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...EXPO),
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.paper,
        justifyContent: "center",
        alignItems: "center",
        opacity: interpolate(frame, [0, 8], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.linear,
        }),
      }}
    >
      {/* ── The line ─────────────────────────────────────────── */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          gap: 14,
          opacity: linesOut,
          scale: String(interpolate(linesOut, [0, 1], [1.04, 1])),
        }}
      >
        <Interactive.Div
          name="Line1"
          style={{
            fontFamily: fonts.display,
            fontWeight: 500,
            fontSize: 84,
            letterSpacing: "-0.025em",
            color: colors.ink,
            opacity: interpolate(frame, [8, 22], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(...EXPO),
            }),
            translate: interpolate(frame, [8, 22], ["0px 28px", "0px 0px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(...EXPO),
            }),
          }}
        >
          Your agent doesn&rsquo;t have taste.
        </Interactive.Div>

        <Interactive.Div
          name="Line2"
          style={{
            fontFamily: fonts.display,
            fontWeight: 600,
            fontSize: 84,
            letterSpacing: "-0.025em",
            color: colors.accent,
            opacity: interpolate(frame, [18, 30], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(...EXPO),
            }),
            translate: interpolate(frame, [18, 32], ["0px 22px", "0px 0px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(...EXPO),
            }),
          }}
        >
          Lend it some.
        </Interactive.Div>
      </AbsoluteFill>

      {/* ── The mark ─────────────────────────────────────────── */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          gap: 24,
        }}
      >
        <Interactive.Div
          name="Wordmark"
          style={{
            fontFamily: fonts.display,
            fontWeight: 600,
            fontSize: 220,
            letterSpacing: "-0.04em",
            lineHeight: 0.9,
            color: colors.ink,
            opacity: interpolate(frame, [50, 62], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(...EXPO),
            }),
            scale: String(
              interpolate(frame, [50, 72], [0.9, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(...EXPO),
                output: "perceptual-scale",
              }),
            ),
          }}
        >
          Inspo
          <span
            style={{
              color: colors.accent,
              display: "inline-block",
              scale: String(
                interpolate(frame, [62, 68, 74], [0, 1.25, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.bezier(...EXPO),
                }),
              ),
            }}
          >
            .
          </span>
        </Interactive.Div>

        <Interactive.Div
          name="Deck"
          style={{
            fontFamily: fonts.sans,
            fontWeight: 400,
            fontSize: 34,
            letterSpacing: "0.01em",
            color: colors.inkMuted,
            opacity: interpolate(frame, [70, 82], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(...EXPO),
            }),
            translate: interpolate(frame, [70, 82], ["0px 14px", "0px 0px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(...EXPO),
            }),
          }}
        >
          Real websites as inspiration for your agent.
        </Interactive.Div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
