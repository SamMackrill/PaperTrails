import test from 'node:test';
import assert from 'node:assert/strict';
import { assertStorySnapshot } from './prototype/context-audit.mjs';

test('publication audit distinguishes visible subjects from complete canonical story coverage', () => {
  const keys = [...Array.from({ length: 25 }, (_, i) => `event:event-${i}`), 'publication:halley-work-00', 'discovery:discovery-13'];
  const overview = { ready: 'true', sections: 12, keys, visibleKeys: keys.slice(0, 12), height: 171,
    materialWidth: 23000, foldOpen: 0, canvasWidth: 1126, viewportWidth: 1126 };
  assertStorySnapshot(overview, keys);
  assertStorySnapshot({ ...overview, visibleKeys: keys.slice(16, 19), foldOpen: 1 }, keys, overview);
  assert.throws(() => assertStorySnapshot({ ...overview, keys: [...keys.slice(1), keys[1]] }, keys), /canonical target/);
  assert.throws(() => assertStorySnapshot({ ...overview, height: 100 }, keys, overview), /context height/);
  assert.throws(() => assertStorySnapshot({ ...overview, materialWidth: 46000 }, keys, overview), /native source material/);
  assert.throws(() => assertStorySnapshot({ ...overview, canvasWidth: 36000 }, keys), /bounded by the viewport/);
});
