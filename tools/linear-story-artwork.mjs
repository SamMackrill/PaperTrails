// Exact generation calls and pixels for the shared-depiction Tapestry sources.
// Landscape retains the paired records in tapestry-artwork.mjs.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { storyAtlases, storyPanels, STORY_BODY_HEIGHT } from '../src/storyPanels.js';
import { scientificStoryRecords } from '../src/storyScience.js';
const root = fileURLToPath(new URL('../', import.meta.url));
const read = file => readFileSync(resolve(root, file));
const hash = value => createHash('sha256').update(value).digest('hex');
const recordFile = 'images/tapestry/linear-story-generation.json';
const yaml = createRequire(import.meta.url)('../vendor/js-yaml.min.js');

function geometryHash() {
  return hash(JSON.stringify({ storyAtlases, storyPanels, STORY_BODY_HEIGHT }));
}

export function validateLinearStory() {
  const record = JSON.parse(read(recordFile));
  if (record.geometryHash !== geometryHash()) throw new Error('Unrecorded linear story source geometry');
  if (record.referenceHash !== hash(read('images/tapestry/style-reference-bayeux.png'))) throw new Error('Changed Bayeux reference needs reviewed redraw');
  const events = yaml.load(read('data/significantevents.yaml').toString());
  const science = scientificStoryRecords(yaml.load(read('data/scientists.yaml').toString()), yaml.load(read('data/discoveries.yaml').toString()));
  if (science.length !== 2) throw new Error('Both settled comet records must resolve');
  const ids = new Set([...events, ...science].map(event => event.id));
  for (const panel of storyPanels) for (const [id, from, to] of panel.subjects) {
    if (!ids.has(id) || from < 0 || to <= from || to > 1) throw new Error(`Invalid story hotspot: ${panel.id}/${id}`);
  }
  for (const panel of storyPanels) panel.cameraAnchors.forEach(([year, fraction], index, anchors) => {
    if (year < panel.from || (panel.to !== null && year > panel.to) || fraction < 0 || fraction > 1
      || (index && (year <= anchors[index - 1][0] || fraction <= anchors[index - 1][1]))) throw new Error(`Invalid story camera: ${panel.id}`);
  });
  for (const event of events) if (!storyPanels.some(p => p.subjects.some(([id]) => id === event.id))) throw new Error(`Missing depicted record: ${event.id}`);
  for (const topic of science) if (!storyPanels.some(p => p.subjects.some(([id]) => id === topic.id))) throw new Error(`Missing depicted comet: ${topic.id}`);
  for (const [sheet, atlas] of Object.entries(storyAtlases)) {
    const master = atlas.file.replace(/\.webp$/, '.png'), png = read(master);
    if (png.readUInt32BE(16) !== atlas.width || png.readUInt32BE(20) !== atlas.height) throw new Error(`Invalid story master dimensions: ${sheet}`);
    for (const [top, bottom] of atlas.bodies) if (!(top >= 0 && bottom > top && bottom <= atlas.height && bottom - top <= STORY_BODY_HEIGHT)) throw new Error(`Invalid story body crop: ${sheet}`);
    const generation = record.sources[sheet];
    if (!generation?.transparent || png[25] !== 6) throw new Error(`Story master must retain RGBA thread transparency: ${sheet}`);
    if (!generation?.prompt || generation.sourceHash !== hash(png) || generation.runtimeHash !== hash(read(atlas.file))
      || generation.promptHash !== hash(generation.prompt)
      || generation.referenceHash !== hash(read(generation.reference))) throw new Error(`Unrecorded story generation: ${sheet}`);
    const previous = generation.previousGeneration;
    if (!previous || previous.sourceHash !== hash(read(previous.sourceFile))
      || previous.runtimeHash !== hash(read(previous.runtimeFile))) throw new Error(`Changed linen extraction source: ${sheet}`);
    if (previous.supportingReferences?.some(ref => ref.hash !== hash(read(ref.file)))) throw new Error(`Changed comet style reference: ${sheet}`);
    if (previous.initialEdit) {
      const prompts = JSON.parse(read('images/tapestry/halley-comet-prompts.json'));
      const group = prompts.groups.find(g => g.id === sheet), edit = previous.initialEdit;
      if (!group?.initialEdit || edit.promptHash !== hash(group.initialEdit.prompt)
        || edit.referenceHash !== hash(read(edit.reference)) || edit.sourceHash !== hash(read(previous.reference))) throw new Error(`Unrecorded initial comet edit: ${sheet}`);
    }
  }
  return { sources: Object.keys(storyAtlases).length, linearSections: storyPanels.length, records: events.length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if ((process.argv[2] || 'check') === 'record') {
      const record = JSON.parse(read(recordFile));
      record.geometryHash = geometryHash(); record.referenceHash = hash(read('images/tapestry/style-reference-bayeux.png'));
      for (const [sheet, atlas] of Object.entries(storyAtlases)) {
        const generation = record.sources[sheet];
        generation.sourceHash = hash(read(atlas.file.replace(/\.webp$/, '.png')));
        generation.runtimeHash = hash(read(atlas.file)); generation.promptHash = hash(generation.prompt);
        generation.referenceHash = hash(read(generation.reference));
      }
      writeFileSync(resolve(root, recordFile), JSON.stringify(record, null, 2) + '\n');
    } else if (process.argv[2] && process.argv[2] !== 'check') throw new Error('Usage: node tools/linear-story-artwork.mjs [record|check]');
    console.log(validateLinearStory());
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
