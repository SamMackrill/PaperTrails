// Decode the non-interlaced 8-bit RGB/RGBA masters used by the artwork audit.
// Preserve native channels: transparent thread masters include their alpha.
import { inflateSync } from 'node:zlib';
import { createHash } from 'node:crypto';

const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
// Artwork masters are about 6 MiB decoded. Keep this decoder safe for every
// caller rather than relying on a later, atlas-specific geometry check.
const maxDecodedBytes = 64 * 1024 * 1024;
const paeth = (a, b, c) => {
  const p = a + b - c, da = Math.abs(p - a), db = Math.abs(p - b), dc = Math.abs(p - c);
  return da <= db && da <= dc ? a : db <= dc ? b : c;
};

export function decodePngPixels(png) {
  if (!png.subarray(0, 8).equals(signature)) throw new Error('Invalid PNG signature');
  let width, height, channels;
  const chunks = [];
  for (let offset = 8; offset < png.length;) {
    if (offset + 12 > png.length) throw new Error('Truncated PNG chunk');
    const size = png.readUInt32BE(offset), end = offset + 12 + size;
    if (end > png.length) throw new Error('Truncated PNG payload');
    const type = png.toString('ascii', offset + 4, offset + 8), data = png.subarray(offset + 8, end - 4);
    if (type === 'IHDR') {
      if (data.length !== 13 || data[8] !== 8 || ![2, 6].includes(data[9])
        || data[10] || data[11] || data[12]) throw new Error('Artwork requires non-interlaced 8-bit RGB/RGBA PNG');
      width = data.readUInt32BE(0); height = data.readUInt32BE(4); channels = data[9] === 2 ? 3 : 4;
      const decodedBytes = (width * channels + 1) * height;
      if (!Number.isSafeInteger(decodedBytes) || decodedBytes > maxDecodedBytes) {
        throw new Error('PNG decoded data exceeds artwork limit');
      }
    } else if (type === 'IDAT') chunks.push(data);
    else if (type === 'IEND') break;
    offset = end;
  }
  if (!width || !height || !channels || !chunks.length) throw new Error('PNG is missing image data');
  const stride = width * channels, expected = (stride + 1) * height;
  const filtered = inflateSync(Buffer.concat(chunks), { maxOutputLength: expected });
  if (filtered.length !== expected) throw new Error('PNG scanline dimensions do not match IHDR');
  const pixels = Buffer.alloc(stride * height);
  for (let row = 0; row < height; row++) {
    const input = row * (stride + 1), output = row * stride, filter = filtered[input];
    if (filter > 4) throw new Error('Unknown PNG scanline filter');
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? pixels[output + x - channels] : 0;
      const b = row ? pixels[output + x - stride] : 0;
      const c = row && x >= channels ? pixels[output + x - stride - channels] : 0;
      const predictor = [0, a, b, Math.floor((a + b) / 2), paeth(a, b, c)][filter];
      pixels[output + x] = (filtered[input + 1 + x] + predictor) & 255;
    }
  }
  return { width, height, channels, pixels };
}

export function cropPixelHash(image, top, bottom) {
  if (!Number.isInteger(top) || !Number.isInteger(bottom) || top < 0 || bottom <= top || bottom > image.height) {
    throw new Error('Invalid native PNG crop');
  }
  const stride = image.width * image.channels;
  return createHash('sha256').update(image.pixels.subarray(top * stride, bottom * stride)).digest('hex');
}
