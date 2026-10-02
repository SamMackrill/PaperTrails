// Validate the authored borders, their chronological assignments and exact
// generation provenance. Hashes detect asset reuse; visual review judges style.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { scientificBorderAtlases, scientificBorderSections, SCIENTIFIC_BORDER_HEIGHT } from '../src/scientificBorders.js';
import { storyPanels } from '../src/storyPanels.js';
import { config } from '../src/config.js';
const root = fileURLToPath(new URL('../', import.meta.url));
const read = file => readFileSync(resolve(root, file));
const hash = value => createHash('sha256').update(value).digest('hex');
const yaml = createRequire(import.meta.url)('../vendor/js-yaml.min.js');
const recordFile = 'images/tapestry/scientific-border-generation.json';
const geometryHash = () => hash(JSON.stringify({ scientificBorderAtlases, scientificBorderSections, SCIENTIFIC_BORDER_HEIGHT }));

export function validateScientificBorders() {
  const record = JSON.parse(read(recordFile));
  const prompts = JSON.parse(read('images/tapestry/scientific-border-prompts.json'));
  if (record.geometryHash !== geometryHash()) throw new Error('Unrecorded scientific border geometry');
  const scientists = yaml.load(read('data/scientists.yaml').toString());
  const publications = new Map(Object.values(scientists).flatMap(s => (s.publications || []).map(p => [p.id, p])));
  const events = new Set(yaml.load(read('data/significantevents.yaml').toString()).map(event => event.id));
  const regions = new Set(), pixels = new Set();
  for (const panel of storyPanels) {
    const [sheet, first] = scientificBorderSections[panel.id] || [];
    const atlas = scientificBorderAtlases[sheet];
    if (!atlas || first + 3 >= atlas.bands.length) throw new Error(`Missing chronological border: ${panel.id}`);
    for (let row = first; row < first + 4; row++) {
      const id = `${sheet}-${row}`, motif = record.ribbons.find(r => r.id === id);
      if (regions.has(id) || !motif || motif.section !== panel.id || motif.side !== (row < first + 2 ? 'top' : 'bottom')) throw new Error(`Repeated or misplaced border region: ${id}`);
      regions.add(id);
      if (motif.period[0] !== panel.from || motif.period[1] !== panel.to) throw new Error(`Wrong border period: ${id}`);
      if (!motif.description || !motif.primaryReferences.length || !/^[0-9a-f]{64}$/.test(motif.pixelHash) || pixels.has(motif.pixelHash)) throw new Error(`Missing or cloned scientific illustration: ${id}`);
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
    if (png.readUInt32BE(16) !== atlas.width || png.readUInt32BE(20) !== atlas.height || atlas.bands.length !== 8) throw new Error(`Invalid border atlas: ${sheet}`);
    atlas.bands.forEach(([top, bottom], row) => {
      if (top < 0 || bottom <= top || bottom > atlas.height || (row && top < atlas.bands[row - 1][1])) throw new Error(`Invalid border crop: ${sheet}-${row}`);
    });
    if (!generation || generation.sourceHash !== hash(png) || generation.runtimeHash !== hash(read(atlas.file))
      || generation.promptHash !== hash(prompt.prompt) || generation.references.length !== prompt.references.length
      || generation.references.some((ref, i) => ref.file !== prompt.references[i] || ref.hash !== hash(read(ref.file)))) throw new Error(`Unrecorded border generation: ${sheet}`);
  }
  return { sources: Object.keys(scientificBorderAtlases).length, distinctRibbons: regions.size, chronologicalSections: storyPanels.length };
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
      }
      writeFileSync(resolve(root, recordFile), JSON.stringify(record, null, 2) + '\n');
    } else if (process.argv[2] && process.argv[2] !== 'check') throw new Error('Usage: node tools/scientific-border-artwork.mjs [record|check]');
    console.log(validateScientificBorders());
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
