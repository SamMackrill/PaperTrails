import { recordKey } from './itemIdentity.js';
// Search across every item on the timeline. Matching ignores case and
// diacritics, and transliterates letters that Unicode decomposition leaves
// alone, so "Orsted" finds Ørsted and "Romer" finds Rømer.

const TRANSLITERATIONS = { ø: 'o', æ: 'ae', œ: 'oe', ß: 'ss', ł: 'l', đ: 'd', ð: 'd', þ: 'th', ı: 'i' };
const TYPE_ORDER = ['trail', 'scientist', 'publication', 'discovery', 'conference', 'event'];
const TYPE_LABELS = {
  trail: 'Idea trails',
  scientist: 'Scientists',
  publication: 'Publications',
  discovery: 'Discoveries',
  conference: 'Conferences',
  event: 'Historical events'
};
const PER_GROUP = 5;

export function foldText(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[øæœßłđðþı]/g, (letter) => TRANSLITERATIONS[letter]);
}

function yearNumber(value) {
  const match = String(value || '').match(/\d{4}/);
  return match ? Number(match[0]) : null;
}

export function buildSearchIndex({ scientists, discoveries, conferences, significantEvents, trails = [] }) {
  const entries = [];
  (Array.isArray(trails) ? trails : []).forEach((trail) => {
    entries.push({
      key: `trail:${trail.id}`,
      trailId: trail.id,
      type: 'trail',
      title: trail.title,
      detail: `${trail.stops?.length || 0} stops`,
      keywords: [trail.question, trail.scope, ...(trail.stops || []).map((stop) => stop.label)].filter(Boolean).join(' · '),
      year: null,
      endYear: null,
      notability: 1
    });
  });
  Object.entries(scientists).forEach(([id, scientist]) => {
    const birthYear = yearNumber(scientist.birth);
    const deathYear = yearNumber(scientist.death);
    const institutions = (scientist.academic_affiliations || []).map((a) => a?.institution).filter(Boolean);
    entries.push({
      key: `scientist:${id}`,
      type: 'scientist',
      title: scientist.name,
      detail: scientist.nationality || '',
      keywords: [scientist.summary, scientist.details, ...institutions].filter(Boolean).join(' · '),
      year: birthYear,
      endYear: deathYear,
      notability: Number(scientist.notability) || 2,
      scientistId: id
    });
    (scientist.publications || []).forEach((publication, index) => {
      entries.push({
        key: recordKey('publication', publication, `publication:${id}:${index}`),
        type: 'publication',
        title: publication.title,
        detail: scientist.name,
        keywords: publication.abstract || '',
        year: publication.year,
        endYear: null,
        notability: Number(scientist.notability) || 2
      });
    });
  });
  discoveries.forEach((item, index) => entries.push({
    key: recordKey('discovery', item, `discovery:${index}`),
    type: 'discovery',
    title: item.title,
    detail: item.discoverer || '',
    keywords: [item.particle, item.details].filter(Boolean).join(' · '),
    year: item.year,
    endYear: null,
    notability: 2
  }));
  conferences.forEach((item, index) => entries.push({
    key: recordKey('conference', item, `conference:${index}`),
    type: 'conference',
    title: item.title,
    detail: item.location || '',
    keywords: item.details || '',
    year: item.year,
    endYear: null,
    notability: 2
  }));
  significantEvents.forEach((item, index) => entries.push({
    key: recordKey('event', item, `event:${index}`),
    type: 'event',
    title: item.title,
    detail: item.shortTitle || '',
    keywords: item.details || '',
    year: item.startYear,
    endYear: item.endYear,
    notability: 2
  }));
  entries.forEach((entry) => {
    entry.foldedTitle = foldText(entry.title);
    entry.foldedDetail = foldText(entry.detail);
    entry.foldedKeywords = foldText(entry.keywords || '');
    entry.yearText = [entry.year, entry.endYear].filter(Number.isFinite).join(' ');
  });
  return entries;
}

