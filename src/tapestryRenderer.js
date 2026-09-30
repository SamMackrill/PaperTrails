import { recordKey } from './itemIdentity.js';
import { config } from './config.js?v=16';
import { tapestryScenes, getPanoramaStrip } from './tapestryScenes.js?v=pass2-folds';
import { selectClothStrip, layoutWeaveCloth, mapClothX, clothCameraLeft } from './tapestryFolds.js?v=pass2-continuous';
import { yearToX } from './timeScale.js?v=3';

const SVG_NS = 'http://www.w3.org/2000/svg';
// The strip along the top of the ribbon where captions are stitched.
const CAPTION_HEIGHT = 20;
export const THREAD_SPACING = 22;
export const TAPESTRY_ANNOTATION_WIDTH = 72;

const panoramas = new WeakMap();
const ribbonEntries = new WeakMap();
const weaveLayouts = new WeakMap();

function clothFace(model, className) {
  const face = document.createElement('span');
  face.className = `tapestry-cloth-face ${className}`;
  const art = document.createElementNS(SVG_NS, 'svg');
  art.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  art.setAttribute('aria-hidden', 'true');
  const image = document.createElementNS(SVG_NS, 'image');
  image.addEventListener('error', () => {
    if (model.original) return;
    model.original = true;
    model.button.dataset.artFallback = 'original';
    updatePanorama(model);
    model.onArtworkChange?.();
  });
  art.appendChild(image);
  face.appendChild(art);
  model.cloth.appendChild(face);
  return { face, art, image };
}

function updateFace(part, strip, x, width, displayedWidth, left) {
  part.face.style.transform = `translateX(${left}px)`;
  part.face.style.width = `${displayedWidth}px`;
  const viewBox = `${x} ${strip.y} ${width} ${strip.height}`;
  if (part.art.getAttribute('viewBox') !== viewBox) part.art.setAttribute('viewBox', viewBox);
  // Setting the same source repeatedly can restart a pending SVG image load.
  if (part.image.getAttribute('href') !== strip.atlas.file) {
    part.image.setAttribute('href', strip.atlas.file);
    part.image.setAttribute('width', strip.atlas.width);
    part.image.setAttribute('height', strip.atlas.height);
  }
}

function updatePanorama(model) {
  const { button, scene, overviewShare, scale, artHeight, heading } = model;
  const strip = selectClothStrip(getPanoramaStrip(scene, model.original));
  model.facets = strip.facets;
  const pose = layoutWeaveCloth(strip, overviewShare, artHeight, scale, config.MAX_SCALE);
  model.pose = pose;
  model.cloth.style.width = `${pose.width}px`;
  button.style.setProperty('--tapestry-bleed', '0px');
  button.dataset.facetCount = strip.facets.length;
  button.dataset.foldOpen = pose.openness.toFixed(4);
  updateFace(model.overview, strip, 0, strip.edges[1], pose.overviewWidth, 0);
  model.panels.forEach((part, index) => { part.face.hidden = index >= pose.panels.length; });
  pose.panels.forEach((panel, index) => {
    const part = model.panels[index];
    updateFace(part, strip, panel.sourceX, panel.sourceWidth, panel.width, panel.left);
    part.face.style.transform = `translateX(${panel.left}px) translateZ(${panel.depth}px) rotateY(${panel.angle}deg)`;
    part.face.style.setProperty('--fold-shade', String(panel.shade));
  });
  strip.facets.forEach((facet, index) => {
    const hotspot = model.hotspots[index];
    hotspot.dataset.tooltip = `${heading}\nIn the embroidery: ${facet}.\nSelect for details.`;
  });
  positionCloth(model);
  button.dataset.tooltip = `${heading}\nIn the embroidery: ${strip.facets.join('; ')}.\nZoom in to unfold the cloth.`;
}

function renderPanorama(button, scene, overviewShare, scale, artHeight, heading, onArtworkChange) {
  let model = panoramas.get(button);
  if (!model) {
    const cloth = document.createElement('span');
    cloth.className = 'tapestry-art tapestry-cloth';
    cloth.setAttribute('aria-hidden', 'true');
    model = { button, cloth, scene, original: false, panels: [], hotspots: [] };
    model.overview = clothFace(model, 'tapestry-overview-face');
    for (let i = 0; i < (scene.facets.length - 1) * 2; i++) {
      model.panels.push(clothFace(model, i % 2 ? 'is-return-face' : 'is-front-face'));
    }
    button.insertBefore(cloth, button.querySelector('.tapestry-date-stitch'));
    scene.facets.forEach(() => {
      const hotspot = document.createElement('span');
      hotspot.className = 'tapestry-facet';
      hotspot.dataset.tooltipAnchor = 'scene';
      hotspot.setAttribute('aria-hidden', 'true');
      model.hotspots.push(hotspot);
      button.appendChild(hotspot);
    });
    button.dataset.tooltipAnchor = 'scene';
    panoramas.set(button, model);
  }
  Object.assign(model, { scene, overviewShare, scale, artHeight, heading, onArtworkChange });
  updatePanorama(model);
  return model.facets;
}

