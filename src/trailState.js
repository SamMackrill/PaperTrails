// Shared state keeps the renderer and explanation controls in the same route.
let active = null;
let stopId = null;
let explain = false;
export function setTrailState(trail, stop, panel = false) {
  active = trail || null;
  stopId = active?.stops.find(s => s.id === stop)?.id || active?.stops[0]?.id || null;
  explain = Boolean(active && panel);
}
export function getTrailState() { return { trail: active?.id || null, stop: stopId, explain }; }
export function getActiveTrail() { return active; }
export function trailIncludes(key) { return !active || active.stops.some(stop => stop.item === key); }
export function trailScientistIds(resolve) {
  return active ? new Set(active.stops.map(stop => resolve(stop.item)?.scientistId).filter(Boolean)) : null;
}

// Labels get separate rows when they would overlap; the dated anchor never moves.
export function layoutTrailLabels(points, width, labelWidth = 144) {
  const rows = [];
  return points.map(point => {
    const left = Math.max(0, Math.min(width - labelWidth, point.x - labelWidth / 2));
    let row = rows.findIndex(end => end + 8 <= left);
    if (row < 0) { row = rows.length; rows.push(0); }
    rows[row] = left + labelWidth;
    return { ...point, left, row };
  });
}

// Route labels rise in 64px rows above their dated rail. Keep every assigned
// row inside the timeline when a narrow view needs additional rows.
export function trailRouteRailY(axisY, highestRow) {
  return Math.max(135, axisY - 52, 64 + highestRow * 64);
}
