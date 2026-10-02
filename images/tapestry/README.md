# Historical tapestry artwork

The UI2 context control now has three modes: Bars, Landscape and Tapestry. The
current landscape and the closest-to-Bayeux direction are maintained together.
See the standing [Context drawing instructions](../../docs/context-drawing-instructions.html)
and [drawing-guide.md](drawing-guide.md) for the distinct source workflows and
fixed-art folding rules. Tapestry uses
Latin inscriptions without visible dates; English titles and dates remain in
event details. Landscape retains English captions and dates.

Tapestry loads four `bayeux-linear-*.webp` sources and joins twelve whole drawn
bands end to end, with overlapping history already composed into each picture.
Native body crops and selection hotspots live in `src/storyPanels.js`; a failed
derivative retries its own PNG master. Exact prompts, references and hashes live
in `linear-story-generation.json`. These new compositions are available for
in-prototype review; they do not inherit approval from the older source sheets.

The five earlier Bayeux event atlases, their measured rows in `src/tapestryScenes.js`
and their paired generation records remain archived. Landscape continues to use
its existing sources, English names/dates, braids and fold renderer.

The archived `early-panorama.png`, `revolutions-panorama-v2.png`, and
`modern-panorama.png` were generated with the built-in image generation tool.
Each has seven horizontal panoramas with five narrative groups per event.
They remain available as Landscape fallback sources. The images are artistic
interpretations; dates and descriptions come from the database at runtime.

The revised revolutions sheet replaces only the American Revolution's first group with colonial troops facing British redcoats across a gap. The generated correction was cropped into the original atlas at x=0–327, y=568–704; all pixels outside that rectangle are preserved. The original `revolutions-panorama.png` remains as a source. The edit prompt is recorded in [panorama-prompts.md](panorama-prompts.md#american-revolution-correction).

`src/tapestryScenes.js` records measured strip boundaries, action-group boundaries and hover captions. At overview scale the first group provides a summary. As a window widens, more groups enter the composition; figure height changes only slightly. The panorama fills the complete event window, with overlapping edges and a shared linen ground to blend neighbouring pictures. Hover regions follow the artwork's actual crop and open the original event details.

Event start markers and duration threads use the same year scale as the main timeline. Picture-window widths are not event durations. The extra groups depict symbolic facets of each event, not newly dated incidents. New unillustrated database events receive a readable fallback until artwork is added. The regression checks in `tools/tapestry.test.mjs` cover chronological continuity, duration overlaps, and the reveal of distinct narrative groups.

The expanded artwork's full prompt set is in [panorama-prompts.md](panorama-prompts.md). `historical-scenes.png` is retained as the original style reference; its prompt follows.

## Generation prompt

Use case: historical-scene
Asset type: production illustration atlas for a zoomable historical timeline.
Create one landscape image divided into EXACTLY 7 columns and 3 rows of equal-sized rectangular illustration cells, read left to right, top to bottom. Each cell is a distinct scene rendered as Bayeux Tapestry embroidery: flat side-on figures, expressive gestures, dark stitched contours, muted madder red, indigo, ochre and sage wool on identical warm unbleached linen. Fine visible woven texture, charming detailed narrative tableaux. Fill each cell with its scene but keep important figures away from edges. No text, letters, numbers, labels, gutters, frames or decorative borders. Consistent background across every cell so they can be cropped and composed into a continuous ribbon. Historically appropriate clothing and objects for each period, all translated into medieval embroidery visual language. No gore.
21 cells in exact order:
Row 1: Renaissance scholars reading manuscripts beside painter and classical architecture; 1453 Ottoman siege of Constantinople with city walls and cannon; Columbian Exchange with Atlantic sailing ship maize horses and people on two shores; Protestant Reformation with printing press pamphlets and reformer; Little Ice Age with frozen river skaters snow village; Thirty Years War with seventeenth-century pikemen and ruined village; English Civil War with opposing Royalist and Parliamentarian soldiers.
Row 2: European famine with failed grain harvest and hungry villagers; War of Spanish Succession with early eighteenth-century soldiers and disputed crown; Great Frost with frozen trees shivering villagers and ice; Seven Years War with eighteenth-century troops and sailing ships; American Revolution with colonial soldiers facing British redcoats; US Constitution signing with delegates quill and parchment in Philadelphia hall; French Revolution with crowds tricolour and Bastille.
Row 3: Napoleon in bicorne beside troops and imperial eagle; Carrington Event with aurora over telegraph poles and operator; American Civil War with blue and grey soldiers and railway; World War I with trench soldiers and biplane; Great Depression with unemployed people in breadline and shuttered factory; World War II with aircraft tanks and ruined buildings; Cold War with opposing blocs divided by wall and space rockets.
These are symbolic illustrations of the database events, not photographic reconstructions. All 21 scenes must be different and clearly legible. Output 7:3 landscape if possible.


