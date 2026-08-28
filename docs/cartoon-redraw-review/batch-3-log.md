# Cartoon redraw batch 3 log

Generated with the built-in image-generation tool, one scientist per call. Identity came from the YAML `photo` asset except for the documented Lamoreaux correction below; Green and Kleist use explicitly faceless symbolic exceptions because research found no reliable likeness. Validated pilots were style references only. Every promoted candidate was visually reviewed on a three-way dark/light proof sheet, normalized with the deterministic finisher where required, validated in staging, copied over the existing YAML `cartoon` path, and validated again at the live destination.

> Superseded after the `main` rebase: the faceless Green and Kleist vignettes shown in this historical batch review are no longer live. Their standalone PNGs were deleted and both entries now use the shared [`images/cartoons/default.png`](../../images/cartoons/default.png) question mark documented in [`default-question-log.md`](default-question-log.md).

## Shared prompt template

```text
Use case: style-transfer
Asset type: Paper Trails circular timeline portrait
Input images: Image 1 is the sole identity reference for <scientist>; Images 2 and 3 are approved house-style references only.
Primary request: Newly draw the scientist from Image 1 as an affectionate editorial caricature in Paper Trails “The Wry Engraver” house style, recognisable before humorous; do not colourise or trace the source.
Recognition anchors: <three visible identity anchors>.
Comic idea: <one restrained science-specific beat>.
Style/medium: bold near-black blue-green contour, simplified graphic shapes, restrained flat colour, at most one shallow shadow, faint paper grain inside fills.
Composition/framing: centred head-and-shoulders bust, slightly oversized head, compressed shoulders, strong clean silhouette, readable at 42 px and 92 px circular crops, key features inside the central 76%.
Color palette: charcoal-teal ink, muted period clothing, natural subject-specific skin undertones, no vintage filter.
Constraints: one 1024×1024 PNG with genuine transparent alpha; preserve identity and period details; modest 10–15% caricature; no scenery, backdrop, text, watermark, or frame.
Avoid: photorealism, recoloured-photo realism, painterly or airbrushed rendering, dense hatching, yellow/orange/sepia skin, generic science clip-art, full body, opaque white background, depicted checkerboard.
```

Style references were selected from `docs/cartoon-style-test/faraday-v2-validated.png`, `copernicus-v2-validated.png`, and `raman-v2-validated.png` according to the subject. All successful generated files were 1254×1254, so the deterministic finisher normalized them to 1024×1024; some also required removal of an edge-connected pale checkerboard. Green's documented symbolic exception required targeted simplification retries. Noether and Sciama required targeted alpha-safety corrections after dark/light inspection exposed holes through pale clothing that the first structural pass had not caught. All retries are recorded below.

## Documented exception prompt rule

```text
Historical truth constraint: no reliable likeness survives. Do not invent, infer, reconstruct, or borrow facial features. Draw an intentionally faceless Wry Engraver identity vignette at the same bust scale as the portraits, using only documented work/role symbols. Keep one secondary motif, no scenery or opaque panel, and genuine alpha everywhere outside the bust silhouette.
```

This exception applies only to George Green and Ewald Georg von Kleist. It is not a claim about their appearance.

## Results

### `tycho_brahe`

- Anchors: high rounded forehead and receding close-cropped hair; broad reddish-brown forked moustache merging into a pointed beard; elaborate white pleated ruff and dark court dress.
- Comic beat: subtly over-proud raised eyebrow, as though he has measured the viewer's position.
- Candidate: `tmp/cartoon-redraw/batch-3/tycho_brahe-v2-validated.png`
- Live: `images/cartoons/brahe_tycho.png`
- Result: PASS in staging and live. Retry: none; deterministic finishing applied.

### `newton`

- Anchors: long narrow oval face with heavy-lidded intense eyes; abundant shoulder-length dark wavy hair; straight long nose and tightly reserved mouth.
- Comic beat: one curl lifts with faint gravitational mischief; no apple.
- Candidate: `tmp/cartoon-redraw/batch-3/newton-v2-validated.png`
- Live: `images/cartoons/newton.png`
- Result: PASS in staging and live. Retry: none; deterministic finishing applied.

### `euler`

