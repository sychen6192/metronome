import type { LanguagePreference } from './core/settings.ts'

const zh = {
  appTitle: '節拍器',
  pageTitle: '免費線上節拍器｜指揮拍式圖、重音、細分拍，可離線使用',
  pageDescription:
    '打開就能用的免費線上節拍器，不用下載、不用註冊。指揮拍式圖讓你用眼角就跟得上拍子；支援重音、八分／三連音／十六分／搖擺、打拍測速和速度練習，還能安裝到手機離線使用。',
  ogImageAlt: '節拍器 Metronome：指揮拍式圖與速度記號 ♩ = 120',
  featureList: '指揮拍式圖、重音與靜音、細分拍（八分、三連音、十六分、搖擺）、打拍測速、速度練習、離線使用、可安裝到主畫面',
  otherLanguage: 'This metronome is also in English.',
  switchLanguage: 'English',
  install: '安裝 App',
  installSteps: '點瀏覽器的「分享」按鈕，再選「加入主畫面」。',
  language: '語言',
  pattern: '拍式圖：指揮棒依拍子移動',
  play: '開始',
  stop: '停止',
  playTitle: '開始／停止（空白鍵）',
  tap: '打拍',
  tapTitle: '依點擊節奏設定速度（T）',
  tempo: '速度',
  tempoValue: '{bpm} BPM，{marking}',
  slower: '減慢',
  faster: '加快',
  slowerTitle: '減慢（↓，Shift+↓ 減 10）',
  fasterTitle: '加快（↑，Shift+↑ 加 10）',
  beatsGroup: '小節拍點',
  accentHint: '點數字切換：重音 → 一般 → 靜音',
  beatLabel: '第 {n} 拍：{state}',
  'accent.accent': '重音',
  'accent.normal': '一般',
  'accent.mute': '靜音',
  beats: '拍數',
  fewerBeats: '減少拍數',
  moreBeats: '增加拍數',
  subdivision: '細分拍',
  'sub.quarter': '四分音符',
  'sub.eighth': '八分音符',
  'sub.triplet': '三連音',
  'sub.sixteenth': '十六分音符',
  'sub.swing': '搖擺（Shuffle）',
  sound: '音色',
  'sound.click': '電子',
  'sound.wood': '木魚',
  'sound.beep': '嗶聲',
  'sound.cowbell': '牛鈴',
  volume: '音量',
  trainer: '加速練習',
  trainerToggle: '加速練習開關',
  trainerShort: '加速',
  trainerStep: '每次調整（BPM）',
  trainerEvery: '每幾小節',
  trainerTarget: '目標速度（BPM）',
  trainerHint: '開啟後，每隔指定小節自動朝目標速度調整；按停止回到起始速度。',
  trainerRule: '每 {bars} 小節 {step}',
  trainerRuleOne: '每小節 {step}',
  trainerDirection: '加速練習：朝 {target} BPM，{rule}',
  updateAvailable: '有新版本可用',
  reload: '重新載入',
  offlineReady: '已可離線使用',
  dismiss: '關閉',
  audioError: '無法啟動音訊，請再試一次',
  audioInterrupted: '音訊被系統中斷，已停止播放',
} as const

export type MessageKey = keyof typeof zh

