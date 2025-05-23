import { config } from './config.js';
import { scientists, discoveries, significantEvents } from './dataLoader.js';
import { showPublicationModal, showScientistModal } from './modalManager.js';
import { handleImageError } from './themeManager.js'; // Import image error handler

// --- Helper Function for Contrast Color ---
function getContrastColor(hexColor) {
    // If hexColor is undefined or null, default to white text
    if (!hexColor) return '#ffffff';

    // Remove # if present
    let hex = hexColor.replace('#', '');

    // Handle shorthand hex (e.g., #03F -> #0033FF)
    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }

    // Ensure hex is 6 digits
    if (hex.length !== 6) {
        console.warn(`Invalid hex color format received: ${hexColor}. Defaulting contrast color.`);
        return '#ffffff'; // Default to white on invalid format
    }

    // Convert hex to RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Calculate luminance using the WCAG formula part
    // https://www.w3.org/TR/WCAG20/#relativeluminancedef
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

    // Use a threshold (0.5 is common) to decide contrast color
    // Return dark gray for light backgrounds, white for dark backgrounds
    return lum > 0.5 ? '#333333' : '#ffffff';
}


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

  // Remove the axis label creation
  // const axisLabel = document.createElement('div');
  // axisLabel.className = 'timeline-axis-label';
  // axisLabel.textContent = 'Year';
  // axisLabel.style.top = `${axisY + 5}px`; // Position below the line
  // timeline.appendChild(axisLabel);
}

// Modified to render labels as SVG text
function renderYearMarkers(timeline, baseTimelineWidth, axisY, timelineSvg) { // Added timelineSvg parameter
  const { START_YEAR, END_YEAR, YEAR_SPAN, CURRENT_YEAR } = config;
  const lastDecade = Math.floor(END_YEAR / 10) * 10;
  const YEAR_LABEL_BASE_SIZE = 10; // Base font size for year labels
  const YEAR_LABEL_OFFSET_Y = 4; // Offset below tick

  for (let year = START_YEAR; year <= lastDecade; year += 10) {
    if (year < START_YEAR) continue; // Skip markers before start year if any calculation error occurs
    const isMajor = year % 100 === 0;
    const yearMarker = document.createElement('div'); // This is just the tick mark now
    yearMarker.className = `year-marker ${isMajor ? 'major' : ''}`;
    const posX = ((year - START_YEAR) / YEAR_SPAN) * baseTimelineWidth;
    yearMarker.style.left = `${posX}px`;
    yearMarker.style.top = `${axisY}px`; // Align tick top with axis line
    timeline.appendChild(yearMarker); // Append only the tick div

    // Create SVG text for year label
    const textX = posX; // Center horizontally on the tick
    // Position below tick mark, accounting for tick height and offset
    const textY = axisY + (isMajor ? 20 : 10) + YEAR_LABEL_OFFSET_Y + (YEAR_LABEL_BASE_SIZE * 0.5); // Adjust vertical position

    const svgText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    svgText.setAttribute('x', textX);
    svgText.setAttribute('y', textY);
    svgText.setAttribute('font-size', `${YEAR_LABEL_BASE_SIZE}px`);
    // Use CSS variables for color to respect theme
    svgText.setAttribute('fill', isMajor ? 'var(--marker-major-color)' : 'var(--marker-text-color)');
    if (isMajor) {
        svgText.setAttribute('font-weight', 'bold');
    }
    svgText.setAttribute('text-anchor', 'middle');
    svgText.setAttribute('dominant-baseline', 'central'); // Better vertical centering
    svgText.setAttribute('pointer-events', 'none');
    svgText.textContent = year;
    // Apply inverse scale
    svgText.setAttribute('transform', `scale(var(--current-inverse-scale, 1))`);
    svgText.setAttribute('transform-origin', `${textX}px ${textY}px`); // Scale from center of text

    timelineSvg.appendChild(svgText);
  }

  // Add marker and SVG text for the current year if it's beyond the last decade marker
  if (END_YEAR > lastDecade) {
    const endMarker = document.createElement('div');
    endMarker.className = 'year-marker current-year'; // Use specific class for current year tick
    const endPosX = ((END_YEAR - START_YEAR) / YEAR_SPAN) * baseTimelineWidth;
    endMarker.style.left = `${endPosX}px`;
    endMarker.style.top = `${axisY}px`;
    timeline.appendChild(endMarker); // Append only the tick div

    // Create SVG text for end year label
    const textX = endPosX;
    const textY = axisY + 10 + YEAR_LABEL_OFFSET_Y + (YEAR_LABEL_BASE_SIZE * 0.5); // Position below normal tick

    const svgText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    svgText.setAttribute('x', textX);
    svgText.setAttribute('y', textY);
    svgText.setAttribute('font-size', `${YEAR_LABEL_BASE_SIZE}px`);
    svgText.setAttribute('fill', 'var(--current-year-color)'); // Use current year color
    svgText.setAttribute('font-weight', 'bold');
    svgText.setAttribute('text-anchor', 'middle');
    svgText.setAttribute('dominant-baseline', 'central');
    svgText.setAttribute('pointer-events', 'none');
    svgText.textContent = END_YEAR;
    // Apply inverse scale
    svgText.setAttribute('transform', `scale(var(--current-inverse-scale, 1))`);
    svgText.setAttribute('transform-origin', `${textX}px ${textY}px`);

    timelineSvg.appendChild(svgText);
  }
}

