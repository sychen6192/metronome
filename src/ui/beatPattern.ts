import {
  PATTERN_BOX,
  arrowhead,
  batonProgress,
  patternGeometry,
  pointOnSegment,
  shapesPath,
  strokeOutline,
  strokeWidth,
  type PatternGeometry,
  type Point,
} from '../core/pattern'
import type { Accent } from '../core/rhythm'
import type { ClickLevel } from '../core/sequencer'

const SVG_NS = 'http://www.w3.org/2000/svg'

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attributes: Record<string, string | number>) {
  const element = document.createElementNS(SVG_NS, tag)
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, String(value))
  return element
}

/** Baton radius on screen: 12 px on a phone, growing with the figure up to 16 px. */
const batonRadius = (figureWidth: number) => Math.min(16, Math.max(12, figureWidth / 30))

/**
 * Pen widths on screen, in px: light through each rebound, pressing into the ictus, heaviest on
 * the fall into the downbeat, as a conducting textbook draws the pattern.
 */
const PEN = { thin: 1.5, heavy: 3.4, downbeat: 4.8 }
/** Where on each stroke its arrowhead sits: on the fall, clear of the subdivision ticks. */
const ARROW_AT = 0.8
/** Length of the printed mark at each ictus, in px: the plane the baton strikes. */
const ICTUS_MARK = 16

const percent = (point: Point) => ({
  left: `${(point.x / PATTERN_BOX.width) * 100}%`,
  top: `${(point.y / PATTERN_BOX.height) * 100}%`,
})

/**
 * The bar drawn as a conductor's beat pattern. Each beat number sits on its ictus and is the
 * button that cycles that beat's accent; a baton point travels the pattern in time with the
 * audio and strikes each ictus on its click.
 */
export class BeatPattern {
  private readonly path: SVGPathElement
  private readonly ticks: SVGGElement
  private readonly marks: SVGGElement
  private readonly ripples: SVGGElement
  private readonly baton: SVGCircleElement
  private geometry: PatternGeometry = patternGeometry(4)
  private offsets: readonly number[] = [0]
  private struck: HTMLElement | null = null
  /** Stopped: the baton waits at the top and follows the pattern when the meter changes. */
  private resting = true
  /** Screen px per drawing unit. */
  private scale = 1

