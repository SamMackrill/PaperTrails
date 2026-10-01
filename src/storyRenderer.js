import { layoutContextLabels } from './contextLabels.js?v=pass2-labels-v5';
import { layoutStory } from './storyLayout.js?v=pass2-labels-v5';
import { contextHeading } from './contextHeadings.js?v=pass2-cloth-recovery-v1';
import { contextDate } from './contextModel.js?v=pass2-chapters-v2';
import { recordKey } from './itemIdentity.js';

const models = new WeakMap();
const images = new Map();
const motifTextures = new WeakMap();
let captionMeasure;
const BORDER = { file: 'images/tapestry/bayeux-revolutions.webp', width: 1774, height: 26 };
const BORDER_HEIGHT = 17;
const CAPTION_HEIGHT = 24;

export function loadStoryImage(file) {
  if (!images.has(file)) images.set(file, new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => {
      // Retry the very same approved drawing, with no unrelated substitute.
      if (file.endsWith('.webp')) loadStoryImage(file.replace('.webp', '.png')).then(resolve);
      else resolve(null);
    };
    image.src = file;
  }));
  return images.get(file);
}

function paint(model, container) {
  if (!container || model.disposed) return;
  const { ribbon, canvas, layout, height, width } = model;
  const view = container.getBoundingClientRect();
  const left = Math.max(0, view.left - ribbon.getBoundingClientRect().left);
  const visibleWidth = Math.min(width - left, container.clientWidth);
  if (visibleWidth <= 0) return;
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  canvas.style.left = `${left}px`;
  canvas.style.width = `${visibleWidth}px`;
  canvas.style.height = `${height}px`;
  canvas.width = Math.ceil(visibleWidth * ratio);
  canvas.height = Math.ceil(height * ratio);
  const ink = canvas.getContext('2d');
  ink.scale(ratio, ratio); ink.translate(-left, 0);
  ink.fillStyle = '#e8dec8'; ink.fillRect(left, 0, visibleWidth, height);
  const artTop = BORDER_HEIGHT + CAPTION_HEIGHT;
  // A continuous stitched ground ties figures together; it has no dated claim.
  ink.strokeStyle = '#8b6e49'; ink.lineWidth = .7;
  for (const y of [height - BORDER_HEIGHT - 4, artTop + 3]) {
    ink.beginPath(); ink.moveTo(left, y);
    for (let x = left; x <= left + visibleWidth + 20; x += 20)
      ink.lineTo(x, y + Math.sin(x / 71) * 2);
    ink.stroke();
  }
  for (const subject of layout.subjects) {
    if (subject.left + subject.width < left || subject.left > left + visibleWidth) continue;
    const image = model.loaded.get(subject.crop.atlas.file);
    if (!image) continue;
    const motif = softenedMotif(image, subject.crop);
    ink.drawImage(motif, subject.left, artTop + subject.top, subject.width, subject.height);
  }
  // These real animal-and-bird border pixels are from the approved Bayeux
  // sheet. Decorative repetition never repeats a historical scene or figure.
  const border = model.loaded.get(BORDER.file);
  if (border) {
    const tile = BORDER.width * BORDER_HEIGHT / BORDER.height;
    for (let x = Math.floor(left / tile) * tile; x < left + visibleWidth; x += tile)
      for (const y of [0, height - BORDER_HEIGHT])
        ink.drawImage(border, 0, 0, BORDER.width, BORDER.height, x, y, tile, BORDER_HEIGHT);
  }
  const failed = [...model.loaded.values()].some(value => !value);
  ribbon.dataset.artReady = model.loading ? 'false' : failed ? 'fallback' : 'true';
  ribbon.setAttribute('aria-busy', String(model.loading));
  model.records.forEach(({ button, record }) => {
    button.dataset.artRendered = String(record.subjects.some(s => model.loaded.get(s.crop.atlas.file)));
  });
}

function softenedMotif(image, crop) {
  let cache = motifTextures.get(image);
  if (!cache) { cache = new Map(); motifTextures.set(image, cache); }
  const key = [crop.x, crop.y, crop.width, crop.height].join(':');
  if (!cache.has(key)) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(crop.width); canvas.height = Math.ceil(crop.height);
    const ink = canvas.getContext('2d');
    ink.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);
    ink.globalCompositeOperation = 'destination-in';
    for (const vertical of [false, true]) {
      const gradient = ink.createLinearGradient(0, 0, vertical ? 0 : canvas.width, vertical ? canvas.height : 0);
      gradient.addColorStop(0, 'transparent'); gradient.addColorStop(.08, '#fff');
      gradient.addColorStop(.92, '#fff'); gradient.addColorStop(1, 'transparent');
      ink.fillStyle = gradient; ink.fillRect(0, 0, canvas.width, canvas.height);
    }
    cache.set(key, canvas);
  }
  return cache.get(key);
}

