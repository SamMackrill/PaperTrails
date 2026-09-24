import { conferences, discoveries, scientistRelations, scientists, significantEvents } from './dataLoader.js?v=18';
import { createPortrait, getPortraitSource } from './portraits.js?v=3';

// Wide screens dock the panel beside the timeline so both stay usable.
// Narrow screens show it as a modal bottom sheet.
const DOCKED_QUERY = '(min-width: 1024px)';

let panel;
let backdrop;
let closeButton;
let backButton;
let eyebrow;
let title;
let identity;
let metadata;
let body;
let media;
let portraitNote;
let sheetHandle;
let lastFocusedElement = null;
let closeTimer = null;
// Items visited in this panel session, most recent last.
let history = [];
let current = null;

function fetchElements() {
  panel = document.getElementById('detail-panel');
  backdrop = document.getElementById('detail-backdrop');
  closeButton = document.getElementById('detail-close');
  backButton = document.getElementById('detail-back');
  eyebrow = document.getElementById('detail-eyebrow');
  title = document.getElementById('detail-title');
  identity = document.getElementById('detail-identity');
  metadata = document.getElementById('detail-metadata');
  body = document.getElementById('detail-body');
  media = document.getElementById('detail-media');
  portraitNote = document.getElementById('detail-portrait-note');
  sheetHandle = document.getElementById('detail-sheet-handle');

  return Boolean(panel && backdrop && closeButton && backButton && eyebrow && title && identity && metadata && body && media && portraitNote && sheetHandle);
}

