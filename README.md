# Paper Trails

Paper Trails is an interactive browser-based timeline of scientific history. It places scientists and their publications alongside major discoveries and wider historical events, making it easier to see how scientific ideas developed in context from 1600 to the present year.

The included dataset focuses mainly on physics, astronomy, mathematics, and related subjects. It currently contains 56 scientists, 90 publications, 14 discoveries, and 15 historical events.

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
  publications:
    - year: 1930
      title: "Example Paper"
      abstract: "A short description of the work."
```

Discovery entries use `year`, `title`, `discoverer`, `details`, `particle`, and `color`. Historical event entries use `title`, `startYear`, `endYear`, `details`, and `color`.

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

This project is released into the public domain under [The Unlicense](LICENSE).
