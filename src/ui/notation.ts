import type { Subdivision } from '../core/rhythm'

// Tiny inline-SVG note glyphs for the subdivision picker. Unicode music symbols (♩ ♫ ♬) render
// inconsistently across platforms, so the notes are drawn instead.

const HEAD_Y = 28
const STEM_TOP = 11
const STEM_W = 1.5

const head = (x: number) =>
  `<ellipse cx="${x}" cy="${HEAD_Y}" rx="3.7" ry="2.7" transform="rotate(-20 ${x} ${HEAD_Y})"/>`
const stemX = (x: number) => x + 2.3
const stem = (x: number) =>
  `<rect x="${stemX(x)}" y="${STEM_TOP}" width="${STEM_W}" height="${HEAD_Y - STEM_TOP}"/>`
const beam = (from: number, to: number, y: number) =>
  `<rect x="${stemX(from)}" y="${y}" width="${stemX(to) - stemX(from) + STEM_W}" height="2.6"/>`
const flag = (x: number) =>
  `<path d="M${stemX(x) + STEM_W} ${STEM_TOP} c0 4 6 5 4.5 11" fill="none" stroke="currentColor" stroke-width="1.5"/>`
const tuplet = (label: string) =>
  `<text x="22" y="7" text-anchor="middle" font-size="8" font-weight="700" font-family="system-ui, sans-serif">${label}</text>`

function beamed(xs: readonly number[], beams: number): string {
  const first = xs[0]!
  const last = xs.at(-1)!
  return [
    ...xs.map(head),
    ...xs.map(stem),
    ...Array.from({ length: beams }, (_, i) => beam(first, last, STEM_TOP + i * 4.2)),
  ].join('')
}

const GLYPHS: Record<Subdivision, string> = {
  quarter: head(20) + stem(20),
  eighth: beamed([12, 28], 1),
  triplet: tuplet('3') + beamed([7, 20, 33], 1),
  sixteenth: beamed([4, 14.5, 25, 35.5], 2),
  // Quarter + eighth under a triplet: the swung pair.
  swing: tuplet('3') + head(10) + stem(10) + head(29) + stem(29) + flag(29),
}

export function subdivisionIcon(subdivision: Subdivision): string {
  return `<svg viewBox="0 0 44 34" width="44" height="34" fill="currentColor" aria-hidden="true">${GLYPHS[subdivision]}</svg>`
}
