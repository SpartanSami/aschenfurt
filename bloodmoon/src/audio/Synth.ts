// Prozedurale Klangerzeugung (Web Audio). Alle Klänge entstehen zur Laufzeit –
// keine fremden Aufnahmen, keine Lizenzfragen.

export interface SynthCtx {
  ctx: AudioContext;
  noise: AudioBuffer;
  pink: AudioBuffer;
  brown: AudioBuffer;
}

export function makeNoiseBuffers(ctx: AudioContext): Pick<SynthCtx, "noise" | "pink" | "brown"> {
  const len = ctx.sampleRate * 3;
  const noise = ctx.createBuffer(1, len, ctx.sampleRate);
  const pink = ctx.createBuffer(1, len, ctx.sampleRate);
  const brown = ctx.createBuffer(1, len, ctx.sampleRate);
  const n = noise.getChannelData(0), p = pink.getChannelData(0), b = brown.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    n[i] = w;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.969 * b2 + w * 0.153852;
    b3 = 0.8665 * b3 + w * 0.3104856;
    b4 = 0.55 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.016898;
    p[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
    last = (last + 0.02 * w) / 1.02;
    b[i] = last * 3.5;
  }
  return { noise, pink, brown };
}

export function noiseSrc(s: SynthCtx, kind: "white" | "pink" | "brown" = "white", loop = false, offset = Math.random() * 2): AudioBufferSourceNode {
  const src = s.ctx.createBufferSource();
  src.buffer = kind === "white" ? s.noise : kind === "pink" ? s.pink : s.brown;
  src.loop = loop;
  (src as any)._offset = offset;
  return src;
}

function startSrc(src: AudioScheduledSourceNode, t: number, dur?: number): void {
  const off = (src as any)._offset ?? 0;
  if (src instanceof AudioBufferSourceNode) src.start(t, off, dur);
  else src.start(t);
  if (dur !== undefined && !(src instanceof AudioBufferSourceNode)) src.stop(t + dur);
}

function env(g: GainNode, t: number, a: number, peak: number, d: number, sustain = 0, r = 0.05): number {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + a);
  if (sustain > 0) {
    g.gain.setValueAtTime(peak, t + a + sustain);
  }
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + sustain + d);
  return t + a + sustain + d + r;
}

function bp(ctx: AudioContext, f: number, q: number): BiquadFilterNode {
  const b = ctx.createBiquadFilter();
  b.type = "bandpass";
  b.frequency.value = f;
  b.Q.value = q;
  return b;
}

function filt(ctx: AudioContext, type: BiquadFilterType, f: number, q = 0.7): BiquadFilterNode {
  const b = ctx.createBiquadFilter();
  b.type = type;
  b.frequency.value = f;
  b.Q.value = q;
  return b;
}

function osc(ctx: AudioContext, type: OscillatorType, f: number): OscillatorNode {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = f;
  return o;
}

type Out = AudioNode;

// ---------------------------------------------------------------------------
// Geräusche
// ---------------------------------------------------------------------------

export function footstep(s: SynthCtx, out: Out, t: number, surface: string, vol = 1): void {
  const { ctx } = s;
  const src = noiseSrc(s, "white");
  const g = ctx.createGain();
  let f: BiquadFilterNode;
  if (surface === "wood") {
    f = bp(ctx, 500 + Math.random() * 200, 2.5);
    env(g, t, 0.004, 0.5 * vol, 0.12);
    // hohler Holzklang
    const o = osc(ctx, "sine", 120 + Math.random() * 30);
    const og = ctx.createGain();
    env(og, t, 0.003, 0.25 * vol, 0.09);
    o.connect(og).connect(out);
    o.start(t);
    o.stop(t + 0.15);
  } else if (surface === "dirt" || surface === "grass") {
    f = filt(ctx, "lowpass", surface === "grass" ? 2400 : 900, 0.5);
    env(g, t, 0.02, 0.5 * vol, 0.16);
  } else if (surface === "water") {
    f = bp(ctx, 1200, 1);
    f.frequency.setValueAtTime(600, t);
    f.frequency.exponentialRampToValueAtTime(2500, t + 0.15);
    env(g, t, 0.01, 0.6 * vol, 0.25);
  } else if (surface === "metal") {
    f = bp(ctx, 2200, 6);
    env(g, t, 0.002, 0.45 * vol, 0.2);
  } else if (surface === "flesh") {
    f = filt(ctx, "lowpass", 500, 2);
    env(g, t, 0.01, 0.7 * vol, 0.22);
  } else {
    f = bp(ctx, 1800 + Math.random() * 600, 0.9);
    env(g, t, 0.002, 0.42 * vol, 0.07);
    const o = osc(ctx, "sine", 70 + Math.random() * 20);
    const og = ctx.createGain();
    env(og, t, 0.002, 0.35 * vol, 0.06);
    o.connect(og).connect(out);
    o.start(t);
    o.stop(t + 0.1);
  }
  src.connect(f).connect(g).connect(out);
  startSrc(src, t, 0.4);
}

