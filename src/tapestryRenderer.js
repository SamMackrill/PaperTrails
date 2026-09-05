import { config } from './config.js?v=14';
import { tapestryScenes, getPanoramaCrop } from './tapestryScenes.js?v=2';

const SVG_NS = 'http://www.w3.org/2000/svg';

function renderPanorama(button, scene, sceneWidth, artHeight, scale, explanation) {
  const bleed = Math.min(18, sceneWidth / 4);
  const crop = getPanoramaCrop(scene, sceneWidth + bleed * 2, artHeight, scale);
  button.dataset.facetCount = crop.facets.length;
  button.style.setProperty('--tapestry-bleed', `${bleed}px`);

  const art = document.createElementNS(SVG_NS, 'svg');
  art.classList.add('tapestry-art');
  art.setAttribute('viewBox', `0 ${crop.y} ${crop.width} ${crop.height}`);
  art.setAttribute('preserveAspectRatio', crop.facets.length === 1 ? 'xMidYMid slice' : 'xMinYMid slice');
  art.setAttribute('aria-hidden', 'true');
  const image = document.createElementNS(SVG_NS, 'image');
  image.setAttribute('href', crop.atlas.file);
  image.setAttribute('width', crop.atlas.width);
  image.setAttribute('height', crop.atlas.height);
  art.appendChild(image);
  button.appendChild(art);

  // Only the invisible hover regions divide the panorama into facets. All
  // facets open the same database event, with its original dates and details.
  const drawingScale = Math.max((sceneWidth + bleed * 2) / crop.width, artHeight / crop.height);
  const drawingOffset = crop.facets.length === 1 ? (sceneWidth + bleed * 2 - crop.width * drawingScale) / 2 - bleed : -bleed;
  crop.facets.forEach((facet, index) => {
    const left = Math.max(0, crop.edges[index] * drawingScale + drawingOffset);
    const right = Math.min(sceneWidth, crop.edges[index + 1] * drawingScale + drawingOffset);
    if (right <= left) return;
    const hotspot = document.createElement('span');
    hotspot.className = 'tapestry-facet';
    hotspot.style.left = `${left}px`;
    hotspot.style.width = `${right - left}px`;
    hotspot.dataset.tooltip = `${explanation}\nIn the embroidery: ${facet}.`;
    hotspot.setAttribute('aria-hidden', 'true');
    button.appendChild(hotspot);
  });
  button.dataset.tooltip = `${explanation}\nIn the embroidery: ${crop.facets.join('; ')}.`;
  button.setAttribute('aria-label', button.dataset.tooltip);
}

export function layoutTapestry(events, width) {
  const x = (year) => (year - config.START_YEAR) / config.YEAR_SPAN * width;
  const laneEnds = [];
  const items = events.filter((event) => Number.isFinite(event.startYear)
    && Number.isFinite(event.endYear) && event.endYear >= event.startYear
    && event.endYear >= config.START_YEAR && event.startYear <= config.END_YEAR)
    .sort((a, b) => a.startYear - b.startYear || a.endYear - b.endYear)
    .map((event, index, sorted) => {
      const anchor = Math.max(0, Math.min(width, x(event.startYear)));
      const end = Math.max(anchor, Math.min(width, x(event.endYear)));
      const left = anchor;
      const nextStart = sorted[index + 1]?.startYear ?? config.END_YEAR;
      const sceneWidth = Math.max(2, Math.min(width, x(nextStart)) - left);
      let lane = laneEnds.findIndex((right) => right <= anchor);
      if (lane < 0) lane = laneEnds.length;
      laneEnds[lane] = Math.max(anchor + 2, end);
      return { event, anchor, end, left, lane, sceneWidth };
    });
  return { items, lanes: Math.max(1, laneEnds.length) };
}

export function renderTapestry(timeline, events, width, height, top, scale, onSelect) {
  const ribbon = document.createElement('div');
  ribbon.className = 'tapestry-ribbon';
  ribbon.setAttribute('role', 'group');
  ribbon.setAttribute('aria-label', 'Historical tapestry. Scenes mark event beginnings; stitched threads show their durations. Zoom in to reveal additional narrative scenes, and hover to explore their details.');
  ribbon.style.top = `${top + 5}px`;
  ribbon.style.width = `${width}px`;
  const { items, lanes } = layoutTapestry(events, width);
  const availableHeight = height - top - 12;
  // Extra horizontal room goes to new narrative groups, with little change
  // in figure size, instead of simply magnifying the same image.
  const ribbonHeight = Math.min(availableHeight, 148 + Math.min(20, (scale - 1) * 5));
  ribbon.style.height = `${ribbonHeight}px`;
  const artHeight = Math.max(24, ribbonHeight - 22 - lanes * 4);

  items.forEach(({ event, anchor, end, left, lane, sceneWidth }) => {
    const date = event.startYear === event.endYear ? `${event.startYear}` : `${event.startYear}–${event.endYear}`;
    const explanation = `${event.title} · ${date}. ${event.details || ''}`;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tapestry-scene';
    button.dataset.tooltip = explanation;
    button.dataset.startYear = event.startYear;
    button.dataset.endYear = event.endYear;
    button.setAttribute('aria-label', explanation);
    button.style.left = `${left}px`;
    button.style.top = '10px';
    button.style.width = `${sceneWidth}px`;
    button.style.height = `${artHeight}px`;
    const scene = tapestryScenes.get(event.title);
    if (scene) {
      renderPanorama(button, scene, sceneWidth, artHeight, scale, explanation);
    } else {
      // Future database entries remain discoverable even before art is commissioned.
      const fallback = document.createElement('span');
      fallback.className = 'tapestry-fallback';
      fallback.textContent = event.shortTitle || event.title;
      button.appendChild(fallback);
    }
    const thread = document.createElement('span');
    thread.className = 'tapestry-thread';
    thread.style.left = `${anchor}px`;
    thread.style.top = `${12 + artHeight + lane * 4}px`;
    thread.dataset.tooltip = explanation;
    thread.style.setProperty('--thread-color', ['#854635', '#425c61', '#626539', '#694c67'][lane % 4]);
    thread.style.width = `${Math.max(2, end - anchor)}px`;
    thread.setAttribute('aria-hidden', 'true');
    ribbon.appendChild(thread);
    button.addEventListener('pointerenter', () => thread.classList.add('is-highlighted'));
    button.addEventListener('pointerleave', () => thread.classList.remove('is-highlighted'));
    button.addEventListener('focus', () => thread.classList.add('is-highlighted'));
    button.addEventListener('blur', () => thread.classList.remove('is-highlighted'));
    const stitch = document.createElement('span');
    stitch.className = 'tapestry-date-stitch';
    stitch.style.left = `${anchor - left}px`;
    stitch.setAttribute('aria-hidden', 'true');
    button.appendChild(stitch);
    button.addEventListener('click', () => onSelect(button, event));
    ribbon.appendChild(button);
  });
  timeline.appendChild(ribbon);
}
