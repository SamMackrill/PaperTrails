// Authentic Bayeux Tapestry scene-boundary transitions: directional linen
// feathering, embroidered snowbank & braided-earth ground bridges, subtle
// border-rail alignment, and faded-wool Bayeux dividers anchored in fixed
// cloth material coordinates so transitions unfold seamlessly with the fabric.

export const BOUNDARY_DIVIDER_ATLAS = 'images/tapestry/bayeux-boundary-dividers-threads.webp';

// Exact [x, y, width, height] crop boxes inside bayeux-boundary-dividers-threads.webp
// (928x556 RGBA transparent wool-thread sprite sheet).
// Provenance and exact SHA-256 pixel hashes are recorded in
// images/tapestry/boundary-dividers-generation.json and validated by
// tools/boundary-dividers-artwork.mjs.
export const DIVIDER_CROPS = {
  'palm-shore': [12, 12, 165, 360],
  'winter-tree': [189, 12, 109, 360],
  'trench-post': [310, 12, 230, 360],
  'ruined-pier': [552, 12, 89, 360],
  'join4-bridge': [653, 12, 128, 360],
  'join5-bridge': [793, 12, 104, 360],
  'harbour-quay': [12, 384, 516, 160],
  'snow-slope-single': [540, 424, 376, 120]
};

const borderTrimCache = new WeakMap();
let borderSampleCanvas = null;

// Pure RGBA rail detector shared between browser runtime measurement and Node
// unit tests against real decoded scientific border PNGs.
export function detectBorderRailTrim(data, cols, h) {
  if (!data || cols < 4 || h < 12) return { trimTop: 0, trimBottom: 0 };
  const redCov = new Float32Array(h);
  const opCov = new Float32Array(h);
  for (let row = 0; row < h; row++) {
    let redCount = 0;
    let opCount = 0;
    const base = row * cols * 4;
    for (let col = 0; col < cols; col++) {
      const i = base + col * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a > 120) opCount++;
      if (a > 90 && r > g + 8 && r > b + 12) redCount++;
    }
    redCov[row] = redCount / cols;
    opCov[row] = opCount / cols;
  }

  const findClusters = (start, len, profile, thresh) => {
    const out = [];
    let inC = false;
    let s = 0;
    for (let i = 0; i < len; i++) {
      if (profile[start + i] >= thresh && !inC) { inC = true; s = i; }
      else if (profile[start + i] < thresh && inC) { out.push([s, i - 1]); inC = false; }
    }
    if (inC) out.push([s, len - 1]);
    return out;
  };

  const zone = Math.min(20, Math.floor(h / 4));
  let tc = findClusters(0, zone, redCov, 0.45);
  if (!tc.length) tc = findClusters(0, zone, opCov, 0.58);
  let bc = findClusters(h - zone, zone, redCov, 0.45);
  if (!bc.length) bc = findClusters(h - zone, zone, opCov, 0.58);

  let topRail = 0;
  if (tc.length >= 2 && tc[0][0] <= 1 && tc[0][1] <= 3 && tc[1][0] - tc[0][1] >= 2) topRail = tc[1][0];
  else if (tc.length) topRail = tc[0][0];

  let botRail = h - 1;
  if (bc.length >= 2 && bc[bc.length - 1][1] >= zone - 2 && bc[bc.length - 1][0] >= zone - 4 && bc[bc.length - 1][0] - bc[bc.length - 2][1] >= 2) {
    botRail = (h - zone) + bc[bc.length - 2][1];
  } else if (bc.length) {
    botRail = (h - zone) + bc[bc.length - 1][1];
  }

  let trimTop = Math.max(0, topRail - 1);
  let trimBottom = Math.max(0, h - Math.min(h, botRail + 2));
  if (h - trimTop - trimBottom < h * 0.72) {
    trimTop = 0;
    trimBottom = 0;
  }
  return { trimTop, trimBottom };
}

