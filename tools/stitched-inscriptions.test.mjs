import test from 'node:test';
import assert from 'node:assert/strict';
import { planInscription, planNarrowerInscription, drawInscription, THREAD_ALPHABET } from '../src/stitchedInscriptions.js';
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

test('a rejected wide inscription has a narrower complete two-line alternative', () => {
  for (const glyphScale of [1, .78]) {
  const text = 'BELLVM DE SVCCESSIONE HISPANICA';
  const wide = planInscription(text, 600, glyphScale);
  const narrow = planNarrowerInscription(text, 600, wide.width, glyphScale);
  assert.ok(narrow);
  assert.equal(narrow.lines.length, 2);
  assert.equal(narrow.lines.map(line => line.text).join(' '), text);
  assert.ok(narrow.width < wide.width);
  assert.equal(narrow.glyphScale, glyphScale);
  const reserved = [{left:4,width:180 * glyphScale,row:0,lines:2}];
  const initial = layoutContextLabels([{ id: 'wide', ...wide, start: 200 * glyphScale, end: 400 * glyphScale, lines: 1 }], 0, 450 * glyphScale, 2, reserved);
  const retry = layoutContextLabels([{ id: 'narrow', ...narrow, start: 200 * glyphScale, end: 400 * glyphScale, lines: 2 }], 0, 450 * glyphScale, 2, reserved);
  assert.equal(initial.length, 0);
  assert.equal(retry.length, 1, 'the compact plan can use the remaining label rows');
  }
});

test('drawn multiword inscriptions keep their final strokes inside the measured canvas at both lettering sizes', () => {
  const original = globalThis.Path2D;
  const widths = new Map(Object.values(THREAD_ALPHABET).flatMap(g => g.paths.map(path => [path, g.width])));
  try {
    globalThis.Path2D = class { constructor(source) { this.source = source; } };
    for (const glyphScale of [1, .78]) for (const ratio of [1, 2]) for (const text of ['AVRORA ET FILA ELECTRICA', 'BELLVM DE SVCCESSIONE HISPANICA']) {
      const plan = planInscription(text, 1126, glyphScale), strokes = [], stack = [];
      const ink = { x: 0, y: 0, unit: 1, lineWidth: 0,
        scale(unit) { this.unit *= unit; }, setLineDash() {},
        save() { stack.push([this.x, this.y]); },
        restore() { [this.x, this.y] = stack.pop(); },
        translate(x, y) { this.x += x * this.unit; this.y += y * this.unit; },
        stroke(path) { if (this.lineWidth === 1.05) strokes.push(this.x + widths.get(path.source) * this.unit); } };
      const canvas = { style: {}, getContext: () => ink };
      drawInscription(canvas, plan, ratio);
      assert.ok(strokes.length > 0);
      assert.ok(Math.max(...strokes) <= canvas.width - 2 * glyphScale * ratio, 'final glyph retains right-hand padding');
      assert.equal(canvas.style.width, `${plan.width}px`);
    }
  } finally { globalThis.Path2D = original; }
});

test('smaller stitched lettering retains complete words and borrows less narrative space', () => {
  for (const text of latinHeadings.values()) {
    const small = planInscription(text, 1126, .78), normal = planInscription(text, 1126);
    assert.equal(small.text, normal.text);
    assert.ok(small.width < normal.width && small.height < normal.height);
    assert.ok(small.width >= (normal.width - 1) * .78);
  }
  const wrapped = planInscription('BELLVM DE SVCCESSIONE HISPANICA', 155, .78);
  assert.equal(wrapped.lines.map(line => line.text).join(' '), wrapped.text);
  assert.ok(wrapped.width <= 155);
});
