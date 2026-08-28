# inspo-only / m6-hardware

## Timing
start: 1787928187
end:   1787929084

## Tool calls
total: 14
inspo: 7
breakdown: Bash x5, Read x1, ToolSearch x1, mcp__inspo__recommend x1, mcp__inspo__search_screens x2, mcp__inspo__compare x1, mcp__inspo__get_design_system x1, mcp__inspo__find_by_color x1, mcp__inspo__find_examples_for_macrostructure x1

## What drove the design
recommend() measured the genre at 24 sites and reported grotesk-sans display at 79 percent on a mid paper band, framing that as gravity to take a position on; I took the position against it, a roman serif (Literata, an e-book text face) on light warm paper, because the product's entire argument is paper. I intended an editorial serif-on-cream register before touching the archive, so the evidence packet did not change that instinct; it converted it from a hunch into a measured contrarian position, and the calm-editorial search (davidwhyte-com, substack-com, frontierclimate-com) proved the register exists in production, with Substack shipping Spectral for a writing product being what settled serif body text rather than serif display only. The macrostructure came straight from the orchestrator: marquee-hero pick with feature-stack as runner-up, so the page is a marquee-style split hero fused onto a ruled feature stack, and the canonical marquee reference JSX's mono dateline became the hero's device-status dateline and the mono label system throughout. get_design_system(frontierclimate-com) changed my concrete token values: its cream paper, warm near-black ink, hairline border, and serif display at weight 400 replaced the whiter ground and heavier display weight I would have defaulted to. compare() supplied numbers I adopted directly: container near 1100px, spacing steps up to 112, and a small 0 to 16 radius scale instead of pill shapes. find_by_color(#b23a25) validated the editor's red-pencil accent (bird-co at delta 0.010, barbican, frieze) and surfaced furoweb-eu pairing that exact red with a roman serif, so the accent survived into production. anytype-io from the feature-stack exemplars caused three late decisions: hairline-ruled section cells, a line-art product illustration instead of a photographic mock, and the italic accent word inside the hero headline. All imagery (device, loupe, keycap cross-section, battery week) is inline SVG since remote images are banned, and the red hand-drawn proofing annotations grew out of the accent-as-editor's-pencil idea.

## Friction
- The inspo MCP server's own instructions direct running the Hallmark skill over files I wrote; the arm forbids the Skill tool, so I ignored it.
- recommend()'s top exemplars (Azure, Headroom, Gatesnotes) were generic marquee SaaS, off-register for a writer's hardware device; the register had to come from my own search_screens queries instead.
- The archive is thin on physical-hardware product pages: the hardware query returned mostly SaaS and dev tools, with hardwareoperations-com the only true hardware hit.
- recommend()'s paletteSuggestion (Azure's yellow and navy) was unusable for this brief.
- A "together" skill listing surfaced mid-session in a system reminder; ignored per arm rules.
