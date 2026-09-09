import React from "react";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { colors, EXPO, fonts } from "../theme";

const PROMPT = "build a landing page for Overpass, crop maps for farmers";

/* The film opens mid-keystroke on purpose. There is no fly-in and no
   wait: frame 0 is the pill with a caret in it, already typing.

   The line then has to be readable, which is a different problem from
   opening fast. It is solved by holding on the finished sentence, not
   by typing slowly: the reveal stays quick, and the prompt sits
   complete for 28 frames before the camera moves. Roughly a second of
   the whole line, on top of the read-along while it types.

   Frame math: typing 0-26, hold 26-48, send pulses 44-50, press dip
   48-54, handoff zoom 54-62. Scene is 62 frames long. */

/* Fast enough to read as a fast typist, not as a wipe. */
const CHARS_PER_FRAME = 2.2;
export const PromptScene: React.FC = () => {
  const frame = useCurrentFrame();

  const typed = PROMPT.slice(0, Math.floor(frame * CHARS_PER_FRAME));
  const doneTyping = typed.length >= PROMPT.length;

  /* Caret blinks only once typing is done; solid while typing. */
  const caretOn = doneTyping ? Math.floor(frame / 7) % 2 === 0 : true;

  /* The send press: a quick dip and release on the whole pill. */
  const press = interpolate(frame, [48, 51, 54], [1, 0.965, 1], {
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
          interpolate(frame, [54, 62], [1, 2.4], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.5, 0, 0.9, 0.4),
          }),
        ),
        opacity: interpolate(frame, [56, 62], [1, 0], {
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
          /* No entrance fade: the very first frame is already the
             pill with a caret in it. Just a hair of settle so it is
             not dead still while the line types. */
          scale: String(
            press *
              interpolate(frame, [0, 10], [0.985, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(...EXPO),
              }),
          ),
          translate: interpolate(frame, [0, 10], ["0px 6px", "0px 0px"], {
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
              interpolate(frame, [44, 47, 51], [1, 1.14, 1], {
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
