import { layoutContextLabels } from './contextLabels.js?v=pass2-labels-v5';
import { layoutStory, foldStory, exposedStory, storyCamera } from './storyLayout.js?v=pass2-linear-v1';
import { STORY_BORDER } from './storyPanels.js?v=pass2-linear-v1';
import { contextHeading } from './contextHeadings.js?v=pass2-cloth-recovery-v1';
import { contextDate } from './contextModel.js?v=pass2-chapters-v2';
import { recordKey } from './itemIdentity.js';
import { xToYear } from './timeScale.js?v=3';
import { config } from './config.js?v=16';
const models = new WeakMap();
const images = new Map();
const BORDER_HEIGHT = 16;
const CAPTION_HEIGHT = 24;
let captionMeasure;

export function loadStoryImage(file) {
  if (!images.has(file)) images.set(file, new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => {
      if (file.endsWith('.webp')) loadStoryImage(file.replace('.webp', '.png')).then(resolve);
      else resolve(null);
    };
    image.src = file;
  }));
  return images.get(file);
}

function makeRecord(model, event) {
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'tapestry-scene';
  button.dataset.itemKey = recordKey('event', event); button.dataset.tooltipAnchor = 'scene';
  const caption = document.createElement('span');
  caption.className = 'tapestry-caption'; caption.lang = 'la'; caption.setAttribute('aria-hidden', 'true');
  const entry = { button, caption, hits: [], event };
  button.addEventListener('click', () => model.onSelect(button, entry.event));
  model.ribbon.append(button, caption);
  return entry;
}

function positionRecords(model, fragments, worldLeft, camera, viewport) {
  const labels = [];
  for (const record of model.layout.records) {
    const entry = model.records.get(record.event.id);
    const spans = record.subjects.flatMap(subject => fragments.flatMap(fragment => {
      const a = Math.max(subject.sourceX, fragment.sourceX);
      const b = Math.min(subject.sourceX + subject.sourceWidth, fragment.sourceX + fragment.width);
      if (b <= a) return [];
      const left = fragment.left + a - fragment.sourceX - camera;
      return left + b - a <= 0 || left >= viewport ? [] : [{ left: Math.max(0, left),
        width: Math.min(viewport, left + b - a) - Math.max(0, left) }];
    }));
    const first = spans.length ? Math.min(...spans.map(s => s.left)) : 0;
    const last = spans.length ? Math.max(...spans.map(s => s.left + s.width)) : 0;
    entry.button.style.cssText = `left:${worldLeft + first}px;width:${Math.max(1, last - first)}px;top:${BORDER_HEIGHT + CAPTION_HEIGHT}px;height:${model.artHeight}px;pointer-events:none`;
    // Concealed records retain accessible descriptions but no invisible tab
    // stops. Existing search and navigation can still select those records.
    entry.button.tabIndex = spans.length ? 0 : -1;
    entry.button.dataset.artRendered = String(spans.length > 0 && Boolean(model.loaded.get(model.layout.panels.find(p => p.id === record.subjects[0]?.panel)?.atlas.file)));
    entry.button.dataset.foldOpen = String(model.pose.progress);
    spans.forEach((span, i) => {
      const hit = entry.hits[i] || document.createElement('span'); hit.className = 'tapestry-story-hit';
      hit.style.cssText = `left:${span.left - first}px;top:0;width:${span.width}px;height:100%`;
      if (!entry.hits[i]) { entry.button.appendChild(hit); entry.hits.push(hit); }
    });
    while (entry.hits.length > spans.length) entry.hits.pop().remove();
    if (spans.length) labels.push({ caption: entry.caption, start: worldLeft + first,
      end: worldLeft + last, width: entry.labelWidth,
      priority: ['event-20', 'event-18', 'event-08', 'event-09', 'event-17'].includes(record.event.id) ? 2 : 1 });
    entry.caption.hidden = true;
  }
  for (const { caption, left, width } of layoutContextLabels(labels, worldLeft, worldLeft + viewport, 1)) {
    caption.hidden = false; caption.style.left = `${left}px`; caption.style.maxWidth = `${width}px`;
  }
}