- Anchors: broad fleshy face with prominent rounded nose; powdered white side curls and swept-back wig; one eye noticeably narrowed with a calm genial half-smile.
- Comic beat: the narrowed eye and tiny knowing smile suggest he can solve the problem without looking.
- Candidate: `tmp/cartoon-redraw/batch-3/euler-v2-validated.png`
- Live: `images/cartoons/euler.png`
- Result: PASS in staging and live. Retry: none; deterministic finishing applied.

### `volta`

- Anchors: long narrow face with high balding forehead; close grey curls around the temples; prominent straight nose, alert eyes, and richly embroidered high collar.
- Comic beat: faintly charged inquisitive eyebrow; no battery prop.
- Candidate: `tmp/cartoon-redraw/batch-3/volta-v2-validated.png`
- Live: `images/cartoons/volta.png`
- Result: PASS in staging and live. Retry: none; deterministic finishing applied.

### `biot`

- Anchors: large rounded balding head with wispy side hair; heavy-lidded eyes above a broad downturned mouth; full soft cheeks against a high dark collar.
- Comic beat: dry sideways look suggesting he noticed the magnetic field first.
- Candidate: `tmp/cartoon-redraw/batch-3/biot-v2-validated.png`
- Live: `images/cartoons/biot.png`
- Result: PASS in staging and live. Retry: none; deterministic finishing applied.

### `oersted`

- Anchors: right-facing three-quarter profile with long angular nose; high tousled swept-back hair with pronounced sideburns; very high layered white cravat and dark coat.
- Comic beat: one hair lock is subtly tugged sideways by an unseen current.
- Candidate: `tmp/cartoon-redraw/batch-3/oersted-v2-validated.png`
- Live: `images/cartoons/oersted.png`
- Result: PASS in staging and live. Retry: none; deterministic finishing applied.

### `savart`

- Anchors: long rectangular face and high forehead; swept wavy hair forming outward rolls above the ears; stern heavy brow, long straight nose, and firm closed mouth from the marble bust.
- Comic beat: slight listening tilt, apt for work on vibration and acoustics.
- Candidate: `tmp/cartoon-redraw/batch-3/savart-v2-validated.png`
- Live: `images/cartoons/savart.png` (filename spelling corrected after review).
- Result: PASS in staging and live. Retry: none; deterministic finishing applied.

### `tait`

- Anchors: large bald crown with stray side wisps; piercing deep-set eyes under sharply lowered brows; enormous untamed full beard and compact stern mouth.
- Comic beat: one beard tuft curls like a tiny vector arrow.
- Candidate: `tmp/cartoon-redraw/batch-3/tait-v2-validated.png`
- Live: `images/cartoons/tait.png`
- Result: PASS in staging and live. Retry: none; deterministic finishing applied.

### `mach`

- Anchors: long narrow head with centre-parted swept hair; small round wire spectacles; large flowing beard and moustache framing a reserved mouth.
- Comic beat: tiny backward lean, as if a pressure wave has just passed.
- Candidate: `tmp/cartoon-redraw/batch-3/mach-v2-validated.png`
- Live: `images/cartoons/mach.png`
- Result: PASS in staging and live. Retry: none; deterministic finishing applied.

### `thomson`

- Anchors: high domed bald forehead with fine side hair; small round wire spectacles low across the eyes; broad drooping moustache and neat bow tie.
- Comic beat: spectacle lenses have subtly unequal emphasis, like a tiny charged-particle deflection.
- Candidate: `tmp/cartoon-redraw/batch-3/thomson-v2-validated.png`
- Live: `images/cartoons/thomson.png`
- Result: PASS in staging and live. Retry: none; deterministic finishing applied.

### `rutherford`

- Anchors: broad rectangular face with strong jaw; neatly side-parted light hair; thick dark horizontal moustache and confident far-off gaze.
- Comic beat: quietly triumphant raised brow; no atom symbol.
- Candidate: `tmp/cartoon-redraw/batch-3/rutherford-v2-validated.png`
- Live: `images/cartoons/rutherford.png`
- Result: PASS in staging and live. Retry: none; deterministic finishing applied.

### `noether`

