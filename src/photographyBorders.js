// Two complete replacement ribbons. Existing atlas pixels remain untouched;
// each new strip is used once and unfolds with the same chronological cloth.
export const photographyBorderRevisions = {
  'nineteenth-1': {
    file: 'images/tapestry/scientific-borders-camera-1827.webp',
    width: 2172, height: 724, top: 289, bottom: 438,
    milestoneId: 'first-camera-photograph', year: 1827,
    motif: [735, 1130], centre: 950
  },
  'electrons-5': {
    file: 'images/tapestry/scientific-borders-colour-film-1935.webp',
    width: 2172, height: 724, top: 294, bottom: 428,
    milestoneId: 'kodachrome-colour-film', year: 1935,
    motif: [1280, 1525], centre: 1390
  }
};

// Hit areas expose exactly the same native motif pixels as the folded drawing.
export function exposedPhotographyTargets(borders, fragments) {
  return borders.filter(border => border.revision).flatMap(border => {
    const [a, b] = border.revision.motif.map(x => border.sourceX + x * border.unit);
    return fragments.flatMap(fragment => {
      const from = Math.max(a, fragment.sourceX);
      const to = Math.min(b, fragment.sourceX + fragment.width);
      return to > from ? [{ ...border, left: fragment.left + from - fragment.sourceX, width: to - from }] : [];
    });
  });
}
