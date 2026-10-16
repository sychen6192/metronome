/**
 * First-time hints: a bubble beside the control it explains, shown once. It never takes a touch
 * (the control under it still works) and goes at the next touch or key; once gone it is
 * remembered, so it never comes back.
 */
export class Hint {
  private pending: number | undefined
  /** What the bubble points at, looked up afresh: a re-rendered control is a new element. */
  private anchor: (() => Element | null) | null = null

  constructor(
    private readonly bubble: HTMLElement,
    private readonly key: string,
    private readonly storage: () => Storage | undefined,
  ) {}

  seen(): boolean {
    try {
      return this.storage()?.getItem(this.key) === '1'
    } catch {
      return false
    }
  }

  /** Show the bubble beside `anchor` (at once, or after `delay` ms), unless it has been seen. */
  show(anchor: Element | (() => Element | null), side: 'above' | 'below', delay = 0): void {
    if (this.seen()) return
    clearTimeout(this.pending)
    const reveal = () => {
      this.anchor = typeof anchor === 'function' ? anchor : () => anchor
      if (!this.anchor()?.isConnected) return
      this.bubble.classList.toggle('above', side === 'above')
      this.bubble.classList.toggle('below', side === 'below')
      this.bubble.hidden = false
      this.place()
      // Setting the text again has the status region announce it.
      for (const node of this.bubble.querySelectorAll('[data-i18n]')) node.textContent = node.textContent
      document.addEventListener('pointerdown', this.retire, true)
      document.addEventListener('keydown', this.onKey, true)
      window.addEventListener('resize', this.place)
    }
    if (delay > 0) this.pending = window.setTimeout(reveal, delay)
    else reveal()
  }

  /** Gone for good: the user has acted (or learned what it said). */
  readonly retire = (): void => {
    clearTimeout(this.pending)
    try {
      this.storage()?.setItem(this.key, '1')
    } catch {
      // Storage full or blocked: the hint may return next time.
    }
    if (this.bubble.hidden) return
    this.bubble.hidden = true
    this.anchor = null
    document.removeEventListener('pointerdown', this.retire, true)
    document.removeEventListener('keydown', this.onKey, true)
    window.removeEventListener('resize', this.place)
  }

  private readonly onKey = (event: KeyboardEvent): void => {
    if (!['Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) this.retire()
  }

  /** Centred on the anchor, kept 16 px inside the screen, its pointer aimed at the anchor. */
  private readonly place = (): void => {
    const anchor = this.anchor?.()
    if (!anchor) return
    const target = anchor.getBoundingClientRect()
    const own = this.bubble.getBoundingClientRect()
    const centre = target.left + target.width / 2
    const left = Math.min(Math.max(centre - own.width / 2, 16), document.documentElement.clientWidth - 16 - own.width)
    const gap = 12
    const top = this.bubble.classList.contains('above') ? target.top - gap - own.height : target.bottom + gap
    this.bubble.style.left = `${left + window.scrollX}px`
    this.bubble.style.top = `${top + window.scrollY}px`
    this.bubble.style.setProperty('--pointer', `${centre - left}px`)
  }
}
