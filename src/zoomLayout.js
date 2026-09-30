// Preserve marker and label sizes while their timeline coordinates move.
export function projectZoomBox(box, ratio) {
  return { left: (box.left + box.anchor) * ratio - box.anchor,
    width: box.stretch ? box.width * ratio : box.width };
}

// Gentle acceleration and contact at both ends; large first-frame changes
// are especially visible when they unfold illustrated cloth.
export function zoomProgress(elapsed, duration) {
  const t = Math.max(0, Math.min(1, elapsed / duration));
  return t * t * (3 - 2 * t);
}
