// One made-up phrase used by every diagram, so the reader sees the same song learned, placed and scored.
// Each syllable: start and end (seconds), note (semitones above the lowest row), word.
export const PHRASE: [number, number, number, string][] = [
  [0.2, 0.55, 4, "Here's"], [0.6, 0.85, 4, "a"], [0.9, 1.5, 7, "line"],
  [1.6, 1.9, 6, "you"], [1.95, 2.6, 4, "sing"], [2.7, 3.0, 2, "a-"], [3.05, 3.9, 4, "long"],
];
export const DUR = 4.1;
export const ROWS = 10;

/** The singer's pitch at time t (semitones), with glides, vibrato and the odd gap: what CREPE hears. NaN = silent. */
export function singerPitch(t: number) {
  for (let i = 0; i < PHRASE.length; i++) {
    const [s, e, n] = PHRASE[i];
    if (t >= s && t <= e) {
      const prev = i ? PHRASE[i - 1][2] : n;
      const glide = Math.max(0, 1 - (t - s) / 0.08);              // a quick scoop up into the note
      const vib = (e - s > 0.5 ? 0.18 : 0.06) * Math.sin((t - s) * 2 * Math.PI * 5.5);
      return n + (prev - n) * glide * 0.6 + vib;
    }
  }
  return NaN;
}

/** Your pitch: close to the singer, a little flat on one note and late on another. */
export function yourPitch(t: number) {
  const late = t > 1.9 && t < 2.7 ? 0.12 : 0.04;
  const p = singerPitch(t - late);
  if (Number.isNaN(p)) return NaN;
  return p + (t > 0.9 && t < 1.55 ? -0.6 : 0.08) + 0.05 * Math.sin(t * 17);
}

/** A waveform, for the mix and the vocal: louder where the singer sings. */
export function waveform(n: number, part: "mix" | "vocal" | "backing", seed = 1) {
  const out: number[] = [];
  let s = seed;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
  for (let i = 0; i < n; i++) {
    const t = (i / n) * DUR;
    const sung = !Number.isNaN(singerPitch(t)) ? 1 : 0.15;
    const beat = 0.55 + 0.45 * Math.abs(Math.sin(t * Math.PI * 2));
    const v = part === "vocal" ? sung * 0.8 : part === "backing" ? beat * 0.55 : 0.5 * sung + 0.45 * beat;
    out.push(rnd() * v);
  }
  return out;
}
