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
  /** Where each beat's numeral goes: beside its ictus, or on it when the bar is crowded. */
  labels: Point[]
  /** Crowded bars put numerals on the ictus (smaller), so they cannot collide. */
  labelsOnIctus: boolean
  /** Where the baton waits while stopped: raised, ready for the downbeat. */
  rest: Point
  /** segments[k] runs from beat k to the next beat (the last one back to beat 1). */
  segments: Segment[]
}

export const PATTERN_BOX = { width: 400, height: 260 } as const

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
const LABEL_GAP = 34

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

  const labels = ictus.map((point, beat) => {
    if (labelsOnIctus) return point
    // Right of the upbeat (clear of the path); under every other beat.
    if (beat === beats - 1 && beats > 1) return { x: point.x + LABEL_GAP, y: point.y + 4 }
    return { x: point.x, y: point.y + LABEL_GAP }
  })

  return { ictus, labels, labelsOnIctus, rest: apex(segments.at(-1)!), segments }
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
