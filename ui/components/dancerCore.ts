// The dancer's moves and drawing, without React, so a lab page can drive the very same code with made-up beats.
// Ideas taken from animation research: each joint follows its target pose through a critically damped
// spring (Daniel Holden, "Spring-It-On", theorangeduck.com), so a change of move or a reaction never snaps, and
// forearms and head use slower springs than the hips, so they trail the body a little (follow-through). The figure
// is a tiny 3D rig seen from the front: turning him (yaw) swings the limbs into depth (the far arm and leg are drawn
// first, behind the body, all in one solid colour), and bent knees and elbows fold forwards rather than outwards as he turns side-on (a
// view-dependent pose, as in Rivers, Igarashi and Durand's "2.5D cartoon models").

export type Beats = { at: number[]; downbeat: number; bpm: number; energy: number[] };

export type Pose = {
  hx: number; hy: number; hz: number;   // hip offset (px): sideways (+ = your right), down, forwards (where he faces)
  lean: number; bend: number;           // torso tilt sideways and forwards (radians)
  head: number; nod: number;            // head tilt sideways and forwards
  sL: number; eL: number; sR: number; eR: number;   // shoulders (from hanging down, + = outwards/up) and elbows
  aL: number; aR: number;               // arms swung forwards (- = back)
  lL: number; kL: number; lR: number; kR: number;   // legs (from straight down, + = outwards) and knees
  fL: number; fR: number;               // legs swung forwards
  yaw: number;                          // body turn: 0 = facing you, +π/2 = side-on facing your right
};
export const REST: Pose = { hx: 0, hy: 0, hz: 0, lean: 0, bend: 0, head: 0, nod: 0, sL: 0.25, eL: 0.2, sR: 0.25, eR: 0.2,
  aL: 0, aR: 0, lL: 0.12, kL: 0.05, lR: 0.12, kR: 0.05, fL: 0, fR: 0, yaw: 0 };
const KEYS = Object.keys(REST) as (keyof Pose)[];
export const mix = (a: Pose, b: Pose, t: number): Pose => {
  const o = { ...a };
  for (const k of KEYS) o[k] = a[k] + (b[k] - a[k]) * t;
  return o;
};
const TAU = 2 * Math.PI;
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (x: number) => x * x * (3 - 2 * x);
const ease = (x: number) => { x = clamp(x); return x * x * x * (x * (6 * x - 15) + 10); };   // smootherstep
const dn = (φ: number) => 0.5 + 0.5 * Math.cos(TAU * φ);          // 1 on the beat (knees bent, low), 0 between
const bump = (φ: number, c: number, w: number) => Math.exp(-(((φ - c) / w) ** 2));

