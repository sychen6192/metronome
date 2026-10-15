import { t } from '../i18n'

export interface ToastAction {
  label: string
  run: () => void
}

const toast = document.getElementById('toast')!
const text = document.getElementById('toast-text')!
const actionButton = document.getElementById('toast-action') as HTMLButtonElement
const closeButton = document.getElementById('toast-close') as HTMLButtonElement
let hideTimer: number | undefined

closeButton.setAttribute('aria-label', t('dismiss'))
closeButton.addEventListener('click', hideToast)

/** Show a message. Toasts with an action stay until dismissed; others hide after a few seconds. */
export function showToast(message: string, action?: ToastAction): void {
  clearTimeout(hideTimer)
  text.textContent = message
  actionButton.hidden = !action
  actionButton.textContent = action?.label ?? ''
  actionButton.onclick = action
    ? () => {
        hideToast()
        action.run()
      }
    : null
  toast.hidden = false
  if (!action) hideTimer = window.setTimeout(hideToast, 4000)
}

export function hideToast(): void {
  clearTimeout(hideTimer)
  toast.hidden = true
}
