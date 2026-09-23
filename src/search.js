// Search across every item on the timeline. Matching ignores case and
// diacritics, and transliterates letters that Unicode decomposition leaves
// alone, so "Orsted" finds Ørsted and "Romer" finds Rømer.

const TRANSLITERATIONS = { ø: 'o', æ: 'ae', œ: 'oe', ß: 'ss', ł: 'l', đ: 'd', ð: 'd', þ: 'th', ı: 'i' };
const TYPE_ORDER = ['scientist', 'publication', 'discovery', 'conference', 'event'];
const TYPE_LABELS = {
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

export function buildSearchIndex({ scientists, discoveries, conferences, significantEvents }) {
  const entries = [];
  Object.entries(scientists).forEach(([id, scientist]) => {
    entries.push({
      key: `scientist:${id}`, type: 'scientist', title: scientist.name, detail: scientist.nationality || '',
      year: Number.parseInt(String(scientist.birth || '').slice(0, 4), 10) || null,
      notability: Number(scientist.notability) || 2, scientistId: id
    });
    (scientist.publications || []).forEach((publication, index) => {
      entries.push({
        key: `publication:${id}:${index}`, type: 'publication', title: publication.title, detail: scientist.name,
        year: publication.year, notability: Number(scientist.notability) || 2
      });
    });
  });
  discoveries.forEach((item, index) => entries.push({
    key: `discovery:${index}`, type: 'discovery', title: item.title, detail: item.discoverer || '', year: item.year, notability: 2
  }));
  conferences.forEach((item, index) => entries.push({
    key: `conference:${index}`, type: 'conference', title: item.title, detail: item.location || '', year: item.year, notability: 2
  }));
  significantEvents.forEach((item, index) => entries.push({
    key: `event:${index}`, type: 'event', title: item.title, detail: item.shortTitle || '', year: item.startYear, notability: 2
  }));
  entries.forEach((entry) => {
    entry.foldedTitle = foldText(entry.title);
    entry.foldedDetail = foldText(entry.detail);
  });
  return entries;
}

function scoreEntry(entry, query, words) {
  if (!words.every((word) => entry.foldedTitle.includes(word) || entry.foldedDetail.includes(word))) return 0;
  let score = 1;
  if (entry.foldedTitle === query) score += 100;
  if (entry.foldedTitle.startsWith(query)) score += 40;
  if (entry.foldedTitle.split(/[^\p{L}\p{N}]+/u).some((word) => word.startsWith(words[0]))) score += 20;
  if (words.every((word) => entry.foldedTitle.includes(word))) score += 10;
  score += (3 - entry.notability) * 6;
  return score;
}

// Returns matching entries grouped by type, best matches first.
export function searchIndex(index, rawQuery) {
  const query = foldText(rawQuery).trim();
  if (!query) return [];
  const words = query.split(/\s+/);
  const scored = index
    .map((entry) => ({ entry, score: scoreEntry(entry, query, words) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || (a.entry.year || 0) - (b.entry.year || 0));
  return TYPE_ORDER
    .map((type) => ({
      type,
      label: TYPE_LABELS[type],
      results: scored.filter(({ entry }) => entry.type === type).slice(0, PER_GROUP).map(({ entry }) => entry)
    }))
    .filter((group) => group.results.length);
}

// Wires the header search field as an ARIA combobox.
export function setupSearch({ input, listbox, getIndex, onChoose }) {
  let options = [];
  let activeIndex = -1;

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
    onChoose(entry);
  };

  const renderResults = () => {
    const groups = searchIndex(getIndex(), input.value);
    listbox.replaceChildren();
    options = [];
    if (!input.value.trim()) {
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
        title.textContent = entry.title;
        const meta = document.createElement('span');
        meta.className = 'search-option-meta';
        meta.textContent = [entry.year, entry.detail].filter(Boolean).join(' · ');
        option.append(title, meta);
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
        close();
      } else {
        input.blur();
      }
    }
  });
}
