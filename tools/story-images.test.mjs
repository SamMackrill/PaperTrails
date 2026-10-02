import test from 'node:test';
import assert from 'node:assert/strict';
import { loadStoryImage } from '../src/storyRenderer.js';

test('story art retries the same PNG master and settles a missing master', async () => {
  const original = globalThis.Image, requests = [];
  try {
    globalThis.Image = class {
      set src(value) {
        requests.push(value);
        queueMicrotask(() => value === 'approved-story.png' ? this.onload() : this.onerror());
      }
    };
    const drawing = await loadStoryImage('approved-story.webp');
    assert.ok(drawing);
    assert.deepEqual(requests, ['approved-story.webp', 'approved-story.png']);
    assert.equal(await loadStoryImage('approved-story.webp'), drawing);
    assert.equal(requests.length, 2);
    assert.equal(await loadStoryImage('missing-story.webp'), null);
    assert.deepEqual(requests.slice(2), ['missing-story.webp', 'missing-story.png']);
  } finally { globalThis.Image = original; }
});
