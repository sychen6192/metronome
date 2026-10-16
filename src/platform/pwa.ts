import { registerSW } from 'virtual:pwa-register'
import { actionPending, showToast } from '../ui/toast'

/** Chromium-only event, not in the TypeScript DOM library. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const UPDATE_CHECK_MS = 60 * 60 * 1000

export function setupPwa(installButton: HTMLButtonElement, isPlaying: () => boolean): void {
  // Updates wait for the user to press "Reload" so a new version never interrupts playback.
  let reloadRequested = false
  const updateServiceWorker = registerSW({
    onNeedRefresh() {
      showToast('updateAvailable', {
        label: 'reload',
        run: () => {
          reloadRequested = true
          void updateServiceWorker(true)
        },
      })
    },
    // The new version took over. That also happens when "Reload" was pressed in another window
    // of the app, so only reload here if this window asked for it or isn't playing.
    onNeedReload() {
      if (reloadRequested || !isPlaying()) {
        window.location.reload()
      } else {
        showToast('updateAvailable', { label: 'reload', run: () => window.location.reload() })
      }
    },
    onOfflineReady() {
      // On a first visit this can arrive while a choice is on screen (the page in the other
      // language); the choice matters more than this note, so the note isn't shown over it.
      if (!actionPending()) showToast('offlineReady')
    },
    onRegisteredSW(_url, registration) {
      // An installed app can stay open for days; check for new versions periodically.
      if (!registration) return
      setInterval(() => {
        if (navigator.onLine && !registration.installing) void registration.update()
      }, UPDATE_CHECK_MS)
    },
  })

  // iPhone and iPad browsers never offer an install prompt; Add to Home Screen sits in the Share
  // menu, so the button shows the steps instead.
  const manualInstall = needsManualInstall()
  if (manualInstall) installButton.hidden = false

  let installPrompt: BeforeInstallPromptEvent | null = null
  window.addEventListener('beforeinstallprompt', (event) => {
    // Show our own button instead of the browser's mini-infobar.
    event.preventDefault()
    installPrompt = event as BeforeInstallPromptEvent
    installButton.hidden = false
  })
  installButton.addEventListener('click', async () => {
    if (!installPrompt) {
      if (manualInstall) showToast('installSteps', undefined, { sticky: true })
      return
    }
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

/** On iOS or iPadOS, in the browser rather than opened from the Home Screen. */
function needsManualInstall(): boolean {
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const fromHomeScreen =
    matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
  return ios && !fromHomeScreen
}
