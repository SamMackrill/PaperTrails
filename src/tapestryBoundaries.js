// Authentic Bayeux Tapestry scene-boundary transitions: directional linen
// feathering, soft ground-line alignment, and embroidered faded-wool Bayeux
// dividers (intertwined trees, snow-dusted winter trees, coastal reeds,
// weathered trench post, and ruined brick archway) anchored in fixed cloth
// material coordinates so transitions unfold seamlessly with the fabric.

export const BOUNDARY_DIVIDER_ATLAS = 'images/tapestry/bayeux-boundary-dividers-threads.webp';

// Exact [x, y, width, height] crop boxes inside bayeux-boundary-dividers-threads.webp
// (745x384 RGBA transparent wool-thread sprite sheet).
export const DIVIDER_CROPS = {
  'bayeux-tree': [12, 12, 118, 360],
  'winter-tree': [142, 12, 109, 360],
  'winter-to-field': [263, 12, 120, 360],
  'coastal-shore': [395, 12, 122, 360],
  'trench-post': [529, 12, 103, 360],
  'ruined-pier': [644, 12, 89, 360]
};

// Per-join visual tuning across all 11 panel-to-panel joins of storyPanels.
// Fractions are relative to artHeight so geometry scales cleanly at any height.
export const PANEL_BOUNDARIES = {
  'opening-0->early-1': {
    motif: 'bayeux-tree',
    label: '1500 · Columbian Exchange → Renaissance Print',
    leftFeather: 0.14,
    rightFeather: 0.05,
    heightScale: 0.93,
    centerBias: 0.06,
    flip: false,
    leftGround: 0.985,
    rightGround: 0.975,
    groundTone: 'earth'
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
    rightGround: 0.955,
    groundTone: 'snow'
  },
  'early-2->early-3': {
    motif: null,
    label: '1650 · Bare Winter Tree → Timber Cottage',
    leftFeather: 0.16,
    rightFeather: 0.15,
    heightScale: 0,
    centerBias: 0,
    flip: false,
    leftGround: 0.96,
    rightGround: 0.992,
    groundTone: 'snow',
    snowBridge: true
  },
  'early-3->middle-0': {
    motif: null,
    label: '1700 · Bare Winter Tree → War of the Spanish Succession',
    leftFeather: 0.16,
    rightFeather: 0.08,
    heightScale: 0,
    centerBias: 0,
    flip: false,
    leftGround: 0.992,
    rightGround: 0.992,
    groundTone: 'mixed',
    snowBridge: true
  },
  'middle-0->middle-1': {
    motif: null,
    label: '1740 · Winter Tree & Stream → Seven Years’ War',
    leftFeather: 0.16,
    rightFeather: 0.08,
    heightScale: 0,
    centerBias: 0,
    flip: false,
    leftGround: 0.992,
    rightGround: 0.978,
    groundTone: 'mixed',
    snowBridge: true
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
    rightGround: 0.982,
    groundTone: 'earth'
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
    rightGround: 0.986,
    groundTone: 'snow'
  },
  'middle-3->modern-0': {
    motif: 'coastal-shore',
    label: '1870 · Atlantic Ship → Harvest & Plough',
    leftFeather: 0.17,
    rightFeather: 0.05,
    heightScale: 0.94,
    centerBias: -0.07,
    flip: false,
    leftGround: 0.988,
    rightGround: 0.978,
    groundTone: 'earth'
  },
  'modern-0->modern-1': {
    motif: 'trench-post',
    label: '1914 · Marching Infantry → Western Front Trench',
    leftFeather: 0.04,
    rightFeather: 0.14,
    heightScale: 0.90,
    centerBias: 0.03,
    flip: false,
    leftGround: 0.978,
    rightGround: 0.98,
    groundTone: 'mud'
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
    rightGround: 0.99,
    groundTone: 'earth'
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
    rightGround: 0.992,
    groundTone: 'lunar'
  }
};

