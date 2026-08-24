# Cartoon redraw batch 1 audit

All portraits in this batch used the built-in image generator, one scientist per call. Image 1 was the scientist's YAML `photo`; Images 2–3 were the validated Faraday and Copernicus pilots used only as style references.

## Shared final prompt template

```text
Use case: style-transfer
Asset type: Paper Trails circular timeline portrait
Input images: Image 1 is the sole identity reference for <name>; Images 2 and 3 are approved Wry Engraver house-style references only.
Primary request: create a completely newly drawn, affectionate editorial caricature of <name>, instantly recognisable before the humour.
Recognition anchors: <three source-observed anchors>.
Comic idea: <one restrained, work-specific beat>.
Style/medium: The Wry Engraver—bold confident near-black blue-green ink contour, simplified graphic shapes, restrained flat colour, at most one shallow shadow tone, faint paper grain inside coloured areas; unmistakably hand-drawn, not a recoloured photograph.
Composition/framing: centred head-and-shoulders bust, slightly oversized head, strong clean silhouette, safe margins for 42 px and 92 px circular crops; bust meets bottom edge, all facial features within central 76%.
Color palette: charcoal-teal ink, muted period clothing, natural subject-specific skin undertones with no blanket yellow, orange, ochre, bronze, or sepia cast.
Constraints: genuinely transparent background with alpha, 1024×1024 square PNG; preserve identity and period details; no text, labels, watermark, signature, scenery or frame.
Avoid: photo-realism, painterly rendering, airbrushing, dense engraving hatching, generic science clip-art, floating apparatus, full body, elaborate background.
```

The generated files that contained a pale baked checkerboard or were not exactly 1024×1024 were normalised with `finish-cartoon-asset.ps1`; every candidate and every promoted live file was then checked with `validate-cartoon-asset.ps1`.

Batch review sheets are `batch-1-1.png` through `batch-1-6.png`. The final 92px colour and 42px grayscale circular-crop audit is `batch-1-small-crops.png`; all 29 portraits remained distinctive and legible.

## Portraits

### `regiomontanus`

- Anchors: rounded broad face with prominent wide-set eyes; close dark cap over straight cropped hair; compact mouth and heavy fur-trimmed scholar's robe.
- Comic beat: mildly astonished upward glance, as if a new object has appeared in the sky.
- Candidate: `tmp/cartoon-redraw/batch-1/regiomontanus-v2-validated.png`
- Live: `images/cartoons/regiomontanus.png`
- Validation: PASS (candidate and live destination).
- Retry/finishing: pale baked checkerboard and 1254px source normalised once; no generation retry.

### `galileo`

- Anchors: high receding forehead with swept-back dark hair; deep-set watchful eyes and strong hooked nose; pointed full white beard with broad white turned collar.
- Comic beat: wry sceptical side-eye, as if a telescopic observation has contradicted everyone else.
- Candidate: `tmp/cartoon-redraw/batch-1/galileo-v2-validated.png`
- Live: `images/cartoons/galileo.png`
- Validation: PASS (candidate and live destination).
- Retry/finishing: pale baked checkerboard and 1254px source normalised once; no generation retry.

### `fatio`

- Anchors: long narrow oval face and slender nose; abundant centre-parted corkscrew wig framing both sides; alert almond eyes and small reserved mouth above a layered cravat.
- Comic beat: one eyebrow and a few outer curls subtly pulled sideways, nodding to gravitational ideas.
- Candidate: `tmp/cartoon-redraw/batch-1/fatio-v2-validated.png`
- Live: `images/cartoons/fatio.png`
- Validation: PASS (candidate and live destination).
- Retry/finishing: pale baked checkerboard and 1254px source normalised once; no generation retry.

### `lesage`

- Anchors: near-profile pose with very long projecting hooked nose; powdered rolled side-wig with tied queue; heavy brow and stern downturned mouth over a high collar.
- Comic beat: slight forward lean and narrowed eye, as if buffeted by invisible corpuscles.
- Candidate: `tmp/cartoon-redraw/batch-1/lesage-v2-validated.png`
- Live: `images/cartoons/lesage.png`
- Validation: PASS (candidate and live destination).
- Retry/finishing: pale baked checkerboard and 1254px source normalised once; no generation retry.

### `dalton`

- Anchors: high balding forehead with wispy pale side hair; small round wire spectacles over deeply set eyes; long prominent nose and tightly compressed serious mouth.
- Comic beat: tiny lifted eyebrow suggesting one more atomic weight has fallen into place.
- Candidate: `tmp/cartoon-redraw/batch-1/dalton-v2-validated.png`
- Live: `images/cartoons/dalton.png`
- Validation: PASS (candidate and live destination).
- Retry/finishing: genuinely transparent 1254px source resized once; no generation retry.