// ------------------------------------------------------------------ moves
/** φ: 0..1 through the beat; k: beat number; A: 0..1 how big; dir: ±1 which way to face for side-on moves. */
type Move = (φ: number, k: number, A: number, dir: number) => Pose;
const MOVES: Record<string, Move> = {
  // --- calm
  sway(φ, k, A) {      // hips lead a slow side to side over two beats, the torso and arms follow
    const s = Math.sin(Math.PI * (k + φ)), d = dn(φ);
    return { ...REST, hx: 6 * A * s, hy: 2.5 * d, lean: -0.1 * A * s, head: 0.12 * s, yaw: 0.15 * s,
             sL: 0.3 - 0.2 * s, sR: 0.3 + 0.2 * s, eL: 0.6, eR: 0.6, aL: 0.25 * s, aR: -0.25 * s,
             lL: 0.14, lR: 0.14, kL: 0.25 * d + 0.3 * Math.max(0, -s), kR: 0.25 * d + 0.3 * Math.max(0, s) };
  },
  bob(φ, k, A) {
    const d = dn(φ), sw = (k % 2 ? 1 : -1) * Math.sin(Math.PI * φ);
    return { ...REST, hy: 5 * A * d, head: 0.12 * A * d, nod: 0.1 * d, kL: 0.5 * A * d, kR: 0.5 * A * d, lL: 0.15, lR: 0.15,
             sL: 0.3 + 0.35 * A * sw, sR: 0.3 - 0.35 * A * sw, eL: 0.8, eR: 0.8, yaw: 0.12 * sw };
  },
  roll(φ, k, A, dir) {  // shoulder roll, three-quarters on: the torso rocks while the shoulders circle
    const θ = TAU * φ, d = dn(φ);
    return { ...REST, yaw: dir * 1.1, hy: 3 * d, bend: 0.08 + 0.12 * A * Math.sin(θ), nod: -0.12 * Math.sin(θ), lean: 0.05 * Math.cos(θ),
             sL: 0.35 + 0.15 * Math.cos(θ), sR: 0.35 - 0.15 * Math.cos(θ), aL: 0.4 * A * Math.sin(θ), aR: -0.4 * A * Math.sin(θ),
             eL: 1.1, eR: 1.1, lL: 0.1, lR: 0.1, kL: 0.3 * d + 0.1, kR: 0.3 * d + 0.1, fL: 0.1, fR: -0.1 };
  },
  wave(φ, k, A) {
    const L = k % 2 === 0, w = Math.sin(Math.PI * φ);
    return { ...REST, hx: (L ? -3 : 3) * A * w, lean: (L ? 0.08 : -0.08) * A * w, head: (L ? 0.15 : -0.15) * w, yaw: (L ? 0.2 : -0.2) * w,
             sL: L ? 1.6 + 0.9 * A * w : 0.4, eL: L ? 0.6 * (1 - w) : 0.4, sR: L ? 0.4 : 1.6 + 0.9 * A * w, eR: L ? 0.4 : 0.6 * (1 - w),
             kL: 0.2, kR: 0.2 };
  },
  clap(φ, k, A) {
    const c = Math.exp(-(((φ < 0.5 ? φ : 1 - φ) * 9) ** 2)), d = dn(φ);
    return { ...REST, hy: 4 * A * d, head: 0.1 * d, nod: 0.1 * d, sL: 1.25 - 0.55 * c, eL: 1.3 + 0.6 * c, sR: 1.25 - 0.55 * c, eR: 1.3 + 0.6 * c,
             kL: 0.35 * A * d, kR: 0.35 * A * d, lL: 0.15, lR: 0.15 };
  },
  // --- side-on
  steptouch(φ, k, A, dir) {   // side-on, stepping forwards and back on the spot, arms swinging against the legs
    const w = (k % 2 ? -1 : 1) * (2 * smooth(clamp(φ * 1.6)) - 1), d = dn(φ);
    return { ...REST, yaw: dir * 1.35, hz: 3 * A * w, hy: 3 * d, bend: 0.05, nod: 0.1 * d,
             fL: 0.4 * A * w, fR: -0.4 * A * w, kL: 0.15 + 0.3 * d + 0.3 * Math.max(0, -w), kR: 0.15 + 0.3 * d + 0.3 * Math.max(0, w),
             lL: 0.06, lR: 0.06, sL: 0.12, sR: 0.12, aL: -0.6 * A * w, aR: 0.6 * A * w, eL: 0.9, eR: 0.9 };
  },
  glide(φ, k, A, dir) {       // moonwalk: one heel up, the flat foot slides back; they swap every beat
    const u = k % 2 === 0, d = dn(φ), slide = 0.2 - 0.55 * A * smooth(φ);
    const up = { f: 0.35, k: 1.0 }, flat = { f: slide, k: 0.05 };
    const L = u ? up : flat, R = u ? flat : up;
    return { ...REST, yaw: dir * 1.45, hy: 2 + 2 * d, bend: 0.12, nod: 0.12 * d, fL: L.f, kL: L.k, fR: R.f, kR: R.k, lL: 0.04, lR: 0.04,
             sL: 0.2, sR: 0.2, eL: 1.0, eR: 1.0, aL: u ? 0.25 : -0.2, aR: u ? -0.2 : 0.25 };
  },
  groove(φ, k, A, dir) {      // three-quarters on, bouncing forwards on the beat, elbows pumping
    const d = dn(φ), alt = (k % 2 ? 1 : -1) * Math.sin(Math.PI * φ);
    return { ...REST, yaw: dir * 0.7, hy: 4 * A * d, bend: 0.12 + 0.12 * A * d, nod: 0.2 * d,
             sL: 0.35, sR: 0.35, eL: 1.7, eR: 1.7, aL: 0.4 + 0.4 * alt, aR: 0.4 - 0.4 * alt,
             kL: 0.15 + 0.5 * d, kR: 0.15 + 0.5 * d, lL: 0.15, lR: 0.15, fL: 0.12, fR: -0.12 };
  },
  kick(φ, k, A, dir) {        // side-on, the near leg kicks forwards on every other beat
    const on = k % 2 === 1, d = dn(φ);
    const c = on ? bump(φ, 0.42, 0.22) : 0;
    const knee = on ? 1.4 * bump(φ, 0.18, 0.12) + 1.0 * bump(φ, 0.72, 0.13) : 0;
    const kickF = (0.3 + 1.1 * A) * c, nearR = dir > 0;
    return { ...REST, yaw: dir * 1.4, hy: on ? -2 * c : 3 * d, bend: -0.15 * c + (on ? 0 : 0.08 * d), nod: 0.1 * d,
             fL: nearR ? -0.1 : kickF, kL: nearR ? 0.25 + 0.3 * (on ? 0 : d) : knee, lL: 0.05,
             fR: nearR ? kickF : -0.1, kR: nearR ? knee : 0.25 + 0.3 * (on ? 0 : d), lR: 0.05,
             sL: 0.4, sR: 0.4, eL: 1.2, eR: 1.2, aL: (nearR ? 0.7 : -0.5) * c, aR: (nearR ? -0.5 : 0.7) * c };
  },
  // --- busy
  step(φ, k, A) {
    const s = (k % 2 ? -1 : 1) * (2 * smooth(clamp(φ * 2)) - 1), d = dn(φ);
    return { ...REST, hx: 7 * A * s, hy: 3 * A * d, lean: -0.08 * A * s, head: -0.1 * s, yaw: -0.2 * s,
             lL: 0.1 + 0.3 * A * Math.max(0, s), lR: 0.1 + 0.3 * A * Math.max(0, -s), kL: 0.3 * d, kR: 0.3 * d,
             sL: 0.5 + 0.4 * A * Math.max(0, -s), eL: 1.5, sR: 0.5 + 0.4 * A * Math.max(0, s), eR: 1.5 };
  },
  point(φ, k, A) {
    const up = k % 2 === 0, d = dn(φ);
    return { ...REST, hx: (up ? 4 : -4) * A, hy: 3 * d, lean: (up ? -0.1 : 0.1) * A, head: up ? -0.2 : 0.15, yaw: up ? -0.35 : 0.15,
             sR: up ? 2.6 : 0.9, eR: 0.05, sL: 0.6, eL: 2.2, lL: 0.2, lR: 0.08, kL: 0.4 * d, kR: 0.1 };
  },
  shimmy(φ, k, A) {
    const q = Math.sin(4 * Math.PI * φ), d = dn(φ);
    return { ...REST, hy: 6 + 2 * d, lean: 0.12 * A * q, head: -0.1 * q, yaw: 0.25 * q, sL: 0.9 + 0.3 * q, eL: 1.7, sR: 0.9 - 0.3 * q, eR: 1.7,
             lL: 0.3, lR: 0.3, kL: 0.6, kR: 0.6 };
  },
  jump(φ, k, A) {             // crouch (arms back) before the beat, up on it, land soft
    const even = k % 2 === 0;
    const air = even ? Math.sin(Math.PI * clamp((φ - 0.1) / 0.75)) : 0;
    const c = even ? Math.max(0, 1 - φ / 0.1) + 0.7 * clamp((φ - 0.85) / 0.15)
                   : φ < 0.4 ? 0.7 - 1.25 * φ : 0.2 + 0.8 * smooth((φ - 0.4) / 0.6);
    return { ...REST, hy: 7 * A * c - 14 * A * air, bend: 0.2 * c, nod: -0.15 * air,
             sL: 0.4 + 2.1 * air, sR: 0.4 + 2.1 * air, eL: 0.3, eR: 0.3, aL: -0.7 * c + 0.2 * air, aR: -0.7 * c + 0.2 * air,
             lL: 0.15 + 0.12 * air, lR: 0.15 + 0.12 * air, kL: 0.9 * c + 0.4 * air, kR: 0.9 * c + 0.4 * air };
  },
  headbang(φ, k, A, dir) {
    const d = dn(φ);
    return { ...REST, yaw: dir * 0.5, hy: 5 * d, bend: 0.1 + 0.2 * A * d, nod: 0.5 * A * d, lean: 0.08 * d,
             sL: 0.7, eL: 1.9, sR: 0.7, eR: 1.9, lL: 0.3, lR: 0.3, kL: 0.5 * d, kR: 0.5 * d };
  },
};
const CALM = ["sway", "bob", "steptouch", "roll", "wave", "clap"];
const MID = ["step", "groove", "steptouch", "clap", "glide", "point", "bob"];
const BUSY = ["jump", "kick", "shimmy", "glide", "headbang", "point", "groove", "step"];
const SHRUG: Pose = { ...REST, hy: 1, sL: 0.45, eL: 1.5, sR: 0.45, eR: 1.5, aL: 0.3, aR: 0.3, kL: 0.2, kR: 0.2 };
const TADA: Pose = { ...REST, hy: -2, nod: -0.2, sL: 2.2, eL: 0.1, sR: 2.2, eR: 0.1, lL: 0.25, lR: 0.25 };
const ARMS_OUT = { sL: 1.45, eL: 0.15, sR: 1.45, eR: 0.15, aL: 0, aR: 0 };

