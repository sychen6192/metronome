import { describe, expect, it } from 'vitest'
import { MAX_BPM, MIN_BPM, TapTempo, clampBpm, rampTempo, tempoMarking } from '../src/core/tempo'

describe('clampBpm', () => {
  it('rounds and clamps to the supported range', () => {
    expect(clampBpm(119.6)).toBe(120)
    expect(clampBpm(5)).toBe(MIN_BPM)
    expect(clampBpm(999)).toBe(MAX_BPM)
    expect(clampBpm(Number.NaN)).toBe(120)
  })
})

describe('tempoMarking', () => {
  it.each([
    [20, 'Larghissimo'],
    [50, 'Largo'],
    [72, 'Adagio'],
    [100, 'Andante'],
    [120, 'Allegro'],
    [168, 'Vivace'],
    [190, 'Presto'],
    [240, 'Prestissimo'],
  ])('%i BPM is %s', (bpm, name) => {
    expect(tempoMarking(bpm)).toBe(name)
  })
})

describe('rampTempo', () => {
  it('moves towards the target without overshooting', () => {
    expect(rampTempo(100, 120, 5)).toBe(105)
    expect(rampTempo(118, 120, 5)).toBe(120)
    expect(rampTempo(120, 120, 5)).toBe(120)
  })

  it('can ramp down', () => {
    expect(rampTempo(140, 120, 5)).toBe(135)
    expect(rampTempo(122, 120, 5)).toBe(120)
  })
})

describe('TapTempo', () => {
  it('needs two taps before reporting a tempo', () => {
    const tapper = new TapTempo()
    expect(tapper.tap(1000)).toBeNull()
    expect(tapper.tap(1500)).toBe(120)
  })

  it('averages the recent intervals', () => {
    const tapper = new TapTempo()
    // Intervals 500, 520, 480 ms → average 500 ms → 120 BPM.
    for (const time of [0, 500, 1020]) tapper.tap(time)
    expect(tapper.tap(1500)).toBe(120)
  })

  it('only uses the most recent taps', () => {
    const tapper = new TapTempo(3)
    for (const time of [0, 1000, 1500]) tapper.tap(time)
    // Window is now [1000, 1500, 2000]: 500 ms intervals.
    expect(tapper.tap(2000)).toBe(120)
  })

  it('can measure the slowest tempo, 20 BPM', () => {
    const tapper = new TapTempo()
    tapper.tap(0)
    expect(tapper.tap(3000)).toBe(20)
  })

  it('starts over when the player switches to a very different tempo', () => {
    const tapper = new TapTempo()
    for (const time of [0, 500, 1000]) tapper.tap(time)
    // 200 ms is less than half the 500 ms average: measure from the previous tap only.
    expect(tapper.tap(1200)).toBe(300)
  })

  it('starts over after a pause longer than the slowest beat', () => {
    const tapper = new TapTempo()
    tapper.tap(0)
    tapper.tap(1000)
    expect(tapper.tap(5000)).toBeNull()
  })

  it('starts over after a long pause', () => {
    const tapper = new TapTempo(6, 2000)
    tapper.tap(0)
    tapper.tap(1000)
    expect(tapper.tap(5000)).toBeNull()
    expect(tapper.tap(5250)).toBe(240)
  })
})
