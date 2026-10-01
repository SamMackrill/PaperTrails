import { tapestryScenes, getPanoramaStrip } from './tapestryScenes.js?v=pass2-chapters-v2';
import { SUMMARY_WIDTH } from './clothPleats.js?v=pass2-chapters-v2';
import { yearToX } from './timeScale.js?v=3';

// One composition per chapter. Source proportions, positions and crops belong
// to the material, so zoom only changes how much the pleats conceal.
export function composePictures(entries, artHeight, materialWidth = null) {
  const pictures = [];
  for (const entry of entries) {
    const { event, anchor, end, sceneWidth, original } = entry;
    const chapters = event.chapters?.length ? event.chapters : [{
      id: event.id || event.title, title: event.title,
      startYear: event.startYear, endYear: event.endYear, scene: event.title
    }];
    const years = event.endYear - event.startYear;
    const perYear = years > 0 ? (end - anchor) / years : 0;
    for (const chapter of chapters) {
      const scene = tapestryScenes.get(chapter.scene || event.title);
      if (!scene || !Number.isFinite(chapter.startYear) || !Number.isFinite(chapter.endYear)
        || chapter.endYear < chapter.startYear) continue;
      const position = year => materialWidth === null ? anchor + (year - event.startYear) * perYear : yearToX(year, materialWidth);
      const start = years > 0 ? Math.max(anchor, position(chapter.startYear)) : anchor;
      const stop = years > 0 ? Math.min(end, position(chapter.endYear)) : anchor + sceneWidth;
      if (stop <= start || start >= end && years > 0) continue;
      const strip = getPanoramaStrip(scene, original);
      const nativeWidth = strip.width * artHeight / strip.height;
      const firstFacetWidth = (strip.edges[1] - strip.edges[0]) * artHeight / strip.height;
      const origin = start - Math.max(0, (firstFacetWidth - Math.min(SUMMARY_WIDTH, stop - start)) / 2);
      const right = Math.min(stop, origin + nativeWidth);
      pictures.push({ key: `${event.id || event.title}/${chapter.id}`, event, chapter,
        anchor: start, end: stop, left: start, right, sceneWidth: right - start,
        origin, nativeWidth, strip, priority: event.startYear });
    }
  }
  // Match caption and hit-target precedence: later-starting events lie above
  // earlier broad context, while each parent's chapters stay grouped.
  return pictures.sort((a, b) => a.priority - b.priority || a.anchor - b.anchor);
}

// Both SVG fallback and canvas textures use the same feathered join, contained
// inside the chapter footprint. No historical imagery leaks across its dates.
export function joinWidth(pictureWidth) {
  return Math.min(72, pictureWidth / 4);
}

// Draw continuous thread paths and individually varied plants across the full
// material. There is no repeated panel, mirrored image, or zoom-dependent seed.
export function quietLandscape(width, height) {
  const paths = [];
  let seed = 71821;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const path = (d, stroke, strokeWidth, opacity, fill = 'none') =>
    paths.push({ d, stroke, strokeWidth, opacity, fill });
  for (let ridge = 0; ridge < 4; ridge++) {
    let d = `M0 ${height * (.37 + ridge * .12)}`;
    for (let x = 0; x < width; x += 160) {
      const right = Math.min(width, x + 160);
      const y = height * (.37 + ridge * .12 + .055 * Math.sin(right / (310 + ridge * 70) + ridge)
        + .025 * Math.sin(right / 93 + ridge));
      d += ` Q${(x + right) / 2} ${y - 7 + random() * 14} ${right} ${y}`;
    }
    path(d, ridge < 2 ? '#788a89' : '#8a8865', .8, ridge < 2 ? .38 : .25);
  }
  for (let x = 10; x < width; x += 42 + random() * 94) {
    const base = height * (.76 + random() * .22);
    const tall = random() < .18;
    const plantHeight = height * (tall ? .18 + random() * .26 : .025 + random() * .075);
    const lean = (random() - .5) * plantHeight * .4;
    let d = `M${x} ${base} Q${x + lean / 2} ${base - plantHeight * .6} ${x + lean} ${base - plantHeight}`;
    const branches = tall ? 5 + Math.floor(random() * 5) : 2 + Math.floor(random() * 3);
    for (let i = 1; i <= branches; i++) {
      const fraction = i / (branches + 1);
      const y = base - fraction * plantHeight;
      const reach = plantHeight * (.12 + random() * .24);
      const side = i % 2 ? -1 : 1;
      d += ` M${x + lean * fraction} ${y} q${side * reach * .6} ${-reach * .3} ${side * reach} ${-reach * (.4 + random() * .5)}`;
    }
    path(d, tall ? '#68745b' : '#8c8259', tall ? 1 : .7, tall ? .5 : .4);
  }
  return paths;
}

// Six separately authored landscapes appear once each on the source material.
// The continuous thread drawing fills everything between them.
export const quietAtlas = {
  file: 'images/tapestry/landscape-b-quiet-chapters.png', width: 1774, height: 887,
  bounds: [[0,144], [148,291], [295,438], [442,586], [591,735], [741,887]]
};

export function quietPictures(width, artHeight) {
  return quietAtlas.bounds.map(([y, bottom], index) => {
    const nativeWidth = quietAtlas.width * artHeight / (bottom - y);
    const left = Math.max(0, Math.min(width - nativeWidth, (index + .5) * width / 6 - nativeWidth / 2));
    return { y, height: bottom - y, left, width: nativeWidth };
  });
}
