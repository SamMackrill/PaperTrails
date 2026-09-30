export function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text != null) node.textContent = text;
  if (className) node.className = className;
  return node;
}

export function sourceList(sources) {
  const list = element('ol', null, 'trail-sources');
  for (const source of sources || []) {
    let url;
    try { url = new URL(source.url); } catch { continue; }
    if (url.protocol !== 'https:' || url.username || url.password) continue;
    const item = element('li');
    const link = element('a', source.label);
    link.href = url.href; link.target = '_blank'; link.rel = 'noopener noreferrer';
    item.append(link, element('p', source.locator, 'source-locator'));
    list.append(item);
  }
  return list;
}

export function stopContent(stop, record, relation, relationLabel, { expanded = false } = {}) {
  const section = element('section', null, 'trail-stop-content');
  section.append(element('h3', stop.label), element('p', stop.claim, 'trail-claim'));
  section.append(element('h4', 'Why it matters'), element('p', stop.significance));
  const dateNote = stop.dateNote || record.item.dateNote;
  if (dateNote) section.append(element('p', dateNote, 'trail-date-note'));
  const evidence = element('details', null, 'trail-evidence');
  evidence.open = expanded;
  evidence.append(element('summary', 'Evidence and sources'), sourceList(stop.sources));
  if (relation) {
    evidence.append(element('h4', `How this stop connects · ${relationLabel}`), element('p', relation.claim), sourceList(relation.sources));
  }
  section.append(evidence);
  return section;
}
