import { describe, expect, it } from 'vitest'
import { SUBDIVISION_OFFSETS } from '../src/core/rhythm'
import {
  PATTERN_BOX,
  STRUCK_SCALE,
  arrowhead,
  drawPattern,
  triangleClears,
  batonProgress,
  numeralPoints,
  numeralSize,
  patternGeometry,
  pointOnSegment,
  shapesPath,
  strokeOutline,
  strokeWidth,
} from '../src/core/pattern'

describe('patternGeometry', () => {
  it.each(Array.from({ length: 16 }, (_, i) => i + 1))('%i beats: one point and one segment per beat, inside the box', (beats) => {
    const { ictus, segments, rest } = patternGeometry(beats)
    expect(ictus).toHaveLength(beats)
    expect(segments).toHaveLength(beats)
    for (const point of [...ictus, rest]) {
      expect(point.x).toBeGreaterThanOrEqual(0)
      expect(point.x).toBeLessThanOrEqual(PATTERN_BOX.width)
      expect(point.y).toBeGreaterThanOrEqual(0)
      expect(point.y).toBeLessThanOrEqual(PATTERN_BOX.height)
    }
    // Each segment runs from its beat to the next one, the last back to beat 1.
    segments.forEach((segment, k) => {
      expect(segment.from).toBe(ictus[k])
      expect(segment.to).toBe(ictus[(k + 1) % beats])
    })
  })

  it('draws 4/4 as the cross: down, left, right, up', () => {
    const [one, two, three, four] = patternGeometry(4).ictus
    expect(two!.x).toBeLessThan(one!.x)
    expect(three!.x).toBeGreaterThan(one!.x)
    expect(four!.y).toBeLessThan(one!.y)
    expect(one!.y).toBe(Math.max(...[one, two, three, four].map((p) => p!.y)))
  })

  it('draws 3/4 as the triangle: down, right, up', () => {
    const [one, two, three] = patternGeometry(3).ictus
    expect(two!.x).toBeGreaterThan(one!.x)
    expect(three!.y).toBeLessThan(two!.y)
  })

  it('puts beats 2-3 left and 4-5 right in 6', () => {
    const points = patternGeometry(6).ictus
    expect(points[1]!.x).toBeLessThan(200)
    expect(points[2]!.x).toBeLessThan(points[1]!.x)
    expect(points[3]!.x).toBeGreaterThan(200)
    expect(points[4]!.x).toBeGreaterThan(points[3]!.x)
  })

  it('keeps beat points apart so their numerals do not overlap', () => {
    for (let beats = 2; beats <= 16; beats++) {
      const points = patternGeometry(beats).ictus
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const distance = Math.hypot(points[i]!.x - points[j]!.x, points[i]!.y - points[j]!.y)
          expect(distance, `${beats} beats: ${i + 1} vs ${j + 1}`).toBeGreaterThan(24)
        }
      }
    }
  })

  // The narrowest figure: a 320 px screen minus its 16 px gutters.
  const SCALE = 288 / PATTERN_BOX.width

  it('keeps numerals apart and on screen from the narrowest figure to the widest', () => {
    for (const width of [288, 320, 358, 400, 520, 720]) {
      const scale = width / PATTERN_BOX.width
      for (let beats = 1; beats <= 16; beats++) {
        const geometry = patternGeometry(beats)
        const labels = numeralPoints(geometry, scale)
        // 44 px numerals beside the ictus, 30 px on it in crowded bars (more on a large figure); at least 2 px apart.
        const size = numeralSize(scale, geometry.labelsOnIctus)
        for (const label of labels) {
          // Within the side gutter, at least 4 px from the screen edge.
          expect(label.x * scale - size / 2).toBeGreaterThanOrEqual(-12)
          expect((PATTERN_BOX.width - label.x) * scale - size / 2).toBeGreaterThanOrEqual(-12)
          expect(label.y).toBeLessThanOrEqual(PATTERN_BOX.height)
        }
        for (let i = 0; i < labels.length; i++) {
          for (let j = i + 1; j < labels.length; j++) {
            const distance = Math.hypot(labels[i]!.x - labels[j]!.x, labels[i]!.y - labels[j]!.y) * scale
            expect(distance, `${beats} beats at ${width}px: numerals ${i + 1} and ${j + 1}`).toBeGreaterThanOrEqual(size + 2)
          }
        }
      }
    }
  })

  it('gives crowded numerals 44 px wide hit areas that never overlap', () => {
    for (let beats = 9; beats <= 16; beats++) {
      const geometry = patternGeometry(beats)
      const labels = numeralPoints(geometry, SCALE)
      expect(geometry.labelsOnIctus).toBe(true)
      // 30 px numerals whose hit areas reach 44 px wide (30 tall).
      const centres = labels.map((label) => ({ x: label.x * SCALE, y: label.y * SCALE }))
      for (let i = 0; i < centres.length; i++) {
        for (let j = i + 1; j < centres.length; j++) {
          const overlap = Math.abs(centres[i]!.x - centres[j]!.x) < 44 && Math.abs(centres[i]!.y - centres[j]!.y) < 30
          expect(overlap, `${beats} beats: hit areas ${i + 1} and ${j + 1}`).toBe(false)
        }
      }
    }
  })

  it('leaves clear space between crowded numerals, not a chain of touching discs', () => {
    for (let beats = 9; beats <= 16; beats++) {
      const labels = numeralPoints(patternGeometry(beats), SCALE)
      for (let i = 0; i < labels.length; i++) {
        for (let j = i + 1; j < labels.length; j++) {
          const gap = Math.hypot(labels[i]!.x - labels[j]!.x, labels[i]!.y - labels[j]!.y) * SCALE - 30
          expect(gap, `${beats} beats: numerals ${i + 1} and ${j + 1}`).toBeGreaterThanOrEqual(8)
        }
      }
    }
  })

  it('steps side beats up through raised tiers when a side has three or more', () => {
    const heights = (beats: number) => patternGeometry(beats).ictus.map((point) => point.y)
    // 8 beats: 1, then 2-4 left, 5-7 right, 8 the upbeat; the middle beat of each side is raised.
    const eight = heights(8)
    expect(eight[2]).toBeLessThan(eight[1]!)
    expect(eight[3]).toBe(eight[1])
    // 16 beats: seven a side, on three tiers in turn.
    const left = heights(16).slice(1, 8)
    expect(new Set(left).size).toBe(3)
    expect(left[3]).toBe(left[0])
    expect(left[1]).toBeLessThan(left[0]!)
    expect(left[2]).toBeLessThan(left[1]!)
  })

  it('rests the baton at the top of the downbeat loop', () => {
    const { rest, segments } = patternGeometry(4)
    const last = segments[3]!
    for (let u = 0; u <= 1; u += 0.05) expect(pointOnSegment(last, u).y).toBeGreaterThanOrEqual(rest.y - 0.5)
  })

  it('falls into the downbeat vertically', () => {
    const { segments } = patternGeometry(4)
    const last = segments[3]!
    expect(last.c2.x).toBe(last.to.x)
    expect(last.c2.y).toBeLessThan(last.to.y)
  })

})

