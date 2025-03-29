import { config } from './config.js'; // Import config if needed for data processing (not currently, but good practice)

export let scientists = {};
export let discoveries = [];
export let significantEvents = [];

async function loadScientistsData() {
    try {
        const response = await fetch('data/scientists.yaml');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const yamlText = await response.text();
        scientists = jsyaml.load(yamlText);
        console.log("Scientists data loaded:", scientists);
    } catch (error) {
        console.error('Failed to load scientists data:', error);
        // Optionally: Display error to user
    }
}

async function loadDiscoveriesData() {
    try {
        const response = await fetch('data/discoveries.yaml');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const yamlText = await response.text();
        discoveries = jsyaml.load(yamlText);
        console.log("Discoveries data loaded:", discoveries);
    } catch (error) {
        console.error('Failed to load discoveries data:', error);
        // Optionally: Display error to user
    }
}

async function loadSignificantEventsData() {
    try {
        const response = await fetch('data/significantevents.yaml');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const yamlText = await response.text();
        significantEvents = jsyaml.load(yamlText);
        console.log("Significant events data loaded:", significantEvents);
    } catch (error) {
        console.error('Failed to load significant events data:', error);
        // Optionally: Display error to user
    }
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
