/**
 * Geometry of a conductor's beat pattern, as drawn in conducting textbooks: the downbeat falls
 * straight to the bottom, the last beat rises (the upbeat), and the beats between move inwards
 * then outwards along the plane of beating. 3 beats give the triangle, 4 the cross, 6 the
 * German six. Coordinates are in a fixed 400 x 260 box.
 */

export interface Point {
  x: number
  y: number
}

/** Cubic Bézier from one beat point (ictus) to the next. */
export interface Segment {
  from: Point
  c1: Point
  c2: Point
  to: Point
}

export interface PatternGeometry {
  /** One point per beat, beat 1 first. */
  ictus: Point[]
  /** Crowded bars put numerals on the ictus (smaller), so they cannot collide; see numeralPoints. */
  labelsOnIctus: boolean
  /** Where the baton waits while stopped: raised, ready for the downbeat. */
  rest: Point
  /** segments[k] runs from beat k to the next beat (the last one back to beat 1). */
  segments: Segment[]
}

export const PATTERN_BOX = { width: 400, height: 260 } as const
/** The widest the figure is drawn on screen, in px (the stylesheet's cap on `.pattern`). */
const WIDEST_FIGURE = 720

const CENTER = PATTERN_BOX.width / 2
const DOWNBEAT: Point = { x: CENTER, y: 212 }
const UPBEAT: Point = { x: CENTER + 34, y: 130 }
/** Crowded bars lift the upbeat clear of the raised tiers on the right. */
const CROWDED_UPBEAT: Point = { x: CENTER + 30, y: 90 }
const PLANE_Y = 186
const TOP_Y = -6
const MAX_BEATS = 16
/** Up to this many beats, numerals sit beside their ictus; more and they sit on it. */
const MAX_BESIDE = 8
/** How far from its ictus a numeral's centre sits, in drawing units, */
const LABEL_GAP = 38
/** but on screen never more than this many px clear of the mark: a large figure keeps its numerals by their beats. */
const NUMERAL_GAP = 14

/** Horizontal distance from the centre of the j-th of `count` side beats (1-based). */
function sideOffset(j: number, count: number, crowded: boolean): number {
  if (count === 1) return 122
  // Crowded sides (on-ictus numerals) use the full width.
  const [inner, outer] = crowded ? [62, 186] : [60, 172]
  return inner + ((outer - inner) * (j - 1)) / (count - 1)
}

/**
 * Three or more beats on a side step up through raised tiers in turn (two, or three for six or
 * more crowded beats), so neighbouring numerals clear each other even in the narrowest figure
 * (288 px wide). Returns how far the j-th beat is raised.
 */
function lift(j: number, count: number, crowded: boolean): number {
  if (count < 3) return 0
  if (!crowded) return j % 2 === 0 ? 36 : 0
  const tiers = count >= 6 ? 3 : 2
  return ((j - 1) % tiers) * (tiers === 3 ? 52 : 46)
}

function sidePoint(direction: -1 | 1, j: number, count: number, crowded: boolean): Point {
  return { x: CENTER + direction * sideOffset(j, count, crowded), y: PLANE_Y - lift(j, count, crowded) }
}

function segment(from: Point, to: Point, isDownbeat: boolean): Segment {
  if (isDownbeat) {
    // Rebound up from the last beat, then the long vertical fall into beat 1.
    return {
      from,
      c1: { x: from.x + 18, y: Math.min(from.y - 110, 30) },
      c2: { x: to.x, y: TOP_Y - 24 },
      to,
    }
  }
  // Every other beat: a rebound off the ictus, then a fall into the next one from above.
  const lift = 52 + 0.22 * Math.abs(to.x - from.x)
  return {
    from,
    c1: { x: from.x + (to.x - from.x) * 0.12, y: from.y - lift },
    c2: { x: to.x, y: to.y - lift },
    to,
  }
}

export function patternGeometry(beatsPerBar: number): PatternGeometry {
  const beats = Math.min(MAX_BEATS, Math.max(1, Math.round(beatsPerBar)))
  const labelsOnIctus = beats > MAX_BESIDE
  const ictus: Point[] = [DOWNBEAT]
  if (beats >= 3) {
    const between = beats - 2
    const left = Math.floor(between / 2)
    const right = between - left
    for (let j = 1; j <= left; j++) ictus.push(sidePoint(-1, j, left, labelsOnIctus))
    for (let j = 1; j <= right; j++) ictus.push(sidePoint(1, j, right, labelsOnIctus))
  }
  if (beats >= 2) ictus.push(labelsOnIctus ? CROWDED_UPBEAT : UPBEAT)

  const segments =
    beats === 1
      ? [{ from: DOWNBEAT, c1: { x: CENTER + 34, y: TOP_Y - 10 }, c2: { x: CENTER - 34, y: TOP_Y - 10 }, to: DOWNBEAT }]
      : ictus.map((from, k) => {
          const next = (k + 1) % beats
          return segment(from, ictus[next]!, next === 0)
        })

  return { ictus, labelsOnIctus, rest: apex(segments.at(-1)!), segments }
}

