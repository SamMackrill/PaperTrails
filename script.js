export let scientists = {};
export let discoveries = [];
export let significantEvents = [];

// Configuration object
export const config = {
  START_YEAR: 1600,
  CURRENT_YEAR: new Date().getFullYear(),
  MIN_SCALE: 0.5,
  MAX_SCALE: 3.0,
  ZOOM_STEP: 0.1,
  PHOTO_SIZE: 50,
  PUBLICATION_SIZE: 12,
  PHOTO_BASE_OFFSET_Y: 70,
  PHOTO_VERTICAL_STAGGER: 40,
  DRAG_THRESHOLD: 5,
  RESIZE_DEBOUNCE_DELAY: 250,
  themeLocalStorageKey: 'paperTrailsTheme',
};

config.END_YEAR = config.CURRENT_YEAR;
config.YEAR_SPAN = config.END_YEAR - config.START_YEAR;

export async function loadScientistsData() {
    try {
        const response = await fetch('data/scientists.yaml');
        const yamlText = await response.text();
        scientists = jsyaml.load(yamlText);
    } catch (error) {
        console.error('Failed to load scientists data:', error);
    }
}

export async function loadDiscoveriesData() {
    try {
        const response = await fetch('data/discoveries.yaml');
        const yamlText = await response.text();
        discoveries = jsyaml.load(yamlText);
    } catch (error) {
        console.error('Failed to load discoveries data:', error);
    }
}

export async function loadSignificantEventsData() {
    try {
        const response = await fetch('data/significantevents.yaml');
        const yamlText = await response.text();
        significantEvents = jsyaml.load(yamlText);
    } catch (error) {
        console.error('Failed to load significant events data:', error);
    }
}

export async function initializeData() {
    await Promise.all([
        loadScientistsData(),
        loadDiscoveriesData(),
        loadSignificantEventsData()
    ]);
    renderTimeline(); // Render everything in the timeline
}

// Call the function to load data
initializeData();

// DOM Elements (fetched in initializeApp)
let timelineContainer, timeline, zoomInButton, zoomOutButton, resetZoomButton, zoomLevelDisplay;
let pubModal, sciModal, closePubModal, closeSciModal, pubModalTitle, pubModalAbstract;
let pubModalAuthor, pubModalYear, sciModalName, sciModalNationality, sciModalBirth, sciModalDeath;
let modeToggleButton, pubModalAuthorLabel;

// State Variables
let currentScale = 1.0;
let currentTranslateX = 0;
let currentTranslateY = 0;
let isDragging = false;
let potentialDrag = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartTranslateX = 0;
let dragStartTranslateY = 0;
let resizeTimer;

// --- Dark/Light Mode Logic ---
export function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
    if (modeToggleButton) {
      modeToggleButton.textContent = '☀️';
      modeToggleButton.title = 'Switch to Light Mode';
    }
    localStorage.setItem(config.themeLocalStorageKey, 'dark');
  } else {
    document.body.classList.remove('dark-mode');
    if (modeToggleButton) {
      modeToggleButton.textContent = '🌙';
      modeToggleButton.title = 'Switch to Dark Mode';
    }
    localStorage.setItem(config.themeLocalStorageKey, 'light');
  }
}

export function toggleTheme() {
  const currentThemeIsDark = document.body.classList.contains('dark-mode');
  applyTheme(currentThemeIsDark ? 'light' : 'dark');
}

export function initializeTheme() {
  const savedTheme = localStorage.getItem(config.themeLocalStorageKey);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  modeToggleButton = document.getElementById('mode-toggle'); // Fetch button here

  if (savedTheme) {
    applyTheme(savedTheme);
  } else if (prefersDark) {
    applyTheme('dark');
  } else {
    applyTheme('light'); // Default light
  }

  if (modeToggleButton) {
    modeToggleButton.addEventListener('click', toggleTheme);
  } else {
    console.error("Mode toggle button not found during initialization.");
  }
}

