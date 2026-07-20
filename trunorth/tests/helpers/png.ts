import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";

export interface DecodedPng {
  width: number;
  height: number;
  /** Row-major scanlines, 4 bytes per pixel (RGBA), un-filtered. */
  rows: Buffer[];
}

/**
 * Minimal 8-bit RGBA PNG decoder — enough to inspect our own generated art in tests
 * without adding an image dependency to the project.
 */
export function decodePng(path: string): DecodedPng {
  const buf = readFileSync(path);
  let p = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat: Buffer[] = [];

  while (p < buf.length) {
    const len = buf.readUInt32BE(p);
    const type = buf.toString("ascii", p + 4, p + 8);
    if (type === "IHDR") {
      width = buf.readUInt32BE(p + 8);
      height = buf.readUInt32BE(p + 12);
      bitDepth = buf[p + 16];
      colorType = buf[p + 17];
    } else if (type === "IDAT") {
      idat.push(buf.subarray(p + 8, p + 8 + len));
    } else if (type === "IEND") {
      break;
    }
    p += 12 + len;
  }

  if (bitDepth !== 8 || colorType !== 6) {
    throw new Error(`${path}: expected 8-bit RGBA, got bitDepth ${bitDepth} colorType ${colorType}`);
  }

  const raw = inflateSync(Buffer.concat(idat));
  const bpp = 4;
  const stride = width * bpp;
  const rows: Buffer[] = [];
  let prev = Buffer.alloc(stride);
  let off = 0;

  for (let y = 0; y < height; y++) {
    const filter = raw[off++];
    const line = Buffer.from(raw.subarray(off, off + stride));
    off += stride;
    for (let i = 0; i < stride; i++) {
      const x = line[i];
      const a = i >= bpp ? line[i - bpp] : 0;
      const b = prev[i];
      const c = i >= bpp ? prev[i - bpp] : 0;
      let v: number;
      switch (filter) {
        case 0:
          v = x;
          break;
        case 1:
          v = x + a;
          break;
        case 2:
          v = x + b;
          break;
        case 3:
          v = x + ((a + b) >> 1);
          break;
        case 4: {
          const pa = Math.abs(b - c);
          const pb = Math.abs(a - c);
          const pc = Math.abs(a + b - 2 * c);
          v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
          break;
        }
        default:
          v = x;
      }
      line[i] = v & 255;
    }
    rows.push(line);
    prev = line;
  }

  return { width, height, rows };
}

/** Share of pixels that are fully transparent — proves a cutout isn't an opaque box. */
export function transparentShare({ width, height, rows }: DecodedPng): number {
  let clear = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (rows[y][x * 4 + 3] === 0) clear++;
    }
  }
  return clear / (width * height);
}

/**
 * The dominant skin colour, sampled from a band across the face. Filters to warm
 * (R > G >= B) mid-luminance opaque pixels, which excludes hair, outline and highlights.
 */
export function faceTone(png: DecodedPng): { r: number; g: number; b: number; luminance: number } {
  const { width, height, rows } = png;
  const counts = new Map<number, number>();
  for (let y = Math.floor(height * 0.16); y < Math.floor(height * 0.3); y++) {
    for (let x = Math.floor(width * 0.3); x < Math.floor(width * 0.7); x++) {
      const r = rows[y][x * 4];
      const g = rows[y][x * 4 + 1];
      const b = rows[y][x * 4 + 2];
      if (rows[y][x * 4 + 3] < 250) continue;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum < 45 || lum > 245) continue;
      if (!(r > g && g >= b)) continue;
      const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!top) throw new Error("no skin-toned pixels found in the face band");
  const r = ((top[0] >> 10) & 31) << 3;
  const g = ((top[0] >> 5) & 31) << 3;
  const b = (top[0] & 31) << 3;
  return { r, g, b, luminance: 0.299 * r + 0.587 * g + 0.114 * b };
}
