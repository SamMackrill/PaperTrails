// Historical dates may preserve a truthful year or circa year without inventing
// a month/day. The same parsing is used by identity text and lifespan geometry.
export function parseScientistYear(date) {
  const match = String(date || '').match(/^(?:c\.\s*)?(\d{4})(?:$|-\d{2}-\d{2}$)/);
  return match ? Number(match[1]) : null;
}

export function formatScientistYear(date) {
  const year = parseScientistYear(date);
  if (year === null) return null;
  return /^c\./.test(String(date)) ? `c. ${year}` : String(year);
}