export function isPanelDocked() {
  return window.matchMedia?.(DOCKED_QUERY).matches ?? false;
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

function createExternalLink(href, text, ariaLabel, className = 'detail-map-link') {
  const link = document.createElement('a');
  link.className = className;
  link.href = href;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = text;
  link.setAttribute('aria-label', `${ariaLabel} (opens in a new tab)`);
  return link;
}

function createMapLink(location) {
  return createExternalLink(
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`,
    location,
    `View ${location} on Google Maps`
  );
}

function createHistoricalMapLink(historicalMap) {
  if (!historicalMap?.url) return null;
  const year = historicalMap.year ? ` (${historicalMap.year})` : '';
  return createExternalLink(historicalMap.url, `View historical map${year}`, `View historical map${year}`);
}

function createConferencePhoto(photo, conferenceTitle) {
  if (!photo?.src) return null;

  const figure = document.createElement('figure');
  figure.className = 'detail-conference-photo';

  const photograph = document.createElement('img');
  photograph.src = photo.src;
  photograph.alt = photo.alt || `Attendees at ${conferenceTitle || 'the conference'}`;
  photograph.loading = 'eager';
  photograph.fetchPriority = 'high';
  photograph.decoding = 'async';
  photograph.addEventListener('error', () => figure.remove(), { once: true });
  figure.appendChild(photograph);

  if (photo.caption || photo.credit) {
    const caption = document.createElement('figcaption');
    if (photo.caption) {
      const captionText = document.createElement('span');
      captionText.textContent = photo.caption;
      caption.appendChild(captionText);
    }
    if (photo.credit) {
      const separator = photo.caption ? document.createTextNode(' ') : null;
      const credit = photo.source ? document.createElement('a') : document.createElement('span');
      credit.className = 'detail-conference-photo-credit';
      credit.textContent = `Photo: ${photo.credit}`;
      if (photo.source) {
        credit.href = photo.source;
        credit.target = '_blank';
        credit.rel = 'noopener noreferrer';
        credit.setAttribute('aria-label', 'View photograph source (opens in a new tab)');
      }
      caption.append(...[separator, credit].filter(Boolean));
    }
    figure.appendChild(caption);
  }

  return figure;
}

function getFirstPublicationYear(scientist) {
  return [...(scientist.publications || [])]
    .filter((publication) => Number.isFinite(publication.year))
    .sort((a, b) => a.year - b.year)[0]?.year;
}

function locateScientistOnTimeline(scientistId, scientist) {
  const detail = { scientistId, year: getFirstPublicationYear(scientist) };
  if (isPanelDocked()) {
    document.dispatchEvent(new CustomEvent('papertrails:locatescientist', { detail }));
    return;
  }
  closeModal({
    restoreFocus: false,
    afterClose: () => document.dispatchEvent(new CustomEvent('papertrails:locatescientist', { detail }))
  });
}

function createScientistLinks(scientistIds, fallbackText) {
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
      wrapper.appendChild(document.createTextNode(index === linkedScientists.length - 1 ? ' and ' : ', '));
    }

    const link = document.createElement('button');
    link.type = 'button';
    link.className = 'detail-scientist-link';
    link.textContent = scientist.name;
    link.setAttribute('aria-label', `Open scientist profile for ${scientist.name}`);
    link.addEventListener('click', () => openItem(`scientist:${scientistId}`));
    wrapper.appendChild(link);
  });

  if (/\band others\b/i.test(fallbackText || '')) {
    wrapper.appendChild(document.createTextNode(' and others'));
  }

  return wrapper;
}

function getScientistSurname(scientist) {
  return String(scientist.name || '')
    .replace(/[()]/g, ' ')
    .trim()
    .split(/\s+/)
    .pop();
}

function createSectionHeading(headingText, count, countNoun) {
  const headingRow = document.createElement('div');
  headingRow.className = 'detail-section-heading';

  const heading = document.createElement('h3');
  heading.textContent = headingText;
  headingRow.appendChild(heading);

  if (Number.isFinite(count)) {
    const countBadge = document.createElement('span');
    countBadge.className = 'detail-section-count';
    countBadge.textContent = String(count);
    countBadge.setAttribute('aria-label', `${count} ${countNoun}${count === 1 ? '' : 's'}`);
    headingRow.appendChild(countBadge);
  }
  return headingRow;
}

// People can be passed as ids or as { id, role } objects. The first role
// given for a person wins, so callers list the primary role first.
function createScientistGrid(people, headingText, countNoun) {
  const seenScientistIds = new Set();
  const linkedScientists = (Array.isArray(people) ? people : [])
    .map((person) => (typeof person === 'string' ? { id: person } : person))
    .map(({ id, role }) => [id, scientists[id], role])
    .filter(([scientistId, scientist]) => {
      if (!scientist || seenScientistIds.has(scientistId)) return false;
      seenScientistIds.add(scientistId);
      return true;
    })
    .sort(([, firstScientist], [, secondScientist]) => (
      getScientistSurname(firstScientist).localeCompare(getScientistSurname(secondScientist), undefined, { sensitivity: 'base' })
      || String(firstScientist.name || '').localeCompare(String(secondScientist.name || ''), undefined, { sensitivity: 'base' })
    ));
  if (!linkedScientists.length) return null;

  const section = document.createElement('section');
  section.className = 'detail-people';

  const list = document.createElement('ul');
  list.className = 'detail-person-grid';
  linkedScientists.forEach(([scientistId, scientist, role]) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'detail-person-link';
    button.setAttribute('aria-label', `Open scientist profile for ${scientist.name}`);

    const portrait = createPortrait(scientist, 'detail-person-portrait');

    const name = document.createElement('span');
    name.className = 'detail-person-name';
    name.textContent = scientist.name;

    button.append(portrait, name);
    if (role) {
      const roleLabel = document.createElement('span');
      roleLabel.className = 'detail-person-role';
      roleLabel.textContent = role;
      button.appendChild(roleLabel);
      button.setAttribute('aria-label', `Open scientist profile for ${scientist.name}, ${role.toLowerCase()}`);
    }
    button.addEventListener('click', () => openItem(`scientist:${scientistId}`));
    item.appendChild(button);
    list.appendChild(item);
  });

  section.append(createSectionHeading(headingText, linkedScientists.length, countNoun), list);
  return section;
}

// A list of timeline items, each opening in the panel.
function createItemList(className, headingText, countNoun, rows) {
  if (!rows.length) return null;
  const section = document.createElement('section');
  section.className = className;
  section.appendChild(createSectionHeading(headingText, rows.length, countNoun));

  const list = document.createElement('ul');
  list.className = 'detail-publication-list';
  rows.forEach(({ key, year, title: rowTitle, note, role }) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'detail-publication-link';
    button.setAttribute('aria-label', `Open ${rowTitle}, ${year || 'year not recorded'}${role ? `, ${role.toLowerCase()}` : ''}`);

    const yearLabel = document.createElement('span');
    yearLabel.className = 'detail-publication-year';
    yearLabel.textContent = year || '—';

    const content = document.createElement('span');
    content.className = 'detail-publication-content';
    const titleLabel = document.createElement('span');
    titleLabel.className = 'detail-publication-title';
    titleLabel.textContent = rowTitle;
    content.appendChild(titleLabel);
    if (role) {
      const roleLabel = document.createElement('span');
      roleLabel.className = 'detail-item-role';
      roleLabel.textContent = role;
      content.appendChild(roleLabel);
    }
    if (note) {
      const noteLabel = document.createElement('span');
      noteLabel.className = 'detail-publication-abstract';
      noteLabel.textContent = note;
      content.appendChild(noteLabel);
    }

    const arrow = document.createElement('span');
    arrow.className = 'detail-publication-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '→';

    button.append(yearLabel, content, arrow);
    button.addEventListener('click', () => openItem(key));
    item.appendChild(button);
    list.appendChild(item);
  });
  section.appendChild(list);
  return section;
}

function createPublicationList(scientistId, scientist) {
  const rows = (scientist.publications || [])
    .map((publication, index) => ({ publication, index }))
    .sort((a, b) => (a.publication.year || 0) - (b.publication.year || 0))
    .map(({ publication, index }) => ({
      key: `publication:${scientistId}:${index}`,
      year: publication.year,
      title: publication.title || 'Untitled publication',
      note: publication.abstract
    }));
  const section = createItemList('detail-publications', 'Publications on this timeline', 'publication', rows);
  if (section) return section;

  const empty = document.createElement('section');
  empty.className = 'detail-publications';
  empty.appendChild(createSectionHeading('Publications on this timeline', 0, 'publication'));
  const emptyState = document.createElement('p');
  emptyState.className = 'detail-empty-state';
  emptyState.textContent = 'No publications are represented on this timeline yet.';
  empty.appendChild(emptyState);
  return empty;
}

// Discoveries, conferences, and events that name this scientist.
function createRelationLists(scientistId) {
  const relations = scientistRelations.get(scientistId);
  if (!relations) return [];
  const byYear = (a, b) => (a.year || 0) - (b.year || 0);
  const discoveryRows = relations.discoveries.map(({ index, role }) => ({
    key: `discovery:${index}`, year: discoveries[index]?.year, title: discoveries[index]?.title || 'Untitled discovery', role
  })).sort(byYear);
  const conferenceRows = relations.conferences.map(({ index, role }) => ({
    key: `conference:${index}`, year: conferences[index]?.year, title: conferences[index]?.title || 'Untitled conference', role
  })).sort(byYear);
  const eventRows = relations.events.map(({ index }) => {
    const event = significantEvents[index];
    return { key: `event:${index}`, year: event?.startYear, title: event?.title || 'Historical event' };
  }).sort(byYear);
  return [
    createItemList('detail-relations', 'Discoveries', 'discovery', discoveryRows),
    createItemList('detail-relations', 'Conferences', 'conference', conferenceRows),
    createItemList('detail-relations', 'Historical events', 'event', eventRows)
  ].filter(Boolean);
}

// Only well-formed HTTPS links from the data become live links.
export function parseHttpsUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

function createSources(links) {
  const valid = (Array.isArray(links) ? links : [])
    .map((link) => ({ ...link, parsed: parseHttpsUrl(link?.url) }))
    .filter((link) => link.parsed);
  if (!valid.length) return null;
  const section = document.createElement('section');
  section.className = 'detail-sources';
  section.appendChild(createSectionHeading('Further reading'));
  const list = document.createElement('ul');
  list.className = 'detail-source-list';
  valid.forEach((link) => {
    const item = document.createElement('li');
    const label = link.label || link.parsed.hostname;
    item.appendChild(createExternalLink(link.parsed.href, label, label, 'detail-source-link'));
    list.appendChild(item);
  });
  section.appendChild(list);
  return section;
}

export function formatCitation(authorName, year, publicationTitle, doi) {
  const parts = [`${authorName || 'Unknown author'} (${year || 'n.d.'}).`, `${publicationTitle || 'Untitled'}.`];
  if (doi) parts.push(`https://doi.org/${doi}`);
  return parts.join(' ');
}

function createCitationAction(citation) {
  const wrapper = document.createElement('div');
  wrapper.className = 'detail-citation';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'text-button detail-cite-button';
  button.textContent = 'Copy citation';
  const status = document.createElement('span');
  status.className = 'detail-citation-status';
  status.setAttribute('role', 'status');
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(citation);
      status.textContent = 'Citation copied.';
    } catch {
      status.textContent = citation;
    }
  });
  wrapper.append(button, status);
  return wrapper;
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
  button.addEventListener('click', () => locateScientistOnTimeline(scientistId, scientist));
  return button;
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

