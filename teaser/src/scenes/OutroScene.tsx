import React from "react";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { colors, EXPO, fonts } from "../theme";

/* Local timeline (scene starts at global frame 190, runs to 300):
   0-12    paper washes over the grid
   8-22    "Your agent doesn't have taste."
   22-38   "Lend it some."
   56-66   both lines leave
   62-     "Inspo." wordmark, then the deck line */
export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();

  const linesOut = interpolate(frame, [56, 66], [1, 0], {
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
        opacity: interpolate(frame, [0, 9], [0, 1], {
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
          gap: 34,
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
            opacity: interpolate(frame, [12, 26], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(...EXPO),
            }),
            translate: interpolate(frame, [12, 26], ["0px 28px", "0px 0px"], {
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
            fontStyle: "italic",
            fontSize: 108,
            letterSpacing: "-0.03em",
            color: colors.accent,
            opacity: interpolate(frame, [26, 38], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(...EXPO),
            }),
            scale: String(
              interpolate(frame, [26, 44], [0.88, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(...EXPO),
                output: "perceptual-scale",
              }),
            ),
            translate: interpolate(frame, [26, 42], ["0px 22px", "0px 0px"], {
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
            opacity: interpolate(frame, [62, 74], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(...EXPO),
            }),
            scale: String(
              interpolate(frame, [62, 84], [0.9, 1], {
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
                interpolate(frame, [74, 80, 86], [0, 1.25, 1], {
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
            opacity: interpolate(frame, [82, 94], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(...EXPO),
            }),
            translate: interpolate(frame, [82, 94], ["0px 14px", "0px 0px"], {
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
