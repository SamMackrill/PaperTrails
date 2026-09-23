# Paper Trails

Paper Trails is an interactive browser-based timeline of scientific history. It places scientists and their publications alongside major discoveries, conferences, and wider historical events, making it easier to see how scientific ideas developed in context from 1400 to the present year.

The included dataset focuses mainly on physics, astronomy, mathematics, and related subjects.

## Features

- Scientist portraits linked to their first listed publication
- Colour-coded publication markers with titles and abstracts
- Discovery markers for experiments, particles, and milestones
- Diamond markers for scientific conferences
- Duration bars for significant historical events
- Optional Bayeux-style historical tapestry, with blended panoramas and additional narrative scenes revealed as you zoom
- Clickable detail dialogs for scientists, publications, discoveries, conferences, and events
- Hover highlighting that connects a scientist with their publications
- Mouse, trackpad, touch, and keyboard controls for panning and zooming, with a readout of the years in view
- Optional cartoon portraits, and initials for people with no verified portrait
- Toggles for people, publications, discoveries, conferences, and historical events
- A controls dialog listing every mouse, keyboard, and touch shortcut
- Light and dark themes, with the preference saved in the browser

## Running locally

There is no build step or package installation. The application uses native HTML, CSS, and JavaScript modules. The small [js-yaml](https://github.com/nodeca/js-yaml) runtime dependency is vendored under `vendor/` so the timeline does not depend on access to a third-party CDN.

Because the application fetches YAML files at runtime, serve the repository over HTTP instead of opening `index.html` directly. For example, with Python 3:

```sh
python -m http.server 8000
```

Then open <http://localhost:8000>.

The application code, data, and YAML parser are stored in this repository, so an internet connection is not required to load the timeline. External source and map links require connectivity when opened.

## Using the timeline

- Click and drag an empty part of the timeline to pan, or scroll.
- Hold Ctrl while scrolling, or pinch on a trackpad, to zoom around the pointer. The zoom buttons and slider zoom around the centre, and the readout beside them shows the years in view.
- On a touch device, drag with one finger and pinch with two fingers.
- With the timeline focused, use the arrow keys to pan, plus and minus to zoom, and Home to fit the whole timeline. Tabbing to an item brings it into view.
- Click **Fit timeline** to show the full range again.
- Click a portrait or marker to see more information.
- Use the layer buttons (People, Publications, Discoveries, Conferences, and Context) to change what is displayed. On narrower screens they are under the view options button.
- Press <kbd>?</kbd> or click the help button to see every control.
- Use the moon/sun button to switch themes.
- Short historical events are drawn as pins with their label alongside; hover or focus any band for its full title and dates.
- Turn on **Tapestry** to replace context labels with a continuous illustrated ribbon. This preference is saved in your browser. **Context** still controls whether the entire historical layer is visible.
- Tapestry scenes begin at the database's event start dates. Their picture windows extend to the next event's start; the stitched threads below show actual event durations, including overlaps. The panoramas fill those windows and blend into their neighbours. Zooming reveals additional narrative groups while keeping figures at a similar size. Hover different parts of a panorama for explanations of the depicted activities, or focus/select the event for accessible details. Drag the ribbon to pan.
- The tapestry uses symbolic illustrations of all 21 current events, rather than depictions of additional dated incidents. Artwork provenance and the generation prompt are recorded in `images/tapestry/README.md`.

## Editing the content

Timeline content is kept in four YAML files:

- `data/scientists.yaml` contains biographical details, image paths, and publications.
- `data/discoveries.yaml` contains dated scientific discoveries and milestones.
- `data/conferences.yaml` contains dated scientific conferences and their attendees.
- `data/significantevents.yaml` contains historical periods with start and end years.

A scientist entry has this shape:

```yaml
example_id:
  name: "Example Scientist"
  summary: "A concise explanation of why this person and their work matter."
  color: "#336699"
  photo: "images/example.jpg"
  cartoon: "images/cartoons/example.png"
  nationality: "English"
  birth: "1900-01-01"
  death: "1980-01-01"
  academic_affiliations:
    - institution: "Example University"
      association: "Student and later professor"
      coat: "images/institutions/example-university.png"
  publications:
    - year: 1930
      title: "Example Paper"
      abstract: "A short description of the work."
```

`academic_affiliations` records university-level education, teaching, or research associations. Use a person's individual college for Oxford and Cambridge affiliations. Store verified institutional arms, seals, or official emblems under `images/institutions/`, record their source and licence in that directory's `ATTRIBUTION.md`, and reference the local asset with `coat`. Entries without a verified asset use a neutral academic-building icon; do not invent or approximate heraldry.

### Academic affiliations without emblems

Sixteen affiliation rows deliberately omit `coat` and display the neutral icon:

- **Manchester Academy** — the historical dissenting academy where John Dalton taught has no distinct, reliably documented surviving mark. The modern Manchester music venue and the arms of a successor college are not equivalent.
- **Académie royale des sciences** — no repository-compatible historical emblem was added for du Fay's research association; the neutral icon avoids substituting the modern Académie des sciences identity.
- **Royal Engineering School of Mézières** — archival sources document the school, but no distinct school emblem suitable for reuse was found. The later Corps royal du génie insignia is not substituted.
- **Royal Institution** — its [copyright notice](https://www.rigb.org/copyright) says the institution's marks and logos may not be reproduced without prior permission.
- **SISSA** — the school publishes an official logo and seal, but [requires the Director's authorization for external use](https://www2.sissa.it/media-and-press/researchers-and-sissa-staff).
- **Jagiellonian University** — no repository-compatible historical or official emblem was added for this entry; the neutral icon avoids substituting later or unofficial artwork.
- **University of Ferrara** — no repository-compatible historical or official emblem was added for this entry; the neutral icon avoids substituting later or unofficial artwork.
- **University of Leuven** — no repository-compatible historical or official emblem was added for this entry; the neutral icon avoids substituting later or unofficial artwork.
- **University of Jena** — no repository-compatible historical emblem was added for Leibniz's period of study; the neutral icon avoids substituting the modern university identity.
- **University of Altdorf** — the university closed in 1809, and no distinct repository-compatible historical emblem was added for Leibniz's doctorate.
- **University of Texas at Austin** — the Wheeler row deliberately retains the neutral icon because no repository-compatible emblem is recorded for the affiliation.
- **New York University** — the Breit row deliberately retains the neutral icon because no repository-compatible emblem is recorded for the affiliation.
- **University of Wisconsin–Madison** — the Breit row deliberately retains the neutral icon because no repository-compatible emblem is recorded for the affiliation.
- **University of Genoa**, **University of Palermo**, and **University of Turin** — Cannizzaro's Genoa and Palermo affiliations and Avogadro's Turin affiliation use neutral icons because no verified local emblems are recorded.

The full asset provenance, licence information, and institutional-use caveats are recorded in [`images/institutions/ATTRIBUTION.md`](images/institutions/ATTRIBUTION.md).

Discovery entries use `year`, `title`, `discoverer`, `details`, `particle`, and `color`. They can include `scientist_ids` for linked discoverers and `theorist_ids` for linked scientists whose theoretical prediction the event validates. Conference entries use `year`, `title`, `location`, `historical_map`, `details`, `particle`, and `attendee_ids`, containing scientist keys from `data/scientists.yaml`. `historical_map` contains `year` and `url` values for a period-appropriate archival map. A conference can also include a `photo` object with `src`, `alt`, `caption`, `credit`, and `source`; cards display it only when present and link the credit to its archival source. Conference detail cards link the location to Google Maps, link the period map separately, and list attendees with links to their timeline nodes. Historical event entries use `title`, `shortTitle`, `startYear`, `endYear`, `details`, and `color`, and can also use `attendee_ids`. `shortTitle` is the compact timeline label used when the full event title does not fit its duration band; use a familiar abbreviation where one exists, or a short recognisable name otherwise.

Conferences can also use `theorist_ids` to link intellectual contributors separately from attendees, as with Avogadro at Karlsruhe. Historical-map year labels can preserve approximate dates such as "late 1850s".

Place portrait files under `images/` and cartoon variants under `images/cartoons/`. For filenames containing both a surname and given name, use surname-first order—`surname_givenname.ext`—so related people sort and scan predictably. Keep surname particles together, and use a surname-only filename when it is already unambiguous. People without a verified portrait can keep `images/default.png`; the timeline and details panel show their initials instead, with a note in the panel. Images that fail to load fall back to the photograph, then to initials.

Cartoon portraits follow the repo-local [Paper Trails cartoon portrait skill](.agents/skills/papertrails-cartoon-portrait/SKILL.md). It defines the recognisable caricature house style, prompt structure, crop constraints, and acceptance checks. See the [collection audit](docs/cartoon-portrait-audit.md) for the current migration priorities.

The displayed date range and layout constants can be changed in `src/config.js`. Every horizontal position is calculated by `src/timeScale.js`.

Run the unit tests with `node --test tools/*.test.mjs`. The timeline starts at `START_YEAR` and automatically ends at the browser's current year.

## Project structure

```text
.
|-- index.html                 Page markup and controls
|-- style.css                  Layout, timeline, modal, and theme styles
|-- script.js                  Application startup and pan/zoom interactions
|-- src/
|   |-- config.js              Date range and display settings
|   |-- dataLoader.js          YAML loading
|   |-- modalManager.js        Detail dialogs
|   |-- portraits.js           Portrait selection and initials fallbacks
|   |-- tapestryRenderer.js    Tapestry ribbon layout
|   |-- tapestryScenes.js      Tapestry artwork atlas
|   |-- themeManager.js        Theme selection
|   |-- timeScale.js           Year-to-position and zoom slider scales
|   `-- timelineRenderer.js    Timeline element rendering
|-- data/                      Timeline content in YAML
`-- images/                    Photographic and cartoon portraits
```

## License

This project is released into the public domain under [The Unlicense](LICENSE). Third-party images retain the terms listed in [the portrait attribution file](images/ATTRIBUTION.md), [conference-photo attribution file](images/conferences/ATTRIBUTION.md), and [institutional-emblem attribution file](images/institutions/ATTRIBUTION.md).
