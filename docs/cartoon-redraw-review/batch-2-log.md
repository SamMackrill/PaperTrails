# Cartoon redraw production log — batch 2

All artwork in this batch was generated with the built-in image generation tool, one scientist per call. Image 1 was always the YAML `photo` identity reference; Images 2–3 were approved validated pilots from `docs/cartoon-style-test/`. Candidates were visually reviewed on the six three-way sheets `batch-2-1.png` through `batch-2-6.png`, finished when necessary, and promoted only after the candidate and live destination both passed `validate-cartoon-asset.ps1`.

> Superseded after the `main` rebase: the faceless Hooke vignette shown in this historical batch review is no longer live. Its standalone PNG was deleted and Hooke now uses the shared [`images/cartoons/default.png`](../../images/cartoons/default.png) question mark documented in [`default-question-log.md`](default-question-log.md).

## Shared final prompt template

```text
Use case: style-transfer
Asset type: Paper Trails circular timeline portrait
Input images: Image 1 is the identity reference for <name>; Images 2 and 3 are approved Wry Engraver house-style references only.
Primary request: Create a newly drawn affectionate editorial caricature of <name>, recognisable before humorous.
Recognition anchors: <three visible identity anchors>.
Comic idea: <one restrained second-read beat>.
Style/medium: The Wry Engraver — bold confident near-black blue-green ink contour, simplified graphic shapes, restrained flat colour, at most one shallow shadow, faint printed-paper grain only inside coloured areas.
Composition/framing: centred head-and-shoulders bust, slightly oversized head, compressed shoulders, strong clean silhouette, hair or hat 7–10% from top, bust meets bottom, important features in the central 76%, readable at 42 px and 92 px circular crops.
Color palette: <subject-specific clothing, hair and natural skin notes>; never yellow, orange, bronze, or sepia skin.
Constraints: genuine transparent alpha background; square 1024×1024; preserve identity and period details; modest 10–15% caricature; preserve pale hair, shirt and collar edges; no text, watermark, signature, scenery, captions, floating apparatus, or extra objects.
Avoid: recoloured-photo realism, painterly rendering, airbrushing, photographic skin texture, gradients, dense engraving hatching, generic science clip-art, full body, oversized hands.
```

## Per-scientist variables and results

