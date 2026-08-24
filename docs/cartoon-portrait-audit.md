# Cartoon portrait audit

Audit date: 2026-08-24

## Outcome

The collection should converge on **The Wry Engraver**: a bold, flat-colour editorial caricature with natural skin tones, a strong bust silhouette, modest exaggeration, and one optional science-specific visual joke. The controlling instructions live in `.agents/skills/papertrails-cartoon-portrait/`.

This direction is deliberately graphic. Paper Trails displays scientist nodes at 42×42 px and detail portraits at 92×92 px, both through circular `object-fit: cover` crops. The timeline also shows portraits in grayscale until interaction. Fine photographic texture therefore adds inconsistency without improving scanability; silhouette and decisive facial shapes do improve it.

## Migration result

The full live collection was regenerated on 2026-08-24. After rebasing onto `main`, all 92 scientist records in `data/scientists.yaml` have cartoon references: 87 unique non-default paths and five intentional references to the shared default, with no missing files. All now use The Wry Engraver style and pass the collection gate: present files, unique non-default paths, 1024×1024 PNG format, genuine alpha transparency, safe transparent corners, and sufficient opaque content.

Every reference was also inspected in the actual 92 px colour and 42 px grayscale circular crops. The combined proof is [`cartoon-redraw-review/all-92-small-crops.png`](cartoon-redraw-review/all-92-small-crops.png); prompt records and three-way source/before/after reviews are retained in the batch logs and review sheets in the same directory. Wheeler and Breit, introduced by the new `main` base, are documented in [`cartoon-redraw-review/rebase-main-log.md`](cartoon-redraw-review/rebase-main-log.md).

Scientists without a trustworthy configured likeness use the shared neutral Wry Engraver question mark at `images/cartoons/default.png`. This avoids both invented faces and unsettling faceless human silhouettes. The current shared-default entries are Robert Hooke, George Green, Ewald Georg von Kleist, John Michell, and Steve K. Lamoreaux.

## Baseline inventory findings

- 93 PNG files are present in `images/cartoons/`.
- 89 were referenced by `data/scientists.yaml` at the baseline audit; the rebased collection now contains 92 references, including five references to the shared default.
- 77 are 1024×1024; 13 are 1254×1254; one is 256×256; one is 1024×1073; one is 1024×1536.
- All 93 files contain an alpha channel.
- Five files are unused: `michelson_albert.png`, `morley_edward.png`, `einstein_small.png`, `wheeler-pointing.png`, and `lamoreaux.png`.

## Visual classification of every asset

### Graphic family — retain the drawing approach, then normalise palette and likeness (42)

`alfven`, `anderson`, `arp`, `biot`, `birkeland`, `bohr`, `chadwick`, `compton`, `dalton`, `dicke`, `dirac`, `einstein`, `euler`, `fresnel`, `heaviside`, `hooke`, `hoyle`, `lamb`, `lesage`, `mach`, `maxwell`, `neumann`, `newton`, `noether`, `oersted`, `ohm`, `pauli`, `planck`, `poincare`, `regiomontanus`, `rutherford`, `savart`, `schrodinger`, `sciama`, `tait`, `thomson`, `vanderwaals`, `velikovsky`, `volta`, `weber`, `wilson`, `young`.

These already use simplified line and shape. Their main shared defect is colour: several use a mustard or ochre skin fill, and a few have generic faces. Normalise them after the more obvious photo-like outliers. Preserve the comic energy of `einstein`, but do not make its hands-and-pose composition the default.

### Rendered or colourised-photo family — redraw first (46)

`ampere`, `bose`, `carl_brans`, `casimir`, `copernicus`, `coulomb`, `debroglie`, `descartes`, `eddington`, `etienne_malus`, `faraday`, `fatio`, `feynman`, `franklin`, `galileo`, `gauss`, `george_fitzgerald`, `george_green`, `gustav_kirchhoff`, `heisenberg`, `henry_cavendish`, `hermann_minkowski`, `hertz`, `hippolyte_fizeau`, `huygens`, `john_poynting`, `joseph_fraunhofer`, `joseph_henry`, `joseph_larmor`, `karl_schwarzschild`, `kelvin`, `kepler`, `lamoreaux`, `lorentz`, `michelson`, `morley`, `nernst`, `penzias`, `pierre_laplace`, `pieter_zeeman`, `raman`, `roemer`, `tycho_brahe`, `vesalius`, `william_gilbert`, `wilson_robert`.

These retain photographic or engraved modelling, fine hair and fabric texture, realistic lighting, or sepia colourisation. They are often recognisable individually but form a visibly different family on a contact sheet. Redraw them as true illustrations rather than filtering or posterising the current PNGs.

### Live composition outlier — replace (1)

`kleist` depicts apparatus rather than Ewald Georg von Kleist. It prevents person-first scanning and should be replaced with a recognisable bust; a very small Leyden-jar detail may be used as the secondary joke.

### Unused files — review, then remove separately (4)

`michelson_albert` and `morley_edward` are rendered duplicates of the live `michelson` and `morley` assets. `einstein_small` is a 256 px duplicate. `wheeler-pointing` is a stylistic and compositional outlier and is not referenced. They are not deleted by this audit so asset removal remains a deliberate, reviewable change.

## Migration order used

1. Establish and approve the cross-period pilot set.
2. Lock the prompt, house-style constraints, deterministic alpha finishing, and individual validator.
3. Regenerate the remaining live collection in three mixed-era parallel batches.
4. Review all three-way comparisons and UI-size crops; reject and redraw identity, palette, crop, or transparency failures.
5. Run the full collection gate and save the combined UI-size proof; after rebasing and adding the shared default, this covers all 92 scientist references.

The four pre-existing unused files remain intentionally untouched; removing them is a separate cleanup decision.

Regenerate in small, mixed-era batches rather than chronologically. A batch containing different genders, ethnicities, clothing periods, facial hair, and source quality is a better test of whether the style is genuinely controlling rather than accidentally tuned to one kind of portrait.