/** Highest point of a segment: the baton's raised position before the downbeat. */
function apex(segment: Segment): Point {
  let top = segment.from
  for (let i = 1; i <= 64; i++) {
    const point = pointOnSegment(segment, i / 64)
    if (point.y < top.y) top = point
  }
  return top
}

export function pointOnSegment({ from, c1, c2, to }: Segment, u: number): Point {
  const v = 1 - u
  const a = v * v * v
  const b = 3 * v * v * u
  const c = 3 * v * u * u
  const d = u * u * u
  return {
    x: a * from.x + b * c1.x + c * c2.x + d * to.x,
    y: a * from.y + b * c1.y + c * c2.y + d * to.y,
  }
}

/**
 * Maps time within a beat (0 at one click, 1 at the next) to position along the segment. A baton
 * leaves the ictus fast, slows at the top of its rebound and accelerates into the next ictus:
 * velocity 1 + k·cos(2πt) is high at both ends and low in the middle.
 */
export function batonProgress(t: number): number {
  const time = Math.min(1, Math.max(0, t))
  const k = 0.72
  return time + (k / (2 * Math.PI)) * Math.sin(2 * Math.PI * time)
}

function tangentOnSegment({ from, c1, c2, to }: Segment, u: number): Point {
  const v = 1 - u
  const x = 3 * v * v * (c1.x - from.x) + 6 * v * u * (c2.x - c1.x) + 3 * u * u * (to.x - c2.x)
  const y = 3 * v * v * (c1.y - from.y) + 6 * v * u * (c2.y - c1.y) + 3 * u * u * (to.y - c2.y)
  const length = Math.hypot(x, y)
  if (length > 1e-9) return { x: x / length, y: y / length }
  const dx = to.x - from.x
  const dy = to.y - from.y
  const chord = Math.hypot(dx, dy) || 1
  return { x: dx / chord, y: dy / chord }
}

/**
 * Width of a stroke along its segment, as a pen draws a beat: light through the rebound, pressing
 * down as the baton falls into the next ictus.
 */
export function strokeWidth(u: number, thin: number, heavy: number): number {
  const t = Math.min(1, Math.max(0, (u - 0.3) / 0.7))
  return thin + (heavy - thin) * t * t * (3 - 2 * t)
}

/** Closed outline of one segment's stroke, with round ends, `thin` to `heavy` wide. */
export function strokeOutline(segment: Segment, thin: number, heavy: number, samples = 48): Point[] {
  const left: Point[] = []
  const right: Point[] = []
  for (let i = 0; i <= samples; i++) {
    const u = i / samples
    const p = pointOnSegment(segment, u)
    const t = tangentOnSegment(segment, u)
    const half = strokeWidth(u, thin, heavy) / 2
    left.push({ x: p.x - t.y * half, y: p.y + t.x * half })
    right.push({ x: p.x + t.y * half, y: p.y - t.x * half })
  }
  const cap = (u: number, radius: number, forward: 1 | -1): Point[] => {
    const p = pointOnSegment(segment, u)
    const t = tangentOnSegment(segment, u)
    // From one side round the end to the other: the left side first at the end, the right at the start.
    return Array.from({ length: 7 }, (_, k) => {
      const angle = (Math.PI * (k + 1)) / 8
      const across = Math.cos(angle) * forward
      const along = Math.sin(angle) * forward
      return { x: p.x - t.y * radius * across + t.x * radius * along, y: p.y + t.x * radius * across + t.y * radius * along }
    })
  }
  return [...left, ...cap(1, heavy / 2, 1), ...right.reverse(), ...cap(0, thin / 2, -1)]
}

/** A small arrowhead on the stroke at `u`, pointing the way the baton travels. */
export function arrowhead(segment: Segment, u: number, length: number, halfWidth: number): Point[] {
  const p = pointOnSegment(segment, u)
  const t = tangentOnSegment(segment, u)
  const base = { x: p.x - (t.x * length) / 2, y: p.y - (t.y * length) / 2 }
  return [
    { x: p.x + (t.x * length) / 2, y: p.y + (t.y * length) / 2 },
    { x: base.x - t.y * halfWidth, y: base.y + t.x * halfWidth },
    { x: base.x + t.y * halfWidth, y: base.y - t.x * halfWidth },
  ]
}

