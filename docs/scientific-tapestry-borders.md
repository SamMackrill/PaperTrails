# Scientific Tapestry borders

The [standing Context drawing instructions](context-drawing-instructions.html#scientific-borders) govern this drawing pass. Scientific equipment and phenomena replace the repeating animal strip. Twelve source atlases contain 96 distinct authored ribbons across twelve chronological sections. Upper and lower borders differ; each source region occurs once on the material. Related instruments recur as distinct drawings and experimental arrangements.

The apparatus uses the selected Bayeux grammar: exposed linen, flat coloured wool, hand-worked contours, diagonal dividers and small botanical flourishes. The complete context area keeps its fitted Bars height through zoom, pan, Fit and mode switches. Every upper and lower edge now runs continuously: four different whole ribbons join end-to-end on each side of each narrative section. There are no horizontal spacers or centred ribbons separated by blank slots.

The border and narrative heights are fitted together from their native aspect ratios. For each edge, divide the narrative aspect ratio by the sum of its four ribbon aspect ratios; the largest ratio determines the common border allocation. The resulting narrative height is the total context height divided by one plus twice that ratio. This depends on authored geometry and responsive height, never zoom or pan. At the 1280×800 review viewport, the complete area remains 171px, with about 121.5px for the narrative and 24.7px allocated on each edge. Different ribbon heights align to the outer edge. No artwork is stretched, mirrored or repeated.

Borders use the exact exposed material fragments of the historical drawing. They conceal and reveal the same pixels as the cloth unfolds, remain fully open at 32×, and reverse deterministically. No tiled illustration, mirrored copy or zoom-specific substitute is used. Canonical scientific and historical dates are unchanged; position along the embroidered narrative remains editorial rather than a second duration axis.

## Source sheets for review

Each sheet stores eight ribbons. Every original sheet has a newly drawn continuation sheet for the same two periods. Original and continuation rows interleave, providing four unique drawings per edge. Storage rows never become rows in the displayed narrative.

| Sheet | Adjacent historical sections | Representative drawings |
| --- | --- | --- |
| [Early](../images/tapestry/scientific-borders-early.png) | 1400–1500; 1500–1600 | Astrolabe, quadrant, compass, lunar phases, planetary orbits, anatomical folio |
| [Seventeenth century](../images/tapestry/scientific-borders-seventeenth.png) | 1600–1650; 1650–1700 | Refractors, microscopes, pendulum, air pump, barometer, Saturn |
| [Eighteenth century](../images/tapestry/scientific-borders-eighteenth.png) | 1700–1740; 1740–1789 | Prism, friction generator, Leyden jar, electric bells, torsion balance |
| [Nineteenth century](../images/tapestry/scientific-borders-nineteenth.png) | 1789–1830; 1830–1870 | Pile, two-slit pattern, compass/wire, induction coil, telegraph and solar eruption |
| [Electron experiments](../images/tapestry/scientific-borders-electrons.png) | 1870–1914; 1914–1939 | Light bulb, cathode-ray tube, interferometer, cloud chamber, cyclotron |
| [Space and detection](../images/tapestry/scientific-borders-space.png) | 1939–1969; 1969 onward | Radio dishes, satellites, laser, bubble tracks, accelerator, detector, photon analysers |

The six additional masters are [early](../images/tapestry/scientific-borders-early-continuation.png), [seventeenth century](../images/tapestry/scientific-borders-seventeenth-continuation.png), [eighteenth century](../images/tapestry/scientific-borders-eighteenth-continuation.png), [nineteenth century](../images/tapestry/scientific-borders-nineteenth-continuation.png), [electron experiments](../images/tapestry/scientific-borders-electrons-continuation.png) and [space/detection](../images/tapestry/scientific-borders-space-continuation.png). These add distinct instruments, experimental arrangements and astronomical phenomena. The early continuation received a built-in image edit replacing an anachronistic horseshoe magnet with a natural lodestone. Its uncorrected input, exact correction prompt and reference hashes are retained. The edited master has a native width of 2169px; it was not resized to the previous 2170px.

The drawings are symbolic embroidery, not calibrated technical schematics or claims that each named scientist personally used every illustrated instrument. Some earlier publications provide the scientific background of later apparatus. The inventory distinguishes related canonical scientists/publications and context events from primary apparatus references. It records the depicted period, section, upper/lower placement, inspected subject description, source crop and pixel hash. The user positively reviewed the seventeenth-century, nineteenth-century and space source examples. The generation record captures that limited approval separately from approval of the composed cloth; automated checks do not substitute for visual review.

Primary equipment references include [Museo Galileo](https://www.museogalileo.it/en/galileo/instruments-en.html), [the Royal Institution induction ring](https://www.rigb.org/explore-science/explore/collection/michael-faradays-ring-coil-apparatus), [Smithsonian’s Maiman ruby crystal](https://www.si.edu/object/nmah_711120), [Glaser’s Nobel lecture](https://www.nobelprize.org/uploads/2017/05/glaser-lecture.pdf), [NASA’s Sputnik history](https://www.nasa.gov/history/65-years-ago-sputnik-ushers-in-the-space-age/) and [CERN’s Gargamelle](https://home.cern/science/experiments/gargamelle/).

## Provenance and validation

- [Exact prompt set](../images/tapestry/scientific-border-prompts.json), generated using the built-in `image_gen` tool with the user’s original Bayeux image and the agreed facsimile as style references.
- [Generation and motif inventory](../images/tapestry/scientific-border-generation.json), with masters, derivatives, prompt/reference hashes and measured geometry.
- `node tools/scientific-border-artwork.mjs check` verifies twelve sources, 96 distinct retained regions, twelve chronological assignments, known records and no future publication references.
- Native tests check uniform proportions and bounded placement at different context heights, source-region uniqueness, no repeated exposed pixel ranges, complete maximum unfolding and deterministic reversal.

PNG masters remain intact. Full-size WebP derivatives are generated by the established thumbnail helper and recover from their own PNG if loading fails. Exact pixel hashes detect copied regions; visual judgement must still detect near-identical compositions, incorrect apparatus and departures from the Bayeux style.

The continuous-border implementation passes all 100 native tests and both artwork provenance checks. Tests verify uninterrupted whole-edge coverage at context heights from 1px through 450px, native proportions, unique source usage, complete maximum unfolding and deterministic reversal. In the shared browser, overview, intermediate opening, maximum opening and reversal retained the 171px area and 121.5px narrative height at 1280×800. The actual composed Carrington section was shown for review. Earlier #79 validation verified PNG recovery for the original six WebP sheets, English Carrington selection and its evidence link; the continuation assets have their own matching full-size PNG recovery paths. Source-example approval does not automatically approve the additional drawings or every composition.
