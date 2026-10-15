import { t } from '../i18n'

export interface ToastAction {
  label: string
  run: () => void
}

interface Toast {
  message: string
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

closeButton.setAttribute('aria-label', t('dismiss'))
closeButton.addEventListener('click', () => {
  if (transient) clearTransient()
  else persistent.pop()
  render()
})
actionButton.addEventListener('click', () => {
  const top = persistent.pop()
  render()
  top?.action?.run()
})

export function showToast(message: string, action?: ToastAction): void {
  if (action) {
    dismissToast(message)
    persistent.push({ message, action })
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

/** Remove a persistent toast once it no longer applies (e.g. playback restarted). */
export function dismissToast(message: string): void {
  const index = persistent.findIndex((item) => item.message === message)
  if (index !== -1) {
    persistent.splice(index, 1)
    render()
  }
}

function clearTransient(): void {
  clearTimeout(hideTimer)
  transient = null
}

function render(): void {
  const current = transient ?? persistent.at(-1)
  toast.hidden = !current
  if (!current) return
  text.textContent = current.message
  actionButton.hidden = !current.action
  actionButton.textContent = current.action?.label ?? ''
}
