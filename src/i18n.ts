import type { LanguagePreference } from './core/settings'

const zh = {
  appTitle: '節拍器',
  install: '安裝 App',
  language: '語言',
  pattern: '拍式圖：指揮棒依拍子移動',
  play: '開始',
  stop: '停止',
  tap: '打拍',
  tapTitle: '依點擊節奏設定速度（T）',
  tempo: '速度',
  tempoValue: '{bpm} BPM，{marking}',
  slower: '減慢',
  faster: '加快',
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
  trainer: '速度練習',
  trainerToggle: '速度練習開關',
  trainerShort: '練習',
  trainerOn: '開啟中',
  trainerOff: '關閉',
  trainerStep: '每次調整（BPM）',
  trainerEvery: '每幾小節',
  trainerTarget: '目標速度（BPM）',
  trainerHint: '開啟後，每隔指定小節自動朝目標速度調整，到達後維持不變。',
  shortcutsLabel: '快捷鍵：',
  shortcutPlay: '空白鍵 開始／停止',
  shortcutTempo: '↑↓ 調整速度（Shift ±10）',
  shortcutTap: 'T 打拍',
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
  install: 'Install app',
  language: 'Language',
  pattern: 'Beat pattern: the baton moves with the beat',
  play: 'Start',
  stop: 'Stop',
  tap: 'Tap',
  tapTitle: 'Set the tempo by tapping (T)',
  tempo: 'Tempo',
  tempoValue: '{bpm} BPM, {marking}',
  slower: 'Slower',
  faster: 'Faster',
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
  trainerOn: 'on',
  trainerOff: 'off',
  trainerStep: 'Step (BPM)',
  trainerEvery: 'Every N bars',
  trainerTarget: 'Target tempo (BPM)',
  trainerHint: 'When on, the tempo moves towards the target every few bars, then stays there.',
  shortcutsLabel: 'Shortcuts:',
  shortcutPlay: 'Space start/stop',
  shortcutTempo: '↑↓ tempo (Shift ±10)',
  shortcutTap: 'T tap',
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

/** The browser's first preference decides: any Chinese locale gets Traditional Chinese. */
export function detectLanguage(preferred: readonly string[]): Language {
  return (preferred[0] ?? '').toLowerCase().startsWith('zh') ? 'zh-Hant' : 'en'
}

export function resolveLanguage(preference: LanguagePreference): Language {
  if (preference !== 'auto') return preference
  return detectLanguage(navigator.languages?.length ? navigator.languages : [navigator.language ?? ''])
}

let current: Language = resolveLanguage('auto')
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
  document.title = current === 'zh-Hant' ? `${t('appTitle')} Metronome` : t('appTitle')
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
