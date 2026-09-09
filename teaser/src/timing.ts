import { useCurrentFrame, useVideoConfig } from "remotion";

/* Every scene in this project has its timings written as frame numbers
   that were tuned at 30fps, and the comments above each scene describe
   them that way.

   Rather than double sixty-odd constants to move the film to 60fps -
   and risk re-tuning anything that rounds badly - the composition's fps
   is raised and the frame is converted back to the authored scale here.
   Nothing happens at a different moment. There are simply twice as many
   samples of every interpolation, which is the entire point of 60fps.

   The frame arrives fractional (0, 0.5, 1, 1.5 ...). Every interpolate(),
   Math.floor() and Math.sin() in the scenes already handles that, so the
   scenes themselves needed no change at all. */
export const AUTHORED_FPS = 30;

/** The current frame, on the 30fps scale the scenes are written in. */
export const useAuthoredFrame = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (frame * AUTHORED_FPS) / fps;
};

/**
 * Converts an authored (30fps) frame number into a real frame of this
 * composition. For Sequence `from` and `durationInFrames`, which are
 * counted in real frames and must be whole numbers.
 */
export const useAuthoredFrames = () => {
  const { fps } = useVideoConfig();
  return (authored: number) => Math.round((authored * fps) / AUTHORED_FPS);
};
