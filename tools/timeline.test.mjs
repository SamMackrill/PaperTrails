import test from 'node:test';
import assert from 'node:assert/strict';
import { config } from '../src/config.js';
import { buildDensityBreakpoints, scaleToSlider, setScaleMode, sliderToScale, xToYear, yearToX } from '../src/timeScale.js';
import { buildSearchIndex, foldText, searchIndex } from '../src/search.js';
import { formatHash, parseHash } from '../src/urlState.js';
import {
  binPublications,
  findFreeLevel,
  getTimelineLabel,
  layoutEventRows,
  layoutMilestoneRows,
  layoutPeople,
  planEventLabel,
  planLanes
} from '../src/timelineLayout.js';
import { getInitials, isPlaceholderImage } from '../src/portraits.js';
import { formatCitation, hasUnlinkedDiscoverers } from '../src/modalManager.js';
import { buildScientistRelations } from '../src/dataLoader.js';

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

test('canvas labels use surnames with particles or titles', () => {
  assert.equal(getTimelineLabel('Johannes Diderik van der Waals'), 'van der Waals');
  assert.equal(getTimelineLabel('Louis de Broglie'), 'de Broglie');
  assert.equal(getTimelineLabel('William Thomson (Lord Kelvin)'), 'Kelvin');
  assert.equal(getTimelineLabel('Johann Müller Regiomontanus'), 'Regiomontanus');
  assert.equal(getTimelineLabel('C. V. Raman'), 'Raman');
});

test('people join a nearby group instead of overlapping', () => {
  const person = (x) => ({ x, width: 40, scientist: { name: String(x) } });
  const entries = [0, 10, 20, 30, 40, 50, 300].map(person);
  const placed = layoutPeople(entries, { levelCount: 2, gap: 8, clusterWidth: (count) => 30 + (Math.min(3, count) - 1) * 18 + 10 });
  const members = placed.flatMap((item) => item.members);
  assert.equal(members.length, entries.length);
  const byLevel = new Map();
  placed.forEach((item) => {
    const row = byLevel.get(item.level) || [];
    row.forEach((other) => assert.ok(item.left > other.right || item.right < other.left, 'people overlap'));
    row.push(item);
    byLevel.set(item.level, row);
  });
  assert.ok(placed.some((item) => item.type === 'cluster'));
  const grouped = layoutPeople(entries, { levelCount: 4, groupDistance: 45, clusterWidth: () => 76 });
  assert.equal(grouped.find((item) => item.members.some((member) => member.x === 300)).members.length, 1);
});

test('publications stack into bins with a cap for the overflow', () => {
  const items = [1, 2, 3, 4, 5, 6, 7].map((n) => ({ x: 100 + n / 10, year: 1900 + n }));
  const { stacked, caps } = binPublications([...items, { x: 400, year: 1950 }], { binWidth: 11, maxStack: 5 });
  assert.equal(stacked.filter((item) => item.x < 200).length, 5);
  assert.deepEqual(stacked.filter((item) => item.x < 200).map((item) => item.stackIndex), [0, 1, 2, 3, 4]);
  assert.equal(caps.length, 1);
  assert.equal(caps[0].count, 2);
});

test('milestones use extra rows instead of overlapping', () => {
  const { placements, rows } = layoutMilestoneRows([0, 5, 10, 60].map((x) => ({ x })), 30);
  assert.equal(rows, 3);
  assert.equal(placements[3].level, 0);
});

test('lanes give context and milestones what they need within limits', () => {
  const lanes = planLanes({ height: 700, milestonesNeed: 150, contextNeed: 180 });
  assert.equal(lanes.contextTop - lanes.axisY, 150);
  assert.equal(700 - lanes.contextTop, 180);
  const capped = planLanes({ height: 700, milestonesNeed: 900, contextNeed: 900 });
  assert.ok(capped.axisY >= 700 * 0.29);
  const hidden = planLanes({ height: 700, milestonesNeed: 150, contextNeed: 0, contextVisible: false });
  assert.equal(hidden.contextTop, 700);
});