## Prototype landscape B — early

Asset: `landscape-b-early.png`. Built-in image generation, 29 September 2026; original generated PNG bytes preserved. References: existing revolutions atlas and selected study B. Symbolic illustration only; dates and duration are supplied by the HTML interval layer. All prior atlases are retained as fallbacks.

Prompt:

```text
Use case: historical-scene. Create a production sprite atlas for the PaperTrails prototype. TWO input images are STYLE AND COMPOSITION REFERENCES only: the old multi-row atlas defines the charming embroidered ink outlines and muted ochre, madder, sage, indigo on linen; the continuous landscape study defines a shared horizon and quiet flowing countryside. Output ONE landscape image with EXACTLY SEVEN EQUAL-HEIGHT HORIZONTAL STRIPS stacked vertically, no outer frame, no gutters, no text or dates. Each strip spans the FULL WIDTH and is its OWN continuous landscape, with five symbolic activities left-to-right blending through one shared countryside instead of isolated vignettes. These strips will be cropped and placed consecutively along a historical timeline: every strip must have matching linen sky/ground colours at both edges, the same low horizon at 40% of its own height, all adults standing with feet at 85% and roughly 35% of strip height, and gentle stitched terrain at the edges. No tall vertical framing trees at edges, no abrupt rectangular backgrounds, no visible divisions within a strip. Period-appropriate symbolic illustration, not documentary reconstruction, no gore. All date labels are supplied separately by HTML. Composition should be readable at 140px strip height; use clear sparse silhouettes, not crowds. Represent the five activities across the five approximate fifths of every strip. No letters, numbers, watermark, scientific graph, modern text, or UI. STRIPS TOP TO BOTTOM: 1 Renaissance: scholars with manuscripts; humanists discussing; artist painting; classical statue; readers exchanging books. 2 Fall of Constantinople: cannon near distant Byzantine walls; Ottoman gun crew; defenders by towers; ships on water; port and trade. 3 Early Columbian Exchange: sailing ship; crops exchanged; horses and livestock; people meeting across continents with respectful diverse portrayal; caring for illness. 4 Protestant Reformation: reformer near printing press; typesetter; printed sheets drying; readers discussing; two communities with different churches. 5 Little Ice Age: snowy village; people crossing frozen river; skaters and sledges; cold-weather farming; gathering fuel. 6 Thirty Years War: pikemen; musketeers; cannon supplies; damaged village and civilians; field camp. 7 English Civil War: Royalist and Parliamentarian figures; cavalry; pikes and muskets; fortified town; civilians debating.
```


## Prototype landscape B — revolutions

Asset: `landscape-b-revolutions.png`. Built-in image generation, 29 September 2026; original generated PNG bytes preserved. References: existing revolutions atlas and selected study B. Symbolic illustration only; dates and duration are supplied by the HTML interval layer. All prior atlases are retained as fallbacks.

Prompt:

