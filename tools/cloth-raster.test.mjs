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
      rasterizeCloth([{ event: { title: 'The Renaissance', startYear: 1400, endYear: 1600 },
        anchor: 0, end: 400, sceneWidth: 400, original: false }], 800, 160, 20, 120),
      error => error.message === 'Cloth panorama could not be loaded'
        && JSON.stringify(error.failedEvents) === JSON.stringify(['The Renaissance'])
    );
  } finally {
    globalThis.Image = PreviousImage;
  }
});
