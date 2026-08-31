import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { ArchiveScene } from "./scenes/ArchiveScene";
import { OutroScene } from "./scenes/OutroScene";
import { PromptScene } from "./scenes/PromptScene";
import { Soundtrack } from "./Soundtrack";
import { colors } from "./theme";

/* 10 seconds at 30fps.
   0-70     Prompt: "Create a landing page for my product."
   70-220   The archive: grid, three picks, they become the new page
   205-300  The line, then the mark (washes in over the result) */
export const InspoTeaser: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.paper }}>
      <Sequence durationInFrames={70} layout="absolute-fill" name="Prompt">
        <PromptScene />
      </Sequence>
      <Sequence
        from={70}
        durationInFrames={150}
        layout="absolute-fill"
        name="Archive"
      >
        <ArchiveScene />
      </Sequence>
      <Sequence from={205} layout="absolute-fill" name="Outro">
        <OutroScene />
      </Sequence>
      <Soundtrack />
    </AbsoluteFill>
  );
};
