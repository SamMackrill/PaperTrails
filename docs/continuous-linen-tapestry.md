# Continuous linen and attached Tapestry borders

The embroidered narrative and scientific margins share one linen backing. The linen colour and weave no longer restart at source-atlas boundaries. Upper and lower border ribbons meet the narrative at their inner edges; any extra room required by the shared context height lies outside the embroidery on that same fabric.

All four narrative masters and twelve scientific border masters now contain transparent RGBA threadwork. The renderer draws the linen once, then the smaller Latin inscriptions, then the narrative threads and the scientific borders. Opaque wool naturally covers lettering; exposed fabric reveals it. Artwork keeps its native proportions and the existing chronological subjects, comet observations, camera anchors and fixed-art folds.

The total context height remains the fitted Bars height through zoom and reversal. At the 1280 × 800 review viewport the Tapestry is 171px tall at overview, intermediate opening and the full 32× view. The material unfolds without introducing a crease at an editorial storage join.

## Source assets and exact prompts

The built-in `image_gen` tool performed sixteen background-extraction edits with `transparent_background: true`. No CLI image API was used. The exact prompts, input files, generated filenames, actual native dimensions and output hashes are in [continuous-linen-prompts.json](../images/tapestry/continuous-linen-prompts.json).

The active masters are the `*-threads.png` files in [images/tapestry](../images/tapestry/); their full-size `*-threads.webp` siblings are the runtime assets, with PNG fallback. Original linen masters and generation history are retained. The format conversion uses the existing `save_webp` helper at quality 80, without resizing, cropping or retouching the selected generated pixels. Atlas dimensions record the actual generated dimensions, including small differences from the requested width.

[linear-story-generation.json](../images/tapestry/linear-story-generation.json) and [scientific-border-generation.json](../images/tapestry/scientific-border-generation.json) preserve the preceding generation records and validate both the extracted masters and their original inputs. All 96 scientific ribbon regions retain distinct pixel identities and chronological assignments.

## Validation

- 102 native tests pass, including geometry assertions that each upper border ends at the narrative top and each lower border starts at the narrative bottom.
- Both artwork provenance checks pass: four narrative sources/twelve sections/25 historical records, and twelve scientific sources/96 distinct ribbons.
- Actual local compositions were inspected at the three cross-atlas joins around 1500, 1700 and 1870, and at the 1758–59 comet scene.
- Overview → intermediate → full opening → intermediate → overview preserves the 171px context height and loaded artwork.

The standing requirements and the user's source comments are recorded in [context-drawing-instructions.html](context-drawing-instructions.html).
