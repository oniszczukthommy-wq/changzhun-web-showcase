"use client";
// A stick figure dancing to the song while you sing: on the song's beat (found from the learned music, so it
// is exactly in time once the take is placed), a new move every 8 beats chosen by how energetic the music is,
// easing from one to the next; now and then he turns side-on (a step-touch, a moonwalk, a kick, a shoulder roll)
// or spins into a new phrase. It reacts to you: he turns to you with arms up when you hit a note, shrugs and
// shakes his head when you miss one. The moves and drawing are in dancerCore.ts. Switch it off with the
// "Dancer" toggle; off by default when the system asks for reduced motion.
import { useEffect, useRef, useSyncExternalStore } from "react";
import { live, usePlaying, useSession } from "@/lib/session";
import { lineCheer, recentVerdict } from "@/components/Lane";
import { DanceState } from "@/components/dancerCore";

// ------------------------------------------------------------------ on/off, remembered
const KEY = "onkey-dancer";
const subs = new Set<() => void>();
function readOn() {
  try {
    const v = localStorage.getItem(KEY);
    if (v != null) return v === "1";
  } catch {}
  return !(typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches);
}
export function setDancer(on: boolean) {
  try { localStorage.setItem(KEY, on ? "1" : "0"); } catch {}
  subs.forEach(f => f());
}
export function useDancer() {
  return useSyncExternalStore(f => { subs.add(f); return () => subs.delete(f); }, readOn, () => false);
}

/** `className` places and sizes the canvas (default: the lane's bottom right corner); the figure scales to fit its height. */
export default function Dancer({ className = "absolute right-4 bottom-3 z-10 h-[150px] w-[120px]" }: { className?: string }) {
  const { song, aligned } = useSession();
  const on = useDancer();
  const playing = usePlaying();
  const ref = useRef<HTMLCanvasElement>(null);
  const show = on && song?.mode === "sing" && !!song?.beats?.at.length;
  useEffect(() => {
    if (!show) return;
    const cv = ref.current!;
    let raf = 0;
    const st = new DanceState();
    const frame = () => {
      if (playing) raf = requestAnimationFrame(frame);     // paused or hidden: drawn once, still
      const W = cv.clientWidth, H = cv.clientHeight, dpr = devicePixelRatio || 1;
      if (!W || !H) return;
      // resize the drawing surface when either side changes (only checking the width left it stretched when the mini
      // card's column changed height)
      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      const s = H / 150;      // drawn for a 150 px tall canvas
      const g = cv.getContext("2d")!; g.setTransform(dpr * s, 0, 0, dpr * s, 0, 0);
      const perf = live.frozenPerf ?? performance.now();
      const b = live.song?.beats ?? null, placed = !!b && live.aligned && live.songOffset != null;
      // your singing: a shrug and a head shake when you've just missed a note; a celebration for a line sung
      // Excellent or Perfect
      const v = placed ? recentVerdict(live.now(perf), 45) : null;
      const cheer = placed ? lineCheer(live.now(perf), perf) : null;
      st.tick(placed ? b : null, placed ? live.songTime(perf) * 100 : null, v, perf, playing, cheer);
      st.draw(g, W / s, H / s, Math.max(1, 0.75 / s), perf);   // drawn smaller than 150 px tall: lines no thinner than 3 px
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [show, aligned, playing]);
  if (!show) return null;
  return <canvas ref={ref} aria-hidden className={`pointer-events-none ${className}`} />;
}
