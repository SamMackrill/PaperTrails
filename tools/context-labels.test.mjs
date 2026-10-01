import test from 'node:test';
import assert from 'node:assert/strict';
import { layoutContextLabels } from '../src/contextLabels.js';

test('short events can borrow room for a complete name without moving their braid anchor', () => {
  const labels = [{ id: 'storm', start: 400, end: 400, width: 230 },
    { id: 'network', start: 360, end: 550, width: 290 },
    { id: 'industry', start: 200, end: 620, width: 410 }];
  const placed = layoutContextLabels(labels, 0, 900);
  assert.equal(placed.length, 3);
  assert.equal(placed.find(p => p.id === 'storm').width, 230);
  assert.equal(placed.find(p => p.id === 'storm').anchor, 400);
  for (const p of placed) {
    assert.ok(p.left >= 4 && p.left + p.width <= 896);
    for (const q of placed) if (p !== q && p.row === q.row)
      assert.ok(p.left + p.width + 8 <= q.left || q.left + q.width + 8 <= p.left);
  }
});

test('panned broad periods stay labelled; wrapped labels occupy all of their rows', () => {
  const placed = layoutContextLabels([
    { id: 'broad', start: 20, end: 2000, width: 420, lines: 2 },
    { id: 'short', start: 1080, end: 1080, width: 130 },
    { id: 'past', start: 30, end: 40, width: 70 }
  ], 1000, 1260);
  assert.equal(placed.length, 2);
  const broad = placed.find(p => p.id === 'broad'), short = placed.find(p => p.id === 'short');
  assert.equal(broad.width, 252);
  assert.equal(broad.anchor, 1004);
  assert.ok(short.row < broad.row || short.row >= broad.row + 2);
  assert.deepEqual(layoutContextLabels([], 4, 4), []);
});

test('labels that need more rows than the context can provide are hidden', () => {
  const placed = layoutContextLabels([
    { id: 'too-tall', start: 100, end: 120, width: 180, lines: 4 },
    { id: 'fits', start: 260, end: 280, width: 120, lines: 3 }
  ], 0, 600, 3);
  assert.deepEqual(placed.map(label => label.id), ['fits']);
});
