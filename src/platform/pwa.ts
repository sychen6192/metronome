import { registerSW } from 'virtual:pwa-register'
import { t } from '../i18n'
import { showToast } from '../ui/toast'

/** Chromium-only event, not in the TypeScript DOM library. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const UPDATE_CHECK_MS = 60 * 60 * 1000

export function setupPwa(installButton: HTMLButtonElement): void {
  // Updates wait for the user to press "Reload" so a new version never interrupts playback.
  const updateServiceWorker = registerSW({
    onNeedRefresh() {
      showToast(t('updateAvailable'), { label: t('reload'), run: () => void updateServiceWorker(true) })
    },
    onOfflineReady() {
      showToast(t('offlineReady'))
    },
    onRegisteredSW(_url, registration) {
      // An installed app can stay open for days; check for new versions periodically.
      if (!registration) return
      setInterval(() => {
        if (navigator.onLine && !registration.installing) void registration.update()
      }, UPDATE_CHECK_MS)
    },
  })

  let installPrompt: BeforeInstallPromptEvent | null = null
  window.addEventListener('beforeinstallprompt', (event) => {
    // Show our own button instead of the browser's mini-infobar.
    event.preventDefault()
    installPrompt = event as BeforeInstallPromptEvent
    installButton.hidden = false
  })
  installButton.addEventListener('click', async () => {
    if (!installPrompt) return
    const prompt = installPrompt
    installPrompt = null
    installButton.hidden = true
    await prompt.prompt()
  })
  window.addEventListener('appinstalled', () => {
    installPrompt = null
    installButton.hidden = true
  })
}
