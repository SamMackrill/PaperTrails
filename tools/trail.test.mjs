import test from 'node:test';
import assert from 'node:assert/strict';
import { getTrailState, getTrailStepContext, setTrailState, trailIncludes, layoutTrailLabels, trailRouteRailY } from '../src/trailState.js';
import { parseHash, formatHash } from '../src/urlState.js';

test('route identity, panel state and ordered step survive sharing and clearing', () => {
  const trail = { id: 'charge', stops: [{ id: 'first', item: 'publication:a' }, { id: 'last', item: 'discovery:b' }] };
  setTrailState(trail, 'last', true);
  const state = getTrailState();
  const restored = parseHash(formatHash(state));
  assert.equal(restored.trail, 'charge'); assert.equal(restored.stop, 'last'); assert.equal(restored.explain, true);
  assert.equal(trailIncludes('publication:other'), false);
  setTrailState(trail, 'bogus', false); assert.equal(getTrailState().stop, 'first');
  setTrailState(null); assert.deepEqual(getTrailState(), { trail: null, stop: null, explain: false });
  assert.equal(trailIncludes('publication:other'), true);
});
test('crowded trail labels never shift dated anchors or overlap in one row', () => {
  const points = [0, 5, 50, 195, 230, 480].map(x => ({ x }));
  const labels = layoutTrailLabels(points, 500);
  assert.deepEqual(labels.map(l => l.x), points.map(p => p.x));
  for (const label of labels) {
    assert.ok(label.left >= 0 && label.left + 144 <= 500);
    const preceding = labels.slice(0, labels.indexOf(label)).filter(l => l.row === label.row).at(-1);
    if (preceding) assert.ok(preceding.left + 144 + 8 <= label.left);
  }
});
test('route rail leaves room for the highest trail-label row', () => {
  const railY = trailRouteRailY(135, 2);
  assert.equal(railY, 192);
  assert.ok(railY - 64 - 2 * 64 >= 0);
});
test('trail step context reports visited, current, and upcoming stops with neighbors', () => {
  const trail = { id: 'charge', stops: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] };
  const mid = getTrailStepContext(trail, 'b');
  assert.equal(mid.index, 1);
  assert.equal(mid.total, 3);
  assert.equal(mid.prev.id, 'a');
  assert.equal(mid.current.id, 'b');
  assert.equal(mid.next.id, 'c');
  assert.deepEqual(mid.states, ['visited', 'current', 'upcoming']);
  const empty = getTrailStepContext(null, 'a');
  assert.equal(empty.index, -1);
  assert.deepEqual(empty.states, []);
});
