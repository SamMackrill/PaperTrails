import { config } from './config.js?v=15';
import { scientists, discoveries, conferences, significantEvents, getRelatedItems } from './dataLoader.js?v=18';
import { groupKey, openItem } from './modalManager.js?v=24';
import { renderTapestry } from './tapestryRenderer.js?v=5';
import { getScaleSegments, yearToX } from './timeScale.js?v=2';
import { createPortrait } from './portraits.js?v=2';
import {
  EVENT_PIN_GAP,
  EVENT_LABEL_PADDING,
  binPublications,
  getTimelineLabel,
  getNotability,
  layoutEventRows,
  layoutMilestoneRows,
  layoutPeople,
  planEventLabel,
  planLanes,
  rankForFaces
} from './timelineLayout.js?v=1';

const SVG_NS = 'http://www.w3.org/2000/svg';
const EVENT_LABEL_FONT = '650 11px';
const NAME_LABEL_FONT = '650 10px';
const PERSON_SIZE = 40;
const FACE_SIZE = 30;
const FACE_STEP = 18;
const PUBLICATION_BIN = 11;
const PUBLICATION_PITCH = 8;
const PUBLICATION_MAX_STACK = 5;
const MILESTONE_FIRST_OFFSET = 60;
const MILESTONE_GAP = 42;
const TAPESTRY_LANE_HEIGHT = 200;

// Timeline items are rebuilt on every zoom, so selection is tracked by a stable
// item key rather than by element.
let selectedItemKey = null;
let measureContext = null;
let measureFontFamily = null;
// Activation handlers for the current render, looked up by item key from a
// single delegated listener instead of one listener per marker.
const itemActions = new Map();
// The item under the pointer or keyboard focus, whose connections are shown
// in place of the selected item's.
let hoverKey = null;

function isLayerVisible(id) {
  return document.getElementById(id)?.getAttribute('aria-pressed') !== 'false';
}

function createSvgLine(className, x1, y1, x2, y2) {
  const line = document.createElementNS(SVG_NS, 'line');
  line.setAttribute('x1', x1);
  line.setAttribute('y1', y1);
  line.setAttribute('x2', x2);
  line.setAttribute('y2', y2);
  line.classList.add(className);
  return line;
}

// The font family is read once, because reading computed style between DOM
// insertions can force a style recalculation on every call.
function measureText(text, font) {
  if (!measureContext) measureContext = document.createElement('canvas').getContext('2d');
  if (!measureFontFamily) measureFontFamily = getComputedStyle(document.body).fontFamily;
  const fontString = `${font} ${measureFontFamily}`;
  if (measureContext.font !== fontString) measureContext.font = fontString;
  return measureContext.measureText(text).width;
}

function getTier(scale) {
  return scale < 1.5 ? 'overview' : scale < 3 ? 'standard' : 'detail';
}

function applySelection(timeline) {
  timeline.querySelectorAll('.is-selected').forEach((item) => item.classList.remove('is-selected'));
  const element = selectedItemKey ? findItemElement(timeline, selectedItemKey) : null;
  element?.classList.add('is-selected');
  refreshRelations(timeline);
  return element;
}

// Finds the element for an item key. People hidden inside a face stack are
// represented by their group.
function findItemElement(timeline, key) {
  const direct = timeline.querySelector(`[data-item-key="${CSS.escape(key)}"]`);
  if (direct || !key.startsWith('scientist:')) return direct;
  return timeline.querySelector(`.scientist-cluster[data-member-ids~="${CSS.escape(key.slice('scientist:'.length))}"]`);
}

function centreOf(element) {
  return { x: element.offsetLeft + element.offsetWidth / 2, y: element.offsetTop + element.offsetHeight / 2 };
}

function parseYear(date) {
  const year = Number.parseInt(String(date || '').slice(0, 4), 10);
  return Number.isFinite(year) ? year : null;
}

