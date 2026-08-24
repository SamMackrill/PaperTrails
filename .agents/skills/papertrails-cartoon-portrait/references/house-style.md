# Paper Trails cartoon house style

## The look: “The Wry Engraver”

Aim for an affectionate editorial caricature that feels as if a Victorian scientific engraving learned comic timing. The likeness comes from a few decisive shapes rather than photographic detail. The humour comes from expression, proportion, or one relevant prop—not from mockery.

The target sits between a museum field guide and a newspaper caricature:

- dark, confident ink contour;
- simplified face, hair, clothing, and period details;
- slightly oversized head and compressed shoulders;
- natural skin colour with one restrained shadow tone;
- muted blue-green, charcoal, brown, cream, and occasional rust accents;
- faint printed-paper grain within coloured areas, never photographic skin texture;
- transparent backdrop and a clean bust silhouette.

Good current directional references are `alfven.png`, `birkeland.png`, `bohr.png`, `maxwell.png`, `noether.png`, `rutherford.png`, `schrodinger.png`, and `wilson.png`. They are references for graphic language and crop, not exact templates. `einstein.png` is the useful reference for comic energy, but its large hands and pose should not become a default.

## Composition

- 1024×1024 transparent PNG.
- Head and shoulders only, occupying roughly 82–88% of canvas height.
- Hair or hat begins around 7–10% from the top; the bust meets the bottom edge.
- Eyes sit near 42% of canvas height. Keep the face centred unless an identity-defining profile demands otherwise.
- Keep eyes, nose, mouth, and distinctive facial hair inside the central 76%, safe for the app's circular `object-fit: cover` crop.
- Prefer a clear outer silhouette to interior detail. The portrait must read at 42×42 pixels in grayscale and at 92×92 pixels in colour.

## Drawing and colour

Use a near-black blue-green contour around `#183B3A`, with a visually consistent stroke weight. Use dark muted clothing around `#344A48`, warm brown accents around `#76533A`, and sparing cream highlights around `#E7DCC7`. These are anchors, not a mandate to force every subject into identical clothes or skin.

Derive skin hue and value from the identity reference. Keep saturation moderate and shadows neutral-to-warm. If a portrait reads yellow, ochre, orange, or sepia when isolated from the rest of the image, revise it. Do not use a global vintage filter.

Use flat fills plus at most one simple shadow shape. Retain a subtle screen-print or paper-grain texture only if it survives without looking like photographic noise. Avoid gradients, lens lighting, pores, individual hair rendering, photographic catchlights, and dense engraving hatching.

## Likeness and caricature

Before prompting, write down three recognition anchors visible in the source. Favour:

- cranial and face shape;
- hairline, hairstyle, beard, or moustache;
- brow, nose, mouth, glasses, or characteristic expression;
- historically documented clothing or headwear when it materially aids recognition.

Exaggerate one or two anchors by roughly 10–15%. Increase head-to-shoulder ratio slightly and allow a wry, curious, startled, stern, or delighted expression. Avoid generic handsome smoothing. Wrinkles, asymmetry, unusual hair, and memorable noses are useful likeness information, not defects to erase.

## Humour

Use humour as a second-read reward. Prefer one of:

- a knowing expression that suits the person's story;
- a tiny, accurate prop associated with a landmark experiment;
- a modest visual consequence of the work, such as slightly unruly hair for an electrical pioneer;
- a gentle proportion joke, such as an overlarge collar, wig, moustache, or bow tie already present in the historical portrait.

The gag must not require a caption and must not replace the portrait. Avoid generic atoms, equations, light bulbs, laboratory glassware, or lightning when they are not specific to the person. Never make ethnicity, gender, disability, illness, age, or body shape the joke.

## Acceptance test

Approve only when all six answers are yes:

1. Can someone familiar with the scientist identify them without a label?
2. Does it read as a deliberately drawn caricature rather than a recoloured photograph?
3. Does it remain legible and distinctive in a 42 px circular grayscale crop?
4. Are skin colour, period details, and any prop plausible and respectful?
5. Does it look at home beside the approved directional references on a contact sheet?
6. Does `scripts/validate-cartoon-asset.ps1` report `PASS`, proving 1024×1024 dimensions, an alpha channel, a meaningfully transparent canvas background, and opaque portrait content?

Preview checkerboards are untrusted. Some generators render a grey-and-white checker pattern into an opaque RGB file. Always inspect the saved PNG itself; never promote an asset on appearance alone.