// Measures leading/trailing blank padding or adjacent-row rail bleed once per
// border band directly from the loaded RGBA image (cached per image) so border
// rail alignment stays resilient if any border atlas is regenerated.
export function measureBorderRailTrim(drawing, crop) {
  if (!drawing || !crop || crop.height < 12 || typeof document === 'undefined') {
    return { trimTop: 0, trimBottom: 0 };
  }
  let map = borderTrimCache.get(drawing);
  if (!map) {
    map = new Map();
    borderTrimCache.set(drawing, map);
  }
  const key = `${crop.y}:${crop.height}`;
  if (map.has(key)) return map.get(key);

  const cols = 48;
  const h = Math.round(crop.height);
  const srcW = drawing.naturalWidth || drawing.width || crop.width;
  if (!borderSampleCanvas) borderSampleCanvas = document.createElement('canvas');
  if (borderSampleCanvas.width < cols) borderSampleCanvas.width = cols;
  if (borderSampleCanvas.height < h) borderSampleCanvas.height = h;
  const ctx = borderSampleCanvas.getContext('2d', { willReadFrequently: true });
  ctx.clearRect(0, 0, cols, h);
  ctx.drawImage(drawing, 0, crop.y, srcW, crop.height, 0, 0, cols, h);
  const data = ctx.getImageData(0, 0, cols, h).data;
  const result = detectBorderRailTrim(data, cols, h);
  map.set(key, result);
  return result;
}

// Computes exact native-proportion source and destination rectangles for a
// border slice after trimming inter-row padding/bleed. Preserves the exact 1:1
// source aspect ratio (zero vertical stretching) and aligns flush to the outer
// edge per docs/scientific-tapestry-borders.md.
export function nativeAlignedBorderRect(border, trim, y) {
  const trimTop = Math.max(0, trim?.trimTop || 0);
  const trimBottom = Math.max(0, trim?.trimBottom || 0);
  const srcH = border.crop.height - trimTop - trimBottom;
  if (!(srcH > 4) || srcH >= border.crop.height) {
    return {
      srcX: border.crop.x,
      srcY: border.crop.y,
      srcW: border.crop.width,
      srcH: border.crop.height,
      destX: border.left,
      destY: y,
      destW: border.width,
      destH: border.height
    };
  }
  const destH = border.height * (srcH / border.crop.height);
  const destY = border.side === 'bottom' ? y + (border.height - destH) : y;
  return {
    srcX: border.crop.x,
    srcY: border.crop.y + trimTop,
    srcW: border.crop.width,
    srcH,
    destX: border.left,
    destY,
    destW: border.width,
    destH
  };
}

// Draws one scientific border slice at exact native proportions with outer
// framing rails aligned flush and inter-row bleed trimmed away.
export function drawAlignedBorderSlice(ink, drawing, border, y) {
  const trim = measureBorderRailTrim(drawing, border.crop);
  const r = nativeAlignedBorderRect(border, trim, y);
  ink.drawImage(drawing, r.srcX, r.srcY, r.srcW, r.srcH, r.destX, r.destY, r.destW, r.destH);
}

