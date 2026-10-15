export const SUBDIVISIONS = ['quarter', 'eighth', 'triplet', 'sixteenth', 'swing'] as const
export type Subdivision = (typeof SUBDIVISIONS)[number]

/** Where each click falls inside one beat, as a fraction of the beat. */
export const SUBDIVISION_OFFSETS: Record<Subdivision, readonly number[]> = {
  quarter: [0],
  eighth: [0, 1 / 2],
  triplet: [0, 1 / 3, 2 / 3],
  sixteenth: [0, 1 / 4, 2 / 4, 3 / 4],
  // Shuffle feel: the off-beat is the last note of a triplet.
  swing: [0, 2 / 3],
}

export const ACCENTS = ['accent', 'normal', 'mute'] as const
export type Accent = (typeof ACCENTS)[number]

export const MIN_BEATS = 1
export const MAX_BEATS = 16

/** One click position: which beat of the bar, which subdivision, and where in the beat it falls. */
export interface Pulse {
  beat: number
  sub: number
  frac: number
}

export const DOWNBEAT: Pulse = { beat: 0, sub: 0, frac: 0 }

const EPSILON = 1e-9

/**
 * Step from the current pulse to the next one.
 *
 * Returns the gap in beats rather than an absolute time so the caller can advance its clock
 * incrementally. That keeps time monotonic even if the tempo, subdivision or bar length change
 * between two pulses: the next pulse is always the first grid point after the current one.
 */
export function nextPulse(
  current: Pulse,
  beatsPerBar: number,
  offsets: readonly number[],
): { pulse: Pulse; beats: number } {
  const sub = offsets.findIndex((offset) => offset > current.frac + EPSILON)
  if (sub !== -1) {
    const frac = offsets[sub]!
    return { pulse: { beat: current.beat, sub, frac }, beats: frac - current.frac }
  }
  const beat = current.beat + 1 >= beatsPerBar ? 0 : current.beat + 1
  return { pulse: { beat, sub: 0, frac: 0 }, beats: 1 - current.frac }
}

export function cycleAccent(accent: Accent): Accent {
  const index = ACCENTS.indexOf(accent)
  return ACCENTS[(index + 1) % ACCENTS.length]!
}

export function defaultAccents(beatsPerBar: number): Accent[] {
  return Array.from({ length: beatsPerBar }, (_, i) => (i === 0 ? 'accent' : 'normal'))
}

/** Grow or shrink the accent pattern, keeping the user's existing choices. */
export function resizeAccents(accents: readonly Accent[], beatsPerBar: number): Accent[] {
  const defaults = defaultAccents(beatsPerBar)
  return defaults.map((fallback, i) => accents[i] ?? fallback)
}
