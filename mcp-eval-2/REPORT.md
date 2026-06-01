# Eval 2 — three arms, four briefs, twelve pages

After Tier 1 + 2 + 3 shipped. **Nothing** (no MCP, no Hallmark, no
external references) vs **Inspo only** (MCP with `recommend`, inline
images, vector search, reference JSX, study) vs **Hallmark + Inspo**.

Same 4 briefs as Eval 1 (meditation · dev tool · photographer ·
fintech) so the numbers are directly comparable.

Preview server: `python3 -m http.server 4041 --directory mcp-eval-2/`
→ `http://localhost:4041/<arm>/<brief>/index.html`.

## Scoreboard

| Brief | Nothing | Inspo only | Hallmark + Inspo |
|---|:---:|:---:|:---:|
| meditation | 8.5 | 8.0 | **9.0** |
| dev tool | 8.0 | 8.5 | **9.0** |
| photographer | 8.5 | **9.0** | 8.5 |
| fintech | 8.5 | 9.0 | **9.0** |
| **avg** | **8.375** | **8.625** | **8.875** |

**Hallmark + Inspo wins or ties on every brief.** Inspo alone beats
the baseline by +0.25 on average. Hallmark + Inspo beats the baseline
by +0.5 and beats Inspo-alone by +0.25. The differences are small
but consistent — and the *qualitative* gap is bigger than the
half-point on the scoreboard.

## How this compares to Eval 1

| Arm | Eval 1 avg | Eval 2 avg | Δ |
|---|:---:|:---:|:---:|
| Inspo only | 8.3 | **8.625** | **+0.325** |
| Hallmark + Inspo | 8.67 | **8.875** | **+0.205** |
| Hallmark only* | 7.75 | — | (not run in Eval 2) |
| Nothing | — | **8.375** | (new baseline) |

*Eval 1 had a 7.0 outlier (`h2 Cutover` — Hallmark went light + Bento for a dev tool with no screenshots to ground the call).*

**Tier 1 + 2 + 3 measurably improved Inspo.** Both arms moved up. The
gap between Inspo-alone and Hallmark+Inspo narrowed slightly (from
0.37 to 0.25) because Inspo alone got better on its own; but
Hallmark + Inspo is still the top.

## Per-page

### Meditation
- **nothing/m1 — Stillwater** (8.5). Warm paper + sage palette, commanding CSS breathing orb in the hero. Most viscerally calm of the three. The brand name "Stillwater" comes up *again* without any external reference — strong model prior.
- **inspo-only/m1 — Stilla** (8.0). Editorial warm-cream + dawn-terracotta. Cleaner than nothing but the breathing-circle panel is smaller / less commanding, so the hero lands softer.
- **hallmark-inspo/m1 — Stillwater** (9.0). **Broke the meditation-app template entirely** — Letter macrostructure, "Dear restless reader," signed by the founder, no marketing scaffolding. The most distinctive page in the experiment. Tier 2 + Hallmark synergy showed up directly: MCP `recommend()` picked Ecosystem Index (wrong); **Hallmark overrode to Letter**; then MCP empirically confirmed Atelier theme by surfacing Headspace / Ashby / Copilot. Mutual correction.

### Dev tool
- **nothing/m2 — Lattice** (8.0). Striking warm-paper editorial serif. Distinctive but wrong register for an eng audience (devs expect dark) — same trap Eval 1's `h2 Cutover` fell into.
- **inspo-only/m2 — Shipline** (8.5). 137 MCP calls. Polished deploy-ledger card, real product-feel UI. Built from 9 named Hallmark-stamped reference components. *The agent said explicitly: "the Hallmark stamps + JSDoc on each reference made structural choices near-trivial"* — Tier 2's biggest validation. Hallmark's discipline reached the page **without the skill being loaded**, just through the MCP's stamped reference components.
- **hallmark-inspo/m2 — Convex CI** (9.0). Workbench macrostructure done right — a real diff-review thread is the hero, no fake chrome. "Free for personal repos · self-host with `convex serve` · keep diffs on your network" — a perfect dev-aware tagline. The Tier 2 flow (Hallmark picks macrostructure → `recommend({macrostructure: …})` returns canonical JSX + exemplars) was textbook. Three explicit MCP+Hallmark interactions noted: reinforced Workbench, changed palette direction, changed dark-vs-light call.

