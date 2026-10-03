import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateLinearStory, validateRetainedGenerations } from './linear-story-artwork.mjs';
const read = file => readFileSync(new URL(`../${file}`, import.meta.url));
const sources = () => JSON.parse(read('images/tapestry/linear-story-generation.json')).sources;
function retained(generation, predicate) {
  if (predicate(generation)) return generation;
  return (generation.previousGeneration && retained(generation.previousGeneration, predicate))
    || (generation.scenePolish && retained(generation.scenePolish.priorGeneration, predicate));
}
test('shared-depiction artwork preserves exact generation evidence, native crops and record coverage', () => {
  validateLinearStory();
});

for (const extension of ['png', 'webp']) test(`a changed older trench-arrival ${extension} is rejected`, () => {
  const target = `images/tapestry/bayeux-linear-modern-trench-arrival-threads.${extension}`;
  const corrupt = file => {
    const bytes = read(file);
    if (file === target) bytes[bytes.length - 20] ^= 1;
    return bytes;
  };
  assert.throws(() => validateRetainedGenerations(sources(), corrupt), /Changed retained .*trench-arrival/);
});

test('a changed deeply retained prompt is rejected', () => {
  const record = sources();
  retained(record.modern, g => g.sourceFile.endsWith('trench-arrival-threads.png')).prompt += ' altered';
  assert.throws(() => validateRetainedGenerations(record), /Changed retained story prompt/);
});

test('the original generation and supporting references are also verified', () => {
  const original = 'images/tapestry/bayeux-linear-early.png';
  assert.throws(() => validateRetainedGenerations(sources(), file => file === original ? Buffer.from('changed') : read(file)), /Changed retained .*early\.png/);
  const record = sources();
  retained(record.early, g => g.supportingReferences?.length).supportingReferences[0].hash = '0'.repeat(64);
  assert.throws(() => validateRetainedGenerations(record), /Changed retained supporting reference/);
});

test('a retained edit cannot point at a different recorded generation', () => {
  const record = sources();
  retained(record.modern, g => g.scenePolish).scenePolish.priorGeneration.sourceFile = record.modern.sourceFile;
  assert.throws(() => validateRetainedGenerations(record), /Disconnected retained story edit/);
});

test('initial comet edits remain checked after a later redraw wraps their generation', () => {
  const record = sources();
  record.middle = { ...record.middle, previousGeneration: structuredClone(record.middle) };
  retained(record.middle, g => g.initialEdit).initialEdit.promptHash = '0'.repeat(64);
  assert.throws(() => validateRetainedGenerations(record), /Changed retained initial edit prompt/);
});

test('removing a nonterminal history link is rejected while explicit origins are accepted', () => {
  validateRetainedGenerations(sources());
  const record = sources();
  delete retained(record.modern, g => g.previousGeneration).previousGeneration;
  assert.throws(() => validateRetainedGenerations(record), /Truncated retained generation history/);
});

test('removing an edit history link or its link declaration is rejected', () => {
  for (const key of ['scenePolish', 'historyLinks']) {
    const record = sources();
    delete retained(record.modern, g => g.scenePolish)[key];
    assert.throws(() => validateRetainedGenerations(record), /Truncated retained generation history/);
  }
});

test('fresh redraw and alpha-extraction calls remain connected to their exact prompt records', () => {
  const record = sources();
  record.middle.previousGeneration.promptRecord.id = 'modern-fresh';
  assert.throws(() => validateRetainedGenerations(record), /Changed recorded drawing call/);
});
