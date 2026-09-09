# Rendering

Both compositions run at **60fps**, which is where X caps.

```bash
npx remotion render InspoLaunch out/inspo-launch.mp4 \
  --codec h264 --image-format png --crf 12 --x264-preset slow \
  --color-space bt709 --pixel-format yuv420p --audio-bitrate 320k
```

Then tag the colour flags the encoder leaves unset. This is a stream
copy, so it costs nothing:

```bash
ffmpeg -i out/inspo-launch.mp4 -c copy -movflags +faststart \
  -bsf:v "h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=0" \
  out/tagged.mp4 && mv out/tagged.mp4 out/inspo-launch.mp4
```

Why each flag:

- `--image-format png` is the one that matters most. Remotion pipes
  JPEG frames at quality 80 by default, which puts artefacts on the
  fine text and the screenshots before h264 ever sees them.
- `--crf 12` is the practical ceiling. Measured against a lossless
  reference frame, CRF 12 scores 34.45dB and CRF 16 scores 34.04dB:
  the gap is small because the real loss is 4:2:0 chroma subsampling,
  not the bitrate. 4:2:0 is not negotiable - it is what plays
  everywhere, and X re-encodes to it regardless.
- `--color-space bt709` sets the matrix but leaves primaries and
  transfer unset, hence the bitstream filter above.
- Remotion already writes `moov` ahead of `mdat`, so the file streams
  progressively without a faststart pass. The remux keeps it that way.

## Frame rate

Every scene's timings are written as frame numbers tuned at 30fps.
`src/timing.ts` converts the real frame back to that scale, so the fps
lives in `Root.tsx` alone. To change it, change `Root.tsx` and nothing
else. Do not hand-double the constants inside the scenes.
