// Generates the extension icons (rounded square in the Focus accent with a
// white check mark) as PNGs in public/icons. Run with `npm run icons`.
import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const ACCENT = [0xc2, 0x41, 0x0c];
const SIZES = [16, 48, 128];
// Check mark polyline in a 24-unit box, same path as the Focus "done" icon.
const CHECK = [[5, 12.5], [9.5, 17], [19, 7.5]];
const SUPERSAMPLE = 4;

function distToSegment(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}

function insideRoundedSquare(x, y, size, radius) {
  const cx = Math.min(Math.max(x, radius), size - radius);
  const cy = Math.min(Math.max(y, radius), size - radius);
  return Math.hypot(x - cx, y - cy) <= radius;
}

function render(size) {
  const radius = size * 0.22;
  const stroke = (size / 24) * (size <= 16 ? 3 : 2.6);
  const pixels = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let bg = 0;
      let mark = 0;
      for (let sy = 0; sy < SUPERSAMPLE; sy++) {
        for (let sx = 0; sx < SUPERSAMPLE; sx++) {
          const px = x + (sx + 0.5) / SUPERSAMPLE;
          const py = y + (sy + 0.5) / SUPERSAMPLE;
          if (!insideRoundedSquare(px, py, size, radius)) continue;
          bg++;
          const ux = (px / size) * 24;
          const uy = (py / size) * 24;
          const d = Math.min(distToSegment(ux, uy, CHECK[0], CHECK[1]), distToSegment(ux, uy, CHECK[1], CHECK[2]));
          if (d * (size / 24) <= stroke / 2) mark++;
        }
      }
      const samples = SUPERSAMPLE * SUPERSAMPLE;
      const m = bg ? mark / bg : 0;
      const i = (y * size + x) * 4;
      for (let c = 0; c < 3; c++) pixels[i + c] = Math.round(ACCENT[c] * (1 - m) + 255 * m);
      pixels[i + 3] = Math.round((bg / samples) * 255);
    }
  }
  return encodePng(size, pixels);
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  // Each scanline is prefixed with filter type 0 (none).
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync("public/icons", { recursive: true });
for (const size of SIZES) writeFileSync(`public/icons/icon-${size}.png`, render(size));