const hash = (n: number) => { let h = Math.imul(n | 0, 2654435761) >>> 0; h ^= h >>> 15; return Math.imul(h, 2246822519) >>> 0; };

// ------------------------------------------------------------------ the dance, from the song's beats
/** Where the beat is at song frame f (10 ms): the beat number k from the downbeat, φ through it, the beat's
 *  energy and the average energy of each phrase (8 beats). Fast songs (> 140 bpm) dance on every other beat. */
function beatAt(b: Beats, f: number) {
  const step = b.bpm > 140 ? 2 : 1, at = b.at;
  if (!at.length || f < at[0]) return null;
  let lo = 0, hi = at.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (at[m] <= f) lo = m; else hi = m - 1; }
  if (step === 2) lo -= (((lo - b.downbeat) % 2) + 2) % 2;
  if (lo < 0 || lo + step > at.length - 1) return null;
  const φ = clamp((f - at[lo]) / Math.max(1, at[lo + step] - at[lo]));
  const k = Math.floor((lo - b.downbeat) / step);
  const e = (i: number) => b.energy[clamp(i, 0, b.energy.length - 1)] ?? 0.5;
  const phraseEnergy = (p: number) => {
    let s = 0;
    for (let j = 0; j < 8; j++) s += e(b.downbeat + (p * 8 + j) * step);
    return s / 8;
  };
  // each song its own order of moves
  const seed = hash(at.length * 131 + Math.round(b.bpm * 10)) & 0xffff;
  return { φ, k, energy: e(lo), phraseEnergy, seed };
}

