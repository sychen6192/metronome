import { describe, expect, it } from 'vitest'
import { Sequencer } from '../src/core/sequencer'
import { defaultSettings, type Settings } from '../src/core/settings'

function setup(overrides: Partial<Settings> = {}) {
  let settings: Settings = { ...defaultSettings(), ...overrides }
  const tempoChanges: number[] = []
  const sequencer = new Sequencer(
    () => settings,
    (bpm) => {
      tempoChanges.push(bpm)
      settings = { ...settings, bpm }
    },
  )
  return {
    sequencer,
    tempoChanges,
    set: (patch: Partial<Settings>) => (settings = { ...settings, ...patch }),
  }
}

describe('Sequencer', () => {
  it('schedules every click inside the lookahead window', () => {
    const { sequencer } = setup({ bpm: 120 })
    sequencer.start(1)
    const events = sequencer.scheduleUntil(3)
    expect(events.map((e) => e.time)).toEqual([1, 1.5, 2, 2.5])
    expect(events.map((e) => e.level)).toEqual(['accent', 'normal', 'normal', 'normal'])
    expect(sequencer.nextClickTime).toBe(3)
  })

  it('does not schedule the same click twice across windows', () => {
    const { sequencer } = setup({ bpm: 120 })
    sequencer.start(0)
    const first = sequencer.scheduleUntil(0.6)
    const second = sequencer.scheduleUntil(1.1)
    expect([...first, ...second].map((e) => e.time)).toEqual([0, 0.5, 1])
  })

  it('marks subdivisions and muted beats', () => {
    const { sequencer } = setup({
      bpm: 60,
      beatsPerBar: 2,
      subdivision: 'eighth',
      accents: ['accent', 'mute'],
    })
    sequencer.start(0)
    expect(sequencer.scheduleUntil(2).map((e) => [e.time, e.beat, e.sub, e.level])).toEqual([
      [0, 0, 0, 'accent'],
      [0.5, 0, 1, 'sub'],
      [1, 1, 0, 'mute'],
      [1.5, 1, 1, 'sub'],
    ])
  })

  it('applies a tempo change from the next click', () => {
    const { sequencer, set } = setup({ bpm: 60 })
    sequencer.start(0)
    sequencer.scheduleUntil(0.5) // click at 0, next at 1
    set({ bpm: 120 })
    // The click at 1 was already computed with the old tempo; after it the gap is 0.5 s.
    expect(sequencer.scheduleUntil(2.1).map((e) => e.time)).toEqual([1, 1.5, 2])
  })

  it('skips ahead instead of bursting after falling behind', () => {
    const { sequencer } = setup({ bpm: 120 })
    sequencer.start(0)
    sequencer.scheduleUntil(0.1)
    sequencer.catchUp(10, 0.05)
    expect(sequencer.scheduleUntil(10.1)).toHaveLength(1)
    expect(sequencer.nextClickTime).toBeCloseTo(10.55)
  })

  it('speed trainer ramps the tempo every N bars until the target', () => {
    const { sequencer, tempoChanges } = setup({
      bpm: 100,
      beatsPerBar: 2,
      trainer: { enabled: true, step: 10, everyBars: 2, target: 125 },
    })
    sequencer.start(0)
    sequencer.scheduleUntil(60)
    expect(tempoChanges).toEqual([110, 120, 125])
  })

  it('speed trainer does nothing when disabled', () => {
    const { sequencer, tempoChanges } = setup({ bpm: 100 })
    sequencer.start(0)
    sequencer.scheduleUntil(60)
    expect(tempoChanges).toEqual([])
  })
})