### `ampere`

- Anchors: broad oval face with high forehead and full cheeks; dense halo of short tight curls; calm direct eyes with high white cravat and dark double-breasted coat.
- Comic beat: a few curls stand subtly alert as if magnetised.
- Candidate: `tmp/cartoon-redraw/batch-1/ampere-v2-validated.png`
- Live: `images/cartoons/ampere.png`
- Validation: PASS (candidate and live destination).
- Retry/finishing: pale baked checkerboard and 1254px source normalised once; no generation retry.

### `fresnel`

- Anchors: long narrow face with high smooth forehead; very large dark attentive eyes and long straight nose; swept dark wavy hair flaring at the sides above a small pursed mouth and tied cravat.
- Comic beat: one eyebrow bends in a gentle wave, nodding to wave optics.
- Candidate: `tmp/cartoon-redraw/batch-1/fresnel-v2-validated.png`
- Live: `images/cartoons/fresnel.png`
- Validation: PASS (candidate and live destination).
- Retry/finishing: pale baked checkerboard and 1254px source normalised once; no generation retry.

### `neumann_franz`

- Anchors: very high receding forehead and long oval face; exceptionally long projecting nose; swept side hair with pronounced mutton-chop whiskers and moustache above a dark bow tie.
- Comic beat: one side-whisker curls a touch more strongly, suggesting a magnetic pole.
- Candidate: `tmp/cartoon-redraw/batch-1/neumann_franz-v2-validated.png`
- Live: `images/cartoons/neumann.png`
- Validation: PASS (candidate and live destination).
- Retry/finishing: pale baked checkerboard and 1254px source normalised once; no generation retry.

### `maxwell`

- Anchors: high receding forehead with curly side hair; enormous dense curly beard and moustache; strong aquiline nose and thoughtful sideways gaze above a small bow tie.
- Comic beat: the beard's lower contour carries one subtle rhythmic electromagnetic wave.
- Candidate: `tmp/cartoon-redraw/batch-1/maxwell-v2-validated.png`
- Live: `images/cartoons/maxwell.png`
- Validation: PASS (candidate and live destination).
- Retry/finishing: pale baked checkerboard and 1254px source normalised once; no generation retry.

### `heaviside`

- Anchors: narrow rectangular face with strong knitted brows; short wavy hair swept back from a modest widow's peak; compact pointed moustache and angular full beard over high collar and tie.
- Comic beat: sharply raised eyebrow, as if an impossible equation has just been simplified.
- Candidate: `tmp/cartoon-redraw/batch-1/heaviside-v2-validated.png`
- Live: `images/cartoons/heaviside.png`
- Validation: PASS (candidate and live destination).
- Retry/finishing: pale baked checkerboard and 1254px source normalised once; no generation retry.

### `planck`

- Anchors: large smooth bald dome with short dark side hair; small round wire spectacles set low over stern deep-set eyes; enormous thick horizontal moustache, prominent ears and neat black bow tie.
- Comic beat: one moustache tip sits a tiny deliberate step above the other, a restrained quantisation joke.
- Candidate: `tmp/cartoon-redraw/batch-1/planck-v2-validated.png`
- Live: `images/cartoons/planck.png`
- Validation: PASS (candidate and live destination).
- Retry/finishing: pale baked checkerboard and 1254px source normalised once; no generation retry.

### `h_a_wilson`

- Anchors: broad high forehead with close receding grey hair; round wire spectacles over narrow serious eyes; long straight nose and downturned mouth, with plain suit and narrow tie.
- Comic beat: tiny glint in one lens suggesting a charged track has become visible.
- Candidate: `tmp/cartoon-redraw/batch-1/h_a_wilson-v2-validated.png`
- Live: `images/cartoons/wilson.png`
- Validation: PASS (candidate and live destination).
- Retry/finishing: pale baked checkerboard and 1254px source normalised once; no generation retry.

### `bohr`

- Anchors: high swept-back dark hair with strongly combed ridges; long youthful oval face with broad forehead; deep-set direct eyes, strong brows and slightly parted contemplative lips above a patterned tie.
- Comic beat: one questioning eyebrow rises as if preparing a courteous complementarity objection.
- Candidate: `tmp/cartoon-redraw/batch-1/bohr-v2-validated.png`
- Live: `images/cartoons/bohr.png`
- Validation: PASS (candidate and live destination).
- Retry/finishing: pale baked checkerboard and 1254px source normalised once; no generation retry.

### `compton`