// --- Helper Functions ---
export function updateTimelineTransform() {
  // Ensure critical elements are available
  if (!timeline || !zoomLevelDisplay) {
    console.error("Timeline or zoom display element missing during transform update.");
    return;
  }
  // Ensure dimensions are valid
  if (timeline.offsetWidth === 0 || timeline.offsetHeight === 0) {
     // Update display even if dimensions are zero, but don't transform
     zoomLevelDisplay.textContent = `${Math.round(currentScale * 100)}%`;
     return;
  }

  const containerWidth = timelineContainer.clientWidth;
  const containerHeight = timelineContainer.clientHeight;
  const timelineCurrentWidth = timeline.offsetWidth;
  const timelineCurrentHeight = timeline.offsetHeight;
  const timelineScaledWidth = timelineCurrentWidth * currentScale;
  const timelineScaledHeight = timelineCurrentHeight * currentScale;

  // Clamp X
  let clampedTranslateX = currentTranslateX;
  if (timelineScaledWidth <= containerWidth) {
    clampedTranslateX = 0;
  } else {
    const maxTranslateX = 0;
    const minTranslateX = containerWidth - timelineScaledWidth;
    clampedTranslateX = Math.max(minTranslateX, Math.min(maxTranslateX, currentTranslateX));
  }
  currentTranslateX = clampedTranslateX;

  // Clamp Y
  let clampedTranslateY = currentTranslateY;
  if (timelineScaledHeight <= containerHeight) {
    clampedTranslateY = 0;
  } else {
    const maxTranslateY = 0;
    const minTranslateY = containerHeight - timelineScaledHeight;
    clampedTranslateY = Math.max(minTranslateY, Math.min(maxTranslateY, currentTranslateY));
  }
  currentTranslateY = clampedTranslateY;

  // Apply transform using requestAnimationFrame for smoother rendering
  const transformString = `translateX(${currentTranslateX}px) translateY(${currentTranslateY}px) scale(${currentScale})`;
  requestAnimationFrame(() => {
      timeline.style.transform = transformString;
  });

  // Update text immediately
  zoomLevelDisplay.textContent = `${Math.round(currentScale * 100)}%`;
}


// --- Highlight Functions ---
export function highlightScientistGroup(scientistId) {
    const photo = document.getElementById(`photo-${scientistId}`);
    const line = document.getElementById(`line-${scientistId}`);
    const publications = document.querySelectorAll(`.publication[data-scientist-id="${scientistId}"]`);
    if (photo) photo.classList.add('highlight');
    if (line) line.classList.add('highlight');
    publications.forEach(pub => pub.classList.add('highlight'));
}

export function unhighlightScientistGroup(scientistId) {
    const photo = document.getElementById(`photo-${scientistId}`);
    const line = document.getElementById(`line-${scientistId}`);
    const publications = document.querySelectorAll(`.publication[data-scientist-id="${scientistId}"]`);
    if (photo) photo.classList.remove('highlight');
    if (line) line.classList.remove('highlight');
    publications.forEach(pub => pub.classList.remove('highlight'));
}


// --- Timeline Rendering ---
function renderAxis(timeline, baseTimelineWidth, axisY) {
  const axisLine = document.createElement('div');
  axisLine.className = 'timeline-axis-line';
  axisLine.style.top = `${axisY - 1}px`;
  timeline.appendChild(axisLine);

  const axisLabel = document.createElement('div');
  axisLabel.className = 'timeline-axis-label';
  axisLabel.textContent = 'Year';
  axisLabel.style.top = `${axisY}px`;
  timeline.appendChild(axisLabel);
}

function renderYearMarkers(timeline, baseTimelineWidth, axisY) {
  const { START_YEAR, END_YEAR, YEAR_SPAN } = config;
  const lastDecade = Math.floor(END_YEAR / 10) * 10;

  for (let year = START_YEAR; year <= lastDecade; year += 10) {
    const isMajor = year % 100 === 0;
    const yearMarker = document.createElement('div');
    yearMarker.className = `year-marker ${isMajor ? 'major' : ''}`;
    const posX = ((year - START_YEAR) / YEAR_SPAN) * baseTimelineWidth;
    yearMarker.style.left = `${posX}px`;
    yearMarker.style.top = `${axisY}px`;

    const yearLabel = document.createElement('span');
    yearLabel.textContent = year;
    yearMarker.appendChild(yearLabel);
    timeline.appendChild(yearMarker);
  }

  if (END_YEAR > lastDecade) {
    const endMarker = document.createElement('div');
    endMarker.className = 'year-marker current-year';
    const endPosX = ((END_YEAR - START_YEAR) / YEAR_SPAN) * baseTimelineWidth;
    endMarker.style.left = `${endPosX}px`;
    endMarker.style.top = `${axisY}px`;

    const endLabel = document.createElement('span');
    endLabel.textContent = END_YEAR;
    endMarker.appendChild(endLabel);
    timeline.appendChild(endMarker);
  }
}

