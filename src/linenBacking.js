// One fabric ground under the whole viewport. Source storage rectangles never
// own a second linen colour or restart the weave at their boundaries.
let tile;
export function paintLinen(ink, width, height, camera = 0) {
  if (!tile) {
    tile = document.createElement('canvas'); tile.width = tile.height = 257;
    const weave = tile.getContext('2d');
    weave.fillStyle = '#e8dec8'; weave.fillRect(0, 0, 257, 257);
    // Uneven flax strands and occasional slubs, rather than graph-paper cells.
    // Seeded once, so the fabric stays attached to the cloth while it unfolds.
    let seed = 1066;
    const random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
    for (const vertical of [true, false]) {
      for (let n = 0; n < 257; n += 1.5 + random() * 1.7) {
        weave.fillStyle = random() < .5 ? `rgba(114,91,58,${.012 + random() * .025})`
          : `rgba(255,250,232,${.025 + random() * .045})`;
        const thickness = .3 + random() * .55;
        weave.fillRect(vertical ? n : 0, vertical ? 0 : n,
          vertical ? thickness : 257, vertical ? 257 : thickness);
      }
    }
    for (let n = 0; n < 110; n++) {
      weave.fillStyle = 'rgba(128,101,65,.025)';
      weave.fillRect(random() * 257, random() * 257, .4 + random() * .7, 1 + random() * 3);
    }
  }
  const pattern = ink.createPattern(tile, 'repeat');
  pattern.setTransform(new DOMMatrix().translate(-camera, 0));
  ink.fillStyle = pattern; ink.fillRect(0, 0, width, height);
}
