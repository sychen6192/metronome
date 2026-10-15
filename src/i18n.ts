const zh = {
  appTitle: '節拍器',
  install: '安裝 App',
  play: '開始',
  stop: '停止',
  tap: '打拍',
  tapTitle: '依點擊節奏設定速度（T）',
  tempo: '速度',
  slower: '減慢',
  faster: '加快',
  beatsGroup: '小節拍點',
  accentHint: '點拍點切換：重音 → 一般 → 靜音',
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
  shortcuts: '快捷鍵：空白鍵 開始／停止 · ↑↓ 調整速度（Shift ±10）· T 打拍',
  updateAvailable: '有新版本可用',
  reload: '重新載入',
  offlineReady: '已可離線使用',
  dismiss: '關閉',
  audioError: '無法啟動音訊，請再試一次',
} as const

export type MessageKey = keyof typeof zh

const en: Record<MessageKey, string> = {
  appTitle: 'Metronome',
  install: 'Install app',
  play: 'Start',
  stop: 'Stop',
  tap: 'Tap',
  tapTitle: 'Set the tempo by tapping (T)',
  tempo: 'Tempo',
  slower: 'Slower',
  faster: 'Faster',
  beatsGroup: 'Beats in the bar',
  accentHint: 'Tap a beat to cycle: accent → normal → mute',
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
  shortcuts: 'Shortcuts: Space start/stop · ↑↓ tempo (Shift ±10) · T tap',
  updateAvailable: 'A new version is available',
  reload: 'Reload',
  offlineReady: 'Ready to work offline',
  dismiss: 'Dismiss',
  audioError: 'Could not start audio. Please try again.',
}

const useChinese = (navigator.languages?.[0] ?? navigator.language ?? '').toLowerCase().startsWith('zh')
const messages: Record<MessageKey, string> = useChinese ? zh : en
export const lang = useChinese ? 'zh-Hant' : 'en'

export function t(key: MessageKey, vars: Record<string, string | number> = {}): string {
  return messages[key].replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`))
}

/**
 * Fill static markup: `data-i18n` sets the text, `data-i18n-label` the aria-label and
 * `data-i18n-title` the tooltip.
 */
export function translatePage(root: ParentNode = document): void {
  document.documentElement.lang = lang
  document.title = `${t('appTitle')}${useChinese ? ' Metronome' : ''}`
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
