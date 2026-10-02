import { config } from './config.js?v=16';
import { yearToX } from './timeScale.js?v=3';
import { tapestryScenes, getPanoramaStrip } from './tapestryScenes.js?v=pass2-bayeux-art-v1';

// These are representative subjects, not extra events or invented date spans.
// Short events get a readable vignette whose dated anchor remains exact.
export const storyFocus = new Map([
  ["Thirty Years' War", 2], ["The Seven Years' War", 2],
  ['Reign of Napoleon', 0], ['industry-steam', 0],
  ['World War I', 0], ['World War II', 0], ['Cold War', 3],
  ['Carrington Event', 2], ['telegraph-networks', 2]
]);

function motifCrop(strip, facet) {
  const left = strip.edges[facet], right = strip.edges[facet + 1];
  // Atlas row starts contain the border. The continuous border is drawn once
  // above and below the story, rather than cut into every individual motif.
  const inset = Math.min(26, strip.height * .22);
  return { ...strip, x: strip.x + left, width: right - left,
    y: strip.y + inset, height: strip.height - inset };
}

export function layoutStory(events, width, height) {
  const subjects = [], records = [];
  for (const event of events) {
    if (!Number.isFinite(event.startYear) || !Number.isFinite(event.endYear)
      || event.endYear < event.startYear || event.endYear < config.START_YEAR
      || event.startYear > config.END_YEAR) continue;
    const anchor = Math.max(0, yearToX(event.startYear, width));
    const end = Math.min(width, yearToX(event.endYear, width));
    const winterSources = event.title === 'The Little Ice Age'
      ? tapestryScenes.get(event.title)?.continuationSources : null;
    const chapters = winterSources?.map(source => ({ ...source, id: source.scene }))
      || (event.chapters?.length ? event.chapters : [{
      id: event.id || event.title, startYear: event.startYear,
      endYear: event.endYear, scene: event.title
    }]);
    const record = { event, anchor, end, subjects: [] };
    records.push(record);
    for (const chapter of chapters) {
      let key = chapter.scene || event.title;
      // Operators and wires remain part of the network after 1850, alongside
      // cable laying. This uses its already-approved general network source.
      if (event.title === 'Electric telegraph networks') key = 'telegraph-networks';
      const scene = tapestryScenes.get(key);
      if (!scene) continue;
      const strip = getPanoramaStrip(scene, false, 'tapestry');
      const first = Math.max(anchor, yearToX(chapter.startYear, width));
      const last = Math.min(end, yearToX(chapter.endYear, width));
      const climate = event.title === 'The Little Ice Age';
      const count = Math.min(strip.edges.length - 1, Math.max(1, Math.floor((last - first) / 145)));
      const focus = Math.min(strip.edges.length - 2, storyFocus.get(key) ?? 0);
      const facets = [focus, ...Array.from({ length: strip.edges.length - 1 }, (_, i) => i).filter(i => i !== focus)]
        .slice(0, count).sort((a, b) => a - b);
      facets.forEach((facet, i) => {
        const crop = motifCrop(strip, facet);
        const h = height * (climate ? .40 : .72);
        const naturalWidth = crop.width * h / crop.height;
        // Keep complete identifying objects at overview, then expose each
        // approved action group as the event gets more chronological room.
        const displayWidth = Math.min(naturalWidth, Math.max(climate ? 115 : storyFocus.has(key) ? 210 : 105, (last - first) / count));
        const scale = Math.min(h / crop.height, displayWidth / crop.width);
        const drawnWidth = crop.width * scale, drawnHeight = crop.height * scale;
        const center = first + (last > first ? (i + .5) * (last - first) / count : 0);
        const left = Math.max(0, Math.min(width - drawnWidth, center - drawnWidth / 2));
        const subject = { key: `${event.id || event.title}/${chapter.id}/${facet}`, event,
          chapter, facet, crop, left, width: drawnWidth, height: drawnHeight,
          top: climate ? Math.min(height - drawnHeight, height * .4) : height - drawnHeight,
          anchor, end, climate, focus: facet === focus,
          priority: (storyFocus.has(key) ? 2 : 1) + (climate ? -1 : 0) };
        subjects.push(subject); record.subjects.push(subject);
      });
    }
  }
  // Climate occupies a separate baseline behind foreground figures. Nearby stories
  // weave into the same strip through different baselines, not opaque spans.
  const occupied = [];
  for (const subject of [...subjects].sort((a, b) => b.priority - a.priority || a.left - b.left)) {
    if (subject.climate) continue;
    const overlaps = occupied.filter(p => subject.left < p.left + p.width - 8 && subject.left + subject.width > p.left + 8);
    if (overlaps.length) subject.top = 0;
    occupied.push(subject);
  }
  return { records, subjects: subjects.sort((a, b) => a.priority - b.priority || a.left - b.left) };
}