function signedArea(points: readonly Point[]): number {
  let area = 0
  points.forEach((p, i) => {
    const q = points[(i + 1) % points.length]!
    area += p.x * q.y - q.x * p.y
  })
  return area / 2
}

/**
 * Path data for filled shapes drawn as one <path>. All are wound the same way, so where they
 * overlap they fill once (a translucent ink stays even) instead of cancelling out.
 */
export function shapesPath(shapes: readonly (readonly Point[])[]): string {
  const p = (point: Point) => `${point.x.toFixed(2)} ${point.y.toFixed(2)}`
  return shapes
    .map((shape) => (signedArea(shape) < 0 ? [...shape].reverse() : shape))
    .map((shape) => `M ${shape.map(p).join(' L ')} Z`)
    .join(' ')
}

/** Something an arrowhead must keep clear of: a capsule from `a` to `b` with radius `r` (a circle when a = b). */
export interface Obstacle {
  a: Point
  b: Point
  r: number
}

function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const length2 = dx * dx + dy * dy
  const t = length2 === 0 ? 0 : Math.min(1, Math.max(0, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length2))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

function segmentsCross(p1: Point, p2: Point, q1: Point, q2: Point): boolean {
  const side = (a: Point, b: Point, c: Point) => Math.sign((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x))
  return side(p1, p2, q1) * side(p1, p2, q2) < 0 && side(q1, q2, p1) * side(q1, q2, p2) < 0
}

function insideTriangle(p: Point, [a, b, c]: readonly Point[]): boolean {
  const cross = (u: Point, v: Point) => (v.x - u.x) * (p.y - u.y) - (v.y - u.y) * (p.x - u.x)
  const d1 = cross(a!, b!)
  const d2 = cross(b!, c!)
  const d3 = cross(c!, a!)
  return (d1 >= 0 && d2 >= 0 && d3 >= 0) || (d1 <= 0 && d2 <= 0 && d3 <= 0)
}

/** True when the triangle keeps at least `r` away from the obstacle's centre line. */
export function triangleClears(triangle: readonly Point[], { a, b, r }: Obstacle): boolean {
  if (insideTriangle(a, triangle) || insideTriangle(b, triangle)) return false
  return triangle.every((p, i) => {
    const q = triangle[(i + 1) % triangle.length]!
    if (segmentsCross(p, q, a, b)) return false
    const gap = Math.min(distanceToSegment(p, a, b), distanceToSegment(q, a, b), distanceToSegment(a, p, q), distanceToSegment(b, p, q))
    return gap >= r
  })
}

/** Position (u) of a segment's highest point: the top of the rebound. */
export function highestU(segment: Segment): number {
  let best = 0
  let top = Infinity
  for (let i = 0; i <= 96; i++) {
    const y = pointOnSegment(segment, i / 96).y
    if (y < top) {
      top = y
      best = i / 96
    }
  }
  return best
}

/**
 * Where on a segment its arrowhead goes: on the fall from the top of the rebound into the ictus,
 * a little past half-way down if that is clear of every obstacle, else the nearest clear spot.
 * Null when there is none: better no arrow than one hidden or misread.
 */
export function arrowPlacement(
  segment: Segment,
  size: (u: number) => { length: number; halfWidth: number },
  obstacles: readonly Obstacle[],
): number | null {
  const top = highestU(segment)
  for (const fraction of [0.55, 0.45, 0.65, 0.35, 0.75, 0.85, 0.25]) {
    const u = top + (1 - top) * fraction
    const { length, halfWidth } = size(u)
    const triangle = arrowhead(segment, u, length, halfWidth)
    // The whole arrow must be on the fall: its back past the top, the stroke heading down.
    const back = { x: (triangle[1]!.x + triangle[2]!.x) / 2, y: (triangle[1]!.y + triangle[2]!.y) / 2 }
    const falling = tangentOnSegment(segment, u).y > 0.25 && back.y > pointOnSegment(segment, top).y + 1
    if (falling && obstacles.every((obstacle) => triangleClears(triangle, obstacle))) return u
  }
  return null
}

/**
 * Pen widths on screen, in px: light through each rebound, pressing into the ictus, heaviest on
 * the fall into the downbeat, as a conducting textbook draws the pattern.
 */
