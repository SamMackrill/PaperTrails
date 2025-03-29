// Configuration object
export const config = {
  START_YEAR: 1650,
  CURRENT_YEAR: new Date().getFullYear(),
  MIN_SCALE: 0.2,
  MAX_SCALE: 5.0,
  ZOOM_STEP: 0.1,
  PHOTO_SIZE: 50,
  PUBLICATION_SIZE: 12,
  DISCOVERY_SIZE: 24, // Added for consistency
  EVENT_BOX_HEIGHT: 30, // Added for consistency
  PHOTO_BASE_OFFSET_Y: 70,
  PHOTO_VERTICAL_STAGGER: 40,
  DISCOVERY_BASE_OFFSET_Y: 50, // Added for consistency
  EVENT_BASE_OFFSET_Y: 30, // Added for consistency
  DRAG_THRESHOLD: 5,
  RESIZE_DEBOUNCE_DELAY: 250,
  themeLocalStorageKey: 'paperTrailsTheme',
};

// Calculate derived configuration values
config.END_YEAR = config.CURRENT_YEAR;
config.YEAR_SPAN = config.END_YEAR - config.START_YEAR;
