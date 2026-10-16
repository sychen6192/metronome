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
  guideTitle: '使用說明',
  guideIntro: '免費的線上節拍器，打開就能用：不用下載、不用註冊，也能安裝到手機離線使用。',
  faqPatternQ: '指揮拍式圖怎麼看？',
  faqPatternA: '黃點是指揮棒，照指揮的畫法走過小節的每一拍；它落到拍點的那一刻，就是點擊聲。正在響的那一拍，數字會變成實心。',
  faqAccentQ: '怎麼設定重音或靜音？',
  faqAccentA: '點拍點上的數字，依序切換重音、一般和靜音。黃色是重音，虛線圓圈是靜音。',
  faqSubQ: '細分拍和搖擺是什麼？',
  faqSubA: '細分拍會在每一拍之間加入較輕的點擊：八分、三連音或十六分。搖擺（Shuffle）把每拍分成一長一短，常用於爵士和藍調。',
  faqTapQ: '怎麼用打拍測速？',
  faqTapA: '跟著音樂連續點「打拍」（或按 T）四、五下，節拍器就會換成你點的速度。',
  faqTrainerQ: '速度練習怎麼用？',
  faqTrainerA: '設定每次調整幾 BPM、每幾小節調整一次和目標速度。開啟後會慢慢加快（或放慢）到目標，適合反覆練習困難的段落。',
  faqOfflineQ: '可以離線或安裝到手機嗎？',
  faqOfflineA: '可以。開過一次之後就能離線使用；在瀏覽器選單選「加入主畫面」或「安裝 App」，就能像一般 App 一樣開啟。',
  faqKeysQ: '有鍵盤快捷鍵嗎？',
  faqMarkingsQ: '速度術語是什麼意思？',
  faqMarkingsA: 'Largo 很慢（約 45–60 BPM）、Adagio 慢（66–76）、Andante 如行走（76–108）、Moderato 中速（108–120）、Allegro 快（120–156）、Presto 急速（176–200）。調整速度時，上方會顯示對應的術語。',
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
  pageTitle: 'Free Online Metronome with Conductor Beat Patterns',
  pageDescription:
    'A free online metronome that runs in your browser, with no download or sign-up. Follow the beat from the corner of your eye with a conductor’s beat pattern. Accents, subdivisions, tap tempo, a speed trainer, and it works offline.',
  ogImageAlt: 'Metronome: a conductor’s beat pattern and the tempo mark ♩ = 120',
  featureList: 'Conductor beat patterns, accented and muted beats, subdivisions (eighths, triplets, sixteenths, swing), tap tempo, speed trainer, works offline, installable',
  otherLanguage: '這個節拍器也有中文版。',
  switchLanguage: '中文',
  guideTitle: 'How to use',
  guideIntro: 'A free online metronome that works right in your browser: no download, no sign-up, and you can install it to use offline.',
  faqPatternQ: 'How do I read the beat pattern?',
  faqPatternA: 'The yellow dot is the baton. It traces the bar the way a conductor does and lands on each beat exactly on the click. The number of the beat that is sounding turns solid.',
  faqAccentQ: 'How do I accent or mute a beat?',
  faqAccentA: 'Tap a beat’s number to cycle it through accent, normal and mute. Yellow means accented; a dashed ring means muted.',
  faqSubQ: 'What are subdivisions and swing?',
  faqSubA: 'Subdivisions add quieter clicks between the beats: eighths, triplets or sixteenths. Swing (shuffle) splits each beat into a long and a short click, as in jazz and blues.',
  faqTapQ: 'How does tap tempo work?',
  faqTapA: 'Tap the Tap button (or press T) four or five times along with the music, and the metronome takes on your tempo.',
  faqTrainerQ: 'How does the speed trainer work?',
  faqTrainerA: 'Choose how many BPM to change, how often in bars, and the target tempo. Once on, it speeds up (or slows down) bit by bit to the target, which is ideal for drilling a hard passage.',
  faqOfflineQ: 'Does it work offline? Can I install it?',
  faqOfflineA: 'Yes. After your first visit it works offline. Choose “Add to Home Screen” or “Install app” in your browser’s menu to open it like any other app.',
  faqKeysQ: 'Are there keyboard shortcuts?',
  faqMarkingsQ: 'What do the tempo markings mean?',
  faqMarkingsA: 'Largo is very slow (about 45–60 BPM), Adagio slow (66–76), Andante a walking pace (76–108), Moderato moderate (108–120), Allegro fast (120–156) and Presto very fast (176–200). The marking above the tempo follows as you change it.',
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
