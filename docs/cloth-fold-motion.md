# Cloth-fold extension

This records the earlier PR62/63 concertina design and its checks. Its symbolic scene widths and per-event folds are superseded by PR64; see [Woven periods and soft cloth pleats](woven-periods.md) for the current chronological material, top braids, neutral landscape, rounded pleats and validation.

The tapestry keeps its continuous illustrated cloth while zoom opens and closes concertina folds. An exposed overview face introduces each event; four additional illustration regions have paired hinges. All selected source material is present at every zoom, with no zoom-tier image swaps or mirrored regions.

The design retains the archive's existing ink, linen, type and illustrations. Crease shading follows the fold angle, becomes neutral on flat cloth, and uses the existing brown/linen palette. The timeline, date rails and captions remain precise annotations around the fabric.

## Geometry and interaction

`getPanoramaStrip` provides the original source. `selectClothStrip` keeps the first three complete narrative regions for every scene at every zoom. `layoutWeaveCloth` holds the exposed summary crop at a fixed width and unfolds the two remaining regions on paired hinges. Scene widths come from projected cloth geometry, independently of historical gaps; each scene begins at the preceding scene's end. Together they fill the overview and form one illustrated strip, with no empty scene padding.

The shared camera maps chronological scene anchors to positions on that physical strip and clamps its ends to keep the viewport covered. Panning changes only the whole strip's transform; individual artwork always has a zero local pan offset. The source viewBoxes and figure height stay fixed during zoom. Scientific dates and duration rails remain on the exact chronological scale, while captions on the cloth state each event's recorded dates. Cloth picture widths are symbolic, not a second time scale. Context keyboard navigation centres the corresponding chronological year.

The renderer retains keyed scene buttons, SVG image nodes and their artwork fallback across zoom. Animated zoom moves existing scientific coordinates and fold transforms, keeping text and portrait sizes unchanged; it recomputes the density layout once on settlement. Caption and keyboard geometry reads are batched before writes. A 420 ms smoothstep eases acceleration and contact; squared-depth shading avoids a last-pixel crease flash. Wheel/pinch remain continuous and direct gestures supersede unfinished animations. Reduced-motion applies the final pose immediately. The public event keys, click behavior and dates are preserved.

## Validation

- 50 native application tests and 25 operator/artifact tests pass.
- Fold tests cover all 21 scenes with both current and fallback artwork, 2–8000px widths, conserved endpoints, continuous and reversible projection, upright source order, shared hinge positions and flat cloth.
- T3 collaborative-browser checks verify 189 retained face nodes, 21 preserved date ranges, stable figure height through repeated zoom, both themes, the original-art error path, immediate reduced-motion geometry, all eight charge-route steps, 27 printable references and no document overflow at 390px.
- The HTML plan embeds an actual short browser recording. Deployment audit checks face retention, dates, height and reduced-motion folding when the extension is present.
- A same-browser desktop recording improved from seven moving zoom steps at roughly 50–60 ms intervals to twelve steps, mostly 20–30 ms apart. The final density layout still costs a larger frame; crowded scientific markers regroup then. Treat these as measured prototype samples, not a universal frame-rate guarantee. Motion checks cover retained scientific nodes, rapid reversal, wheel interruption without rebound, and precise marker centres and interval endpoints.

## Delivery

Use its own `ui-pass2/09-cloth-folds` branch/worktree. It extends the existing stack above `ui-pass2/remedial-context-constants`. Register it as a required primary layer so the initial prototype publication waits for this feature. CodeRabbit remains manually admitted by the shared 61-minute queue. Merge only to `prototype/ui-pass2`; publish to the new here.now site after the registered primary layers pass and merge. Main and the production site are untouched.

The user-reported jumpiness correction is [PR #63](https://github.com/SamMackrill/PaperTrails/pull/63), on `ui-pass2/10-smooth-cloth` in a separate worktree above #62. Register this as a required tenth primary layer so initial publication includes the fix. It shares the same manual review gate and prototype-only merge policy.

Keep the user-selected 32× zoom limit, about 20 years in linear view. All attached folds become exactly flat there; source rendering stays proportional. The previous date-budget crops and per-picture panning were replaced because they introduced gaps and sliding. Every scene now keeps visible folds below full zoom, including events separated by short gaps.

Earlier/later controls pan by 80% of the scientific viewport without changing magnification. Horizontal overview input pans, and narrow minimap windows remain draggable. Geometry and browser checks verify contiguous joins, retained faces and source crops, fixed local picture positions through pan, complete unfolding, reversible motion, fallback restitching, and a 390px viewport without overflow. The HTML plan embeds a new browser recording of the continuous cloth.