// Shows a scientist's lifetime as a bar behind their portrait.
function drawLifespan(timeline, scientistId) {
  const scientist = scientists[scientistId];
  const node = findItemElement(timeline, `scientist:${scientistId}`);
  const birth = parseYear(scientist?.birth);
  if (!node || birth === null) return;
  const death = parseYear(scientist.death) ?? config.END_YEAR;
  const width = parseFloat(timeline.style.width) || timeline.offsetWidth;
  const left = yearToX(Math.max(config.START_YEAR, birth), width);
  const right = yearToX(Math.min(config.END_YEAR, death), width);

  const bar = document.createElement('div');
  bar.className = 'lifespan';
  bar.setAttribute('aria-hidden', 'true');
  bar.style.left = `${left}px`;
  bar.style.width = `${Math.max(2, right - left)}px`;
  bar.style.top = `${centreOf(node).y}px`;
  bar.style.setProperty('--scientist-color', scientist.color || 'var(--accent)');
  const start = document.createElement('span');
  start.className = 'lifespan-year lifespan-start';
  start.textContent = String(birth);
  const end = document.createElement('span');
  end.className = 'lifespan-year lifespan-end';
  end.textContent = scientist.death ? String(death) : 'living';
  bar.append(start, end);
  timeline.appendChild(bar);
}

// Draws the connections of the hovered item, or else the selected one, and
// dims everything unrelated.
function refreshRelations(timeline) {
  if (!timeline) return;
  timeline.querySelectorAll('.is-related, .is-related-source').forEach((element) => element.classList.remove('is-related', 'is-related-source'));
  timeline.querySelectorAll('.scientist-link.highlight').forEach((line) => line.classList.remove('highlight'));
  timeline.querySelector('.lifespan')?.remove();
  const layer = timeline.querySelector('.relation-layer');
  layer?.replaceChildren();

  const key = hoverKey || selectedItemKey;
  const source = key ? findItemElement(timeline, key) : null;
  timeline.classList.toggle('has-relations', Boolean(source));
  if (!source) return;
  source.classList.add('is-related-source');

  const sourceType = key.split(':')[0];
  const timelineRect = timeline.getBoundingClientRect();
  // Tapestry scenes sit inside the ribbon, so their offsets are not timeline
  // coordinates; measure them from the page instead.
  const pointOf = (element) => {
    if (!element.closest('.tapestry-ribbon')) return centreOf(element);
    const rect = element.getBoundingClientRect();
    return { x: rect.left - timelineRect.left + rect.width / 2, y: rect.top - timelineRect.top + rect.height / 2 };
  };
  const from = pointOf(source);
  getRelatedItems(key).forEach(({ key: relatedKey, line }) => {
    const target = findItemElement(timeline, relatedKey);
    if (!target || target === source) return;
    target.classList.add('is-related');
    if (!line || !layer) return;
    let to = pointOf(target);
    if (target.classList.contains('event-band') || target.classList.contains('tapestry-scene')) {
      const band = target.getBoundingClientRect();
      const bandLeft = band.left - timelineRect.left;
      to = { x: Math.max(bandLeft, Math.min(bandLeft + band.width, from.x)), y: band.top - timelineRect.top + 4 };
    }
    const bend = Math.min(80, Math.abs(to.x - from.x) * 0.2);
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', `M${from.x} ${from.y} Q${(from.x + to.x) / 2} ${(from.y + to.y) / 2 - bend} ${to.x} ${to.y}`);
    const kind = sourceType === 'scientist' ? relatedKey.split(':')[0] : sourceType;
    path.setAttribute('class', `relation-line relation-${kind}`);
    layer.appendChild(path);
  });

  const scientistId = sourceType === 'scientist' ? key.slice('scientist:'.length)
    : sourceType === 'publication' ? key.split(':')[1] : null;
  if (scientistId) {
    timeline.querySelector(`.scientist-link[data-scientist-id="${CSS.escape(scientistId)}"]`)?.classList.add('highlight');
    if (sourceType === 'scientist') drawLifespan(timeline, scientistId);
  }
}

export function selectItem(element) {
  selectedItemKey = element?.dataset.itemKey || null;
  applySelection(document.getElementById('timeline'));
}

export function selectItemByKey(itemKey) {
  selectedItemKey = itemKey || null;
  return applySelection(document.getElementById('timeline'));
}

export function clearTimelineSelection() {
  selectedItemKey = null;
  applySelection(document.getElementById('timeline'));
}

