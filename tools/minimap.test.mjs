import test from 'node:test';
import assert from 'node:assert/strict';
import { createMinimap } from '../src/minimap.js';

function harness() {
  const listeners = new Map(), classes = new Set(), pans = [], resizes = [], zooms = [];
  const windowElement = { style: {} };
  const element = {
    clientWidth: 1286,
    querySelector: selector => selector === 'canvas' ? {} : windowElement,
    classList: {
      toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name),
      contains: name => classes.has(name),
      add: name => classes.add(name), remove: name => classes.delete(name)
    },
    addEventListener: (name, handler) => listeners.set(name, handler),
    getBoundingClientRect: () => ({ left: 0, width: 1286 }),
    setPointerCapture: () => {}
  };
  const minimap = createMinimap({ element, getYears: () => [], onPan: value => pans.push(value),
    onResize: (...values) => resizes.push(values), onZoom: (...values) => zooms.push(values) });
  const fire = (name, values) => listeners.get(name)({ preventDefault() {}, button: 0, pointerId: 1,
    deltaMode: 0, deltaX: 0, deltaY: 0, clientX: 0, ...values });
  const handle = { dataset: { edge: 'right' } };
  const target = { closest: selector => selector === '.minimap-handle' ? handle : windowElement };
  return { minimap, element, classes, pans, resizes, zooms, fire, target };
}

test('an overlapping minimap handle pans a narrow window without changing zoom', () => {
  const h = harness();
  h.minimap.setWindow(0.4, 1 / 512);
  assert.ok(h.classes.has('is-narrow'));
  h.fire('pointerdown', { target: h.target, clientX: 1286 * 0.401 });
  h.fire('pointermove', { clientX: 1286 * 0.6 });
  assert.ok(Math.abs(h.pans.at(-1) - 0.599) < 1e-10);
  assert.equal(h.resizes.length, 0);
  assert.equal(h.zooms.length, 0);
});

test('wide minimap handles continue to resize the dated window', () => {
  const h = harness();
  h.minimap.setWindow(0.4, 0.2);
  assert.ok(!h.classes.has('is-narrow'));
  h.fire('pointerdown', { target: h.target, clientX: 1286 * 0.6 });
  h.fire('pointermove', { clientX: 1286 * 0.7 });
  assert.deepEqual(h.resizes, [[0.4, 0.7]]);
  assert.equal(h.pans.length, 0);
});

test('horizontal overview scrolling pans while vertical and modified gestures still zoom', () => {
  const h = harness();
  h.minimap.setWindow(0.4, 1 / 16);
  h.fire('wheel', { deltaX: 600 });
  assert.ok(Math.abs(h.pans[0] - (0.4 + 600 / 1286 / 16)) < 1e-10);
  assert.equal(h.zooms.length, 0);
  h.fire('wheel', { deltaY: 100 });
  assert.equal(h.zooms.length, 1);
  assert.equal(h.zooms[0][0], Math.exp(-0.15));
  h.fire('wheel', { deltaX: 50, deltaY: -100, ctrlKey: true });
  assert.equal(h.zooms[1][0], Math.exp(0.15));
  assert.equal(h.pans.length, 1);
});