```text
Use case: historical-scene. Create a production sprite atlas for the PaperTrails prototype. TWO input images are STYLE AND COMPOSITION REFERENCES only: the old multi-row atlas defines the charming embroidered ink outlines and muted ochre, madder, sage, indigo on linen; the continuous landscape study defines a shared horizon and quiet flowing countryside. Output ONE landscape image with EXACTLY SEVEN EQUAL-HEIGHT HORIZONTAL STRIPS stacked vertically, no outer frame, no gutters, no text or dates. Each strip spans the FULL WIDTH and is its OWN continuous landscape, with five symbolic activities left-to-right blending through one shared countryside instead of isolated vignettes. These strips will be cropped and placed consecutively along a historical timeline: every strip must have matching linen sky/ground colours at both edges, the same low horizon at 40% of its own height, all adults standing with feet at 85% and roughly 35% of strip height, and gentle stitched terrain at the edges. No tall vertical framing trees at edges, no abrupt rectangular backgrounds, no visible divisions within a strip. Period-appropriate symbolic illustration, not documentary reconstruction, no gore. All date labels are supplied separately by HTML. Composition should be readable at 140px strip height; use clear sparse silhouettes, not crowds. Represent the five activities across the five approximate fifths of every strip. No letters, numbers, watermark, scientific graph, modern text, or UI. STRIPS TOP TO BOTTOM: 1 European famine: empty grain basket; failed harvest; family sharing scarce food; meagre crops; communal bread table. 2 War of Spanish Succession: soldiers near small disputed crown symbol; courier and standards; infantry; cavalry/artillery; campaign maps and supplies. 3 Great Frost: frozen trees and people; iced boats; snowy village; frozen fields; shelter and shared food. 4 Seven Years War: troops; officers with maps; artillery; distant warships; coastal fort. 5 American Revolution: colonial soldiers and redcoats; supplies; country roads at war; encampment; people discussing independence. 6 US Constitution: outdoor cutaway of signing delegates; discussion; quills and parchment; waiting delegates; document presented in open-sided hall with landscape still continuous. 7 French Revolution: distant Bastille; citizens; open-sided assembly; pamphlets; public square with tricolour flags.
```


## Prototype landscape B — modern

Asset: `landscape-b-modern.png`. Built-in image generation, 29 September 2026; original generated PNG bytes preserved. References: existing revolutions atlas and selected study B. Symbolic illustration only; dates and duration are supplied by the HTML interval layer. All prior atlases are retained as fallbacks.

Prompt:

```text
Use case: historical-scene. Create a production sprite atlas for the PaperTrails prototype. TWO input images are STYLE AND COMPOSITION REFERENCES only: the old multi-row atlas defines the charming embroidered ink outlines and muted ochre, madder, sage, indigo on linen; the continuous landscape study defines a shared horizon and quiet flowing countryside. Output ONE landscape image with EXACTLY SEVEN EQUAL-HEIGHT HORIZONTAL STRIPS stacked vertically, no outer frame, no gutters, no text or dates. Each strip spans the FULL WIDTH and is its OWN continuous landscape, with five symbolic activities left-to-right blending through one shared countryside instead of isolated vignettes. These strips will be cropped and placed consecutively along a historical timeline: every strip must have matching linen sky/ground colours at both edges, the same low horizon at 40% of its own height, all adults standing with feet at 85% and roughly 35% of strip height, and gentle stitched terrain at the edges. No tall vertical framing trees at edges, no abrupt rectangular backgrounds, no visible divisions within a strip. Period-appropriate symbolic illustration, not documentary reconstruction, no gore. All date labels are supplied separately by HTML. Composition should be readable at 140px strip height; use clear sparse silhouettes, not crowds. Represent the five activities across the five approximate fifths of every strip. No letters, numbers, watermark, scientific graph, modern text, or UI. STRIPS TOP TO BOTTOM: 1 Napoleon: Napoleon and map table; infantry and drums; cavalry/cannon; modest imperial ceremony; outdoor administrative desk. 2 Carrington event: people watching aurora; telegraph operator; disrupted wires/instruments; equipment; telegraph stations under aurora with grounded landscape. 3 American Civil War: Union and Confederate soldiers without glorification; field camp; supply train; care for wounded; civilians/damaged buildings. 4 World War I: trench soldiers; barbed wire/artillery; biplane; rear medical care; station with civilians. 5 Great Depression: breadline; closed factory; people seeking work; family sparse table in open-sided shelter; neighbours sharing. 6 World War II: tanks/planes; workers; supplies; rescue in damaged street; civilians rebuilding. 7 Cold War: officials of opposing blocs; distant dividing wall/watchtower; guarded border; symbolic rockets/satellite; people at openings in wall.
```

