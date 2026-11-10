import type { Metadata } from "next";

import "./globals.css";
import ControlPrompt from "@/components/ControlPrompt";
import ReportProblem from "@/components/ReportProblem";
import MirrorBadge from "@/components/MirrorBadge";
import UpdatePill from "@/components/UpdatePill";
import GoHome from "@/components/GoHome";




export const metadata: Metadata = {
  title: "唱准 · 中文练唱",
  description: "在浏览器里跟唱你喜欢的中文歌曲，查看实时音准和练唱反馈。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <script dangerouslySetInnerHTML={{ __html: "if ('__TAURI_INTERNALS__' in window) { document.documentElement.classList.add('in-app'); const log = m => { try { window.__TAURI_INTERNALS__.invoke('ui_log', { msg: String(m).slice(0, 2000) }); } catch (e) {} }; window.addEventListener('error', e => log(e.message + ' at ' + e.filename + ':' + e.lineno)); window.addEventListener('unhandledrejection', e => log('unhandled: ' + (e.reason && (e.reason.stack || e.reason)))); const ce = console.error; console.error = (...a) => { log(a.join(' ')); ce(...a); }; }" }} />
        {children}
        <ControlPrompt />
        <ReportProblem />
        <MirrorBadge />
        <UpdatePill />
        <GoHome />
      </body>
    </html>
  );
}