function setupDelegatedEvents(timeline) {
  if (timeline.dataset.delegated) return;
  timeline.dataset.delegated = 'true';

  timeline.addEventListener('click', (event) => {
    const element = event.target.closest('[data-item-key]');
    const action = element && itemActions.get(element.dataset.itemKey);
    if (action) action(element);
  });

  const relationTarget = (event) => event.target.closest?.('[data-item-key]:not(.publication-cap):not(.scientist-cluster)');
  const enter = (event) => {
    const element = relationTarget(event);
    if (!element || element.contains(event.relatedTarget)) return;
    hoverKey = element.dataset.itemKey;
    refreshRelations(timeline);
  };
  const leave = (event) => {
    const element = relationTarget(event);
    if (!element || element.contains(event.relatedTarget)) return;
    hoverKey = null;
    refreshRelations(timeline);
  };
  timeline.addEventListener('mouseover', enter);
  timeline.addEventListener('mouseout', leave);
  timeline.addEventListener('focusin', enter);
  timeline.addEventListener('focusout', leave);
}

// In the density scale, alternate eras are shaded and each carries a small
// ruler, so compressed and stretched time is never mistaken for even time.
function renderScaleSegments(timeline, width, height) {
  const segments = getScaleSegments();
  const niceSpans = [1, 2, 5, 10, 20, 25, 50, 100, 200];
  segments.forEach((segment, index) => {
    const left = segment.start * width;
    const segmentWidth = (segment.end - segment.start) * width;
    if (segmentWidth < 2) return;
    const band = document.createElement('div');
    band.className = `scale-segment${index % 2 ? ' is-alternate' : ''}`;
    band.style.left = `${left}px`;
    band.style.width = `${segmentWidth}px`;
    band.style.height = `${height}px`;
    band.setAttribute('aria-hidden', 'true');

    const pixelsPerYear = segmentWidth / (segment.to - segment.from);
    const span = niceSpans.find((years) => years * pixelsPerYear >= 24) || niceSpans[niceSpans.length - 1];
    const rulerWidth = span * pixelsPerYear;
    if (rulerWidth <= segmentWidth - 8 && rulerWidth <= 120) {
      const ruler = document.createElement('span');
      ruler.className = 'scale-ruler';
      const bar = document.createElement('span');
      bar.className = 'scale-ruler-bar';
      bar.style.width = `${rulerWidth}px`;
      ruler.append(bar, document.createTextNode(`${span} yr${span === 1 ? '' : 's'}`));
      band.appendChild(ruler);
    }
    timeline.appendChild(band);
  });
}

function renderAxis(timeline, svg, width, height, axisY, scale) {
  const axis = document.createElement('div');
  axis.className = 'timeline-axis-line';
  axis.style.top = `${axisY - 1}px`;
  timeline.appendChild(axis);

  const endX = yearToX(config.END_YEAR, width);
  const endLabelWidth = measureText(String(config.END_YEAR), '700 12px');
  const tier = getTier(scale);
  // Labels are spaced by measured width, because the density scale can
  // squeeze some decades closer together than others.
  let lastLabelRight = -Infinity;

  const addYear = (year, isCurrent = false) => {
    const x = yearToX(year, width);
    const isCentury = year % 100 === 0;
    const isHalfCentury = year % 50 === 0;
    const classes = ['tick-decade'];
    if (isHalfCentury) classes.push('tick-half-century');
    if (isCentury) classes.push('tick-century');
    if (isCurrent) classes.push('tick-current');
    if (year === config.START_YEAR) classes.push('tick-start');
    if (year === config.END_YEAR) classes.push('tick-end');

    const marker = document.createElement('div');
    marker.className = `year-marker ${classes.join(' ')}`;
    marker.style.left = `${x}px`;
    marker.style.top = `${axisY}px`;
    timeline.appendChild(marker);

    if (isCentury) {
      const gridLine = createSvgLine('century-grid', x, 0, x, height);
      svg.appendChild(gridLine);
    }

    const shownAtTier = isCentury || isCurrent || year === config.START_YEAR
      || tier === 'detail' || (tier === 'standard' && isHalfCentury);
    if (!shownAtTier) return;
    // The right-aligned end label would otherwise run into a nearby tick label.
    const labelWidth = measureText(String(year), '700 12px');
    if (!isCurrent && year !== config.END_YEAR && x + labelWidth / 2 + 8 > endX - endLabelWidth) return;
    const labelLeft = year === config.START_YEAR ? x : isCurrent || year === config.END_YEAR ? x - labelWidth : x - labelWidth / 2;
    // Only the start and end labels are exempt, so compressed centuries
    // cannot overlap either.
    const pinned = isCurrent || year === config.START_YEAR || year === config.END_YEAR;
    if (!pinned && labelLeft < lastLabelRight + 10) return;
    lastLabelRight = labelLeft + labelWidth;

    const label = document.createElement('span');
    label.className = `year-label ${classes.join(' ')}`;
    label.style.left = `${x}px`;
    label.style.top = `${axisY + 18}px`;
    label.textContent = String(year);
    timeline.appendChild(label);
  };

  const lastDecade = Math.floor(config.END_YEAR / 10) * 10;
  for (let year = config.START_YEAR; year <= lastDecade; year += 10) addYear(year);
  if (config.END_YEAR > lastDecade) addYear(config.END_YEAR, true);
}