## Continuous-cloth landscape interlude

Asset: `landscape-b-interlude.png`, generated with the built-in imagegen tool on 30 September 2026. Original PNG bytes preserved, 2172 by 724 pixels. Its style reference was `landscape-b-early.png`; none of the event atlases were changed. The renderer uses the band at y=148, height=468, maintaining its natural aspect ratio. It fills chronological gaps without suggesting an event continued. No people or historical claims appear in this connector.

Final prompt:

```text
Use case: historical-scene illustration. Create ONE NEW very wide, shallow horizontal panorama (roughly 6:1 aspect ratio), not a stacked sheet, for the PaperTrails continuous embroidered timeline. The attached seven-row image is a STYLE REFERENCE ONLY: match its delicate ink drawings, subdued blue-grey distant hills, ochre linen ground, fine stitched vegetation and calm Bayeux tapestry character. Subject: a quiet uninhabited landscape connector, gently rolling fields, a low winding river, tiny copses and a few spare foreground plants, with a continuous horizon about one third from the top. This is neutral decoration for chronological intervals without a depicted event. No people, no soldiers, no livestock, no buildings, no machinery, no weapons, no flags, no text, dates or legends. One uninterrupted landscape fills the image edge to edge. NO border, NO separate rows, NO margins. The left and right edges should meet smoothly when repeated horizontally, with the same sky colour, horizon height and foreground texture. Keep detail modest so the dated event scenes remain the focus. Keep the whole landscape at the gentle small-scale ink linework and thread texture of the reference; do not render photographic scenery or thick cartoon outlines. Save as a new image, do not replace the reference artwork.
```


## Historical chapter compositions

Asset: `landscape-b-context-chapters.png`. Generated with the built-in imagegen tool on 30 September 2026, using `landscape-b-revolutions.png` as a style reference. Original PNG bytes preserved, 1774 × 887 pixels. Seven measured rows supply nine chapters through disjoint crops. The industry-community crop omits the later railway-heavy region. These are symbolic illustrations; YAML supplies scope, qualified dates and historical evidence.

Full generation prompt:

```text
Use case: historical-scene. Asset: PaperTrails historical embroidery sprite atlas. The attached image is STYLE REFERENCE ONLY; keep its charming detailed ink outlines, fine linen and stitched vegetation, ochre, madder red, sage, muted indigo, small readable figures and calm distant hills. Create ONE NEW landscape atlas with EXACTLY SEVEN equally high horizontal strips, edge to edge, no gutter, no borders, no words, no numbers. Each strip is a separately composed continuous panorama with about five different activities from left to right, spaced by calm countryside. Match a low distant horizon at 40% of each strip height, adult figures feet at 85%, figure height about 38%. At BOTH edges every strip ends in quiet uninhabited countryside with the same warm linen sky and sage/ochre ground; keep all people and objects away from the outer 6% so scenes can join smoothly. Historically appropriate objects and clothes rendered as embroidery, symbolic not photographic reconstructions. SEVEN STRIPS TOP TO BOTTOM: 1 Early British industrialisation, eighteenth-century waterwheel, textile workshop with workers, mining pump, canal boat, riverside mill; 2 Steam workshops, late eighteenth-century British beam engine, mechanics making tools, furnace, artisans assembling machinery, small factory yard; 3 Industrial communities, early nineteenth-century British factories, textile workers including women, modest workers' housing, steam railway and warehouse, community market; 4 Transatlantic enslavement, African community with families and skilled artisans, coastal fort and anchored sailing vessel, forced departure portrayed soberly without spectacle, distant Atlantic sailing ship, Caribbean coastline. Convey human dignity, historically accurate African and European dress, no gore or caricatures; 5 Plantation economies and resistance, enslaved people working Caribbean sugar fields with overseer at a distance, sugar mill, families preserving community, people organising resistance, abolition campaigners exchanging printed papers. Show agency and dignity, no smiling leisure idyll and no gore; 6 Haitian Revolution 1791-1804, Black organisers meeting, diverse rebel figures in period dress, Toussaint Louverture-like officer without claim of exact likeness, people debating constitutional document, independence gathering and Haitian landscape; 7 Electric telegraph networks 1830s-1866, early battery and electromagnetic telegraph experiment, operator at key, wires across countryside, cable laying ship at Atlantic shore, receiving station. All seven panoramas must be different with no duplicated cells, no flags requiring exact modern symbols, no lettering or watermark. Dense fine stitchwork but distinct motifs legible at 128px strip height. Keep the reference's warm ground palette; no grey smudges, no UI.
```


## Six varied quiet landscapes

Asset: `landscape-b-quiet-chapters.png`. Generated with the built-in imagegen tool on 30 September 2026, using `landscape-b-revolutions.png` as a style reference. Original PNG bytes preserved, 1774 × 887 pixels. Each of the six distinct rows appears once on the fixed source material. Continuous procedural thread drawing fills the remaining space; no connector is tiled or mirrored, and no event is implied.

Full generation prompt:

```text
Use case: illustration-story. Create one NEW sprite atlas of exactly SIX continuous horizontal landscape strips stacked top to bottom, no borders, no gutters, no words, no people, no buildings, no animals, no machinery, no flags. Input image is a STYLE reference only: delicate ink lines and thread texture on warm ochre linen, muted sage and indigo, Bayeux tapestry embroidery. These are quiet landscape connectors for a continuous cloth timeline, with no historical event implied. Each of the six strips must be a completely DIFFERENT composed landscape, NO identical repeated panels or copied trees. Maintain the same distant horizon at 38% of each strip and continuous warm ochre/sage foreground. Match quiet linen sky and ground at left and right edges; all large features set in from edges. TOP TO BOTTOM: 1 low river meandering through open meadow and reeds; 2 gently wooded hills with varied deciduous copses and bracken; 3 rolling open farmland-like grassland without buildings or signs of labour, irregular hedges and wildflowers; 4 rocky upland with a shallow stream and sparse windswept trees; 5 tranquil coastal inlet with reeds and low headlands, no vessels; 6 low wooded valley with a distant blue ridge and varied foreground ferns. Fine naturalistic embroidery inkwork, gentle horizons, all six strips full width, readable at 128px high. Rich varied stitched ground detail with flowing transitions rather than discrete vignettes. Do not replace the reference image. No visible fold shadows or grey smudges; folding is supplied by the app.
```


## Little Ice Age — era-specific continuation artwork

Asset: `landscape-b-winter-eras.png`, generated with the built-in imagegen tool on 1 October 2026. Original PNG bytes preserved, 1855 × 848. Style reference: `landscape-b-early.png`. Five measured rows depict seventeenth-century, early eighteenth-century, late eighteenth-century, Regency and early Victorian everyday winter life. They have separate permitted ranges, 1600–1700, 1700–1750, 1750–1800, 1800–1830 and 1830–1850. These are editorial artwork compatibility bounds, not dated occurrences or evidence that every year was snowy. Human costumes and transport were checked in the generated atlas; later regions are never sourced from the old early panorama. No previous bitmap was edited.