export const PEN = { thin: 1.5, heavy: 3.4, downbeat: 4.8 } as const
/** Length of the printed mark at each ictus, in px: the plane the baton strikes. */
export const ICTUS_MARK = 16
/** How much a numeral grows while its beat is struck (the stylesheet's `.beat.active`). */
export const STRUCK_SCALE = 1.14
/** On-screen clearances (px) an arrowhead keeps: from a mark, a tick, a stroke, and around a struck numeral. */
export const CLEAR = { numeral: 3, mark: 1.5 + 3, tick: 3, stroke: PEN.heavy / 2 + 2 } as const
/** Radius (px) kept clear around the resting baton. */
const BATON_CLEAR = 16 + 3
/** Subdivision tick radius, in drawing units. */
export const TICK_RADIUS = 3.2

/**
 * Diameter of a beat numeral on screen, in px, at `scale` px per drawing unit. A phone's figure
 * (up to 400 px wide) keeps the touch-sized 44 px, 30 px where a crowded bar sets them on the
 * ictus; a larger figure (a tablet on the stand, a desktop) grows them with it, to 56 px and 38 px
 * at its widest (720 px), so they still read from across the room. Even, so they centre on a pixel.
 */
export function numeralSize(scale: number, crowded: boolean): number {
  const [small, large] = crowded ? [30, 38] : [44, 56]
  const grown = small + ((large - small) * (scale - 1)) / (WIDEST_FIGURE / PATTERN_BOX.width - 1)
  return 2 * Math.round(Math.min(large, Math.max(small, grown)) / 2)
}

export interface Mark {
  a: Point
  b: Point
  /** The upbeat's mark runs left from its ictus; its numeral sits beside or below it. */
  upbeat: boolean
}

/** The printed mark at each ictus, at `scale` px per unit. */
function ictusMarks({ ictus, labelsOnIctus }: PatternGeometry, scale: number): Mark[] {
  const upbeat = !labelsOnIctus && ictus.length > 1 ? ictus.length - 1 : -1
  const length = ICTUS_MARK / scale
  return ictus.map((point, beat): Mark =>
    beat === upbeat
      ? { a: { x: point.x - length, y: point.y }, b: point, upbeat: true }
      : { a: { x: point.x - length / 2, y: point.y }, b: { x: point.x + length / 2, y: point.y }, upbeat: false },
  )
}

/**
 * Where each beat's numeral sits when the figure is drawn at `scale` px per unit. In a crowded bar,
 * on its ictus. Otherwise under it: LABEL_GAP units down, but never more than NUMERAL_GAP px clear
 * of the mark, so a large figure keeps each numeral by its beat. The upbeat's ictus hangs among the
 * strokes, so its numeral takes the spot around it that they leave clear (upbeatSpot).
 */
export function numeralPoints(geometry: PatternGeometry, scale: number): Point[] {
  const { ictus, labelsOnIctus } = geometry
  if (labelsOnIctus) return ictus
  const radius = numeralSize(scale, false) / 2
  const reach = Math.min(LABEL_GAP, (radius + NUMERAL_GAP) / scale)
  const points = ictus.map((point) => ({ x: point.x, y: point.y + reach }))
  if (ictus.length > 1) points[ictus.length - 1] = upbeatSpot(geometry, points.slice(0, -1), scale, radius, reach)
  return points
}

/** Where the upbeat's numeral is tried, as angles from "to its right", turning down: the familiar spots first, then all round. */
const UPBEAT_ANGLES = [6, 53, 99, -17, ...Array.from({ length: 24 }, (_, i) => i * 15)]
/** And how far out, as shares of the usual distance: there first, then closer in, then further out, */
const UPBEAT_RINGS = [1, 0.85, 1.25, 1.5, 2]
/** up to this many drawing units from the ictus (the middle of the triangle a bar of three draws). */
const UPBEAT_FARTHEST = LABEL_GAP * 1.5

/**
 * The upbeat's numeral: beside its ictus where no stroke runs under it, so the baton is never lost
 * behind it and it never cuts a stroke. Tries the spots around the ictus and keeps the one the
 * strokes leave clearest, as near as that allows; never on another numeral, a mark or the resting
 * baton. (To the right in 2, below and right in 4, further out inside the triangle of 3.)
 */
