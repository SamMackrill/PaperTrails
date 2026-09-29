import test from 'node:test';
import assert from 'node:assert/strict';
import { buildResearchIndex } from '../src/researchModel.js';
const items = { records: new Map([['publication:a', {}], ['publication:b', {}]]) };
const sources = [{ label: 'Primary evidence', url: 'https://example.org/paper', locator: 'Section 2' }];
const relation = { id: 'a-b', from: 'publication:a', to: 'publication:b', kind: 'conceptual-bridge', claim: 'Editorial connection', sources };
const trail = { id: 'trail', title: 'Question', question: 'How?', stops: [
  { id: 'first', item: 'publication:a', claim: 'Claim', significance: 'Meaning', sources },
  { id: 'second', item: 'publication:b', claim: 'Claim', significance: 'Meaning', relation: 'a-b', sources }
] };

test('typed evidence and ordered trail stops resolve by stable identities', () => {
  const result = buildResearchIndex([relation], [trail], items);
  assert.equal(result.trailById.get('trail'), trail);
  assert.equal(result.byItem.get('publication:b')[0], relation);
});
test('unsupported claims and dangling or positional endpoints are rejected', () => {
  assert.throws(() => buildResearchIndex([{ ...relation, sources: [] }], [], items), /evidence/);
  assert.throws(() => buildResearchIndex([{ ...relation, to: 'publication:person:0' }], [], items), /stable/);
  assert.throws(() => buildResearchIndex([{ ...relation, sources: [{ ...sources[0], url: 'javascript:alert(1)' }] }], [], items), /HTTPS/);
  assert.throws(() => buildResearchIndex([relation], [{ ...trail, stops: [trail.stops[1], trail.stops[0]] }], items), /transition/);
  assert.throws(() => buildResearchIndex([relation], [{ ...trail, stops: [trail.stops[0], { ...trail.stops[1], relation: null }] }], items), /transition/);
});
test('real relation networks may have cycles; an editorial route remains explicit', () => {
  const back = { ...relation, id: 'b-a', from: relation.to, to: relation.from, kind: 'competing-theories' };
  assert.equal(buildResearchIndex([relation, back], [], items).relationById.size, 2);
});
