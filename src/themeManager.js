import { config } from './config.js';

let modeToggleButton; // Keep track of the button within this module

// Applies the specified theme (light or dark)
export function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.body.classList.toggle('dark-mode', isDark);

  if (modeToggleButton) {
    modeToggleButton.textContent = isDark ? '☀️' : '🌙';
    modeToggleButton.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  }
  localStorage.setItem(config.themeLocalStorageKey, theme);

  // Update default image source based on theme for error handling
  updateDefaultImageSource(theme);
}

// Toggles between light and dark themes
export function toggleTheme() {
  const currentThemeIsDark = document.body.classList.contains('dark-mode');
  applyTheme(currentThemeIsDark ? 'light' : 'dark');
}

// Initializes the theme based on localStorage or system preference
export function initializeTheme() {
  modeToggleButton = document.getElementById('mode-toggle'); // Fetch button here
  if (!modeToggleButton) {
    console.error("Mode toggle button not found during theme initialization.");
    return; // Exit if button isn't found
  }

  const savedTheme = localStorage.getItem(config.themeLocalStorageKey);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  let initialTheme = 'light'; // Default
  if (savedTheme) {
    initialTheme = savedTheme;
  } else if (prefersDark) {
    initialTheme = 'dark';
  }

  applyTheme(initialTheme); // Apply the determined theme

  // Add the event listener *after* initial theme is set
  modeToggleButton.addEventListener('click', toggleTheme);
}

// Helper to update the src of images that failed to load
function updateDefaultImageSource(theme) {
    const defaultSrc = theme === 'dark' ? 'images/default_dark.png' : 'images/default.png';
    const errorImages = document.querySelectorAll('img.scientist-photo[data-error="true"]');
    errorImages.forEach(img => {
        img.src = defaultSrc; // Update src for images that previously failed
    });
}

// Add this function to handle image errors and set the correct default
export function handleImageError(imgElement) {
    const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    const defaultSrc = currentTheme === 'dark' ? 'images/default_dark.png' : 'images/default.png';
    imgElement.src = defaultSrc;
    imgElement.dataset.error = "true"; // Mark the image as having encountered an error
}
