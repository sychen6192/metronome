# Metronome

A metronome that draws the bar the way a conductor does. Free, installable, works offline.

**[440bpm.app](https://440bpm.app/)** · [English](https://440bpm.app/en/)

Twin app: [Tuner](https://github.com/sychen6192/tuner), a chromatic tuner on the same chalkboard, in the same score type.

## Features

- Conductor's beat pattern, 1–16 beats: the baton lands on each beat with the click
- 20–300 BPM with Italian tempo markings, tap tempo
- Accent, normal or mute per beat; eighths, triplets, sixteenths, swing
- Speed trainer: steps the tempo every N bars toward a target
- Sample-accurate timing on the Web Audio clock, visuals corrected for output latency
- Installs as an app, runs offline, keeps the screen awake while playing
- Traditional Chinese and English, each at its own URL

**Keys:** `Space` start/stop · `↑` `↓` tempo (`Shift` ±10) · `T` tap

## Develop

```bash
npm install
npm run dev       # dev server
npm test          # unit tests
npm run build     # typecheck + build to dist/
npm run preview   # serve the build (the service worker runs here only)
```

## Deploy

Pushes to `main` deploy to GitHub Pages, served at the custom domain 440bpm.app.
`homepage` in `package.json` is the canonical URL behind every canonical, hreflang, sitemap and
Open Graph tag.

## Assets

- `npm run icons`: app icons from `assets/icon-source.png`
- `scripts/build-fonts.py`: font subsets; `npm test` tells you when new text needs a rebuild
- `scripts/generate-og-image.mjs`: the link-preview image

## Credits

Scheduling after Chris Wilson's [A Tale of Two Clocks](https://web.dev/articles/audio-scheduling).
Fonts: Bravura, Old Standard TT, Noto Sans TC and Noto Serif TC (SIL OFL 1.1), subset and renamed;
licences in `src/fonts/`.
