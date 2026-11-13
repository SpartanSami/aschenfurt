// Prozedurale PBR-Texturen (Albedo, Normal, Rauheit, optional Emission) – erzeugt per Canvas, kein externes Asset nötig.
import * as THREE from 'three';
import { RNG, hashStr } from '../core/rng.js';

const cache = new Map();
let TEX_SIZE = 512;
let ANISO = 4;
export function setTextureQuality(size, aniso) { TEX_SIZE = size; ANISO = aniso; }


function mkCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}
function releaseSource(t) {
  const c = t.image;
  if (!c || typeof c.getContext !== 'function') return;
  t.image = { width: c.width, height: c.height };
  c.width = 1; c.height = 1;
}
// Kann keine Zeichenfläche mehr angelegt werden (Speichergrenze), liefert der Browser null.
// Dann mit einer kleinen Ersatzfläche weitermachen statt abzustürzen.
const _getCtx = (c, o) => c.getContext('2d', o) || (c.width = c.height = 4, c.getContext('2d', o));

// Kachelbares Value-Noise
function makeNoise(rng, period) {
  const n = new Float32Array(period * period);
  for (let i = 0; i < n.length; i++) n[i] = rng.next();
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const x0 = ((xi % period) + period) % period, y0 = ((yi % period) + period) % period;
    const x1 = (x0 + 1) % period, y1 = (y0 + 1) % period;
    const a = n[y0 * period + x0], b = n[y0 * period + x1], c = n[y1 * period + x0], d = n[y1 * period + x1];
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
}

class Painter {
  constructor(seed, w = TEX_SIZE, h = TEX_SIZE) {
    this.w = w; this.h = h;
    this.rng = new RNG(seed);
    this.cC = mkCanvas(w, h); this.C = _getCtx(this.cC, { willReadFrequently: true });
    this.cH = mkCanvas(w, h); this.H = _getCtx(this.cH, { willReadFrequently: true });
    this.cR = mkCanvas(w, h); this.R = _getCtx(this.cR, { willReadFrequently: true });
    this.cE = null;
    this.noises = [];
    for (let o = 0; o < 6; o++) this.noises.push(makeNoise(this.rng, 4 << o));
  }
  fbm(u, v, oct = 5, base = 0) {
    let s = 0, a = 0.5, t = 0;
    for (let o = base; o < base + oct && o < 6; o++) {
      const p = 4 << o;
      s += this.noises[o](u * p, v * p) * a; t += a; a *= 0.5;
    }
    return s / t;
  }
  // Pixelweises Füllen: fn(u,v) => {r,g,b,h,ro}
  fill(fn) {
    const { w, h } = this;
    const ic = this.C.createImageData(w, h), ih = this.H.createImageData(w, h), ir = this.R.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const o = fn(x / w, y / h, x, y);
      const i = (y * w + x) * 4;
      ic.data[i] = o.r; ic.data[i + 1] = o.g; ic.data[i + 2] = o.b; ic.data[i + 3] = 255;
      const hv = Math.max(0, Math.min(255, o.h * 255));
      ih.data[i] = ih.data[i + 1] = ih.data[i + 2] = hv; ih.data[i + 3] = 255;
      const rv = Math.max(0, Math.min(255, o.ro * 255));
      ir.data[i] = ir.data[i + 1] = ir.data[i + 2] = rv; ir.data[i + 3] = 255;
    }
    this.C.putImageData(ic, 0, 0); this.H.putImageData(ih, 0, 0); this.R.putImageData(ir, 0, 0);
  }
  // Strich auf allen Ebenen (Farbe, Höhe, Rauheit)
  stroke(pts, width, color, hv, rv, alpha = 1) {
    for (const [ctx, col] of [[this.C, color], [this.H, hv], [this.R, rv]]) {
      if (col == null) continue;
      ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = col; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke(); ctx.restore();
    }
  }
  rect(x, y, w, h, color, hv, rv, alpha = 1) {
    for (const [ctx, col] of [[this.C, color], [this.H, hv], [this.R, rv]]) {
      if (col == null) continue;
      ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = col; ctx.fillRect(x, y, w, h); ctx.restore();
    }
  }
  blob(x, y, r, color, hv, rv, alpha = 1) {
    for (const [ctx, col] of [[this.C, color], [this.H, hv], [this.R, rv]]) {
      if (col == null) continue;
      ctx.save(); ctx.globalAlpha = alpha;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
  }
  // Wiederholt an Kanten zeichnen, damit Kacheln nahtlos bleiben
  wrapped(fn) { for (const ox of [-this.w, 0, this.w]) for (const oy of [-this.h, 0, this.h]) fn(ox, oy); }
  crack(x, y, len, width) {
    const pts = [[x, y]];
    let a = this.rng.range(0, Math.PI * 2);
    for (let i = 0; i < len; i++) {
      a += this.rng.range(-0.6, 0.6);
      const p = pts[pts.length - 1];
      pts.push([p[0] + Math.cos(a) * 6, p[1] + Math.sin(a) * 6]);
    }
    this.wrapped((ox, oy) => this.stroke(pts.map((p) => [p[0] + ox, p[1] + oy]), width, 'rgba(20,18,16,0.55)', '#000', '#fff', 0.8));
  }
  emissive() {
    if (!this.cE) { this.cE = mkCanvas(this.w, this.h); this.E = _getCtx(this.cE); this.E.fillStyle = '#000'; this.E.fillRect(0, 0, this.w, this.h); }
    return this.E;
  }
  normalFromHeight(strength = 2) {
    const { w, h } = this;
    const src = this.H.getImageData(0, 0, w, h).data;
    const c = mkCanvas(w, h), ctx = _getCtx(c);
    const out = ctx.createImageData(w, h);
    const H = (x, y) => src[((((y + h) % h) * w + ((x + w) % w)) * 4)] / 255;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = (H(x + 1, y) - H(x - 1, y)) * strength;
      const dy = (H(x, y + 1) - H(x, y - 1)) * strength;
      let nx = -dx, ny = dy, nz = 1;
      const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
      const i = (y * w + x) * 4;
      out.data[i] = (nx * 0.5 + 0.5) * 255; out.data[i + 1] = (ny * 0.5 + 0.5) * 255; out.data[i + 2] = (nz * 0.5 + 0.5) * 255; out.data[i + 3] = 255;
    }
    ctx.putImageData(out, 0, 0);
    return c;
  }
  finish(opts = {}) {
    const mk = (canvas, srgb) => {
      const t = new THREE.CanvasTexture(canvas);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = ANISO;
      if (srgb) t.colorSpace = THREE.SRGBColorSpace;
      t.needsUpdate = true;
      // Nach dem Hochladen auf die Grafikkarte wird die Zeichenfläche nicht mehr gebraucht. Freigeben,
      // sonst sammeln sich Hunderte MB an (Safari auf iPad/iPhone bricht bei ca. 256–384 MB ab).
      t.onUpdate = releaseSource;
      return t;
    };
    const res = {
      map: mk(this.cC, true),
      normalMap: mk(this.normalFromHeight(opts.normalStrength ?? 2.5), false),
      roughnessMap: mk(this.cR, false),
    };
    if (this.cE) res.emissiveMap = mk(this.cE, true);
    this.cH.width = 1; this.cH.height = 1;
    return res;
  }
}

