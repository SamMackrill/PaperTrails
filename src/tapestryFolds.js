// An exposed overview followed by concertina folds of the same illustrated cloth.
// Orthographic projection keeps the cloth's endpoints exactly on the timeline.
export function layoutCloth(strip, width, height, maximumWidth = Infinity) {
  const available = Math.max(0.01, width);
  // A short dated scene has a limited width even at maximum timeline zoom.
  // Fit its material to that budget up front so every pleat can lie flat,
  // without a last-frame override or changing figure height during zoom.
  const naturalScale = Math.min(height / strip.height,
    Math.max(0.01, maximumWidth) / strip.width);
  const materialScale = Math.max(naturalScale, available / strip.width);
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
  return { overviewWidth, materialScale, openness, facets, panels };
}
