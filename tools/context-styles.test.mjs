import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { contextHeading, latinHeadings } from '../src/contextHeadings.js';
import { layoutTapestry } from '../src/tapestryRenderer.js';
import { composePictures, continuePictures, quietLandscape, quietPictures } from '../src/clothComposition.js';
import { clothCells, layoutPleats } from '../src/clothPleats.js';
const yaml = createRequire(import.meta.url)('../vendor/js-yaml.min.js');
const events = yaml.load(readFileSync(new URL('../data/significantevents.yaml', import.meta.url), 'utf8'));

test('every Tapestry inscription has Latin text and no visible dates, including continuations', () => {
  for (const event of events) {
    assert.ok(latinHeadings.has(event.title), event.title);
    for (const continuing of [false, true]) {
      const inscription = contextHeading(event, 'tapestry', continuing);
      assert.equal(inscription.lang, 'la');
      assert.equal(inscription.date, '');
      assert.doesNotMatch(inscription.title, /\d/);
      assert.match(contextHeading(event, 'landscape', continuing).date, /\d/);
    }
  }
});

test('Tapestry leaves linen gaps while Landscape retains its quiet scenery', () => {
  assert.deepEqual(quietLandscape(40960, 128, [], 'tapestry'), []);
  assert.deepEqual(quietPictures(40960, 128, [], [], 'tapestry'), []);
  assert.ok(quietLandscape(40960, 128).length > 0);
  assert.ok(quietPictures(40960, 128).length > 0);
});

test('both styles keep chapter scope, native proportions and reversible folded source regions', () => {
  const width = 40960;
  for (const style of ['landscape', 'tapestry']) {
    const { items } = layoutTapestry(events, width);
    items.forEach(item => { item.style = style; });
    const pictures = continuePictures(composePictures(items, 128, width), items, 128);
    for (const picture of pictures) {
      assert.equal(picture.style, style);
      assert.ok(picture.anchor >= 0 && picture.right <= picture.end);
      assert.ok(Math.abs(picture.nativeWidth / picture.strip.width - 128 / picture.strip.height) < 1e-12);
    }
    const cells = clothCells(width, [...items, ...pictures]);
    const before = layoutPleats(width, width / 32, cells);
    const flat = layoutPleats(width, width, cells);
    assert.equal(flat.openness, 1);
    assert.ok(flat.faces.every(face => face.exposedWidth === face.sourceWidth));
    assert.deepEqual(layoutPleats(width, width / 32, cells), before);
    assert.deepEqual(flat.faces.map(face => [face.sourceX, face.sourceWidth]),
      before.faces.map(face => [face.sourceX, face.sourceWidth]));
  }
});