function renderScientists(timeline, baseTimelineWidth, axisY, elementCoords, timelineSvg) {
  const { START_YEAR, YEAR_SPAN, PHOTO_SIZE, PHOTO_BASE_OFFSET_Y, PHOTO_VERTICAL_STAGGER } = config;
  let photoIndex = 0;
  let lastTopPhotoEndX = -Infinity; // Track the right edge of the last photo on the top row
  let lastBottomPhotoEndX = -Infinity; // Track the right edge of the last photo on the bottom row

  // Calculate pixel offsets based on fractions and current axisY
  const photoOffsetY = PHOTO_BASE_OFFSET_Y * axisY;
  const photoStaggerY = PHOTO_VERTICAL_STAGGER * axisY;

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
      const sanitizedName = (scientist.name || 'unknown').toLowerCase().replace(/ /g, '_').replace(/[^a-z0-9_]/g, '');
      photoEl.alt = scientist.name || 'Unknown Scientist';
      photoEl.className = 'scientist-photo';
      photoEl.style.border = `3px solid ${scientist.color || '#ccc'}`;
      photoEl.dataset.scientistId = id;
      photoEl.title = scientist.name || 'Unknown Scientist'; // Set title for proper name tooltip
      photoEl.dataset.name = sanitizedName; // Still useful for tooltips or other non-path purposes
      photoEl.dataset.originalPhoto = scientist.photo || config.DEFAULT_IMAGE_PATH || 'images/default.png';
      if (scientist.cartoon) {
        photoEl.dataset.cartoonPhoto = scientist.cartoon;
      }
      photoEl.id = `photo-${id}`;
      photoEl.loading = 'lazy'; // Improve initial load performance
      photoEl.onerror = () => handleImageError(photoEl); // Use centralized error handler
      photoEl.src = scientist.photo || config.DEFAULT_IMAGE_PATH || 'images/default.png'; // Initial src is always the photo

      const photoYearX = ((firstPub.year - START_YEAR) / YEAR_SPAN) * baseTimelineWidth;
      let photoX = photoYearX - PHOTO_SIZE / 2; // Initial horizontal position

      // Stagger photos vertically using calculated pixel offsets
      const isTopRow = photoIndex % 2 === 0;
      const staggerOffset = (Math.floor(photoIndex / 2) % 2 === 0) ? 0 : photoStaggerY;
      const photoCenterY = isTopRow
          ? axisY - photoOffsetY - staggerOffset // Above axis
          : axisY + photoOffsetY + staggerOffset; // Below axis
      const photoStyleTop = photoCenterY - PHOTO_SIZE / 2;

      // Check for horizontal overlap and adjust if necessary (max 50% overlap)
      if (isTopRow) {
          if (photoX < lastTopPhotoEndX - PHOTO_SIZE / 2) {
              photoX = lastTopPhotoEndX - PHOTO_SIZE / 2; // Adjust to allow max 50% overlap
          }
          lastTopPhotoEndX = photoX + PHOTO_SIZE; // Update the end position for the top row
      } else {
          if (photoX < lastBottomPhotoEndX - PHOTO_SIZE / 2) {
              photoX = lastBottomPhotoEndX - PHOTO_SIZE / 2; // Adjust to allow max 50% overlap
          }
          lastBottomPhotoEndX = photoX + PHOTO_SIZE; // Update the end position for the bottom row
      }

      // Clamp position after overlap adjustment
      const clampedPhotoX = Math.max(0, Math.min(baseTimelineWidth - PHOTO_SIZE, photoX));

      photoEl.style.left = `${clampedPhotoX}px`;
      photoEl.style.top = `${photoStyleTop}px`;

      // Add event listeners
      photoEl.addEventListener('click', () => showScientistModal(id));
      photoEl.addEventListener('mouseenter', () => highlightScientistGroup(id));
      photoEl.addEventListener('mouseleave', () => unhighlightScientistGroup(id));
      timeline.appendChild(photoEl);

      // Store coordinates for drawing lines (use clamped position)
      const photoCoord = { x: clampedPhotoX + PHOTO_SIZE / 2, y: photoStyleTop + PHOTO_SIZE / 2 };
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
        line.setAttribute('vector-effect', 'non-scaling-stroke'); // Keep stroke width constant
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
  const yearOffsets = {}; // Track publications per year for offsetting

  Object.entries(scientists).forEach(([id, scientist]) => {
    if (!scientist?.publications?.length) return;

    // Sort publications by year within each scientist to ensure consistent offset application if needed later
    const sortedPubs = [...scientist.publications].sort((a, b) => (a.year || 0) - (b.year || 0));

    sortedPubs.forEach((pub, pubIndex) => {
      if (typeof pub.year !== 'number') return; // Skip invalid years

      // Calculate offset for this year
      const offsetCount = yearOffsets[pub.year] || 0;
      const horizontalOffset = offsetCount * (PUBLICATION_SIZE / 2);
      yearOffsets[pub.year] = offsetCount + 1; // Increment count for this year

      const pubEl = document.createElement('div');
      pubEl.className = 'publication';
      pubEl.style.backgroundColor = scientist.color || '#ccc'; // Use scientist color
      pubEl.dataset.scientistId = id; // Link to scientist
      pubEl.title = `${pub.title || 'N/A'} (${pub.year})`; // Tooltip

      // Simple horizontal positioning based on year, adding the calculated offset
      const basePubX = ((pub.year - START_YEAR) / YEAR_SPAN) * baseTimelineWidth;
      const pubStyleTop = axisY - (PUBLICATION_SIZE / 2); // Center vertically on axis
      // Apply offset: Center horizontally on year, then add offset
      const pubStyleLeft = basePubX - (PUBLICATION_SIZE / 2) + horizontalOffset;

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
  const discoveriesToggle = document.getElementById('discoveriesToggle');
  if (discoveriesToggle && !discoveriesToggle.checked) {
    return;
  }
  const { START_YEAR, YEAR_SPAN, DISCOVERY_SIZE, DISCOVERY_BASE_OFFSET_Y } = config;
  const STAGGER_PADDING = 5; // Pixels between staggered markers
  let lastMarkerEndX = -Infinity; // Track the right edge of the last placed marker

  // Calculate pixel offset based on fraction and current axisY
  const discoveryOffsetY = DISCOVERY_BASE_OFFSET_Y * axisY;

  // Sort discoveries by year to handle staggering correctly left-to-right
  const sortedDiscoveries = [...discoveries].sort((a, b) => (a.year || 0) - (b.year || 0));

  sortedDiscoveries.forEach((discovery, index) => {
    if (typeof discovery.year !== 'number') return;

    const discoveryEl = document.createElement('div');
    discoveryEl.className = 'discovery-marker';
    discoveryEl.style.backgroundColor = discovery.color || '#aaaaaa';
    discoveryEl.style.width = `${DISCOVERY_SIZE}px`;
    discoveryEl.style.height = `${DISCOVERY_SIZE}px`;
    discoveryEl.title = `${discovery.title || 'Untitled Discovery'} (${discovery.year})`;

    const discoveryYearX = ((discovery.year - START_YEAR) / YEAR_SPAN) * baseTimelineWidth; // Center X for the year

    // Calculate default horizontal position
    let discoveryStyleLeft = discoveryYearX - (DISCOVERY_SIZE / 2);

    // Check for overlap with the previous marker
    if (discoveryStyleLeft < lastMarkerEndX + STAGGER_PADDING) {
        discoveryStyleLeft = lastMarkerEndX + STAGGER_PADDING; // Stagger to the right
    }

    // Clamp position to stay within timeline bounds
    const clampedDiscoveryX = Math.max(0, Math.min(baseTimelineWidth - DISCOVERY_SIZE, discoveryStyleLeft));

    // Update the end position for the next marker's check *after* clamping
    lastMarkerEndX = clampedDiscoveryX + DISCOVERY_SIZE;

    // Position *above* the axis line using the calculated pixel offset
    const discoveryStyleTop = axisY - discoveryOffsetY - (DISCOVERY_SIZE / 2);

    discoveryEl.style.left = `${clampedDiscoveryX}px`;
    discoveryEl.style.top = `${discoveryStyleTop}px`;

    // Add particle label inside
    const particleLabel = document.createElement('span');
    particleLabel.textContent = discovery.particle || '?';
    particleLabel.setAttribute('aria-label', `Discovery: ${discovery.title || 'Untitled'} (${discovery.year})`); // Accessibility
    particleLabel.style.position = 'absolute';
    particleLabel.style.top = '50%';
    particleLabel.style.left = '50%';
    particleLabel.style.transform = 'translate(-50%, -50%)';
    // Adjust font size based on potentially changed DISCOVERY_SIZE
    particleLabel.style.fontSize = `${Math.max(6, Math.floor(DISCOVERY_SIZE * 0.6))}px`;
    particleLabel.style.color = '#fff'; // White text for contrast
    particleLabel.style.textAlign = 'center';
    particleLabel.style.pointerEvents = 'none'; // Prevent label from interfering with clicks
    discoveryEl.appendChild(particleLabel);

    discoveryEl.addEventListener('click', () => showPublicationModal(discovery.discoverer, discovery.year, discovery.title, discovery.details, 'discovery'));
    timeline.appendChild(discoveryEl);

    // Draw connecting line from *center* of marker to axis
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', clampedDiscoveryX + DISCOVERY_SIZE / 2); // Center of marker horizontally
    // Connect line to the vertical center of the marker
    line.setAttribute('y1', discoveryStyleTop + DISCOVERY_SIZE / 2); // Center of marker vertically
    line.setAttribute('x2', discoveryYearX); // Target X at actual year position
    line.setAttribute('y2', axisY); // Axis line
    line.setAttribute('stroke', discovery.color || '#aaaaaa');
    line.setAttribute('stroke-width', '1.5'); // Thinner line
    line.classList.add('connecting-line'); // Add class for styling
    line.setAttribute('vector-effect', 'non-scaling-stroke'); // Ensure stroke width remains constant
    timelineSvg.appendChild(line);
  });
}

function renderEvents(timeline, baseTimelineWidth, axisY, timelineSvg) {
  const significantEventsToggle = document.getElementById('significantEventsToggle');
  if (significantEventsToggle && !significantEventsToggle.checked) {
    return;
  }
  // Destructure all needed constants from config, including the newly moved ones
  const {
    START_YEAR, YEAR_SPAN, EVENT_BASE_OFFSET_Y,
    EVENT_TEXT_BASE_SIZE, EVENT_TEXT_LINE_HEIGHT, EVENT_BOX_PADDING, EVENT_VERTICAL_PADDING
  } = config;

  // Calculate base pixel offset based on fraction and current axisY
  const baseEventOffsetY = EVENT_BASE_OFFSET_Y * axisY;

  // Sort events by start year to process them chronologically for stacking
  const sortedEvents = [...significantEvents].sort((a, b) => (a.startYear || 0) - (b.startYear || 0));

  const occupiedLevels = []; // Stores arrays of {startX, endX, boxHeight} intervals for each vertical level
  const levelMaxHeights = []; // Stores the max height encountered *on* each level index

  sortedEvents.forEach(event => {
    if (typeof event.startYear !== 'number' || typeof event.endYear !== 'number' || event.startYear >= event.endYear) return;

    const startX = ((event.startYear - START_YEAR) / YEAR_SPAN) * baseTimelineWidth;
    const endX = ((event.endYear - START_YEAR) / YEAR_SPAN) * baseTimelineWidth;
    const eventWidth = Math.max(1, endX - startX); // Ensure minimum width of 1px

    // --- Calculate required height based on text wrapping ---
    const words = (event.title || 'Event').split(' ');
    let currentLine = '';
    const lines = [];
    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      // Estimate text width (simple approximation)
      const testWidth = testLine.length * EVENT_TEXT_BASE_SIZE * 0.6;
      if (testWidth > eventWidth - 2 * EVENT_BOX_PADDING && currentLine !== '') { // Check currentLine to avoid pushing empty lines
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    if (currentLine) lines.push(currentLine);
    // Ensure at least one line if title was empty or very short
    if (lines.length === 0 && (event.title || 'Event')) lines.push(event.title || 'Event');

    const boxHeight = Math.max(EVENT_TEXT_BASE_SIZE + 2 * EVENT_BOX_PADDING, // Minimum height
                           lines.length * EVENT_TEXT_BASE_SIZE * EVENT_TEXT_LINE_HEIGHT + 2 * EVENT_BOX_PADDING);
    // --- End Height Calculation ---

    // --- Find the first available vertical level ---
    let levelIndex = 0;
    let foundLevel = false;
    while (!foundLevel) {
      if (!occupiedLevels[levelIndex]) {
        occupiedLevels[levelIndex] = []; // Initialize level if it doesn't exist
        foundLevel = true;
      } else {
        // Check for overlap with intervals on this level
        const overlaps = occupiedLevels[levelIndex].some(interval => {
          // Overlap condition: new interval starts before existing ends AND new interval ends after existing starts
          return startX < interval.endX && endX > interval.startX;
        });
        if (!overlaps) {
          foundLevel = true; // Found a non-overlapping spot on this level
        } else {
          levelIndex++; // Try the next level down
        }
      }
    }
    // Add the current event's interval *and its calculated height* to the chosen level
    occupiedLevels[levelIndex].push({ startX, endX, boxHeight });

    // Update the maximum height recorded for this specific level
    levelMaxHeights[levelIndex] = Math.max(levelMaxHeights[levelIndex] || 0, boxHeight);
    // --- End Level Finding ---

    // --- Calculate final vertical position based on actual max heights of preceding levels ---
    let cumulativeLevelOffset = 0;
    for (let l = 0; l < levelIndex; l++) {
      // Sum the max height of the level above plus the padding
      cumulativeLevelOffset += (levelMaxHeights[l] || 0) + EVENT_VERTICAL_PADDING;
    }
    const eventStyleTop = baseEventOffsetY + axisY + cumulativeLevelOffset;
    // --- End Vertical Position Calculation ---


    // --- Create and position the event box ---
    const eventEl = document.createElement('div');
    eventEl.className = 'event-box';
    const bgColor = event.color || '#888888';
    eventEl.style.backgroundColor = bgColor;
    eventEl.style.border = '1px solid rgba(0,0,0,0.2)';
    eventEl.style.boxSizing = 'border-box';
    eventEl.style.position = 'absolute';
    eventEl.style.cursor = 'pointer';

    // Use the startX and endX calculated earlier in the loop
    eventEl.style.left = `${startX}px`;
    eventEl.style.top = `${eventStyleTop}px`; // Use calculated top
    eventEl.style.width = `${eventWidth}px`;
    eventEl.style.height = `${boxHeight}px`; // Use calculated height

    eventEl.title = `${event.title} (${event.startYear}-${event.endYear})`; // Tooltip remains the same

    eventEl.addEventListener('click', () => {
      showPublicationModal(
        'Significant Event',
        `${event.startYear} - ${event.endYear}`,
        event.title,
        event.details,
        'event'
      );
    });

    timeline.appendChild(eventEl);

    // --- Create and position SVG text ---
    const svgText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    const textX = startX + eventWidth / 2; // Center horizontally
    // Adjust textY based on calculated eventStyleTop
    const textY = eventStyleTop + EVENT_BOX_PADDING;

    const textColor = getContrastColor(bgColor); // Get contrast color based on box background

    svgText.setAttribute('x', textX);
    svgText.setAttribute('y', textY);
    svgText.setAttribute('font-size', `${EVENT_TEXT_BASE_SIZE}px`);
    svgText.setAttribute('fill', textColor);
    svgText.setAttribute('text-anchor', 'middle');
    svgText.setAttribute('dominant-baseline', 'hanging');
    svgText.setAttribute('pointer-events', 'none'); // Text should not block clicks on the box

    // Add each calculated line as a <tspan> element
    lines.forEach((line, index) => {
        const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan.setAttribute('x', textX);
        // Adjust tspan y based on base textY and line index
        tspan.setAttribute('y', textY + index * EVENT_TEXT_BASE_SIZE * EVENT_TEXT_LINE_HEIGHT);
        tspan.textContent = line;
        svgText.appendChild(tspan);
    });

    // Apply inverse scale transform to the text
    svgText.setAttribute('transform', `scale(var(--current-inverse-scale, 1))`);
    svgText.setAttribute('transform-origin', `${textX}px ${textY}px`); // Scale from top-center

    timelineSvg.appendChild(svgText);
    // --- End SVG Text ---

    // Draw vertical lines connecting the event box ends to the timeline axis
    const lineStroke = event.color || '#888888';
    const lineStrokeWidth = '1.5';

    const startLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    startLine.setAttribute('x1', startX);
    startLine.setAttribute('y1', axisY);
    startLine.setAttribute('x2', startX);
    // Adjust line end point (y2) based on calculated eventStyleTop
    startLine.setAttribute('y2', eventStyleTop + 1); // Extend slightly into the box
    startLine.setAttribute('stroke', lineStroke);
    startLine.setAttribute('stroke-width', lineStrokeWidth);
    startLine.setAttribute('vector-effect', 'non-scaling-stroke');
    startLine.setAttribute('stroke-linecap', 'round'); // Add rounded cap
    timelineSvg.appendChild(startLine);

    const endLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    endLine.setAttribute('x1', endX);
    endLine.setAttribute('y1', axisY);
    endLine.setAttribute('x2', endX);
    // Adjust line end point (y2) based on calculated eventStyleTop
    endLine.setAttribute('y2', eventStyleTop + 1); // Extend slightly into the box
    endLine.setAttribute('stroke', lineStroke);
    endLine.setAttribute('stroke-width', lineStrokeWidth);
    endLine.setAttribute('vector-effect', 'non-scaling-stroke');
    endLine.setAttribute('stroke-linecap', 'round'); // Add rounded cap
    timelineSvg.appendChild(endLine);
  });
}


// Main render function for the entire timeline
export function renderTimeline(timelineContainer, timeline, updateTimelineTransform, updateScientistImages) { // Added updateScientistImages
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
  renderYearMarkers(timeline, baseTimelineWidth, axisY, timelineSvg); // Pass timelineSvg
  // Render publications first to get their coordinates for scientist lines
  renderPublications(timeline, baseTimelineWidth, axisY, elementCoords);
  // Render scientists and draw lines to their first publication
  renderScientists(timeline, baseTimelineWidth, axisY, elementCoords, timelineSvg);
  renderDiscoveries(timeline, baseTimelineWidth, axisY, timelineSvg);
  renderEvents(timeline, baseTimelineWidth, axisY, timelineSvg); // Renders boxes AND SVG text

  // Apply initial transform after rendering
  if (updateTimelineTransform) {
      updateTimelineTransform();
  } else {
      console.warn("updateTimelineTransform function not provided to renderTimeline.");
  }

  // After all elements are rendered, call updateScientistImages to set the correct initial state
  if (updateScientistImages) {
    const cartoonToggle = document.getElementById('cartoonToggle');
    const initialCartoonState = cartoonToggle ? cartoonToggle.checked : false;
    updateScientistImages(initialCartoonState);
  } else {
    console.warn("updateScientistImages function not provided to renderTimeline.");
  }
}