function getFirstPublication(scientist) {
  return [...(scientist.publications || [])]
    .filter((publication) => Number.isFinite(publication.year))
    .sort((a, b) => a.year - b.year)[0];
}

function renderPublications(timeline, width, axisY, coordinates) {
  const items = [];
  Object.entries(scientists).forEach(([scientistId, scientist]) => {
    (scientist.publications || []).forEach((publication, index) => {
      if (!Number.isFinite(publication.year)) return;
      items.push({
        scientistId,
        scientist,
        publication,
        index,
        year: publication.year,
        x: Math.max(0, Math.min(width - 1, yearToX(publication.year, width)))
      });
    });
  });

  const { stacked, caps } = binPublications(items, { binWidth: PUBLICATION_BIN, maxStack: PUBLICATION_MAX_STACK });
  const stackY = (stackIndex) => axisY - stackIndex * PUBLICATION_PITCH;

  stacked.forEach(({ scientistId, publication, stackIndex, binX }) => {
    const key = `publication_${scientistId}_${publication.year}`;
    if (!coordinates[key]) coordinates[key] = { x: binX, y: stackY(stackIndex) };
  });
  if (!isLayerVisible('publicationsToggle')) return;

  stacked.forEach(({ scientistId, scientist, publication, index, stackIndex, binX }) => {
    const marker = document.createElement('button');
    marker.type = 'button';
    marker.className = 'publication';
    marker.dataset.scientistId = scientistId;
    marker.dataset.itemKey = `publication:${scientistId}:${index}`;
    marker.dataset.tooltip = `${publication.title || 'Untitled publication'} · ${scientist.name || 'Unknown author'} · ${publication.year}`;
    marker.setAttribute('aria-label', `${publication.title || 'Untitled publication'}, by ${scientist.name || 'unknown author'}, ${publication.year}`);
    marker.style.left = `${binX - 7}px`;
    marker.style.top = `${stackY(stackIndex) - 7}px`;
    marker.style.setProperty('--scientist-color', scientist.color || 'var(--accent)');
    const mark = document.createElement('span');
    mark.className = 'publication-mark';
    marker.appendChild(mark);
    itemActions.set(marker.dataset.itemKey, (element) => {
      selectItem(element);
      openItem(element.dataset.itemKey, { fromTimeline: true });
    });
    timeline.appendChild(marker);
  });

  let lastTextCapX = -Infinity;
  caps.forEach(({ binX, count, year }, capIndex) => {
    const cap = document.createElement('button');
    cap.type = 'button';
    // Neighbouring counts would collide, so crowded caps become dots.
    const compact = binX - lastTextCapX < 22;
    if (!compact) lastTextCapX = binX;
    cap.className = `publication-cap${compact ? ' is-compact' : ''}`;
    cap.dataset.itemKey = `publication-cap:${capIndex}`;
    cap.dataset.tooltip = `${count} more publications around ${year} · zoom in to see them`;
    cap.setAttribute('aria-label', `${count} more publications around ${year}. Zoom in to see them.`);
    cap.textContent = `+${count}`;
    cap.style.left = `${binX}px`;
    cap.style.top = `${stackY(PUBLICATION_MAX_STACK) - 12}px`;
    itemActions.set(cap.dataset.itemKey, () => {
      document.dispatchEvent(new CustomEvent('papertrails:zoomcluster', { detail: { year } }));
    });
    timeline.appendChild(cap);
  });
}

function createFaceStack(members) {
  const faces = document.createElement('span');
  faces.className = 'cluster-faces';
  faces.setAttribute('aria-hidden', 'true');
  [...members].sort(rankForFaces).slice(0, 3).forEach(({ scientist }) => {
    faces.appendChild(createPortrait(scientist, 'cluster-face scientist-photo'));
  });
  return faces;
}

