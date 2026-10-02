// Hand-drawn capitals in thread-sized coordinates. Text remains curated data;
// letter outlines and exact advances replace browser font measurement.
const glyph = (width, ...paths) => ({ width, paths });
export const THREAD_ALPHABET = {
  A: glyph(8, 'M0 12 L3.8 .2 L8 12 M1.5 8 L6.5 7.7'),
  B: glyph(7, 'M.5 12 L.3 .3 L3.5 .3 Q7 .3 6.5 3 Q6.4 5.7 .5 6 M.5 6 Q7 5.8 7 9 Q7 12  .5 12'),
  C: glyph(8, 'M7.5 1 Q1 -.5 .5 6 Q.3 12 7.5 11'),
  D: glyph(8, 'M.5 12 L.3 .2 Q8 -.3 8 6 Q8 12 .5 12'),
  E: glyph(7, 'M6.8 .3 L.5 .1 L.4 12 L7 11.8 M.5 6 L5.7 5.8'),
  F: glyph(7, 'M.4 12 L.5 .2 L7 .3 M.5 6 L5.5 5.8'),
  G: glyph(8, 'M7.7 1 Q.2 -.5 .3 6 Q.2 12 7.5 11 L7.7 6.5 L4.5 6.5'),
  H: glyph(8, 'M.5 .2 L.3 12 M7.4 .1 L7.7 12 M.4 6.4 L7.5 5.8'),
  I: glyph(3, 'M.1 .2 L2.8 .1 M1.4 .2 L1.7 12 M.2 12 L3 11.8'),
  J: glyph(6, 'M5.5 .2 L5.7 9 Q5.5 13 .3 11'),
  K: glyph(8, 'M.4 .2 L.5 12 M7.5 .3 L.5 6.5 L8 12'),
  L: glyph(7, 'M.4 .1 L.5 12 L7 11.8'),
  M: glyph(10, 'M.3 12 L.5 .2 L5 6.8 L9.5 .1 L9.7 12'),
  N: glyph(8, 'M.3 12 L.5 .2 L7.5 11.7 L7.7 .2'),
  O: glyph(8, 'M4 .2 Q.1 .1 .3 6 Q.1 12 4 12 Q8 12 7.8 6 Q8 .1 4 .2 Z'),
  P: glyph(7, 'M.4 12 L.5 .2 Q7 -.3 7 3.5 Q7 6.5 .5 6.3'),
  Q: glyph(9, 'M4 .2 Q.1 .1 .3 6 Q.1 12 4 12 Q8 12 7.8 6 Q8 .1 4 .2 Z M4.5 8.5 L9 12.8'),
  R: glyph(8, 'M.4 12 L.5 .2 Q7 -.3 7 3.5 Q7 6.3 .5 6.2 M3.7 6.2 L8 12'),
  S: glyph(7, 'M6.7 .7 Q.5 -.8 .4 3 Q.4 5.3 3.7 6.1 Q7.3 7 6.7 10 Q6 13 .1 11'),
  T: glyph(8, 'M.1 .3 L8 .1 M4 .2 L4.2 12'),
  U: glyph(8, 'M.3 .2 L.5 9 Q.5 12 4 12 Q7.5 12 7.6 9 L7.7 .2'),
  V: glyph(8, 'M.1 .2 L4 12 L8 .1'),
  W: glyph(11, 'M.1 .2 L2.8 12 L5.5 5.2 L8.5 12 L11 .1'),
  X: glyph(8, 'M.1 .2 L8 12 M7.8 .2 L.1 12'),
  Y: glyph(8, 'M.1 .2 L4 6.2 L8 .1 M4 6.2 L4.2 12'),
  Z: glyph(8, 'M.1 .3 L7.8 .1 L.2 12 L8 11.8'),
  '·': glyph(3, 'M1.5 5.8 L1.6 6.2')
};
export const INSCRIPTION_LINE_HEIGHT = 18;
const PALETTE = ['#354550', '#a17b42', '#743f32', '#3f5042', '#354550', '#986b38'];
const GAP = 2, SPACE = 5, PADDING = 3;
const advance = letter => (THREAD_ALPHABET[letter]?.width ?? 0) + GAP;
const wordWidth = word => [...word].reduce((sum, letter) => sum + advance(letter), 0) - GAP;

export function planInscription(text, available, glyphScale = 1) {
  if (!Number.isFinite(glyphScale) || glyphScale <= 0) return null;
  const words = String(text).trim().toUpperCase().split(/\s+/).filter(Boolean);
  available /= glyphScale;
  if (!words.length || available <= 2 * PADDING) return null;
  if (words.some(word => [...word].some(letter => !THREAD_ALPHABET[letter]))) return null;
  const limit = available - 2 * PADDING;
  const lines = [];
  for (const word of words) {
    const width = wordWidth(word);
    if (width > limit) return null; // Never truncate a word or distort a letter.
    let line = lines.at(-1);
    if (!line || line.width + SPACE + width > limit) {
      line = { text: word, width }; lines.push(line);
    } else { line.text += ` ${word}`; line.width += SPACE + width; }
  }
  if (lines.length > 2) return null;
  return { text: words.join(' '), lines, glyphScale,
    width: Math.ceil((Math.max(...lines.map(line => line.width)) + 2 * PADDING) * glyphScale),
    height: Math.ceil(lines.length * INSCRIPTION_LINE_HEIGHT * glyphScale),
    key: `${glyphScale}:${lines.map(line => line.text).join('\n')}` };
}

const paths = new Map();
// A short stitched contour with uneven capitals and muted thread colours.
// No font, text screenshot, typeset backdrop or generated lettering is used.
export function drawInscription(canvas, plan, pixelRatio = 1) {
  const ratio = Math.min(2, Math.max(1, pixelRatio));
  canvas.width = Math.ceil(plan.width * ratio); canvas.height = Math.ceil(plan.height * ratio);
  canvas.style.width = `${plan.width}px`; canvas.style.height = `${plan.height}px`;
  const ink = canvas.getContext('2d'); ink.scale(ratio * plan.glyphScale, ratio * plan.glyphScale);
  ink.lineCap = 'round'; ink.lineJoin = 'round';
  let index = 0;
  plan.lines.forEach((line, row) => {
    let x = PADDING;
    for (const letter of line.text) {
      // The preceding glyph already advanced by GAP; a word boundary replaces
      // that gap with SPACE rather than adding an unmeasured extra gap.
      if (letter === ' ') { x += SPACE - GAP; continue; }
      const shape = THREAD_ALPHABET[letter];
      if (!paths.has(letter)) paths.set(letter, shape.paths.map(path => new Path2D(path)));
      ink.save(); ink.translate(x, row * INSCRIPTION_LINE_HEIGHT + 1.2 + (index % 3) * .35);
      const color = PALETTE[index % PALETTE.length];
      for (const path of paths.get(letter)) {
        ink.save(); ink.translate(.25, .35); ink.strokeStyle = '#493c2c'; ink.globalAlpha = .2;
        ink.lineWidth = 1.55; ink.stroke(path); ink.restore();
        ink.strokeStyle = color; ink.lineWidth = 1.05; ink.stroke(path);
        ink.strokeStyle = '#edddb4'; ink.globalAlpha = .65; ink.lineWidth = .26;
        ink.setLineDash([.65, 1.2]); ink.stroke(path); ink.setLineDash([]); ink.globalAlpha = 1;
      }
      ink.restore(); x += advance(letter); index++;
    }
  });
}