export function creak(s: SynthCtx, out: Out, t: number, dur = 1.4, pitch = 1, vol = 0.5): void {
  const { ctx } = s;
  // Reibung: Sägezahn mit unregelmäßiger Frequenz durch resonante Filter
  const o = osc(ctx, "sawtooth", 90 * pitch);
  const lfo = osc(ctx, "sine", 7 + Math.random() * 5);
  const lg = ctx.createGain();
  lg.gain.value = 25 * pitch;
  lfo.connect(lg).connect(o.frequency);
  o.frequency.setValueAtTime(70 * pitch, t);
  o.frequency.linearRampToValueAtTime(160 * pitch, t + dur * 0.4);
  o.frequency.linearRampToValueAtTime(95 * pitch, t + dur);
  const f1 = bp(ctx, 900 * pitch, 8);
  const f2 = bp(ctx, 2100 * pitch, 10);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.08);
  g.gain.setValueAtTime(vol * 0.8, t + dur * 0.7);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  // Stottern (Stick-Slip)
  const am = osc(ctx, "square", 22 + Math.random() * 18);
  const amg = ctx.createGain();
  amg.gain.value = 0.4;
  am.connect(amg).connect(g.gain);
  o.connect(f1).connect(g);
  o.connect(f2).connect(g);
  g.connect(out);
  [o, lfo, am].forEach((n) => {
    n.start(t);
    n.stop(t + dur + 0.1);
  });
}

export function thud(s: SynthCtx, out: Out, t: number, freq = 60, vol = 0.8, dur = 0.5): void {
  const { ctx } = s;
  const o = osc(ctx, "sine", freq * 1.8);
  o.frequency.setValueAtTime(freq * 1.8, t);
  o.frequency.exponentialRampToValueAtTime(freq * 0.6, t + dur);
  const g = ctx.createGain();
  env(g, t, 0.003, vol, dur);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + dur + 0.1);
  const n = noiseSrc(s, "brown");
  const ng = ctx.createGain();
  env(ng, t, 0.002, vol * 0.6, dur * 0.4);
  n.connect(filt(ctx, "lowpass", 400)).connect(ng).connect(out);
  startSrc(n, t, dur);
}

export function stoneGrind(s: SynthCtx, out: Out, t: number, dur = 2.5, vol = 0.7): void {
  const { ctx } = s;
  const n = noiseSrc(s, "brown", true);
  const f = filt(ctx, "lowpass", 300, 2);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.3);
  g.gain.setValueAtTime(vol, t + dur - 0.4);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const lfo = osc(ctx, "sine", 3);
  const lg = ctx.createGain();
  lg.gain.value = 120;
  lfo.connect(lg).connect(f.frequency);
  n.connect(f).connect(g).connect(out);
  startSrc(n, t, dur + 0.2);
  lfo.start(t);
  lfo.stop(t + dur);
  const n2 = noiseSrc(s, "white");
  const g2 = ctx.createGain();
  g2.gain.setValueAtTime(0.0001, t);
  g2.gain.linearRampToValueAtTime(vol * 0.15, t + 0.2);
  g2.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n2.connect(bp(ctx, 3000, 1)).connect(g2).connect(out);
  startSrc(n2, t, dur);
  thud(s, out, t + dur - 0.1, 45, vol * 0.8, 0.6);
}