const DEFAULT_BOUNDARY = {
  motif: 'bayeux-tree',
  label: 'Scene boundary',
  leftFeather: 0.11,
  rightFeather: 0.11,
  heightScale: 0.90,
  centerBias: 0,
  flip: false,
  leftGround: 0.982,
  rightGround: 0.982,
  groundTone: 'earth'
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
    const drawWidth = crop ? (crop[2] / crop[3]) * drawHeight : 0;
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
      drawWidth,
      drawHeight,
      halfWidthPx,
      leftGroundY: artHeight * cfg.leftGround,
      rightGroundY: artHeight * cfg.rightGround,
      groundTone: cfg.groundTone,
      snowBridge: Boolean(cfg.snowBridge)
    });
  }
  return specs;
}

// Returns the directional feather widths (in material pixels) active on this
// exposed fragment's left and right edges, based on actual panel boundaries.
export function fragmentEdgeFeathers(fragment, boundaries) {
  let leftFeather = 0;
  let rightFeather = 0;
  if (!fragment || !boundaries?.length) return { leftFeather, rightFeather };
  const panelStart = fragment.panel.sourceX;
  const panelEnd = panelStart + fragment.panel.sourceWidth;
  for (const b of boundaries) {
    if (b.rightPanelId === fragment.panel.id && fragment.sourceX < panelStart + b.rightFeatherPx - 1e-6) {
      leftFeather = Math.max(leftFeather, b.rightFeatherPx);
    }
    if (b.leftPanelId === fragment.panel.id && fragment.sourceX + fragment.width > panelEnd - b.leftFeatherPx + 1e-6) {
      rightFeather = Math.max(rightFeather, b.leftFeatherPx);
    }
  }
  return { leftFeather, rightFeather };
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
// its panel-boundary edge strips so abrupt vertical artwork cuts melt softly
// into the shared linen weave before the Bayeux divider is layered on top.
export function drawFeatheredPanelSlice(ink, image, panel, fragment, artTop, artHeight, leftFeather, rightFeather, pixelRatio = 1) {
  const { left, sourceX, width: exposedWidth } = fragment;
  const bodyHeight = panel.crop.height * panel.unit;
  const destY = artTop + artHeight - bodyHeight;
  const panelStart = panel.sourceX;
  const panelEnd = panelStart + panel.sourceWidth;

  const leftZoneEnd = leftFeather > 0 ? Math.min(sourceX + exposedWidth, panelStart + leftFeather) : sourceX;
  const leftFadeW = Math.max(0, leftZoneEnd - sourceX);
  const rightZoneStart = rightFeather > 0 ? Math.max(sourceX, panelEnd - rightFeather) : sourceX + exposedWidth;
  const rightFadeW = Math.max(0, (sourceX + exposedWidth) - rightZoneStart);

  // Fast path: interior fragment far from any panel seam.
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
  const drawStrip = (stripSourceX, stripW, fadeSide, featherSpan) => {
    if (stripW <= 0.05 || featherSpan <= 0.05) return;
    const sw = Math.max(1, Math.ceil(stripW * pixelRatio));
    const sh = Math.max(1, Math.ceil(bodyHeight * pixelRatio));
    const scratch = ensureScratch(sw, sh);
    const sctx = scratch.getContext('2d');
    sctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    sctx.globalCompositeOperation = 'source-over';
    sctx.clearRect(0, 0, stripW + 2, bodyHeight + 2);

    const cropX = panel.crop.x + (stripSourceX - panelStart) / panel.unit;
    sctx.drawImage(image, cropX, panel.crop.y, stripW / panel.unit, panel.crop.height,
      0, 0, stripW, bodyHeight);

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
    sctx.fillRect(0, 0, stripW, bodyHeight);
    sctx.globalCompositeOperation = 'source-over';

    ink.drawImage(scratch, 0, 0, stripW * pixelRatio, bodyHeight * pixelRatio,
      left + (stripSourceX - sourceX), destY, stripW, bodyHeight);
  };

  if (leftFadeW > 0.25) drawStrip(sourceX, leftFadeW, 'left', leftFeather);
  const clampedRightStart = Math.max(rightZoneStart, midStart);
  if (rightFadeW > 0.25) drawStrip(clampedRightStart, (sourceX + exposedWidth) - clampedRightStart, 'right', rightFeather);
}

// Smoothly bridges the embroidered ground-line strip across a flat panel join
// so small vertical ground-band height differences between adjacent rows never
// read as a stair-step cut.
export function drawGroundBridge(ink, spec, seamX, artTop, artHeight) {
  if (spec.groundTone === 'lunar') return;
  const span = Math.max(22, spec.leftFeatherPx + spec.rightFeatherPx);
  const yL = artTop + spec.leftGroundY;
  const yR = artTop + spec.rightGroundY;
  const bandH = Math.max(3.0, artHeight * 0.030);
  const x0 = seamX - span * 0.72;
  const x1 = seamX + span * 0.72;

  ink.save();
  // On winter joins where an existing tree already serves as the scene divider,
  // lay a soft feathered snowdrift bank across the lower seam so snowbanks and
  // ground levels merge organically without adding a second tree.
  if (spec.snowBridge) {
    const snowH = artHeight * (spec.groundTone === 'snow' ? 0.16 : 0.11);
    const snowGrad = ink.createLinearGradient(x0, 0, x1, 0);
    snowGrad.addColorStop(0, 'rgba(236, 228, 210, 0)');
    snowGrad.addColorStop(0.24, 'rgba(236, 228, 210, 0.92)');
    snowGrad.addColorStop(0.55, spec.groundTone === 'snow' ? 'rgba(236, 228, 210, 0.92)' : 'rgba(226, 214, 192, 0.62)');
    snowGrad.addColorStop(1, 'rgba(226, 214, 192, 0)');
    ink.fillStyle = snowGrad;
    ink.beginPath();
    ink.moveTo(x0, artTop + artHeight);
    ink.lineTo(x0, yL - bandH);
    ink.bezierCurveTo(
      seamX - span * 0.25, Math.min(yL, yR) - snowH,
      seamX + span * 0.25, Math.min(yL, yR) - snowH * (spec.groundTone === 'snow' ? 0.92 : 0.55),
      x1, yR - bandH
    );
    ink.lineTo(x1, artTop + artHeight);
    ink.closePath();
    ink.fill();

    // Soft hand-stitched snow crest contour fading cleanly at both ends.
    const crestGrad = ink.createLinearGradient(x0, 0, x1, 0);
    crestGrad.addColorStop(0, 'rgba(120, 96, 70, 0)');
    crestGrad.addColorStop(0.30, 'rgba(120, 96, 70, 0.42)');
    crestGrad.addColorStop(0.70, 'rgba(120, 96, 70, 0.36)');
    crestGrad.addColorStop(1, 'rgba(120, 96, 70, 0)');
    ink.strokeStyle = crestGrad;
    ink.lineWidth = 1.05;
    ink.beginPath();
    ink.moveTo(x0, yL - bandH * 1.4);
    ink.bezierCurveTo(
      seamX - span * 0.25, Math.min(yL, yR) - snowH,
      seamX + span * 0.25, Math.min(yL, yR) - snowH * (spec.groundTone === 'snow' ? 0.92 : 0.55),
      x1, yR - bandH * 1.4
    );
    ink.stroke();
  }

  const tone = spec.groundTone === 'mud'
    ? '108, 86, 64'
    : spec.groundTone === 'snow'
      ? '148, 110, 74'
      : '134, 95, 58';
  const grad = ink.createLinearGradient(x0, 0, x1, 0);
  grad.addColorStop(0, `rgba(${tone}, 0)`);
  grad.addColorStop(0.24, `rgba(${tone}, 0.85)`);
  grad.addColorStop(0.76, `rgba(${tone}, 0.85)`);
  grad.addColorStop(1, `rgba(${tone}, 0)`);
  ink.strokeStyle = grad;
  ink.lineWidth = bandH;
  ink.lineCap = 'round';
  ink.beginPath();
  ink.moveTo(x0, yL - bandH * 0.5);
  ink.bezierCurveTo(
    seamX - span * 0.18, yL - bandH * 0.5,
    seamX + span * 0.18, yR - bandH * 0.5,
    x1, yR - bandH * 0.5
  );
  ink.stroke();
  ink.restore();
}

// Paints the embroidered Bayeux boundary divider sprite clipped strictly to the
// exposed cloth fragment, so it glides and unfolds naturally out of cloth pleats.
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
    // Delicate faded-madder thread bridging the outer and inner framing lines smoothly.
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
