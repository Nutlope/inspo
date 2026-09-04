import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { OutroScene } from "./scenes/OutroScene";
import { PromptScene } from "./scenes/PromptScene";
import { SearchScene } from "./scenes/SearchScene";
import { Soundtrack } from "./Soundtrack";
import { colors } from "./theme";

/* 10 seconds at 30fps.
   0-58     Prompt: a real one, typed to a coding agent
   55-245   Inspo searches the archive, keeps three, builds the page
   228-300  The mark, and what is coming (it washes over the page,
            which is why the scene above it runs on underneath) */
export const InspoTeaser: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.paper }}>
      <Sequence durationInFrames={58} layout="absolute-fill" name="Prompt">
        <PromptScene />
      </Sequence>
      <Sequence
        from={55}
        durationInFrames={190}
        layout="absolute-fill"
        name="Search"
      >
        <SearchScene />
      </Sequence>
      <Sequence from={228} layout="absolute-fill" name="Outro">
        <OutroScene />
      </Sequence>
      <Soundtrack />
    </AbsoluteFill>
  );
};
