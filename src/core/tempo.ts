export const MIN_BPM = 20
export const MAX_BPM = 300
export const DEFAULT_BPM = 120

export function clampBpm(bpm: number): number {
  if (!Number.isFinite(bpm)) return DEFAULT_BPM
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)))
}

/** Seconds per beat. */
export function beatDuration(bpm: number): number {
  return 60 / bpm
}

// Simplified, non-overlapping version of the traditional Italian tempo ranges.
const MARKINGS: ReadonlyArray<readonly [upperExclusive: number, name: string]> = [
  [25, 'Larghissimo'],
  [45, 'Grave'],
  [60, 'Largo'],
  [66, 'Larghetto'],
  [76, 'Adagio'],
  [108, 'Andante'],
  [120, 'Moderato'],
  [156, 'Allegro'],
  [176, 'Vivace'],
  [200, 'Presto'],
  [Infinity, 'Prestissimo'],
]

export function tempoMarking(bpm: number): string {
  for (const [upper, name] of MARKINGS) {
    if (bpm < upper) return name
  }
  return 'Prestissimo'
}

/**
 * Move `bpm` one `step` towards `target` without overshooting.
 * Used by the speed trainer, which can ramp either up or down.
 */
export function rampTempo(bpm: number, target: number, step: number): number {
  const size = Math.abs(step)
  if (bpm < target) return clampBpm(Math.min(target, bpm + size))
  if (bpm > target) return clampBpm(Math.max(target, bpm - size))
  return bpm
}

/**
 * Tap tempo: averages the intervals between the most recent taps.
 * A pause longer than `resetAfterMs` starts a new measurement.
 */
export class TapTempo {
  private taps: number[] = []

  constructor(
    private readonly maxTaps = 6,
    private readonly resetAfterMs = 2000,
  ) {}

  /** Register a tap at `timeMs` (e.g. `event.timeStamp`). Returns the BPM once at least two taps exist. */
  tap(timeMs: number): number | null {
    const last = this.taps.at(-1)
    if (last !== undefined && (timeMs - last > this.resetAfterMs || timeMs <= last)) {
      this.taps = []
    }
    this.taps.push(timeMs)
    if (this.taps.length > this.maxTaps) this.taps.shift()
    if (this.taps.length < 2) return null

    const first = this.taps[0]!
    const average = (timeMs - first) / (this.taps.length - 1)
    return clampBpm(60_000 / average)
  }

  reset(): void {
    this.taps = []
  }
}
