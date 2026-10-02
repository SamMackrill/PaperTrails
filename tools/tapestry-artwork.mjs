// Prepare paired, fold-aware briefs; detect subject/reference drift in both styles.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { artworkStyles, tapestryScenes, getPanoramaStrip } from '../src/tapestryScenes.js';
const root = fileURLToPath(new URL('../', import.meta.url));
const yaml = createRequire(import.meta.url)('../vendor/js-yaml.min.js');
const read = file => readFileSync(resolve(root, file));
const events = () => yaml.load(read('data/significantevents.yaml').toString());
const hash = value => createHash('sha256').update(value).digest('hex');
const recordFile = 'images/tapestry/generation-records.json';
const records = () => existsSync(resolve(root, recordFile)) ? JSON.parse(read(recordFile)) : {};
const names = ['early', 'revolutions', 'modern', 'context-chapters', 'winter-eras'];
const cropHash = atlas => hash(JSON.stringify({ width: atlas.width, height: atlas.height, rows: atlas.rows }));

function subjects(index) {
  const atlas = artworkStyles.landscape.atlases[index];
  return [...tapestryScenes].filter(([, scene]) => index < 3
    ? scene.atlas === index : scene.customAtlas?.file === atlas.file)
    .map(([key, scene]) => ({ key, row: scene.row, facets: scene.facets,
      facetRange: scene.facetRange, continuationRange: scene.continuationRange,
      continuationSources: scene.continuationSources,
      scope: [
        ...events().flatMap(event => event.chapters?.filter(c => c.scene === key)
          || (event.title === key ? [{ startYear: event.startYear, endYear: event.endYear }] : [])),
        ...[...tapestryScenes].flatMap(([, source]) =>
          source.continuationSources?.filter(reference => reference.scene === key) || [])
      ] }));
}

export function drawingPlans() {
  const shared = 'Create ONE production atlas with the exact measured row count below. Keep five distinct action groups in consecutive fifths of each row; respect the supplied facet ranges and chronological scope. Native proportions must remain readable at 128px strip height. The first action group must work as a standalone folded summary: centre its identifying person/object within its first fifth, with clear linen around it, because only the central 112px is exposed at overview. Keep every later facet distinct: folds conceal/reveal fixed source pixels, and continuation crops use each facet at most once. Keep motifs away from row boundaries. No baked text, dates, numbers, watermark, UI or gore. Latin inscriptions are rendered in HTML in Tapestry mode without dates; Landscape uses English headings and dates. Retain historical accuracy, agency and dignity. Measure actual row and motif boundaries after generation and update the style registry. Preserve generated PNG bytes.';
  const treatment = {
    landscape: 'Match the approved current Landscape reference: softly coloured countryside and horizons, detailed expressive figures, fine illustrated outlines, muted ochre, madder, indigo and sage on linen. Maintain the existing Landscape visual language.',
    tapestry: 'Match the approved closest-to-Bayeux reference: mostly exposed pale linen, angular long-limbed profile figures, unfilled faces, emphatic fingers, coloured stem-stitch contours and flat laid-and-couched wool fills. Sparse symbolic objects and architecture, very little background, no perspective, painted shading, sepia wash or filled skies. Small animal/plant stitch borders stay within each row, clear of folded summary motifs. Use coloured threads rather than black ink. Do not copy the industrial subjects from the reference into unrelated rows.'
  };
  return Object.entries(artworkStyles).flatMap(([style, config]) => config.atlases.map((atlas, index) => {
    const topics = subjects(index);
    const rows = atlas.rows.map(([top, bottom, edges], row) => ({ row,
      measuredCrop: { top, bottom, edges },
      scenes: topics.filter(topic => topic.row === row) }));
    return { style, sheet: names[index], reference: config.reference,
      usage: style === 'tapestry' ? 'Archived per-event source recipe; current Tapestry uses linear-story-generation.json and tools/linear-story-artwork.mjs' : 'Current Landscape source recipe',
      output: style === 'tapestry' ? `images/tapestry/bayeux-${names[index]}.png` : atlas.file,
      runtime: atlas.file, redrawPending: Boolean(config.redrawPending),
      subjectsHash: hash(JSON.stringify(topics)),
      prompt: `${shared} ${treatment[style]} EXACTLY ${rows.length} ROWS TOP TO BOTTOM:\n${JSON.stringify(rows, null, 2)}` };
  }));
}

