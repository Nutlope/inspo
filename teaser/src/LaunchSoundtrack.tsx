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
const SHUTTERS = [113, 120, 127];
const READS = [165, 170, 175];
const TRACK = [345, 377, 409, 441];

export const LaunchSoundtrack: React.FC = () => {
  return (
    <>
      <Sequence from={49} name="sfx: send">
        <Audio src={mouseClick} volume={0.7} />
      </Sequence>
      <Sequence from={59} name="sfx: scan">
        <Audio src={whoosh} volume={0.45} />
      </Sequence>
      {SHUTTERS.map((at) => (
        <Sequence key={at} from={at} name="sfx: pick">
          <Audio src={shutterModern} volume={0.4} />
        </Sequence>
      ))}
      <Sequence from={131} name="sfx: fan out">
        <Audio src={whoosh} volume={0.4} />
      </Sequence>
      {READS.map((at) => (
        <Sequence key={at} from={at} name="sfx: read">
          <Audio src={uiSwitch} volume={0.28} />
        </Sequence>
      ))}
      <Sequence from={211} name="sfx: gather">
        <Audio src={whoosh} volume={0.45} />
      </Sequence>
      <Sequence from={255} name="sfx: build">
        <Audio src={pageTurn} volume={0.5} />
      </Sequence>
      <Sequence from={277} name="sfx: page">
        <Audio src={whoosh} volume={0.3} />
      </Sequence>
      {TRACK.map((at) => (
        <Sequence key={at} from={at} name="sfx: next page">
          <Audio src={whoosh} volume={0.22} />
        </Sequence>
      ))}
      <Sequence from={549} name="sfx: mark">
        <Audio src={ding} volume={0.25} />
      </Sequence>
      <Sequence from={572} name="sfx: address">
        <Audio src={uiSwitch} volume={0.2} />
      </Sequence>
    </>
  );
};
