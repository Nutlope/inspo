import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { LaunchSoundtrack } from "./LaunchSoundtrack";
import { ArchiveScene } from "./scenes/ArchiveScene";
import { MontageScene } from "./scenes/MontageScene";
import { OutroScene } from "./scenes/OutroScene";
import { PromptScene } from "./scenes/PromptScene";
import { TaglineScene } from "./scenes/TaglineScene";
import { colors } from "./theme";

/* The launch film. 20.7 seconds at 30fps.
   0-62     Prompt: a real brief, typed from the very first frame,
            then held complete long enough to actually be read
   59-327   Inspo searches the archive, keeps three, reads them,
            builds the page and scrolls it
   325-490  The montage: that page and four more, each under its brief
            (it starts on the exact frame the archive leaves, and runs
            on under the tagline's wash)
   473-535  The line: your agent doesn't have taste, lend it some
   529-622  The mark, that it is free and open source, and where it
            lives - the address gets a long hold, it is the one thing
            a viewer has to leave with */
export const InspoLaunch: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.paper }}>
      <Sequence durationInFrames={62} layout="absolute-fill" name="Prompt">
        <PromptScene />
      </Sequence>
      <Sequence
        from={59}
        durationInFrames={268}
        layout="absolute-fill"
        name="Archive"
      >
        <ArchiveScene />
      </Sequence>
      <Sequence
        from={325}
        durationInFrames={165}
        layout="absolute-fill"
        name="Montage"
      >
        <MontageScene />
      </Sequence>
      <Sequence
        from={473}
        durationInFrames={62}
        layout="absolute-fill"
        name="Tagline"
      >
        <TaglineScene />
      </Sequence>
      <Sequence from={529} layout="absolute-fill" name="Outro">
        <OutroScene caption="MCP · Free and open source" url="inspomcp.dev" />
      </Sequence>
      <LaunchSoundtrack />
    </AbsoluteFill>
  );
};
