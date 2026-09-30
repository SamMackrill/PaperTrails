import { tapestryScenes, getPanoramaStrip } from './tapestryScenes.js?v=pass2-woven';

const imageLoads = new Map();
const CHUNKS = 8;
const INTERLUDE = { file: 'images/tapestry/landscape-b-interlude.png', y: 148, width: 2172, height: 468 };

function loadImage(file) {
  if (!imageLoads.has(file)) imageLoads.set(file, new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = file;
  }));
  return imageLoads.get(file);
}

function tileRow(context, image, source, origin, from, to, top, height) {
  if (!image) return;
  const tileWidth = source.width * height / source.height;
  let left = origin + Math.floor((from - origin) / tileWidth) * tileWidth;
  for (; left < to; left += tileWidth) {
    context.drawImage(image, 0, source.y, source.width, source.height, left, top, tileWidth, height);
  }
}

function knot(context, x, y, color) {
  context.strokeStyle = color;
  context.lineWidth = 1.2;
  context.beginPath();
  context.moveTo(x - 3, y);
  context.quadraticCurveTo(x, y - 4, x + 3, y);
  context.quadraticCurveTo(x, y + 4, x - 3, y);
  context.moveTo(x, y - 2); context.lineTo(x, y + 2);
  context.stroke();
}

// Paint once into eight modest-size textures. Their boundaries coincide with
// face boundaries, so no face ever changes its material or image while zooming.
// A single 60,000px canvas would exceed common browser canvas dimension limits.
export async function rasterizeCloth(entries, width, height, artTop, artHeight, isCurrent = () => true) {
  const interlude = await loadImage(INTERLUDE.file);
  const paintings = await Promise.all(entries.map(async entry => {
    const scene = tapestryScenes.get(entry.event.title);
    const strip = scene ? getPanoramaStrip(scene, entry.original) : null;
    return { ...entry, strip, image: strip ? await loadImage(strip.atlas.file) : null };
  }));
  if (!isCurrent()) return null;
  const chunkWidth = width / CHUNKS;
  const urls = [];
  try {
    for (let chunk = 0; chunk < CHUNKS; chunk++) {
      if (!isCurrent()) { urls.forEach(url => URL.revokeObjectURL(url)); return null; }
      const left = chunk * chunkWidth, right = left + chunkWidth;
      const canvas = document.createElement('canvas');
      canvas.width = chunkWidth;
      canvas.height = height;
      const context = canvas.getContext('2d');
      context.fillStyle = '#dfcda5'; context.fillRect(0, 0, chunkWidth, height);
      context.translate(-left, 0);
      tileRow(context, interlude, INTERLUDE, 0, left, right, artTop, artHeight);
      const layer = document.createElement('canvas');
      layer.width = chunkWidth; layer.height = height;
      const ink = layer.getContext('2d');
      ink.translate(-left, 0);
      for (const { anchor, end, sceneWidth, lane, strip, image } of paintings) {
        const pictureEnd = anchor + sceneWidth;
        if (strip && image && pictureEnd > left && anchor < right) {
          ink.clearRect(left, 0, chunkWidth, height);
          ink.save();
          ink.beginPath(); ink.rect(anchor, artTop, sceneWidth, artHeight); ink.clip();
          const firstFacetWidth = strip.edges[1] * artHeight / strip.height;
          const origin = anchor - Math.max(0, (firstFacetWidth - sceneWidth) / 2);
          tileRow(ink, image, strip, origin, Math.max(left, anchor), Math.min(right, pictureEnd), artTop, artHeight);
          // A fixed short join exposes the landscape underneath, never blank
          // space or content extending beyond the recorded event footprint.
          const fade = Math.min(12, sceneWidth / 4);
          const edge = ink.createLinearGradient(anchor, 0, pictureEnd, 0);
          edge.addColorStop(0, 'transparent'); edge.addColorStop(fade / sceneWidth, '#fff');
          edge.addColorStop(1 - fade / sceneWidth, '#fff'); edge.addColorStop(1, 'transparent');
          ink.globalCompositeOperation = 'destination-in'; ink.fillStyle = edge;
          ink.fillRect(anchor, artTop, sceneWidth, artHeight);
          ink.restore();
          context.drawImage(layer, left, 0);
        }
        const color = ['#854635', '#425c61', '#626539', '#694c67'][lane % 4];
        const y = 2 + lane * 5;
        if (end > left && anchor < right) {
          context.save();
          context.beginPath(); context.rect(anchor, y, end - anchor, 4); context.clip();
          context.strokeStyle = color; context.lineWidth = 1.5;
          context.beginPath();
          for (let x = Math.floor(Math.max(left, anchor) / 8) * 8; x < Math.min(right, end) + 8; x += 8) {
            context.moveTo(x - 4, y + 4); context.lineTo(x + 4, y); context.lineTo(x + 12, y + 4);
            context.moveTo(x - 4, y); context.lineTo(x + 4, y + 4); context.lineTo(x + 12, y);
          }
          context.stroke(); context.restore();
        }
        if (anchor >= left - 3 && anchor <= right + 3) knot(context, anchor, y + 2, color);
        if (end !== anchor && end >= left - 3 && end <= right + 3) knot(context, end, y + 2, color);
      }
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Cloth texture could not be painted');
      urls.push(URL.createObjectURL(blob));
    }
    return { urls, chunkWidth };
  } catch (error) {
    urls.forEach(url => URL.revokeObjectURL(url));
    throw error;
  }
}