- Anchors: square broad head with high hairline and slicked-back dark hair; intense close-set eyes beneath strong straight brows; compact dark moustache above firm mouth and broad jaw.
- Comic beat: the head carries the slightest backward recoil while the gaze remains deadpan.
- Candidate: `tmp/cartoon-redraw/batch-1/compton-v2-validated.png`
- Live: `images/cartoons/compton.png`
- Validation: PASS (candidate and live destination).
- Retry/finishing: first generation was rejected after a partly opaque top-right corner survived finishing; targeted wider-margin redraw generated, normalised and passed.

### `pauli`

- Anchors: very high rounded forehead with receding dark side hair; heavy-lidded slightly asymmetrical eyes; full rounded cheeks and small flat unsmiling mouth above a plain dark tie.
- Comic beat: a magnificently exclusionary side-eye.
- Candidate: `tmp/cartoon-redraw/batch-1/pauli-v2-validated.png`
- Live: `images/cartoons/pauli.png`
- Validation: PASS (candidate and live destination).
- Retry/finishing: pale baked checkerboard and 1254px source normalised once; no generation retry.

### `anderson`

- Anchors: large smooth bald dome with short dark side hair; thick dark horn-rim spectacles; broad oval face with long straight nose, softly pursed mouth and restrained half-smile above a striped tie.
- Comic beat: tiny curved highlight in one lens hints at a positron track.
- Candidate: `tmp/cartoon-redraw/batch-1/anderson-v2-validated.png`
- Live: `images/cartoons/anderson.png`
- Validation: PASS (candidate and live destination).
- Retry/finishing: pale baked checkerboard and 1254px source normalised once; no generation retry.

### `lamb`

- Anchors: high forehead with glossy dark hair swept into a precise side part; long narrow face and prominent straight nose; half-lidded thoughtful eyes and slightly parted lips above dark suit and dotted tie.
- Comic beat: one eyebrow sits a fractionally shifted level above the other, a quiet Lamb-shift joke.
- Candidate: `tmp/cartoon-redraw/batch-1/lamb-v2-validated.png`
- Live: `images/cartoons/lamb.png`
- Validation: PASS (candidate and live destination).
- Retry/finishing: pale baked checkerboard and 1254px source normalised once; no generation retry.

### `dicke`

- Anchors: thick dark wavy hair rising high at the crown; long angular face with prominent ears and strong long nose; alert deep-set eyes and narrow thoughtful mouth above a slim dark tie.
- Comic beat: one eyebrow is subtly cocked as if fine-tuning a sensitive receiver.
- Candidate: `tmp/cartoon-redraw/batch-1/dicke-v2-validated.png`
- Live: `images/cartoons/dicke.png`
- Validation: PASS (candidate and live destination).
- Retry/finishing: genuinely transparent 1254px source resized once; no generation retry.

### `bose`

- Anchors: broad rounded face with full cheeks and natural brown skin; smooth dark hair cleanly parted and swept to both sides; small round wire spectacles over steady eyes and full composed lips.
- Comic beat: quietly pleased expression as if an enormous crowd has obeyed the statistics.
- Candidate: `tmp/cartoon-redraw/batch-1/bose-v2-validated.png`
- Live: `images/cartoons/bose.png`
- Validation: PASS (candidate and live destination).
- Retry/finishing: pale baked checkerboard and 1254px source normalised once; no generation retry.

### `hertz`

- Anchors: tall receding forehead with dark hair slicked back from a sharp side part; long strong straight nose and focused sideways gaze; full neatly trimmed dark beard and moustache above high white collar.
- Comic beat: one small temple lock lifts as if it has received a radio wave.
- Candidate: `tmp/cartoon-redraw/batch-1/hertz-v2-validated.png`
- Live: `images/cartoons/hertz.png`
- Validation: PASS (candidate and live destination).
- Retry/finishing: pale baked checkerboard and 1254px source normalised once; no generation retry.

### `kelvin`

- Anchors: large bald dome with wispy white side hair; enormous long flowing white beard and moustache; narrow deeply set eyes beneath a firm brow, in a dark three-piece coat.
- Comic beat: one tiny beard tuft remains defiantly energetic despite approaching absolute zero.
- Candidate: `tmp/cartoon-redraw/batch-1/kelvin-v2-validated.png`
- Live: `images/cartoons/kelvin.png`
- Validation: PASS (candidate and live destination).
- Retry/finishing: pale baked checkerboard and 1254px source normalised once; no generation retry.

### `william_gilbert`