function paint(model, container) {
  const { ribbon, canvas, height, width } = model;
  const view = container.getBoundingClientRect();
  const worldLeft = Math.max(0, view.left - ribbon.getBoundingClientRect().left);
  const viewport = Math.min(width - worldLeft, container.clientWidth);
  if (viewport <= 0) return;
  const year = xToYear(worldLeft + viewport / 2, width);
  const camera = storyCamera(year, model.pose, viewport);
  const fragments = exposedStory(model.pose);
  const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
  canvas.style.left = `${worldLeft}px`; canvas.style.width = `${viewport}px`; canvas.style.height = `${height}px`;
  const pixels = Math.ceil(viewport * pixelRatio), rows = Math.ceil(height * pixelRatio);
  if (canvas.width !== pixels) canvas.width = pixels;
  if (canvas.height !== rows) canvas.height = rows;
  const ink = canvas.getContext('2d'); ink.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ink.fillStyle = '#e8dec8'; ink.fillRect(0, 0, viewport, height); ink.translate(-camera, 0);
  const artTop = BORDER_HEIGHT + CAPTION_HEIGHT;
  const border = model.loaded.get(STORY_BORDER.file);
  const tileWidth = STORY_BORDER.width * BORDER_HEIGHT / STORY_BORDER.height;
  for (const fragment of fragments) {
    const { panel, left, sourceX, width: exposedWidth } = fragment;
    if (left + exposedWidth < camera || left > camera + viewport) continue;
    const image = model.loaded.get(panel.atlas.file);
    // Each band already contains one authored scene. Never composite separate
    // historical motifs here or introduce new baselines for concurrent events.
    if (image) {
      const cropX = panel.crop.x + (sourceX - panel.sourceX) / panel.unit;
      const bodyHeight = panel.crop.height * panel.unit;
      ink.drawImage(image, cropX, panel.crop.y, exposedWidth / panel.unit, panel.crop.height,
        left, artTop + model.artHeight - bodyHeight, exposedWidth, bodyHeight);
    }
    if (border) {
      ink.save(); ink.beginPath(); ink.rect(left, 0, exposedWidth, height); ink.clip();
      for (let tile = Math.floor(sourceX / tileWidth) * tileWidth; tile < sourceX + exposedWidth; tile += tileWidth)
        for (const y of [0, height - BORDER_HEIGHT]) ink.drawImage(border,
          STORY_BORDER.x, STORY_BORDER.y, STORY_BORDER.width, STORY_BORDER.height,
          left + tile - sourceX, y, tileWidth, BORDER_HEIGHT);
      ink.restore();
    }
  }
  // A thin turned edge explains each fold. No grey bands tint the scene, and
  // no crease remains when the full fixed drawing is exposed at maximum zoom.
  for (const fragment of fragments) {
    const cell = fragment.panel;
    const edge = fragment.left + fragment.width;
    if (cell.open >= 1 || edge < camera || edge > camera + viewport) continue;
    const shade = ink.createLinearGradient(edge - 3, 0, edge, 0);
    shade.addColorStop(0, 'transparent'); shade.addColorStop(.75, `rgba(103,67,36,${.20 * (1 - cell.open)})`);
    shade.addColorStop(1, `rgba(74,43,24,${.42 * (1 - cell.open)})`);
    ink.fillStyle = shade; ink.fillRect(edge - 3, 0, 3, height);
    ink.fillStyle = `rgba(255,246,216,${.45 * (1 - cell.open)})`; ink.fillRect(edge, 0, .7, height);
  }
  const failed = [...model.loaded.values()].some(value => !value);
  ribbon.dataset.artReady = model.loading ? 'false' : failed ? 'fallback' : 'true';
  ribbon.setAttribute('aria-busy', String(model.loading));
  model.status.hidden = model.loading || !failed;
  ribbon.dataset.cameraYear = String(year); ribbon.dataset.cameraX = String(camera);
  positionRecords(model, fragments, worldLeft, camera, viewport);
}

