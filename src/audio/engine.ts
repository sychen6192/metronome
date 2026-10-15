import { Sequencer, type ClickEvent } from '../core/sequencer'
import type { Settings, SoundId } from '../core/settings'
import { renderClicks, type ClickBuffers, type ClickKind } from './sounds'
import type { TimerMessage } from './timer.worker'

/** How often the scheduler runs. */
const TICK_MS = 25
/** How far ahead clicks are handed to the audio clock. Must comfortably exceed TICK_MS. */
const LOOKAHEAD = 0.1
/** Background tabs may only get one timer tick per second, so schedule further ahead there. */
const HIDDEN_LOOKAHEAD = 1.5
/** Gap before the first click, so it is never scheduled in the past. */
const START_DELAY = 0.06
/** Clicks later than this (scheduler stalled) are skipped rather than played in a burst. */
const LATE_TOLERANCE = 0.05
/** Let the audio device sleep this long after stopping (saves battery on phones). */
const SUSPEND_AFTER_MS = 1500
const LEVEL_GAIN: Record<ClickKind, number> = { accent: 1, normal: 0.7, sub: 0.4 }
const MAX_PENDING_VISUALS = 64

/** Perceived loudness is roughly logarithmic; squaring makes the slider feel even. */
const volumeToGain = (volume: number) => volume * volume

/**
 * Web Audio metronome using the lookahead pattern from "A Tale of Two Clocks" (web.dev) and
 * cwilso/metronome: a worker timer wakes the scheduler, which queues every click in the next
 * LOOKAHEAD seconds on the sample-accurate audio clock.
 */
