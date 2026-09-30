import test from 'node:test';
import assert from 'node:assert/strict';
import { projectZoomBox, zoomProgress } from '../src/zoomLayout.js';

test('zoom keeps marker centres on their dates without stretching labels', () => {
  for (const ratio of [0.2, 0.9, 1, 1.4, 4]) {
    const pose = projectZoomBox({ left: 80, width: 40, anchor: 20, stretch: false }, ratio);
    assert.equal(pose.left + 20, 100 * ratio);
    assert.equal(pose.width, 40);
  }
});

test('zoom never reverses on an early frame and approaches each endpoint gently', () => {
  assert.equal(zoomProgress(-10, 420), 0);
  assert.equal(zoomProgress(500, 420), 1);
  assert.equal(zoomProgress(210, 420), 0.5);
  assert.ok(zoomProgress(20, 420) < 0.01);
  assert.ok(1 - zoomProgress(400, 420) < 0.01);
  const forward = Array.from({length: 43}, (_, i) => zoomProgress(i * 10, 420));
  assert.ok(forward.every((value, i) => !i || value >= forward[i - 1]));
});

test('zoom preserves the start and end of duration bands, including reversed motion', () => {
  const box = { left: 100, width: 200, anchor: 0, stretch: true };
  for (const ratio of [0.5, 1, 2, 1, 0.5]) {
    const pose = projectZoomBox(box, ratio);
    assert.equal(pose.left, 100 * ratio);
    assert.equal(pose.left + pose.width, 300 * ratio);
  }
});