function sceneEntry(event, onSelect) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'tapestry-scene';
  const caption = document.createElement('span');
  caption.className = 'tapestry-caption';
  caption.setAttribute('aria-hidden', 'true');
  const thread = document.createElement('span');
  thread.className = 'tapestry-thread';
  thread.setAttribute('aria-hidden', 'true');
  const intervalLabel = document.createElement('span');
  intervalLabel.className = 'tapestry-interval-label';
  thread.appendChild(intervalLabel);
  const stitch = document.createElement('span');
  stitch.className = 'tapestry-date-stitch';
  stitch.setAttribute('aria-hidden', 'true');
  button.appendChild(stitch);
  const entry = { button, caption, thread, intervalLabel, stitch, event, onSelect };
  button.addEventListener('pointerenter', () => thread.classList.add('is-highlighted'));
  button.addEventListener('pointerleave', () => thread.classList.remove('is-highlighted'));
  button.addEventListener('focus', () => thread.classList.add('is-highlighted'));
  button.addEventListener('blur', () => thread.classList.remove('is-highlighted'));
  button.addEventListener('click', () => entry.onSelect(button, entry.event));
  return entry;
}

export function layoutTapestry(events, width, annotationWidth = 0) {
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
      laneEnds[lane] = Math.max(anchor + 2, end, Math.min(width, anchor + annotationWidth));
      return { event, anchor, end, left, lane, sceneWidth };
    });
  return { items, lanes: Math.max(1, laneEnds.length) };
}

export function renderTapestry(timeline, events, width, height, top, scale, onSelect) {
  const ribbon = timeline.querySelector('.tapestry-ribbon') || document.createElement('div');
  ribbon.className = 'tapestry-ribbon';
  const previous = ribbonEntries.get(ribbon) || new Map();
  const next = new Map();
  const nodes = [];
  const weaveNodes = [];
  const weave = ribbon.querySelector('.tapestry-weave') || document.createElement('div');
  weave.className = 'tapestry-weave';
  ribbon.setAttribute('role', 'group');
  ribbon.setAttribute('aria-label', 'Historical tapestry. Zoom opens and closes folds of the same illustrated cloth. Pictures form a continuous illustration, not event durations. Dated lines below show the recorded start and end of each event; diamonds mark single-year events.');
  ribbon.style.top = `${top + 5}px`;
  ribbon.style.width = `${width}px`;
  const { items, lanes } = layoutTapestry(events, width, TAPESTRY_ANNOTATION_WIDTH);
  const viewportWidth = timeline.parentElement?.clientWidth || width / Math.max(1, scale);
  const availableHeight = height - top - 12;
  // Reserve the overview annotation lanes throughout zoom: changing the number
  // of date rows must not suddenly change figure scale or the angle of a pleat.
  const ribbonHeight = Math.max(60, Math.min(availableHeight, 300));
  ribbon.style.height = `${ribbonHeight}px`;
  const overviewLanes = layoutTapestry(events, timeline.parentElement?.clientWidth || width,
    TAPESTRY_ANNOTATION_WIDTH).lanes;
  const artHeight = Math.max(24, ribbonHeight - CAPTION_HEIGHT - 14 - Math.max(lanes, overviewLanes) * THREAD_SPACING);
  const overviewShare = viewportWidth / Math.max(1, items.length);
  const wovenScenes = [];
  let clothLeft = 0;
  ribbon.dataset.zoomLimit = String(config.MAX_SCALE);

  items.forEach(({ event, anchor, end, lane }) => {
    const date = event.startYear === event.endYear ? `${event.startYear}` : `${event.startYear}–${event.endYear}`;
    const heading = `${event.title} · ${date}`;
    const key = recordKey('event', event, `event:${events.indexOf(event)}`);
    const entry = previous.get(key) || sceneEntry(event, onSelect);
    entry.event = event;
    entry.onSelect = onSelect;
    const { button, caption, thread, intervalLabel, stitch } = entry;
    next.set(key, entry);
    button.dataset.itemKey = key;
    button.dataset.tooltip = heading;
    button.dataset.startYear = event.startYear;
    button.dataset.endYear = event.endYear;
    button.style.top = `${CAPTION_HEIGHT + 4}px`;
    button.style.height = `${artHeight}px`;
    const scene = tapestryScenes.get(event.title);
    const facets = scene ? renderPanorama(button, scene, overviewShare, scale, artHeight, heading, () =>
      renderTapestry(timeline, events, width, height, top, scale, onSelect)) : [];
    const sceneWidth = panoramas.get(button)?.pose.width ?? overviewShare;
    const left = clothLeft;
    button.style.left = `${left}px`;
    button.style.width = `${sceneWidth}px`;
    wovenScenes.push({ anchor, left, width: sceneWidth });
    clothLeft += sceneWidth;
    button.setAttribute('aria-label', `${heading}. ${event.details || ''}${facets.length ? ` In the embroidery: ${facets.join('; ')}.` : ''}`);
    // Captions are stitched into the linen above each scene, in the manner
    // of the Bayeux Tapestry's inscriptions.
    caption.textContent = `${scale < 1.5 ? (event.shortTitle || event.title) : event.title} · ${date}`;
    caption.dataset.sceneLeft = String(left);
    caption.dataset.sceneWidth = String(sceneWidth);
    caption.style.left = `${left + 4}px`;
    caption.style.maxWidth = `${Math.max(0, sceneWidth - 8)}px`;
    // Scenes too narrow for a legible caption rely on their tooltip.
    caption.hidden = sceneWidth < 52;
    weaveNodes.push(caption);
    if (!scene && !button.querySelector('.tapestry-fallback')) {
      // Future database entries remain discoverable even before art is commissioned.
      const fallback = document.createElement('span');
      fallback.className = 'tapestry-fallback';
      fallback.textContent = event.shortTitle || event.title;
      button.appendChild(fallback);
    }
    thread.classList.toggle('is-point', event.startYear === event.endYear);
    thread.dataset.startYear = String(event.startYear);
    intervalLabel.textContent = date;
    thread.style.left = `${anchor}px`;
    thread.style.top = `${CAPTION_HEIGHT + 8 + artHeight + lane * THREAD_SPACING}px`;
    thread.dataset.tooltip = heading;
    thread.dataset.endYear = String(event.endYear);
    thread.style.setProperty('--thread-color', ['#854635', '#425c61', '#626539', '#694c67'][lane % 4]);
    thread.style.width = `${Math.max(2, end - anchor)}px`;
    thread.setAttribute('aria-hidden', 'true');
    stitch.style.left = '0px';
    nodes.push(thread);
    weaveNodes.push(button);
  });
  // One continuous strip owns every picture. Keep its faces connected, and
  // stitch each scene directly to the end of the preceding projected cloth.
  const retain = (parent, children) => {
    const keep = new Set(children);
    for (const child of [...parent.children]) if (!keep.has(child)) child.remove();
    children.forEach((node, index) => {
      if (parent.children[index] !== node) parent.insertBefore(node, parent.children[index] || null);
    });
  };
  retain(weave, weaveNodes);
  weave.style.width = `${clothLeft}px`;
  nodes.push(weave);
  retain(ribbon, nodes);
  weaveLayouts.set(ribbon, { weave, scenes: wovenScenes, timeWidth: width, clothWidth: clothLeft });
  ribbonEntries.set(ribbon, next);
  timeline.appendChild(ribbon);
  updateTapestryCaptions(timeline, timeline.parentElement);

}