| ID | Recognition anchors | Comic beat | Candidate → live path | Result / retry |
|---|---|---|---|---|
| `vesalius` | Long narrow face/high cheekbones; close dark hair; very long dense tapering beard and alert sidelong gaze | Clinically appraising raised eyebrow | `tmp/cartoon-redraw/batch-2/vesalius-v2-validated.png` → `images/cartoons/vesalius.png` | **PASS**; no retry |
| `huygens` | Huge shoulder-length ringlet wig; slim oval face/long straight nose; heavy-lidded eyes and tiny moustache | One curl arcs with pendulum-like rhythm | `tmp/cartoon-redraw/batch-2/huygens-v2-validated.png` → `images/cartoons/huygens.png` | **PASS**; no retry |
| `franklin` | Broad rounded full-cheeked face; bald dome with long grey side hair; amused eyes and pursed mouth | Two or three faintly static hair wisps | `tmp/cartoon-redraw/batch-2/franklin-v2-validated.png` → `images/cartoons/franklin.png` | **PASS**; no retry |
| `coulomb` | Tall bald forehead; powdered white side rolls; aquiline nose/sidelong gaze and military epaulettes | Epaulettes angle apart with restrained symmetry | `tmp/cartoon-redraw/batch-2/coulomb-v2-validated.png` → `images/cartoons/coulomb.png` | **PASS**; no retry |
| `young` | Compact oval face/rounded cheeks; short loose curls; bright rightward eyes and high wrapped cravat | Knowing half-smile, as if seeing two possibilities | `tmp/cartoon-redraw/batch-2/young-v2-validated.png` → `images/cartoons/young.png` | **PASS**; no retry |
| `gauss` | Broad square elderly face; white sideburns under black cap; direct penetrating eyes/high collar | Minute brow lift, arithmetic already checked | `tmp/cartoon-redraw/batch-2/gauss-v2-validated.png` → `images/cartoons/gauss.png` | **PASS**; no retry |
| `ohm` | Broad stern jaw; unruly short side-flaring waves; furrowed brow/intense stare | One slightly kinked resistant hair lock | `tmp/cartoon-redraw/batch-2/ohm-v2-validated.png` → `images/cartoons/ohm.png` | **PASS**; no retry |
| `weber` | Bald domed forehead with ear-level tufts; small round spectacles; round open face and neat bow tie | Spectacles have subtly springy symmetry | `tmp/cartoon-redraw/batch-2/weber-v2-validated.png` → `images/cartoons/weber.png` | **PASS**; no retry |
| `van_der_waals` | Tall bald crown; full white beard/moustache; small round glasses and thoughtful three-quarter gaze | Beard silhouette curves faintly inward | `tmp/cartoon-redraw/batch-2/van_der_waals-v2-validated.png` → `images/cartoons/vanderwaals.png` | **PASS**; no retry |
| `lorentz` | Long narrow forehead/receding combed hair; small round glasses; dense pointed beard and calm wide eyes | Tiny glint of curiosity | `tmp/cartoon-redraw/batch-2/lorentz-v2-validated.png` → `images/cartoons/lorentz.png` | **PASS**; no retry |
| `birkeland` | High balding forehead/dark sides; small round glasses; huge curled handlebar moustache | Moustache tips lift like restrained auroral arcs | `tmp/cartoon-redraw/batch-2/birkeland-v2-validated.png` → `images/cartoons/birkeland.png` | **PASS**; no retry |
| `einstein` | Broad high forehead; unruly swept-back pale hair; thick moustache/heavy-lidded eyes and long nose | Hair is modestly more electrically unruly | `tmp/cartoon-redraw/batch-2/einstein-v2-validated.png` → `images/cartoons/einstein.png` | **PASS**; no retry |
| `schrodinger` | Long narrow face/tall forehead; round dark spectacles; slicked-back waves and asymmetric half-smile | One fractionally uncertain eyebrow | `tmp/cartoon-redraw/batch-2/schrodinger-v2-validated.png` → `images/cartoons/schrodinger.png` | **PASS**; no retry |
| `deBroglie` | Tall smooth forehead/receding side puffs; long narrow nose/face; small moustache and reserved sidelong gaze | Hair silhouette forms one restrained wave | `tmp/cartoon-redraw/batch-2/deBroglie-v2-validated.png` → `images/cartoons/debroglie.png` | **PASS**; no retry |
| `heisenberg` | Long angular face; high brushed-back hair/tall forehead; close-set serious eyes and long nose | Ambiguous half-smile | `tmp/cartoon-redraw/batch-2/heisenberg-v2-validated.png` → `images/cartoons/heisenberg.png` | **PASS**; no retry |
| `alfven` | Long high forehead/receding side part; long straight nose/narrow face; warm tight smile and crow's-feet | One flowing plasma-like hair strand | `tmp/cartoon-redraw/batch-2/alfven-v2-validated.png` → `images/cartoons/alfven.png` | **PASS**; no retry |
| `hoyle` | Broad compact face/strong jaw; short high side-parted hair; large round glasses and sceptical sideways gaze | One eyebrow disagrees with the universe | `tmp/cartoon-redraw/batch-2/hoyle-v2-validated.png` → `images/cartoons/hoyle.png` | **PASS**; no retry |
| `arp` | Long mature face; swept-back white waves; white moustache/pronounced brows and sceptical gaze | Contrarian upward brow | `tmp/cartoon-redraw/batch-2-corrections/arp-v2-validated.png` → `images/cartoons/arp.png` | **PASS** after correction; rejected first redraw's blanket orange/bronze cast, regenerated with natural fair pink-neutral skin and restrained rose-beige shadow |
| `hooke` | Explicitly faceless turned-away silhouette; shoulder-length 1660s curls and cream lace cravat; one integrated *Micrographia* cork-cell lapel motif | One ringlet has spring-like bounce | `tmp/cartoon-redraw/batch-2-corrections/hooke-v2-validated.png` → `images/cartoons/hooke.png` | **PASS** after correction; **symbolic identity vignette, not a portrait** — rejected the invented face after verifying that no known portrait survives |
| `descartes` | Long angular pointed face; shoulder-length dark waves/uneven fringe; thin moustache/goatee and broad collar | Dry doubting eyebrow | `tmp/cartoon-redraw/batch-2/descartes-v2-validated.png` → `images/cartoons/descartes.png` | **PASS**; no retry |
| `feynman` | Broad rectangular face/strong jaw; swept-up side-parted dark hair; narrow smiling eyes and lopsided grin | Mischievous grin, about to ask the awkward question | `tmp/cartoon-redraw/batch-2/feynman-v2-validated.png` → `images/cartoons/feynman.png` | **PASS**; no retry |
| `henry_cavendish` | Thin pointed profile/prominent nose; large black tricorn; pale tied queue, high cravat and old coat | Slightly oversized private tricorn silhouette | `tmp/cartoon-redraw/batch-2-corrections/henry_cavendish-v2-validated.png` → `images/cartoons/cavendish_henry.png` | **PASS** after correction; regenerated with 14.7% clear top margin, 26.2% left margin, and 18.6% right margin so the complete tricorn remains safe in the circular crop |
| `gustav_kirchhoff` | Long serious face/tall forehead; centre-parted ear curls; huge dark beard and deep-set eyes | Beard ends in one extremely subtle crisp notch | `tmp/cartoon-redraw/batch-2/gustav_kirchhoff-v2-validated.png` → `images/cartoons/kirchhoff_gustav.png` | **PASS**; no retry |
| `roemer` | Long narrow solemn face; enormous symmetrical ringlet wig; elaborate cravat and ornate coat | One outer curl trails its partner fractionally | `tmp/cartoon-redraw/batch-2/roemer-v2-validated.png` → `images/cartoons/roemer.png` | **PASS**; no retry |
| `morley` | Long oval high-forehead face; receding side part/swept-back hair; small spectacles and huge horizontal moustache | Moustache remains impeccably level | `tmp/cartoon-redraw/batch-2/morley-v2-validated.png` → `images/cartoons/morley.png` | **PASS**; no retry |
| `hermann_minkowski` | Broad square face/sturdy jaw; short dense upward curls; oval glasses, enormous upturned moustache and stern gaze | Moustache corners suggest two gently bent axes | `tmp/cartoon-redraw/batch-2/hermann_minkowski-v2-validated.png` → `images/cartoons/minkowski_hermann.png` | **PASS**; no retry |
| `john_poynting` | Broad bald dome; pale naturally drooping handlebar moustache; deep-set stern eyes/compact nose and square jaw | Moustache points outward gently | `tmp/cartoon-redraw/batch-2/john_poynting-v2-validated.png` → `images/cartoons/poynting_john.png` | **PASS**; artistic retry: rejected an overlarge spiky moustache and regenerated at ≤10% exaggeration |
| `carl_brans` | Long slim elderly face/decisive cheek creases; short simplified light-brown-grey hair; thin rectangular glasses and warm closed-mouth smile | One lifted cheek carries the friendly expression | `tmp/cartoon-redraw/batch-2-corrections/carl_brans-v2-validated.png` → `images/cartoons/brans_carl.png` | **PASS** after correction; rejected traced/photographic modelling and individual teeth, regenerated with large flat shapes, bold contour, and one shallow shadow tone |
| `wilson_robert` | Tall smooth bald dome; thin rectangular glasses over alert eyes; large close-set ears and intent surprised expression | Alert look hints at an unexpected signal | `tmp/cartoon-redraw/batch-2/wilson_robert-v2-validated.png` → `images/cartoons/wilson_robert.png` | **PASS**; no retry |

