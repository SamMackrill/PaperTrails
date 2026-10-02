// One fabric ground under the whole viewport. Source storage rectangles never
// own a second linen colour or restart the weave at their boundaries.
let tile;
export function paintLinen(ink, width, height, camera = 0) {
  if (!tile) {
    tile = document.createElement('canvas'); tile.width = tile.height = 97;
    const weave = tile.getContext('2d');
    weave.fillStyle = '#e8dec8'; weave.fillRect(0, 0, 97, 97);
    for (let n = 0; n < 97; n += 3) {
      weave.fillStyle = n % 2 ? 'rgba(120,95,57,.035)' : 'rgba(255,252,232,.11)';
      weave.fillRect(n, 0, .6, 97); weave.fillRect(0, n, 97, .6);
    }
  }
  const pattern = ink.createPattern(tile, 'repeat');
  pattern.setTransform(new DOMMatrix().translate(-camera, 0));
  ink.fillStyle = pattern; ink.fillRect(0, 0, width, height);
}