export function renderStory(timeline, events, width, height, top, scale, onSelect) {
  let ribbon = timeline.querySelector('.tapestry-story');
  if (!ribbon) {
    ribbon = document.createElement('div'); ribbon.className = 'tapestry-ribbon tapestry-story';
    ribbon.dataset.artStyle = 'tapestry'; ribbon.setAttribute('role', 'group');
    ribbon.setAttribute('aria-label', 'One continuous Bayeux embroidered historical narrative. Concurrent subjects are drawn together. Fixed cloth folds reveal detail on zoom; picture width is symbolic, not event duration. Select a subject for its recorded dates, English details and evidence.');
    const canvas = document.createElement('canvas'); canvas.className = 'tapestry-story-canvas';
    canvas.setAttribute('aria-hidden', 'true'); ribbon.appendChild(canvas);
    const status = document.createElement('span'); status.className = 'tapestry-art-status';
    status.setAttribute('role', 'status'); status.hidden = true;
    status.textContent = 'Some artwork could not load. Select a subject for details, or switch to Bars.';
    ribbon.appendChild(status);
    models.set(ribbon, { ribbon, canvas, status, records: new Map(), loaded: new Map(), generation: 0 });
  }
  const model = models.get(ribbon);
  Object.assign(model, { width, height: Math.max(1, height - top - 16), onSelect });
  model.artHeight = Math.max(1, model.height - 2 * BORDER_HEIGHT - CAPTION_HEIGHT);
  model.layout = layoutStory(events, width, model.artHeight);
  model.pose = foldStory(model.layout, timeline.parentElement?.clientWidth || width / scale, scale);
  ribbon.style.cssText = `top:${top + 8}px;width:${width}px;height:${model.height}px`;
  ribbon.dataset.foldOpen = String(model.pose.progress); ribbon.dataset.zoomLimit = String(config.MAX_SCALE);
  ribbon.dataset.materialWidth = String(model.layout.materialWidth); ribbon.dataset.linearPanels = String(model.layout.panels.length);
  const active = new Set();
  for (const { event } of model.layout.records) {
    active.add(event.id);
    const entry = model.records.get(event.id) || makeRecord(model, event);
    model.records.set(event.id, entry); entry.event = event;
    entry.button.dataset.startYear = String(event.startYear); entry.button.dataset.endYear = String(event.endYear);
    const heading = `${event.title} · ${contextDate(event)}`;
    entry.button.dataset.tooltip = `${heading}\n${event.details || ''}`; entry.button.setAttribute('aria-label', `${heading}. ${event.details || ''}`);
    entry.caption.textContent = contextHeading(event, 'tapestry').title; entry.caption.style.top = `${BORDER_HEIGHT + 4}px`;
  }
  for (const [id, entry] of model.records) if (!active.has(id)) {
    entry.button.remove(); entry.caption.remove(); model.records.delete(id);
  }
  if (ribbon.parentElement !== timeline) timeline.appendChild(ribbon);
  const labelKey = [...model.records.values()].map(entry => entry.caption.textContent).join('|');
  if (labelKey !== model.labelKey) {
    captionMeasure ||= document.createElement('canvas').getContext('2d');
    const first = model.records.values().next().value;
    if (first) {
      const style = getComputedStyle(first.caption); captionMeasure.font = style.font;
      const spacing = parseFloat(style.letterSpacing) || 0;
      model.records.forEach(entry => { entry.labelWidth = captionMeasure.measureText(entry.caption.textContent).width + entry.caption.textContent.length * spacing + 4; });
    }
    model.labelKey = labelKey;
  }
  const files = [...new Set([STORY_BORDER.file, ...model.layout.panels.map(p => p.atlas.file)])];
  const missing = files.filter(file => !model.loaded.has(file)); model.loading = missing.length > 0;
  if (missing.length) {
    const generation = ++model.generation;
    Promise.all(missing.map(async file => [file, await loadStoryImage(file)])).then(loaded => {
      if (model.disposed || generation !== model.generation) return;
      loaded.forEach(([file, image]) => model.loaded.set(file, image)); model.loading = false;
      updateStory(ribbon, ribbon.parentElement?.parentElement);
    });
  }
  if (timeline.dataset.zoomMotion !== 'true') updateStory(ribbon, timeline.parentElement);
}

export function updateStory(ribbon, container) {
  const model = models.get(ribbon);
  if (model && container && !model.disposed) paint(model, container);
}
export function disposeStory(ribbon) {
  const model = models.get(ribbon);
  if (model) { model.disposed = true; model.generation++; models.delete(ribbon); }
}
