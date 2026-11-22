import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { layoutStory, foldStory, exposedStory, storyCamera, storyYearX } from '../src/storyLayout.js';
import { BOUNDARY_DIVIDER_ATLAS, DIVIDER_CROPS, boundarySpecs, fragmentEdgeFeathers, exposedFlatBoundaries, PANEL_BOUNDARIES } from '../src/tapestryBoundaries.js';
import { xToYear } from '../src/timeScale.js?v=3';
import { config } from '../src/config.js?v=16';

const yaml = createRequire(import.meta.url)('../vendor/js-yaml.min.js');
const events = yaml.load(readFileSync(new URL('../data/significantevents.yaml', import.meta.url), 'utf8'));

test('storyCamera moves immediately from 1400 at full zoom with no 1400-1460 dead zone', () => {
  const viewport = 1200;
  const width = viewport * config.MAX_SCALE;
  const layout = layoutStory(events, width, 140);
  const pose = foldStory(layout, viewport, config.MAX_SCALE);
  const bounds = {
    startYear: xToYear(viewport / 2, width),
    endYear: xToYear(width - viewport / 2, width)
  };

  let prev = storyCamera(bounds.startYear, pose, viewport, bounds);
  assert.equal(prev, 0, 'camera starts cleanly at 0 when viewport left edge is 1400');

  // Step through every 2 years from 1400 across the entire timeline and verify
  // strict positive motion from the very first pan step (zero 1400-1460 freeze).
  const cam1405 = storyCamera(bounds.startYear + 5, pose, viewport, bounds);
  const cam1420 = storyCamera(bounds.startYear + 20, pose, viewport, bounds);
  const cam1460 = storyCamera(bounds.startYear + 60, pose, viewport, bounds);
  assert.ok(cam1405 > 10, `expected immediate motion 5 years past 1400, got ${cam1405}`);
  assert.ok(cam1420 > cam1405 + 40, `expected continued motion at 1420, got ${cam1420}`);
  assert.ok(cam1460 > cam1420 + 80, `expected smooth progress through 1460, got ${cam1460}`);

  for (let worldLeft = 24; worldLeft <= width - viewport; worldLeft += 96) {
    const year = xToYear(worldLeft + viewport / 2, width);
    const cam = storyCamera(year, pose, viewport, bounds);
    assert.ok(cam > prev, `camera must increase monotonically at year=${year.toFixed(1)} (${cam} <= ${prev})`);
    prev = cam;
  }

  const endCam = storyCamera(bounds.endYear, pose, viewport, bounds);
  assert.ok(Math.abs(endCam - (pose.width - viewport)) < 1e-6, 'camera reaches exact right cloth edge at END_YEAR');

  // Mid-timeline anchors remain exact center-locked.
  const cam1804 = storyCamera(1804, pose, viewport, bounds);
  const expected1804 = storyYearX(1804, pose) - viewport / 2;
  assert.ok(Math.abs(cam1804 - expected1804) < 1e-6, 'mid-timeline remains center-locked');
});

test('boundarySpecs covers all 11 panel joins with bounded feathers and valid motifs', () => {
  const layout = layoutStory(events, 1280, 160);
  const specs = boundarySpecs(layout.panels, 160);
  assert.equal(specs.length, 11);
  assert.ok(BOUNDARY_DIVIDER_ATLAS.endsWith('.webp'));
  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i];
    assert.ok(PANEL_BOUNDARIES[spec.id], `explicit boundary config for ${spec.id}`);
    assert.equal(spec.sourceX, layout.panels[i + 1].sourceX);
    assert.ok(spec.leftFeatherPx > 0 && spec.leftFeatherPx < 40);
    assert.ok(spec.rightFeatherPx > 0 && spec.rightFeatherPx < 40);
    assert.ok(spec.halfWidthPx > 0 && spec.halfWidthPx < 60);
    if (spec.motif) {
      assert.ok(DIVIDER_CROPS[spec.motif], `valid divider crop for ${spec.motif}`);
      assert.ok(spec.drawWidth > 20 && spec.drawHeight > 100);
    }
  }
});

test('fragmentEdgeFeathers and exposedFlatBoundaries activate only at exposed panel seams', () => {
  const layout = layoutStory(events, 1200, 140);
  const specs = boundarySpecs(layout.panels, 140);

  // At overview (1x), panel seams are folded behind pleats so no flat joins exist.
  const overview = foldStory(layout, 1200, 1);
  const overviewFragments = exposedStory(overview);
  assert.equal(exposedFlatBoundaries(overviewFragments, specs).length, 0);

  // At full zoom (32x), all 11 panel joins are exposed flat.
  const flat = foldStory(layout, 1200, config.MAX_SCALE);
  const flatFragments = exposedStory(flat);
  const flatJoins = exposedFlatBoundaries(flatFragments, specs);
  assert.equal(flatJoins.length, 11);

  // Only fragments touching a panel's outer edge receive non-zero edge feathers.
  const openingPanel = layout.panels[0];
  const openingEndFrag = flatFragments.find(
    f => f.panel.id === openingPanel.id && Math.abs((f.sourceX + f.width) - (openingPanel.sourceX + openingPanel.sourceWidth)) < 1e-6
  );
  assert.ok(openingEndFrag);
  const edges = fragmentEdgeFeathers(openingEndFrag, specs);
  assert.equal(edges.leftFeather, 0);
  assert.ok(edges.rightFeather > 0);
});
