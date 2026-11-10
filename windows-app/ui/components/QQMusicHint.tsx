"use client";
// The Windows Chinese build follows the user's own music clients, not a hosted catalogue.
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MicCheck } from "@/components/Setup";
import { localMusicStatus, setupStatus, type LocalMusicClient, type LocalMusicStatus, type Perm } from "@/lib/session";

function clientText(client: LocalMusicClient | undefined, netease: boolean): string {
  if (!client) return "尚未检查";
  if (!client.running) return "未打开：请先打开客户端";
  if (!client.recognized) return netease ? "未识别歌曲：请选歌，并在设置 → 系统开启 SMTC" : "未识别歌曲：请在客户端选歌播放";
  return client.playing ? "已识别，正在播放" : "已识别，当前暂停";
}

export function LengthNote({ compact = false, learning = false }: { compact?: boolean; learning?: boolean }) {
  return <span title="播放器未提供准确时长，分析覆盖率不能证明整首歌已经学完。请确认从头听到自然结束。" className="text-amber-300">{compact ? "完整度待确认" : learning ? "时长未知，请从头播放到自然结束。" : "已分析播放的片段；请确认歌曲从头播放到自然结束。"}</span>;
}

export function DeviceCheck() {
  const [open, setOpen] = useState(false);
  return <>
    <button onClick={() => setOpen(true)} className="rounded-full px-2.5 py-1 text-xs text-ink-300 transition hover:bg-white/6 hover:text-white">设备检查</button>
    {open && createPortal(<div className="fixed inset-0 z-40 flex items-center justify-center bg-ink-950/90 p-6"><div role="dialog" aria-modal="true" aria-label="设备检查" className="glass w-full max-w-lg rounded-3xl p-6"><div className="flex items-center justify-between"><strong className="text-ink-100">设备检查</strong><button aria-label="关闭设备检查" onClick={() => setOpen(false)} className="text-ink-300 hover:text-white">×</button></div><QQMusicHint /></div></div>, document.body)}
  </>;
}

export default function QQMusicHint() {
  const [music, setMusic] = useState<LocalMusicStatus | null>(null);
  const [mic, setMic] = useState<Perm | null>(null);
  const [failed, setFailed] = useState(false);
  const [checking, setChecking] = useState(false);
  const [micOpen, setMicOpen] = useState(false);
  const refresh = useCallback(async () => {
    setChecking(true);
    const [m, p] = await Promise.allSettled([localMusicStatus(), setupStatus()]);
    setMusic(m.status === "fulfilled" ? m.value : null);
    setMic(p.status === "fulfilled" ? p.value.mic : null);
    setFailed(m.status === "rejected" || p.status === "rejected");
    setChecking(false);
  }, []);
  useEffect(() => {
    void refresh();
    const id = window.setInterval(refresh, 10000);
    window.addEventListener("focus", refresh);
    return () => { clearInterval(id); window.removeEventListener("focus", refresh); };
  }, [refresh]);
  const rows: [string, string][] = [
    ["QQ 音乐", clientText(music?.qq, false)],
    ["网易云音乐", clientText(music?.netease, true)],
    ["麦克风", mic == null ? "尚未检查" : mic === "granted" ? "权限已开启；可测试声音" : mic === "denied" || mic === "restricted" ? "权限不可用：请在 Windows 设置中开启" : "权限状态待确认，请进行测试"],
  ];
  return <>
    <div className="mt-4 w-full rounded-2xl border border-white/8 bg-white/4 p-4 text-left text-sm">
      <div className="flex items-center justify-between gap-3"><strong className="font-semibold text-ink-100">开始练唱</strong><button onClick={() => void refresh()} disabled={checking} className="text-xs text-accent-300 hover:text-white disabled:opacity-50">{checking ? "检查中…" : "刷新状态"}</button></div>
      <p className="mt-2 text-xs leading-relaxed text-ink-300">① 在音乐客户端选歌并从头完整播放　② 等待助手分析完成　③ 再从头播放并跟唱</p>
      <div className="mt-3 space-y-2 border-t border-white/6 pt-3" aria-live="polite">
        {rows.map(([name, text]) => <div key={name} className="flex items-start justify-between gap-3 text-xs"><span className="shrink-0 font-medium text-ink-200">{name}</span><span className="text-right text-ink-400">{text}</span></div>)}
      </div>
      {failed && <p role="status" className="mt-2 text-xs text-amber-300">状态检查暂时失败，请刷新重试。</p>}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><button onClick={() => setMicOpen(true)} disabled={mic == null} className="rounded-lg bg-white/8 px-3 py-1.5 text-xs text-ink-100 hover:bg-white/12 disabled:opacity-50">测试麦克风</button><span className="text-xs text-ink-400">播放 / 暂停：下方按钮或空格键</span></div>
      <p className="mt-3 text-xs leading-relaxed text-ink-400">网易云的歌曲时长可能未知，提前切歌会导致完整度不准。请从头听到自然结束。</p>
    </div>
    {micOpen && createPortal(<div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/90 p-6"><div role="dialog" aria-modal="true" aria-label="测试麦克风" className="glass w-full max-w-lg rounded-3xl p-7 text-left"><div className="mb-3 text-right"><button aria-label="关闭麦克风测试" onClick={() => setMicOpen(false)} className="text-ink-300 hover:text-white">×</button></div><MicCheck win micOk={mic === "granted"} onNext={() => setMicOpen(false)} onBack={() => setMicOpen(false)} /></div></div>, document.body)}
  </>;
}
