# Woven periods and exposed scene fronts

The user rejected equal-size duration pictures, then rejected the uniform rotated-face treatment: key figures were squeezed into shaded strips. PR64 now uses flat exposed summaries and occluded detail. Folded material is concealed, not distorted.

## Picture and fold geometry

One fixed chronological material retains the existing event artwork and quiet generated landscape. Event pictures end at their recorded boundaries; point vignettes occupy at most one year and keep a single exact knot. Civil War and Carrington have a four-to-one dated footprint ratio at every zoom. The quiet interlude has no historical figures or implied event. Its full original built-in imagegen prompt/provenance remains in `images/tapestry/README.md`; no asset bytes change in this correction.

Date boundaries divide the material into connected sections. The first motif of each event is centred in a native-size exposed front. Each section retains one summary plus at most six fixed detail faces. Details are tucked behind that front with decreasing depth order. Expansion reveals the fixed sources through less overlap; no face is scaled, rotated into a narrow strip, mirrored, recoloured or swapped. A narrow lit hem and recessed edge indicate each fold. At maximum zoom every face sits at its full source position, all detail is exposed and crease lighting is zero. The 32x limit remains about twenty years in linear view.

In very short slots, the centre of the summary is cropped until enough room is available. The figure stays proportional and its artwork does not take space from neighbouring dates. Folded exposure is not a duration scale: the independent five-pixel woven braids and endpoint knots retain the exact scientific date mapping. Names and dates stay above the pictures; dates take priority over clipped titles. Context remains 180 pixels high.

Eight cached canvas chunks supply fixed native-size backgrounds. A face can span chunks without changing its source. Nodes and textures remain through zoom/pan; off-screen sections are retained without rendering hidden layers. Cancellation and URL disposal protect resize and Context toggles. SVG material is the texture-allocation fallback; original atlases remain artwork fallback. CodeRabbit’s missing-panorama safeguard prevents an incomplete raster from hiding usable SVG sources.

## Validation and limits

48 native application tests and 25 operator/artifact tests pass. Fold tests verify native widths, summary exposure, occluded detail, stable source slices, continuous reversal, exact dated footprints and complete unfolding. T3 checks retain 155 faces in the desktop linear view, preserve all 21 date ranges, keep both transform scale components at 1, retain textures/crops through motion, preserve four-to-one footprints, exercise original-art fallback for all events, pan without moving local pictures, apply reduced motion immediately, revoke textures on Context removal, and avoid overflow at 390 pixels. The HTML plan embeds a fresh opening/reversal recording.

This is an occlusion-based box-pleat simulation with turned-edge lighting, not a general cloth-physics solver. The earlier rotated-face performance sample is superseded and is not claimed for the replacement. Face count can vary with viewport/time-scale composition, but source material and nodes remain fixed during zoom within a composition.

## Delivery

Required layer 11 remains PR64 on `ui-pass2/11-woven-periods`. PR63 has merged into `prototype/ui-pass2`. The active persisted watcher holds PR64 as implementing during this correction, then takes the new clean tested head through the existing manual CodeRabbit queue and shared 61-minute gate. Preserve the review clock; do not count the older review as approval of this replacement. Initial publication waits for this required layer and its dependencies, then publishes the dedicated prototype branch to its new here.now Site. Never merge main or update production. Safe optional waivers still require a documented actual remedial PR.