function renderScientists(timeline, svg, width, axisY, coordinates, scale) {
  if (!isLayerVisible('peopleToggle')) return;

  const tier = getTier(scale);
  const showLabel = (scientist) => tier === 'detail' || (tier === 'standard' && getNotability(scientist) === 1);
  const entries = Object.entries(scientists)
    .map(([id, scientist]) => ({ id, scientist, firstPublication: getFirstPublication(scientist) }))
    .filter((entry) => entry.firstPublication)
    .map((entry) => {
      const label = showLabel(entry.scientist) ? getTimelineLabel(entry.scientist.name) : '';
      const labelWidth = label ? measureText(label, NAME_LABEL_FONT) + 8 : 0;
      return {
        ...entry,
        label,
        x: yearToX(entry.firstPublication.year, width),
        width: Math.max(PERSON_SIZE, labelWidth)
      };
    })
    .sort((a, b) => a.x - b.x);

  const anyLabels = entries.some((entry) => entry.label);
  const rowPitch = anyLabels ? 56 : 45;
  const top = 30;
  const bottom = Math.max(top, axisY - PUBLICATION_MAX_STACK * PUBLICATION_PITCH - 34 - (anyLabels ? 12 : 0));
  const levelCount = Math.max(2, Math.min(8, Math.floor((bottom - top) / rowPitch) + 1));
  const clusterWidth = (count) => FACE_SIZE + (Math.min(3, count) - 1) * FACE_STEP + 10;
  const items = layoutPeople(entries, {
    levelCount,
    gap: 8,
    groupDistance: tier === 'overview' ? 46 : 0,
    clusterWidth
  });

  items.forEach((item) => {
    const levelProgress = levelCount === 1 ? 0 : item.level / (levelCount - 1);
    const centerY = bottom - (bottom - top) * levelProgress;
    const centerX = Math.max(item.width / 2, Math.min(width - item.width / 2, item.centerX));

    if (item.type === 'cluster') {
      const members = item.members;
      const years = members.map((member) => member.firstPublication.year);
      const meanYear = years.reduce((sum, year) => sum + year, 0) / years.length;
      const names = [...members].sort(rankForFaces).map((member) => member.scientist.name).filter(Boolean);
      const cluster = document.createElement('button');
      cluster.type = 'button';
      cluster.className = 'scientist-cluster';
      // Keyed by its earliest member, so focus survives re-renders.
      cluster.dataset.itemKey = `cluster:${members[0].id}`;
      cluster.dataset.memberIds = members.map((member) => member.id).join(' ');
      cluster.dataset.tooltip = `${members.length} scientists, ${Math.min(...years)}–${Math.max(...years)} · ${names.join(', ')}`;
      const atMaximum = scale >= config.MAX_SCALE - 0.001;
      cluster.setAttribute('aria-label', `${members.length} scientists: ${names.join(', ')}. ${atMaximum ? 'Open the group.' : 'Zoom in to explore.'}`);
      const clusterPixelWidth = clusterWidth(members.length);
      cluster.style.left = `${centerX - clusterPixelWidth / 2}px`;
      cluster.style.top = `${centerY - FACE_SIZE / 2}px`;
      cluster.style.width = `${clusterPixelWidth}px`;
      cluster.appendChild(createFaceStack(members));
      const count = document.createElement('span');
      count.className = 'cluster-count';
      count.textContent = String(members.length);
      count.setAttribute('aria-hidden', 'true');
      cluster.appendChild(count);
      itemActions.set(cluster.dataset.itemKey, () => {
        if (atMaximum) {
          openItem(groupKey(members.map((member) => member.id), Math.min(...years), Math.max(...years)), { fromTimeline: true });
        } else {
          document.dispatchEvent(new CustomEvent('papertrails:zoomcluster', { detail: { year: meanYear } }));
        }
      });
      timeline.appendChild(cluster);
      return;
    }

    const { id, scientist, firstPublication, label } = item.members[0];
    const node = document.createElement('button');
    node.type = 'button';
    node.className = 'scientist-node';
    node.dataset.scientistId = id;
    node.dataset.itemKey = `scientist:${id}`;
    node.dataset.tooltip = `${scientist.name || 'Unknown scientist'} · first listed work ${firstPublication.year}`;
    node.setAttribute('aria-label', `${scientist.name || 'Unknown scientist'}, scientist details`);
    node.style.left = `${centerX - PERSON_SIZE / 2}px`;
    node.style.top = `${centerY - PERSON_SIZE / 2}px`;
    node.style.setProperty('--scientist-color', scientist.color || 'var(--accent)');

    const photo = createPortrait(scientist, 'scientist-photo');
    if (photo instanceof HTMLImageElement) photo.loading = 'lazy';
    node.appendChild(photo);
    if (label) {
      const nameLabel = document.createElement('span');
      nameLabel.className = 'scientist-name';
      nameLabel.textContent = label;
      nameLabel.setAttribute('aria-hidden', 'true');
      node.appendChild(nameLabel);
    }
    itemActions.set(node.dataset.itemKey, (element) => {
      selectItem(element);
      openItem(element.dataset.itemKey, { fromTimeline: true });
    });
    timeline.appendChild(node);

    const publicationCoordinate = coordinates[`publication_${id}_${firstPublication.year}`] || {
      x: yearToX(firstPublication.year, width),
      y: axisY
    };
    const line = createSvgLine('scientist-link', centerX, centerY, publicationCoordinate.x, publicationCoordinate.y);
    line.dataset.scientistId = id;
    line.style.setProperty('--scientist-color', scientist.color || 'var(--accent)');
    svg.appendChild(line);
  });
}

