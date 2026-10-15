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

  it('keeps numerals apart and inside the box', () => {
    // At the narrowest figure (~320 px for 400 units) a 44 px numeral needs ~49 units; on-ictus
    // numerals in crowded bars are 30 px (~34 units).
    for (let beats = 1; beats <= 16; beats++) {
      const { labels, labelsOnIctus } = patternGeometry(beats)
      const need = labelsOnIctus ? 34 : 49
      for (const label of labels) {
        expect(label.x).toBeGreaterThanOrEqual(need / 2)
        expect(label.x).toBeLessThanOrEqual(PATTERN_BOX.width - need / 2)
        expect(label.y).toBeLessThanOrEqual(PATTERN_BOX.height)
      }
      for (let i = 0; i < labels.length; i++) {
        for (let j = i + 1; j < labels.length; j++) {
          const distance = Math.hypot(labels[i]!.x - labels[j]!.x, labels[i]!.y - labels[j]!.y)
          expect(distance, `${beats} beats: numerals ${i + 1} and ${j + 1}`).toBeGreaterThanOrEqual(need)
        }
      }
    }
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
    expect(path.startsWith('M 200.0 252.0')).toBe(true)
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
