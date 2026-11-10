// The window's side of OnKey's records (src-tauri/src/records.rs): while the lane draws a playing song, how evenly
// it draws (frame intervals, frames dropped) and how late the engine's updates reach the window. Summed up and
// sent every 5 s while it draws (numbers only); nothing is kept or sent while nothing plays. Costs a push per
// frame and one call every 5 s.

const EVERY_MS = 5000;
const intervals: number[] = [];
const lags: number[] = [];
let last = 0, target = 1000 / 60, timer = 0;

const inApp = () => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

/** The lane drew a frame of a playing song at `perfNow`, aiming at `fps` frames a second. */
export function frameDrawn(perfNow: number, fps: number) {
  if (!inApp()) return;
  if (last && perfNow - last < 1000) intervals.push(perfNow - last);
  last = perfNow;
  target = 1000 / fps;
  if (!timer) timer = window.setTimeout(flush, EVERY_MS);
}

/** The lane stopped drawing (paused, hidden): the time until it draws again isn't a dropped frame. */
export function frameIdle() {
  last = 0;
}

/** An update from the engine arrived; `atMs` is when it left (epoch ms). */
export function updateArrived(atMs: unknown) {
  if (typeof atMs !== "number" || !inApp()) return;
  const lag = Date.now() - atMs;
  if (lag > -1000 && lag < 60_000 && lags.length < 2000) lags.push(lag);
}

const pct = (v: number[], p: number) => v.length ? v[Math.min(v.length - 1, Math.round((v.length - 1) * p))] : null;
const r1 = (x: number | null) => x == null ? null : Math.round(x * 10) / 10;

/** The last 5 s summed up (exported for tests). */
export function summary(iv: number[], lg: number[], targetMs: number) {
  const s = [...iv].sort((a, b) => a - b), l = [...lg].sort((a, b) => a - b);
  // a frame drawn 2.5 intervals after the one before missed one or two in between
  const dropped = iv.reduce((n, i) => n + Math.max(0, Math.round(i / targetMs) - 1), 0);
  return { frames: iv.length, target_ms: r1(targetMs), p50_ms: r1(pct(s, 0.5)), p95_ms: r1(pct(s, 0.95)), max_ms: r1(pct(s, 1)),
           dropped, updates: lg.length, update_lag_p50_ms: r1(pct(l, 0.5)), update_lag_p95_ms: r1(pct(l, 0.95)) };
}

async function flush() {
  timer = 0;
  if (!intervals.length) { lags.length = 0; return; }
  const report = summary(intervals, lags, target);
  intervals.length = 0; lags.length = 0;
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("perf_frames", { report });
  } catch { /* an older engine without the records: nothing to tell */ }
}
