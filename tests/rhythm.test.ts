import { describe, expect, it } from 'vitest'
import {
  DOWNBEAT,
  SUBDIVISION_OFFSETS,
  cycleAccent,
  defaultAccents,
  nextPulse,
  resizeAccents,
  type Pulse,
} from '../src/core/rhythm'

function walk(steps: number, beatsPerBar: number, offsets: readonly number[]) {
  let pulse: Pulse = DOWNBEAT
  let beats = 0
  const out: Array<{ beat: number; sub: number; at: number }> = [{ beat: 0, sub: 0, at: 0 }]
  for (let i = 0; i < steps; i++) {
    const next = nextPulse(pulse, beatsPerBar, offsets)
    beats += next.beats
    pulse = next.pulse
    out.push({ beat: pulse.beat, sub: pulse.sub, at: beats })
  }
  return out
}

describe('nextPulse', () => {
  it('steps through quarter notes and wraps at the bar line', () => {
    expect(walk(4, 3, SUBDIVISION_OFFSETS.quarter)).toEqual([
      { beat: 0, sub: 0, at: 0 },
      { beat: 1, sub: 0, at: 1 },
      { beat: 2, sub: 0, at: 2 },
      { beat: 0, sub: 0, at: 3 },
      { beat: 1, sub: 0, at: 4 },
    ])
  })

  it('places triplet subdivisions a third of a beat apart', () => {
    const steps = walk(3, 4, SUBDIVISION_OFFSETS.triplet)
    expect(steps.map((s) => s.sub)).toEqual([0, 1, 2, 0])
    expect(steps.map((s) => s.at)).toEqual([0, 1 / 3, 2 / 3, 1].map((v) => expect.closeTo(v, 12)))
  })

  it('plays swing as the first and last note of a triplet', () => {
    const steps = walk(4, 4, SUBDIVISION_OFFSETS.swing)
    expect(steps.map((s) => s.at)).toEqual([0, 2 / 3, 1, 5 / 3, 2].map((v) => expect.closeTo(v, 12)))
  })

  it('keeps time on the beat grid when the subdivision changes mid-beat', () => {
    // Currently on the second sixteenth (0.25); switching to eighths, the next click is at 0.5.
    const from: Pulse = { beat: 1, sub: 1, frac: 0.25 }
    expect(nextPulse(from, 4, SUBDIVISION_OFFSETS.eighth)).toEqual({
      pulse: { beat: 1, sub: 1, frac: 0.5 },
      beats: 0.25,
    })
    // Switching to quarters, the next click is the next beat.
    expect(nextPulse(from, 4, SUBDIVISION_OFFSETS.quarter)).toEqual({
      pulse: { beat: 2, sub: 0, frac: 0 },
      beats: 0.75,
    })
  })

  it('jumps to the downbeat when the bar gets shorter than the current beat', () => {
    expect(nextPulse({ beat: 6, sub: 0, frac: 0 }, 4, SUBDIVISION_OFFSETS.quarter).pulse).toEqual(DOWNBEAT)
  })
})

describe('accents', () => {
  it('cycles accent → normal → mute → accent', () => {
    expect(cycleAccent('accent')).toBe('normal')
    expect(cycleAccent('normal')).toBe('mute')
    expect(cycleAccent('mute')).toBe('accent')
  })

  it('accents only the first beat by default', () => {
    expect(defaultAccents(3)).toEqual(['accent', 'normal', 'normal'])
  })

  it('keeps existing choices when resizing', () => {
    expect(resizeAccents(['accent', 'mute', 'accent'], 5)).toEqual(['accent', 'mute', 'accent', 'normal', 'normal'])
    expect(resizeAccents(['accent', 'mute', 'accent'], 2)).toEqual(['accent', 'mute'])
  })
})
