import test from 'node:test';
import assert from 'node:assert/strict';
import { config } from '../src/config.js';
import { layoutTapestry } from '../src/tapestryRenderer.js';
import { tapestryScenes, getPanoramaCrop } from '../src/tapestryScenes.js';

test('pictures remain contiguous while exact dates and overlapping durations are preserved', () => {
  const events = [
    { title: 'Later', startYear: 1600, endYear: 1850 },
    { title: 'Period', startYear: 1400, endYear: 1600 },
    { title: 'Point', startYear: 1453, endYear: 1453 },
    { title: 'Overlap', startYear: 1517, endYear: 1648 }
  ];
  for (const width of [320, 1144, 9152, 19200]) {
    const { items } = layoutTapestry(events, width);
    assert.deepEqual(items.map(item => item.event.title), ['Period', 'Point', 'Overlap', 'Later']);
    for (const [index, item] of items.entries()) {
      assert.equal(item.anchor, (item.event.startYear - config.START_YEAR) / config.YEAR_SPAN * width);
      assert.equal(item.end, (item.event.endYear - config.START_YEAR) / config.YEAR_SPAN * width);
      const nextLeft = items[index + 1]?.left ?? width;
      assert.ok(Math.abs(item.left + item.sceneWidth - nextLeft) < 0.00001);
    }
    assert.notEqual(items[0].lane, items[1].lane, 'overlapping duration threads get separate lanes');
  }
});

test('zoom reveals different narrative facets instead of only enlarging the summary', () => {
  assert.equal(tapestryScenes.size, 21);
  for (const scene of tapestryScenes.values()) {
    const overview = getPanoramaCrop(scene, 110, 110, 1);
    const expanded = getPanoramaCrop(scene, 900, 125, 4);
    const full = getPanoramaCrop(scene, 4000, 130, 8);
    assert.equal(overview.facets.length, 1);
    assert.ok(expanded.facets.length > overview.facets.length);
    assert.equal(full.facets.length, 5);
    assert.equal(new Set(full.facets).size, 5);
    assert.ok(expanded.width > overview.width);
    assert.equal(expanded.height, overview.height, 'source figures keep their vertical scale');
    assert.ok(full.y >= 0 && full.y + full.height <= full.atlas.height);
    assert.equal(full.edges.at(-1), full.atlas.width);
    assert.ok(full.edges.every((edge, index) => index === 0 || edge > full.edges[index - 1]));
  }
});

test('invalid and out-of-range events cannot corrupt the layout', () => {
  const { items } = layoutTapestry([
    { startYear: NaN, endYear: 1600 },
    { startYear: 1600, endYear: 1500 },
    { startYear: 1000, endYear: 1200 },
    { startYear: config.END_YEAR + 1, endYear: config.END_YEAR + 2 },
    { startYear: 1300, endYear: 1450 }
  ], 1000);
  assert.equal(items.length, 1);
  assert.equal(items[0].left, 0);
  assert.equal(items[0].anchor, 0);
  assert.equal(items[0].sceneWidth, 1000);
});
