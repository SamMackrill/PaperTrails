import { config } from './config.js?v=15';

// Every horizontal position on the timeline is derived from these functions,
// so the alternative "even density" scale only changes this module.
//
// The density scale is piecewise linear: each era gets width in proportion to
// a blend of its length and the number of items in it, so busy centuries
// spread out and quiet ones compress without disappearing.
const ERA_BOUNDARIES = [1500, 1600, 1700, 1750, 1800, 1825, 1850, 1875, 1900, 1925, 1950, 1975, 2000];
const TIME_SHARE = 0.3;

let mode = 'linear';
// Cumulative [year, fraction] breakpoints for the density scale.
let breakpoints = null;

export function buildDensityBreakpoints(years, start = config.START_YEAR, end = config.END_YEAR) {
  const edges = [start, ...ERA_BOUNDARIES.filter((year) => year > start && year < end), end];
  const counts = edges.slice(1).map(() => 0);
  years.filter(Number.isFinite).forEach((year) => {
    // Buckets are half-open, so a boundary year counts in the era that
    // starts there, where yearToX draws it. The last bucket includes the end.
    const last = edges.length - 1;
    const index = edges.findIndex((edge, i) => i > 0 && (year < edge || (i === last && year <= edge))) - 1;
    if (index >= 0) counts[index] += 1;
  });
  const totalYears = end - start;
  const totalCount = counts.reduce((sum, count) => sum + count, 0) || 1;
  const weights = counts.map((count, i) => TIME_SHARE * ((edges[i + 1] - edges[i]) / totalYears) + (1 - TIME_SHARE) * (count / totalCount));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let cumulative = 0;
  return edges.map((year, i) => {
    if (i > 0) cumulative += weights[i - 1] / totalWeight;
    return [year, i === edges.length - 1 ? 1 : cumulative];
  });
}

export function setScaleMode(nextMode, years = []) {
  mode = nextMode === 'density' ? 'density' : 'linear';
  breakpoints = mode === 'density' ? buildDensityBreakpoints(years) : null;
}

export function getScaleMode() {
  return mode;
}

// Era boundaries with their share of the width, for drawing the compression
// that the density scale applies.
export function getScaleSegments() {
  if (!breakpoints) return [];
  return breakpoints.slice(1).map(([year, fraction], i) => ({
    from: breakpoints[i][0],
    to: year,
    start: breakpoints[i][1],
    end: fraction
  }));
}

function interpolate(value, pairs, fromIndex, toIndex) {
  const clamped = Math.max(pairs[0][fromIndex], Math.min(pairs[pairs.length - 1][fromIndex], value));
  const upper = pairs.findIndex((pair) => pair[fromIndex] >= clamped);
  if (upper <= 0) return pairs[0][toIndex];
  const [a, b] = [pairs[upper - 1], pairs[upper]];
  const span = b[fromIndex] - a[fromIndex] || 1;
  return a[toIndex] + ((clamped - a[fromIndex]) / span) * (b[toIndex] - a[toIndex]);
}

export function yearToX(year, width) {
  if (!breakpoints) return ((year - config.START_YEAR) / config.YEAR_SPAN) * width;
  return interpolate(year, breakpoints, 0, 1) * width;
}

export function xToYear(x, width) {
  if (!breakpoints) return config.START_YEAR + (x / width) * config.YEAR_SPAN;
  return interpolate(x / width, breakpoints, 1, 0);
}

// The zoom slider is logarithmic so that each step feels like the same
// amount of magnification at every zoom level.
export function sliderToScale(value, max = 1000) {
  const t = Math.max(0, Math.min(1, Number(value) / max));
  return config.MIN_SCALE * (config.MAX_SCALE / config.MIN_SCALE) ** t;
}

export function scaleToSlider(scale, max = 1000) {
  const t = Math.log(scale / config.MIN_SCALE) / Math.log(config.MAX_SCALE / config.MIN_SCALE);
  return Math.round(Math.max(0, Math.min(1, t)) * max);
}