// Per-join visual tuning across all 11 panel-to-panel joins of storyPanels.
// Fractions are relative to artHeight so geometry scales cleanly at any height.
export const PANEL_BOUNDARIES = {
  'opening-0->early-1': {
    motif: 'palm-shore',
    label: '1500 · Columbian Exchange → Renaissance Print',
    leftFeather: 0.09,
    rightFeather: 0.03,
    heightScale: 0.85,
    centerBias: 0.02,
    flip: false,
    leftGround: 0.972,
    rightGround: 0.966
  },
  'early-1->early-2': {
    motif: 'winter-tree',
    label: '1600 · Frozen River → Little Ice Age Cottage',
    leftFeather: 0.17,
    rightFeather: 0.08,
    heightScale: 0.93,
    centerBias: -0.02,
    flip: false,
    leftGround: 0.99,
    rightGround: 0.955
  },
  'early-2->early-3': {
    motif: 'join4-bridge',
    label: '1650 · Existing Winter Tree → Timber Cottage',
    leftFeather: 0.10,
    rightFeather: 0.08,
    leftFeatherTopFrac: 0.87,
    rightFeatherTopFrac: 0.66,
    heightScale: 1.0,
    widthScale: 1.0,
    centerBias: 0,
    flip: false,
    leftGround: 1.0,
    rightGround: 1.0
  },
  'early-3->middle-0': {
    motif: 'snow-slope-single',
    label: '1700 · Existing Winter Tree → War of the Spanish Succession',
    leftFeather: 0.04,
    rightFeather: 0.025,
    featherTopFrac: 0.68,
    heightScale: 0.175,
    widthScale: 0.54,
    centerBias: -0.03,
    flip: false,
    leftGround: 0.995,
    rightGround: 0.995
  },
  'middle-0->middle-1': {
    motif: 'join5-bridge',
    label: '1740 · Existing Winter Tree & Stream → Seven Years’ War',
    leftFeather: 0.045,
    rightFeather: 0.022,
    leftFeatherTopFrac: 0.66,
    rightFeatherTopFrac: 0.88,
    heightScale: 1.0,
    widthScale: 1.0,
    centerBias: -0.0111,
    flip: false,
    leftGround: 1.0,
    rightGround: 1.0
  },
  'middle-1->middle-2': {
    motif: null,
    label: '1789 · Revolutionary Cannon → Revolutionary Crowd',
    leftFeather: 0,
    rightFeather: 0,
    heightScale: 0,
    centerBias: 0,
    flip: false,
    leftGround: 0.992,
    rightGround: 0.982
  },
  'middle-2->middle-3': {
    motif: 'winter-tree',
    label: '1830 · Winter Aqueduct → Snowy Village',
    leftFeather: 0.11,
    rightFeather: 0.10,
    heightScale: 0.78,
    centerBias: 0.01,
    flip: false,
    leftGround: 0.982,
    rightGround: 0.986
  },
  'middle-3->modern-0': {
    motif: 'harbour-quay',
    label: '1870 · Atlantic Ship → Harvest & Plough',
    leftFeather: 0.14,
    rightFeather: 0.025,
    featherTopFrac: 0.62,
    heightScale: 0.41,
    widthScale: 0.51,
    centerBias: -0.175,
    flip: false,
    leftGround: 0.992,
    rightGround: 0.985
  },
  'modern-0->modern-1': {
    motif: 'trench-post',
    label: '1914 · Marching Infantry → Western Front Trench',
    leftFeather: 0.02,
    rightFeather: 0.02,
    featherTopFrac: 0.62,
    heightScale: 0.84,
    widthScale: 0.54,
    centerBias: 0.042,
    flip: false,
    leftGround: 0.978,
    rightGround: 0.98
  },
  'modern-1->modern-2': {
    motif: 'ruined-pier',
    label: '1939 · Great Depression → World War II Ruins',
    leftFeather: 0.03,
    rightFeather: 0.15,
    heightScale: 0.94,
    centerBias: 0.07,
    flip: false,
    leftGround: 0.98,
    rightGround: 0.99
  },
  'modern-2->modern-3': {
    motif: null,
    label: '1969 · Saturn V Launchpad → Apollo Lunar Surface',
    leftFeather: 0,
    rightFeather: 0.11,
    rightFeatherTopFrac: 0.50,
    rightFeatherBottomFrac: 0.965,
    heightScale: 0,
    centerBias: 0,
    flip: false,
    leftGround: 0.984,
    rightGround: 0.992
  }
};

// Unknown future panel joins default to a clean no-op (no unexpected motif or fade).
const DEFAULT_BOUNDARY = {
  motif: null,
  label: 'Scene boundary',
  leftFeather: 0,
  rightFeather: 0,
  heightScale: 0,
  centerBias: 0,
  flip: false,
  leftGround: 1.0,
  rightGround: 1.0
};

