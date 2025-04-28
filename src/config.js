// Configuration object
export const config = {
  START_YEAR: 1600,
  CURRENT_YEAR: new Date().getFullYear(),
  MIN_SCALE: 0.2,
  MAX_SCALE: 5.0,
  ZOOM_STEP: 0.1,
  PHOTO_SIZE: 50,
  PUBLICATION_SIZE: 12,
  DISCOVERY_SIZE: 24,
  EVENT_BOX_HEIGHT: 30, // Added for consistency
  PHOTO_BASE_OFFSET_Y: 0.4,    // Increased fraction for more spread
  PHOTO_VERTICAL_STAGGER: 0.2,  // Increased fraction for more spread
  DISCOVERY_BASE_OFFSET_Y: 0.15, // Increased fraction for more spread
  EVENT_BASE_OFFSET_Y: 0.1,    // Increased fraction for more spread
  // Event Box Specific Configuration
  EVENT_TEXT_BASE_SIZE: 15,    // Base font size for event text
  EVENT_TEXT_LINE_HEIGHT: 1.2, // Line height multiplier for text wrapping
  EVENT_BOX_PADDING: 5,        // Padding inside the event box
  EVENT_VERTICAL_PADDING: 15,  // Vertical space between stacked boxes (Increased)
  // Timeline Height Configuration
  INITIAL_TIMELINE_HEIGHT: 600,
  MIN_TIMELINE_HEIGHT: 200,
  MAX_TIMELINE_HEIGHT: 1000,
  HEIGHT_STEP: 50, // Used for reset logic, potentially other steps
  // Other Configuration
  DRAG_THRESHOLD: 5,
  RESIZE_DEBOUNCE_DELAY: 250,
  themeLocalStorageKey: 'paperTrailsTheme',
};

// Calculate derived configuration values
config.END_YEAR = config.CURRENT_YEAR;
config.YEAR_SPAN = config.END_YEAR - config.START_YEAR;
