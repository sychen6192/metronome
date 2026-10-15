import type { ClickLevel } from '../core/sequencer'
import type { SoundId } from '../core/settings'

export type ClickKind = Exclude<ClickLevel, 'mute'>
export type ClickBuffers = Record<ClickKind, AudioBuffer>

/** A synthesised voice: duration in seconds and a sample function of time and base frequency. */
interface Voice {
  duration: number
  /** Base frequency per click kind; accents are higher so they stand out. */
  pitch: Record<ClickKind, number>
  sample: (t: number, freq: number, noise: () => number) => number
}

const TAU = Math.PI * 2

const sine = (t: number, freq: number) => Math.sin(TAU * freq * t)
/** Band-limited-ish square made from the first odd harmonics, to avoid harsh aliasing. */
const softSquare = (t: number, freq: number) =>
  sine(t, freq) + sine(t, freq * 3) / 3 + sine(t, freq * 5) / 5 + sine(t, freq * 7) / 7
/** 1 ms linear attack avoids a click from the onset itself. */
const attack = (t: number, seconds = 0.001) => Math.min(1, t / seconds)
const decay = (t: number, tau: number) => Math.exp(-t / tau)

const VOICES: Record<SoundId, Voice> = {
  // Classic electronic metronome tick.
  click: {
    duration: 0.06,
    pitch: { accent: 2000, normal: 1500, sub: 1100 },
    sample: (t, f, noise) =>
      attack(t, 0.0005) * (decay(t, 0.009) * (sine(t, f) + 0.3 * sine(t, f * 2)) + decay(t, 0.0015) * 0.4 * noise()),
  },
  // Wood block: inharmonic partials that die away quickly, plus a short noisy strike.
  wood: {
    duration: 0.12,
    pitch: { accent: 1250, normal: 950, sub: 800 },
    sample: (t, f, noise) =>
      attack(t, 0.0005) *
      (decay(t, 0.025) * sine(t, f) + decay(t, 0.012) * 0.5 * sine(t, f * 2.76) + decay(t, 0.002) * 0.5 * noise()),
  },
  // Digital beep with a flat sustain.
  beep: {
    duration: 0.07,
    pitch: { accent: 1760, normal: 880, sub: 660 },
    sample: (t, f) => attack(t, 0.002) * Math.min(1, (0.07 - t) / 0.01) * sine(t, f),
  },
  // TR-808 style cowbell: two detuned square waves with a two-stage decay.
  cowbell: {
    duration: 0.25,
    pitch: { accent: 680, normal: 540, sub: 430 },
    sample: (t, f) =>
      attack(t) *
      (0.6 * decay(t, 0.012) + 0.4 * decay(t, 0.09)) *
      (softSquare(t, f) + softSquare(t, f * 1.4815)) *
      0.5,
  },
}

/** Deterministic noise so every render sounds identical. */
function noiseSource(seed = 0x2f6b4d1): () => number {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x80000000 - 1
  }
}

function render(ctx: BaseAudioContext, voice: Voice, freq: number): AudioBuffer {
  const length = Math.ceil(voice.duration * ctx.sampleRate)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  const noise = noiseSource()

  let peak = 0
  for (let i = 0; i < length; i++) {
    const value = voice.sample(i / ctx.sampleRate, freq, noise)
    data[i] = value
    peak = Math.max(peak, Math.abs(value))
  }
  // Normalise so every voice has the same peak; the engine sets the relative level per kind.
  const gain = peak > 0 ? 0.9 / peak : 0
  // Short fade-out so the buffer never ends on a non-zero sample.
  const fade = Math.min(length, Math.round(ctx.sampleRate * 0.004))
  for (let i = 0; i < length; i++) {
    const tail = length - i <= fade ? (length - i) / fade : 1
    data[i] = data[i]! * gain * tail
  }
  return buffer
}

/**
 * Pre-render every click into an AudioBuffer once. Playing buffers is cheaper and more
 * consistent than building oscillator graphs for every click.
 */
export function renderClicks(ctx: BaseAudioContext, sound: SoundId): ClickBuffers {
  const voice = VOICES[sound]
  return {
    accent: render(ctx, voice, voice.pitch.accent),
    normal: render(ctx, voice, voice.pitch.normal),
    sub: render(ctx, voice, voice.pitch.sub),
  }
}
