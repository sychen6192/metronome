# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Students and hobbyists learning an instrument, practising on their own. The phone or tablet sits on a music stand, desk or piano; both hands are on the instrument, so the screen is read with a glance from arm's length or further and touched only between passages.

## Product Purpose

A metronome that keeps exact time and stays out of the way: start it, set the tempo and the bar, and practise. Success is that a player trusts the click, can read the tempo and beat position at a glance, and changes settings in as few touches as possible.

## Positioning

Sample-accurate Web Audio timing (lookahead scheduling on the audio clock, visuals compensated for output latency) in a free, ad-free, account-free web app that installs like a native app and works fully offline.

## Operating Context

- Glanced at from arm's length while playing; operated between passages, often one-handed.
- Practice sessions run for minutes to hours: the screen stays on (Wake Lock) and the app must not interrupt playback (updates wait for the user).
- Used with phone speakers or wired/Bluetooth headphones.
- Installed to the home screen and used offline (practice rooms, basements, travel).

## Capabilities and Constraints

- Tempo 20–300 BPM: slider, ± buttons with hold-to-repeat, wheel, arrow keys, tap tempo; Italian tempo marking shown.
- 1–16 beats per bar, each beat accent / normal / mute; subdivisions: quarter, eighth, triplet, sixteenth, swing.
- Four synthesised sounds (click, wood block, beep, cowbell), volume.
- Speed trainer: step the tempo towards a target every N bars.
- Keyboard shortcuts: Space start/stop, ↑/↓ tempo (Shift ±10), T tap.
- Languages: Traditional Chinese and English, auto-detected from the browser with a manual switch.
- Light and dark themes following the system.
- PWA: static build (Vite + TypeScript, no UI framework), offline service worker, deployed to GitHub Pages and Cloudflare Workers.

## Brand Commitments

- Name: 節拍器 / Metronome.
- The app icon (`assets/icon-source.png`: navy rounded tile, grey metronome with white pendulum, yellow sound waves) is the brand reference.
- Free, no ads, no account or sign-up.

## Evidence on Hand

No testimonials, user counts, reviews or press exist; do not invent any.

## Product Principles

1. Time is sacred: nothing in the interface may delay, jitter or interrupt the click.
2. Readable at a glance from arm's length: tempo and beat position first, everything else second.
3. Few, large, forgiving controls; settings never stand between the player and the play button.
4. Works anywhere: offline, installed, in either language, in light or dark.

## Accessibility & Inclusion

Keyboard operable and screen-reader labelled; WCAG AA contrast in both themes; respects reduced motion and Windows contrast themes; large touch targets for use between passages.