describe('baton motion', () => {
  it('starts and ends exactly on the beat points', () => {
    const { segments } = patternGeometry(4)
    expect(pointOnSegment(segments[0]!, batonProgress(0))).toEqual(segments[0]!.from)
    const end = pointOnSegment(segments[0]!, batonProgress(1))
    expect(end.x).toBeCloseTo(segments[0]!.to.x)
    expect(end.y).toBeCloseTo(segments[0]!.to.y)
  })

  it('always moves forward, fastest at the beats and slowest mid-way', () => {
    let previous = 0
    for (let t = 0.01; t <= 1; t += 0.01) {
      const u = batonProgress(t)
      expect(u).toBeGreaterThan(previous)
      previous = u
    }
    const speed = (t: number) => (batonProgress(t + 0.001) - batonProgress(t)) / 0.001
    expect(speed(0.01)).toBeGreaterThan(speed(0.5) * 3)
    expect(speed(0.98)).toBeGreaterThan(speed(0.5) * 3)
  })
})

describe('stroke drawing', () => {
  const segment = patternGeometry(4).segments[0]!

  it('is light through the rebound and heaviest arriving at the ictus', () => {
    expect(strokeWidth(0, 1, 4)).toBe(1)
    expect(strokeWidth(0.3, 1, 4)).toBe(1)
    expect(strokeWidth(1, 1, 4)).toBe(4)
    let previous = 0
    for (let u = 0; u <= 1; u += 0.05) {
      const w = strokeWidth(u, 1, 4)
      expect(w).toBeGreaterThanOrEqual(previous)
      previous = w
    }
  })

  it('outlines the stroke at its width on both sides of the path', () => {
    const outline = strokeOutline(segment, 1, 4, 48)
    // 49 points down each side plus 7 per round end.
    expect(outline).toHaveLength(2 * 49 + 14)
    const start = outline[0]!
    const end = outline[48]!
    expect(Math.hypot(start.x - segment.from.x, start.y - segment.from.y)).toBeCloseTo(0.5)
    expect(Math.hypot(end.x - segment.to.x, end.y - segment.to.y)).toBeCloseTo(2)
  })

  it('points arrowheads the way the baton travels', () => {
    const [tip, a, b] = arrowhead(segment, 0.8, 10, 4)
    const at = pointOnSegment(segment, 0.8)
    const ahead = pointOnSegment(segment, 0.82)
    const base = { x: (a!.x + b!.x) / 2, y: (a!.y + b!.y) / 2 }
    // Tip and base straddle the point, the tip on the side the path continues to.
    expect(Math.hypot(tip!.x - ahead.x, tip!.y - ahead.y)).toBeLessThan(Math.hypot(base.x - ahead.x, base.y - ahead.y))
    expect(Math.hypot(tip!.x - base.x, tip!.y - base.y)).toBeCloseTo(10)
    expect(Math.hypot((tip!.x + base.x) / 2 - at.x, (tip!.y + base.y) / 2 - at.y)).toBeCloseTo(0)
  })

  it('winds every shape the same way, so overlaps fill once', () => {
    const area = (path: string) => {
      const points = path.replace(/[MZ]/g, '').split('L').map((pair) => pair.trim().split(' ').map(Number))
      let sum = 0
      points.forEach(([x, y], i) => {
        const [nx, ny] = points[(i + 1) % points.length]!
        sum += x! * ny! - nx! * y!
      })
      return sum
    }
    const square = [{ x: 0, y: 0 }, { x: 0, y: 10 }, { x: 10, y: 10 }, { x: 10, y: 0 }]
    const [one, two] = shapesPath([square, [...square].reverse()]).split(' M ')
    expect(Math.sign(area(one!))).toBe(Math.sign(area(`M ${two}`)))
  })
})

