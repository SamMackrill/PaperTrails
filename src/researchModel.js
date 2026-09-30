export const RELATION_LABELS = {
  influence: 'Documented influence',
  'prediction-test': 'Prediction → experimental test',
  'competing-theories': 'Competing explanations',
  'conceptual-bridge': 'Conceptual bridge'
};

const idPattern = /^[a-zA-Z0-9_-]+$/;
const nonempty = (value) => typeof value === 'string' && value.trim().length > 0;

export function validateSources(sources, owner) {
  if (!Array.isArray(sources) || !sources.length) throw new Error(`${owner}: evidence is required`);
  for (const source of sources) {
    let url;
    try { url = new URL(source.url); } catch { throw new Error(`${owner}: invalid evidence URL`); }
    if (url.protocol !== 'https:' || url.username || url.password || !nonempty(source.label) || !nonempty(source.locator)) {
      throw new Error(`${owner}: evidence needs a labelled HTTPS source and locator`);
    }
  }
}

export function buildResearchIndex(relations, trails, items) {
  if (!Array.isArray(relations) || !Array.isArray(trails)) throw new Error('Relations and trails must be lists');
  const relationById = new Map();
  const trailById = new Map();
  const byItem = new Map();
  // `records` also contains positional fallback keys while older content is
  // migrated. Those keys are safe for display aliases, but not for persisted
  // research links: reordering the source list could otherwise retarget one.
  const hasStableItemKey = (key) => {
    const record = items.records.get(key);
    return Boolean(record && (record.type === 'scientist' || record.item?.id));
  };
  for (const relation of relations) {
    if (!idPattern.test(relation.id || '') || relationById.has(relation.id)) throw new Error('Invalid or duplicate relation ID');
    if (!Object.hasOwn(RELATION_LABELS, relation.kind)) throw new Error(`${relation.id}: unknown relation kind`);
    for (const endpoint of [relation.from, relation.to]) {
      if (!hasStableItemKey(endpoint)) throw new Error(`${relation.id}: endpoint must be a stable item ID`);
    }
    if (!nonempty(relation.claim)) throw new Error(`${relation.id}: claim is required`);
    validateSources(relation.sources, relation.id);
    relationById.set(relation.id, relation);
    for (const endpoint of new Set([relation.from, relation.to])) {
      if (!byItem.has(endpoint)) byItem.set(endpoint, []);
      byItem.get(endpoint).push(relation);
    }
  }
  for (const trail of trails) {
    if (!idPattern.test(trail.id || '') || trailById.has(trail.id)) throw new Error('Invalid or duplicate trail ID');
    if (!nonempty(trail.title) || !nonempty(trail.question) || !Array.isArray(trail.stops) || !trail.stops.length) {
      throw new Error(`${trail.id}: title, question and stops are required`);
    }
    const stopIds = new Set();
    trail.stops.forEach((stop, index) => {
      if (!idPattern.test(stop.id || '') || stopIds.has(stop.id)) throw new Error(`${trail.id}: invalid or duplicate stop ID`);
      stopIds.add(stop.id);
      if (!hasStableItemKey(stop.item)) throw new Error(`${stop.id}: stop must reference a stable item ID`);
      if (!nonempty(stop.claim) || !nonempty(stop.significance)) throw new Error(`${stop.id}: claim and significance required`);
      validateSources(stop.sources, stop.id);
      if (stop.relation) {
        const relation = relationById.get(stop.relation);
        if (!relation || index === 0 || relation.from !== trail.stops[index - 1].item || relation.to !== stop.item) {
          throw new Error(`${stop.id}: transition must connect the preceding and current stop`);
        }
      } else if (index > 0) {
        throw new Error(`${stop.id}: the transition needs a sourced relation or explicit conceptual bridge`);
      }
    });
    trailById.set(trail.id, trail);
  }
  return { relationById, trailById, byItem };
}
