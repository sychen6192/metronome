// Ticks the audio scheduler from a worker: timers on the main thread are delayed by layout and
// rendering, and browsers throttle them heavily in background tabs.

export type TimerMessage = { type: 'start'; interval: number } | { type: 'stop' }

let timer: ReturnType<typeof setInterval> | undefined

self.onmessage = (event: MessageEvent<TimerMessage>) => {
  clearInterval(timer)
  timer = undefined
  if (event.data.type === 'start') {
    timer = setInterval(() => self.postMessage('tick'), event.data.interval)
  }
}