// Computes fixed material-space boundary specs for every adjacent panel join.
export function boundarySpecs(panels, artHeight) {
  if (!Array.isArray(panels) || panels.length < 2 || !(artHeight > 0)) return [];
  const specs = [];
  for (let i = 0; i < panels.length - 1; i++) {
    const left = panels[i];
    const right = panels[i + 1];
    const key = `${left.id}->${right.id}`;
    const cfg = PANEL_BOUNDARIES[key] || DEFAULT_BOUNDARY;
    const sourceX = right.sourceX;
    const leftFeatherPx = Math.min(left.sourceWidth * 0.18, artHeight * cfg.leftFeather);
    const rightFeatherPx = Math.min(right.sourceWidth * 0.18, artHeight * cfg.rightFeather);
    const crop = cfg.motif ? DIVIDER_CROPS[cfg.motif] : null;
    const drawHeight = crop ? artHeight * cfg.heightScale : 0;
    const drawWidth = crop ? (crop[2] / crop[3]) * drawHeight * (cfg.widthScale || 1) : 0;
    const centerX = sourceX + artHeight * (cfg.centerBias || 0);
    const halfWidthPx = crop ? drawWidth / 2 : Math.max(leftFeatherPx, rightFeatherPx);
    specs.push({
      id: key,
      index: i,
      leftPanelId: left.id,
      rightPanelId: right.id,
      sourceX,
      centerX,
      motif: cfg.motif,
      crop,
      flip: Boolean(cfg.flip),
      label: cfg.label,
      leftFeatherPx,
      rightFeatherPx,
      featherTopFrac: cfg.featherTopFrac || 0,
      leftFeatherTopFrac: cfg.leftFeatherTopFrac ?? cfg.featherTopFrac ?? 0,
      rightFeatherTopFrac: cfg.rightFeatherTopFrac ?? cfg.featherTopFrac ?? 0,
      leftFeatherBottomFrac: cfg.leftFeatherBottomFrac ?? 1,
      rightFeatherBottomFrac: cfg.rightFeatherBottomFrac ?? 1,
      drawWidth,
      drawHeight,
      halfWidthPx,
      leftGroundY: artHeight * cfg.leftGround,
      rightGroundY: artHeight * cfg.rightGround
    });
  }
  return specs;
}

// Returns the directional feather widths and vertical band fractions active on
// this exposed fragment's left and right edges.
export function fragmentEdgeFeathers(fragment, boundaries) {
  let leftFeather = 0;
  let rightFeather = 0;
  let leftTopFrac = 0;
  let rightTopFrac = 0;
  let leftBottomFrac = 1;
  let rightBottomFrac = 1;
  if (!fragment || !boundaries?.length) {
    return { leftFeather, rightFeather, leftTopFrac, rightTopFrac, leftBottomFrac, rightBottomFrac };
  }
  const panelStart = fragment.panel.sourceX;
  const panelEnd = panelStart + fragment.panel.sourceWidth;
  for (const b of boundaries) {
    if (b.rightPanelId === fragment.panel.id && fragment.sourceX < panelStart + b.rightFeatherPx - 1e-6) {
      leftFeather = Math.max(leftFeather, b.rightFeatherPx);
      leftTopFrac = b.rightFeatherTopFrac || 0;
      leftBottomFrac = b.rightFeatherBottomFrac ?? 1;
    }
    if (b.leftPanelId === fragment.panel.id && fragment.sourceX + fragment.width > panelEnd - b.leftFeatherPx + 1e-6) {
      rightFeather = Math.max(rightFeather, b.leftFeatherPx);
      rightTopFrac = b.leftFeatherTopFrac || 0;
      rightBottomFrac = b.leftFeatherBottomFrac ?? 1;
    }
  }
  return { leftFeather, rightFeather, leftTopFrac, rightTopFrac, leftBottomFrac, rightBottomFrac };
}

