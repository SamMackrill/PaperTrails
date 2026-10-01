import { tapestryScenes, getPanoramaStrip } from './tapestryScenes.js?v=pass2-box-folds';
import { SUMMARY_WIDTH } from './clothPleats.js?v=pass2-box-folds';

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

// Paint once into eight modest-size textures. Native-size face backgrounds
// can span chunk boundaries without changing their material during zoom.
// A single 60,000px canvas would exceed common browser canvas dimension limits.
export async function rasterizeCloth(entries, width, height, artTop, artHeight, isCurrent = () => true) {
  const interlude = await loadImage(INTERLUDE.file);
  const paintings = await Promise.all(entries.map(async entry => {
    const scene = tapestryScenes.get(entry.event.title);
    const strip = scene ? getPanoramaStrip(scene, entry.original) : null;
    return { ...entry, strip, image: strip ? await loadImage(strip.atlas.file) : null };
  }));
  if (!isCurrent()) return null;
  // Installing a texture without a scene image would hide the SVG fallback
  // for that scene. Keep the complete source material visible instead.
  if (paintings.some(({ strip, image }) => strip && !image)) {
    throw new Error('Cloth panorama could not be loaded');
  }
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
      for (const { anchor, sceneWidth, strip, image } of paintings) {
        const pictureEnd = anchor + sceneWidth;
        if (strip && image && pictureEnd > left && anchor < right) {
          ink.clearRect(left, 0, chunkWidth, height);
          ink.save();
          ink.beginPath(); ink.rect(anchor, artTop, sceneWidth, artHeight); ink.clip();
          const firstFacetWidth = strip.edges[1] * artHeight / strip.height;
          const origin = anchor - Math.max(0, (firstFacetWidth - Math.min(SUMMARY_WIDTH, sceneWidth)) / 2);
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
