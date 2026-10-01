import { recordKey } from './itemIdentity.js';
import { config } from './config.js?v=16';
import { layoutPleats, projectClothX, clothCells } from './clothPleats.js?v=pass2-chapters-v2';
import { rasterizeCloth } from './clothRaster.js?v=pass2-chapters-v2';
import { composePictures, quietLandscape, quietAtlas, quietPictures, joinWidth } from './clothComposition.js?v=pass2-chapters-v2';
import { contextDate } from './contextModel.js?v=pass2-chapters-v2';
import { yearToX } from './timeScale.js?v=3';

const SVG_NS = 'http://www.w3.org/2000/svg';
const BRAID_PITCH = 5;
const CAPTION_HEIGHT = 20;
const ART_HEIGHT = 128;
const models = new WeakMap();
let ribbonSerial = 0;
let captionMeasure;

function attribute(node, name, value) {
  if (node.getAttribute(name) !== String(value)) node.setAttribute(name, value);
}

function svg(tag, attributes = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
  return node;
}

// Periods use their recorded interval. A point gets a small one-year pictorial
// slot, but its braid remains a knot at the exact year, never a fabricated span.
export function layoutTapestry(events, width) {
  const laneEnds = [];
  const items = events.filter(event => Number.isFinite(event.startYear)
    && Number.isFinite(event.endYear) && event.endYear >= event.startYear
    && event.endYear >= config.START_YEAR && event.startYear <= config.END_YEAR)
    .sort((a, b) => a.startYear - b.startYear || a.endYear - b.endYear)
    .map(event => {
      const anchor = Math.max(0, Math.min(width, yearToX(event.startYear, width)));
      const end = Math.max(anchor, Math.min(width, yearToX(event.endYear, width)));
      const pictureEnd = event.startYear === event.endYear
        ? Math.min(width, yearToX(event.startYear + 1, width)) : end;
      let lane = laneEnds.findIndex(right => right <= event.startYear);
      if (lane < 0) lane = laneEnds.length;
      laneEnds[lane] = event.endYear + (event.startYear === event.endYear ? 0.0001 : 0);
      return { event, anchor, end, left: anchor, sceneWidth: Math.max(0, pictureEnd - anchor), lane };
    });
  return { items, lanes: Math.max(1, laneEnds.length) };
}

function makeModel(ribbon) {
  const id = `woven-cloth-${++ribbonSerial}`;
  const definitions = svg('svg', { class: 'tapestry-definitions', 'aria-hidden': 'true' });
  const defs = svg('defs');
  const material = svg('g', { id });
  const background = svg('rect', { fill: '#dfcda5' });
  material.appendChild(background);
  // Quiet woven scenery connects intervals without extending an event's art.
  // It has no people, dates or historical claims, and never changes with zoom.
  const landscape = svg('g');
  material.appendChild(landscape);
  const artLayer = svg('g');
  const braidLayer = svg('g');
  material.append(artLayer);
  const annotations = svg('svg', { class: 'tapestry-braids', 'aria-hidden': 'true' });
  annotations.appendChild(braidLayer);
  defs.appendChild(material);
  definitions.appendChild(defs);
  const weave = document.createElement('div');
  weave.className = 'tapestry-weave tapestry-cloth';
  weave.setAttribute('aria-hidden', 'true');
  ribbon.append(definitions, weave, annotations);
  const model = { id, defs, background, landscape, artLayer, braidLayer, annotations, weave, faces: [], cells: [], entries: new Map(), entrySerial: 0 };
  models.set(ribbon, model);
  return model;
}

