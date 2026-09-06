import { config } from './config.js?v=14';

let modeToggleButton;

function readSavedTheme() {
  try {
    return localStorage.getItem(config.themeLocalStorageKey);
  } catch {
    // Some hosted previews restrict storage access. The toggle should still work.
    return null;
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem(config.themeLocalStorageKey, theme);
  } catch {
    // A session-only theme is still useful when persistent storage is blocked.
  }
}

export function applyTheme(theme) {
  const isDark = theme === 'dark';
  const pageBackground = isDark ? '#0b1220' : '#f3f5f8';
  const root = document.documentElement;
  const body = document.body;
  const themeName = isDark ? 'dark' : 'light';
  body.classList.toggle('dark-mode', isDark);
  root.dataset.theme = themeName;
  root.style.colorScheme = themeName;
  // Keep the viewport background in sync as well as the app surface. This is
  // explicit because some static hosts cache the original body declaration.
  root.style.setProperty('--page-bg', pageBackground, 'important');
  body.style.setProperty('--page-bg', pageBackground, 'important');
  root.style.setProperty('background-color', pageBackground, 'important');
  body.style.setProperty('background-color', pageBackground, 'important');

  if (modeToggleButton) {
    const action = isDark ? 'Switch to light theme' : 'Switch to dark theme';
    modeToggleButton.setAttribute('aria-label', action);
    modeToggleButton.title = action;
    modeToggleButton.setAttribute('aria-pressed', String(isDark));
  }

  saveTheme(isDark ? 'dark' : 'light');
  updateFallbackImages(isDark);
}

export function toggleTheme() {
  applyTheme(document.body.classList.contains('dark-mode') ? 'light' : 'dark');
}

export function initializeTheme() {
  modeToggleButton = document.getElementById('mode-toggle');
  if (!modeToggleButton) return;

  modeToggleButton.addEventListener('click', toggleTheme);
  const savedTheme = readSavedTheme();
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme === 'dark' || savedTheme === 'light'
    ? savedTheme
    : (prefersDark ? 'dark' : 'light');
  applyTheme(initialTheme);
}

function updateFallbackImages(isDark) {
  const fallback = isDark ? 'images/default_dark.png' : 'images/default.png';
  document.querySelectorAll('img.scientist-photo[data-error="true"]').forEach((img) => {
    img.src = fallback;
  });
}

export function handleImageError(imgElement) {
  if (imgElement.dataset.error === 'true') return;
  imgElement.dataset.error = 'true';
  imgElement.src = document.body.classList.contains('dark-mode')
    ? 'images/default_dark.png'
    : 'images/default.png';
}
