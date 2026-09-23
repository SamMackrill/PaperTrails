import { config } from './src/config.js?v=15';
import { conferences, discoveries, initializeData, scientists, significantEvents } from './src/dataLoader.js?v=18';
import { initializeTheme } from './src/themeManager.js?v=18';
import { closeModal, openItem, setupModalEventListeners } from './src/modalManager.js?v=25';
import { clearTimelineSelection, renderTimeline, selectItemByKey, updateEventLabelPositions } from './src/timelineRenderer.js?v=26';
import { getScaleMode, scaleToSlider, setScaleMode, sliderToScale, xToYear, yearToX } from './src/timeScale.js?v=2';
import { updatePortraitStyle } from './src/portraits.js?v=3';
import { buildSearchIndex, setupSearch } from './src/search.js?v=1';
import { createMinimap } from './src/minimap.js?v=1';
import { formatHash, parseHash } from './src/urlState.js?v=1';
import { applyRovingTabindex, describePosition, handleLaneKey, rememberFocus } from './src/keyboardNav.js?v=1';

const HINT_STORAGE_KEY = 'paperTrailsHintSeen';
const SCALE_STORAGE_KEY = 'paperTrailsScale';
const LAYER_TOGGLES = {
  people: 'peopleToggle',
  publications: 'publicationsToggle',
  discoveries: 'discoveriesToggle',
  conferences: 'conferencesToggle',
  context: 'significantEventsToggle'
};
const TYPE_LAYERS = {
  scientist: 'people',
  publication: 'publications',
  discovery: 'discoveries',
  conference: 'conferences',
  event: 'context'
};

let timelineContainer;
let timeline;
let zoomLevelDisplay;
let zoomSlider;
let interactionHint;
let timelineStatus;

let currentScale = 1;
let currentTranslateX = 0;
let resizeTimer;
let hintTimer;
let statusTimer;
let renderFrame = 0;
let animationFrame = 0;
let urlTimer;
let minimap;
let searchEntries = [];
let dataYears = [];
let currentItemKey = null;
// Set while applying a URL, so the changes it makes are not written back.
let restoringUrl = false;
// The canvas size used by the last render, so resizes can be detected even
// when a render already happened at the new size.
let renderedWidth = 0;
let renderedHeight = 0;

let potentialDrag = false;
let isDragging = false;
let dragStartX = 0;
let dragStartTranslateX = 0;
let suppressTapestryClick = false;

let isPinching = false;
let initialPinchDistance = 0;
let pinchStartScale = 1;
let pinchStartTranslateX = 0;
let pinchOriginX = 0;

function clampScale(scale) {
  return Math.max(config.MIN_SCALE, Math.min(config.MAX_SCALE, scale));
}

function clampTranslation() {
  const minimumX = Math.min(0, timelineContainer.clientWidth - timeline.offsetWidth);
  currentTranslateX = Math.max(minimumX, Math.min(0, currentTranslateX));
}

function getVisibleRange() {
  const width = timeline.offsetWidth || 1;
  const from = Math.max(config.START_YEAR, Math.floor(xToYear(-currentTranslateX, width)));
  const to = Math.min(config.END_YEAR, Math.ceil(xToYear(timelineContainer.clientWidth - currentTranslateX, width)));
  return { from, to };
}

function announceVisibleRange(from, to) {
  clearTimeout(statusTimer);
  statusTimer = window.setTimeout(() => {
    if (timelineStatus) timelineStatus.textContent = `Showing ${from} to ${to}`;
  }, 600);
}

