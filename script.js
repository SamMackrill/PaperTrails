import { config } from './src/config.js?v=14';
import { initializeData } from './src/dataLoader.js?v=16';
import { initializeTheme } from './src/themeManager.js?v=14';
import { setupModalEventListeners } from './src/modalManager.js?v=16';
import { clearTimelineSelection, renderTimeline, updateEventLabelPositions } from './src/timelineRenderer.js?v=16';

let timelineContainer;
let timeline;
let zoomLevelDisplay;
let zoomSlider;
let interactionHint;

let currentScale = 1;
let currentTranslateX = 0;
let resizeTimer;
let hintTimer;

let potentialDrag = false;
let isDragging = false;
let dragStartX = 0;
let dragStartTranslateX = 0;

let isPinching = false;
let initialPinchDistance = 0;
let pinchStartScale = 1;
let pinchStartTranslateX = 0;
let pinchOriginX = 0;

function mapSliderToScale(value) {
  return config.MIN_SCALE + (config.MAX_SCALE - config.MIN_SCALE) * (Number(value) / 100);
}

function mapScaleToSlider(scale) {
  return Math.round(((scale - config.MIN_SCALE) / (config.MAX_SCALE - config.MIN_SCALE)) * 100);
}

function clampScale(scale) {
  return Math.max(config.MIN_SCALE, Math.min(config.MAX_SCALE, scale));
}

function clampTranslation() {
  const minimumX = Math.min(0, timelineContainer.clientWidth - timeline.offsetWidth);
  currentTranslateX = Math.max(minimumX, Math.min(0, currentTranslateX));
}

function updateTransform() {
  if (!timeline || !timelineContainer) return;
  clampTranslation();
  timeline.style.transform = `translateX(${currentTranslateX}px)`;
  updateEventLabelPositions(timeline, timelineContainer);
  zoomLevelDisplay.textContent = `${Math.round(currentScale * 100)}%`;
  zoomSlider.value = String(mapScaleToSlider(currentScale));
}

function updateScientistImages(useIllustrations) {
  document.querySelectorAll('.scientist-photo').forEach((image) => {
    const desiredSource = useIllustrations && image.dataset.cartoonPhoto
      ? image.dataset.cartoonPhoto
      : image.dataset.originalPhoto;

    if (desiredSource && image.getAttribute('src') !== desiredSource) {
      delete image.dataset.error;
      image.src = desiredSource;
    }
  });
}

function render() {
  renderTimeline(timelineContainer, timeline, currentScale);
  const useIllustrations = document.getElementById('cartoonToggle')?.getAttribute('aria-pressed') === 'true';
  updateScientistImages(useIllustrations);
  updateTransform();
}

function hideInteractionHint(delay = 0) {
  clearTimeout(hintTimer);
  hintTimer = window.setTimeout(() => interactionHint?.classList.add('is-hidden'), delay);
}

function showInteractionHint() {
  clearTimeout(hintTimer);
  interactionHint?.classList.remove('is-hidden');
  hideInteractionHint(5000);
}

function zoomAt(nextScale, originX = timelineContainer.clientWidth / 2) {
  const newScale = clampScale(nextScale);
  if (Math.abs(newScale - currentScale) < 0.001) return;

  const ratio = newScale / currentScale;
  currentTranslateX = originX - (originX - currentTranslateX) * ratio;
  currentScale = newScale;
  render();
  hideInteractionHint();
}

function fitTimeline() {
  currentScale = 1;
  currentTranslateX = 0;
  render();
  hideInteractionHint();
}

function centreTimeline() {
  currentTranslateX = (timelineContainer.clientWidth - timeline.offsetWidth) / 2;
  updateTransform();
  hideInteractionHint();
}

function focusYear(year, scale = 2.5) {
  currentScale = clampScale(scale);
  render();
  const targetX = ((year - config.START_YEAR) / config.YEAR_SPAN) * timeline.offsetWidth;
  currentTranslateX = timelineContainer.clientWidth / 2 - targetX;
  updateTransform();
  hideInteractionHint();
}

