import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateRetainedGenerations } from './linear-story-artwork.mjs';
const sources = () => JSON.parse(readFileSync(new URL('../images/tapestry/linear-story-generation.json', import.meta.url))).sources;
function retained(generation, predicate) {
  if (predicate(generation)) return generation;
  return (generation.previousGeneration && retained(generation.previousGeneration, predicate))
    || (generation.scenePolish && retained(generation.scenePolish.priorGeneration, predicate));
}

test('deleting required comet references and initial-edit evidence is rejected', () => {
  for (const [sheet, field] of [['early', 'supportingReferences'], ['middle', 'supportingReferences'], ['middle', 'initialEdit']]) {
    const record = sources();
    delete retained(record[sheet], g => g.initialEdit || g.supportingReferences?.length)[field];
    assert.throws(() => validateRetainedGenerations(record), /Missing retained (supporting references|initial edit)/);
  }
});

test('empty or substituted comet reference inventories are rejected', () => {
  for (const references of [[], [{ file: 'images/tapestry/style-reference-bayeux.png', hash: '0'.repeat(64) }]]) {
    const record = sources();
    retained(record.early, g => g.supportingReferences?.length).supportingReferences = references;
    assert.throws(() => validateRetainedGenerations(record), /Missing retained supporting references/);
  }
});

test('required evidence follows an immutable master beneath later generations', () => {
  const record = sources();
  record.middle = { ...record.middle, previousGeneration: structuredClone(record.middle) };
  validateRetainedGenerations(record);
  delete retained(record.middle.previousGeneration, g => g.initialEdit).initialEdit;
  assert.throws(() => validateRetainedGenerations(record), /Missing retained initial edit/);
});
