"use client";
// Settings: every switch is something you allow. "Let OnKey control" Spotify, Apple Music (on by default) and YouTube in
// your browser (opt-in): all three off is listening only (settings.rs `listen_only`; there's no switch of its own). Then
// "Use Shazam to name new songs" (on by default; off, nothing is sent to Apple), "Show lyrics" (on by default; off, LRCLIB
// isn't asked) and the microphone. (The output timing check, components/TimingCheck.tsx, is retired: see
// timing::CHECK_RETIRED.)
import QQMusicConnection from "@/components/QQMusicConnection";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo, Nav } from "@/components/Nav";
import { reportProblem } from "@/components/ReportProblem";
import { checkForUpdate, restartToUpdate, setAutoUpdate, useUpdate } from "@/lib/update";
import { allowControl, getMics, getSettings, openLink, setMic, setSetting, setupControl, setYouTube, type Mics, type Settings } from "@/lib/session";

/** Which microphone OnKey listens to: automatic (the Mac's input, as chosen in System Settings → Sound) or one
 *  picked here. Setup's mic check and your takes use the same one. */
function MicPicker() {
  const [m, setM] = useState<Mics | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => getMics().then(v => { if (alive) setM(v); }).catch(() => {});
    load();
    const t = window.setInterval(() => { if (document.visibilityState === "visible") load(); }, 3000);   // a mic plugged in or out shows up
    return () => { alive = false; clearInterval(t); };
  }, []);
  if (!m) return null;
  const missing = m.preferred != null && !m.devices.some(d => d.uid === m.preferred);
  const pick = async (uid: string) => { await setMic(uid === "" ? null : uid); setM(await getMics()); };
  return (
    <>
      <h2 className="mt-8 mb-2 px-1 text-sm font-medium text-ink-200">麦克风</h2>
      <section className="glass overflow-hidden rounded-3xl">
        <div className="flex items-start justify-between gap-6 px-5 py-4">
          <div className="min-w-0">
            <label htmlFor="set-mic" className="text-sm font-medium text-ink-100">输入设备</label>
            <p className="mt-1 text-xs text-ink-400">
              {m.chosen ? <>当前： {m.chosen.name}.</> : <span className="text-amber-200">没有连接麦克风。</span>}{" "}
              {missing ? "你选择的麦克风未连接，暂时使用 Mac 的默认输入设备。" : ""}
              自动模式使用 Mac 的默认输入设备。为了保持蓝牙耳机的播放音质，会优先使用 Mac 内置麦克风。
            </p>
          </div>
          <select id="set-mic" value={m.preferred ?? ""} onChange={e => pick(e.target.value)}
                  className="mt-0.5 max-w-56 shrink-0 rounded-lg border border-white/8 bg-white/4 px-2.5 py-1.5 text-sm text-ink-100 outline-none focus:border-accent-400">
            <option value="">自动选择</option>
            {m.devices.map(d => <option key={d.uid} value={d.uid}>{d.name}</option>)}
            {missing && <option value={m.preferred!}>未连接</option>}
          </select>
        </div>
      </section>
    </>
  );
}

/** Updates: this version, "Check for updates automatically" (on), and "Check now". */
function Updates() {
  const [u, setU] = useUpdate();
  const [busy, setBusy] = useState(false);
  if (!u) return null;
  const check = async () => { setBusy(true); try { setU(await checkForUpdate()); } finally { setBusy(false); } };
  const line = !u.supported ? "本地修改版，更新由本项目单独管理。"
    : u.waiting ? `唱准 ${u.available} 会在这首歌结束后安装，然后重新启动。`
    : u.state === "ready" ? `唱准 ${u.available} 已准备好，重启即可更新。`
    : u.state === "downloading" ? `正在下载更新 ${u.available}…`
    : u.state === "checking" ? "正在检查…"
    : u.state === "current" ? "当前已是最新版本。"
    : u.state === "error" ? "暂时无法检查更新。"
    : "";
  return (
    <>
      <div className="flex items-start justify-between gap-6 border-b border-white/6 px-5 py-4">
        <div className="min-w-0">
          <div className="text-sm font-medium text-ink-100">唱准 {u.version}</div>
          {line && <p className="mt-1 text-xs text-ink-400">{line}</p>}
        </div>
        {u.supported && (u.state === "ready" && !u.waiting
          ? <button onClick={async () => setU(await restartToUpdate())}
                    className="shrink-0 rounded-lg bg-accent-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-accent-400">重启并更新</button>
          : <button onClick={check} disabled={busy || u.state === "checking" || u.state === "downloading" || u.waiting}
                    className="shrink-0 rounded-lg border border-white/8 bg-white/4 px-3 py-1.5 text-sm text-ink-100 transition hover:bg-white/8 disabled:opacity-40">检查更新</button>)}
      </div>
      {u.supported && (
        <Row id="set-auto-update" title="自动检查更新" on={u.auto} onChange={async on => setU(await setAutoUpdate(on))}
             sub="定期检查新版本，歌曲播放期间不会安装更新。" />
      )}
    </>
  );
}

