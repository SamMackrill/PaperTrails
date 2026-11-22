import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { layoutStory, foldStory, exposedStory, storyCamera, storyYearX } from '../src/storyLayout.js';
import {
  BOUNDARY_DIVIDER_ATLAS,
  DIVIDER_CROPS,
  detectBorderRailTrim,
  nativeAlignedBorderRect,
  boundarySpecs,
  fragmentEdgeFeathers,
  exposedFlatBoundaries,
  PANEL_BOUNDARIES
} from '../src/tapestryBoundaries.js';
import { layoutScientificBorder } from '../src/scientificBorders.js';
import { validateBoundaryDividers } from './boundary-dividers-artwork.mjs';
import { decodePngPixels } from './png-pixels.mjs';
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

  const cam1804 = storyCamera(1804, pose, viewport, bounds);
  const expected1804 = storyYearX(1804, pose) - viewport / 2;
  assert.ok(Math.abs(cam1804 - expected1804) < 1e-6, 'mid-timeline remains center-locked');
});

test('boundarySpecs covers all 11 panel joins and defaults unknown seams to a no-op', () => {
  const layout = layoutStory(events, 1280, 160);
  const specs = boundarySpecs(layout.panels, 160);
  assert.equal(specs.length, 11);
  assert.ok(BOUNDARY_DIVIDER_ATLAS.endsWith('.webp'));
  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i];
    assert.ok(PANEL_BOUNDARIES[spec.id], `explicit boundary config for ${spec.id}`);
    assert.equal(spec.sourceX, layout.panels[i + 1].sourceX);
    assert.ok(spec.leftFeatherPx >= 0 && spec.leftFeatherPx < 40);
    assert.ok(spec.rightFeatherPx >= 0 && spec.rightFeatherPx < 40);
    assert.ok(spec.halfWidthPx >= 0 && spec.halfWidthPx < 90);
    if (spec.motif) {
      assert.ok(DIVIDER_CROPS[spec.motif], `valid divider crop for ${spec.motif}`);
      assert.ok(spec.drawWidth > 20 && spec.drawHeight > 16);
    }
  }

  // Unknown future seams must default to a clean no-op (never a surprise tree).
  const synthetic = [
    { id: 'future-0', sourceX: 0, sourceWidth: 400 },
    { id: 'future-1', sourceX: 400, sourceWidth: 400 }
  ];
  const [unknownSpec] = boundarySpecs(synthetic, 160);
  assert.equal(unknownSpec.motif, null);
  assert.equal(unknownSpec.leftFeatherPx, 0);
  assert.equal(unknownSpec.rightFeatherPx, 0);
  assert.equal(unknownSpec.drawWidth, 0);
  assert.equal(unknownSpec.drawHeight, 0);
});

test('fragmentEdgeFeathers and exposedFlatBoundaries activate only at exposed panel seams', () => {
  const layout = layoutStory(events, 1200, 140);
  const specs = boundarySpecs(layout.panels, 140);

  const overview = foldStory(layout, 1200, 1);
  const overviewFragments = exposedStory(overview);
  assert.equal(exposedFlatBoundaries(overviewFragments, specs).length, 0);

  const flat = foldStory(layout, 1200, config.MAX_SCALE);
  const flatFragments = exposedStory(flat);
  const flatJoins = exposedFlatBoundaries(flatFragments, specs);
  assert.equal(flatJoins.length, 11);

  const openingPanel = layout.panels[0];
  const openingEndFrag = flatFragments.find(
    f => f.panel.id === openingPanel.id && Math.abs((f.sourceX + f.width) - (openingPanel.sourceX + openingPanel.sourceWidth)) < 1e-6
  );
  assert.ok(openingEndFrag);
  const edges = fragmentEdgeFeathers(openingEndFrag, specs);
  assert.equal(edges.leftFeather, 0);
  assert.ok(edges.rightFeather > 0);
});

