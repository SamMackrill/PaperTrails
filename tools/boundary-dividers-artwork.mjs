// Validate the Bayeux boundary divider atlas, motif crops, parent references
// and exact SHA-256 provenance records.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { BOUNDARY_DIVIDER_ATLAS, DIVIDER_CROPS, PANEL_BOUNDARIES } from '../src/tapestryBoundaries.js';
import { decodePngPixels } from './png-pixels.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = file => readFileSync(resolve(root, file));
const hash = value => createHash('sha256').update(value).digest('hex');
const recordFile = 'images/tapestry/boundary-dividers-generation.json';

function rectPixelHash(image, [x, y, width, height]) {
  const digest = createHash('sha256');
  const stride = image.width * image.channels;
  for (let row = y; row < y + height; row++) {
    const start = row * stride + x * image.channels;
    digest.update(image.pixels.subarray(start, start + width * image.channels));
  }
  return digest.digest('hex');
}

export function boundaryGeometryHash() {
  return hash(JSON.stringify({
    atlas: BOUNDARY_DIVIDER_ATLAS,
    crops: DIVIDER_CROPS,
    boundaries: PANEL_BOUNDARIES,
    scheme: 'bayeux-boundary-dividers-v1'
  }));
}

export function validateBoundaryDividers(record = JSON.parse(read(recordFile))) {
  const sourceFile = BOUNDARY_DIVIDER_ATLAS.replace(/\.webp$/, '.png');
  const png = read(sourceFile);
  const webp = read(BOUNDARY_DIVIDER_ATLAS);
  if (record.transparent !== true || png[25] !== 6) {
    throw new Error('Boundary divider master must retain RGBA thread transparency');
  }
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  if (record.dimensions?.width !== width || record.dimensions?.height !== height) {
    throw new Error(`Boundary divider dimensions mismatch: expected ${width}x${height}`);
  }
  if (record.sourceFile !== sourceFile || record.runtimeFile !== BOUNDARY_DIVIDER_ATLAS) {
    throw new Error('Boundary divider record paths mismatch runtime atlas');
  }
  if (record.sourceHash !== hash(png) || record.runtimeHash !== hash(webp)) {
    throw new Error('Unrecorded boundary divider atlas bytes');
  }
  if (record.geometryHash !== boundaryGeometryHash()) {
    throw new Error('Unrecorded boundary divider crop or seam geometry');
  }

  const decoded = decodePngPixels(png);
  const cropKeys = Object.keys(DIVIDER_CROPS);
  const motifEntries = record.motifs || {};
  if (Object.keys(motifEntries).length !== cropKeys.length) {
    throw new Error('Boundary divider motif inventory count mismatch');
  }
  const seenPixels = new Set();
  for (const key of cropKeys) {
    const crop = DIVIDER_CROPS[key];
    const [x, y, w, h] = crop;
    if (x < 0 || y < 0 || w <= 0 || h <= 0 || x + w > width || y + h > height) {
      throw new Error(`Boundary divider crop out of bounds: ${key}`);
    }
    const entry = motifEntries[key];
    if (!entry) throw new Error(`Missing boundary divider provenance entry: ${key}`);
    if (JSON.stringify(entry.crop) !== JSON.stringify(crop)) {
      throw new Error(`Boundary divider crop mismatch in provenance: ${key}`);
    }
    const pxHash = rectPixelHash(decoded, crop);
    if (!/^[0-9a-f]{64}$/.test(entry.pixelHash) || entry.pixelHash !== pxHash) {
      throw new Error(`Stale boundary divider pixel hash: ${key}`);
    }
    if (seenPixels.has(pxHash)) {
      throw new Error(`Duplicate boundary divider motif pixels: ${key}`);
    }
    seenPixels.add(pxHash);
    if (entry.origin === 'image-generator') {
      if (!entry.prompt || entry.promptHash !== hash(entry.prompt)) {
        throw new Error(`Missing or mismatched prompt hash for motif: ${key}`);
      }
    } else if (entry.origin === 'pixel-derived') {
      if (!Array.isArray(entry.parentSources) || !entry.parentSources.length) {
        throw new Error(`Missing parent source atlases for pixel-derived motif: ${key}`);
      }
      for (const ref of entry.parentSources) {
        if (!ref.file || ref.hash !== hash(read(ref.file))) {
          throw new Error(`Mismatched parent source hash for ${key}: ${ref.file}`);
        }
      }
    } else {
      throw new Error(`Unknown motif origin for ${key}: ${entry.origin}`);
    }
  }

  for (const [joinId, cfg] of Object.entries(PANEL_BOUNDARIES)) {
    if (cfg.motif && !DIVIDER_CROPS[cfg.motif]) {
      throw new Error(`Unknown divider motif ${cfg.motif} on join ${joinId}`);
    }
  }

  return {
    sourceFile,
    runtimeFile: BOUNDARY_DIVIDER_ATLAS,
    width,
    height,
    motifs: cropKeys.length,
    joins: Object.keys(PANEL_BOUNDARIES).length
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv[2] === 'record') {
      const record = JSON.parse(read(recordFile));
      const sourceFile = BOUNDARY_DIVIDER_ATLAS.replace(/\.webp$/, '.png');
      const png = read(sourceFile);
      const webp = read(BOUNDARY_DIVIDER_ATLAS);
      const decoded = decodePngPixels(png);
      record.sourceFile = sourceFile;
      record.runtimeFile = BOUNDARY_DIVIDER_ATLAS;
      record.dimensions = { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
      record.sourceHash = hash(png);
      record.runtimeHash = hash(webp);
      record.geometryHash = boundaryGeometryHash();
      for (const [key, crop] of Object.entries(DIVIDER_CROPS)) {
        const entry = record.motifs[key];
        entry.crop = crop;
        entry.pixelHash = rectPixelHash(decoded, crop);
        if (entry.origin === 'image-generator') {
          entry.promptHash = hash(entry.prompt);
        } else if (entry.origin === 'pixel-derived') {
          for (const ref of entry.parentSources) ref.hash = hash(read(ref.file));
        }
      }
      writeFileSync(resolve(root, recordFile), JSON.stringify(record, null, 2) + '\n');
    } else if (process.argv[2] && process.argv[2] !== 'check') {
      throw new Error('Usage: node tools/boundary-dividers-artwork.mjs [record|check]');
    }
    console.log(validateBoundaryDividers());
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
