import { composePictures, continuePictures, joinWidth, quietLandscape, quietAtlases, quietPictures } from './clothComposition.js?v=pass2-context-styles-v1';

const imageLoads = new Map();
const CHUNKS = 8;

function loadImage(file) {
  if (!imageLoads.has(file)) imageLoads.set(file, new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = file;
  }));
  return imageLoads.get(file);
}

function softenJoin(ink, left, right, top, height) {
  const width = right - left, fade = joinWidth(width);
  const edge = ink.createLinearGradient(left, 0, right, 0);
  edge.addColorStop(0, 'transparent'); edge.addColorStop(fade / width, '#fff');
  edge.addColorStop(1 - fade / width, '#fff'); edge.addColorStop(1, 'transparent');
  ink.globalCompositeOperation = 'destination-in'; ink.fillStyle = edge;
  ink.fillRect(left, top, width, height);
}

// Paint each composition once into eight bounded textures. Native material
// stays fixed while its detail is concealed or exposed by folds.
export async function rasterizeCloth(entries, width, height, artTop, artHeight, isCurrent = () => true, style = 'landscape') {
  const pictures = continuePictures(composePictures(entries, artHeight, width), entries, artHeight);
  const [landscapes, paintings] = await Promise.all([
    Promise.all((style === 'tapestry' ? [] : quietAtlases).map(async atlas => [atlas.file, await loadImage(atlas.file)])),
    Promise.all(pictures.map(async picture => ({ ...picture, image: await loadImage(picture.strip.atlas.file) })))
  ]);
  if (!isCurrent()) return null;
  const quietImages = new Map(landscapes);
  const scenery = quietPictures(width, artHeight, pictures, entries, style);
  if (paintings.some(({ image }) => !image)) throw new Error('Cloth panorama could not be loaded');
  const paths = quietLandscape(width, artHeight, entries, style).map(path => ({ ...path, shape: new Path2D(path.d) }));
  const chunkWidth = width / CHUNKS;
  const urls = [];
  try {
    for (let chunk = 0; chunk < CHUNKS; chunk++) {
      if (!isCurrent()) { urls.forEach(url => URL.revokeObjectURL(url)); return null; }
      const left = chunk * chunkWidth, right = left + chunkWidth;
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(chunkWidth); canvas.height = height;
      const context = canvas.getContext('2d');
      context.fillStyle = style === 'tapestry' ? '#e8dec8' : '#dfcda5'; context.fillRect(0, 0, canvas.width, height);
      context.translate(-left, artTop);
      for (const path of paths) {
        context.strokeStyle = path.stroke; context.lineWidth = path.strokeWidth;
        context.globalAlpha = path.opacity;
        if (path.fill !== 'none') { context.fillStyle = path.fill; context.fill(path.shape); }
        context.stroke(path.shape);
      }
      context.globalAlpha = 1; context.translate(0, -artTop);
      const layer = document.createElement('canvas');
      layer.width = canvas.width; layer.height = height;
      const ink = layer.getContext('2d');
      ink.translate(-left, 0);
      for (const quiet of scenery) {
        if (quiet.left + quiet.width <= left || quiet.left >= right) continue;
        const landscape = quietImages.get(quiet.atlas.file);
        if (!landscape) continue;
        ink.clearRect(left, 0, layer.width, height); ink.save();
        ink.drawImage(landscape, quiet.x, quiet.y, quiet.sourceWidth, quiet.height,
          quiet.left, artTop, quiet.width, artHeight);
        softenJoin(ink, quiet.left, quiet.left + quiet.width, artTop, artHeight);
        ink.restore(); context.drawImage(layer, left, 0);
      }
      for (const { anchor, right: pictureEnd, sceneWidth, origin, nativeWidth, strip, image } of paintings) {
        if (pictureEnd <= left || anchor >= right) continue;
        ink.clearRect(left, 0, layer.width, height); ink.save();
        ink.beginPath(); ink.rect(anchor, artTop, sceneWidth, artHeight); ink.clip();
        ink.drawImage(image, strip.x, strip.y, strip.width, strip.height,
          origin, artTop, nativeWidth, artHeight);
        softenJoin(ink, anchor, pictureEnd, artTop, artHeight);
        ink.restore(); context.drawImage(layer, left, 0);
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
