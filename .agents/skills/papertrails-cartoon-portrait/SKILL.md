---
name: papertrails-cartoon-portrait
description: Create, regenerate, or review Paper Trails scientist cartoon portraits so they remain recognisable, gently caricatured, humorous, and visually consistent at timeline size. Use for assets in images/cartoons; do not use for photographic portraits or institutional emblems.
---

# Paper Trails cartoon portraits

Use the scientist's `photo` in `data/scientists.yaml` as the identity reference and read [the house style](references/house-style.md) before generating or reviewing artwork.

## Workflow

1. Inspect the source portrait, current cartoon if one exists, and the scientist entry. Identify three recognition anchors: usually face shape, hair or facial hair, and one expression or accessory.
2. If the configured source is not a usable likeness, research an attributable portrait from a credible archive, university, museum, learned society, or well-provenanced public collection. Never substitute a similarly named person. If no trustworthy portrait or documented likeness is available, never invent or imply a face and never create a faceless human bust. Point the entry to the shared neutral `images/cartoons/default.png` Wry Engraver question mark and record why the default is used.
3. Choose one restrained comic idea connected to the scientist's work or public persona. It must remain secondary to the likeness and readable without text. Omit it when it would clutter the circular crop.
4. Generate or edit one scientist at a time. Treat the source portrait as an identity reference, not as pixels to colourise. Ask for a newly drawn editorial caricature in the house style. Every generation prompt must say: `Background: genuine alpha transparency; empty pixels outside the bust; never draw or depict a checkerboard, transparency grid, studio backdrop, halo, or background colour.` Do not rely on the shorter phrase “transparent background” by itself.
5. Save the raw generation to a staging filename and immediately run `pwsh -File .agents/skills/papertrails-cartoon-portrait/scripts/validate-cartoon-asset.ps1 -Path <raw.png>` before judging or promoting it. Never infer transparency from a checkerboard shown by an image tool, generated preview, or UI; only decoded PNG alpha is evidence. If the preview shows a checkerboard and the validator reports opaque corners, treat it as a baked background defect even when the image looks transparent in the preview.
6. If an otherwise usable raw generation has a baked pale neutral checkerboard or the wrong dimensions, run `pwsh -File .agents/skills/papertrails-cartoon-portrait/scripts/finish-cartoon-asset.ps1 -InputPath <raw.png> -OutputPath <candidate.png>`. This deterministic step removes only pale neutral background connected to the canvas edge, retains enclosed white portrait details, writes real alpha, and normalises the canvas to 1024×1024. Do not use it on scenic, coloured, or uncertain backgrounds. Run the validator on the finished candidate; if it still fails, reject and regenerate rather than finishing repeatedly.
7. After the candidate passes the file validator, inspect it at full size, 92 px, and 42 px in a circle. For review, always show a three-way comparison: source photo/portrait, current cartoon, and proposed redraw. Use `pwsh -File .agents/skills/papertrails-cartoon-portrait/scripts/build-review-sheet.ps1 -ScientistIds <id-a>,<id-b> -CandidateDirectory <directory> -OutputPath <review.png>` when the conventional asset names apply. The proposed column deliberately composites the cutout over dark and light colours so transparency defects are visible. Reject it if the identity, silhouette, expression, or cutout quality disappears at either UI size, or if visual inspection reveals halos, holes, clipped outlines, or lost pale details.
8. After both visual and file validation pass, preserve an existing entry's `cartoon` path unless it is the shared default. A new portrait must never reuse `images/cartoons/default.png`. When an existing entry points to that default and a trustworthy likeness is available, assign a unique scientist-specific path, update only that entry, and preserve every other reference to the shared default. For a new path containing both names, use `images/cartoons/<surname>_<givenname>.png`; keep surname particles together, and use a surname-only filename when unambiguous. Do not replace or retarget an existing portrait until the replacement has been inspected.
9. Confirm `data/scientists.yaml` points to the final file and that no accidental duplicate or unused variant was added; repeated references to the intentional shared `images/cartoons/default.png` are the only duplicate-path exception. At the end of a collection migration, run `pwsh -File .agents/skills/papertrails-cartoon-portrait/scripts/validate-cartoon-set.ps1`; the migration is incomplete unless it reports `SET PASS` for every scientist reference. Then create the final UI-size proof with `pwsh -File .agents/skills/papertrails-cartoon-portrait/scripts/build-cartoon-set-sheet.ps1` and inspect every 92 px colour and 42 px grayscale circular crop.

## Non-negotiable checks

- The person is recognisable from the source before the joke is understood.
- A scientist without a trustworthy likeness uses `images/cartoons/default.png`; do not invent a face or create a faceless human silhouette.
- The result is unmistakably drawn: bold contour, simplified shapes, flat restrained colour, and at most one shallow shadow tone.
- Caricature is affectionate and modest. Exaggerate distinctive features about 10–15%; never exaggerate race, sex, disability, or other protected traits for humour.
- Skin uses natural undertones appropriate to the subject. Never apply a blanket yellow, orange, sepia, or bronze cast.
- Use a centred head-and-shoulders bust with a strong silhouette and safe margins for a circular crop. No full-body pose, floating apparatus, caption, label, signature, or scenic background.
- Preserve period-appropriate hair, clothing, and eyewear. A small prop may break the bust silhouette only when it is historically and scientifically apt.
- Output is 1024×1024 PNG with genuine alpha transparency. The file validator must report `PASS`; a visual checkerboard never counts as evidence. Keep all important facial features inside the central 76% of the canvas.

## Prompt structure

Label each input image by role. State the scientist's identity anchors and the house-style invariants explicitly; do not rely on a style reference alone.

```text
Use case: style-transfer
Asset type: Paper Trails circular timeline portrait
Input images: Image 1: identity reference; Image 2: optional approved house-style reference
Primary request: redraw <scientist> as an affectionate editorial caricature, recognisable before humorous
Recognition anchors: <three observed traits from the identity reference>
Comic idea: <one subtle, work-specific visual beat, or none>
Style/medium: bold ink contour, simplified graphic shapes, restrained flat colour, slight paper-grain texture
Composition/framing: centred head-and-shoulders bust; strong silhouette; safe for 42 px and 92 px circular crops
Color palette: charcoal-teal ink, muted period clothing, natural subject-specific skin undertones
Background: genuine alpha transparency; empty pixels outside the bust; never draw or depict a checkerboard, transparency grid, studio backdrop, halo, or background colour
Constraints: 1024×1024 PNG with decoded alpha; preserve identity and period details; no text; no watermark
Avoid: visible checkerboard pixels; colourised-photo realism; painterly rendering; airbrushing; yellow or sepia skin cast; generic science clip-art; full body; elaborate background
```

When reviewing a batch, compare it as a contact sheet as well as portrait by portrait. A technically attractive image that visibly belongs to a different illustration family still fails.
