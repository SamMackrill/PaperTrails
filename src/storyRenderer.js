import { layoutContextLabels } from './contextLabels.js?v=pass2-latin-retries-v1';
import { layoutStory, foldStory, exposedStory, storyCamera } from './storyLayout.js?v=pass2-continuous-linen-v1';
import { layoutScientificBorder, exposedScientificBorder, scientificBorderFrame, scientificBorderY } from './scientificBorders.js?v=pass2-continuous-linen-v1';
import { paintLinen } from './linenBacking.js';
import { contextHeading } from './contextHeadings.js?v=pass2-cloth-recovery-v1';
import { contextDate } from './contextModel.js?v=pass2-chapters-v2';
import { recordKey } from './itemIdentity.js';
import { xToYear } from './timeScale.js?v=3';
import { config } from './config.js?v=16';
import { scientists, discoveries } from './dataLoader.js?v=pass2-story-v2';
import { scientificStoryRecords } from './storyScience.js';
import { planInscription, planNarrowerInscription, drawInscription, INSCRIPTION_LINE_HEIGHT } from './stitchedInscriptions.js?v=pass2-latin-retries-v1';
const models = new WeakMap();
const images = new Map();
const INSCRIPTION_SCALE = .78;
const LETTER_ROW_HEIGHT = INSCRIPTION_LINE_HEIGHT * INSCRIPTION_SCALE;

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
  button.dataset.itemKey = event.itemKey || recordKey('event', event); button.dataset.tooltipAnchor = 'scene';
  const caption = document.createElement('span');
  caption.className = 'tapestry-caption'; caption.lang = 'la';
  const lettering = document.createElement('canvas'); lettering.className = 'tapestry-inscription';
  lettering.setAttribute('aria-hidden', 'true');
  const text = document.createElement('span'); text.className = 'sr-only';
  caption.append(lettering, text);
  const entry = { button, caption, lettering, text, hits: [], event };
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
    entry.button.style.cssText = `left:${worldLeft + first}px;width:${Math.max(1, last - first)}px;top:${model.borderHeight}px;height:${model.artHeight}px;pointer-events:none`;
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
    const inscription = spans.length ? planInscription(entry.text.textContent, viewport - 8, INSCRIPTION_SCALE) : null;
    const narrower = inscription && planNarrowerInscription(entry.text.textContent, viewport - 8, inscription.width, INSCRIPTION_SCALE);
    if (inscription) labels.push({ entry, inscription, narrower, caption: entry.caption, start: worldLeft + first,
      end: worldLeft + last, width: inscription.width, lines: inscription.lines.length,
      priority: record.event.itemKey || ['event-20', 'event-18', 'event-08', 'event-09', 'event-17'].includes(record.event.id) ? 2 : 1 });
    entry.caption.hidden = true;
  }
  const placed = layoutContextLabels(labels, worldLeft, worldLeft + viewport, 2);
  const placedEntries = new Set(placed.map(label => label.entry));
  const retries = layoutContextLabels(labels.filter(label => !placedEntries.has(label.entry) && label.narrower)
    .map(label => ({ ...label, inscription: label.narrower, width: label.narrower.width, lines: label.narrower.lines.length })),
  worldLeft, worldLeft + viewport, 2, placed);
  for (const { entry, inscription, caption, left, width, row } of [...placed, ...retries]) {
    const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
    const key = `${inscription.key}:${pixelRatio}`;
    if (entry.inscriptionKey !== key) {
      drawInscription(entry.lettering, inscription, pixelRatio); entry.inscriptionKey = key;
    }
    caption.hidden = false; caption.style.left = `${left}px`; caption.style.width = `${width}px`;
    caption.style.top = `${model.borderHeight + 2 + row * LETTER_ROW_HEIGHT}px`;
    caption.dataset.inscription = inscription.text; caption.dataset.lines = String(inscription.lines.length);
  }
  return [...placed, ...retries];
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
  paintLinen(ink, viewport, height, camera);
  const artTop = model.borderHeight;
  const lettering = positionRecords(model, fragments, worldLeft, camera, viewport);
  for (const { entry, left, row, inscription } of lettering) {
    ink.drawImage(entry.lettering, left - worldLeft, artTop + 2 + row * LETTER_ROW_HEIGHT,
      inscription.width, inscription.height);
  }
  ink.translate(-camera, 0);
  for (const fragment of fragments) {
    const { panel, left, sourceX, width: exposedWidth } = fragment;
    if (left + exposedWidth < camera || left > camera + viewport) continue;
    const image = model.loaded.get(panel.atlas.file);
    // Each band already contains one authored scene. Never composite separate
    // historical motifs here or introduce new baselines for concurrent events.
    if (image) {
      const cropX = panel.crop.x + (sourceX - panel.sourceX) / panel.unit;
      const bodyHeight = panel.crop.height * panel.unit;
      // Transparent thread artwork shares one linen backing. Opaque wool
      // interrupts lettering naturally; exposed fabric remains continuous.
      ink.drawImage(image, cropX, panel.crop.y, exposedWidth / panel.unit, panel.crop.height,
        left, artTop + model.artHeight - bodyHeight, exposedWidth, bodyHeight);
      ink.globalCompositeOperation = 'source-over';
    }
    for (const border of exposedScientificBorder(model.borders.get(panel.id), fragment)) {
      const drawing = model.loaded.get(border.file);
      if (!drawing) continue;
      const y = scientificBorderY(border, model);
      ink.drawImage(drawing, border.crop.x, border.crop.y, border.crop.width, border.crop.height,
        border.left, y, border.width, border.height);
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
  Object.assign(model, scientificBorderFrame(model.height));
  model.layout = layoutStory([...events, ...scientificStoryRecords(scientists, discoveries)], width, model.artHeight);
  model.borders = new Map(model.layout.panels.map(panel => [panel.id, layoutScientificBorder(panel)]));
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
    entry.text.textContent = event.inscription || contextHeading(event, 'tapestry').title;
  }
  for (const [id, entry] of model.records) if (!active.has(id)) {
    entry.button.remove(); entry.caption.remove(); model.records.delete(id);
  }
  if (ribbon.parentElement !== timeline) timeline.appendChild(ribbon);
  const files = [...new Set([...model.layout.panels.map(p => p.atlas.file),
    ...[...model.borders.values()].flat().map(border => border.file)])];
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