function updateTransform() {
  if (!timeline || !timelineContainer) return;
  hideTooltip();
  clampTranslation();
  timeline.style.transform = `translateX(${currentTranslateX}px)`;
  updateEventLabelPositions(timeline, timelineContainer);
  const { from, to } = getVisibleRange();
  zoomLevelDisplay.textContent = `${from}–${to}`;
  zoomSlider.value = String(scaleToSlider(currentScale));
  zoomSlider.setAttribute('aria-valuetext', `${Math.round(currentScale * 100)}%, showing ${from} to ${to}`);
  announceVisibleRange(from, to);
  minimap?.setWindow(-currentTranslateX / (timeline.offsetWidth || 1), timelineContainer.clientWidth / (timeline.offsetWidth || 1));
  scheduleUrlUpdate();
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

// Moves to a scale with the given fraction of the timeline centred. The
// scale changes geometrically and the centre linearly, which reads as a
// smooth zoom rather than a jump.
function animateView(targetScale, targetFraction, duration = 280) {
  cancelAnimationFrame(animationFrame);
  const endScale = clampScale(targetScale);
  const containerWidth = timelineContainer.clientWidth;
  const startScale = currentScale;
  const startFraction = (containerWidth / 2 - currentTranslateX) / (timeline.offsetWidth || 1);
  const apply = (scale, fraction) => {
    currentScale = scale;
    render();
    currentTranslateX = containerWidth / 2 - fraction * timeline.offsetWidth;
    updateTransform();
  };
  if (prefersReducedMotion() || duration <= 0) {
    apply(endScale, targetFraction);
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const startTime = performance.now();
    const step = (now) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - (1 - progress) ** 3;
      apply(startScale * (endScale / startScale) ** eased, startFraction + (targetFraction - startFraction) * eased);
      if (progress < 1) {
        animationFrame = requestAnimationFrame(step);
      } else {
        resolve();
      }
    };
    animationFrame = requestAnimationFrame(step);
  });
}

function animatePan(targetTranslateX, duration = 280) {
  cancelAnimationFrame(animationFrame);
  const start = currentTranslateX;
  if (prefersReducedMotion()) {
    currentTranslateX = targetTranslateX;
    updateTransform();
    return;
  }
  const startTime = performance.now();
  const step = (now) => {
    const progress = Math.min(1, (now - startTime) / duration);
    currentTranslateX = start + (targetTranslateX - start) * (1 - (1 - progress) ** 3);
    updateTransform();
    if (progress < 1) animationFrame = requestAnimationFrame(step);
  };
  animationFrame = requestAnimationFrame(step);
}

function isPressed(id) {
  return document.getElementById(id)?.getAttribute('aria-pressed') === 'true';
}

function render() {
  hideTooltip();
  // Rendering replaces every timeline element, so keyboard focus is carried
  // across by item key.
  const focusedKey = timeline.contains(document.activeElement) ? document.activeElement.dataset.itemKey : null;
  renderTimeline(timelineContainer, timeline, currentScale);
  applyRovingTabindex(timeline, timelineContainer);
  renderedWidth = timelineContainer.clientWidth;
  renderedHeight = timelineContainer.clientHeight;
  updatePortraitStyle(isPressed('cartoonToggle'));
  updateTransform();
  if (focusedKey) {
    timeline.querySelector(`[data-item-key="${CSS.escape(focusedKey)}"]`)?.focus({ preventScroll: true });
  }
}

// Continuous gestures can fire many times per frame; render at most once.
function scheduleRender() {
  if (renderFrame) return;
  renderFrame = requestAnimationFrame(() => {
    renderFrame = 0;
    render();
  });
}

function markHintSeen() {
  try { localStorage.setItem(HINT_STORAGE_KEY, 'true'); } catch { /* Storage can be disabled. */ }
}

function hideInteractionHint(delay = 0) {
  clearTimeout(hintTimer);
  hintTimer = window.setTimeout(() => {
    interactionHint?.classList.add('is-hidden');
    markHintSeen();
  }, delay);
}

function zoomAt(nextScale, originX = timelineContainer.clientWidth / 2, { deferred = false, animate = false } = {}) {
  const newScale = clampScale(nextScale);
  if (Math.abs(newScale - currentScale) < 0.001) return;

  const ratio = newScale / currentScale;
  if (animate) {
    const endTranslate = originX - (originX - currentTranslateX) * ratio;
    animateView(newScale, (timelineContainer.clientWidth / 2 - endTranslate) / (timeline.offsetWidth * ratio));
    hideInteractionHint();
    return;
  }
  currentTranslateX = originX - (originX - currentTranslateX) * ratio;
  currentScale = newScale;
  if (deferred) {
    scheduleRender();
  } else {
    render();
  }
  hideInteractionHint();
}

function fitTimeline() {
  animateView(1, 0.5);
  hideInteractionHint();
}

