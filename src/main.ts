import './style.css'
import { MetronomeEngine } from './audio/engine'
import type { ClickEvent } from './core/sequencer'
import {
  MAX_BEATS,
  MIN_BEATS,
  SUBDIVISIONS,
  SUBDIVISION_OFFSETS,
  cycleAccent,
  resizeAccents,
  type Subdivision,
} from './core/rhythm'
import { SOUNDS, loadSettings, saveSettings, type Settings, type SoundId } from './core/settings'
import { MAX_BPM, MIN_BPM, TapTempo, clampBpm, tempoMarking } from './core/tempo'
import { LANGUAGES, browserLanguage, currentLanguage, resolveLanguage, setLanguage, t, translatePage, type Language } from './i18n'
import { setupPwa } from './platform/pwa'
import { ScreenWakeLock } from './platform/wakeLock'
import { BeatPattern } from './ui/beatPattern'
import { subdivisionIcon } from './ui/notation'
import { dismissToast, render as renderToast, showToast } from './ui/toast'

const byId = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T

const els = {
  pattern: byId('pattern'),
  beatButtons: byId('beat-buttons'),
  tempo: byId('tempo'),
  bpm: byId<HTMLOutputElement>('bpm'),
  marking: byId('marking'),
  slider: byId<HTMLInputElement>('bpm-slider'),
  rulerScale: byId('ruler-scale'),
  slower: byId<HTMLButtonElement>('slower'),
  faster: byId<HTMLButtonElement>('faster'),
  tap: byId<HTMLButtonElement>('tap'),
  play: byId<HTMLButtonElement>('play'),
  playLabel: byId('play-label'),
  trainerToggle: byId<HTMLButtonElement>('trainer-toggle'),
  fewerBeats: byId<HTMLButtonElement>('fewer-beats'),
  moreBeats: byId<HTMLButtonElement>('more-beats'),
  beatsValue: byId<HTMLOutputElement>('beats-value'),
  meterTop: byId('meter-top'),
  captionBeats: byId('caption-beats'),
  subdivisions: byId('subdivisions'),
  sound: byId<HTMLSelectElement>('sound'),
  volume: byId<HTMLInputElement>('volume'),
  trainer: byId<HTMLDetailsElement>('trainer'),
  trainerState: byId('trainer-state'),
  trainerStep: byId<HTMLInputElement>('trainer-step'),
  trainerEvery: byId<HTMLInputElement>('trainer-every'),
  trainerTarget: byId<HTMLInputElement>('trainer-target'),
  install: byId<HTMLButtonElement>('install'),
  hint: byId('hint'),
  languageLinks: document.querySelectorAll<HTMLAnchorElement>('[data-language]'),
}

// ---------------------------------------------------------------------------------------------
// State

