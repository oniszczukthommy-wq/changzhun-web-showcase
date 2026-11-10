"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Lane, { KEYS_W, NOW_AT } from "@/components/Lane";
import Dancer, { useDancer } from "@/components/Dancer";
import Cover, { SourceLinks } from "@/components/Cover";
import Setup from "@/components/Setup";
import StarterSongs, { StarterSheet, useStartersHidden } from "@/components/StarterSongs";
import VoiceBreak from "@/components/VoiceBreak";
import QQMusicConnection from "@/components/QQMusicConnection";
import Heart from "@/components/Heart";
import { DevCopy, logTime, takeLink } from "@/components/Dev";
import { Logo, Nav } from "@/components/Nav";
import { FinishSong, SingSwitches, Icon, Lyrics, ScoreAndHint, SkipToSinging, SongClock, StatusChips, TakeToast, Transport, useTick } from "@/components/LiveBits";
import { getLibrary, inApp, learnAnyway, isFavorite, learnPct, learnStage, live, openApp, startingSong, openPrivacySettings, playerNow, renameTrack, setFavorite, setMini, setupOpenSettings, setupStatus, setYouTube, usePlaying, useSession, type LearnJob, type Line, type SongState, type Status } from "@/lib/session";
import { typing } from "@/lib/keys";
import { clock, sourceName } from "@/lib/music";

