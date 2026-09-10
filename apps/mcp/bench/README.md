# Standing benchmark

Two halves, run at every release. One is free and automatic; the other
costs real money and needs a human to judge.

## 1. Response cost (free, deterministic, run every release)

```bash
pnpm --filter @inspo/mcp bench           # measure and print
pnpm --filter @inspo/mcp bench:check     # fail if anything grew >20%
pnpm --filter @inspo/mcp bench -- --write  # accept the new numbers as baseline
```

Boots the stdio server, makes a fixed set of calls in both profiles
(`vision` = full + thumbs, `text` = lite + none), and reports text
chars, estimated tokens, inline image count and KB per call. `--check`
diffs against [baseline.json](baseline.json) and exits non-zero on a
regression, so a change that triples every search result gets caught
before it ships instead of showing up on someone's bill.

Growth tolerance is deliberately loose (20%): inline image sizes move
in steps as the WebP variant backfill lands, and this exists to catch
2x, not 5%. Shrinking never fails. A case that isn't in the baseline is
reported and skipped, so adding one doesn't break the check.

Read the two sections of the output as different kinds of cost:

- **Tool schemas** are paid once per session and cached after. At ~5k
  tokens (vision) and ~3k (text) they are a rounding error, and cutting
  tools to save schema tokens is almost always the wrong trade.
- **Tool results** are paid once at full price and then re-read on
  every subsequent turn. This is where the money goes.

## 2. A/B generation (costs money, needs judgement)

[briefs.json](briefs.json) freezes five one-sentence briefs, the rules
both arms run under, and the judging rubric. **Do not reword the
briefs** - the entire value is that each run is comparable to the last.
Add new ids instead.

Procedure:

1. Ten generations: each brief twice, same model and effort, one arm
   with the Inspo MCP as its only tool and one arm with nothing.
2. Screenshot every page at 1280x800 (the fold `HERO_GUIDANCE` targets)
   and judge the pairs against the rubric.
3. Record tokens, cost and wall time per run, plus the verdicts, into
   `results/<date>.json` following the shape of the existing file.

On accounting: derive output tokens from emitted file bytes at roughly
3.8 chars/token. Per-message usage in agent transcripts is a
`message_start` snapshot and is only final on messages whose usage
carries an `iterations` key; dedupe runs by `message.id`, because a
multi-block assistant message logs as several lines sharing one usage
object.

## Results

| Date | Release | Verdict | Context | Cost | Wall |
|---|---|---|---|---|---|
| [2026-07-31](results/2026-07-31.json) | 0.1.4 | Inspo won 3, lost 1, split 1 | 3.3x | 1.55x | 1.20x |

[2026-09-10](results/2026-09-10-agent-usage.md) is a different kind of
result: an audit of thirty real Fable 5.1 builds, which found that 13%
of returned sites were used and that the reference-component tool was
29% of all text served. The response shapes changed the same day; the
before/after bench numbers are in that file and the new baseline is
committed here.

The 2026-07-31 run used the local stdio server at `full` + `thumbs`,
which is the most expensive configuration Inspo offers. The hosted
endpoint defaults to `lite` + `images=none`, so those ratios are close
to a worst case rather than a typical one.