function storage(): Storage | undefined {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

// Web fonts can be blocked (e.g. iOS Lockdown Mode); the tempo mark then switches to plain numerals.
const withoutEngraved = () => document.documentElement.classList.add('no-engraved')
document.fonts?.load('1em "Metronome Engraved"').then((faces) => {
  if (faces.length === 0) withoutEngraved()
}, withoutEngraved)

let settings: Settings = loadSettings(storage())
/**
 * The language of this page's URL: the root is Chinese, /en/ English (see build/pages.ts). Read
 * from the address, not the document: offline, the service worker answers /en without its slash
 * with the Chinese page, which then translates itself.
 */
const englishPath = `${import.meta.env.BASE_URL}en`
const pageLanguage: Language =
  location.pathname === englishPath || location.pathname.startsWith(`${englishPath}/`) ? 'en' : 'zh-Hant'
// The other language's link opened in a new tab is a choice too, newer than the stored one.
if (settings.language !== 'auto' && settings.language !== pageLanguage && openedFromOtherLanguage()) {
  settings = { ...settings, language: pageLanguage }
  saveSettings(storage(), settings)
}
setLanguage(resolveLanguage(settings.language, pageLanguage))
const pattern = new BeatPattern(els.pattern, els.beatButtons)
const engine = new MetronomeEngine(
  () => settings,
  (bpm) => update({ bpm }),
  (change) => {
    if (change === 'resumed') {
      // Played again from the lock screen or headphones.
      requestAnimationFrame(frame)
      void wakeLock.request()
    } else {
      void wakeLock.release()
      restBaton()
      if (change === 'interrupted') showInterruptedNotice()
    }
    renderPlayState()
  },
)

/**
 * A phone call or Siri stopped playback. Say so once the page is visible again (the user is
 * usually away when it happens), and keep the notice until they act, with Start right there.
 */
function showInterruptedNotice(): void {
  const show = () => {
    if (engine.playing) return
    showToast('audioInterrupted', {
      label: 'play',
      run: () => {
        if (!engine.playing) void togglePlay()
      },
    })
  }
  if (document.visibilityState === 'visible') return show()
  document.addEventListener('visibilitychange', function onVisible() {
    if (document.visibilityState !== 'visible') return
    document.removeEventListener('visibilitychange', onVisible)
    show()
  })
}
const wakeLock = new ScreenWakeLock()
const tapTempo = new TapTempo()

let saveTimer: number | undefined
function update(patch: Partial<Settings>): void {
  settings = { ...settings, ...patch }
  if (patch.beatsPerBar !== undefined) {
    settings.accents = resizeAccents(settings.accents, settings.beatsPerBar)
  }
  if (patch.volume !== undefined) engine.setVolume(settings.volume)
  render()
  clearTimeout(saveTimer)
  saveTimer = window.setTimeout(saveNow, 300)
}

/** Write pending changes now (the debounced save, or the page going away with one pending). */
function saveNow(): void {
  if (saveTimer === undefined) return
  clearTimeout(saveTimer)
  saveTimer = undefined
  saveSettings(storage(), settings)
}

const changeBpm = (delta: number) => update({ bpm: clampBpm(settings.bpm + delta) })

// ---------------------------------------------------------------------------------------------
// Rendering

function renderBeats(): void {
  pattern.update(settings.accents, SUBDIVISION_OFFSETS[settings.subdivision], (beat, accent) =>
    t('beatLabel', { n: beat + 1, state: t(`accent.${accent}`) }),
  )
}

/** Custom slider styling draws the filled part of the track from --p (0–1). */
function setSlider(input: HTMLInputElement, value: number): void {
  input.value = String(value)
  const min = Number(input.min)
  const max = Number(input.max)
  input.style.setProperty('--p', String((value - min) / (max - min)))
}

function render(): void {
  const marking = tempoMarking(settings.bpm)
  els.bpm.value = String(settings.bpm)
  els.marking.textContent = marking
  setSlider(els.slider, settings.bpm)
  els.slider.setAttribute('aria-valuetext', t('tempoValue', { bpm: settings.bpm, marking }))
  els.slower.disabled = settings.bpm <= MIN_BPM
  els.faster.disabled = settings.bpm >= MAX_BPM

  renderBeats()
  els.beatsValue.value = String(settings.beatsPerBar)
  els.meterTop.textContent = String(settings.beatsPerBar)
  els.captionBeats.textContent = String(settings.beatsPerBar)
  els.fewerBeats.disabled = settings.beatsPerBar <= MIN_BEATS
  els.moreBeats.disabled = settings.beatsPerBar >= MAX_BEATS

  for (const radio of els.subdivisions.querySelectorAll<HTMLInputElement>('input')) {
    radio.checked = radio.value === settings.subdivision
  }
  els.sound.value = settings.sound
  setSlider(els.volume, Math.round(settings.volume * 100))

  const { trainer } = settings
  els.trainerToggle.setAttribute('aria-pressed', String(trainer.enabled))
  els.trainerState.textContent = trainer.enabled ? t('trainerOn') : t('trainerOff')
  els.trainerState.classList.toggle('on', trainer.enabled)
  // Don't overwrite a number field while the user is typing in it.
  for (const [input, value] of [
    [els.trainerStep, trainer.step],
    [els.trainerEvery, trainer.everyBars],
    [els.trainerTarget, trainer.target],
  ] as const) {
    if (document.activeElement !== input) input.value = String(value)
  }

  for (const link of els.languageLinks) {
    if (link.dataset.language === currentLanguage()) link.setAttribute('aria-current', 'page')
    else link.removeAttribute('aria-current')
  }
  renderPlayState()
}

function renderPlayState(): void {
  const playing = engine.playing
  // The accessible name switches between Start and Stop, so no aria-pressed as well.
  els.play.classList.toggle('playing', playing)
  els.playLabel.textContent = playing ? t('stop') : t('play')
  document.body.classList.toggle('is-playing', playing)
}

// ---------------------------------------------------------------------------------------------
// Visual beat, synchronised to what is actually heard

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
/** The last beat that reached the speakers; the baton travels from it towards the next. */
let lastBeat: ClickEvent | null = null

function frame(): void {
  const clicks = engine.takeAudibleClicks()
  // After a hidden stretch many clicks arrive at once; only the latest beat and sub-click matter.
  const beat = clicks.findLast((click) => click.sub === 0)
  if (beat) {
    lastBeat = beat
    pattern.strike(beat.beat, 0, beat.level, reducedMotion.matches)
  }
  const sub = clicks.at(-1)
  if (sub && sub.sub > 0) pattern.strike(sub.beat, sub.sub, sub.level, reducedMotion.matches)

  if (lastBeat) {
    // Time the swing by when the next beat will actually sound: its scheduled time once known,
    // until then the tempo this beat was scheduled with (a later tempo change can't move it).
    const next = engine.nextBeatTime()
    const length = next !== undefined && next > lastBeat.time ? next - lastBeat.time : lastBeat.beatLength
    const elapsed = (engine.audibleNow() - lastBeat.time) / length
    pattern.moveBaton(lastBeat.beat, Math.min(1, elapsed), reducedMotion.matches)
  }
  if (engine.playing) requestAnimationFrame(frame)
}

function restBaton(): void {
  lastBeat = null
  pattern.rest()
}

// ---------------------------------------------------------------------------------------------
// Actions

async function togglePlay(): Promise<void> {
  if (engine.playing) {
    engine.stop()
    void wakeLock.release()
    restBaton()
    renderPlayState()
    return
  }
  const starting = engine.start()
  dismissToast('audioInterrupted')
  renderPlayState()
  try {
    await starting
    if (!engine.playing) return
    requestAnimationFrame(frame)
    void wakeLock.request()
  } catch {
    showToast('audioError')
  }
  renderPlayState()
}

function tap(timeStamp: number): void {
  const bpm = tapTempo.tap(timeStamp)
  if (bpm !== null) update({ bpm })
  els.tap.animate([{ transform: 'scale(0.94)' }, { transform: 'scale(1)' }], { duration: 120 })
}

/** Press and hold to keep changing the value, like a hardware metronome. */
function holdToRepeat(button: HTMLButtonElement, action: () => void): void {
  let delay: number | undefined
  let repeat: number | undefined
  /** The pointer whose press drives the repeat; other fingers neither stop nor block it. */
  let owner: number | undefined
  const stop = () => {
    clearTimeout(delay)
    clearInterval(repeat)
    delay = repeat = owner = undefined
  }
  const release = (event: PointerEvent) => {
    if (event.pointerId === owner) stop()
  }
  // The action disables the button at the tempo limit, after which some browsers stop
  // delivering pointer events to it, so the repeat also ends itself there.
  const tick = () => {
    action()
    if (button.disabled) stop()
  }
  button.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return
    // A new press, from any finger, takes over; an earlier repeat never keeps running.
    stop()
    owner = event.pointerId
    tick()
    if (owner !== undefined) delay = window.setTimeout(() => (repeat = window.setInterval(tick, 70)), 400)
  })
  button.addEventListener('pointerleave', release)
  // Leaving the app ends it; the button's own blur doesn't (another finger's tap moves focus).
  window.addEventListener('blur', stop)
  // Releasing anywhere (or on a now-disabled button) ends the repeat, for the finger that started it.
  window.addEventListener('pointerup', release)
  window.addEventListener('pointercancel', release)
  // Keyboard activation (Enter/Space on the focused button) arrives as a click with detail 0.
  button.addEventListener('click', (event) => {
    if (event.detail === 0) action()
  })
  button.addEventListener('contextmenu', (event) => event.preventDefault())
}

