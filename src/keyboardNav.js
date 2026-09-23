// Roving keyboard focus. Each lane is a single Tab stop; the arrow keys move
// through its items in date order, and Up and Down move between lanes.

export const LANES = [
  { name: 'People', selector: '.scientist-node, .scientist-cluster' },
  { name: 'Publications', selector: '.publication, .publication-cap' },
  { name: 'Milestones', selector: '.discovery-marker, .conference-marker' },
  { name: 'Context', selector: '.event-band, .tapestry-scene' }
];

// The item in each lane that keeps the Tab stop between renders.
const activeKeys = new Map();

function laneItems(timeline, lane) {
  return [...timeline.querySelectorAll(lane.selector)]
    .sort((a, b) => a.offsetLeft + a.offsetWidth / 2 - (b.offsetLeft + b.offsetWidth / 2) || a.offsetTop - b.offsetTop);
}

function laneOf(element) {
  return LANES.findIndex((lane) => element.matches(lane.selector));
}

// Gives each lane one Tab stop: the item last focused in it if it still
// exists, otherwise the first item in view.
export function applyRovingTabindex(timeline, timelineContainer) {
  const viewport = timelineContainer.getBoundingClientRect();
  LANES.forEach((lane, laneIndex) => {
    const items = laneItems(timeline, lane);
    items.forEach((item) => item.setAttribute('tabindex', '-1'));
    const remembered = activeKeys.get(laneIndex);
    const active = items.find((item) => item.dataset.itemKey === remembered)
      || items.find((item) => item.getBoundingClientRect().right > viewport.left)
      || items[0];
    active?.setAttribute('tabindex', '0');
  });
}

export function rememberFocus(element) {
  const laneIndex = laneOf(element);
  if (laneIndex === -1 || !element.dataset.itemKey) return;
  activeKeys.set(laneIndex, element.dataset.itemKey);
  element.closest('.timeline')?.querySelectorAll(LANES[laneIndex].selector).forEach((item) => {
    item.setAttribute('tabindex', item === element ? '0' : '-1');
  });
}

function nearestByX(items, x) {
  return items.reduce((best, item) => {
    const distance = Math.abs(item.offsetLeft + item.offsetWidth / 2 - x);
    return !best || distance < best.distance ? { item, distance } : best;
  }, null)?.item;
}

// Handles arrow, Home, and End keys on a focused timeline item. Returns the
// newly focused element, or null if the key was not handled.
export function handleLaneKey(event, timeline) {
  const current = event.target.closest?.('[data-item-key]');
  const laneIndex = current ? laneOf(current) : -1;
  if (laneIndex === -1) return null;
  const items = laneItems(timeline, LANES[laneIndex]);
  const index = items.indexOf(current);
  let next = null;
  if (event.key === 'ArrowRight') next = items[index + 1];
  else if (event.key === 'ArrowLeft') next = items[index - 1];
  else if (event.key === 'Home') next = items[0];
  else if (event.key === 'End') next = items[items.length - 1];
  else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    const step = event.key === 'ArrowUp' ? -1 : 1;
    const x = current.offsetLeft + current.offsetWidth / 2;
    for (let lane = laneIndex + step; lane >= 0 && lane < LANES.length; lane += step) {
      next = nearestByX(laneItems(timeline, LANES[lane]), x);
      if (next) break;
    }
  } else {
    return null;
  }
  event.preventDefault();
  if (!next) return current;
  rememberFocus(next);
  next.focus();
  return next;
}

export function describePosition(element, timeline) {
  const laneIndex = laneOf(element);
  if (laneIndex === -1) return '';
  const items = laneItems(timeline, LANES[laneIndex]);
  return `${LANES[laneIndex].name}, ${items.indexOf(element) + 1} of ${items.length}`;
}
