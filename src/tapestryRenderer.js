import { config } from './config.js?v=15';
import { tapestryScenes, getPanoramaCrop } from './tapestryScenes.js?v=4';
import { yearToX } from './timeScale.js?v=2';

const SVG_NS = 'http://www.w3.org/2000/svg';
// The strip along the top of the ribbon where captions are stitched.
const CAPTION_HEIGHT = 20;
const THREAD_SPACING = 6;

function renderPanorama(button, scene, sceneWidth, artHeight, scale, heading) {
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
    // A short caption anchored to the scene, not a paragraph that follows
    // each facet around.
    hotspot.dataset.tooltip = `${heading}\nIn the embroidery: ${facet}.\nSelect for details.`;
    hotspot.dataset.tooltipAnchor = 'scene';
    hotspot.setAttribute('aria-hidden', 'true');
    button.appendChild(hotspot);
  });
  button.dataset.tooltip = `${heading}\nIn the embroidery: ${crop.facets.join('; ')}.`;
  button.dataset.tooltipAnchor = 'scene';
  return crop.facets;
}

export function layoutTapestry(events, width) {
  const x = (year) => yearToX(year, width);
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
  // The ribbon fills its lane. Extra horizontal room goes to new narrative
  // groups rather than simply magnifying the same image.
  const ribbonHeight = Math.max(60, Math.min(availableHeight, 260));
  ribbon.style.height = `${ribbonHeight}px`;
  const artHeight = Math.max(24, ribbonHeight - CAPTION_HEIGHT - 14 - lanes * THREAD_SPACING);

  items.forEach(({ event, anchor, end, left, lane, sceneWidth }) => {
    const date = event.startYear === event.endYear ? `${event.startYear}` : `${event.startYear}–${event.endYear}`;
    const heading = `${event.title} · ${date}`;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tapestry-scene';
    button.dataset.itemKey = `event:${events.indexOf(event)}`;
    button.dataset.tooltip = heading;
    button.dataset.startYear = event.startYear;
    button.dataset.endYear = event.endYear;
    button.style.left = `${left}px`;
    button.style.top = `${CAPTION_HEIGHT + 4}px`;
    button.style.width = `${sceneWidth}px`;
    button.style.height = `${artHeight}px`;
    const scene = tapestryScenes.get(event.title);
    const facets = scene ? renderPanorama(button, scene, sceneWidth, artHeight, scale, heading) : [];
    button.setAttribute('aria-label', `${heading}. ${event.details || ''}${facets.length ? ` In the embroidery: ${facets.join('; ')}.` : ''}`);
    // Captions are stitched into the linen above each scene, in the manner
    // of the Bayeux Tapestry's inscriptions.
    const caption = document.createElement('span');
    caption.className = 'tapestry-caption';
    caption.textContent = `${scale < 1.5 ? (event.shortTitle || event.title) : event.title} · ${event.startYear}`;
    caption.dataset.sceneLeft = String(left);
    caption.dataset.sceneWidth = String(sceneWidth);
    caption.style.left = `${left + 4}px`;
    caption.style.maxWidth = `${Math.max(0, sceneWidth - 8)}px`;
    caption.setAttribute('aria-hidden', 'true');
    // Scenes too narrow for a legible caption rely on their tooltip.
    if (sceneWidth >= 52) ribbon.appendChild(caption);
    if (!scene) {
      // Future database entries remain discoverable even before art is commissioned.
      const fallback = document.createElement('span');
      fallback.className = 'tapestry-fallback';
      fallback.textContent = event.shortTitle || event.title;
      button.appendChild(fallback);
    }
    const thread = document.createElement('span');
    thread.className = 'tapestry-thread';
    thread.style.left = `${anchor}px`;
    thread.style.top = `${CAPTION_HEIGHT + 8 + artHeight + lane * THREAD_SPACING}px`;
    thread.dataset.tooltip = heading;
    thread.dataset.endYear = String(event.endYear);
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

// Keeps each caption inside the visible part of its scene while panning.
export function updateTapestryCaptions(timeline, timelineContainer) {
  const ribbon = timeline.querySelector('.tapestry-ribbon');
  if (!ribbon) return;
  const viewport = timelineContainer.getBoundingClientRect();
  const ribbonLeft = ribbon.getBoundingClientRect().left;
  ribbon.querySelectorAll('.tapestry-caption').forEach((caption) => {
    const sceneLeft = Number(caption.dataset.sceneLeft);
    const sceneRight = sceneLeft + Number(caption.dataset.sceneWidth);
    const visibleLeft = Math.max(sceneLeft, viewport.left - ribbonLeft);
    const captionWidth = caption.offsetWidth;
    const left = Math.min(visibleLeft + 4, sceneRight - captionWidth - 4);
    caption.style.left = `${Math.max(sceneLeft + 4, left)}px`;
  });
}
