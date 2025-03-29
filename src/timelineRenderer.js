import { config } from './config.js';
import { scientists, discoveries, significantEvents } from './dataLoader.js';
import { showPublicationModal, showScientistModal } from './modalManager.js';
import { handleImageError } from './themeManager.js'; // Import image error handler

// --- Highlight Functions ---
// These are closely tied to rendering elements, so keep them here for now.
// Alternatively, they could move to uiInteractions if preferred.
export function highlightScientistGroup(scientistId) {
    const photo = document.getElementById(`photo-${scientistId}`);
    const publications = document.querySelectorAll(`.publication[data-scientist-id="${scientistId}"]`);
    const line = document.querySelector(`.connecting-line[data-scientist-id="${scientistId}"]`); // Select line by data attribute

    if (photo) photo.classList.add('highlight');
    if (line) line.classList.add('highlight');
    publications.forEach(pub => pub.classList.add('highlight'));
}

export function unhighlightScientistGroup(scientistId) {
    const photo = document.getElementById(`photo-${scientistId}`);
    const publications = document.querySelectorAll(`.publication[data-scientist-id="${scientistId}"]`);
    const line = document.querySelector(`.connecting-line[data-scientist-id="${scientistId}"]`); // Select line by data attribute

    if (photo) photo.classList.remove('highlight');
    if (line) line.classList.remove('highlight');
    publications.forEach(pub => pub.classList.remove('highlight'));
}


// --- Rendering Functions ---

function renderAxis(timeline, baseTimelineWidth, axisY) {
  const axisLine = document.createElement('div');
  axisLine.className = 'timeline-axis-line';
  axisLine.style.top = `${axisY - 1}px`; // Center the line visually
  timeline.appendChild(axisLine);

  const axisLabel = document.createElement('div');
  axisLabel.className = 'timeline-axis-label';
  axisLabel.textContent = 'Year';
  axisLabel.style.top = `${axisY + 5}px`; // Position below the line
  timeline.appendChild(axisLabel);
}

function renderYearMarkers(timeline, baseTimelineWidth, axisY) {
  const { START_YEAR, END_YEAR, YEAR_SPAN, CURRENT_YEAR } = config;
  const lastDecade = Math.floor(END_YEAR / 10) * 10;

  for (let year = START_YEAR; year <= lastDecade; year += 10) {
    if (year < START_YEAR) continue; // Skip markers before start year if any calculation error occurs
    const isMajor = year % 100 === 0;
    const yearMarker = document.createElement('div');
    yearMarker.className = `year-marker ${isMajor ? 'major' : ''}`;
    const posX = ((year - START_YEAR) / YEAR_SPAN) * baseTimelineWidth;
    yearMarker.style.left = `${posX}px`;
    yearMarker.style.top = `${axisY}px`; // Align top with axis line

    const yearLabel = document.createElement('span');
    yearLabel.textContent = year;
    yearMarker.appendChild(yearLabel);
    timeline.appendChild(yearMarker);
  }

  // Add marker for the current year if it's beyond the last decade marker
  if (END_YEAR > lastDecade) {
    const endMarker = document.createElement('div');
    endMarker.className = 'year-marker current-year'; // Use specific class for current year
    const endPosX = ((END_YEAR - START_YEAR) / YEAR_SPAN) * baseTimelineWidth;
    endMarker.style.left = `${endPosX}px`;
    endMarker.style.top = `${axisY}px`;

    const endLabel = document.createElement('span');
    endLabel.textContent = END_YEAR;
    endMarker.appendChild(endLabel);
    timeline.appendChild(endMarker);
  }
}