function positionCloth(model) {
  model.cloth.style.left = '0px';
  model.hotspots.forEach((hotspot, index) => {
    const area = model.pose.facets[index];
    if (!area) { hotspot.hidden = true; return; }
    const left = area.left;
    const right = area.left + area.width;
    hotspot.hidden = right - left < 12;
    hotspot.style.left = `${left}px`;
    hotspot.style.width = `${Math.max(0, right - left)}px`;
  });
}

// Keeps each caption inside the visible part of its scene while panning.
export function updateTapestryCaptions(timeline, timelineContainer) {
  const ribbon = timeline.querySelector('.tapestry-ribbon');
  if (!ribbon) return;
  const viewport = timelineContainer.getBoundingClientRect();
  const ribbonLeft = ribbon.getBoundingClientRect().left;
  const layout = weaveLayouts.get(ribbon);
  if (!layout) return;
  const centre = viewport.left + viewport.width / 2 - ribbonLeft;
  const mappedCentre = mapClothX(centre, layout.scenes, layout.timeWidth, layout.clothWidth);
  const screenLeft = clothCameraLeft(mappedCentre, layout.clothWidth, viewport.width);
  const weaveLeft = viewport.left + screenLeft;
  const cameraOffset = weaveLeft - ribbonLeft;
  // Read every caption before moving any of them. A read after each write
  // otherwise forces a fresh layout of all SVG cloth faces for each caption.
  const positions = [...ribbon.querySelectorAll('.tapestry-caption')].map((caption) => {
    const sceneLeft = Number(caption.dataset.sceneLeft);
    const sceneRight = sceneLeft + Number(caption.dataset.sceneWidth);
    const visibleLeft = Math.max(sceneLeft, viewport.left - weaveLeft);
    const captionWidth = caption.offsetWidth;
    const left = Math.min(visibleLeft + 4, sceneRight - captionWidth - 4);
    return { caption, left: Math.max(sceneLeft + 4, left) };
  });
  positions.forEach(({ caption, left }) => { caption.style.left = `${left}px`; });
  layout.weave.style.transform = `translateX(${cameraOffset}px)`;
}
