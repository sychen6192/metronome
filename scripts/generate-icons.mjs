// Generates every app icon from assets/icon-source.png: a rounded navy tile drawn on a white
// background. Run with `npm run icons` after replacing the source image.
//
// - pwa-*.png ("any" purpose): the tile with its white surroundings made transparent.
// - maskable-icon-512x512.png / apple-touch-icon-180x180.png: full-bleed squares. The tile's
//   gradient background is modelled and extended to the edges, and the artwork is scaled to fit
//   the platform's safe zone, so no seam or white corner shows once the OS applies its mask.
// - favicon.ico: 16, 32 and 48 px PNGs in one ICO container.

import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = fileURLToPath(new URL('..', import.meta.url))
const SOURCE = `${root}assets/icon-source.png`
const OUT = `${root}public/`

const { data: src, info } = await sharp(SOURCE).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const W = info.width
const H = info.height
const N = W * H
const at = (x, y) => (y * W + x) * 4

// ---------------------------------------------------------------- 1. find the tile

// Flood-fill the near-white background from the image border.
const background = new Uint8Array(N)
const queue = new Int32Array(N)
let head = 0
let tail = 0
const isWhite = (i) => Math.min(src[i * 4], src[i * 4 + 1], src[i * 4 + 2]) >= 200
for (let x = 0; x < W; x++) for (const y of [0, H - 1]) seed(y * W + x)
for (let y = 0; y < H; y++) for (const x of [0, W - 1]) seed(y * W + x)
function seed(i) {
  if (!background[i] && isWhite(i)) {
    background[i] = 1
    queue[tail++] = i
  }
}
while (head < tail) {
  const i = queue[head++]
  const x = i % W
  if (x > 0) seed(i - 1)
  if (x < W - 1) seed(i + 1)
  if (i >= W) seed(i - W)
  if (i < N - W) seed(i + W)
}

// Distance (in px, 4-connected) from the background, capped: used for edge anti-aliasing and
// for feathering the artwork into the extended gradient.
const MAX_DIST = 64
const dist = new Uint8Array(N).fill(MAX_DIST)
head = tail = 0
for (let i = 0; i < N; i++) {
  if (background[i]) {
    dist[i] = 0
    queue[tail++] = i
  }
}
while (head < tail) {
  const i = queue[head++]
  const d = dist[i] + 1
  if (d >= MAX_DIST) continue
  const x = i % W
  for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]) {
    if (j >= 0 && j < N && dist[j] > d) {
      dist[j] = d
      queue[tail++] = j
    }
  }
}

let minX = W
let minY = H
let maxX = 0
let maxY = 0
for (let i = 0; i < N; i++) {
  if (background[i]) continue
  const x = i % W
  const y = (i / W) | 0
  minX = Math.min(minX, x)
  maxX = Math.max(maxX, x)
  minY = Math.min(minY, y)
  maxY = Math.max(maxY, y)
}
const tile = { minX, minY, maxX, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 }
const tileSize = Math.max(maxX - minX, maxY - minY) + 1

// ---------------------------------------------------------------- 2. find the artwork

// A smooth quadratic fit of the tile background, re-fitted while dropping outliers. It is only
// used to tell artwork from background (the real background has local variation it misses).
const R = tileSize / 2
const terms = (x, y) => {
  const u = (x - tile.cx) / R
  const v = (y - tile.cy) / R
  return [1, u, v, u * u, u * v, v * v]
}
const lum = (i) => (src[i * 4] + src[i * 4 + 1] + src[i * 4 + 2]) / 3
let samples = []
for (let y = minY; y <= maxY; y += 3) {
  for (let x = minX; x <= maxX; x += 3) {
    const i = y * W + x
    if (dist[i] >= 12 && lum(i) < 70) samples.push(i)
  }
}
let coeffs = fit(samples)
for (let round = 0; round < 3; round++) {
  samples = samples.filter((i) => residual(i) < 10)
  coeffs = fit(samples)
}

function fit(indices) {
  const n = 6
  return [0, 1, 2].map((c) => {
    const A = Array.from({ length: n }, () => new Float64Array(n + 1))
    for (const i of indices) {
      const t = terms(i % W, (i / W) | 0)
      const value = src[i * 4 + c]
      for (let r = 0; r < n; r++) {
        for (let k = 0; k < n; k++) A[r][k] += t[r] * t[k]
        A[r][n] += t[r] * value
      }
    }
    return solve(A)
  })
}