export class MetronomeEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private levels: Record<ClickKind, GainNode> | null = null
  private buffers: { sound: SoundId; clicks: ClickBuffers } | null = null
  private worker: Worker | null = null
  private fallbackTimer: number | undefined
  private suspendTimer: number | undefined
  /** Scheduled sources and their start times, so stop() can cancel clicks not yet heard. */
  private readonly sources = new Map<AudioBufferSourceNode, number>()
  /** Scheduled clicks the UI hasn't shown yet. */
  private pending: ClickEvent[] = []
  private readonly sequencer: Sequencer
  private running = false
  /** True once start() has resumed the context and begun scheduling. */
  private scheduling = false
  /** Bumped by every start/stop so a start() still awaiting resume() can tell it is stale. */
  private generation = 0

  constructor(
    private readonly getSettings: () => Settings,
    onTempoChange: (bpm: number) => void,
    /** Called when the browser or OS stops the audio while playing (e.g. a phone call on iOS). */
    private readonly onInterrupted: () => void = () => {},
  ) {
    this.sequencer = new Sequencer(getSettings, onTempoChange)
  }

  get playing(): boolean {
    return this.running
  }

  /** Must be called from a user gesture (click/keydown), or browsers keep the audio muted. */
  async start(): Promise<void> {
    if (this.running) return
    this.running = true
    const generation = ++this.generation
    let ctx: AudioContext
    try {
      ctx = this.ensureContext()
      clearTimeout(this.suspendTimer)
      // Resume even if the state reads 'running': right after the idle suspend() is issued,
      // Firefox and Safari still report 'running' until it completes, and skipping resume()
      // would leave the context suspended.
      await ctx.resume()
    } catch (error) {
      if (generation === this.generation) this.running = false
      throw error
    }
    if (generation !== this.generation) return // stopped (or restarted) while resuming

    this.sequencer.start(ctx.currentTime + START_DELAY)
    this.scheduling = true
    this.schedule()
    this.startTimer()
  }

  stop(): void {
    if (!this.running) return
    this.running = false
    this.scheduling = false
    this.generation++
    this.stopTimer()
    this.pending = []

    const now = this.ctx?.currentTime ?? 0
    for (const [source, startTime] of this.sources) {
      // Clicks already sounding ring out naturally; cutting them would itself click.
      if (startTime > now) source.stop()
    }
    this.scheduleSuspend()
  }

  setVolume(volume: number): void {
    if (!this.ctx || !this.master) return
    this.master.gain.setTargetAtTime(volumeToGain(volume), this.ctx.currentTime, 0.01)
  }

  /** Play one accented click, e.g. after choosing a new sound while stopped. */
  async preview(sound: SoundId): Promise<void> {
    if (this.running) return
    try {
      const ctx = this.ensureContext()
      clearTimeout(this.suspendTimer)
      await ctx.resume()
      if (this.running) return // playback started while resuming
      this.play('accent', this.clicksFor(sound), ctx.currentTime + 0.01)
      this.scheduleSuspend()
    } catch {
      // Audio unavailable; the preview is only a nicety.
    }
  }

  /** Clicks that have reached the speakers since the last call, oldest first. */
  takeAudibleClicks(): ClickEvent[] {
    if (!this.ctx || this.pending.length === 0) return []
    const now = this.audibleTime(this.ctx)
    let count = 0
    while (count < this.pending.length && this.pending[count]!.time <= now) count++
    return this.pending.splice(0, count)
  }

  private ensureContext(): AudioContext {
    if (this.ctx) return this.ctx

    usePlaybackAudioSession()
    const ctx = new AudioContext({ latencyHint: 'interactive' })
    const master = ctx.createGain()
    master.gain.value = volumeToGain(this.getSettings().volume)
    master.connect(ctx.destination)

    const level = (kind: ClickKind) => {
      const gain = ctx.createGain()
      gain.gain.value = LEVEL_GAIN[kind]
      gain.connect(master)
      return gain
    }
    this.levels = { accent: level('accent'), normal: level('normal'), sub: level('sub') }
    this.ctx = ctx
    this.master = master

    // The OS can take the audio away while playing (iOS phone call, Siri, another app grabbing
    // the audio session). Stop and report it rather than showing "playing" while silent.
    ctx.addEventListener('statechange', () => {
      if (this.scheduling && ctx.state !== 'running') {
        this.stop()
        this.onInterrupted()
      }
    })

    // Older iOS versions only unlock audio after something plays inside the user gesture.
    const silence = ctx.createBufferSource()
    silence.buffer = ctx.createBuffer(1, 1, ctx.sampleRate)
    silence.connect(ctx.destination)
    silence.start()
    return ctx
  }

  private readonly schedule = (): void => {
    const ctx = this.ctx
    if (!ctx || !this.running) return

    const lookahead = document.hidden ? HIDDEN_LOOKAHEAD : LOOKAHEAD
    this.sequencer.catchUp(ctx.currentTime, LATE_TOLERANCE)
    const clicks = this.clicksFor(this.getSettings().sound)

    for (const event of this.sequencer.scheduleUntil(ctx.currentTime + lookahead)) {
      this.pending.push(event)
      if (event.level !== 'mute') this.play(event.level, clicks, event.time)
    }
    // The UI drains this from requestAnimationFrame, which doesn't run in background tabs.
    if (this.pending.length > MAX_PENDING_VISUALS) {
      this.pending.splice(0, this.pending.length - MAX_PENDING_VISUALS)
    }
  }

  private play(kind: ClickKind, clicks: ClickBuffers, time: number): void {
    if (!this.ctx || !this.levels) return
    const source = this.ctx.createBufferSource()
    source.buffer = clicks[kind]
    source.connect(this.levels[kind])
    source.onended = () => {
      source.disconnect()
      this.sources.delete(source)
    }
    this.sources.set(source, time)
    source.start(time)
  }

  private clicksFor(sound: SoundId): ClickBuffers {
    if (this.buffers?.sound !== sound) {
      this.buffers = { sound, clicks: renderClicks(this.ctx!, sound) }
    }
    return this.buffers.clicks
  }

  /** Context time of the sample currently coming out of the speakers. */
  private audibleTime(ctx: AudioContext): number {
    // currentTime runs ahead of what is heard by the output latency (100 ms+ on Bluetooth).
    const latency = ctx.outputLatency || 0
    const stamp = ctx.getOutputTimestamp?.()
    if (stamp?.contextTime && stamp.performanceTime) {
      const elapsed = (performance.now() - stamp.performanceTime) / 1000
      // Firefox shifts both stamp fields by the latency, which cancels out here; capping by
      // currentTime - outputLatency keeps the compensation there too.
      return Math.min(ctx.currentTime - latency, stamp.contextTime + elapsed)
    }
    return ctx.currentTime - (latency || ctx.baseLatency || 0)
  }

  private startTimer(): void {
    try {
      this.worker ??= new Worker(new URL('./timer.worker.ts', import.meta.url), { type: 'module' })
      this.worker.onmessage = this.schedule
      this.worker.onerror = () => this.useFallbackTimer()
      this.worker.postMessage({ type: 'start', interval: TICK_MS } satisfies TimerMessage)
    } catch {
      this.useFallbackTimer()
    }
  }

  private useFallbackTimer(): void {
    this.worker = null
    if (this.running && this.fallbackTimer === undefined) {
      this.fallbackTimer = window.setInterval(this.schedule, TICK_MS)
    }
  }

  private stopTimer(): void {
    this.worker?.postMessage({ type: 'stop' } satisfies TimerMessage)
    clearInterval(this.fallbackTimer)
    this.fallbackTimer = undefined
  }

  private scheduleSuspend(): void {
    clearTimeout(this.suspendTimer)
    this.suspendTimer = window.setTimeout(() => {
      if (!this.running) void this.ctx?.suspend()
    }, SUSPEND_AFTER_MS)
  }
}

/**
 * On iOS the ring/silent switch mutes Web Audio unless the audio session is "playback"
 * (Audio Session API, Safari 16.4+). A metronome must sound even in silent mode.
 */
function usePlaybackAudioSession(): void {
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
  if (session) {
    try {
      session.type = 'playback'
    } catch {
      // Unsupported value in this browser; keep the default session.
    }
  }
}