- Anchors: slender oval face with long straight nose; dark hair swept upward and tightly pinned back; large dark bow and strongly puffed striped sleeves.
- Comic beat: one sleeve puff is a touch more emphatic, balancing her composed expression.
- Candidate: `tmp/cartoon-redraw/batch-3/noether-v2-validated.png`
- Live: `images/cartoons/noether.png`
- Result: PASS in staging and live. The first structurally valid candidate was rejected during dark/light review because edge-connected finishing had opened substantial transparent holes through the pale striped blouse. A built-in targeted edit replaced the vulnerable pale fills with fully opaque dusty blue-grey stripes while preserving the face, pose, and silhouette. The corrected candidate passed the strengthened validator and the 92 px/42 px circular-crop review. Rejected candidate retained as `tmp/cartoon-redraw/batch-3/noether-v2-rejected-alpha-holes.png` for audit.

### `chadwick`

- Anchors: long narrow face and high forehead; smooth dark side-parted hair; small round spectacles, thin restrained moustache, and precise dotted tie.
- Comic beat: one lens catches a tiny neutral glint, nodding to the unseen neutron.
- Candidate: `tmp/cartoon-redraw/batch-3/chadwick-v2-validated.png`
- Live: `images/cartoons/chadwick.png`
- Result: PASS in staging and live. Retry: none; deterministic finishing applied.

### `velikovsky`

- Anchors: high swept-back white hair with bald crown; heavy rectangular dark spectacles; deeply lined long face with downturned mouth over a checked shirt and dark tie.
- Comic beat: slightly cosmic level of side-eye; no planet or comet prop.
- Candidate: `tmp/cartoon-redraw/batch-3/velikovsky-v2-validated.png`
- Live: `images/cartoons/velikovsky.png`
- Result: PASS in staging and live. Retry: none; deterministic finishing applied.

### `dirac`

- Anchors: lean angular face with high cheekbones; short dark wavy hair rising at the front; slim dark moustache and intensely reserved sideways gaze.
- Comic beat: almost perfectly straight tie and deadpan expression.
- Candidate: `tmp/cartoon-redraw/batch-3/dirac-v2-validated.png`
- Live: `images/cartoons/dirac.png`
- Result: PASS in staging and live. Retry: none; deterministic finishing applied.

### `casimir`

- Anchors: broad squared forehead under a dark swept wave; thick dark rectangular spectacles; compact mouth, rounded chin, and textured tweed jacket.
- Comic beat: tiny gap between lapels, a restrained nod to the Casimir gap.
- Candidate: `tmp/cartoon-redraw/batch-3/casimir-v2-validated.png`
- Live: `images/cartoons/casimir.png`
- Result: PASS in staging and live. Retry: none; deterministic finishing applied.

### `sciama`

- Anchors: long oval face with prominent ears; swept silver hair with dark central streaks; very heavy arched brows, long nose, and calm direct gaze.
- Comic beat: brows lifted slightly as if surveying the whole cosmos.
- Candidate: `tmp/cartoon-redraw/batch-3/sciama-v2-validated.png`
- Live: `images/cartoons/sciama.png`
- Result: PASS in staging and live. The first structurally valid candidate was rejected during dark/light review because the white shirt and tie contained alpha-0 pinholes. A built-in targeted edit made the shirt an opaque muted slate blue and the tie dark while preserving the likeness and silhouette. The corrected candidate passed the strengthened validator and the 92 px/42 px circular-crop review. Rejected candidate retained as `tmp/cartoon-redraw/batch-3/sciama-v2-rejected-alpha-holes.png` for audit.

### `nernst`

- Anchors: high balding forehead with neatly parted side hair; small round pince-nez spectacles with a fine cord; enormous dark handlebar moustache above a small pointed goatee.
- Comic beat: one moustache tip rises by a degree, like a thermometer settling.
- Candidate: `tmp/cartoon-redraw/batch-3/nernst-v2-validated.png`
- Live: `images/cartoons/nernst.png`
- Result: PASS in staging and live. Retry: none; deterministic finishing applied.

### `eddington`

- Anchors: long severe oval face and very high forehead; close dark side-parted hair with receding temples; narrow wire spectacles, straight mouth, and sober gaze.
- Comic beat: one eyebrow lifts toward an implied eclipse; no sun prop.
- Candidate: `tmp/cartoon-redraw/batch-3/eddington-v2-validated.png`
- Live: `images/cartoons/eddington.png`
- Result: PASS in staging and live. Retry: none; deterministic finishing applied.