function solve(A) {
  const n = A.length
  for (let col = 0; col < n; col++) {
    let pivot = col
    for (let r = col + 1; r < n; r++) if (Math.abs(A[r][col]) > Math.abs(A[pivot][col])) pivot = r
    ;[A[col], A[pivot]] = [A[pivot], A[col]]
    for (let r = 0; r < n; r++) {
      if (r === col) continue
      const f = A[r][col] / A[col][col]
      for (let k = col; k <= n; k++) A[r][k] -= f * A[col][k]
    }
  }
  return A.map((row, r) => row[n] / row[r])
}

/** Fitted background colour (coarse); coordinates are clamped to the tile. */
function surface(x, y) {
  const t = terms(Math.min(maxX, Math.max(minX, x)), Math.min(maxY, Math.max(minY, y)))
  return coeffs.map((cs) => cs.reduce((sum, cf, k) => sum + cf * t[k], 0))
}

function residual(i) {
  const s = surface(i % W, (i / W) | 0)
  return Math.max(...[0, 1, 2].map((c) => Math.abs(src[i * 4 + c] - s[c])))
}


let gMinX = W
let gMinY = H
let gMaxX = 0
let gMaxY = 0
const artwork = []
for (let y = minY; y <= maxY; y++) {
  for (let x = minX; x <= maxX; x++) {
    const i = y * W + x
    if (dist[i] >= 12 && residual(i) > 20) {
      artwork.push(i)
      gMinX = Math.min(gMinX, x)
      gMaxX = Math.max(gMaxX, x)
      gMinY = Math.min(gMinY, y)
      gMaxY = Math.max(gMaxY, y)
    }
  }
}
const art = { cx: (gMinX + gMaxX) / 2, cy: (gMinY + gMaxY) / 2 }
let artRadius = 0
for (const i of artwork) {
  artRadius = Math.max(artRadius, Math.hypot((i % W) - art.cx, ((i / W) | 0) - art.cy))
}

// ---------------------------------------------------------------- 3. background beyond the tile

// Local background estimate: a normalised blur of background-only pixels (artwork, its shadow and
// the tile edge excluded), so it follows the tile's real gradient and vignette.
const EDGE = 30 // px from the tile edge where the source stops being used
const weight = new Float32Array(N)
const sums = [0, 1, 2].map(() => new Float32Array(N))
for (let i = 0; i < N; i++) {
  if (dist[i] >= 6 && residual(i) < 15) {
    weight[i] = 1
    for (let c = 0; c < 3; c++) sums[c][i] = src[i * 4 + c]
  }
}
for (const channel of [weight, ...sums]) blur(channel, 24)

function blur(values, radius) {
  // Three box blurs approximate a Gaussian; separable, O(N) each.
  const tmp = new Float32Array(N)
  for (let pass = 0; pass < 3; pass++) {
    boxPass(values, tmp, W, H, 1, W, radius)
    boxPass(tmp, values, H, W, W, 1, radius)
  }
}
function boxPass(from, to, lines, length, step, lineStep, radius) {
  for (let line = 0; line < lines; line++) {
    const base = line * lineStep
    let sum = 0
    for (let k = -radius; k <= radius; k++) if (k >= 0 && k < length) sum += from[base + k * step]
    for (let k = 0; k < length; k++) {
      to[base + k * step] = sum / (2 * radius + 1)
      const add = k + radius + 1
      const drop = k - radius
      if (add < length) sum += from[base + add * step]
      if (drop >= 0) sum -= from[base + drop * step]
    }
  }
}
const localBackground = (x, y) => {
  const i = Math.round(y) * W + Math.round(x)
  // Deep inside large artwork there is no background nearby: fall back to the coarse fit.
  if (weight[i] < 0.01) return surface(x, y)
  return [0, 1, 2].map((c) => sums[c][i] / weight[i])
}

