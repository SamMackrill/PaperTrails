# Rebase integration redraws

Date: 2026-08-24

Rebasing the cartoon-standardisation branch onto `main` introduced two additional live scientist cartoons. Their existing assets were valid transparent PNGs but used dense sepia engraving and therefore did not match The Wry Engraver collection. Both were regenerated individually with the built-in image-generation tool, deterministically finished to genuine alpha, visually reviewed against their source portraits and old cartoons, and promoted only after validation.

The three-way source/before/after proof is [`rebase-main-wheeler-breit.png`](rebase-main-wheeler-breit.png).

## John Archibald Wheeler

- Identity reference: `images/wheeler.jpg`
- Previous cartoon: `images/cartoons/wheeler.png` at the pre-rebase commit
- Final live asset: `images/cartoons/wheeler.png`
- Recognition anchors: broad high forehead, strongly receding dark wavy hair with an unruly curl, deep-set alert eyes, broad face, and restrained closed-mouth smile.
- Comic beat: the single hair curl subtly echoes a gravitational swirl without adding a separate prop.
- Prompt mode: built-in image generation, `style-transfer`; the source photograph was the identity reference and `images/cartoons/wilson_robert.png` was the approved style reference.
- Result: individual validator `PASS` after deterministic edge-connected background removal and 1024×1024 normalisation.

## Gregory Breit

- Identity reference: `images/breit.jpg`
- Previous cartoon: `images/cartoons/breit.png` at the pre-rebase commit
- Final live asset: `images/cartoons/breit.png`
- Recognition anchors: long narrow face, high forehead with neat side part, small round wire-rim glasses, close-set eyes, long straight nose, and reserved almost-smile.
- Comic beat: the alert spectacle treatment supplies the humour without a generic science prop.
- Prompt mode: built-in image generation, `style-transfer`; the source photograph was the identity reference and `images/cartoons/brans_carl.png` was the approved style reference.
- Result: individual validator `PASS` after deterministic edge-connected background removal and 1024×1024 normalisation.