function renderScientists(timeline, baseTimelineWidth, axisY, elementCoords) {
  const { START_YEAR, YEAR_SPAN, PHOTO_SIZE, PHOTO_BASE_OFFSET_Y, PHOTO_VERTICAL_STAGGER } = config;
  let photoIndex = 0;

  const sortedScientistEntries = Object.entries(scientists).sort(([, sciA], [, sciB]) => {
    let yearA = Infinity, yearB = Infinity;
    try {
      if (sciA.publications?.length) {
        yearA = Math.min(...sciA.publications.map(p => p.year || Infinity));
      }
    } catch (e) {}
    try {
      if (sciB.publications?.length) {
        yearB = Math.min(...sciB.publications.map(p => p.year || Infinity));
      }
    } catch (e) {}
    if (yearA === Infinity && yearB === Infinity) return 0;
    if (yearA === Infinity) return 1;
    if (yearB === Infinity) return -1;
    return yearA - yearB;
  });

  sortedScientistEntries.forEach(([id, scientist]) => {
    try {
      if (!scientist?.publications?.length) return;
      scientist.publications.sort((a, b) => (a.year || Infinity) - (b.year || Infinity));
      const firstPub = scientist.publications[0];
      if (!firstPub?.year) return;

      const photoEl = document.createElement('img');
      photoEl.src = scientist.photo;
      photoEl.alt = scientist.name;
      photoEl.className = 'scientist-photo';
      photoEl.style.border = `3px solid ${scientist.color}`;
      photoEl.dataset.scientistId = id;
      photoEl.id = `photo-${id}`;
      photoEl.loading = 'lazy';
      photoEl.onerror = function () {
        const isDarkMode = document.body.classList.contains('dark-mode');
        photoEl.src = isDarkMode ? 'images/default.png' : 'images/default.png';
      };

      const photoYearX = ((firstPub.year - START_YEAR) / YEAR_SPAN) * baseTimelineWidth;
      const photoX = photoYearX - PHOTO_SIZE / 2;
      let photoCenterY;
      const staggerOffset = (Math.floor(photoIndex / 2) % 2 === 0) ? 0 : PHOTO_VERTICAL_STAGGER;
      if (photoIndex % 2 === 0) {
        photoCenterY = axisY - PHOTO_BASE_OFFSET_Y - staggerOffset;
      } else {
        photoCenterY = axisY + PHOTO_BASE_OFFSET_Y + staggerOffset;
      }
      const photoStyleTop = photoCenterY - PHOTO_SIZE / 2;
      photoEl.style.left = `${photoX}px`;
      photoEl.style.top = `${photoStyleTop}px`;

      photoEl.addEventListener('click', () => showScientistModal(id));
      photoEl.addEventListener('mouseenter', () => highlightScientistGroup(id));
      photoEl.addEventListener('mouseleave', () => unhighlightScientistGroup(id));
      timeline.appendChild(photoEl);

      elementCoords[`photo_${id}`] = { x: photoX + PHOTO_SIZE / 2, y: photoStyleTop + PHOTO_SIZE / 2 };
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
      if (typeof pub.year !== 'number') return;

      const pubEl = document.createElement('div');
      pubEl.className = 'publication';
      pubEl.style.backgroundColor = scientist.color;
      pubEl.dataset.title = pub.title || 'N/A';
      pubEl.dataset.abstract = pub.abstract || 'N/A';
      pubEl.dataset.scientistId = id;
      pubEl.title = `${pub.title || 'N/A'} (${pub.year})`;

      const offsetFactor = (pubIndex % 2 === 0 ? 1 : -1) * (pubIndex * 0.5);
      const adjustedYear = pub.year + offsetFactor;

      const pubX = ((adjustedYear - START_YEAR) / YEAR_SPAN) * baseTimelineWidth;
      const pubStyleTop = axisY - (PUBLICATION_SIZE / 2);
      const pubStyleLeft = pubX - (PUBLICATION_SIZE / 2);
      const clampedPubX = Math.max(0, Math.min(baseTimelineWidth - PUBLICATION_SIZE, pubStyleLeft));

      pubEl.style.left = `${clampedPubX}px`;
      pubEl.style.top = `${pubStyleTop}px`;

      pubEl.addEventListener('click', () => showPublicationModal(scientist.name, pub.year, pub.title || 'N/A', pub.abstract || 'N/A', 'publication'));
      timeline.appendChild(pubEl);

      if (pubIndex === 0) {
        elementCoords[`pub_${id}_first`] = { x: clampedPubX + PUBLICATION_SIZE / 2, y: axisY };
      }
    });
  });
}