export function metalClank(s: SynthCtx, out: Out, t: number, vol = 0.5, base = 400): void {
  const { ctx } = s;
  const ratios = [1, 2.76, 5.4, 8.93];
  for (const r of ratios) {
    const o = osc(ctx, "sine", base * r * (0.98 + Math.random() * 0.04));
    const g = ctx.createGain();
    env(g, t, 0.001, vol / ratios.length, 0.4 / Math.sqrt(r));
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.6);
  }
  const n = noiseSrc(s);
  const ng = ctx.createGain();
  env(ng, t, 0.001, vol * 0.4, 0.04);
  n.connect(filt(ctx, "highpass", 2000)).connect(ng).connect(out);
  startSrc(n, t, 0.1);
}

export function chains(s: SynthCtx, out: Out, t: number, dur = 1.5, vol = 0.4): void {
  const n = Math.floor(dur * 14);
  for (let i = 0; i < n; i++) metalClank(s, out, t + i * (dur / n) + Math.random() * 0.03, vol * (0.3 + Math.random() * 0.5), 900 + Math.random() * 1200);
}

export function rustle(s: SynthCtx, out: Out, t: number, dur = 0.5, vol = 0.35, f = 3000): void {
  const { ctx } = s;
  const n = noiseSrc(s);
  const fl = bp(ctx, f, 0.8);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  const steps = 6;
  for (let i = 0; i < steps; i++) {
    const tt = t + (dur / steps) * i;
    g.gain.linearRampToValueAtTime(vol * (0.4 + Math.random() * 0.6), tt + 0.01);
    g.gain.linearRampToValueAtTime(vol * 0.1, tt + dur / steps);
  }
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05);
  n.connect(fl).connect(g).connect(out);
  startSrc(n, t, dur + 0.1);
}

export function chime(s: SynthCtx, out: Out, t: number, freq = 880, vol = 0.2, dur = 2): void {
  const { ctx } = s;
  for (const [r, a] of [[1, 1], [2.01, 0.4], [3.02, 0.2], [4.2, 0.1]] as [number, number][]) {
    const o = osc(ctx, "sine", freq * r);
    const g = ctx.createGain();
    env(g, t, 0.005, vol * a, dur / r);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + dur + 0.1);
  }
}

export function heartbeat(s: SynthCtx, out: Out, t: number, vol = 0.8): void {
  thud(s, out, t, 50, vol, 0.18);
  thud(s, out, t + 0.22, 45, vol * 0.7, 0.22);
}

export function whoosh(s: SynthCtx, out: Out, t: number, dur = 0.6, vol = 0.6, rising = true): void {
  const { ctx } = s;
  const n = noiseSrc(s, "pink");
  const f = bp(ctx, rising ? 300 : 3000, 1.2);
  f.frequency.setValueAtTime(rising ? 250 : 3500, t);
  f.frequency.exponentialRampToValueAtTime(rising ? 3500 : 250, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + dur * (rising ? 0.8 : 0.15));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(f).connect(g).connect(out);
  startSrc(n, t, dur + 0.1);
}

/** Flüstern: gefiltertes Rauschen mit Silben-Hüllkurve und wandernden Formanten. */
export function whisper(s: SynthCtx, out: Out, t: number, syllables = 4, vol = 0.5, rate = 5): number {
  const { ctx } = s;
  const n = noiseSrc(s, "white");
  const g = ctx.createGain();
  const f1 = bp(ctx, 900, 6);
  const f2 = bp(ctx, 2300, 8);
  const hp = filt(ctx, "highpass", 600);
  g.gain.setValueAtTime(0.0001, t);
  let tt = t;
  const vowels: [number, number][] = [[800, 1200], [400, 2200], [600, 1000], [300, 2500], [500, 1800]];
  for (let i = 0; i < syllables; i++) {
    const d = (0.6 + Math.random() * 0.8) / rate;
    const v = vowels[Math.floor(Math.random() * vowels.length)];
    f1.frequency.setTargetAtTime(v[0], tt, 0.03);
    f2.frequency.setTargetAtTime(v[1], tt, 0.03);
    g.gain.linearRampToValueAtTime(vol * (0.6 + Math.random() * 0.4), tt + d * 0.3);
    g.gain.linearRampToValueAtTime(vol * 0.08, tt + d);
    tt += d + (Math.random() > 0.7 ? 0.12 : 0.02);
  }
  g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.1);
  n.connect(hp);
  hp.connect(f1).connect(g);
  hp.connect(f2).connect(g);
  g.connect(out);
  startSrc(n, t, tt - t + 0.2);
  return tt - t;
}

