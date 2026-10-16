import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { messagesFor } from '../src/i18n'

const root = fileURLToPath(new URL('..', import.meta.url))

/** The characters the interface font covers: the same ranges as SANS_RANGES in scripts/build-fonts.py. */
const SANS_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0x20, 0x7e], // printable ASCII
  [0xa0, 0xff], // Latin-1
  [0x2000, 0x206f], // general punctuation
  [0x2190, 0x21ff], // arrows
  [0x3000, 0x303f], // CJK punctuation
  [0x3400, 0x9fff], // ideographs
  [0xff00, 0xffef], // full-width forms
]

/** Left to the next font in the stack (SANS_SKIP): the font's ± is full-width only. */
const SKIP = '±'

const inSans = (char: string) => {
  const code = char.codePointAt(0) ?? 0
  return !SKIP.includes(char) && SANS_RANGES.some(([low, high]) => code >= low && code <= high)
}

/** Where the interface's text lives: index.html and the TypeScript sources. */
function interfaceSources(): string[] {
  const typescript = readdirSync(join(root, 'src'), { recursive: true, encoding: 'utf8' })
    .filter((entry) => entry.endsWith('.ts'))
    .map((entry) => join(root, 'src', entry))
  return [join(root, 'index.html'), ...typescript]
}

describe('interface font subset', () => {
  const subset = new Set(readFileSync(join(root, 'src/fonts/metronome-sans-tc.txt'), 'utf8').replace(/\n$/, ''))

  it('has every character the interface can show', () => {
    const missing = new Set<string>()
    for (const file of interfaceSources()) {
      for (const char of readFileSync(file, 'utf8')) {
        if (inSans(char) && !subset.has(char)) missing.add(char)
      }
    }
    expect([...missing].join(''), 'new characters: re-run scripts/build-fonts.py --sans').toBe('')
  })

  it('keeps all of printable ASCII', () => {
    for (let code = 0x20; code <= 0x7e; code++) expect(subset.has(String.fromCharCode(code))).toBe(true)
  })
})

describe('score-voice Chinese font', () => {
  it('covers the Chinese the page sets in the score voice: the app name and the guide heading', () => {
    // metronome-wordmark.woff2 holds exactly the glyphs its @font-face unicode-range lists.
    const css = readFileSync(join(root, 'src/style.css'), 'utf8')
    const rule = /@font-face\s*{[^}]*'Metronome Wordmark'[^}]*}/.exec(css)?.[0] ?? ''
    const range = /unicode-range:([^;]+);/.exec(rule)?.[1] ?? ''
    const covered = new Set(range.split(',').map((code) => String.fromCodePoint(parseInt(code.trim().slice(2), 16))))
    const { appTitle, guideTitle } = messagesFor('zh-Hant')
    const missing = [...appTitle + guideTitle].filter((char) => !covered.has(char))
    expect(missing.join(''), 'add them to WORDMARK_TEXT, re-run scripts/build-fonts.py --serif, update unicode-range').toBe('')
  })
})
