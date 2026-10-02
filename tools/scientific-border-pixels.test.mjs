import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateScientificBorders } from './scientific-border-artwork.mjs';

test('scientific crop audit accepts native pixels and rejects a unique stale inventory hash', () => {
  const record = JSON.parse(readFileSync(new URL('../images/tapestry/scientific-border-generation.json', import.meta.url)));
  assert.equal(validateScientificBorders(record).distinctRibbons, record.ribbons.length);
  record.ribbons[0].pixelHash = '0'.repeat(64);
  assert.throws(() => validateScientificBorders(record), /Stale scientific illustration pixel hash/);
});