function focusYear(year, scale = 2.5) {
  hideInteractionHint();
  return animateView(scale, yearToX(year, 1));
}

function ensureLayerVisible(key) {
  const toggle = document.getElementById(LAYER_TOGGLES[TYPE_LAYERS[key.split(':')[0]]]);
  if (toggle?.getAttribute('aria-pressed') === 'false') {
    toggle.setAttribute('aria-pressed', 'true');
    updateTapestryAvailability();
    render();
  }
}

function findItemOnTimeline(key) {
  return timeline.querySelector(`[data-item-key="${CSS.escape(key)}"]`);
}

// Zooms to an item's year, further if it is hidden in a group or a
// publication stack, then selects it. At maximum zoom a scientist's group
// stands in for them.
async function revealItem(key, year) {
  if (!key || !Number.isFinite(year)) return null;
  ensureLayerVisible(key);
  let scale = Math.max(2.5, currentScale);
  await focusYear(year, scale);
  while (!findItemOnTimeline(key) && scale < config.MAX_SCALE) {
    scale = Math.min(config.MAX_SCALE, scale * 2);
    await focusYear(year, scale);
  }
  const node = selectItemByKey(key);
  node?.focus({ preventScroll: true });
  return node;
}

function focusScientist(scientistId, year) {
  if (!scientistId) return;
  revealItem(`scientist:${scientistId}`, year);
}

function getItemYear(key) {
  const [type, id, extra] = key.split(':');
  if (type === 'scientist') {
    const years = (scientists[id]?.publications || []).map((publication) => publication.year).filter(Number.isFinite);
    return years.length ? Math.min(...years) : null;
  }
  if (type === 'publication') return scientists[id]?.publications?.[Number(extra)]?.year;
  if (type === 'discovery') return discoveries[Number(id)]?.year;
  if (type === 'conference') return conferences[Number(id)]?.year;
  if (type === 'event') return significantEvents[Number(id)]?.startYear;
  return null;
}

// Pans just enough to bring an item into view. Items opened from the panel
// are centred instead, since they may be far away.
function revealElement(element, { centre = false } = {}) {
  const containerRect = timelineContainer.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  const padding = Math.min(64, containerRect.width / 6);
  if (centre && (rect.right < containerRect.left + padding || rect.left > containerRect.right - padding)) {
    animatePan(currentTranslateX + containerRect.left + containerRect.width / 2 - (rect.left + rect.width / 2));
    return;
  }
  if (rect.left < containerRect.left + padding) {
    currentTranslateX += containerRect.left + padding - rect.left;
  } else if (rect.right > containerRect.right - padding) {
    currentTranslateX -= rect.right - (containerRect.right - padding);
  } else {
    return;
  }
  updateTransform();
}

function togglePressed(button) {
  const nextState = button.getAttribute('aria-pressed') !== 'true';
  button.setAttribute('aria-pressed', String(nextState));
  return nextState;
}

function getPinchDistance(touches) {
  return Math.hypot(touches[1].clientX - touches[0].clientX, touches[1].clientY - touches[0].clientY);
}

function getPinchCenterX(touches) {
  const rect = timelineContainer.getBoundingClientRect();
  return (touches[0].clientX + touches[1].clientX) / 2 - rect.left;
}

function getWheelPixels(event, delta) {
  if (event.deltaMode === 1) return delta * 16;
  if (event.deltaMode === 2) return delta * timelineContainer.clientWidth;
  return delta;
}

