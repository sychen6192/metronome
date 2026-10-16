import { t, type MessageKey } from '../i18n'

/** Toasts hold message keys, not text, so they follow a language switch while shown. */
export interface ToastAction {
  label: MessageKey
  run: () => void
}

export interface ToastOptions {
  /** Called when the user closes the toast without acting on it. */
  dismissed?: () => void
  /** Language of the message and action when it isn't the page's (an offer of the other language). */
  lang?: string
  /** Stays until closed even without an action (steps to follow at leisure). */
  sticky?: boolean
}

interface Toast extends ToastOptions {
  message: MessageKey
  action?: ToastAction
}

const toast = document.getElementById('toast')!
const text = document.getElementById('toast-text')!
const actionButton = document.getElementById('toast-action') as HTMLButtonElement
const closeButton = document.getElementById('toast-close') as HTMLButtonElement

/**
 * Toasts with an action (e.g. "Reload" for an update) stay until used or dismissed, and are never
 * lost: a newer one shows on top and the older one returns afterwards. A plain message shows over
 * them for a few seconds.
 */
const persistent: Toast[] = []
let transient: Toast | null = null
let hideTimer: number | undefined

closeButton.addEventListener('click', () => {
  if (transient) clearTransient()
  else persistent.pop()?.dismissed?.()
  render()
})
actionButton.addEventListener('click', () => {
  const top = persistent.pop()
  render()
  top?.action?.run()
})

export function showToast(message: MessageKey, action?: ToastAction, options: ToastOptions = {}): void {
  if (action || options.sticky) {
    dismissToast(message)
    persistent.push({ message, action, ...options })
  } else {
    clearTransient()
    transient = { message }
    hideTimer = window.setTimeout(() => {
      transient = null
      render()
    }, 4000)
  }
  render()
}

/** Whether a toast is waiting for the user to act on it or close it. */
export function actionPending(): boolean {
  return persistent.length > 0
}

/** Remove a persistent toast once it no longer applies (e.g. playback restarted). */
export function dismissToast(message: MessageKey): void {
  const index = persistent.findIndex((item) => item.message === message)
  if (index !== -1) {
    persistent.splice(index, 1)
    render()
  }
}

/** Remove a persistent toast the user has passed over, as if they had closed it. */
export function declineToast(message: MessageKey): void {
  const declined = persistent.find((item) => item.message === message)
  if (!declined) return
  dismissToast(message)
  declined.dismissed?.()
}

function clearTransient(): void {
  clearTimeout(hideTimer)
  transient = null
}

/** Show the current toast in the current language. */
export function render(): void {
  const current = transient ?? persistent.at(-1)
  toast.hidden = !current
  if (!current) return
  text.textContent = t(current.message)
  actionButton.hidden = !current.action
  actionButton.textContent = current.action ? t(current.action.label) : ''
  for (const part of [text, actionButton]) {
    if (current.lang) part.lang = current.lang
    else part.removeAttribute('lang')
  }
}
