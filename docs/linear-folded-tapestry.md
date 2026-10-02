# Continuous folded Bayeux narrative

The standing [Context drawing instructions](context-drawing-instructions.html)
govern all three modes. This record describes #76's implementation and validation.

The rejected renderer selected independent event motifs, resized them and placed
them on several baselines. Tapestry now joins twelve whole authored depictions
into a single left-to-right material. Snow shares the soldiers' setting, Napoleon
stands beside steam machinery, and the aurora disrupts the operators' telegraph
wires in the same picture. Modern trenches, tanks and rockets use the reference's
flat coloured wool treatment. Continuous animal-and-bird borders belong to the
same fixed cloth and fold with it.

The four generated PNG masters and full-size WebP derivatives are preserved.
Only band one from the opening correction is used; the original early atlas
supplies its unchanged remaining bands. Source storage rows never become runtime
display rows. There is no motif selection, scene substitution or zoom-dependent
redrawing of subjects. Exact prompts, references, source/runtime hashes and crop
geometry are checked by `tools/linear-story-artwork.mjs`.

Each whole source band is uniformly sized to the context's illustration height.
Those proportions and source regions remain fixed through zoom. An identifying
front occludes detail to its left and right; opening recovers the original source
positions and all retained detail at 32×. Exposed fragments are shared by the
renderer and hit testing, so concealed pixels cannot become pointer targets.
Canvas work is bounded by the visible viewport, source decoding is cached across
mode switches, and the same record buttons survive zoom and pan.

Picture width is symbolic rather than a historical duration scale. The scientific
timeline keeps its linear/density date mapping; an editorial camera follows the
viewport's central year along the cloth. Camera anchors locate the drawn Napoleon
and Carrington subjects when navigating to 1804 and 1859. They do not change the
records: Carrington remains a point, the Civil War keeps 1861–1865, and telegraphy
keeps its qualified interval. Latin inscriptions remain runtime text, while
selection opens English details, recorded dates and sources. Landscape's renderer,
English labels and dated braids, and Bars' dated geometry are preserved. All three
still use the complete Bars context area as their height reference.

Validation on 1 October 2026:

- 91 native JavaScript tests and 25 prototype operator tests pass.
- Geometry checks cover native dimensions, contiguous material, exposure with no
  holes/overlaps, complete maximum unfolding, deterministic reversal, both date
  mappings, all 25 records, source provenance and semantic camera anchors.
- Collaborative-browser checks cover full opening and reversal using the slider,
  panning at maximum zoom, both date scales, Carrington selection with its NASA
  evidence, three-mode cycling with identical context bounds, and 390px layout.
- A dedicated failure server returns 404 for all four optimized drawings. Each
  retries its own PNG successfully, and the live ribbon reports art ready.
- A local cached switch sample measured about 24–27ms for Tapestry, 17–24ms for
  Bars and 52–68ms for Landscape. These are local observations, not universal
  device benchmarks or download/decode timings.

See [the opening and reversal recording](ui-improvements/img/linear-tapestry-folds.mp4)
and [the composed Napoleon/steam view](ui-improvements/img/linear-tapestry-napoleon.png).
The native preview serves this worktree on port 8028. Artistic judgement remains
part of review; tests cannot certify fidelity or approve newly generated artwork.