function setupPointerInteractions() {
  timelineContainer.addEventListener('click', (event) => {
    if (suppressTapestryClick && event.target.closest('.tapestry-scene')) {
      event.preventDefault();
      event.stopPropagation();
    }
    suppressTapestryClick = false;
  }, true);
  timelineContainer.addEventListener('wheel', (event) => {
    event.preventDefault();
    const rect = timelineContainer.getBoundingClientRect();

    if (event.ctrlKey || event.metaKey) {
      // Trackpad pinches send many small deltas and mouse wheels send a few
      // large ones, so zoom in proportion to the distance scrolled.
      const factor = Math.exp(-getWheelPixels(event, event.deltaY) * 0.0015);
      zoomAt(currentScale * factor, event.clientX - rect.left, { deferred: true });
    } else {
      currentTranslateX -= getWheelPixels(event, event.deltaX || event.deltaY);
      updateTransform();
      hideInteractionHint();
    }
  }, { passive: false });

  // Focusing an off-screen item makes the browser scroll this overflow-hidden
  // container natively, which would put it out of step with the transform.
  timelineContainer.addEventListener('scroll', () => {
    if (timelineContainer.scrollLeft || timelineContainer.scrollTop) {
      timelineContainer.scrollLeft = 0;
      timelineContainer.scrollTop = 0;
    }
  });

  timelineContainer.addEventListener('mousedown', (event) => {
    if (event.button !== 0 || (event.target.closest('button') && !event.target.closest('.tapestry-scene'))) return;
    suppressTapestryClick = false;
    potentialDrag = true;
    dragStartX = event.clientX;
    dragStartTranslateX = currentTranslateX;
  });

  document.addEventListener('mousemove', (event) => {
    if (!potentialDrag) return;
    const deltaX = event.clientX - dragStartX;
    if (!isDragging && Math.abs(deltaX) < config.DRAG_THRESHOLD) return;

    isDragging = true;
    suppressTapestryClick = true;
    timelineContainer.classList.add('is-dragging');
    currentTranslateX = dragStartTranslateX + deltaX;
    updateTransform();
    hideInteractionHint();
  });

  const stopDragging = () => {
    potentialDrag = false;
    isDragging = false;
    timelineContainer.classList.remove('is-dragging');
  };

  document.addEventListener('mouseup', stopDragging);
  window.addEventListener('blur', stopDragging);
  timelineContainer.addEventListener('dragstart', (event) => event.preventDefault());

  timelineContainer.addEventListener('touchstart', (event) => {
    if (event.touches.length === 1 && event.target.closest('button') && !event.target.closest('.tapestry-scene')) return;
    suppressTapestryClick = false;

    if (event.touches.length === 1) {
      potentialDrag = true;
      dragStartX = event.touches[0].clientX;
      dragStartTranslateX = currentTranslateX;
    } else if (event.touches.length === 2) {
      event.preventDefault();
      potentialDrag = false;
      isPinching = true;
      suppressTapestryClick = true;
      initialPinchDistance = getPinchDistance(event.touches);
      pinchStartScale = currentScale;
      pinchStartTranslateX = currentTranslateX;
      pinchOriginX = getPinchCenterX(event.touches);
    }
  }, { passive: false });

  timelineContainer.addEventListener('touchmove', (event) => {
    if (isPinching && event.touches.length === 2) {
      event.preventDefault();
      if (!Number.isFinite(initialPinchDistance) || initialPinchDistance <= 0) return;
      const distance = getPinchDistance(event.touches);
      const nextScale = clampScale(pinchStartScale * (distance / initialPinchDistance));
      const ratio = nextScale / pinchStartScale;
      currentTranslateX = pinchOriginX - (pinchOriginX - pinchStartTranslateX) * ratio;
      currentScale = nextScale;
      scheduleRender();
      hideInteractionHint();
      return;
    }

    if (potentialDrag && event.touches.length === 1) {
      const deltaX = event.touches[0].clientX - dragStartX;
      if (!isDragging && Math.abs(deltaX) < config.DRAG_THRESHOLD) return;
      event.preventDefault();
      isDragging = true;
      suppressTapestryClick = true;
      timelineContainer.classList.add('is-dragging');
      currentTranslateX = dragStartTranslateX + deltaX;
      updateTransform();
      hideInteractionHint();
    }
  }, { passive: false });

  timelineContainer.addEventListener('touchend', (event) => {
    if (event.touches.length < 2) isPinching = false;
    if (event.touches.length === 0) stopDragging();
  });

  timelineContainer.addEventListener('keydown', (event) => {
    // On a timeline item, arrows move between items; on the canvas, they pan.
    if (event.target !== timelineContainer && handleLaneKey(event, timeline)) return;
    const panStep = Math.max(60, timelineContainer.clientWidth * 0.12);
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      currentTranslateX += panStep;
      updateTransform();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      currentTranslateX -= panStep;
      updateTransform();
    } else if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      zoomAt(currentScale * 1.25, undefined, { animate: true });
    } else if (event.key === '-') {
      event.preventDefault();
      zoomAt(currentScale / 1.25, undefined, { animate: true });
    } else if (event.key === 'Home') {
      event.preventDefault();
      fitTimeline();
    }
  });
}