### `poincare`

- Anchors: compact rounded head with close-cropped dark hair; small pince-nez spectacles; dense full beard tapering slightly and tiny dark bow tie.
- Comic beat: bow tie sits a fraction off-centre, a gentle chaos joke.
- Candidate: `tmp/cartoon-redraw/batch-3/poincare-v2-validated.png`
- Live: `images/cartoons/poincare.png`
- Result: PASS in staging and live. Retry: none; deterministic finishing applied.

### `kepler`

- Anchors: long angular face with high forehead; short swept dark hair; narrow arched moustache joining a long pointed goatee, framed by a broad white ruff.
- Comic beat: tiny elliptical tilt to the ruff.
- Candidate: `tmp/cartoon-redraw/batch-3/kepler-v2-validated.png`
- Live: `images/cartoons/kepler.png`
- Result: PASS in staging and live. Retry: none; deterministic finishing applied.

### `george_green` — pre-rebase historical result

- Evidence: Nature's 1947 review states that no contemporary portrait or character sketch had been found. A 2025 peer-reviewed case study demonstrates that the online photograph often attributed to Green is actually George Barnard Green of Wisconsin and states that no photograph of the mathematician exists.
- Sources: [Nature, “George Green, 1793–1841”](https://www.nature.com/articles/160561d0); [Sheffield Hallam research record for Peter Rowlett, “A photograph of George Green?”](https://shura.shu.ac.uk/35785/) (accepted manuscript offered there under CC BY); [University of Nottingham biography](https://www.nottingham.ac.uk/physics/about/history/george-green.aspx).
- Documentary anchors: no face; modest early-19th-century scholar seen wholly from behind; one windmill-sail motif integrated into the coat for Green's Mill and his miller background.
- Comic beat: the mill motif makes the self-taught miller-scholar identity readable without pretending to know his face.
- Pre-rebase candidate: `tmp/cartoon-redraw/batch-3/george_green-v2-validated.png`
- Current shared destination: `images/cartoons/default.png`; the former faceless live asset was deleted.
- Pre-rebase result: PASS in staging and at the former live destination. The first generation's opaque cream medallion was rejected; a first simplification still retained detached field-line scenery; the final targeted edit retained only the faceless bust and integrated mill motif. Deterministic finishing was applied after each generation. This historical candidate is no longer live.

### `joseph_fraunhofer`

- Anchors: young long oval face with smooth high forehead; dark wavy Regency hair with pronounced sideburns; large alert eyes, narrow straight nose, white stock and dark coat.
- Comic beat: faint prismatic glint in one eye; no rainbow or instrument.
- Candidate: `tmp/cartoon-redraw/batch-3/joseph_fraunhofer-v2-validated.png`
- Live: `images/cartoons/fraunhofer_joseph.png`
- Result: PASS in staging and live. Retry: none; deterministic finishing applied.

### `kleist` — pre-rebase historical result

- Evidence: the authoritative German national biography identifies Ewald Georg/Jürgen von Kleist but supplies no likeness. Wikimedia Commons' dedicated category contains only the 1905 Leyden-jar illustration and memorial-stone media; no reliable portrait was located. Searches explicitly excluded portraits of Ewald Christian von Kleist and other similarly named family members.
- Sources: [Deutsche Biographie](https://www.deutsche-biographie.de/gnd117523585.html#adbcontent); [Wikimedia Commons category](https://commons.wikimedia.org/wiki/Category:Ewald_Georg_von_Kleist); [1905 apparatus file page](https://commons.wikimedia.org/wiki/File:Von_Kleist_Leyden_jar_1905.png), attributed to Edwin J. Houston's *Electricity in Every-day Life* and marked public domain in the United States; [von Kleist family history transcription](https://www.v-kleist.com/FG/Muttrin/fg0220a.htm).
- Documentary anchors: no facial features; early-18th-century dark clerical coat and white preaching bands; one compact Kleist/Leyden jar and conductor.
- Comic beat: a single contained spark lifts the composition without turning it into a laboratory scene.
- Pre-rebase candidate: `tmp/cartoon-redraw/batch-3/kleist-v2-validated.png`
- Current shared destination: `images/cartoons/default.png`; the former faceless live asset `images/cartoons/kleist.png` was deleted.
- Pre-rebase result: PASS in staging and at the former live destination. Retry: none; deterministic finishing applied. This historical symbolic identity vignette is no longer live.

### `george_fitzgerald`

- Anchors: high broad forehead under wild swept-back light hair; piercing deep-set eyes; immense full pale beard and moustache merging into an unruly silhouette.
- Comic beat: beard compresses inward by the tiniest amount, a restrained contraction joke.
- Candidate: `tmp/cartoon-redraw/batch-3/george_fitzgerald-v2-validated.png`
- Live: `images/cartoons/fitzgerald_george.png`
- Result: PASS in staging and live. Retry: none; deterministic finishing applied.

### `karl_schwarzschild`

- Anchors: high bald crown with very close dark side hair; large round bright eyes and compact rounded face; enormous dark handlebar moustache spreading beyond the mouth.
- Comic beat: moustache curves inward slightly, a subtle gravitational joke.
- Candidate: `tmp/cartoon-redraw/batch-3/karl_schwarzschild-v2-validated.png`
- Live: `images/cartoons/schwarzschild_karl.png`
- Result: PASS in staging and live. Retry: none; deterministic finishing applied.

### `pieter_zeeman`

- Anchors: tall swept-back white hair with a clean side part; small round wire spectacles; compact white moustache, long narrow nose, wing collar and dark bow tie.
- Comic beat: the spectacle lenses have exquisitely tiny opposing emphasis, nodding to spectral splitting.
- Candidate: `tmp/cartoon-redraw/batch-3/pieter_zeeman-v2-validated.png`
- Live: `images/cartoons/zeeman_pieter.png`
- Result: PASS in staging and live. Retry: none; deterministic finishing applied.

### `lamoreaux`

- Identity source: `tmp/cartoon-redraw/batch-3/identity-sources/lamoreaux.jpg`, downloaded from the official Yale News appointment article's image URL.
- Source and provenance: [Yale News, “Steven Lamoreaux named Eugene Higgins Professor of Physics”](https://news.yale.edu/2024/11/03/steven-lamoreaux-named-eugene-higgins-professor-physics); [direct Yale-hosted photograph](https://news.yale.edu/sites/default/files/steve-lamoreaux-announce.jpg). The page identifies the subject as Steve Lamoreaux. Yale retains its site/photo rights; the local copy is a temporary identity reference and is not a shipped application asset.
- Anchors: large rounded bald head with a narrow pale hair fringe; rectangular dark-rimmed glasses around blue-grey eyes; full rounded cheeks, compact nose, and tight-lipped half-smile.
- Comic beat: the half-smile and barely tugged lapel suggest he has noticed a tiny force in apparently empty space.
- Candidate: `tmp/cartoon-redraw/batch-3/lamoreaux-v2-validated.png`
- Migration candidate: `images/cartoons/lamoreaux.png` (removed in the 2026-08-27 duplicate cleanup).
- Final live asset: shared neutral `images/cartoons/default.png`; the application does not ship the Yale identity photograph, so the generated likeness is not used without a trustworthy configured source.
- Historical candidate result: PASS in staging and at its former live path. Retry: none; deterministic finishing applied, followed by removal of a tiny non-subject top-left edge artifact before the validator passed.

## Review sheets

- `docs/cartoon-redraw-review/batch-3-1.png`
- `docs/cartoon-redraw-review/batch-3-2.png`
- `docs/cartoon-redraw-review/batch-3-3.png`
- `docs/cartoon-redraw-review/batch-3-4.png`
- `docs/cartoon-redraw-review/batch-3-5.png`
- `docs/cartoon-redraw-review/batch-3-6.png` — documented Green/Kleist faceless exceptions and Yale-sourced Lamoreaux identity.
- `docs/cartoon-redraw-review/batch-3-corrections.png` — Noether and Sciama source/before/corrected dark-and-light alpha proof.
- `docs/cartoon-redraw-review/batch-3-small-crops.png` — all 28 promoted portraits at 92 px colour and 42 px grayscale circular crops.