function getMilestoneItems(width) {
  return [
    ...(isLayerVisible('discoveriesToggle') ? discoveries.map((item, index) => ({ item, index, type: 'discovery' })) : []),
    ...(isLayerVisible('conferencesToggle') ? conferences.map((item, index) => ({ item, index, type: 'conference' })) : [])
  ]
    .filter(({ item }) => Number.isFinite(item.year))
    .map((entry) => ({ ...entry, x: yearToX(entry.item.year, width) }))
    .sort((a, b) => a.x - b.x);
}

function getMilestoneSize(scale) {
  return getTier(scale) === 'overview' ? 22 : 30;
}

function measureMilestoneNeed(width, scale) {
  const items = getMilestoneItems(width);
  if (!items.length) return 0;
  const markerSize = getMilestoneSize(scale);
  const { rows } = layoutMilestoneRows(items, markerSize);
  return MILESTONE_FIRST_OFFSET + (rows - 1) * MILESTONE_GAP + markerSize / 2 + 14;
}

function renderMilestones(timeline, svg, width, axisY, contextTop, scale) {
  const items = getMilestoneItems(width);
  if (!items.length) return;

  const markerSize = getMilestoneSize(scale);
  const { placements, rows } = layoutMilestoneRows(items, markerSize);
  const firstLevelY = axisY + MILESTONE_FIRST_OFFSET;
  const available = contextTop - firstLevelY - markerSize / 2 - 8;
  // Dense decades stack markers closer, overlapping if necessary, rather than
  // spilling into the context lane.
  const levelGap = rows > 1 ? Math.min(MILESTONE_GAP, Math.max(8, available / (rows - 1))) : MILESTONE_GAP;
  const glyphRoom = markerSize - 9;

  placements.forEach(({ item, index, type, x, level }) => {
    const centerX = Math.max(markerSize / 2, Math.min(width - markerSize / 2, x));
    const centerY = firstLevelY + level * levelGap;

    const marker = document.createElement('button');
    marker.type = 'button';
    marker.className = `${type}-marker`;
    marker.dataset.itemKey = `${type}:${index}`;
    const fallbackTitle = type === 'conference' ? 'Untitled conference' : 'Untitled discovery';
    marker.dataset.tooltip = `${item.title || fallbackTitle} · ${item.year}`;
    marker.setAttribute('aria-label', `${item.title || fallbackTitle}, ${item.year}`);
    marker.style.left = `${centerX - markerSize / 2}px`;
    marker.style.top = `${centerY - markerSize / 2}px`;
    marker.style.width = `${markerSize}px`;
    marker.style.height = `${markerSize}px`;

    const glyph = item.particle || (type === 'conference' ? '◆' : '•');
    const symbol = document.createElement('span');
    symbol.textContent = glyph;
    symbol.setAttribute('aria-hidden', 'true');
    // Long glyphs shrink to fit rather than being clipped.
    const glyphWidth = measureText(glyph, '800 11px');
    symbol.style.fontSize = `${Math.max(7, Math.min(11, (11 * glyphRoom) / Math.max(1, glyphWidth)))}px`;
    marker.appendChild(symbol);
    itemActions.set(marker.dataset.itemKey, (element) => {
      selectItem(element);
      openItem(element.dataset.itemKey, { fromTimeline: true });
    });
    timeline.appendChild(marker);

    svg.appendChild(createSvgLine(`${type}-link`, x, axisY + 30, centerX, centerY));
  });
}

