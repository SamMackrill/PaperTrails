import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateLinearStory, validateRetainedGenerations } from './linear-story-artwork.mjs';
const read = file => readFileSync(new URL(`../${file}`, import.meta.url));
const sources = () => JSON.parse(read('images/tapestry/linear-story-generation.json')).sources;
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
  record.modern.scenePolish.priorGeneration.scenePolish.priorGeneration.prompt += ' altered';
  assert.throws(() => validateRetainedGenerations(record), /Changed retained story prompt/);
});

test('the original generation and supporting references are also verified', () => {
  const original = 'images/tapestry/bayeux-linear-early.png';
  assert.throws(() => validateRetainedGenerations(sources(), file => file === original ? Buffer.from('changed') : read(file)), /Changed retained .*early\.png/);
  const record = sources();
  record.early.previousGeneration.supportingReferences[0].hash = '0'.repeat(64);
  assert.throws(() => validateRetainedGenerations(record), /Changed retained supporting reference/);
});

test('a retained edit cannot point at a different recorded generation', () => {
  const record = sources();
  record.modern.scenePolish.priorGeneration.sourceFile = record.modern.sourceFile;
  assert.throws(() => validateRetainedGenerations(record), /Disconnected retained story edit/);
});

test('initial comet edits remain checked after a later redraw wraps their generation', () => {
  const record = sources();
  record.middle = { ...record.middle, previousGeneration: structuredClone(record.middle) };
  record.middle.previousGeneration.previousGeneration.initialEdit.promptHash = '0'.repeat(64);
  assert.throws(() => validateRetainedGenerations(record), /Changed retained initial edit prompt/);
});
