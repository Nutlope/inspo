import React from "react";
import { Audio } from "@remotion/media";
import {
  ding,
  mouseClick,
  pageTurn,
  shutterModern,
  whoosh,
} from "@remotion/sfx";
import { Sequence } from "remotion";
import { useAuthoredFrames } from "./timing";

/* Each reference kept fires a shutter - the archive is, after all,
   a wall of screenshots. Global authored (30fps) frames. */
const SHUTTERS = [113, 120, 127];

export const Soundtrack: React.FC = () => {
  const t = useAuthoredFrames();

  return (
    <>
      <Sequence from={t(49)} name="sfx: send">
        <Audio src={mouseClick} volume={0.7} />
      </Sequence>
      <Sequence from={t(59)} name="sfx: scan">
        <Audio src={whoosh} volume={0.45} />
      </Sequence>
      {SHUTTERS.map((at) => (
        <Sequence key={at} from={t(at)} name="sfx: pick">
          <Audio src={shutterModern} volume={0.4} />
        </Sequence>
      ))}
      <Sequence from={t(131)} name="sfx: stack">
        <Audio src={whoosh} volume={0.45} />
      </Sequence>
      <Sequence from={t(167)} name="sfx: build">
        <Audio src={pageTurn} volume={0.5} />
      </Sequence>
      <Sequence from={t(189)} name="sfx: page">
        <Audio src={whoosh} volume={0.3} />
      </Sequence>
      <Sequence from={t(242)} name="sfx: mark">
        <Audio src={ding} volume={0.25} />
      </Sequence>
    </>
  );
};
