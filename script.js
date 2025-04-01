// Import necessary modules and functions
import { config } from './src/config.js';
import { initializeData } from './src/dataLoader.js';
import { initializeTheme } from './src/themeManager.js';
import { setupModalEventListeners } from './src/modalManager.js';
import { renderTimeline } from './src/timelineRenderer.js';

// DOM Elements (fetched in initializeApp or modules)
let timelineContainer, timeline, zoomLevelDisplay, scientistTooltip,
    zoomSlider, heightSlider, resetViewButton; // Changed button names

// State Variables for Timeline Interaction
const INITIAL_TIMELINE_HEIGHT = 600; // Set default height to 600px
const MIN_TIMELINE_HEIGHT = 200;
const MAX_TIMELINE_HEIGHT = 800;
const HEIGHT_STEP = 50; // Keep for potential future use? Or remove? Let's keep for reset logic.
let currentTimelineHeight = INITIAL_TIMELINE_HEIGHT;
let currentScale = 1.0;
let currentTranslateX = 0;
let currentTranslateY = 0;
let isDragging = false;
let potentialDrag = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartTranslateX = 0;
let dragStartTranslateY = 0;
let resizeTimer;

// --- Timeline Interaction State & Logic ---

// Helper function to map slider value (0-100) to a range
function mapSliderValue(value, min, max) {
    // Simple linear mapping for now
    return min + (max - min) * (value / 100);
}

// Helper function to map a value in a range back to a slider value (0-100)
function mapValueToSlider(value, min, max) {
    if (max - min === 0) return 50; // Avoid division by zero, default to middle
    return Math.round(((value - min) / (max - min)) * 100);
}


// Helper function to update timeline transform (pan/zoom)
function updateTimelineTransform() {
  // Ensure critical elements are available
  if (!timeline || !zoomLevelDisplay || !timelineContainer) {
    console.error("Timeline, container or zoom display element missing during transform update.");
    return;
  }
  // Ensure dimensions are valid before calculations
  const containerWidth = timelineContainer.clientWidth;
  const containerHeight = timelineContainer.clientHeight;
  const timelineCurrentWidth = timeline.offsetWidth;
  const timelineCurrentHeight = timeline.offsetHeight; // Use offsetHeight

  if (timelineCurrentWidth === 0 || timelineCurrentHeight === 0 || containerWidth === 0 || containerHeight === 0) {
     // Update display even if dimensions are zero, but don't transform
     zoomLevelDisplay.textContent = `${Math.round(currentScale * 100)}%`;
     console.warn("Timeline or container dimensions are zero during transform update.");
     return;
  }

  const timelineScaledWidth = timelineCurrentWidth * currentScale;
  const timelineScaledHeight = timelineCurrentHeight * currentScale;

  // Clamp X translation
  let clampedTranslateX = currentTranslateX;
  if (timelineScaledWidth <= containerWidth) {
    // If timeline fits horizontally, center it or reset to 0
    clampedTranslateX = (containerWidth - timelineScaledWidth) / 2; // Center
    // clampedTranslateX = 0; // Align left
  } else {
    // If timeline is wider, clamp translation within bounds
    const maxTranslateX = 0; // Left edge cannot go past container left edge
    const minTranslateX = containerWidth - timelineScaledWidth; // Right edge cannot go past container right edge
    clampedTranslateX = Math.max(minTranslateX, Math.min(maxTranslateX, currentTranslateX));
  }
  currentTranslateX = clampedTranslateX;

  // Clamp Y translation
  let clampedTranslateY = currentTranslateY;
  if (timelineScaledHeight <= containerHeight) {
    // If timeline fits vertically, center it or reset to 0
     clampedTranslateY = (containerHeight - timelineScaledHeight) / 2; // Center
    // clampedTranslateY = 0; // Align top
  } else {
    // If timeline is taller, clamp translation within bounds
    const maxTranslateY = 0; // Top edge cannot go past container top edge
    const minTranslateY = containerHeight - timelineScaledHeight; // Bottom edge cannot go past container bottom edge
    clampedTranslateY = Math.max(minTranslateY, Math.min(maxTranslateY, currentTranslateY));
  }
  currentTranslateY = clampedTranslateY;

  // Apply transform using requestAnimationFrame for smoother rendering
  const transformString = `translateX(${currentTranslateX}px) translateY(${currentTranslateY}px) scale(${currentScale})`;
  const inverseScale = 1 / currentScale; // Calculate inverse scale for counter-scaling elements

  requestAnimationFrame(() => {
      if (timeline) { // Check if timeline still exists
        timeline.style.transform = transformString;
        timeline.style.setProperty('--current-inverse-scale', inverseScale); // Set CSS variable for fixed-size elements
        timeline.style.setProperty('--current-scale', currentScale); // Set CSS variable for normal scale
      }
  });

  // Update zoom level display immediately
  zoomLevelDisplay.textContent = `${Math.round(currentScale * 100)}%`;
}


