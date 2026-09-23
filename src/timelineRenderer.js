import { config } from './config.js?v=15';
import { scientists, discoveries, conferences, significantEvents } from './dataLoader.js?v=17';
import { showPublicationModal, showScientistModal } from './modalManager.js?v=22';
import { renderTapestry } from './tapestryRenderer.js?v=4';
import { yearToX } from './timeScale.js?v=1';
import { createPortrait } from './portraits.js?v=1';

const SVG_NS = 'http://www.w3.org/2000/svg';
const EVENT_LABEL_FONT = '650 11px';
const EVENT_LABEL_PADDING = 12;
const EVENT_PIN_GAP = 5;

// Timeline items are rebuilt on every zoom, so selection is tracked by a stable
// item key rather than by element.
let selectedItemKey = null;
let measureContext = null;
let measureFontFamily = null;

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

function applySelection(timeline) {
  timeline.querySelectorAll('.is-selected').forEach((item) => item.classList.remove('is-selected'));
  if (!selectedItemKey) return null;
  const element = timeline.querySelector(`[data-item-key="${CSS.escape(selectedItemKey)}"]`);
  element?.classList.add('is-selected');
  return element;
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

export function highlightScientistGroup(scientistId) {
  const timeline = document.getElementById('timeline');
  if (!timeline) return;

  timeline.classList.add('has-highlight');
  timeline.querySelector(`.scientist-node[data-scientist-id="${scientistId}"]`)?.classList.add('highlight');
  timeline.querySelector(`.scientist-link[data-scientist-id="${scientistId}"]`)?.classList.add('highlight');
  timeline.querySelectorAll(`.publication[data-scientist-id="${scientistId}"]`).forEach((item) => item.classList.add('highlight'));
}

export function unhighlightScientistGroup(scientistId) {
  const timeline = document.getElementById('timeline');
  if (!timeline) return;

  timeline.classList.remove('has-highlight');
  timeline.querySelector(`.scientist-node[data-scientist-id="${scientistId}"]`)?.classList.remove('highlight');
  timeline.querySelector(`.scientist-link[data-scientist-id="${scientistId}"]`)?.classList.remove('highlight');
  timeline.querySelectorAll(`.publication[data-scientist-id="${scientistId}"]`).forEach((item) => item.classList.remove('highlight'));
}

function renderAxis(timeline, svg, width, height, axisY) {
  const axis = document.createElement('div');
  axis.className = 'timeline-axis-line';
  axis.style.top = `${axisY - 1}px`;
  timeline.appendChild(axis);

  const endX = yearToX(config.END_YEAR, width);
  const endLabelWidth = measureText(String(config.END_YEAR), '700 11px');

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

    // The right-aligned end label would otherwise run into a nearby tick label.
    const labelHalfWidth = measureText(String(year), '700 11px') / 2;
    if (!isCurrent && year !== config.END_YEAR && x + labelHalfWidth + 8 > endX - endLabelWidth) return;

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
  const shouldRender = isLayerVisible('publicationsToggle');
  const offsetsByYear = new Map();

  Object.entries(scientists).forEach(([scientistId, scientist]) => {
    (scientist.publications || [])
      .map((publication, index) => ({ publication, index }))
      .filter(({ publication }) => Number.isFinite(publication.year))
      .sort((a, b) => a.publication.year - b.publication.year)
      .forEach(({ publication, index }) => {
        const offsetIndex = offsetsByYear.get(publication.year) || 0;
        offsetsByYear.set(publication.year, offsetIndex + 1);
        const x = Math.max(7, Math.min(width - 7, yearToX(publication.year, width) + offsetIndex * 7));
        const coordinateKey = `publication_${scientistId}_${publication.year}`;
        if (!coordinates[coordinateKey]) coordinates[coordinateKey] = { x, y: axisY };
        if (!shouldRender) return;

        const marker = document.createElement('button');
        marker.type = 'button';
        marker.className = 'publication';
        marker.dataset.scientistId = scientistId;
        marker.dataset.itemKey = `publication:${scientistId}:${index}`;
        marker.dataset.tooltip = `${publication.title || 'Untitled publication'} · ${publication.year}`;
        marker.setAttribute('aria-label', `${publication.title || 'Untitled publication'}, by ${scientist.name || 'unknown author'}, ${publication.year}`);
        marker.style.left = `${x - 14}px`;
        marker.style.top = `${axisY - 14}px`;
        marker.style.setProperty('--scientist-color', scientist.color || 'var(--accent)');
        const mark = document.createElement('span');
        mark.className = 'publication-mark';
        marker.appendChild(mark);
        marker.addEventListener('mouseenter', () => highlightScientistGroup(scientistId));
        marker.addEventListener('mouseleave', () => unhighlightScientistGroup(scientistId));
        marker.addEventListener('focus', () => highlightScientistGroup(scientistId));
        marker.addEventListener('blur', () => unhighlightScientistGroup(scientistId));
        marker.addEventListener('click', () => {
          selectItem(marker);
          showPublicationModal(
            scientist.name,
            publication.year,
            publication.title,
            publication.abstract,
            'publication',
            [scientistId]
          );
        });
        timeline.appendChild(marker);
      });
  });
}

function renderScientists(timeline, svg, width, axisY, coordinates, scale) {
  if (!isLayerVisible('peopleToggle')) return;

  const entries = Object.entries(scientists)
    .map(([id, scientist]) => ({ id, scientist, firstPublication: getFirstPublication(scientist) }))
    .filter((entry) => entry.firstPublication)
    .sort((a, b) => a.firstPublication.year - b.firstPublication.year);

  const isOverview = scale < 1.5;
  let displayItems;

  if (isOverview) {
    const groups = new Map();
    entries.forEach((entry) => {
      const groupKey = Math.floor((entry.firstPublication.year - config.START_YEAR) / 14);
      if (!groups.has(groupKey)) groups.set(groupKey, []);
      groups.get(groupKey).push(entry);
    });
    displayItems = [...groups.values()].map((group) => ({
      type: group.length > 1 ? 'cluster' : 'person',
      entries: group,
      year: group.reduce((sum, entry) => sum + entry.firstPublication.year, 0) / group.length
    }));
  } else {
    displayItems = entries.map((entry) => ({ type: 'person', entries: [entry], year: entry.firstPublication.year }));
  }

  const top = 32;
  const bottom = Math.max(top, axisY - 62);
  const levelCount = Math.max(3, Math.min(7, Math.floor((bottom - top) / 38) + 1));
  const lastEndByLevel = Array(levelCount).fill(-Infinity);

  displayItems.forEach((item) => {
    const nodeSize = item.type === 'cluster' ? 40 : 42;
    const idealCenterX = yearToX(item.year, width);
    let level = lastEndByLevel.findIndex((lastEnd) => idealCenterX - nodeSize / 2 > lastEnd + 12);
    if (level === -1) {
      level = lastEndByLevel.indexOf(Math.min(...lastEndByLevel));
    }

    const centerX = Math.max(nodeSize / 2, Math.min(width - nodeSize / 2, idealCenterX));
    const levelProgress = levelCount === 1 ? 0 : level / (levelCount - 1);
    const centerY = bottom - (bottom - top) * levelProgress;
    lastEndByLevel[level] = centerX + nodeSize / 2;

    if (item.type === 'cluster') {
      const cluster = document.createElement('button');
      const names = item.entries.map((entry) => entry.scientist.name).filter(Boolean);
      cluster.type = 'button';
      cluster.className = 'scientist-cluster';
      cluster.dataset.tooltip = `${item.entries.length} scientists · ${names.join(', ')}`;
      cluster.setAttribute('aria-label', `${item.entries.length} scientists around ${Math.round(item.year)}. Zoom in to explore.`);
      cluster.style.left = `${centerX - nodeSize / 2}px`;
      cluster.style.top = `${centerY - nodeSize / 2}px`;
      cluster.textContent = String(item.entries.length);
      cluster.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('papertrails:zoomcluster', { detail: { year: item.year } }));
      });
      timeline.appendChild(cluster);
      return;
    }

    const { id, scientist, firstPublication } = item.entries[0];

    const node = document.createElement('button');
    node.type = 'button';
    node.className = 'scientist-node';
    node.dataset.scientistId = id;
    node.dataset.itemKey = `scientist:${id}`;
    node.dataset.tooltip = `${scientist.name || 'Unknown scientist'} · first listed work ${firstPublication.year}`;
    node.setAttribute('aria-label', `${scientist.name || 'Unknown scientist'}, scientist details`);
    node.style.left = `${centerX - nodeSize / 2}px`;
    node.style.top = `${centerY - nodeSize / 2}px`;
    node.style.setProperty('--scientist-color', scientist.color || 'var(--accent)');

    const photo = createPortrait(scientist, 'scientist-photo');
    if (photo instanceof HTMLImageElement) photo.loading = 'lazy';
    node.appendChild(photo);

    node.addEventListener('mouseenter', () => highlightScientistGroup(id));
    node.addEventListener('mouseleave', () => unhighlightScientistGroup(id));
    node.addEventListener('focus', () => highlightScientistGroup(id));
    node.addEventListener('blur', () => unhighlightScientistGroup(id));
    node.addEventListener('click', () => {
      selectItem(node);
      showScientistModal(id, { fromTimeline: true });
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

function renderMilestones(timeline, svg, width, axisY, contextTop) {
  const milestones = [
    ...(isLayerVisible('discoveriesToggle')
      ? discoveries.map((item, index) => ({ item, index, type: 'discovery' }))
      : []),
    ...(isLayerVisible('conferencesToggle')
      ? conferences.map((item, index) => ({ item, index, type: 'conference' }))
      : [])
  ];
  if (!milestones.length) return;

  const markerSize = 25;
  const firstLevelY = axisY + 78;
  const levelGap = 42;
  const maxLevels = Math.max(1, Math.floor((contextTop - firstLevelY - markerSize / 2) / levelGap) + 1);
  const lastEndByLevel = Array(maxLevels).fill(-Infinity);

  milestones
    .filter(({ item }) => Number.isFinite(item.year))
    .sort((a, b) => a.item.year - b.item.year)
    .forEach(({ item, index, type }) => {
      const actualX = yearToX(item.year, width);
      let level = lastEndByLevel.findIndex((lastEnd) => actualX - markerSize / 2 > lastEnd + 10);
      if (level === -1) level = lastEndByLevel.indexOf(Math.min(...lastEndByLevel));
      const centerX = Math.max(markerSize / 2, Math.min(width - markerSize / 2, actualX));
      const centerY = firstLevelY + level * levelGap;
      lastEndByLevel[level] = centerX + markerSize / 2;

      const marker = document.createElement('button');
      marker.type = 'button';
      marker.className = `${type}-marker`;
      marker.dataset.itemKey = `${type}:${index}`;
      const fallbackTitle = type === 'conference' ? 'Untitled conference' : 'Untitled discovery';
      marker.dataset.tooltip = `${item.title || fallbackTitle} · ${item.year}`;
      marker.setAttribute('aria-label', `${item.title || fallbackTitle}, ${item.year}`);
      marker.style.left = `${centerX - markerSize / 2}px`;
      marker.style.top = `${centerY - markerSize / 2}px`;

      const symbol = document.createElement('span');
      symbol.textContent = item.particle || (type === 'conference' ? '◆' : '•');
      marker.appendChild(symbol);
      marker.addEventListener('click', () => {
        selectItem(marker);
        showPublicationModal(
          type === 'conference' ? 'Conference' : item.discoverer,
          item.year,
          item.title,
          item.details,
          type,
          item.scientist_ids,
          item.attendee_ids,
          item.theorist_ids,
          item.location,
          item.historical_map,
          item.photo
        );
      });
      timeline.appendChild(marker);

      svg.appendChild(createSvgLine(`${type}-link`, actualX, axisY, centerX, centerY));
    });
}

// Chooses how an event band shows its title. Titles never cross a band's
// edges: a band either contains its label, carries it alongside as a pin, or
// relies on its tooltip.
export function planEventLabel(bandWidth, fullWidth, shortWidth) {
  if (fullWidth + EVENT_LABEL_PADDING <= bandWidth) return { mode: 'inside', useShort: false, extent: 0 };
  if (shortWidth + EVENT_LABEL_PADDING <= bandWidth) return { mode: 'inside', useShort: true, extent: 0 };
  return { mode: 'pin', useShort: true, extent: EVENT_PIN_GAP + shortWidth + EVENT_LABEL_PADDING };
}

export function findFreeLevel(occupiedLevels, start, end) {
  return occupiedLevels.findIndex((intervals) => intervals.every((interval) => end <= interval.start || start >= interval.end));
}

// Assigns each event a row. Labels are dropped before rows are added, and
// rows are added rather than letting bands overlap.
export function layoutEventRows(items, comfortableRows) {
  const occupiedLevels = [[]];
  const placements = items.map((item) => {
    let plan = item.plan;
    let level = findFreeLevel(occupiedLevels, item.startX, item.startX + item.bandWidth + plan.extent + 4);
    if (level === -1 && plan.mode === 'pin') {
      if (occupiedLevels.length < comfortableRows) {
        level = occupiedLevels.push([]) - 1;
      } else {
        // Without room for a pinned label, the band keeps only its tooltip.
        plan = { mode: 'none', useShort: true, extent: 0 };
        level = findFreeLevel(occupiedLevels, item.startX, item.startX + item.bandWidth + 4);
      }
    }
    if (level === -1) level = occupiedLevels.push([]) - 1;
    occupiedLevels[level].push({ start: item.startX, end: item.startX + item.bandWidth + plan.extent + 4 });
    return { ...item, plan, level };
  });
  return { placements, rows: occupiedLevels.length };
}

function renderEvents(timeline, width, height, contextTop) {
  if (!isLayerVisible('significantEventsToggle')) return;

  const laneTop = contextTop + 8;
  const laneHeight = height - laneTop - 8;
  const idealBandHeight = 30;
  const idealGap = 36;
  const comfortableRows = Math.max(1, Math.floor((laneHeight - idealBandHeight) / idealGap) + 1);

  const items = significantEvents
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

  const { placements, rows } = layoutEventRows(items, comfortableRows);
  // Extra rows are squeezed into the lane rather than hidden below it.
  const levelGap = rows > 1 ? Math.min(idealGap, (laneHeight - idealBandHeight * 0.6) / (rows - 1)) : idealGap;
  const bandHeight = Math.max(12, Math.min(idealBandHeight, levelGap - 4));

  placements.forEach(({ event, index, startX, bandWidth, fullTitle, shortTitle, plan, level }) => {
    if (bandHeight < 20 && plan.mode !== 'none') plan = { ...plan, mode: plan.mode === 'inside' ? 'inside' : 'none' };
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
    band.addEventListener('click', () => {
      selectItem(band);
      showPublicationModal(
        'Historical context',
        `${event.startYear}–${event.endYear}`,
        event.title,
        event.details,
        'event',
        [],
        event.attendee_ids
      );
    });
    timeline.appendChild(band);
  });
}

export function updateScalePresentation(timeline, scale) {
  if (!timeline) return;
  const safeScale = Math.max(0.01, scale);
  timeline.style.setProperty('--current-scale', safeScale);
  timeline.style.setProperty('--current-inverse-scale', 1 / safeScale);
  timeline.dataset.zoomTier = safeScale < 1.5 ? 'overview' : safeScale < 3 ? 'standard' : 'detail';
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

export function getLaneGeometry(height) {
  return { axisY: Math.round(height * 0.42), contextTop: Math.round(height * 0.69) };
}

export function renderTimeline(timelineContainer, timeline, scale = 1) {
  if (!timelineContainer || !timeline) return;

  const containerWidth = timelineContainer.clientWidth;
  const height = timelineContainer.clientHeight;
  if (!containerWidth || !height) return;

  const width = Math.max(containerWidth, Math.round(containerWidth * Math.max(1, scale)));
  const { axisY, contextTop } = getLaneGeometry(height);
  timeline.replaceChildren();
  timeline.style.width = `${width}px`;
  timeline.style.height = `${height}px`;

  // Lane labels and backgrounds are positioned from the same measurements.
  const frame = timelineContainer.closest('.timeline-frame');
  frame?.style.setProperty('--lane-height', `${height}px`);
  frame?.style.setProperty('--axis-y', `${axisY}px`);
  frame?.style.setProperty('--context-top', `${contextTop}px`);

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.classList.add('timeline-svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.setAttribute('aria-hidden', 'true');
  timeline.appendChild(svg);

  const coordinates = {};
  renderAxis(timeline, svg, width, height, axisY);
  renderPublications(timeline, width, axisY, coordinates);
  renderScientists(timeline, svg, width, axisY, coordinates, scale);
  renderMilestones(timeline, svg, width, axisY, contextTop);
  if (isLayerVisible('significantEventsToggle') && document.getElementById('tapestryToggle')?.getAttribute('aria-pressed') === 'true') {
    renderTapestry(timeline, significantEvents, width, height, contextTop, scale, (button, event) => {
      selectItem(button);
      showPublicationModal('Historical context', event.startYear === event.endYear ? `${event.startYear}` : `${event.startYear}–${event.endYear}`,
        event.title, event.details, 'event', [], event.attendee_ids);
    });
  } else {
    renderEvents(timeline, width, height, contextTop);
  }
  updateScalePresentation(timeline, scale);
  applySelection(timeline);
  updateEventLabelPositions(timeline, timelineContainer);
}