function getEventItems(width) {
  return significantEvents
    .map((event, index) => ({ event, index }))
    .filter(({ event }) => Number.isFinite(event.startYear) && Number.isFinite(event.endYear) && event.endYear >= event.startYear)
    .sort((a, b) => a.event.startYear - b.event.startYear)
    .map(({ event, index }) => {
      const startX = yearToX(event.startYear, width);
      const bandWidth = Math.max(2, yearToX(event.endYear, width) - startX);
      const fullTitle = event.title || 'Historical event';
      const shortTitle = event.shortTitle || fullTitle;
      const plan = planEventLabel(bandWidth, measureText(fullTitle, EVENT_LABEL_FONT), measureText(shortTitle, EVENT_LABEL_FONT));
      return { event, index, startX, bandWidth, fullTitle, shortTitle, plan };
    });
}

function measureContextNeed(width, tapestry) {
  if (tapestry) return TAPESTRY_LANE_HEIGHT;
  const { rows } = layoutEventRows(getEventItems(width), Infinity);
  return 16 + 30 + (rows - 1) * 36 + 8;
}

function renderEvents(timeline, width, height, contextTop) {
  const laneTop = contextTop + 8;
  const laneHeight = height - laneTop - 8;
  const idealBandHeight = 30;
  const idealGap = 36;
  const comfortableRows = Math.max(1, Math.floor((laneHeight - idealBandHeight) / idealGap) + 1);

  const { placements, rows } = layoutEventRows(getEventItems(width), comfortableRows);
  // Extra rows are squeezed into the lane rather than hidden below it.
  const levelGap = rows > 1 ? Math.min(idealGap, (laneHeight - idealBandHeight * 0.6) / (rows - 1)) : idealGap;
  const bandHeight = Math.max(12, Math.min(idealBandHeight, levelGap - 4));

  placements.forEach(({ event, index, startX, bandWidth, fullTitle, shortTitle, plan, level }) => {
    if (bandHeight < 20 && plan.mode === 'pin') plan = { ...plan, mode: 'none' };
    const band = document.createElement('button');
    band.type = 'button';
    band.className = `event-band label-${plan.mode}`;
    band.dataset.itemKey = `event:${index}`;
    band.dataset.fullTitle = fullTitle;
    band.dataset.shortTitle = shortTitle;
    band.dataset.tooltip = `${fullTitle} · ${event.startYear}–${event.endYear}`;
    band.setAttribute('aria-label', `${fullTitle}, ${event.startYear} to ${event.endYear}`);
    band.style.left = `${startX}px`;
    band.style.top = `${laneTop + level * levelGap}px`;
    band.style.width = `${bandWidth}px`;
    band.style.height = `${bandHeight}px`;

    if (plan.mode !== 'none') {
      const eventTitle = document.createElement('span');
      eventTitle.className = 'event-title';
      eventTitle.textContent = plan.useShort ? shortTitle : fullTitle;
      eventTitle.setAttribute('aria-hidden', 'true');
      if (plan.mode === 'pin') eventTitle.style.left = `${bandWidth + EVENT_PIN_GAP}px`;
      band.appendChild(eventTitle);
    }
    itemActions.set(band.dataset.itemKey, (element) => {
      selectItem(element);
      openItem(element.dataset.itemKey, { fromTimeline: true });
    });
    timeline.appendChild(band);
  });
}

export function updateScalePresentation(timeline, scale) {
  if (!timeline) return;
  const safeScale = Math.max(0.01, scale);
  timeline.style.setProperty('--current-scale', safeScale);
  timeline.style.setProperty('--current-inverse-scale', 1 / safeScale);
  timeline.dataset.zoomTier = getTier(safeScale);
}

