import test from 'node:test';
import assert from 'node:assert/strict';
import { textureChunks } from '../src/clothRaster.js';
import { joinWidth } from '../src/clothComposition.js';

test('texture boundaries cover odd-width canvases without fractional resampling', () => {
  for (const width of [1, 390, 1001, 1286 * 32, 41153]) {
    const { chunkWidth, count } = textureChunks(width);
    assert.ok(Number.isInteger(chunkWidth));
    assert.ok(count <= 8);
    assert.ok(chunkWidth * count >= width);
    assert.ok(chunkWidth * (count - 1) < width);
  }
});

test('a landscape join keeps the identifying central subject opaque', () => {
  for (const width of [0, 1, 40, 112, 800]) {
    assert.ok(joinWidth(width) <= width / 8);
    assert.ok(joinWidth(width) <= 28);
  }
});
