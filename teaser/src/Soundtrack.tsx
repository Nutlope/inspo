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

/* Every montage cut fires a shutter - the archive is, after all, a
   camera. Global frames. */
const SHUTTERS = [63, 77, 89, 99, 108, 116, 123, 130];

export const Soundtrack: React.FC = () => {
  return (
    <>
      <Sequence from={44} name="sfx: send">
        <Audio src={mouseClick} volume={0.7} />
      </Sequence>
      {SHUTTERS.map((at) => (
        <Sequence key={at} from={at} name="sfx: shutter">
          <Audio src={shutterModern} volume={0.35} />
        </Sequence>
      ))}
      <Sequence from={134} name="sfx: grid">
        <Audio src={whoosh} volume={0.5} />
      </Sequence>
      <Sequence from={188} name="sfx: wash">
        <Audio src={pageTurn} volume={0.55} />
      </Sequence>
      <Sequence from={252} name="sfx: mark">
        <Audio src={ding} volume={0.25} />
      </Sequence>
    </>
  );
};
