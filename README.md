# 節拍器 Metronome（PWA）

精準、可安裝、可離線使用的網頁節拍器。純 TypeScript，無 UI 框架，打包後 JS 約 12 KB（gzip）。

雙胞胎：[調音器 Tuner](https://github.com/sychen6192/tuner)，同一塊黑板、同一套樂譜字型的半音階調音器。

## 功能

- **20–300 BPM**：滑桿、± 按鈕（長按連續調整）、滑鼠滾輪、鍵盤方向鍵，並顯示義大利速度術語（Andante、Allegro…）
- **打拍測速（Tap tempo）**：在 pointerdown 時取樣，平均最近幾次間隔
- **每小節 1–16 拍**，每一拍可點擊切換 **重音 / 一般 / 靜音**
- **細分拍**：四分、八分、三連音、十六分、Swing（Shuffle）
- **四種音色**：電子、木魚、嗶聲、牛鈴（即時合成，不需下載音檔）
- **速度練習（Speed trainer）**：每 N 小節自動加速（或減速）到目標速度
- **視覺節拍**與實際聽到的聲音同步（扣除輸出延遲，藍牙耳機也準）
- 播放時**螢幕保持開啟**（Screen Wake Lock）
- iOS **靜音模式下仍會發聲**（Audio Session API）
- 設定自動儲存（localStorage），繁體中文 / 英文依瀏覽器語系切換，深色 / 淺色主題跟隨系統
- **PWA**：可安裝到主畫面、完全離線可用、有新版本時提示重新載入（播放中不會被強制刷新）

快捷鍵：`空白鍵` 開始/停止 · `↑ ↓` 調整速度（`Shift` ±10）· `T` 打拍

## 參考的 Best Practice

| 主題 | 參考來源 | 本專案的做法 |
| --- | --- | --- |
| 精準計時 | Chris Wilson〈[A Tale of Two Clocks](https://web.dev/articles/audio-scheduling)〉；GitHub 上星數最多的網頁節拍器 [cwilso/metronome](https://github.com/cwilso/metronome) | 不用 `setInterval` 直接發聲。由 **Web Worker** 每 25 ms 喚醒排程器，把未來 100 ms 內的拍子交給**取樣精準的 AudioContext 時鐘**（`source.start(time)`）。背景分頁時自動把預排時間拉長到 1.5 s，避免瀏覽器節流造成斷拍。 |
| 音色 | [padenot/metro](https://github.com/padenot/metro)（Firefox Web Audio 工程師） | 每種音色預先渲染成 `AudioBuffer`，播放時只建立 BufferSource，比每拍建一組 Oscillator 更省、更穩定。 |
| 視覺同步 | Web Audio `getOutputTimestamp()` / `outputLatency` | 排程的拍子先進佇列，`requestAnimationFrame` 依「目前喇叭正在播放的時間」取出，畫面不會比聲音早。 |
| 換拍不跳拍 | — | 時間以「與上一拍的間隔」累加，改速度、拍數、細分拍都從下一拍生效且時間永遠遞增。 |
| PWA | [vite-plugin-pwa](https://github.com/vite-pwa/vite-plugin-pwa) + Google [Workbox](https://github.com/GoogleChrome/workbox) | 建置時自動產生帶 revision 的 precache 清單，舊快取自動清除；`registerType: 'prompt'` 讓使用者決定何時更新；每小時檢查新版本。 |
| 圖示 | web.dev〈[Maskable icons](https://web.dev/articles/maskable-icon)〉 | `scripts/generate-icons.mjs`（sharp）從 `assets/icon-source.png` 產生：去背的 64/192/512 一般圖示、主體落在 40% 安全圓內的 maskable 圖示、滿版的 apple-touch-icon，以及 16/32/48 的 favicon.ico。maskable 與 Apple 圖示的背景沿用原圖漸層向外延伸，套上系統遮罩後不會有接縫或白角。 |

## 開發

需要 Node.js 20.19+ 或 22.12+。

```bash
npm install
npm run dev        # 開發伺服器
npm test           # 單元測試（Vitest）
npm run build      # 型別檢查 + 正式建置到 dist/
npm run preview    # 預覽正式版（Service Worker 只在正式版啟用）
npm run icons      # 替換 assets/icon-source.png 後重新產生所有圖示
```

> 音訊必須由使用者操作（點擊或按鍵）才能啟動，這是瀏覽器的自動播放政策。

## 部署

`main` 分支有新 commit 時，兩個 workflow 會各自測試、建置並發布。PWA 需要 HTTPS（`localhost` 除外）。

### GitHub Pages（`.github/workflows/deploy.yml`）

1. **Settings → General → Default branch** 設為 `main`。
2. **Settings → Pages → Source** 設為 **GitHub Actions**。
3. 網址：`https://<帳號>.github.io/metronome/`。

### Cloudflare Workers（`.github/workflows/deploy-cloudflare.yml`）

用 Cloudflare 建議的 [Workers static assets](https://developers.cloudflare.com/workers/static-assets/)（設定在 `wrangler.jsonc`）託管 `dist/`。沒設定 secrets 前，這個 workflow 會略過並顯示提示，不會失敗。

1. Cloudflare 後台 → **My Profile → API Tokens → Create Token**，選 **Edit Cloudflare Workers** 範本建立 token。
2. 在 Cloudflare 後台首頁（或 Workers & Pages）複製 **Account ID**。
3. GitHub repo → **Settings → Secrets and variables → Actions**，新增 `CLOUDFLARE_API_TOKEN` 與 `CLOUDFLARE_ACCOUNT_ID`。
4. 推送到 `main`，或在 Actions 手動執行 **Deploy to Cloudflare**。網址：`https://metronome.<你的子網域>.workers.dev`，可在 Cloudflare 後台綁定自訂網域。

`public/_headers` 讓帶 hash 的 `/assets/*` 快取一年；`index.html`、`sw.js` 維持每次重新驗證，Service Worker 才能即時更新。

### 其他靜態主機

建置時用環境變數 `BASE_PATH` 指定子路徑（例：`BASE_PATH=/metronome/ npm run build`），預設為 `/`，所以也能直接把 `dist/` 部署到 Netlify、Vercel 等網站根目錄。

## 專案結構

```
src/
  core/        純邏輯，無 DOM，可單元測試
    rhythm.ts      拍點、細分拍、重音
    sequencer.ts   依設定產生帶時間的拍子事件（含速度練習）
    tempo.ts       BPM 範圍、速度術語、打拍測速
    settings.ts    設定的預設值、驗證、儲存
  audio/
    engine.ts        AudioContext、lookahead 排程、延遲補償
    sounds.ts        音色合成
    timer.worker.ts  排程用的計時 Worker
  platform/    PWA 註冊與安裝、Screen Wake Lock
  ui/          音符圖示、提示訊息
  main.ts      介面綁定
tests/         Vitest 單元測試
```