function positionTooltip(target) {
  const tooltip = document.getElementById('timeline-tooltip');
  if (!tooltip || !target?.dataset.tooltip) return;

  tooltip.textContent = target.dataset.tooltip;
  tooltip.hidden = false;
  // Tapestry facets share one caption position above their scene.
  const anchor = target.dataset.tooltipAnchor === 'scene' ? target.closest('.tapestry-scene') || target : target;
  const targetRect = anchor.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  let left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
  let top = targetRect.top - tooltipRect.height - 9;
  left = Math.max(8, Math.min(window.innerWidth - tooltipRect.width - 8, left));
  if (top < 8) top = targetRect.bottom + 9;
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function hideTooltip() {
  const tooltip = document.getElementById('timeline-tooltip');
  if (tooltip) tooltip.hidden = true;
}

function setupTooltips() {
  timeline.addEventListener('pointerover', (event) => {
    const target = event.target.closest('[data-tooltip]');
    if (target && !target.contains(event.relatedTarget)) positionTooltip(target);
  });
  timeline.addEventListener('pointerout', (event) => {
    const target = event.target.closest('[data-tooltip]');
    if (target && !target.contains(event.relatedTarget)) hideTooltip();
  });
  timeline.addEventListener('focusin', (event) => {
    timelineContainer.scrollLeft = 0;
    rememberFocus(event.target);
    revealElement(event.target);
    positionTooltip(event.target.closest('[data-tooltip]'));
    const position = describePosition(event.target, timeline);
    if (position && timelineStatus) timelineStatus.textContent = position;
  });
  timeline.addEventListener('focusout', hideTooltip);
}

function updateTapestryAvailability() {
  const tapestryToggle = document.getElementById('tapestryToggle');
  const contextVisible = isPressed('significantEventsToggle');
  tapestryToggle.setAttribute('aria-disabled', String(!contextVisible));
  tapestryToggle.title = contextVisible
    ? 'Show historical context as a Bayeux-style tapestry. Zoom in for more detail; hover or select a scene to learn more.'
    : 'Turn on Context to show the tapestry.';
}

function setupOptionsPopover() {
  const toolbar = document.querySelector('.timeline-toolbar');
  const optionsToggle = document.getElementById('options-toggle');
  const setOpen = (isOpen) => {
    toolbar.classList.toggle('is-open', isOpen);
    optionsToggle.setAttribute('aria-expanded', String(isOpen));
    optionsToggle.setAttribute('aria-label', isOpen ? 'Hide view options' : 'Show view options');
  };

  optionsToggle.addEventListener('click', () => setOpen(!toolbar.classList.contains('is-open')));
  document.addEventListener('click', (event) => {
    if (!toolbar.classList.contains('is-open')) return;
    if (event.target.closest('#toolbar-secondary, #options-toggle')) return;
    setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toolbar.classList.contains('is-open')) {
      event.preventDefault();
      setOpen(false);
      optionsToggle.focus();
    }
  });
}

function setupHelpDialog() {
  const dialog = document.getElementById('help-dialog');
  const open = () => {
    if (!dialog.open) dialog.showModal();
    hideInteractionHint();
  };
  document.getElementById('help-toggle').addEventListener('click', open);
  dialog.addEventListener('click', (event) => {
    // Clicks on the backdrop land on the dialog element itself.
    if (event.target === dialog) dialog.close();
  });
  document.addEventListener('keydown', (event) => {
    const typing = event.target.closest?.('input, textarea, select, [contenteditable="true"]');
    if (event.key === '?' && !typing && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      open();
    }
  });
}

