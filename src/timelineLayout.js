// Pure layout helpers for the timeline. Nothing here touches the DOM, so the
// placement rules can be unit tested.

export const EVENT_LABEL_PADDING = 12;
export const EVENT_PIN_GAP = 5;

export function getNotability(scientist) {
  const value = Number(scientist?.notability);
  return value === 1 || value === 3 ? value : 2;
}

// A short name for canvas labels: the parenthetical title if there is one,
// otherwise the surname with any lowercase particles ("van der Waals").
export function getTimelineLabel(name) {
  const text = String(name || '').trim();
  const parenthetical = text.match(/\(([^)]+)\)/);
  if (parenthetical) return parenthetical[1].trim().split(/\s+/).pop();
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  let start = words.length - 1;
  while (start > 0 && /^\p{Ll}/u.test(words[start - 1])) start -= 1;
  return words.slice(start).join(' ');
}

// Ranks the people shown on a face stack: most notable first, then those with
// more works on the timeline, then chronologically.
export function rankForFaces(a, b) {
  return getNotability(a.scientist) - getNotability(b.scientist)
    || (b.scientist.publications?.length || 0) - (a.scientist.publications?.length || 0)
    || a.x - b.x;
}

// Places people in rows above the axis. Each person goes as close to their
// date as possible: in any row, and shifted sideways by up to maxShift pixels
// (their connector then runs diagonally to their first publication). Only
// when no slot is close enough do they join the nearest group.
// `entries` must be sorted by x and carry { x, width }.
export function layoutPeople(entries, { levelCount, gap = 10, groupDistance = 0, clusterWidth, maxShift = 0, width = Infinity }) {
  const groups = [];
  entries.forEach((entry) => {
    const current = groups[groups.length - 1];
    if (groupDistance > 0 && current && entry.x - current.members[0].x < groupDistance) {
      current.members.push(entry);
    } else {
      groups.push({ members: [entry] });
    }
  });

  const rows = Array.from({ length: Math.max(1, levelCount) }, () => []);
  const placed = [];
  const extentOf = (item) => (item.members.length > 1 ? clusterWidth(item.members.length) : item.members[0].width);
  const fits = (row, left, right) => row.every((other) => right + gap <= other.left || left >= other.right + gap);

  groups.forEach((group) => {
    const ideal = group.members[0].x;
    const itemWidth = extentOf(group);
    const clampCentre = (centre) => Math.max(itemWidth / 2, Math.min(width - itemWidth / 2, centre));
    let best = null;
    rows.forEach((row, level) => {
      // The ideal spot, or hard against either side of an existing item.
      const candidates = [ideal, ...row.flatMap((other) => [other.right + gap + itemWidth / 2, other.left - gap - itemWidth / 2])];
      candidates.forEach((candidate) => {
        const centre = clampCentre(candidate);
        const shift = Math.abs(centre - ideal);
        if (shift > Math.max(maxShift, Math.abs(clampCentre(ideal) - ideal))) return;
        if (!fits(row, centre - itemWidth / 2, centre + itemWidth / 2)) return;
        // Small shifts win; among equal shifts, lower rows keep lines short.
        const cost = shift + level * 0.5;
        if (!best || cost < best.cost) best = { cost, level, centre };
      });
    });

    if (best) {
      const item = { members: [...group.members], level: best.level, left: best.centre - itemWidth / 2, right: best.centre + itemWidth / 2 };
      rows[best.level].push(item);
      placed.push(item);
      return;
    }
    // Join the nearest group that still fits in its row once it grows,
    // sliding it within the allowed shift if needed; failing that, the
    // nearest group of all.
    const grown = (item) => extentOf({ members: [...item.members, ...group.members] });
    const byDistance = [...placed].sort((first, second) => (
      Math.abs((first.left + first.right) / 2 - ideal) - Math.abs((second.left + second.right) / 2 - ideal)
    ));
    // Only groups near this person's date may take them; a distant group
    // would leave them with no portrait near their period.
    const centreOf = (item) => (item.left + item.right) / 2;
    const nearby = byDistance.filter((item) => Math.abs(centreOf(item) - ideal) <= Math.max(maxShift, grown(item)) + itemWidth);
    const placement = nearby.map((item) => {
      const others = rows[item.level].filter((other) => other !== item);
      const grownWidth = grown(item);
      const anchor = (item.left + item.right) / 2;
      const candidates = [anchor, ...others.flatMap((other) => [other.right + gap + grownWidth / 2, other.left - gap - grownWidth / 2])]
        .map((centre) => Math.max(grownWidth / 2, Math.min(width - grownWidth / 2, centre)))
        .filter((centre) => Math.abs(centre - anchor) <= Math.max(maxShift, grownWidth))
        .sort((first, second) => Math.abs(first - anchor) - Math.abs(second - anchor));
      const centre = candidates.find((candidate) => fits(others, candidate - grownWidth / 2, candidate + grownWidth / 2));
      return centre === undefined ? null : { item, centre, grownWidth };
    }).find(Boolean);
    const target = placement?.item || byDistance[0];
    const centre = placement?.centre ?? (target.left + target.right) / 2;
    const grownWidth = placement?.grownWidth ?? grown(target);
    target.members.push(...group.members);
    target.left = centre - grownWidth / 2;
    target.right = centre + grownWidth / 2;
  });

  return placed.map((item) => {
    const itemWidth = extentOf(item);
    return { ...item, type: item.members.length > 1 ? 'cluster' : 'person', centerX: item.left + itemWidth / 2, width: itemWidth };
  });
}

