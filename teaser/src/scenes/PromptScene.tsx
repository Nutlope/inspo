import React from "react";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { colors, EXPO, fonts } from "../theme";

const PROMPT = "build a site for our transit authority, live network map";

/* Frame math: pill lands 0-12, typing 8-42, send press 44-50,
   handoff zoom 50-58. Scene is 58 frames long. */
export const PromptScene: React.FC = () => {
  const frame = useCurrentFrame();

  const typed = PROMPT.slice(0, Math.max(0, Math.floor((frame - 8) * 1.8)));
  const doneTyping = typed.length >= PROMPT.length;

  /* Caret blinks only once typing is done; solid while typing. */
  const caretOn = doneTyping ? Math.floor(frame / 9) % 2 === 0 : true;

  /* The send press: a quick dip and release on the whole pill. */
  const press = interpolate(frame, [44, 47, 50], [1, 0.965, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.paper,
        justifyContent: "center",
        alignItems: "center",
        /* Handoff: the camera pushes through the pill into the archive. */
        scale: String(
          interpolate(frame, [50, 58], [1, 2.4], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.5, 0, 0.9, 0.4),
          }),
        ),
        opacity: interpolate(frame, [52, 58], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.linear,
        }),
      }}
    >
      <Interactive.Div
        name="PromptPill"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          width: 1280,
          height: 104,
          paddingLeft: 44,
          paddingRight: 16,
          borderRadius: 9999,
          backgroundColor: colors.accentInk,
          border: `1.5px solid ${colors.rule}`,
          boxShadow: "0 24px 60px rgba(26, 26, 26, 0.07)",
          scale: String(
            press *
              interpolate(frame, [0, 14], [0.92, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(...EXPO),
              }),
          ),
          translate: interpolate(frame, [0, 14], ["0px 26px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(...EXPO),
          }),
          opacity: interpolate(frame, [0, 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(...EXPO),
          }),
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            fontFamily: fonts.sans,
            fontWeight: 400,
            fontSize: 34,
            letterSpacing: "-0.01em",
            color: colors.ink,
            whiteSpace: "pre",
          }}
        >
          {typed}
          <span
            style={{
              display: "inline-block",
              width: 3,
              height: 40,
              marginLeft: 6,
              backgroundColor: colors.ink,
              opacity: caretOn ? 1 : 0,
            }}
          />
        </div>

        {/* Send button - fills with accent the moment typing ends. */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: doneTyping ? colors.accent : colors.paper,
            color: doneTyping ? colors.accentInk : colors.inkMuted,
            fontFamily: fonts.sans,
            fontSize: 36,
            scale: String(
              interpolate(frame, [42, 46, 50], [1, 1.14, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(...EXPO),
              }),
            ),
          }}
        >
          ↑
        </div>
      </Interactive.Div>
    </AbsoluteFill>
  );
};
