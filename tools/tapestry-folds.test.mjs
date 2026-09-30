import test from 'node:test';
import assert from 'node:assert/strict';
import { layoutCloth, unfoldZoomLimit, clothPanOffset } from '../src/tapestryFolds.js';
import { getPanoramaStrip, tapestryScenes } from '../src/tapestryScenes.js';

test('folds conserve the material within their projected width and keep all detail in source order', () => {
  for (const original of [false, true]) for (const scene of tapestryScenes.values()) {
    const strip = getPanoramaStrip(scene, original);
    for (const width of [2, 40, 200, 500, 900, 1800, 8000]) {
      const folded = layoutCloth(strip, width, 120);
      const last = folded.facets.at(-1);
      assert.ok(Math.abs(last.left + last.width - folded.width) < 1e-8);
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

test('maximum zoom provides enough width without squeezing any source', () => {
  for (const viewportWidth of [250, 390, 1286, 1900]) {
    for (const height of [24, 94, 220]) {
      const scenes = [...tapestryScenes.values()].flatMap(scene => [false, true].map(original => ({
        strip: getPanoramaStrip(scene, original), fraction: 2 / 626
      })));
      const maximum = unfoldZoomLimit(scenes, viewportWidth, height);
      for (const { strip, fraction } of scenes) {
        const width = Math.round(maximum * viewportWidth) * fraction;
        const flat = layoutCloth(strip, width, height);
        assert.equal(flat.materialScale, height / strip.height, 'material never squeezes horizontally');
        assert.ok(Math.abs(flat.openness - 1) < 1e-10);
        assert.ok(flat.panels.every(panel => panel.angle === 0 && panel.depth === 0 && panel.shade === 0));
        assert.ok(Math.abs(flat.facets.at(-1).left + flat.facets.at(-1).width - strip.width * height / strip.height) < 1e-8);
      }
    }
  }
});

test('flat cloth keeps its natural size when the dated interval expands further', () => {
  for (const scene of tapestryScenes.values()) {
    const strip = getPanoramaStrip(scene);
    const natural = strip.width * (94 / strip.height);
    const flat = layoutCloth(strip, natural, 94);
    const larger = layoutCloth(strip, natural * 100, 94);
    assert.deepEqual(flat, larger);
    larger.panels.forEach(panel => assert.ok(Math.abs(panel.width / panel.sourceWidth - 94 / strip.height) < 1e-10));
  }
});

test('panning traverses a flat illustration without resizing it or losing either edge', () => {
  const sceneWidth = 20000, viewportWidth = 1200;
  for (const clothWidth of [600, 1600, 3000]) {
    const positions = [0, 0.25, 0.5, 0.75, 1].map(progress => {
      const viewportLeft = progress * (sceneWidth - viewportWidth);
      return clothPanOffset(clothWidth, sceneWidth, viewportWidth, viewportLeft) - viewportLeft;
    });
    assert.equal(positions[0], 0);
    assert.equal(positions.at(-1) + clothWidth, viewportWidth);
    if (clothWidth < viewportWidth) assert.ok(positions.every(left => left >= 0 && left + clothWidth <= viewportWidth));
    else assert.ok(positions.every(left => left <= 0 && left + clothWidth >= viewportWidth));
  }
});
