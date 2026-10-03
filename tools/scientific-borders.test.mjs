import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { layoutScientificBorder, exposedScientificBorder, scientificBorderFrame, scientificBorderY } from '../src/scientificBorders.js';
import { layoutStory, foldStory, exposedStory } from '../src/storyLayout.js';
import { validateScientificBorders } from './scientific-border-artwork.mjs';
const yaml = createRequire(import.meta.url)('../vendor/js-yaml.min.js');
const events = yaml.load(readFileSync(new URL('../data/significantevents.yaml', import.meta.url), 'utf8'));
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);

test('twelve atlases and two photography strips provide 96 distinct sourced border regions', () => {
  assert.deepEqual(validateScientificBorders(), { sources: 14, distinctRibbons: 96, chronologicalSections: 12 });
});

test('upper and lower borders use each source region once, within the cloth, at native proportions', () => {
  for (const height of [1, 75, 171, 250, 450]) {
    const frame = scientificBorderFrame(height);
    near(frame.artHeight + frame.borderHeight + frame.bottomBorderHeight, height);
    const layout = layoutStory(events, 1126, frame.artHeight), used = new Set();
    const segments = layoutScientificBorder(layout);
    assert.equal(segments.length, 96);
      for (const segment of segments) {
        assert.ok(!used.has(segment.id)); used.add(segment.id);
        near(segment.width / segment.crop.width, segment.height / segment.crop.height);
        assert.ok(segment.sourceX >= -1e-7);
        assert.ok(segment.sourceX + segment.width <= layout.materialWidth + 1e-7);
        near(segment.height, segment.side === 'top' ? frame.borderHeight : frame.bottomBorderHeight);
        const y = scientificBorderY(segment, frame);
        assert.ok(y >= -1e-7 && y + segment.height <= height + 1e-7);
        if (segment.side === 'top') { near(y, 0); near(y + segment.height, frame.borderHeight); }
        else { near(y, frame.borderHeight + frame.artHeight); near(y + segment.height, height); }
      }
      for (const side of ['top', 'bottom']) {
        const edge = segments.filter(s => s.side === side);
        near(edge[0].sourceX, 0);
        edge.slice(1).forEach((s, i) => near(s.sourceX, edge[i].sourceX + edge[i].width));
        near(edge.at(-1).sourceX + edge.at(-1).width, layout.materialWidth);
      }
    assert.equal(used.size, 96);
  }
});

test('border pixels follow the same folds without repetition, distortion or changing source positions', () => {
  const layout = layoutStory(events, 1126, 75);
  const borders = layoutScientificBorder(layout);
  for (const scale of [1, 1.01, 4, 8, 16, 31.99, 32]) {
    const pose = foldStory(layout, 1126, scale), ranges = new Map();
    for (const fragment of exposedStory(pose)) for (const border of exposedScientificBorder(borders, fragment)) {
      assert.ok(border.left >= fragment.left - 1e-7 && border.left + border.width <= fragment.left + fragment.width + 1e-7);
      near(border.width / border.crop.width, border.height / border.crop.height);
      const prior = ranges.get(border.id) || [];
      assert.ok(prior.every(([a, b]) => border.crop.x + border.crop.width <= a + 1e-7 || border.crop.x >= b - 1e-7));
      prior.push([border.crop.x, border.crop.x + border.crop.width]); ranges.set(border.id, prior);
    }
    if (scale === 32) for (const original of borders) {
      near(ranges.get(original.id).reduce((sum, [a, b]) => sum + b - a, 0), original.crop.width);
    }
    assert.deepEqual(exposedStory(foldStory(layout, 1126, scale)), exposedStory(pose));
  }
});