function focusScientist(scientistId, year) {
  if (!scientistId || !Number.isFinite(year)) return;

  const peopleToggle = document.getElementById('peopleToggle');
  if (peopleToggle?.getAttribute('aria-pressed') === 'false') {
    peopleToggle.setAttribute('aria-pressed', 'true');
  }

  focusYear(year);
  const node = timeline.querySelector(`.scientist-node[data-scientist-id="${CSS.escape(scientistId)}"]`);
  if (!node) return;

  clearTimelineSelection();
  node.classList.add('is-selected');
  node.focus({ preventScroll: true });
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

function setupPointerInteractions() {
  timelineContainer.addEventListener('wheel', (event) => {
    event.preventDefault();
    const rect = timelineContainer.getBoundingClientRect();

    if (event.ctrlKey || event.metaKey) {
      const factor = event.deltaY < 0 ? 1 + config.ZOOM_STEP : 1 - config.ZOOM_STEP;
      zoomAt(currentScale * factor, event.clientX - rect.left);
    } else {
      currentTranslateX -= event.deltaX || event.deltaY;
      updateTransform();
      hideInteractionHint();
    }
  }, { passive: false });

  timelineContainer.addEventListener('mousedown', (event) => {
    if (event.button !== 0 || event.target.closest('button')) return;
    potentialDrag = true;
    dragStartX = event.clientX;
    dragStartTranslateX = currentTranslateX;
  });

  document.addEventListener('mousemove', (event) => {
    if (!potentialDrag) return;
    const deltaX = event.clientX - dragStartX;
    if (!isDragging && Math.abs(deltaX) < config.DRAG_THRESHOLD) return;

    isDragging = true;
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
    if (event.target.closest('button')) return;

    if (event.touches.length === 1) {
      potentialDrag = true;
      dragStartX = event.touches[0].clientX;
      dragStartTranslateX = currentTranslateX;
    } else if (event.touches.length === 2) {
      event.preventDefault();
      potentialDrag = false;
      isPinching = true;
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
      render();
      hideInteractionHint();
      return;
    }

    if (potentialDrag && event.touches.length === 1) {
      const deltaX = event.touches[0].clientX - dragStartX;
      if (!isDragging && Math.abs(deltaX) < config.DRAG_THRESHOLD) return;
      event.preventDefault();
      isDragging = true;
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
  timeline.addEventListener('focusin', (event) => positionTooltip(event.target.closest('[data-tooltip]')));
  timeline.addEventListener('focusout', hideTooltip);
}

function setupControls() {
  document.getElementById('zoom-out').addEventListener('click', () => zoomAt(currentScale / 1.25));
  document.getElementById('zoom-in').addEventListener('click', () => zoomAt(currentScale * 1.25));
  document.getElementById('fit-view').addEventListener('click', fitTimeline);
  document.getElementById('reset-view').addEventListener('click', centreTimeline);
  document.getElementById('help-toggle').addEventListener('click', showInteractionHint);

  zoomSlider.addEventListener('input', () => zoomAt(mapSliderToScale(zoomSlider.value)));

  ['peopleToggle', 'publicationsToggle', 'discoveriesToggle', 'conferencesToggle', 'significantEventsToggle'].forEach((id) => {
    document.getElementById(id).addEventListener('click', (event) => {
      togglePressed(event.currentTarget);
      render();
    });
  });

  document.getElementById('cartoonToggle').addEventListener('click', (event) => {
    const useIllustrations = togglePressed(event.currentTarget);
    updateScientistImages(useIllustrations);
  });

  const toolbar = document.querySelector('.timeline-toolbar');
  const optionsToggle = document.getElementById('options-toggle');
  optionsToggle.addEventListener('click', () => {
    const isOpen = toolbar.classList.toggle('is-open');
    optionsToggle.setAttribute('aria-expanded', String(isOpen));
    optionsToggle.setAttribute('aria-label', isOpen ? 'Hide view options' : 'Show view options');
    window.setTimeout(render, 0);
  });
}

function setupResizeHandler() {
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const oldWidth = timeline.offsetWidth || 1;
      const centreRatio = (timelineContainer.clientWidth / 2 - currentTranslateX) / oldWidth;
      renderTimeline(timelineContainer, timeline, currentScale);
      updateScientistImages(document.getElementById('cartoonToggle').getAttribute('aria-pressed') === 'true');
      currentTranslateX = timelineContainer.clientWidth / 2 - centreRatio * timeline.offsetWidth;
      updateTransform();
    }, config.RESIZE_DEBOUNCE_DELAY);
  });
}

async function initializeApp() {
  timelineContainer = document.getElementById('timeline-container');
  timeline = document.getElementById('timeline');
  zoomLevelDisplay = document.querySelector('.zoom-level');
  zoomSlider = document.getElementById('zoom-slider');
  interactionHint = document.getElementById('interaction-hint');

  document.getElementById('timeline-range').textContent = `${config.START_YEAR}–${config.END_YEAR}`;
  initializeTheme();
  setupModalEventListeners();

  try {
    await initializeData();
    render();
    setupControls();
    setupPointerInteractions();
    setupTooltips();
    setupResizeHandler();
    document.addEventListener('papertrails:detailsclosed', clearTimelineSelection);
    document.addEventListener('papertrails:zoomcluster', (event) => focusYear(event.detail.year));
    document.addEventListener('papertrails:locatescientist', (event) => {
      focusScientist(event.detail.scientistId, event.detail.year);
    });
    hideInteractionHint(6500);
  } catch (error) {
    console.error('Paper Trails failed to initialize:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
