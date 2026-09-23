import { config } from './config.js?v=15';

// Every horizontal position on the timeline is derived from these two
// functions, so alternative scales only need to change this module.
export function yearToX(year, width) {
  return ((year - config.START_YEAR) / config.YEAR_SPAN) * width;
}

export function xToYear(x, width) {
  return config.START_YEAR + (x / width) * config.YEAR_SPAN;
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
