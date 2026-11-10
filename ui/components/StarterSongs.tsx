"use client";
import { useEffect,useState } from "react";
import Link from "next/link";
import ChinesePlaylists from "./ChinesePlaylists";
import { getSettings,inApp,setSetting } from "@/lib/session";
export function useStartersHidden():[boolean|null,(hide:boolean)=>void]{
 const[hidden,setHidden]=useState<boolean|null>(null);
 useEffect(()=>{if(inApp())getSettings().then(s=>setHidden(!!s?.hide_starters)).catch(()=>setHidden(false));else setHidden(false);},[]);
 return[hidden,(hide)=>{setHidden(hide);if(inApp())void setSetting("hide_starters",hide);}];
}
export default function StarterSongs({ className = "", onHide }: { className?: string; onHide?: () => void }) { return <div className={className}><ChinesePlaylists compact/>{onHide && <button onClick={onHide} className="mt-3 text-xs text-ink-400">隐藏推荐</button>}</div>; }
export function StarterSheet(){const[open,setOpen]=useState(false);useEffect(()=>{const show=()=>setOpen(true);const key=(e:KeyboardEvent)=>{if(e.key==="Escape")setOpen(false);};addEventListener("onkey-songs-to-try",show);addEventListener("keydown",key);return()=>{removeEventListener("onkey-songs-to-try",show);removeEventListener("keydown",key);};},[]);return open?<div role="dialog" aria-modal="true" aria-label="中文歌单推荐" className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-5" onClick={()=>setOpen(false)}><div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-ink-900 p-6" onClick={e=>e.stopPropagation()}><div className="flex justify-between items-center"><h2 className="text-xl font-semibold">今天想唱什么？</h2><button autoFocus aria-label="关闭歌单推荐" onClick={()=>setOpen(false)} className="h-10 w-10 rounded-full bg-white/5">×</button></div><StarterSongs/><Link href="/discover" onClick={()=>setOpen(false)} className="block mt-6 text-center rounded-xl bg-accent-500 py-3 text-sm">浏览全部中文主题歌单 →</Link></div></div>:null;}