export function validateArtwork({ provenance = true } = {}) {
  const failures = [], manifest = records(), plans = drawingPlans();
  for (const event of events()) {
    const scenes = event.chapters?.map(chapter => chapter.scene) || [event.title];
    for (const key of scenes) {
      const scene = tapestryScenes.get(key);
      if (!scene) { failures.push(`Missing scene: ${key}`); continue; }
      for (const style of Object.keys(artworkStyles)) {
        const strip = getPanoramaStrip(scene, false, style);
        if (!(strip.width > 0 && strip.height > 0 && strip.edges.length >= 2)) failures.push(`Invalid ${style} crop: ${key}`);
      }
    }
  }
  for (const plan of plans) {
    const atlas = artworkStyles[plan.style].atlases[names.indexOf(plan.sheet)];
    const master = atlas.file.replace(/\.webp$/, '.png');
    if (!existsSync(resolve(root, atlas.file)) || !existsSync(resolve(root, master))) {
      failures.push(`Missing runtime/master: ${atlas.file}`); continue;
    }
    const png = read(master);
    if (png.readUInt32BE(16) !== atlas.width || png.readUInt32BE(20) !== atlas.height) failures.push(`Dimensions differ: ${master}`);
    let previous = 0;
    for (const [top, bottom, edges] of atlas.rows) {
      if (!(top >= previous && bottom > top && bottom <= atlas.height)
        || edges[0] !== 0 || edges.at(-1) !== atlas.width || edges.some((edge, i) => i && edge <= edges[i - 1])) failures.push(`Invalid boundaries: ${atlas.file}`);
      previous = bottom;
    }
    if (!existsSync(resolve(root, plan.reference))) { failures.push(`Missing reference: ${plan.reference}`); continue; }
    const key = `${plan.style}/${plan.sheet}`;
    if (provenance) {
      const expected = { subjectsHash: plan.subjectsHash, referenceHash: hash(read(plan.reference)),
        cropHash: cropHash(atlas),
        sourceHash: hash(png), runtimeHash: hash(read(atlas.file)), redrawPending: plan.redrawPending };
      if (Object.entries(expected).some(([field, value]) => manifest[key]?.[field] !== value)) failures.push(`Outdated/unrecorded ${key}: update both affected styles and record after review`);
    }
  }
  if (failures.length) throw new Error(failures.join('\n'));
  return { styles: Object.keys(artworkStyles), events: events().length, plans: plans.length };
}

export function validateRecordUpdate(old, record, { metadataOnly = false } = {}) {
  if (!old) return;
  const sameSource = old.sourceHash === record.sourceHash;
  const sameRuntime = old.runtimeHash === record.runtimeHash;
  if (metadataOnly && (!sameSource || !sameRuntime)) throw new Error('Metadata-only recording cannot change image bytes');
  if (old.referenceHash !== record.referenceHash && sameSource) throw new Error('Style reference changed without redrawing the artwork');
  if (old.subjectsHash !== record.subjectsHash && sameSource && !metadataOnly) {
    throw new Error('Drawing subjects changed without redrawing the artwork. Use --metadata-only only after reviewing a scope metadata correction.');
  }
}

function recordArtwork({ metadataOnly = false } = {}) {
  validateArtwork({ provenance: false });
  const previous = records(), next = {};
  for (const plan of drawingPlans()) {
    const key = `${plan.style}/${plan.sheet}`;
    const record = { subjectsHash: plan.subjectsHash, referenceHash: hash(read(plan.reference)),
      cropHash: cropHash(artworkStyles[plan.style].atlases[names.indexOf(plan.sheet)]),
      sourceHash: hash(read(plan.runtime.replace(/\.webp$/, '.png'))), runtimeHash: hash(read(plan.runtime)),
      redrawPending: plan.redrawPending };
    const old = previous[key];
    try { validateRecordUpdate(old, record, { metadataOnly }); }
    catch (error) { throw new Error(`${key}: ${error.message}. Update both affected styles before recording.`); }
    next[key] = record;
  }
  writeFileSync(resolve(root, recordFile), JSON.stringify(next, null, 2) + '\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const command = process.argv[2] || 'check';
    if (command === 'prompts') {
      writeFileSync(resolve(root, 'images/tapestry/drawing-prompts.json'), JSON.stringify(drawingPlans(), null, 2) + '\n');
      console.log('Prepared paired Landscape/archived event-atlas briefs. Current Tapestry shared depictions: linear-story-generation.json and tools/linear-story-artwork.mjs.');
    } else if (command === 'record') {
      if (process.argv[3] && process.argv[3] !== '--metadata-only') throw new Error('Unknown record option');
      recordArtwork({ metadataOnly: process.argv[3] === '--metadata-only' }); console.log(validateArtwork());
    }
    else if (command === 'check') console.log(validateArtwork());
    else throw new Error('Usage: node tools/tapestry-artwork.mjs [prompts|record [--metadata-only]|check]');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
