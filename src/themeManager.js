import { config } from './config.js?v=10';

let modeToggleButton;

export function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.body.classList.toggle('dark-mode', isDark);
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';

  if (modeToggleButton) {
    const action = isDark ? 'Switch to light theme' : 'Switch to dark theme';
    modeToggleButton.setAttribute('aria-label', action);
    modeToggleButton.title = action;
  }

  localStorage.setItem(config.themeLocalStorageKey, isDark ? 'dark' : 'light');
  updateFallbackImages(isDark);
}

export function toggleTheme() {
  applyTheme(document.body.classList.contains('dark-mode') ? 'light' : 'dark');
}

export function initializeTheme() {
  modeToggleButton = document.getElementById('mode-toggle');
  if (!modeToggleButton) return;

  const savedTheme = localStorage.getItem(config.themeLocalStorageKey);
  const initialTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(initialTheme);
  modeToggleButton.addEventListener('click', toggleTheme);
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