/** The move for each phrase: from a set chosen by the phrase's energy, never the same twice in a row. */
function pick(p: number, energy: (p: number) => number, seed: number) {
  let prev = "";
  for (let q = p - 3; q <= p; q++) {
    const E = energy(q), set = E < 0.35 ? CALM : E < 0.68 ? MID : BUSY, h = hash(q + seed);
    let m = set[h % set.length];
    if (m === prev) m = set[(h % set.length + 1) % set.length];
    prev = m;
  }
  return prev;
}

/** The move dancing at song frame f (for the lab preview's labels). */
export function moveAt(b: Beats, f: number) {
  const at = beatAt(b, f);
  return at ? pick(Math.floor(at.k / 8), at.phraseEnergy, at.seed) : "";
}

/** The pose the beat asks for at song frame f, or null before the first beat or after the last. */
export function dancePose(b: Beats, f: number): Pose | null {
  const at = beatAt(b, f);
  if (!at) return null;
  const { φ, k, phraseEnergy, seed } = at;
  const A = 0.55 + 0.45 * at.energy;
  const phrase = Math.floor(k / 8), into = (k % 8 + 8) % 8 + φ;
  // side-on, he mostly turns to face into the page: he stands at its right edge (the lane's corner, the mini card's
  // right), so facing right turns him away from it. About one phrase in four he faces the other way, for variety
  // (Daniel, 19 Oct). Spins turn the same way as the phrase faces.
  const dirOf = (p: number) => (hash(p + seed + 7919) % 4 === 0 ? 1 : -1);
  let pose = MOVES[pick(phrase, phraseEnergy, seed)](φ, k, A, dirOf(phrase));
  // a new move eases in over the phrase's first beat (the old one keeps its own rhythm while it fades)
  if (into < 1) pose = mix(MOVES[pick(phrase - 1, phraseEnergy, seed)](φ, k, A, dirOf(phrase - 1)), pose, ease(into));
  const h = hash(phrase * 31 + seed + 5) % 6, E = phraseEnergy(phrase);
  // flourishes: a spin with arms out over a lively phrase's last two beats, landing on the next downbeat...
  if (h === 1 && E >= 0.35 && into >= 6) {
    const t = (into - 6) / 2, w = Math.sin(Math.PI * t);
    pose = { ...pose, ...mix(pose, { ...pose, ...ARMS_OUT, hy: pose.hy - 2 }, 0.8 * w), yaw: pose.yaw + dirOf(phrase) * TAU * ease(t) };
  }
  // ...or "ta-da", arms up and open, on a phrase's first beat
  if (h === 3 && into < 1) pose = mix(pose, { ...TADA, yaw: pose.yaw, hz: pose.hz }, 0.7 * Math.sin(Math.PI * into));
  // arm raises over whatever move is on: on more than half the bars (more on busy songs) one arm or both go up from
  // the downbeat for about two beats and come back down (Daniel, 19 Oct: "a tad more arm raising")
  const bar = Math.floor(k / 4), inBar = ((k % 4) + 4) % 4 + φ, rb = hash(bar * 131 + seed + 11) % 100;
  const chance = 45 + 30 * clamp(E);
  if (rb < chance && inBar < 2 && !(h === 1 && into >= 6) && !(h === 3 && into < 1)) {
    const w = Math.sin(Math.PI * inBar / 2) ** 0.8 * (0.75 + 0.25 * at.energy), which = rb % 3;      // 0 left, 1 right, 2 both
    const up = (s0: number, e0: number) => [s0 + (2.55 - s0) * w, e0 + (0.2 - e0) * w];
    if (which !== 1) [pose.sL, pose.eL] = up(pose.sL, pose.eL);
    if (which !== 0) [pose.sR, pose.eR] = up(pose.sR, pose.eR);
    if (which !== 1) pose.aL *= 1 - w;
    if (which !== 0) pose.aR *= 1 - w;
  }
  return pose;
}

/** Waiting (before the beat starts, paused before placing, ...): standing, breathing. */
export const idlePose = (perf: number): Pose => ({ ...REST, hy: 1.5 * Math.sin(perf / 600), head: 0.04 * Math.sin(perf / 1300) });

/** Your singing, mixed in: a shrug and a head shake when you've just missed a note (miss 0..1). Hitting notes
 *  doesn't change his dance (singing well keeps "hit" on, and a cheer pose froze him with his arms up): a line sung
 *  Excellent or Perfect gets a celebration instead (DanceState.party). */
export function react(p: Pose, _hit: number, miss: number, perf: number): Pose {
  if (miss > 0.001) {
    p = mix(p, { ...SHRUG, yaw: p.yaw, hz: p.hz, hx: p.hx }, 0.5 * miss);
    p = { ...p, head: p.head + 0.3 * miss * Math.sin(perf / 55) };
  }
  return p;
}

// ------------------------------------------------------------------ springs
// how long (s) each part takes to get half way to where the pose wants it: the hips quickest, the forearms and
// head slowest, so they trail the body (follow-through); turning takes longest
const HALF: Record<keyof Pose, number> = { hx: 0.035, hy: 0.03, hz: 0.04, lean: 0.045, bend: 0.045, head: 0.08, nod: 0.08,
  sL: 0.05, sR: 0.05, eL: 0.085, eR: 0.085, aL: 0.055, aR: 0.055, lL: 0.035, lR: 0.035, kL: 0.035, kR: 0.035, fL: 0.035, fR: 0.035,
  yaw: 0.11 };
