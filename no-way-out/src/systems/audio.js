// Audio-Engine: alle Geräusche werden prozedural synthetisiert (WebAudio), räumlich (HRTF) abgespielt
// und hinter Wänden gedämpft. Dazu dynamische Musik in Schichten (Erkundung, Spannung, Jagd, Versteck).
import * as THREE from 'three';
import { clamp } from '../core/rng.js';
import { VOICE_IDS } from '../data/story/voicemanifest.js';

const SR = 44100;

// ---------- DSP-Helfer ----------
function buf(ctx, seconds, fn, channels = 1) {
  const n = Math.max(1, Math.floor(seconds * SR));
  const b = ctx.createBuffer(channels, n, SR);
  for (let c = 0; c < channels; c++) {
    const d = b.getChannelData(c);
    fn(d, n, c);
  }
  return b;
}
class OnePole { constructor(cut) { this.set(cut); this.y = 0; } set(cut) { this.a = Math.exp(-2 * Math.PI * cut / SR); } lp(x) { this.y = x + (this.y - x) * this.a; return this.y; } hp(x) { return x - this.lp(x); } }
class Biquad {
  constructor(type, f, q = 0.7) { this.x1 = this.x2 = this.y1 = this.y2 = 0; this.set(type, f, q); }
  set(type, f, q) {
    const w = 2 * Math.PI * f / SR, s = Math.sin(w), c = Math.cos(w), a = s / (2 * q);
    let b0, b1, b2, a0, a1, a2;
    if (type === 'bp') { b0 = a; b1 = 0; b2 = -a; a0 = 1 + a; a1 = -2 * c; a2 = 1 - a; }
    else if (type === 'lp') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = (1 - c) / 2; a0 = 1 + a; a1 = -2 * c; a2 = 1 - a; }
    else { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = (1 + c) / 2; a0 = 1 + a; a1 = -2 * c; a2 = 1 - a; }
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0; this.a1 = a1 / a0; this.a2 = a2 / a0;
  }
  p(x) { const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2; this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y; return y; }
}
const rnd = () => Math.random() * 2 - 1;
const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) / d));
function normalize(d, peak = 0.9) { let m = 0; for (let i = 0; i < d.length; i++) m = Math.max(m, Math.abs(d[i])); if (m > 0) { const k = peak / m; for (let i = 0; i < d.length; i++) d[i] *= k; } }