export default function Sing() {
  useEffect(() => { live.start(); }, []);
  const { song: playing, connected, status, ended, takes, problem, score, line, learning, drowned, notSong } = useSession();
  // listening mode, the song changed (or isn't named yet): the old one goes at once, the status line says what's happening
  const finding = !!line && line.kind !== "learning";
  const song = finding ? null : playing;
  // the app the song plays in (listening mode: the one heard; a Shazam match's id doesn't say)
  // the app it opens in when it was kept by its ISRC (as "Open in your music app" does), else its id's
  const [opensIn, setOpensIn] = useState<{ id: string; app: string } | null>(null);
  const songId = song?.track.id;
  useEffect(() => {
    if (!songId || !inApp()) return;
    let gone = false;
    openApp(songId).then(app => { if (!gone && app) setOpensIn({ id: songId, app }); }).catch(() => {});
    return () => { gone = true; };
  }, [songId]);
  const source = status.player?.app && status.player.app !== "音乐 App" ? status.player.app
    : song ? (opensIn?.id === song.track.id ? opensIn.app : sourceName(song.track.id)) : "";
  const [mini, setMiniState] = useState(false);
  const [app, setApp] = useState(false);              // known only in the browser (the page is prerendered)
  useEffect(() => setApp(inApp()), []);
  // first-run setup: opens by itself until it's been finished (in the browser, with ?setup)
  const [setup, setSetup] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(location.search).has("setup")) { setSetup(true); return; }
    if (inApp()) setupStatus().then(s => { if (!s.done) setSetup(true); }).catch(() => {});
  }, []);
  const toggleMini = (on: boolean) => { setMiniState(on); void setMini(on); };
  // the song's heart (F)
  const [fav, setFav] = useState<{ id: string; on: boolean } | null>(null);
  const track = song?.track;
  useEffect(() => {
    if (!track) return;
    let gone = false;
    isFavorite(track).then(on => { if (!gone) setFav({ id: track.id, on }); }).catch(() => {});
    return () => { gone = true; };
  }, [track?.id]);   // eslint-disable-line react-hooks/exhaustive-deps
  const favOn = !!track && fav?.id === track.id && fav.on;
  const toggleFav = (on: boolean) => { if (!track) return; setFav({ id: track.id, on }); void setFavorite(track, on); };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (typing(e) || e.metaKey || e.ctrlKey) return;
      if (e.key === "m" || e.key === "M") toggleMini(!mini);
      else if ((e.key === "f" || e.key === "F") && track) toggleFav(!favOn);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  });
  if (mini) return <Mini onExpand={() => toggleMini(false)} />;
  return (
    <div className="flex h-dvh flex-col overflow-clip bg-[radial-gradient(1200px_500px_at_50%_-10%,rgba(124,108,246,.10),transparent)]">
      {/* overflow-clip (not hidden) and minmax(0, ...) tracks: nothing can widen the page or scroll it sideways,
          so the lane, lyrics and controls stay centred in the window */}
      <VoiceBreak />
      <StarterSheet />
      <header data-tauri-drag-region className="app-header grid grid-cols-[minmax(0,1fr)_minmax(0,auto)_minmax(0,1fr)] items-center gap-4 px-6 pt-4 pb-3">
        <div className="flex min-w-0 items-center gap-5 overflow-clip"><Logo /><Nav /></div>
        <div className="min-w-0 text-center">
          {!song && line && <StatusLine line={line} />}
          {!song && <LearningLine jobs={learning} className={line ? "mt-1.5" : ""} />}
          {song && (
            <div key={song.version} className="flex animate-rise items-center justify-center gap-3">
              <Cover name={song.track.name} art={song.track.art} link={song.track.link} size={40} eager />
              <div className="min-w-0 text-left">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[15px] font-semibold tracking-tight">{song.track.name}</span>
                  <Heart on={favOn} onToggle={toggleFav} size={14} className="-my-1.5 h-6 w-6" />
                  {song.track.id.startsWith("youtube:") && <RenameVideo id={song.track.id} artist={song.track.artist} name={song.track.name} />}
                  <DevCopy label="复制链接" text={async () => {
                    const n = await playerNow().catch(() => null);
                    return takeLink("live", song.version, { song: n?.position, track: song.track.id, mode: song.mode, at: logTime() });
                  }} />
                </div>
                <div className="flex items-center gap-2 truncate text-sm text-ink-400">
                  {song.track.artist}<span className="text-ink-600">·</span><SongClock />
                  {/* the app it plays from, as the link to the song there; then the other service, dimmer */}
                  <span className="text-ink-600">·</span><SourceLinks source={source} artist={song.track.artist} name={song.track.name} appleLink={song.track.link} trackId={song.track.id} />
                </div>
                {line?.kind === "learning" && <div role="status" className="mt-0.5 truncate text-xs text-accent-300">{line.text}</div>}
                {/* (earlier songs still being learned aren't shown over a playing song: it crowded the header; the
                    Library shows their progress) */}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-4">
          {song && <ScoreAndHint />}
          {app && (
            <button onClick={() => toggleMini(true)} title="精简模式：在当前网页显示歌词和音准（M）"
                    className="grid h-9 w-9 place-items-center rounded-full text-ink-300 transition hover:bg-white/8 hover:text-white">
              <Icon d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM12.5 11.5h5.5v4.5h-5.5z" size={18} />
            </button>
          )}
        </div>
      </header>

      <main className="relative mx-4 min-h-0 flex-1 overflow-clip rounded-3xl border border-white/6 bg-ink-900 shadow-2xl shadow-black/40">
        {!finding && <Lane />}
        {!ended && !finding && <Dancer />}
        {song && !ended && <SkipToSinging />}
        {song && !ended && <FinishSong />}
        {song?.mode === "learn" && <Learning key={song.version} />}
        {!song && <Waiting connected={connected} line={line} player={status.player} youtube={!!status.youtube} listening={!!status.listening} onSetup={() => setSetup(true)} />}
        {!setup && <Notices status={status} song={song} />}
        {!setup && song?.mode === "sing" && !ended && drowned && <SpeakerHint key={song.version} id={song.track.id} />}
        {!setup && notSong && <NotASong key={notSong.track_id} id={notSong.track_id} name={notSong.name} />}
        {ended && !finding && <Ended takes={takes} />}
        {(problem === "permission" || status.audio === "denied") && !setup && <NeedsPermission app={status.player?.app ?? "音乐 App"} />}
      </main>
      {setup && <Setup onClose={() => setSetup(false)} />}

      <section className="pt-5 pb-3">{song && <Lyrics />}</section>

      <footer className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-4 px-6 pb-5">
        <StatusChips />
        <Transport />
        <div className="flex min-w-0 items-end justify-end gap-2"><TakeToast />{!ended && <SingSwitches />}</div>
      </footer>
    </div>
  );
}

function Learning() {
  useTick(500);
  const playing = usePlaying();     // the dot pulses only while the song plays
  const song = live.song!;
  const perf = live.frozenPerf ?? performance.now();
  const t = live.songTime(perf);
  const d = song.track.duration;     // 0 when unknown (YouTube can say so): no bar, and the time without a length
  const pct = d > 0 ? Math.max(0, Math.min(1, t / d)) : null;
  const dot = <span className="relative flex h-2 w-2 shrink-0"><span className={`absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-60 motion-reduce:hidden ${playing ? "animate-ping" : "hidden"}`} /><span className="relative inline-flex h-2 w-2 rounded-full bg-accent-400" /></span>;
  const bar = (h: string) => pct != null && (
    <div className={`${h} overflow-hidden rounded-full bg-white/9`}>
      <div className="h-full rounded-full bg-gradient-to-r from-accent-400 to-accent-600 transition-[width] duration-500" style={{ width: `${pct * 100}%` }} />
    </div>
  );
  // in the future side of the lane (right of the now line), where nothing is known yet
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0" style={{ left: `calc(${KEYS_W}px + (100% - ${KEYS_W}px) * ${NOW_AT})` }}>
      <div className={`frost absolute top-1/2 left-1/2 w-[min(calc(100%-40px),300px)] rounded-[22px] px-[18px] pt-4 pb-3.5 text-center -translate-x-1/2 -translate-y-1/2`}>
        <div className="mx-auto mb-2.5 flex w-fit items-center gap-2 rounded-full bg-accent-500/14 px-3 py-1 text-xs font-medium text-accent-300">{dot}正在学习这首歌</div>
        <h2 className="text-base font-semibold tracking-tight">首次跟唱</h2>
        <p className="mt-1 text-[12.5px] leading-snug text-ink-200/85">先跟着唱一遍，下一次就能提前看到旋律和音符。</p>
        {bar("mt-3 h-1")}
        <div className="mt-2 text-[11.5px] text-ink-300"><span className="tabular">{clock(t)}{d > 0 && ` / ${clock(d)}`}</span> · 歌曲结束后评分</div>
      </div>
    </div>
  );
}