/** The body lags its springs by about this much (s), so the dance is worked out this far ahead to land on the beat. */
export const LEAD = 0.05;

export class Rig {
  x: Pose = { ...REST };
  v: Record<string, number> = {};
  snap(t: Pose) { this.x = { ...t }; this.v = {}; }
  /** a critically damped spring per joint (exact for a still target; Holden's simple_spring_damper_exact) */
  step(t: Pose, dt: number) {
    // turn the short way round (a finished spin's 2π is the same as 0)
    const ty = t.yaw + TAU * Math.round((this.x.yaw - t.yaw) / TAU);
    for (const k of KEYS) {
      const goal = k === "yaw" ? ty : t[k], y = (2 * Math.LN2) / HALF[k];
      const j0 = this.x[k] - goal, v = this.v[k] || 0, j1 = v + j0 * y, e = Math.exp(-y * dt);
      this.x[k] = e * (j0 + j1 * dt) + goal;
      this.v[k] = e * (v - j1 * y * dt);
    }
    this.x.yaw -= TAU * Math.round(this.x.yaw / TAU);
  }
}

// ------------------------------------------------------------------ drawing
type P3 = { x: number; y: number; z: number };
/** Draw pose p in a W×H box (drawn for 150 px tall); glow 0..1 is the green "hit" glow, smile 0..1 a smile. */
/** `weight` thickens the lines (small canvases: the figure is drawn scaled down). */
// solid, opaque ink
const INK = "rgb(222,216,255)";

export type Anchors = { head: P3; hip: P3; handL: P3; handR: P3 };
export function draw(g: CanvasRenderingContext2D, W: number, H: number, p: Pose, glow = 0, smile = 0, weight = 1, shadow = true): Anchors {
  g.clearRect(0, 0, W, H);
  const cy = Math.cos(p.yaw), sy = Math.sin(p.yaw), side = Math.abs(sy);
  const ground = H - 10, hip = { x: W / 2 + p.hx * cy + p.hz * sy, y: ground - 46 + p.hy };
  if (shadow) { g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(W / 2 + (hip.x - W / 2) * 0.6, ground + 2, 22, 4, 0, 0, TAU); g.fill(); }
  // body space: x your right (when facing you), y down, z towards you; turned by yaw, then seen from the front
  const scr = (v: P3, o: P3 = { x: 0, y: 0, z: 0 }): P3 => ({ x: o.x + v.x * cy + v.z * sy, y: o.y + v.y, z: o.z - v.x * sy + v.z * cy });
  const add = (a: P3, b: P3, n = 1): P3 => ({ x: a.x + b.x * n, y: a.y + b.y * n, z: a.z + b.z * n });
  // the upper body tilted sideways (lean) then forwards (bend)
  const tilt = (v: P3, l: number, b: number): P3 => {
    const cl = Math.cos(l), sl = Math.sin(l), cb = Math.cos(b), sb = Math.sin(b);
    const x = v.x * cl + v.y * sl, y = -v.x * sl + v.y * cl;
    return { x, y: y * cb - v.z * sb, z: -y * sb + v.z * cb };
  };
  // a limb's direction: σ = +1 for his left (your right), a from hanging down outwards, f swung forwards
  const dir = (σ: number, a: number, f: number): P3 => ({ x: σ * Math.sin(a) * Math.cos(f), y: Math.cos(a) * Math.cos(f), z: Math.sin(f) });
  const H0: P3 = { x: hip.x, y: hip.y, z: 0 };
  const up = (v: P3) => scr(tilt(v, p.lean, p.bend));
  const neck = add(H0, up({ x: 0, y: -34, z: 0 }));
  const head = add(neck, scr(tilt({ x: 0, y: -12, z: 0 }, p.lean + p.head, p.bend + p.nod)));
  const shc = add(H0, up({ x: 0, y: -30, z: 0 }));
  // elbows and knees bend outwards seen from the front (it reads better) and forwards seen from the side
  // each limb is drawn from the spine itself (shoulder centre, hip), through its shoulder or hip joint, so it joins
  // the body in one stroke (starting it at the joint left a gap from the front)
  type Limb = P3[];
  const limbs: Limb[] = [];
  for (const σ of [1, -1]) {
    const s = σ > 0 ? p.sL : p.sR, e = σ > 0 ? p.eL : p.eR, a = σ > 0 ? p.aL : p.aR;
    const r = add(shc, up({ x: σ * 3.5, y: 0, z: 0 }));
    const m = add(r, up(dir(σ, s, a)), 17);
    limbs.push([shc, r, m, add(m, up(dir(σ, s + e * (1 - 0.6 * side), a + 0.8 * e * side)), 16)]);
    const l = σ > 0 ? p.lL : p.lR, k = σ > 0 ? p.kL : p.kR, f = σ > 0 ? p.fL : p.fR;
    const hr = add(H0, scr({ x: σ * 2.5, y: 0, z: 0 }));
    const km = add(hr, scr(dir(σ, l + 0.5 * k * (1 - side), f + 0.6 * k * side)), 23);
    limbs.push([H0, hr, km, add(km, scr(dir(σ, l - 0.5 * k * (1 - side), f - 0.6 * k * side)), 23)]);
  }
  const anchors: Anchors = { head, hip: H0, handL: limbs[0][3], handR: limbs[2][3] };
  limbs.sort((a, b) => a[1].z - b[1].z);      // far limbs first (by the joint: the spine end is shared)
  g.lineCap = "round"; g.lineJoin = "round";
  const line = (pts: P3[]) => { g.beginPath(); g.moveTo(pts[0].x, pts[0].y); for (const q of pts.slice(1)) g.lineTo(q.x, q.y); g.stroke(); };
  const figure = (w: number, a: number, depth: boolean) => {
    const limb = (L: Limb) => {
      // one solid colour for every limb (a darker or see-through far limb read as flickering translucency)
      g.globalAlpha = a; g.lineWidth = w; line(L);
    };
    for (const L of limbs) if (L[1].z < 0) limb(L);
    g.globalAlpha = a; g.lineWidth = w;
    line([H0, neck]);
    // round the joins where the limbs leave the body
    for (const q of [H0, shc]) { g.beginPath(); g.arc(q.x, q.y, w * 0.62, 0, TAU); g.fillStyle = g.strokeStyle; g.fill(); }
    g.beginPath(); g.arc(head.x, head.y - 2, 8.5, 0, TAU); g.stroke();
    for (const L of limbs) if (L[1].z >= 0) limb(L);
  };
  // the glow: the figure drawn wide and faint underneath (a canvas shadow blur is redrawn pixel by pixel every frame)
  if (glow > 0.02) {
    g.strokeStyle = "rgb(52,210,123)";
    figure(16 * weight, 0.08 * glow, false); figure(10 * weight, 0.13 * glow, false);
  }
  const ink = INK;
  g.strokeStyle = ink; figure(4 * weight, 1, true);
  // a face that shows which way he's looking: two eyes from the front, one from the side, none from behind
  const hc = { x: head.x, y: head.y - 2 }, ht = p.lean + p.head, ct = Math.cos(ht), st = Math.sin(ht);
  const onHead = (dx: number, dy: number) => ({ x: hc.x + dx * ct - dy * st, y: hc.y + dx * st + dy * ct });
  g.fillStyle = ink;
  for (const o of [-0.45, 0.45]) {
    const c = Math.cos(p.yaw + o);
    if (c < 0.15) continue;
    const q = onHead(5.4 * Math.sin(p.yaw + o), -1.2);
    g.globalAlpha = clamp((c - 0.15) * 3); g.beginPath(); g.arc(q.x, q.y, 1.4, 0, TAU); g.fill();
  }
  if (smile > 0.05 && cy > 0.2) {
    const q = onHead(3.6 * sy, 1.0);
    g.globalAlpha = smile * clamp((cy - 0.2) * 3); g.lineWidth = 1.5;
    g.beginPath(); g.arc(q.x, q.y, 3.2, 0.15 * Math.PI + ht, 0.85 * Math.PI + ht); g.stroke();
  }
  g.globalAlpha = 1;
  return anchors;
}

