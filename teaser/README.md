# Inspo launch video

The source for the launch video for [Inspo](https://inspomcp.dev), an MCP server that gives coding agents real websites to use as design references. Built with **Claude, React, and Remotion**.

Watch either cut below, then run the project to scrub through the scenes, change the copy, or make your own version.

## Watch

### Launch film · 20.7 seconds

**This is the video used for the launch.** A prompt for a crop-mapping website leads into the archive: three references are selected, their fonts and palettes appear, and the cards become a finished page. A montage follows with websites for a bike workshop, tattoo studio, ramen shop, and terminal app. It closes with “Your agent doesn't have taste. Lend it some.” and `inspomcp.dev`.

https://github.com/user-attachments/assets/7e36a715-0f68-46c3-8449-ee18e703cd5e

### Teaser · 10 seconds

The shorter, pre-launch cut shares the opening prompt, scans the archive, and turns three references into a page. It ends with the Inspo wordmark and **“MCP · Coming soon”**. Use the launch film above for the current announcement.

https://github.com/user-attachments/assets/8c194a05-e815-46b0-977a-2c86159ce5dc

| Composition | Duration | Resolution | Frame rate | Entry point |
| --- | --- | --- | --- | --- |
| `InspoLaunch` | 20.7s (1,244 frames) | 1920 × 1080 | 60 fps | [InspoLaunch.tsx](src/InspoLaunch.tsx) |
| `InspoTeaser` | 10s (600 frames) | 1920 × 1080 | 60 fps | [InspoTeaser.tsx](src/InspoTeaser.tsx) |

## Play and edit locally

You need **Node.js 20 or newer** and npm. This folder is a standalone Remotion project inside the Inspo repository; it has its own dependencies and lockfile.

```bash
git clone https://github.com/Nutlope/inspo.git
cd inspo/teaser
npm ci
npm run dev
```

Open the local URL printed in your terminal. In Remotion Studio, select **InspoLaunch** or **InspoTeaser** in the left sidebar, then click **Play** or press **Space**. Drag the timeline to inspect individual frames. Edits to the source update the preview.

The preview and render use the images in `public/`. You don't need to run the Inspo website, connect a database, or provide an AI API key. An internet connection is needed for the Google Fonts and Remotion sound effects.

## How we built it

We built and refined the video with Claude using [Remotion](https://www.remotion.dev/), which renders React components into video. The commit history documents the iterations: recutting the story around three references becoming a page, making the opening prompt readable, tightening the end card, and moving the render to 60 fps.

### 1. Break the story into React scenes

The launch film has five scenes: **Prompt → Archive → Montage → Tagline → Outro**. Each is a React component, placed on the timeline with Remotion's `Sequence`. The teaser shares the prompt and outro, with its own shorter search scene between them.

### 2. Use real screenshots as the visual material

The scrolling wall uses captured websites from Inspo's archive. The three featured references are **Mercury, Bandcamp, and Buildkite**, with their font names and palettes defined in [launch.ts](src/launch.ts). The finished pages are screenshots of sites generated with Inspo, including examples in the [website gallery](../apps/web/public/examples).

The search, selection, and page-building sequence is an authored animation using those assets. Rendering the film doesn't make live MCP or AI calls.

### 3. Animate everything from the frame number

Typing, camera moves, card selection, stacking, and page scrolls are controlled with `interpolate()`, easing curves, and CSS transforms. The scenes share the site's warm paper background, red accent, and **Fraunces + Inter Tight** typography through [theme.ts](src/theme.ts).

The animation timings were tuned at 30 fps. [timing.ts](src/timing.ts) maps the 60 fps render back to that authored timeline, preserving the pacing while making fast movement smoother.

### 4. Add sound at the same moments

Clicks, shutters, whooshes, page turns, and the closing ding come from `@remotion/sfx`, played with `@remotion/media`. Each cut has its own soundtrack component with frame-aligned cues.

## Where to make changes

| Change | File |
| --- | --- |
| Opening prompt | [src/scenes/PromptScene.tsx](src/scenes/PromptScene.tsx) |
| Colors, fonts, shared easing | [src/theme.ts](src/theme.ts) |
| Archive layout and selected references | [src/shots.ts](src/shots.ts), [src/wall-order.ts](src/wall-order.ts) |
| Montage pages, briefs, and reference metadata | [src/launch.ts](src/launch.ts) |
| Screenshot assets | [public/wall](public/wall), [public/real](public/real) |
| Closing wordmark, caption, and URL | [src/scenes/OutroScene.tsx](src/scenes/OutroScene.tsx); caption and URL passed from each composition |
| Scene order and duration | [src/InspoLaunch.tsx](src/InspoLaunch.tsx), [src/InspoTeaser.tsx](src/InspoTeaser.tsx) |
| Sound cues | [src/LaunchSoundtrack.tsx](src/LaunchSoundtrack.tsx), [src/Soundtrack.tsx](src/Soundtrack.tsx) |
| Resolution, fps, total frames | [src/Root.tsx](src/Root.tsx) |

Start by changing the prompt, screenshots, and closing caption. If you change scene lengths, update the composition's sequence boundaries, sound cues, and total duration together. The prompt and outro are shared, so check both cuts after editing them.

## Render an MP4

Run these commands from `teaser/`:

```bash
# Launch film
npx remotion render InspoLaunch out/inspo-launch.mp4 \
  --codec h264 --image-format png --crf 18

# Short teaser
npx remotion render InspoTeaser out/inspo-teaser.mp4 \
  --codec h264 --image-format png --crf 18
```

Open the resulting MP4 in your video player. The `out/` directory is ignored by Git. Remotion downloads a headless browser on the first render if one isn't already available.

For the higher-quality export settings and color-tagging step, see [RENDER.md](RENDER.md). The `--image-format png` flag preserves fine text and screenshot detail before the video is encoded.

For more on the framework, see the [Remotion fundamentals](https://www.remotion.dev/docs/the-fundamentals).
