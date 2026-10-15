/**
 * Geometry of a conductor's beat pattern, as drawn in conducting textbooks: the downbeat falls
 * straight to the bottom, the last beat rises (the upbeat), and the beats between move inwards
 * then outwards along the plane of beating. 3 beats give the triangle, 4 the cross, 6 the
 * German six. Coordinates are in a fixed 400 x 300 box.
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

export const PATTERN_BOX = { width: 400, height: 300 } as const

const CENTER = PATTERN_BOX.width / 2
const DOWNBEAT: Point = { x: CENTER, y: 252 }
const UPBEAT: Point = { x: CENTER + 34, y: 170 }
const PLANE_Y = 226
const TOP_Y = 34
const MAX_BEATS = 16
/** Up to this many beats, numerals sit beside their ictus; more and they sit on it. */
const MAX_BESIDE = 8
const LABEL_GAP = 34

/** Horizontal distance from the centre of the j-th of `count` side beats (1-based). */
function sideOffset(j: number, count: number): number {
  if (count === 1) return 122
  const inner = 62
  // Crowded sides (on-ictus numerals) may use the full width.
  const outer = count > 3 ? 182 : 172
  return inner + ((outer - inner) * (j - 1)) / (count - 1)
}

function sidePoint(direction: -1 | 1, j: number, count: number): Point {
  // Crowded sides stagger alternate beats upwards so their numerals don't collide.
  const stagger = count > 3 && j % 2 === 0 ? 30 : 0
  return { x: CENTER + direction * sideOffset(j, count), y: PLANE_Y - stagger }
}

function segment(from: Point, to: Point, isDownbeat: boolean): Segment {
  if (isDownbeat) {
    // Rebound up from the last beat, then the long vertical fall into beat 1.
    return {
      from,
      c1: { x: from.x + 18, y: Math.min(from.y - 110, 70) },
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
  const ictus: Point[] = [DOWNBEAT]
  if (beats >= 3) {
    const between = beats - 2
    const left = Math.floor(between / 2)
    const right = between - left
    for (let j = 1; j <= left; j++) ictus.push(sidePoint(-1, j, left))
    for (let j = 1; j <= right; j++) ictus.push(sidePoint(1, j, right))
  }
  if (beats >= 2) ictus.push(UPBEAT)

  const segments =
    beats === 1
      ? [{ from: DOWNBEAT, c1: { x: CENTER + 34, y: TOP_Y - 10 }, c2: { x: CENTER - 34, y: TOP_Y - 10 }, to: DOWNBEAT }]
      : ictus.map((from, k) => {
          const next = (k + 1) % beats
          return segment(from, ictus[next]!, next === 0)
        })

  const labelsOnIctus = beats > MAX_BESIDE
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

/** Path data for the whole pattern, for an SVG <path>. */
export function patternPath(geometry: PatternGeometry): string {
  const p = (point: Point) => `${point.x.toFixed(1)} ${point.y.toFixed(1)}`
  const start = geometry.segments[0]!.from
  return [
    `M ${p(start)}`,
    ...geometry.segments.map(({ c1, c2, to }) => `C ${p(c1)}, ${p(c2)}, ${p(to)}`),
  ].join(' ')
}
