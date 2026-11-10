"use client";
import { useEffect, useState } from "react";
import { shareTake, shareWindow, type ShareWindow } from "@/lib/session";

/** "Share": a 20-second vertical video of your voice and the notes, to post with the song added in Instagram from
 *  its own music library (OnKey adds no music: the voice is the take as recorded). Starts on a whole second of the song so it lines up. */
export default function SharePanel({ id, song, t, onClose, onShow, onPlay }:
    { id: string; song: string; t: number; onClose: () => void; onShow: (graphS: number) => void; onPlay: (graphS: number) => void }) {
  const [win, setWin] = useState<ShareWindow | null>(null);
  const [mode, setMode] = useState<"playhead" | "best">("playhead");
  const [noBest, setNoBest] = useState(false);
  const [state, setState] = useState<"idle" | "making" | "done" | "failed">("idle");
  const [msg, setMsg] = useState("");
  useEffect(() => { void shareWindow(id, t).then(setWin); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  // the chosen clip is shown on the take's graph
  useEffect(() => { if (win) onShow(win.graph); }, [win?.start]); // eslint-disable-line react-hooks/exhaustive-deps

  const fromPlayhead = async () => {
    const w = await shareWindow(id, t);
    if (w) { setWin(w); setNoBest(false); setMode("playhead"); }
  };
  const best = async () => {
    const w = await shareWindow(id);
    setNoBest(!w);
    if (w) { setWin(w); setMode("best"); }
  };
  const make = async () => {
    if (!win) return;
    setState("making"); setMsg("");
    try {
      const r = await shareTake(id, win.start);
      setState("done");
      setMsg(`视频已保存到“下载”。如需配乐，请在发布平台添加 ${song} ，起点设置为 ${r.at} （已复制）。`);
    } catch (e) {
      setState("failed");
      setMsg(`生成视频失败： ${String(e)}`);
    }
  };

  return (
    <div className="mt-3 rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-ink-100">
          {win ? <><b className="tabular">{win.at}–{win.to}</b><span className="text-ink-400"> · {win.hits} / {win.notes} 个音符唱准</span></> : "正在查找片段…"}
        </span>
        <span className="flex rounded-lg bg-white/6 p-0.5" role="radiogroup" aria-label="选择 20 秒片段">
          {([["playhead", "从当前位置", fromPlayhead], ["best", "最佳片段", best]] as const).map(([k, label, run]) => (
            <button key={k} role="radio" aria-checked={mode === k} onClick={() => void run()}
                    className={`rounded-md px-2.5 py-1 transition ${mode === k ? "bg-white/12 text-white" : "text-ink-300 hover:text-white"}`}>
              {label}
            </button>
          ))}
        </span>
        <button disabled={!win} onClick={() => win && onPlay(win.graph)} className="inline-flex items-center gap-1 text-ink-200 transition hover:text-white disabled:opacity-50">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
          播放预览
        </button>
        <span className="ml-auto flex items-center gap-2">
          <button disabled={!win || state === "making"} onClick={() => void make()}
                  className="rounded-xl bg-accent-500 px-4 py-2 font-medium text-white shadow-lg shadow-accent-600/25 transition hover:bg-accent-400 disabled:opacity-60">
            {state === "making" ? "正在生成视频…" : "生成视频"}
          </button>
          <button onClick={onClose} className="px-1 text-ink-400 transition hover:text-white" aria-label="关闭">✕</button>
        </span>
      </div>
      <p className={`mt-2 text-xs ${state === "failed" ? "text-red-300" : state === "done" ? "text-accent-200" : "text-ink-400"}`}>
        {msg || (noBest ? "本次没有唱准的音符，片段将从当前位置开始。"
          : "视频包含你的录音、音符和评分。使用耳机录制，可以减少原曲混入你的录音。")}
      </p>
    </div>
  );
}
