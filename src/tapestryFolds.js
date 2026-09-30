// An exposed overview followed by concertina folds of the same illustrated cloth.
// Orthographic projection unfolds a fixed length of illustrated material.
export function layoutCloth(strip, width, height, options = {}) {
  const naturalScale = height / strip.height;
  const materialScale = naturalScale;
  const materialWidths = strip.edges.slice(1).map((edge, i) =>
    (edge - strip.edges[i]) * materialScale);
  materialWidths[0] = options.overviewWidth ?? materialWidths[0];
  const available = Math.min(Math.max(0.01, width), materialWidths.reduce((sum, value) => sum + value, 0));
  const foldCount = materialWidths.length - 1;
  const closedWidth = foldCount ? options.closedWidth ?? Math.min(4, available * 0.12 / foldCount,
    ...materialWidths.slice(1).map(width => width * 0.12)) : 0;
  const overviewWidth = options.overviewWidth ?? Math.min(materialWidths[0], available - foldCount * closedWidth);
  const detailMaterial = materialWidths.slice(1).reduce((sum, value) => sum + value, 0);
  const detailSpace = available - overviewWidth;
  const opening = detailMaterial ? Math.min(1, Math.max(0,
    (detailSpace - foldCount * closedWidth) / (detailMaterial - foldCount * closedWidth))) : 1;
  const openness = opening <= 1e-12 ? 0 : opening >= 1 - 1e-12 ? 1 : opening;
  const facets = [{ left: 0, width: overviewWidth }];
  const panels = [];
  let left = overviewWidth;
  materialWidths.slice(1).forEach((materialWidth, index) => {
    const displayed = openness >= 1 - 1e-12 ? materialWidth
      : closedWidth + (materialWidth - closedWidth) * openness;
    const half = materialWidth / 2;
    const projectedHalf = displayed / 2;
    const angle = Math.acos(Math.min(1, projectedHalf / half));
    const depth = half * Math.sin(angle);
    const sourceHalf = (strip.edges[index + 2] - strip.edges[index + 1]) / 2;
    facets.push({ left, width: displayed });
    for (let side = 0; side < 2; side++) {
      panels.push({ facet: index + 1, side, left: left + side * projectedHalf,
        width: half, sourceX: strip.edges[index + 1] + side * sourceHalf,
        sourceWidth: sourceHalf, angle: (side ? -1 : 1) * angle * 180 / Math.PI,
        // Squared depth fades gently at contact with flat cloth. A linear
        // sine has an unbounded slope there and makes the crease flash away.
        depth: side ? -depth : 0, shade: Math.sin(angle) ** 2 });
    }
    left += displayed;
  });
  return { width: available, overviewWidth, materialScale, openness, facets, panels };
}

// Keep a stable selection of complete source regions. Its exposed summary is
// a fixed crop; the remaining regions stay attached to their paired hinges.
export function selectClothStrip(strip, maximumFacets = 3) {
  const count = Math.max(1, Math.min(strip.facets.length, maximumFacets));
  return { ...strip, width: strip.edges[count], edges: strip.edges.slice(0, count + 1), facets: strip.facets.slice(0, count) };
}

// Every scene owns a share of the overview, irrespective of the gap between
// historical dates. Fold projection sets its width; scene edges are stitched
// consecutively, with no empty interval for an individual picture to slide in.
export function layoutWeaveCloth(strip, overviewShare, height, scale, maximumScale) {
  const foldCount = strip.facets.length - 1;
  const closedWidth = foldCount ? Math.min(4, overviewShare * 0.12 / foldCount) : 0;
  const overviewWidth = overviewShare - foldCount * closedWidth;
  const detailWidth = (strip.width - strip.edges[1]) * height / strip.height;
  const openness = Math.max(0, Math.min(1, Math.log(Math.max(1, scale)) / Math.log(maximumScale)));
  const width = overviewShare + (overviewWidth + detailWidth - overviewShare) * openness;
  return layoutCloth(strip, width, height, { overviewWidth, closedWidth });
}

// The cloth has symbolic picture widths. Its single camera follows dated
// scene anchors, while exact interval rails retain the scientific time scale.
export function mapClothX(timeX, scenes, timeWidth, clothWidth) {
  const knots = [{ time: 0, cloth: 0 }];
  for (const scene of scenes) {
    if (scene.anchor <= 0 || scene.anchor >= timeWidth) continue;
    const previous = knots.at(-1);
    if (scene.anchor === previous.time) continue;
    knots.push({ time: scene.anchor, cloth: scene.left });
  }
  knots.push({ time: timeWidth, cloth: clothWidth });
  const x = Math.max(0, Math.min(timeWidth, timeX));
  const index = knots.findIndex(knot => knot.time >= x);
  if (index <= 0) return 0;
  const a = knots[index - 1], b = knots[index];
  return a.cloth + (b.cloth - a.cloth) * (x - a.time) / (b.time - a.time);
}

export function clothCameraLeft(mappedCentre, clothWidth, viewportWidth) {
  return Math.max(Math.min(0, viewportWidth - clothWidth), Math.min(0, viewportWidth / 2 - mappedCentre));
}
