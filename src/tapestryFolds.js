// An exposed overview followed by concertina folds of the same illustrated cloth.
// Orthographic projection unfolds a fixed length of illustrated material.
export function layoutCloth(strip, width, height) {
  const naturalScale = height / strip.height;
  const materialScale = naturalScale;
  const available = Math.min(Math.max(0.01, width), strip.width * materialScale);
  const materialWidths = strip.edges.slice(1).map((edge, i) =>
    (edge - strip.edges[i]) * materialScale);
  const foldCount = materialWidths.length - 1;
  const closedWidth = foldCount ? Math.min(4, available * 0.12 / foldCount) : 0;
  const overviewWidth = Math.min(materialWidths[0], available - foldCount * closedWidth);
  const detailMaterial = materialWidths.slice(1).reduce((sum, value) => sum + value, 0);
  const detailSpace = available - overviewWidth;
  const openness = detailMaterial ? Math.min(1, Math.max(0,
    (detailSpace - foldCount * closedWidth) / (detailMaterial - foldCount * closedWidth))) : 1;
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

// Give the narrowest dated scene enough horizontal room for its undistorted
// source. A power-of-two endpoint stays stable through small layout changes.
export function unfoldZoomLimit(scenes, viewportWidth, height, minimum = 16) {
  const required = scenes.reduce((maximum, { strip, fraction }) => fraction > 0
    ? Math.max(maximum, strip.width * height / strip.height / (viewportWidth * fraction))
    : maximum, minimum);
  return 2 ** Math.ceil(Math.log2(required));
}

export function clothPanOffset(clothWidth, sceneWidth, viewportWidth, viewportLeft) {
  const room = sceneWidth - clothWidth;
  if (room <= 0 || sceneWidth <= viewportWidth) return room / 2;
  const progress = Math.max(0, Math.min(1, viewportLeft / (sceneWidth - viewportWidth)));
  return room * progress;
}
