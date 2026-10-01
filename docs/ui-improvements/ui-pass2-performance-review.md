# Performance layer review corrections

The first manual review of PR #71 identified two valid recovery issues. Artwork redraws now resolve the ribbon's current parent after detached assembly installs it into the live timeline. Failed optimized drawings retry valid original sources on canvas before the expensive SVG recovery tree is expanded. Restoring a URL without a range also cancels any active pan or zoom animation before fitting the whole timeline.

Validation: all 81 Node tests and 25 Python tests for this layer passed. A diagnostic local server deliberately returned 404 for the five optimized Landscape sheets while leaving their original sources available. The collaborative preview recovered all 25 events on the single live ribbon (`artReady=true`, owner `timeline`). A zoom interrupted by range-free history restoration remained at 1400–2026 after its former animation duration elapsed. Later stack layers inherit these corrections and undergo fresh-head review.

Review findings: 4158540885 (live artwork recovery), 4158540872 (history restoration during animation).
