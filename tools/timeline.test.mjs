import test from 'node:test';
import assert from 'node:assert/strict';
import { config } from '../src/config.js';
import { scaleToSlider, sliderToScale, xToYear, yearToX } from '../src/timeScale.js';
import { findFreeLevel, layoutEventRows, planEventLabel } from '../src/timelineRenderer.js';
import { getInitials, isPlaceholderImage } from '../src/portraits.js';
import { hasUnlinkedDiscoverers } from '../src/modalManager.js';

test('year and x positions convert in both directions', () => {
  for (const width of [320, 1325, 21200]) {
    assert.equal(yearToX(config.START_YEAR, width), 0);
    assert.equal(yearToX(config.END_YEAR, width), width);
    for (const year of [1453, 1687, 1905, 1965]) {
      assert.ok(Math.abs(xToYear(yearToX(year, width), width) - year) < 1e-9);
    }
  }
});

test('the zoom slider is logarithmic and round-trips', () => {
  assert.equal(sliderToScale(0), config.MIN_SCALE);
  assert.equal(sliderToScale(1000), config.MAX_SCALE);
  const midpoint = sliderToScale(500);
  assert.ok(Math.abs(midpoint - Math.sqrt(config.MIN_SCALE * config.MAX_SCALE)) < 1e-9);
  for (const scale of [1, 1.5, 2.5, 7, config.MAX_SCALE]) {
    assert.ok(Math.abs(sliderToScale(scaleToSlider(scale)) - scale) / scale < 0.01);
  }
});

test('event labels stay inside their band or become pins', () => {
  assert.deepEqual(planEventLabel(300, 120, 30), { mode: 'inside', useShort: false, extent: 0 });
  assert.deepEqual(planEventLabel(80, 120, 30), { mode: 'inside', useShort: true, extent: 0 });
  const pin = planEventLabel(6, 120, 30);
  assert.equal(pin.mode, 'pin');
  assert.ok(pin.extent > 30);
});

test('event rows never overlap and drop labels before adding rows', () => {
  const item = (startX, bandWidth, plan = planEventLabel(bandWidth, 90, 30)) => ({ startX, bandWidth, plan });
  const items = [item(0, 400), item(100, 5), item(120, 5), item(140, 5), item(150, 300)];
  const { placements, rows } = layoutEventRows(items, 2);
  assert.ok(rows >= 2);
  const byRow = new Map();
  placements.forEach((placement) => {
    const extent = [placement.startX, placement.startX + placement.bandWidth + placement.plan.extent + 4];
    const row = byRow.get(placement.level) || [];
    row.forEach(([start, end]) => assert.ok(extent[1] <= start || extent[0] >= end, 'bands overlap'));
    row.push(extent);
    byRow.set(placement.level, row);
  });
  assert.ok(placements.some((placement) => placement.plan.mode === 'none'));
  assert.equal(findFreeLevel([[{ start: 0, end: 10 }]], 10, 20), 0);
  assert.equal(findFreeLevel([[{ start: 0, end: 10 }]], 5, 20), -1);
});

test('placeholder portraits become initials', () => {
  assert.ok(isPlaceholderImage('images/default.png'));
  assert.ok(isPlaceholderImage('images/cartoons/default.png'));
  assert.ok(isPlaceholderImage(''));
  assert.ok(!isPlaceholderImage('images/hooke_robert.jpg'));
  assert.equal(getInitials('Robert Hooke'), 'RH');
  assert.equal(getInitials('Ewald Georg von Kleist'), 'EK');
  assert.equal(getInitials('William Thomson (Lord Kelvin)'), 'WT');
  assert.equal(getInitials('Ørsted'), 'Ø');
});

test('discoverer text is kept only when it names unlinked people', () => {
  assert.equal(hasUnlinkedDiscoverers('William Herschel', ['William Herschel']), false);
  assert.equal(hasUnlinkedDiscoverers('J. J. Thomson', ['J.J. Thomson']), false);
  assert.equal(hasUnlinkedDiscoverers('Lord Kelvin', ['William Thomson (Lord Kelvin)']), false);
  assert.equal(hasUnlinkedDiscoverers('Arno Penzias and Robert Wilson', ['Arno A. Penzias', 'Robert Woodrow Wilson']), false);
  assert.equal(hasUnlinkedDiscoverers('Penzias, Wilson and Dicke', ['Arno A. Penzias']), true);
  assert.equal(hasUnlinkedDiscoverers('Geiger, Marsden and others', ['Ernest Rutherford']), true);
});