function buildSnippet(text, words, maxLength = 96) {
  if (!text) return '';
  const folded = foldText(text);
  let bestIndex = -1;
  for (const word of words) {
    const idx = folded.indexOf(word);
    if (idx !== -1 && (bestIndex === -1 || idx < bestIndex)) bestIndex = idx;
  }
  if (bestIndex === -1) return '';
  const start = Math.max(0, bestIndex - 28);
  const raw = text.slice(start, start + maxLength).trim();
  return `${start > 0 ? '…' : ''}${raw}${start + maxLength < text.length ? '…' : ''}`;
}

function scoreEntry(entry, query, words) {
  const numericYear = /^\d{4}$/.test(query) ? Number(query) : null;
  const matchesPrimary = words.every((word) => (
    entry.foldedTitle.includes(word) || entry.foldedDetail.includes(word) || entry.yearText.includes(word)
  ));
  const matchesAny = matchesPrimary || words.every((word) => (
    entry.foldedTitle.includes(word) || entry.foldedDetail.includes(word) || entry.foldedKeywords.includes(word) || entry.yearText.includes(word)
  ));
  const spansYear = numericYear !== null
    && Number.isFinite(entry.year)
    && Number.isFinite(entry.endYear)
    && entry.type === 'event'
    && numericYear >= entry.year
    && numericYear <= entry.endYear;

  if (!matchesAny && !spansYear) return 0;

  let score = matchesPrimary ? 20 : 2;
  if (numericYear !== null) {
    if (entry.year === numericYear) score += 90;
    else if (entry.endYear === numericYear) score += 50;
    else if (spansYear) score += 30;
  }
  if (entry.foldedTitle === query) score += 100;
  if (entry.foldedTitle.startsWith(query)) score += 40;
  if (entry.foldedTitle.split(/[^\p{L}\p{N}]+/u).some((word) => word.startsWith(words[0]))) score += 20;
  if (words.every((word) => entry.foldedTitle.includes(word))) score += 12;
  score += (3 - entry.notability) * 6;
  return score;
}