// ---------------------------------------------------------------------------------------------
// Wiring

/** Tempo ruler engraved like a metronome's scale: where each Italian marking begins. */
const RULER_MARKS: ReadonlyArray<readonly [bpm: number, name: string]> = [
  [45, 'Largo'],
  [76, 'Andante'],
  [120, 'Allegro'],
  [176, 'Presto'],
]

function buildRuler(): void {
  els.rulerScale.replaceChildren(
    ...RULER_MARKS.map(([bpm, name]) => {
      const mark = document.createElement('span')
      mark.className = 'ruler-mark'
      mark.textContent = name
      mark.style.setProperty('--at', String((bpm - MIN_BPM) / (MAX_BPM - MIN_BPM)))
      return mark
    }),
  )
}

/** URL path of a language's page: the build serves the root in Chinese and /en/ in English. */
function pathFor(language: Language): string {
  return import.meta.env.BASE_URL + (language === 'en' ? 'en/' : '')
}

/** Whether this page was opened from this site's own page in the other language. */
function openedFromOtherLanguage(): boolean {
  try {
    const from = new URL(document.referrer)
    return from.origin === location.origin && from.pathname === pathFor(pageLanguage === 'en' ? 'zh-Hant' : 'en')
  } catch {
    return false
  }
}

/** Show the app in `language` in place (playback carries on), with the address bar to match. */
function applyLanguage(language: Language): void {
  setLanguage(language)
  translatePage()
  buildControls()
  render()
  dismissToast('otherLanguage')
  renderToast()
  const path = pathFor(language)
  if (location.pathname !== path) history.replaceState(history.state, '', path + location.search + location.hash)
  document.querySelector('link[rel="manifest"]')?.setAttribute('href', `${path}manifest.webmanifest`)
  // Sharing names the page now shown. Unchanged unless the language differs from the URL's
  // (search engines never switch, so they always see the canonical written at build time).
  const url = document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${language}"]`)?.href
  if (url) {
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', url)
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', url)
  }
}

