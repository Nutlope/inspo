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

/* Each of the three reference picks fires a shutter - the archive is,
   after all, a camera. Global frames. */
const SHUTTERS = [88, 102, 116];

export const Soundtrack: React.FC = () => {
  return (
    <>
      <Sequence from={49} name="sfx: send">
        <Audio src={mouseClick} volume={0.7} />
      </Sequence>
      <Sequence from={70} name="sfx: grid">
        <Audio src={whoosh} volume={0.4} />
      </Sequence>
      {SHUTTERS.map((at) => (
        <Sequence key={at} from={at} name="sfx: pick">
          <Audio src={shutterModern} volume={0.4} />
        </Sequence>
      ))}
      <Sequence from={132} name="sfx: stack">
        <Audio src={whoosh} volume={0.45} />
      </Sequence>
      <Sequence from={168} name="sfx: build">
        <Audio src={pageTurn} volume={0.5} />
      </Sequence>
      <Sequence from={203} name="sfx: wash">
        <Audio src={whoosh} volume={0.3} />
      </Sequence>
      <Sequence from={255} name="sfx: mark">
        <Audio src={ding} volume={0.25} />
      </Sequence>
    </>
  );
};