describe('numeralSize', () => {
  const at = (width: number, crowded = false) => numeralSize(width / PATTERN_BOX.width, crowded)

  it('keeps the touch-sized numerals on a phone', () => {
    for (const width of [288, 320, 358, 400]) {
      expect(at(width)).toBe(44)
      expect(at(width, true)).toBe(30)
    }
  })

  it('grows them with a larger figure, up to its widest', () => {
    expect(at(560)).toBe(50)
    expect(at(720)).toBe(56)
    expect(at(1000)).toBe(56)
    expect(at(560, true)).toBe(34)
    expect(at(720, true)).toBe(38)
  })

  it('never shrinks as the figure widens, and stays a whole even number of px', () => {
    let previous = 0
    for (let width = 280; width <= 760; width += 4) {
      for (const crowded of [false, true]) expect(at(width, crowded) % 2).toBe(0)
      expect(at(width)).toBeGreaterThanOrEqual(previous)
      previous = at(width)
    }
  })

  it('takes a smaller share of a larger figure, so nothing drawn for a phone can collide', () => {
    // In drawing units a numeral is largest in the narrowest figure, where the geometry is tested.
    const share = (width: number, crowded: boolean) => at(width, crowded) / (width / PATTERN_BOX.width)
    for (const crowded of [false, true]) {
      for (let width = 292; width <= 720; width += 4) {
        expect(share(width, crowded), `${width}px`).toBeLessThanOrEqual(share(288, crowded))
      }
    }
  })
})

describe('numeralPoints', () => {
  const strokesOf = (beats: number) =>
    patternGeometry(beats).segments.flatMap((segment) => Array.from({ length: 241 }, (_, i) => pointOnSegment(segment, i / 240)))
  const clearance = (point: { x: number; y: number }, strokes: { x: number; y: number }[]) =>
    Math.min(...strokes.map((q) => Math.hypot(q.x - point.x, q.y - point.y)))

  it('sets every numeral but the upbeat under its ictus, close by on a large figure', () => {
    for (const [width, gap] of [[288, 5], [358, 12], [400, 14], [720, 14]] as const) {
      const scale = width / PATTERN_BOX.width
      for (let beats = 1; beats <= 8; beats++) {
        const geometry = patternGeometry(beats)
        const radius = numeralSize(scale, false) / 2
        numeralPoints(geometry, scale).forEach((label, beat) => {
          if (beats > 1 && beat === beats - 1) return
          expect(label.x).toBe(geometry.ictus[beat]!.x)
          // From the mark to the numeral's edge, on screen.
          expect((label.y - geometry.ictus[beat]!.y) * scale - radius, `${beats} beats at ${width}px`).toBeCloseTo(gap, 0)
        })
      }
    }
  })

  it('keeps the strokes out from under every numeral, so the baton never runs behind one', () => {
    // From a 340 px figure (a 372 px screen) no stroke passes under a numeral; before, the upbeat's
    // sat on the first stroke of 3/4 and the baton vanished behind it.
    for (const width of [340, 358, 400, 520, 720]) {
      const scale = width / PATTERN_BOX.width
      for (let beats = 2; beats <= 8; beats++) {
        const strokes = strokesOf(beats)
        const radius = numeralSize(scale, false) / 2 / scale
        numeralPoints(patternGeometry(beats), scale).forEach((label, beat) => {
          // A stroke may graze the ring by a couple of px in the busiest bars, never reach the digit.
          expect(clearance(label, strokes) - radius, `${beats} beats at ${width}px: numeral ${beat + 1}`).toBeGreaterThanOrEqual(-2 / scale)
        })
      }
    }
  })

  it('still keeps the common metres clear in the narrowest figure', () => {
    const scale = 288 / PATTERN_BOX.width
    for (const beats of [2, 3, 4]) {
      const strokes = strokesOf(beats)
      for (const label of numeralPoints(patternGeometry(beats), scale)) {
        expect(clearance(label, strokes), `${beats} beats`).toBeGreaterThanOrEqual(numeralSize(scale, false) / 2 / scale)
      }
    }
  })

  it('keeps the upbeat numeral by its ictus', () => {
    for (const width of [288, 358, 520, 720]) {
      const scale = width / PATTERN_BOX.width
      for (let beats = 2; beats <= 8; beats++) {
        const geometry = patternGeometry(beats)
        const label = numeralPoints(geometry, scale).at(-1)!
        const ictus = geometry.ictus.at(-1)!
        // At most as far as the middle of the triangle a bar of three draws.
        expect(Math.hypot(label.x - ictus.x, label.y - ictus.y), `${beats} beats at ${width}px`).toBeLessThanOrEqual(38 * 1.5 + 1e-6)
      }
    }
  })

  it('sets crowded numerals on their ictus', () => {
    const geometry = patternGeometry(12)
    expect(numeralPoints(geometry, 1)).toEqual(geometry.ictus)
  })
})

