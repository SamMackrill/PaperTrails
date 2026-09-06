// Each panorama contains five symbolic facets of a database event. These are
// descriptive illustration captions, not separately dated historical events.
export const tapestryAtlases = [
  { file: 'images/tapestry/early-panorama.png', width: 1586, height: 992, rows: [
    [0, 156, [0, 356, 670, 910, 1174, 1586]],
    [161, 291, [0, 304, 566, 956, 1254, 1586]],
    [299, 417, [0, 310, 594, 960, 1260, 1586]],
    [427, 548, [0, 305, 584, 906, 1190, 1586]],
    [565, 681, [0, 317, 610, 881, 1210, 1586]],
    [696, 804, [0, 322, 555, 901, 1230, 1586]],
    [819, 957, [0, 311, 631, 915, 1227, 1586]]
  ] },
  { file: 'images/tapestry/revolutions-panorama-v2.png', width: 1586, height: 992, rows: [
    [0, 144, [0, 321, 562, 793, 1144, 1586]],
    [153, 286, [0, 349, 640, 914, 1267, 1586]],
    [298, 422, [0, 302, 629, 941, 1255, 1586]],
    [434, 565, [0, 355, 611, 901, 1280, 1586]],
    [576, 700, [0, 327, 614, 939, 1245, 1586]],
    [711, 826, [0, 365, 640, 947, 1259, 1586]],
    [841, 979, [0, 350, 646, 1003, 1220, 1586]]
  ] },
  { file: 'images/tapestry/modern-panorama.png', width: 1586, height: 992, rows: [
    [0, 167, [0, 397, 689, 998, 1281, 1586]],
    [178, 303, [0, 389, 584, 944, 1114, 1586]],
    [315, 440, [0, 377, 565, 962, 1221, 1586]],
    [453, 565, [0, 359, 675, 943, 1228, 1586]],
    [576, 693, [0, 366, 652, 946, 1240, 1586]],
    [707, 825, [0, 337, 649, 947, 1234, 1586]],
    [837, 971, [0, 291, 597, 925, 1275, 1586]]
  ] }
];

const entries = [
  ['The Renaissance', ['Scholars and manuscripts', 'Humanist discussion', 'An artist at work', 'Classical sculpture', 'Books circulating among readers']],
  ['Fall of Constantinople', ['Cannon before the city walls', 'The Ottoman gun crews', 'Defenders and Byzantine towers', 'Ships on the Bosphorus', 'The captured city and its trade']],
  ['Early Columbian Exchange', ['An Atlantic crossing', 'Crops moving between continents', 'Horses and livestock', 'People meeting across continents', 'Illness and its human consequences']],
  ['Protestant Reformation', ['A reformer and the printing press', 'Setting movable type', 'Printing and drying pamphlets', 'Readers discussing religious texts', 'Divided religious communities']],
  ['The Little Ice Age', ['A village in snow', 'Crossing a frozen river', 'Skaters and sledges', 'Farming in the cold', 'Gathering fuel for winter']],
  ["Thirty Years' War", ['Pikemen on campaign', 'Musketeers in the field', 'Artillery and supplies', 'A damaged village and its people', 'Life in a military camp']],
  ['English Civil War', ['Royalists and Parliamentarians', 'Cavalry in the field', 'Pikes and muskets', 'A fortified town', 'Civilians and political debate']],
  ['Major European Famine', ['An empty grain basket', 'A failed harvest', 'A family sharing scarce food', 'A meagre crop', 'A community bread table']],
  ['War of the Spanish Succession', ['Soldiers and a disputed crown', 'Couriers and royal standards', 'Marching infantry', 'Cavalry and artillery', 'The campaign map and supplies']],
  ['Great Frost of 1709', ['Frozen trees and winter hardship', 'Boats trapped in ice', 'A snowbound village', 'Frozen fields', 'Shelter and shared food']],
  ["The Seven Years' War", ['Troops on campaign', 'Officers and maps', 'Field artillery', 'Warships at sea', 'An overseas coastal fort']],
  ['American Revolution', ['Colonial soldiers facing British redcoats', 'Mustering and supplies', 'The countryside at war', 'Life in an encampment', 'Discussion of independence']],
  ['Signing of the United States Constitution', ['Delegates signing in Philadelphia', 'Discussion around the table', 'Quill, ink and parchment', 'Delegates awaiting their turn', 'The proposed document in the hall']],
  ['French Revolution', ['A crowd at the Bastille', 'Citizens in the streets', 'Debate in an assembly', 'Pamphlets changing hands', 'Tricolours in a public square']],
  ['Reign of Napoleon', ['Napoleon, the imperial eagle and a map table', 'Infantry and drummers', 'Cavalry and cannon', 'Imperial ceremony', 'Administration at a desk']],
  ['Carrington Event', ['Watching the aurora', 'An operator at the telegraph key', 'Disrupted wires and instruments', 'Telegraph equipment and its operator', 'Telegraph stations beneath the aurora']],
  ['American Civil War', ['Union and Confederate soldiers', 'Life in the field camp', 'Railways and supply wagons', 'Care for the wounded', 'Civilians and damaged buildings']],
  ['World War I', ['Soldiers in a trench', 'Wire and artillery', 'A biplane overhead', 'Medical care behind the lines', 'Troops and civilians at a station']],
  ['Great Depression', ['Waiting in a breadline', 'Closed factory gates', 'Looking for work', 'A family at a sparse table', 'Neighbours sharing food']],
  ['World War II', ['Tanks and aircraft', 'Workers making equipment', 'Soldiers and supply vehicles', 'Rescue among damaged buildings', 'Civilians helping rebuild']],
  ['Cold War', ['Officials of opposing blocs', 'A dividing wall and watchtower', 'A guarded border', 'Rockets and a satellite', 'Openings in the wall']]
];

export const tapestryScenes = new Map(entries.map(([title, facets], index) => [title, {
  atlas: Math.floor(index / 7), row: index % 7, facets
}]));

export function getPanoramaCrop(scene, sceneWidth, artHeight, scale) {
  const atlas = tapestryAtlases[scene.atlas];
  const rowHeight = atlas.height / 7;
  // Use measured row and action-group boundaries, since the hand-drawn
  // panoramas do not divide into a mathematically exact grid.
  const [top, bottom, edges] = atlas.rows?.[scene.row] ?? [scene.row * rowHeight + rowHeight * 0.04,
    (scene.row + 1) * rowHeight - rowHeight * 0.04, Array.from({ length: 6 }, (_, index) => index * atlas.width / 5)];
  const cropHeight = bottom - top;
  const zoomLimit = scale < 1.5 ? 1 : scale < 3 ? 3 : scene.facets.length;
  let count = 1;
  while (count < zoomLimit && artHeight * edges[count] / cropHeight < sceneWidth) count++;
  return {
    atlas,
    y: top,
    width: edges[count],
    height: cropHeight,
    facets: scene.facets.slice(0, count),
    edges: edges.slice(0, count + 1)
  };
}
