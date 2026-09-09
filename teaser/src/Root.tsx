import "./index.css";
import { Composition } from "remotion";
import { InspoLaunch } from "./InspoLaunch";
import { InspoTeaser } from "./InspoTeaser";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="InspoLaunch"
        component={InspoLaunch}
        durationInFrames={600}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="InspoTeaser"
        component={InspoTeaser}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