test('relations index discoveries, conferences, and events by scientist', () => {
  const people = { ada: {}, bo: {} };
  const relations = buildScientistRelations(
    people,
    [{ scientist_ids: ['ada'], theorist_ids: ['ada', 'bo', 'ghost'] }],
    [{ attendee_ids: ['bo'], theorist_ids: ['ada'] }],
    [{ attendee_ids: ['ada'] }]
  );
  assert.deepEqual(relations.get('ada'), {
    discoveries: [{ index: 0, role: 'Discoverer' }],
    conferences: [{ index: 0, role: 'Theorist' }],
    events: [{ index: 0, role: 'Participant' }]
  });
  assert.deepEqual(relations.get('bo').discoveries, [{ index: 0, role: 'Theorist' }]);
  assert.equal(relations.has('ghost'), false);
});

test('citations include the DOI when there is one', () => {
  assert.equal(formatCitation('Emmy Noether', 1918, 'Invariante Variationsprobleme'), 'Emmy Noether (1918). Invariante Variationsprobleme.');
  assert.equal(formatCitation('A', 1900, 'T', '10.1000/x'), 'A (1900). T. https://doi.org/10.1000/x');
});

test('only well-formed HTTPS source links are used', async () => {
  const { parseHttpsUrl } = await import('../src/modalManager.js');
  assert.equal(parseHttpsUrl('https://doi.org/10.1000/x').hostname, 'doi.org');
  assert.equal(parseHttpsUrl('http://example.org'), null);
  assert.equal(parseHttpsUrl('javascript:alert(1)'), null);
  assert.equal(parseHttpsUrl('not a url'), null);
  assert.equal(parseHttpsUrl(undefined), null);
});

test('search folds diacritics and letters that do not decompose', () => {
  assert.equal(foldText('Ørsted'), 'orsted');
  assert.equal(foldText('Rømer'), 'romer');
  assert.equal(foldText('Schrödinger'), 'schrodinger');
  assert.equal(foldText('Ampère'), 'ampere');
  const index = buildSearchIndex({
    scientists: {
      oersted: { name: 'Hans Christian Ørsted', publications: [{ year: 1820, title: 'Experimenta circa effectum' }] },
      roemer: { name: 'Ole Rømer', notability: 2, publications: [] },
      newton: { name: 'Isaac Newton', notability: 1, publications: [{ year: 1687, title: 'Principia' }] }
    },
    discoveries: [{ year: 1676, title: 'Finite speed of light', discoverer: 'Ole Rømer' }],
    conferences: [],
    significantEvents: [{ startYear: 1618, endYear: 1648, title: "Thirty Years' War" }]
  });
  assert.equal(searchIndex(index, 'orsted')[0].results[0].key, 'scientist:oersted');
  const romer = searchIndex(index, 'Romer');
  assert.deepEqual(romer.map((group) => group.type), ['scientist', 'discovery']);
  assert.equal(searchIndex(index, 'principia')[0].results[0].key, 'publication:newton:0');
  assert.deepEqual(searchIndex(index, '   '), []);
});

test('view state round-trips through the URL hash', () => {
  const state = { from: 1850, to: 1950, item: 'scientist:maxwell', hidden: ['publications'], density: true, tapestry: true };
  const hash = formatHash(state);
  assert.equal(hash, '#from=1850&to=1950&item=scientist:maxwell&hide=publications&scale=density&tapestry=1');
  assert.deepEqual(parseHash(hash), state);
  assert.deepEqual(parseHash('#item=javascript:alert(1)&hide=nonsense'), { from: null, to: null, item: null, hidden: [], density: false, tapestry: null });
  assert.equal(formatHash({}), '');
});

test('the density scale is monotonic, invertible, and gives busy eras more room', () => {
  const years = [...Array(200)].map((_, i) => 1900 + (i % 50)).concat([1450, 1550]);
  const breakpoints = buildDensityBreakpoints(years);
  for (let i = 1; i < breakpoints.length; i += 1) assert.ok(breakpoints[i][1] > breakpoints[i - 1][1]);
  setScaleMode('density', years);
  try {
    let previous = -1;
    for (let year = config.START_YEAR; year <= config.END_YEAR; year += 7) {
      const x = yearToX(year, 1000);
      assert.ok(x > previous);
      previous = x;
      assert.ok(Math.abs(xToYear(x, 1000) - year) < 1e-6);
    }
    const busy = yearToX(1950, 1000) - yearToX(1900, 1000);
    const quiet = yearToX(1500, 1000) - yearToX(1450, 1000);
    assert.ok(busy > quiet * 3);
  } finally {
    setScaleMode('linear');
  }
});
