import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { layoutStory, storyFocus } from '../src/storyLayout.js';
import { yearToX, setScaleMode } from '../src/timeScale.js?v=3';
const yaml = createRequire(import.meta.url)('../vendor/js-yaml.min.js');
const events = yaml.load(readFileSync(new URL('../data/significantevents.yaml', import.meta.url), 'utf8'));

test('key narrative subjects remain complete at overview and expose more groups with zoom', () => {
  const overview = layoutStory(events, 1280, 140);
  const detail = layoutStory(events, 1280 * 8, 140);
  for (const title of ['Reign of Napoleon', 'World War I', 'World War II', 'Cold War', 'Carrington Event']) {
    const subject = overview.subjects.find(s => s.event.title === title && s.focus);
    assert.ok(subject, title);
    assert.equal(subject.facet, storyFocus.get(title));
    assert.ok(subject.width >= 50 && subject.height > 15, title);
  }
  assert.ok(overview.subjects.some(s => s.climate));
  assert.ok(overview.subjects.some(s => s.chapter.scene === 'industry-steam' && s.facet === 0));
  assert.ok(detail.subjects.length > overview.subjects.length);
  for (const subject of detail.subjects) {
    assert.ok(Math.abs(subject.width / subject.crop.width - subject.height / subject.crop.height) < 1e-10);
    assert.ok(subject.left >= 0 && subject.left + subject.width <= 1280 * 8 + 1e-8);
  }
});

test('Carrington and the telegraph network share the composition without changing dates', () => {
  const { records, subjects } = layoutStory(events, 1280, 140);
  const carrington = records.find(r => r.event.title === 'Carrington Event');
  const network = records.find(r => r.event.title === 'Electric telegraph networks');
  assert.equal(carrington.anchor, carrington.end);
  assert.equal(carrington.anchor, yearToX(1859, 1280));
  assert.ok(network.anchor < carrington.anchor && network.end > carrington.end);
  assert.ok(subjects.some(s => s.event === network.event && s.facet === 2));
  assert.ok(subjects.some(s => s.event === carrington.event && s.facet === 2));
});

test('story date anchors follow both chronological scales', () => {
  try {
    for (const mode of ['linear', 'density']) {
      setScaleMode(mode, events.map(e => e.startYear));
      const { records } = layoutStory(events, 4000, 140);
      for (const record of records) {
        assert.equal(record.anchor, yearToX(record.event.startYear, 4000));
        assert.equal(record.end, yearToX(record.event.endYear, 4000));
      }
    }
  } finally { setScaleMode('linear'); }
});