// Finds every panel boundary currently exposed flat (no hidden cloth folded
// between the two adjacent panels).
export function exposedFlatBoundaries(fragments, boundaries) {
  if (!fragments?.length || !boundaries?.length) return [];
  const ordered = [...fragments].sort((a, b) => a.left - b.left);
  const byKey = new Map(boundaries.map(b => [b.id, b]));
  const flat = [];
  for (let i = 0; i < ordered.length - 1; i++) {
    const a = ordered[i];
    const b = ordered[i + 1];
    if (a.panel.id === b.panel.id) continue;
    const hiddenCloth = Math.abs(b.sourceX - (a.sourceX + a.width));
    if (hiddenCloth > 0.75) continue;
    const spec = byKey.get(`${a.panel.id}->${b.panel.id}`);
    if (spec) flat.push({ spec, x: a.left + a.width, leftFrag: a, rightFrag: b });
  }
  return flat;
}

// ---- Reusable offscreen scratch buffers ----

let featherScratch = null;
const flippedCache = new WeakMap();

function ensureScratch(width, height) {
  if (!featherScratch) featherScratch = document.createElement('canvas');
  if (featherScratch.width < width) featherScratch.width = Math.ceil(width);
  if (featherScratch.height < height) featherScratch.height = Math.ceil(height);
  return featherScratch;
}

