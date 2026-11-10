"use client";
import { useEffect, useState } from "react";
import { getSettings, inApp, invoke, setSetting, setupOpenSettings } from "@/lib/session";

type Connection = { state: string; browser?: string; name?: string; playing?: boolean };
const messages: Record<string,string> = {
  off: "开启后，唱准会读取 QQ 音乐播放页的歌名、进度和播放状态。",
  waiting: "正在连接 QQ 音乐播放页…",
  browser_closed: "请打开所选浏览器，并在 QQ 音乐网页版播放歌曲。",
  automation_required: "请在 macOS 弹窗中允许“唱准助手”控制所选浏览器；若曾拒绝，可到系统设置 → 隐私与安全性 → 自动化开启。",
  javascript_required: "请允许浏览器读取网页：Ego Lite / Chrome / Edge / Brave 在“查看 → 开发者 → 允许来自 Apple 事件的 JavaScript”；Safari 在“开发”菜单开启同名选项。",
  open_player: "请点“打开播放器”；若列表为空，再去“选歌首页”选歌并点“播放”。保持独立播放器标签页打开。",
  autoplay_required: "QQ 音乐正在等待手动确认。请切到 QQ 独立播放器，点击“开始播放”，再回到唱准。",
  not_ready: "QQ 播放页尚未准备好，请完成登录或点击网页里的“开始播放”。",
  multiple_players: "检测到多个 QQ 播放器同时播放，请只保留一个播放中的标签页。",
  click_play: "已打开歌曲详情，请在 QQ 音乐点击“播放”。浏览器可能需要你再次确认开始播放。",
};
export default function QQMusicConnection() {
  const [on,setOn]=useState(false),[browser,setBrowser]=useState("chrome"),[st,setSt]=useState<Connection>({state:"off"}),[busy,setBusy]=useState(false),[error,setError]=useState("");
  useEffect(()=>{
    if(!inApp())return;let alive=true;
    const load=async()=>{try{const [s,c]=await Promise.all([getSettings(),invoke<Connection>("qqmusic_status")]);if(alive){setOn(!!s?.qqmusic);setBrowser(s?.qqmusic_browser||"chrome");setSt(c);}}catch{}};
    void load();const timer=setInterval(()=>{if(document.visibilityState==="visible")void load();},1800);
    return()=>{alive=false;clearInterval(timer);};
  },[]);
  const toggle=async()=>{setBusy(true);setError("");try{await setSetting("qqmusic",!on);setOn(!on);setSt({state:!on?"waiting":"off"});}catch{setError("连接设置未保存，请确认唱准助手正在运行。");}finally{setBusy(false);}};
  return <section aria-label="QQ 音乐网页连接" className="glass mt-6 rounded-2xl p-5 text-left">
    <div className="flex items-center justify-between gap-4"><h2 className="text-base font-semibold text-ink-100">QQ 音乐网页版 <span className="ml-1 text-[10px] font-normal rounded-full bg-accent-500/15 px-2 py-1 text-accent-300">本机跟唱 · 实验功能</span></h2><button role="switch" aria-label="连接 QQ 音乐" aria-checked={on} disabled={busy} onClick={toggle} className="shrink-0 rounded-xl bg-accent-500 px-4 py-2 text-xs text-white disabled:opacity-50">{on?"断开":"连接"}</button></div>
    <div className="mt-3 flex flex-wrap items-center gap-3"><label className="text-xs text-ink-300">播放所用浏览器 <select aria-label="QQ 音乐所在浏览器" value={browser} disabled={busy} onChange={async e=>{const value=e.target.value;setBusy(true);try{await invoke("set_qqmusic_browser",{browser:value});setBrowser(value);}catch{setError("未能切换浏览器，请重试。");}finally{setBusy(false);}}} className="ml-2 rounded-lg bg-ink-800 px-2 py-1.5 text-ink-100"><option value="ego">Ego Lite</option><option value="chrome">Google Chrome</option><option value="safari">Safari</option><option value="edge">Microsoft Edge</option><option value="brave">Brave</option></select></label><button onClick={async()=>{try{await invoke("qqmusic_open",{target:"player"});}catch(e){setError(String(e));}}} className="text-xs text-accent-300 underline-offset-4 hover:underline">打开播放器 ↗</button><button onClick={async()=>{try{await invoke("qqmusic_open",{target:"home"});}catch(e){setError(String(e));}}} className="text-xs text-accent-300 underline-offset-4 hover:underline">选歌首页 ↗</button></div>
    <p role="status" className="mt-3 text-xs leading-relaxed text-ink-200">{error || (on && st.state==="ready" ? `已连接 · ${st.name} · ${st.playing?"正在播放":"已暂停"}` : messages[on?st.state:"off"] || "正在连接…")}</p>
    {on&&st.state==="automation_required"&&<button onClick={()=>setupOpenSettings("automation")} className="mt-2 text-xs text-accent-300">打开系统权限设置</button>}
    <p className="mt-3 text-[11px] leading-relaxed text-ink-400">先在所选浏览器的普通窗口登录 QQ 音乐并手动播放，再回到这里跟唱。Ego Lite 请使用普通浏览窗口。请关闭同一浏览器里其他有声音的标签页。播放权限以 QQ 音乐为准；此版本按网页进度估算时间，后台标签页可能影响同步精度。</p>
  </section>;
}
