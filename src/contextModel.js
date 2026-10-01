import { validateSources } from './researchModel.js';

export function contextDate(event) {
  const range = event.startYear === event.endYear ? String(event.startYear) : `${event.startYear}–${event.endYear}`;
  return `${event.approximate ? 'c. ' : ''}${range}${event.dateQualifier ? ` (${event.dateQualifier})` : ''}`;
}

// Curated chapters are repository-owned, but malformed dates and unsourced
// history still fail loading rather than silently painting a misleading span.
export function validateContextChapters(events) {
  for (const event of events) {
    if (!event.chapters) continue;
    validateSources(event.sources, event.id);
    if (!Number.isFinite(event.startYear) || !Number.isFinite(event.endYear) || event.endYear < event.startYear) {
      throw new Error(`${event.id}: invalid context interval`);
    }
    const ids = new Set();
    let previousEnd = event.startYear;
    if (!Array.isArray(event.chapters) || !event.chapters.length) throw new Error(`${event.id}: missing chapters`);
    for (const chapter of event.chapters) {
      if (!chapter.id || ids.has(chapter.id) || !chapter.title || !chapter.scene || !chapter.details
        || !Number.isFinite(chapter.startYear) || !Number.isFinite(chapter.endYear)
        || chapter.startYear < previousEnd || chapter.endYear < chapter.startYear || chapter.endYear > event.endYear) {
        throw new Error(`${event.id}: invalid chapter ${chapter.id}`);
      }
      ids.add(chapter.id);
      previousEnd = chapter.endYear;
    }
  }
}
