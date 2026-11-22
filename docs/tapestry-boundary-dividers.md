# Tapestry boundary dividers, camera opening, and border alignment

This layer smooths inter-panel cuts along the linear Bayeux Tapestry, removes the opening full-zoom camera stall (`1400–1460`), and aligns outer framing rails across scientific border continuations without altering any of the four reviewed narrative masters or twelve scientific border sheets.

## Approach and relationship to narrative masters

Earlier seam passes edited the four narrative masters directly (see [tapestry-scene-transitions.md](tapestry-scene-transitions.md)). Remaining hard panel cuts occur where adjacent storage rows meet end to end on the unfolded cloth. Rather than re-running full-sheet redraws that risk altering reviewed figures, comets, or hotspots, `src/tapestryBoundaries.js` renders:

1. **Directional linen edge feathering (`drawFeatheredPanelSlice`)** strictly within narrow boundary strips (with optional lower-zone `leftFeatherTopFrac` / `rightFeatherTopFrac` splits snapped to device pixels so upper tree canopies remain sharp and subpixel hairlines cannot appear).
2. **Non-narrative Bayeux seam dividers (`drawBoundaryDivider`)** anchored in fixed cloth material coordinates (`sourceX`), clipped to each exposed cloth fragment so every divider glides and unfolds out of pleats alongside the embroidered fabric. Narrative bands remain single authored scenes; no historical events or extra baselines are composited.
3. **Unknown seams default to a no-op** (`motif: null`, zero feathering), so future panel additions never inherit an unintended motif.

## Divider atlas and provenance

All eight transparent RGBA wool-thread motifs live in [bayeux-boundary-dividers-threads.png](../images/tapestry/bayeux-boundary-dividers-threads.png) (`928×556`) with its WebP delivery derivative [bayeux-boundary-dividers-threads.webp](../images/tapestry/bayeux-boundary-dividers-threads.webp) and automatic PNG fallback.

| Motif | Seam(s) | Origin | Purpose |
| --- | --- | --- | --- |
| `palm-shore` | `1500` (`opening-0->early-1`) | Built-in `image-generator` | Faded-wool tropical palm & fern shoreline taper into open linen |
| `winter-tree` | `1600` (`early-1->early-2`), `1830` (`middle-2->middle-3`) | Built-in `image-generator` | Snow-dusted intertwined Bayeux winter tree |
| `join4-bridge` | `1650` (`early-2->early-3`) | Pixel-derived from `early` master | Completes clipped bare winter twigs and S-curves the exact snow & braided ground cord across the row-height step |
| `snow-slope-single` | `1700` (`early-3->middle-0`) | Built-in `image-generator` | Embroidered downward-sloping snowbank meeting the marching field |
| `join5-bridge` | `1740` (`middle-0->middle-1`) | Pixel-derived from `middle` master | Rounds off the clipped lower-right tree bough and slopes both snowdrifts along the bridge angle into the soldiers' flat snow |
| `harbour-quay` | `1870` (`middle-3->modern-0`) | Built-in `image-generator` | Weathered stone harbour quay, pilings, rope-coiled bollard, slate-matched surf, and sandy grassy bank clearing ship rigging and wheat sheaf |
| `trench-post` | `1914` (`modern-0->modern-1`) | Built-in `image-generator` | Weathered timber trench post and knee-high stacked burlap sandbag parapet concealing the cropped trailing leg and vertical mud wall |
| `ruined-pier` | `1939` (`modern-1->modern-2`) | Built-in `image-generator` | Broken terracotta-and-stone Bayeux archway pier with ivy & rubble |

Divider-less joins (`1789` French Revolution and `1969` Apollo lunar horizon) keep the ground rails intact (`leftFeather: 0`) so no bare-linen seam gap appears.

- Provenance inventory: [boundary-dividers-generation.json](../images/tapestry/boundary-dividers-generation.json)
- Validator: `node tools/boundary-dividers-artwork.mjs check` verifies RGBA alpha, dimensions, PNG/WebP SHA-256 hashes, geometry hash, per-motif RGBA pixel hashes, prompt hashes, and pixel-derived parent master hashes.

## Native-proportion border rail alignment

Continuation border bands store inter-row padding or adjacent-row rail bleed inside their nominal row slices. `measureBorderRailTrim` measures each band's red framing rails once from the loaded image (cached per image — no hardcoded magic trim table), and `nativeAlignedBorderRect` / `drawAlignedBorderSlice` trims only that padding while drawing at exact native 1:1 proportions (`destH = srcH * border.unit`) aligned flush to the outer edge, preserving the contract in [scientific-tapestry-borders.md](scientific-tapestry-borders.md).

## Opening camera motion (`1400–1460`)

At maximum zoom (`32×`), `opening-0` (`1400–1500`) is narrower than half a desktop viewport, so clamping `storyYearX(year) - viewport / 2` to `0` previously stalled the camera until ~`1480`. `storyCamera` now applies a C¹-smooth, strictly monotonic edge-to-center ramp (`d(camera)/dx >= 0.4`) anchored to `{ startYear, endYear }`, moving immediately from `1400` while preserving exact center-locking across mid-timeline anchors.

## Verification

- `node tools/boundary-dividers-artwork.mjs check`
- `node --test tools/*.test.mjs`
- `python -m unittest discover -s tools/prototype -p 'test_*.py'`
- `node tools/prototype/browser-audit.mjs`