function setupControls() {
  document.getElementById('zoom-out').addEventListener('click', () => zoomAt(currentScale / 1.4, undefined, { animate: true }));
  document.getElementById('zoom-in').addEventListener('click', () => zoomAt(currentScale * 1.4, undefined, { animate: true }));
  document.getElementById('fit-view').addEventListener('click', fitTimeline);

  zoomSlider.addEventListener('input', () => zoomAt(sliderToScale(zoomSlider.value)));

  ['peopleToggle', 'publicationsToggle', 'discoveriesToggle', 'conferencesToggle', 'significantEventsToggle'].forEach((id) => {
    document.getElementById(id).addEventListener('click', (event) => {
      togglePressed(event.currentTarget);
      updateTapestryAvailability();
      render();
    });
  });

  document.getElementById('cartoonToggle').addEventListener('click', (event) => {
    updatePortraitStyle(togglePressed(event.currentTarget));
  });

  document.getElementById('tapestryToggle').addEventListener('click', (event) => {
    if (event.currentTarget.getAttribute('aria-disabled') === 'true') return;
    const enabled = togglePressed(event.currentTarget);
    try { localStorage.setItem('paperTrailsTapestry', String(enabled)); } catch { /* Storage can be disabled. */ }
    render();
  });

  document.getElementById('densityToggle').addEventListener('click', (event) => {
    applyScaleMode(togglePressed(event.currentTarget) ? 'density' : 'linear');
  });

  setupOptionsPopover();
  setupHelpDialog();
}

// Switches between even time and even density, keeping the same year centred.
function applyScaleMode(mode) {
  const width = timeline.offsetWidth || 1;
  const centreYear = xToYear(timelineContainer.clientWidth / 2 - currentTranslateX, width);
  setScaleMode(mode, dataYears);
  document.getElementById('densityToggle').setAttribute('aria-pressed', String(mode === 'density'));
  try { localStorage.setItem(SCALE_STORAGE_KEY, mode); } catch { /* Storage can be disabled. */ }
  render();
  currentTranslateX = timelineContainer.clientWidth / 2 - yearToX(centreYear, timeline.offsetWidth);
  updateTransform();
  minimap?.draw();
}

function collectDataYears() {
  const years = [];
  Object.values(scientists).forEach((scientist) => (scientist.publications || []).forEach((publication) => years.push(publication.year)));
  discoveries.forEach((item) => years.push(item.year));
  conferences.forEach((item) => years.push(item.year));
  significantEvents.forEach((item) => years.push(item.startYear));
  return years.filter(Number.isFinite);
}

function setupMinimap() {
  const element = document.getElementById('minimap');
  const setLeft = (left) => {
    const width = timeline.offsetWidth || 1;
    currentTranslateX = -Math.max(0, left) * width;
    updateTransform();
    hideInteractionHint();
  };
  minimap = createMinimap({
    element,
    getYears: () => dataYears,
    onPan: setLeft,
    onResize: (left, right) => {
      currentScale = clampScale(1 / Math.max(1 / config.MAX_SCALE, right - left));
      scheduleRender();
      requestAnimationFrame(() => setLeft(left));
    },
    onZoom: (factor, fraction) => {
      const rect = timelineContainer.getBoundingClientRect();
      const originX = fraction * (timeline.offsetWidth || 1) + currentTranslateX;
      zoomAt(currentScale * factor, Math.max(0, Math.min(rect.width, originX)), { deferred: true });
    }
  });
  minimap.draw();
  new ResizeObserver(() => minimap.draw()).observe(element);
}

function setupSearchField() {
  const header = document.querySelector('.app-header');
  const input = document.getElementById('search-input');
  const toggle = document.getElementById('search-toggle');
  setupSearch({
    input,
    listbox: document.getElementById('search-results'),
    getIndex: () => searchEntries,
    onChoose: async (entry) => {
      header.classList.remove('is-searching');
      // Open first, so a docked panel has taken its space before the
      // timeline zooms to the item in the final layout.
      openItem(entry.key, { fromTimeline: true });
      await new Promise((resolve) => requestAnimationFrame(resolve));
      await revealItem(entry.key, getItemYear(entry.key) ?? entry.year);
    }
  });
  // Phones show the field only on request.
  toggle.addEventListener('click', () => {
    header.classList.add('is-searching');
    input.focus();
  });
  input.addEventListener('blur', () => window.setTimeout(() => {
    if (!input.value) header.classList.remove('is-searching');
  }, 150));
  document.addEventListener('keydown', (event) => {
    const typing = event.target.closest?.('input, textarea, select, [contenteditable="true"]');
    if (typing || document.querySelector('dialog[open]')) return;
    if (event.key === '/' || (event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey))) {
      event.preventDefault();
      header.classList.add('is-searching');
      input.focus();
    }
  });
}