/** Listening mode's status line, in the header while no song is shown: what OnKey is doing about the sound. */
function StatusLine({ line }: { line: Line }) {
  const busy = line.kind === "finding" || line.kind === "new_song";
  return (
    <div key={line.text} role="status" aria-live="polite"
         className={`mx-auto flex w-fit animate-rise items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${busy ? "bg-accent-500/12 text-accent-300" : "bg-white/6 text-ink-300"}`}>
      {busy && <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-60 motion-reduce:animate-none" /><span className="relative inline-flex h-2 w-2 rounded-full bg-accent-400" /></span>}
      {line.text}
    </div>
  );
}

/** Songs whose play is over still being learned (the status line's learning part): which, what it's doing and how
 *  far it's got, as a thin bar that moves only when the engine reports (see LearnBar). The song being learned is
 *  the one shown; one waiting behind it (one is learned at a time) is only counted. */
function LearningLine({ jobs, className = "" }: { jobs: LearnJob[]; className?: string }) {
  const after = jobs.filter(j => j.fraction != null);
  if (!after.length) return null;
  const j = after.find(a => a.stage !== "queued") ?? after[0], pct = learnPct(j);
  return (
    <div role="status" aria-live="polite" className={`mx-auto w-72 max-w-full text-left text-xs ${className}`}
         title={after.length > 1 ? after.map(a => a.name).join(", ") : undefined}>
      <div className="flex items-baseline gap-1.5">
        {pct == null
          ? <span className="truncate text-ink-300">等待学习 <span className="text-ink-100">{j.name}</span></span>
          : <span className="truncate text-ink-300">正在学习 <span className="text-ink-100">{j.name}</span>: {learnStage(j).toLowerCase()}</span>}
        <span className="tabular ml-auto shrink-0 text-ink-400">{after.length > 1 ? `+${after.length - 1}` : ""}{after.length > 1 && pct != null ? " · " : ""}{pct != null ? `${pct}%` : ""}</span>
      </div>
      <div className="mt-1 h-0.5 overflow-hidden rounded-full bg-white/8">
        {pct != null && <div className="h-full rounded-full bg-accent-400 transition-[width] duration-500 ease-out motion-reduce:transition-none" style={{ width: `${Math.max(2, pct)}%` }} />}
      </div>
    </div>
  );
}

/** What the status line means, said under it while waiting. */
const LINE_SUB: Record<Line["kind"], string> = {
  finding: "正在根据声音识别歌曲。识别需要几秒，练唱记录会从歌曲开头计算。",
  new_song: "正在识别下一首歌曲，练唱记录会从歌曲开头计算。",
  unnamed: "请检查 QQ 音乐连接状态，并保持独立播放器标签页打开。",
  no_shazam: "歌曲识别服务不可用，目前只能识别本机已经学过的歌曲，或读取音乐 App 提供的歌曲信息。",
  shazam_off: "声音识别已关闭。目前只能根据声音认出本机学过的歌曲；也可以在设置中允许读取音乐 App 信息。",
  podcast: "播放一首歌，唱准会跟随歌曲。",
  learning: "",
  elsewhere: "唱准会听这台 Mac 播放的音乐。如果音乐正在手机或其他设备播放，请将播放设备切换到这台 Mac。",
};

/** First run (nothing learned yet) and still no song after this long: suggest songs to try, whatever the line says. */
const STARTERS_AFTER_MS = 45_000;

function Waiting({ connected, line, player, youtube, listening, onSetup }: { connected: boolean; line: Line | null; player: null | { state: string; name: string; artist: string }; youtube: boolean; listening: boolean; onSetup: () => void }) {
  const [busy, setBusy] = useState(false);
  const said = line && line.kind !== "learning" ? line : null;
  // songs to try: while nothing plays, and on a first run when OnKey has heard no song for a while
  const [startersHidden, hideStarters] = useStartersHidden();
  const [firstRun, setFirstRun] = useState(false);
  const [waited, setWaited] = useState(false);
  useEffect(() => {
    let gone = false;
    getLibrary().then(l => { if (!gone) setFirstRun(l.length === 0); }).catch(() => {});
    const t = setTimeout(() => setWaited(true), STARTERS_AFTER_MS);
    return () => { gone = true; clearTimeout(t); };
  }, []);
  // a song just started from the Library, History or a take: say so until it plays (not the nothing-playing screen)
  const [start, setStart] = useState(startingSong);
  useEffect(() => {
    if (!start) return;
    const t = setTimeout(() => setStart(startingSong()), 1000);
    return () => clearTimeout(t);
  }, [start]);
  const idle = !said && player?.state !== "playing" && !start;
  const starters = connected && startersHidden === false && (idle || (firstRun && waited && !start));
  const title = !connected ? "正在连接唱准助手…" : start ? (start.name ? `正在启动 ${start.name}…` : "正在打开歌曲…") : said ? (said.kind === "finding" || said.kind === "new_song" ? "正在准备…" : said.kind === "podcast" ? "当前不是歌曲" : said.kind === "elsewhere" ? said.text : "正在聆听") : player?.state === "playing" ? "正在准备…"
    : youtube ? "在 Spotify、Apple Music 或 YouTube 播放歌曲" : "在 QQ 音乐网页版播放歌曲";
  const sub = !connected
    ? "正在连接这台 Mac 上的音准分析引擎。"
    : start
      ? "音乐开始后，这里会显示音准轨道。"
    : said
      ? LINE_SUB[said.kind]
      : player?.state === "playing"
        ? `正在聆听 ${player.name} ，音准轨道即将出现。`
        : "跟着喜欢的歌练唱，每次练习都会保存为可回顾的记录。";
  return (
    <div className="absolute inset-0 grid place-items-center overflow-y-auto p-6">
      <div className="flex w-full max-w-2xl flex-col items-center">
      <div className="max-w-md text-center animate-rise">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-accent-500/12 text-accent-300">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
            <path d="M9 18V6l11-2v12M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-ink-300">{sub}</p>
        <div className="mt-6 flex justify-center gap-4 text-xs text-ink-400">
          <span><Kbd>空格</Kbd> 播放 / 暂停</span><span><Kbd>R</Kbd> 从头开始</span><span><Kbd>←</Kbd><Kbd>→</Kbd> 下一首</span><span><Kbd>F</Kbd> 收藏</span>
        </div>
        {connected && <QQMusicConnection />}
        {/* the YouTube switch; when listening, only while it's off (songs in a browser aren't picked up until it's on) */}
        {connected && (!listening || !youtube) && (
          <div className="mx-auto mt-8 max-w-sm rounded-xl border border-white/6 px-4 py-3 text-left text-xs text-ink-400">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-ink-200">YouTube / YouTube Music <span className="ml-1 rounded-full bg-white/6 px-1.5 py-px text-[10px] font-normal text-ink-300">实验功能</span></span>
              <button disabled={busy} onClick={async () => { setBusy(true); await setYouTube(!youtube); setBusy(false); }}
                      className="shrink-0 rounded-lg bg-white/6 px-2.5 py-1 text-ink-100 transition hover:bg-white/10 disabled:opacity-50">
                {youtube ? "关闭" : "开启"}</button>
            </div>
            <p className="mt-1.5">{youtube
              ? "已开启。macOS 会询问是否允许唱准控制浏览器，以便读取视频的播放位置。"
              : "开启后可以跟随 Chrome、Safari、Brave 或 Edge 中的 YouTube 歌曲。macOS 会询问是否允许控制浏览器。"}</p>
          </div>
        )}
        <button onClick={onSetup} className="mt-5 text-xs text-ink-500 transition hover:text-ink-200">设置向导：权限与麦克风检查</button>
      </div>
      {starters && <StarterSongs />}
      {connected && idle && startersHidden && (
        <button onClick={() => hideStarters(false)} className="mt-6 text-xs text-ink-500 transition hover:text-ink-200">中文歌单</button>
      )}
      </div>
    </div>
  );
}

/** A YouTube video's artist and title are read from the video and can be wrong: fix them here (kept for that
 *  video, and its lyrics are looked up again). */
function RenameVideo({ id, artist, name }: { id: string; artist: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [a, setA] = useState(artist);
  const [n, setN] = useState(name);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!open) { setA(artist); setN(name); } }, [open, artist, name]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!n.trim()) return;
    setBusy(true);
    try { await renameTrack(id, a, n); setOpen(false); } finally { setBusy(false); }
  }
  return (
    <span className="relative">
      <button onClick={() => setOpen(o => !o)} title="歌曲名称不对？修改歌手和歌名，以便查找歌词"
              className="grid h-6 w-6 place-items-center rounded-full text-ink-500 transition hover:bg-white/8 hover:text-ink-100">
        <Icon d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-4-4L4 16v4zM13.5 6.5l4 4" size={13} />
      </button>
      {open && (
        <form onSubmit={save} onKeyDown={e => { if (e.key === "Escape") setOpen(false); }}
              className="glass absolute left-1/2 top-8 z-30 w-72 -translate-x-1/2 animate-rise rounded-2xl p-4 text-left shadow-2xl shadow-black/50">
          <div className="text-xs font-medium text-ink-200">修改歌曲信息</div>
          <p className="mt-0.5 text-xs text-ink-400">信息来自 YouTube 视频标题，唱准会用这些信息查找歌词。</p>
          <label className="mt-3 block text-[11px] text-ink-400" htmlFor="rename-artist">歌手</label>
          <input id="rename-artist" value={a} onChange={e => setA(e.target.value)} autoFocus
                 className="mt-1 w-full rounded-lg border border-white/8 bg-white/4 px-2.5 py-1.5 text-sm text-ink-100 outline-none focus:border-accent-400" />
          <label className="mt-2 block text-[11px] text-ink-400" htmlFor="rename-title">歌名</label>
          <input id="rename-title" value={n} onChange={e => setN(e.target.value)}
                 className="mt-1 w-full rounded-lg border border-white/8 bg-white/4 px-2.5 py-1.5 text-sm text-ink-100 outline-none focus:border-accent-400" />
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-3 py-1.5 text-xs text-ink-300 transition hover:text-ink-100">取消</button>
            <button type="submit" disabled={busy || !n.trim()}
                    className="rounded-lg bg-accent-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-accent-400 disabled:opacity-50">保存</button>
          </div>
        </form>
      )}
    </span>
  );
}

