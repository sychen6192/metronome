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

  it('gives each beat the length it was scheduled with, also across a trainer step', () => {
    const { sequencer } = trainerSetup(60, 2, { enabled: true, step: 60, everyBars: 1, target: 120 })
    sequencer.start(0)
    const beats = sequencer.scheduleUntil(3).filter((click) => click.sub === 0)
    // Beat 2 of the first bar is scheduled at 60 BPM; the trainer jumps to 120 at the bar line
    // while scheduling it, but the downbeat still comes a whole 60 BPM beat later.
    expect(beats.map((b) => [b.time, b.beatLength])).toEqual([
      [0, 1],
      [1, 1],
      [2, 0.5],
      [2.5, 0.5],
    ])
    for (let k = 0; k + 1 < beats.length; k++) expect(beats[k]!.time + beats[k]!.beatLength).toBe(beats[k + 1]!.time)
  })

  it('speed trainer counts bars afresh after being switched off and on', () => {
    const { sequencer, changes, setTrainer } = trainerSetup(60, 1, { enabled: true, step: 5, everyBars: 4, target: 100 })
    sequencer.start(0)
    sequencer.scheduleUntil(2.5) // three bars counted
    setTrainer({ enabled: false })
    sequencer.scheduleUntil(5.5)
    setTrainer({ enabled: true })
    sequencer.scheduleUntil(12.5)
    // Re-enabled before the downbeat at 6 was scheduled, so the bars from 6 on are whole: the step
    // comes after four of them (at 10), not one bar after re-enabling as a stale count would give.
    expect(changes).toEqual([[10, 65]])
  })

  it('speed trainer ignores the partly played bar it was switched on in', () => {
    const { sequencer, changes, setTrainer } = trainerSetup(60, 4, { enabled: false, step: 5, everyBars: 1, target: 100 })
    sequencer.start(0)
    sequencer.scheduleUntil(1.5) // beats 0 and 1 of the first bar
    setTrainer({ enabled: true })
    sequencer.scheduleUntil(8.5)
    // The bar from 0 was partly played without the trainer; the bar from 4 is the first whole one.
    expect(changes).toEqual([[8, 65]])
  })

  it('skipping late clicks does not step the speed trainer', () => {
    const { sequencer, changes } = trainerSetup(120, 4, { enabled: true, step: 5, everyBars: 1, target: 200 })
    sequencer.start(0)
    sequencer.scheduleUntil(0.1)
    sequencer.catchUp(20.002, 0.005) // ten unheard bars
    expect(changes).toEqual([])
    // Still on the original grid and bar position.
    expect(sequencer.scheduleUntil(20.1).map((e) => [e.time, e.level])).toEqual([[20, 'accent']])
  })

  it('speed trainer does nothing when disabled', () => {
    const { sequencer, tempoChanges } = setup({ bpm: 100 })
    sequencer.start(0)
    sequencer.scheduleUntil(60)
    expect(tempoChanges).toEqual([])
  })
})