// --- Event Listeners Setup Function ---
// Sets up listeners for interactions like zoom, pan, resize
function setupEventListeners() {
    // Fetch elements needed *only* for these listeners
    timelineContainer = document.getElementById('timeline-container');
    zoomSlider = document.getElementById('zoom-slider'); // Get sliders
    heightSlider = document.getElementById('height-slider');
    resetViewButton = document.getElementById('reset-view'); // Get reset button
    // Note: Modal close buttons are handled by modalManager.setupModalEventListeners()
    // Note: Theme toggle button is handled by themeManager.initializeTheme()

    if (!timelineContainer || !zoomSlider || !heightSlider || !resetViewButton ) {
        console.error("Cannot setup interaction event listeners: Core elements missing.");
        return;
    }

    // Wheel listener for zoom (Ctrl+Wheel) and pan (Wheel or Shift+Wheel)
    timelineContainer.addEventListener('wheel', (event) => {
        event.preventDefault();
        const rect = timelineContainer.getBoundingClientRect();
        const mouseXRelative = event.clientX - rect.left; // Mouse X relative to container
        const mouseYRelative = event.clientY - rect.top;  // Mouse Y relative to container

        if (event.ctrlKey) { // Zoom centered on mouse pointer
            const zoomFactor = event.deltaY < 0 ? (1 + config.ZOOM_STEP) : (1 - config.ZOOM_STEP);
            const newScale = Math.max(config.MIN_SCALE, Math.min(config.MAX_SCALE, currentScale * zoomFactor));

            if (newScale !== currentScale) {
                const scaleChange = newScale / currentScale;
                // Adjust translate to keep the point under the mouse stationary
                currentTranslateX = mouseXRelative - (mouseXRelative - currentTranslateX) * scaleChange;
                currentTranslateY = mouseYRelative - (mouseYRelative - currentTranslateY) * scaleChange;
                currentScale = newScale;
                updateTimelineTransform();
                // Update slider position after zoom
                zoomSlider.value = mapValueToSlider(currentScale, config.MIN_SCALE, config.MAX_SCALE);
            }
        } else if (event.shiftKey) { // Horizontal pan
            const scrollAmount = event.deltaX || event.deltaY; // Use deltaX if available, fallback to deltaY
            if (scrollAmount !== 0) {
                currentTranslateX -= Math.sign(scrollAmount) * Math.min(Math.abs(scrollAmount), 50); // Limit scroll speed
                updateTimelineTransform();
            }
        } else { // Vertical pan
            const scrollAmount = event.deltaY;
            if (scrollAmount !== 0) {
                currentTranslateY -= Math.sign(scrollAmount) * Math.min(Math.abs(scrollAmount), 50); // Limit scroll speed
                updateTimelineTransform();
            }
        }
    }, { passive: false }); // Need passive: false to prevent default scroll

    // Drag listeners for panning
    timelineContainer.addEventListener('mousedown', (event) => {
        // Only pan with left mouse button, and not on interactive elements
        if (event.button !== 0 || event.target.closest('.scientist-photo, .publication, .discovery-marker, .event-box, .controls button, .controls input, .modal')) return; // Ignore controls
        potentialDrag = true;
        isDragging = false; // Reset dragging state
        dragStartX = event.clientX;
        dragStartY = event.clientY;
        dragStartTranslateX = currentTranslateX;
        dragStartTranslateY = currentTranslateY;
        // Don't set cursor/userSelect immediately, wait for actual drag movement
    });

    document.addEventListener('mousemove', (event) => {
        if (!potentialDrag) return; // Only react if mouse button is down

        const dx = event.clientX - dragStartX;
        const dy = event.clientY - dragStartY;

        if (!isDragging) {
            // Start dragging only if mouse moved beyond threshold
            if (Math.abs(dx) > config.DRAG_THRESHOLD || Math.abs(dy) > config.DRAG_THRESHOLD) {
                isDragging = true;
                timelineContainer.style.cursor = 'grabbing';
                timelineContainer.style.userSelect = 'none'; // Prevent text selection during drag
            } else {
                return; // Not dragging yet
            }
        }

        // If dragging, update position immediately for responsiveness
        if (isDragging) {
            event.preventDefault(); // Prevent default drag behavior (e.g., image ghosting)
            currentTranslateX = dragStartTranslateX + dx;
            currentTranslateY = dragStartTranslateY + dy;
            // Apply transform directly for smoother feedback during drag
            if(timeline) {
                 timeline.style.transform = `translateX(${currentTranslateX}px) translateY(${currentTranslateY}px) scale(${currentScale})`;
            }
        }
    });

    // Stop dragging when mouse is released anywhere or leaves window
    const stopDragging = () => {
        if (potentialDrag) {
            if (isDragging) {
                // Final update with clamped values
                updateTimelineTransform();
                if(timelineContainer) {
                    timelineContainer.style.cursor = 'grab'; // Reset cursor
                    timelineContainer.style.removeProperty('user-select'); // Re-enable text selection
                }
            }
            potentialDrag = false;
            isDragging = false;
        }
    };
    document.addEventListener('mouseup', stopDragging);
    // Handle case where mouse leaves the window while dragging
    document.addEventListener('mouseleave', (event) => {
        // Check if mouse left the viewport entirely
        if (!event.relatedTarget && !event.toElement && event.buttons === 0) {
             stopDragging();
        }
    });

    // Prevent default image drag behavior
    if(timelineContainer) {
        timelineContainer.addEventListener('dragstart', (event) => event.preventDefault());
    }

    // Zoom Slider listener
    zoomSlider.addEventListener('input', () => {
        const newScale = mapSliderValue(zoomSlider.value, config.MIN_SCALE, config.MAX_SCALE);
        if (newScale !== currentScale) {
            // Zoom towards center when using slider
            const containerWidth = timelineContainer.clientWidth;
            const containerHeight = timelineContainer.clientHeight;
            const zoomOriginX = containerWidth / 2;
            const zoomOriginY = containerHeight / 2;
            const scaleChange = newScale / currentScale;
            currentTranslateX = zoomOriginX - (zoomOriginX - currentTranslateX) * scaleChange;
            currentTranslateY = zoomOriginY - (zoomOriginY - currentTranslateY) * scaleChange;

            currentScale = newScale;
            updateTimelineTransform();
        }
    });

    // Height Slider listener
    heightSlider.addEventListener('input', () => {
        const newHeight = mapSliderValue(heightSlider.value, MIN_TIMELINE_HEIGHT, MAX_TIMELINE_HEIGHT);
        if (newHeight !== currentTimelineHeight) {
            currentTimelineHeight = newHeight;
            timelineContainer.style.height = `${currentTimelineHeight}px`;
            // Re-render the timeline completely after height change
            renderTimeline(timelineContainer, timeline, updateTimelineTransform);
            // We might need to re-center vertically after height change, updateTimelineTransform handles clamping
            updateTimelineTransform();
        }
    });

    // Reset View Button listener
    resetViewButton.addEventListener('click', () => {
        currentScale = 1.0;
        currentTranslateX = 0;
        currentTranslateY = 0;
        currentTimelineHeight = INITIAL_TIMELINE_HEIGHT; // Reset height state

        timelineContainer.style.height = `${currentTimelineHeight}px`; // Apply height reset
        zoomSlider.value = mapValueToSlider(currentScale, config.MIN_SCALE, config.MAX_SCALE); // Reset zoom slider
        heightSlider.value = mapValueToSlider(currentTimelineHeight, MIN_TIMELINE_HEIGHT, MAX_TIMELINE_HEIGHT); // Reset height slider

        renderTimeline(timelineContainer, timeline, updateTimelineTransform); // Re-render
        updateTimelineTransform(); // Apply transform reset
    });


    // Resize listener - Debounced
    window.addEventListener('resize', debouncedRender);

    // Tooltip listeners (using event delegation on timelineContainer)
    let currentHoveredPhoto = null; // Track the currently hovered photo

    timelineContainer.addEventListener('mouseover', (event) => {
        const photo = event.target.closest('.scientist-photo');
        if (photo && scientistTooltip) {
            currentHoveredPhoto = photo; // Set the current photo
            const name = photo.dataset.name || 'Name not found';
            scientistTooltip.textContent = name;
            scientistTooltip.style.display = 'block';
            // Initial position update (mousemove will refine)
            updateTooltipPosition(event);
        }
    });

    timelineContainer.addEventListener('mouseout', (event) => {
        const photo = event.target.closest('.scientist-photo');
        // Hide only if moving out of the currently tracked photo
        if (photo && photo === currentHoveredPhoto && scientistTooltip) {
            scientistTooltip.style.display = 'none';
            currentHoveredPhoto = null; // Reset tracked photo
        }
        // Handle edge case: if mouse moves quickly out of container while over photo
        if (!event.relatedTarget || !timelineContainer.contains(event.relatedTarget)) {
             if (scientistTooltip) scientistTooltip.style.display = 'none';
             currentHoveredPhoto = null;
        }
    });

    timelineContainer.addEventListener('mousemove', (event) => {
        // Update position only if tooltip is visible (implicitly means we are over a photo)
        if (scientistTooltip && scientistTooltip.style.display === 'block') {
            updateTooltipPosition(event);
        }
    });

    function updateTooltipPosition(event) {
        // Position tooltip relative to viewport, slightly above the cursor
        const offsetX = 10; // Offset X from cursor
        const offsetY = -25; // Offset Y from cursor (negative to appear above)
        scientistTooltip.style.left = `${event.clientX + offsetX}px`;
        scientistTooltip.style.top = `${event.clientY + offsetY}px`;
    }

}

