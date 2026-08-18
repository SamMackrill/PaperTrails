import { scientists } from './dataLoader.js?v=14';

let panel;
let backdrop;
let closeButton;
let eyebrow;
let title;
let identity;
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
  identity = document.getElementById('detail-identity');
  metadata = document.getElementById('detail-metadata');
  body = document.getElementById('detail-body');
  media = document.getElementById('detail-media');
  image = document.getElementById('detail-image');

  return Boolean(panel && backdrop && closeButton && eyebrow && title && identity && metadata && body && media && image);
}

function renderMetadata(items) {
  metadata.replaceChildren();
  items.forEach(([label, value]) => {
    const term = document.createElement('dt');
    const description = document.createElement('dd');
    term.textContent = label;
    if (value instanceof Node) {
      description.appendChild(value);
    } else {
      description.textContent = value || 'Not recorded';
    }
    metadata.append(term, description);
  });
}

function getFirstPublicationYear(scientist) {
  return [...(scientist.publications || [])]
    .filter((publication) => Number.isFinite(publication.year))
    .sort((a, b) => a.year - b.year)[0]?.year;
}

function locateScientistOnTimeline(scientistId, scientist) {
  closeModal({
    restoreFocus: false,
    afterClose: () => {
      document.dispatchEvent(new CustomEvent('papertrails:locatescientist', {
        detail: { scientistId, year: getFirstPublicationYear(scientist) }
      }));
    }
  });
}

function createScientistLinks(scientistIds, fallbackText, linkTarget = 'profile') {
  const wrapper = document.createElement('span');
  wrapper.className = 'detail-scientist-links';

  const linkedScientists = (Array.isArray(scientistIds) ? scientistIds : [])
    .map((scientistId) => [scientistId, scientists[scientistId]])
    .filter(([, scientist]) => Boolean(scientist));

  if (!linkedScientists.length) {
    wrapper.textContent = fallbackText || 'Not recorded';
    return wrapper;
  }

  linkedScientists.forEach(([scientistId, scientist], index) => {
    if (index > 0) {
      wrapper.appendChild(document.createTextNode(
        index === linkedScientists.length - 1 ? ' and ' : ', '
      ));
    }

    const link = document.createElement('button');
    link.type = 'button';
    link.className = 'detail-scientist-link';
    link.textContent = scientist.name;
    if (linkTarget === 'timeline') {
      link.setAttribute('aria-label', `Locate ${scientist.name} on the timeline`);
      link.addEventListener('click', () => locateScientistOnTimeline(scientistId, scientist));
    } else {
      link.setAttribute('aria-label', `Open scientist profile for ${scientist.name}`);
      link.addEventListener('click', () => showScientistModal(scientistId));
    }
    wrapper.appendChild(link);
  });

  if (/\band others\b/i.test(fallbackText || '')) {
    wrapper.appendChild(document.createTextNode(' and others'));
  }

  return wrapper;
}

function openPanel() {
  if (!panel || !backdrop) return;

  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }

  if (panel.hidden) {
    lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }
  panel.hidden = false;
  backdrop.hidden = false;

  requestAnimationFrame(() => {
    panel.classList.add('is-open');
    backdrop.classList.add('is-open');
    closeButton.focus({ preventScroll: true });
  });
}

function formatYear(date) {
  const year = Number.parseInt(String(date || '').slice(0, 4), 10);
  return Number.isFinite(year) ? String(year) : null;
}

function calculateAge(birth, death) {
  const birthMatch = String(birth || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const deathMatch = String(death || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!birthMatch || !deathMatch) return null;

  let age = Number(deathMatch[1]) - Number(birthMatch[1]);
  const birthMonthDay = `${birthMatch[2]}-${birthMatch[3]}`;
  const deathMonthDay = `${deathMatch[2]}-${deathMatch[3]}`;
  if (deathMonthDay < birthMonthDay) age -= 1;
  return age >= 0 ? age : null;
}

function getIdentityLine(scientist) {
  const birthYear = formatYear(scientist.birth);
  const deathYear = formatYear(scientist.death);
  const age = calculateAge(scientist.birth, scientist.death);
  const lifespan = birthYear && deathYear ? `${birthYear}–${deathYear}` : birthYear ? `Born ${birthYear}` : null;
  return [scientist.nationality, lifespan, age !== null ? `aged ${age}` : null].filter(Boolean).join(' · ');
}

function getScientistSummary(scientist) {
  return scientist.summary
    || scientist.details
    || scientist.publications?.find((publication) => publication.abstract)?.abstract
    || 'No biographical summary is available yet.';
}

function createAcademicPlaceholderCoat() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'detail-academic-coat detail-academic-coat-placeholder');
  svg.setAttribute('viewBox', '0 0 32 34');
  svg.setAttribute('aria-hidden', 'true');

  const building = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  building.setAttribute('class', 'detail-academic-placeholder-icon');
  building.setAttribute('d', 'M4 12 16 5l12 7M6 14h20M8 15v11m5-11v11m6-11v11m5-11v11M5 28h22');
  svg.appendChild(building);
  return svg;
}

