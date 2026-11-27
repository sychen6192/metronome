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
import { SOUNDS, loadSettings, sanitizeSettings, saveSettings, type Settings, type SoundId } from './core/settings'
import { MAX_BPM, MIN_BPM, TEMPO_CHANGES, TapTempo, clampBpm, stepTempo, tempoChange, tempoMarking } from './core/tempo'
import { LANGUAGES, browserLanguage, currentLanguage, resolveLanguage, setLanguage, t, translatePage, type Language } from './i18n'
import { setupPwa } from './platform/pwa'
import { ScreenWakeLock } from './platform/wakeLock'
import { BeatPattern } from './ui/beatPattern'
import { Hint } from './ui/hints'
import { subdivisionIcon } from './ui/notation'
import { declineToast, dismissToast, render as renderToast, showToast } from './ui/toast'

const byId = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T

const els = {
  pattern: byId('pattern'),
  beatButtons: byId('beat-buttons'),
  bpm: byId<HTMLInputElement>('bpm'),
  bpmStatus: byId('bpm-status'),
  mark: document.querySelector<HTMLElement>('.metronome-mark')!,
  marking: byId('marking'),
  direction: byId('direction'),
  directionChange: byId('direction-change'),
  directionTarget: byId('direction-target'),
  directionRule: byId('direction-rule'),
  directionText: byId('direction-text'),
  slider: byId<HTMLInputElement>('bpm-slider'),
  rulerScale: byId('ruler-scale'),
  rulerTarget: byId('ruler-target'),
  slower: byId<HTMLButtonElement>('slower'),
  faster: byId<HTMLButtonElement>('faster'),
  tap: byId<HTMLButtonElement>('tap'),
  play: byId<HTMLButtonElement>('play'),
  playLabel: byId('play-label'),
  trainerToggle: byId<HTMLButtonElement>('trainer-toggle'),
  fewerBeats: byId<HTMLButtonElement>('fewer-beats'),
  moreBeats: byId<HTMLButtonElement>('more-beats'),
  beatsValue: byId<HTMLOutputElement>('beats-value'),
  captionBeats: byId('caption-beats'),
  subdivisions: byId('subdivisions'),
  sound: byId<HTMLSelectElement>('sound'),
  volume: byId<HTMLInputElement>('volume'),
  trainerSwitch: byId<HTMLButtonElement>('trainer-switch'),
  trainerStep: byId<HTMLInputElement>('trainer-step'),
  trainerEvery: byId<HTMLInputElement>('trainer-every'),
  trainerTarget: byId<HTMLInputElement>('trainer-target'),
  install: byId<HTMLButtonElement>('install'),
  topbar: document.querySelector<HTMLElement>('.topbar')!,
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
  (bpm) => {
    update({ bpm })
    announceTempo()
  },
  (change) => {
    if (change === 'resumed') {
      // Played again from the lock screen or headphones.
      beginRun()
      startFrames()
      void wakeLock.request()
    } else {
      void wakeLock.release()
      restBaton()
      endRun()
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
/** What changed here since the last save. */
const unsaved = new Set<keyof Settings>()
function update(patch: Partial<Settings>): void {
  settings = { ...settings, ...patch }
  for (const key of Object.keys(patch) as (keyof Settings)[]) unsaved.add(key)
  if (patch.beatsPerBar !== undefined) {
    settings.accents = resizeAccents(settings.accents, settings.beatsPerBar)
    unsaved.add('accents')
  }
  if (patch.volume !== undefined) engine.setVolume(settings.volume)
  render()
  clearTimeout(saveTimer)
  saveTimer = window.setTimeout(saveNow, 300)
}

/**
 * Write pending changes now (the debounced save, or the page going away with one pending). Only
 * what changed here is written, over what is stored now: another tab's changes to the rest (its
 * tempo, the language chosen there) are not undone by a nudge of the volume in this one.
 */
function saveNow(): void {
  if (saveTimer === undefined) return
  clearTimeout(saveTimer)
  saveTimer = undefined
  // Mid-run, the tempo kept is the one the run started from, as Stop would leave it.
  const mine: Settings = runOrigin === undefined ? settings : { ...settings, bpm: runOrigin }
  const changed = Object.fromEntries([...unsaved].map((key) => [key, mine[key]]))
  unsaved.clear()
  saveSettings(storage(), sanitizeSettings({ ...loadSettings(storage()), ...changed }))
}

/**
 * The tempo a speed-trainer run started from. The trainer's steps are the run's progress, not the
 * user's tempo: Stop returns here. A tempo set by hand during the run becomes the new start.
 */
let runOrigin: number | undefined

function beginRun(): void {
  runOrigin = settings.trainer.enabled ? settings.bpm : undefined
}

function endRun(): void {
  const origin = runOrigin
  runOrigin = undefined
  if (origin !== undefined && origin !== settings.bpm) {
    update({ bpm: origin })
    announceTempo()
  }
}

/** A tempo the user set (buttons, scale, keys, tapping, typing), not one the trainer stepped to. */
function setBpm(bpm: number, announce = true): void {
  if (runOrigin !== undefined) runOrigin = bpm
  update({ bpm })
  if (announce) announceTempo()
}

let announceTimer: number | undefined
/** Tell screen readers the tempo once it settles; holding − or + changes it many times a second. */
function announceTempo(): void {
  clearTimeout(announceTimer)
  announceTimer = window.setTimeout(() => {
    els.bpmStatus.textContent = t('tempoValue', { bpm: settings.bpm, marking: tempoMarking(settings.bpm) })
  }, 800)
}

/** The digits of a typed tempo, at most three; full-width ones (from a CJK keyboard) count. */
function tempoDigits(text: string): string {
  const ascii = text.replace(/[\uff10-\uff19]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) - 0xfee0))
  return ascii.replace(/\D/g, '').slice(0, 3)
}

/** Whether the tempo field holds digits being typed: a re-render leaves them be, leaving keeps them. */
let typingTempo = false

/** Whether the browser sizes the tempo field to its digits by itself (see the stylesheet). */
const sizesItself = CSS.supports('field-sizing', 'content')

/** The tempo field, as wide as its digits (the engraved digits are all one width). */
function showBpm(value: string): void {
  els.bpm.value = value
  if (!sizesItself) els.bpm.style.width = `${Math.max(value.length, 1)}ch`
}

const changeBpm = (delta: number) => setBpm(clampBpm(settings.bpm + delta))

function setTrainer(enabled: boolean, from?: Element): void {
  update({ trainer: { ...settings.trainer, enabled } })
  // Switched on while playing, the run starts here; switched off, the tempo reached stays.
  runOrigin = enabled && engine.playing ? settings.bpm : undefined
  if (enabled && from) trainerHint.show(from, 'above')
}

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
  if (!typingTempo) showBpm(String(settings.bpm))
  els.marking.textContent = marking
  renderDirection()
  setSlider(els.slider, settings.bpm)
  els.slider.setAttribute('aria-valuetext', t('tempoValue', { bpm: settings.bpm, marking }))
  els.slower.disabled = settings.bpm <= MIN_BPM
  els.faster.disabled = settings.bpm >= MAX_BPM
  // A struck beat lets go within about a third of the beat, so at fast tempos one beat is lit, not two.
  els.pattern.style.setProperty('--release', `${Math.min(160, Math.round(21_000 / settings.bpm))}ms`)

  renderBeats()
  els.beatsValue.value = String(settings.beatsPerBar)
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
  els.trainerSwitch.setAttribute('aria-checked', String(trainer.enabled))
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

/** While the speed trainer is on, the marking gives way to where it is taking the tempo. */
function renderDirection(): void {
  const { trainer, bpm } = settings
  const change = trainer.enabled ? tempoChange(bpm, trainer.target) : null
  els.marking.hidden = change !== null
  els.direction.hidden = change === null
  els.rulerTarget.hidden = change === null
  if (change === null) return
  const step = `${change === TEMPO_CHANGES.faster ? '+' : '−'}${trainer.step}`
  const rule = trainer.everyBars === 1 ? t('trainerRuleOne', { step }) : t('trainerRule', { step, bars: trainer.everyBars })
  els.directionChange.textContent = change
  els.directionTarget.textContent = String(trainer.target)
  els.directionRule.textContent = rule
  els.directionText.textContent = t('trainerDirection', { target: trainer.target, rule })
  els.rulerTarget.style.setProperty('--at', String((trainer.target - MIN_BPM) / (MAX_BPM - MIN_BPM)))
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
/** The pending frame of the one loop that draws the beat (0 when none). */
let frameId = 0

/** Draw the beat every frame while playing: one loop, however playback was started. */
function startFrames(): void {
  if (frameId === 0) frameId = requestAnimationFrame(frame)
}

function frame(): void {
  frameId = 0
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
  if (engine.playing) startFrames()
}

function restBaton(): void {
  lastBeat = null
  pattern.rest()
}

// ---------------------------------------------------------------------------------------------
// Actions

/** Counts presses of Start and Stop, so a start still waiting for the audio knows it was overtaken. */
let presses = 0

async function togglePlay(): Promise<void> {
  const press = ++presses
  if (engine.playing) {
    engine.stop()
    void wakeLock.release()
    restBaton()
    endRun()
    renderPlayState()
    return
  }
  beginRun()
  const starting = engine.start()
  dismissToast('audioInterrupted')
  dismissToast('audioError')
  // Playing passes over the offer of the other language, which would sit over the figure.
  declineToast('otherLanguage')
  renderPlayState()
  try {
    await starting
    // Stopped, or stopped and started again, while the audio was starting (a slow Bluetooth
    // route): the later press owns the screen lock and the drawing.
    if (press !== presses || !engine.playing) return
    startFrames()
    void wakeLock.request()
  } catch {
    if (press !== presses) return
    endRun()
    showToast('audioError', {
      label: 'retry',
      run: () => {
        if (!engine.playing) void togglePlay()
      },
    })
  }
  renderPlayState()
}

function tap(timeStamp: number): void {
  const bpm = tapTempo.tap(timeStamp)
  if (bpm !== null) setBpm(bpm)
  els.tap.animate([{ transform: 'scale(0.94)' }, { transform: 'scale(1)' }], { duration: 120 })
}

/**
 * Press and hold to keep changing the value, like a hardware metronome: one step at a time, then,
 * held past a second and a half, through round values (`action` gets the step size: 1, then 5).
 */
function holdToRepeat(button: HTMLButtonElement, action: (size: number) => void): void {
  let timer: number | undefined
  let started = 0
  /** The pointer whose press drives the repeat; other fingers neither stop nor block it. */
  let owner: number | undefined
  const stop = () => {
    clearTimeout(timer)
    timer = owner = undefined
  }
  const release = (event: PointerEvent) => {
    if (event.pointerId === owner) stop()
  }
  // The action disables the button at the tempo limit, after which some browsers stop
  // delivering pointer events to it, so the repeat also ends itself there.
  const tick = () => {
    const fast = performance.now() - started > 1500
    action(fast ? 5 : 1)
    if (button.disabled) return stop()
    timer = window.setTimeout(tick, fast ? 100 : 70)
  }
  button.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return
    // A new press, from any finger, takes over; an earlier repeat never keeps running.
    stop()
    owner = event.pointerId
    started = performance.now()
    action(1)
    if (!button.disabled) timer = window.setTimeout(tick, 400)
  })
  button.addEventListener('pointerleave', release)
  // Leaving the app ends it; the button's own blur doesn't (another finger's tap moves focus).
  window.addEventListener('blur', stop)
  // Releasing anywhere (or on a now-disabled button) ends the repeat, for the finger that started it.
  window.addEventListener('pointerup', release)
  window.addEventListener('pointercancel', release)
  // Keyboard activation (Enter/Space on the focused button) arrives as a click with detail 0.
  button.addEventListener('click', (event) => {
    if (event.detail === 0) action(1)
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
  // What was last announced is in the other language; the next change says it afresh.
  clearTimeout(announceTimer)
  els.bpmStatus.textContent = ''
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
    { dismissed: () => update({ language: pageLanguage }), lang: wanted },
  )
}

/** First-time hints: how the numerals work (on the first visit), what the trainer does (when first on). */
const accentHint = new Hint(byId('accent-hint'), 'metronome:accent-hint-seen', storage)
const trainerHint = new Hint(byId('trainer-hint'), 'metronome:trainer-hint-seen', storage)

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

  holdToRepeat(els.slower, (size) => setBpm(stepTempo(settings.bpm, -1, size)))
  holdToRepeat(els.faster, (size) => setBpm(stepTempo(settings.bpm, 1, size)))
  // The scale announces its own value as it moves.
  els.slider.addEventListener('input', () => setBpm(clampBpm(els.slider.valueAsNumber), false))

  // The tempo typed in place: digits only, kept on Enter or on leaving the field, Escape undoes.
  // It opens selected, so the first key replaces the whole tempo, also where a browser won't
  // select it (no length limit stops that key: the handler keeps three digits).
  let replacing = false
  els.bpm.addEventListener('focus', () => {
    replacing = true
    typingTempo = false
    // After the click that focused it has placed the caret; not once typing has begun (nor after
    // leaving: selecting would focus the field again).
    requestAnimationFrame(() => {
      if (replacing && document.activeElement === els.bpm) els.bpm.select()
    })
  })
  // Placing the caret (a click in the field, or an arrow key) edits from there instead.
  els.bpm.addEventListener('pointerdown', () => {
    if (document.activeElement === els.bpm) replacing = false
  })
  els.bpm.addEventListener('input', (event) => {
    typingTempo = true
    const { inputType, data, isComposing } = event as InputEvent
    // An input method is still composing: leave its text alone until it's done.
    if (isComposing) return
    let value = els.bpm.value
    // Where the caret belongs once what isn't a digit (or is one too many) has been dropped.
    let caret: number | null = tempoDigits(value.slice(0, els.bpm.selectionStart ?? value.length)).length
    if (replacing && inputType.startsWith('insert')) [value, caret] = [data ?? value, null]
    else if (replacing && inputType.startsWith('delete')) [value, caret] = ['', null]
    replacing = false
    const digits = tempoDigits(value)
    const rewritten = digits !== els.bpm.value
    showBpm(digits)
    if (rewritten && caret !== null) els.bpm.setSelectionRange(Math.min(caret, digits.length), Math.min(caret, digits.length))
  })
  els.bpm.addEventListener('compositionend', () => {
    replacing = false
    showBpm(tempoDigits(els.bpm.value))
  })
  els.bpm.addEventListener('keydown', (event) => {
    // Enter or Escape that ends a composition is the input method's.
    if (event.isComposing) return
    if (event.key.startsWith('Arrow') || event.key === 'Home' || event.key === 'End') replacing = false
    if (event.key === 'Escape') typingTempo = false
    if (event.key === 'Enter' || event.key === 'Escape') els.bpm.blur()
  })
  els.bpm.addEventListener('blur', () => {
    const typed = typingTempo ? tempoDigits(els.bpm.value) : ''
    typingTempo = false
    const bpm = clampBpm(Number(typed))
    // Typing the tempo a trainer run has just reached still makes it the start.
    if (typed !== '' && (bpm !== settings.bpm || (runOrigin !== undefined && runOrigin !== bpm))) setBpm(bpm)
    else render()
  })
  // Touching anything else keeps what was typed first, so a tap on + then adds to it.
  document.addEventListener(
    'pointerdown',
    (event) => {
      if (document.activeElement === els.bpm && event.target !== els.bpm) els.bpm.blur()
    },
    true,
  )

  // Scroll on the tempo to fine-tune it (trackpads send many small deltas, so accumulate), but
  // only where it was aimed: over the number, once the pointer has moved onto it, or while the
  // number is being edited. Scrolling the page past it, the number sliding under a resting
  // pointer, keeps scrolling the page.
  let aimed = false
  let pointerAt = ''
  document.addEventListener(
    'pointermove',
    (event) => {
      const at = `${event.clientX},${event.clientY}`
      if (at === pointerAt) return // the page moved under the pointer, not the pointer
      pointerAt = at
      aimed = event.target instanceof Node && els.mark.contains(event.target)
    },
    { capture: true, passive: true },
  )
  window.addEventListener('scroll', () => (aimed = false), { passive: true })
  let wheelDelta = 0
  els.mark.addEventListener(
    'wheel',
    (event) => {
      // Ctrl/⌘ + wheel and trackpad pinch are page zoom; leave them to the browser.
      if (event.ctrlKey || event.metaKey) return
      if (!aimed && document.activeElement !== els.bpm) return
      event.preventDefault()
      if (document.activeElement === els.bpm) els.bpm.blur()
      // One notch of a mouse wheel is one BPM; a trackpad's glide is a BPM every 40 px.
      if (event.deltaMode !== WheelEvent.DOM_DELTA_PIXEL || Math.abs(event.deltaY) >= 60) {
        wheelDelta = 0
        changeBpm(-Math.sign(event.deltaY))
        return
      }
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
    accentHint.retire()
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
  // Let go of the slider and hear the new level (only while stopped: playing, the clicks say it).
  els.volume.addEventListener('change', () => void engine.preview(settings.sound))

  // The transport's toggle and the legend's switch are one setting.
  for (const toggle of [els.trainerToggle, els.trainerSwitch]) {
    toggle.addEventListener('click', () => setTrainer(!settings.trainer.enabled, toggle))
  }
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

  // How focus arrived: by keyboard (Tab, arrows) or by pointer (a click or tap). Coming back to
  // the window (after ⌘-Tab, say) focuses the same element again; that isn't a move.
  let focusBeforeLeaving: Element | null = null
  document.addEventListener('keydown', () => (keyboardInput = true), true)
  // A click or tap on a control, also one that already has focus, hands Space back to Start.
  document.addEventListener('pointerdown', () => ((keyboardInput = false), (keyboardFocus = null)), true)
  window.addEventListener('blur', () => (focusBeforeLeaving = document.activeElement))
  document.addEventListener('focusin', (event) => {
    const returning = event.target === focusBeforeLeaving
    focusBeforeLeaving = null
    if (!returning) keyboardFocus = keyboardInput ? event.target : null
  })
  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('keyup', (event) => {
    // Space started or stopped playback: don't also "click" the button that has focus.
    if (event.code === 'Space' && !keyboardOwns(event.target)) event.preventDefault()
  })

  // Toasts sit just under the header, whose height changes when it wraps or the text is zoomed.
  new ResizeObserver(() => {
    document.documentElement.style.setProperty('--topbar-h', `${els.topbar.offsetHeight}px`)
  }).observe(els.topbar)

  // Persist a pending change when the page goes away. Only a pending one: rewriting everything
  // would overwrite what another tab saved since (say, the other language opened there).
  window.addEventListener('pagehide', saveNow)
}

function isTextEntry(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.matches('input[type="number"], input[type="text"], select, textarea')
}

/** The control the user last reached with the keyboard (Tab, arrows), while it keeps focus. */
let keyboardFocus: EventTarget | null = null
let keyboardInput = false

/**
 * Whether the focused control keeps the keyboard to itself: a text entry, or a button, radio or
 * switch the user reached with the keyboard (Space presses it, as everywhere else). One clicked
 * or tapped doesn't count, so Space still starts and stops there; Start's Space is its own.
 */
function keyboardOwns(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (isTextEntry(target)) return true
  return target === keyboardFocus && target !== els.play && target.matches('button, summary, input[type="radio"], input[type="checkbox"]')
}

/** T, or the key in its place on a keyboard layout that has no Latin letters (Zhuyin, Cyrillic). */
function isTapKey(event: KeyboardEvent): boolean {
  if (event.key === 't' || event.key === 'T') return true
  return event.code === 'KeyT' && !/^[a-z]$/i.test(event.key)
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.ctrlKey || event.metaKey || event.altKey) return
  const target = event.target
  if (event.code === 'Space') {
    if (keyboardOwns(target)) return
    event.preventDefault()
    if (!event.repeat) void togglePlay()
    return
  }
  if (isTapKey(event) && (target === els.tap || !keyboardOwns(target))) {
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
// On the first visit, under the downbeat: the numerals are the accent controls.
accentHint.show(() => els.beatButtons.querySelector('.beat[data-index="0"]'), 'below', 700)
suggestOtherLanguage()
setupPwa(els.install, () => engine.playing)
