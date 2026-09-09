import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { useAuthoredFrames } from "./timing";
import { LaunchSoundtrack } from "./LaunchSoundtrack";
import { ArchiveScene } from "./scenes/ArchiveScene";
import { MontageScene } from "./scenes/MontageScene";
import { OutroScene } from "./scenes/OutroScene";
import { PromptScene } from "./scenes/PromptScene";
import { TaglineScene } from "./scenes/TaglineScene";
import { colors } from "./theme";

/* The launch film. 20.7 seconds. Written at 30fps and rendered at
   60 - see src/timing.ts. Every number below is an authored frame.
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
  /* Scene bounds below are the authored 30fps numbers. */
  const t = useAuthoredFrames();

  return (
    <AbsoluteFill style={{ backgroundColor: colors.paper }}>
      <Sequence durationInFrames={t(62)} layout="absolute-fill" name="Prompt">
        <PromptScene />
      </Sequence>
      <Sequence
        from={t(59)}
        durationInFrames={t(268)}
        layout="absolute-fill"
        name="Archive"
      >
        <ArchiveScene />
      </Sequence>
      <Sequence
        from={t(325)}
        durationInFrames={t(165)}
        layout="absolute-fill"
        name="Montage"
      >
        <MontageScene />
      </Sequence>
      <Sequence
        from={t(473)}
        durationInFrames={t(62)}
        layout="absolute-fill"
        name="Tagline"
      >
        <TaglineScene />
      </Sequence>
      <Sequence from={t(529)} layout="absolute-fill" name="Outro">
        <OutroScene caption="MCP · Free and open source" url="inspomcp.dev" />
      </Sequence>
      <LaunchSoundtrack />
    </AbsoluteFill>
  );
};
