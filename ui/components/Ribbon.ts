// The lane's light ribbon ("Lumen"), drawn while no notes are shown (a blind take, or a song being learned): the
// music's loudness in four bands as braided threads of light that come out of the now line and scroll into the
// past at the notes' speed, over a soft glow drawn at 1/4 size (the upscale is the blur). Colours come from the
// album cover, pulled towards OnKey's violet. The future side holds a faint wash of the same colours.
// Frames come from the engine (src-tauri/src/viz.rs) through live.viz; everything here is a pure function of
// them and the clock, except a calmer copy of the bands that gives the threads their shape.
import { live, type VizFrame } from "@/lib/session";
import { sizedArt } from "@/components/Cover";

type RGB = [number, number, number];
export type Palette = { bands: [RGB, RGB, RGB, RGB]; accent: RGB; light: RGB };

const VIOLET: Palette = { bands: [[98, 82, 224], [155, 138, 255], [232, 121, 249], [103, 232, 249]], accent: [181, 168, 255], light: [214, 206, 255] };
const WHITE: RGB = [255, 255, 255];
const BRAND: RGB = [124, 108, 246];
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const mix = (a: RGB, b: RGB, k: number): RGB => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const rgba = (c: RGB, a: number) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${clamp(a).toFixed(3)})`;

// ---------------------------------------------------------------- the palette, from the cover
function rgb2hsl([r, g, b]: RGB): RGB {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function hsl2rgb(h: number, s: number, l: number): RGB {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}
const lum = (c: RGB) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];

/** Up to four vivid colours from an image: a hue histogram (15° bins) weighted by saturation and mid lightness,
 *  the strongest bins at least 30° apart; null if the image has fewer than two. */
export function paletteFrom(img: CanvasImageSource): Palette | null {
  const S = 24, c = document.createElement("canvas"); c.width = c.height = S;
  const x = c.getContext("2d", { willReadFrequently: true });
  if (!x) return null;
  x.drawImage(img, 0, 0, S, S);
  const d = x.getImageData(0, 0, S, S).data;           // throws if the image isn't CORS-clean (then: violet)
  const bins = Array.from({ length: 24 }, (_, i) => ({ i, w: 0, r: 0, g: 0, b: 0 }));
  for (let i = 0; i < d.length; i += 4) {
    const [h, s, l] = rgb2hsl([d[i], d[i + 1], d[i + 2]]);
    if (l < 0.1 || l > 0.93 || s < 0.22) continue;
    const w = s * s * (1 - Math.abs(l - 0.55) * 1.4);
    if (w <= 0) continue;
    const bn = bins[Math.floor(h / 15) % 24];
    bn.w += w; bn.r += d[i] * w; bn.g += d[i + 1] * w; bn.b += d[i + 2] * w;
  }
  const picked: typeof bins = [];
  for (const b of bins.filter(b => b.w > 0.6).sort((a, b) => b.w - a.w)) {
    if (picked.length === 4) break;
    if (picked.some(p => Math.min(Math.abs(p.i - b.i), 24 - Math.abs(p.i - b.i)) < 2)) continue;
    picked.push(b);
  }
  if (picked.length < 2) return null;
  const cols: RGB[] = picked.map(b => [b.r / b.w, b.g / b.w, b.b / b.w]);
  for (let k = 0; cols.length < 4; k++) { const [h, s, l] = rgb2hsl(cols[k % cols.length]); cols.push(hsl2rgb((h + (k % 2 ? -28 : 28) + 360) % 360, s, l)); }
  // on-brand: 22% towards OnKey violet, vivid and bright enough to glow on near-black; bass the deepest
  const out = cols.map(c => { const [h, s, l] = rgb2hsl(mix(c, BRAND, 0.22)); return hsl2rgb(h, clamp(s * 1.1, 0.55, 0.95), clamp(l, 0.52, 0.72)); });
  out.sort((a, b) => lum(a) - lum(b));
  return { bands: [out[0], out[1], out[2], out[3]], accent: mix(out[2], WHITE, 0.25), light: mix(out[3], WHITE, 0.55) };
}

const palettes = new Map<string, Palette | null>();
/** The palette for a cover (violet until it has loaded, and when there's none or it can't be read). */
export function paletteFor(art: string | null | undefined): Palette {
  if (!art || typeof window === "undefined") return VIOLET;
  if (!palettes.has(art)) {
    palettes.set(art, null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { try { palettes.set(art, paletteFrom(img)); } catch { /* not readable: violet */ } };
    img.src = sizedArt(art, 96);
  }
  return palettes.get(art) ?? VIOLET;
}

// ---------------------------------------------------------------- the frames, as drawn
/** Each frame with a calmer copy of its bands (`s`: attack 80 ms, release 350 ms) for the threads' shape; under
 *  reduced motion the bands themselves are slowed (attack 180 ms, release 800 ms) and the beat is ignored. */
type Shaped = VizFrame & { s: number[] };
const shaped: Shaped[] = [];
let shapedFor: unknown = null, shapedReduced = false, sm = [0, 0, 0, 0], smRms = 0;
function shape(reduced: boolean) {
  const src = live.viz;
  if (shapedFor !== live.song?.version || shapedReduced !== reduced || (shaped.length && src.length && src[src.length - 1].f < shaped[shaped.length - 1].f)) {
    shaped.length = 0; shapedFor = live.song?.version; shapedReduced = reduced; sm = [0, 0, 0, 0]; smRms = 0;
  }
  const last = shaped.length ? shaped[shaped.length - 1].f : -Infinity;
  let i = src.length;
  while (i > 0 && src[i - 1].f > last) i--;
  const [ta, tr] = reduced ? [0.18, 0.8] : [0.08, 0.35];
  const dt = 1 / 60;
  const fol = (c: number, x: number) => c + (x - c) * (1 - Math.exp(-dt / (x > c ? ta : tr)));
  for (; i < src.length; i++) {
    const f = src[i];
    sm = sm.map((v, k) => fol(v, f.b[k])); smRms = fol(smRms, f.rms);
    shaped.push(reduced ? { ...f, b: [sm[0], sm[1], sm[2], sm[3]], rms: smRms, beat: 0, onset: 0, s: sm.slice() } : { ...f, s: sm.slice() });
  }
  const keep = shaped.length ? shaped[shaped.length - 1].f - 500 : 0;
  let k = 0;
  while (k < shaped.length && shaped[k].f < keep) k++;
  if (k) shaped.splice(0, k);
}

// ---------------------------------------------------------------- drawing
export type Geometry = { W: number; H: number; L: number; top: number; bottom: number; nowX: number; px: number; now: number };

/** Bass lowest, highs on top; each sways and twists at its own slow rate in song time (so it scrolls with the
 *  lane rather than wobbling in place). */
const WEAVE = [
  { off: 0.12, sway: 0.07, fq: 0.11, tw: 0.27, ph: 0.4, h: 0.2, a: 0.18 },
  { off: 0.04, sway: 0.08, fq: 0.15, tw: 0.34, ph: 2.6, h: 0.16, a: 0.16 },
  { off: -0.04, sway: 0.08, fq: 0.19, tw: 0.41, ph: 4.4, h: 0.13, a: 0.16 },
  { off: -0.12, sway: 0.07, fq: 0.24, tw: 0.49, ph: 1.0, h: 0.1, a: 0.18 },
];
const SHARP_S = 2.1;          // seconds of the past on the sharp layer; older parts live on the glow layer only

type Band = { yc: number[]; hh: number[]; col: RGB; col2: RGB; a: number };

// a smooth curve through points (Catmull-Rom as cubic Béziers)
function curve(c: CanvasRenderingContext2D, xs: number[], ys: number[], move: boolean, rev = false) {
  const n = xs.length, I = rev ? (i: number) => n - 1 - i : (i: number) => i;
  const X = (i: number) => xs[I(Math.max(0, Math.min(n - 1, i)))], Y = (i: number) => ys[I(Math.max(0, Math.min(n - 1, i)))];
  if (move) c.moveTo(X(0), Y(0)); else c.lineTo(X(0), Y(0));
  for (let i = 0; i < n - 1; i++) {
    c.bezierCurveTo(X(i) + (X(i + 1) - X(i - 1)) / 6, Y(i) + (Y(i + 1) - Y(i - 1)) / 6,
                    X(i + 1) - (X(i + 2) - X(i)) / 6, Y(i + 1) - (Y(i + 2) - Y(i)) / 6, X(i + 1), Y(i + 1));
  }
}
function blob(c: CanvasRenderingContext2D, x: number, y: number, r: number, col: RGB, a: number) {
  if (a <= 0.003 || r <= 1) return;
  const gr = c.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, rgba(col, a)); gr.addColorStop(0.45, rgba(col, a * 0.45)); gr.addColorStop(1, rgba(col, 0));
  c.fillStyle = gr; c.fillRect(x - r, y - r, 2 * r, 2 * r);
}
const hash = (x: number) => { const s = Math.sin(x * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

/** The ribbon's newest frame, if the music has been heard lately (else nothing is drawn). */
export function ribbonLive(now: number) {
  const v = live.viz;
  return v.length > 0 && now - v[v.length - 1].f < 150 && v[v.length - 1].f - v[0].f > 20;
}

/**
 * Draw the ribbon: the glow into `fx` (null: none; a canvas at 1/4 size, cleared by the caller, composited over the lane with
 * "screen"), the sharp threads into `g`. `dim` scales it (1: blind and learning; a faint one behind notes).
 */
export function drawRibbon(g: CanvasRenderingContext2D, fx: CanvasRenderingContext2D | null, G: Geometry, pal: Palette, reduced: boolean, dim = 1, wash = true) {
  shape(reduced);
  const { L, W, H, top, bottom, nowX, px, now } = G, mid = (top + bottom) / 2, span = bottom - top;
  const xOf = (f: number) => nowX + (f - now) * px;
  // the frames on screen, every 2nd (plenty for a smooth curve), the newest held out to the now line
  const pts: Shaped[] = [];
  for (let i = shaped.length - 1; i >= 0; i -= i === shaped.length - 1 ? 1 : 2) {
    if (shaped[i].f > now) continue;
    pts.unshift(shaped[i]);
    if (xOf(shaped[i].f) < L - 20) break;
  }
  const fr = pts.length ? pts[pts.length - 1] : null;
  const beat = reduced || !fr ? 0 : fr.beat;
  if (fx) fx.globalCompositeOperation = "lighter";
  if (fx && wash && fr) futureWash(fx, G, pal, fr.rms, fr.b, reduced, dim);
  if (pts.length < 3 || !fr) { if (fx) fx.globalCompositeOperation = "source-over"; return; }
  const xs = pts.map(f => xOf(f.f));
  xs.push(nowX); pts.push(fr);                                  // the batches arrive ~0.1 s late: hold to now
  const bands: Band[] = WEAVE.map((w, i) => {
    const yc: number[] = [], hh: number[] = [];
    for (let k = 0; k < pts.length; k++) {
      const f = pts[k], t = (k === pts.length - 1 ? now : f.f) / 100, age = (now - f.f) / 100;
      const depth = 1 - 0.55 * clamp(age / 2.7);                 // thinner into the past
      yc.push(mid + span * (w.off + w.sway * Math.sin(2 * Math.PI * w.fq * t + w.ph)));
      // a twisting ribbon: its (signed) width passes through zero now and then, where its edges cross
      const twist = Math.cos(2 * Math.PI * w.tw * t + w.ph * 1.7);
      hh.push(span * w.h * (0.06 + 0.94 * f.s[i]) * depth * (0.18 + 0.82 * Math.abs(twist)) * Math.sign(twist || 1));
    }
    return { yc, hh, col: pal.bands[i], col2: pal.bands[(i + 1) % 4], a: w.a };
  });
  const sharpFrom = nowX - SHARP_S * 100 * px;
  // along a thread: its colour at the tip, turning into its neighbour's and fading out into the past
  const fade = (c: CanvasRenderingContext2D, col: RGB, col2: RGB, a: number, x0: number) => {
    const gr = c.createLinearGradient(x0, 0, nowX, 0);
    gr.addColorStop(0, rgba(col2, 0)); gr.addColorStop(0.45, rgba(mix(col2, col, 0.4), a * 0.4 * dim)); gr.addColorStop(1, rgba(col, a * dim));
    return gr;
  };
  const body = (c: CanvasRenderingContext2D, b: Band) => {
    c.beginPath(); curve(c, xs, b.yc.map((y, i) => y - b.hh[i]), true); curve(c, xs, b.yc.map((y, i) => y + b.hh[i]), false, true); c.closePath();
  };
  const strand = (c: CanvasRenderingContext2D, b: Band, k: number, wob: number) => {
    c.beginPath(); curve(c, xs, b.yc.map((y, i) => y + b.hh[i] * (k + wob * Math.sin(xs[i] * 0.013 + k * 3))), true); c.stroke();
  };
  // the glow: a faint body and the edges as soft tubes of light (7 px drawn at 1/4 size)
  if (fx) fx.lineCap = "round";
  if (fx) for (const b of bands) {
    body(fx, b); fx.fillStyle = fade(fx, b.col, b.col2, b.a, L); fx.fill();
    fx.lineWidth = 7; fx.strokeStyle = fade(fx, b.col, b.col2, 0.3, L);
    strand(fx, b, -1, 0); strand(fx, b, 1, 0);
  }
  // the sharp layer: fine threads of light only, inside the past
  g.save(); g.beginPath(); g.rect(L, top, nowX - L + 1, bottom - top); g.clip();
  g.globalCompositeOperation = "lighter"; g.lineCap = "round";
  for (const b of bands) {
    const lc = mix(b.col, WHITE, 0.45), lc2 = mix(b.col2, WHITE, 0.45);
    for (const [k, wob, lw, a] of [[-1, 0, 1.2, 0.85], [1, 0, 1.2, 0.85], [0, 0.6, 0.6, 0.35]]) {
      g.lineWidth = lw; g.strokeStyle = fade(g, lc, lc2, a, sharpFrom); strand(g, b, k, wob);
    }
  }
  g.restore();
  // the future is unknown: a faint guide line
  g.fillStyle = rgba(pal.light, 0.07 * dim); g.fillRect(nowX, mid - 0.5, W - nowX, 1);
  // the tip: a small soft light at the now line that blooms on each beat
  const ty = (bands[1].yc[bands[1].yc.length - 1] + bands[2].yc[bands[2].yc.length - 1]) / 2;
  if (fx) blob(fx, nowX, ty, 26 + 70 * fr.rms + 60 * beat, pal.bands[2], (0.12 + 0.22 * fr.rms + 0.32 * beat) * dim);
  if (fx) blob(fx, nowX, ty, 12 + 30 * fr.b[3], pal.light, (0.1 + 0.2 * fr.b[3] + 0.18 * beat) * dim);
  const r = 4 + 3 * fr.rms + 5 * beat, gr = g.createRadialGradient(nowX, ty, 0, nowX, ty, r);
  gr.addColorStop(0, rgba(WHITE, (0.45 + 0.4 * beat) * dim)); gr.addColorStop(0.45, rgba(pal.light, 0.2 * dim)); gr.addColorStop(1, rgba(pal.light, 0));
  g.fillStyle = gr; g.fillRect(nowX - r, ty - r, 2 * r, 2 * r);
  // sparks: on strong beats a few specks leave the tip and drift into the past a little faster than the lane,
  // fading within about a second (a pure function of the frames: at most 20)
  if (!reduced && dim >= 1) {
    let n = 0;
    for (let i = shaped.length - 1; i >= 0 && now - shaped[i].f < 140 && n < 20; i--) {
      const f = shaped[i];
      if (f.onset < 22 || f.f > now) continue;
      for (let k = 0; k < 4 && n < 20; k++, n++) {
        const r1 = hash(f.f * 0.07 + k), r2 = hash(f.f * 0.13 + k * 3), r3 = hash(f.f * 0.03 + k * 11);
        const life = 0.7 + 0.6 * r3, age = (now - f.f) / 100;
        if (age > life) continue;
        const x = nowX - age * 100 * px - age * (60 + 90 * r1), y = ty + (r2 - 0.5) * span * 0.12 + (r2 - 0.5) * 220 * age;
        if (x < L) continue;
        const a = (1 - age / life) ** 1.6, col = pal.bands[(k + 1) % 4];
        g.fillStyle = rgba(mix(col, WHITE, 0.6), 0.85 * a);
        g.beginPath(); g.arc(x, y, 1.4 + 1.1 * r3, 0, Math.PI * 2); g.fill();
        if (fx) blob(fx, x, y, 14 + 8 * r3, col, 0.6 * a);
      }
    }
  }
  // the glow stays inside the rows
  if (!fx) return;
  fx.globalCompositeOperation = "destination-out"; fx.fillStyle = "#000";
  fx.fillRect(0, 0, W, top); fx.fillRect(0, bottom, W, H - bottom);
  fx.globalCompositeOperation = "source-over";
}

// the future: the cover's colours as a slow wash (so the frosted card has light behind it and the right side
// isn't empty), fading out towards the now line so the ribbon's tip stays the brightest thing
function futureWash(c: CanvasRenderingContext2D, G: Geometry, pal: Palette, rms: number, b: number[], reduced: boolean, dim: number) {
  const { W, H, top, bottom, nowX } = G, cx = nowX + (W - nowX) / 2, cy = (top + bottom) / 2, R = Math.min(W - nowX, H) * 0.75;
  const t = performance.now() / 1000, k = (0.11 + 0.08 * rms) * dim;
  for (const [i, j] of [[1, 0], [3, 1], [2, 2]]) {
    const a = t * (reduced ? 0.012 : 0.04) * (j % 2 ? -1 : 1) + j * 2.1;
    blob(c, cx + Math.cos(a) * R * 0.38, cy + Math.sin(a) * R * 0.2, R * (0.8 + 0.12 * b[i]), mix(pal.bands[i], BRAND, 0.3), j === 2 ? k * 0.6 : k);
  }
  c.globalCompositeOperation = "destination-out";
  const gr = c.createLinearGradient(nowX, 0, nowX + (W - nowX) * 0.3, 0);
  gr.addColorStop(0, "rgba(0,0,0,1)"); gr.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = gr; c.fillRect(nowX - 2, 0, (W - nowX) * 0.3 + 2, H);
  c.globalCompositeOperation = "lighter";
}

/** A tile of fine noise (as a CSS background) laid over the lane while the ribbon shows: it dithers the
 *  gradients on near-black, so they don't band. Static, so it costs nothing per frame. */
let grainUrl = "";
export function grain(): string {
  if (grainUrl || typeof document === "undefined") return grainUrl;
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const x = c.getContext("2d");
  if (!x) return "";
  const im = x.createImageData(128, 128);
  let s = 7;
  for (let i = 0; i < im.data.length; i += 4) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const v = s / 0x7fffffff;
    im.data[i] = im.data[i + 1] = im.data[i + 2] = v > 0.5 ? 255 : 0;
    im.data[i + 3] = Math.abs(v - 0.5) * 2 * 14;
  }
  x.putImageData(im, 0, 0);
  return (grainUrl = `url(${c.toDataURL()})`);
}