/** Something OnKey can't do until you change a setting, said with what to do: a permission macOS refused, the
 *  learning models missing, or a browser's JavaScript setting. Never a silent nothing. */
function Notices({ status, song }: { status: Status; song: SongState | null }) {
  const m = status.models;
  // the YouTube hint: gone once turned on (status follows within a few seconds), or for this browser when closed
  const [ytOn, setYtOn] = useState(false);
  const [ytClosed, setYtClosed] = useState<string | null>(null);
  const sounding = status.browser_sounding;
  useEffect(() => { if (status.youtube) setYtOn(false); }, [status.youtube]);
  const learning = !song || song.mode === "learn";
  const list = [
    (status.mic === "denied" || status.mic === "restricted") && (
      <Notice key="mic" title="唱准无法听到麦克风"
              action={status.mic === "denied" ? { label: "打开系统设置", run: () => setupOpenSettings("mic") } : undefined}>
        {status.mic === "denied"
          ? <>获得权限后才能检测你的歌声并评分。请打开 <b>系统设置 → 隐私与安全性 → 麦克风</b>，允许“唱准助手”。</>
          : <>这台 Mac 的管理设置不允许使用麦克风，请联系设备管理员。</>}
      </Notice>
    ),
    status.mic === "granted" && status.mic_device === null && (
      <Notice key="mic" title="唱准无法听到麦克风">
        没有可用的麦克风。请连接麦克风，或前往{" "}
        <b>系统设置 → 声音 → 输入</b>.
      </Notice>
    ),
    status.music_quiet && (
      <Notice key="music-quiet" title={`${status.music_quiet.app}的音量太低`}>
        唱准听不清歌曲{status.music_quiet.volume != null ? ` (${status.music_quiet.app} 的音量为 ${status.music_quiet.volume}%)` : ""}，暂时无法评分。请调高 {status.music_quiet.app} 的音量，再通过 Mac 系统音量调整听感。
      </Notice>
    ),
    status.automation_denied && (
      <Notice key="automation" title={`唱准没有权限控制 ${status.automation_denied}`}
              action={{ label: "打开系统设置", run: () => setupOpenSettings("automation") }}>
        {status.listening ? "目前只能通过聆听跟随，无法控制它的播放、暂停和切歌。" : "因此无法读取当前播放的歌曲信息。"} 请前往{" "}
        <b>系统设置 → 隐私与安全性 → 自动化 → 唱准助手</b>，打开 {status.automation_denied}{status.listening ? <>，或在唱准设置中关闭对应功能</> : null}.
      </Notice>
    ),
    !status.automation_denied && status.not_answering && (
      <Notice key="not-answering" title={`${status.not_answering} 暂时没有回应唱准`}
              action={{ label: "打开系统设置", run: () => setupOpenSettings("automation") }}>
        macOS 可能正在询问是否允许唱准控制 {status.not_answering}。权限窗口可能被遮住，请找到它并选择 <b>允许</b>。或者在 {status.not_answering} 中开启 <b>系统设置 → 隐私与安全性 → 自动化 → 唱准助手</b>。唱准会在一分钟后重试。
      </Notice>
    ),
    m && m.state === "missing" && learning && (
      <Notice key="models" title="暂时无法学习新歌曲">
        内置的学习模型缺失或损坏{m.error ? ` (${m.error})` : ""}。已学过的歌曲仍可使用，请重新构建辅助程序并检查模型文件。
      </Notice>
    ),
    !song && status.youtube_blocked && (
      <Notice key="youtube" title={`跟唱 YouTube 需要允许唱准读取视频信息，请在 ${status.youtube_blocked.browser}`}>
        请前往 {status.youtube_blocked.browser}中选择 <b>{status.youtube_blocked.setting}</b>。唱准只读取歌曲名称和播放位置。
      </Notice>
    ),
    !song && !status.youtube && !ytOn && sounding && sounding.browser !== ytClosed && (sounding.works ? (
      <Notice key="youtube-off" title={`正在用以下浏览器播放 YouTube 音乐： ${sounding.browser}?`} onClose={() => setYtClosed(sounding.browser)}
              action={{ label: "开启 YouTube 支持", run: () => { setYtOn(true); void setYouTube(true).catch(() => setYtOn(false)); } }}>
        开启后才能跟随浏览器中的 YouTube 歌曲，macOS 会询问是否允许唱准控制 {sounding.browser}，以便读取播放位置。
      </Notice>
    ) : (
      <Notice key="youtube-off" title={`正在用以下浏览器播放 YouTube 音乐： ${sounding.browser}?`} onClose={() => setYtClosed(sounding.browser)}>
        唱准暂时无法跟随以下浏览器的歌曲： {sounding.browser}。请改用 <b>Chrome、Safari、Brave 或 Edge</b> 并开启 YouTube 支持；或者在设置中开启 <b>聆听模式</b> ，通过声音识别歌曲。
      </Notice>
    )),
  ].filter(Boolean);
  if (!list.length) return null;
  return <div className="absolute inset-x-0 bottom-6 z-10 flex flex-col items-center gap-3 px-6">{list}</div>;
}

