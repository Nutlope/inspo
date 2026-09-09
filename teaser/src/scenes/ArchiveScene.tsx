import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Interactive,
  interpolate,
} from "remotion";
import { useAuthoredFrame } from "../timing";
import {
  CARD,
  PICKS,
  pickSrc,
  SCREEN_COUNT,
  WALL,
  WALL_ORDER,
  WALL_REST_Y,
  WALL_START_Y,
  wallCell,
  wallH,
  wallTile,
  ZOOM_ANCHOR,
  ZOOM_MAX,
} from "../shots";
import {
  FRAME,
  heroScroll,
  MONTAGE,
  pageSrc,
  REF_META,
  ROW,
  rowRect,
} from "../launch";
import { colors, EXPO, fonts } from "../theme";

/* The launch cut of the teaser's search scene. Same scan, same push-in,
   same three picks; then instead of stacking straight away the picks
   fan into a row and Inspo reads them (site, type family, palette)
   before they gather into the page.

   Local timeline (scene starts at global frame 55):
   0-52     the archive scrolls past, hundreds of screens deep
   2-48     the chip counts the screens it has searched
   48-70    the camera pushes into the three it kept
   54/61/68 each pick takes a ring and a check
   72-104   the picks fly out into a row
   98-134   Inspo reads them: name and type fade up, the palette pops
   148-156  the reading clears
   152-184  the cards gather into a fanned stack
   184-194  the stack squares up
   196-216  it grows into the generated page, framed on the paper
   218-258  a quick scroll through that page, hero to footer
   258-     it holds at the footer; the montage picks it up from here */

const SCROLL_END = 52;
const ZOOM = [48, 70] as const;
const SEL_AT = [54, 61, 68];
const FLY = 72;
const READ = 98;
const READ_OUT = [148, 156] as const;
const GATHER = 152;
const ALIGN = [184, 194] as const;
const BUILD = [196, 216] as const;
const PAGE_SCROLL = [218, 258] as const;

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

const RESULT = MONTAGE[0];
const scrollDist = heroScroll(RESULT.img);

