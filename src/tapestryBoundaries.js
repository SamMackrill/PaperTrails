// Authentic Bayeux Tapestry scene-boundary transitions: directional linen
// feathering, embroidered snowbank & braided-earth ground bridges, subtle
// border-rail alignment, and faded-wool Bayeux dividers anchored in fixed
// cloth material coordinates so transitions unfold seamlessly with the fabric.

export const BOUNDARY_DIVIDER_ATLAS = 'images/tapestry/bayeux-boundary-dividers-threads.webp';

// Exact [x, y, width, height] crop boxes inside bayeux-boundary-dividers-threads.webp
// (1181x516 RGBA transparent wool-thread sprite sheet).
export const DIVIDER_CROPS = {
  'palm-shore': [12, 12, 165, 360],
  'winter-tree': [189, 12, 109, 360],
  'trench-post': [310, 12, 230, 360],
  'ruined-pier': [552, 12, 89, 360],
  'harbour-quay': [653, 212, 516, 160],
  'snow-bridge-down': [12, 394, 581, 110],
  'snow-slope-single': [605, 384, 376, 120]
};

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
    motif: 'snow-bridge-down',
    label: '1650 · Existing Winter Tree → Timber Cottage',
    leftFeather: 0.11,
    rightFeather: 0.11,
    featherTopFrac: 0.66,
    heightScale: 0.18,
    widthScale: 0.64,
    centerBias: 0.01,
    flip: false,
    leftGround: 0.96,
    rightGround: 0.995
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
    motif: 'snow-slope-single',
    label: '1740 · Existing Winter Tree & Stream → Seven Years’ War',
    leftFeather: 0.055,
    rightFeather: 0.02,
    featherTopFrac: 0.60,
    heightScale: 0.22,
    widthScale: 0.44,
    centerBias: -0.045,
    flip: false,
    leftGround: 0.995,
    rightGround: 0.985
  },
  'middle-1->middle-2': {
    motif: null,
    label: '1789 · Revolutionary Cannon → Revolutionary Crowd',
    leftFeather: 0.015,
    rightFeather: 0.015,
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
    leftFeather: 0.04,
    rightFeather: 0.13,
    heightScale: 0,
    centerBias: 0,
    flip: false,
    leftGround: 0.984,
    rightGround: 0.992
  }
};

const DEFAULT_BOUNDARY = {
  motif: 'winter-tree',
  label: 'Scene boundary',
  leftFeather: 0.11,
  rightFeather: 0.11,
  heightScale: 0.90,
  centerBias: 0,
  flip: false,
  leftGround: 0.982,
  rightGround: 0.982
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
      drawWidth,
      drawHeight,
      halfWidthPx,
      leftGroundY: artHeight * cfg.leftGround,
      rightGroundY: artHeight * cfg.rightGround
    });
  }
  return specs;
}

// Returns the directional feather widths and vertical start fraction active on
// this exposed fragment's left and right edges.
export function fragmentEdgeFeathers(fragment, boundaries) {
  let leftFeather = 0;
  let rightFeather = 0;
  let leftTopFrac = 0;
  let rightTopFrac = 0;
  if (!fragment || !boundaries?.length) return { leftFeather, rightFeather, leftTopFrac, rightTopFrac };
  const panelStart = fragment.panel.sourceX;
  const panelEnd = panelStart + fragment.panel.sourceWidth;
  for (const b of boundaries) {
    if (b.rightPanelId === fragment.panel.id && fragment.sourceX < panelStart + b.rightFeatherPx - 1e-6) {
      leftFeather = Math.max(leftFeather, b.rightFeatherPx);
      leftTopFrac = b.featherTopFrac || 0;
    }
    if (b.leftPanelId === fragment.panel.id && fragment.sourceX + fragment.width > panelEnd - b.leftFeatherPx + 1e-6) {
      rightFeather = Math.max(rightFeather, b.leftFeatherPx);
      rightTopFrac = b.featherTopFrac || 0;
    }
  }
  return { leftFeather, rightFeather, leftTopFrac, rightTopFrac };
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
  const { leftFeather = 0, rightFeather = 0, leftTopFrac = 0, rightTopFrac = 0 } = edgeInfo || {};
  const { left, sourceX, width: exposedWidth } = fragment;
  const bodyHeight = panel.crop.height * panel.unit;
  const destY = artTop + artHeight - bodyHeight;
  const panelStart = panel.sourceX;
  const panelEnd = panelStart + panel.sourceWidth;

  const leftZoneEnd = leftFeather > 0 ? Math.min(sourceX + exposedWidth, panelStart + leftFeather) : sourceX;
  const leftFadeW = Math.max(0, leftZoneEnd - sourceX);
  const rightZoneStart = rightFeather > 0 ? Math.max(sourceX, panelEnd - rightFeather) : sourceX + exposedWidth;
  const rightFadeW = Math.max(0, (sourceX + exposedWidth) - rightZoneStart);

  if (leftFadeW <= 0.25 && rightFadeW <= 0.25) {
    const cropX = panel.crop.x + (sourceX - panelStart) / panel.unit;
    ink.drawImage(image, cropX, panel.crop.y, exposedWidth / panel.unit, panel.crop.height,
      left, destY, exposedWidth, bodyHeight);
    return;
  }

  // 1. Draw the crisp unfeathered interior directly.
  const midStart = sourceX + leftFadeW;
  const midEnd = sourceX + exposedWidth - rightFadeW;
  if (midEnd > midStart + 0.05) {
    const midW = midEnd - midStart;
    const cropX = panel.crop.x + (midStart - panelStart) / panel.unit;
    ink.drawImage(image, cropX, panel.crop.y, midW / panel.unit, panel.crop.height,
      left + (midStart - sourceX), destY, midW, bodyHeight);
  }

  // 2. Softly feather the narrow panel-boundary strip onto transparent linen.
  const drawStrip = (stripSourceX, stripW, fadeSide, featherSpan, topFrac) => {
    if (stripW <= 0.05 || featherSpan <= 0.05) return;
    const cropX = panel.crop.x + (stripSourceX - panelStart) / panel.unit;
    const destX = left + (stripSourceX - sourceX);

    // Keep upper canopy completely crisp when feathering only the lower ground/snow band.
    const splitY = topFrac > 0 ? bodyHeight * topFrac : 0;
    if (splitY > 1) {
      const topSrcH = panel.crop.height * topFrac;
      ink.drawImage(image, cropX, panel.crop.y, stripW / panel.unit, topSrcH,
        destX, destY, stripW, splitY);
    }

    const fadeH = bodyHeight - splitY;
    if (fadeH <= 0.5) return;
    const sw = Math.max(1, Math.ceil(stripW * pixelRatio));
    const sh = Math.max(1, Math.ceil(fadeH * pixelRatio));
    const scratch = ensureScratch(sw, sh);
    const sctx = scratch.getContext('2d');
    sctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    sctx.globalCompositeOperation = 'source-over';
    sctx.clearRect(0, 0, stripW + 2, fadeH + 2);

    const lowerSrcY = panel.crop.y + panel.crop.height * topFrac;
    const lowerSrcH = panel.crop.height * (1 - topFrac);
    sctx.drawImage(image, cropX, lowerSrcY, stripW / panel.unit, lowerSrcH,
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
  };

  if (leftFadeW > 0.25) drawStrip(sourceX, leftFadeW, 'left', leftFeather, leftTopFrac);
  const clampedRightStart = Math.max(rightZoneStart, midStart);
  if (rightFadeW > 0.25) drawStrip(clampedRightStart, (sourceX + exposedWidth) - clampedRightStart, 'right', rightFeather, rightTopFrac);
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