export function wolfHowl(s: SynthCtx, out: Out, t: number, vol = 0.5, pitch = 1, dur = 3.5): void {
  const { ctx } = s;
  const base = 330 * pitch;
  const o = osc(ctx, "sawtooth", base);
  const o2 = osc(ctx, "sine", base);
  o.frequency.setValueAtTime(base * 0.75, t);
  o.frequency.exponentialRampToValueAtTime(base * 1.3, t + dur * 0.25);
  o.frequency.setValueAtTime(base * 1.3, t + dur * 0.6);
  o.frequency.exponentialRampToValueAtTime(base * 0.8, t + dur);
  o2.frequency.setValueAtTime(base * 0.75, t);
  o2.frequency.exponentialRampToValueAtTime(base * 1.3, t + dur * 0.25);
  o2.frequency.setValueAtTime(base * 1.3, t + dur * 0.6);
  o2.frequency.exponentialRampToValueAtTime(base * 0.8, t + dur);
  const vib = osc(ctx, "sine", 5.5);
  const vg = ctx.createGain();
  vg.gain.value = base * 0.012;
  vib.connect(vg);
  vg.connect(o.frequency);
  vg.connect(o2.frequency);
  const f = bp(ctx, 700, 3);
  f.frequency.setValueAtTime(500, t);
  f.frequency.linearRampToValueAtTime(1100, t + dur * 0.3);
  f.frequency.linearRampToValueAtTime(600, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol * 0.5, t + 0.4);
  g.gain.linearRampToValueAtTime(vol, t + dur * 0.35);
  g.gain.linearRampToValueAtTime(vol * 0.7, t + dur * 0.8);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const g2 = ctx.createGain();
  g2.gain.value = 0.6;
  o.connect(f).connect(g);
  o2.connect(g2).connect(g);
  g.connect(out);
  [o, o2, vib].forEach((n) => {
    n.start(t);
    n.stop(t + dur + 0.1);
  });
}

export function growl(s: SynthCtx, out: Out, t: number, dur = 1.2, vol = 0.6, pitch = 1): void {
  const { ctx } = s;
  const o = osc(ctx, "sawtooth", 70 * pitch);
  const am = osc(ctx, "sine", 28 + Math.random() * 10);
  const amg = ctx.createGain();
  amg.gain.value = 0.5;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.2);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  am.connect(amg).connect(g.gain);
  const f = filt(ctx, "lowpass", 600, 4);
  o.connect(f).connect(g).connect(out);
  const n = noiseSrc(s, "pink");
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.0001, t);
  ng.gain.linearRampToValueAtTime(vol * 0.5, t + 0.15);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(bp(ctx, 500, 2)).connect(ng).connect(out);
  [o, am].forEach((x) => {
    x.start(t);
    x.stop(t + dur + 0.1);
  });
  startSrc(n, t, dur);
}

export function hiss(s: SynthCtx, out: Out, t: number, dur = 0.8, vol = 0.5): void {
  const { ctx } = s;
  const n = noiseSrc(s);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(filt(ctx, "highpass", 3500)).connect(g).connect(out);
  startSrc(n, t, dur);
}