// ---------- Klangbibliothek ----------
const LIB = {
  step_hard: (ctx, v) => buf(ctx, 0.18, (d) => { const bp = new Biquad('bp', 900 + v * 300, 1.2), lp = new OnePole(3000); for (let i = 0; i < d.length; i++) { const t = i / SR; d[i] = (bp.p(rnd()) * 1.2 + lp.lp(rnd()) * 0.4) * env(t, 0.002, 0.03) + Math.sin(t * 2 * Math.PI * (90 + v * 20)) * env(t, 0.001, 0.02) * 0.6; } normalize(d, 0.8); }),
  step_concrete: (ctx, v) => buf(ctx, 0.22, (d) => { const bp = new Biquad('bp', 500 + v * 200, 0.9), bp2 = new Biquad('bp', 2400, 2); for (let i = 0; i < d.length; i++) { const t = i / SR; d[i] = bp.p(rnd()) * env(t, 0.002, 0.045) + bp2.p(rnd()) * 0.4 * env(t, 0.01, 0.04) * (Math.random() < 0.3 ? 1 : 0.3); } normalize(d, 0.8); }),
  step_metal: (ctx, v) => buf(ctx, 0.4, (d) => { const f = [430, 1130, 2210].map((x) => x * (1 + v * 0.05)); for (let i = 0; i < d.length; i++) { const t = i / SR; let s = 0; f.forEach((ff, k) => { s += Math.sin(t * 2 * Math.PI * ff) * Math.exp(-t * (8 + k * 6)); }); d[i] = s * 0.3 + rnd() * env(t, 0.001, 0.015); } normalize(d, 0.7); }),
  step_gravel: (ctx, v) => buf(ctx, 0.3, (d) => { const bp = new Biquad('bp', 1800 + v * 400, 0.8); for (let i = 0; i < d.length; i++) { const t = i / SR; const grain = Math.random() < 0.12 ? rnd() * 3 : rnd() * 0.3; d[i] = bp.p(grain) * env(t, 0.01, 0.08); } normalize(d, 0.7); }),
  step_wet: (ctx, v) => buf(ctx, 0.3, (d) => { const bp = new Biquad('bp', 700 + v * 200, 1.0), hp = new Biquad('hp', 3000, 0.7); for (let i = 0; i < d.length; i++) { const t = i / SR; d[i] = bp.p(rnd()) * env(t, 0.003, 0.05) + hp.p(rnd()) * 0.5 * env(t, 0.02, 0.08); } normalize(d, 0.8); }),
  door_open: (ctx) => buf(ctx, 1.2, (d) => { const bp = new Biquad('bp', 600, 6); let ph = 0; for (let i = 0; i < d.length; i++) { const t = i / SR; const f = 380 + 160 * Math.sin(t * 3.5) + 60 * Math.sin(t * 17); ph += f / SR; const creak = Math.sign(Math.sin(ph * 2 * Math.PI)) * (Math.random() < 0.5 ? 1 : 0.4); d[i] = bp.p(creak) * 0.5 * Math.min(1, t * 6) * Math.exp(-t * 1.8) + (t < 0.05 ? rnd() * (1 - t / 0.05) * 0.8 : 0); } normalize(d, 0.6); }),
  door_close: (ctx) => buf(ctx, 0.5, (d) => { const lp = new OnePole(600); for (let i = 0; i < d.length; i++) { const t = i / SR; d[i] = lp.lp(rnd()) * 3 * env(t, 0.002, 0.06) + Math.sin(t * 2 * Math.PI * 70) * env(t, 0.002, 0.1) + (t > 0.03 && t < 0.06 ? rnd() * 0.3 : 0); } normalize(d, 0.9); }),
  door_slam: (ctx) => buf(ctx, 0.9, (d) => { const lp = new OnePole(900); for (let i = 0; i < d.length; i++) { const t = i / SR; d[i] = lp.lp(rnd()) * 3 * env(t, 0.001, 0.09) + Math.sin(t * 2 * Math.PI * 55) * env(t, 0.001, 0.18) * 1.2; } normalize(d, 1); }),
  door_bash: (ctx) => buf(ctx, 0.6, (d) => { const lp = new OnePole(500), bp = new Biquad('bp', 180, 3); for (let i = 0; i < d.length; i++) { const t = i / SR; d[i] = lp.lp(rnd()) * 3 * env(t, 0.001, 0.05) + bp.p(rnd()) * 3 * env(t, 0.002, 0.12) + Math.sin(t * 2 * Math.PI * 48) * env(t, 0.001, 0.15); } normalize(d, 1); }),
  slide_door: (ctx) => buf(ctx, 1.4, (d) => { const lp = new OnePole(400), bp = new Biquad('bp', 2200, 4); for (let i = 0; i < d.length; i++) { const t = i / SR; const e = Math.min(1, t * 4) * Math.min(1, (1.4 - t) * 3); d[i] = (lp.lp(rnd()) * 0.8 + Math.sin(t * 2 * Math.PI * 110) * 0.3 + bp.p(rnd()) * 0.1) * e + (t < 0.04 ? Math.sin(t * 2 * Math.PI * 1400) * 0.3 : 0); } normalize(d, 0.6); }),
  locked: (ctx) => buf(ctx, 0.5, (d) => { for (let i = 0; i < d.length; i++) { const t = i / SR; const hits = [0, 0.12, 0.22]; let s = 0; for (const h of hits) if (t > h) s += Math.sin((t - h) * 2 * Math.PI * 1900) * Math.exp(-(t - h) * 60) + rnd() * Math.exp(-(t - h) * 90) * 0.5; d[i] = s; } normalize(d, 0.6); }),
  unlock: (ctx) => buf(ctx, 0.4, (d) => { for (let i = 0; i < d.length; i++) { const t = i / SR; d[i] = (Math.sin(t * 2 * Math.PI * 1200) * Math.exp(-t * 40) + (t > 0.15 ? Math.sin((t - 0.15) * 2 * Math.PI * 800) * Math.exp(-(t - 0.15) * 30) : 0)) * 0.6 + rnd() * Math.exp(-t * 80) * 0.3; } normalize(d, 0.6); }),
  beep_card: (ctx) => buf(ctx, 0.3, (d) => { for (let i = 0; i < d.length; i++) { const t = i / SR; d[i] = Math.sin(t * 2 * Math.PI * (t < 0.12 ? 1500 : 2000)) * (t < 0.25 ? 0.5 : 0); } }),
  locker_open: (ctx) => buf(ctx, 0.6, (d) => { const bp = new Biquad('bp', 1300, 5); for (let i = 0; i < d.length; i++) { const t = i / SR; d[i] = bp.p(rnd()) * env(t, 0.005, 0.15) + Math.sin(t * 2 * Math.PI * 330) * env(t, 0.002, 0.08) * 0.4; } normalize(d, 0.6); }),
  locker_close: (ctx) => buf(ctx, 0.4, (d) => { const bp = new Biquad('bp', 700, 3); for (let i = 0; i < d.length; i++) { const t = i / SR; d[i] = bp.p(rnd()) * env(t, 0.001, 0.05) * 2 + Math.sin(t * 2 * Math.PI * 240) * env(t, 0.001, 0.12) * 0.6; } normalize(d, 0.7); }),
  cloth: (ctx) => buf(ctx, 0.5, (d) => { const bp = new Biquad('bp', 2500, 0.6); for (let i = 0; i < d.length; i++) { const t = i / SR; d[i] = bp.p(rnd()) * Math.sin(t / 0.5 * Math.PI) * 0.5; } normalize(d, 0.4); }),
  vault: (ctx) => buf(ctx, 0.6, (d) => { const bp = new Biquad('bp', 400, 1); for (let i = 0; i < d.length; i++) { const t = i / SR; d[i] = bp.p(rnd()) * (env(t, 0.01, 0.08) + (t > 0.35 ? env(t - 0.35, 0.002, 0.05) * 1.5 : 0)); } normalize(d, 0.7); }),
  land: (ctx) => LIB.door_close(ctx),
  click: (ctx) => buf(ctx, 0.05, (d) => { for (let i = 0; i < d.length; i++) { const t = i / SR; d[i] = rnd() * Math.exp(-t * 400) + Math.sin(t * 2 * Math.PI * 3000) * Math.exp(-t * 200) * 0.5; } normalize(d, 0.5); }),
  ui: (ctx) => buf(ctx, 0.06, (d) => { for (let i = 0; i < d.length; i++) { const t = i / SR; d[i] = Math.sin(t * 2 * Math.PI * 1800) * Math.exp(-t * 90) * 0.4; } }),
  notify: (ctx) => buf(ctx, 0.7, (d) => { for (let i = 0; i < d.length; i++) { const t = i / SR; d[i] = (Math.sin(t * 2 * Math.PI * 1320) * env(t, 0.005, 0.12) + (t > 0.15 ? Math.sin((t - 0.15) * 2 * Math.PI * 1760) * env(t - 0.15, 0.005, 0.18) : 0)) * 0.35; } }),
  vibrate: (ctx) => buf(ctx, 0.9, (d) => { for (let i = 0; i < d.length; i++) { const t = i / SR; const on = (t < 0.35 || (t > 0.5 && t < 0.85)) ? 1 : 0; d[i] = (Math.sin(t * 2 * Math.PI * 160) * 0.6 + rnd() * 0.15) * on * (0.6 + 0.4 * Math.sin(t * 2 * Math.PI * 25)); } normalize(d, 0.5); }),
  ring: (ctx) => buf(ctx, 2.0, (d) => { for (let i = 0; i < d.length; i++) { const t = i / SR; const on = (t % 1.0) < 0.6 ? 1 : 0; d[i] = (Math.sin(t * 2 * Math.PI * 880) + Math.sin(t * 2 * Math.PI * 1100) * 0.6) * on * 0.3 * (0.7 + 0.3 * Math.sin(t * 2 * Math.PI * 18)); } }),
  pickup: (ctx) => buf(ctx, 0.35, (d) => { const bp = new Biquad('bp', 3000, 1); for (let i = 0; i < d.length; i++) { const t = i / SR; d[i] = bp.p(rnd()) * env(t, 0.01, 0.06) * 0.6 + Math.sin(t * 2 * Math.PI * 520) * env(t, 0.003, 0.05) * 0.3; } normalize(d, 0.5); }),
  paper: (ctx) => buf(ctx, 0.6, (d) => { const bp = new Biquad('bp', 4000, 0.6); for (let i = 0; i < d.length; i++) { const t = i / SR; const c = Math.random() < 0.1 ? 2 : 0.4; d[i] = bp.p(rnd() * c) * Math.sin(t / 0.6 * Math.PI); } normalize(d, 0.4); }),
  bandage: (ctx) => buf(ctx, 2.0, (d) => { const bp = new Biquad('bp', 3000, 0.8); for (let i = 0; i < d.length; i++) { const t = i / SR; const e = 0.5 + 0.5 * Math.sin(t * 2 * Math.PI * 1.6); d[i] = bp.p(rnd()) * e * 0.5 * (t > 0.2 && Math.random() < 0.02 ? 3 : 1); } normalize(d, 0.35); }),
  pills: (ctx) => buf(ctx, 0.8, (d) => { for (let i = 0; i < d.length; i++) { const t = i / SR; let s = 0; for (let k = 0; k < 6; k++) { const h = 0.05 + k * 0.07; if (t > h) s += Math.sin((t - h) * 2 * Math.PI * (2500 + k * 200)) * Math.exp(-(t - h) * 70); } d[i] = s * 0.3; } }),
  whoosh: (ctx) => buf(ctx, 0.4, (d) => { const bp = new Biquad('bp', 800, 0.7); for (let i = 0; i < d.length; i++) { const t = i / SR; bp.set('bp', 500 + t * 3000, 0.8); d[i] = bp.p(rnd()) * Math.sin(t / 0.4 * Math.PI); } normalize(d, 0.4); }),
  glass_break: (ctx) => buf(ctx, 1.2, (d) => { const hp = new Biquad('hp', 2500, 0.7); for (let i = 0; i < d.length; i++) { const t = i / SR; let s = hp.p(rnd()) * env(t, 0.001, 0.12); if (Math.random() < 0.004 * Math.exp(-t * 3)) s += 1.5; s += Math.sin(t * 2 * Math.PI * (3200 + Math.sin(t * 50) * 400)) * Math.exp(-t * 9) * 0.2; d[i] = s; } normalize(d, 0.9); }),
  can_clatter: (ctx) => buf(ctx, 0.9, (d) => { for (let i = 0; i < d.length; i++) { const t = i / SR; let s = 0; for (const h of [0, 0.18, 0.31, 0.4, 0.46]) if (t > h) s += (Math.sin((t - h) * 2 * Math.PI * 2100) + Math.sin((t - h) * 2 * Math.PI * 3300) * 0.5) * Math.exp(-(t - h) * 40) * (1 - h); d[i] = s; } normalize(d, 0.7); }),
  hit: (ctx) => buf(ctx, 0.4, (d) => { const lp = new OnePole(700); for (let i = 0; i < d.length; i++) { const t = i / SR; d[i] = lp.lp(rnd()) * 4 * env(t, 0.001, 0.05) + Math.sin(t * 2 * Math.PI * 70) * env(t, 0.001, 0.08); } normalize(d, 1); }),
  bite: (ctx) => buf(ctx, 0.8, (d) => { const bp = new Biquad('bp', 1500, 1.5), lp = new OnePole(500); for (let i = 0; i < d.length; i++) { const t = i / SR; d[i] = bp.p(rnd()) * env(t, 0.01, 0.12) * (Math.random() < 0.3 ? 1.5 : 0.5) + lp.lp(rnd()) * 3 * env(t, 0.001, 0.05); } normalize(d, 1); }),
  heartbeat: (ctx) => buf(ctx, 0.9, (d) => { for (let i = 0; i < d.length; i++) { const t = i / SR; const b1 = t < 0.25 ? Math.sin(t * 2 * Math.PI * (55 - t * 40)) * env(t, 0.01, 0.06) : 0; const t2 = t - 0.28; const b2 = t2 > 0 && t2 < 0.3 ? Math.sin(t2 * 2 * Math.PI * (48 - t2 * 30)) * env(t2, 0.01, 0.07) * 0.7 : 0; d[i] = b1 + b2; } normalize(d, 0.9); }),
  generator_start: (ctx) => buf(ctx, 3.0, (d) => { const lp = new OnePole(300); let ph = 0; for (let i = 0; i < d.length; i++) { const t = i / SR; const f = t < 1.2 ? 8 + t * 10 : 28; ph += f / SR; const pulse = Math.max(0, Math.sin(ph * 2 * Math.PI)) ** 4; d[i] = lp.lp(rnd()) * 2 * pulse + Math.sin(t * 2 * Math.PI * f * 2) * 0.3 * (t > 1.2 ? 1 : t / 1.2); } normalize(d, 1); }),
  power_on: (ctx) => buf(ctx, 2.2, (d) => { let ph = 0; for (let i = 0; i < d.length; i++) { const t = i / SR; const f = 40 + t * 60; ph += f / SR; d[i] = (Math.sin(ph * 2 * Math.PI) * 0.6 + Math.sin(ph * 4 * Math.PI) * 0.3) * Math.min(1, t * 3) * Math.exp(-Math.max(0, t - 1.4) * 3) + (t < 0.05 ? rnd() : 0); } normalize(d, 0.9); }),
  power_down: (ctx) => buf(ctx, 2.0, (d) => { let ph = 0; for (let i = 0; i < d.length; i++) { const t = i / SR; const f = 120 * Math.exp(-t * 1.5) + 10; ph += f / SR; d[i] = Math.sin(ph * 2 * Math.PI) * Math.exp(-t * 1.2); } normalize(d, 0.8); }),
  alarm: (ctx) => buf(ctx, 2.0, (d) => { for (let i = 0; i < d.length; i++) { const t = i / SR; const f = (t % 1) < 0.5 ? 760 : 580; d[i] = Math.sign(Math.sin(t * 2 * Math.PI * f)) * 0.25; } }, 1),
  caralarm: (ctx) => buf(ctx, 2.0, (d) => { let ph = 0; for (let i = 0; i < d.length; i++) { const t = i / SR; const f = 900 + 500 * Math.sin(t * 2 * Math.PI * 2.2); ph += f / SR; d[i] = (Math.sin(ph * 2 * Math.PI) > 0 ? 0.35 : -0.35); } }),
  elevator_ding: (ctx) => buf(ctx, 1.6, (d) => { for (let i = 0; i < d.length; i++) { const t = i / SR; d[i] = (Math.sin(t * 2 * Math.PI * 1046) + Math.sin(t * 2 * Math.PI * 2093) * 0.3) * Math.exp(-t * 2.5) * 0.4; } }),
  elevator_motor: (ctx) => buf(ctx, 4.0, (d) => { const lp = new OnePole(200); for (let i = 0; i < d.length; i++) { const t = i / SR; d[i] = (lp.lp(rnd()) * 1.5 + Math.sin(t * 2 * Math.PI * 60) * 0.3 + Math.sin(t * 2 * Math.PI * 120) * 0.15) * Math.min(1, t) * Math.min(1, (4 - t)); } normalize(d, 0.7); }),
  pa_chime: (ctx) => buf(ctx, 2.0, (d) => { const notes = [784, 659, 523]; for (let i = 0; i < d.length; i++) { const t = i / SR; let s = 0; notes.forEach((f, k) => { const h = k * 0.45; if (t > h) s += Math.sin((t - h) * 2 * Math.PI * f) * Math.exp(-(t - h) * 2.2); }); d[i] = s * 0.3; } }),
  drip: (ctx) => buf(ctx, 0.5, (d) => { const f0 = 900 + Math.random() * 900; for (let i = 0; i < d.length; i++) { const t = i / SR; d[i] = Math.sin(t * 2 * Math.PI * (f0 + t * 2500)) * Math.exp(-t * 35) * 0.6; } }),
  metal_creak: (ctx) => buf(ctx, 2.5, (d) => { const bp = new Biquad('bp', 300, 12); let ph = 0; for (let i = 0; i < d.length; i++) { const t = i / SR; const f = 90 + 50 * Math.sin(t * 1.3); ph += f / SR; const src = (ph % 1) < 0.08 ? 1 : 0; d[i] = bp.p(src * 3 + rnd() * 0.05) * Math.sin(t / 2.5 * Math.PI); } normalize(d, 0.6); }),
  bang_distant: (ctx) => buf(ctx, 1.8, (d) => { const lp = new OnePole(250); for (let i = 0; i < d.length; i++) { const t = i / SR; d[i] = lp.lp(rnd()) * 4 * env(t, 0.005, 0.3); } normalize(d, 0.8); }),
  scream_distant: (ctx) => buf(ctx, 2.2, (d) => { const bp = new Biquad('bp', 1100, 4), bp2 = new Biquad('bp', 2600, 5); let ph = 0; for (let i = 0; i < d.length; i++) { const t = i / SR; const f = 520 + 120 * Math.sin(t * 6) + 80 * t; ph += f / SR; const saw = ((ph % 1) * 2 - 1); d[i] = (bp.p(saw) + bp2.p(saw) * 0.6 + rnd() * 0.05) * env(t, 0.15, 0.6); } normalize(d, 0.6); }),
  thunder: (ctx) => buf(ctx, 4, (d) => { const lp = new OnePole(120); for (let i = 0; i < d.length; i++) { const t = i / SR; d[i] = lp.lp(rnd()) * 6 * (env(t, 0.05, 1.2) + 0.4 * env(Math.max(0, t - 0.8), 0.1, 1.5)); } normalize(d, 0.9); }),
  beep: (ctx) => buf(ctx, 1.0, (d) => { for (let i = 0; i < d.length; i++) { const t = i / SR; d[i] = t < 0.09 ? Math.sin(t * 2 * Math.PI * 1000) * 0.3 : 0; } }),
  flatline: (ctx) => buf(ctx, 2.0, (d) => { for (let i = 0; i < d.length; i++) { const t = i / SR; d[i] = Math.sin(t * 2 * Math.PI * 1000) * 0.18; } }),
  gasp: (ctx) => breath(ctx, 0.7, 1.8, 900),
  exhale: (ctx) => breath(ctx, 0.9, 0.7, 700),
  breath_in: (ctx) => breath(ctx, 0.6, 0.5, 1100),
  breath_out: (ctx) => breath(ctx, 0.7, 0.45, 750),
  pain: (ctx) => buf(ctx, 0.6, (d) => { const bp = new Biquad('bp', 600, 2), bp2 = new Biquad('bp', 1400, 3); let ph = 0; for (let i = 0; i < d.length; i++) { const t = i / SR; const f = 140 - t * 60; ph += f / SR; const src = ((ph % 1) * 2 - 1) + rnd() * 0.4; d[i] = (bp.p(src) + bp2.p(src) * 0.5) * env(t, 0.02, 0.18); } normalize(d, 0.7); }),
  glitch: (ctx) => buf(ctx, 0.5, (d) => { for (let i = 0; i < d.length; i++) { const t = i / SR; d[i] = (Math.floor(t * 60) % 2 ? rnd() : Math.sin(t * 2 * Math.PI * 300)) * 0.4 * (t < 0.45 ? 1 : 0); } }),
  sting: (ctx) => buf(ctx, 3.0, (d) => { const lp = new Biquad('lp', 1200, 0.9); const fs = [110, 116.5, 164.8, 233.1, 311]; for (let i = 0; i < d.length; i++) { const t = i / SR; let s = 0; fs.forEach((f, k) => { s += ((t * f * (1 + k * 0.002)) % 1 * 2 - 1) * 0.3; }); lp.set('lp', 400 + 3000 * env(t, 0.05, 0.6), 0.9); d[i] = lp.p(s) * env(t, 0.01, 1.2) + rnd() * env(t, 0.001, 0.08) * 0.8; } normalize(d, 0.85); }),
  chase_hit: (ctx) => buf(ctx, 1.2, (d) => { const lp = new OnePole(180); for (let i = 0; i < d.length; i++) { const t = i / SR; d[i] = lp.lp(rnd()) * 3 * env(t, 0.002, 0.25) + Math.sin(t * 2 * Math.PI * (60 - t * 30)) * env(t, 0.002, 0.4); } normalize(d, 0.9); }),
  fire_loop: (ctx) => buf(ctx, 3, (d) => { const lp = new OnePole(800); for (let i = 0; i < d.length; i++) { d[i] = lp.lp(rnd()) * 0.6 + (Math.random() < 0.002 ? rnd() * 2 : 0); } normalize(d, 0.6); }),
  rain_loop: (ctx) => buf(ctx, 4, (d, n, c) => { const hp = new Biquad('hp', 1200, 0.5), lp = new OnePole(6000); for (let i = 0; i < d.length; i++) { d[i] = lp.lp(hp.p(rnd())) * 0.5 + (Math.random() < 0.003 ? rnd() * 0.6 : 0); } fadeLoop(d); }, 2),
  hvac_loop: (ctx) => buf(ctx, 6, (d, n, c) => { const lp = new OnePole(180), lp2 = new OnePole(900); for (let i = 0; i < d.length; i++) { const t = i / SR; d[i] = lp.lp(rnd()) * 2.2 + lp2.lp(rnd()) * 0.08 + Math.sin(t * 2 * Math.PI * 50) * 0.05 + Math.sin(t * 2 * Math.PI * 100.3) * 0.03; } fadeLoop(d); normalize(d, 0.5); }, 2),
  lab_loop: (ctx) => buf(ctx, 6, (d, n, c) => { const lp = new OnePole(300), hp = new Biquad('bp', 4200, 3); for (let i = 0; i < d.length; i++) { const t = i / SR; d[i] = lp.lp(rnd()) * 1.4 + hp.p(rnd()) * 0.05 + Math.sin(t * 2 * Math.PI * 7000) * 0.004 + Math.sin(t * 2 * Math.PI * 120) * 0.04; } fadeLoop(d); normalize(d, 0.45); }, 2),
  garage_loop: (ctx) => buf(ctx, 8, (d, n, c) => { const lp = new OnePole(90), lp2 = new OnePole(400); for (let i = 0; i < d.length; i++) { const t = i / SR; d[i] = lp.lp(rnd()) * 3 + lp2.lp(rnd()) * 0.2 * (0.5 + 0.5 * Math.sin(t * 0.7 + c)); } fadeLoop(d); normalize(d, 0.5); }, 2),
  tunnel_loop: (ctx) => buf(ctx, 8, (d, n, c) => { const lp = new OnePole(60), bp = new Biquad('bp', 300, 0.6); for (let i = 0; i < d.length; i++) { const t = i / SR; d[i] = lp.lp(rnd()) * 4 * (0.7 + 0.3 * Math.sin(t * 0.4 + c * 2)) + bp.p(rnd()) * 0.06; } fadeLoop(d); normalize(d, 0.55); }, 2),
  wind_loop: (ctx) => buf(ctx, 8, (d, n, c) => { const bp = new Biquad('bp', 500, 0.5), lp = new OnePole(120); for (let i = 0; i < d.length; i++) { const t = i / SR; bp.set('bp', 350 + 250 * Math.sin(t * 0.5 + c), 0.6); d[i] = bp.p(rnd()) * 0.5 * (0.6 + 0.4 * Math.sin(t * 0.3 + c)) + lp.lp(rnd()) * 1.5; } fadeLoop(d); normalize(d, 0.5); }, 2),
  siren_far: (ctx) => buf(ctx, 6, (d) => { let ph = 0; for (let i = 0; i < d.length; i++) { const t = i / SR; const f = 600 + 250 * Math.sin(t * 2 * Math.PI * 0.25); ph += f / SR; d[i] = Math.sin(ph * 2 * Math.PI) * 0.15 * Math.sin(t / 6 * Math.PI); } }),
  hiss: (ctx) => buf(ctx, 3.2, (d) => { const hp = new Biquad('hp', 2500, 0.6); for (let i = 0; i < d.length; i++) { const t = i / SR; d[i] = hp.p(rnd()) * Math.min(1, t * 6) * Math.min(1, (3.2 - t) * 2); } normalize(d, 0.5); }),
  klaxon: (ctx) => buf(ctx, 1.6, (d) => { let ph = 0; for (let i = 0; i < d.length; i++) { const t = i / SR; const f = (t % 0.8) < 0.5 ? 420 : 0; ph += f / SR; d[i] = f ? (((ph % 1) * 2 - 1) * 0.5 + Math.sin(ph * 2 * Math.PI) * 0.3) : 0; } normalize(d, 0.6); }),
  buzz_loop: (ctx) => buf(ctx, 2, (d) => { for (let i = 0; i < d.length; i++) { const t = i / SR; d[i] = (Math.sin(t * 2 * Math.PI * 100) * 0.5 + Math.sin(t * 2 * Math.PI * 200) * 0.25 + Math.sin(t * 2 * Math.PI * 300) * 0.1) * 0.4 + rnd() * 0.02; } }),
  caralarm_idle: (ctx) => buf(ctx, 1.5, (d) => { for (let i = 0; i < d.length; i++) { const t = i / SR; d[i] = (t % 1.5) < 0.04 ? Math.sin(t * 2 * Math.PI * 2400) * 0.15 : 0; } }),
  train_far: (ctx) => buf(ctx, 6, (d) => { const lp = new OnePole(150); for (let i = 0; i < d.length; i++) { const t = i / SR; d[i] = lp.lp(rnd()) * 3 * Math.sin(t / 6 * Math.PI) + Math.sin(t * 2 * Math.PI * 220) * 0.08 * Math.sin(t / 6 * Math.PI) * (t > 2 && t < 4 ? 1 : 0); } normalize(d, 0.7); }),
};
function fadeLoop(d) { const n = Math.floor(SR * 0.05); for (let i = 0; i < n; i++) { const k = i / n; d[i] *= k; d[d.length - 1 - i] *= k; } }
function breath(ctx, dur, gain, f) {
  return buf(ctx, dur, (d) => { const bp = new Biquad('bp', f, 0.9), bp2 = new Biquad('bp', f * 2.4, 2); for (let i = 0; i < d.length; i++) { const t = i / SR; const e = Math.sin(Math.min(1, t / dur) * Math.PI) ** 1.5; const x = rnd(); d[i] = (bp.p(x) + bp2.p(x) * 0.4) * e; } normalize(d, 0.5 * gain); });
}

