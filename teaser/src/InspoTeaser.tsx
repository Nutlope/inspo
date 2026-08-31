import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { ArchiveScene } from "./scenes/ArchiveScene";
import { OutroScene } from "./scenes/OutroScene";
import { PromptScene } from "./scenes/PromptScene";
import { Soundtrack } from "./Soundtrack";
import { colors } from "./theme";

/* 10 seconds at 30fps.
   0-63     Prompt: "make it beautiful"
   63-204   The archive answers: cuts, then the grid assembles
   190-300  The line, then the mark (washes in over the grid) */
export const InspoTeaser: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.paper }}>
      <Sequence durationInFrames={63} layout="absolute-fill" name="Prompt">
        <PromptScene />
      </Sequence>
      <Sequence
        from={63}
        durationInFrames={141}
        layout="absolute-fill"
        name="Archive"
      >
        <ArchiveScene />
      </Sequence>
      <Sequence from={190} layout="absolute-fill" name="Outro">
        <OutroScene />
      </Sequence>
      <Soundtrack />
    </AbsoluteFill>
  );
};
