// Flat embroidered fronts; detail is tucked behind them in box pleats.
// Native face dimensions and source crops never change during zoom.
export const SUMMARY_WIDTH = 112;

export function clothCells(materialWidth, intervals = []) {
  const edges = [...new Set([0, materialWidth, ...intervals.flatMap(({ anchor, end, sceneWidth }) =>
    [anchor, end, anchor + sceneWidth])])].filter(x => Number.isFinite(x) && x >= 0 && x <= materialWidth).sort((a, b) => a - b);
  return edges.slice(1).map((right, i) => {
    const sourceX = edges[i], sourceWidth = right - sourceX;
    const summaryWidth = Math.min(SUMMARY_WIDTH, sourceWidth);
    const remaining = sourceWidth - summaryWidth;
    const count = remaining > 1e-8 ? Math.min(6, Math.ceil(remaining / 180)) : 0;
    const faces = [{ sourceX, sourceWidth: summaryWidth, summary: true }];
    for (let j = 0; j < count; j++) faces.push({ sourceX: sourceX + summaryWidth + j * remaining / count,
      sourceWidth: remaining / count, summary: false });
    return { sourceX, sourceWidth, summaryWidth, faces };
  });
}

export function layoutPleats(materialWidth, projectedWidth, cells = clothCells(materialWidth)) {
  const ratio = Math.max(1 / 32, Math.min(1, projectedWidth / materialWidth));
  const faces = [];
  const projectedCells = cells.map((cell, cellIndex) => {
    const width = cell.sourceWidth * ratio;
    const open = cell.sourceWidth > cell.summaryWidth
      ? Math.max(0, Math.min(1, (width - cell.summaryWidth) / (cell.sourceWidth - cell.summaryWidth))) : 1;
    const firstIndex = faces.length;
    cell.faces.forEach((face, i) => {
      const localSource = face.sourceX - cell.sourceX;
      // Short intervals crop their summary centrally. Once it fits, that
      // whole flat face stays exposed while detail emerges from underneath.
      const left = face.summary ? Math.min(0, (width - cell.summaryWidth) / 2)
        : cell.summaryWidth - face.sourceWidth + open * (localSource - cell.summaryWidth + face.sourceWidth);
      faces.push({ ...face, cellIndex, left, width: face.sourceWidth, angle: 0, depth: 0,
        shade: ratio === 1 ? 0 : 1 - open, order: cell.faces.length - i,
        exposedWidth: face.summary ? Math.min(width, cell.summaryWidth) : open * face.sourceWidth });
    });
    return { ...cell, left: cell.sourceX * ratio, width, open, firstIndex, faceCount: cell.faces.length };
  });
  return { materialWidth, width: materialWidth * ratio, ratio, openness: (ratio - 1 / 32) / (1 - 1 / 32),
    cells: projectedCells, faces };
}

// Braids remain on the scientific date scale. Folded exposure is not duration.
export function projectClothX(sourceX, pose) {
  return Math.max(0, Math.min(pose.materialWidth, sourceX)) * pose.ratio;
}
