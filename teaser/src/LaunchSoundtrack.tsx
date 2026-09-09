import React from "react";
import { Audio } from "@remotion/media";
import {
  ding,
  mouseClick,
  pageTurn,
  shutterModern,
  uiSwitch,
  whoosh,
} from "@remotion/sfx";
import { Sequence } from "remotion";

/* Global frames for the launch cut. Each reference kept fires a
   shutter; each one read gets a soft switch as its palette lands;
   every move of the montage track gets a quiet whoosh. */
const SHUTTERS = [109, 116, 123];
const READS = [161, 166, 171];
const TRACK = [341, 373, 405, 437];

export const LaunchSoundtrack: React.FC = () => {
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
      <Sequence from={127} name="sfx: fan out">
        <Audio src={whoosh} volume={0.4} />
      </Sequence>
      {READS.map((at) => (
        <Sequence key={at} from={at} name="sfx: read">
          <Audio src={uiSwitch} volume={0.28} />
        </Sequence>
      ))}
      <Sequence from={207} name="sfx: gather">
        <Audio src={whoosh} volume={0.45} />
      </Sequence>
      <Sequence from={251} name="sfx: build">
        <Audio src={pageTurn} volume={0.5} />
      </Sequence>
      <Sequence from={273} name="sfx: page">
        <Audio src={whoosh} volume={0.3} />
      </Sequence>
      {TRACK.map((at) => (
        <Sequence key={at} from={at} name="sfx: next page">
          <Audio src={whoosh} volume={0.22} />
        </Sequence>
      ))}
      <Sequence from={545} name="sfx: mark">
        <Audio src={ding} volume={0.25} />
      </Sequence>
    </>
  );
};