// Along every direction from the artwork centre, the colour where the usable tile ends. Points
// beyond that radius take this colour, so the extension is continuous with the tile.
const ANGLES = 2048
const edgeRadius = new Float32Array(ANGLES)
const edgeColour = []
for (let a = 0; a < ANGLES; a++) {
  const theta = (a / ANGLES) * 2 * Math.PI
  const dx = Math.cos(theta)
  const dy = Math.sin(theta)
  let r = 0
  for (;;) {
    const x = Math.round(art.cx + (r + 1) * dx)
    const y = Math.round(art.cy + (r + 1) * dy)
    if (x < 0 || y < 0 || x >= W || y >= H || dist[y * W + x] < EDGE) break
    r += 1
  }
  edgeRadius[a] = r
  edgeColour.push(localBackground(art.cx + r * dx, art.cy + r * dy))
}
// Smooth around the circle so tiny colour differences between neighbouring rays don't streak.
const SMOOTH = 16
const rawEdge = edgeColour.map((colour) => colour.slice())
for (let a = 0; a < ANGLES; a++) {
  for (let c = 0; c < 3; c++) {
    let sum = 0
    for (let k = -SMOOTH; k <= SMOOTH; k++) sum += rawEdge[(a + k + ANGLES) % ANGLES][c]
    edgeColour[a][c] = sum / (2 * SMOOTH + 1)
  }
}

/** Background colour for any source-space point, inside or outside the tile. */
function backgroundAt(x, y) {
  const dx = x - art.cx
  const dy = y - art.cy
  const position = ((Math.atan2(dy, dx) / (2 * Math.PI) + 1) % 1) * ANGLES
  const a0 = Math.floor(position) % ANGLES
  const a1 = (a0 + 1) % ANGLES
  const f = position - Math.floor(position)
  const limit = edgeRadius[a0] * (1 - f) + edgeRadius[a1] * f
  if (Math.hypot(dx, dy) < limit) return localBackground(x, y)
  return [0, 1, 2].map((c) => edgeColour[a0][c] * (1 - f) + edgeColour[a1][c] * f)
}

// ---------------------------------------------------------------- 4. render

function bilinear(x, y, c) {
  const x0 = Math.max(0, Math.min(W - 2, Math.floor(x)))
  const y0 = Math.max(0, Math.min(H - 2, Math.floor(y)))
  const fx = Math.min(1, Math.max(0, x - x0))
  const fy = Math.min(1, Math.max(0, y - y0))
  const p = (xx, yy) => src[at(xx, yy) + c]
  return (
    p(x0, y0) * (1 - fx) * (1 - fy) + p(x0 + 1, y0) * fx * (1 - fy) + p(x0, y0 + 1) * (1 - fx) * fy + p(x0 + 1, y0 + 1) * fx * fy
  )
}

const smoothstep = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t))

/**
 * Opaque square of `size` px: source pixel (cx, cy) lands in the centre, `scale` output px per
 * source px. Away from the tile edge the source is used as-is; near and beyond it, the fitted
 * gradient takes over with a soft blend.
 */
function fullBleed(size, scale, cx, cy) {
  const out = Buffer.alloc(size * size * 4)
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const sx = cx + (i + 0.5 - size / 2) / scale
      const sy = cy + (j + 0.5 - size / 2) / scale
      const inside = sx >= 0 && sy >= 0 && sx < W && sy < H
      const d = inside ? dist[Math.round(Math.min(H - 1, sy)) * W + Math.round(Math.min(W - 1, sx))] : 0
      const w = smoothstep((d - EDGE) / EDGE)
      const bg = w < 1 ? backgroundAt(sx, sy) : [0, 0, 0]
      const o = (j * size + i) * 4
      for (let c = 0; c < 3; c++) out[o + c] = Math.round(bg[c] * (1 - w) + (w > 0 ? bilinear(sx, sy, c) * w : 0))
      out[o + 3] = 255
    }
  }
  return out
}

/** The tile on transparency: white background removed, edge pixels anti-aliased in tile colour. */
function cutout() {
  const out = Buffer.alloc(N * 4)
  for (let i = 0; i < N; i++) {
    const o = i * 4
    if (background[i]) continue
    if (dist[i] > 3) {
      src.copy(out, o, o, o + 3)
      out[o + 3] = 255
      continue
    }
    // Edge pixel: take the colour of the tile just inside it, and estimate coverage from how far
    // the pixel is from white towards that colour.
    const bg = insideColour(i % W, (i / W) | 0)
    const tileLum = (bg[0] + bg[1] + bg[2]) / 3
    const alpha = Math.min(1, Math.max(0, (255 - lum(i)) / (255 - tileLum)))
    for (let c = 0; c < 3; c++) out[o + c] = Math.round(bg[c])
    out[o + 3] = Math.round(alpha * 255)
  }
  return out
}