function retainFaces(model, pose, clothHeight) {
  pose.cells.forEach((panel, i) => {
    let cell = model.cells[i];
    if (!cell) {
      cell = document.createElement('span');
      cell.className = 'tapestry-fold-cell';
      model.weave.appendChild(cell);
      model.cells[i] = cell;
    }
    cell.style.left = `${panel.left}px`;
    cell.style.width = `${panel.width}px`;
    cell.style.height = `${clothHeight}px`;
    cell.style.setProperty('--fold-shade', String(1 - pose.ratio));
  });
  while (model.cells.length > pose.cells.length) model.cells.pop().remove();
  pose.faces.forEach((panel, i) => {
    let nodes = model.faces[i];
    if (!nodes) {
      const face = document.createElement('span');
      face.className = 'tapestry-cloth-face';
      const art = svg('svg', { preserveAspectRatio: 'none' });
      art.appendChild(svg('use', { href: `#${model.id}` }));
      face.appendChild(art);
      model.faces[i] = nodes = { face, art };
    }
    const { face, art } = nodes;
    if (face.parentElement !== model.cells[panel.cellIndex]) model.cells[panel.cellIndex].appendChild(face);
    face.dataset.summary = String(panel.summary);
    face.dataset.exposedWidth = String(panel.exposedWidth);
    face.style.width = `${panel.sourceWidth}px`;
    face.style.height = `${clothHeight}px`;
    face.style.transform = `translateX(${panel.left}px)`;
    face.style.zIndex = String(panel.order);
    face.style.setProperty('--fold-shade', String(panel.shade));
    attribute(art, 'viewBox', `${panel.sourceX} 0 ${panel.sourceWidth} ${clothHeight}`);
  });
  while (model.faces.length > pose.faces.length) model.faces.pop().face.remove();
}

function installTexture(model, texture, clothHeight) {
  model.faces.forEach(({ face, art }, index) => {
    const { sourceX, sourceWidth } = model.pose.faces[index];
    const first = Math.floor(sourceX / texture.chunkWidth);
    const last = Math.min(texture.urls.length - 1, Math.ceil((sourceX + sourceWidth) / texture.chunkWidth) - 1);
    const chunks = Array.from({ length: last - first + 1 }, (_, i) => first + i);
    face.style.backgroundImage = chunks.map(i => `url("${texture.urls[i]}")`).join(',');
    face.style.backgroundSize = `${texture.chunkWidth}px ${clothHeight}px`;
    face.style.backgroundPosition = chunks.map(i => `${i * texture.chunkWidth - sourceX}px 0px`).join(',');
    face.style.backgroundRepeat = 'no-repeat';
    art.style.display = 'none';
  });
}

function sourceCrop(strip, left, origin, width, artHeight) {
  const scale = artHeight / strip.height;
  const crop = svg('svg', { x: left, width, height: artHeight,
    viewBox: `${(strip.x || 0) + (left - origin) / scale} ${strip.y} ${width / scale} ${strip.height}` });
  const image = svg('image', { href: strip.atlas.file, width: strip.atlas.width, height: strip.atlas.height });
  crop.appendChild(image);
  return { crop, image };
}

function joinOverlay(group, left, right, top, artHeight) {
  // SVG <use> mask support varies across browsers. Small linen-colour thread
  // bands provide a bounded fallback join without hiding the referenced art.
  const fade = joinWidth(right - left), steps = 24, step = fade / steps;
  for (let i = 0; i < steps; i++) for (const x of [left + i * step, right - (i + 1) * step]) {
    group.appendChild(svg('rect', { x, y: top, width: step + .02, height: artHeight,
      fill: '#dfcda5', opacity: 1 - (i + .5) / steps }));
  }
}

function renderSourceMaterial(model, pictures, width, top, artHeight) {
  model.landscape.replaceChildren();
  attribute(model.landscape, 'transform', `translate(0 ${top})`);
  for (const { d, stroke, strokeWidth, opacity, fill } of quietLandscape(width, artHeight)) {
    model.landscape.appendChild(svg('path', { d, stroke, 'stroke-width': strokeWidth, opacity, fill }));
  }
  for (const quiet of quietPictures(width, artHeight)) {
    const strip = { x: 0, y: quiet.y, width: quietAtlas.width, height: quiet.height, atlas: quietAtlas };
    const { crop, image } = sourceCrop(strip, quiet.left, quiet.left, quiet.width, artHeight);
    const joined = svg('g');
    joined.appendChild(crop);
    joinOverlay(joined, quiet.left, quiet.left + quiet.width, 0, artHeight);
    image.addEventListener('error', () => joined.remove());
    model.landscape.appendChild(joined);
  }
  for (const entry of model.entries.values()) entry.picture.replaceChildren();
  const byId = new Map([...model.entries.values()].map(entry => [entry.event.id || entry.event.title, entry]));
  for (const picture of pictures) {
    const entry = byId.get(picture.event.id || picture.event.title);
    const { crop, image } = sourceCrop(picture.strip, picture.anchor, picture.origin, picture.sceneWidth, artHeight);
    attribute(crop, 'y', top);
    crop.dataset.chapter = picture.key;
    const joined = svg('g');
    joined.appendChild(crop);
    joinOverlay(joined, picture.anchor, picture.right, top, artHeight);
    image.addEventListener('error', () => {
      if (entry.original || model.disposed) return;
      entry.original = true;
      entry.button.dataset.artFallback = 'original';
      if (!model.artworkPending) {
        model.artworkPending = true;
        queueMicrotask(() => { model.artworkPending = false; if (!model.disposed) model.redraw(); });
      }
    });
    entry.picture.appendChild(joined);
    // Match the chronological caption and hit-target precedence.
    model.artLayer.appendChild(entry.picture);
  }
}

