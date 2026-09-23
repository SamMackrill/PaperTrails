import { config } from './config.js?v=15';
import { yearToX } from './timeScale.js?v=2';

const BIN_WIDTH = 3;

// A thin overview of the whole range: a density sparkline of every dated
// item with century marks, and a window showing the part of the timeline in
// view. Drag the window to pan, drag its edges to zoom, or click to jump.
export function createMinimap({ element, getYears, onPan, onResize, onZoom }) {
  const canvas = element.querySelector('canvas');
  const windowElement = element.querySelector('.minimap-window');
  let windowLeft = 0;
  let windowWidth = 1;
  let drag = null;

  function draw() {
    const width = element.clientWidth;
    const height = element.clientHeight;
    if (!width || !height) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const context = canvas.getContext('2d');
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);

    const styles = getComputedStyle(element);
    const ink = styles.getPropertyValue('--minimap-ink').trim() || '#74573a';
    const rule = styles.getPropertyValue('--minimap-rule').trim() || '#c9bba2';
    const label = styles.getPropertyValue('--minimap-label').trim() || '#6b6050';

    const bins = new Array(Math.ceil(width / BIN_WIDTH)).fill(0);
    getYears().forEach((year) => {
      const bin = Math.floor(yearToX(year, width) / BIN_WIDTH);
      if (bin >= 0 && bin < bins.length) bins[bin] += 1;
    });
    const peak = Math.max(1, ...bins);
    const baseline = height - 3;
    context.fillStyle = ink;
    bins.forEach((count, index) => {
      if (!count) return;
      // Square-root scaling keeps quiet centuries visible beside busy ones.
      const barHeight = Math.max(2, Math.sqrt(count / peak) * (height - 14));
      context.fillRect(index * BIN_WIDTH, baseline - barHeight, BIN_WIDTH - 1, barHeight);
    });

    context.font = `11px Georgia, serif`;
    context.textBaseline = 'top';
    for (let year = Math.ceil(config.START_YEAR / 100) * 100; year <= config.END_YEAR; year += 100) {
      const x = Math.round(yearToX(year, width)) + 0.5;
      context.fillStyle = rule;
      context.fillRect(x, 0, 1, height);
      context.fillStyle = label;
      if (x + 30 < width) context.fillText(String(year), x + 3, 2);
    }
  }

  function setWindow(left, width) {
    windowLeft = Math.max(0, Math.min(1, left));
    windowWidth = Math.max(0, Math.min(1, width));
    windowElement.style.left = `${windowLeft * 100}%`;
    windowElement.style.width = `${windowWidth * 100}%`;
    element.classList.toggle('is-full', windowWidth > 0.995);
  }

  const fractionAt = (event) => {
    const rect = element.getBoundingClientRect();
    return Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  };

  element.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const fraction = fractionAt(event);
    const handle = event.target.closest('.minimap-handle');
    if (handle) {
      drag = { mode: handle.dataset.edge, left: windowLeft, right: windowLeft + windowWidth };
    } else if (event.target.closest('.minimap-window')) {
      drag = { mode: 'pan', offset: fraction - windowLeft };
    } else {
      // Jump so the clicked point is centred, then keep dragging from there.
      drag = { mode: 'pan', offset: windowWidth / 2 };
      onPan(fraction - windowWidth / 2);
    }
    element.setPointerCapture(event.pointerId);
    element.classList.add('is-dragging');
  });

  element.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const fraction = fractionAt(event);
    const minimumWidth = 1 / config.MAX_SCALE;
    if (drag.mode === 'pan') {
      onPan(fraction - drag.offset);
    } else if (drag.mode === 'left') {
      onResize(Math.min(fraction, drag.right - minimumWidth), drag.right);
    } else if (drag.mode === 'right') {
      onResize(drag.left, Math.max(fraction, drag.left + minimumWidth));
    }
  });

  const endDrag = () => {
    drag = null;
    element.classList.remove('is-dragging');
  };
  element.addEventListener('pointerup', endDrag);
  element.addEventListener('pointercancel', endDrag);

  element.addEventListener('wheel', (event) => {
    event.preventDefault();
    onZoom(Math.exp(-event.deltaY * 0.0015), fractionAt(event));
  }, { passive: false });

  return { draw, setWindow };
}