  constructor(
    private readonly figure: HTMLElement,
    private readonly buttons: HTMLElement,
  ) {
    const drawing = svg('svg', {
      viewBox: `0 0 ${PATTERN_BOX.width} ${PATTERN_BOX.height}`,
      class: 'pattern-drawing',
      'aria-hidden': 'true',
      focusable: 'false',
    })
    this.path = svg('path', { class: 'pattern-path' })
    this.ticks = svg('g', { class: 'pattern-ticks' })
    this.marks = svg('g', { class: 'pattern-ictus' })
    this.ripples = svg('g', { class: 'pattern-ripples' })
    this.baton = svg('circle', { class: 'baton', r: 13 })
    drawing.append(this.path, this.ticks, this.marks, this.ripples, this.baton)
    figure.prepend(drawing)
    // The drawing scales with the figure; pen widths, marks and the baton keep their size on screen.
    new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? 0
      if (width <= 0) return
      this.scale = width / PATTERN_BOX.width
      this.baton.setAttribute('r', (batonRadius(width) / this.scale).toFixed(2))
      this.drawStrokes()
    }).observe(figure)
    this.rest()
  }

  /** Redraw for a bar length, its accents and subdivision. */
  update(accents: readonly Accent[], offsets: readonly number[], label: (beat: number, accent: Accent) => string): void {
    const beats = accents.length
    const rebuild = beats !== this.geometry.ictus.length || this.ripples.childElementCount !== beats
    if (rebuild) {
      this.clearStrike()
      this.geometry = patternGeometry(beats)
      this.marks.replaceChildren(...this.geometry.ictus.map(() => svg('line', { class: 'ictus' })))
      this.drawStrokes()
      this.ripples.replaceChildren(
        ...this.geometry.ictus.map((point) => svg('circle', { class: 'ripple', cx: point.x, cy: point.y, r: 22 })),
      )
      this.layoutButtons(beats)
      if (this.resting) this.placeBaton(this.geometry.rest)
    }
    // Ticks sit on the segments, so a new meter needs them redrawn as well.
    if (rebuild || offsets !== this.offsets) {
      this.offsets = offsets
      this.drawTicks()
    }
    accents.forEach((accent, beat) => {
      const button = this.buttons.children[beat] as HTMLElement
      button.dataset.level = accent
      button.setAttribute('aria-label', label(beat, accent))
    })
    this.figure.dataset.count = String(beats)
  }

  /** A click became audible. */
  strike(beat: number, sub: number, level: ClickLevel, reducedMotion: boolean): void {
    if (sub > 0) {
      const tick = this.ticks.querySelector(`[data-beat="${beat}"][data-sub="${sub}"]`)
      tick?.animate([{ opacity: 1 }, { opacity: 0.35 }], { duration: 180, easing: 'ease-out' })
      return
    }
    this.clearStrike()
    this.struck = (this.buttons.children[beat] as HTMLElement | undefined) ?? null
    this.struck?.classList.add('active')
    this.marks.children[beat]?.classList.add('active')
    if (level === 'mute' || reducedMotion) return
    const ripple = this.ripples.children[beat] as SVGCircleElement | undefined
    ripple?.setAttribute('data-level', level)
    ripple?.animate(
      [
        { opacity: level === 'accent' ? 0.9 : 0.6, transform: 'scale(0.5)' },
        { opacity: 0, transform: `scale(${level === 'accent' ? 1.9 : 1.5})` },
      ],
      { duration: 420, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    )
  }

  /**
   * Place the baton `t` of the way (0–1 in time) from `beat` to the next one. A beat beyond a bar
   * that was just shortened travels the last segment, which leads into the downbeat.
   */
  moveBaton(beat: number, t: number, reducedMotion: boolean): void {
    const { segments } = this.geometry
    const segment = segments[Math.min(beat, segments.length - 1)]!
    const point = reducedMotion ? segment.from : pointOnSegment(segment, batonProgress(t))
    this.resting = false
    this.placeBaton(point)
  }

  /** Stopped: baton raised at the top, no beat lit. */
  rest(): void {
    this.clearStrike()
    this.resting = true
    this.placeBaton(this.geometry.rest)
  }

  private clearStrike(): void {
    this.struck?.classList.remove('active')
    this.struck = null
    this.marks.querySelector('.active')?.classList.remove('active')
  }

  /** The pattern's strokes, arrowheads and ictus marks at the current on-screen scale. */
  private drawStrokes(): void {
    const unit = (px: number) => px / this.scale
    const { segments, labelsOnIctus } = this.geometry
    const shapes = segments.map((segment, k) => {
      const heavy = k === segments.length - 1 ? PEN.downbeat : PEN.heavy
      return strokeOutline(segment, unit(PEN.thin), unit(heavy))
    })
    // Crowded bars have no room for arrows; the numerals' order carries the direction.
    if (!labelsOnIctus) {
      segments.forEach((segment, k) => {
        const heavy = k === segments.length - 1 ? PEN.downbeat : PEN.heavy
        const halfWidth = Math.max(4, strokeWidth(ARROW_AT, PEN.thin, heavy) * 1.1)
        shapes.push(arrowhead(segment, ARROW_AT, unit(halfWidth * 2.4), unit(halfWidth)))
      })
    }
    this.path.setAttribute('d', shapesPath(shapes))
    const half = unit(ICTUS_MARK / 2)
    this.geometry.ictus.forEach((point, beat) => {
      const mark = this.marks.children[beat]
      mark?.setAttribute('x1', (point.x - half).toFixed(2))
      mark?.setAttribute('x2', (point.x + half).toFixed(2))
      mark?.setAttribute('y1', point.y.toFixed(2))
      mark?.setAttribute('y2', point.y.toFixed(2))
    })
  }

  private placeBaton(point: Point): void {
    this.baton.setAttribute('cx', point.x.toFixed(1))
    this.baton.setAttribute('cy', point.y.toFixed(1))
  }

  private layoutButtons(beats: number): void {
    const existing = this.buttons.children
    while (existing.length < beats) {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'beat'
      button.dataset.index = String(existing.length)
      button.textContent = String(existing.length + 1)
      this.buttons.append(button)
    }
    while (existing.length > beats) this.buttons.lastElementChild!.remove()
    this.geometry.labels.forEach((point, beat) => {
      const button = existing[beat] as HTMLElement
      Object.assign(button.style, percent(point))
    })
    this.figure.classList.toggle('crowded', this.geometry.labelsOnIctus)
  }

  private drawTicks(): void {
    const ticks: SVGElement[] = []
    this.geometry.segments.forEach((segment, beat) => {
      this.offsets.forEach((offset, sub) => {
        if (sub === 0) return
        const point = pointOnSegment(segment, batonProgress(offset))
        ticks.push(svg('circle', { class: 'tick', cx: point.x, cy: point.y, r: 3.2, 'data-beat': beat, 'data-sub': sub }))
      })
    })
    this.ticks.replaceChildren(...ticks)
  }
}