function makeEntry(model, key) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'tapestry-scene';
  const caption = document.createElement('span');
  caption.className = 'tapestry-caption';
  caption.setAttribute('aria-hidden', 'true');
  const captionTitle = document.createElement('span');
  captionTitle.className = 'tapestry-caption-title';
  const captionDate = document.createElement('span');
  captionDate.className = 'tapestry-caption-date';
  caption.append(captionTitle, captionDate);
  const patternId = `${model.id}-art-${model.entrySerial++}`;
  const picture = svg('g');
  model.artLayer.appendChild(picture);
  const thread = svg('g', { class: 'tapestry-thread', 'aria-hidden': 'true' });
  const braidPatternId = `${patternId}-braid`;
  const braidPattern = svg('pattern', { id: braidPatternId, width: 8, height: 4,
    patternUnits: 'userSpaceOnUse' });
  braidPattern.appendChild(svg('path', { d: 'M-4 4L4 0 12 4M-4 0L4 4 12 0', fill: 'none',
    stroke: 'currentColor', 'stroke-width': 1.5 }));
  braidPattern.appendChild(svg('path', { d: 'M-4 2L4 0 12 2', fill: 'none',
    stroke: '#efdfbc', 'stroke-width': '.5' }));
  model.defs.appendChild(braidPattern);
  const span = svg('rect', { height: 4, fill: `url(#${braidPatternId})` });
  const startKnot = svg('path', { d: 'M-3 0Q0-4 3 0Q0 4-3 0M0-2V2', fill: 'none', 'stroke-width': 1.2 });
  const endKnot = startKnot.cloneNode(true);
  thread.append(span, startKnot, endKnot);
  model.braidLayer.appendChild(thread);
  const entry = { key, button, caption, captionTitle, captionDate, picture, thread, braidPattern,
    span, startKnot, endKnot, original: false };
  const highlight = value => {
    thread.classList.toggle('is-highlighted', value);
    picture.setAttribute('opacity', value ? '.9' : '1');
  };
  button.addEventListener('pointerenter', () => highlight(true));
  button.addEventListener('pointerleave', () => highlight(false));
  button.addEventListener('focus', () => highlight(true));
  button.addEventListener('blur', () => highlight(false));
  button.addEventListener('click', () => entry.onSelect(button, entry.event));
  model.entries.set(key, entry);
  return entry;
}