function renderDiscoveries(timeline, baseTimelineWidth, axisY, timelineSvg) {
  const { START_YEAR, YEAR_SPAN } = config;

  discoveries.forEach((discovery, index) => {
    if (typeof discovery.year !== 'number') return;

    const discoveryEl = document.createElement('div');
    discoveryEl.className = 'discovery-marker';
    discoveryEl.style.backgroundColor = discovery.color || '#aaaaaa';

    const bubbleSize = 24;
    discoveryEl.style.width = `${bubbleSize}px`;
    discoveryEl.style.height = `${bubbleSize}px`;

    discoveryEl.title = `${discovery.title || 'Untitled Discovery'} (${discovery.year})`;
    const discoveryX = ((discovery.year - START_YEAR) / YEAR_SPAN) * baseTimelineWidth;

    const discoveryStyleTop = axisY - 50;
    const horizontalSpacing = 10;
    const discoveryStyleLeft = discoveryX + (index % 2 === 0 ? index * horizontalSpacing : -index * horizontalSpacing);
    const clampedDiscoveryX = Math.max(0, Math.min(baseTimelineWidth - bubbleSize, discoveryStyleLeft));
    discoveryEl.style.left = `${clampedDiscoveryX}px`;
    discoveryEl.style.top = `${discoveryStyleTop}px`;

    const particleLabel = document.createElement('span');
    particleLabel.textContent = discovery.particle || 'Unknown Particle';
    particleLabel.style.position = 'absolute';
    particleLabel.style.top = '50%';
    particleLabel.style.left = '50%';
    particleLabel.style.transform = 'translate(-50%, -50%)';
    particleLabel.style.fontSize = '12px';
    particleLabel.style.color = '#fff';
    particleLabel.style.textAlign = 'center';
    discoveryEl.appendChild(particleLabel);

    discoveryEl.addEventListener('click', () => showPublicationModal(discovery.discoverer || 'Unknown', discovery.year, discovery.title || 'Untitled Discovery', discovery.details || 'No details available.', 'discovery'));
    timeline.appendChild(discoveryEl);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', clampedDiscoveryX + bubbleSize / 2);
    line.setAttribute('y1', discoveryStyleTop + bubbleSize);
    line.setAttribute('x2', discoveryX);
    line.setAttribute('y2', axisY);
    line.setAttribute('stroke', discovery.color || '#aaaaaa');
    line.setAttribute('stroke-width', '2');
    timelineSvg.appendChild(line);
  });
}

