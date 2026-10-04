import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { buildItemIndex } from '../src/itemIdentity.js';
const yaml = createRequire(import.meta.url)('../vendor/js-yaml.min.js');
const read = (name) => yaml.load(readFileSync(new URL(`../data/${name}.yaml`, import.meta.url), 'utf8'));
const data = { scientists: read('scientists'), discoveries: read('discoveries'), conferences: read('conferences'), significantEvents: read('significantevents') };

test('all current records have unique identities and frozen legacy aliases', () => {
  const index = buildItemIndex(data);
  assert.equal(index.records.size, 132 + 249 + 42 + 9 + data.significantEvents.length);
  for (const record of index.records.values()) {
    if (record.type === 'scientist') continue;
    assert.ok(record.item.id);
    assert.ok(record.item.legacyKey);
    assert.equal(index.resolve(record.item.legacyKey), record);
  }
});

test('stable links and old index links survive reordering and title corrections', () => {
  const before = buildItemIndex(data);
  const reordered = { ...data,
    significantEvents: [...data.significantEvents].reverse(),
    discoveries: [...data.discoveries].reverse(),
    conferences: [...data.conferences].reverse(),
    scientists: Object.fromEntries(Object.entries(data.scientists).map(([key, scientist]) => [key, { ...scientist, publications: [...scientist.publications].reverse() }]))
  };
  const after = buildItemIndex(reordered);
  for (const record of before.records.values()) {
    assert.equal(after.resolve(record.key).item, record.type === 'scientist' ? reordered.scientists[record.scientistId] : record.item);
    if (record.item.legacyKey) assert.equal(after.resolve(record.item.legacyKey).key, record.key);
  }
  assert.notEqual(after.resolve('event:0').index, before.resolve('event:0').index);
});

test('duplicate identities and aliases fail before links can point at another record', () => {
  assert.throws(() => buildItemIndex({ discoveries: [{ id: 'x' }, { id: 'x' }] }), /Duplicate record/);
  assert.throws(() => buildItemIndex({ discoveries: [{ id: 'x', legacyKey: 'discovery:0' }, { id: 'y', legacyKey: 'discovery:0' }] }), /Duplicate legacy/);
});

test('mixed-case scientist keys retain their own publication aliases', () => {
  const index = buildItemIndex(data);
  assert.equal(index.resolve('publication:deBroglie:0').scientistId, 'deBroglie');
  assert.equal(index.resolve('publication:deBroglie:0').item.title, data.scientists.deBroglie.publications[0].title);
  for (const record of index.records.values()) {
    if (record.type === 'publication') assert.ok(record.item.legacyKey.startsWith(`publication:${record.scientistId}:`));
  }
  assert.throws(() => buildItemIndex({ scientists: { deBroglie: { publications: [{ id: 'bad', legacyKey: 'publication:compton:1' }] } } }), /another record/);
});
