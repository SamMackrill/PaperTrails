import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { composePictures, joinWidth, quietLandscape, quietAtlas } from '../src/clothComposition.js';
import { layoutTapestry } from '../src/tapestryRenderer.js';
import { tapestryScenes, getPanoramaStrip } from '../src/tapestryScenes.js';
import { validateContextChapters, contextDate } from '../src/contextModel.js';
import { setScaleMode, yearToX } from '../src/timeScale.js?v=3';
const yaml = createRequire(import.meta.url)('../vendor/js-yaml.min.js');
const events = yaml.load(readFileSync(new URL('../data/significantevents.yaml', import.meta.url), 'utf8'));

test('new context chapters have evidence, bounded ordered dates and resolvable art', () => {
  validateContextChapters(events);
  const additions = events.filter(event => event.chapters);
  assert.equal(additions.length, 4);
  assert.equal(additions.reduce((sum, event) => sum + event.chapters.length, 0), 9);
  for (const event of additions) for (const chapter of event.chapters) assert.ok(tapestryScenes.has(chapter.scene));
  assert.match(contextDate(additions[0]), /^c\. /);
  assert.match(contextDate(additions[1]), /estimates window/);
});

test('misleading chapter dates and unsafe or missing sources are rejected', () => {
  const event = events.find(event => event.chapters);
  const chapter = event.chapters[0];
  assert.throws(() => validateContextChapters([{ ...event, chapters: [{ ...chapter, endYear: event.endYear + 1 }] }]), /invalid chapter/);
  assert.throws(() => validateContextChapters([{ ...event, chapters: [chapter, chapter] }]), /invalid chapter/);
  assert.throws(() => validateContextChapters([{ ...event, sources: [] }]), /evidence/);
  assert.throws(() => validateContextChapters([{ ...event, sources: [{ label: 'Bad', locator: 'Test', url: 'javascript:alert(1)' }] }]), /HTTPS/);
});

test('each event or chapter is painted once within its interval without stretching', () => {
  for (const width of [12480, 46080, 61440]) {
    const { items } = layoutTapestry(events, width);
    const pictures = composePictures(items, 128);
    assert.equal(pictures.length, 21 + 9);
    assert.equal(new Set(pictures.map(picture => picture.key)).size, pictures.length);
    for (const picture of pictures) {
      assert.ok(picture.anchor >= 0 && picture.right <= picture.end);
      assert.ok(picture.sceneWidth > 0 && picture.sceneWidth <= picture.nativeWidth);
      assert.ok(Math.abs(picture.nativeWidth / picture.strip.width - 128 / picture.strip.height) < 1e-12);
      assert.ok(joinWidth(picture.sceneWidth) * 2 <= picture.sceneWidth);
    }
  }
});

test('a centuries-long period reveals its authored scene once and leaves varied landscape', () => {
  const event = events.find(event => event.id === 'event-04');
  const { items } = layoutTapestry([event], 46080);
  const [picture] = composePictures(items, 128);
  assert.ok(picture.right - picture.anchor < (picture.end - picture.anchor) / 2,
    'the snow scene is not tiled across the entire period');
  assert.equal(composePictures(items, 128).length, 1);
});

test('quiet thread drawing is deterministic and never restarts as repeated panels', () => {
  const paths = quietLandscape(2000, 128);
  assert.deepEqual(paths, quietLandscape(2000, 128));
  assert.equal(new Set(paths.map(path => path.d)).size, paths.length);
  assert.ok(paths[0].d.includes('2000'));
  assert.ok(paths.length > 15);
});

test('authored atlas crops agree with the PNG dimensions and stay within the images', () => {
  const atlases = new Map([[quietAtlas.file, quietAtlas]]);
  for (const scene of tapestryScenes.values()) if (scene.customAtlas) atlases.set(scene.customAtlas.file, scene.customAtlas);
  for (const atlas of atlases.values()) {
    const png = readFileSync(new URL(`../${atlas.file}`, import.meta.url));
    assert.equal(png.readUInt32BE(16), atlas.width);
    assert.equal(png.readUInt32BE(20), atlas.height);
  }
  for (const scene of tapestryScenes.values()) {
    const strip = getPanoramaStrip(scene);
    assert.ok(strip.x >= 0 && strip.x + strip.width <= strip.atlas.width);
    assert.ok(strip.y >= 0 && strip.y + strip.height <= strip.atlas.height);
  }
});

test('adjacent chapter crops reveal distinct source regions instead of duplicated pictures', () => {
  for (const [a, b] of [['atlantic-resistance', 'atlantic-abolition'], ['telegraph-experiments', 'telegraph-cable']]) {
    const first = getPanoramaStrip(tapestryScenes.get(a));
    const next = getPanoramaStrip(tapestryScenes.get(b));
    assert.equal(first.x + first.width, next.x);
    assert.equal(first.y, next.y);
  }
});

test('chapter anchors follow the same nonlinear density scale as the papers and braids', () => {
  try {
    setScaleMode('density', [1500, 1501, 1600, 1700, 1750, 1780, 1800, 1812, 1850, 1900]);
    const { items } = layoutTapestry(events, 46080);
    for (const picture of composePictures(items, 128, 46080)) {
      assert.ok(Math.abs(picture.anchor - yearToX(picture.chapter.startYear, 46080)) < 1e-8);
    }
  } finally {
    setScaleMode('linear');
  }
});