function getFlippedAtlas(atlasImage) {
  if (flippedCache.has(atlasImage)) return flippedCache.get(atlasImage);
  const c = document.createElement('canvas');
  c.width = atlasImage.naturalWidth || atlasImage.width;
  c.height = atlasImage.naturalHeight || atlasImage.height;
  const ctx = c.getContext('2d');
  ctx.translate(c.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(atlasImage, 0, 0);
  flippedCache.set(atlasImage, c);
  return c;
}

// Draws a panel fragment with smooth directional alpha feathering ONLY along
// its panel-boundary edge strips (and optionally only in the lower ground zone
// when `topFrac > 0`, keeping existing upper tree canopies 100% sharp).
export function drawFeatheredPanelSlice(ink, image, panel, fragment, artTop, artHeight, edgeInfo, pixelRatio = 1) {
  const {
    leftFeather = 0,
    rightFeather = 0,
    leftTopFrac = 0,
    rightTopFrac = 0,
    leftBottomFrac = 1,
    rightBottomFrac = 1
  } = edgeInfo || {};
  const { left, sourceX, width: exposedWidth } = fragment;
  const bodyHeight = panel.crop.height * panel.unit;
  const destY = artTop + artHeight - bodyHeight;
  const panelStart = panel.sourceX;
  const panelEnd = panelStart + panel.sourceWidth;

  const leftZoneEnd = leftFeather > 0 ? Math.min(sourceX + exposedWidth, panelStart + leftFeather) : sourceX;
  const rawLeftFadeW = Math.max(0, leftZoneEnd - sourceX);
  const rightZoneStart = rightFeather > 0 ? Math.max(sourceX, panelEnd - rightFeather) : sourceX + exposedWidth;
  const rawRightFadeW = Math.max(0, (sourceX + exposedWidth) - rightZoneStart);

  // Snap horizontal strip split coordinates to exact device pixels so adjacent
  // slices meet with zero subpixel light gap and zero double-composited seam.
  const snapOffset = (offset) => (Math.round((left + offset) * pixelRatio) / pixelRatio) - left;
  const leftFadeW = rawLeftFadeW > 0.25 ? Math.max(0, Math.min(exposedWidth, snapOffset(rawLeftFadeW))) : 0;
  const rightSplitOffset = rawRightFadeW > 0.25
    ? Math.max(leftFadeW, Math.min(exposedWidth, snapOffset(exposedWidth - rawRightFadeW)))
    : exposedWidth;
  const rightFadeW = Math.max(0, exposedWidth - rightSplitOffset);

  if (leftFadeW <= 0.25 && rightFadeW <= 0.25) {
    const cropX = panel.crop.x + (sourceX - panelStart) / panel.unit;
    ink.drawImage(image, cropX, panel.crop.y, exposedWidth / panel.unit, panel.crop.height,
      left, destY, exposedWidth, bodyHeight);
    return;
  }

  // 1. Draw the crisp unfeathered interior directly.
  const midStart = sourceX + leftFadeW;
  const midEnd = sourceX + rightSplitOffset;
  if (midEnd > midStart + 0.05) {
    const midW = midEnd - midStart;
    const cropX = panel.crop.x + (midStart - panelStart) / panel.unit;
    ink.drawImage(image, cropX, panel.crop.y, midW / panel.unit, panel.crop.height,
      left + (midStart - sourceX), destY, midW, bodyHeight);
  }

  // 2. Softly feather the narrow panel-boundary strip onto transparent linen.
  const drawStrip = (stripSourceX, stripW, fadeSide, featherSpan, topFrac, bottomFrac = 1) => {
    if (stripW <= 0.05 || featherSpan <= 0.05) return;
    const cropX = panel.crop.x + (stripSourceX - panelStart) / panel.unit;
    const destX = left + (stripSourceX - sourceX);

    // Keep upper canopy and/or lower ground bar completely crisp when feathering
    // only an interior vertical band (e.g. lunar horizon above the ground rail).
    const rawSplitY = topFrac > 0 ? bodyHeight * topFrac : 0;
    const splitY = rawSplitY > 1
      ? Math.max(0, Math.min(bodyHeight, (Math.round((destY + rawSplitY) * pixelRatio) / pixelRatio) - destY))
      : 0;
    const snappedTopFrac = splitY / bodyHeight;
    if (splitY > 1) {
      const topSrcH = panel.crop.height * snappedTopFrac;
      ink.drawImage(image, cropX, panel.crop.y, stripW / panel.unit, topSrcH,
        destX, destY, stripW, splitY);
    }

    const rawEndY = bottomFrac < 1 ? bodyHeight * bottomFrac : bodyHeight;
    const endY = bottomFrac < 1
      ? Math.max(splitY, Math.min(bodyHeight, (Math.round((destY + rawEndY) * pixelRatio) / pixelRatio) - destY))
      : bodyHeight;
    const snappedEndFrac = endY / bodyHeight;

    const fadeH = endY - splitY;
    if (fadeH > 0.5) {
      const sw = Math.max(1, Math.ceil(stripW * pixelRatio));
      const sh = Math.max(1, Math.ceil(fadeH * pixelRatio));
      const scratch = ensureScratch(sw, sh);
      const sctx = scratch.getContext('2d');
      sctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      sctx.globalCompositeOperation = 'source-over';
      sctx.clearRect(0, 0, stripW + 2, fadeH + 2);

      const bandSrcY = panel.crop.y + panel.crop.height * snappedTopFrac;
      const bandSrcH = panel.crop.height * (snappedEndFrac - snappedTopFrac);
      sctx.drawImage(image, cropX, bandSrcY, stripW / panel.unit, bandSrcH,
        0, 0, stripW, fadeH);

      sctx.globalCompositeOperation = 'destination-in';
      const grad = fadeSide === 'left'
        ? sctx.createLinearGradient(panelStart - stripSourceX, 0, panelStart + featherSpan - stripSourceX, 0)
        : sctx.createLinearGradient(panelEnd - featherSpan - stripSourceX, 0, panelEnd - stripSourceX, 0);
      if (fadeSide === 'left') {
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.25, 'rgba(0,0,0,0.34)');
        grad.addColorStop(0.65, 'rgba(0,0,0,0.84)');
        grad.addColorStop(1, 'rgba(0,0,0,1)');
      } else {
        grad.addColorStop(0, 'rgba(0,0,0,1)');
        grad.addColorStop(0.35, 'rgba(0,0,0,0.84)');
        grad.addColorStop(0.75, 'rgba(0,0,0,0.34)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
      }
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, stripW, fadeH);
      sctx.globalCompositeOperation = 'source-over';

      ink.drawImage(scratch, 0, 0, stripW * pixelRatio, fadeH * pixelRatio,
        destX, destY + splitY, stripW, fadeH);
    }

    const tailH = bodyHeight - endY;
    if (tailH > 0.5) {
      const tailSrcY = panel.crop.y + panel.crop.height * snappedEndFrac;
      const tailSrcH = panel.crop.height * (1 - snappedEndFrac);
      ink.drawImage(image, cropX, tailSrcY, stripW / panel.unit, tailSrcH,
        destX, destY + endY, stripW, tailH);
    }
  };

  if (leftFadeW > 0.25) drawStrip(sourceX, leftFadeW, 'left', leftFeather, leftTopFrac, leftBottomFrac);
  if (rightFadeW > 0.25) drawStrip(midEnd, rightFadeW, 'right', rightFeather, rightTopFrac, rightBottomFrac);
}

