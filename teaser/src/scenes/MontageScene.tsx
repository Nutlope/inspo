import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Interactive,
  interpolate,
  useCurrentFrame,
} from "remotion";
import {
  BRIEF,
  FRAME,
  MONTAGE,
  pageScrollDist,
  pageSrc,
  trackPitch,
} from "../launch";
import { colors, EXPO, fonts } from "../theme";

/* Other pages Inspo built, each under the brief that produced it.
   They ride a horizontal track that advances one page at a time; the
   page that just got built is the first stop, so the film's own
   prompt returns above it before the others slide through.

   Local timeline (scene starts at global frame 321):
   0        the built page, at its footer, exactly where it was left
   2-14     its brief drops in above it
   20/52/84/116  the track advances one page (16 frames each)
   132-     the last page holds while the closing washes over it */

const FIRST = 20;
const STEP = 32;
const MOVE = 16;

const expo = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
  easing: Easing.bezier(...EXPO),
};

export const MontageScene: React.FC = () => {
  const frame = useCurrentFrame();

  /* How many pages the track has advanced, fractional mid-move. */
  const progress = MONTAGE.slice(1).reduce(
    (acc, _, i) =>
      acc +
      interpolate(
        frame,
        [FIRST + i * STEP, FIRST + i * STEP + MOVE],
        [0, 1],
        expo,
      ),
    0,
  );
  const offset = -progress * trackPitch;

  const firstBrief = interpolate(frame, [2, 14], [0, 1], expo);

  return (
    <AbsoluteFill style={{ backgroundColor: colors.paper }}>
      <Interactive.Div name="Track">
        {MONTAGE.map((page, i) => {
          const left = FRAME.x + i * trackPitch + offset;
          if (left > 1920 || left + FRAME.w < 0) {
            return null;
          }

          /* The current page is full size and full strength; the ones
             sliding in or out sit back a little. */
          const focus = 1 - Math.min(1, Math.abs(i - progress));
          const scale = 0.94 + 0.06 * focus;
          const fade = 0.6 + 0.4 * focus;

          /* The built page stays at its footer. Every other page lands
             on its masthead, then drifts down its hero until it has left. */
          const settled = FIRST + (i - 1) * STEP + MOVE;
          const drift =
            i === 0
              ? pageScrollDist(page.img)
              : interpolate(
                  frame,
                  [settled, settled + STEP + 6],
                  [0, Math.min(220, pageScrollDist(page.img))],
                  {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    easing: Easing.bezier(0.3, 0, 0.2, 1),
                  },
                );

          const briefIn = i === 0 ? firstBrief : 1;

          return (
            <div
              key={page.slug}
              style={{
                position: "absolute",
                left,
                top: 0,
                width: FRAME.w,
                height: 1080,
                opacity: fade,
              }}
            >
              {/* The brief */}
              <div
                style={{
                  position: "absolute",
                  top: BRIEF.top,
                  left: 0,
                  right: 0,
                  display: "flex",
                  justifyContent: "center",
                  opacity: briefIn,
                  translate: `0px ${(1 - briefIn) * -16}px`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 18,
                    height: BRIEF.h,
                    paddingLeft: 30,
                    paddingRight: 10,
                    borderRadius: 9999,
                    backgroundColor: colors.accentInk,
                    border: `1.5px solid ${colors.rule}`,
                    boxShadow: "0 18px 44px rgba(26, 26, 26, 0.12)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: fonts.sans,
                      fontWeight: 400,
                      fontSize: 28,
                      letterSpacing: "-0.01em",
                      color: colors.ink,
                      whiteSpace: "pre",
                    }}
                  >
                    {page.brief}
                  </span>
                  <span
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 9999,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: colors.accent,
                      color: colors.accentInk,
                      fontFamily: fonts.sans,
                      fontSize: 24,
                    }}
                  >
                    ↑
                  </span>
                </div>
              </div>

              {/* The page */}
              <div
                style={{
                  position: "absolute",
                  top: FRAME.y,
                  left: 0,
                  width: FRAME.w,
                  height: FRAME.h,
                  borderRadius: FRAME.radius,
                  overflow: "hidden",
                  boxShadow: "0 30px 90px rgba(26, 26, 26, 0.22)",
                  scale: String(scale),
                  backgroundColor: colors.accentInk,
                }}
              >
                <Img
                  src={pageSrc(page.slug)}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    translate: `0px ${-drift}px`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </Interactive.Div>
    </AbsoluteFill>
  );
};
