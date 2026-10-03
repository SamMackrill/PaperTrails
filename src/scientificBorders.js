// Every region is used once on the chronological cloth. Storage rows never
// become display rows, repeated tiles, or zoom-dependent replacements.
import { scientificBorderContinuations } from './scientificBorderContinuations.js?v=pass2-continuous-linen-v1';
import { storyPanels, storyAtlases } from './storyPanels.js?v=pass2-muted-embroidery-v2';
export const scientificBorderAtlases = {
  early: { file: 'images/tapestry/scientific-borders-early-threads.webp', width: 2172, height: 724,
    bands: [[7, 90], [93, 183], [187, 276], [277, 365], [367, 457], [458, 547], [547, 635], [636, 720]] },
  seventeenth: { file: 'images/tapestry/scientific-borders-seventeenth-threads.webp', width: 2172, height: 724,
    bands: [[6, 87], [96, 180], [186, 270], [274, 362], [367, 452], [456, 544], [546, 632], [635, 721]] },
  eighteenth: { file: 'images/tapestry/scientific-borders-eighteenth-threads.webp', width: 2169, height: 725,
    bands: [[9, 98], [105, 187], [190, 269], [273, 357], [363, 446], [451, 533], [540, 622], [626, 711]] },
  nineteenth: { file: 'images/tapestry/scientific-borders-nineteenth-threads.webp', width: 2172, height: 724,
    bands: [[6, 84], [93, 174], [182, 267], [273, 356], [364, 449], [455, 537], [542, 626], [632, 718]] },
  electrons: { file: 'images/tapestry/scientific-borders-electrons-threads.webp', width: 2169, height: 725,
    bands: [[7, 87], [95, 182], [188, 269], [275, 360], [365, 453], [458, 545], [547, 633], [636, 719]] },
  space: { file: 'images/tapestry/scientific-borders-space-threads.webp', width: 2167, height: 725,
    bands: [[6, 95], [98, 193], [194, 286], [286, 374], [375, 462], [463, 554], [555, 645], [645, 724]] },
  ...scientificBorderContinuations
};
export const scientificBorderSections = {
  'opening-0': ['early', 0], 'early-1': ['early', 4],
  'early-2': ['seventeenth', 0], 'early-3': ['seventeenth', 4],
  'middle-0': ['eighteenth', 0], 'middle-1': ['eighteenth', 4],
  'middle-2': ['nineteenth', 0], 'middle-3': ['nineteenth', 4],
  'modern-0': ['electrons', 0], 'modern-1': ['electrons', 4],
  'modern-2': ['space', 0], 'modern-3': ['space', 4]
};

export function scientificBorderRows(section, side) {
  const [sheet, first] = scientificBorderSections[section];
  const start = first + (side === 'top' ? 0 : 2);
  return [start, start + 1].flatMap(row => [sheet, `${sheet}Continuation`].map(sheet => {
    const atlas = scientificBorderAtlases[sheet], [top, bottom] = atlas.bands[row];
    return { sheet, row, atlas, top, bottom, aspect: atlas.width / (bottom - top) };
  }));
}

// Fit each complete chronological edge as one ribbon, at a single depth.
// Its storage-section boundaries need not coincide with narrative joins.
export function scientificBorderFrame(totalHeight) {
  const materialAspect = storyPanels.reduce((sum, panel) => {
    const atlas = storyAtlases[panel.sheet], [top, bottom] = atlas.bodies[panel.row];
    return sum + atlas.width / (bottom - top);
  }, 0);
  const ratios = ['top', 'bottom'].map(side => materialAspect / storyPanels
    .flatMap(panel => scientificBorderRows(panel.id, side)).reduce((sum, row) => sum + row.aspect, 0));
  const artHeight = Math.max(0, totalHeight) / (1 + ratios[0] + ratios[1]);
  return { artHeight, borderHeight: artHeight * ratios[0], bottomBorderHeight: artHeight * ratios[1] };
}

// All 48 distinct rows on each edge share one height. Native source proportions
// and complete row coverage are retained; no repeated or stretched filler.
export function layoutScientificBorder(layout) {
  if (layout.materialWidth <= 0) return [];
  return ['top', 'bottom'].flatMap(side => {
    const rows = layout.panels.flatMap(panel => scientificBorderRows(panel.id, side));
    const height = layout.materialWidth / rows.reduce((sum, row) => sum + row.aspect, 0);
    let sourceX = 0;
    return rows.map(({ sheet, row, atlas, top, bottom }) => {
      const unit = height / (bottom - top), width = atlas.width * unit;
      const result = { id: `${sheet}-${row}`, sheet, row, side, file: atlas.file,
        sourceX, width, height, unit,
        crop: { x: 0, y: top, width: atlas.width, height: bottom - top } };
      sourceX += width;
      return result;
    });
  });
}

// Share the narrative's exposed material ranges so borders are concealed and
// revealed by exactly the same folds. There is no tile loop or hidden repeat.
export function exposedScientificBorder(segments, fragment) {
  return segments.flatMap(segment => {
    const from = Math.max(segment.sourceX, fragment.sourceX);
    const to = Math.min(segment.sourceX + segment.width, fragment.sourceX + fragment.width);
    if (to <= from) return [];
    return [{ ...segment, left: fragment.left + from - fragment.sourceX, width: to - from,
      crop: { ...segment.crop, x: segment.crop.x + (from - segment.sourceX) / segment.unit,
        width: (to - from) / segment.unit } }];
  });
}

// Constant inner and outer edge positions across the entire material.
export function scientificBorderY(border, frame) {
  return border.side === 'top' ? 0 : frame.borderHeight + frame.artHeight;
}