function renderEvents(timeline, baseTimelineWidth, axisY, timelineSvg) {
  const { START_YEAR, YEAR_SPAN } = config;

  significantEvents.forEach(event => {
    if (typeof event.startYear !== 'number' || typeof event.endYear !== 'number') return;

    const eventEl = document.createElement('div');
    eventEl.className = 'event-box';
    eventEl.style.backgroundColor = event.color || '#888';
    eventEl.style.border = '2px solid #000';
    eventEl.style.padding = '5px';
    eventEl.style.boxSizing = 'border-box';

    const startX = ((event.startYear - START_YEAR) / YEAR_SPAN) * baseTimelineWidth;
    const endX = ((event.endYear - START_YEAR) / YEAR_SPAN) * baseTimelineWidth;
    const eventWidth = endX - startX;

    const eventStyleTop = axisY + 30; // Position below the timeline
    eventEl.style.position = 'absolute';
    eventEl.style.left = `${startX}px`;
    eventEl.style.top = `${eventStyleTop}px`;
    eventEl.style.width = `${eventWidth}px`;

    const eventLabel = document.createElement('span');
    eventLabel.textContent = event.title || 'Unknown Event';
    eventLabel.style.display = 'block';
    eventLabel.style.fontSize = '10px';
    eventLabel.style.color = '#fff';
    eventLabel.style.textAlign = 'center';

    eventEl.appendChild(eventLabel);

    eventEl.addEventListener('click', () => {
      showPublicationModal(
        'Significant Event',
        `${event.startYear} - ${event.endYear}`,
        event.title,
        event.details || 'No details available.',
        'event'
      );
    });

    timeline.appendChild(eventEl);

    // Draw lines connecting the event to the timeline axis
    const startLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    startLine.setAttribute('x1', startX);
    startLine.setAttribute('y1', axisY);
    startLine.setAttribute('x2', startX);
    startLine.setAttribute('y2', eventStyleTop);
    startLine.setAttribute('stroke', event.color || '#888');
    startLine.setAttribute('stroke-width', '2');
    timelineSvg.appendChild(startLine);

    const endLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    endLine.setAttribute('x1', endX);
    endLine.setAttribute('y1', axisY);
    endLine.setAttribute('x2', endX);
    endLine.setAttribute('y2', eventStyleTop);
    endLine.setAttribute('stroke', event.color || '#888');
    endLine.setAttribute('stroke-width', '2');
    timelineSvg.appendChild(endLine);
  });
}

function drawConnectingLines(timelineSvg, elementCoords) {
  Object.keys(scientists).forEach(id => {
    const photoCoord = elementCoords[`photo_${id}`];
    const firstPubCoord = elementCoords[`pub_${id}_first`];
    if (photoCoord && firstPubCoord) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', photoCoord.x);
      line.setAttribute('y1', photoCoord.y);
      line.setAttribute('x2', firstPubCoord.x);
      line.setAttribute('y2', firstPubCoord.y);
      line.setAttribute('stroke', scientists[id]?.color || '#ccc');
      line.classList.add('connecting-line');
      timelineSvg.appendChild(line);
    }
  });
}

export function renderTimeline() {
  if (!timelineContainer || !timeline) {
    console.error("Timeline elements not found for render!");
    return;
  }

  timeline.innerHTML = '';
  const containerWidth = timelineContainer.clientWidth;
  const timelineHeight = timelineContainer.clientHeight;
  if (timelineHeight === 0 || containerWidth === 0) {
    console.error("Container dimensions zero.");
    return;
  }

  const axisY = timelineHeight / 2;
  const baseTimelineWidth = Math.max(containerWidth * 3, config.YEAR_SPAN / 10 * 32);
  timeline.style.width = `${baseTimelineWidth}px`;

  const timelineSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  timelineSvg.setAttribute('class', 'timeline-svg');
  timeline.appendChild(timelineSvg);

  const elementCoords = {};
  renderAxis(timeline, baseTimelineWidth, axisY);
  renderYearMarkers(timeline, baseTimelineWidth, axisY);
  renderScientists(timeline, baseTimelineWidth, axisY, elementCoords);
  renderPublications(timeline, baseTimelineWidth, axisY, elementCoords);
  renderDiscoveries(timeline, baseTimelineWidth, axisY, timelineSvg);
  renderEvents(timeline, baseTimelineWidth, axisY, timelineSvg); // Pass timelineSvg here
  drawConnectingLines(timelineSvg, elementCoords);

  updateTimelineTransform();
}

