"use client";
import { useEffect, useRef, useState } from "react";

/** True when the reader asked for less motion: diagrams then show each step's final, labelled frame. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(q.matches);
    on();
    q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, []);
  return reduced;
}

/**
 * Seconds since `key` last changed, ticking every animation frame while `running` (and the element is on screen).
 * With reduced motion it jumps straight to `settle` seconds, so animations show their end state.
 */
export function useClock(key: unknown, settle = 4, running = true) {
  const reduced = useReducedMotion();
  const [t, setT] = useState(settle);
  const start = useRef(0);
  useEffect(() => {
    if (reduced || !running) { setT(settle); return; }
    start.current = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      setT((now - start.current) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [key, reduced, running, settle]);
  return t;
}

/** 0→1 over `dur` seconds starting at `from`, eased. */
export const ease = (t: number, from: number, dur: number) => {
  const x = Math.min(1, Math.max(0, (t - from) / dur));
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
};

/** Deterministic pseudo-random numbers, so diagrams look the same on every render and every machine. */
export function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
