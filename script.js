import { config } from './src/config.js?v=15';
import { initializeData } from './src/dataLoader.js?v=17';
import { initializeTheme } from './src/themeManager.js?v=18';
import { setupModalEventListeners } from './src/modalManager.js?v=23';
import { clearTimelineSelection, renderTimeline, selectItemByKey, updateEventLabelPositions } from './src/timelineRenderer.js?v=23';
import { scaleToSlider, sliderToScale, xToYear, yearToX } from './src/timeScale.js?v=1';
import { updatePortraitStyle } from './src/portraits.js?v=1';

const HINT_STORAGE_KEY = 'paperTrailsHintSeen';

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

function zoomAt(nextScale, originX = timelineContainer.clientWidth / 2, { deferred = false } = {}) {
  const newScale = clampScale(nextScale);
  if (Math.abs(newScale - currentScale) < 0.001) return;

  const ratio = newScale / currentScale;
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
  currentScale = 1;
  currentTranslateX = 0;
  render();
  hideInteractionHint();
}

function focusYear(year, scale = 2.5) {
  currentScale = clampScale(scale);
  render();
  currentTranslateX = timelineContainer.clientWidth / 2 - yearToX(year, timeline.offsetWidth);
  updateTransform();
  hideInteractionHint();
}

function focusScientist(scientistId, year) {
  if (!scientistId || !Number.isFinite(year)) return;

  const peopleToggle = document.getElementById('peopleToggle');
  if (peopleToggle?.getAttribute('aria-pressed') === 'false') {
    peopleToggle.setAttribute('aria-pressed', 'true');
  }

  // People can share a group in crowded decades, so zoom in until they
  // separate. At maximum zoom, the group containing them is focused.
  let scale = Math.max(2.5, currentScale);
  focusYear(year, scale);
  const findGroup = () => timeline.querySelector(`.scientist-cluster[data-member-ids~="${CSS.escape(scientistId)}"]`);
  while (!timeline.querySelector(`[data-item-key="${CSS.escape(`scientist:${scientistId}`)}"]`) && findGroup() && scale < config.MAX_SCALE) {
    scale = Math.min(config.MAX_SCALE, scale * 2);
    focusYear(year, scale);
  }
  const node = selectItemByKey(`scientist:${scientistId}`) || findGroup();
  node?.focus({ preventScroll: true });
}

// Pans just enough to bring a keyboard-focused item into view.
function revealElement(element) {
  const containerRect = timelineContainer.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  const padding = Math.min(64, containerRect.width / 6);
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
      zoomAt(currentScale * 1.2);
    } else if (event.key === '-') {
      event.preventDefault();
      zoomAt(currentScale / 1.2);
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
  const targetRect = target.getBoundingClientRect();
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
    revealElement(event.target);
    positionTooltip(event.target.closest('[data-tooltip]'));
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
  document.getElementById('zoom-out').addEventListener('click', () => zoomAt(currentScale / 1.25));
  document.getElementById('zoom-in').addEventListener('click', () => zoomAt(currentScale * 1.25));
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

  setupOptionsPopover();
  setupHelpDialog();
}

function setupResizeHandler() {
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const oldWidth = timeline.offsetWidth || 1;
      const centreRatio = (timelineContainer.clientWidth / 2 - currentTranslateX) / oldWidth;
      render();
      currentTranslateX = timelineContainer.clientWidth / 2 - centreRatio * timeline.offsetWidth;
      updateTransform();
    }, config.RESIZE_DEBOUNCE_DELAY);
  });
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
    document.getElementById('tapestryToggle').setAttribute('aria-pressed', String(localStorage.getItem('paperTrailsTapestry') === 'true'));
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
  render();
  setupControls();
  updateTapestryAvailability();
  setupPointerInteractions();
  setupTooltips();
  setupResizeHandler();
  document.addEventListener('papertrails:detailsclosed', clearTimelineSelection);
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