test('nativeAlignedBorderRect preserves exact 1:1 source proportions and outer-edge alignment', () => {
  const layout = layoutStory(events, 1280, 160);
  const borders = layoutScientificBorder(layout);
  assert.equal(borders.length, 96);

  for (const border of borders) {
    const baseY = border.side === 'top' ? 0 : 200;
    const rect = nativeAlignedBorderRect(border, { trimTop: 8, trimBottom: 4 }, baseY);
    assert.equal(rect.srcX, border.crop.x);
    assert.equal(rect.srcW, border.crop.width);
    assert.equal(rect.destW, border.width);
    assert.ok(rect.srcY >= border.crop.y);
    assert.ok(rect.srcY + rect.srcH <= border.crop.y + border.crop.height);
    // Zero vertical distortion: destination aspect matches trimmed source aspect exactly.
    const srcAspect = rect.srcW / rect.srcH;
    const destAspect = rect.destW / rect.destH;
    assert.ok(Math.abs(destAspect - srcAspect) < 1e-9, `aspect distortion on ${border.id}: ${destAspect} vs ${srcAspect}`);
    // Align flush to the outer tapestry edge per docs/scientific-tapestry-borders.md.
    if (border.side === 'top') {
      assert.equal(rect.destY, baseY);
    } else {
      assert.ok(Math.abs((rect.destY + rect.destH) - (baseY + border.height)) < 1e-9);
    }
  }
});

test('detectBorderRailTrim measures real scientific border PNG pixels accurately across all 96 bands', () => {
  const layout = layoutStory(events, 1280, 160);
  const borders = layoutScientificBorder(layout);
  assert.equal(borders.length, 96);

  const decodedCache = new Map();
  const sampleBand = (border, cols = 48) => {
    const pngPath = border.file.replace(/\.webp$/, '.png');
    if (!decodedCache.has(pngPath)) {
      decodedCache.set(pngPath, decodePngPixels(readFileSync(new URL(`../${pngPath}`, import.meta.url))));
    }
    const img = decodedCache.get(pngPath);
    const h = border.crop.height;
    const out = new Uint8Array(cols * h * 4);
    for (let row = 0; row < h; row++) {
      const srcY = border.crop.y + row;
      for (let col = 0; col < cols; col++) {
        const srcX = Math.min(img.width - 1, Math.floor((col + 0.5) * (img.width / cols)));
        const si = (srcY * img.width + srcX) * img.channels;
        const di = (row * cols + col) * 4;
        out[di] = img.pixels[si];
        out[di + 1] = img.pixels[si + 1];
        out[di + 2] = img.pixels[si + 2];
        out[di + 3] = img.channels === 4 ? img.pixels[si + 3] : 255;
      }
    }
    return detectBorderRailTrim(out, cols, h);
  };

  const results = new Map();
  for (const border of borders) {
    const trim = sampleBand(border);
    assert.ok(trim.trimTop >= 0 && trim.trimBottom >= 0);
    assert.ok(border.crop.height - trim.trimTop - trim.trimBottom >= border.crop.height * 0.72,
      `over-trimmed real band ${border.id}: ${JSON.stringify(trim)} of ${border.crop.height}`);
    results.set(border.id, trim);
  }

  // Continuation rows with known inter-row top bleed are detected while tight primary rows stay minimal.
  assert.ok(results.get('eighteenthContinuation-1').trimTop >= 8, 'detects 11px top bleed on eighteenthContinuation-1');
  assert.ok(results.get('eighteenth-4').trimTop <= 2, 'keeps tight primary eighteenth-4 top rail intact');
  assert.ok(results.get('seventeenthContinuation-3').trimTop >= 5, 'detects top bleed on seventeenthContinuation-3');
  assert.ok(results.get('electronsContinuation-1').trimTop >= 6, 'detects top bleed on electronsContinuation-1');

  // Verify 1969 lunar seam keeps its bottom ground rail opaque (no bare-linen ground notch).
  const apolloJoin = PANEL_BOUNDARIES['modern-2->modern-3'];
  assert.equal(apolloJoin.leftFeather, 0);
  assert.ok(apolloJoin.rightFeatherBottomFrac > 0.9 && apolloJoin.rightFeatherBottomFrac < 1);
});

test('boundary divider atlas provenance and SHA-256 pixel hashes validate and reject tampering', () => {
  const summary = validateBoundaryDividers();
  assert.equal(summary.motifs, Object.keys(DIVIDER_CROPS).length);
  assert.equal(summary.joins, Object.keys(PANEL_BOUNDARIES).length);

  const record = JSON.parse(readFileSync(new URL('../images/tapestry/boundary-dividers-generation.json', import.meta.url), 'utf8'));
  const badHash = structuredClone(record);
  badHash.sourceHash = '0'.repeat(64);
  assert.throws(() => validateBoundaryDividers(badHash), /Unrecorded boundary divider atlas bytes/);

  const badMotif = structuredClone(record);
  badMotif.motifs['harbour-quay'].pixelHash = 'f'.repeat(64);
  assert.throws(() => validateBoundaryDividers(badMotif), /Stale boundary divider pixel hash/);
});
