import { config } from './config.js'; // Import config if needed for data processing (not currently, but good practice)

export let scientists = {};
export let discoveries = [];
export let significantEvents = [];

async function loadYamlData(filePath, targetVariable, variableName) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const yamlText = await response.text();
        targetVariable = jsyaml.load(yamlText);
        console.log(`${variableName} data loaded:`, targetVariable);
        return targetVariable;
    } catch (error) {
        console.error(`Failed to load ${variableName} data:`, error);
        // Optionally: Display error to user
    }
}

// Updated functions to use the generic loader
async function loadScientistsData() {
    scientists = await loadYamlData('data/scientists.yaml', scientists, 'Scientists');
}

async function loadDiscoveriesData() {
    discoveries = await loadYamlData('data/discoveries.yaml', discoveries, 'Discoveries');
}

async function loadSignificantEventsData() {
    significantEvents = await loadYamlData('data/significantevents.yaml', significantEvents, 'Significant Events');
}

// Initializes all data and returns a promise that resolves when done
export async function initializeData() {
    await Promise.all([
        loadScientistsData(),
        loadDiscoveriesData(),
        loadSignificantEventsData()
    ]);
    // No longer calls renderTimeline here, the main script will handle that
}
