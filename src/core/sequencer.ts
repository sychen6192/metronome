import { DOWNBEAT, SUBDIVISION_OFFSETS, nextPulse, type Accent, type Pulse } from './rhythm'
import type { Settings } from './settings'
import { beatDuration, rampTempo } from './tempo'

export type ClickLevel = Accent | 'sub'

export interface ClickEvent {
  /** Audio-clock time (seconds) at which the click starts. */
  time: number
  beat: number
  sub: number
  level: ClickLevel
}

/**
 * Turns the current settings into a stream of timed clicks. It knows nothing about audio, so the
 * timing rules can be unit tested; the audio engine asks it for every click inside its lookahead
 * window ("A Tale of Two Clocks", web.dev).
 *
 * Settings are read on every step, so tempo, bar length, subdivision and accent changes take
 * effect from the next click without restarting.
 */
export class Sequencer {
  private pulse: Pulse = DOWNBEAT
  private nextTime = 0
  private barsSinceRamp = 0
  private trainerEnabled = false

  constructor(
    private readonly getSettings: () => Settings,
    /** Called when the speed trainer changes the tempo; the caller must store the new BPM. */
    private readonly onTempoChange: (bpm: number) => void = () => {},
  ) {}

  /** Restart from the first beat of a bar at `time`. */
  start(time: number): void {
    this.pulse = DOWNBEAT
    this.nextTime = time
    this.barsSinceRamp = 0
    this.trainerEnabled = this.getSettings().trainer.enabled
  }

  /** Time of the next click that has not been scheduled yet. */
  get nextClickTime(): number {
    return this.nextTime
  }

  /**
   * If the scheduler fell behind (e.g. a stalled main thread or throttled tab), skip the clicks
   * that are more than `tolerance` seconds late instead of firing them all at once. Whole pulses
   * are skipped, so the beat grid and bar position stay where they were; a click that is only
   * slightly late is kept and plays immediately.
   */
  catchUp(now: number, tolerance: number): void {
    while (this.nextTime < now - tolerance) this.advance()
  }

  /** Return every click that starts before `until`, advancing the sequencer past them. */
  scheduleUntil(until: number): ClickEvent[] {
    const events: ClickEvent[] = []
    while (this.nextTime < until) {
      events.push(this.currentEvent())
      this.advance()
    }
    return events
  }

  private currentEvent(): ClickEvent {
    const { beat, sub } = this.pulse
    const level: ClickLevel = sub === 0 ? (this.getSettings().accents[beat] ?? 'normal') : 'sub'
    return { time: this.nextTime, beat, sub, level }
  }

  private advance(): void {
    const settings = this.getSettings()
    const { pulse, beats } = nextPulse(
      this.pulse,
      settings.beatsPerBar,
      SUBDIVISION_OFFSETS[settings.subdivision],
    )
    this.nextTime += beats * beatDuration(settings.bpm)
    this.pulse = pulse

    if (settings.trainer.enabled !== this.trainerEnabled) {
      this.trainerEnabled = settings.trainer.enabled
      // Only whole bars played with the trainer on count; the bar in progress doesn't.
      this.barsSinceRamp = -1
    }
    if (pulse.beat === 0 && pulse.sub === 0) this.onNewBar(settings)
  }

  private onNewBar(settings: Settings): void {
    const { trainer } = settings
    if (!trainer.enabled) return
    this.barsSinceRamp += 1
    if (this.barsSinceRamp < trainer.everyBars) return
    this.barsSinceRamp = 0
    const bpm = rampTempo(settings.bpm, trainer.target, trainer.step)
    if (bpm !== settings.bpm) this.onTempoChange(bpm)
  }
}
