# Paper Trails UI Refresh Plan

**Implementation status:** Completed on 17 August 2026.

## Goal

Turn the current timeline prototype into a cleaner, more professional, responsive interface without changing the underlying YAML content model or adding a build system.

## Design direction

- Use a restrained editorial/scientific visual style.
- Give controls, timeline content, and details a clear hierarchy.
- Keep the timeline as the focus of the page.
- Use consistent semantic styling for people, publications, discoveries, and historical context.
- Preserve light and dark themes.

## Phase 1: Application shell and controls

- Replace the centred title and floating control card with a structured application header.
- Add a concise subtitle describing the timeline range.
- Introduce a dedicated toolbar below the header.
- Replace emoji-only actions with consistent inline SVG icons and accessible labels.
- Replace the height slider with an automatic viewport-filling timeline.
- Add zoom-out, zoom-in, zoom percentage, fit-to-view, and reset-position actions.
- Turn visibility options into labelled filter buttons.
- Move portrait style and theme controls into a compact settings area on small screens.
- Add a collapsible mobile options panel.

## Phase 2: Timeline hierarchy

- Divide the timeline into predictable visual lanes:
  - People
  - Publications
  - Discoveries
  - Historical context
- Keep lane labels fixed while dated content pans.
- Add a visual legend that also acts as the filter control.
- Place scientist portraits consistently in the people lane.
- Keep publications on the main axis.
- Place discoveries in their own lane.
- Render historical events as quieter contextual bands.

## Phase 3: Scale and navigation

- Add a fit-to-view initial state and action.
- Make year tick density respond to zoom level.
- Show centuries when zoomed out and decades when zoomed in.
- Keep timeline labels and markers legible as the canvas scales.
- Fix invalid SVG transforms by applying numeric scale values from JavaScript.
- Add a compact interaction hint.

## Phase 4: Visual polish

- Adopt an editorial typography hierarchy using local system fonts.
- Introduce a restrained slate/blue design token palette for both themes.
- Reduce persistent scientist colour and line noise.
- Emphasize scientist colours during hover or selection.
- Prevent event titles from breaking inside words.
- Hide event titles when a band is too narrow and rely on its tooltip/details.
- Improve focus, hover, and selected states.
- Replace browser-default checkboxes and sliders with consistent controls.

## Phase 5: Details and accessibility

- Restyle dialogs with clearer title, metadata, and body hierarchy.
- Use proper dialog semantics and real close buttons.
- Use a desktop side panel for details and a mobile bottom sheet.
- Make timeline items keyboard focusable and operable.
- Add accessible names to all icon controls and timeline markers.
- Return focus when details close.
- Support Escape and backdrop dismissal.

## Phase 6: Responsive behaviour

- Keep the header compact on mobile.
- Put secondary options behind an Options button.
- Let the timeline fill the remaining viewport.
- Increase interactive hit targets while retaining compact visible markers.
- Keep lane labels readable on narrow screens.
- Show a short swipe/drag onboarding hint.

## Verification

- Load successfully over the existing static HTTP setup.
- Check the light and dark themes.
- Check desktop at approximately 1280×800 and 1440×900.
- Check mobile at approximately 390×844.
- Confirm fit, zoom, pan, filters, portrait style, theme, dialogs, and keyboard dismissal.
- Confirm there are no rendering errors in the browser console.
- Run `git diff --check`.

## Acceptance criteria

- The controls no longer overlap the title at any supported width.
- The timeline has visually distinct, labelled lanes.
- The initial view shows the full 1400-to-present range.
- Year labels adapt to the zoom level without overlapping excessively.
- Historical event labels do not break inside words.
- Mobile controls do not consume a large portion of the initial viewport.
- Timeline items expose clear hover, focus, and selected states.
- Details are presented as a desktop side panel and mobile bottom sheet.
- Both themes have consistent contrast and visual hierarchy.
- The browser console has no SVG transform or vertical-slider warnings.