function chooseLanguage(language: Language): void {
  update({ language })
  applyLanguage(language)
}

/**
 * A first visit in a language other than the browser's: offer the other page, never switch by
 * itself (search engines must see each URL in its own language). Closing the offer keeps this one.
 */
function suggestOtherLanguage(): void {
  const wanted = browserLanguage()
  if (settings.language !== 'auto' || wanted === pageLanguage) return
  showToast(
    'otherLanguage',
    { label: 'switchLanguage', run: () => chooseLanguage(wanted) },
    { dismissed: () => update({ language: pageLanguage }), lang: wanted, top: true },
  )
}

const HINT_SEEN = 'metronome:accent-hint-seen'

/** The accent hint is for the first visit: it goes once a numeral has been tapped. */
function retireHint(): void {
  if (els.hint.hidden) return
  els.hint.hidden = true
  try {
    storage()?.setItem(HINT_SEEN, '1')
  } catch {
    // Storage full or blocked: the hint simply returns next time.
  }
}

function buildControls(): void {
  els.subdivisions.innerHTML = SUBDIVISIONS.map(
    (sub) => `
      <label class="segment" title="${t(`sub.${sub}`)}">
        <input type="radio" name="subdivision" value="${sub}" aria-label="${t(`sub.${sub}`)}" />
        ${subdivisionIcon(sub)}
      </label>`,
  ).join('')

  els.sound.replaceChildren(
    ...SOUNDS.map((id) => new Option(t(`sound.${id}`), id)),
  )
}

