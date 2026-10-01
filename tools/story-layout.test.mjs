import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { layoutStory, foldStory, exposedStory, storyCamera, storyYearX } from '../src/storyLayout.js';
import { yearToX, setScaleMode } from '../src/timeScale.js?v=3';
import { config } from '../src/config.js?v=16';
const yaml = createRequire(import.meta.url)('../vendor/js-yaml.min.js');
const events = yaml.load(readFileSync(new URL('../data/significantevents.yaml', import.meta.url), 'utf8'));
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);

test('one linear material uses whole shared depictions and preserves every record', () => {
  const layout = layoutStory(events, 1280, 120);
  assert.equal(layout.panels.length, 12);
  assert.equal(layout.records.length, events.length);
  for (const record of layout.records) assert.ok(record.subjects.length, record.event.title);
  for (const [i, panel] of layout.panels.entries()) {
    near(panel.sourceWidth / panel.crop.width, panel.unit);
    if (i) {
      near(panel.sourceX, layout.panels[i - 1].sourceX + layout.panels[i - 1].sourceWidth);
      assert.equal(panel.from, layout.panels[i - 1].to);
    }
  }
  const storm = layout.panels.find(p => p.subjects.some(([id]) => id === 'event-20'));
  assert.ok(storm.subjects.some(([id]) => id === 'event-electric-telegraph'));
  const napoleon = layout.panels.find(p => p.subjects.some(([id]) => id === 'event-18'));
  assert.ok(napoleon.subjects.some(([id]) => id === 'event-industrial-revolution'));
  assert.ok(napoleon.subjects.some(([id]) => id === 'event-04'));
});

test('date navigation locates the actual shared storm and Napoleon subjects at full opening', () => {
  const layout = layoutStory(events, 1126, 120), pose = foldStory(layout, 1126, config.MAX_SCALE);
  for (const [id, year] of [['event-20', 1859], ['event-18', 1804]]) {
    const record = layout.records.find(r => r.event.id === id);
    const position = storyYearX(year, pose);
    assert.ok(record.subjects.some(subject => position >= subject.sourceX && position <= subject.sourceX + subject.sourceWidth), id);
  }
  let previous = 0;
  for (let year = config.START_YEAR; year <= config.END_YEAR; year += .5) {
    const current = storyYearX(year, pose);
    assert.ok(current >= previous);
    previous = current;
  }
});

test('folds retain native source regions, cover the cloth continuously and reverse identically', () => {
  for (const viewport of [250, 390, 1126, 1900]) {
    const layout = layoutStory(events, viewport, 120);
    const geometry = layout.panels.map(p => p.faces.map(f => [f.sourceX, f.sourceWidth]));
    for (const scale of [1, 1.01, 2, 4, 8, 16, 31.99, 32]) {
      const pose = foldStory(layout, viewport, scale);
      assert.deepEqual(pose.cells.map(p => p.faces.map(f => [f.sourceX, f.sourceWidth])), geometry);
      const fragments = exposedStory(pose).sort((a, b) => a.left - b.left);
      near(fragments[0].left, 0);
      fragments.forEach((f, i) => {
        assert.ok(f.width > 0);
        if (i) near(f.left, fragments[i - 1].left + fragments[i - 1].width);
        assert.ok(f.sourceX >= f.panel.sourceX - 1e-7);
        assert.ok(f.sourceX + f.width <= f.panel.sourceX + f.panel.sourceWidth + 1e-7);
      });
      near(fragments.at(-1).left + fragments.at(-1).width, pose.width);
      assert.deepEqual(foldStory(layout, viewport, scale), pose);
    }
    const flat = foldStory(layout, viewport, config.MAX_SCALE);
    assert.equal(flat.progress, 1);
    const flatFragments = exposedStory(flat);
    for (const fragment of flatFragments) {
      near(fragment.left, fragment.sourceX);
      assert.equal(fragment.face.shade, 0);
    }
    near(flatFragments.reduce((sum, f) => sum + f.width, 0), layout.materialWidth);
    near(storyCamera(1400, flat, viewport), 0);
    near(storyCamera(config.END_YEAR, flat, viewport), flat.width - viewport);
  }
});

test('record anchors use both scientific mappings independently of symbolic art widths', () => {
  try {
    let original;
    for (const mode of ['linear', 'density']) {
      setScaleMode(mode, events.map(e => e.startYear));
      const layout = layoutStory(events, 4000, 120);
      for (const record of layout.records) {
        assert.equal(record.anchor, yearToX(record.event.startYear, 4000));
        assert.equal(record.end, yearToX(record.event.endYear, 4000));
      }
      const storm = layout.records.find(r => r.event.id === 'event-20');
      assert.equal(storm.anchor, storm.end);
      assert.equal(storm.event.startYear, 1859);
      const art = layout.panels.map(p => [p.sourceX, p.sourceWidth, p.faces]);
      if (original) assert.deepEqual(art, original);
      original = art;
    }
  } finally { setScaleMode('linear'); }
});