/** A gentle hint, once per song in a session: over speakers, when the song has been drowning you out (the engine's
 *  `drowned`: for 20 s of your part the mic heard a voice, but nearly none of it counted as singing). Turning the
 *  music down or headphones lets your voice through; nothing about the score changes. It goes by itself after
 *  20 s, or with ×; "Don't show again" is remembered (localStorage onkey.hideSpeakerHint). */
const speakerHinted = new Set<string>();
const HIDE_SPEAKER_HINT = "onkey.hideSpeakerHint";
/** A YouTube video that sounded like talk, not a song: OnKey stopped learning it (and won't again), unless it's a
 *  song after all. Goes by itself after a while. */
function NotASong({ id, name }: { id: string; name: string }) {
  useEffect(() => {
    const t = setTimeout(() => live.dismissNotSong(), 30000);
    return () => clearTimeout(t);
  }, [id]);
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex justify-center px-6">
      <div role="status" className="glass pointer-events-auto w-full max-w-md animate-rise rounded-2xl px-4 py-3 shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-ink-200"><span className="text-ink-100">{name}</span> 听起来像语音内容，已停止学习。</p>
          <button onClick={() => live.dismissNotSong()} aria-label="关闭" className="-mr-1 shrink-0 rounded-md px-1.5 text-ink-400 transition hover:text-ink-100">×</button>
        </div>
        <button onClick={() => void learnAnyway(id)} className="mt-1.5 text-xs text-ink-400 underline-offset-2 transition hover:text-ink-200 hover:underline">这是歌曲：下次播放时学习</button>
      </div>
    </div>
  );
}