Full generation prompt:

```text
Create ONE NEW historical embroidery atlas for PaperTrails, exactly FIVE full-width equally high horizontal strips stacked vertically, no gutters, no outer border, no text or dates. Reference image is STYLE ONLY: keep its delicate brown ink outlines, muted indigo, madder, ochre linen, fine thread vegetation and charming Bayeux-inspired textile drawing. Every strip is a DIFFERENT continuous winter landscape, quiet transitions between five distinct small activities, shared horizon at 40% of its strip height, adults about 35% of strip height, feet at 85%, same pale warm linen/snow colours at edges. No copied panels. These pictures illustrate broad regional cold-weather context, NOT a particular recorded freeze or claim that every pictured year was snowy. The COSTUMES, TRANSPORT and ARCHITECTURE must belong to that strip's era, never medieval costume in a later century. FIVE STRIPS TOP TO BOTTOM: 1 Northern European winter 1600-1699: seventeenth-century wool coats, breeches, stockings, wide-brim hats, women with modest long wool skirts and linen caps; low timber/plaster and brick cottages, frozen river crossing, simple hand sled, people gathering fuel, skating; NO medieval hoods, armour, castles, nineteenth-century railways. 2 Northern European winter 1700-1749: early eighteenth-century long coats and breeches, some cocked hats, women in period wool skirts/caps; Georgian brick street at a distance, horse cart, snow-covered fields, riverside workshop, people sharing fuel, frozen canal; no medieval dress. 3 Winter 1750-1799: late eighteenth-century coats/waistcoats/breeches, bonneted women, Georgian farmhouses and canal-side buildings, horse-drawn supply cart, winter fieldwork, mill worker, family entering warm cottage; no medieval buildings, no locomotives. 4 Winter 1800-1829: Regency/early nineteenth-century long coats and trousers, simple top hats, women with high-waisted dresses under wool cloaks and bonnets; Georgian houses, horse coach on wintry road, canal boat, workers fetching fuel, hedged fields; no medieval/Elizabethan clothes. 5 Winter 1830-1850: early Victorian everyday dress, frock coats and trousers, simple top hats and flat work caps, women in bonnets and long skirts under shawls; modest brick terraces and small rural workshops, horse-drawn cart, canal transport, family carrying fuel, snow-covered village lane; absolutely NO medieval hoods or robes, armour, castles, modern technology, fantasy motifs, late Victorian bustle dresses or exaggerated Victorian locomotives. Scenes are humane modest everyday winter life with no battlefield, no famous landmark, no event labels. Keep all scenes naturally proportioned, no folds or shadows baked into the image; the app supplies cloth folds. Very wide fine linework strips, matching the reference's palette and drawing scale. No lettering or watermarks.
```

## Continuous scenery atlases (layer 14)

Created with the built-in image_gen tool. Original generated PNG bytes are preserved;
no bitmap was edited. Full prompts: [continuous-context-art-prompts.json](../../docs/continuous-context-art-prompts.json).

- `images/tapestry/landscape-b-quiet-extensions.png`: six distinct neutral natural panoramas.
- `images/tapestry/landscape-b-quiet-winter.png`: six distinct winter natural panoramas, used only within the recorded Little Ice Age interval.
- `images/tapestry/landscape-b-quiet-wide.png`: twelve distinct broad neutral panoramas for wider desktop material.

Each image is 1774 by 887. Measured row bounds are in `quietAtlases` in
`src/clothComposition.js`. There are no people, buildings, settlements, vehicles
or technology. Quiet source pixels are consumed once into actual uncovered
windows at uniform natural scale, not tiled or mirrored. Existing dated historical
artwork retains its explicit era compatibility. The winter scenery is symbolic
seasonal context, not a claim of a particular freeze or continuous snow.
