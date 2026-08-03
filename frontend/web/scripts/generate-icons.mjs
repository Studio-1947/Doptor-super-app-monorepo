/*
 * Generates the PWA icon set from the brand mark, with no image dependencies.
 *
 * The icons are committed, so this script is not part of any build. It exists
 * so they are reproducible rather than mystery binaries nobody can regenerate
 * or explain: run `node scripts/generate-icons.mjs` after changing the brand
 * colour and the whole set is rewritten consistently.
 *
 * The mark matches what the login page already draws — a white "D" on
 * primary-600 (#7c3aed), square-cornered, in keeping with the rest of the UI
 * (`rounded-none` everywhere).
 *
 * ## Maskable is a different image, not the same one relabelled
 *
 * Android crops a maskable icon to whatever shape the launcher uses — circle,
 * squircle, teardrop — and only the middle 80% (the "safe zone") is guaranteed
 * to survive. Declaring `purpose: "maskable"` on artwork drawn to the edge gets
 * the mark clipped. So the maskable variant is drawn with a wider margin, which
 * is the entire reason it is generated separately.
 */
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, "..");

const BRAND = [0x7c, 0x3a, 0xed]; // primary-600
const MARK = [0xff, 0xff, 0xff];

// ---------------------------------------------------------------- PNG writer

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  // 10-12 default: deflate / adaptive filtering / no interlace

  // Each scanline is prefixed with its filter type; 0 = none.
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------------------ the mark

/**
 * Is this point inside the letter D?
 *
 * The stem is a rectangle; the bowl is the region between two half-ellipses
 * sharing a centre, so the counter (the hole) is the inner one removed. Drawn
 * from geometry rather than a font because pulling in a font renderer to draw
 * one glyph is not a trade worth making.
 */
function inMark(x, y, size, margin) {
  const pad = size * margin;
  const w = size - pad * 2;
  const h = size - pad * 2;
  const x0 = pad;
  const y0 = pad;
  const t = w * 0.26; // stroke weight, matched to the UI's heavy type

  if (x >= x0 && x <= x0 + t && y >= y0 && y <= y0 + h) return true;

  const cx = x0 + t;
  const cy = y0 + h / 2;
  if (x < cx) return false;

  const a = w - t;
  const b = h / 2;
  const outer = ((x - cx) / a) ** 2 + ((y - cy) / b) ** 2 <= 1;
  if (!outer) return false;

  const ai = a - t;
  const bi = b - t;
  if (ai <= 0 || bi <= 0) return true;
  const inner = ((x - cx) / ai) ** 2 + ((y - cy) / bi) ** 2 <= 1;
  return !inner;
}

/** 4x4 supersampling, or the curve of the bowl comes out visibly jagged. */
function render(size, margin) {
  const rgba = Buffer.alloc(size * size * 4);
  const S = 4;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let hits = 0;
      for (let sy = 0; sy < S; sy++) {
        for (let sx = 0; sx < S; sx++) {
          if (inMark(x + (sx + 0.5) / S, y + (sy + 0.5) / S, size, margin)) hits++;
        }
      }
      const a = hits / (S * S);
      const i = (y * size + x) * 4;
      rgba[i] = Math.round(BRAND[0] + (MARK[0] - BRAND[0]) * a);
      rgba[i + 1] = Math.round(BRAND[1] + (MARK[1] - BRAND[1]) * a);
      rgba[i + 2] = Math.round(BRAND[2] + (MARK[2] - BRAND[2]) * a);
      rgba[i + 3] = 255;
    }
  }
  return rgba;
}

// ---------------------------------------------------------------------- emit

const targets = [
  // [path, size, margin]
  ["public/icons/icon-192.png", 192, 0.22],
  ["public/icons/icon-512.png", 512, 0.22],
  // Wider margin so the mark survives an aggressive launcher crop.
  ["public/icons/icon-512-maskable.png", 512, 0.3],
  // App Router conventions: Next emits the <link> tags for these itself.
  ["app/icon.png", 256, 0.22],
  ["app/apple-icon.png", 180, 0.16], // iOS already rounds the corners for us
];

for (const [rel, size, margin] of targets) {
  const out = join(webRoot, rel);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, encodePng(size, render(size, margin)));
  console.log(`wrote ${rel} (${size}x${size})`);
}
