"use client";
import { Logo, Nav } from "@/components/Nav";
import ChinesePlaylists from "@/components/ChinesePlaylists";
export default function Discover(){return <div className="min-h-dvh"><header className="app-header flex flex-wrap items-center gap-5 px-6 py-5 border-b border-white/5"><Logo/><Nav/><span className="ml-auto text-xs text-ink-400">本机运行 · 中文个人版</span></header><main className="mx-auto max-w-7xl px-5 py-8 sm:px-8"><ChinesePlaylists/></main></div>;}
