// Editorial depictions link to the existing scientific records. Observation
// years locate the drawing; they never replace a paper's publication year.
export function scientificStoryRecords(scientists, discoveries) {
  const paper = scientists.halley?.publications?.find(p => p.id === 'halley-work-00');
  const recovery = discoveries.find(d => d.id === 'discovery-13');
  const records = [];
  if (paper) records.push({ id: 'story-halley-1682', itemKey: `publication:${paper.id}`,
    title: 'Halley’s Comet observed in 1682', startYear: 1682, endYear: 1682,
    inscription: 'ISTI MIRANT STELLA',
    details: `Late-seventeenth-century observers watch the comet. Halley discussed this apparition in his ${paper.year} publication and predicted its return. Select to read that publication; its recorded year remains ${paper.year}.` });
  if (recovery) records.push({ id: 'story-halley-return', itemKey: `discovery:${recovery.id}`,
    title: 'The predicted return of Halley’s Comet', startYear: recovery.year, endYear: 1759,
    inscription: 'COMETA REVERTITVR', details: recovery.details });
  return records;
}