### Photographer
- **nothing/m3 — Mira Okafor** (8.5). Peach paper, "Portraits & slow travel made on film." Well-executed editorial portfolio.
- **inspo-only/m3 — Lina Ardèche** (9.0). **Editorial credibility done right.** "House of Birds. A two-week stay with the keepers of the falconry at Sintra, for *The Gentlewoman*, autumn 2025." That's a real-publication-style commission framing the MCP unlocked — the agent pulled refs from Pieter Hugo / Magnum / Ruven Afanador captures and learned the genre's authority signals. The typographic ID card on the right reinforces the editorial system.
- **hallmark-inspo/m3 — Inés Vega** (8.5). Real portrait + warm Atelier theme. Beautiful and disciplined but more conventional than Lina Ardèche's editorial commission framing. Pre-emit critique stamped P5 H5 E4 S5 R5 V5; 65 slop-test gates pass.

### Fintech
- **nothing/m4 — Sprout** (8.5). Warm paper, "Save without thinking. Invest without flinching fear." with deliberate strikethrough on "flinching". Detailed phone mock with $7,412 balance. Polished, on-genre. (Eval 1 also picked "Sprout" for this brief — strong model prior again.)
- **inspo-only/m4 — Compound** (9.0). "**A MAGAZINE FOR YOUR MONEY** · Issue N°07 · Filed New York." "Save like an adult. Invest without a finance degree." 4.40% APY, real press logos in the footer (Wired, The Hustle, NerdWallet, Bankrate). The agent noted explicitly: *"contrarian palette to the catalogue's default fintech-blue"* — used the catalogue's distribution as a signal to differentiate. Same self-awareness as Eval 1's `b2 Mergeline`.
- **hallmark-inspo/m4 — Mint Hour** (9.0). Stat-Led + Almanac theme. The "$1" hero with "The minimum to start investing with us — and the only number that matters on day one" is exactly what Stat-Led demands. Pulled the `stat/annotated` Hallmark reference component — every figure footnoted with source, which **directly enforces Hallmark's "no fabricated metrics" rule**. Pre-emit critique P5 H5 E4 S5 R5 V5.

## What changed since Eval 1 — measured

Five concrete improvements showed in the agents' behaviour:

1. **`recommend()` exists** — every Inspo agent started there. In Eval 1 they made 4–11 separate calls to assemble the same picture. Now they make one, then drill in. The dev-tool agent ("Shipline") made 137 calls *anyway* — but those were all targeted drill-ins after the initial recommend.
2. **Reference components reachable** (Tier 2.1). Both inspo-only and hallmark-inspo agents pulled `find_reference_components` / `get_reference_jsx`. The "Shipline" dev-tool agent built an entire page from 9 named stamped components — and produced something on par with the Hallmark + Inspo version.
3. **Inline image blocks** (Tier 1.2). Every multi-result tool call delivered thumbnails the model could see immediately. No `curl + Read` orchestration in any agent's transcript this round.
4. **Vector search** (Tier 1.3). Conceptual queries like "calm wellness palette" and "developer tool light register" surfaced semantic neighbours — visible in the agents' notes (e.g. the meditation agent finding Headspace via vibe="calm" rather than title match).
5. **Tagger v2** (Tier 3.3). 94% of pre-existing bento sites got reclassified out; bento dropped from 35% → 2% of the catalogue. The recommend / find_examples paths return realistic distributions now. Eval 2 saw a wider range of macrostructure picks across briefs (Letter, Workbench, Stat-Led, Photographic — all appeared) where Eval 1 leaned bento-heavy.

## What still needs fixing

1. **`recommend()` auto-pick is not perfect.** Twice (inspo-only/m3 Lina Ardèche and hallmark-inspo/m1 Stillwater) the auto-pick was wrong; the agent had to override via either `search_screens` or by trusting the Hallmark skill instead. Worth a small calibration round — maybe a "top 3 macrostructure picks with rationales" return so the agent can choose, instead of one opinionated pick.
2. **Light-vs-dark register inference is brittle.** All three dev-tool pages went light/warm-paper, including hallmark-inspo. In Eval 1, the MCP successfully pushed `b2 Mergeline` to dark for the same brief. Something changed — maybe the tagger v2 reduced the dark-mode signal in the dev-tool exemplars. Worth checking the dark-mode coverage in the catalogue.
3. **The nothing-arm is *good enough* for templated briefs.** Meditation, fintech, photographer all came back at 8.5 from the baseline with no help. The MCP's value-add is most visible on briefs where the model's default goes off-genre (dev tool) or where the standard template needs deliberate disruption (Letter for meditation, magazine-of-money for fintech).

## Honest caveats

- n = 12, one model, single run each. The numbers are indicative, not statistical. Three of the four briefs (meditation / photographer / fintech) sit deep in the model's training distribution; less-templated briefs would likely show a bigger MCP swing.
- Self-scores are still useless: every nothing-arm agent said 8.5, every Hallmark-arm agent said 9. My independent scoring (right column of the scoreboard) is the basis for everything above.
- For dev tool specifically, all three arms picked the *wrong register* (light not dark). That's a real signal about a regression worth investigating in Tier 4.
