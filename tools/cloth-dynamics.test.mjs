import test from 'node:test';
import assert from 'node:assert/strict';
import {
  allocatePleatCascade,
  analyzeClothFolds,
  clothSelvageRelief,
  unfoldProgress
} from '../src/clothDynamics.js';

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

test('logarithmic unfold progress tracks zoom octaves evenly and hits exact bounds', () => {
  assert.equal(unfoldProgress(1, 1, 32), 0);
  assert.equal(unfoldProgress(32, 1, 32), 1);
  near(unfoldProgress(2, 1, 32), 0.2);
  near(unfoldProgress(4, 1, 32), 0.4);
  near(unfoldProgress(8, 1, 32), 0.6);
  near(unfoldProgress(16, 1, 32), 0.8);
});

test('sequential pleat cascade opens inner pleats first without gaps or width drift', () => {
  const widths = [240, 240, 240, 240];
  const total = 960;
  let prev = [0, 0, 0, 0];
  for (let avail = 0; avail <= total; avail += 24) {
    const alloc = allocatePleatCascade(widths, avail);
    near(alloc.reduce((s, v) => s + v, 0), avail);
    alloc.forEach((v, k) => {
      assert.ok(v >= -1e-9 && v <= widths[k] + 1e-9, `pleat ${k} out of bounds: ${v}`);
      assert.ok(v >= prev[k] - 1e-7, `pleat ${k} reversed: ${v} < ${prev[k]}`);
    });
    // Inner pleats lead outer pleats at every intermediate opening.
    for (let k = 0; k < alloc.length - 1; k++) {
      assert.ok(alloc[k] + 1e-6 >= alloc[k + 1], `inner pleat ${k} trailed outer pleat ${k + 1}`);
    }
    prev = alloc;
  }
  // At early opening (120px of 960px), outermost pleats stay completely tucked away.
  const early = allocatePleatCascade(widths, 120);
  assert.ok(early[0] > 100);
  assert.equal(early[2], 0);
  assert.equal(early[3], 0);
});

test('cloth fold analysis detects true occlusion direction and ignores flat continuous joins', () => {
  const flat = [
    { panel: { id: 'p1' }, face: { order: 1000 }, left: 0, width: 160, sourceX: 0 },
    { panel: { id: 'p1' }, face: { order: 2 }, left: 160, width: 240, sourceX: 160 }
  ];
  assert.deepEqual(analyzeClothFolds(flat), []);

  const tuckedRight = [
    { panel: { id: 'p1' }, face: { order: 1000 }, left: 0, width: 160, sourceX: 0 },
    { panel: { id: 'p1' }, face: { order: 2 }, left: 160, width: 120, sourceX: 280 }
  ];
  const rightFolds = analyzeClothFolds(tuckedRight);
  assert.equal(rightFolds.length, 1);
  assert.equal(rightFolds[0].upperSide, 'left');
  assert.ok(rightFolds[0].shadowWidth > 6);
  assert.ok(rightFolds[0].crestWidth > 2);

  const valley = [
    { panel: { id: 'p1' }, face: { order: 1000 }, left: 0, width: 160, sourceX: 200 },
    { panel: { id: 'p2' }, face: { order: 1000 }, left: 160, width: 160, sourceX: 600 }
  ];
  const valleyFolds = analyzeClothFolds(valley);
  assert.equal(valleyFolds.length, 1);
  assert.equal(valleyFolds[0].upperSide, 'valley');

  // Selvage drape relief peaks at active folds and flattens to 0 at full opening.
  assert.ok(clothSelvageRelief(160, valleyFolds, 0) > 1.5);
  assert.equal(clothSelvageRelief(160, valleyFolds, 1), 0);
});