function createAcademicCoat(affiliation) {
  if (!affiliation.coat) return createAcademicPlaceholderCoat();

  const coat = document.createElement('img');
  coat.className = 'detail-academic-coat detail-academic-coat-image';
  coat.src = affiliation.coat;
  coat.alt = '';
  coat.setAttribute('aria-hidden', 'true');
  coat.decoding = 'async';
  coat.addEventListener('error', () => {
    coat.replaceWith(createAcademicPlaceholderCoat());
  }, { once: true });
  return coat;
}

function createAcademicAffiliations(scientist) {
  const affiliations = Array.isArray(scientist.academic_affiliations)
    ? scientist.academic_affiliations.filter((affiliation) => affiliation?.institution)
    : [];
  if (!affiliations.length) return null;

  const section = document.createElement('section');
  section.className = 'detail-academic-affiliations';

  const heading = document.createElement('h3');
  heading.textContent = 'Education & academic associations';
  section.appendChild(heading);

  const list = document.createElement('ul');
  list.className = 'detail-academic-list';
  affiliations.forEach((affiliation) => {
    const item = document.createElement('li');
    const copy = document.createElement('span');
    copy.className = 'detail-academic-copy';

    const institution = document.createElement('span');
    institution.className = 'detail-academic-institution';
    institution.textContent = affiliation.institution;
    copy.appendChild(institution);

    if (affiliation.association) {
      const association = document.createElement('span');
      association.className = 'detail-academic-association';
      association.textContent = affiliation.association;
      copy.appendChild(association);
    }

    item.append(createAcademicCoat(affiliation), copy);
    list.appendChild(item);
  });

  section.appendChild(list);
  return section;
}

function createPublicationList(scientist) {
  const section = document.createElement('section');
  section.className = 'detail-publications';

  const headingRow = document.createElement('div');
  headingRow.className = 'detail-section-heading';

  const heading = document.createElement('h3');
  heading.textContent = 'Publications on this timeline';

  const count = document.createElement('span');
  count.className = 'detail-section-count';
  count.textContent = String(scientist.publications?.length || 0);
  count.setAttribute('aria-label', `${count.textContent} publications`);
  headingRow.append(heading, count);
  section.appendChild(headingRow);

  const list = document.createElement('ul');
  list.className = 'detail-publication-list';

  [...(scientist.publications || [])]
    .sort((a, b) => (a.year || 0) - (b.year || 0))
    .forEach((publication) => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'detail-publication-link';
      button.setAttribute('aria-label', `Open ${publication.title || 'untitled publication'}, ${publication.year || 'year not recorded'}`);

      const year = document.createElement('span');
      year.className = 'detail-publication-year';
      year.textContent = publication.year || '—';

      const content = document.createElement('span');
      content.className = 'detail-publication-content';

      const publicationTitle = document.createElement('span');
      publicationTitle.className = 'detail-publication-title';
      publicationTitle.textContent = publication.title || 'Untitled publication';
      content.appendChild(publicationTitle);

      if (publication.abstract) {
        const abstract = document.createElement('span');
        abstract.className = 'detail-publication-abstract';
        abstract.textContent = publication.abstract;
        content.appendChild(abstract);
      }

      const arrow = document.createElement('span');
      arrow.className = 'detail-publication-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '→';

      button.append(year, content, arrow);
      button.addEventListener('click', () => {
        showPublicationModal(scientist.name, publication.year, publication.title, publication.abstract, 'publication');
      });
      item.appendChild(button);
      list.appendChild(item);
    });

  if (list.children.length) {
    section.appendChild(list);
  } else {
    const emptyState = document.createElement('p');
    emptyState.className = 'detail-empty-state';
    emptyState.textContent = 'No publications are represented on this timeline yet.';
    section.appendChild(emptyState);
  }

  return section;
}