// --- Resize Handler ---
// Debounced function to handle window resize events
function debouncedRender() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        console.log("Window resized, re-rendering timeline...");
        // Re-render with current state but adjusted dimensions
        // Pass the necessary elements again as they might be affected by resize indirectly
        renderTimeline(document.getElementById('timeline-container'), document.getElementById('timeline'), updateTimelineTransform);
        // Update slider positions after resize/re-render
        if (zoomSlider) zoomSlider.value = mapValueToSlider(currentScale, config.MIN_SCALE, config.MAX_SCALE);
        if (heightSlider) heightSlider.value = mapValueToSlider(currentTimelineHeight, MIN_TIMELINE_HEIGHT, MAX_TIMELINE_HEIGHT);
    }, config.RESIZE_DEBOUNCE_DELAY);
}

// --- Initial Setup Function ---
// Orchestrates the application initialization process
async function initializeApp() {
    // Fetch core elements needed by this script
    timelineContainer = document.getElementById('timeline-container');
    timeline = document.getElementById('timeline');
    zoomLevelDisplay = document.querySelector('.zoom-level');
    scientistTooltip = document.getElementById('scientist-tooltip'); // Get tooltip element
    zoomSlider = document.getElementById('zoom-slider'); // Get sliders
    heightSlider = document.getElementById('height-slider');
    resetViewButton = document.getElementById('reset-view'); // Get reset button

    if (!timelineContainer || !timeline || !zoomLevelDisplay || !scientistTooltip || !zoomSlider || !heightSlider || !resetViewButton) {
        console.error("Core timeline or control elements not found! Cannot initialize.");
        return;
    }
    // Set initial height from state (in case it differs from CSS default)
    currentTimelineHeight = timelineContainer.offsetHeight || INITIAL_TIMELINE_HEIGHT;
    timelineContainer.style.height = `${currentTimelineHeight}px`;
    // Set initial slider positions
    zoomSlider.value = mapValueToSlider(currentScale, config.MIN_SCALE, config.MAX_SCALE);
    heightSlider.value = mapValueToSlider(currentTimelineHeight, MIN_TIMELINE_HEIGHT, MAX_TIMELINE_HEIGHT);


    // Initialize modules in order
    initializeTheme(); // Set up theme first (affects default images)
    setupModalEventListeners(); // Set up modal listeners

    try {
        await initializeData(); // Load all data
        console.log("Data initialization complete.");

        // Render the timeline *after* data is loaded
        // Pass the update function needed by the renderer
        renderTimeline(timelineContainer, timeline, updateTimelineTransform);
        console.log("Initial timeline render complete.");

        // Setup interaction listeners *after* the timeline is rendered
        setupEventListeners();
        console.log("Interaction event listeners ready.");

    } catch (error) {
        console.error("Failed to initialize application:", error);
        // Optionally display an error message to the user on the page
    }
}

// --- Run Initial Setup ---
// Ensures the DOM is ready before initializing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp(); // DOMContentLoaded has already fired
}
