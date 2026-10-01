import test from 'node:test';
import assert from 'node:assert/strict';
import { config } from '../src/config.js';
import { layoutTapestry } from '../src/tapestryRenderer.js';


test('picture footprints use event durations and preserve overlapping chronology', () => {
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
      const pictureYears = Math.max(1, item.event.endYear - item.event.startYear);
      assert.ok(Math.abs(item.sceneWidth - pictureYears / config.YEAR_SPAN * width) < 0.00001);
    }
    assert.notEqual(items[0].lane, items[1].lane, 'overlapping duration threads get separate lanes');
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
  assert.ok(Math.abs(items[0].sceneWidth - 50 / config.YEAR_SPAN * 1000) < 1e-8);
});

test('compact braid lanes reflect overlapping dates and do not multiply at low zoom', () => {
  const events = [{ startYear: 1800, endYear: 1801 }, { startYear: 1802, endYear: 1802 }, { startYear: 1803, endYear: 1850 }];
  const overview = layoutTapestry(events, 390);
  const full = layoutTapestry(events, 390 * 32);
  assert.equal(overview.lanes, 1);
  assert.equal(full.lanes, 1);
  assert.deepEqual(overview.items.map(item => item.lane), full.items.map(item => item.lane));
});

test('Carrington remains a point with a one-year vignette beside a four-year Civil War', () => {
  const events = [{ title: 'Carrington Event', startYear: 1859, endYear: 1859 }, { title: 'American Civil War', startYear: 1861, endYear: 1865 }];
  for (const width of [390, 1286, 1286 * 32]) {
    const { items: [point, war] } = layoutTapestry(events, width);
    assert.equal(point.anchor, point.end, 'point braid has no invented duration');
    assert.ok(Math.abs(war.sceneWidth / point.sceneWidth - 4) < 1e-8);
    assert.ok(point.left + point.sceneWidth < war.left, 'the event picture does not extend to the next event');
    assert.equal(war.end - war.anchor, war.sceneWidth);
  }
});
