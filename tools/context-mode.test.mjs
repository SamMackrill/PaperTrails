import test from 'node:test';
import assert from 'node:assert/strict';
import { CONTEXT_MODES, nextContextMode, savedContextMode } from '../src/contextMode.js';
import { formatHash, parseHash } from '../src/urlState.js';
import { drawingPlans, validateArtwork } from './tapestry-artwork.mjs';

test('context cycles Bars, Landscape, Tapestry and back to Bars', () => {
  let mode = 'bars';
  const sequence = Array.from({ length: 4 }, () => { const current = mode; mode = nextContextMode(mode); return current; });
  assert.deepEqual(sequence, ['bars', 'landscape', 'tapestry', 'bars']);
});

test('saved modes take precedence over the migrated on/off preference', () => {
  const storage = values => ({ getItem: key => values[key] ?? null });
  for (const mode of CONTEXT_MODES) assert.equal(savedContextMode(storage({ paperTrailsContextMode: mode, paperTrailsTapestry: 'false' })), mode);
  assert.equal(savedContextMode(storage({ paperTrailsTapestry: 'false' })), 'bars');
  assert.equal(savedContextMode(storage({ paperTrailsTapestry: 'true' })), 'landscape');
  assert.equal(savedContextMode(storage({ paperTrailsContextMode: 'invalid' })), 'landscape');
  assert.equal(savedContextMode({ getItem() { throw new Error('Storage disabled'); } }), 'landscape');
});

test('shared links preserve all three modes and still read legacy links', () => {
  for (const contextMode of CONTEXT_MODES) {
    const hash = formatHash({ contextMode, tapestry: true, from: 1800, to: 1900, hidden: ['context'] });
    assert.equal(parseHash(hash).contextMode, contextMode);
    assert.equal(parseHash(hash).tapestry, null, 'new links have a single authoritative mode');
    assert.deepEqual(parseHash(hash).hidden, ['context']);
  }
  assert.equal(parseHash('#tapestry=0').tapestry, false);
  assert.equal(parseHash('#tapestry=1').tapestry, true);
  assert.equal(parseHash('#context=unknown').contextMode, null);
});

test('both drawing briefs cover the same events and runtime assets are current', () => {
  assert.deepEqual(validateArtwork(), { styles: ['landscape', 'tapestry'], events: 25, plans: 10 });
  const plans = drawingPlans();
  assert.equal(plans.length, 10);
  for (let index = 0; index < 5; index++) {
    assert.equal(plans[index].subjectsHash, plans[index + 5].subjectsHash);
    assert.notEqual(plans[index].output, plans[index + 5].output);
  }
});
