import { config } from './config.js?v=14';
import { scientists, discoveries, conferences, significantEvents } from './dataLoader.js?v=17';
import { showPublicationModal, showScientistModal } from './modalManager.js?v=21';
import { handleImageError } from './themeManager.js?v=14';

const SVG_NS = 'http://www.w3.org/2000/svg';

function isLayerVisible(id) {
  return document.getElementById(id)?.getAttribute('aria-pressed') !== 'false';
}

function yearToX(year, width) {
  return ((year - config.START_YEAR) / config.YEAR_SPAN) * width;
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

function selectItem(element) {
  document.querySelectorAll('.timeline .is-selected').forEach((item) => item.classList.remove('is-selected'));
  element.classList.add('is-selected');
}

export function clearTimelineSelection() {
  document.querySelectorAll('.timeline .is-selected').forEach((item) => item.classList.remove('is-selected'));
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

    const label = document.createElement('span');
    label.className = `year-label ${classes.join(' ')}`;
    label.style.left = `${x}px`;
    label.style.top = `${axisY + 18}px`;
    label.textContent = String(year);
    timeline.appendChild(label);

    if (isCentury) {
      const gridLine = createSvgLine('century-grid', x, 0, x, height);
      svg.appendChild(gridLine);
    }
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
    [...(scientist.publications || [])]
      .filter((publication) => Number.isFinite(publication.year))
      .sort((a, b) => a.year - b.year)
      .forEach((publication) => {
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
    node.dataset.tooltip = `${scientist.name || 'Unknown scientist'} · first listed work ${firstPublication.year}`;
    node.setAttribute('aria-label', `${scientist.name || 'Unknown scientist'}, scientist details`);
    node.style.left = `${centerX - nodeSize / 2}px`;
    node.style.top = `${centerY - nodeSize / 2}px`;
    node.style.setProperty('--scientist-color', scientist.color || 'var(--accent)');

    const photo = document.createElement('img');
    photo.className = 'scientist-photo';
    photo.alt = '';
    photo.loading = 'lazy';
    photo.draggable = false;
    photo.dataset.originalPhoto = scientist.photo || 'images/default.png';
    if (scientist.cartoon) photo.dataset.cartoonPhoto = scientist.cartoon;
    photo.src = scientist.photo || 'images/default.png';
    photo.addEventListener('error', () => handleImageError(photo));
    node.appendChild(photo);

    node.addEventListener('mouseenter', () => highlightScientistGroup(id));
    node.addEventListener('mouseleave', () => unhighlightScientistGroup(id));
    node.addEventListener('focus', () => highlightScientistGroup(id));
    node.addEventListener('blur', () => unhighlightScientistGroup(id));
    node.addEventListener('click', () => {
      selectItem(node);
      showScientistModal(id);
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
      ? discoveries.map((item) => ({ item, type: 'discovery' }))
      : []),
    ...(isLayerVisible('conferencesToggle')
      ? conferences.map((item) => ({ item, type: 'conference' }))
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
    .forEach(({ item, type }) => {
      const actualX = yearToX(item.year, width);
      let level = lastEndByLevel.findIndex((lastEnd) => actualX - markerSize / 2 > lastEnd + 10);
      if (level === -1) level = lastEndByLevel.indexOf(Math.min(...lastEndByLevel));
      const centerX = Math.max(markerSize / 2, Math.min(width - markerSize / 2, actualX));
      const centerY = firstLevelY + level * levelGap;
      lastEndByLevel[level] = centerX + markerSize / 2;

      const marker = document.createElement('button');
      marker.type = 'button';
      marker.className = `${type}-marker`;
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

function renderEvents(timeline, width, height, contextTop) {
  if (!isLayerVisible('significantEventsToggle')) return;

  const bandHeight = 30;
  const levelGap = 36;
  const availableLevels = Math.max(1, Math.floor((height - contextTop - bandHeight) / levelGap) + 1);
  const occupiedLevels = Array.from({ length: availableLevels }, () => []);

  [...significantEvents]
    .filter((event) => Number.isFinite(event.startYear) && Number.isFinite(event.endYear) && event.endYear >= event.startYear)
    .sort((a, b) => a.startYear - b.startYear)
    .forEach((event) => {
      const startX = yearToX(event.startYear, width);
      const endX = yearToX(event.endYear, width);
      const fullTitle = event.title || 'Historical event';
      const shortTitle = event.shortTitle || fullTitle;
      const centreX = (startX + endX) / 2;
      const fullTitleWidth = fullTitle.length * 6.5 + 12;
      const shortTitleWidth = shortTitle.length * 6.5 + 12;
      const minimumLabelWidth = Math.max(24, fullTitleWidth, shortTitleWidth);
      const labelStartX = Math.max(0, Math.min(startX, centreX - minimumLabelWidth / 2));
      const labelEndX = Math.min(width, Math.max(endX, centreX + minimumLabelWidth / 2));
      let level = occupiedLevels.findIndex((intervals) => intervals.every((interval) => labelEndX <= interval.start || labelStartX >= interval.end));
      if (level === -1) level = occupiedLevels.length - 1;
      occupiedLevels[level].push({ start: labelStartX, end: labelEndX });

      const band = document.createElement('button');
      band.type = 'button';
      band.className = 'event-band';
      band.dataset.fullTitle = fullTitle;
      band.dataset.shortTitle = shortTitle;
      band.dataset.tooltip = `${fullTitle} · ${event.startYear}–${event.endYear}`;
      band.setAttribute('aria-label', `${fullTitle}, ${event.startYear} to ${event.endYear}`);
      band.style.left = `${startX}px`;
      band.style.top = `${contextTop + level * levelGap}px`;
      band.style.width = `${Math.max(2, endX - startX)}px`;
      band.style.height = `${bandHeight}px`;

      const eventTitle = document.createElement('span');
      eventTitle.className = 'event-title';
      eventTitle.textContent = fullTitle;
      band.appendChild(eventTitle);
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

export function updateEventLabelPositions(timeline, timelineContainer) {
  if (!timeline || !timelineContainer) return;

  const viewportRect = timelineContainer.getBoundingClientRect();

  timeline.querySelectorAll('.event-band').forEach((band) => {
    const label = band.querySelector('.event-title');
    if (!label) return;

    const bandRect = band.getBoundingClientRect();
    const visibleLeft = Math.max(bandRect.left, viewportRect.left);
    const visibleRight = Math.min(bandRect.right, viewportRect.right);
    const visibleWidth = Math.max(0, visibleRight - visibleLeft);
    label.hidden = visibleWidth === 0;
    if (label.hidden) return;

    label.textContent = band.dataset.fullTitle || 'Historical event';
    const availableWidth = Math.max(0, Math.min(band.clientWidth, visibleWidth) - 12);
    if (label.getBoundingClientRect().width > availableWidth) {
      label.textContent = band.dataset.shortTitle || label.textContent;
    }

    const labelWidth = label.getBoundingClientRect().width;
    const centredLeft = visibleLeft + (visibleWidth - labelWidth) / 2;
    const clampedLeft = Math.max(viewportRect.left + 4, Math.min(viewportRect.right - labelWidth - 4, centredLeft));
    label.style.left = `${clampedLeft - bandRect.left}px`;
  });
}

export function renderTimeline(timelineContainer, timeline, scale = 1) {
  if (!timelineContainer || !timeline) return;

  const containerWidth = timelineContainer.clientWidth;
  const height = timelineContainer.clientHeight;
  if (!containerWidth || !height) return;

  const width = Math.max(containerWidth, Math.round(containerWidth * Math.max(1, scale)));
  const axisY = height * 0.42;
  const contextTop = height * 0.69;
  timeline.replaceChildren();
  timeline.style.width = `${width}px`;
  timeline.style.height = `${height}px`;

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
  renderEvents(timeline, width, height, contextTop);
  updateScalePresentation(timeline, scale);
  updateEventLabelPositions(timeline, timelineContainer);
}