function SpeakerHint({ id }: { id: string }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (speakerHinted.has(id)) return;
    try { if (localStorage.getItem(HIDE_SPEAKER_HINT) === "1") return; } catch {}
    speakerHinted.add(id);
    setShown(true);
  }, [id]);
  useEffect(() => {
    if (!shown) return;
    const t = setTimeout(() => setShown(false), 20000);
    return () => clearTimeout(t);
  }, [shown]);
  if (!shown) return null;
  const never = () => { try { localStorage.setItem(HIDE_SPEAKER_HINT, "1"); } catch {} setShown(false); };
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex justify-center px-6">
      <div role="status" className="glass pointer-events-auto w-full max-w-md animate-rise rounded-2xl px-4 py-3 shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-ink-200">音乐盖过了你的歌声。请降低外放音量，或戴上耳机后练唱。</p>
          <button onClick={() => setShown(false)} aria-label="关闭" className="-mr-1 shrink-0 rounded-md px-1.5 text-ink-400 transition hover:text-ink-100">×</button>
        </div>
        <button onClick={never} className="mt-1.5 text-xs text-ink-400 underline-offset-2 transition hover:text-ink-200 hover:underline">不再提示</button>
      </div>
    </div>
  );
}

function Notice({ title, action, onClose, children }: { title: string; action?: { label: string; run: () => void }; onClose?: () => void; children: React.ReactNode }) {
  return (
    <div role="status" className="glass w-full max-w-lg animate-rise rounded-2xl px-5 py-4 shadow-2xl shadow-black/40">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-medium text-ink-100">{title}</div>
        <div className="flex shrink-0 items-start gap-1">
          {action && (
            <button onClick={action.run} className="shrink-0 rounded-lg bg-white/8 px-3 py-1.5 text-xs font-medium text-ink-100 transition hover:bg-white/12">
              {action.label}
            </button>
          )}
          {onClose && <button onClick={onClose} aria-label="关闭" className="-mr-1.5 rounded-md px-1.5 py-1 text-ink-400 transition hover:text-ink-100">×</button>}
        </div>
      </div>
      <p className="mt-1 text-sm text-ink-300 [&_b]:font-medium [&_b]:text-ink-100">{children}</p>
    </div>
  );
}