// Publication abstracts are listed separately, so they are not reused here.
function getScientistSummary(scientist) {
  return scientist.summary || scientist.details || null;
}

// True when the free-text discoverer names people who are not linked
// scientists, so the text still carries information the portraits do not.
export function hasUnlinkedDiscoverers(discovererText, linkedNames) {
  let remainder = String(discovererText || '');
  if (/\bothers\b/i.test(remainder)) return true;
  // Match word by word, because texts often shorten names ("Arno Penzias"
  // for "Arno A. Penzias").
  linkedNames.filter(Boolean).forEach((name) => {
    name.replace(/[()]/g, ' ').split(/\s+/).filter((word) => word.replace(/\W/g, '').length > 2).forEach((word) => {
      remainder = remainder.split(word).join(' ');
    });
  });
  // Initials and joining words alone do not name anyone.
  return remainder
    .replace(/\b(and|with)\b/gi, ' ')
    .split(/[\s,;&·()]+/)
    .some((word) => word.replace(/[^\p{L}]/gu, '').length > 1);
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

function resetHeader() {
  identity.hidden = true;
  identity.textContent = '';
  media.hidden = true;
  portraitNote.hidden = true;
  metadata.hidden = false;
}

function renderTimelineItem({
  type,
  actorName = '',
  year,
  itemTitle,
  description,
  scientistIds = [],
  attendeeIds = [],
  theoristIds = [],
  location = '',
  historicalMap = null,
  photo = null,
  extraMetadata = [],
  extraBody = []
}) {
  const typeLabels = {
    publication: 'Publication',
    discovery: 'Scientific discovery',
    conference: 'Scientific conference',
    event: 'Historical context'
  };

  eyebrow.textContent = typeLabels[type] || 'Timeline item';
  title.textContent = itemTitle || 'Untitled item';
  resetHeader();
  body.replaceChildren();
  const conferencePhoto = type === 'conference' ? createConferencePhoto(photo, itemTitle) : null;
  if (conferencePhoto) body.appendChild(conferencePhoto);
  const descriptionText = document.createElement('p');
  descriptionText.className = 'detail-copy';
  descriptionText.textContent = description || 'No further details are available.';
  body.appendChild(descriptionText);
  const peopleGrid = type === 'conference'
    ? createScientistGrid(attendeeIds, 'Attendees', 'attendee')
    : type === 'discovery'
      ? createScientistGrid([
        ...(Array.isArray(scientistIds) ? scientistIds : []).map((id) => ({ id, role: 'Discoverer' })),
        ...(Array.isArray(theoristIds) ? theoristIds : []).map((id) => ({ id, role: 'Theorist' }))
      ], 'Scientists', 'scientist')
      : type === 'event'
        ? createScientistGrid(attendeeIds, 'People involved', 'person')
        : null;
  if (peopleGrid) body.appendChild(peopleGrid);
  extraBody.filter(Boolean).forEach((element) => body.appendChild(element));

  const itemMetadata = [];
  if (type === 'event') {
    itemMetadata.push(['Period', year]);
  } else {
    if (type === 'discovery') {
      // The portrait grid already names linked discoverers and theorists.
      const linkedNames = (Array.isArray(scientistIds) ? scientistIds : []).map((id) => scientists[id]?.name);
      if (!peopleGrid || hasUnlinkedDiscoverers(actorName, linkedNames)) {
        itemMetadata.push(['Discoverer', actorName || 'Not recorded']);
      }
    } else if (type === 'publication') {
      itemMetadata.push(['Author', createScientistLinks(scientistIds, actorName)]);
    }
    if (type !== 'discovery' && Array.isArray(theoristIds) && theoristIds.length) {
      itemMetadata.push(['Theorists', createScientistLinks(theoristIds, '')]);
    }
    if (type === 'conference' && location) {
      itemMetadata.push(['Location', createMapLink(location)]);
    }
    const historicalMapLink = type === 'conference' ? createHistoricalMapLink(historicalMap) : null;
    if (historicalMapLink) {
      itemMetadata.push(['Historical map', historicalMapLink]);
    }
    itemMetadata.push(['Year', String(year || 'Not recorded')]);
  }
  renderMetadata([...itemMetadata, ...extraMetadata]);
}

function renderPublication(scientistId, index) {
  const scientist = scientists[scientistId];
  const publication = scientist?.publications?.[index];
  if (!publication) return false;
  const extraMetadata = [];
  if (publication.doi) {
    extraMetadata.push(['DOI', createExternalLink(`https://doi.org/${publication.doi}`, publication.doi, `DOI ${publication.doi}`)]);
  }
  const source = parseHttpsUrl(publication.source);
  if (source) {
    extraMetadata.push(['Source', createExternalLink(source.href, source.hostname, 'View the publication source')]);
  }
  renderTimelineItem({
    type: 'publication',
    actorName: scientist.name,
    year: publication.year,
    itemTitle: publication.title,
    description: publication.abstract,
    scientistIds: [scientistId],
    extraMetadata,
    extraBody: [createCitationAction(formatCitation(scientist.name, publication.year, publication.title, publication.doi))]
  });
  return true;
}

function renderDiscovery(index) {
  const item = discoveries[index];
  if (!item) return false;
  renderTimelineItem({
    type: 'discovery',
    actorName: item.discoverer,
    year: item.year,
    itemTitle: item.title,
    description: item.details,
    scientistIds: item.scientist_ids,
    theoristIds: item.theorist_ids
  });
  return true;
}

function renderConference(index) {
  const item = conferences[index];
  if (!item) return false;
  renderTimelineItem({
    type: 'conference',
    year: item.year,
    itemTitle: item.title,
    description: item.details,
    attendeeIds: item.attendee_ids,
    theoristIds: item.theorist_ids,
    location: item.location,
    historicalMap: item.historical_map,
    photo: item.photo
  });
  return true;
}

function renderEvent(index) {
  const item = significantEvents[index];
  if (!item) return false;
  renderTimelineItem({
    type: 'event',
    year: item.startYear === item.endYear ? `${item.startYear}` : `${item.startYear}–${item.endYear}`,
    itemTitle: item.title,
    description: item.details,
    attendeeIds: item.attendee_ids
  });
  return true;
}

// Lists people who stay grouped even at the closest zoom.
function renderGroup(scientistIds, fromYear, toYear) {
  eyebrow.textContent = 'Scientists';
  title.textContent = fromYear === toYear ? `Scientists in ${fromYear}` : `Scientists, ${fromYear}–${toYear}`;
  resetHeader();
  identity.textContent = 'These people are too close together in time to show separately.';
  identity.hidden = false;
  metadata.replaceChildren();
  metadata.hidden = true;
  body.replaceChildren(...[createScientistGrid(scientistIds, 'People', 'person')].filter(Boolean));
  return true;
}

function renderScientist(scientistId, fromTimeline) {
  const scientist = scientists[scientistId];
  if (!scientist) return false;

  eyebrow.textContent = 'Scientist';
  title.textContent = scientist.name || 'Unknown scientist';
  resetHeader();
  identity.textContent = getIdentityLine(scientist);
  identity.hidden = !identity.textContent;
  metadata.replaceChildren();
  metadata.hidden = true;

  const summaryText = getScientistSummary(scientist);
  let summary = null;
  if (summaryText) {
    summary = document.createElement('p');
    summary.className = 'detail-summary';
    summary.textContent = summaryText;
  }

  // Items opened from the timeline are already selected and in view.
  const locateAction = fromTimeline ? null : createLocateAction(scientistId, scientist);
  body.replaceChildren(...[
    createAcademicAffiliations(scientist),
    summary,
    createPublicationList(scientistId, scientist),
    ...createRelationLists(scientistId),
    createSources(scientist.links),
    locateAction
  ].filter(Boolean));

  const portrait = createPortrait(scientist, 'detail-portrait');
  if (portrait instanceof HTMLImageElement) {
    portrait.alt = scientist.name ? `Portrait of ${scientist.name}` : 'Scientist portrait';
  }
  media.replaceChildren(portrait);
  media.style.setProperty('--scientist-color', scientist.color || 'var(--accent)');
  media.hidden = false;
  portraitNote.hidden = Boolean(getPortraitSource(scientist));
  return true;
}

function renderKey(key, fromTimeline) {
  const [type, id, extra] = String(key).split(':');
  if (type === 'scientist') return renderScientist(id, fromTimeline);
  if (type === 'publication') return renderPublication(id, Number(extra));
  if (type === 'discovery') return renderDiscovery(Number(id));
  if (type === 'conference') return renderConference(Number(id));
  if (type === 'event') return renderEvent(Number(id));
  if (type === 'group') {
    const [memberIds, from, to] = key.slice('group:'.length).split('|');
    return renderGroup(memberIds.split(','), Number(from), Number(to));
  }
  return false;
}

export function groupKey(scientistIds, fromYear, toYear) {
  return `group:${scientistIds.join(',')}|${fromYear}|${toYear}`;
}

function updateBackButton() {
  const previous = history[history.length - 1];
  backButton.hidden = !previous;
  if (!previous) return;
  backButton.querySelector('.detail-back-label').textContent = previous.title;
  backButton.setAttribute('aria-label', `Back to ${previous.title}`);
}

// Opens any timeline item in the panel by key, recording the previous item so
// the reader can step back through what they have explored.
export function openItem(key, { fromTimeline = false, fromHistory = false } = {}) {
  if (!panel && !fetchElements()) return false;
  const wasOpen = !panel.hidden && !closeTimer;
  if (!renderKey(key, fromTimeline)) return false;

  if (wasOpen && current && current.key !== key && !fromHistory) history.push(current);
  if (!wasOpen && !fromHistory) history = [];
  current = { key, title: title.textContent };
  updateBackButton();
  panel.scrollTop = 0;
  openPanel({ refocus: wasOpen, peek: fromTimeline });
  document.dispatchEvent(new CustomEvent('papertrails:itemopened', { detail: { key, fromTimeline } }));
  return true;
}

export function goBack() {
  const previous = history.pop();
  if (!previous) return;
  openItem(previous.key, { fromHistory: true });
}

function setPeek(peek) {
  panel.classList.toggle('is-peek', peek);
  sheetHandle.setAttribute('aria-expanded', String(!peek));
  sheetHandle.setAttribute('aria-label', peek ? 'Show all details' : 'Show less');
}

function openPanel({ refocus = false, peek = false } = {}) {
  if (!panel || !backdrop) return;

  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }

  const docked = isPanelDocked();
  const opening = panel.hidden;
  if (opening) {
    lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }
  panel.classList.toggle('is-docked', docked);
  panel.setAttribute('role', docked ? 'complementary' : 'dialog');
  if (docked) {
    panel.removeAttribute('aria-modal');
  } else {
    panel.setAttribute('aria-modal', 'true');
  }
  panel.hidden = false;
  backdrop.hidden = docked;
  // On phones, items tapped on the timeline open as a short peek so the
  // reader can scan without losing the timeline; the handle expands it.
  if (opening) setPeek(!docked && peek);
  if (opening) {
    document.body.classList.toggle('has-docked-panel', docked);
    document.dispatchEvent(new CustomEvent('papertrails:panellayout'));
  }

  requestAnimationFrame(() => {
    panel.classList.add('is-open');
    backdrop.classList.add('is-open');
    if (opening || refocus) {
      // A docked panel sits beside the timeline, so focus its heading; a modal
      // sheet focuses its close button.
      (docked ? title : closeButton).focus({ preventScroll: true });
    }
  });
}

