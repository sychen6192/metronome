import { describe, expect, it } from 'vitest'
import { renderClicks } from '../src/audio/sounds'
import { SOUNDS } from '../src/core/settings'

/** Just enough of BaseAudioContext for renderClicks to run outside a browser. */
function fakeContext(sampleRate = 48_000) {
  return {
    sampleRate,
    createBuffer: (_channels: number, length: number) => {
      const data = new Float32Array(length)
      return { length, getChannelData: () => data }
    },
  } as unknown as BaseAudioContext
}

describe.each(SOUNDS)('%s sound', (sound) => {
  const clicks = renderClicks(fakeContext(), sound)

  it.each(['accent', 'normal', 'sub'] as const)('%s click is finite, normalised and silent at both ends', (kind) => {
    const data = clicks[kind].getChannelData(0)
    let peak = 0
    for (const sample of data) {
      expect(Number.isFinite(sample)).toBe(true)
      peak = Math.max(peak, Math.abs(sample))
    }
    expect(peak).toBeCloseTo(0.9, 2)
    expect(Math.abs(data[0]!)).toBeLessThan(0.05)
    expect(Math.abs(data.at(-1)!)).toBeLessThan(0.01)
  })

  it('renders different clicks for accent, normal and subdivision', () => {
    const [accent, normal, sub] = [clicks.accent, clicks.normal, clicks.sub].map((b) => b.getChannelData(0))
    expect(accent).not.toEqual(normal)
    expect(normal).not.toEqual(sub)
  })
})
