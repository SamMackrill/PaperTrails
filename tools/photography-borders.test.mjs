import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { photographyBorderRevisions, exposedPhotographyTargets } from '../src/photographyBorders.js';
import { layoutScientificBorder, scientificBorderFrame } from '../src/scientificBorders.js';
import { layoutStory, foldStory, exposedStory, storyYearX } from '../src/storyLayout.js';
const yaml = createRequire(import.meta.url)('../vendor/js-yaml.min.js');
const discoveries = yaml.load(readFileSync(new URL('../data/discoveries.yaml', import.meta.url), 'utf8'));

test('photography milestone identities, dates and sources match the two border depictions', () => {
  for (const revision of Object.values(photographyBorderRevisions)) {
    const discovery = discoveries.find(d => d.id === revision.milestoneId);
    assert.equal(discovery.year, revision.year);
    assert.ok(discovery.sources.length > 0 && discovery.sources.every(s => new URL(s.url).protocol === 'https:'));
  }
  assert.equal(discoveries.find(d => d.id === 'first-camera-photograph').legacyKey, 'discovery:40');
  assert.equal(discoveries.find(d => d.id === 'kodachrome-colour-film').legacyKey, 'discovery:41');
});

test('each dated camera anchor centres on its drawn border motif at every context size', () => {
  for (const height of [75, 165, 250, 450]) {
    const frame = scientificBorderFrame(height), layout = layoutStory([], 1126, frame.artHeight);
    const pose = foldStory(layout, 1126, 32);
    for (const border of layoutScientificBorder(layout).filter(b => b.revision)) {
      assert.ok(Math.abs(storyYearX(border.revision.year, pose) - (border.sourceX + border.revision.centre * border.unit)) < 1e-7);
    }
  }
});

test('border targets expose only visible motif pixels and fully recover once at maximum zoom', () => {
  const layout = layoutStory([], 1126, scientificBorderFrame(165).artHeight), borders = layoutScientificBorder(layout);
  for (const scale of [1, 1.01, 8, 16, 31.99, 32]) {
    const fragments = exposedStory(foldStory(layout, 1126, scale));
    const hits = exposedPhotographyTargets(borders, fragments);
    for (const hit of hits) assert.ok(fragments.some(f => hit.left >= f.left - 1e-7 && hit.left + hit.width <= f.left + f.width + 1e-7));
    if (scale === 32) for (const border of borders.filter(b => b.revision)) {
      const expected = (border.revision.motif[1] - border.revision.motif[0]) * border.unit;
      assert.ok(Math.abs(hits.filter(h => h.id === border.id).reduce((sum, hit) => sum + hit.width, 0) - expected) < 1e-7);
    }
  }
});
