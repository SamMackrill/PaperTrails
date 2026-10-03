// Editorial drawing sections, not historical event intervals. Each source row
// is one authored depiction; these rows join end to end on a single cloth.
// Hotspot fractions describe objects in the artwork, never invented dates.
const panel = (sheet, row, from, to, focus, subjects) => ({ id: `${sheet}-${row}`, sheet, row, from, to, focus, subjects });
export const storyAtlases = {
  opening: { file: 'images/tapestry/bayeux-linear-opening-threads.webp', width: 2171, height: 724,
    bodies: [[47, 223]] },
  early: { file: 'images/tapestry/bayeux-linear-early-scene-polish-threads.webp', width: 2172, height: 724,
    bodies: [[47, 191], [245, 402], [452, 573], [610, 718]] },
  middle: { file: 'images/tapestry/bayeux-linear-middle-comets-threads.webp', width: 2172, height: 724,
    bodies: [[45, 179], [222, 378], [419, 562], [599, 718]] },
  modern: { file: 'images/tapestry/bayeux-linear-modern-trench-arrival-threads.webp', width: 2172, height: 724,
    bodies: [[44, 177], [216, 358], [395, 536], [575, 699]] }
};
export const storyPanels = [
  panel('opening', 0, 1400, 1500, .48, [['event-00', .02, .30], ['event-01', .32, .66], ['event-02', .70, .97]]),
  panel('early', 1, 1500, 1600, .28, [['event-00', .02, .20], ['event-03', .20, .45], ['event-transatlantic-slave-trade', .65, .98], ['event-02', .48, .65]]),
  panel('early', 2, 1600, 1650, .56, [['event-04', .01, .23], ['event-05', .25, .62], ['event-06', .64, .98]]),
  panel('early', 3, 1650, 1700, .425, [['event-04', .01, .23], ['event-07', .23, .39], ['story-halley-1682', .39, .47], ['event-transatlantic-slave-trade', .48, .98]]),
  panel('middle', 0, 1700, 1740, .27, [['event-10', .02, .34], ['event-11', .34, .61], ['event-04', .61, .97]]),
  panel('middle', 1, 1740, 1789, .38, [['event-12', .02, .23], ['event-04', .23, .32], ['story-halley-return', .32, .44], ['event-industrial-revolution', .44, .71], ['event-14', .73, .86], ['event-15', .87, .98]]),
  panel('middle', 2, 1789, 1830, .46, [['event-13', .01, .16], ['event-haitian-revolution', .17, .34], ['event-18', .40, .48], ['event-industrial-revolution', .48, .62], ['event-04', .63, .97], ['event-transatlantic-slave-trade', .34, .40]]),
  panel('middle', 3, 1830, 1870, .30, [['event-04', .01, .09], ['event-electric-telegraph', .10, .29], ['event-20', .30, .48], ['event-electric-telegraph', .49, .78], ['event-16', .79, .91], ['event-transatlantic-slave-trade', .92, .98]]),
  panel('modern', 0, 1870, 1914, .73, []),
  panel('modern', 1, 1914, 1939, .33, [['event-08', .01, .55], ['event-19', .58, .98]]),
  panel('modern', 2, 1939, 1969, .79, [['event-09', .01, .39], ['event-17', .40, .98]]),
  panel('modern', 3, 1969, null, .18, [['event-17', .01, .62]])
];
// Editorial camera anchors locate drawn motifs within their shared section.
// They are independent of each record's canonical point/period dates.
const cameraAnchors = {
  'opening-0': [[1400, 0], [1453, .50], [1492, .83], [1500, 1]],
  'early-3': [[1650, 0], [1682, .425], [1700, 1]],
  'middle-1': [[1740, 0], [1756, .13], [1758, .38], [1760, .46], [1777, .56], [1787, .92], [1789, 1]],
  'middle-2': [[1789, 0], [1791, .18], [1804, .44], [1812, .60], [1815, .70], [1830, 1]],
  'middle-3': [[1830, 0], [1850, .20], [1859, .36], [1861, .81], [1866, .95], [1870, 1]],
  'modern-1': [[1914, 0], [1916, .28], [1918, .55], [1929, .72], [1939, 1]],
  'modern-2': [[1939, 0], [1945, .32], [1947, .45], [1957, .78], [1969, 1]],
  'modern-3': [[1969, 0], [1972, .18], [1980, .35], [1991, .62]]
};
for (const panel of storyPanels) panel.cameraAnchors = cameraAnchors[panel.id] || [];
export const STORY_BODY_HEIGHT = 180;
