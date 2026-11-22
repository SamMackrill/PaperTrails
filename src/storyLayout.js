import { config } from './config.js?v=16';
import { yearToX } from './timeScale.js?v=3';
import { storyPanels, storyAtlases } from './storyPanels.js?v=pass2-photography-v1';
import { allocatePleatCascade, unfoldProgress } from './clothDynamics.js?v=pass2-cloth-dynamics-v1';
const FRONT = 160;
const RETURN = 240;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// Native artwork dimensions depend on context height, never zoom or density.
// All concurrent subjects are already drawn together in each source row.
export function layoutStory(events, width, height) {
  let sourceX = 0;
  const panels = storyPanels.map(section => {
    const atlas = storyAtlases[section.sheet];
    const [top, bottom] = atlas.bodies[section.row];
    // Complete drawings share one stable envelope, fitted proportionally.
    // Pixel sizes differ between authored bands; zoom only exposes fixed cloth.
    const unit = height / (bottom - top);
    const sourceWidth = atlas.width * unit;
    const summaryWidth = Math.min(FRONT, sourceWidth);
    const summaryX = clamp(section.focus * sourceWidth - summaryWidth / 2, 0, sourceWidth - summaryWidth);
    const faces = [{ sourceX: sourceX + summaryX, sourceWidth: summaryWidth, summary: true, order: 1000 }];
    for (const [from, to, side] of [[0, summaryX, 'left'], [summaryX + summaryWidth, sourceWidth, 'right']]) {
      const count = Math.ceil((to - from) / RETURN);
      for (let i = 0; i < count; i++) faces.push({ sourceX: sourceX + from + i * (to - from) / count,
        sourceWidth: (to - from) / count, summary: false, side, order: side === 'left' ? 500 + i : count - i });
    }
    const result = { ...section, to: section.to ?? config.END_YEAR, atlas,
      crop: { x: 0, y: top, width: atlas.width, height: bottom - top },
      unit, sourceX, sourceWidth, summaryX, summaryWidth, faces };
    sourceX += sourceWidth;
    return result;
  });
  const records = events.filter(event => Number.isFinite(event.startYear) && Number.isFinite(event.endYear)
    && event.endYear >= event.startYear && event.endYear >= config.START_YEAR && event.startYear <= config.END_YEAR)
    .map(event => ({ event, anchor: clamp(yearToX(event.startYear, width), 0, width),
      end: clamp(yearToX(event.endYear, width), 0, width),
      subjects: panels.flatMap(p => p.subjects.filter(([id]) => id === event.id).map(([, from, to]) => ({
        panel: p.id, sourceX: p.sourceX + from * p.sourceWidth, sourceWidth: (to - from) * p.sourceWidth
      }))) }));
  return { panels, records, materialWidth: sourceX };
}

// Both sides unfold sequentially from behind the same identifying front crown.
// Fully open faces recover their original source order; no scaling, scene
// swapping or mirroring.
export function foldStory(layout, viewport, scale) {
  const progress = unfoldProgress(scale, config.MIN_SCALE, config.MAX_SCALE);
  const base = Math.min(viewport, layout.materialWidth);
  const total = base + (layout.materialWidth - base) * progress;
  const ratio = layout.materialWidth ? total / layout.materialWidth : 1;
  const cells = layout.panels.map(panel => {
    const width = panel.sourceWidth * ratio;
    const open = clamp((width - panel.summaryWidth) / (panel.sourceWidth - panel.summaryWidth || 1), 0, 1);
    const summaryLeft = width < panel.summaryWidth ? (width - panel.summaryWidth) / 2 : open * panel.summaryX;
    const leftFaces = panel.faces.filter(f => f.side === 'left').sort((a, b) => b.order - a.order);
    const rightFaces = panel.faces.filter(f => f.side === 'right').sort((a, b) => b.order - a.order);
    const leftAvail = open * panel.summaryX;
    const rightAvail = open * Math.max(0, panel.sourceWidth - panel.summaryX - panel.summaryWidth);
    const leftAlloc = allocatePleatCascade(leftFaces.map(f => f.sourceWidth), leftAvail);
    const rightAlloc = allocatePleatCascade(rightFaces.map(f => f.sourceWidth), rightAvail);

    const positioned = new Map();
    let leftCursor = summaryLeft;
    leftFaces.forEach((face, k) => {
      leftCursor -= leftAlloc[k];
      positioned.set(face, {
        left: leftCursor,
        shade: face.sourceWidth > 1e-8 ? clamp(1 - leftAlloc[k] / face.sourceWidth, 0, 1) : 0
      });
    });
    let rightCursor = summaryLeft + panel.summaryWidth;
    rightFaces.forEach((face, k) => {
      rightCursor += rightAlloc[k];
      positioned.set(face, {
        left: rightCursor - face.sourceWidth,
        shade: face.sourceWidth > 1e-8 ? clamp(1 - rightAlloc[k] / face.sourceWidth, 0, 1) : 0
      });
    });

    const faces = panel.faces.map(face => {
      if (face.summary) return { ...face, left: summaryLeft, shade: 1 - open };
      const pose = positioned.get(face);
      return { ...face, left: pose.left, shade: pose.shade };
    });
    return { ...panel, left: panel.sourceX * ratio, width, open, faces };
  });
  return { width: total, ratio, progress, cells };
}

// Drawing and hit-testing share the exact fixed source pixels left exposed by
// higher faces. Concealed subjects cannot become invisible pointer targets.
export function exposedStory(pose) {
  return pose.cells.flatMap(cell => cell.faces.flatMap(face => {
    let ranges = [[Math.max(0, face.left), Math.min(cell.width, face.left + face.sourceWidth)]]
      .filter(([left, right]) => right - left > 1e-8);
    for (const upper of cell.faces.filter(other => other.order > face.order)) {
      const a = upper.left, b = a + upper.sourceWidth;
      ranges = ranges.flatMap(([left, right]) => b <= left || a >= right ? [[left, right]]
        : [[left, Math.min(a, right)], [Math.max(b, left), right]].filter(([x, y]) => y - x > 1e-8));
    }
    return ranges.filter(([a, b]) => b - a > 1e-8).map(([left, right]) => ({
      panel: cell, face, left: cell.left + left, width: right - left,
      sourceX: face.sourceX + left - face.left
    }));
  }));
}

export function storyYearX(year, pose) {
  const cell = pose.cells.find(p => year < p.to) || pose.cells.at(-1);
  if (!cell) return 0;
  const anchors = cell.cameraAnchors.length ? [...cell.cameraAnchors] : [[cell.from, 0]];
  if (anchors.at(-1)[0] !== cell.to) anchors.push([cell.to, 1]);
  const upper = anchors.findIndex(([at]) => at >= year);
  if (upper <= 0) return upper === 0 ? cell.left + anchors[0][1] * cell.width : cell.left + cell.width;
  const [from, start] = anchors[upper - 1], [to, end] = anchors[upper];
  return cell.left + (start + clamp((year - from) / (to - from), 0, 1) * (end - start)) * cell.width;
}

// Symbolic cloth space is not a second duration axis. Follow the scientific
// viewport's central year without stretching the underlying embroidery.
export function storyCamera(year, pose, viewport) {
  return clamp(storyYearX(year, pose) - viewport / 2, 0, Math.max(0, pose.width - viewport));
}
