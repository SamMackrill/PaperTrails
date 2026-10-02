import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { layoutScientificBorder, exposedScientificBorder, SCIENTIFIC_BORDER_HEIGHT } from '../src/scientificBorders.js';
import { layoutStory, foldStory, exposedStory } from '../src/storyLayout.js';
import { validateScientificBorders } from './scientific-border-artwork.mjs';
const yaml = createRequire(import.meta.url)('../vendor/js-yaml.min.js');
const events = yaml.load(readFileSync(new URL('../data/significantevents.yaml', import.meta.url), 'utf8'));
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);

test('six authored atlases provide 48 distinct, sourced chronological border regions', () => {
  assert.deepEqual(validateScientificBorders(), { sources: 6, distinctRibbons: 48, chronologicalSections: 12 });
});

test('upper and lower borders use each source region once, within the cloth, at native proportions', () => {
  for (const height of [1, 75, 150, 250]) {
    const layout = layoutStory(events, 1126, height), used = new Set();
    for (const panel of layout.panels) {
      const segments = layoutScientificBorder(panel);
      assert.equal(segments.length, 4);
      for (const segment of segments) {
        assert.ok(!used.has(segment.id)); used.add(segment.id);
        near(segment.width / segment.crop.width, segment.height / segment.crop.height);
        assert.ok(segment.sourceX >= panel.sourceX - 1e-7);
        assert.ok(segment.sourceX + segment.width <= panel.sourceX + panel.sourceWidth + 1e-7);
        assert.ok(segment.inset >= 0 && segment.height + segment.inset <= SCIENTIFIC_BORDER_HEIGHT + 1e-7);
      }
    }
    assert.equal(used.size, 48);
  }
});

test('border pixels follow the same folds without repetition, distortion or changing source positions', () => {
  const layout = layoutStory(events, 1126, 75);
  const borders = new Map(layout.panels.map(p => [p.id, layoutScientificBorder(p)]));
  for (const scale of [1, 1.01, 4, 8, 16, 31.99, 32]) {
    const pose = foldStory(layout, 1126, scale), ranges = new Map();
    for (const fragment of exposedStory(pose)) for (const border of exposedScientificBorder(borders.get(fragment.panel.id), fragment)) {
      assert.ok(border.left >= fragment.left - 1e-7 && border.left + border.width <= fragment.left + fragment.width + 1e-7);
      near(border.width / border.crop.width, border.height / border.crop.height);
      const prior = ranges.get(border.id) || [];
      assert.ok(prior.every(([a, b]) => border.crop.x + border.crop.width <= a + 1e-7 || border.crop.x >= b - 1e-7));
      prior.push([border.crop.x, border.crop.x + border.crop.width]); ranges.set(border.id, prior);
    }
    if (scale === 32) for (const original of [...borders.values()].flat()) {
      near(ranges.get(original.id).reduce((sum, [a, b]) => sum + b - a, 0), original.crop.width);
    }
    assert.deepEqual(exposedStory(foldStory(layout, 1126, scale)), exposedStory(pose));
  }
});