// Zombie-Laute: Formantsynthese mit Tonhöhendrift, Rauschen, Verzerrung
function zombieVoice(ctx, kind, seed) {
  const dur = kind === 'idle' ? 1.6 + Math.random() * 1.6 : kind === 'alert' ? 1.4 : kind === 'attack' ? 0.9 : kind === 'chase' ? 1.0 : 1.2;
  return buf(ctx, dur, (d) => {
    const base = (kind === 'alert' ? 130 : kind === 'attack' ? 150 : 75) * (0.85 + seed * 0.4);
    const vowels = [[300, 870, 2240], [640, 1190, 2390], [450, 800, 2830], [390, 2000, 2550]];
    const v0 = vowels[Math.floor(seed * 4) % 4], v1 = vowels[Math.floor(seed * 7 + 1) % 4];
    const f1 = new Biquad('bp', v0[0], 5), f2 = new Biquad('bp', v0[1], 6), f3 = new Biquad('bp', v0[2], 8);
    const nz = new Biquad('bp', 1800, 0.8);
    let ph = 0;
    for (let i = 0; i < d.length; i++) {
      const t = i / SR, k = t / dur;
      if (i % 256 === 0) {
        const m = (x, y) => x + (y - x) * k;
        f1.set('bp', m(v0[0], v1[0]), 5); f2.set('bp', m(v0[1], v1[1]), 6); f3.set('bp', m(v0[2], v1[2]), 8);
      }
      const jitter = 1 + 0.06 * Math.sin(t * 2 * Math.PI * 5.5) + 0.04 * rnd();
      const pitch = base * jitter * (kind === 'alert' ? 1 + 0.6 * Math.sin(k * Math.PI) : kind === 'attack' ? 1.3 - k * 0.5 : 1 - k * 0.15);
      ph += pitch / SR;
      const src = (ph % 1) * 2 - 1;
      const rough = Math.random() < 0.5 ? 1 : 0.4; // Schnarren
      const s = src * rough;
      let y = f1.p(s) * 1.0 + f2.p(s) * 0.6 + f3.p(s) * 0.25 + nz.p(rnd()) * (kind === 'idle' ? 0.35 : 0.6);
      const e = kind === 'idle' ? Math.sin(k * Math.PI) ** 0.7 * (0.7 + 0.3 * Math.sin(t * 9)) : env(t, 0.04, dur * 0.45);
      y = Math.tanh(y * 3) * e;
      d[i] = y;
    }
    normalize(d, kind === 'idle' ? 0.55 : 0.9);
  });
}

