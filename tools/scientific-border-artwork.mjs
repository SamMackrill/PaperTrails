// Validate the authored borders, their chronological assignments and exact
// generation provenance. Hashes detect asset reuse; visual review judges style.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { scientificBorderAtlases, scientificBorderSections, scientificBorderRows } from '../src/scientificBorders.js';
import { photographyBorderRevisions } from '../src/photographyBorders.js';
import { storyPanels, storyAtlases } from '../src/storyPanels.js';
import { config } from '../src/config.js';
import { decodePngPixels, cropPixelHash } from './png-pixels.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const read = file => readFileSync(resolve(root, file));
const hash = value => createHash('sha256').update(value).digest('hex');
const yaml = createRequire(import.meta.url)('../vendor/js-yaml.min.js');
const recordFile = 'images/tapestry/scientific-border-generation.json';
const geometryHash = () => hash(JSON.stringify({ scientificBorderAtlases, scientificBorderSections, photographyBorderRevisions, storyAtlases,
  sections: storyPanels.map(({ id, sheet, row }) => ({ id, sheet, row })), scheme: 'continuous-whole-rows-v1' }));

export function validateScientificBorders(record = JSON.parse(read(recordFile))) {
  const prompts = JSON.parse(read('images/tapestry/scientific-border-prompts.json'));
  if (record.geometryHash !== geometryHash()) throw new Error('Unrecorded scientific border geometry');
  const scientists = yaml.load(read('data/scientists.yaml').toString());
  const publications = new Map(Object.values(scientists).flatMap(s => (s.publications || []).map(p => [p.id, p])));
  const events = new Set(yaml.load(read('data/significantevents.yaml').toString()).map(event => event.id));
  const regions = new Set(), pixels = new Set();
  const decoded = new Map();
  for (const panel of storyPanels) {
    if (!scientificBorderSections[panel.id]) throw new Error(`Missing chronological border: ${panel.id}`);
    for (const side of ['top', 'bottom']) for (const { sheet, row, atlas, top, bottom } of scientificBorderRows(panel.id, side)) {
      const id = `${sheet}-${row}`, motif = record.ribbons.find(r => r.id === id);
      if (regions.has(id) || !motif || motif.section !== panel.id || motif.side !== side) throw new Error(`Repeated or misplaced border region: ${id}`);
      regions.add(id);
      if (motif.period[0] !== panel.from || motif.period[1] !== panel.to) throw new Error(`Wrong border period: ${id}`);
      if (!motif.description || !motif.primaryReferences.length || !/^[0-9a-f]{64}$/.test(motif.pixelHash) || pixels.has(motif.pixelHash)) throw new Error(`Missing or cloned scientific illustration: ${id}`);
      if (!decoded.has(atlas.file)) decoded.set(atlas.file, decodePngPixels(read(atlas.file.replace(/\.webp$/, '.png'))));
      const image = decoded.get(atlas.file);
      if (image.width !== atlas.width || image.height !== atlas.height) throw new Error(`Invalid border pixel dimensions: ${sheet}`);
      if (cropPixelHash(image, top, bottom) !== motif.pixelHash) throw new Error(`Stale scientific illustration pixel hash: ${id}`);
      pixels.add(motif.pixelHash);
      for (const author of motif.relatedScientists) if (!scientists[author]) throw new Error(`Unknown border scientist: ${author}`);
      for (const id of motif.relatedPublications) {
        const publication = publications.get(id);
        if (!publication || publication.year > (motif.period[1] ?? config.END_YEAR)) throw new Error(`Future or unknown border publication: ${id}`);
      }
      for (const id of motif.relatedEvents) if (!events.has(id)) throw new Error(`Unknown border context: ${id}`);
    }
  }
  if (record.ribbons.length !== regions.size) throw new Error('Unused or repeated ribbon inventory');
  for (const [sheet, atlas] of Object.entries(scientificBorderAtlases)) {
    const png = read(atlas.file.replace(/\.webp$/, '.png')), generation = record.sources[sheet];
    const prompt = prompts.groups.find(g => g.id === sheet);
    if (!generation?.transparent || png[25] !== 6) throw new Error(`Border master must retain RGBA thread transparency: ${sheet}`);
    if (png.readUInt32BE(16) !== atlas.width || png.readUInt32BE(20) !== atlas.height || atlas.bands.length !== 8) throw new Error(`Invalid border atlas: ${sheet}`);
    atlas.bands.forEach(([top, bottom], row) => {
      if (top < 0 || bottom <= top || bottom > atlas.height || (row && top < atlas.bands[row - 1][1])) throw new Error(`Invalid border crop: ${sheet}-${row}`);
    });
    if (!generation || generation.sourceHash !== hash(png) || generation.runtimeHash !== hash(read(atlas.file))
      || generation.promptHash !== hash(prompt.prompt) || generation.references.length !== prompt.references.length
      || generation.references.some((ref, i) => ref.file !== prompt.references[i] || ref.hash !== hash(read(ref.file)))) throw new Error(`Unrecorded border generation: ${sheet}`);
    const previous = generation.previousGeneration;
    if (!previous || previous.sourceHash !== hash(read(previous.sourceFile))
      || previous.runtimeHash !== hash(read(previous.runtimeFile))) throw new Error(`Changed border extraction source: ${sheet}`);
    if (prompt.correction && (generation.correctionPromptHash !== hash(prompt.correction.prompt)
      || generation.correctionReferenceHash !== hash(read(prompt.correction.reference)))) throw new Error(`Unrecorded border correction: ${sheet}`);
  }
  const additions = JSON.parse(read('images/tapestry/photography-border-generation.json'));
  for (const [id, revision] of Object.entries(photographyBorderRevisions)) {
    const generation = additions[id];
    const sourceFile = revision.file.replace(/\.webp$/, '.png'), png = read(sourceFile);
    if (!generation || generation.sourceFile !== sourceFile || generation.runtimeFile !== revision.file
      || generation.transparent !== true || png[25] !== 6
      || png.readUInt32BE(16) !== revision.width || png.readUInt32BE(20) !== revision.height
      || !generation.prompt || !generation.references?.length || generation.sourceHash !== hash(png)
      || generation.runtimeHash !== hash(read(revision.file)) || generation.promptHash !== hash(generation.prompt)
      || generation.references.some(ref => ref.hash !== hash(read(ref.file)))) throw new Error(`Unrecorded photography border: ${id}`);
    const initial = generation.initialGeneration;
    if (initial && (!initial.prompt || !initial.references?.length
      || initial.sourceHash !== hash(read(initial.sourceFile)) || initial.promptHash !== hash(initial.prompt)
      || initial.references.some(ref => ref.hash !== hash(read(ref.file)))
      || !generation.references.some(ref => ref.file === initial.sourceFile && ref.hash === initial.sourceHash))) {
      throw new Error(`Changed initial photography generation: ${id}`);
    }
    const discovery = yaml.load(read('data/discoveries.yaml').toString()).find(d => d.id === revision.milestoneId);
    if (!discovery || discovery.year !== revision.year) throw new Error(`Wrong photography milestone: ${id}`);
  }
  return { sources: Object.keys(scientificBorderAtlases).length + Object.keys(photographyBorderRevisions).length, distinctRibbons: regions.size, chronologicalSections: storyPanels.length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv[2] === 'record') {
      const record = JSON.parse(read(recordFile)), prompts = JSON.parse(read('images/tapestry/scientific-border-prompts.json'));
      record.geometryHash = geometryHash();
      for (const [sheet, atlas] of Object.entries(scientificBorderAtlases)) {
        const generation = record.sources[sheet], prompt = prompts.groups.find(g => g.id === sheet);
        generation.sourceHash = hash(read(atlas.file.replace(/\.webp$/, '.png')));
        generation.runtimeHash = hash(read(atlas.file)); generation.promptHash = hash(prompt.prompt);
        generation.references = prompt.references.map(file => ({ file, hash: hash(read(file)) }));
        if (prompt.correction) {
          generation.correctionPromptHash = hash(prompt.correction.prompt);
          generation.correctionReferenceHash = hash(read(prompt.correction.reference));
        }
      }
      writeFileSync(resolve(root, recordFile), JSON.stringify(record, null, 2) + '\n');
    } else if (process.argv[2] && process.argv[2] !== 'check') throw new Error('Usage: node tools/scientific-border-artwork.mjs [record|check]');
    console.log(validateScientificBorders());
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
