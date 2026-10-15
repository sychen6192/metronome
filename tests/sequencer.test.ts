import { describe, expect, it } from 'vitest'
import { Sequencer } from '../src/core/sequencer'
import { defaultSettings, type Settings, type TrainerSettings } from '../src/core/settings'

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

  it('skips missed clicks after falling far behind, staying on the beat grid', () => {
    const { sequencer } = setup({ bpm: 120 })
    sequencer.start(0)
    sequencer.scheduleUntil(0.1) // next click due at 0.5
    sequencer.catchUp(10.02, 0.05)
    // No burst of the ~19 missed clicks: only the one 20 ms late remains, on the original
    // 0.5 s grid, and the bar position is intact (beat 20 of a 4/4 bar is a downbeat).
    expect(sequencer.scheduleUntil(10.12).map((e) => [e.time, e.beat, e.level])).toEqual([[10, 0, 'accent']])
    expect(sequencer.nextClickTime).toBe(10.5)
  })

  it('leaves a slightly late click alone', () => {
    const { sequencer } = setup({ bpm: 120 })
    sequencer.start(0)
    sequencer.scheduleUntil(0.1)
    sequencer.catchUp(0.52, 0.05)
    expect(sequencer.nextClickTime).toBe(0.5)
  })

  /** Sequencer whose trainer changes are recorded as [time of the bar they start, new bpm]. */
  function trainerSetup(bpm: number, beatsPerBar: number, trainer: TrainerSettings) {
    let settings: Settings = { ...defaultSettings(), bpm, beatsPerBar, trainer }
    const changes: Array<[number, number]> = []
    const sequencer: Sequencer = new Sequencer(
      () => settings,
      (next) => {
        changes.push([sequencer.nextClickTime, next])
        settings = { ...settings, bpm: next }
      },
    )
    const setTrainer = (patch: Partial<TrainerSettings>) =>
      (settings = { ...settings, trainer: { ...settings.trainer, ...patch } })
    return { sequencer, changes, setTrainer }
  }

  it('speed trainer ramps the tempo every N bars until the target', () => {
    const { sequencer, changes } = trainerSetup(100, 2, { enabled: true, step: 10, everyBars: 2, target: 125 })
    sequencer.start(0)
    sequencer.scheduleUntil(20)
    // Two bars of 2 beats at 100 BPM = 2.4 s; then two bars at 110 and at 120 BPM.
    expect(changes.map(([, bpm]) => bpm)).toEqual([110, 120, 125])
    const times = changes.map(([time]) => time)
    expect(times[0]).toBeCloseTo(2.4, 9)
    expect(times[1]).toBeCloseTo(2.4 + (4 * 60) / 110, 9)
    expect(times[2]).toBeCloseTo(2.4 + (4 * 60) / 110 + (4 * 60) / 120, 9)
  })

  it('speed trainer counts bars afresh after being switched off and on', () => {
    const { sequencer, changes, setTrainer } = trainerSetup(60, 1, { enabled: true, step: 5, everyBars: 4, target: 100 })
    sequencer.start(0)
    sequencer.scheduleUntil(2.5) // three bars counted
    setTrainer({ enabled: false })
    sequencer.scheduleUntil(5.5)
    setTrainer({ enabled: true })
    sequencer.scheduleUntil(12.5)
    // Re-enabled while the bar starting at 6 was already scheduled: it doesn't count, and the
    // step comes after four whole bars (at 11), not one bar later as a stale count would give.
    expect(changes).toEqual([[11, 65]])
  })

  it('speed trainer does nothing when disabled', () => {
    const { sequencer, tempoChanges } = setup({ bpm: 100 })
    sequencer.start(0)
    sequencer.scheduleUntil(60)
    expect(tempoChanges).toEqual([])
  })
})