// ------------------------------------------------------------------ celebrations
// A line sung Excellent or Perfect: one of these for 1.6 s, picked at random (never the same twice running), then
// straight back to the dance. Constant rewards (arms up, a glow, a smile on every hit note) froze him and felt odd.
export const PARTY = ["popper", "fireworks", "sparkles", "starjump", "backflip", "fistpump", "airguitar", "floss", "spin", "kneeslide", "notes"] as const;
export type Party = typeof PARTY[number];
const PARTY_S = 1.6;
const ARMS_UP = { sL: 2.6, eL: 0.15, sR: 2.6, eR: 0.15, aL: 0, aR: 0 };
/** How much of the celebration shows at t (0..1): in over 0.15, out over the last 0.2. */
const partyIn = (t: number) => ease(t / 0.15) * ease((1 - t) / 0.2);
function partyPose(k: Party, t: number, p: Pose): Pose {
  const hop = Math.sin(Math.PI * clamp(t));
  switch (k) {
    case "popper": return { ...p, sR: 2.4, eR: 0.1, aR: 0.3, sL: 0.6, eL: 1.2, aL: 0, hy: p.hy - 2 * hop, lean: -0.08 };
    case "fireworks": return { ...p, ...ARMS_UP, sL: 2.2, sR: 2.2, nod: -0.3, hy: p.hy - 1 };
    case "sparkles": return { ...p, sL: 1.2, eL: 1.6, sR: 1.2, eR: 1.6, aL: 0, aR: 0, hy: -3 * Math.abs(Math.sin(TAU * 2 * t)) };
    case "starjump": { const j = Math.sin(Math.PI * clamp(t * 1.15));
      return { ...p, sL: 1.2 + 1.3 * j, eL: 0.05, sR: 1.2 + 1.3 * j, eR: 0.05, aL: 0, aR: 0, lL: 0.12 + 0.45 * j, lR: 0.12 + 0.45 * j,
               kL: 0, kR: 0, fL: 0, fR: 0, hy: -16 * j, yaw: 0, bend: 0, lean: 0 }; }
    case "backflip": {      // arms swing up to take off, tucks into a ball at the top (knees to chest, arms round
      // the shins), opens out to land
      const j = Math.sin(Math.PI * t), tuck = clamp(Math.sin(Math.PI * clamp((t - 0.18) / 0.6)) * 1.3);
      const arms = mix({ ...p, ...ARMS_UP }, { ...p, sL: 0.5, eL: 1.3, aL: 1.3, sR: 0.5, eR: 1.3, aR: 1.3 }, tuck);
      return { ...arms, fL: 1.7 * tuck, fR: 1.7 * tuck, kL: 0.3 + 2.2 * tuck, kR: 0.3 + 2.2 * tuck, lL: 0.15, lR: 0.15,
               bend: 0.45 * tuck, nod: 0.4 * tuck, hy: -20 * j, yaw: -Math.PI / 2, lean: 0, hx: 0, hz: 0 }; }   // side-on, facing into the page
    case "fistpump": { const u = Math.abs(Math.sin(TAU * 1.5 * t));
      return { ...p, sR: 1.8 + 0.9 * u, eR: 1.4 - 1.2 * u, aR: 0, nod: -0.15 * u, hy: p.hy + 1.5 * u, yaw: p.yaw * 0.3 }; }
    case "airguitar": { const w = Math.sin(TAU * 6 * t);    // three-quarter on, leaning back: neck hand out, strumming
      return { ...p, yaw: -0.75, lean: 0, bend: -0.28, nod: -0.4, sL: 0.5, eL: 0.25, aL: 1.25, sR: 0.25, eR: 1.5 + 0.25 * w, aR: 0.75,
               lL: 0.3, lR: 0.3, kL: 0.5, kR: 0.5, fL: 0, fR: 0, hy: 5 }; }
    case "floss": { const w = Math.sin(TAU * 4 * t), c = Math.cos(TAU * 4 * t);   // straight arms swung across, hips the other way
      return { ...p, hx: -5 * w, sL: 0.3 + 0.7 * w, sR: 0.3 - 0.7 * w, eL: 0.05, eR: 0.05, aL: 0.5 * c, aR: -0.5 * c,
               lean: 0.06 * w, yaw: 0, bend: 0, lL: 0.15, lR: 0.15, kL: 0.1, kR: 0.1 }; }
    case "spin": return { ...p, ...ARMS_OUT, yaw: p.yaw - TAU * ease((t - 0.1) / 0.75), hy: p.hy - 2 };
    case "kneeslide": return { ...p, ...ARMS_UP, sL: 2.3, sR: 2.3, hy: 14, bend: -0.3, nod: -0.3, kL: 1.6, kR: 1.6, fL: 0.2, fR: -0.9,
                               hx: -10 * ease(t / 0.6), yaw: 0, lean: 0 };
    case "notes": return { ...p, head: 0.2 * Math.sin(TAU * 2 * t), sL: 0.5, eL: 1.8, sR: 0.5, eR: 1.8, aL: 0, aR: 0 };
  }
}
const FESTIVE = ["#ff6b8b", "#ffd166", "#06d6a0", "#4cc9f0", "#b388ff", "#ff9f43"];
/** The effects drawn over him: confetti, fireworks, sparkles, music notes (the rest are dance moves alone). */
function partyFx(g: CanvasRenderingContext2D, k: Party, t: number, a: Anchors, seed: number) {
  const T = t * PARTY_S, fadeOut = clamp((1 - t) / 0.3);
  const rnd = (i: number) => (hash(seed * 97 + i) % 1000) / 1000;
  g.save();
  if (k === "popper") {
    const h = a.handR;
    if (t < 0.5) {      // the popper itself
      g.globalAlpha = clamp((0.5 - t) / 0.15); g.fillStyle = "#ffd166";
      g.beginPath(); g.moveTo(h.x, h.y); g.lineTo(h.x - 4, h.y + 7); g.lineTo(h.x + 4, h.y + 7); g.closePath(); g.fill();
    }
    const T0 = Math.max(0, T - 0.12);
    for (let i = 0; i < 30; i++) {
      const ang = -Math.PI / 2 + (rnd(i) - 0.5) * 1.8, sp = 70 + 70 * rnd(i + 50);
      const x = h.x + Math.cos(ang) * sp * T0, y = h.y + Math.sin(ang) * sp * T0 + 140 * T0 * T0;
      g.globalAlpha = fadeOut * clamp(T0 * 8); g.fillStyle = FESTIVE[i % FESTIVE.length];
      g.save(); g.translate(x, y); g.rotate(T0 * 10 * (rnd(i + 99) - 0.5) * 2); g.fillRect(-1.6, -0.9, 3.2, 1.8); g.restore();
    }
  } else if (k === "fireworks") {
    for (const [dx, dy, t0, c] of [[-22, -8, 0.08, 0], [20, -16, 0.32, 2], [-2, -24, 0.55, 4]] as const) {
      const τ = T - t0 * PARTY_S;
      if (τ < 0) continue;
      const cx = a.head.x + dx, cy = a.head.y + dy, r = 18 * (1 - Math.exp(-τ * 4)), al = clamp(1 - τ / 0.9);
      g.strokeStyle = FESTIVE[c]; g.lineWidth = 1.6; g.lineCap = "round";
      for (let i = 0; i < 14; i++) {
        const ang = (i / 14) * TAU + rnd(i + c) * 0.2;
        g.globalAlpha = al; g.beginPath();
        g.moveTo(cx + Math.cos(ang) * r * 0.55, cy + Math.sin(ang) * r * 0.55 + 6 * τ * τ);
        g.lineTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r + 6 * τ * τ); g.stroke();
      }
    }
  } else if (k === "sparkles") {
    for (let i = 0; i < 7; i++) {
      const ang = (i / 7) * TAU + 0.4, R = 26 + 8 * rnd(i);
      const x = a.hip.x + Math.cos(ang) * R, y = a.hip.y - 22 + Math.sin(ang) * R * 1.2;
      const sc = Math.max(0, Math.sin(Math.PI * clamp((t - 0.08 * i / 7) * 1.6))) * (0.7 + 0.3 * Math.sin(T * 14 + i));
      g.globalAlpha = fadeOut; g.fillStyle = i % 2 ? "#ffd166" : "#ffffff";
      g.beginPath();
      for (let j = 0; j < 8; j++) { const rr = (j % 2 ? 1.2 : 4.5) * sc, aa = (j / 8) * TAU; g.lineTo(x + Math.cos(aa) * rr, y + Math.sin(aa) * rr); }
      g.closePath(); g.fill();
    }
  } else if (k === "notes") {
    g.font = "bold 13px system-ui, sans-serif"; g.textAlign = "center";
    for (let i = 0; i < 4; i++) {
      const τ = T - i * 0.25;
      if (τ < 0) continue;
      const x = a.head.x + (i % 2 ? 12 : -12) + 4 * Math.sin(τ * 6), y = a.head.y - 8 - 30 * τ;
      g.globalAlpha = clamp(1 - τ / 1.1) * fadeOut; g.fillStyle = FESTIVE[(i * 2 + 1) % FESTIVE.length];
      g.fillText(i % 2 ? "♫" : "♪", x, y);
    }
  }
  g.restore();
}

