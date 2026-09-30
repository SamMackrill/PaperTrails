import test from 'node:test';
import assert from 'node:assert/strict';
import { layoutCloth, selectClothStrip, layoutWeaveCloth, mapClothX, clothCameraLeft } from '../src/tapestryFolds.js';
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

test('all scenes retain an exposed summary and attached folds across the useful zoom range', () => {
  for (const viewport of [250, 390, 1286, 1900]) for (const height of [24, 94, 220]) {
    for (const scene of tapestryScenes.values()) for (const original of [false, true]) {
      const source = getPanoramaStrip(scene, original);
      const strip = selectClothStrip(source);
      assert.equal(strip.facets.length, 3);
      assert.deepEqual(strip.edges, source.edges.slice(0, 4));
      const summary = layoutWeaveCloth(strip, viewport / 21, height, 1, 32);
      assert.ok(Math.abs(summary.width - viewport / 21) < 1e-8);
      assert.equal(summary.openness, 0);
      for (const scale of [1.4, 4, 16, 32]) {
        const pose = layoutWeaveCloth(strip, viewport / 21, height, scale, 32);
        assert.equal(pose.overviewWidth, summary.overviewWidth, 'the summary never slides or grows');
        assert.equal(pose.panels.length, 4, 'no scene loses its attached detail');
        assert.ok(Math.abs(pose.facets.at(-1).left + pose.facets.at(-1).width - pose.width) < 1e-8);
        pose.panels.forEach(panel => assert.ok(Math.abs(panel.width / panel.sourceWidth - height / source.height) < 1e-10));
        if (scale === 32) {
          assert.equal(pose.openness, 1);
          assert.ok(pose.panels.every(panel => panel.angle === 0 && panel.depth === 0 && panel.shade === 0));
        } else assert.ok(pose.panels.every(panel => Math.abs(panel.angle) > 0 && panel.shade > 0));
      }
    }
  }
});

test('the connected strip fills the overview and unfolds continuously and reversibly', () => {
  const strips = [...tapestryScenes.values()].map(scene => selectClothStrip(getPanoramaStrip(scene)));
  const scales = Array.from({ length: 1001 }, (_, i) => 32 ** (i / 1000));
  const layout = scale => {
    let left = 0;
    return strips.map(strip => {
      const pose = layoutWeaveCloth(strip, 1286 / strips.length, 94, scale, 32);
      const scene = { left, pose };
      left += pose.width;
      return scene;
    });
  };
  const forward = scales.map(layout);
  assert.deepEqual(forward, scales.toReversed().map(layout).reverse());
  assert.ok(Math.abs(forward[0].at(-1).left + forward[0].at(-1).pose.width - 1286) < 1e-8);
  for (let i = 0; i < forward.length; i++) for (let j = 0; j < strips.length; j++) {
    const scene = forward[i][j];
    if (j) assert.equal(scene.left, forward[i][j - 1].left + forward[i][j - 1].pose.width);
    if (i) {
      const previous = forward[i - 1][j];
      assert.ok(scene.pose.width >= previous.pose.width);
      assert.ok(scene.pose.openness - previous.pose.openness < 0.002);
    }
  }
});

test('one camera follows chronological anchors and keeps the viewport covered from end to end', () => {
  const width = 1286, timeWidth = width * 32;
  const scenes = [0, 53 / 626, 92 / 626, 308 / 626, 547 / 626].map((fraction, i) => ({ anchor: fraction * timeWidth, left: i * 800 }));
  const clothWidth = 4000;
  scenes.forEach(scene => assert.ok(Math.abs(mapClothX(scene.anchor, scenes, timeWidth, clothWidth) - scene.left) < 1e-8));
  let previous = -Infinity;
  for (let i = 0; i <= 2000; i++) {
    const left = (timeWidth - width) * i / 2000;
    const mapped = mapClothX(left + width / 2, scenes, timeWidth, clothWidth);
    assert.ok(mapped >= previous, 'the camera never reverses as time moves forward');
    const camera = clothCameraLeft(mapped, clothWidth, width);
    assert.ok(camera <= 0 && camera + clothWidth >= width, 'no blank margin at either edge');
    previous = mapped;
  }
  assert.equal(clothCameraLeft(0, clothWidth, width), 0);
  assert.equal(clothCameraLeft(clothWidth, clothWidth, width), width - clothWidth);
  assert.equal(clothCameraLeft(width / 2, width, width), 0);
});