function renderScientists(timeline, baseTimelineWidth, axisY, elementCoords, timelineSvg) {
  const { START_YEAR, YEAR_SPAN, PHOTO_SIZE, PHOTO_BASE_OFFSET_Y, PHOTO_VERTICAL_STAGGER } = config;
  let photoIndex = 0;

  // Sort scientists by the year of their first publication for consistent vertical placement
  const sortedScientistEntries = Object.entries(scientists).sort(([, sciA], [, sciB]) => {
    const getFirstPubYear = (sci) => {
        try {
            if (sci?.publications?.length) {
                const years = sci.publications.map(p => p.year).filter(y => typeof y === 'number');
                return years.length ? Math.min(...years) : Infinity;
            }
        } catch (e) { console.error("Error getting first pub year:", e); }
        return Infinity;
    };
    const yearA = getFirstPubYear(sciA);
    const yearB = getFirstPubYear(sciB);
    if (yearA === Infinity && yearB === Infinity) return 0;
    if (yearA === Infinity) return 1; // Place those without pubs later
    if (yearB === Infinity) return -1;
    return yearA - yearB;
  });

  sortedScientistEntries.forEach(([id, scientist]) => {
    try {
      if (!scientist?.publications?.length) return; // Skip if no publications

      // Find the first valid publication year
      const firstPub = scientist.publications
          .filter(p => typeof p.year === 'number')
          .sort((a, b) => a.year - b.year)[0];

      if (!firstPub) return; // Skip if no valid publication year found

      const photoEl = document.createElement('img');
      photoEl.src = scientist.photo || 'images/default.png'; // Fallback src
      photoEl.alt = scientist.name || 'Unknown Scientist';
      photoEl.className = 'scientist-photo';
      photoEl.style.border = `3px solid ${scientist.color || '#ccc'}`;
      photoEl.dataset.scientistId = id;
      photoEl.id = `photo-${id}`;
      photoEl.loading = 'lazy'; // Improve initial load performance
      photoEl.onerror = () => handleImageError(photoEl); // Use centralized error handler

      const photoYearX = ((firstPub.year - START_YEAR) / YEAR_SPAN) * baseTimelineWidth;
      const photoX = photoYearX - PHOTO_SIZE / 2;

      // Stagger photos vertically
      const staggerOffset = (Math.floor(photoIndex / 2) % 2 === 0) ? 0 : PHOTO_VERTICAL_STAGGER;
      const photoCenterY = (photoIndex % 2 === 0)
          ? axisY - PHOTO_BASE_OFFSET_Y - staggerOffset // Above axis
          : axisY + PHOTO_BASE_OFFSET_Y + staggerOffset; // Below axis

      const photoStyleTop = photoCenterY - PHOTO_SIZE / 2;
      photoEl.style.left = `${photoX}px`;
      photoEl.style.top = `${photoStyleTop}px`;

      // Add event listeners
      photoEl.addEventListener('click', () => showScientistModal(id));
      photoEl.addEventListener('mouseenter', () => highlightScientistGroup(id));
      photoEl.addEventListener('mouseleave', () => unhighlightScientistGroup(id));
      timeline.appendChild(photoEl);

      // Store coordinates for drawing lines
      const photoCoord = { x: photoX + PHOTO_SIZE / 2, y: photoStyleTop + PHOTO_SIZE / 2 };
      elementCoords[`photo_${id}`] = photoCoord;

      // Draw connecting line (ensure publication coords are ready)
      const firstPubCoord = elementCoords[`pub_${id}_${firstPub.year}`]; // Use year in key
      if (firstPubCoord) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', photoCoord.x);
        line.setAttribute('y1', photoCoord.y);
        line.setAttribute('x2', firstPubCoord.x);
        line.setAttribute('y2', firstPubCoord.y);
        line.setAttribute('stroke', scientist.color || '#ccc');
        line.classList.add('connecting-line');
        line.dataset.scientistId = id; // Add data attribute for highlighting
        timelineSvg.appendChild(line);
      } else {
          console.warn(`First publication coordinate for ${id} not found when drawing line.`);
      }

      photoIndex++;
    } catch (error) {
      console.error("Error processing scientist:", id, scientist?.name || 'Unknown', error);
    }
  });
}


function renderPublications(timeline, baseTimelineWidth, axisY, elementCoords) {
  const { START_YEAR, YEAR_SPAN, PUBLICATION_SIZE } = config;

  Object.entries(scientists).forEach(([id, scientist]) => {
    if (!scientist?.publications?.length) return;

    scientist.publications.forEach((pub, pubIndex) => {
      if (typeof pub.year !== 'number') return; // Skip invalid years

      const pubEl = document.createElement('div');
      pubEl.className = 'publication';
      pubEl.style.backgroundColor = scientist.color || '#ccc'; // Use scientist color
      pubEl.dataset.scientistId = id; // Link to scientist
      pubEl.title = `${pub.title || 'N/A'} (${pub.year})`; // Tooltip

      // Simple horizontal positioning based on year
      const pubX = ((pub.year - START_YEAR) / YEAR_SPAN) * baseTimelineWidth;
      const pubStyleTop = axisY - (PUBLICATION_SIZE / 2); // Center vertically on axis
      const pubStyleLeft = pubX - (PUBLICATION_SIZE / 2); // Center horizontally on year

      // Clamp position to stay within timeline bounds
      const clampedPubX = Math.max(0, Math.min(baseTimelineWidth - PUBLICATION_SIZE, pubStyleLeft));

      pubEl.style.left = `${clampedPubX}px`;
      pubEl.style.top = `${pubStyleTop}px`;

      // Add event listeners
      pubEl.addEventListener('click', () => showPublicationModal(scientist.name, pub.year, pub.title, pub.abstract, 'publication'));
      pubEl.addEventListener('mouseenter', () => highlightScientistGroup(id));
      pubEl.addEventListener('mouseleave', () => unhighlightScientistGroup(id));
      timeline.appendChild(pubEl);

      // Store coordinates for connecting lines (use year in key for uniqueness)
      const pubCoordKey = `pub_${id}_${pub.year}`;
      // Only store the first one if multiple pubs in the same year for the same scientist
      if (!elementCoords[pubCoordKey]) {
          elementCoords[pubCoordKey] = { x: clampedPubX + PUBLICATION_SIZE / 2, y: axisY };
      }
    });
  });
}