// --- Modal Handling ---
export function showPublicationModal(actorName, pubYear, title, abstract, type = 'publication') { const targetModal = document.getElementById('publication-modal'); const titleEl = document.getElementById('pub-modal-title'); const authorLabelEl = document.getElementById('pub-modal-author-label'); const authorEl = document.getElementById('pub-modal-author'); const yearEl = document.getElementById('pub-modal-year'); const abstractEl = document.getElementById('pub-modal-abstract'); if (!targetModal || !titleEl || !authorLabelEl || !authorEl || !yearEl || !abstractEl) { console.error("Cannot show publication modal: Missing elements."); return; } authorLabelEl.textContent = (type === 'discovery') ? 'Discoverer:' : 'Author:'; titleEl.textContent = title; authorEl.textContent = actorName || 'N/A'; yearEl.textContent = pubYear || 'N/A'; abstractEl.textContent = abstract || "No details available."; targetModal.classList.add('visible'); }
export function showScientistModal(scientistId) { const scientist = scientists[scientistId]; if (!scientist) return; const targetModal = document.getElementById('scientist-modal'); const nameEl = document.getElementById('sci-modal-name'); const natEl = document.getElementById('sci-modal-nationality'); const birthEl = document.getElementById('sci-modal-birth'); const deathEl = document.getElementById('sci-modal-death'); if (!targetModal || !nameEl || !natEl || !birthEl || !deathEl) { console.error("Cannot show scientist modal: Missing elements."); return; } nameEl.textContent = scientist.name; natEl.textContent = scientist.nationality || 'N/A'; birthEl.textContent = scientist.birth || 'N/A'; deathEl.textContent = scientist.death || 'N/A'; targetModal.classList.add('visible'); }
export function closeModal() { const pubM = document.getElementById('publication-modal'); const sciM = document.getElementById('scientist-modal'); if(pubM) pubM.classList.remove('visible'); if(sciM) sciM.classList.remove('visible'); }

