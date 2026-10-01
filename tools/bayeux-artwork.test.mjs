import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { artworkStyles, tapestryScenes, getPanoramaStrip } from '../src/tapestryScenes.js';
import { validateArtwork } from './tapestry-artwork.mjs';

test('all Bayeux scenes and winter eras use reviewed masters with matching WebP crops', () => {
  assert.equal(artworkStyles.tapestry.atlases.length, 5);
  assert.ok(!artworkStyles.tapestry.redrawPending);
  for (const atlas of artworkStyles.tapestry.atlases) {
    assert.match(atlas.file, /\/bayeux-.*\.webp$/);
    const master = readFileSync(new URL(`../${atlas.file.replace('.webp', '.png')}`, import.meta.url));
    assert.equal(master.readUInt32BE(16), atlas.width);
    assert.equal(master.readUInt32BE(20), atlas.height);
  }
  for (const [key, scene] of tapestryScenes) {
    const strip = getPanoramaStrip(scene, false, 'tapestry');
    const fallback = getPanoramaStrip(scene, true, 'tapestry');
    assert.match(strip.atlas.file, /\/bayeux-.*\.webp$/, key);
    assert.equal(fallback.atlas.file, strip.atlas.file.replace('.webp', '.png'), key);
    assert.deepEqual({ ...fallback, atlas: strip.atlas }, strip, key);
    assert.ok(strip.x >= 0 && strip.x + strip.width <= strip.atlas.width, key);
    assert.ok(strip.y >= 0 && strip.y + strip.height <= strip.atlas.height, key);
  }
  for (const [a, b] of [['atlantic-resistance', 'atlantic-abolition'], ['telegraph-experiments', 'telegraph-cable']]) {
    const first = getPanoramaStrip(tapestryScenes.get(a), false, 'tapestry');
    const next = getPanoramaStrip(tapestryScenes.get(b), false, 'tapestry');
    assert.equal(first.x + first.width, next.x);
    assert.equal(first.y, next.y);
  }
});

test('artwork provenance rejects a crop change even if the source image is unchanged', () => {
  const row = artworkStyles.tapestry.atlases[0].rows[0];
  const top = row[0];
  try {
    row[0] = top + 1;
    assert.throws(() => validateArtwork(), /Outdated\/unrecorded tapestry\/early/);
  } finally { row[0] = top; }
  assert.doesNotThrow(() => validateArtwork());
});