export function renderTapestry(timeline, events, width, height, top, scale, onSelect) {
  const ribbon = timeline.querySelector('.tapestry-ribbon') || document.createElement('div');
  ribbon.className = 'tapestry-ribbon';
  ribbon.setAttribute('role', 'group');
  ribbon.setAttribute('aria-label', 'Historical tapestry. Flat scene summaries stay exposed; folded detail is concealed underneath until the cloth opens. All cloth is flat at maximum zoom. Woven braids show recorded period spans. Knots mark single-year events, whose illustrated vignettes occupy at most one year.');
  const model = models.get(ribbon) || makeModel(ribbon);
  model.redraw = () => renderTapestry(timeline, events, width, height, top, scale, onSelect);
  const viewportWidth = timeline.parentElement?.clientWidth || width / Math.max(1, scale);
  const materialWidth = viewportWidth * config.MAX_SCALE;
  const { items, lanes } = layoutTapestry(events, materialWidth);
  const headerHeight = 4 + lanes * BRAID_PITCH + CAPTION_HEIGHT;
  const artHeight = Math.max(24, Math.min(ART_HEIGHT, height - top - headerHeight - 14));
  const clothHeight = headerHeight + artHeight;
  const compositions = composePictures(items, artHeight, materialWidth);
  const pose = layoutPleats(materialWidth, width, clothCells(materialWidth, [...items, ...compositions]));
  model.pose = pose;
  retainFaces(model, pose, clothHeight);
  model.headerHeight = headerHeight;
  model.weave.style.setProperty('--cloth-art-top', `${headerHeight}px`);
  ribbon.dataset.zoomLimit = String(config.MAX_SCALE);
  ribbon.dataset.foldOpen = pose.openness.toFixed(4);
  ribbon.dataset.materialWidth = String(materialWidth);
  ribbon.style.top = `${top + 5}px`;
  ribbon.style.width = `${width}px`;
  ribbon.style.height = `${clothHeight + 6}px`;
  model.weave.style.width = `${width}px`;
  model.weave.style.height = `${clothHeight}px`;
  attribute(model.annotations, 'width', width);
  attribute(model.annotations, 'height', headerHeight);
  attribute(model.background, 'width', materialWidth);
  attribute(model.background, 'height', clothHeight);
  const active = new Set();
  for (const { event, anchor, end, sceneWidth, lane } of items) {
    const key = recordKey('event', event, `event:${events.indexOf(event)}`);
    active.add(key);
    const entry = model.entries.get(key) || makeEntry(model, key);
    Object.assign(entry, { event, onSelect, anchor, end, sceneWidth, lane });
    const { button, caption, captionTitle, captionDate, thread, span, startKnot, endKnot, braidPattern } = entry;
    const date = contextDate(event);
    const heading = `${event.title} · ${date}`;
    const left = projectClothX(anchor, pose);
    const right = projectClothX(anchor + sceneWidth, pose);
    attribute(button, 'data-item-key', key);
    attribute(button, 'data-start-year', event.startYear);
    attribute(button, 'data-end-year', event.endYear);
    attribute(button, 'data-fold-open', pose.openness.toFixed(4));
    attribute(button, 'data-tooltip-anchor', 'scene');
    if (entry.heading !== heading) button.dataset.tooltip = heading;
    button.style.left = `${left}px`;
    button.style.width = `${Math.max(.01, right - left)}px`;
    button.style.top = `${headerHeight}px`;
    button.style.height = `${artHeight}px`;
    attribute(button, 'aria-label', `${heading}. ${event.details || ''}`);
    const materialKey = [anchor, end, sceneWidth, lane, artHeight, headerHeight, entry.original, JSON.stringify(event.chapters)].join(':');
    const materialChanged = materialKey !== entry.materialKey;
    button.dataset.tooltip = `${heading}\n${event.details || ''}`;
    if (captionTitle.textContent !== event.title) captionTitle.textContent = event.title;
    if (captionDate.textContent !== ` · ${date}`) captionDate.textContent = ` · ${date}`;
    caption.dataset.sceneLeft = String(left);
    caption.dataset.sceneWidth = String(right - left);
    caption.dataset.startYear = String(event.startYear);
    caption.style.top = `${4 + lanes * BRAID_PITCH}px`;
    caption.style.maxWidth = `${Math.max(0, right - left - 8)}px`;
    if (materialChanged) {
      const color = ['#854635', '#425c61', '#626539', '#694c67'][lane % 4];
      braidPattern.style.color = color;
      thread.dataset.startYear = String(event.startYear);
      thread.dataset.endYear = String(event.endYear);
      thread.classList.toggle('is-point', event.startYear === event.endYear);
      span.setAttribute('y', 2 + lane * BRAID_PITCH);
      startKnot.setAttribute('stroke', color);
      endKnot.setAttribute('stroke', color);
      endKnot.style.display = end === anchor ? 'none' : '';
      entry.materialKey = materialKey;
    }
    attribute(span, 'x', left);
    attribute(span, 'width', (end - anchor) * pose.ratio);
    attribute(startKnot, 'transform', `translate(${left} ${4 + lane * BRAID_PITCH})`);
    attribute(endKnot, 'transform', `translate(${end * pose.ratio} ${4 + lane * BRAID_PITCH})`);
    entry.heading = heading;
    // Retain nodes and source crops during zoom and pan.
    if (!button.isConnected) ribbon.append(button, caption);
  }
  for (const [key, entry] of model.entries) if (!active.has(key)) {
    for (const node of [entry.button, entry.caption, entry.picture, entry.thread, entry.braidPattern]) node.remove();
    model.entries.delete(key);
  }
  const rasterKey = [materialWidth, clothHeight, ...[...model.entries.values()].map(e => e.materialKey)].join('|');
  if (model.rasterKey !== rasterKey) {
    model.rasterKey = rasterKey;
    renderSourceMaterial(model, composePictures([...model.entries.values()], artHeight, materialWidth), materialWidth, headerHeight, artHeight);
    ribbon.dataset.artReady = 'false';
    const generation = model.generation = (model.generation || 0) + 1;
    rasterizeCloth([...model.entries.values()], materialWidth, clothHeight, headerHeight, artHeight,
      () => model.generation === generation && !model.disposed).then(texture => {
      if (!texture) return;
      if (model.generation !== generation) {
        texture.urls.forEach(url => URL.revokeObjectURL(url));
        return;
      }
      installTexture(model, texture, clothHeight);
      model.texture?.urls.forEach(url => URL.revokeObjectURL(url));
      model.texture = texture;
      ribbon.dataset.artReady = 'true';
    }).catch(() => {
      // SVG source material remains usable if texture allocation is unavailable.
      if (model.generation === generation) {
        model.faces.forEach(({ face, art }) => { face.style.backgroundImage = ''; art.style.display = ''; });
        ribbon.dataset.artReady = 'fallback';
      }
    });
  }
  if (ribbon.parentElement !== timeline) timeline.appendChild(ribbon);
  // The motion caller settles its camera immediately after projecting items.
  // Measuring now would lay out and rasterise an intermediate camera twice.
  if (timeline.dataset.zoomMotion !== 'true') updateTapestryCaptions(timeline, timeline.parentElement);
}