// Stacks publications upward in fixed-width pixel bins, so the stacks double
// as a histogram of output. Items beyond maxStack are summarised by a cap.
export function binPublications(items, { binWidth, maxStack }) {
  const bins = new Map();
  [...items].sort((a, b) => a.x - b.x || a.year - b.year).forEach((item) => {
    const key = Math.floor(item.x / binWidth);
    if (!bins.has(key)) bins.set(key, []);
    bins.get(key).push(item);
  });
  const stacked = [];
  const caps = [];
  bins.forEach((binItems, key) => {
    const centerX = (key + 0.5) * binWidth;
    binItems.forEach((item, index) => {
      if (index < maxStack) stacked.push({ ...item, stackIndex: index, binX: centerX });
    });
    if (binItems.length > maxStack) {
      const hidden = binItems.slice(maxStack);
      caps.push({
        binX: centerX,
        count: hidden.length,
        year: Math.round(binItems.reduce((sum, item) => sum + item.year, 0) / binItems.length)
      });
    }
  });
  return { stacked, caps };
}

// Assigns milestone markers to rows without overlap, using as many rows as
// needed. The caller compresses the row spacing to fit.
export function layoutMilestoneRows(items, markerSize, gap = 10) {
  const rowEnds = [];
  const placements = items.map((item) => {
    const left = item.x - markerSize / 2;
    let level = rowEnds.findIndex((end) => left > end + gap);
    if (level === -1) level = rowEnds.push(-Infinity) - 1;
    rowEnds[level] = item.x + markerSize / 2;
    return { ...item, level };
  });
  return { placements, rows: Math.max(1, rowEnds.length) };
}

// Chooses how an event band shows its title. Titles never cross a band's
// edges: a band either contains its label, carries it alongside as a pin, or
// relies on its tooltip.
export function planEventLabel(bandWidth, fullWidth, shortWidth) {
  if (fullWidth + EVENT_LABEL_PADDING <= bandWidth) return { mode: 'inside', useShort: false, extent: 0 };
  if (shortWidth + EVENT_LABEL_PADDING <= bandWidth) return { mode: 'inside', useShort: true, extent: 0 };
  return { mode: 'pin', useShort: true, extent: EVENT_PIN_GAP + shortWidth + EVENT_LABEL_PADDING };
}

export function findFreeLevel(occupiedLevels, start, end) {
  return occupiedLevels.findIndex((intervals) => intervals.every((interval) => end <= interval.start || start >= interval.end));
}

// Assigns each event a row. Labels are dropped before rows are added, and
// rows are added rather than letting bands overlap.
export function layoutEventRows(items, comfortableRows) {
  const occupiedLevels = [[]];
  const placements = items.map((item) => {
    let plan = item.plan;
    let level = findFreeLevel(occupiedLevels, item.startX, item.startX + item.bandWidth + plan.extent + 4);
    if (level === -1 && plan.mode === 'pin') {
      if (occupiedLevels.length < comfortableRows) {
        level = occupiedLevels.push([]) - 1;
      } else {
        // Without room for a pinned label, the band keeps only its tooltip.
        plan = { mode: 'none', useShort: true, extent: 0 };
        level = findFreeLevel(occupiedLevels, item.startX, item.startX + item.bandWidth + 4);
      }
    }
    if (level === -1) level = occupiedLevels.push([]) - 1;
    occupiedLevels[level].push({ start: item.startX, end: item.startX + item.bandWidth + plan.extent + 4 });
    return { ...item, plan, level };
  });
  return { placements, rows: occupiedLevels.length };
}

// Splits the height between the three lanes. Context and milestones get what
// their content needs, within limits, and people get the rest.
export function planLanes({ height, milestonesNeed, contextNeed, milestonesVisible = true, contextVisible = true }) {
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const contextHeight = contextVisible ? Math.round(clamp(contextNeed, height * 0.16, height * 0.36)) : 0;
  const milestonesHeight = Math.round(milestonesVisible
    ? clamp(milestonesNeed, height * 0.14, height * 0.34)
    : Math.min(56, height * 0.12));
  const axisY = height - contextHeight - milestonesHeight;
  return { axisY, contextTop: axisY + milestonesHeight, milestonesHeight, contextHeight };
}
