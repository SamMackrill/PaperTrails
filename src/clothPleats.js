// One fixed length of fabric, gently pleated across the entire timeline.
// The rounded angular profile is solved to fit the exact projected width.
export const PLEAT_COUNT = 64;
export const PLEAT_FACES = 8;

export function layoutPleats(materialWidth, projectedWidth, count = PLEAT_COUNT) {
  const ratio = Math.max(1 / 32, Math.min(1, projectedWidth / materialWidth));
  // Tight gathers relax into broad rounded crests as fabric is released.
  // There are no zoom tiers or discrete changes in the fold count.
  const tightness = 2 + 10 * (1 - ratio) ** 4;
  const profile = Array.from({ length: PLEAT_FACES }, (_, i) =>
    Math.tanh(tightness * Math.sin(2 * Math.PI * (i + 0.5) / PLEAT_FACES)));
  let low = 0, high = Math.PI / 2;
  if (ratio < 1) for (let i = 0; i < 48; i++) {
    const angle = (low + high) / 2;
    const projection = profile.reduce((sum, value) => sum + Math.cos(angle * value), 0) / profile.length;
    if (projection > ratio) low = angle; else high = angle;
  }
  const amplitude = ratio === 1 ? 0 : (low + high) / 2;
  const faceWidth = materialWidth / (count * PLEAT_FACES);
  const faces = [];
  let left = 0, depth = 0;
  for (let i = 0; i < count * PLEAT_FACES; i++) {
    const angle = amplitude * profile[i % PLEAT_FACES];
    const width = faceWidth * Math.cos(angle);
    faces.push({ sourceX: i * faceWidth, sourceWidth: faceWidth, left, depth,
      width, angle: angle * 180 / Math.PI, shade: Math.sin(angle) ** 2 });
    left += width;
    depth -= faceWidth * Math.sin(angle);
  }
  return { materialWidth, width: left, openness: (ratio - 1 / 32) / (1 - 1 / 32), faces };
}

// Braids, captions and scene targets follow their positions on the same fabric.
export function projectClothX(sourceX, pose) {
  const x = Math.max(0, Math.min(pose.materialWidth, sourceX));
  const faceWidth = pose.faces[0].sourceWidth;
  const face = pose.faces[Math.min(pose.faces.length - 1, Math.floor(x / faceWidth))];
  return face.left + (x - face.sourceX) * face.width / face.sourceWidth;
}