export const ArchiveScene: React.FC = () => {
  const frame = useAuthoredFrame();

  /* The scan: already at speed when we arrive, then a long settle. */
  const wallY = interpolate(
    frame,
    [0, SCROLL_END],
    [WALL_START_Y, WALL_REST_Y],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.1, 0.72, 0.12, 1),
    },
  );

  /* The push-in. `zoom` scales, `pin` slides the anchor from the frame
     centre onto the picks, so at zoom 1 nothing has moved yet. */
  const zoom = interpolate(frame, [ZOOM[0], ZOOM[1]], [1, ZOOM_MAX], expo);
  const pin = interpolate(frame, [ZOOM[0], ZOOM[1]], [0, 1], expo);
  const anchor = {
    x: interpolate(pin, [0, 1], [960, ZOOM_ANCHOR.x]),
    y: interpolate(pin, [0, 1], [540, ZOOM_ANCHOR.y + wallY]),
  };
  const project = (x: number, y: number) => ({
    x: (x - anchor.x) * zoom + 960,
    y: (y - anchor.y) * zoom + 540,
  });

  /* Speed reads as blur while the wall is really moving. */
  const blur = interpolate(frame, [0, 34], [5, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.2, 0.7, 0.2, 1),
  });

  /* Everything that was not picked recedes, then leaves. */
  const wallOpacity =
    interpolate(frame, [SEL_AT[0], ZOOM[1]], [1, 0.22], expo) *
    interpolate(frame, [76, 92], [1, 0], expo);

  const searched = Math.round(
    interpolate(frame, [2, 48], [0, SCREEN_COUNT], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.25, 0.9, 0.2, 1),
    }),
  );

  const chipIn = interpolate(frame, [2, 12], [0, 1], expo);
  const chipOut = interpolate(frame, [48, 58], [1, 0], expo);

  const align = interpolate(frame, [ALIGN[0], ALIGN[1]], [0, 1], expo);
  const build = interpolate(frame, [BUILD[0], BUILD[1]], [0, 1], expo);
  const pageScroll = interpolate(
    frame,
    [PAGE_SCROLL[0], PAGE_SCROLL[1]],
    [0, scrollDist],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.45, 0, 0.15, 1),
    },
  );

  const readOut = interpolate(frame, [READ_OUT[0], READ_OUT[1]], [1, 0], expo);

  return (
    <AbsoluteFill style={{ backgroundColor: colors.paper }}>
      {/* ── The archive, scrolling ──────────────────────────── */}
      {wallOpacity > 0.01 && (
        <AbsoluteFill
          style={{
            opacity: wallOpacity,
            filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
          }}
        >
          {[0, 1].map((copy) =>
            WALL_ORDER.map((slug, i) => {
              if (slug === null) {
                return null;
              }
              const cell = wallCell(i);
              const top = cell.y - copy * wallH + wallY;
              const p = project(cell.x, top);
              const h = WALL.tileH * zoom;
              if (p.y > 1080 + h || p.y + h < -h) {
                return null;
              }
              return (
                <div
                  key={`${copy}-${slug}`}
                  style={{
                    position: "absolute",
                    left: p.x,
                    top: p.y,
                    width: WALL.tileW * zoom,
                    height: h,
                    borderRadius: WALL.radius * zoom,
                    overflow: "hidden",
                    backgroundColor: colors.accentInk,
                  }}
                >
                  <Img
                    src={wallTile(slug)}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "top",
                    }}
                  />
                </div>
              );
            }),
          )}
        </AbsoluteFill>
      )}

      {/* ── The search, counting ─────────────────────────────
           Sat on a wall of screenshots, so it is glass rather than a
           flat lozenge: the archive shows through it. The count is
           the point of the whole shot, so it is the loud thing here
           and the label is deliberately quiet under it. */}
      <Interactive.Div
        name="SearchChip"
        style={{
          position: "absolute",
          top: 58,
          left: 0,
          right: 0,
          margin: "0 auto",
          width: "fit-content",
          display: "flex",
          alignItems: "center",
          gap: 22,
          height: 78,
          paddingLeft: 30,
          paddingRight: 34,
          borderRadius: 9999,
          backgroundColor: "rgba(253, 253, 251, 0.82)",
          backdropFilter: "blur(16px)",
          border: "1.5px solid rgba(216, 211, 200, 0.85)",
          boxShadow: "0 6px 22px rgba(26, 26, 26, 0.10)",
          opacity: chipIn * chipOut,
          translate: interpolate(chipIn, [0, 1], ["0px -18px", "0px 0px"]),
        }}
      >
        {/* A live signal, not a blinking bullet: the halo breathes
            and the dot itself stays put. */}
        <div
          style={{
            width: 11,
            height: 11,
            borderRadius: 9999,
            backgroundColor: colors.accent,
            boxShadow: `0 0 0 ${5 + 2.5 * Math.sin(frame / 3.2)}px rgba(199, 64, 47, 0.16)`,
          }}
        />

        <span
          style={{
            fontFamily: fonts.sans,
            fontSize: 25,
            letterSpacing: "-0.005em",
            color: colors.inkMuted,
            fontWeight: 400,
          }}
        >
          <span style={{ fontWeight: 500, color: colors.ink }}>inspo</span>
          {" searching the archive"}
        </span>

        <span
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 9,
            marginLeft: 8,
          }}
        >
          <span
            style={{
              fontFamily: fonts.sans,
              fontWeight: 500,
              fontSize: 36,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              color: colors.ink,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {searched.toLocaleString("en-US")}
          </span>
          <span
            style={{
              fontFamily: fonts.sans,
              fontWeight: 400,
              fontSize: 25,
              lineHeight: 1,
              color: colors.inkMuted,
            }}
          >
            screens
          </span>
        </span>
      </Interactive.Div>

      {/* ── The three it kept ───────────────────────────────── */}
      {frame < BUILD[0] &&
        PICKS.map((pick, k) => {
          const cell = wallCell(pick.cell);
          const p = project(cell.x, cell.y + wallY);
          const s = SEL_AT[k];
          const row = rowRect(k);

          /* Fly from the wall into the row... */
          const conv = interpolate(
            frame,
            [FLY + k * 4, FLY + k * 4 + 24],
            [0, 1],
            expo,
          );
          /* ...later gather into the fanned stack... */
          const gath = interpolate(
            frame,
            [GATHER + k * 4, GATHER + k * 4 + 24],
            [0, 1],
            expo,
          );
          /* ...then square up before the build. */
          const fan = gath * (1 - align);
          const dx = STACK[k].dx * fan;
          const dy = STACK[k].dy * fan;
          const rot = STACK[k].rot * fan;

          const rx = interpolate(conv, [0, 1], [p.x, row.x]);
          const ry = interpolate(conv, [0, 1], [p.y, row.y]);
          const rw = interpolate(conv, [0, 1], [WALL.tileW * zoom, row.w]);
          const rh = interpolate(conv, [0, 1], [WALL.tileH * zoom, row.h]);
          const rr = interpolate(
            conv,
            [0, 1],
            [WALL.radius * zoom, ROW.radius],
          );

          const left = interpolate(gath, [0, 1], [rx, CARD.x + dx]);
          const top = interpolate(gath, [0, 1], [ry, CARD.y + dy]);
          const w = interpolate(gath, [0, 1], [rw, CARD.w]);
          const h = interpolate(gath, [0, 1], [rh, CARD.h]);
          const radius = interpolate(gath, [0, 1], [rr, CARD.radius]);

          /* Selection pulse, eased back out as the card starts to fly. */
          const pulse =
            interpolate(frame, [s, s + 6], [1, 1.05], expo) *
            interpolate(
              frame,
              [FLY + k * 4, FLY + k * 4 + 10],
              [1, 1 / 1.05],
              expo,
            );

          const trimOn = interpolate(frame, [s, s + 4], [0, 1], expo);
          const trimOff = interpolate(frame, [76, 88], [1, 0], expo);

          return (
            <div
              key={pick.slug}
              style={{
                position: "absolute",
                left,
                top,
                width: w,
                height: h,
                rotate: `${rot}deg`,
                scale: String(pulse),
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: radius,
                  overflow: "hidden",
                  boxShadow:
                    conv > 0.05 ? "0 30px 80px rgba(26, 26, 26, 0.28)" : "none",
                }}
              >
                <Img
                  src={pickSrc(pick.slug)}
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
                  scale: String(interpolate(frame, [s, s + 9], [1.12, 1], expo)),
                }}
              />

              {/* Check badge */}
              <div
                style={{
                  position: "absolute",
                  top: -18,
                  right: -18,
                  width: 54,
                  height: 54,
                  borderRadius: 9999,
                  backgroundColor: colors.accent,
                  color: colors.accentInk,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: fonts.sans,
                  fontWeight: 600,
                  fontSize: 29,
                  opacity: trimOff * (frame >= s + 2 ? 1 : 0),
                  scale: String(
                    interpolate(
                      frame,
                      [s + 2, s + 7, s + 12],
                      [0, 1.2, 1],
                      expo,
                    ),
                  ),
                }}
              >
                ✓
              </div>
            </div>
          );
        })}

      {/* ── What it read off them ───────────────────────────── */}
      {frame >= READ && frame < GATHER + 8 && (
        <Interactive.Div name="Reading">
          {PICKS.map((pick, k) => {
            const row = rowRect(k);
            const meta = REF_META[pick.slug];
            const t0 = READ + k * 5;
            const textIn = interpolate(frame, [t0, t0 + 12], [0, 1], expo);

            return (
              <div
                key={pick.slug}
                style={{
                  position: "absolute",
                  left: row.x,
                  top: row.y + row.h + 22,
                  width: row.w,
                  opacity: readOut,
                  translate: `0px ${(1 - readOut) * 12}px`,
                }}
              >
                {/* Site and type family */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    opacity: textIn,
                    translate: `0px ${(1 - textIn) * 10}px`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: fonts.sans,
                      fontWeight: 500,
                      fontSize: 28,
                      letterSpacing: "-0.01em",
                      color: colors.ink,
                    }}
                  >
                    {meta.name}
                  </span>
                  <span
                    style={{
                      fontFamily: fonts.sans,
                      fontWeight: 400,
                      fontSize: 26,
                      letterSpacing: "0.005em",
                      color: colors.inkMuted,
                    }}
                  >
                    {meta.face}
                  </span>
                </div>

                {/* Palette, one swatch at a time */}
                <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
                  {meta.palette.map((hex, i) => {
                    const at = t0 + 8 + i * 2;
                    return (
                      <div
                        key={hex}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 9999,
                          backgroundColor: hex,
                          boxShadow: "inset 0 0 0 1px rgba(26, 26, 26, 0.1)",
                          opacity: frame >= at ? 1 : 0,
                          scale: String(
                            interpolate(
                              frame,
                              [at, at + 5, at + 10],
                              [0, 1.18, 1],
                              expo,
                            ),
                          ),
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </Interactive.Div>
      )}

      {/* ── The page they become ────────────────────────────── */}
      {frame >= BUILD[0] && (
        <div
          style={{
            position: "absolute",
            left: interpolate(build, [0, 1], [CARD.x, FRAME.x]),
            top: interpolate(build, [0, 1], [CARD.y, FRAME.y]),
            width: interpolate(build, [0, 1], [CARD.w, FRAME.w]),
            height: interpolate(build, [0, 1], [CARD.h, FRAME.h]),
            borderRadius: interpolate(
              build,
              [0, 1],
              [CARD.radius, FRAME.radius],
            ),
            overflow: "hidden",
            boxShadow: "0 30px 90px rgba(26, 26, 26, 0.22)",
            /* The montage composites this same page inside a CSS
               scale, and a scale layer rasterises edges a hair
               differently. Matching it here - even at 1 - keeps the
               cut between the two scenes truly identical instead of
               flickering every thin rule on the page for one frame. */
            scale: "1",
          }}
        >
          {/* The front reference, still there for a beat... */}
          <Img
            src={pickSrc(PICKS[2].slug)}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top",
            }}
          />
          {/* ...becomes the generated page, then scrolls through it. */}
          <Img
            src={pageSrc(RESULT.slug)}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              translate: `0px ${-pageScroll}px`,
              opacity: interpolate(
                frame,
                [BUILD[0] + 2, BUILD[0] + 14],
                [0, 1],
                expo,
              ),
            }}
          />
        </div>
      )}
    </AbsoluteFill>
  );
};