function upbeatSpot(geometry: PatternGeometry, others: readonly Point[], scale: number, radius: number, reach: number): Point {
  const { ictus, segments, rest } = geometry
  const up = ictus.at(-1)!
  const unit = (px: number) => px / scale
  const struck = radius * STRUCK_SCALE
  // Clear of every stroke by the struck numeral and the heaviest pen; more than that earns nothing.
  const enough = unit(struck + 3)
  const strokes = segments.flatMap((segment) => Array.from({ length: 97 }, (_, i) => pointOnSegment(segment, i / 96)))
  const marks = ictusMarks(geometry, scale)
  const away = (p: Point, q: Point) => Math.hypot(p.x - q.x, p.y - q.y)

  let best: Point = { x: up.x + reach, y: up.y }
  let bestScore = -Infinity
  const distances = [...UPBEAT_RINGS.map((ring) => ring * reach).filter((distance) => distance < UPBEAT_FARTHEST), UPBEAT_FARTHEST]
  for (const distance of distances) {
    for (const angle of UPBEAT_ANGLES) {
      const turn = (angle * Math.PI) / 180
      const spot = { x: up.x + Math.cos(turn) * distance, y: up.y + Math.sin(turn) * distance }
      const fits =
        spot.x >= unit(radius - 12) &&
        spot.x <= PATTERN_BOX.width - unit(radius - 12) &&
        spot.y >= unit(radius) &&
        spot.y <= PATTERN_BOX.height &&
        others.every((other) => away(spot, other) >= unit(radius + struck + 2)) &&
        marks.every(({ a, b }) => distanceToSegment(spot, a, b) >= unit(struck + 1.5)) &&
        away(spot, rest) >= unit(radius + BATON_CLEAR)
      if (!fits) continue
      const clear = Math.min(...strokes.map((point) => away(spot, point)))
      const further = Math.max(0, distance - reach)
      // The nearest spot that is clear enough; failing that the clearest, where a unit of
      // clearance is worth about three of distance from the ictus.
      const score = clear >= enough ? 1000 - further : clear - 0.35 * further
      if (score > bestScore + 1e-9) {
        best = spot
        bestScore = score
      }
    }
  }
  return best
}

export interface Drawing {
  /** Stroke outlines and arrowheads, to fill as one path. */
  shapes: Point[][]
  marks: Mark[]
  /** How many strokes got an arrowhead. */
  arrows: number
}

/**
 * The pattern as drawn at `scale` screen px per unit, with subdivision ticks at `offsets`: pen
 * strokes, an arrowhead on each fall where one fits, and the ictus marks.
 */
export function drawPattern(geometry: PatternGeometry, scale: number, offsets: readonly number[]): Drawing {
  const unit = (px: number) => px / scale
  const { segments, labelsOnIctus } = geometry
  const heavyOf = (k: number) => (k === segments.length - 1 ? PEN.downbeat : PEN.heavy)
  const shapes = segments.map((segment, k) => strokeOutline(segment, unit(PEN.thin), unit(heavyOf(k))))
  const marks = ictusMarks(geometry, scale)

  // Crowded bars have no room for arrows; the numerals' order carries the direction.
  let arrows = 0
  if (!labelsOnIctus) {
    const struck = (numeralSize(scale, false) / 2) * STRUCK_SCALE
    const around: Obstacle[] = [
      ...numeralPoints(geometry, scale).map((point) => ({ a: point, b: point, r: unit(struck + CLEAR.numeral) })),
      // Struck marks widen by half: a centred mark both ways, the upbeat's to the left.
      ...marks.map(({ a, b, upbeat: one }) => {
        const extra = (b.x - a.x) / (one ? 2 : 4)
        return { a: { x: a.x - extra, y: a.y }, b: { x: b.x + (one ? 0 : extra), y: b.y }, r: unit(CLEAR.mark) }
      }),
      { a: geometry.rest, b: geometry.rest, r: unit(BATON_CLEAR) },
    ]
    segments.forEach((segment, k) => {
      const ticks = offsets.slice(1).map((offset) => {
        const point = pointOnSegment(segment, batonProgress(offset))
        return { a: point, b: point, r: TICK_RADIUS + unit(CLEAR.tick) }
      })
      // Other strokes, except the start of the next one: its rebound rises right beside this fall,
      // and an arrow pointing down cannot be mistaken for it.
      const next = (k + 1) % segments.length
      const strokes = segments.flatMap((other, j) =>
        j === k
          ? []
          : Array.from({ length: 24 }, (_, i) => i)
              .filter((i) => j !== next || i / 24 >= 0.35)
              .map((i) => ({ a: pointOnSegment(other, i / 24), b: pointOnSegment(other, (i + 1) / 24), r: unit(CLEAR.stroke) })),
      )
      const size = (u: number) => {
        const halfWidth = Math.max(4, strokeWidth(u, PEN.thin, heavyOf(k)) * 1.4)
        return { length: unit(Math.max(10, halfWidth * 2.2)), halfWidth: unit(halfWidth) }
      }
      const u = arrowPlacement(segment, size, [...around, ...ticks, ...strokes])
      if (u === null) return
      shapes.push(arrowhead(segment, u, size(u).length, size(u).halfWidth))
      arrows++
    })
  }
  return { shapes, marks, arrows }
}

