// Configuration object
export const config = {
  START_YEAR: 1650,
  CURRENT_YEAR: new Date().getFullYear(),
  MIN_SCALE: 0.2,
  MAX_SCALE: 5.0,
  ZOOM_STEP: 0.1,
  PHOTO_SIZE: 50,
  PUBLICATION_SIZE: 12,
  DISCOVERY_SIZE: 16, // Keep size as is for now
  EVENT_BOX_HEIGHT: 30, // Added for consistency
  PHOTO_BASE_OFFSET_Y: 0.4,    // Increased fraction for more spread
  PHOTO_VERTICAL_STAGGER: 0.2,  // Increased fraction for more spread
  DISCOVERY_BASE_OFFSET_Y: 0.15, // Increased fraction for more spread
  EVENT_BASE_OFFSET_Y: 0.1,    // Increased fraction for more spread
  DRAG_THRESHOLD: 5,
  RESIZE_DEBOUNCE_DELAY: 250,
  themeLocalStorageKey: 'paperTrailsTheme',
};

// Calculate derived configuration values
config.END_YEAR = config.CURRENT_YEAR;
config.YEAR_SPAN = config.END_YEAR - config.START_YEAR;