export function closeModal({ restoreFocus = true, afterClose = null } = {}) {
  if (!panel || panel.hidden || closeTimer) return;

  panel.classList.remove('is-open');
  backdrop.classList.remove('is-open');
  const wasDocked = panel.classList.contains('is-docked');
  closeTimer = window.setTimeout(() => {
    panel.hidden = true;
    backdrop.hidden = true;
    closeTimer = null;
    document.body.classList.remove('has-docked-panel');
    if (wasDocked) document.dispatchEvent(new CustomEvent('papertrails:panellayout'));
    if (typeof afterClose === 'function') afterClose();
  }, wasDocked ? 0 : 230);

  history = [];
  current = null;
  document.dispatchEvent(new CustomEvent('papertrails:detailsclosed'));
  if (restoreFocus && lastFocusedElement?.isConnected) lastFocusedElement.focus({ preventScroll: true });
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

  closeButton.addEventListener('click', () => closeModal());
  backButton.addEventListener('click', goBack);
  sheetHandle.addEventListener('click', () => setPeek(!panel.classList.contains('is-peek')));
  panel.addEventListener('scroll', () => {
    if (panel.scrollTop > 0 && panel.classList.contains('is-peek')) setPeek(false);
  });
  backdrop.addEventListener('click', () => closeModal());
  window.addEventListener('keydown', (event) => {
    if (panel.hidden || document.querySelector('dialog[open]')) return;
    if (event.key === 'Escape') {
      // The docked panel shares the page with other controls, so it only
      // takes Escape presses that no other control has already handled.
      if (event.defaultPrevented) return;
      closeModal();
      return;
    }
    if (event.key === 'ArrowLeft' && event.altKey && history.length) {
      event.preventDefault();
      goBack();
      return;
    }
    // Only the modal sheet traps focus; the docked panel is part of the page.
    if (event.key === 'Tab' && !panel.classList.contains('is-docked')) {
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

  // Moving between docked and sheet layouts while open re-applies the mode.
  window.matchMedia?.(DOCKED_QUERY).addEventListener?.('change', () => {
    if (panel.hidden) return;
    const docked = isPanelDocked();
    panel.classList.toggle('is-docked', docked);
    panel.setAttribute('role', docked ? 'complementary' : 'dialog');
    if (docked) panel.removeAttribute('aria-modal'); else panel.setAttribute('aria-modal', 'true');
    backdrop.hidden = docked;
    document.body.classList.toggle('has-docked-panel', docked);
    document.dispatchEvent(new CustomEvent('papertrails:panellayout'));
  });
}
