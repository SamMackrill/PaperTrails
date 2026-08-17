export let scientists = {};
export let discoveries = [];
export let significantEvents = [];

async function loadYamlData(filePath) {
  const response = await fetch(filePath);
  if (!response.ok) throw new Error(`Unable to load ${filePath} (${response.status})`);
  return jsyaml.load(await response.text());
}

async function loadScientistsData() {
  scientists = await loadYamlData('data/scientists.yaml');
}

async function loadDiscoveriesData() {
  discoveries = await loadYamlData('data/discoveries.yaml');
}

async function loadSignificantEventsData() {
  significantEvents = await loadYamlData('data/significantevents.yaml');
}

export async function initializeData() {
  await Promise.all([
    loadScientistsData(),
    loadDiscoveriesData(),
    loadSignificantEventsData()
  ]);
}