export function crow(s: SynthCtx, out: Out, t: number, vol = 0.35): void {
  const { ctx } = s;
  for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
    const tt = t + i * 0.42;
    const o = osc(ctx, "sawtooth", 600);
    o.frequency.setValueAtTime(700, tt);
    o.frequency.linearRampToValueAtTime(480, tt + 0.25);
    const fm = osc(ctx, "square", 90);
    const fg = ctx.createGain();
    fg.gain.value = 200;
    fm.connect(fg).connect(o.frequency);
    const g = ctx.createGain();
    env(g, tt, 0.02, vol, 0.25);
    o.connect(bp(ctx, 1500, 2)).connect(g).connect(out);
    [o, fm].forEach((x) => {
      x.start(tt);
      x.stop(tt + 0.35);
    });
  }
}

export function owl(s: SynthCtx, out: Out, t: number, vol = 0.25): void {
  const { ctx } = s;
  const pattern = [0, 0.5, 0.75, 1.1];
  for (const p of pattern) {
    const o = osc(ctx, "sine", 380);
    o.frequency.setValueAtTime(400, t + p);
    o.frequency.linearRampToValueAtTime(360, t + p + 0.25);
    const g = ctx.createGain();
    env(g, t + p, 0.04, vol, 0.25);
    o.connect(g).connect(out);
    o.start(t + p);
    o.stop(t + p + 0.4);
  }
}

export function drip(s: SynthCtx, out: Out, t: number, vol = 0.2): void {
  const { ctx } = s;
  const f = 900 + Math.random() * 1400;
  const o = osc(ctx, "sine", f);
  o.frequency.setValueAtTime(f, t);
  o.frequency.exponentialRampToValueAtTime(f * 2.2, t + 0.05);
  const g = ctx.createGain();
  env(g, t, 0.001, vol, 0.09);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.15);
}

export function bell(s: SynthCtx, out: Out, t: number, freq = 110, vol = 0.5, dur = 7): void {
  const { ctx } = s;
  const partials: [number, number][] = [[0.5, 0.6], [1, 1], [1.183, 0.6], [1.506, 0.5], [2, 0.45], [2.514, 0.3], [2.662, 0.25], [3.011, 0.2], [4.166, 0.12]];
  for (const [r, a] of partials) {
    const o = osc(ctx, "sine", freq * r);
    const g = ctx.createGain();
    env(g, t, 0.003, vol * a * 0.3, dur / Math.pow(r, 0.7));
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + dur + 0.2);
  }
  const n = noiseSrc(s);
  const ng = ctx.createGain();
  env(ng, t, 0.001, vol * 0.2, 0.05);
  n.connect(filt(ctx, "highpass", 1500)).connect(ng).connect(out);
  startSrc(n, t, 0.1);
}

export function thunder(s: SynthCtx, out: Out, t: number, vol = 0.8, dist = 1): void {
  const { ctx } = s;
  const n = noiseSrc(s, "brown");
  const f = filt(ctx, "lowpass", 900 / dist, 0.5);
  f.frequency.setValueAtTime(1200 / dist, t);
  f.frequency.exponentialRampToValueAtTime(120, t + 4);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.08 * dist);
  for (let i = 1; i < 6; i++) g.gain.linearRampToValueAtTime(vol * (0.3 + Math.random() * 0.7) / i, t + i * 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 5);
  n.connect(f).connect(g).connect(out);
  startSrc(n, t, 5.2);
}

/** Schreck-Akzent: dissonanter Anstieg mit hohem Kreischen. */
export function stinger(s: SynthCtx, out: Out, t: number, vol = 0.6, kind: "swell" | "hit" = "swell"): void {
  const { ctx } = s;
  const notes = [55, 58.27, 61.74, 110, 116.5, 233];
  const dur = kind === "hit" ? 2.2 : 3.2;
  const peak = kind === "hit" ? t + 0.02 : t + dur * 0.75;
  for (const f of notes) {
    const o = osc(ctx, "sawtooth", f * (0.995 + Math.random() * 0.01));
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol * 0.12, peak);
    g.gain.exponentialRampToValueAtTime(0.0001, kind === "hit" ? t + dur : peak + 0.6);
    o.connect(filt(ctx, "lowpass", 1800)).connect(g).connect(out);
    o.start(t);
    o.stop(t + dur + 0.2);
  }
  // Streicher-Kreischen
  const sc = osc(ctx, "sawtooth", 1760);
  const vib = osc(ctx, "sine", 9);
  const vg = ctx.createGain();
  vg.gain.value = 40;
  vib.connect(vg).connect(sc.frequency);
  const sg = ctx.createGain();
  sg.gain.setValueAtTime(0.0001, t);
  sg.gain.exponentialRampToValueAtTime(vol * 0.08, peak);
  sg.gain.exponentialRampToValueAtTime(0.0001, kind === "hit" ? t + 1.2 : peak + 0.4);
  sc.connect(bp(ctx, 2500, 2)).connect(sg).connect(out);
  [sc, vib].forEach((x) => {
    x.start(t);
    x.stop(t + dur + 0.2);
  });
  if (kind === "hit") thud(s, out, t, 40, vol, 1.2);
}