function bindEvents(): void {
  els.play.addEventListener('click', () => void togglePlay())

  holdToRepeat(els.slower, () => changeBpm(-1))
  holdToRepeat(els.faster, () => changeBpm(1))
  els.slider.addEventListener('input', () => update({ bpm: clampBpm(els.slider.valueAsNumber) }))

  // Scroll on the tempo display to fine-tune (trackpads send many small deltas, so accumulate).
  let wheelDelta = 0
  els.tempo.addEventListener(
    'wheel',
    (event) => {
      // Ctrl/⌘ + wheel and trackpad pinch are page zoom; leave them to the browser.
      if (event.ctrlKey || event.metaKey) return
      event.preventDefault()
      wheelDelta += event.deltaY
      const steps = Math.trunc(wheelDelta / 40)
      if (steps !== 0) {
        wheelDelta -= steps * 40
        changeBpm(-steps)
      }
    },
    { passive: false },
  )

  // Tap on pointerdown, not click: click fires on release and would skew the measured tempo.
  els.tap.addEventListener('pointerdown', (event) => {
    if (event.button === 0) tap(event.timeStamp)
  })
  els.tap.addEventListener('click', (event) => {
    if (event.detail === 0) tap(event.timeStamp)
  })

  // Real links between the language pages (crawlable); a plain click switches in place instead.
  for (const link of els.languageLinks) {
    link.addEventListener('click', (event) => {
      const language = LANGUAGES.find((code) => code === link.dataset.language)
      if (!language || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      event.preventDefault()
      chooseLanguage(language)
    })
  }

  els.beatButtons.addEventListener('click', (event) => {
    const dot = (event.target as Element).closest<HTMLElement>('.beat')
    if (!dot) return
    const index = Number(dot.dataset.index)
    const accents = settings.accents.slice()
    accents[index] = cycleAccent(accents[index] ?? 'normal')
    update({ accents })
    retireHint()
  })

  els.fewerBeats.addEventListener('click', () => update({ beatsPerBar: Math.max(MIN_BEATS, settings.beatsPerBar - 1) }))
  els.moreBeats.addEventListener('click', () => update({ beatsPerBar: Math.min(MAX_BEATS, settings.beatsPerBar + 1) }))

  els.subdivisions.addEventListener('change', (event) => {
    update({ subdivision: (event.target as HTMLInputElement).value as Subdivision })
  })
  els.sound.addEventListener('change', () => {
    update({ sound: els.sound.value as SoundId })
    void engine.preview(settings.sound)
  })
  els.volume.addEventListener('input', () => update({ volume: els.volume.valueAsNumber / 100 }))

  els.trainerToggle.addEventListener('click', () => {
    const enabled = !settings.trainer.enabled
    update({ trainer: { ...settings.trainer, enabled } })
    // Show the step / interval / target fields when the trainer is switched on.
    if (enabled) els.trainer.open = true
  })
  const trainerField = (input: HTMLInputElement, key: 'step' | 'everyBars' | 'target', min: number, max: number) => {
    input.addEventListener('change', () => {
      const value = Number.isFinite(input.valueAsNumber) ? input.valueAsNumber : settings.trainer[key]
      const clamped = Math.min(max, Math.max(min, Math.round(value)))
      update({ trainer: { ...settings.trainer, [key]: clamped } })
      input.value = String(clamped)
    })
  }
  trainerField(els.trainerStep, 'step', 1, 50)
  trainerField(els.trainerEvery, 'everyBars', 1, 64)
  trainerField(els.trainerTarget, 'target', MIN_BPM, MAX_BPM)

  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('keyup', (event) => {
    // Stop Space from also "clicking" whichever button has focus.
    if (event.code === 'Space' && !isTextEntry(event.target)) event.preventDefault()
  })

  // Persist a pending change when the page goes away. Only a pending one: rewriting everything
  // would overwrite what another tab saved since (say, the other language opened there).
  window.addEventListener('pagehide', saveNow)
}

function isTextEntry(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.matches('input[type="number"], input[type="text"], select, textarea')
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.ctrlKey || event.metaKey || event.altKey) return
  const target = event.target
  if (event.code === 'Space') {
    if (isTextEntry(target)) return
    event.preventDefault()
    if (!event.repeat) void togglePlay()
    return
  }
  if ((event.key === 't' || event.key === 'T') && !isTextEntry(target)) {
    if (!event.repeat) tap(event.timeStamp)
    return
  }
  // Let sliders and form fields keep their own arrow-key behaviour.
  if (target instanceof HTMLElement && target.matches('input, select, textarea')) return

  const step = event.shiftKey ? 10 : 1
  switch (event.key) {
    case 'ArrowUp':
    case 'ArrowRight':
      event.preventDefault()
      changeBpm(step)
      break
    case 'ArrowDown':
    case 'ArrowLeft':
      event.preventDefault()
      changeBpm(-step)
      break
  }
}

buildRuler()
bindEvents()
applyLanguage(currentLanguage())
try {
  if (storage()?.getItem(HINT_SEEN)) els.hint.hidden = true
} catch {
  // Unreadable storage: show the hint.
}
suggestOtherLanguage()
setupPwa(els.install, () => engine.playing)
