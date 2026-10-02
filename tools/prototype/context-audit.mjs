import assert from 'node:assert/strict';

// Visible hit targets vary with the camera and folds. Canonical records and
// authored material must remain complete, even when their subjects are hidden.
export const storySnapshotExpression = `(() => {
  const ribbon = document.querySelector('.tapestry-story');
  if (!ribbon) return null;
  const scenes = [...ribbon.querySelectorAll('.tapestry-scene')];
  return {
    ready: ribbon.dataset.artReady, sections: Number(ribbon.dataset.linearPanels),
    keys: scenes.map(scene => scene.dataset.itemKey),
    visibleKeys: scenes.filter(scene => scene.dataset.artRendered === 'true').map(scene => scene.dataset.itemKey),
    height: ribbon.clientHeight, materialWidth: Number(ribbon.dataset.materialWidth),
    foldOpen: Number(ribbon.dataset.foldOpen),
    canvasWidth: ribbon.querySelector('.tapestry-story-canvas').width,
    viewportWidth: document.querySelector('#timeline-container').clientWidth
  };
})()`;

export function assertStorySnapshot(snapshot, expectedKeys, reference = null) {
  assert.ok(snapshot, 'continuous story ribbon exists');
  assert.equal(snapshot.ready, 'true', 'all narrative and border artwork loaded');
  assert.equal(snapshot.sections, 12, 'authored sections are separate from historical records');
  assert.deepEqual([...snapshot.keys].sort(), [...expectedKeys].sort(), 'every canonical target appears once');
  assert.ok(snapshot.visibleKeys.every(key => expectedKeys.includes(key)), 'visible subjects resolve to canonical targets');
  assert.ok(snapshot.height > 0 && snapshot.materialWidth > 0, 'fixed material has positive dimensions');
  assert.ok(snapshot.canvasWidth > 0 && snapshot.canvasWidth <= snapshot.viewportWidth * 2 + 2, 'canvas stays bounded by the viewport');
  if (reference) {
    assert.equal(snapshot.height, reference.height, 'zoom and pan retain context height');
    assert.equal(snapshot.materialWidth, reference.materialWidth, 'zoom and pan retain native source material');
  }
}
