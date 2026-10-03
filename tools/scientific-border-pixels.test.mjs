import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { validateScientificBorders } from './scientific-border-artwork.mjs';
import { decodePngPixels } from './png-pixels.mjs';

const chunk = (type, data) => {
  const value = Buffer.alloc(12 + data.length);
  value.writeUInt32BE(data.length, 0); value.write(type, 4); data.copy(value, 8);
  return value;
};

test('scientific crop audit accepts native pixels and rejects a unique stale inventory hash', () => {
  const record = JSON.parse(readFileSync(new URL('../images/tapestry/scientific-border-generation.json', import.meta.url)));
  assert.equal(validateScientificBorders(record).distinctRibbons, record.ribbons.length);
  record.ribbons[0].pixelHash = '0'.repeat(64);
  assert.throws(() => validateScientificBorders(record), /Stale scientific illustration pixel hash/);
});

test('PNG decoder rejects an oversized IHDR before collecting or inflating image data', () => {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(0xffffffff, 0); header.writeUInt32BE(1, 4);
  header[8] = 8; header[9] = 6;
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header)]);
  assert.throws(() => decodePngPixels(png), /decoded data exceeds artwork limit/);
});

test('PNG decoder requires an empty IEND chunk', () => {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(1, 0); header.writeUInt32BE(1, 4);
  header[8] = 8; header[9] = 6;
  const prefix = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const body = Buffer.concat([chunk('IHDR', header), chunk('IDAT', deflateSync(Buffer.from([0, 0, 0, 0, 0])))]);
  assert.throws(() => decodePngPixels(Buffer.concat([prefix, body])), /missing IEND/);
  assert.throws(() => decodePngPixels(Buffer.concat([prefix, body, chunk('IEND', Buffer.from([0]))])), /IEND must be empty/);
});
