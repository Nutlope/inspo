import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadFrauncesItalic } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadInterTight } from "@remotion/google-fonts/InterTight";

const fraunces = loadFraunces("normal", {
  /* 400 is the masthead wordmark's weight on the site */
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});

loadFrauncesItalic("italic", {
  weights: ["600"],
  subsets: ["latin"],
});

const interTight = loadInterTight("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export const fonts = {
  display: fraunces.fontFamily,
  sans: interTight.fontFamily,
};

/* Inspo editorial palette, lifted from apps/web/src/app/globals.css */
export const colors = {
  paper: "#f4f1ec",
  ink: "#1a1a1a",
  inkMuted: "#6b6862",
  rule: "#d8d3c8",
  accent: "#c7402f",
  accentInk: "#fdfdfb",
};

/* The one easing voice of the video: expo-out, same curve family the
   site uses for its hover transitions. */
export const EXPO = [0.16, 1, 0.3, 1] as const;