export function breath(s: SynthCtx, out: Out, t: number, vol = 0.3, inhale = true): void {
  const { ctx } = s;
  const n = noiseSrc(s, "pink");
  const f = bp(ctx, inhale ? 1200 : 800, 0.8);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + (inhale ? 0.7 : 0.2));
  g.gain.exponentialRampToValueAtTime(0.0001, t + (inhale ? 1.0 : 0.9));
  n.connect(f).connect(g).connect(out);
  startSrc(n, t, 1.1);
}

export function glassShatter(s: SynthCtx, out: Out, t: number, vol = 0.5): void {
  for (let i = 0; i < 14; i++) {
    chime(s, out, t + Math.random() * 0.3, 2000 + Math.random() * 4000, vol * 0.1, 0.3);
  }
  const { ctx } = s;
  const n = noiseSrc(s);
  const g = ctx.createGain();
  env(g, t, 0.001, vol * 0.5, 0.4);
  n.connect(filt(ctx, "highpass", 2500)).connect(g).connect(out);
  startSrc(n, t, 0.5);
}

export function fireCrackleBurst(s: SynthCtx, out: Out, t: number, vol = 0.15): void {
  const { ctx } = s;
  const n = noiseSrc(s);
  const g = ctx.createGain();
  env(g, t, 0.001, vol, 0.012 + Math.random() * 0.02);
  n.connect(bp(ctx, 1500 + Math.random() * 3000, 1.5)).connect(g).connect(out);
  startSrc(n, t, 0.05);
}

// ---------------------------------------------------------------------------
// Instrumente (für die prozedurale Musik)
// ---------------------------------------------------------------------------

export function piano(s: SynthCtx, out: Out, t: number, freq: number, vol = 0.3, dur = 4): void {
  const { ctx } = s;
  const parts: [number, number][] = [[1, 1], [2.003, 0.45], [3.01, 0.22], [4.02, 0.12], [5.05, 0.06]];
  for (const [r, a] of parts) {
    const o = osc(ctx, "sine", freq * r);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol * a, t + 0.004);
    g.gain.exponentialRampToValueAtTime(vol * a * 0.3, t + 0.25 / r);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur / Math.sqrt(r));
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + dur + 0.1);
  }
  const n = noiseSrc(s);
  const ng = ctx.createGain();
  env(ng, t, 0.001, vol * 0.08, 0.02);
  n.connect(bp(ctx, freq * 4, 2)).connect(ng).connect(out);
  startSrc(n, t, 0.05);
}

export function musicBox(s: SynthCtx, out: Out, t: number, freq: number, vol = 0.2): void {
  const { ctx } = s;
  for (const [r, a, d] of [[1, 1, 1.6], [3.0, 0.3, 0.5], [5.4, 0.12, 0.25]] as [number, number, number][]) {
    const o = osc(ctx, "sine", freq * r);
    const g = ctx.createGain();
    env(g, t, 0.002, vol * a, d);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + d + 0.1);
  }
}

