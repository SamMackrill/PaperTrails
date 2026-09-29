import test from 'node:test';
import assert from 'node:assert/strict';
import { getTrailState, setTrailState, trailIncludes, layoutTrailLabels } from '../src/trailState.js';
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
