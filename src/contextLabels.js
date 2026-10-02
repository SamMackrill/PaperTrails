// Labels may borrow space outside their event span; their connector stays on
// the real visible braid. Whole labels are hidden only when all rows are full.
export function layoutContextLabels(labels, left, right, rows = 3, reserved = []) {
  const occupied = Array.from({ length: rows }, () => []), placed = [];
  const available = right - left - 8;
  if (available <= 0) return placed;
  for (const label of reserved) {
    const labelRows = Math.max(1, label.lines || 1);
    for (let row = Math.max(0, label.row || 0); row < Math.min(rows, (label.row || 0) + labelRows); row++)
      occupied[row].push([label.left, label.left + label.width]);
  }
  for (const label of [...labels].sort((a, b) => (b.priority || 0) - (a.priority || 0) || (a.end - a.start) - (b.end - b.start) || a.start - b.start)) {
    if (label.end < left || label.start > right || label.width <= 0
      || (label.width > available && !label.lines)) continue;
    const width = Math.min(label.width, available);
    const lines = Math.max(1, label.lines || 1);
    if (lines > rows) continue;
    const anchor = Math.max(left + 4, Math.min(right - 4, label.start));
    const desired = Math.max(left + 4, Math.min(right - width - 4, anchor + 4));
    let choice;
    for (let row = 0; row + lines <= rows; row++) {
      const intervals = occupied.slice(row, row + lines).flat();
      const candidates = [desired, ...intervals.flatMap(([a, b]) => [a - width - 8, b + 8])];
      for (const x of candidates) {
        if (x < left + 4 || x + width > right - 4
          || intervals.some(([a, b]) => x < b + 8 && x + width > a - 8)) continue;
        const distance = Math.abs(x - desired);
        if (distance > 240) continue;
        const score = distance + row * 24;
        if (!choice || score < choice.score) choice = { left: x, row, score };
      }
    }
    if (!choice) continue;
    for (let row = choice.row; row < choice.row + lines; row++) occupied[row].push([choice.left, choice.left + width]);
    placed.push({ ...label, ...choice, width, anchor });
  }
  return placed;
}
