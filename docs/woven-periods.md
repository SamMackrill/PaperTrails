# Woven periods and soft cloth pleats

The user rejected equal-width scenes: Carrington appeared as large as the American Civil War. The new fabric uses chronological positions and recorded durations. In linear view, Carrington remains a point knot, with a small one-year pictorial slot; the four-year Civil War picture is four times wider. The knot does not assert that the storm lasted a year. Overlapping periods keep independent braids; later scenes can sit over a continuing broad period without changing its recorded span.

The user supplied a curtain photograph as the motion reference, and selected a quiet embroidered landscape without historical figures or implied events for the intervals between records. The generated connector is `images/tapestry/landscape-b-interlude.png`; its complete built-in imagegen prompt and provenance are in `images/tapestry/README.md`. Event art blends into that landscape through short fixed joins inside its boundaries. Original event atlas bytes are unchanged.

## Fabric and annotations

A single fixed material spans the whole timeline. Sixty-four pleats have eight small surfaces each. A continuously varying rounded profile relaxes from tight gathers to broad crests; a projection solver fills the exact current timeline width. All surfaces stay connected and upright. Source slices, image positions and face nodes remain fixed through zoom and reversal. Maximum zoom is exactly flat, with no crease shading. The 32x ceiling remains about twenty years in linear view; the alternative density scale shares the scientific timeline's mapping.

Thin, five-pixel braid rows sit at the top of the fabric. They trace exact source intervals, with woven endpoint knots; point records have a single knot. Names and dates remain above the pictures, with dates protected when names need ellipses. The separate lower date-bar lane and repeated date labels are removed. Context allocation falls from 250 to 180 pixels, rather than growing with label lanes. Figure height is stable during zoom.

Eight cached canvas textures hold the composed artwork and braids. Zoom changes only the retained surfaces and captions, not the artwork. The renderer avoids reinserting the ribbon or measuring an intermediate camera during each frame; off-screen surfaces are retained without rasterising hidden layers. Interrupted texture work is cancelled; URLs are released when textures are replaced or Context is hidden. SVG material supplies a fallback if texture allocation is unavailable, and the original event atlases remain the artwork-error fallback.

## Validation and limits

47 native application tests and 25 operator/artifact tests pass. Meaningful geometry tests cover conserved cloth length, exact projected width, attached surfaces, stable source slices, continuous reversal, complete flattening, braid lanes based only on overlaps, and Carrington/Civil War proportions.

T3 browser checks verify the four-to-one picture ratio, 512 retained surfaces, unchanged 21 recorded date ranges and source slices through zoom, proportional source rendering, fixed picture positions and cached textures through panning, immediate reduced-motion behaviour, original-art fallback for all 21 events, a 390-pixel viewport without page overflow, and release of obsolete texture URLs when Context is hidden. Both linear and density views keep the dated geometry. All folds become flat at maximum zoom.

A same-browser motion sample improved from about 170 ms median intervals before texture caching and retained-camera fixes to about 30 ms median, with one 70 ms frame. This is prototype evidence on the current machine, not a universal frame-rate claim; final scientific regrouping can still cost a larger frame.

## Delivery and restart state

This is required layer 11, PR #64, branch `ui-pass2/11-woven-periods`, worktree `PaperTrails-worktrees/ui-pass2/11-woven-periods`, above #63. Initial publication must include it. Keep the shared manual CodeRabbit queue and 61-minute gate; never merge main or change the production site. The external operator will merge reviewed layers into `prototype/ui-pass2`, then publish that dedicated branch to its new here.now site.

The watcher was deliberately stopped and its scheduled launcher disabled for the user's T3 Code restart. PR64 was registered as `implementing` with no validated head, so documentation alone cannot be admitted for review. After this implementation is committed, pushed and registered with its exact validated head, resume the persisted queue without changing its admission clock or PR63 review provenance.
