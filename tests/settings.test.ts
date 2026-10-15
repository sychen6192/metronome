import { describe, expect, it } from 'vitest'
import {
  STORAGE_KEY,
  defaultSettings,
  loadSettings,
  sanitizeSettings,
  saveSettings,
} from '../src/core/settings'

describe('sanitizeSettings', () => {
  it('returns defaults for garbage', () => {
    expect(sanitizeSettings(null)).toEqual(defaultSettings())
    expect(sanitizeSettings('nope')).toEqual(defaultSettings())
    expect(sanitizeSettings([1, 2])).toEqual(defaultSettings())
  })

  it('clamps numbers and rejects unknown options', () => {
    const settings = sanitizeSettings({
      bpm: 1000,
      beatsPerBar: 40,
      subdivision: 'quintuplet',
      sound: 'kazoo',
      volume: 3,
      trainer: { enabled: 'yes', step: 0, everyBars: 1e6, target: 5 },
    })
    expect(settings).toMatchObject({
      bpm: 300,
      beatsPerBar: 16,
      subdivision: 'quarter',
      sound: 'click',
      volume: 1,
      trainer: { enabled: false, step: 1, everyBars: 64, target: 20 },
    })
  })

  it('accepts a known language preference and defaults to auto', () => {
    expect(sanitizeSettings({ language: 'en' }).language).toBe('en')
    expect(sanitizeSettings({ language: 'zh-Hant' }).language).toBe('zh-Hant')
    expect(sanitizeSettings({ language: 'fr' }).language).toBe('auto')
    expect(sanitizeSettings({}).language).toBe('auto')
  })

  it('keeps the accent pattern in sync with the bar length', () => {
    const settings = sanitizeSettings({ beatsPerBar: 3, accents: ['mute', 'bogus'] })
    expect(settings.accents).toEqual(['mute', 'normal', 'normal'])
  })
})

describe('load/save', () => {
  function memoryStorage() {
    const data = new Map<string, string>()
    return {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => void data.set(key, value),
    }
  }

  it('round-trips settings', () => {
    const storage = memoryStorage()
    const settings = { ...defaultSettings(), bpm: 87, sound: 'wood' as const }
    saveSettings(storage, settings)
    expect(loadSettings(storage)).toEqual(settings)
  })

  it('survives corrupt JSON and throwing storage', () => {
    expect(loadSettings({ getItem: () => '{oops' })).toEqual(defaultSettings())
    expect(
      loadSettings({
        getItem: () => {
          throw new Error('SecurityError')
        },
      }),
    ).toEqual(defaultSettings())
    expect(() =>
      saveSettings(
        {
          setItem: () => {
            throw new Error('QuotaExceededError')
          },
        },
        defaultSettings(),
      ),
    ).not.toThrow()
  })

  it('uses a versioned storage key', () => {
    expect(STORAGE_KEY).toMatch(/v\d+$/)
  })
})
