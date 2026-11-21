// Pure cloth-unfolding dynamics and optical fold analysis for the linear
// Bayeux tapestry. Every function is deterministic, reversible, and DOM-free.

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const smoothstep = (t) => {
  const u = clamp(t, 0, 1);
  return u * u * (3 - 2 * u);
};

// Logarithmic unfolding tracks the logarithmic zoom slider and wheel gestures,
// so early zoom steps reveal fabric proportionally instead of bunching 50% of
// the unfolding into the final octave.
export function unfoldProgress(scale, minScale = 1, maxScale = 32) {
  if (!(maxScale > minScale) || scale <= minScale) return 0;
  if (scale >= maxScale) return 1;
  return clamp(Math.log(scale / minScale) / Math.log(maxScale / minScale), 0, 1);
}

// Allocates `available` exposed pixels across a panel wing's ordered pleats
// (innermost k = 0 nearest the front crown to outermost k = m - 1). Inner
// pleats unfurl first with a gentle overlap handoff (`overlap`), eliminating
// simultaneous Venetian-blind slivers while preserving exact total width.
export function allocatePleatCascade(widths, available, overlap = 0.28) {
  const n = widths.length;
  if (!n) return [];
  const total = widths.reduce((sum, w) => sum + w, 0);
  if (total <= 1e-8 || available <= 0) return widths.map(() => 0);
  if (available >= total - 1e-8) return [...widths];

  const intervals = [];
  let acc = 0;
  for (let k = 0; k < n; k++) {
    const rawStart = acc / total;
    acc += widths[k];
    const rawEnd = acc / total;
    const span = rawEnd - rawStart;
    const start = Math.max(0, rawStart - overlap * span);
    const end = Math.min(1, rawEnd + overlap * span);
    intervals.push([start, Math.max(start + 1e-6, end)]);
  }

  const evalSum = (t) => {
    let sum = 0;
    for (let k = 0; k < n; k++) {
      const [a, b] = intervals[k];
      sum += widths[k] * smoothstep((t - a) / (b - a));
    }
    return sum;
  };

  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) * 0.5;
    if (evalSum(mid) < available) lo = mid;
    else hi = mid;
  }
  const t = (lo + hi) * 0.5;
  const allocated = widths.map((w, k) => {
    const [a, b] = intervals[k];
    return w * smoothstep((t - a) / (b - a));
  });
  // Distribute any sub-nanometer rounding residual onto the active pleat.
  const sum = allocated.reduce((accSum, v) => accSum + v, 0);
  const diff = available - sum;
  if (Math.abs(diff) > 1e-12) {
    const active = allocated.findIndex((v, k) => v > 1e-9 && v < widths[k] - 1e-9);
    const target = active >= 0 ? active : allocated.findIndex((v, k) => diff > 0 ? v < widths[k] : v > 0);
    if (target >= 0) allocated[target] = clamp(allocated[target] + diff, 0, widths[target]);
  }
  return allocated;
}

// Analyzes adjacent exposed cloth fragments to locate genuine tucked folds.
// Flat joins with zero concealed fabric produce no fold creases or shadows.
export function analyzeClothFolds(fragments) {
  const ordered = [...fragments].sort((a, b) => a.left - b.left);
  const folds = [];
  for (let i = 0; i < ordered.length - 1; i++) {
    const leftFrag = ordered[i];
    const rightFrag = ordered[i + 1];
    const hiddenCloth = rightFrag.sourceX - (leftFrag.sourceX + leftFrag.width);
    if (hiddenCloth <= 0.5) continue;

    const samePanel = leftFrag.panel.id === rightFrag.panel.id;
    let upperSide = 'valley';
    if (samePanel) {
      if (leftFrag.face.order > rightFrag.face.order) upperSide = 'left';
      else if (rightFrag.face.order > leftFrag.face.order) upperSide = 'right';
    }
    const depth = clamp(hiddenCloth / 180, 0.08, 1);
    const maxShadow = upperSide === 'left'
      ? rightFrag.width
      : upperSide === 'right'
        ? leftFrag.width
        : Math.min(leftFrag.width, rightFrag.width);
    const maxCrest = upperSide === 'left'
      ? leftFrag.width
      : upperSide === 'right'
        ? rightFrag.width
        : Math.min(leftFrag.width, rightFrag.width);

    folds.push({
      x: leftFrag.left + leftFrag.width,
      hiddenCloth,
      upperSide,
      depth,
      shadowWidth: Math.min(maxShadow, 6 + 16 * depth),
      crestWidth: Math.min(maxCrest, 2 + 3.5 * depth),
      valleyWidth: Math.min(maxShadow, 4 + 7 * depth)
    });
  }
  return folds;
}

// Gentle vertical hem drape contour near active folds; flattens completely
// to 0 when the cloth is fully unfolded (open -> 1).
export function clothSelvageRelief(x, folds, foldOpen) {
  const tension = 1 - clamp(foldOpen, 0, 1);
  if (tension <= 1e-4 || !folds.length) return 0;
  let dip = 0;
  for (const fold of folds) {
    const radius = 24 + 26 * fold.depth;
    const dx = Math.abs(x - fold.x);
    if (dx >= radius) continue;
    const w = 1 - smoothstep(dx / radius);
    dip = Math.max(dip, w * fold.depth);
  }
  return dip * tension * 2.6;
}