/** Everything the dancer remembers between frames: the springs and how much of a hit or a miss is showing. */
export class DanceState {
  rig = new Rig();
  hit = 0; miss = 0;
  private last = 0;
  /** the celebration playing (from a line sung Excellent or Perfect): which, and when it started (perf ms) */
  party: { k: Party; start: number; seed: number } | null = null;
  private cheered = -1;
  private lastParty = -1;
  /** One frame: f the song frame (10 ms) or null when there's no placed beat yet, perf the clock (ms),
   *  moving false to hold still (paused: drawn as is, no springs). */
  tick(b: Beats | null, f: number | null, verdict: "hit" | "miss" | null, perf: number, moving: boolean, cheer: number | null = null) {
    const dt = this.last ? clamp((perf - this.last) / 1000, 0, 0.1) : 0;
    this.last = perf;
    const target0 = (b && f != null && dancePose(b, f + LEAD * 100)) || idlePose(perf);
    const fade = (x: number, to: number, half: number) => to + (x - to) * Math.exp(-(Math.LN2 / half) * dt);
    this.hit = moving ? fade(this.hit, verdict === "hit" ? 1 : 0, verdict === "hit" ? 0.05 : 0.12) : verdict === "hit" ? 1 : 0;
    this.miss = moving ? fade(this.miss, verdict === "miss" ? 1 : 0, 0.06) : verdict === "miss" ? 1 : 0;
    let target = react(target0, this.hit, this.miss, perf);
    // a new excellent line: a celebration (`cheer` is when the line's word appeared, the same for its whole showing)
    if (cheer != null && cheer !== this.cheered) {
      this.cheered = cheer;
      let i = hash(Math.round(cheer) + 17) % PARTY.length;
      if (i === this.lastParty) i = (i + 1) % PARTY.length;
      this.lastParty = i;
      this.party = { k: PARTY[i], start: perf, seed: Math.round(cheer) };
    }
    const t = this.party ? (perf - this.party.start) / (PARTY_S * 1000) : 1;
    if (this.party && t >= 1) this.party = null;
    if (this.party) target = mix(target, partyPose(this.party.k, t, target), partyIn(t));
    if (moving && dt > 0) this.rig.step(target, dt); else this.rig.snap(target);
    return this.rig.x;
  }
  draw(g: CanvasRenderingContext2D, W: number, H: number, weight = 1, perf = 0) {
    const pt = this.party ? clamp((perf - this.party.start) / (PARTY_S * 1000)) : 0;
    // a backflip turns the whole figure over around his hips: side-on facing left, backwards is clockwise
    const flip = this.party?.k === "backflip" ? TAU * ease((pt - 0.2) / 0.6) : 0;
    g.clearRect(0, 0, W, H);      // here, unturned (draw's own clear would be turned with him)
    if (flip) {
      const p = this.rig.x, hx = W / 2 + p.hx * Math.cos(p.yaw) + p.hz * Math.sin(p.yaw), hy = H - 10 - 46 + p.hy - 18;
      g.save(); g.translate(hx, hy); g.rotate(flip); g.translate(-hx, -hy);
    }
    const a = draw(g, W, H, this.rig.x, this.party ? 0.3 * partyIn(pt) : 0, 0, weight, !flip);
    if (flip) g.restore();
    if (this.party) partyFx(g, this.party.k, pt, a, this.party.seed);
  }
}