// Returns matching entries grouped by type, best matches first.
export function searchIndex(index, rawQuery) {
  const query = foldText(rawQuery).trim();
  if (!query) return [];
  const words = query.split(/\s+/);
  const scored = index
    .map((entry) => {
      const score = scoreEntry(entry, query, words);
      if (!score) return null;
      const inTitleOrDetail = words.every((word) => (
        entry.foldedTitle.includes(word) || entry.foldedDetail.includes(word) || entry.yearText.includes(word)
      ));
      const snippet = !inTitleOrDetail && entry.keywords ? buildSnippet(entry.keywords, words) : '';
      return { entry: snippet ? { ...entry, snippet } : entry, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || (a.entry.year || 0) - (b.entry.year || 0));
  return TYPE_ORDER
    .map((type) => ({
      type,
      label: TYPE_LABELS[type],
      results: scored.filter(({ entry }) => entry.type === type).slice(0, PER_GROUP).map(({ entry }) => entry)
    }))
    .filter((group) => group.results.length);
}

// Highlights matched query terms safely using DOM nodes (no innerHTML).
function appendHighlighted(target, text, words) {
  if (!text || !words.length) {
    target.textContent = text || '';
    return;
  }
  const source = String(text);
  let folded = '';
  const map = [];
  for (let i = 0; i < source.length; i += 1) {
    const piece = foldText(source[i]);
    for (let j = 0; j < piece.length; j += 1) {
      folded += piece[j];
      map.push(i);
    }
  }
  const ranges = [];
  words.forEach((word) => {
    if (!word) return;
    let from = 0;
    while (from < folded.length) {
      const idx = folded.indexOf(word, from);
      if (idx === -1) break;
      const start = map[idx];
      const end = map[idx + word.length - 1] + 1;
      ranges.push([start, end]);
      from = idx + word.length;
    }
  });
  if (!ranges.length) {
    target.textContent = source;
    return;
  }
  ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const merged = [];
  ranges.forEach(([start, end]) => {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  });
  let cursor = 0;
  merged.forEach(([start, end]) => {
    if (start > cursor) target.append(document.createTextNode(source.slice(cursor, start)));
    const mark = document.createElement('mark');
    mark.textContent = source.slice(start, end);
    target.append(mark);
    cursor = end;
  });
  if (cursor < source.length) target.append(document.createTextNode(source.slice(cursor)));
}

// Wires the header search field as an ARIA combobox.
export function setupSearch({ input, listbox, clearButton = null, getIndex, onChoose }) {
  let options = [];
  let activeIndex = -1;

  const updateClear = () => {
    if (clearButton) clearButton.hidden = !input.value;
  };

  const close = () => {
    listbox.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    activeIndex = -1;
  };

  const setActive = (index) => {
    options.forEach((option, i) => option.setAttribute('aria-selected', String(i === index)));
    activeIndex = index;
    if (options[index]) {
      input.setAttribute('aria-activedescendant', options[index].id);
      options[index].scrollIntoView({ block: 'nearest' });
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  };

  const choose = (entry) => {
    close();
    input.value = '';
    updateClear();
    onChoose(entry);
  };

  const renderResults = () => {
    updateClear();
    const raw = input.value.trim();
    const groups = searchIndex(getIndex(), raw);
    const words = foldText(raw).split(/\s+/).filter(Boolean);
    listbox.replaceChildren();
    options = [];
    if (!raw) {
      close();
      return;
    }
    if (!groups.length) {
      const empty = document.createElement('li');
      empty.className = 'search-empty';
      empty.setAttribute('role', 'presentation');
      empty.textContent = 'No matches on the timeline';
      listbox.appendChild(empty);
    }
    groups.forEach((group) => {
      const heading = document.createElement('li');
      heading.className = 'search-group';
      heading.setAttribute('role', 'presentation');
      heading.textContent = group.label;
      listbox.appendChild(heading);
      group.results.forEach((entry) => {
        const option = document.createElement('li');
        option.className = `search-option search-${entry.type}`;
        option.id = `search-option-${options.length}`;
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', 'false');
        const title = document.createElement('span');
        title.className = 'search-option-title';
        appendHighlighted(title, entry.title, words);
        const meta = document.createElement('span');
        meta.className = 'search-option-meta';
        const yearDisplay = entry.type === 'event' && entry.endYear && entry.endYear !== entry.year
          ? `${entry.year}–${entry.endYear}`
          : entry.year;
        appendHighlighted(meta, [yearDisplay, entry.detail].filter(Boolean).join(' · '), words);
        option.append(title, meta);
        if (entry.snippet) {
          const snippet = document.createElement('span');
          snippet.className = 'search-option-snippet';
          appendHighlighted(snippet, entry.snippet, words);
          option.append(snippet);
        }
        option.addEventListener('mousedown', (event) => event.preventDefault());
        option.addEventListener('click', () => choose(entry));
        options.push(option);
        option.entry = entry;
        listbox.appendChild(option);
      });
    });
    listbox.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    setActive(options.length ? 0 : -1);
  };

  clearButton?.addEventListener('mousedown', (event) => event.preventDefault());
  clearButton?.addEventListener('click', () => {
    input.value = '';
    updateClear();
    close();
    input.focus();
  });
  input.addEventListener('input', renderResults);
  input.addEventListener('focus', () => { if (input.value.trim()) renderResults(); });
  input.addEventListener('blur', () => window.setTimeout(close, 120));
  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' && options.length) {
      event.preventDefault();
      setActive((activeIndex + 1) % options.length);
    } else if (event.key === 'ArrowUp' && options.length) {
      event.preventDefault();
      setActive((activeIndex - 1 + options.length) % options.length);
    } else if (event.key === 'Enter' && options[activeIndex]) {
      event.preventDefault();
      choose(options[activeIndex].entry);
    } else if (event.key === 'Escape') {
      event.stopPropagation();
      if (input.value) {
        input.value = '';
        updateClear();
        close();
      } else {
        input.blur();
      }
    }
  });
}
