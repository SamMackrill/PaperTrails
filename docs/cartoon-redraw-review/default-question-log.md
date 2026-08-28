# Default cartoon question mark

Date: 2026-08-24

`images/cartoons/default.png` is the shared neutral illustration for scientist entries without a trustworthy configured likeness. It replaces faceless human vignettes, which could look unsettling or imply historical authenticity.

Current references: Robert Hooke, George Green, Ewald Georg von Kleist, John Michell, and Steve K. Lamoreaux.

## Generation record

- Tool mode: built-in image generation
- Use case: `stylized-concept`
- Style reference: `images/cartoons/maxwell.png`
- Primary request: one large, friendly hand-inked question mark in The Wry Engraver style, immediately legible at timeline size.
- Required appearance: charcoal-teal contour; muted cream fill; small warm-brown accent; one shallow shadow; faint screen-print grain; no skin colour.
- Prohibited content: faces, eyes, bodies, hands, clothing, human silhouettes, extra punctuation, frames, discs, backgrounds, signatures, and watermarks.
- Finishing: normalised to 1024×1024 while preserving genuine alpha; no background pixels required removal.
- Validation: the symbol-specific validator path checks dimensions, alpha, transparent corners, transparency coverage, and opaque content while intentionally omitting the portrait-only central-clothing test.
- Current UI proof: [`all-93-small-crops.png`](all-93-small-crops.png), shown at 92 px colour and 42 px grayscale circular crops.
