import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { buildItemIndex } from '../src/itemIdentity.js';
import { buildResearchIndex } from '../src/researchModel.js';
const yaml = createRequire(import.meta.url)('../vendor/js-yaml.min.js');
const read = (name) => yaml.load(readFileSync(new URL(`../data/${name}.yaml`, import.meta.url), 'utf8'));
const items = buildItemIndex({ scientists: read('scientists'), discoveries: read('discoveries'), conferences: read('conferences'), significantEvents: read('significantevents') });

test('charge route resolves eight sourced stops and seven honest transitions', () => {
  const research = buildResearchIndex(read('relations'), read('trails'), items);
  const trail = research.trailById.get('understanding-charge');
  assert.equal(trail.stops.length, 8);
  assert.equal(research.relationById.size, 7);
  assert.equal([...research.relationById.values()].filter(r => r.kind === 'conceptual-bridge').length, 5);
  assert.equal(research.relationById.get('faraday-to-maxwell').kind, 'influence');
  assert.equal(research.relationById.get('maxwell-to-hertz').kind, 'prediction-test');
  const years = trail.stops.map(stop => items.resolve(stop.item).item.year);
  assert.deepEqual(years, [1751, 1785, 1832, 1846, 1873, 1888, 1897, 1913]);
  assert.match(trail.stops[1].dateNote, /printed in 1788/);
  assert.match(trail.stops[2].dateNote, /publication in 1832/);
  assert.match(trail.stops[6].significance, /does not separately determine/);
  assert.equal(items.resolve('discovery:39').key, 'discovery:millikan-oil-drops');
});
