// Publication anchors remain authoritative. A scientist with no listed papers
// can appear at the earliest discovery or conference that explicitly links them.
export function getScientistAnchor(id, scientist, discoveries = [], conferences = []) {
  const publication = (scientist?.publications || [])
    .filter(item => Number.isFinite(item.year))
    .reduce((first, item) => !first || item.year < first.year ? item : first, null);
  if (publication) return { type: 'publication', year: publication.year, title: publication.title };

  const candidates = [
    ...discoveries.filter(item => [...(item.scientist_ids || []), ...(item.theorist_ids || [])].includes(id))
      .map(item => ({ type: 'discovery', year: item.year, title: item.title })),
    ...conferences.filter(item => (item.attendee_ids || []).includes(id))
      .map(item => ({ type: 'conference', year: item.year, title: item.title }))
  ].filter(item => Number.isFinite(item.year));
  return candidates.reduce((first, item) => !first || item.year < first.year ? item : first, null);
}
