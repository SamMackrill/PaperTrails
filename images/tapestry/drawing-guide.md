# Maintaining the two illustration styles

Consult the standing [Context drawing instructions](../../docs/context-drawing-instructions.html)
before drawing or composing context artwork. They specify Bars, Landscape and
Tapestry equally and take precedence over superseded layout assumptions below,
including the rejected use of separate vignette rows for concurrent Tapestry events.

The context control cycles **Bars → Landscape → Tapestry → Bars**. Landscape
keeps the current illustrations. Tapestry targets approved study 8, closest to
the Bayeux embroidery: coloured wool contours and fills, profile figures and
mostly open linen. The two approved industrial references are committed here
as `style-reference-landscape.png` and `style-reference-bayeux.png`.

Tapestry uses five approved Bayeux sheets: `bayeux-early`, `bayeux-revolutions`,
`bayeux-modern`, `bayeux-context-chapters` and `bayeux-winter-eras`. Original
generated PNGs are preserved; full-size WebP derivatives are used at runtime.
A failed WebP retries its own PNG with the same row and facet crop. Landscape
retains its existing sources, neutral scenery and fallback behaviour. Never
substitute an unrelated historical scene to fill a gap.

Run `node tools/tapestry-artwork.mjs prompts` before drawing. It prepares **ten
paired briefs**: early, revolutions, modern, context chapters and winter eras,
once per style. A subject or date-scope change affects both corresponding briefs.
Keep each style's measured rows in `artworkStyles` in `src/tapestryScenes.js`.
The five Bayeux sheets are 1774×887, with seven/seven/seven/seven/five rows.
Each crop includes its upper animal border and stops before the next row.
The paired briefs include the measured crop coordinates for each style;
provenance checks detect row/facet changes as well as pixel and subject drift.

Respect #67's folds: the first facet's central **112px** must identify the subject
at overview. Later facets sit behind fixed source crops and appear as folds open.
Use distinct activities in consecutive fifths, preserve all restricted facet
ranges, and avoid placing important faces on fold/row boundaries. The cloth
renderer preserves native aspect ratios; do not stretch art to fit dated spans.
Continuation facets are disjoint and must remain within their approved eras.
At maximum zoom all cloth is flat. Do not change `clothPleats.js` to accommodate
new artwork; measure the sources and update their crop metadata instead.

Keep lettering out of the bitmap. Tapestry headings are modern Latin in
`src/contextHeadings.js`, styled with capital V for U. **No visible dates in
Tapestry**, including continued captions. English names and recorded dates remain
in tooltips, accessible event descriptions and details. Landscape retains its
English headings and dates. Latin inscriptions and wool-on-linen embroidery
take their inspiration from the [Bayeux Museum](https://www.bayeuxmuseum.com/en/actus/explore-the-bayeux-tapestry-online/)
and its [embroidery description](https://www.bayeuxmuseum.com/en/the-bayeux-tapestry/discover-the-bayeux-tapestry/tapestry-or-embroidery/).

After visual review, run `python tools/generate-thumbnails.py --tapestry-only`
when adding/updating WebP derivatives, then `node tools/tapestry-artwork.mjs record`
and `node tools/tapestry-artwork.mjs check`. Records detect changes to subjects,
references, source pixels and runtime pixels. Recording refuses a changed brief
whose artwork has not changed, so an update to only one style cannot silently
pass. Commit original PNGs, crop metadata, regenerated prompts and records.

For a reviewed correction to scope metadata that preserves the existing image
content, use `node tools/tapestry-artwork.mjs record --metadata-only`. This
explicit exception records both style briefs while requiring unchanged master
and runtime image hashes. It cannot accept a changed style reference without a
redraw. Ordinary subject changes continue to require updated artwork.

Validate with `node --test tools/*.test.mjs` and the native browser. Check all
three modes, reload/shared links, low/mid/max zoom and reversal in both time
scales, Latin captions without dates, and correct chapter details when clicked.
