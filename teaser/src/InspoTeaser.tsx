import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { useAuthoredFrames } from "./timing";
import { OutroScene } from "./scenes/OutroScene";
import { PromptScene } from "./scenes/PromptScene";
import { SearchScene } from "./scenes/SearchScene";
import { Soundtrack } from "./Soundtrack";
import { colors } from "./theme";

/* 10 seconds. Authored at 30fps, rendered at 60 - see src/timing.ts.
   0-62     Prompt: a real one, typed to a coding agent (it shares
            PromptScene with the launch film, so it follows that
            scene's length)
   59-249   Inspo searches the archive, keeps three, builds the page
   228-300  The mark, and what is coming (it washes over the page,
            which is why the scene above it runs on underneath) */
export const InspoTeaser: React.FC = () => {
  const t = useAuthoredFrames();

  return (
    <AbsoluteFill style={{ backgroundColor: colors.paper }}>
      <Sequence durationInFrames={t(62)} layout="absolute-fill" name="Prompt">
        <PromptScene />
      </Sequence>
      <Sequence
        from={t(59)}
        durationInFrames={t(190)}
        layout="absolute-fill"
        name="Search"
      >
        <SearchScene />
      </Sequence>
      <Sequence from={t(228)} layout="absolute-fill" name="Outro">
        <OutroScene />
      </Sequence>
      <Soundtrack />
    </AbsoluteFill>
  );
};
