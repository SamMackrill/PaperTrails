import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { composePictures, contextWindows, continuePictures } from '../src/clothComposition.js';
import { layoutTapestry } from '../src/tapestryRenderer.js';
import { setScaleMode, yearToX } from '../src/timeScale.js?v=3';
import { clothCells, layoutPleats } from '../src/clothPleats.js';
import { tapestryScenes } from '../src/tapestryScenes.js?v=pass2-continuations-era-fallback';
const yaml = createRequire(import.meta.url)('../vendor/js-yaml.min.js');
const events = yaml.load(readFileSync(new URL('../data/significantevents.yaml', import.meta.url), 'utf8'));
const width = 40960, artHeight = 128;

test('Little Ice Age reappears after the civil war until the famine, inside its original dates', () => {
  const { items } = layoutTapestry(events, width);
  const pictures = composePictures(items, artHeight, width);
  const winter = pictures.find(p => p.event.id === 'event-04');
  const windows = contextWindows(winter, items);
  assert.ok(windows.some(w => w.left === yearToX(1651, width) && w.right === yearToX(1693, width)));
  const segments = continuePictures(pictures, items, artHeight).filter(p => p.event.id === 'event-04');
  assert.ok(segments.some(p => p.continuation && p.anchor === yearToX(1651, width)));
  for (const p of segments) {
    assert.ok(p.anchor >= yearToX(1600, width) && p.right <= yearToX(1850, width));
    assert.ok(windows.some(w => p.anchor >= w.left && p.right <= w.right));
  }
});

test('continuations use disjoint source regions at uniform scale while shorter pictures stay unchanged', () => {
  const { items } = layoutTapestry(events, width);
  const pictures = composePictures(items, artHeight, width);
  const continued = continuePictures(pictures, items, artHeight);
  const winter = continued.filter(p => p.event.id === 'event-04');
  assert.ok(winter.length > 1);
  for (let i = 0; i < winter.length; i++) {
    const p = winter[i];
    assert.ok(Math.abs(p.nativeWidth / p.strip.width - artHeight / p.strip.height) < 1e-12);
    assert.ok(p.sceneWidth > 0 && p.sceneWidth <= p.nativeWidth);
    for (const earlier of winter.slice(0, i)) if (earlier.strip.y === p.strip.y && earlier.strip.atlas.file === p.strip.atlas.file) {
      assert.ok(earlier.strip.x + earlier.strip.width <= p.strip.x);
    }
  }
  for (const id of ['event-05', 'event-06', 'event-07', 'event-18']) {
    const original = pictures.find(p => p.event.id === id);
    assert.deepEqual(continued.filter(p => p.event.id === id), [original]);
  }
});

test('Victorian gaps use only the nineteenth-century winter source and stop by 1850', () => {
  const winter = events.find(e => e.id === 'event-04');
  const { items } = layoutTapestry([winter], width);
  const pictures = continuePictures(composePictures(items, artHeight, width), items, artHeight);
  const victorian = pictures.filter(p => p.anchor >= yearToX(1830, width));
  assert.equal(victorian.length, 1);
  assert.match(victorian[0].key, /winter-era-1830/);
  assert.equal(victorian[0].artStartYear, 1830);
  assert.equal(victorian[0].artEndYear, 1850);
  assert.ok(victorian[0].right <= yearToX(1850, width));
  for (const p of pictures) {
    assert.ok(p.anchor >= yearToX(p.artStartYear, width));
    assert.ok(p.right <= yearToX(p.artEndYear, width));
  }
  const failed = items.map(entry => ({ ...entry, original: true }));
  const fallback = continuePictures(composePictures(failed, artHeight, width), failed, artHeight);
  assert.ok(fallback.every(p => p.strip.atlas.file === 'images/tapestry/landscape-b-quiet-chapters.png'),
    'missing era artwork uses neutral scenery, never another era or unrelated event');
});

test('an unapproved scene is never relocated into later gaps', () => {
  const scene = tapestryScenes.get('Protestant Reformation');
  const range = scene.continuationRange;
  try {
    delete scene.continuationRange;
    const { items } = layoutTapestry(events, width);
    const pictures = composePictures(items, artHeight, width);
    const original = pictures.find(p => p.event.id === 'event-03');
    assert.deepEqual(continuePictures([original], items, artHeight), [original]);
  } finally { scene.continuationRange = range; }
});

test('nested foreground footprints and point vignettes leave exact uncovered windows', () => {
  const picture = { anchor: 0, end: 100, event: { startYear: 1500 } };
  const entry = (anchor, end, startYear, endYear = startYear + 1, sceneWidth = end - anchor) =>
    ({ anchor, end, sceneWidth, event: { startYear, endYear } });
  const windows = contextWindows(picture, [entry(10, 50, 1600), entry(20, 30, 1610),
    entry(80, 80, 1700, 1700, 2), entry(0, 100, 1400)]);
  assert.deepEqual(windows, [{ left: 0, right: 10 }, { left: 50, right: 80 }, { left: 82, right: 100 }]);
});

test('density anchors and fixed continuation crops survive fold reversal and fully unfold', () => {
  try {
    setScaleMode('density', [1600, 1618, 1642, 1651, 1693, 1701, 1750, 1800]);
    const { items } = layoutTapestry(events, width);
    const segments = continuePictures(composePictures(items, artHeight, width), items, artHeight);
    assert.ok(segments.some(p => p.event.id === 'event-04' && p.anchor === yearToX(1651, width)));
    const cells = clothCells(width, [...items, ...segments]);
    const before = layoutPleats(width, width / 8, cells);
    layoutPleats(width, width / 2, cells);
    assert.deepEqual(layoutPleats(width, width / 8, cells), before);
    assert.ok(layoutPleats(width, width, cells).faces.every(face => face.shade === 0 && face.exposedWidth === face.sourceWidth));
  } finally { setScaleMode('linear'); }
});
