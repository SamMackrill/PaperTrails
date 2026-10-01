import { layoutContextLabels } from './contextLabels.js?v=pass2-labels-v5';
import { recordKey } from './itemIdentity.js';
import { config } from './config.js?v=16';
import { layoutPleats, projectClothX, clothCells } from './clothPleats.js?v=pass2-chapters-v2';
import { rasterizeCloth } from './clothRaster.js?v=pass2-height-joins-v1';
import { composePictures, continuePictures, quietLandscape, quietPictures, joinWidth } from './clothComposition.js?v=pass2-height-joins-v1';
import { contextDate } from './contextModel.js?v=pass2-chapters-v2';
import { contextHeading } from './contextHeadings.js?v=pass2-cloth-recovery-v1';
import { yearToX } from './timeScale.js?v=3';
import { renderStory, updateStory, disposeStory } from './storyRenderer.js?v=pass2-labels-v5';

const SVG_NS = 'http://www.w3.org/2000/svg';
const BRAID_PITCH = 5;
const CAPTION_HEIGHT = 54;
const CAPTION_PITCH = 18;
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
  const pixelRatio = window.devicePixelRatio || 1;
  const snap = x => Math.round(x * pixelRatio) / pixelRatio;
  pose.cells.forEach((panel, i) => {
    let cell = model.cells[i];
    if (!cell) {
      cell = document.createElement('span');
      cell.className = 'tapestry-fold-cell';
      model.weave.appendChild(cell);
      model.cells[i] = cell;
    }
    // Adjacent clips share the same physical pixel boundary. Fractional
    // overflow clips otherwise leave pale seams through the landscape.
    cell.style.left = `${snap(panel.left)}px`;
    cell.style.width = `${snap(panel.left + panel.width) - snap(panel.left)}px`;
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
    const sourceCellLeft = pose.cells[panel.cellIndex].left;
    face.style.transform = `translateX(${panel.left + sourceCellLeft - snap(sourceCellLeft)}px)`;
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

function joinOverlay(group, left, right, top, artHeight, style = 'landscape') {
  // SVG <use> mask support varies across browsers. Small linen-colour thread
  // bands provide a bounded fallback join without hiding the referenced art.
  const fade = joinWidth(right - left), steps = 24, step = fade / steps;
  for (let i = 0; i < steps; i++) for (const x of [left + i * step, right - (i + 1) * step]) {
    group.appendChild(svg('rect', { x, y: top, width: step + .02, height: artHeight,
      fill: style === 'tapestry' ? '#e8dec8' : '#dfcda5', opacity: 1 - (i + .5) / steps }));
  }
}

function retryArtwork(model, entries, style) {
  let changed = false;
  for (const entry of entries) {
    if (entry.original || entry.style !== style || model.disposed) continue;
    entry.original = true;
    entry.button.dataset.artFallback = 'original';
    changed = true;
  }
  if (changed && !model.artworkPending) {
    model.artworkPending = true;
    requestAnimationFrame(() => {
      model.artworkPending = false;
      if (!model.disposed) model.redraw();
    });
  }
}

function renderSourceMaterial(model, pictures, width, top, artHeight, style) {
  model.landscape.replaceChildren();
  attribute(model.landscape, 'transform', `translate(0 ${top})`);
  for (const { d, stroke, strokeWidth, opacity, fill } of quietLandscape(width, artHeight, [...model.entries.values()], style)) {
    model.landscape.appendChild(svg('path', { d, stroke, 'stroke-width': strokeWidth, opacity, fill }));
  }
  for (const quiet of quietPictures(width, artHeight, pictures, [...model.entries.values()], style)) {
    const strip = { x: quiet.x, y: quiet.y, width: quiet.sourceWidth, height: quiet.height, atlas: quiet.atlas };
    const { crop, image } = sourceCrop(strip, quiet.left, quiet.left, quiet.width, artHeight);
    const joined = svg('g');
    crop.dataset.quietScene = quiet.atlas.file;
    crop.dataset.winter = String(Boolean(quiet.atlas.winter));
    joined.appendChild(crop);
    joinOverlay(joined, quiet.left, quiet.left + quiet.width, 0, artHeight);
    image.addEventListener('error', () => joined.remove());
    model.landscape.appendChild(joined);
  }
  for (const entry of model.entries.values()) {
    entry.picture.replaceChildren();
    entry.button.dataset.artRendered = 'false';
  }
  const byId = new Map([...model.entries.values()].map(entry => [entry.event.id || entry.event.title, entry]));
  for (const picture of pictures) {
    const entry = byId.get(picture.event.id || picture.event.title);
    entry.button.dataset.artRendered = 'true';
    const { crop, image } = sourceCrop(picture.strip, picture.anchor, picture.origin, picture.sceneWidth, artHeight);
    attribute(crop, 'y', top);
    crop.dataset.chapter = picture.key;
    crop.dataset.continuation = String(Boolean(picture.continuation));
    if (picture.artStartYear !== undefined) {
      crop.dataset.artStartYear = String(picture.artStartYear);
      crop.dataset.artEndYear = String(picture.artEndYear);
    }
    const joined = svg('g');
    joined.appendChild(crop);
    joinOverlay(joined, picture.anchor, picture.right, top, artHeight, style);
    image.addEventListener('error', () => {
      retryArtwork(model, [entry], style);
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
  const leader = svg('path', { class: 'context-label-leader', fill: 'none', stroke: 'currentColor', 'stroke-width': .8 });
  thread.append(span, startKnot, endKnot, leader);
  model.braidLayer.appendChild(thread);
  const entry = { key, button, caption, captionTitle, captionDate, picture, thread, braidPattern,
    span, startKnot, endKnot, leader, original: false };
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

export function renderTapestry(timeline, events, width, height, top, scale, onSelect, style = 'landscape') {
  const previous = timeline.querySelector('.tapestry-ribbon');
  if (style === 'tapestry') {
    if (previous && !previous.classList.contains('tapestry-story')) {
      disposeTapestry(previous); previous.remove();
    }
    renderStory(timeline, events, width, height, top, scale, onSelect);
    return;
  }
  if (previous?.classList.contains('tapestry-story')) {
    disposeStory(previous); previous.remove();
  }
  const ribbon = timeline.querySelector('.tapestry-ribbon') || document.createElement('div');
  ribbon.className = 'tapestry-ribbon';
  ribbon.dataset.artStyle = style;
  ribbon.setAttribute('role', 'group');
  ribbon.setAttribute('aria-label', 'Historical landscape. English names and dates connect to woven braids showing recorded period spans. Knots mark single-year events. Illustrated folds reveal detail as you zoom.');
  const model = models.get(ribbon) || makeModel(ribbon);
  // Assembly may start off-DOM; asynchronous recovery belongs to whichever
  // timeline owns the visible ribbon after those nodes have been installed.
  model.redraw = () => renderTapestry(ribbon.parentElement || timeline,
    events, width, height, top, scale, onSelect, style);
  const viewportWidth = timeline.parentElement?.clientWidth || width / Math.max(1, scale);
  const materialWidth = viewportWidth * config.MAX_SCALE;
  const { items, lanes } = layoutTapestry(events, materialWidth);
  items.forEach(item => {
    item.style = style;
    const key = recordKey('event', item.event, `event:${events.indexOf(item.event)}`);
    const previous = model.entries.get(key);
    item.original = previous?.style === style && previous.original;
  });
  const headerHeight = 4 + lanes * BRAID_PITCH + CAPTION_HEIGHT;
  const artHeight = Math.max(1, height - top - headerHeight - 16);
  const clothHeight = headerHeight + artHeight;
  const compositions = continuePictures(composePictures(items, artHeight, materialWidth), items, artHeight);
  const pose = layoutPleats(materialWidth, width, clothCells(materialWidth, [...items, ...compositions]));
  model.pose = pose;
  retainFaces(model, pose, clothHeight);
  model.headerHeight = headerHeight;
  model.braidHeight = lanes * BRAID_PITCH;
  model.weave.style.setProperty('--cloth-art-top', `${headerHeight}px`);
  ribbon.dataset.zoomLimit = String(config.MAX_SCALE);
  ribbon.dataset.foldOpen = pose.openness.toFixed(4);
  ribbon.dataset.materialWidth = String(materialWidth);
  ribbon.style.top = `${top + 8}px`;
  ribbon.style.width = `${width}px`;
  ribbon.style.height = `${clothHeight}px`;
  model.weave.style.width = `${width}px`;
  model.weave.style.height = `${clothHeight}px`;
  attribute(model.annotations, 'width', width);
  attribute(model.annotations, 'height', headerHeight);
  attribute(model.background, 'width', materialWidth);
  attribute(model.background, 'height', clothHeight);
  attribute(model.background, 'fill', style === 'tapestry' ? '#e8dec8' : '#dfcda5');
  const active = new Set();
  for (const { event, anchor, end, sceneWidth, lane } of items) {
    const key = recordKey('event', event, `event:${events.indexOf(event)}`);
    active.add(key);
    const entry = model.entries.get(key) || makeEntry(model, key);
    if (entry.style !== style) {
      entry.original = false;
      delete entry.button.dataset.artFallback;
    }
    Object.assign(entry, { event, onSelect, anchor, end, sceneWidth, lane, style });
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
    const materialKey = [style, anchor, end, sceneWidth, lane, artHeight, headerHeight, entry.original, JSON.stringify(event.chapters)].join(':');
    const materialChanged = materialKey !== entry.materialKey;
    button.dataset.tooltip = `${heading}\n${event.details || ''}`;
    const inscription = contextHeading(event, style);
    if (captionTitle.textContent !== inscription.title) captionTitle.textContent = inscription.title;
    if (captionTitle.lang !== inscription.lang) captionTitle.lang = inscription.lang;
    if (captionDate.textContent !== inscription.date) captionDate.textContent = inscription.date;
    caption.dataset.sceneLeft = String(left);
    caption.dataset.sceneWidth = String(right - left);
    caption.dataset.startYear = String(event.startYear);
    caption.dataset.braidY = String(4 + lane * BRAID_PITCH);
    caption.style.top = `${4 + lanes * BRAID_PITCH}px`;
    caption.style.maxWidth = `${Math.max(0, right - left - 8)}px`;
    if (materialChanged) {
      const color = ['#854635', '#425c61', '#626539', '#694c67'][lane % 4];
      braidPattern.style.color = color;
      thread.style.color = color;
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
  const rasterKey = [style, materialWidth, clothHeight, ...[...model.entries.values()].map(e => e.materialKey)].join('|');
  if (model.rasterKey !== rasterKey) {
    model.rasterKey = rasterKey;
    // SVG <use> on hundreds of faces expands the whole source tree on every
    // face. Prepare canvas first; build that expensive fallback only on failure.
    model.faces.forEach(({ face, art }) => { face.style.backgroundImage = ''; art.style.display = ''; });
    const entries = [...model.entries.values()];
    model.landscape.replaceChildren();
    entries.forEach(entry => entry.picture.replaceChildren());
    ribbon.dataset.artReady = 'false';
    ribbon.setAttribute('aria-busy', 'true');
    const generation = model.generation = (model.generation || 0) + 1;
    rasterizeCloth([...model.entries.values()], materialWidth, clothHeight, headerHeight, artHeight,
      () => model.generation === generation && !model.disposed, style).then(texture => {
      if (!texture) return;
      if (model.generation !== generation || model.disposed) {
        texture.urls.forEach(url => URL.revokeObjectURL(url));
        return;
      }
      installTexture(model, texture, clothHeight);
      model.texture?.urls.forEach(url => URL.revokeObjectURL(url));
      model.texture = texture;
      ribbon.dataset.artReady = 'true';
      ribbon.setAttribute('aria-busy', 'false');
      const painted = new Set(compositions.map(picture => picture.event.id || picture.event.title));
      entries.forEach(entry => { entry.button.dataset.artRendered = String(painted.has(entry.event.id || entry.event.title)); });
    }).catch(error => {
      // SVG source material remains usable if texture allocation is unavailable.
      if (model.generation === generation) {
        const failed = new Set(error?.failedEvents || []);
        const retry = [...model.entries.values()].filter(entry =>
          !entry.original && failed.has(entry.event.id || entry.event.title));
        if (retry.length) {
          // Decode a valid original before expanding SVG through every face.
          // A missing optimized drawing should not freeze the recovery path.
          retryArtwork(model, retry, style);
          return;
        }
        renderSourceMaterial(model, compositions, materialWidth, headerHeight, artHeight, style);
        model.faces.forEach(({ face, art }) => { face.style.backgroundImage = ''; art.style.display = ''; });
        ribbon.dataset.artReady = 'fallback';
        ribbon.setAttribute('aria-busy', 'false');
        // SVG definitions do not reliably report errors through their <use> copies.
        // Retry failed records together and leave failed fallbacks on SVG cloth.

      }
    });
  }
  if (ribbon.parentElement !== timeline) timeline.appendChild(ribbon);
  // The motion caller settles its camera immediately after projecting items.
  // Measuring now would lay out and rasterise an intermediate camera twice.
  if (timeline.dataset.zoomMotion !== 'true') updateTapestryCaptions(timeline, timeline.parentElement);
}

// Complete English labels borrow free rows beyond narrow event spans.
// Their fine connectors remain on the real dated braid.
export function updateTapestryCaptions(timeline, timelineContainer) {
  const ribbon = timeline.querySelector('.tapestry-ribbon');
  if (!ribbon || !timelineContainer) return;
  if (ribbon.classList.contains('tapestry-story')) {
    updateStory(ribbon, timelineContainer);
    return;
  }
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
  const labels = captions.map(caption => {
    const start = Number(caption.dataset.sceneLeft);
    const width = Number(caption.dataset.sceneWidth);
    const textWidth = captionMeasure.measureText(caption.textContent).width + caption.textContent.length * spacing + 4;
    // Only narrow viewports wrap. Desktop labels use their full measured width.
    const limit = Math.max(1, visibleRight - visibleLeft - 8);
    let lines = 1, lineWidth = 0;
    for (const word of caption.textContent.split(/\s+/)) {
      const wordWidth = captionMeasure.measureText(`${word} `).width + (word.length + 1) * spacing;
      if (lineWidth && lineWidth + wordWidth > limit) { lines++; lineWidth = 0; }
      lineWidth += wordWidth;
    }
    return { caption, start, end: start + width, width: textWidth, lines };
  });
  const placements = layoutContextLabels(labels, visibleLeft, visibleRight);
  const shown = new Set(placements.map(p => p.caption));
  captions.forEach(caption => { caption.hidden = !shown.has(caption); });
  if (model) model.entries.forEach(entry => entry.leader.style.display = 'none');
  for (const { caption, left, width, row, anchor } of placements) {
    const braidY = Number(caption.dataset.braidY) || 4;
    const y = 4 + model.braidHeight + row * CAPTION_PITCH;
    caption.style.left = `${left}px`; caption.style.top = `${y}px`;
    caption.style.maxWidth = `${width}px`; caption.style.width = `${width}px`;
    const entry = [...model.entries.values()].find(e => e.caption === caption);
    if (entry) {
      entry.leader.style.display = '';
      // A short thread bends from the dated braid to the beginning of its label.
      attribute(entry.leader, 'd', `M${anchor} ${braidY}L${anchor} ${y - 3}L${left + 2} ${y - 3}`);
    }
  }

}

export function disposeTapestry(ribbon) {
  if (ribbon.classList.contains('tapestry-story')) {
    disposeStory(ribbon);
    return;
  }
  const model = models.get(ribbon);
  if (!model) return;
  model.disposed = true;
  model.generation = (model.generation || 0) + 1;
  model.texture?.urls.forEach(url => URL.revokeObjectURL(url));
  model.texture = null;
  models.delete(ribbon);
}
