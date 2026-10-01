import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { composePictures, continuePictures, quietPictures, quietLandscape, quietAtlases } from '../src/clothComposition.js';
import { layoutTapestry } from '../src/tapestryRenderer.js';
import { yearToX, setScaleMode } from '../src/timeScale.js?v=3';
import { clothCells, layoutPleats } from '../src/clothPleats.js';
const yaml = createRequire(import.meta.url)('../vendor/js-yaml.min.js');
const events = yaml.load(readFileSync(new URL('../data/significantevents.yaml', import.meta.url), 'utf8'));

test('a newer long chapter leaves room for older context after its actual picture ends', () => {
  const width = 61440;
  const winter = events.find(e => e.id === 'event-04');
  const war = events.find(e => e.id === 'event-05');
  const { items } = layoutTapestry([winter, war], width);
  const original = composePictures(items, 128, width);
  const warPicture = original.find(p => p.event === war);
  assert.ok(warPicture.right < yearToX(1648, width));
  const continued = continuePictures(original, items, 128);
  assert.ok(continued.some(p => p.event === winter && p.anchor >= warPicture.right
    && p.anchor < yearToX(1648, width)), 'the unpainted end of the war no longer hides all winter context');
  assert.deepEqual(continued.find(p => p.event === war), warPicture);
});

for (const width of [36032, 40960, 61440]) test(`uncovered material at width ${width} gets unique landscape pixels at their native proportions`, () => {
  const height = 117;
  const { items } = layoutTapestry(events, width);
  const pictures = continuePictures(composePictures(items, height, width), items, height);
  const quiet = quietPictures(width, height, pictures, items);
  assert.ok(quiet.length > 6);
  for (const [i, piece] of quiet.entries()) {
    assert.ok(piece.sourceWidth > 0 && piece.x + piece.sourceWidth <= piece.atlas.width + 1e-8);
    assert.ok(Math.abs(piece.width / piece.sourceWidth - height / piece.height) < 1e-10);
    assert.ok(pictures.every(p => p.right <= piece.left + 1e-8 || p.anchor >= piece.left + piece.width - 1e-8));
    for (const earlier of quiet.slice(0, i)) if (piece.atlas === earlier.atlas && piece.y === earlier.y) {
      assert.ok(earlier.x + earlier.sourceWidth <= piece.x + 1e-8, 'source pixels are never tiled or repeated');
    }
    if (piece.atlas.winter) {
      assert.ok(piece.left >= yearToX(1600, width) - 1e-8);
      assert.ok(piece.left + piece.width <= yearToX(1850, width) + 1e-8);
    }
  }
  const coverage = [...pictures.map(p => [p.anchor, p.right]), ...quiet.map(p => [p.left, p.left + p.width])]
    .sort((a, b) => a[0] - b[0]);
  let right = 0;
  for (const [left, end] of coverage) {
    assert.ok(left <= right + 1e-8, `unillustrated material starts at ${right}`);
    right = Math.max(right, end);
  }
  assert.equal(right, width);
});

test('landscape atlas metadata matches original files and excludes gutter rows', () => {
  for (const atlas of quietAtlases) {
    const bytes = readFileSync(new URL(`../${atlas.file}`, import.meta.url));
    assert.equal(bytes.readUInt32BE(16), atlas.width);
    assert.equal(bytes.readUInt32BE(20), atlas.height);
    let previous = -1;
    for (const [top, bottom] of atlas.bounds) {
      assert.ok(top > previous && bottom > top && bottom <= atlas.height);
      previous = bottom;
    }
  }
});

test('quiet source crops and retained folds reverse identically on the density scale', () => {
  try {
    setScaleMode('density', [1400, 1517, 1600, 1642, 1651, 1693, 1760, 1830, 1850, 1914, 1991]);
    const width = 40960, height = 128;
    const { items } = layoutTapestry(events, width);
    const pictures = continuePictures(composePictures(items, height, width), items, height);
    const before = quietPictures(width, height, pictures, items);
    const cells = clothCells(width, [...items, ...pictures]);
    const start = layoutPleats(width, width / 8, cells);
    layoutPleats(width, width / 2, cells);
    assert.deepEqual(layoutPleats(width, width / 8, cells), start);
    assert.deepEqual(quietPictures(width, height, pictures, items), before);
    assert.ok(layoutPleats(width, width, cells).faces.every(face => face.shade === 0));
    assert.ok(quietLandscape(width, height, items).filter(p => p.fill !== 'none').length >= 5,
      'detailed filled cloth remains if images fail or the viewport exceeds the bitmap budget');
  } finally { setScaleMode('linear'); }
});
