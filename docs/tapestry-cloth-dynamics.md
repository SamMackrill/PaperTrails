# Investigation: Tapestry Presentation & Cloth Unfolding Dynamics

## Scope

This investigation examines how the default **Tapestry** context mode (`src/storyLayout.js`, `src/storyRenderer.js`, `src/linenBacking.js`, `style.css`) presents its continuous Bayeux narrative and unfolds across zoom levels (`1×`–`32×`), measured against the standing specification in [`docs/context-drawing-instructions.html`](context-drawing-instructions.html) (`T01`, `T02`, `F01`–`F06`).

## Findings from Live Multi-Zoom Capture

Inspecting the live Tapestry across six zoom octaves (`1×`, `2×`, `4×`, `8×`, `16×`, `32×`) revealed five mechanical artifacts that made unfolding read like sliding flat cutouts rather than woven linen cloth:

1. **Simultaneous "Venetian-blind" shredding at intermediate zooms (`2×`–`8×`):**
   `foldStory()` previously split each panel wing into 4–5 equal `240px` slices and opened every slice simultaneously at the same scalar `open`. At `4×` zoom, all slices peeked out by ~10–15px at once, producing vertical confetti strips between scenes.
2. **Linear scale progression against a logarithmic zoom axis:**
   `progress = (scale - 1) / 31` left the tapestry 97% shut at `2×` zoom, 90% shut at `4×`, and 77% shut at `8×`, then dumped more than half of the unfolding into the final octave (`16×`–`32×`).
3. **Directionless crease lines drawn even on flat continuous joins:**
   `storyRenderer.js` painted a fixed 3px dark brown stripe on the right edge of *every* fragment whenever `cell.open < 1`, even when the overlapping cloth was on the right or when zero concealed fabric remained between adjacent fragments.
4. **Stationary flax weave behind moving embroidery:**
   `paintLinen()` anchored the linen pattern globally to `-camera`, so embroidered wool figures slid across stationary background linen fibers instead of moving with their fabric substrate.
5. **CSS frame chrome obscuring embroidered borders:**
   `.tapestry-ribbon::before` / `::after` painted diagonal CSS stripes (`repeating-linear-gradient`) over the top and bottom of the hand-embroidered scientific borders, inside a rigid `3px double` border box.

## Changes Implemented (PR #5)

- **Logarithmic cloth tension (`src/clothDynamics.js` — `unfoldProgress`):** Maps `scale ∈ [1, 32]` logarithmically (`log(scale) / log(32)`), matching the logarithmic zoom slider so every zoom octave smoothly reveals 20% of the cloth.
- **Gap-free sequential pleat cascade (`allocatePleatCascade`):** Inner pleats nearest each panel's raised front crown unfold first, with a smooth 28% overlap handoff into the next tucked pleat. Mathematically guarantees `0 ≤ v_k ≤ w_k`, exact width conservation (`∑ v_k = available`), monotonicity, reversibility, and zero gaps.
- **Occlusion-aware cloth optics (`analyzeClothFolds` & `clothSelvageRelief`):**
  - Only shades edges where actual cloth is concealed (`hiddenCloth > 0.5px`), eliminating false vertical seams on flat joins.
  - Projects soft `multiply`-blended cast shadows onto the **recessed** under-cloth (left-overlapping, right-overlapping, or accordion valley pocket), paired with warm raking highlights on the turned upper linen lip and subtle top/bottom selvage drape contours that flatten cleanly to `0px` at full zoom.
- **Fragment-anchored flax weave (`paintFragmentLinen`):** Locks the shared woven linen pattern to `fragment.left - fragment.sourceX`, so flax fibers physically travel with each unfolding pleat and reunite seamlessly at full zoom.
- **Clean linen presentation (`style.css`):** Removes the CSS diagonal-stripe pseudo-elements over `.tapestry-story` so the embroidered scientific borders breathe cleanly inside a subtle hemmed edge.

## Artwork Assessment (Redraws vs. Provenance)

All four active Bayeux sheets (`bayeux-linear-{opening,early,middle,modern}-faded-wool-threads.webp`) are already transparent-background muted-wool embroidery with strict SHA-256 retained-generation provenance verified by `tools/linear-story-artwork.test.mjs` and `tools/retained-artwork-evidence.test.mjs`. Inspecting the fully unfolded `32×` strips confirmed that the apparent visual "cuts" at `4×`–`16×` were caused by simultaneous slice shredding and flat-seam crease lines rather than artwork corruption; fixing the cloth dynamics and fold optics makes the existing verified artwork flow cleanly without breaking master provenance.