function getHiddenLayers() {
  return Object.entries(LAYER_TOGGLES).filter(([, id]) => !isPressed(id)).map(([name]) => name);
}

// Keeps the address bar describing the current view, so it can be shared.
// Opening an item adds a history entry; panning and zooming replace it.
function scheduleUrlUpdate({ push = false } = {}) {
  if (restoringUrl || !timeline?.offsetWidth) return;
  clearTimeout(urlTimer);
  const write = () => {
    const { from, to } = getVisibleRange();
    const whole = from <= config.START_YEAR && to >= config.END_YEAR;
    const hash = formatHash({
      from: whole ? null : from,
      to: whole ? null : to,
      item: currentItemKey,
      hidden: getHiddenLayers(),
      scale: getScaleMode(),
      tapestry: isPressed('tapestryToggle')
    });
    const url = `${location.pathname}${location.search}${hash}`;
    if (url === `${location.pathname}${location.search}${location.hash}`) return;
    if (push) {
      history.pushState(null, '', url);
    } else {
      history.replaceState(null, '', url);
    }
  };
  if (push) {
    write();
  } else {
    urlTimer = window.setTimeout(write, 400);
  }
}

// Each history entry replaces the whole view. Only a bare URL on first load
// keeps the reader's saved scale preference.
function applyUrlLayers(state, { initial = false } = {}) {
  Object.entries(LAYER_TOGGLES).forEach(([name, id]) => {
    document.getElementById(id).setAttribute('aria-pressed', String(!state.hidden.includes(name)));
  });
  if (state.tapestry !== null) document.getElementById('tapestryToggle').setAttribute('aria-pressed', String(state.tapestry));
  setScaleMode(state.scale ?? (initial ? getScaleMode() : 'linear'), dataYears);
  document.getElementById('densityToggle').setAttribute('aria-pressed', String(getScaleMode() === 'density'));
  updateTapestryAvailability();
}

function applyUrlView(state, { initial = false } = {}) {
  if (state.from === null || state.to === null || state.to <= state.from) {
    // An entry without a range shows the whole timeline.
    if (!initial) {
      currentScale = 1;
      currentTranslateX = 0;
      render();
    }
    return;
  }
  const fromFraction = yearToX(state.from, 1);
  const toFraction = yearToX(state.to, 1);
  currentScale = clampScale(1 / Math.max(1 / config.MAX_SCALE, toFraction - fromFraction));
  render();
  currentTranslateX = -fromFraction * timeline.offsetWidth;
  updateTransform();
}

function applyUrlState({ initial = false } = {}) {
  const state = parseHash(location.hash);
  restoringUrl = true;
  applyUrlLayers(state, { initial });
  // The panel opens before the view is applied, so the view is fitted to the
  // canvas width that remains beside a docked panel.
  if (state.item && state.item !== currentItemKey) {
    currentItemKey = state.item;
    openItem(state.item, { fromTimeline: true });
  } else if (!state.item && currentItemKey) {
    currentItemKey = null;
    closeModal({ restoreFocus: false });
  }
  render();
  applyUrlView(state, { initial });
  if (state.item) {
    const element = selectItemByKey(state.item);
    if (element && state.from === null) revealElement(element, { centre: true });
  }
  restoringUrl = false;
  minimap?.draw();
}

// Re-lays out whenever the canvas changes size, including when the details
// panel docks beside it, keeping the same years centred.
function setupResizeHandler() {
  let centreRatio = null;
  const relayout = () => {
    const ratio = centreRatio ?? 0.5;
    centreRatio = null;
    if (timelineContainer.clientWidth === renderedWidth && timelineContainer.clientHeight === renderedHeight) return;
    render();
    currentTranslateX = timelineContainer.clientWidth / 2 - ratio * timeline.offsetWidth;
    updateTransform();
    const selected = timeline.querySelector('.is-selected');
    if (selected) revealElement(selected);
  };
  new ResizeObserver(() => {
    if (timelineContainer.clientWidth === renderedWidth && timelineContainer.clientHeight === renderedHeight) return;
    // Remember the centre from the layout before the first size change.
    if (centreRatio === null) {
      centreRatio = (renderedWidth / 2 - currentTranslateX) / (timeline.offsetWidth || 1);
    }
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(relayout, 60);
  }).observe(timelineContainer);
}

