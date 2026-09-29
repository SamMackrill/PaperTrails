// Persisted record IDs own public links. legacyKey is a frozen migration alias,
// never recalculated from the record's current position in a YAML array.
export function recordKey(type, record, legacyKey) {
  return record?.id ? `${type}:${record.id}` : legacyKey;
}

export function buildItemIndex({ scientists = {}, discoveries = [], conferences = [], significantEvents = [] }) {
  const records = new Map();
  const aliases = new Map();
  const current = new Map();
  const add = (type, item, position, scientistId = null) => {
    const currentKey = type === 'scientist' ? `scientist:${scientistId}`
      : type === 'publication' ? `publication:${scientistId}:${position}` : `${type}:${position}`;
    const key = recordKey(type, item, currentKey);
    if (item.id && !/^[a-zA-Z0-9_-]+$/.test(item.id)) throw new Error(`Invalid record ID: ${key}`);
    if (records.has(key)) throw new Error(`Duplicate record ID: ${key}`);
    records.set(key, { key, type, item, index: position, scientistId });
    current.set(currentKey, key);
    const alias = item.legacyKey || (item.id ? null : currentKey);
    if (alias) {
      const prefix = type === 'publication' ? `publication:${scientistId}:` : `${type}:`;
      if (!alias.startsWith(prefix)) throw new Error(`Legacy key belongs to another record type or scientist: ${alias}`);
      if (aliases.has(alias)) throw new Error(`Duplicate legacy key: ${alias}`);
      aliases.set(alias, key);
    }
  };
  for (const [scientistId, scientist] of Object.entries(scientists)) {
    add('scientist', scientist, null, scientistId);
    (scientist.publications || []).forEach((publication, index) => add('publication', publication, index, scientistId));
  }
  discoveries.forEach((item, index) => add('discovery', item, index));
  conferences.forEach((item, index) => add('conference', item, index));
  significantEvents.forEach((item, index) => add('event', item, index));
  for (const alias of aliases.keys()) {
    if (records.has(alias) && alias !== aliases.get(alias)) throw new Error(`Legacy key shadows record: ${alias}`);
  }
  return {
    records,
    resolve: (key) => records.get(key) || records.get(aliases.get(key)) || null,
    at: (key) => current.get(key) || key
  };
}