// Keep inscriptions visible inside their real spans. Shorter, later events
// take precedence over overlapping broad-period inscriptions at low density.
export function updateTapestryCaptions(timeline, timelineContainer) {
  const ribbon = timeline.querySelector('.tapestry-ribbon');
  if (!ribbon || !timelineContainer) return;
  const viewport = timelineContainer.getBoundingClientRect();
  const ribbonLeft = ribbon.getBoundingClientRect().left;
  const visibleLeft = viewport.left - ribbonLeft;
  const visibleRight = viewport.right - ribbonLeft;
  const model = models.get(ribbon);
  if (model) {
    const overscan = timelineContainer.clientWidth;
    model.cells.forEach((cell, index) => {
      const panel = model.pose.cells[index];
      const hidden = panel.left + panel.width < visibleLeft - overscan || panel.left > visibleRight + overscan;
      if (cell.hidden !== hidden) cell.hidden = hidden;
    });
  }
  const captions = [...ribbon.querySelectorAll('.tapestry-caption')];
  if (!captions.length) return;
  captionMeasure ||= document.createElement('canvas').getContext('2d');
  const captionStyle = getComputedStyle(captions[0]);
  captionMeasure.font = captionStyle.font;
  const spacing = parseFloat(captionStyle.letterSpacing) || 0;
  const positions = captions.map(caption => {
    const start = Number(caption.dataset.sceneLeft);
    const width = Number(caption.dataset.sceneWidth);
    const limit = Math.min(start + width, visibleRight) - 4;
    const left = Math.max(start + 4, visibleLeft + 4);
    const available = Math.min(width - 8, limit - left);
    const textWidth = captionMeasure.measureText(caption.textContent).width + caption.textContent.length * spacing;
    const dateWidth = captionMeasure.measureText(caption.lastElementChild.textContent).width + 3;
    return { caption, left, available, textWidth, dateWidth };
  }).reverse();
  const occupied = [];
  for (const { caption, left, available, textWidth, dateWidth } of positions) {
    const right = left + Math.min(textWidth, available);
    const shown = available >= Math.max(37, dateWidth) && !occupied.some(([a, b]) => left < b + 8 && right > a - 8);
    if (caption.hidden === shown) caption.hidden = !shown;
    caption.style.left = `${left}px`;
    caption.style.maxWidth = `${Math.max(0, available)}px`;
    if (shown) occupied.push([left, right]);
  }
}

export function disposeTapestry(ribbon) {
  const model = models.get(ribbon);
  if (!model) return;
  model.disposed = true;
  model.generation = (model.generation || 0) + 1;
  model.texture?.urls.forEach(url => URL.revokeObjectURL(url));
  model.texture = null;
  models.delete(ribbon);
}