export class AudioEngine {
  constructor(settings) {
    this.settings = settings;
    this.ctx = null;
    this.cache = new Map();
    this.loops = new Map();
    this.music = null;
    this.ready = false;
    this.listener = { pos: new THREE.Vector3(), fwd: new THREE.Vector3(0, 0, -1) };
    this.occlusionFn = null;
    this.voices = new Map(); // geladene Sprachaufnahmen
    this.voiceBase = 'assets/audio/';
  }

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC({ latencyHint: 'interactive' });
    const c = this.ctx;
    this.master = c.createGain(); this.master.connect(c.destination);
    this.comp = c.createDynamicsCompressor(); this.comp.threshold.value = -14; this.comp.ratio.value = 4;
    this.comp.connect(this.master);
    this.sfx = c.createGain(); this.sfx.connect(this.comp);
    this.musicBus = c.createGain(); this.musicBus.connect(this.comp);
    this.voiceBus = c.createGain(); this.voiceBus.connect(this.comp);
    this.ambBus = c.createGain(); this.ambBus.connect(this.comp);
    // Hall
    this.reverb = c.createConvolver();
    this.reverbGain = c.createGain(); this.reverbGain.gain.value = 0.35;
    this.reverb.connect(this.reverbGain); this.reverbGain.connect(this.comp);
    this.setReverb(1.6, 2.2);
    this.applyVolumes();
    this.music = new MusicDirector(this);
    this.ready = true;
    // Zombie-Stimmen vorab erzeugen
    this.zVoices = { idle: [], alert: [], attack: [], chase: [], search: [] };
    for (const k of Object.keys(this.zVoices)) for (let i = 0; i < (k === 'idle' ? 6 : 3); i++) this.zVoices[k].push(zombieVoice(c, k, Math.random()));
  }

  setReverb(seconds, decay) {
    if (!this.ctx) return;
    const c = this.ctx;
    const n = Math.floor(seconds * SR);
    const b = c.createBuffer(2, n, SR);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      const lp = new OnePole(3500);
      for (let i = 0; i < n; i++) { const t = i / SR; d[i] = lp.lp(rnd()) * Math.pow(1 - t / seconds, decay) * (i < 300 ? i / 300 : 1); }
    }
    this.reverb.buffer = b;
  }
  setReverbMix(v) { if (this.reverbGain) this.reverbGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.5); }

  applyVolumes() {
    if (!this.ctx) return;
    const s = this.settings;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(s.masterVol, t, 0.05);
    this.sfx.gain.setTargetAtTime(s.sfxVol, t, 0.05);
    this.ambBus.gain.setTargetAtTime(s.sfxVol * 0.9, t, 0.05);
    this.musicBus.gain.setTargetAtTime(s.musicVol, t, 0.05);
    this.voiceBus.gain.setTargetAtTime(s.voiceVol, t, 0.05);
  }

  get(name, variant = 0) {
    const key = name + ':' + variant;
    if (this.cache.has(key)) return this.cache.get(key);
    const f = LIB[name];
    if (!f) return null;
    const b = f(this.ctx, variant);
    this.cache.set(key, b);
    return b;
  }

  setListener(pos, fwd) {
    this.listener.pos.copy(pos); this.listener.fwd.copy(fwd);
    if (!this.ctx) return;
    const L = this.ctx.listener;
    const t = this.ctx.currentTime;
    if (L.positionX) {
      L.positionX.setValueAtTime(pos.x, t); L.positionY.setValueAtTime(pos.y, t); L.positionZ.setValueAtTime(pos.z, t);
      L.forwardX.setValueAtTime(fwd.x, t); L.forwardY.setValueAtTime(fwd.y, t); L.forwardZ.setValueAtTime(fwd.z, t);
      L.upX.setValueAtTime(0, t); L.upY.setValueAtTime(1, t); L.upZ.setValueAtTime(0, t);
    } else { L.setPosition(pos.x, pos.y, pos.z); L.setOrientation(fwd.x, fwd.y, fwd.z, 0, 1, 0); }
  }

  // Spielt einen Klang (optional räumlich mit Wanddämpfung)
  play(name, o = {}) {
    if (!this.ready) return null;
    const b = o.buffer || this.get(name, o.variant || 0);
    if (!b) return null;
    const c = this.ctx;
    const src = c.createBufferSource();
    src.buffer = b;
    src.playbackRate.value = (o.rate || 1) * (o.jitter ? 1 + (Math.random() - 0.5) * o.jitter : 1);
    if (o.loop) src.loop = true;
    const g = c.createGain(); g.gain.value = o.vol ?? 1;
    let out = g;
    src.connect(g);
    let panner = null, filt = null;
    if (o.pos) {
      filt = c.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 20000;
      panner = c.createPanner();
      panner.panningModel = 'HRTF'; panner.distanceModel = 'inverse';
      panner.refDistance = o.ref || 1.5; panner.rolloffFactor = o.rolloff || 1.3; panner.maxDistance = 60;
      panner.positionX.value = o.pos.x; panner.positionY.value = o.pos.y; panner.positionZ.value = o.pos.z;
      out.connect(filt); filt.connect(panner); out = panner;
      if (this.occlusionFn) {
        const occ = this.occlusionFn(o.pos);
        filt.frequency.value = occ ? 900 : 20000;
        if (occ) g.gain.value *= 0.55;
      }
    }
    const bus = o.bus === 'music' ? this.musicBus : o.bus === 'voice' ? this.voiceBus : o.bus === 'amb' ? this.ambBus : this.sfx;
    out.connect(bus);
    if (o.reverb !== false) { const send = c.createGain(); send.gain.value = o.reverbSend ?? 0.6; out.connect(send); send.connect(this.reverb); }
    src.start(c.currentTime + (o.delay || 0));
    const h = { src, gain: g, panner, filt, stop: (fade = 0.1) => { try { g.gain.setTargetAtTime(0, c.currentTime, fade); src.stop(c.currentTime + fade * 4); } catch (e) { /* schon gestoppt */ } } };
    src.onended = () => { h.ended = true; };
    return h;
  }

  footstep(surface, vol) {
    const v = Math.floor(Math.random() * 4);
    const name = 'step_' + (surface === 'concrete' ? 'concrete' : surface === 'metal' ? 'metal' : surface === 'gravel' ? 'gravel' : surface === 'wet' ? 'wet' : 'hard');
    this.play(name, { variant: v, vol: vol * 0.55, jitter: 0.12, reverbSend: 0.3 });
  }

  zombie(kind, pos, vol = 1) {
    if (!this.ready) return null;
    const arr = this.zVoices[kind] || this.zVoices.idle;
    const b = arr[Math.floor(Math.random() * arr.length)];
    return this.play(null, { buffer: b, pos, vol, rate: 0.9 + Math.random() * 0.2, ref: 1.2, rolloff: 1.1 });
  }

  // Dauerschleife (Ambiente, Alarm, Regen) mit Ein-/Ausblenden
  loop(id, name, o = {}) {
    if (!this.ready) return;
    if (this.loops.has(id)) { const l = this.loops.get(id); l.gain.gain.setTargetAtTime(o.vol ?? 1, this.ctx.currentTime, 0.5); if (o.pos && l.panner) { l.panner.positionX.value = o.pos.x; l.panner.positionY.value = o.pos.y; l.panner.positionZ.value = o.pos.z; } return l; }
    const h = this.play(name, { ...o, loop: true, vol: 0, bus: o.bus || 'amb' });
    if (!h) return;
    h.gain.gain.setTargetAtTime(o.vol ?? 1, this.ctx.currentTime, o.fadeIn ?? 0.8);
    this.loops.set(id, h);
    return h;
  }
  stopLoop(id, fade = 0.6) { const l = this.loops.get(id); if (l) { l.stop(fade); this.loops.delete(id); } }
  stopAllLoops() { for (const id of [...this.loops.keys()]) this.stopLoop(id, 0.3); }

  // Sprachaufnahme (falls vorhanden) – liefert Dauer in Sekunden oder 0
  async loadVoice(id) {
    if (!this.ready) return null;
    if (this.voices.has(id)) return this.voices.get(id);
    if (!VOICE_IDS.has(id) && !(window.NWO_VOICE && window.NWO_VOICE[id])) return null;
    const p = (async () => {
      try {
        let ab = null;
        if (window.NWO_VOICE && window.NWO_VOICE[id]) {
          const bin = atob(window.NWO_VOICE[id]); const u8 = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
          ab = u8.buffer;
        } else {
          if (location.protocol === 'file:') return null;
          const r = await fetch(this.voiceBase + id + '.mp3');
          if (!r.ok) return null;
          ab = await r.arrayBuffer();
        }
        return await this.ctx.decodeAudioData(ab);
      } catch (e) { return null; }
    })();
    this.voices.set(id, p);
    return p;
  }
  async playVoice(id, o = {}) {
    const b = await this.loadVoice(id);
    if (!b) return null;
    const h = this.play(null, { buffer: b, bus: 'voice', vol: o.vol ?? 1, pos: o.pos, reverbSend: o.reverbSend ?? 0.25, ref: 3 });
    if (h) h.duration = b.duration;
    if (h && o.filter === 'phone') {
      // Telefonklang
      const c = this.ctx;
      const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 350;
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3400;
      h.gain.disconnect(); h.gain.connect(hp); hp.connect(lp); lp.connect(this.voiceBus);
    }
    return h;
  }

  update(dt, game) {
    if (!this.ready) return;
    this.music.update(dt, game);
  }

  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); }
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
}

