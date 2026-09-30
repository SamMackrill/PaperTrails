import { recordKey } from './itemIdentity.js';
import { config } from './config.js?v=16';
import { tapestryScenes, getPanoramaStrip } from './tapestryScenes.js?v=pass2-woven';
import { layoutPleats, projectClothX, PLEAT_COUNT, PLEAT_FACES } from './clothPleats.js?v=pass2-woven';
import { rasterizeCloth } from './clothRaster.js?v=pass2-woven';
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
  const landscape = svg('pattern', { id: `${id}-landscape`, width: 320, height: ART_HEIGHT,
    patternUnits: 'userSpaceOnUse' });
  landscape.appendChild(svg('rect', { width: 320, height: ART_HEIGHT, fill: '#dfcda5' }));
  landscape.appendChild(svg('path', { d: 'M0 45 Q40 25 80 45 T160 45 T240 45 T320 45 M0 85 Q65 55 130 85 T260 85 T390 85',
    fill: 'none', stroke: '#a39774', 'stroke-width': 1, 'stroke-dasharray': '2 2', opacity: '.5' }));
  landscape.appendChild(svg('path', { d: 'M40 112V58m0 24-12-10m12 22 14-15M190 115V64m0 18-10-9m10 22 13-13',
    fill: 'none', stroke: '#7b8060', 'stroke-width': 1.5, 'stroke-linecap': 'round', opacity: '.55' }));
  const landscapeCrop = svg('svg', { viewBox: '0 148 2172 468', preserveAspectRatio: 'xMidYMid meet' });
  const landscapeImage = svg('image', { href: 'images/tapestry/landscape-b-interlude.png', width: 2172, height: 724 });
  landscapeImage.addEventListener('error', () => { landscapeCrop.style.display = 'none'; });
  landscapeCrop.appendChild(landscapeImage);
  landscape.appendChild(landscapeCrop);
  defs.appendChild(landscape);
  const interlude = svg('rect', { fill: `url(#${id}-landscape)` });
  material.appendChild(interlude);
  const artLayer = svg('g');
  const braidLayer = svg('g');
  material.append(artLayer, braidLayer);
  defs.appendChild(material);
  definitions.appendChild(defs);
  const weave = document.createElement('div');
  weave.className = 'tapestry-weave tapestry-cloth';
  weave.setAttribute('aria-hidden', 'true');
  const faces = Array.from({ length: PLEAT_COUNT * PLEAT_FACES }, (_, i) => {
    const face = document.createElement('span');
    face.className = 'tapestry-cloth-face';
    const phase = i % PLEAT_FACES;
    const shadeAt = step => .68 * ((1 - Math.cos(2 * Math.PI * step / PLEAT_FACES)) / 2) ** 2;
    face.style.setProperty('--crease-left', String(shadeAt(phase)));
    face.style.setProperty('--crease-right', String(shadeAt(phase + 1)));
    const art = svg('svg', { preserveAspectRatio: 'none' });
    art.appendChild(svg('use', { href: `#${id}` }));
    face.appendChild(art);
    weave.appendChild(face);
    return { face, art };
  });
  ribbon.append(definitions, weave);
  const model = { id, defs, background, interlude, landscape, landscapeCrop, artLayer, braidLayer, weave, faces, entries: new Map(), entrySerial: 0 };
  models.set(ribbon, model);
  return model;
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
  const pattern = svg('pattern', { id: patternId, patternUnits: 'userSpaceOnUse' });
  const crop = svg('svg', { preserveAspectRatio: 'xMidYMid meet' });
  const image = svg('image');
  crop.appendChild(image);
  pattern.appendChild(crop);
  model.defs.appendChild(pattern);
  const picture = svg('rect', { fill: `url(#${patternId})` });
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
  const entry = { key, button, caption, captionTitle, captionDate, pattern, crop, image, picture, thread, braidPattern,
    span, startKnot, endKnot, original: false };
  image.addEventListener('error', () => {
    if (entry.original || model.disposed) return;
    entry.original = true;
    button.dataset.artFallback = 'original';
    if (!model.artworkPending) {
      model.artworkPending = true;
      queueMicrotask(() => { model.artworkPending = false; if (!model.disposed) model.redraw(); });
    }
  });
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
  ribbon.setAttribute('aria-label', 'Historical tapestry. Soft pleats open as you zoom; all cloth is flat at maximum zoom. Woven braids show recorded period spans. Knots mark single-year events, whose illustrated vignettes occupy at most one year.');
  const model = models.get(ribbon) || makeModel(ribbon);
  model.redraw = () => renderTapestry(timeline, events, width, height, top, scale, onSelect);
  const viewportWidth = timeline.parentElement?.clientWidth || width / Math.max(1, scale);
  const materialWidth = viewportWidth * config.MAX_SCALE;
  const { items, lanes } = layoutTapestry(events, materialWidth);
  const headerHeight = 4 + lanes * BRAID_PITCH + CAPTION_HEIGHT;
  const artHeight = Math.max(24, Math.min(ART_HEIGHT, height - top - headerHeight - 14));
  const clothHeight = headerHeight + artHeight;
  const pose = layoutPleats(materialWidth, width);
  model.pose = pose;
  model.headerHeight = headerHeight;
  ribbon.dataset.zoomLimit = String(config.MAX_SCALE);
  ribbon.dataset.foldOpen = pose.openness.toFixed(4);
  ribbon.dataset.materialWidth = String(materialWidth);
  ribbon.style.top = `${top + 5}px`;
  ribbon.style.width = `${width}px`;
  ribbon.style.height = `${clothHeight + 6}px`;
  model.weave.style.width = `${width}px`;
  model.weave.style.height = `${clothHeight}px`;
  attribute(model.background, 'width', materialWidth);
  attribute(model.background, 'height', clothHeight);
  attribute(model.interlude, 'width', materialWidth);
  attribute(model.interlude, 'y', headerHeight);
  attribute(model.interlude, 'height', artHeight);
  attribute(model.landscape, 'y', headerHeight);
  attribute(model.landscape, 'width', artHeight * 2172 / 468);
  attribute(model.landscape, 'height', artHeight);
  attribute(model.landscapeCrop, 'width', artHeight * 2172 / 468);
  attribute(model.landscapeCrop, 'height', artHeight);
  const active = new Set();
  for (const { event, anchor, end, sceneWidth, lane } of items) {
    const key = recordKey('event', event, `event:${events.indexOf(event)}`);
    active.add(key);
    const entry = model.entries.get(key) || makeEntry(model, key);
    Object.assign(entry, { event, onSelect, anchor, end, sceneWidth, lane });
    const { button, caption, captionTitle, captionDate, thread, pattern, crop, image, picture, span, startKnot, endKnot, braidPattern } = entry;
    const date = event.startYear === event.endYear ? String(event.startYear) : `${event.startYear}–${event.endYear}`;
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
    const scene = tapestryScenes.get(event.title);
    const materialKey = [anchor, end, sceneWidth, lane, artHeight, headerHeight, entry.original, scene?.atlas, scene?.row].join(':');
    const materialChanged = materialKey !== entry.materialKey;
    if (scene && materialChanged) {
      const strip = getPanoramaStrip(scene, entry.original);
      const tileWidth = strip.width * artHeight / strip.height;
      const firstFacetWidth = strip.edges[1] * artHeight / strip.height;
      pattern.setAttribute('x', anchor - Math.max(0, (firstFacetWidth - sceneWidth) / 2));
      pattern.setAttribute('y', headerHeight);
      pattern.setAttribute('width', tileWidth);
      pattern.setAttribute('height', artHeight);
      crop.setAttribute('width', tileWidth);
      crop.setAttribute('height', artHeight);
      crop.setAttribute('viewBox', `0 ${strip.y} ${strip.width} ${strip.height}`);
      image.setAttribute('width', strip.atlas.width);
      image.setAttribute('height', strip.atlas.height);
      if (image.getAttribute('href') !== strip.atlas.file) image.setAttribute('href', strip.atlas.file);
      button.dataset.tooltip = `${heading}\n${event.details || ''}`;
      picture.setAttribute('x', anchor);
      picture.setAttribute('y', headerHeight);
      picture.setAttribute('width', sceneWidth);
      picture.setAttribute('height', artHeight);
      picture.style.display = '';
    } else if (!scene) picture.style.display = 'none';
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
      span.setAttribute('x', anchor);
      span.setAttribute('y', 2 + lane * BRAID_PITCH);
      span.setAttribute('width', end - anchor);
      startKnot.setAttribute('transform', `translate(${anchor} ${4 + lane * BRAID_PITCH})`);
      endKnot.setAttribute('transform', `translate(${end} ${4 + lane * BRAID_PITCH})`);
      startKnot.setAttribute('stroke', color);
      endKnot.setAttribute('stroke', color);
      endKnot.style.display = end === anchor ? 'none' : '';
      entry.materialKey = materialKey;
    }
    entry.heading = heading;
    // Retain nodes and source crops during zoom and pan.
    if (!button.isConnected) ribbon.append(button, caption);
  }
  for (const [key, entry] of model.entries) if (!active.has(key)) {
    for (const node of [entry.button, entry.caption, entry.pattern, entry.picture, entry.thread, entry.braidPattern]) node.remove();
    model.entries.delete(key);
  }
  const rasterKey = [materialWidth, clothHeight, ...[...model.entries.values()].map(e => e.materialKey)].join('|');
  if (model.rasterKey !== rasterKey) {
    model.rasterKey = rasterKey;
    ribbon.dataset.artReady = 'false';
    const generation = model.generation = (model.generation || 0) + 1;
    rasterizeCloth([...model.entries.values()], materialWidth, clothHeight, headerHeight, artHeight,
      () => model.generation === generation && !model.disposed).then(texture => {
      if (!texture) return;
      if (model.generation !== generation) {
        texture.urls.forEach(url => URL.revokeObjectURL(url));
        return;
      }
      model.faces.forEach(({ face, art }, index) => {
        const sourceX = model.pose.faces[index].sourceX;
        const chunk = Math.min(texture.urls.length - 1, Math.floor(sourceX / texture.chunkWidth));
        face.style.backgroundImage = `url("${texture.urls[chunk]}")`;
        face.style.backgroundSize = `${texture.chunkWidth}px ${clothHeight}px`;
        face.style.backgroundPosition = `${-(sourceX - chunk * texture.chunkWidth)}px 0px`;
        art.style.display = 'none';
      });
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
  model.faces.forEach(({ face, art }, i) => {
    const panel = pose.faces[i];
    const faceWidth = `${panel.sourceWidth}px`, faceHeight = `${clothHeight}px`;
    if (face.style.width !== faceWidth) face.style.width = faceWidth;
    if (face.style.height !== faceHeight) face.style.height = faceHeight;
    face.style.transform = `translateX(${panel.left}px) translateZ(${panel.depth}px) rotateY(${panel.angle}deg)`;
    face.style.setProperty('--fold-shade', String(pose.faces[1].shade));
    face.classList.toggle('is-return-face', panel.angle < 0);
    const viewBox = `${panel.sourceX} 0 ${panel.sourceWidth} ${clothHeight}`;
    if (art.getAttribute('viewBox') !== viewBox) art.setAttribute('viewBox', viewBox);
  });
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
    const overscan = model.pose.width / PLEAT_COUNT;
    model.faces.forEach(({ face }, index) => {
      const panel = model.pose.faces[index];
      const hidden = panel.left + panel.width < visibleLeft - overscan || panel.left > visibleRight + overscan;
      if (face.hidden !== hidden) face.hidden = hidden;
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