export function pad(s: SynthCtx, out: Out, t: number, freqs: number[], dur: number, vol = 0.15, cutoff = 900, attack = 2.5): void {
  const { ctx } = s;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  g.gain.setValueAtTime(vol, t + Math.max(attack, dur - attack));
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  const f = filt(ctx, "lowpass", cutoff, 0.8);
  const lfo = osc(ctx, "sine", 0.08);
  const lg = ctx.createGain();
  lg.gain.value = cutoff * 0.3;
  lfo.connect(lg).connect(f.frequency);
  lfo.start(t);
  lfo.stop(t + dur + 0.1);
  f.connect(g).connect(out);
  for (const fr of freqs) {
    for (const det of [-6, 0, 7]) {
      const o = osc(ctx, "sawtooth", fr);
      o.detune.value = det;
      const og = ctx.createGain();
      og.gain.value = 1 / (freqs.length * 3);
      o.connect(og).connect(f);
      o.start(t);
      o.stop(t + dur + 0.1);
    }
  }
}

const VOWELS: Record<string, [number, number, number]> = {
  a: [800, 1150, 2900],
  o: [450, 800, 2830],
  u: [325, 700, 2530],
  e: [400, 1700, 2600],
};

export function choir(s: SynthCtx, out: Out, t: number, freqs: number[], dur: number, vol = 0.12, vowel: keyof typeof VOWELS = "a", attack = 2): void {
  const { ctx } = s;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  g.gain.setValueAtTime(vol, t + Math.max(attack, dur - attack));
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  const formants = VOWELS[vowel].map((f, i) => {
    const b = bp(ctx, f, 8 + i * 3);
    const bg = ctx.createGain();
    bg.gain.value = [1, 0.5, 0.25][i];
    b.connect(bg).connect(g);
    return b;
  });
  g.connect(out);
  for (const fr of freqs) {
    for (let v = 0; v < 3; v++) {
      const o = osc(ctx, "sawtooth", fr);
      o.detune.value = (v - 1) * 9 + Math.random() * 4;
      const vib = osc(ctx, "sine", 4.5 + Math.random());
      const vg = ctx.createGain();
      vg.gain.value = fr * 0.006;
      vib.connect(vg).connect(o.frequency);
      for (const f of formants) o.connect(f);
      [o, vib].forEach((x) => {
        x.start(t);
        x.stop(t + dur + 0.1);
      });
    }
  }
}

export function strings(s: SynthCtx, out: Out, t: number, freq: number, dur: number, vol = 0.08, tremolo = 0): void {
  const { ctx } = s;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + Math.min(1.5, dur * 0.4));
  g.gain.setValueAtTime(vol, t + dur * 0.7);
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  const f = filt(ctx, "lowpass", 1400, 0.7);
  if (tremolo > 0) {
    const tr = osc(ctx, "sine", tremolo);
    const tg = ctx.createGain();
    tg.gain.value = vol * 0.8;
    tr.connect(tg).connect(g.gain);
    tr.start(t);
    tr.stop(t + dur + 0.1);
  }
  for (const det of [-8, 0, 6]) {
    const o = osc(ctx, "sawtooth", freq);
    o.detune.value = det;
    const vib = osc(ctx, "sine", 5 + Math.random());
    const vg = ctx.createGain();
    vg.gain.value = freq * 0.004;
    vib.connect(vg).connect(o.frequency);
    o.connect(f);
    [o, vib].forEach((x) => {
      x.start(t);
      x.stop(t + dur + 0.1);
    });
  }
  f.connect(g).connect(out);
}

export function drum(s: SynthCtx, out: Out, t: number, vol = 0.6, freq = 55): void {
  thud(s, out, t, freq, vol, 0.7);
}

export function drone(s: SynthCtx, out: Out, t: number, freq: number, dur: number, vol = 0.1): void {
  const { ctx } = s;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 4);
  g.gain.setValueAtTime(vol, t + Math.max(4, dur - 4));
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  const f = filt(ctx, "lowpass", 260, 1);
  for (const [r, det] of [[1, 0], [1, 5], [1.5, -3], [2, 2]] as [number, number][]) {
    const o = osc(ctx, r === 1 ? "sawtooth" : "sine", freq * r);
    o.detune.value = det;
    o.connect(f);
    o.start(t);
    o.stop(t + dur + 0.1);
  }
  f.connect(g).connect(out);
}

export const NOTE = (n: number): number => 440 * Math.pow(2, (n - 69) / 12);