function createLocateAction(scientistId, scientist) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'detail-locate-action';

  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('class', 'detail-locate-icon');
  icon.setAttribute('aria-hidden', 'true');
  icon.setAttribute('viewBox', '0 0 24 24');

  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', '12');
  circle.setAttribute('cy', '12');
  circle.setAttribute('r', '3');

  const crosshairs = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  crosshairs.setAttribute('d', 'M12 2v4M12 18v4M2 12h4M18 12h4');
  icon.append(circle, crosshairs);

  const label = document.createElement('span');
  label.textContent = `Locate ${scientist.name || 'scientist'} on timeline`;
  button.append(icon, label);

  button.addEventListener('click', () => {
    locateScientistOnTimeline(scientistId, scientist);
  });

  return button;
}

export function showPublicationModal(
  actorName,
  itemYear,
  itemTitle,
  description,
  type = 'publication',
  scientistIds = [],
  attendeeIds = []
) {
  if (!panel && !fetchElements()) return;

  const typeLabels = {
    publication: 'Publication',
    discovery: 'Scientific discovery',
    conference: 'Scientific conference',
    event: 'Historical context'
  };

  eyebrow.textContent = typeLabels[type] || 'Timeline item';
  title.textContent = itemTitle || 'Untitled item';
  identity.hidden = true;
  identity.textContent = '';
  body.replaceChildren();
  const descriptionText = document.createElement('p');
  descriptionText.className = 'detail-copy';
  descriptionText.textContent = description || 'No further details are available.';
  body.appendChild(descriptionText);
  media.hidden = true;
  metadata.hidden = false;

  if (type === 'event') {
    const eventMetadata = [['Period', itemYear]];
    if (Array.isArray(attendeeIds) && attendeeIds.length) {
      eventMetadata.push(['Attendees', createScientistLinks(attendeeIds, '', 'timeline')]);
    }
    renderMetadata(eventMetadata);
  } else {
    const itemMetadata = [];
    if (type === 'discovery') {
      itemMetadata.push(['Discoverer', createScientistLinks(scientistIds, actorName)]);
    } else if (type === 'publication') {
      itemMetadata.push(['Author', actorName]);
    }
    if (Array.isArray(attendeeIds) && attendeeIds.length) {
      itemMetadata.push(['Attendees', createScientistLinks(attendeeIds, '', 'timeline')]);
    }
    itemMetadata.push(['Year', String(itemYear || 'Not recorded')]);
    renderMetadata(itemMetadata);
  }

  openPanel();
}

export function showScientistModal(scientistId) {
  const scientist = scientists[scientistId];
  if (!scientist || (!panel && !fetchElements())) return;

  eyebrow.textContent = 'Scientist';
  title.textContent = scientist.name || 'Unknown scientist';
  identity.textContent = getIdentityLine(scientist);
  identity.hidden = !identity.textContent;
  metadata.replaceChildren();
  metadata.hidden = true;

  const summary = document.createElement('p');
  summary.className = 'detail-summary';
  summary.textContent = getScientistSummary(scientist);

  const academicAffiliations = createAcademicAffiliations(scientist);
  const locateAction = createLocateAction(scientistId, scientist);
  body.replaceChildren(...[academicAffiliations, summary, createPublicationList(scientist), locateAction].filter(Boolean));
  image.src = scientist.photo || 'images/default.png';
  image.alt = scientist.name ? `Portrait of ${scientist.name}` : 'Scientist portrait';
  media.style.setProperty('--scientist-color', scientist.color || 'var(--accent)');
  media.hidden = false;
  openPanel();
}

export function closeModal({ restoreFocus = true, afterClose = null } = {}) {
  if (!panel || panel.hidden || closeTimer) return;

  panel.classList.remove('is-open');
  backdrop.classList.remove('is-open');
  closeTimer = window.setTimeout(() => {
    panel.hidden = true;
    backdrop.hidden = true;
    closeTimer = null;
    if (typeof afterClose === 'function') afterClose();
  }, 230);

  document.dispatchEvent(new CustomEvent('papertrails:detailsclosed'));
  if (restoreFocus) lastFocusedElement?.focus({ preventScroll: true });
}

function getFocusableElements() {
  if (!panel) return [];
  return [...panel.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter((element) => !element.hidden && element.getClientRects().length > 0);
}

export function setupModalEventListeners() {
  if (!fetchElements()) {
    console.error('Detail panel elements are missing.');
    return;
  }

  closeButton.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeModal();
      return;
    }
    if (event.key === 'Tab' && !panel.hidden) {
      const focusableElements = getFocusableElements();
      if (!focusableElements.length) return;

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!panel.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    }
  });
}
