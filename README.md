# Paper Trails

Paper Trails is an interactive browser-based timeline of scientific history. It places scientists and their publications alongside major discoveries and wider historical events, making it easier to see how scientific ideas developed in context from 1600 to the present year.

The included dataset focuses mainly on physics, astronomy, mathematics, and related subjects.

## Features

- Scientist portraits linked to their first listed publication
- Colour-coded publication markers with titles and abstracts
- Discovery markers for experiments, particles, and milestones
- Duration bars for significant historical events
- Clickable detail dialogs for scientists, publications, discoveries, and events
- Hover highlighting that connects a scientist with their publications
- Mouse, touch, and slider controls for panning and zooming
- Adjustable timeline height
- Optional cartoon portraits
- Toggles for discoveries and historical events
- Light and dark themes, with the preference saved in the browser

## Running locally

There is no build step or package installation. The application uses native HTML, CSS, and JavaScript modules, with [js-yaml](https://github.com/nodeca/js-yaml) loaded from a CDN.

Because the application fetches YAML files at runtime, serve the repository over HTTP instead of opening `index.html` directly. For example, with Python 3:

```sh
python -m http.server 8000
```

Then open <http://localhost:8000>.

An internet connection is needed to load js-yaml from jsDelivr. The rest of the application is stored in this repository.

## Using the timeline

- Click and drag an empty part of the timeline to pan.
- Scroll to pan vertically, or hold Shift while scrolling to pan horizontally.
- Hold Ctrl while scrolling to zoom around the pointer, or use the zoom slider.
- On a touch device, drag with one finger and pinch with two fingers.
- Use the vertical slider on the right to change the timeline height.
- Click the reset button to restore the default zoom, position, and height.
- Click a portrait or marker to see more information.
- Use the Cartoons, Events, and Discoveries switches to change what is displayed.
- Use the moon/sun button to switch themes.

## Editing the content

Timeline content is kept in three YAML files:

- `data/scientists.yaml` contains biographical details, image paths, and publications.
- `data/discoveries.yaml` contains dated scientific discoveries and milestones.
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

Four affiliation rows deliberately omit `coat` and display the neutral icon:

- **Manchester Academy** — the historical dissenting academy where John Dalton taught has no distinct, reliably documented surviving mark. The modern Manchester music venue and the arms of a successor college are not equivalent.
- **Royal Engineering School of Mézières** — archival sources document the school, but no distinct school emblem suitable for reuse was found. The later Corps royal du génie insignia is not substituted.
- **Royal Institution** — its [copyright notice](https://www.rigb.org/copyright) says the institution's marks and logos may not be reproduced without prior permission.
- **SISSA** — the school publishes an official logo and seal, but [requires the Director's authorization for external use](https://www2.sissa.it/media-and-press/researchers-and-sissa-staff).

The full asset provenance, licence information, and institutional-use caveats are recorded in [`images/institutions/ATTRIBUTION.md`](images/institutions/ATTRIBUTION.md).

Discovery entries use `year`, `title`, `discoverer`, `details`, `particle`, and `color`. They can include `scientist_ids` for linked discoverers and `theorist_ids` for linked scientists whose theoretical prediction the event validates. Conference milestones in that file use `type: conference` instead of `discoverer` and can include `attendee_ids`, containing scientist keys from `data/scientists.yaml`; their detail cards list those attendees with links to their timeline nodes. Historical event entries use `title`, `shortTitle`, `startYear`, `endYear`, `details`, and `color`, and can also use `attendee_ids`. `shortTitle` is the compact timeline label used when the full event title does not fit its duration band; use a familiar abbreviation where one exists, or a short recognisable name otherwise.

Place portrait files under `images/` and cartoon variants under `images/cartoons/`. Missing scientist portraits fall back to a theme-appropriate default image.

The displayed date range and layout constants can be changed in `src/config.js`. The timeline starts at `START_YEAR` and automatically ends at the browser's current year.

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
|   |-- themeManager.js        Theme selection and image fallbacks
|   `-- timelineRenderer.js    Timeline element rendering
|-- data/                      Timeline content in YAML
`-- images/                    Photographic and cartoon portraits
```

## License

This project is released into the public domain under [The Unlicense](LICENSE). Third-party images retain the terms listed in [the portrait attribution file](images/ATTRIBUTION.md) and [institutional-emblem attribution file](images/institutions/ATTRIBUTION.md).
