// scripts/make-icons.mjs — deterministic PWA icon generator (F-9). Zero
// dependencies: hand-rolled PNG encoding over node:zlib, so the icons are
// reproducible from this script alone (no binary blobs of unknown origin in
// the repo history — regenerate any time with `node scripts/make-icons.mjs`).
// Motif: the lantern flame (Field Mode's courage light) as a layered diamond
// in the canon palette — amber leads on deep indigo (art-direction §2).

import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')

// ---- minimal PNG writer (8-bit RGBA, filter 0) ----

const CRC_TABLE = new Int32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c
})

function crc32(buf) {
  let c = -1
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length)
  out.writeUInt32BE(data.length, 0)
  out.write(type, 4, 'ascii')
  data.copy(out, 8)
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length)
  return out
}

function png(size, rgba) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y += 1) {
    raw[y * (size * 4 + 1)] = 0 // filter: none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ---- the lantern flame ----

const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16))
const INDIGO_TOP = hex('#141026')
const INDIGO_BOTTOM = hex('#221b3d')
const GLOW = hex('#3d3270')
const FLAME = hex('#f2b64a')
const CORE = hex('#fbeecb')

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t))
const clamp01 = (v) => Math.max(0, Math.min(1, v))

/** rounded=true cuts transparent rounded corners (maskable-safe margins);
 *  apple-touch-icon stays a full square — iOS applies its own mask. */
function draw(size, rounded) {
  const rgba = Buffer.alloc(size * size * 4)
  const r = 0.16
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const nx = (x + 0.5) / size
      const ny = (y + 0.5) / size
      let alpha = 255
      if (rounded) {
        const cx = nx < r ? r : nx > 1 - r ? 1 - r : nx
        const cy = ny < r ? r : ny > 1 - r ? 1 - r : ny
        if (Math.hypot(nx - cx, ny - cy) > r) alpha = 0
      }
      let color = mix(INDIGO_TOP, INDIGO_BOTTOM, ny)
      const d = Math.abs(nx - 0.5) + Math.abs(ny - 0.52) // diamond distance
      color = mix(color, GLOW, clamp01((0.36 - d) / 0.36) * 0.9)
      color = mix(color, FLAME, clamp01((0.245 - d) / 0.02))
      color = mix(color, CORE, clamp01((0.115 - d) / 0.02))
      const o = (y * size + x) * 4
      rgba[o] = color[0]
      rgba[o + 1] = color[1]
      rgba[o + 2] = color[2]
      rgba[o + 3] = alpha
    }
  }
  return png(size, rgba)
}

mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, 'icon-192.png'), draw(192, true))
writeFileSync(join(OUT, 'icon-512.png'), draw(512, true))
writeFileSync(join(OUT, 'apple-touch-icon.png'), draw(180, false))
console.log('icons written to public/icons/')