## Independent-audit correction pass

The four corrected candidates were reviewed together at full size on `docs/cartoon-redraw-review/batch-2-corrections.png` and at the actual UI sizes on `docs/cartoon-redraw-review/batch-2-small-crops.png` (92 px colour and 42 px grayscale). Each candidate and each promoted live file passed the strengthened validator.

### Robert Hooke evidence and symbolic status

The Royal Society states that there are no known portraits of Robert Hooke and examines why the commonly repeated lost-portrait story is unsupported: [Hooke, Newton, and the 'missing' portrait](https://www.royalsociety.org/blog/2010/12/hooke-newton-and-the-missing-portrait/). The configured `images/hooke.jpg` was therefore rejected as an identity reference rather than propagated as an authentic likeness.

The single symbolic motif is based on the Royal Society's catalogue entry for Hooke's 1665 *Micrographia* plate showing cells in a sliver of cork: [Microscopic view of cells in a sliver of cork](https://prints.royalsociety.org/products/microscopic-view-of-cells-in-a-sliver-of-cork-rs-8428). The live asset is deliberately faceless and must be described as a symbolic identity vignette, not a portrait.

## Final gate

- YAML cartoon paths were preserved; `data/scientists.yaml` was not changed.
- All 29 staged candidates passed at 1024×1024 with an alpha channel, transparent canvas background, and opaque portrait content.
- All 29 live destination files passed the same validator after promotion.
- No scientist outside this batch was intentionally modified by this production lane.
