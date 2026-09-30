import test from 'node:test';
import assert from 'node:assert/strict';
import { layoutCloth } from '../src/tapestryFolds.js';
import { getPanoramaStrip, tapestryScenes } from '../src/tapestryScenes.js';

test('folds conserve the projected cloth width and keep all detail in source order', () => {
  for (const original of [false, true]) for (const scene of tapestryScenes.values()) {
    const strip = getPanoramaStrip(scene, original);
    for (const width of [2, 40, 200, 500, 900, 1800, 8000]) {
      const folded = layoutCloth(strip, width, 120);
      const last = folded.facets.at(-1);
      assert.ok(Math.abs(last.left + last.width - width) < 1e-8);
      assert.equal(folded.panels.length, 8);
      assert.equal(folded.facets.length, 5);
      assert.ok(folded.panels.every((panel, i, panels) => i === 0 || panel.sourceX > panels[i - 1].sourceX));
      for (let i = 0; i < folded.panels.length; i += 2) {
        const front = folded.panels[i], returnFace = folded.panels[i + 1];
        assert.equal(front.angle, -returnFace.angle);
        assert.ok(front.angle >= 0 && front.angle < 90, 'no mirrored/back-facing embroidery');
        assert.ok(Math.abs(front.left + front.width * Math.cos(front.angle * Math.PI / 180) - returnFace.left) < 1e-8);
        assert.ok(Math.abs(returnFace.depth + front.width * Math.sin(front.angle * Math.PI / 180)) < 1e-8);
      }
    }
  }
});

test('the overview stays exposed while pleats open continuously and reversibly', () => {
  const strip = getPanoramaStrip(tapestryScenes.get('The Renaissance'));
  const widths = Array.from({ length: 2000 }, (_, i) => 20 + i);
  const forward = widths.map(width => layoutCloth(strip, width, 120));
  const reverse = widths.toReversed().map(width => layoutCloth(strip, width, 120)).reverse();
  assert.deepEqual(forward, reverse);
  for (const [i, pose] of forward.entries()) {
    assert.ok(pose.overviewWidth > 0);
    if (i === 0) continue;
    const previous = forward[i - 1];
    assert.ok(pose.openness >= previous.openness - 1e-10);
    assert.ok(pose.openness - previous.openness < 0.01, 'no detail threshold or content pop');
    pose.facets.forEach((facet, index) => assert.ok(facet.width >= previous.facets[index].width - 1e-8));
  }
});

test('opening the full cloth flattens every crease without losing source boundaries', () => {
  for (const scene of tapestryScenes.values()) {
    const strip = getPanoramaStrip(scene);
    const pose = layoutCloth(strip, 8000, 120);
    assert.ok(Math.abs(pose.openness - 1) < 1e-10);
    assert.ok(pose.panels.every(panel => Math.abs(panel.angle) < 1e-5 && panel.shade < 1e-6));
    assert.equal(pose.facets[0].left, 0);
    assert.equal(pose.panels.at(-1).sourceX + pose.panels.at(-1).sourceWidth, strip.width);
  }
});

test('crease shading approaches flat cloth without a last-pixel flash', () => {
  const strip = getPanoramaStrip(tapestryScenes.get('The Renaissance'));
  const flatWidth = strip.width * 120 / strip.height;
  const almostFlat = layoutCloth(strip, flatWidth - 0.1, 120);
  assert.ok(almostFlat.panels.every(panel => panel.shade < 0.001));
});