- Anchors: tall cylindrical black cap; narrow triangular face with arched brows, pointed nose and short pointed brown beard; enormous pleated white ruff above dark fur-trimmed cloak and rust doublet.
- Comic beat: pointed beard tilts a fraction like a compass needle.
- Candidate: `tmp/cartoon-redraw/batch-1/william_gilbert-v2-validated.png`
- Live: `images/cartoons/gilbert_william.png`
- Validation: PASS (candidate and live destination).
- Retry/finishing: pale baked checkerboard and 1254px source normalised once; no generation retry.

### `joseph_henry`

- Anchors: high broad forehead with thick pale hair swept strongly back; heavy-lidded direct eyes and long strong nose; broad square jaw with firm unsmiling mouth above a high folded cravat.
- Comic beat: one swept-back hair wisp stands subtly alert as if beside an energised electromagnet.
- Candidate: `tmp/cartoon-redraw/batch-1/joseph_henry-v2-validated.png`
- Live: `images/cartoons/henry_joseph.png`
- Validation: PASS (candidate and live destination).
- Retry/finishing: pale baked checkerboard and 1254px source normalised once; no generation retry.

### `hippolyte_fizeau`

- Anchors: strong near-profile pose with tall domed forehead; abundant curly hair mass at sides and back; long prominent nose with very full curly beard and moustache, ornate dark coat and small medal.
- Comic beat: keen forward lean suggests he is trying to catch a beam of light.
- Candidate: `tmp/cartoon-redraw/batch-1/hippolyte_fizeau-v2-validated.png`
- Live: `images/cartoons/fizeau_hippolyte.png`
- Validation: PASS (candidate and live destination).
- Retry/finishing: pale baked checkerboard and 1254px source normalised once; no generation retry.

### `michelson`

- Anchors: formal white naval officer cap with dark visor and central insignia; long narrow face with straight prominent nose; small precise moustache and intense eyes above high buttoned naval collar.
- Comic beat: one eyebrow raised by a hair's breadth as if the alignment is still not exact.
- Candidate: `tmp/cartoon-redraw/batch-1/michelson-v2-validated.png`
- Live: `images/cartoons/michelson.png`
- Validation: PASS (candidate and live destination).
- Retry/finishing: pale baked checkerboard and 1254px source normalised once; no generation retry.

### `joseph_larmor`

- Anchors: very high balding forehead with close dark side hair; small round pince-nez spectacles; enormous dense horizontal moustache on a long narrow face, above a high wing collar and dark bow tie.
- Comic beat: dry, preoccupied expression; humour comes from the magnificent oversized historical moustache.
- Candidate: `tmp/cartoon-redraw/batch-1/joseph_larmor-v2-validated.png`
- Live: `images/cartoons/larmor_joseph.png`
- Validation: PASS (candidate and live destination).
- Retry/finishing: first generation was rejected for an unwanted dashed annotation around the moustache; clean-bust redraw generated, normalised and passed.

### `pierre_laplace`

- Anchors: abundant pale hair swept back from a high forehead; long aristocratic oval face with straight narrow nose and calm sideways gaze; very high folded white cravat, dark embroidered uniform, blue sash and star medal.
- Comic beat: barely perceptible knowing half-smile, as if no extra hypothesis is required.
- Candidate: `tmp/cartoon-redraw/batch-1/pierre_laplace-v2-validated.png`
- Live: `images/cartoons/laplace_pierre.png`
- Validation: PASS (candidate and live destination).
- Retry/finishing: pale baked checkerboard and 1254px source normalised once; no generation retry.

### `etienne_malus`

- Anchors: thick tousled mass of dark curls; long youthful face with strong straight nose and pronounced sideburns; sideways glance with slight confident smirk, high black military collar with red piping and gold epaulettes.
- Comic beat: head tilted by a few degrees as if testing an angle of polarisation.
- Candidate: `tmp/cartoon-redraw/batch-1/etienne_malus-v2-validated.png`
- Live: `images/cartoons/malus_etienne.png`
- Validation: PASS (candidate and live destination).
- Retry/finishing: pale baked checkerboard and 1254px source normalised once; no generation retry.

### `penzias`

- Anchors: strong left-facing profile with balding dome and short dark fringe; thin rectangular spectacles and very prominent hooked nose; alert visible ear and pursed lips, with black jacket, blue checked shirt and patterned tie.
- Comic beat: visible ear is subtly attentive toward an imagined cosmic hiss, expressed only through eye and head angle.
- Candidate: `tmp/cartoon-redraw/batch-1/penzias-v2-validated.png`
- Live: `images/cartoons/penzias.png`
- Validation: PASS (candidate and live destination).
- Retry/finishing: first generation was rejected for an unwanted hand-to-ear gesture; clean-bust redraw generated, normalised and passed.
