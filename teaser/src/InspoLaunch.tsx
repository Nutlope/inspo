import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { LaunchSoundtrack } from "./LaunchSoundtrack";
import { ArchiveScene } from "./scenes/ArchiveScene";
import { MontageScene } from "./scenes/MontageScene";
import { OutroScene } from "./scenes/OutroScene";
import { PromptScene } from "./scenes/PromptScene";
import { TaglineScene } from "./scenes/TaglineScene";
import { colors } from "./theme";

/* The launch film. 19.7 seconds at 30fps.
   0-58     Prompt: a real one, typed to a coding agent
   55-323   Inspo searches the archive, keeps three, reads them,
            builds the page and scrolls it
   321-486  The montage: that page and four more, each under its brief
            (it starts on the exact frame the archive leaves, and runs
            on under the tagline's wash)
   469-531  The line: your agent doesn't have taste, lend it some
   525-591  The mark, and that it is free and open source */
export const InspoLaunch: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.paper }}>
      <Sequence durationInFrames={58} layout="absolute-fill" name="Prompt">
        <PromptScene />
      </Sequence>
      <Sequence
        from={55}
        durationInFrames={268}
        layout="absolute-fill"
        name="Archive"
      >
        <ArchiveScene />
      </Sequence>
      <Sequence
        from={321}
        durationInFrames={165}
        layout="absolute-fill"
        name="Montage"
      >
        <MontageScene />
      </Sequence>
      <Sequence
        from={469}
        durationInFrames={62}
        layout="absolute-fill"
        name="Tagline"
      >
        <TaglineScene />
      </Sequence>
      <Sequence from={525} layout="absolute-fill" name="Outro">
        <OutroScene caption="MCP · Free and open source" />
      </Sequence>
      <LaunchSoundtrack />
    </AbsoluteFill>
  );
};