// Schrift so weit verkleinern, dass der Text in die Breite passt; setzt ctx.font und liefert die Größe
function fitFont(ctx, text, maxW, px, fontOf) {
  ctx.font = fontOf(px);
  const wd = ctx.measureText(text).width;
  if (wd > maxW) { px = Math.max(5, Math.floor(px * maxW / wd)); ctx.font = fontOf(px); }
  return px;
}
const rgb = (r, g, b) => ({ r, g, b });
function mix(a, b, t) { return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t }; }
function hexToRgb(hex) { const v = parseInt(hex.slice(1), 16); return rgb((v >> 16) & 255, (v >> 8) & 255, v & 255); }

// ---------- Generatoren ----------
const GEN = {
  // Krankenhaus-Linoleum
  lino(p, o) {
    const base = hexToRgb(o.color || '#8f9a92');
    p.fill((u, v) => {
      const n = p.fbm(u, v, 5), n2 = p.fbm(u * 2 + 3, v * 2, 3, 2);
      const speck = p.rng.next() < 0.04 ? p.rng.range(-35, 35) : 0;
      const k = 0.82 + n * 0.3 + speck / 255;
      const c = mix({ r: base.r * k, g: base.g * k, b: base.b * k }, rgb(70, 64, 55), Math.max(0, n2 - 0.62) * 1.2);
      return { ...c, h: 0.5 + n * 0.08, ro: 0.45 + n2 * 0.25 };
    });
    const s = p.w;
    // Bahnen-Nähte
    p.rect(0, s / 2 - 1, s, 2, 'rgba(40,40,40,0.5)', '#3a3a3a', '#d0d0d0');
    p.rect(0, 0, s, 1, 'rgba(40,40,40,0.5)', '#3a3a3a', '#d0d0d0');
    // Laufspuren / Kratzer
    for (let i = 0; i < 26; i++) {
      const x = p.rng.range(0, s), y = p.rng.range(0, s), a = p.rng.range(0, Math.PI), l = p.rng.range(10, 60);
      p.wrapped((ox, oy) => p.stroke([[x + ox, y + oy], [x + ox + Math.cos(a) * l, y + oy + Math.sin(a) * l * 0.3]], p.rng.range(1, 3), 'rgba(30,30,30,0.35)', null, '#e8e8e8', 0.6));
    }
  },
  tiles(p, o) {
    const n = o.count || 8, s = p.w, ts = s / n;
    const tile = hexToRgb(o.color || '#d9dcd6'), grout = hexToRgb(o.grout || '#8a8a84');
    const g = (o.groutPx || 2) * (s / 512);
    const jit = o.jitter ?? 10;
    const tileVar = [];
    for (let i = 0; i < n * n; i++) tileVar.push(p.rng.range(-jit, jit));
    const aspect = o.aspect || 1; // Kachelhöhe-Faktor (Metro-Fliesen)
    const rows = Math.round(n / aspect), th = s / rows;
    p.fill((u, v, x, y) => {
      const off = o.offsetRows && (Math.floor(y / th) % 2) ? ts / 2 : 0;
      const tx = (x + off) % ts, ty = y % th;
      const ti = (Math.floor(((x + off) % s) / ts) + Math.floor(y / th) * n) % tileVar.length;
      const isG = tx < g || ty < g;
      const nn = p.fbm(u, v, 4, 1);
      if (isG) return { r: grout.r * (0.8 + nn * 0.3), g: grout.g * (0.8 + nn * 0.3), b: grout.b * (0.8 + nn * 0.3), h: 0.2, ro: 0.95 };
      const e = Math.min(tx - g, ty - g, ts - tx, th - ty) / (ts * 0.08);
      const bev = Math.min(1, e);
      const k = 1 + tileVar[ti] / 255 + (nn - 0.5) * 0.12;
      return { r: tile.r * k, g: tile.g * k, b: tile.b * k, h: 0.55 + bev * 0.3, ro: (o.rough ?? 0.22) + nn * 0.15 };
    });
    if (o.dirt) for (let i = 0; i < 18; i++) p.blob(p.rng.range(0, s), p.rng.range(0, s), p.rng.range(20, 90), 'rgba(80,70,50,0.25)', null, 'rgba(255,255,255,0.4)');
  },
  // Wandfarbe, volle Wandhöhe (v=0 unten): Sockelleiste + Schmutz unten
  wallPaint(p, o) {
    const base = hexToRgb(o.color || '#c9c8bd');
    const s = p.w;
    p.fill((u, v) => {
      const n = p.fbm(u, v, 5);
      const yUp = 1 - v; // canvas y=0 ist oben
      const grime = Math.max(0, 0.35 - yUp) * 1.6 * (0.6 + n);
      const k = 0.9 + n * 0.14;
      let c = { r: base.r * k, g: base.g * k, b: base.b * k };
      c = mix(c, rgb(95, 85, 70), Math.min(0.6, grime));
      return { ...c, h: 0.5 + n * 0.05, ro: 0.82 + n * 0.1 };
    });
    // Sockelleiste
    const bh = s * (0.1 / 3);
    p.rect(0, s - bh, s, bh, o.base || '#4a4c4a', '#8a8a8a', '#7a7a7a');
    p.rect(0, s - bh - 2, s, 2, 'rgba(0,0,0,0.4)', '#202020', null);
    // Scheuerspuren (Betten/Wagen)
    for (let i = 0; i < (o.scuffs ?? 8); i++) {
      const y = s - s * p.rng.range(0.14, 0.3), x = p.rng.range(0, s), l = p.rng.range(30, 160);
      p.wrapped((ox) => p.stroke([[x + ox, y], [x + ox + l * 0.5, y + p.rng.range(-2, 2)], [x + ox + l, y + p.rng.range(-4, 4)]], p.rng.range(1, 2.5), 'rgba(60,56,50,0.16)', null, '#c8c8c8', 0.5));
    }
    for (let i = 0; i < (o.stains ?? 3); i++) p.blob(p.rng.range(0, s), p.rng.range(s * 0.3, s * 0.9), p.rng.range(15, 50), 'rgba(110,95,60,0.1)', null, null);
  },
  ceilingTiles(p, o) {
    const s = p.w, n = 5, ts = s / n;
    const base = hexToRgb(o.color || '#d6d4cc');
    const stained = new Set(); for (let i = 0; i < 3; i++) stained.add(p.rng.int(0, n * n - 1));
    p.fill((u, v, x, y) => {
      const tx = x % ts, ty = y % ts;
      const grid = tx < 3 || ty < 3;
      const nn = p.fbm(u, v, 4, 1);
      const dot = ((x * 7 + y * 13) % 11 === 0 && p.rng.next() < 0.6);
      if (grid) return { r: 150, g: 150, b: 148, h: 0.35, ro: 0.5 };
      const k = 0.9 + nn * 0.15 - (dot ? 0.15 : 0);
      return { r: base.r * k, g: base.g * k, b: base.b * k, h: dot ? 0.42 : 0.55, ro: 0.95 };
    });
    for (const t of stained) {
      const cx = (t % n) * ts + ts / 2, cy = Math.floor(t / n) * ts + ts / 2;
      p.blob(cx, cy, ts * 0.45, 'rgba(120,90,40,0.35)', null, null);
    }
  },
  concrete(p, o) {
    const base = hexToRgb(o.color || '#8a8984');
    const s = p.w;
    p.fill((u, v) => {
      const n = p.fbm(u, v, 6), n2 = p.fbm(u + 5, v + 2, 3, 3);
      const pore = p.rng.next() < 0.015 ? -40 : 0;
      const k = 0.78 + n * 0.38 + pore / 255;
      return { r: base.r * k, g: base.g * k * 0.99, b: base.b * k * 0.97, h: 0.5 + n * 0.2 + n2 * 0.1 + pore / 400, ro: 0.82 + n2 * 0.15 };
    });
    for (let i = 0; i < (o.stains ?? 6); i++) p.blob(p.rng.range(0, s), p.rng.range(0, s), p.rng.range(20, 110), o.stainColor || 'rgba(30,28,24,0.35)', null, 'rgba(90,90,90,0.5)');
    for (let i = 0; i < (o.cracks ?? 3); i++) p.crack(p.rng.range(0, s), p.rng.range(0, s), p.rng.int(10, 40), p.rng.range(1, 2.5));
    if (o.formwork) { for (let i = 1; i < 3; i++) p.rect(0, (s / 3) * i, s, 2, 'rgba(0,0,0,0.25)', '#404040', null); }
  },
  asphalt(p, o) {
    const s = p.w;
    p.fill((u, v) => {
      const n = p.fbm(u, v, 6);
      const agg = p.rng.next();
      const k = 38 + n * 30 + (agg < 0.08 ? 35 : agg < 0.2 ? 12 : 0);
      const wet = o.wet ? 0.25 : 0;
      return { r: k, g: k, b: k * 1.05, h: 0.5 + (agg < 0.08 ? 0.15 : 0) + n * 0.1, ro: 0.88 - wet - n * 0.15 };
    });
    for (let i = 0; i < 5; i++) p.crack(p.rng.range(0, s), p.rng.range(0, s), p.rng.int(10, 30), 2);
  },
  metal(p, o) {
    const base = hexToRgb(o.color || '#7a7f84');
    const s = p.w;
    p.fill((u, v) => {
      const n = p.fbm(u, v, 4);
      const brushed = o.brushed ? p.noises[5](u * 128, v * 2) * 0.2 : 0;
      const k = 0.85 + n * 0.2 + brushed;
      return { r: base.r * k, g: base.g * k, b: base.b * k, h: 0.5 + brushed * 0.5, ro: (o.rough ?? 0.45) + n * 0.2 };
    });
    for (let i = 0; i < (o.scratches ?? 30); i++) {
      const x = p.rng.range(0, s), y = p.rng.range(0, s), a = p.rng.range(0, Math.PI * 2), l = p.rng.range(5, 40);
      p.stroke([[x, y], [x + Math.cos(a) * l, y + Math.sin(a) * l]], 1, 'rgba(220,220,220,0.25)', '#333', '#888', 0.7);
    }
    if (o.rust) for (let i = 0; i < 8; i++) p.blob(p.rng.range(0, s), p.rng.range(0, s), p.rng.range(10, 60), 'rgba(120,60,20,0.45)', null, '#fff');
  },
  panel(p, o) { // Labor-Wandpaneele
    const base = hexToRgb(o.color || '#e4e7ea');
    const s = p.w;
    p.fill((u, v) => {
      const n = p.fbm(u, v, 4, 1);
      const k = 0.94 + n * 0.08;
      return { r: base.r * k, g: base.g * k, b: base.b * k, h: 0.5, ro: 0.28 + n * 0.1 };
    });
    p.rect(0, 0, 3, s, '#9aa0a6', '#000', '#888');
    p.rect(s / 2, 0, 3, s, '#9aa0a6', '#000', '#888');
    p.rect(0, s * 0.62, s, 3, '#9aa0a6', '#000', '#888');
    const bh = s * (0.12 / 3);
    p.rect(0, s - bh, s, bh, o.base || '#5b636b', '#999', '#555');
  },
  brick(p, o) {
    const s = p.w, rows = 16, bw = s / 4, bh = s / rows;
    const base = hexToRgb(o.color || '#7a4a38');
    const v = []; for (let i = 0; i < 200; i++) v.push(p.rng.range(-25, 25));
    p.fill((u, vv, x, y) => {
      const r = Math.floor(y / bh), off = (r % 2) * bw / 2;
      const bx = (x + off) % bw, by = y % bh;
      const mort = bx < 3 || by < 3;
      const n = p.fbm(u, vv, 5);
      if (mort) return { r: 120 + n * 30, g: 115 + n * 30, b: 105 + n * 30, h: 0.25, ro: 0.95 };
      const id = (Math.floor((x + off) / bw) + r * 7) % 200;
      const k = 1 + (v[id] + (n - 0.5) * 40) / 255;
      return { r: base.r * k, g: base.g * k, b: base.b * k, h: 0.6 + n * 0.1, ro: 0.85 };
    });
  },
  gravel(p) {
    p.fill((u, v) => {
      const n = p.fbm(u, v, 6, 0), n3 = p.noises[5](u * 128, v * 128);
      const k = 50 + n * 40 + n3 * 40;
      return { r: k, g: k * 0.95, b: k * 0.88, h: n3 * 0.8, ro: 0.95 };
    });
  },
  plaster(p, o) {
    const base = hexToRgb(o.color || '#a39d90');
    p.fill((u, v) => {
      const n = p.fbm(u, v, 6);
      const k = 0.8 + n * 0.3;
      const yUp = 1 - v;
      const c = mix({ r: base.r * k, g: base.g * k, b: base.b * k }, rgb(60, 58, 52), Math.max(0, 0.25 - yUp) * 2);
      return { ...c, h: 0.5 + n * 0.25, ro: 0.9 };
    });
    for (let i = 0; i < 6; i++) p.crack(p.rng.range(0, p.w), p.rng.range(0, p.h), p.rng.int(6, 20), 1.5);
  },
  cloth(p, o) {
    const base = hexToRgb(o.color || '#7d93a8');
    const s = p.w;
    p.fill((u, v, x, y) => {
      const weave = ((x + y) % 4 < 2 ? 0.04 : -0.04);
      const n = p.fbm(u, v, 4, 1);
      const k = 0.85 + n * 0.25 + weave;
      return { r: base.r * k, g: base.g * k, b: base.b * k, h: 0.5 + weave * 2, ro: 0.92 };
    });
    if (o.pattern) for (let y = 8; y < s; y += 24) for (let x = 8; x < s; x += 24) p.rect(x, y, 4, 4, 'rgba(255,255,255,0.35)', null, null);
    for (let i = 0; i < (o.dirt ?? 6); i++) p.blob(p.rng.range(0, s), p.rng.range(0, s), p.rng.range(20, 80), 'rgba(60,45,30,0.35)', null, null);
    for (let i = 0; i < (o.blood ?? 0); i++) {
      const x = p.rng.range(0, s), y = p.rng.range(0, s);
      p.blob(x, y, p.rng.range(15, 70), 'rgba(70,6,6,0.8)', null, 'rgba(120,120,120,0.6)');
      for (let k = 0; k < 6; k++) p.blob(x + p.rng.range(-50, 50), y + p.rng.range(-50, 50), p.rng.range(3, 12), 'rgba(80,8,8,0.8)', null, null);
    }
  },
  skin(p, o) {
    const base = hexToRgb(o.color || '#a49a88');
    const s = p.w;
    p.fill((u, v) => {
      const n = p.fbm(u, v, 5), n2 = p.fbm(u + 3, v + 7, 3, 1);
      const vein = Math.abs(p.noises[3](u * 32, v * 32) - 0.5) < 0.012 ? 1 : 0;
      let c = { r: base.r * (0.85 + n * 0.25), g: base.g * (0.85 + n * 0.25), b: base.b * (0.85 + n * 0.25) };
      c = mix(c, rgb(70, 75, 85), Math.max(0, n2 - 0.55) * 1.4 + vein * 0.35);
      return { ...c, h: 0.5 + n * 0.15, ro: 0.6 + n2 * 0.2 };
    });
    const wounds = o.wounds ?? 4;
    if (wounds > 0) {
      // Zombiehaut: fleckige Blutergüsse (violett/grünlich) und dunkle Adern
      for (let i = 0; i < 9; i++) p.blob(p.rng.range(0, s), p.rng.range(0, s), p.rng.range(20, 70), i % 2 ? 'rgba(78,58,92,0.32)' : 'rgba(88,100,58,0.26)', null, null);
      for (let i = 0; i < 7; i++) {
        let x = p.rng.range(0, s), y = p.rng.range(0, s); const pts = [[x, y]];
        for (let k = 0; k < 9; k++) { x += p.rng.range(-9, 9); y += p.rng.range(3, 11); pts.push([x, y]); }
        p.stroke(pts, p.rng.range(1, 2.2), 'rgba(52,48,78,0.55)', '#5a5a5a', null);
      }
    }
    for (let i = 0; i < wounds; i++) {
      const x = p.rng.range(0, s), y = p.rng.range(0, s);
      p.blob(x, y, p.rng.range(10, 40), 'rgba(60,8,8,0.9)', '#000', 'rgba(60,60,60,0.8)');
      p.blob(x, y, p.rng.range(25, 60), 'rgba(80,60,70,0.4)', null, null);
      // eingetrocknetes Blut läuft von der Wunde nach unten
      for (let k = 0; k < 3; k++) { const sx = x + p.rng.range(-10, 10); p.stroke([[sx, y], [sx + p.rng.range(-3, 3), y + p.rng.range(18, 55)]], p.rng.range(1.5, 4), 'rgba(58,10,8,0.7)', null, 'rgba(90,90,90,0.6)'); }
    }
  },
  door(p, o) {
    const base = hexToRgb(o.color || '#b8b2a2');
    const s = p.w;
    p.fill((u, v) => {
      const n = p.fbm(u, v, 4, 1);
      const grain = o.wood ? p.noises[4](u * 4, v * 64) * 0.15 : 0;
      const k = 0.9 + n * 0.12 + grain;
      return { r: base.r * k, g: base.g * k, b: base.b * k, h: 0.5, ro: 0.5 + n * 0.1 };
    });
    p.rect(0, s * 0.82, s, s * 0.18, '#8a8d90', '#9a9a9a', '#555');
    p.rect(0, s * 0.82, s, 2, '#333', '#000', null);
    for (let i = 0; i < 8; i++) p.stroke([[p.rng.range(0, s), s * p.rng.range(0.6, 0.95)], [p.rng.range(0, s), s * p.rng.range(0.6, 0.95)]], 2, 'rgba(30,30,30,0.3)', null, null, 0.5);
    if (o.blood) {
      const x = p.rng.range(s * 0.2, s * 0.8);
      p.blob(x, s * 0.45, 30, 'rgba(90,10,10,0.8)', null, null);
      for (let k = 0; k < 4; k++) p.stroke([[x - 20 + k * 12, s * 0.45], [x - 22 + k * 12, s * 0.75]], 5, 'rgba(90,10,10,0.6)', null, null);
    }
  },
  wood(p, o) {
    const base = hexToRgb(o.color || '#8b6a4a');
    p.fill((u, v) => {
      const g = p.noises[4](u * 3, v * 40) * 0.3 + p.noises[2](u * 2, v * 10) * 0.2;
      const k = 0.75 + g;
      return { r: base.r * k, g: base.g * k, b: base.b * k, h: 0.5 + g * 0.3, ro: 0.55 };
    });
  },
  // Fassade mit Fenstern (Emission für beleuchtete Fenster)
  facade(p, o) {
    const s = p.w;
    const base = hexToRgb(o.color || '#8f877a');
    p.fill((u, v) => {
      const n = p.fbm(u, v, 6);
      const k = 0.78 + n * 0.32;
      return { r: base.r * k, g: base.g * k, b: base.b * k, h: 0.5 + n * 0.2, ro: 0.9 };
    });
    const E = p.emissive();
    const cols = 2, rows = 4;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = (c + 0.22) * (s / cols), y = (r + 0.2) * (s / rows), w = s / cols * 0.56, h = s / rows * 0.55;
      if (r === rows - 1 && o.shop) continue;
      p.rect(x - 4, y - 4, w + 8, h + 8, '#5a5650', '#9a9a9a', null);
      const lit = p.rng.next() < (o.lit ?? 0.15);
      p.rect(x, y, w, h, lit ? '#3a3020' : '#14171b', '#303030', '#151515');
      p.rect(x + w / 2 - 1, y, 2, h, '#2a2a2a', '#555', null);
      if (lit) { E.fillStyle = p.rng.pick(['#ffb866', '#ffcf8a', '#9fb8ff']); E.globalAlpha = 0.65; E.fillRect(x, y, w, h); E.globalAlpha = 1; }
      else if (p.rng.next() < 0.3) { p.stroke([[x, y + h * 0.3], [x + w * 0.6, y + h]], 2, 'rgba(200,200,200,0.4)', null, null); }
    }
  },
  blood(p, o) { // Alpha-Decal
    const s = p.w;
    p.C.clearRect(0, 0, s, s);
    const C = p.C;
    const kind = o.kind || 'splat';
    C.fillStyle = 'rgba(70,4,4,0.95)';
    if (kind === 'pool' || kind === 'splat') {
      // Unregelmäßiger Rand über Rauschen statt Zackenpolygon; zur Mitte dunkler (geronnen)
      const img = C.createImageData(s, s), d = img.data;
      const R0 = kind === 'pool' ? 0.62 : 0.34;
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const u = x / s, v = y / s, r = Math.hypot(u - 0.5, v - 0.5) * 2;
        const n = p.fbm(u, v, 5), n2 = p.fbm(u + 0.5, v + 0.2, 3, 2);
        const a = Math.max(0, Math.min(1, (R0 + (n - 0.5) * 0.6 - r) * 16));
        const t = Math.min(1, r / R0);
        const i = (y * s + x) * 4;
        d[i] = 38 + t * 50 + n2 * 20; d[i + 1] = 2 + t * 5; d[i + 2] = 2 + t * 4; d[i + 3] = a * 240;
      }
      C.putImageData(img, 0, 0);
      if (kind === 'splat') {
        // Spritzer: Tropfen und längliche Ausläufer nach außen
        for (let i = 0; i < 34; i++) {
          const a = p.rng.range(0, Math.PI * 2), dd = p.rng.range(s * 0.18, s * 0.47), r = p.rng.range(1.5, s * 0.025);
          C.fillStyle = `rgba(${70 + p.rng.int(0, 30)},5,4,${p.rng.range(0.75, 0.95)})`;
          C.beginPath(); C.ellipse(s / 2 + Math.cos(a) * dd, s / 2 + Math.sin(a) * dd, r * p.rng.range(1, 2.6), r, a, 0, Math.PI * 2); C.fill();
        }
      }
    } else if (kind === 'smear') {
      for (let i = 0; i < 9; i++) { C.globalAlpha = 0.25 + p.rng.next() * 0.4; C.fillRect(s * 0.1, s * (0.35 + i * 0.03 + p.rng.next() * 0.02), s * (0.4 + p.rng.next() * 0.5), s * 0.025); }
      C.globalAlpha = 1;
    } else if (kind === 'hand') {
      for (let k = 0; k < 4; k++) { C.fillRect(s * (0.38 + k * 0.07), s * 0.2, s * 0.045, s * 0.3); }
      C.beginPath(); C.arc(s * 0.5, s * 0.6, s * 0.15, 0, Math.PI * 2); C.fill();
      C.fillRect(s * 0.62, s * 0.5, s * 0.15, s * 0.04);
      for (let k = 0; k < 5; k++) C.fillRect(s * (0.4 + k * 0.05), s * 0.6, s * 0.02, s * (0.2 + p.rng.next() * 0.25));
    } else if (kind === 'trail') {
      for (let i = 0; i < 14; i++) { const x = s * (0.1 + i * 0.06), y = s * (0.5 + Math.sin(i) * 0.05); C.beginPath(); C.arc(x, y, s * (0.02 + p.rng.next() * 0.03), 0, Math.PI * 2); C.fill(); }
    }
    p.H.fillStyle = '#808080'; p.H.fillRect(0, 0, s, s);
    p.R.fillStyle = '#404040'; p.R.fillRect(0, 0, s, s);
  },
  bullethole(p) { // Alpha-Decal: Einschussloch
    const s = p.w, C = p.C;
    C.clearRect(0, 0, s, s);
    const g = C.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(5,5,5,1)'); g.addColorStop(0.28, 'rgba(10,10,10,0.95)'); g.addColorStop(0.42, 'rgba(70,66,60,0.55)'); g.addColorStop(1, 'rgba(70,66,60,0)');
    C.fillStyle = g; C.beginPath(); C.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2); C.fill();
    C.strokeStyle = 'rgba(20,20,20,0.6)'; C.lineWidth = 1;
    for (let i = 0; i < 7; i++) { const a = p.rng.range(0, Math.PI * 2), l = p.rng.range(s * 0.25, s * 0.48); C.beginPath(); C.moveTo(s / 2 + Math.cos(a) * s * 0.12, s / 2 + Math.sin(a) * s * 0.12); C.lineTo(s / 2 + Math.cos(a) * l, s / 2 + Math.sin(a) * l); C.stroke(); }
    p.H.fillStyle = '#808080'; p.H.fillRect(0, 0, s, s);
    p.R.fillStyle = '#e0e0e0'; p.R.fillRect(0, 0, s, s);
  },
  // ---- Raumdetails (render/world/clutter.js) ----
  grime(p, o) { // Alpha-Decal: Schmutz-, Wasser- oder Ölfleck am Boden
    const s = p.w, C = p.C, img = C.createImageData(s, s), d = img.data;
    const col = o.oil ? [12, 12, 14] : o.rust ? [70, 38, 18] : [34, 29, 22];
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const u = x / s, v = y / s, r = Math.hypot(u - 0.5, v - 0.5) * 2;
      const n = p.fbm(u, v, 5), n2 = p.fbm(u + 0.37, v + 0.71, 3, 2);
      let a = (1 - r * 1.15) + (n - 0.5) * 1.6;
      a = Math.max(0, Math.min(1, a)); a = a * a * (0.55 + n2 * 0.6);
      const i = (y * s + x) * 4; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = Math.min(255, a * 255 * (o.a ?? 0.95));
    }
    C.putImageData(img, 0, 0);
    p.H.fillStyle = '#808080'; p.H.fillRect(0, 0, s, s);
    p.R.fillStyle = o.oil ? '#2a2a2a' : '#d0d0d0'; p.R.fillRect(0, 0, s, s);
  },
  leak(p, o) { // Alpha-Decal: Wasserlaufspuren von der Decke die Wand hinunter
    const w = p.w, h = p.h, C = p.C, img = C.createImageData(w, h), d = img.data;
    const col = o.rust ? [92, 52, 22] : [62, 52, 34];
    const len = []; for (let x = 0; x < w; x++) len.push(0.25 + p.fbm(x / w, 0.5, 4, 1) * 0.9 + (p.noises[4](x / w * 64, 3) - 0.5) * 0.35);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const v = y / h, u = x / w, side = Math.min(1, Math.min(u, 1 - u) * 5);
      const L = len[x];
      let a = v < L ? (1 - v / L) * 0.75 + 0.12 : 0;
      if (Math.abs(v - L) < 0.012) a += 0.35;          // Rand der Laufspur
      a *= side * (0.6 + p.fbm(u, v, 4) * 0.6);
      if (v < 0.06) a = Math.max(a, (1 - v / 0.06) * 0.8 * side);
      const i = (y * w + x) * 4; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = Math.max(0, Math.min(255, a * 255 * 0.9));
    }
    C.putImageData(img, 0, 0);
    p.H.fillStyle = '#808080'; p.H.fillRect(0, 0, w, h);
    p.R.fillStyle = '#c8c8c8'; p.R.fillRect(0, 0, w, h);
  },
  litter(p, o) { // Papierkram: 0 Blatt, 1 Zeitung, 2 Pappe, 3 Flugblatt
    const s = p.w, C = p.C, v = o.v || 0;
    const base = [[226, 223, 212], [196, 194, 186], [150, 112, 70], [232, 230, 226]][v];
    p.fill((u, w) => { const n = p.fbm(u, w, 4); const k = 0.86 + n * 0.22; return { r: base[0] * k, g: base[1] * k, b: base[2] * k, h: 0.5 + n * 0.3, ro: 0.92 }; });
    if (v === 0) for (let i = 0; i < 14; i++) p.rect(s * 0.1, s * (0.12 + i * 0.055), s * p.rng.range(0.4, 0.8), 2, 'rgba(40,40,60,0.5)', null, null);
    if (v === 1) { p.rect(s * 0.06, s * 0.05, s * 0.88, s * 0.12, 'rgba(20,20,20,0.85)', null, null); for (let c = 0; c < 3; c++) for (let i = 0; i < 18; i++) p.rect(s * (0.06 + c * 0.3), s * (0.22 + i * 0.04), s * 0.26, 2, 'rgba(30,30,30,0.55)', null, null); p.rect(s * 0.38, s * 0.24, s * 0.26, s * 0.2, 'rgba(60,60,60,0.6)', null, null); }
    if (v === 2) { p.rect(0, s * 0.45, s, s * 0.1, 'rgba(200,180,120,0.55)', null, null); for (let i = 0; i < 4; i++) p.rect(s * 0.1, s * (0.15 + i * 0.07), s * 0.3, 3, 'rgba(40,30,20,0.6)', null, null); }
    if (v === 3) { p.rect(0, 0, s, s * 0.22, o.color || 'rgba(180,30,30,0.9)', null, null); for (let i = 0; i < 9; i++) p.rect(s * 0.12, s * (0.32 + i * 0.07), s * p.rng.range(0.5, 0.76), 3, 'rgba(40,40,40,0.6)', null, null); }
    // Knicke
    for (let i = 0; i < 3; i++) { const y = p.rng.range(0.15, 0.85) * s; p.stroke([[0, y], [s, y + p.rng.range(-20, 20)]], 2, 'rgba(0,0,0,0.12)', '#606060', null); }
  },
  puddle(p) { // Alpha-Decal: Pfütze (glatt, spiegelt Lichter)
    const s = p.w, C = p.C, img = C.createImageData(s, s), d = img.data;
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const u = x / s, v = y / s, r = Math.hypot(u - 0.5, v - 0.5) * 2;
      const n = p.fbm(u, v, 4);
      let a = (1 - r) * 2.2 + (n - 0.5) * 2.0;
      a = Math.max(0, Math.min(1, a));
      const i = (y * s + x) * 4; d[i] = 16; d[i + 1] = 18; d[i + 2] = 20; d[i + 3] = a * 205;
    }
    C.putImageData(img, 0, 0);
    p.H.fillStyle = '#808080'; p.H.fillRect(0, 0, s, s);
    p.R.fillStyle = '#101010'; p.R.fillRect(0, 0, s, s);
  },
  leaf(p) { // Alpha-Decal: welkes Blatt (Farbe pro Exemplar)
    const s = p.w, C = p.C;
    C.clearRect(0, 0, s, s);
    C.fillStyle = 'rgb(235,235,235)';
    C.beginPath(); C.moveTo(s * 0.5, s * 0.05);
    C.bezierCurveTo(s * 0.95, s * 0.3, s * 0.85, s * 0.75, s * 0.5, s * 0.92);
    C.bezierCurveTo(s * 0.15, s * 0.75, s * 0.05, s * 0.3, s * 0.5, s * 0.05); C.fill();
    C.strokeStyle = 'rgba(90,70,50,0.7)'; C.lineWidth = s / 40; C.beginPath(); C.moveTo(s * 0.5, s * 0.08); C.lineTo(s * 0.5, s * 0.98); C.stroke();
    p.H.fillStyle = '#808080'; p.H.fillRect(0, 0, s, s);
    p.R.fillStyle = '#d0d0d0'; p.R.fillRect(0, 0, s, s);
  },
  paper(p) {
    const s = p.w;
    p.fill(() => ({ r: 225, g: 222, b: 210, h: 0.5, ro: 0.9 }));
    for (let i = 0; i < 14; i++) p.rect(s * 0.1, s * (0.12 + i * 0.055), s * p.rng.range(0.4, 0.8), 3, 'rgba(40,40,60,0.5)', null, null);
  },
  screen(p, o) { // Monitor-Bildschirm (emissiv)
    const s = p.w;
    p.fill(() => ({ r: 10, g: 12, b: 14, h: 0.5, ro: 0.15 }));
    const E = p.emissive();
    E.fillStyle = o.bg || '#06121a'; E.fillRect(0, 0, s, s);
    E.strokeStyle = o.color || '#2cff7a'; E.lineWidth = s / 128;
    if (o.kind === 'ecg') {
      E.beginPath();
      for (let x = 0; x < s; x += 2) { const t = (x % (s / 3)) / (s / 3); const y = s * 0.5 - (t > 0.45 && t < 0.5 ? s * 0.3 : t > 0.5 && t < 0.55 ? -s * 0.15 : Math.sin(x * 0.05) * 3); E.lineTo(x, y); }
      E.stroke();
      E.fillStyle = o.color || '#2cff7a'; fitFont(E, o.text || '---', s * 0.88, s / 8, (px) => `bold ${px}px monospace`); E.fillText(o.text || '---', s * 0.06, s * 0.2);
    } else if (o.kind === 'alarm') {
      E.fillStyle = '#5a0000'; E.fillRect(0, 0, s, s);
      E.fillStyle = '#ff4040'; E.textAlign = 'center';
      fitFont(E, o.text || 'ALARM', s * 0.9, s / 9, (px) => `bold ${px}px sans-serif`);
      E.fillText(o.text || 'ALARM', s / 2, s * 0.45);
      fitFont(E, o.sub || 'QUARANTÄNE AKTIV', s * 0.9, s / 16, (px) => `${px}px sans-serif`);
      E.fillText(o.sub || 'QUARANTÄNE AKTIV', s / 2, s * 0.62);
    } else if (o.kind === 'text') {
      E.fillStyle = o.color || '#9fd3ff';
      const lines = (o.text || '').split('\n');
      // eine gemeinsame Schriftgröße, bei der die längste Zeile und alle Zeilen in die Fläche passen
      const longest = lines.reduce((a, l) => (l.length > a.length ? l : a), '');
      const px = Math.min(fitFont(E, longest, s * 0.9, s / 14, (q) => `${q}px monospace`), s * 0.8 / (lines.length * 1.4));
      E.font = `${px}px monospace`;
      lines.forEach((l, i) => E.fillText(l, s * 0.05, s * 0.14 + i * px * 1.4));
    } else {
      E.fillStyle = '#0a1622'; E.fillRect(0, 0, s, s);
      for (let i = 0; i < 10; i++) { E.fillStyle = `rgba(80,160,220,${0.2 + p.rng.next() * 0.4})`; E.fillRect(s * 0.06, s * (0.08 + i * 0.09), s * p.rng.range(0.2, 0.85), s * 0.04); }
    }
  },
  sign(p, o) {
    const w = p.w, h = p.h;
    p.fill(() => ({ r: 0, g: 0, b: 0, h: 0.5, ro: 0.4 }));
    const E = p.emissive();
    const bg = o.bg || '#0b7a3a';
    p.C.fillStyle = bg; p.C.fillRect(0, 0, w, h);
    E.fillStyle = o.glow ? bg : '#000'; E.fillRect(0, 0, w, h);
    // Schrift einpassen: Kein Wort darf über den Schildrand ragen. Gewählt wird die Zeilenaufteilung
    // (wie vorgegeben, oder lange Zeilen an Leerzeichen umbrochen), die die größte Schrift erlaubt.
    const fontOf = (px) => `bold ${px}px "Arial Narrow", Arial, sans-serif`;
    const want = o.fontPx || Math.floor(h * 0.5);
    const maxW = w * 0.9, maxH = h * 0.88, LH = 1.12;
    const M = p.C;
    const fit = (lines) => {
      M.font = fontOf(100);
      const widest = Math.max(1, ...lines.map((l) => M.measureText(l).width));
      return Math.min(want, 100 * maxW / widest, maxH / (LH * lines.length));
    };
    const split = (line, parts) => {
      // ausgewogen an Leerzeichen in „parts“ Zeilen teilen
      const words = line.split(' '); if (words.length < parts) return null;
      const target = line.length / parts, out = []; let cur = '';
      for (const wd of words) {
        if (cur && out.length < parts - 1 && (cur + ' ' + wd).length > target + 2) { out.push(cur); cur = wd; } else cur = cur ? cur + ' ' + wd : wd;
      }
      out.push(cur); return out;
    };
    const given = String(o.text).split('\n');
    let lines = given, px = fit(given);
    for (const parts of [2, 3]) {
      const alt = []; let ok = true;
      for (const l of given) { const sp = l.length > 8 ? split(l, parts) : [l]; if (!sp) { ok = false; break; } alt.push(...sp); }
      if (!ok) continue;
      const apx = fit(alt);
      if (apx > px * 1.25) { lines = alt; px = apx; }
    }
    px = Math.max(5, Math.floor(px));
    for (const ctx of [p.C, E]) {
      if (ctx === E && !o.glow) { ctx.globalAlpha = 0.0; }
      ctx.fillStyle = o.fg || '#ffffff';
      ctx.font = fontOf(px);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      lines.forEach((l, i) => ctx.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * px * LH));
      ctx.globalAlpha = 1;
    }
  },
};

export function getTex(kind, opts = {}, w, h) {
  const key = kind + ':' + JSON.stringify(opts) + ':' + (w || TEX_SIZE) + 'x' + (h || w || TEX_SIZE);
  if (cache.has(key)) return cache.get(key);
  const p = new Painter(hashStr(key), w || TEX_SIZE, h || w || TEX_SIZE);
  GEN[kind](p, opts);
  const res = p.finish(opts);
  cache.set(key, res);
  return res;
}

// Einfache Text-Textur (für Schilder, Etiketten, Smartphone etc.)
export function textCanvas(w, h) { return mkCanvas(w, h); }
