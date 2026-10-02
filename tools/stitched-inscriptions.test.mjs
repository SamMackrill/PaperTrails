import test from 'node:test';
import assert from 'node:assert/strict';
import { planInscription, drawInscription, THREAD_ALPHABET } from '../src/stitchedInscriptions.js';
import { latinHeadings } from '../src/contextHeadings.js';
import { layoutContextLabels } from '../src/contextLabels.js';

test('every curated Latin heading has complete measured thread glyphs', () => {
  for (const text of latinHeadings.values()) {
    const plan = planInscription(text, 1126);
    assert.equal(plan.text, text);
    assert.equal(plan.lines.length, 1);
    assert.ok(plan.width <= 1126);
    assert.ok([...text.replaceAll(' ', '')].every(letter => THREAD_ALPHABET[letter]));
  }
});

test('whole Latin words borrow empty space and wrap without cropped suffixes', () => {
  const text = 'SERVITVS ATLANTICA';
  const wide = planInscription(text, 600), wrapped = planInscription(text, 95);
  assert.equal(wide.lines[0].text, text);
  assert.equal(wrapped.lines.map(line => line.text).join(' '), text);
  assert.equal(wrapped.lines.length, 2);
  assert.ok(wrapped.width <= 95);
  const placed = layoutContextLabels([{ ...wide, lines: wide.lines.length, start: 220, end: 225 }], 0, 600, 2);
  assert.equal(placed.length, 1);
  assert.equal(placed[0].width, wide.width);
  assert.ok(placed[0].width > 5, 'inscription uses space beyond its narrow subject');
  assert.equal(planInscription(text, 40), null, 'too little room hides a whole inscription instead of truncating it');
});

test('wrapped inscriptions occupy both rows and retain their words when panned', () => {
  const plan = planInscription('BELLVM DE SVCCESSIONE HISPANICA', 195);
  assert.equal(plan.lines.map(line => line.text).join(' '), plan.text);
  const placed = layoutContextLabels([{ ...plan, lines: plan.lines.length, start: 0, end: 800 }], 300, 600, 2);
  assert.equal(placed.length, 1);
  assert.equal(placed[0].width, plan.width);
  assert.ok(placed[0].left >= 304 && placed[0].left + placed[0].width <= 596);
});

test('drawn multiword inscriptions keep their final strokes inside the measured canvas', () => {
  const original = globalThis.Path2D;
  const widths = new Map(Object.values(THREAD_ALPHABET).flatMap(g => g.paths.map(path => [path, g.width])));
  try {
    globalThis.Path2D = class { constructor(source) { this.source = source; } };
    for (const text of ['AVRORA ET FILA ELECTRICA', 'BELLVM DE SVCCESSIONE HISPANICA']) {
      const plan = planInscription(text, 1126), strokes = [], stack = [];
      const ink = { x: 0, y: 0, lineWidth: 0, scale() {}, setLineDash() {},
        save() { stack.push([this.x, this.y]); },
        restore() { [this.x, this.y] = stack.pop(); },
        translate(x, y) { this.x += x; this.y += y; },
        stroke(path) { if (this.lineWidth === 1.05) strokes.push(this.x + widths.get(path.source)); } };
      const canvas = { style: {}, getContext: () => ink };
      drawInscription(canvas, plan);
      assert.ok(strokes.length > 0);
      assert.ok(Math.max(...strokes) <= plan.width - 2, 'final glyph retains right-hand padding');
    }
  } finally { globalThis.Path2D = original; }
});