function showLoadError(error) {
  const status = document.getElementById('timeline-loading');
  // The live role and a finished busy state must be in place before the
  // message is inserted, or screen readers may not announce it.
  timelineContainer.setAttribute('aria-busy', 'false');
  status.setAttribute('role', 'alert');
  status.classList.add('is-error');
  status.replaceChildren();

  const heading = document.createElement('strong');
  heading.textContent = 'The timeline could not be loaded.';
  const detail = document.createElement('span');
  detail.textContent = location.protocol === 'file:'
    ? 'Browsers block data files opened directly from disk. Serve this folder over HTTP, for example with: python -m http.server 8000'
    : `Check your connection and try again.${error?.message ? ` (${error.message})` : ''}`;
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.className = 'text-button';
  retry.textContent = 'Try again';
  retry.addEventListener('click', () => location.reload());
  status.append(heading, detail, retry);
}

async function initializeApp() {
  timelineContainer = document.getElementById('timeline-container');
  timeline = document.getElementById('timeline');
  zoomLevelDisplay = document.querySelector('.zoom-level');
  zoomSlider = document.getElementById('zoom-slider');
  interactionHint = document.getElementById('interaction-hint');
  timelineStatus = document.getElementById('timeline-status');

  document.getElementById('timeline-range').textContent = `${config.START_YEAR}–${config.END_YEAR}`;
  initializeTheme();
  try {
    // The tapestry is the default context view; readers can switch to bands.
    document.getElementById('tapestryToggle').setAttribute('aria-pressed', String(localStorage.getItem('paperTrailsTapestry') !== 'false'));
    if (localStorage.getItem(HINT_STORAGE_KEY) === 'true') interactionHint.classList.add('is-hidden');
  } catch { /* Use the default text view when storage is unavailable. */ }
  setupModalEventListeners();

  try {
    await initializeData();
  } catch (error) {
    console.error('Paper Trails failed to load its data:', error);
    showLoadError(error);
    return;
  }

  document.getElementById('timeline-loading').hidden = true;
  timelineContainer.setAttribute('aria-busy', 'false');
  dataYears = collectDataYears();
  searchEntries = buildSearchIndex({ scientists, discoveries, conferences, significantEvents });
  try {
    if (localStorage.getItem(SCALE_STORAGE_KEY) === 'density') {
      setScaleMode('density', dataYears);
      document.getElementById('densityToggle').setAttribute('aria-pressed', 'true');
    }
  } catch { /* Use even time when storage is unavailable. */ }
  render();
  setupMinimap();
  applyUrlState({ initial: true });
  setupControls();
  setupSearchField();
  updateTapestryAvailability();
  setupPointerInteractions();
  setupTooltips();
  setupResizeHandler();
  document.addEventListener('papertrails:detailsclosed', () => {
    clearTimelineSelection();
    currentItemKey = null;
    scheduleUrlUpdate();
  });
  window.addEventListener('popstate', () => applyUrlState());
  // Items opened from inside the panel are selected and brought into view.
  document.addEventListener('papertrails:itemopened', (event) => {
    if (!restoringUrl && event.detail.key !== currentItemKey && !event.detail.key.startsWith('group:')) {
      currentItemKey = event.detail.key;
      scheduleUrlUpdate({ push: true });
    }
    if (event.detail.fromTimeline) return;
    const element = selectItemByKey(event.detail.key);
    if (element) revealElement(element, { centre: true });
  });
  // Groups always zoom in further, never back out to the default detail level.
  document.addEventListener('papertrails:zoomcluster', (event) => {
    focusYear(event.detail.year, Math.max(2.5, currentScale * 2.5));
  });
  document.addEventListener('papertrails:locatescientist', (event) => {
    focusScientist(event.detail.scientistId, event.detail.year);
  });
  if (!interactionHint.classList.contains('is-hidden')) hideInteractionHint(6500);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