export function renderStory(timeline, events, width, height, top, scale, onSelect) {
  let ribbon = timeline.querySelector('.tapestry-story');
  if (!ribbon) {
    ribbon = document.createElement('div');
    ribbon.className = 'tapestry-ribbon tapestry-story';
    ribbon.dataset.artStyle = 'tapestry';
    ribbon.setAttribute('role', 'group');
    ribbon.setAttribute('aria-label', 'Continuous illustrated historical story with animal borders. Overlapping events share the story. Vignettes are symbolic; select an event for its dates and English details.');
    const canvas = document.createElement('canvas');
    canvas.className = 'tapestry-story-canvas'; canvas.setAttribute('aria-hidden', 'true');
    ribbon.appendChild(canvas);
    models.set(ribbon, { ribbon, canvas, records: [], loaded: new Map(), generation: 0 });
  }
  const model = models.get(ribbon);
  model.records.forEach(({ button, caption }) => { button.remove(); caption.remove(); });
  model.width = width; model.height = Math.max(1, height - top - 16);
  model.layout = layoutStory(events, width, Math.max(1, model.height - 2 * BORDER_HEIGHT - CAPTION_HEIGHT));
  model.records = [];
  ribbon.style.cssText = `top:${top + 8}px;width:${width}px;height:${model.height}px`;
  for (const record of model.layout.records) {
    const { event } = record;
    const button = document.createElement('button'); button.type = 'button';
    button.className = 'tapestry-scene';
    button.dataset.itemKey = recordKey('event', event);
    button.dataset.startYear = String(event.startYear); button.dataset.endYear = String(event.endYear);
    button.dataset.tooltip = `${event.title} · ${contextDate(event)}\n${event.details || ''}`;
    button.dataset.tooltipAnchor = 'scene';
    button.setAttribute('aria-label', `${event.title} · ${contextDate(event)}. ${event.details || ''}`);
    const first = Math.min(record.anchor, ...record.subjects.map(subject => subject.left));
    const last = Math.max(record.anchor + 12, ...record.subjects.map(subject => subject.left + subject.width));
    button.style.cssText = `left:${first}px;width:${last - first}px;top:${BORDER_HEIGHT + CAPTION_HEIGHT}px;height:${model.height - 2 * BORDER_HEIGHT - CAPTION_HEIGHT}px;pointer-events:none;z-index:${Math.max(0, ...record.subjects.map(subject => subject.priority)) + 1}`;
    // One accessible event can own several visible action groups. Hit areas
    // follow those groups, so long periods cannot cover unrelated scenes.
    for (const subject of record.subjects) {
      const hit = document.createElement('span'); hit.className = 'tapestry-story-hit';
      hit.style.cssText = `left:${subject.left - first}px;top:${subject.top}px;width:${subject.width}px;height:${subject.height}px`;
      button.appendChild(hit);
    }
    button.addEventListener('click', () => onSelect(button, event));
    const caption = document.createElement('span');
    caption.className = 'tapestry-caption'; caption.lang = 'la'; caption.setAttribute('aria-hidden', 'true');
    caption.textContent = contextHeading(event, 'tapestry').title;
    caption.style.top = `${BORDER_HEIGHT + 4}px`;
    caption.dataset.sceneLeft = String(record.anchor);
    caption.dataset.sceneWidth = String(Math.max(100, record.end - record.anchor));
    ribbon.append(button, caption); model.records.push({ button, caption, record });
  }
  if (ribbon.parentElement !== timeline) timeline.appendChild(ribbon);
  const files = [...new Set([BORDER.file, ...model.layout.subjects.map(s => s.crop.atlas.file)])];
  const missing = files.filter(file => !model.loaded.has(file));
  model.loading = missing.length > 0;
  if (missing.length) {
    const generation = ++model.generation;
    Promise.all(missing.map(async file => [file, await loadStoryImage(file)])).then(loaded => {
      if (model.disposed || generation !== model.generation) return;
      loaded.forEach(([file, image]) => model.loaded.set(file, image));
      model.loading = false; updateStory(ribbon, ribbon.parentElement?.parentElement);
    });
  }
  updateStory(ribbon, timeline.parentElement);
}

export function updateStory(ribbon, container) {
  const model = models.get(ribbon);
  if (!model || !container) return;
  paint(model, container);
  const view = container.getBoundingClientRect();
  const left = Math.max(0, view.left - ribbon.getBoundingClientRect().left);
  if (!model.records.length) return;
  captionMeasure ||= document.createElement('canvas').getContext('2d');
  const style = getComputedStyle(model.records[0].caption);
  captionMeasure.font = style.font;
  const spacing = parseFloat(style.letterSpacing) || 0;
  const placements = layoutContextLabels(model.records.map(({ caption, record }) => ({
    caption,
    start: Math.min(record.anchor, ...record.subjects.map(s => s.left)),
    end: Math.max(record.end, ...record.subjects.map(s => s.left + s.width)),
    width: captionMeasure.measureText(caption.textContent).width + caption.textContent.length * spacing + 4,
    priority: Math.max(0, ...record.subjects.map(s => s.priority))
  })), left, left + container.clientWidth, 1);
  const shown = new Set(placements.map(p => p.caption));
  model.records.forEach(({ caption }) => { caption.hidden = !shown.has(caption); });
  for (const { caption, left: x, width } of placements) {
    caption.style.left = `${x}px`; caption.style.maxWidth = `${width}px`;
  }

}

export function disposeStory(ribbon) {
  const model = models.get(ribbon);
  if (model) { model.disposed = true; model.generation++; models.delete(ribbon); }
}