// Keeps titles of long bands visible while panning, without ever letting a
// title escape the band that contains it.
export function updateEventLabelPositions(timeline, timelineContainer) {
  if (!timeline || !timelineContainer) return;

  const viewportRect = timelineContainer.getBoundingClientRect();

  timeline.querySelectorAll('.event-band.label-inside').forEach((band) => {
    const label = band.querySelector('.event-title');
    if (!label) return;

    const bandRect = band.getBoundingClientRect();
    const visibleLeft = Math.max(bandRect.left, viewportRect.left);
    const visibleRight = Math.min(bandRect.right, viewportRect.right);
    const visibleWidth = Math.max(0, visibleRight - visibleLeft);
    label.hidden = visibleWidth === 0;
    if (label.hidden) return;

    label.textContent = band.dataset.fullTitle || 'Historical event';
    const fitWidth = Math.min(band.clientWidth, visibleWidth) - EVENT_LABEL_PADDING;
    if (label.getBoundingClientRect().width > fitWidth || label.getBoundingClientRect().width > band.clientWidth - EVENT_LABEL_PADDING) {
      label.textContent = band.dataset.shortTitle || label.textContent;
    }

    const labelWidth = label.getBoundingClientRect().width;
    const centredLeft = visibleLeft + (visibleWidth - labelWidth) / 2;
    const minimumLeft = bandRect.left + EVENT_LABEL_PADDING / 2;
    const maximumLeft = bandRect.right - labelWidth - EVENT_LABEL_PADDING / 2;
    const clampedLeft = Math.max(minimumLeft, Math.min(maximumLeft, centredLeft));
    label.style.left = `${clampedLeft - bandRect.left}px`;
  });
}

export function renderTimeline(timelineContainer, timeline, scale = 1) {
  if (!timelineContainer || !timeline) return;

  const containerWidth = timelineContainer.clientWidth;
  const height = timelineContainer.clientHeight;
  if (!containerWidth || !height) return;

  const width = Math.max(containerWidth, Math.round(containerWidth * Math.max(1, scale)));
  const contextVisible = isLayerVisible('significantEventsToggle');
  const tapestry = contextVisible && document.getElementById('tapestryToggle')?.getAttribute('aria-pressed') === 'true';
  const milestonesVisible = isLayerVisible('discoveriesToggle') || isLayerVisible('conferencesToggle');
  const { axisY, contextTop } = planLanes({
    height,
    milestonesNeed: measureMilestoneNeed(width, scale),
    contextNeed: contextVisible ? measureContextNeed(width, tapestry) : 0,
    milestonesVisible,
    contextVisible
  });

  setupDelegatedEvents(timeline);
  itemActions.clear();
  timeline.replaceChildren();
  timeline.style.width = `${width}px`;
  timeline.style.height = `${height}px`;

  // Lane labels and backgrounds are positioned from the same measurements.
  const frame = timelineContainer.closest('.timeline-frame');
  if (frame) {
    frame.style.setProperty('--lane-height', `${height}px`);
    frame.style.setProperty('--axis-y', `${axisY}px`);
    frame.style.setProperty('--context-top', `${contextTop}px`);
    frame.classList.toggle('has-context', contextVisible);
    frame.classList.toggle('has-milestones', milestonesVisible);
  }

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.classList.add('timeline-svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.setAttribute('aria-hidden', 'true');
  timeline.appendChild(svg);

  const coordinates = {};
  renderScaleSegments(timeline, width, height);
  renderAxis(timeline, svg, width, height, axisY, scale);
  renderPublications(timeline, width, axisY, coordinates);
  renderScientists(timeline, svg, width, axisY, coordinates, scale);
  renderMilestones(timeline, svg, width, axisY, contextTop, scale);
  if (tapestry) {
    renderTapestry(timeline, significantEvents, width, height, contextTop, scale, (button) => {
      selectItem(button);
      openItem(button.dataset.itemKey, { fromTimeline: true });
    });
  } else if (contextVisible) {
    renderEvents(timeline, width, height, contextTop);
  }
  // Connections are drawn last so they sit above the lane content in the SVG.
  const relationLayer = document.createElementNS(SVG_NS, 'g');
  relationLayer.classList.add('relation-layer');
  svg.appendChild(relationLayer);
  hoverKey = null;
  updateScalePresentation(timeline, scale);
  applySelection(timeline);
  updateEventLabelPositions(timeline, timelineContainer);
}
