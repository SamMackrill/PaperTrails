export const CONTEXT_MODES = ['bars', 'landscape', 'tapestry'];
export const DEFAULT_CONTEXT_MODE = 'landscape';
export const CONTEXT_MODE_STORAGE_KEY = 'paperTrailsContextMode';

export function isContextMode(mode) {
  return CONTEXT_MODES.includes(mode);
}

export function nextContextMode(mode) {
  const index = CONTEXT_MODES.indexOf(mode);
  return CONTEXT_MODES[(index + 1) % CONTEXT_MODES.length];
}

export function savedContextMode(storage) {
  try {
    const mode = storage.getItem(CONTEXT_MODE_STORAGE_KEY);
    if (isContextMode(mode)) return mode;
    return storage.getItem('paperTrailsTapestry') === 'false' ? 'bars' : DEFAULT_CONTEXT_MODE;
  } catch {
    return DEFAULT_CONTEXT_MODE;
  }
}

export function getContextMode(button) {
  return isContextMode(button?.dataset.contextMode) ? button.dataset.contextMode : DEFAULT_CONTEXT_MODE;
}

export function updateContextModeButton(button, mode, contextVisible = true) {
  mode = isContextMode(mode) ? mode : DEFAULT_CONTEXT_MODE;
  const label = mode[0].toUpperCase() + mode.slice(1);
  const next = nextContextMode(mode);
  const nextLabel = next[0].toUpperCase() + next.slice(1);
  const guide = button.ownerDocument?.querySelector('.context-guide');
  if (guide) guide.textContent = {
    bars: 'Recorded event dates and durations · select an event for details',
    landscape: 'Names and dates follow woven braids · knots mark single-year events · zoom for illustrated detail',
    tapestry: 'A continuous embroidered story · zoom for more detail · select a scene for English names and dates'
  }[mode];
  button.dataset.contextMode = mode;
  button.querySelector('[data-context-label]').textContent = label;
  button.querySelectorAll('[data-context-icon]').forEach(icon => { icon.toggleAttribute('hidden', icon.dataset.contextIcon !== mode); });
  button.setAttribute('aria-disabled', String(!contextVisible));
  button.setAttribute('aria-label', `Historical context: ${label}. ${contextVisible ? `Switch to ${nextLabel}.` : 'Turn on Context to change the view.'}`);
  button.title = contextVisible
    ? `Historical context: ${label}. Click to switch to ${nextLabel}. Cycle through Bars, Landscape and Tapestry.`
    : `Historical context: ${label}. Turn on Context to change the view.`;
}
