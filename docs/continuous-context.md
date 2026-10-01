# Continuous scenery through uncovered context

PR #67 fixes the remaining blank stretches above the context continuation layer.
An event's recorded duration no longer hides all older art: only its actual
painted footprint conceals it. Later artwork is planned first, and distinct
era-approved facets of older active chapters fill surviving windows. Widely
spaced facets are distributed through a window rather than clustered at its start.

Quiet scenery is allocated to the actual remaining gaps instead of six arbitrary
positions underneath other pictures. Every source region is consumed once, at a
uniform natural scale, with the same plan for raster textures and SVG fallback.
Three new original PNG atlases supply 24 distinct landscape panoramas. None
contains people, settlements, buildings, transport or technology. Six winter
panoramas are confined to the recorded Little Ice Age interval; this symbolic
seasonal scenery does not claim an exceptional freeze or snow in every year.
Other intervals use timeless neutral scenery, including Victorian intervals
after the climate record ends in 1850.

Filled hills, varied plants, branchwork and thread hatching provide continuous
deterministic scenery if an image fails or the viewport exceeds the finite bitmap
budget. No source image is tiled, mirrored or stretched. Images remain on fixed
material coordinates while folds conceal and reveal them. Dates, braids, stable
record IDs, sourced trails and maximum zoom remain unchanged.

The tests cover continuous illustrated coverage at material widths 36032, 40960
and 61440 with a 117px picture height, disjoint source crops, native proportions,
older context after the painted end of the Thirty Years' War, seasonal bounds,
atlas metadata, density geometry and fold reversal. Native T3 confirms the
previously empty seventeenth-century stretches are illustrated, all 229 cloth
faces and 25 quiet source crops persist at maximum zoom, and all folds flatten.

Delivery uses branch/worktree `ui-pass2/14-continuous-context` above #66. The
persisted operator owns manual CodeRabbit admission through the shared 61-minute
gate. This required primary layer blocks initial publication until reviewed and
merged into `prototype/ui-pass2`; main stays isolated. Clear fixes remain
autonomous. An optional safe waiver requires an implemented remedial PR and
recorded rationale. The publisher repeats the complete packaged browser audit.

Original artwork and the complete built-in imagegen prompts are preserved in
`images/tapestry/` and `docs/continuous-context-art-prompts.json`.