/** Colour of the first pixel at least 4 px inside the tile, walking towards the artwork centre. */
function insideColour(x, y) {
  const length = Math.hypot(art.cx - x, art.cy - y)
  for (let step = 1; step < 40; step++) {
    const px = Math.round(x + ((art.cx - x) / length) * step)
    const py = Math.round(y + ((art.cy - y) / length) * step)
    const i = py * W + px
    if (dist[i] >= 4) return [src[i * 4], src[i * 4 + 1], src[i * 4 + 2]]
  }
  return surface(x, y)
}

// 256-colour palette with dithering: about 50 dB PSNR against truecolour at a third of the size
// (the icons are precached by the service worker, so size matters).
const png = (image) => image.png({ compressionLevel: 9, palette: true, quality: 100, effort: 10, dither: 1 })
const raw = (buffer, size) => sharp(buffer, { raw: { width: size, height: size, channels: 4 } })
const fromRaw = (buffer, width, height) => sharp(buffer, { raw: { width, height, channels: 4 } })

// "any" icons: tile cut out, centred on a square canvas with a small margin.
const MARGIN = 0.04
const cut = cutout()
const anyMaster = await fromRaw(cut, W, H)
  .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
  .resize(Math.round(1024 * (1 - 2 * MARGIN)), Math.round(1024 * (1 - 2 * MARGIN)), {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .extend({
    top: Math.round(1024 * MARGIN),
    bottom: Math.round(1024 * MARGIN),
    left: Math.round(1024 * MARGIN),
    right: Math.round(1024 * MARGIN),
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer()

for (const size of [64, 192, 512]) {
  await png(sharp(anyMaster).resize(size, size, { kernel: 'lanczos3' })).toFile(`${OUT}pwa-${size}x${size}.png`)
}

// Maskable: the artwork must stay inside the centre circle of radius 40% (minimum safe zone).
const MASKABLE_MASTER = 1536
const maskable = fullBleed(MASKABLE_MASTER, (0.38 * MASKABLE_MASTER) / artRadius, art.cx, art.cy)
await png(raw(maskable, MASKABLE_MASTER).resize(512, 512, { kernel: 'lanczos3' })).toFile(`${OUT}maskable-icon-512x512.png`)

// Apple touch icon: iOS rounds the corners itself, so keep the original framing, full bleed.
const APPLE_MASTER = 1200
const apple = fullBleed(APPLE_MASTER, APPLE_MASTER / tileSize, tile.cx, tile.cy)
await png(raw(apple, APPLE_MASTER).resize(180, 180, { kernel: 'lanczos3' })).toFile(`${OUT}apple-touch-icon-180x180.png`)

// favicon.ico: PNG-compressed entries (supported by every current browser).
const icoSizes = [16, 32, 48]
const icoImages = await Promise.all(
  icoSizes.map((size) => png(sharp(anyMaster).resize(size, size, { kernel: 'lanczos3' })).toBuffer()),
)
const header = Buffer.alloc(6 + 16 * icoSizes.length)
header.writeUInt16LE(0, 0)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(icoSizes.length, 4)
let offset = header.length
icoSizes.forEach((size, n) => {
  const entry = 6 + 16 * n
  header.writeUInt8(size, entry)
  header.writeUInt8(size, entry + 1)
  header.writeUInt16LE(1, entry + 4) // colour planes
  header.writeUInt16LE(32, entry + 6) // bits per pixel
  header.writeUInt32LE(icoImages[n].length, entry + 8)
  header.writeUInt32LE(offset, entry + 12)
  offset += icoImages[n].length
})
await writeFile(`${OUT}favicon.ico`, Buffer.concat([header, ...icoImages]))

console.log(
  `tile ${tileSize}px at (${tile.cx}, ${tile.cy}); artwork radius ${artRadius.toFixed(0)}px; ` +
    `gradient fitted on ${samples.length} samples`,
)
