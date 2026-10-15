import { describe, expect, it } from 'vitest'
import { PATTERN_BOX, batonProgress, patternGeometry, patternPath, pointOnSegment } from '../src/core/pattern'

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

  it('keeps numerals apart and on screen in the narrowest figure', () => {
    for (let beats = 1; beats <= 16; beats++) {
      const { labels, labelsOnIctus } = patternGeometry(beats)
      // 44 px numerals beside the ictus, 30 px on it in crowded bars; at least 2 px apart.
      const size = labelsOnIctus ? 30 : 44
      for (const label of labels) {
        // Within the side gutter, at least 4 px from the screen edge.
        expect(label.x * SCALE - size / 2).toBeGreaterThanOrEqual(-12)
        expect((PATTERN_BOX.width - label.x) * SCALE - size / 2).toBeGreaterThanOrEqual(-12)
        expect(label.y).toBeLessThanOrEqual(PATTERN_BOX.height)
      }
      for (let i = 0; i < labels.length; i++) {
        for (let j = i + 1; j < labels.length; j++) {
          const distance = Math.hypot(labels[i]!.x - labels[j]!.x, labels[i]!.y - labels[j]!.y) * SCALE
          expect(distance, `${beats} beats: numerals ${i + 1} and ${j + 1}`).toBeGreaterThanOrEqual(size + 2)
        }
      }
    }
  })

  it('gives crowded numerals 44 px wide hit areas that never overlap', () => {
    for (let beats = 9; beats <= 16; beats++) {
      const { labels, labelsOnIctus } = patternGeometry(beats)
      expect(labelsOnIctus).toBe(true)
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
      const { labels } = patternGeometry(beats)
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

  it('serialises a closed path', () => {
    const path = patternPath(patternGeometry(4))
    expect(path.startsWith('M 200.0 212.0')).toBe(true)
    expect(path.match(/C /g)).toHaveLength(4)
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