// Paints the embroidered Bayeux boundary divider or ground-braid bridge sprite
// clipped strictly to the exposed cloth fragment, so it glides and unfolds
// naturally out of cloth pleats.
export function drawBoundaryDivider(ink, atlasImage, boundary, fragment, artTop, artHeight) {
  if (!atlasImage || !boundary.crop || !(boundary.drawWidth > 0)) return;
  const spriteStart = boundary.centerX - boundary.drawWidth / 2;
  const spriteEnd = spriteStart + boundary.drawWidth;
  const overlapStart = Math.max(fragment.sourceX, spriteStart);
  const overlapEnd = Math.min(fragment.sourceX + fragment.width, spriteEnd);
  if (overlapEnd <= overlapStart + 0.05) return;

  const [cx, cy, cw, ch] = boundary.crop;
  const sourceImg = boundary.flip ? getFlippedAtlas(atlasImage) : atlasImage;
  const atlasW = sourceImg.naturalWidth || sourceImg.width;
  const cropXBase = boundary.flip ? atlasW - (cx + cw) : cx;

  const u0 = (overlapStart - spriteStart) / boundary.drawWidth;
  const u1 = (overlapEnd - spriteStart) / boundary.drawWidth;
  const srcX = cropXBase + u0 * cw;
  const srcW = (u1 - u0) * cw;
  const destX = fragment.left + (overlapStart - fragment.sourceX);
  const destW = overlapEnd - overlapStart;
  const groundAnchor = Math.max(boundary.leftGroundY, boundary.rightGroundY);
  const destY = artTop + Math.min(artHeight, groundAnchor + 1) - boundary.drawHeight;

  ink.drawImage(sourceImg, srcX, cy, srcW, ch, destX, destY, destW, boundary.drawHeight);
}

// Softly bridges tiny 1-2px horizontal framing-rail steps across flat border
// joins without occluding neighbouring scientific border motifs.
export function drawBorderJoinAlignment(ink, x, borderHeight, bottomBorderHeight, artHeight) {
  const bridge = (topY, h) => {
    if (h < 8) return;
    const pad = Math.max(1.2, h * 0.048);
    const halfSpan = Math.max(8, h * 0.32);
    ink.save();
    for (const ry of [topY + pad, topY + h - pad]) {
      const g = ink.createLinearGradient(x - halfSpan, 0, x + halfSpan, 0);
      g.addColorStop(0, 'rgba(154, 78, 57, 0)');
      g.addColorStop(0.32, 'rgba(154, 78, 57, 0.72)');
      g.addColorStop(0.68, 'rgba(154, 78, 57, 0.72)');
      g.addColorStop(1, 'rgba(154, 78, 57, 0)');
      ink.strokeStyle = g;
      ink.lineWidth = 1.25;
      ink.beginPath();
      ink.moveTo(x - halfSpan, ry);
      ink.lineTo(x + halfSpan, ry);
      ink.stroke();
    }
    ink.restore();
  };
  bridge(0, borderHeight);
  bridge(borderHeight + artHeight, bottomBorderHeight);
}
