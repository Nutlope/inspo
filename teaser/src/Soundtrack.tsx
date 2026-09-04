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

/* Each reference kept fires a shutter - the archive is, after all,
   a wall of screenshots. Global frames. */
const SHUTTERS = [109, 116, 123];

export const Soundtrack: React.FC = () => {
  return (
    <>
      <Sequence from={46} name="sfx: send">
        <Audio src={mouseClick} volume={0.7} />
      </Sequence>
      <Sequence from={55} name="sfx: scan">
        <Audio src={whoosh} volume={0.45} />
      </Sequence>
      {SHUTTERS.map((at) => (
        <Sequence key={at} from={at} name="sfx: pick">
          <Audio src={shutterModern} volume={0.4} />
        </Sequence>
      ))}
      <Sequence from={127} name="sfx: stack">
        <Audio src={whoosh} volume={0.45} />
      </Sequence>
      <Sequence from={163} name="sfx: build">
        <Audio src={pageTurn} volume={0.5} />
      </Sequence>
      <Sequence from={185} name="sfx: page">
        <Audio src={whoosh} volume={0.3} />
      </Sequence>
      <Sequence from={242} name="sfx: mark">
        <Audio src={ding} volume={0.25} />
      </Sequence>
    </>
  );
};
