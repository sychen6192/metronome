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
  }

  /** Time of the next click that has not been scheduled yet. */
  get nextClickTime(): number {
    return this.nextTime
  }

  /**
   * If the scheduler fell far behind (e.g. a throttled background tab), skip ahead instead of
   * firing every missed click at once. Keeps the bar position.
   */
  catchUp(now: number, margin: number): void {
    if (this.nextTime < now) this.nextTime = now + margin
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
