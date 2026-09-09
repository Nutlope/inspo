import React from "react";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { colors, EXPO, fonts } from "../theme";

/* Local timeline (scene starts at global frame 228, runs to 300):
   0-10    paper washes over the page, which is still running below
   8-22    the wordmark, dead centre and nothing else
   22-34   the accent period lands
   32-44   the caption ("MCP · Coming soon" unless told otherwise)
           hangs beneath it, then it all holds */
export const OutroScene: React.FC<{ caption?: string }> = ({
  caption = "MCP · Coming soon",
}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.paper,
        opacity: interpolate(frame, [0, 10], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.linear,
        }),
      }}
    >
      {/* The mark is centred on the frame and stays there - the line
          below hangs off it absolutely, so it never shifts the logo. */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Interactive.Div
          name="Wordmark"
          style={{
            position: "relative",
            fontFamily: fonts.display,
            fontWeight: 400,
            fontSize: 220,
            letterSpacing: "-0.025em",
            lineHeight: 1,
            color: colors.ink,
            opacity: interpolate(frame, [8, 22], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(...EXPO),
            }),
            scale: String(
              interpolate(frame, [8, 32], [0.9, 1], {
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
                interpolate(frame, [22, 28, 34], [0, 1.25, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.bezier(...EXPO),
                }),
              ),
            }}
          >
            .
          </span>

          <Interactive.Div
            name="Caption"
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              marginTop: 34,
              textAlign: "center",
              fontFamily: fonts.sans,
              fontWeight: 400,
              fontSize: 36,
              letterSpacing: "0.005em",
              color: colors.inkMuted,
              opacity: interpolate(frame, [32, 44], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(...EXPO),
              }),
              translate: interpolate(frame, [32, 44], ["0px 14px", "0px 0px"], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(...EXPO),
              }),
            }}
          >
            {caption}
          </Interactive.Div>
        </Interactive.Div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
