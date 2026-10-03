import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { getScientistAnchor } from '../src/scientistAnchor.js';
import { formatScientistYear, parseScientistYear } from '../src/scientistDates.js';
const yaml = createRequire(import.meta.url)('../vendor/js-yaml.min.js');

test('listed publications keep their original anchor despite earlier discoveries', () => {
  const scientist = { publications: [{ year: 1738, title: 'Later' }, { year: 1708, title: 'Earlier' }] };
  const discoveries = [{ year: 1690, scientist_ids: ['molyneux'] }];
  assert.deepEqual(getScientistAnchor('molyneux', scientist, discoveries), { type: 'publication', year: 1708, title: 'Earlier' });
  assert.deepEqual(scientist.publications.map(p => p.year), [1738, 1708]);
});

test('paperless anchors use explicit links and valid years rather than nearby names', () => {
  const discoveries = [
    { year: 1500, discoverer: 'Lilius', scientist_ids: ['other'] },
    { year: NaN, scientist_ids: ['lilius'] },
    { year: 1582, title: 'Calendar reform', scientist_ids: ['lilius'] },
    { year: 1577, title: 'Theory', theorist_ids: ['lilius'] }
  ];
  assert.deepEqual(getScientistAnchor('lilius', { publications: [] }, discoveries), { type: 'discovery', year: 1577, title: 'Theory' });
  assert.equal(getScientistAnchor('unlinked', { publications: [] }, discoveries), null);
});

test('paperless conference attendees get the earliest linked milestone without fabricating work', () => {
  const scientist = { publications: [{ year: '1900' }] };
  const conferences = [{ year: 1900, title: 'Congress', attendee_ids: ['cornu'] }];
  assert.deepEqual(getScientistAnchor('cornu', scientist, [], conferences), { type: 'conference', year: 1900, title: 'Congress' });
  assert.equal(scientist.publications.length, 1);
});

test('actual paperless profiles anchor at their discoveries with empty publication lists', () => {
  const read = name => yaml.load(readFileSync(new URL(`../data/${name}.yaml`, import.meta.url), 'utf8'));
  const scientists = read('scientists'), discoveries = read('discoveries'), conferences = read('conferences');
  for (const [id, year] of [['lilius', 1582], ['palitzsch', 1758]]) {
    assert.deepEqual(scientists[id].publications, []);
    assert.equal(getScientistAnchor(id, scientists[id], discoveries, conferences)?.year, year);
    assert.equal(getScientistAnchor(id, scientists[id], discoveries, conferences)?.type, 'discovery');
  }
});

test('partial and approximate dates preserve precision without inventing a day', () => {
  for (const [date, year, label] of [['1723-06-11', 1723, '1723'], ['1510', 1510, '1510'], ['c. 1510', 1510, 'c. 1510'], ['c.1576', 1576, 'c. 1576']]) {
    assert.equal(parseScientistYear(date), year);
    assert.equal(formatScientistYear(date), label);
  }
  for (const date of ['', undefined, 'unknown', '1510something', '1510-13']) {
    assert.equal(parseScientistYear(date), null);
    assert.equal(formatScientistYear(date), null);
  }
});