const en: Record<MessageKey, string> = {
  appTitle: 'Metronome',
  pageTitle: 'Free Online Metronome with Conductor Beat Patterns',
  pageDescription:
    'A free online metronome that runs in your browser, with no download or sign-up. Follow the beat from the corner of your eye with a conductor’s beat pattern. Accents, subdivisions, tap tempo, a speed trainer, and it works offline.',
  ogImageAlt: 'Metronome: a conductor’s beat pattern and the tempo mark ♩ = 120',
  featureList: 'Conductor beat patterns, accented and muted beats, subdivisions (eighths, triplets, sixteenths, swing), tap tempo, speed trainer, works offline, installable',
  otherLanguage: '這個節拍器也有中文版。',
  switchLanguage: '中文',
  install: 'Install app',
  installSteps: 'Tap the browser’s Share button, then “Add to Home Screen”.',
  language: 'Language',
  pattern: 'Beat pattern: the baton moves with the beat',
  play: 'Start',
  stop: 'Stop',
  playTitle: 'Start / stop (Space)',
  tap: 'Tap',
  tapTitle: 'Set the tempo by tapping (T)',
  tempo: 'Tempo',
  tempoValue: '{bpm} BPM, {marking}',
  slower: 'Slower',
  faster: 'Faster',
  slowerTitle: 'Slower (↓, Shift+↓ for 10)',
  fasterTitle: 'Faster (↑, Shift+↑ for 10)',
  beatsGroup: 'Beats in the bar',
  accentHint: 'Tap a number to cycle: accent → normal → mute',
  beatLabel: 'Beat {n}: {state}',
  'accent.accent': 'accent',
  'accent.normal': 'normal',
  'accent.mute': 'muted',
  beats: 'Beats',
  fewerBeats: 'Fewer beats',
  moreBeats: 'More beats',
  subdivision: 'Subdivision',
  'sub.quarter': 'Quarter notes',
  'sub.eighth': 'Eighth notes',
  'sub.triplet': 'Triplets',
  'sub.sixteenth': 'Sixteenth notes',
  'sub.swing': 'Swing (shuffle)',
  sound: 'Sound',
  'sound.click': 'Click',
  'sound.wood': 'Wood block',
  'sound.beep': 'Beep',
  'sound.cowbell': 'Cowbell',
  volume: 'Volume',
  trainer: 'Speed trainer',
  trainerToggle: 'Speed trainer on/off',
  trainerShort: 'Trainer',
  trainerStep: 'Step (BPM)',
  trainerEvery: 'Every N bars',
  trainerTarget: 'Target tempo (BPM)',
  trainerHint: 'When on, the tempo moves towards the target every few bars. Stop returns to the starting tempo.',
  trainerRule: '{step} every {bars} bars',
  trainerRuleOne: '{step} every bar',
  trainerDirection: 'Speed trainer: towards {target} BPM, {rule}',
  updateAvailable: 'A new version is available',
  reload: 'Reload',
  offlineReady: 'Ready to work offline',
  dismiss: 'Dismiss',
  audioError: 'Could not start audio. Please try again.',
  audioInterrupted: 'Audio was interrupted, so playback stopped.',
}

export const LANGUAGES = ['zh-Hant', 'en'] as const
export type Language = (typeof LANGUAGES)[number]

const MESSAGES: Record<Language, Record<MessageKey, string>> = { 'zh-Hant': zh, en }

/** Every string of one language; the build uses it to write each language's page. */
export function messagesFor(language: Language): Readonly<Record<MessageKey, string>> {
  return MESSAGES[language]
}

/** The browser's first preference decides: any Chinese locale gets Traditional Chinese. */
export function detectLanguage(preferred: readonly string[]): Language {
  return (preferred[0] ?? '').toLowerCase().startsWith('zh') ? 'zh-Hant' : 'en'
}

/** The browser's language preference, as one of ours. */
export function browserLanguage(): Language {
  return detectLanguage(navigator.languages?.length ? navigator.languages : [navigator.language ?? ''])
}

/** An explicit choice wins; otherwise the language of the page (its URL) is used. */
export function resolveLanguage(preference: LanguagePreference, page: Language): Language {
  return preference === 'auto' ? page : preference
}

// Set from the page at startup; nothing here reads the browser at import time, so the build can use
// this module too.
let current: Language = 'zh-Hant'
let messages: Record<MessageKey, string> = MESSAGES[current]

export function setLanguage(language: Language): void {
  current = language
  messages = MESSAGES[language]
}

export function currentLanguage(): Language {
  return current
}

export function t(key: MessageKey, vars: Record<string, string | number> = {}): string {
  return messages[key].replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`))
}

/**
 * Fill static markup: `data-i18n` sets the text, `data-i18n-label` the aria-label and
 * `data-i18n-title` the tooltip.
 */
export function translatePage(root: ParentNode = document): void {
  document.documentElement.lang = current
  document.title = t('pageTitle')
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('pageDescription'))
  document.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute('content', t('appTitle'))
  for (const el of root.querySelectorAll<HTMLElement>('[data-i18n]')) {
    el.textContent = t(el.dataset.i18n as MessageKey)
  }
  for (const el of root.querySelectorAll<HTMLElement>('[data-i18n-label]')) {
    el.setAttribute('aria-label', t(el.dataset.i18nLabel as MessageKey))
  }
  for (const el of root.querySelectorAll<HTMLElement>('[data-i18n-title]')) {
    el.title = t(el.dataset.i18nTitle as MessageKey)
  }
}
