# Cloth-fold extension

The tapestry keeps its continuous illustrated cloth while zoom opens and closes concertina folds. An exposed overview face introduces each event; four additional illustration regions have paired hinges. All source material is present at every zoom, with no zoom-tier image swaps or mirrored regions.

The design retains the archive's existing ink, linen, type and illustrations. Crease shading follows the fold angle, becomes neutral on flat cloth, and uses the existing brown/linen palette. The timeline, date rails and captions remain precise annotations around the fabric.

## Geometry and interaction

`getPanoramaStrip` provides the full five-region source. `layoutCloth` conserves projected width by assigning the remaining space to the pleats. Their paired faces rotate by opposite angles; the return face starts at the recessed hinge. Orthographic projection conserves physical cloth width; at deep zoom this is capped at its natural unfolded size. Dated rails retain the historical scene extent. The first face stays exposed. Figure height reserves the overview date-row space through zoom.

The renderer retains keyed scene buttons, SVG image nodes and their artwork fallback across zoom. Animated zoom moves existing scientific coordinates and fold transforms, keeping text and portrait sizes unchanged; it recomputes the density layout once on settlement. Caption and keyboard geometry reads are batched before writes. A 420 ms smoothstep eases acceleration and contact; squared-depth shading avoids a last-pixel crease flash. Wheel/pinch remain continuous and direct gestures supersede unfinished animations. Reduced-motion applies the final pose immediately. The public event keys, click behavior and dates are preserved.

## Validation

- 47 native application tests and 25 operator/artifact tests pass.
- Fold tests cover all 21 scenes with both current and fallback artwork, 2–8000px widths, conserved endpoints, continuous and reversible projection, upright source order, shared hinge positions and flat cloth.
- T3 collaborative-browser checks verify 189 retained face nodes, 21 preserved date ranges, stable figure height through repeated zoom, both themes, the original-art error path, immediate reduced-motion geometry, all eight charge-route steps, 27 printable references and no document overflow at 390px.
- The HTML plan embeds an actual short browser recording. Deployment audit checks face retention, dates, height and reduced-motion folding when the extension is present.
- A same-browser desktop recording improved from seven moving zoom steps at roughly 50–60 ms intervals to twelve steps, mostly 20–30 ms apart. The final density layout still costs a larger frame; crowded scientific markers regroup then. Treat these as measured prototype samples, not a universal frame-rate guarantee. Motion checks cover retained scientific nodes, rapid reversal, wheel interruption without rebound, and precise marker centres and interval endpoints.

## Delivery

Use its own `ui-pass2/09-cloth-folds` branch/worktree. It extends the existing stack above `ui-pass2/remedial-context-constants`. Register it as a required primary layer so the initial prototype publication waits for this feature. CodeRabbit remains manually admitted by the shared 61-minute queue. Merge only to `prototype/ui-pass2`; publish to the new here.now site after the registered primary layers pass and merge. Main and the production site are untouched.

The user-reported jumpiness correction is [PR #63](https://github.com/SamMackrill/PaperTrails/pull/63), on `ui-pass2/10-smooth-cloth` in a separate worktree above #62. Register this as a required tenth primary layer so initial publication includes the fix. It shares the same manual review gate and prototype-only merge policy.

The same queued PR corrects the maximum-zoom endpoint without distorting figures. Source artwork uses one proportional scale determined by the cloth height. The zoom limit extends to let all 21 scenes and both artwork sets unfold naturally, including short historical intervals. Once flat, physical cloth width stops growing; panning through a long dated scene carries the intact picture through the viewport, while the continuous linen and independent interval rails preserve historical extent. SVG faces retain `preserveAspectRatio="xMidYMid slice"`. All folds reach zero angle, depth and shading at maximum zoom. Geometry tests cover natural scaling, complete unfolding across viewport sizes and bounded panning. T3 checks verify equal horizontal/vertical SVG image scales and all 21 flat scenes in linear and density modes, original-art fallback, unchanged dates and retained faces, and a 390px viewport without overflow.
