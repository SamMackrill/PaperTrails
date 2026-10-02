// Every region is used once on the chronological cloth. Storage rows never
// become display rows, repeated tiles, or zoom-dependent replacements.
export const SCIENTIFIC_BORDER_HEIGHT = 28;
export const scientificBorderAtlases = {
  early: { file: 'images/tapestry/scientific-borders-early.webp', width: 2171, height: 724,
    bands: [[7, 90], [93, 183], [187, 276], [277, 365], [367, 457], [458, 547], [547, 635], [636, 720]] },
  seventeenth: { file: 'images/tapestry/scientific-borders-seventeenth.webp', width: 2171, height: 724,
    bands: [[6, 87], [96, 180], [186, 270], [274, 362], [367, 452], [456, 544], [546, 632], [635, 721]] },
  eighteenth: { file: 'images/tapestry/scientific-borders-eighteenth.webp', width: 2170, height: 725,
    bands: [[9, 98], [105, 187], [190, 269], [273, 357], [363, 446], [451, 533], [540, 622], [626, 711]] },
  nineteenth: { file: 'images/tapestry/scientific-borders-nineteenth.webp', width: 2171, height: 724,
    bands: [[6, 84], [93, 174], [182, 267], [273, 356], [364, 449], [455, 537], [542, 626], [632, 718]] },
  electrons: { file: 'images/tapestry/scientific-borders-electrons.webp', width: 2170, height: 725,
    bands: [[7, 87], [95, 182], [188, 269], [275, 360], [365, 453], [458, 545], [547, 633], [636, 719]] },
  space: { file: 'images/tapestry/scientific-borders-space.webp', width: 2170, height: 725,
    bands: [[6, 95], [98, 193], [194, 286], [286, 374], [375, 462], [463, 554], [555, 645], [645, 724]] }
};
export const scientificBorderSections = {
  'opening-0': ['early', 0], 'early-1': ['early', 4],
  'early-2': ['seventeenth', 0], 'early-3': ['seventeenth', 4],
  'middle-0': ['eighteenth', 0], 'middle-1': ['eighteenth', 4],
  'middle-2': ['nineteenth', 0], 'middle-3': ['nineteenth', 4],
  'modern-0': ['electrons', 0], 'modern-1': ['electrons', 4],
  'modern-2': ['space', 0], 'modern-3': ['space', 4]
};

// These positions depend on the fixed material geometry, never the fold pose.
// A small amount of linen is retained where fitting both dimensions requires
// it; the equipment itself is always uniformly scaled with native proportions.
export function layoutScientificBorder(panel, borderHeight = SCIENTIFIC_BORDER_HEIGHT) {
  const assignment = scientificBorderSections[panel.id];
  if (!assignment || panel.sourceWidth <= 0 || borderHeight <= 0) return [];
  const [sheet, first] = assignment, atlas = scientificBorderAtlases[sheet];
  const slotWidth = panel.sourceWidth / 2;
  return ['top', 'bottom'].flatMap((side, edge) => [0, 1].map(part => {
    const row = first + edge * 2 + part;
    const [top, bottom] = atlas.bands[row];
    const unit = Math.min(slotWidth / atlas.width, borderHeight / (bottom - top));
    const width = atlas.width * unit, height = (bottom - top) * unit;
    return { id: `${sheet}-${row}`, sheet, row, side, file: atlas.file,
      sourceX: panel.sourceX + part * slotWidth + (slotWidth - width) / 2,
      width, height, inset: Math.max(0, (borderHeight - height) / 2), unit,
      crop: { x: 0, y: top, width: atlas.width, height: bottom - top } };
  }));
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
