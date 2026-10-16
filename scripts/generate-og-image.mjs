// Renders public/og-image.png, the 1200 x 630 link-preview image (Open Graph and X cards), from
// the running app: the wordmark, the tempo mark and the conductor's beat pattern on the slate
// ground, the way the app draws them. One image serves both language pages, so it carries no
// sentences, only the bilingual name.
//
// Usage: npm run build && npm run preview, then in another terminal
//   node scripts/generate-og-image.mjs [app URL, default http://localhost:4173/]
// Needs Playwright with Chromium: npm install --no-save playwright && npx playwright install chromium

import { statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = fileURLToPath(new URL('..', import.meta.url))
const OUT = `${root}public/og-image.png`
const WIDTH = 1200
const HEIGHT = 630
const url = process.argv[2] ?? 'http://localhost:4173/'

let chromium
try {
  ;({ chromium } = await import('playwright'))
} catch {
  console.error('Needs Playwright: npm install --no-save playwright && npx playwright install chromium')
  process.exit(1)
}

// Link previews show the card about 500 px wide, where the app's own pen widths would vanish, so
// the card is laid out at 1/SCALE size and enlarged: strokes come out SCALE times as heavy.
// Sizes below are in final-image pixels.
const SCALE = 1.5
const px = (size) => `${size / SCALE}px`
const CARD_CSS = `
  .app, .toast { display: none !important; }
  .og {
    box-sizing: border-box;
    width: ${px(WIDTH)};
    height: ${px(HEIGHT)};
    display: grid;
    grid-template-columns: ${px(400)} 1fr;
    align-items: center;
    gap: ${px(32)};
    padding: ${px(48)} ${px(40)} ${px(40)} ${px(80)};
    background: var(--ground);
    color: var(--ink);
  }
  .og-text { display: grid; gap: ${px(60)}; justify-items: start; }
  .og .brand { display: grid; grid-template-columns: auto auto; gap: ${px(4)} ${px(24)}; font-size: ${px(54)}; line-height: 1.1; }
  .og .brand-mark { grid-row: span 2; align-self: center; width: ${px(92)}; height: ${px(92)}; }
  .og .brand-latin { font-size: 0.62em; color: var(--ink-2); letter-spacing: 0.04em; }
  .og .tempo { --step: 0px; width: ${px(400)}; justify-self: start; column-gap: 0; }
  /* Set flush left under the name, as a score sets its tempo mark. */
  .og .marking { justify-self: start; font-size: ${px(34)}; }
  .og .metronome-mark { justify-self: start; font-size: ${px(150)}; }
  .og .step { display: none; }
  .og .pattern { width: 100%; margin: 0; }
  .og .hint { display: none; }
`

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: WIDTH / SCALE, height: HEIGHT / SCALE },
  deviceScaleFactor: SCALE * 2,
  colorScheme: 'dark',
  reducedMotion: 'reduce',
  locale: 'zh-TW',
})
await page.addInitScript(() => {
  localStorage.setItem('metronome:settings:v1', JSON.stringify({ bpm: 120, beatsPerBar: 4, language: 'zh-Hant' }))
  localStorage.setItem('metronome:accent-hint-seen', '1')
})
await page.goto(url)
await page.evaluate(() => document.fonts.ready)
await page.addStyleTag({ content: CARD_CSS })
await page.evaluate(() => {
  const card = document.createElement('div')
  card.className = 'og'
  const text = document.createElement('div')
  text.className = 'og-text'
  const brand = document.querySelector('.brand')
  const latin = document.createElement('span')
  latin.className = 'brand-latin'
  latin.textContent = 'Metronome'
  brand.append(latin)
  text.append(brand, document.getElementById('tempo'))
  card.append(text, document.querySelector('.pattern-figure'))
  document.body.prepend(card)
})
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(500)
const shot = await page.screenshot()
await browser.close()

// Rendered at twice the size and scaled down, for smooth strokes; flat colours keep the PNG small.
await sharp(shot).resize(WIDTH, HEIGHT).png({ palette: true, quality: 100, effort: 10 }).toFile(OUT)
console.log(`public/og-image.png: ${WIDTH}x${HEIGHT}, ${statSync(OUT).size} bytes`)
