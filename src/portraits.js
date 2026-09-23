// Shared portrait helpers used by the timeline and the details panel.

const PLACEHOLDER_PATTERN = /(^|\/)default(_dark)?\.png$/i;

export function isPlaceholderImage(source) {
  return !source || PLACEHOLDER_PATTERN.test(String(source).split('?')[0]);
}

export function getInitials(name) {
  const words = String(name || '')
    .replace(/\([^)]*\)/g, ' ')
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}]/gu, ''))
    .filter(Boolean);
  if (!words.length) return '?';
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return `${first}${last}`.toLocaleUpperCase();
}

export function illustrationsEnabled() {
  return document.getElementById('cartoonToggle')?.getAttribute('aria-pressed') === 'true';
}

export function getPortraitSource(scientist, useIllustrations = illustrationsEnabled()) {
  const cartoon = isPlaceholderImage(scientist?.cartoon) ? null : scientist.cartoon;
  const photo = isPlaceholderImage(scientist?.photo) ? null : scientist.photo;
  return (useIllustrations && cartoon) || photo || cartoon || null;
}

export function createMonogram(scientist, className) {
  const monogram = document.createElement('span');
  monogram.className = `portrait-monogram ${className || ''}`.trim();
  monogram.textContent = getInitials(scientist?.name);
  monogram.style.setProperty('--scientist-color', scientist?.color || 'var(--accent)');
  monogram.setAttribute('aria-hidden', 'true');
  return monogram;
}

// Returns an <img> that follows the Illustrations toggle, or a monogram when
// no verified portrait exists. Images that fail to load become monograms too.
export function createPortrait(scientist, className) {
  const source = getPortraitSource(scientist);
  if (!source) return createMonogram(scientist, className);

  const image = document.createElement('img');
  image.className = className;
  image.alt = '';
  image.decoding = 'async';
  image.draggable = false;
  if (!isPlaceholderImage(scientist.photo)) image.dataset.originalPhoto = scientist.photo;
  if (!isPlaceholderImage(scientist.cartoon)) image.dataset.cartoonPhoto = scientist.cartoon;
  image.src = source;
  // Try the other portrait once before falling back to initials.
  const attempted = new Set([source]);
  image.addEventListener('error', () => {
    const fallback = [image.dataset.originalPhoto, image.dataset.cartoonPhoto]
      .find((candidate) => candidate && !attempted.has(candidate));
    if (fallback) {
      attempted.add(fallback);
      image.src = fallback;
    } else {
      image.replaceWith(createMonogram(scientist, className));
    }
  });
  return image;
}

// Keeps every rendered portrait in step with the Illustrations toggle.
export function updatePortraitStyle(useIllustrations = illustrationsEnabled()) {
  document.querySelectorAll('img[data-original-photo], img[data-cartoon-photo]').forEach((image) => {
    const desired = (useIllustrations && image.dataset.cartoonPhoto) || image.dataset.originalPhoto || image.dataset.cartoonPhoto;
    if (desired && image.getAttribute('src') !== desired) image.src = desired;
  });
}