// --- Event Listeners Setup Function ---
export function setupEventListeners() {
    // Fetch elements needed for listeners
    timelineContainer = document.getElementById('timeline-container'); zoomInButton = document.getElementById('zoom-in'); zoomOutButton = document.getElementById('zoom-out'); resetZoomButton = document.getElementById('reset-zoom'); closePubModal = document.getElementById('close-pub-modal'); closeSciModal = document.getElementById('close-sci-modal'); pubModal = document.getElementById('publication-modal'); sciModal = document.getElementById('scientist-modal');
    if (!timelineContainer || !zoomInButton || !zoomOutButton || !resetZoomButton || !closePubModal || !closeSciModal || !pubModal || !sciModal ) { console.error("Cannot setup event listeners: Elements missing."); return; }
    // Wheel listener
    timelineContainer.addEventListener('wheel', (event) => { event.preventDefault(); const rect = timelineContainer.getBoundingClientRect(); const mouseXRelative = event.clientX - rect.left; if (event.ctrlKey) { const zoomFactor = event.deltaY < 0 ? 1 + config.ZOOM_STEP : 1 - config.ZOOM_STEP; const newScale = Math.max(config.MIN_SCALE, Math.min(config.MAX_SCALE, currentScale * zoomFactor)); if (newScale !== currentScale) { const scaleChange = newScale / currentScale; currentTranslateX = mouseXRelative - (mouseXRelative - currentTranslateX) * scaleChange; currentScale = newScale; updateTimelineTransform(); } } else if (event.shiftKey) { const scrollAmount = event.deltaX || event.deltaY; if (scrollAmount !== 0) { currentTranslateX -= Math.sign(scrollAmount) * Math.min(Math.abs(scrollAmount), 50); updateTimelineTransform(); } } else { const scrollAmount = event.deltaY; if (scrollAmount !== 0) { currentTranslateY -= Math.sign(scrollAmount) * Math.min(Math.abs(scrollAmount), 50); updateTimelineTransform(); } } }, { passive: false });
    // Drag listeners
    timelineContainer.addEventListener('mousedown', (event) => { if (event.button !== 0 || event.target.closest('.scientist-photo, .publication, .discovery-marker, .controls, button')) return; potentialDrag = true; isDragging = false; dragStartX = event.clientX; dragStartY = event.clientY; dragStartTranslateX = currentTranslateX; dragStartTranslateY = currentTranslateY; });
    document.addEventListener('mousemove', (event) => { if (!potentialDrag) return; const dx = event.clientX - dragStartX; const dy = event.clientY - dragStartY; if (!isDragging) { if (Math.abs(dx) > config.DRAG_THRESHOLD || Math.abs(dy) > config.DRAG_THRESHOLD) { isDragging = true; timelineContainer.style.cursor = 'grabbing'; timelineContainer.style.userSelect = 'none'; } else { return; } } if (isDragging) { event.preventDefault(); currentTranslateX = dragStartTranslateX + dx; currentTranslateY = dragStartTranslateY + dy; timeline.style.transform = `translateX(${currentTranslateX}px) translateY(${currentTranslateY}px) scale(${currentScale})`; } });
    const stopDragging = (event) => { if (potentialDrag) { if (isDragging) { updateTimelineTransform(); timelineContainer.style.cursor = 'grab'; timelineContainer.style.removeProperty('user-select'); } potentialDrag = false; isDragging = false; } };
    document.addEventListener('mouseup', stopDragging); document.addEventListener('mouseleave', (event) => { if (!event.relatedTarget && !event.toElement && event.buttons === 0) { stopDragging(); } });
    timelineContainer.addEventListener('dragstart', (event) => event.preventDefault());
    // Zoom Button listeners
    function applyZoom(newScaleTarget) { const newScale = Math.max(config.MIN_SCALE, Math.min(config.MAX_SCALE, newScaleTarget)); if (newScale === currentScale) return; const containerWidth = timelineContainer.clientWidth; const containerHeight = timelineContainer.clientHeight; const zoomOriginX = containerWidth / 2; const zoomOriginY = containerHeight / 2; const scaleChange = newScale / currentScale; currentTranslateX = zoomOriginX - (zoomOriginX - currentTranslateX) * scaleChange; currentTranslateY = zoomOriginY - (zoomOriginY - currentTranslateY) * scaleChange; currentScale = newScale; updateTimelineTransform(); }
    zoomInButton.addEventListener('click', () => applyZoom(currentScale + config.ZOOM_STEP)); zoomOutButton.addEventListener('click', () => applyZoom(currentScale - config.ZOOM_STEP)); resetZoomButton.addEventListener('click', () => { currentScale = 1.0; currentTranslateX = 0; currentTranslateY = 0; updateTimelineTransform(); });
    // Modal listeners
    closePubModal.addEventListener('click', closeModal); closeSciModal.addEventListener('click', closeModal); pubModal.addEventListener('click', (event) => { if (event.target === pubModal) closeModal(); }); sciModal.addEventListener('click', (event) => { if (event.target === sciModal) closeModal(); }); window.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeModal(); });
    // Resize listener
    window.addEventListener('resize', debouncedRender);
}

// --- Resize Handler ---
export function debouncedRender() { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { console.log("Window resized, resetting view and re-rendering..."); currentScale = 1.0; currentTranslateX = 0; currentTranslateY = 0; renderTimeline(); }, config.RESIZE_DEBOUNCE_DELAY); }

// --- Initial Setup Function ---
function initializeApp() {
    // Fetch elements needed globally or frequently
    timelineContainer = document.getElementById('timeline-container'); timeline = document.getElementById('timeline'); zoomLevelDisplay = document.querySelector('.zoom-level');
    pubModalTitle = document.getElementById('pub-modal-title'); pubModalAbstract = document.getElementById('pub-modal-abstract'); pubModalAuthor = document.getElementById('pub-modal-author'); pubModalYear = document.getElementById('pub-modal-year'); pubModalAuthorLabel = document.getElementById('pub-modal-author-label');
    sciModalName = document.getElementById('sci-modal-name'); sciModalNationality = document.getElementById('sci-modal-nationality'); sciModalBirth = document.getElementById('sci-modal-birth'); sciModalDeath = document.getElementById('sci-modal-death');
    // Initialize theme first (fetches toggle button inside & adds listener)
    initializeTheme();
    // Render timeline content
    renderTimeline();
    // Setup listeners after elements are guaranteed available
    setupEventListeners();
}

// --- Run Initial Setup ---
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp(); // Already loaded
}

export default initializeApp;