describe('drawn pattern', () => {
  const WIDTHS = [288, 358, 520, 720]
  /** Radius of a numeral while its beat is struck, at a figure width. */
  const struckNumeral = (scale: number) => (numeralSize(scale, false) / 2) * STRUCK_SCALE

  it('keeps every arrowhead clear of the numerals, the struck marks and the ticks, and pointing down its fall', () => {
    for (const width of WIDTHS) {
      const scale = width / PATTERN_BOX.width
      for (let beats = 1; beats <= 16; beats++) {
        const geometry = patternGeometry(beats)
        for (const offsets of Object.values(SUBDIVISION_OFFSETS)) {
          const { shapes, marks, arrows } = drawPattern(geometry, scale, offsets)
          const heads = shapes.slice(geometry.segments.length)
          expect(heads).toHaveLength(arrows)
          if (geometry.labelsOnIctus) expect(arrows).toBe(0)
          for (const head of heads) {
            const where = `${beats} beats at ${width}px`
            for (const label of numeralPoints(geometry, scale)) {
              expect(triangleClears(head, { a: label, b: label, r: (struckNumeral(scale) + 1) / scale }), where).toBe(true)
            }
            for (const { a, b } of marks) {
              expect(triangleClears(head, { a, b, r: 1.5 / scale }), where).toBe(true)
            }
            // Tip below the middle of the base: the arrow points down the fall.
            const [tip, left, right] = head
            expect(tip!.y, where).toBeGreaterThan((left!.y + right!.y) / 2)
          }
        }
      }
    }
  })

  it('gives every stroke an arrowhead once the figure is wide enough, beside its larger numerals too', () => {
    for (const width of [520, 620, 720]) {
      for (let beats = 1; beats <= 8; beats++) {
        for (const offsets of Object.values(SUBDIVISION_OFFSETS)) {
          expect(drawPattern(patternGeometry(beats), width / PATTERN_BOX.width, offsets).arrows, `${beats} beats at ${width}px`).toBe(beats)
        }
      }
    }
  })

  it('keeps the ictus marks clear of their numerals, also when both are struck', () => {
    for (const width of WIDTHS) {
      const scale = width / PATTERN_BOX.width
      for (let beats = 2; beats <= 8; beats++) {
        const geometry = patternGeometry(beats)
        const { marks } = drawPattern(geometry, scale, [0])
        const labels = numeralPoints(geometry, scale)
        marks.forEach((mark, beat) => {
          const label = labels[beat]!
          const ictus = geometry.ictus[beat]!
          const where = `${beats} beats at ${width}px`
          if (mark.upbeat) {
            // Runs left from the ictus; its numeral sits clear of it, wherever the strokes left room.
            expect(mark.b.x).toBe(ictus.x)
            expect(mark.a.x).toBeLessThan(ictus.x)
            const gap = Math.min(...[0, 0.25, 0.5, 0.75, 1].map((t) => Math.hypot(label.x - (mark.a.x + (mark.b.x - mark.a.x) * t), label.y - mark.a.y)))
            expect(gap * scale - struckNumeral(scale), where).toBeGreaterThanOrEqual(1.5)
          } else {
            expect((mark.a.x + mark.b.x) / 2).toBeCloseTo(ictus.x)
            expect((label.y - ictus.y) * scale - struckNumeral(scale), where).toBeGreaterThanOrEqual(1.5)
          }
        })
      }
    }
  })
})
