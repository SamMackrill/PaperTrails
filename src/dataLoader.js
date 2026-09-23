export let scientists = {};
export let discoveries = [];
export let conferences = [];
export let significantEvents = [];
// Scientist id -> the discoveries, conferences, and events that name them.
export let scientistRelations = new Map();

const DATA_VERSION = '18';

// The loader intentionally parses only repository-owned, same-origin YAML files.
// Treat that static deployment boundary as trusted and immutable; this is not a
// parser entry point for user-controlled or remote YAML.
async function loadYamlData(filePath) {
  const response = await fetch(`${filePath}?v=${DATA_VERSION}`, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Unable to load ${filePath} (${response.status})`);
  return jsyaml.load(await response.text());
}

async function loadScientistsData() {
  scientists = await loadYamlData('data/scientists.yaml');
}

async function loadDiscoveriesData() {
  discoveries = await loadYamlData('data/discoveries.yaml');
}

async function loadConferencesData() {
  conferences = await loadYamlData('data/conferences.yaml');
}

async function loadSignificantEventsData() {
  significantEvents = await loadYamlData('data/significantevents.yaml');
}

const ids = (value) => (Array.isArray(value) ? value : []);

// Builds the reverse links that the YAML only records in one direction. A
// person keeps their first role for each item, so callers list primary roles
// (discoverer, attendee) before secondary ones (theorist).
export function buildScientistRelations(scientistData, discoveryData, conferenceData, eventData) {
  const relations = new Map();
  const add = (scientistId, collection, index, role) => {
    if (!scientistData[scientistId]) return;
    if (!relations.has(scientistId)) relations.set(scientistId, { discoveries: [], conferences: [], events: [] });
    const list = relations.get(scientistId)[collection];
    if (!list.some((entry) => entry.index === index)) list.push({ index, role });
  };
  ids(discoveryData).forEach((discovery, index) => {
    ids(discovery.scientist_ids).forEach((id) => add(id, 'discoveries', index, 'Discoverer'));
    ids(discovery.theorist_ids).forEach((id) => add(id, 'discoveries', index, 'Theorist'));
  });
  ids(conferenceData).forEach((conference, index) => {
    ids(conference.attendee_ids).forEach((id) => add(id, 'conferences', index, 'Attendee'));
    ids(conference.theorist_ids).forEach((id) => add(id, 'conferences', index, 'Theorist'));
  });
  ids(eventData).forEach((event, index) => {
    ids(event.attendee_ids).forEach((id) => add(id, 'events', index, 'Participant'));
  });
  return relations;
}

// The items directly connected to a timeline item, as item keys. `line` marks
// the connections worth drawing; publications are highlighted instead.
export function getRelatedItems(key) {
  const [type, id, extra] = String(key || '').split(':');
  const scientistEntries = (list) => ids(list).filter((scientistId) => scientists[scientistId])
    .map((scientistId) => ({ key: `scientist:${scientistId}`, line: true }));
  const publicationsOf = (scientistId) => ids(scientists[scientistId]?.publications)
    .map((_, index) => ({ key: `publication:${scientistId}:${index}`, line: false }));

  if (type === 'scientist') {
    const relations = scientistRelations.get(id) || { discoveries: [], conferences: [], events: [] };
    return [
      ...publicationsOf(id),
      ...relations.discoveries.map(({ index }) => ({ key: `discovery:${index}`, line: true })),
      ...relations.conferences.map(({ index }) => ({ key: `conference:${index}`, line: true })),
      ...relations.events.map(({ index }) => ({ key: `event:${index}`, line: true }))
    ];
  }
  if (type === 'publication') {
    return [{ key: `scientist:${id}`, line: false }, ...publicationsOf(id).filter((entry) => entry.key !== `publication:${id}:${extra}`)];
  }
  if (type === 'discovery') {
    const discovery = discoveries[Number(id)];
    return scientistEntries([...ids(discovery?.scientist_ids), ...ids(discovery?.theorist_ids)]);
  }
  if (type === 'conference') {
    const conference = conferences[Number(id)];
    return scientistEntries([...ids(conference?.attendee_ids), ...ids(conference?.theorist_ids)]);
  }
  if (type === 'event') {
    return scientistEntries(significantEvents[Number(id)]?.attendee_ids);
  }
  return [];
}

export async function initializeData() {
  await Promise.all([
    loadScientistsData(),
    loadDiscoveriesData(),
    loadConferencesData(),
    loadSignificantEventsData()
  ]);
  scientistRelations = buildScientistRelations(scientists, discoveries, conferences, significantEvents);
}