// ---------- Dynamische Musik ----------
class MusicDirector {
  constructor(audio) {
    this.a = audio;
    const c = audio.ctx;
    this.c = c;
    this.out = c.createGain(); this.out.connect(audio.musicBus);
    this.intensity = 0; this.target = 0;
    this.mode = 'explore';
    this.layers = {};
    this.forced = null;
    this.mood = { root: 55, dark: 1 };
    this.time = 0;
    this.nextNote = 2;
    this.beat = 0;
    this.started = false;
    this.lastSting = -10;
  }
  start() {
    if (this.started) return;
    this.started = true;
    const c = this.c;
    // Drone (Erkundung)
    this.drone = this._pad([55, 55.3, 82.4, 110.2], 'sawtooth', 180);
    // Spannung: dissonanter Streicher-Cluster
    this.tension = this._pad([110, 116.5, 155.6, 233.1, 246.9], 'sawtooth', 900);
    // Jagd: Bass-Ostinato wird per Scheduler gespielt
    this.chaseGain = c.createGain(); this.chaseGain.gain.value = 0; this.chaseGain.connect(this.out);
    this.chaseFilter = c.createBiquadFilter(); this.chaseFilter.type = 'lowpass'; this.chaseFilter.frequency.value = 700; this.chaseFilter.connect(this.chaseGain);
    this.hbGain = c.createGain(); this.hbGain.gain.value = 0; this.hbGain.connect(this.a.sfx);
    this.nextBeat = c.currentTime + 0.1;
    this.nextHB = c.currentTime + 0.5;
  }
  _pad(freqs, type, cutoff) {
    const c = this.c;
    const g = c.createGain(); g.gain.value = 0;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff; f.Q.value = 0.8;
    f.connect(g); g.connect(this.out);
    const send = c.createGain(); send.gain.value = 0.6; g.connect(send); send.connect(this.a.reverb);
    const oscs = freqs.map((fr, i) => {
      const o = c.createOscillator(); o.type = type; o.frequency.value = fr; o.detune.value = (i % 2 ? 7 : -7);
      const lfo = c.createOscillator(); lfo.frequency.value = 0.05 + i * 0.03; const lg = c.createGain(); lg.gain.value = 6; lfo.connect(lg); lg.connect(o.detune); lfo.start();
      const og = c.createGain(); og.gain.value = 0.12 / freqs.length * 3;
      o.connect(og); og.connect(f); o.start();
      return o;
    });
    const flfo = c.createOscillator(); flfo.frequency.value = 0.07; const fg = c.createGain(); fg.gain.value = cutoff * 0.4; flfo.connect(fg); fg.connect(f.frequency); flfo.start();
    return { g, f, oscs };
  }
  sting(kind = 'sting') {
    if (this.time - this.lastSting < 6) return;
    this.lastSting = this.time;
    this.a.play(kind, { bus: 'music', vol: 0.75, reverbSend: 0.8 });
  }
  setForced(level) { this.forced = level; }
  update(dt, game) {
    if (!this.started) this.start();
    this.time += dt;
    const c = this.c, t = c.currentTime;
    // Ziel-Intensität aus Spielsituation
    let target = 0;
    const threat = game.threatLevel || 0; // 0 ruhig, 1 Zombie nah, 2 entdeckt/Suche, 3 Jagd
    target = threat;
    const hidden = game.player && game.player.mode === 'hidden';
    if (this.forced !== null) target = this.forced;
    // langsam anschwellen, langsam abklingen (nach der Flucht)
    const up = target > this.intensity ? 1.6 : 0.22;
    this.intensity += (target - this.intensity) * Math.min(1, dt * up);
    const I = this.intensity;
    const ex = I < 0.5 ? 1 - I : Math.max(0, 0.5 - (I - 0.5) * 0.5);
    this.drone.g.gain.setTargetAtTime((hidden ? 0.25 : 0.55) * ex * (game.musicQuiet ? 0.3 : 1), t, 0.8);
    this.tension.g.gain.setTargetAtTime(clamp((I - 0.6) / 1.4, 0, 1) * (hidden ? 0.25 : 0.5) * (I > 2.6 ? 0.6 : 1), t, 0.6);
    this.tension.f.frequency.setTargetAtTime(400 + I * 500, t, 0.8);
    const chase = clamp((I - 2.0) / 0.8, 0, 1) * (hidden ? 0.05 : 1);
    this.chaseGain.gain.setTargetAtTime(chase * 0.55, t, 0.3);
    this.chaseFilter.frequency.setTargetAtTime(500 + chase * 1500, t, 0.3);
    // Herzschlag beim Verstecken oder bei schwerer Verletzung
    const hb = (hidden && threat >= 1 ? 0.8 : 0) + (game.player && game.player.healthState === 'severe' ? 0.5 : 0) + (I > 2.5 ? 0.3 : 0);
    if (hb > 0 && t >= this.nextHB) {
      const rate = hidden ? 0.75 : 0.62;
      this.a.play('heartbeat', { vol: Math.min(1, hb) * 0.75, reverb: false });
      this.nextHB = t + rate;
    } else if (hb <= 0) this.nextHB = Math.max(this.nextHB, t);
    // Bass-Ostinato
    while (this.nextBeat < t + 0.2) {
      if (chase > 0.02) this._chaseNote(this.nextBeat, this.beat);
      this.beat++;
      this.nextBeat += 60 / 132 / 2;
    }
    // vereinzelte tiefe Klaviertöne in der Erkundung
    this.nextNote -= dt;
    if (this.nextNote <= 0) {
      this.nextNote = 9 + Math.random() * 14;
      if (I < 0.8 && !hidden && Math.random() < 0.7) this._piano([55, 58.3, 65.4, 73.4, 77.8][Math.floor(Math.random() * 5)] * (Math.random() < 0.5 ? 2 : 4));
    }
  }
  _chaseNote(time, i) {
    const c = this.c;
    const pattern = [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1];
    const roots = [55, 55, 58.3, 51.9];
    const bar = Math.floor(i / 16) % 4;
    if (pattern[i % 16]) {
      const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = roots[bar] * (i % 8 === 6 ? 2 : 1);
      const g = c.createGain(); g.gain.setValueAtTime(0, time); g.gain.linearRampToValueAtTime(0.5, time + 0.01); g.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
      o.connect(g); g.connect(this.chaseFilter); o.start(time); o.stop(time + 0.25);
    }
    if (i % 8 === 0) {
      // Trommelschlag
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(90, time); o.frequency.exponentialRampToValueAtTime(35, time + 0.3);
      const g = c.createGain(); g.gain.setValueAtTime(0.9, time); g.gain.exponentialRampToValueAtTime(0.001, time + 0.45);
      o.connect(g); g.connect(this.chaseGain); o.start(time); o.stop(time + 0.5);
    }
    if (i % 32 === 28) {
      // hohe Dissonanz
      for (const f of [880, 932]) {
        const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
        const g = c.createGain(); g.gain.setValueAtTime(0, time); g.gain.linearRampToValueAtTime(0.06, time + 0.3); g.gain.linearRampToValueAtTime(0, time + 1.6);
        o.connect(g); g.connect(this.chaseGain); o.start(time); o.stop(time + 1.7);
      }
    }
  }
  _piano(f) {
    const c = this.c, t = c.currentTime;
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.18, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + 6);
    const send = c.createGain(); send.gain.value = 1.2; g.connect(send); send.connect(this.a.reverb); g.connect(this.out);
    [1, 2, 3.01, 4.2].forEach((h, k) => { const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f * h; const og = c.createGain(); og.gain.value = [1, 0.4, 0.15, 0.06][k]; o.connect(og); og.connect(g); o.start(t); o.stop(t + 6); });
  }
}
