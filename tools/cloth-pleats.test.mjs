import test from 'node:test';
import assert from 'node:assert/strict';
import { clothCells, layoutPleats, projectClothX } from '../src/clothPleats.js';

const intervals = [{ anchor: 0, end: 5000, sceneWidth: 5000 },
  { anchor: 800, end: 800, sceneWidth: 65 }, { anchor: 6000, end: 6260, sceneWidth: 260 }];

test('folds preserve every native face and exact dated footprints at every zoom', () => {
  for (const viewport of [250, 390, 1286, 1900]) {
    const materialWidth = viewport * 32;
    const cells = clothCells(materialWidth, intervals.filter(i => i.end < materialWidth));
    for (const scale of [1, 1.001, 2, 8, 16, 31.999, 32]) {
      const pose = layoutPleats(materialWidth, viewport * scale, cells);
      assert.equal(pose.width, viewport * scale);
      assert.ok(Math.abs(pose.cells.reduce((s, c) => s + c.width, 0) - pose.width) < 1e-7);
      for (const [i, face] of pose.faces.entries()) {
        assert.equal(face.width, face.sourceWidth, 'embroidery is never squeezed');
        assert.equal(face.angle, 0, 'the exposed fronts remain face-on');
        if (i) assert.ok(Math.abs(pose.faces[i - 1].sourceX + pose.faces[i - 1].sourceWidth - face.sourceX) < 1e-8);
      }
      assert.ok(Math.abs(projectClothX(6260, pose) - projectClothX(6000, pose) - 260 * pose.ratio) < 1e-8);
    }
  }
});

test('overview faces stay exposed while native detail is occluded behind them', () => {
  const cells = clothCells(1000);
  for (const width of [112, 120, 200, 500, 999]) {
    const pose = layoutPleats(1000, width, cells);
    assert.equal(pose.faces[0].left, 0);
    assert.equal(pose.faces[0].exposedWidth, 112);
    const cell = pose.cells[0];
    assert.ok(Math.abs(pose.faces.slice(1).reduce((s, f) => s + f.exposedWidth, 112) - width) < 1e-8);
    for (const face of pose.faces.slice(1)) {
      assert.ok(face.sourceWidth > face.exposedWidth, 'fixed native material remains hidden in the fold');
      assert.ok(face.left < face.sourceX, 'a return is tucked under the previous face');
      assert.ok(face.order < pose.faces[0].order, 'the summary occludes the returns');
    }
    const last = pose.faces.at(-1);
    assert.ok(Math.abs(last.left + last.width - cell.width) < 1e-8);
  }
});

test('opening and reversing retain source slices and have no tier jumps', () => {
  const cells = clothCells(41152, intervals);
  const widths = Array.from({ length: 501 }, (_, i) => 1286 * 32 ** (i / 500));
  const forward = widths.map(w => layoutPleats(41152, w, cells));
  const backward = widths.toReversed().map(w => layoutPleats(41152, w, cells)).reverse();
  assert.deepEqual(forward, backward);
  for (const [i, pose] of forward.entries()) {
    assert.deepEqual(pose.faces.map(f => [f.sourceX, f.sourceWidth]), forward[0].faces.map(f => [f.sourceX, f.sourceWidth]));
    if (!i) continue;
    pose.faces.forEach((face, j) => {
      assert.ok(face.exposedWidth >= forward[i - 1].faces[j].exposedWidth - 1e-8);
      assert.ok(Math.abs(face.left - forward[i - 1].faces[j].left) < 300);
    });
  }
});

test('maximum zoom exposes the complete unscaled material with no fold edge', () => {
  const pose = layoutPleats(41152, 41152, clothCells(41152, intervals));
  assert.equal(pose.openness, 1);
  for (const face of pose.faces) {
    const cell = pose.cells[face.cellIndex];
    assert.ok(Math.abs(cell.left + face.left - face.sourceX) < 1e-8);
    assert.equal(face.width, face.sourceWidth);
    assert.equal(face.exposedWidth, face.sourceWidth);
    assert.equal(face.shade, 0);
  }
});