function Row({ id, title, sub, on, onChange, badge, warn, disabled }: {
  id: string; title: string; sub: string; on: boolean; onChange: (on: boolean) => void; badge?: string; warn?: boolean; disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-white/6 px-5 py-4 last:border-0">
      <div className="min-w-0">
        <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-ink-100">
          {title}
          {badge && <span className={`rounded-full px-1.5 py-px text-[10px] font-normal ${warn ? "bg-amber-400/12 text-amber-200" : "bg-white/6 text-ink-300"}`}>{badge}</span>}
        </label>
        <p className="mt-1 text-xs text-ink-400">{sub}</p>
      </div>
      <button id={id} role="switch" aria-checked={on} disabled={disabled} onClick={() => onChange(!on)}
              className={`relative mt-0.5 h-6 w-10 shrink-0 rounded-full transition disabled:opacity-40 ${on ? "bg-accent-500" : "bg-white/12"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [s, setS] = useState<Settings | null>(null);
  useEffect(() => { getSettings().then(setS).catch(() => setS(null)); }, []);
  // listening only: Spotify, Apple Music and YouTube all off (settings.rs `listen_only`)
  const listenOnly = !!s?.listen_only;
  const change = async (key: Parameters<typeof setSetting>[0] | "youtube", on: boolean) => {
    if (key === "youtube") await setYouTube(on);
    else if (key === "keep_models" || key === "battery_30fps" || key === "voice_breaks" || key === "shazam" || key === "show_lyrics") await setSetting(key, on);
    else if ((key === "control_spotify" || key === "control_music") && !on && s && !s.listening) {
      // the older way (following the apps by asking them, which controls both): turning one off moves to listening,
      // with the other app still allowed, as the old "Listen only" switch's way out did
      await setupControl(true);
      await setSetting(key, false);
    }
    else if (on && key !== "listening") await allowControl(key);
    else await setSetting(key, on);
    setS(await getSettings());
  };

  return (
    <div className="min-h-dvh bg-[radial-gradient(1200px_500px_at_50%_-10%,rgba(124,108,246,.10),transparent)]">
      <header data-tauri-drag-region className="app-header flex items-center gap-5 px-6 pt-4 pb-3"><Logo /><Nav /></header>
      <main className="mx-auto max-w-2xl px-6 pb-16">
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">设置</h1>
        <QQMusicConnection />
        {!s ? <div className="glass mt-6 h-40 rounded-3xl shimmer" /> : (
          <>
            <h2 className="mt-6 mb-2 px-1 text-sm font-medium text-ink-200">允许唱准控制音乐 App</h2>
            <p className="mb-3 px-1 text-xs text-ink-400">
              {s.listening
                ? "允许后可准确读取歌名和播放位置，并通过网页播放、暂停、跳转和切歌。macOS 会分别询问每个 App 的权限。"
                : "通过读取 Spotify 和 Apple Music 的播放信息来跟随歌曲。"}
            </p>
            <section className="glass overflow-hidden rounded-3xl">
              <Row id="set-spotify" title="Spotify" on={!s.listening || s.control_spotify} onChange={on => change("control_spotify", on)}
                   sub="通过唱准控制 Spotify 的播放、暂停和切歌。" />
              <Row id="set-music" title="Apple Music" on={!s.listening || s.control_music} onChange={on => change("control_music", on)}
                   sub="控制“音乐”App，支持你的音乐资料库中的歌曲。" />
              <Row id="set-youtube" title="浏览器里的 YouTube" badge="需要浏览器权限" warn on={s.youtube} onChange={on => change("youtube", on)}
                   sub="读取并控制 Chrome、Brave、Edge 或 Safari 的 YouTube 标签页。需要在浏览器开启“允许来自 Apple 事件的 JavaScript”。" />
            </section>
            {s.listening && (
              <p role="status" className="mt-3 px-1 text-xs text-ink-400">
                {listenOnly
                  ? <>当前只通过声音跟随歌曲，无法控制播放。关闭这里的选项不会撤回系统权限；可在“系统设置 → 隐私与安全性 → 自动化”中管理。</>
                  : "本地修改版请至少允许读取一个音乐 App，才能准确识别新歌曲。"}
              </p>
            )}
            <section className="glass mt-8 overflow-hidden rounded-3xl">
              <div className="px-5 py-4 border-b border-white/6"><p className="text-sm">歌曲识别方式</p><p className="mt-1 text-xs text-ink-400">本地版本通过已连接的 QQ 音乐网页、Apple Music 或 Spotify 读取歌名；原作者签名下的 Shazam 在线识曲不可用。</p></div>
              {s.listening && !s.control_spotify && !s.control_music && !s.qqmusic && s.shazam === false && (
                <p role="status" className="bg-amber-400/8 px-5 py-3 text-xs text-amber-200">
                  请连接 QQ 音乐网页，或允许读取 Apple Music / Spotify，以便学习新歌曲。
                </p>
              )}
            </section>
            <h2 className="mt-8 mb-2 px-1 text-sm font-medium text-ink-200">歌词</h2>
            <section className="glass overflow-hidden rounded-3xl">
              <Row id="set-show-lyrics" title="显示歌词" on={s.show_lyrics !== false} onChange={on => change("show_lyrics", on)}
                   sub="歌词来自 LRCLIB 社区数据库。关闭后不再请求歌词，音准轨道和评分仍可正常使用。" />
            </section>
          </>
        )}
        <MicPicker />
        {s && (
          <>
            <h2 className="mt-8 mb-2 px-1 text-sm font-medium text-ink-200">嗓音休息</h2>
            <section className="glass overflow-hidden rounded-3xl">
              <Row id="set-voice-breaks" title="提醒我休息" on={s.voice_breaks !== false} onChange={on => change("voice_breaks", on)}
                   sub="连续练唱约 35 分钟后提醒休息；停止练唱 20 分钟后重新计时。" />
            </section>
            <h2 className="mt-8 mb-2 px-1 text-sm font-medium text-ink-200">性能</h2>
            <section className="glass overflow-hidden rounded-3xl">
              <Row id="set-battery-30" title="使用电池时节省电量" on={s.battery_30fps !== false} onChange={on => change("battery_30fps", on)}
                   sub="电池供电时将音准轨道降至每秒 30 帧，减少绘制消耗。" />
              {!s.small_mac && <Row id="set-keep-models" title="保持学习模型就绪" on={!!s.keep_models} onChange={on => change("keep_models", on)}
                   sub="加快新歌曲学习，但会多占用约 1.5 GB 内存。关闭后只在学习时加载模型。32 GB 及以上内存的 Mac 默认开启。" />}
            </section>
          </>
        )}
        <h2 className="mt-8 mb-2 px-1 text-sm font-medium text-ink-200">关于</h2>
        <section className="glass overflow-hidden rounded-3xl">
          <Updates />
          <button onClick={() => reportProblem()} className="flex w-full items-center justify-between gap-6 border-b border-white/6 px-5 py-4 text-left text-sm text-ink-100 hover:bg-white/4">
            <span>
              导出诊断报告
              <span className="mt-1 block text-xs text-ink-400">将本地日志和时间信息导出为 ZIP，便于排查问题。可先查看内容；不包含歌词或音频，也不会自动上传。</span>
            </span>
            <span aria-hidden className="text-ink-400">›</span>
          </button>
          <button onClick={() => void openLink("https://discord.gg/afHvqTNS6r")}
                  className="flex w-full items-center justify-between gap-6 border-b border-white/6 px-5 py-4 text-left text-sm text-ink-100 hover:bg-white/4">
            <span>
              原项目社区
              <span className="mt-1 block text-xs text-ink-400">查看原项目的使用讨论和反馈。</span>
            </span>
            <span aria-hidden className="text-ink-400">↗</span>
          </button>
          <div className="flex items-center gap-3 border-b border-white/6 px-5 py-4 text-sm text-ink-100">
            <img src="/dsmurrell.png" alt="" width={20} height={20} className="rounded" />
            <span>
              原作作者 <a href="https://dsmurrell.com" onClick={e => { e.preventDefault(); void openLink("https://dsmurrell.com"); }}
                         className="underline-offset-2 hover:underline">Daniel Murrell</a>
              <span className="mt-1 block text-xs italic text-ink-500">唱准 · 中文网页个人版，基于 OnKey 修改</span>
            </span>
          </div>
          <Link href="/licences" className="flex items-center justify-between gap-6 px-5 py-4 text-sm text-ink-100 hover:bg-white/4">
            <span>
              开源许可
              <span className="mt-1 block text-xs text-ink-400">查看模型、数据和程序库的开源许可。</span>
            </span>
            <span aria-hidden className="text-ink-400">›</span>
          </Link>
        </section>
        <p className="mt-3 px-1 text-xs text-ink-400">
          歌曲分析和练唱录音保存在这台 Mac；网页通过本机辅助程序运行。
        </p>
      </main>
    </div>
  );
}
