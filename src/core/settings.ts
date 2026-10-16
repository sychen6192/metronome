import {
  ACCENTS,
  MAX_BEATS,
  MIN_BEATS,
  SUBDIVISIONS,
  defaultAccents,
  resizeAccents,
  type Accent,
  type Subdivision,
} from './rhythm'
import { DEFAULT_BPM, clampBpm } from './tempo'

export const SOUNDS = ['click', 'wood', 'beep', 'cowbell'] as const
export type SoundId = (typeof SOUNDS)[number]

/** Interface language; "auto" shows each page (URL) in its own language until the user picks one. */
export const LANGUAGE_PREFERENCES = ['auto', 'zh-Hant', 'en'] as const
export type LanguagePreference = (typeof LANGUAGE_PREFERENCES)[number]

export interface TrainerSettings {
  enabled: boolean
  /** BPM added (or removed) each time the trainer steps. */
  step: number
  /** Number of bars between steps. */
  everyBars: number
  /** Tempo at which the trainer stops changing the tempo. */
  target: number
}

export interface Settings {
  bpm: number
  beatsPerBar: number
  subdivision: Subdivision
  accents: Accent[]
  sound: SoundId
  /** Master volume, 0–1. */
  volume: number
  trainer: TrainerSettings
  language: LanguagePreference
}

export const STORAGE_KEY = 'metronome:settings:v1'

export function defaultSettings(): Settings {
  return {
    bpm: DEFAULT_BPM,
    beatsPerBar: 4,
    subdivision: 'quarter',
    accents: defaultAccents(4),
    sound: 'click',
    volume: 0.8,
    trainer: { enabled: false, step: 5, everyBars: 4, target: 160 },
    language: 'auto',
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function oneOf<T extends string>(options: readonly T[], value: unknown, fallback: T): T {
  return options.includes(value as T) ? (value as T) : fallback
}

function integer(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, Math.round(value)))
}

/** Turn anything (e.g. JSON from localStorage written by an older version) into valid settings. */
export function sanitizeSettings(raw: unknown): Settings {
  const defaults = defaultSettings()
  if (!isRecord(raw)) return defaults

  const beatsPerBar = integer(raw.beatsPerBar, MIN_BEATS, MAX_BEATS, defaults.beatsPerBar)
  const accents = Array.isArray(raw.accents)
    ? resizeAccents(
        raw.accents.map((accent) => oneOf(ACCENTS, accent, 'normal')),
        beatsPerBar,
      )
    : defaultAccents(beatsPerBar)
  const volume =
    typeof raw.volume === 'number' && Number.isFinite(raw.volume)
      ? Math.min(1, Math.max(0, raw.volume))
      : defaults.volume
  const trainer = isRecord(raw.trainer) ? raw.trainer : {}

  return {
    bpm: typeof raw.bpm === 'number' ? clampBpm(raw.bpm) : defaults.bpm,
    beatsPerBar,
    subdivision: oneOf(SUBDIVISIONS, raw.subdivision, defaults.subdivision),
    accents,
    sound: oneOf(SOUNDS, raw.sound, defaults.sound),
    volume,
    trainer: {
      enabled: trainer.enabled === true,
      step: integer(trainer.step, 1, 50, defaults.trainer.step),
      everyBars: integer(trainer.everyBars, 1, 64, defaults.trainer.everyBars),
      target:
        typeof trainer.target === 'number' ? clampBpm(trainer.target) : defaults.trainer.target,
    },
    language: oneOf(LANGUAGE_PREFERENCES, raw.language, defaults.language),
  }
}

/** Storage can throw (Safari private mode, disabled cookies), so failures fall back to defaults. */
export function loadSettings(storage: Pick<Storage, 'getItem'> | undefined): Settings {
  try {
    const json = storage?.getItem(STORAGE_KEY)
    return sanitizeSettings(json ? JSON.parse(json) : null)
  } catch {
    return defaultSettings()
  }
}

export function saveSettings(storage: Pick<Storage, 'setItem'> | undefined, settings: Settings): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Quota exceeded or storage disabled: settings simply won't persist.
  }
}
