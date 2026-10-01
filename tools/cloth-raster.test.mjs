import test from 'node:test';
import assert from 'node:assert/strict';

test('a failed panorama prevents raster texture installation', async () => {
  const PreviousImage = globalThis.Image;
  globalThis.Image = class {
    set src(value) {
      queueMicrotask(() => this.onerror?.(new Error(`Missing ${value}`)));
    }
  };
  try {
    const { rasterizeCloth } = await import(`../src/clothRaster.js?failure-test=${Date.now()}`);
    await assert.rejects(
      rasterizeCloth([{ event: { title: 'The Renaissance' }, original: false }], 800, 160, 20, 120),
      /Cloth panorama could not be loaded/
    );
  } finally {
    globalThis.Image = PreviousImage;
  }
});