function renderDiscoveries(timeline, baseTimelineWidth, axisY, timelineSvg) {
  const { START_YEAR, YEAR_SPAN, DISCOVERY_SIZE, DISCOVERY_BASE_OFFSET_Y } = config;

  discoveries.forEach((discovery, index) => {
    if (typeof discovery.year !== 'number') return;

    const discoveryEl = document.createElement('div');
    discoveryEl.className = 'discovery-marker';
    discoveryEl.style.backgroundColor = discovery.color || '#aaaaaa';
    discoveryEl.style.width = `${DISCOVERY_SIZE}px`;
    discoveryEl.style.height = `${DISCOVERY_SIZE}px`;
    discoveryEl.title = `${discovery.title || 'Untitled Discovery'} (${discovery.year})`;

    const discoveryYearX = ((discovery.year - START_YEAR) / YEAR_SPAN) * baseTimelineWidth;

    // Position above the axis line
    const discoveryStyleTop = axisY - DISCOVERY_BASE_OFFSET_Y - (DISCOVERY_SIZE / 2);
    // Simple horizontal positioning, maybe add staggering later if needed
    const discoveryStyleLeft = discoveryYearX - (DISCOVERY_SIZE / 2);
    const clampedDiscoveryX = Math.max(0, Math.min(baseTimelineWidth - DISCOVERY_SIZE, discoveryStyleLeft));

    discoveryEl.style.left = `${clampedDiscoveryX}px`;
    discoveryEl.style.top = `${discoveryStyleTop}px`;

    // Add particle label inside
    const particleLabel = document.createElement('span');
    particleLabel.textContent = discovery.particle || '?';
    particleLabel.style.position = 'absolute';
    particleLabel.style.top = '50%';
    particleLabel.style.left = '50%';
    particleLabel.style.transform = 'translate(-50%, -50%)';
    particleLabel.style.fontSize = '10px'; // Smaller font
    particleLabel.style.color = '#fff'; // White text for contrast
    particleLabel.style.textAlign = 'center';
    particleLabel.style.pointerEvents = 'none'; // Prevent label from interfering with clicks
    discoveryEl.appendChild(particleLabel);

    discoveryEl.addEventListener('click', () => showPublicationModal(discovery.discoverer, discovery.year, discovery.title, discovery.details, 'discovery'));
    timeline.appendChild(discoveryEl);

    // Draw connecting line from bottom-center of marker to axis
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', clampedDiscoveryX + DISCOVERY_SIZE / 2);
    line.setAttribute('y1', discoveryStyleTop + DISCOVERY_SIZE); // Bottom of marker
    line.setAttribute('x2', discoveryYearX); // Point to the actual year on axis
    line.setAttribute('y2', axisY);
    line.setAttribute('stroke', discovery.color || '#aaaaaa');
    line.setAttribute('stroke-width', '1.5'); // Thinner line
    line.classList.add('connecting-line'); // Add class for potential styling/highlighting
    timelineSvg.appendChild(line);
  });
}