function Ended({ takes }: { takes: { name: string; artist: string; score: number | null; report: string | null }[] }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-ink-950/90 p-6">
      <div className="w-full max-w-md animate-rise text-center">
        <h2 className="text-2xl font-semibold tracking-tight">本次练唱结束</h2>
        <p className="mt-1 text-ink-300">{takes.length ? "看看这次的表现。" : "这次没有足够长的练唱片段可评分。"}</p>
        <div className="mt-6 space-y-2 text-left">
          {takes.map((t, i) => (
            <Link key={i} href={t.report ? `/take?id=${encodeURIComponent(t.report)}` : "/history"}
                  className="glass flex items-center justify-between rounded-2xl px-4 py-3 transition hover:border-accent-400/40">
              <div className="min-w-0"><div className="truncate font-medium">{t.name}</div><div className="truncate text-sm text-ink-400">{t.artist}</div></div>
              <div className="tabular text-2xl font-bold">{t.score ?? "–"}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="mx-0.5 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-sans text-[11px] text-ink-200">{children}</kbd>;
}

/** macOS hasn't let OnKey hear other apps yet. */
function NeedsPermission({ app }: { app: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-ink-950/85 px-6">
      <div className="glass w-full max-w-md animate-rise rounded-3xl px-7 py-6 shadow-2xl shadow-black/40">
        <h2 className="text-lg font-semibold tracking-tight">唱准还听不到 {app} 的声音</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-300">
          为了跟随歌曲，唱准需要采集 {app}在这台 Mac 上播放的声音。音乐只在本机内存中分析，不会被保存。
        </p>
        <ol className="mt-4 space-y-1.5 text-sm text-ink-200">
          <li>1. 打开 <span className="font-medium">系统设置 → 隐私与安全性</span></li>
          <li>2. 选择 <span className="font-medium">屏幕与系统音频录制</span></li>
          <li>3. 在 <span className="font-medium">仅系统音频录制</span>中允许“唱准助手”</li>
        </ol>
        <button onClick={() => openPrivacySettings()}
                className="mt-5 w-full rounded-xl bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-400">
          打开系统设置
        </button>
      </div>
    </div>
  );
}

/** Mini mode: the current and next lyric line, how close you are to the note, and your score, on a small
 *  rounded card floating above other apps. Drag it anywhere (text doesn't catch the mouse, so the whole card
 *  is a handle); the button opens the full window again. */
function Mini({ onExpand }: { onExpand: () => void }) {
  const { song, score } = useSession();
  const dancerOn = useDancer();
  // the dancer can be hidden from this card alone (the full window's switch is separate), remembered
  const [miniDancer, setMiniDancerState] = useState(true);
  useEffect(() => { try { setMiniDancerState(localStorage.getItem("onkey-mini-dancer") !== "0"); } catch {} }, []);
  const setMiniDancer = (on: boolean) => { setMiniDancerState(on); try { localStorage.setItem("onkey-mini-dancer", on ? "1" : "0"); } catch {} };
  const canDance = dancerOn && song?.mode === "sing" && !!song?.beats?.at.length;
  const dancing = canDance && miniDancer;
  useEffect(() => {
    document.documentElement.classList.add("mini");
    return () => document.documentElement.classList.remove("mini");
  }, []);
  return (
    <div className="h-dvh p-1.5 select-none">
      <div data-tauri-drag-region
           className="relative flex h-full cursor-grab items-stretch gap-2 overflow-hidden rounded-2xl border border-white/10 bg-ink-900/95 py-2 pr-2 pl-4 shadow-xl shadow-black/50 active:cursor-grabbing">
        <div data-tauri-drag-region className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
          <div data-tauri-drag-region className="flex items-center gap-3">
            <div className="pointer-events-none min-w-0 flex-1">
              {song ? <Lyrics compact /> : <p className="text-sm text-ink-400">在 QQ 音乐网页版播放歌曲</p>}
            </div>
            <div className="pointer-events-none text-right">
              <div className="tabular text-xl font-bold leading-none">{song?.mode === "learn" ? "–" : score ?? "–"}</div>
              <div className="text-[9px] uppercase tracking-wider text-ink-500">评分</div>
            </div>
          </div>
        </div>
        {dancing && (
          <div className="group relative -my-2 w-[50px] shrink-0">
            <Dancer className="absolute inset-0 h-full w-full" />
            <button onClick={() => setMiniDancer(false)} title="隐藏动画"
                    className="absolute -top-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full text-xs text-ink-400 opacity-0 transition group-hover:opacity-100 hover:bg-white/10 hover:text-white">×</button>
          </div>
        )}
        <div className="flex shrink-0 flex-col items-center justify-between">
          <button onClick={onExpand} title="展开完整界面（M）"
                  className="grid h-7 w-7 place-items-center rounded-full text-ink-300 transition hover:bg-white/8 hover:text-white">
            <Icon d="M14 4h6v6M20 4l-8 8M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" size={15} />
          </button>
          {canDance && !miniDancer && (
            <button onClick={() => setMiniDancer(true)} title="显示动画"
                    className="grid h-7 w-7 place-items-center rounded-full text-ink-400 transition hover:bg-white/8 hover:text-white">
              <Icon d="M12 4.5a1.5 1.5 0 1 0 0 .01M12 7v6M8 9l4 1 4-1M9 21l3-8 3 8" size={15} />
            </button>
          )}
        </div>
        {song && <MiniProgress />}
      </div>
    </div>
  );
}

/** How far through the song: a hairline along the mini card's bottom edge. */
function MiniProgress() {
  useTick(500);
  const song = live.song;
  const d = song?.track.duration ?? 0;
  if (!song || !d) return null;
  const f = Math.max(0, Math.min(1, live.songTime(live.frozenPerf ?? performance.now()) / d));
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-white/5" title="整首歌曲">
      <div className="h-full bg-accent-400/70 transition-[width] duration-500 ease-linear" style={{ width: `${f * 100}%` }} />
    </div>
  );
}
