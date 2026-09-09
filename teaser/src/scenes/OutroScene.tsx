import React from "react";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
} from "remotion";
import { useAuthoredFrame } from "../timing";
import { colors, EXPO, fonts } from "../theme";

/* The end card. Local timeline (the launch film starts it at 507):
   0-10    paper washes over the page, which is still running below
   8-22    the wordmark
   22-34   the accent period lands
   32-44   the line saying what it is
   42-56   the address, in the same pill the film has used for every
           prompt and brief, then it all holds

   The three parts are one centred column, not a mark with things
   hanging off it: the whole lockup is what gets centred, so the card
   reads as a single object rather than a logo sitting high with a
   tail. Every element is in the layout from frame 0 at opacity 0, so
   the mark never moves as the lines below it arrive. */

const expo = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
  easing: Easing.bezier(...EXPO),
};

/* Line boxes carry slack the ink does not: Fraunces at lineHeight 1
   reserves room above the cap, and the pill's box is taller than the
   text in it, so centring the boxes leaves the ink low. This is
   measured, not guessed, against the real edges rather than the
   pill's soft shadow: the lockup runs from the cap of the I to the
   bottom of the pill's border. This lands it 8px above the true
   middle, which is where a centred lockup wants to sit - the eye
   reads dead centre as slightly low, and the pill's shadow adds
   weight underneath. Re-measure if the spacing changes. */
const OPTICAL_NUDGE = -25;

export const OutroScene: React.FC<{ caption?: string; url?: string }> = ({
  caption = "MCP · Coming soon",
  url,
}) => {
  const frame = useAuthoredFrame();

  const markIn = interpolate(frame, [8, 22], [0, 1], expo);
  const captionIn = interpolate(frame, [32, 44], [0, 1], expo);
  const urlIn = interpolate(frame, [42, 56], [0, 1], expo);

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
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          translate: `0px ${OPTICAL_NUDGE}px`,
        }}
      >
        <Interactive.Div
          name="Wordmark"
          style={{
            fontFamily: fonts.display,
            fontWeight: 400,
            fontSize: 220,
            /* Tighter than the site masthead's -0.025em, on purpose:
               at 220px the mark wants to read as one word, not six
               letters. Do not "correct" this back to the site value. */
            letterSpacing: "-0.045em",
            /* CSS puts the letter-space AFTER the last glyph too, so a
               negative value leaves the box narrower than the ink and
               centring the box pushes the mark right. This gives the
               trailing space back, so the ink centres. */
            paddingRight: "0.045em",
            lineHeight: 1,
            color: colors.ink,
            opacity: markIn,
            scale: String(
              interpolate(frame, [8, 32], [0.9, 1], {
                ...expo,
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
                interpolate(frame, [22, 28, 34], [0, 1.25, 1], expo),
              ),
            }}
          >
            .
          </span>
        </Interactive.Div>

        <Interactive.Div
          name="Descriptor"
          style={{
            marginTop: 52,
            fontFamily: fonts.sans,
            fontWeight: 400,
            fontSize: 32,
            lineHeight: 1,
            letterSpacing: "0.01em",
            color: colors.inkMuted,
            opacity: captionIn,
            translate: interpolate(
              captionIn,
              [0, 1],
              ["0px 12px", "0px 0px"],
            ),
          }}
        >
          {caption}
        </Interactive.Div>

        {/* The address, in the pill the film opened on. The first
            frame is a prompt pill with an accent circle you press to
            send; the last is the same pill with an accent circle you
            press to go. Same shape, same accent, other end of the
            story. */}
        {url ? (
          <Interactive.Div
            name="Address"
            style={{
              marginTop: 34,
              display: "flex",
              alignItems: "center",
              gap: 20,
              height: 80,
              paddingLeft: 38,
              paddingRight: 12,
              borderRadius: 9999,
              backgroundColor: colors.accentInk,
              border: `1.5px solid ${colors.rule}`,
              /* Barely there: the pill should sit on the paper,
                 not float above it. */
              boxShadow: "0 4px 14px rgba(26, 26, 26, 0.05)",
              opacity: urlIn,
              scale: String(interpolate(urlIn, [0, 1], [0.94, 1])),
              translate: interpolate(urlIn, [0, 1], ["0px 14px", "0px 0px"]),
            }}
          >
            <span
              style={{
                fontFamily: fonts.sans,
                fontWeight: 500,
                fontSize: 34,
                lineHeight: 1,
                letterSpacing: "-0.01em",
                color: colors.ink,
              }}
            >
              {url}
            </span>
            <span
              style={{
                width: 56,
                height: 56,
                borderRadius: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.accent,
                color: colors.accentInk,
                fontFamily: fonts.sans,
                fontSize: 28,
                lineHeight: 1,
              }}
            >
              →
            </span>
          </Interactive.Div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