function renderEvents(timeline, baseTimelineWidth, axisY, timelineSvg) {
  const { START_YEAR, YEAR_SPAN, EVENT_BASE_OFFSET_Y, EVENT_BOX_HEIGHT } = config;

  significantEvents.forEach(event => {
    if (typeof event.startYear !== 'number' || typeof event.endYear !== 'number' || event.startYear >= event.endYear) return;

    const eventEl = document.createElement('div');
    eventEl.className = 'event-box'; // Use a more descriptive class name
    eventEl.style.backgroundColor = event.color || '#888888';
    // Consider adding border/padding via CSS for cleaner JS
    eventEl.style.border = '1px solid rgba(0,0,0,0.2)';
    // Use padding from CSS for better control
    // eventEl.style.padding = '2px 4px';
    eventEl.style.boxSizing = 'border-box';
    eventEl.style.position = 'absolute';
    // eventEl.style.overflow = 'hidden'; // Let CSS handle overflow/height
    eventEl.style.cursor = 'pointer';

    const startX = ((event.startYear - START_YEAR) / YEAR_SPAN) * baseTimelineWidth;
    const endX = ((event.endYear - START_YEAR) / YEAR_SPAN) * baseTimelineWidth;
    const eventWidth = Math.max(1, endX - startX); // Ensure minimum width of 1px

    const eventStyleTop = axisY + EVENT_BASE_OFFSET_Y; // Position below the timeline axis
    eventEl.style.left = `${startX}px`;
    eventEl.style.top = `${eventStyleTop}px`;
    eventEl.style.width = `${eventWidth}px`;
    // eventEl.style.height = `${EVENT_BOX_HEIGHT}px`; // Let CSS handle height

    const eventLabel = document.createElement('span');
    eventLabel.className = 'event-label'; // Add class for easier CSS targeting
    eventLabel.textContent = event.title || 'Event';
    // Style via CSS using .event-label class
    // eventLabel.style.display = 'block';
    // eventLabel.style.fontSize = '10px';
    // eventLabel.style.color = '#fff';
    // eventLabel.style.textAlign = 'center';
    // eventLabel.style.whiteSpace = 'nowrap';
    // eventLabel.style.textOverflow = 'ellipsis';
    // eventLabel.style.overflow = 'hidden';
    // eventLabel.style.lineHeight = `${EVENT_BOX_HEIGHT}px`;
    eventLabel.style.pointerEvents = 'none'; // Keep this one
    eventEl.appendChild(eventLabel);

    eventEl.title = `${event.title} (${event.startYear}-${event.endYear})`; // Tooltip

    eventEl.addEventListener('click', () => {
      showPublicationModal(
        'Significant Event', // Category
        `${event.startYear} - ${event.endYear}`, // Period
        event.title,
        event.details,
        'event' // Type for modal formatting
      );
    });

    timeline.appendChild(eventEl);

    // Draw simple vertical lines connecting the event box ends to the timeline axis
    const lineStroke = event.color || '#888888';
    const lineStrokeWidth = '1.5';

    const startLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    startLine.setAttribute('x1', startX);
    startLine.setAttribute('y1', axisY);
    startLine.setAttribute('x2', startX);
    startLine.setAttribute('y2', eventStyleTop);
    startLine.setAttribute('stroke', lineStroke);
    startLine.setAttribute('stroke-width', lineStrokeWidth);
    timelineSvg.appendChild(startLine);

    const endLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    endLine.setAttribute('x1', endX);
    endLine.setAttribute('y1', axisY);
    endLine.setAttribute('x2', endX);
    endLine.setAttribute('y2', eventStyleTop);
    endLine.setAttribute('stroke', lineStroke);
    endLine.setAttribute('stroke-width', lineStrokeWidth);
    timelineSvg.appendChild(endLine);
  });
}


// Main render function for the entire timeline
export function renderTimeline(timelineContainer, timeline, updateTimelineTransform) {
  if (!timelineContainer || !timeline) {
    console.error("Timeline elements not found for render!");
    return;
  }

  timeline.innerHTML = ''; // Clear previous content
  const containerWidth = timelineContainer.clientWidth;
  const timelineHeight = timelineContainer.clientHeight; // Use container height for axis calc

  if (timelineHeight === 0 || containerWidth === 0) {
    console.warn("Container dimensions zero during render. Skipping.");
    return; // Avoid rendering if container isn't ready
  }

  const axisY = timelineHeight / 2; // Place axis in the middle of the container height

  // Calculate base width needed to display the year span comfortably
  // Adjust multiplier as needed for desired density/spacing
  const baseTimelineWidth = Math.max(containerWidth * 2, config.YEAR_SPAN * 5);
  timeline.style.width = `${baseTimelineWidth}px`;
  // Set height explicitly to match container, prevents potential collapse issues
  timeline.style.height = `${timelineHeight}px`;


  // Create SVG layer for connecting lines (drawn first, appears below elements)
  const timelineSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  timelineSvg.setAttribute('class', 'timeline-svg');
  // SVG needs explicit size, match the timeline div
  timelineSvg.setAttribute('width', baseTimelineWidth);
  timelineSvg.setAttribute('height', timelineHeight);
  timeline.appendChild(timelineSvg);

  const elementCoords = {}; // To store coordinates for drawing lines

  // Render components in order (axis/markers first, then elements)
  renderAxis(timeline, baseTimelineWidth, axisY);
  renderYearMarkers(timeline, baseTimelineWidth, axisY);
  // Render publications first to get their coordinates for scientist lines
  renderPublications(timeline, baseTimelineWidth, axisY, elementCoords);
  // Render scientists and draw lines to their first publication
  renderScientists(timeline, baseTimelineWidth, axisY, elementCoords, timelineSvg);
  renderDiscoveries(timeline, baseTimelineWidth, axisY, timelineSvg);
  renderEvents(timeline, baseTimelineWidth, axisY, timelineSvg);

  // Apply initial transform after rendering
  if (updateTimelineTransform) {
      updateTimelineTransform();
  } else {
      console.warn("updateTimelineTransform function not provided to renderTimeline.");
  }
}
