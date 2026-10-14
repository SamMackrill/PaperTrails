# Nikola Tesla addition

Scientist ID: `tesla`. Profile focus: polyphase alternating-current motors and high-frequency electrical experiments. Nationality: Serbian-American. Life dates: 1856-07-10 to 1943-01-07. The first listed work anchors the timeline portrait at 1888.

## Biography and academic associations

- [Nikola Tesla Museum: Life and work](https://tesla-museum.org/en/nikola-tesla-2/life-and-work/) gives 10 July 1856, 7 January 1943, Serbian family background, US citizenship on 30 July 1891, technical studies in Graz, and natural-philosophy studies at Charles University in 1880.
- [TU Graz archive: Tesla's time at TU Graz](https://www.tugraz.at/en/news/tu-graz-blog/detail/article/nikola-tesla-s-time-at-tu-graz0) confirms his birth date and describes his studies from September 1875 to late 1877 and departure from Graz in 1878. The profile avoids conflating his residence with uninterrupted enrolment and states that he left without a degree.
- [Britannica biography](https://www.britannica.com/biography/Nikola-Tesla) corroborates his Serbian-American identity, death date, and electrical work; its July 9/10 birth notation is resolved here using the museum and university archive's explicit 10 July date.
- Charles University's existing public-domain emblem is reused. Graz University of Technology has no verified local emblem and uses the neutral icon; the University of Graz is a different institution. README's exact neutral-affiliation count increases from 35 to 36.

## Selected original works

1. **1888 — A New System of Alternate Current Motors and Transformers.** [PBS's original-text reproduction](https://www.pbs.org/tesla/res/res_art02.html) identifies the AIEE presentation as 16 May 1888 and describes the rotating magnetic field and AC motor system.
2. **1891 — Experiments with Alternate Currents of Very High Frequency and Their Application to Methods of Artificial Illumination.** [Tesla Science Center's original-text reproduction](https://teslasciencecenter.org/announcements/experiments-with-alternate-currents-of-very-high-frequency-and-their-application-to-methods-of-artificial-illumination-by-nikola-tesla/) explicitly dates the AIEE lecture at Columbia College to 20 May 1891. The site's 2020 posting date is not the work's publication year.
3. **1893 — On Light and Other High Frequency Phenomena.** [Publisher record](https://www.sciencedirect.com/science/article/abs/pii/001600329390308H), *Journal of the Franklin Institute* 136(3), September 1893, pp. 161–178, DOI `10.1016/0016-0032(93)90308-H`. [Original lecture transcript](https://teslauniverse.com/nikola-tesla/lectures/light-and-other-high-frequency-phenomena) supports the summary of lighting, resonance, and proposed wireless energy transmission. Claims about wireless energy are described as experiments and discussion, without implying successful worldwide power delivery.

All abstracts are new summaries. New publication IDs are `tesla-work-00` through `tesla-work-02`; existing record identities and legacy aliases are preserved. New works need no historical positional alias. The existing identity tests now compute dataset size and validate aliases when recorded, as allowed by the repository's identity contract.

## Portrait provenance and production

- Source: [Wikimedia Commons: Tesla circa 1890.jpeg](https://commons.wikimedia.org/wiki/File:Tesla_circa_1890.jpeg).
- Photographer: Napoleon Sarony (1821–1896). Commons identifies the source as a Nikola Tesla Museum postcard, document MNT, VI/V 10, via *RadioGraphics*.
- Rights: Commons marks the work public domain under PD-old-100 and PD-US-expired.
- Downloaded original: [940 × 1260 JPEG](https://upload.wikimedia.org/wikipedia/commons/7/79/Tesla_circa_1890.jpeg).
- Photo preparation: top square crop `(0, 0, 940, 940)`, encoded as RGB JPEG at quality 92; no upscaling. Final: `images/tesla.jpg`.
- Illustration: fresh built-in image generation using the prepared portrait as identity reference and `images/cartoons/maxwell.png`, `images/cartoons/birkeland.png`, and `images/cartoons/steinmetz.png` as style references. Recognition anchors: long angular face and nose, strongly parted dark waved hair, and short moustache with attentive eyes.
- Raw generation had genuine alpha but measured 1254 × 1254. The skill's deterministic finisher normalised it to 1024 × 1024, removing zero background pixels. The finished RGBA PNG passes the asset validator. Its transparency warning reflects space beside the narrow turned bust, rather than holes in the portrait; review sheets over contrasting backgrounds and 92 px colour / 42 px grayscale circular crops confirm this.
- Final illustration: `images/cartoons/tesla.png`. Only Tesla's two 192 px WebP thumbnails were generated using the existing thumbnail helper: `images/thumbs/tesla.webp` and `images/thumbs/cartoons/tesla.webp`.

## Validation

- Parsed the complete dataset with the vendored js-yaml parser: 144 scientists, 270 publications, and 36 affiliation rows without emblems.
- Checked required Tesla fields, date order, sorted integer publication years, unique IDs and colour, affiliation assets, all four portrait paths, encoded formats, dimensions, and decoded alpha. The cartoon asset validator reports `PASS`.
- Reviewed full-size photo and illustration on contrasting backgrounds and 92 px colour / 42 px grayscale circular crops beside the three approved style references.
- `node --test tools/*.test.mjs`: all 128 tests passed. `git diff --check` passed.
- Served the site with `python -m http.server 8000` and used T3's collaborative browser to verify search, Tesla's profile, all three publication markers and panels, source and DOI links, related-publication highlights, and the 1888 anchor. Photograph and illustration thumbnails decoded successfully; no fallback was used. Checked light and dark themes. Browser diagnostics reported no console or network errors.

## Built-in generation prompt

```text
Use case: style-transfer
Asset type: Paper Trails circular timeline portrait, 1024x1024 RGBA PNG.
Input images: Image 1 is the sole identity reference, Nikola Tesla photographed around 1890 by Napoleon Sarony; Images 2, 3, and 4 (Maxwell, Birkeland, Steinmetz) are approved house-style references only, do not borrow their facial features.
Primary request: Draw a fresh affectionate editorial caricature of Nikola Tesla in the Paper Trails 'Wry Engraver' house style, recognizable before humorous.
Recognition anchors: long narrow angular face with a prominent straight nose and tapered chin; dark smooth waved hair with a strong side part; neat short dark moustache above a small, slightly knowing mouth, attentive almond-shaped eyes and arched brows.
Comic idea: a subtle knowingly raised eyebrow and a modestly oversized stiff white collar, no prop.
Style/medium: bold confident charcoal-teal ink contours (#183B3A), simplified graphic shapes, restrained flat colour with at most one shallow shadow tone, very faint printed paper grain within fills. Newly drawn editorial caricature, facial anchors exaggerated only 10-15 percent, slightly enlarged head and compressed shoulders.
Composition/framing: one centered head-and-shoulders bust with Tesla's slight three-quarter turn toward viewer's left; eyes at 42 percent height; hair begins at 8 percent from top; bust meets bottom edge; strong silhouette with shoulders inside margins; all facial features inside central 76 percent, safe for 42px and 92px circular crops.
Color palette: natural fair neutral-to-rosy skin, muted charcoal-teal nineteenth-century dark suit and cream-white high collar, retain period details. No blanket sepia, yellow, ochre, orange or bronze cast.
Background: genuine alpha transparency; empty pixels outside the bust; never draw or depict a checkerboard, transparency grid, studio backdrop, halo, or background colour.
Constraints: Output 1024x1024 PNG with genuine decoded alpha. One person only, no text, caption, signature, watermark, floating apparatus, lightning, lightbulbs, science symbols, full body, photographic realism, airbrushing, painterly gradients or dense hatching. Match the supplied cartoons' graphic family.
```

