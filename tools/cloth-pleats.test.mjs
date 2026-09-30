import test from 'node:test';
import assert from 'node:assert/strict';
import { layoutPleats, projectClothX, PLEAT_COUNT, PLEAT_FACES } from '../src/clothPleats.js';

test('soft pleats conserve the complete cloth and exactly fill every zoom width', () => {
  for (const viewport of [250, 390, 1286, 1900]) for (const scale of [1, 1.001, 2, 8, 16, 31.999, 32]) {
    const pose = layoutPleats(viewport * 32, viewport * scale);
    assert.ok(Math.abs(pose.width - viewport * scale) < 1e-7);
    assert.equal(pose.faces.length, PLEAT_COUNT * PLEAT_FACES);
    for (const [i, face] of pose.faces.entries()) {
      assert.ok(Math.abs(face.angle) < 90, 'no flipped or mirrored fabric');
      if (!i) continue;
      const previous = pose.faces[i - 1];
      assert.ok(Math.abs(previous.left + previous.width - face.left) < 1e-9, 'no gap between projected faces');
      assert.ok(Math.abs(previous.depth - previous.sourceWidth * Math.sin(previous.angle * Math.PI / 180) - face.depth) < 1e-9, 'connected rounded profile');
      assert.equal(previous.sourceX + previous.sourceWidth, face.sourceX);
    }
    assert.ok(Math.abs(projectClothX(0, pose)) < 1e-9);
    assert.ok(Math.abs(projectClothX(pose.materialWidth, pose) - pose.width) < 1e-7);
  }
});

test('the material and its source slices persist through continuous zoom and reversal', () => {
  const scales = Array.from({ length: 501 }, (_, i) => 32 ** (i / 500));
  const forward = scales.map(scale => layoutPleats(41152, 1286 * scale));
  const backward = scales.toReversed().map(scale => layoutPleats(41152, 1286 * scale)).reverse();
  assert.deepEqual(forward, backward);
  for (const [i, pose] of forward.entries()) {
    assert.deepEqual(pose.faces.map(f => [f.sourceX, f.sourceWidth]), forward[0].faces.map(f => [f.sourceX, f.sourceWidth]));
    if (!i) continue;
    for (const [j, face] of pose.faces.entries()) {
      const previous = forward[i - 1].faces[j];
      assert.ok(face.width >= previous.width - 1e-8);
      assert.ok(Math.abs(face.angle - previous.angle) < 15, 'no tier switch or material swap');
    }
  }
});

test('the cloth becomes completely flat and its chronology exact at maximum zoom', () => {
  const pose = layoutPleats(41152, 41152);
  assert.equal(pose.openness, 1);
  for (const face of pose.faces) {
    assert.ok(face.angle === 0 && face.depth === 0 && face.shade === 0);
    assert.equal(face.width, face.sourceWidth);
  }
  for (let x = 0; x <= 41152; x += 31) assert.ok(Math.abs(projectClothX(x, pose) - x) < 1e-9);
});

test('a date crosses rounded pleats without reversing or jumping between source slices', () => {
  for (const scale of [1, 4, 16, 31.999, 32]) {
    const pose = layoutPleats(41152, 1286 * scale);
    let previous = -1;
    for (let x = 0; x <= pose.materialWidth; x += 7) {
      const mapped = projectClothX(x, pose);
      assert.ok(mapped >= previous);
      previous = mapped;
    }
    for (const face of pose.faces.slice(1)) {
      assert.ok(Math.abs(projectClothX(face.sourceX - 1e-6, pose) - projectClothX(face.sourceX + 1e-6, pose)) < 3e-6);
    }
  }
});
