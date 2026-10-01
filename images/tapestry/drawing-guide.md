# Maintaining the two illustration styles

The context control cycles **Bars → Landscape → Tapestry → Bars**. Landscape
keeps the current illustrations. Tapestry targets approved study 8, closest to
the Bayeux embroidery: coloured wool contours and fills, profile figures and
mostly open linen. The two approved industrial references are committed here
as `style-reference-landscape.png` and `style-reference-bayeux.png`.

Large redraws are deferred while the #67 context work settles. Tapestry currently
uses the shipped embroidered panoramas for the original events and the correct
existing chapter/winter pictures for the newer subjects. The registry explicitly
marks its redraw pending. These interim pictures are not the completed study 8
production set. Never substitute an unrelated historical scene to fill a gap.

Run `node tools/tapestry-artwork.mjs prompts` before drawing. It prepares **ten
paired briefs**: early, revolutions, modern, context chapters and winter eras,
once per style. A subject or date-scope change affects both corresponding briefs.
Keep each style's measured rows in `artworkStyles` in `src/tapestryScenes.js`.
Install finished Bayeux sheets there and remove `redrawPending` only after all
five sheets have been reviewed. Chapter and winter sources can share interim
assets, but their finished Bayeux counterparts must be separately authored.

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

Validate with `node --test tools/*.test.mjs` and the native browser. Check all
three modes, reload/shared links, low/mid/max zoom and reversal in both time
scales, Latin captions without dates, and correct chapter details when clicked.
