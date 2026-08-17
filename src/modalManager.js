import { scientists } from './dataLoader.js?v=7';

let panel;
let backdrop;
let closeButton;
let eyebrow;
let title;
let metadata;
let body;
let media;
let image;
let lastFocusedElement = null;
let closeTimer = null;

function fetchElements() {
  panel = document.getElementById('detail-panel');
  backdrop = document.getElementById('detail-backdrop');
  closeButton = document.getElementById('detail-close');
  eyebrow = document.getElementById('detail-eyebrow');
  title = document.getElementById('detail-title');
  metadata = document.getElementById('detail-metadata');
  body = document.getElementById('detail-body');
  media = document.getElementById('detail-media');
  image = document.getElementById('detail-image');

  return Boolean(panel && backdrop && closeButton && eyebrow && title && metadata && body && media && image);
}

function renderMetadata(items) {
  metadata.replaceChildren();
  items.forEach(([label, value]) => {
    const term = document.createElement('dt');
    const description = document.createElement('dd');
    term.textContent = label;
    description.textContent = value || 'Not recorded';
    metadata.append(term, description);
  });
}

function openPanel() {
  if (!panel || !backdrop) return;

  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }

  lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  panel.hidden = false;
  backdrop.hidden = false;

  requestAnimationFrame(() => {
    panel.classList.add('is-open');
    backdrop.classList.add('is-open');
    closeButton.focus({ preventScroll: true });
  });
}

export function showPublicationModal(actorName, itemYear, itemTitle, description, type = 'publication') {
  if (!panel && !fetchElements()) return;

  const typeLabels = {
    publication: 'Publication',
    discovery: 'Scientific discovery',
    event: 'Historical context'
  };

  eyebrow.textContent = typeLabels[type] || 'Timeline item';
  title.textContent = itemTitle || 'Untitled item';
  body.textContent = description || 'No further details are available.';
  media.hidden = true;

  if (type === 'event') {
    renderMetadata([['Period', itemYear]]);
  } else {
    renderMetadata([
      [type === 'discovery' ? 'Discoverer' : 'Author', actorName],
      ['Year', String(itemYear || 'Not recorded')]
    ]);
  }

  openPanel();
}

export function showScientistModal(scientistId) {
  const scientist = scientists[scientistId];
  if (!scientist || (!panel && !fetchElements())) return;

  eyebrow.textContent = 'Scientist';
  title.textContent = scientist.name || 'Unknown scientist';
  renderMetadata([
    ['Nationality', scientist.nationality],
    ['Born', scientist.birth],
    ['Died', scientist.death]
  ]);

  const publicationCount = scientist.publications?.length || 0;
  body.textContent = scientist.details || `${publicationCount} ${publicationCount === 1 ? 'publication is' : 'publications are'} represented on this timeline.`;
  image.src = scientist.photo || 'images/default.png';
  image.alt = scientist.name ? `Portrait of ${scientist.name}` : 'Scientist portrait';
  media.hidden = false;
  openPanel();
}

export function closeModal() {
  if (!panel || panel.hidden) return;

  panel.classList.remove('is-open');
  backdrop.classList.remove('is-open');
  closeTimer = window.setTimeout(() => {
    panel.hidden = true;
    backdrop.hidden = true;
    closeTimer = null;
  }, 230);

  document.dispatchEvent(new CustomEvent('papertrails:detailsclosed'));
  lastFocusedElement?.focus({ preventScroll: true });
}

export function setupModalEventListeners() {
  if (!fetchElements()) {
    console.error('Detail panel elements are missing.');
    return;
  }

  closeButton.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModal();
    if (event.key === 'Tab' && !panel.hidden) {
      event.preventDefault();
      closeButton.focus();
    }
  });
}
