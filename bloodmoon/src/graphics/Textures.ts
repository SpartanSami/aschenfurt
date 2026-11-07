import * as THREE from "three";
import { Rng, fbm, ridged, voronoi, vnoise, hash2, clamp01, sstep, lerp, VoronoiResult } from "./Noise";

// Prozedurale PBR-Texturen (Albedo, Normal, Rauheit/Metall, optional Emission).
// Alle Texturen sind kachelbar und werden zur Laufzeit erzeugt – keine externen Assets.

export interface TexData {
  size: number;
  color: Float32Array; // rgb 0..1 (sRGB)
  height: Float32Array;
  rough: Float32Array;
  metal?: Float32Array;
  emissive?: Float32Array; // rgb
}

export interface PBRSet {
  map: THREE.Texture;
  normalMap: THREE.Texture;
  ormMap: THREE.Texture; // G=Rauheit, B=Metall
  emissiveMap?: THREE.Texture;
}

function alloc(size: number, withMetal = false, withEmissive = false): TexData {
  const n = size * size;
  return {
    size,
    color: new Float32Array(n * 3),
    height: new Float32Array(n),
    rough: new Float32Array(n).fill(0.9),
    metal: withMetal ? new Float32Array(n) : undefined,
    emissive: withEmissive ? new Float32Array(n * 3) : undefined,
  };
}

/** Anisotropes, kachelbares fbm (z. B. für Holzmaserung). */
function afbm(u: number, v: number, px: number, py: number, oct: number, seed: number): number {
  let sum = 0, amp = 0.5, norm = 0;
  let ppx = px, ppy = py;
  for (let o = 0; o < oct; o++) {
    // vnoise erwartet gleiche Periode – wir nutzen getrennte Skalierung über zwei Abfragen
    const n = vnoiseA(u * ppx, v * ppy, ppx, ppy, seed + o * 13);
    sum += n * amp;
    norm += amp;
    amp *= 0.5;
    ppx *= 2;
    ppy *= 2;
  }
  return sum / norm;
}

function vnoiseA(x: number, y: number, px: number, py: number, seed: number): number {
  const xi = Math.floor(x), yi = Math.floor(y);
  const tx = x - xi, ty = y - yi;
  const xf = tx * tx * (3 - 2 * tx), yf = ty * ty * (3 - 2 * ty);
  const m = (a: number, n: number) => ((a % n) + n) % n;
  const x0 = m(xi, px), x1 = m(xi + 1, px), y0 = m(yi, py), y1 = m(yi + 1, py);
  const a = hash2(x0, y0, seed), b = hash2(x1, y0, seed), c = hash2(x0, y1, seed), d = hash2(x1, y1, seed);
  return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
}

function setColor(t: TexData, i: number, r: number, g: number, b: number): void {
  t.color[i * 3] = clamp01(r);
  t.color[i * 3 + 1] = clamp01(g);
  t.color[i * 3 + 2] = clamp01(b);
}

// ---------------------------------------------------------------------------
// Generatoren
// ---------------------------------------------------------------------------

export interface StoneOpts {
  rows: number;
  minW: number;
  maxW: number;
  mortar: number;
  base: [number, number, number];
  variation: number;
  mortarColor: [number, number, number];
  moss: number;
  grime: number;
  seed: number;
  cracks: number;
}

export function genStoneBlocks(size: number, o: StoneOpts): TexData {
  const t = alloc(size);
  const rng = new Rng(o.seed);
  const rowsW: number[][] = [];
  const offsets: number[] = [];
  for (let r = 0; r < o.rows; r++) {
    const ws: number[] = [];
    let sum = 0;
    while (sum < 1) {
      const w = rng.range(o.minW, o.maxW);
      ws.push(w);
      sum += w;
    }
    const k = 1 / sum;
    rowsW.push(ws.map((w) => w * k));
    offsets.push(rng.next());
  }
  for (let y = 0; y < size; y++) {
    const v = y / size;
    const row = Math.min(o.rows - 1, Math.floor(v * o.rows));
    const lv = v * o.rows - row;
    const ws = rowsW[row];
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const u = x / size;
      let uu = (u + offsets[row]) % 1;
      let bi = 0;
      let acc = 0;
      while (bi < ws.length - 1 && acc + ws[bi] < uu) {
        acc += ws[bi];
        bi++;
      }
      const w = ws[bi];
      const lu = (uu - acc) / w;
      const dx = Math.min(lu, 1 - lu) * w * o.rows;
      const dy = Math.min(lv, 1 - lv);
      // unregelmäßige Kanten
      const edgeNoise = (fbm(u, v, 16, 3, o.seed + 5) - 0.5) * 0.05;
      const ed = Math.min(dx, dy) + edgeNoise;
      const id = row * 97 + bi;
      const bh = hash2(id, 3, o.seed);
      const detail = fbm(u, v, 8, 5, o.seed + 11);
      const fine = fbm(u, v, 64, 3, o.seed + 21);
      let h: number;
      let r: number, g: number, b: number;
      if (ed < o.mortar) {
        h = 0.05 + fine * 0.08;
        const m = 0.85 + fine * 0.3;
        r = o.mortarColor[0] * m;
        g = o.mortarColor[1] * m;
        b = o.mortarColor[2] * m;
        t.rough[i] = 1;
      } else {
        const bevel = sstep(o.mortar, o.mortar + 0.12, ed);
        const chip = hash2(id, 9, o.seed) > 0.7 ? sstep(0.62, 0.7, fbm(u, v, 12, 3, o.seed + id)) * 0.25 : 0;
        h = 0.35 + bevel * 0.4 + (detail - 0.5) * 0.35 + (fine - 0.5) * 0.12 - chip;
        const shade = 1 - o.variation * 0.5 + bh * o.variation + (detail - 0.5) * 0.35;
        r = o.base[0] * shade;
        g = o.base[1] * shade;
        b = o.base[2] * shade * (0.96 + hash2(id, 5, o.seed) * 0.08);
        // Kantenverschmutzung
        const grime = (1 - sstep(o.mortar, o.mortar + 0.2, ed)) * o.grime;
        r *= 1 - grime * 0.5;
        g *= 1 - grime * 0.5;
        b *= 1 - grime * 0.45;
        t.rough[i] = 0.78 + fine * 0.2 - bevel * 0.04;
      }
      // Risse
      if (o.cracks > 0) {
        const cr = ridged(u, v, 6, 4, o.seed + 77);
        if (cr > 1 - o.cracks * 0.12) {
          const k = sstep(1 - o.cracks * 0.12, 1, cr);
          h -= k * 0.3;
          r *= 1 - k * 0.6;
          g *= 1 - k * 0.6;
          b *= 1 - k * 0.6;
        }
      }
      // Moos / Feuchtigkeit
      if (o.moss > 0) {
        const mm = sstep(0.55, 0.8, fbm(u, v, 4, 5, o.seed + 99)) * o.moss * (ed < o.mortar + 0.08 ? 1.3 : 0.7);
        r = lerp(r, 0.13, mm);
        g = lerp(g, 0.17, mm);
        b = lerp(b, 0.08, mm);
      }
      // großflächige Fleckigkeit
      const stain = fbm(u, v, 3, 4, o.seed + 41);
      const s = 0.82 + stain * 0.36;
      setColor(t, i, r * s, g * s, b * s);
      t.height[i] = h;
    }
  }
  return t;
}

export function genFlagstones(size: number, seed: number, base: [number, number, number], cells = 5, gap = 0.05): TexData {
  const t = alloc(size);
  const vr: VoronoiResult = { f1: 0, f2: 0, id: 0, cx: 0, cy: 0 };
  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const i = y * size + x;
      const wu = u + (fbm(u, v, 6, 3, seed + 1) - 0.5) * 0.04;
      const wv = v + (fbm(u, v, 6, 3, seed + 2) - 0.5) * 0.04;
      voronoi(((wu % 1) + 1) % 1, ((wv % 1) + 1) % 1, cells, seed, 0.9, vr);
      const e = vr.f2 - vr.f1;
      const detail = fbm(u, v, 10, 5, seed + 3);
      const fine = fbm(u, v, 48, 3, seed + 4);
      const ch = hash2(vr.id, 1, seed);
      let h: number, r: number, g: number, b: number;
      if (e < gap) {
        h = 0.04 + fine * 0.05;
        const m = 0.35 + fine * 0.2;
        r = base[0] * m;
        g = base[1] * m;
        b = base[2] * m;
        t.rough[i] = 1;
      } else {
        const bevel = sstep(gap, gap + 0.12, e);
        const worn = fbm(u, v, 3, 3, seed + vr.id);
        h = 0.4 + bevel * 0.3 + (detail - 0.5) * 0.3 + (fine - 0.5) * 0.08 - worn * 0.1;
        const shade = 0.78 + ch * 0.38 + (detail - 0.5) * 0.3;
        r = base[0] * shade;
        g = base[1] * shade;
        b = base[2] * shade;
        const grime = (1 - bevel) * 0.4;
        r *= 1 - grime;
        g *= 1 - grime;
        b *= 1 - grime;
        // abgetretene, glattere Stellen
        t.rough[i] = 0.72 + fine * 0.2 + (1 - worn) * 0.06;
      }
      const stain = 0.8 + fbm(u, v, 2, 4, seed + 9) * 0.4;
      setColor(t, i, r * stain, g * stain, b * stain);
      t.height[i] = h;
    }
  }
  return t;
}

export function genCobble(size: number, seed: number): TexData {
  const t = alloc(size);
  const vr: VoronoiResult = { f1: 0, f2: 0, id: 0, cx: 0, cy: 0 };
  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const i = y * size + x;
      voronoi(u, v, 9, seed, 0.75, vr);
      const e = vr.f2 - vr.f1;
      const dome = sstep(0.02, 0.45, e);
      const fine = fbm(u, v, 40, 3, seed + 4);
      const ch = hash2(vr.id, 2, seed);
      const h = dome * 0.8 + (fine - 0.5) * 0.1;
      const mud = 1 - sstep(0.03, 0.14, e);
      const shade = 0.55 + ch * 0.4 + (fine - 0.5) * 0.2;
      let r = 0.36 * shade, g = 0.34 * shade, b = 0.32 * shade;
      r = lerp(r, 0.1, mud);
      g = lerp(g, 0.085, mud);
      b = lerp(b, 0.06, mud);
      setColor(t, i, r, g, b);
      t.height[i] = h;
      // nasses Pflaster: glatte Kuppen
      t.rough[i] = lerp(0.42 + fine * 0.2, 0.95, mud);
    }
  }
  return t;
}

export function genPlanks(size: number, seed: number, base: [number, number, number], boards = 6, dark = 1): TexData {
  const t = alloc(size);
  const rng = new Rng(seed);
  const seams: number[][] = [];
  for (let bIdx = 0; bIdx < boards; bIdx++) {
    const s: number[] = [];
    let p = rng.next();
    s.push(p);
    if (rng.next() > 0.4) s.push((p + rng.range(0.35, 0.65)) % 1);
    seams.push(s);
  }
  for (let y = 0; y < size; y++) {
    const v = y / size;
    const bIdx = Math.min(boards - 1, Math.floor(v * boards));
    const lv = v * boards - bIdx;
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const i = y * size + x;
      const bh = hash2(bIdx, 4, seed);
      // Maserung: stark gestrecktes Rauschen
      const warp = afbm(u, v, 2, 8, 3, seed + bIdx) * 3;
      const grainCoord = v * boards * 6 + warp + bh * 10;
      const grain = 0.5 + 0.5 * Math.sin(grainCoord * Math.PI * 2);
      const fibers = afbm(u, v, 4, 64, 3, seed + 7);
      let edge = Math.min(lv, 1 - lv) * (size / boards);
      let seamD = 1e9;
      for (const s of seams[bIdx]) {
        const d = Math.min(Math.abs(u - s), 1 - Math.abs(u - s)) * size;
        seamD = Math.min(seamD, d);
      }
      const gapPx = 1.6;
      let h = 0.5 + (grain - 0.5) * 0.08 + (fibers - 0.5) * 0.12;
      let shade = (0.75 + bh * 0.4) * (0.82 + grain * 0.18) * (0.85 + fibers * 0.3);
      if (edge < gapPx || seamD < gapPx) {
        h = 0.0;
        shade *= 0.25;
      } else if (edge < gapPx + 3 || seamD < gapPx + 3) {
        h -= 0.15;
        shade *= 0.75;
      }
      // Astlöcher
      const kx = hash2(bIdx, 11, seed), ky = (bIdx + 0.5) / boards;
      const kd = Math.hypot((u - kx) * 3, (v - ky) * boards * 0.8);
      if (hash2(bIdx, 12, seed) > 0.55 && kd < 0.12) {
        const k = 1 - kd / 0.12;
        shade *= 1 - k * 0.6;
        h -= k * 0.1;
      }
      const wear = fbm(u, v, 3, 3, seed + 31);
      shade *= (0.85 + wear * 0.3) * dark;
      setColor(t, i, base[0] * shade, base[1] * shade, base[2] * shade);
      t.height[i] = h;
      t.rough[i] = 0.62 + fibers * 0.25 + (1 - wear) * 0.1;
    }
  }
  return t;
}

export function genPlaster(size: number, seed: number, base: [number, number, number], dirt = 0.5): TexData {
  const t = alloc(size);
  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const i = y * size + x;
      const n = fbm(u, v, 6, 6, seed);
      const fine = fbm(u, v, 64, 2, seed + 3);
      const stains = fbm(u, v, 2, 5, seed + 5);
      const crack = ridged(u, v, 4, 5, seed + 9);
      let h = 0.5 + (n - 0.5) * 0.4 + (fine - 0.5) * 0.2;
      let shade = 0.85 + (n - 0.5) * 0.25;
      const d = sstep(0.45, 0.85, stains) * dirt;
      let r = base[0] * shade, g = base[1] * shade, b = base[2] * shade;
      r = lerp(r, base[0] * 0.45, d);
      g = lerp(g, base[1] * 0.42, d);
      b = lerp(b, base[2] * 0.35, d);
      if (crack > 0.93) {
        const k = sstep(0.93, 1, crack);
        h -= k * 0.4;
        r *= 1 - k * 0.5;
        g *= 1 - k * 0.5;
        b *= 1 - k * 0.5;
      }
      // abgeplatzter Putz
      const flake = fbm(u, v, 5, 4, seed + 13);
      if (flake > 0.72) {
        const k = sstep(0.72, 0.76, flake);
        h -= k * 0.3;
        r = lerp(r, 0.3, k * 0.7);
        g = lerp(g, 0.24, k * 0.7);
        b = lerp(b, 0.2, k * 0.7);
      }
      setColor(t, i, r, g, b);
      t.height[i] = h;
      t.rough[i] = 0.92 + fine * 0.08;
    }
  }
  return t;
}

export function genRoofTiles(size: number, seed: number, base: [number, number, number]): TexData {
  const t = alloc(size);
  const rows = 8, cols = 8;
  for (let y = 0; y < size; y++) {
    const v = y / size;
    const row = Math.floor(v * rows);
    const lv = v * rows - row;
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const i = y * size + x;
      const off = row % 2 ? 0.5 / cols : 0;
      const cu = ((u + off) * cols) % 1;
      const col = Math.floor(((u + off) % 1) * cols);
      const id = row * 31 + col;
      const round = 1 - Math.pow(Math.abs(cu - 0.5) * 2, 3);
      const bottom = sstep(0, 0.12, lv);
      const n = fbm(u, v, 16, 4, seed);
      const h = (lv * 0.6 + round * 0.25) * bottom + (n - 0.5) * 0.1;
      const sh = (0.7 + hash2(id, 1, seed) * 0.45) * (0.6 + lv * 0.5) * (0.85 + n * 0.3);
      const moss = sstep(0.6, 0.85, fbm(u, v, 3, 4, seed + 4)) * 0.6;
      setColor(t, i, lerp(base[0] * sh, 0.15, moss), lerp(base[1] * sh, 0.18, moss), lerp(base[2] * sh, 0.1, moss));
      t.height[i] = bottom < 0.5 ? 0 : h;
      t.rough[i] = 0.75 + n * 0.2;
    }
  }
  return t;
}

export function genGround(size: number, seed: number, kind: "dirt" | "grass" | "forest" | "mud"): TexData {
  const t = alloc(size);
  const vr: VoronoiResult = { f1: 0, f2: 0, id: 0, cx: 0, cy: 0 };
  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const i = y * size + x;
      const n = fbm(u, v, 4, 6, seed);
      const fine = fbm(u, v, 48, 3, seed + 1);
      voronoi(u, v, 24, seed + 2, 0.9, vr);
      const pebble = vr.f1 < 0.28 && hash2(vr.id, 3, seed) > 0.6 ? sstep(0.28, 0.1, vr.f1) : 0;
      let r = 0.2, g = 0.15, b = 0.1, h = n * 0.5 + fine * 0.2;
      let rough = 0.95;
      if (kind === "dirt" || kind === "mud") {
        const sh = 0.6 + n * 0.6;
        r = 0.22 * sh; g = 0.16 * sh; b = 0.11 * sh;
        if (kind === "mud") {
          const wet = sstep(0.45, 0.6, fbm(u, v, 3, 4, seed + 8));
          r *= 1 - wet * 0.4; g *= 1 - wet * 0.4; b *= 1 - wet * 0.35;
          rough = lerp(0.95, 0.3, wet);
          h -= wet * 0.2;
        }
      } else if (kind === "grass") {
        const blades = afbm(u, v, 64, 12, 3, seed + 5);
        const patch = fbm(u, v, 3, 4, seed + 6);
        const sh = 0.55 + blades * 0.6;
        r = lerp(0.07, 0.17, patch) * sh;
        g = lerp(0.11, 0.16, patch) * sh;
        b = lerp(0.05, 0.08, patch) * sh;
        h = blades * 0.6 + n * 0.3;
        const bare = sstep(0.62, 0.78, fbm(u, v, 5, 4, seed + 7));
        r = lerp(r, 0.2 * (0.7 + n * 0.5), bare);
        g = lerp(g, 0.15 * (0.7 + n * 0.5), bare);
        b = lerp(b, 0.1 * (0.7 + n * 0.5), bare);
      } else {
        // Waldboden: Erde, Nadeln, Moos, Laub
        const sh = 0.5 + n * 0.6;
        r = 0.16 * sh; g = 0.12 * sh; b = 0.08 * sh;
        const needles = afbm(u, v, 40, 6, 2, seed + 9);
        const needles2 = afbm(v, u, 40, 6, 2, seed + 10);
        const nd = Math.max(sstep(0.68, 0.74, needles), sstep(0.68, 0.74, needles2));
        r = lerp(r, 0.28, nd * 0.6); g = lerp(g, 0.17, nd * 0.6); b = lerp(b, 0.08, nd * 0.6);
        const moss = sstep(0.55, 0.75, fbm(u, v, 3, 5, seed + 11));
        r = lerp(r, 0.09, moss); g = lerp(g, 0.14, moss); b = lerp(b, 0.05, moss);
        voronoi(u, v, 14, seed + 12, 0.9, vr);
        if (hash2(vr.id, 5, seed) > 0.75 && vr.f1 < 0.3) {
          const lf = sstep(0.3, 0.15, vr.f1);
          const lc = hash2(vr.id, 6, seed);
          r = lerp(r, 0.3 + lc * 0.15, lf); g = lerp(g, 0.14 + lc * 0.06, lf); b = lerp(b, 0.05, lf);
          h += lf * 0.2;
        }
        h += nd * 0.15;
      }
      if (pebble > 0) {
        const pc = 0.25 + hash2(vr.id, 4, seed) * 0.15;
        r = lerp(r, pc, pebble); g = lerp(g, pc * 0.95, pebble); b = lerp(b, pc * 0.9, pebble);
        h += pebble * 0.5;
      }
      setColor(t, i, r, g, b);
      t.height[i] = h;
      t.rough[i] = rough;
    }
  }
  return t;
}

export function genRock(size: number, seed: number, base: [number, number, number]): TexData {
  const t = alloc(size);
  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const i = y * size + x;
      const n = fbm(u, v, 3, 7, seed);
      const rg = ridged(u, v, 4, 5, seed + 1);
      const strata = 0.5 + 0.5 * Math.sin((v * 10 + n * 3) * Math.PI * 2);
      const h = n * 0.6 + rg * 0.35 + strata * 0.1;
      const sh = 0.55 + n * 0.55 + strata * 0.08;
      const lichen = sstep(0.62, 0.8, fbm(u, v, 6, 4, seed + 3)) * 0.4;
      setColor(t, i, lerp(base[0] * sh, 0.2, lichen), lerp(base[1] * sh, 0.22, lichen), lerp(base[2] * sh, 0.15, lichen));
      t.height[i] = h;
      t.rough[i] = 0.85 + rg * 0.15;
    }
  }
  return t;
}

export function genBark(size: number, seed: number, base: [number, number, number]): TexData {
  const t = alloc(size);
  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const i = y * size + x;
      const warp = fbm(u, v, 4, 3, seed) * 0.15;
      const grooves = 1 - Math.abs(Math.sin((u + warp) * Math.PI * 10 + afbm(u, v, 6, 2, 3, seed + 1) * 4));
      const plates = afbm(u + warp, v, 12, 3, 4, seed + 2);
      const h = Math.pow(1 - grooves, 2) * 0.6 + plates * 0.4;
      const sh = 0.35 + h * 0.75;
      const moss = sstep(0.6, 0.8, fbm(u, v, 3, 4, seed + 3)) * 0.5;
      setColor(t, i, lerp(base[0] * sh, 0.1, moss), lerp(base[1] * sh, 0.14, moss), lerp(base[2] * sh, 0.06, moss));
      t.height[i] = h;
      t.rough[i] = 0.95;
    }
  }
  return t;
}

export function genMetal(size: number, seed: number, base: [number, number, number], rust = 0.5): TexData {
  const t = alloc(size, true);
  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const i = y * size + x;
      const n = fbm(u, v, 6, 5, seed);
      const scratch = afbm(u, v, 128, 4, 2, seed + 1);
      const r0 = fbm(u, v, 4, 6, seed + 2);
      const rr = sstep(0.55, 0.7, r0 + (n - 0.5) * 0.3) * rust;
      const sh = 0.8 + n * 0.3;
      let r = base[0] * sh, g = base[1] * sh, b = base[2] * sh;
      r = lerp(r, 0.32 * (0.6 + n), rr);
      g = lerp(g, 0.14 * (0.6 + n), rr);
      b = lerp(b, 0.06 * (0.6 + n), rr);
      setColor(t, i, r, g, b);
      t.height[i] = n * 0.3 + rr * 0.3 + scratch * 0.05;
      t.rough[i] = lerp(0.35 + scratch * 0.25 + n * 0.15, 0.95, rr);
      t.metal![i] = lerp(1, 0.1, rr);
    }
  }
  return t;
}

export function genCloth(size: number, seed: number, base: [number, number, number], weave = 96, sheen = 0.2): TexData {
  const t = alloc(size);
  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const i = y * size + x;
      const wx = Math.sin(u * weave * Math.PI * 2);
      const wy = Math.sin(v * weave * Math.PI * 2);
      const thread = (wx * 0.5 + 0.5) * ((Math.floor(v * weave) % 2) ? 1 : 0.7) + (wy * 0.5 + 0.5) * 0.3;
      const n = fbm(u, v, 4, 5, seed);
      const wear = sstep(0.6, 0.85, fbm(u, v, 3, 4, seed + 3));
      const sh = (0.7 + n * 0.4) * (0.85 + thread * 0.15) * (1 - wear * 0.3);
      setColor(t, i, base[0] * sh, base[1] * sh, base[2] * sh);
      t.height[i] = thread * 0.3 + n * 0.2;
      t.rough[i] = 0.85 - sheen * n;
    }
  }
  return t;
}

export function genMarble(size: number, seed: number, base: [number, number, number], vein: [number, number, number]): TexData {
  const t = alloc(size);
  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const i = y * size + x;
      const w = fbm(u, v, 3, 6, seed);
      const veins = ridged(u + w * 0.4, v + w * 0.3, 2, 5, seed + 1);
      const k = sstep(0.75, 0.97, veins);
      const n = fbm(u, v, 12, 3, seed + 2);
      const sh = 0.88 + n * 0.12;
      setColor(t, i, lerp(base[0] * sh, vein[0], k), lerp(base[1] * sh, vein[1], k), lerp(base[2] * sh, vein[2], k));
      t.height[i] = 0.5 + n * 0.05 - k * 0.05;
      t.rough[i] = 0.3 + n * 0.2 + k * 0.1;
    }
  }
  return t;
}

/** Organischer, geäderter Stein für die Kammern unter Vareth (mit Emission). */
export function genFleshStone(size: number, seed: number): TexData {
  const t = alloc(size, false, true);
  const vr: VoronoiResult = { f1: 0, f2: 0, id: 0, cx: 0, cy: 0 };
  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const i = y * size + x;
      const n = fbm(u, v, 3, 6, seed);
      voronoi(u + (n - 0.5) * 0.1, v + (n - 0.5) * 0.1, 6, seed + 1, 0.9, vr);
      const e = vr.f2 - vr.f1;
      const vein = sstep(0.08, 0.0, e);
      const ribs = ridged(u, v, 5, 4, seed + 2);
      const h = n * 0.5 + (1 - vein) * 0.3 + ribs * 0.2;
      const sh = 0.4 + n * 0.5;
      setColor(t, i, lerp(0.08 * sh, 0.35, vein), lerp(0.05 * sh, 0.02, vein), lerp(0.06 * sh, 0.03, vein));
      t.height[i] = h;
      t.rough[i] = lerp(0.6, 0.25, vein);
      const em = vein * (0.6 + 0.4 * n);
      t.emissive![i * 3] = em * 0.9;
      t.emissive![i * 3 + 1] = em * 0.05;
      t.emissive![i * 3 + 2] = em * 0.05;
    }
  }
  return t;
}

export function genBone(size: number, seed: number): TexData {
  const t = alloc(size);
  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const i = y * size + x;
      const n = fbm(u, v, 8, 5, seed);
      const pores = fbm(u, v, 64, 2, seed + 1);
      const sh = 0.75 + n * 0.3;
      const dirt = sstep(0.5, 0.8, fbm(u, v, 3, 4, seed + 2)) * 0.5;
      setColor(t, i, lerp(0.62 * sh, 0.25, dirt), lerp(0.56 * sh, 0.2, dirt), lerp(0.44 * sh, 0.14, dirt));
      t.height[i] = n * 0.4 + (pores > 0.7 ? -0.2 : 0);
      t.rough[i] = 0.7 + pores * 0.2;
    }
  }
  return t;
}

// ---------------------------------------------------------------------------
// Umwandlung in Three.js-Texturen
// ---------------------------------------------------------------------------

function dataTex(arr: Uint8Array, size: number, srgb: boolean): THREE.DataTexture {
  const tex = new THREE.DataTexture(arr, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 8;
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function toPBR(t: TexData, normalStrength = 2.5): PBRSet {
  const n = t.size * t.size;
  const s = t.size;
  const col = new Uint8Array(n * 4);
  const nor = new Uint8Array(n * 4);
  const orm = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) {
    col[i * 4] = t.color[i * 3] * 255;
    col[i * 4 + 1] = t.color[i * 3 + 1] * 255;
    col[i * 4 + 2] = t.color[i * 3 + 2] * 255;
    col[i * 4 + 3] = 255;
    const x = i % s;
    const y = (i / s) | 0;
    const hl = t.height[y * s + ((x - 1 + s) % s)];
    const hr = t.height[y * s + ((x + 1) % s)];
    const hd = t.height[((y - 1 + s) % s) * s + x];
    const hu = t.height[((y + 1) % s) * s + x];
    const k = normalStrength * (s / 256);
    let nx = (hl - hr) * k;
    let ny = (hd - hu) * k;
    let nz = 1;
    const len = Math.hypot(nx, ny, nz);
    nx /= len; ny /= len; nz /= len;
    nor[i * 4] = (nx * 0.5 + 0.5) * 255;
    nor[i * 4 + 1] = (ny * 0.5 + 0.5) * 255;
    nor[i * 4 + 2] = (nz * 0.5 + 0.5) * 255;
    nor[i * 4 + 3] = 255;
    // Okklusion aus Höhe (dezente Hohlraumabdunklung)
    const ao = clamp01(0.55 + t.height[i] * 0.9);
    orm[i * 4] = ao * 255;
    orm[i * 4 + 1] = clamp01(t.rough[i]) * 255;
    orm[i * 4 + 2] = (t.metal ? t.metal[i] : 0) * 255;
    orm[i * 4 + 3] = 255;
  }
  const set: PBRSet = {
    map: dataTex(col, s, true),
    normalMap: dataTex(nor, s, false),
    ormMap: dataTex(orm, s, false),
  };
  if (t.emissive) {
    const em = new Uint8Array(n * 4);
    for (let i = 0; i < n; i++) {
      em[i * 4] = clamp01(t.emissive[i * 3]) * 255;
      em[i * 4 + 1] = clamp01(t.emissive[i * 3 + 1]) * 255;
      em[i * 4 + 2] = clamp01(t.emissive[i * 3 + 2]) * 255;
      em[i * 4 + 3] = 255;
    }
    set.emissiveMap = dataTex(em, s, true);
  }
  return set;
}

// ---------------------------------------------------------------------------
// Canvas-basierte Texturen (Wappen, Gemälde, Blut, Spinnweben, Glasfenster)
// ---------------------------------------------------------------------------

export function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!];
}

export function canvasTex(c: HTMLCanvasElement, srgb = true, repeat = false): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.needsUpdate = true;
  return t;
}

/** Wappen des Hauses Drakenfels: Rabe mit ausgebreiteten Schwingen vor rotem Mond, darüber Krone. */
export function drawCrest(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, opts: { moon?: string; ink?: string; gold?: string } = {}): void {
  const moon = opts.moon ?? "#7a0d12";
  const ink = opts.ink ?? "#0c0a0b";
  const gold = opts.gold ?? "#a8894a";
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s / 100, s / 100);
  // Schild
  ctx.beginPath();
  ctx.moveTo(-42, -48);
  ctx.lineTo(42, -48);
  ctx.lineTo(42, 5);
  ctx.quadraticCurveTo(40, 45, 0, 62);
  ctx.quadraticCurveTo(-40, 45, -42, 5);
  ctx.closePath();
  ctx.fillStyle = "#1b1416";
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = gold;
  ctx.stroke();
  // Mond
  ctx.beginPath();
  ctx.arc(0, -2, 26, 0, Math.PI * 2);
  ctx.fillStyle = moon;
  ctx.fill();
  // Rabe
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.quadraticCurveTo(-6, -10, -4, 0);
  ctx.quadraticCurveTo(-22, -16, -38, -6);
  ctx.quadraticCurveTo(-26, -2, -30, 6);
  ctx.quadraticCurveTo(-18, 4, -16, 12);
  ctx.quadraticCurveTo(-8, 8, -4, 14);
  ctx.lineTo(-6, 30);
  ctx.lineTo(0, 24);
  ctx.lineTo(6, 30);
  ctx.lineTo(4, 14);
  ctx.quadraticCurveTo(8, 8, 16, 12);
  ctx.quadraticCurveTo(18, 4, 30, 6);
  ctx.quadraticCurveTo(26, -2, 38, -6);
  ctx.quadraticCurveTo(22, -16, 4, 0);
  ctx.quadraticCurveTo(6, -10, 0, -18);
  ctx.fill();
  // Kopf und Schnabel
  ctx.beginPath();
  ctx.arc(0, -19, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(3, -20);
  ctx.lineTo(10, -17);
  ctx.lineTo(3, -16);
  ctx.fill();
  // Krone
  ctx.fillStyle = gold;
  ctx.beginPath();
  ctx.moveTo(-16, -36);
  ctx.lineTo(-16, -44);
  ctx.lineTo(-9, -39);
  ctx.lineTo(0, -47);
  ctx.lineTo(9, -39);
  ctx.lineTo(16, -44);
  ctx.lineTo(16, -36);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function makeTapestryTexture(seed: number, base = "#3a0a0e", pattern = "#5c1a1a"): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 512);
  const rng = new Rng(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 512);
  // Rautenmuster
  ctx.strokeStyle = pattern;
  ctx.lineWidth = 2;
  for (let y = -32; y < 544; y += 32) {
    for (let x = -32; x < 288; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, y + 16);
      ctx.lineTo(x + 16, y);
      ctx.lineTo(x + 32, y + 16);
      ctx.lineTo(x + 16, y + 32);
      ctx.closePath();
      ctx.stroke();
    }
  }
  // Bordüre
  ctx.strokeStyle = "#8a7040";
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, 236, 492);
  ctx.lineWidth = 2;
  ctx.strokeRect(22, 22, 212, 468);
  drawCrest(ctx, 128, 230, 150);
  // Alterung: Flecken, Löcher, Ausfransung unten
  const img = ctx.getImageData(0, 0, 256, 512);
  for (let i = 0; i < img.data.length; i += 4) {
    const px = (i / 4) % 256, py = Math.floor(i / 4 / 256);
    const n = fbm(px / 256, py / 512, 4, 4, seed);
    const k = 0.55 + n * 0.6;
    img.data[i] *= k;
    img.data[i + 1] *= k;
    img.data[i + 2] *= k;
    if (py > 470 && hash2(px, 0, seed) > 0.5 && py > 470 + hash2(px, 1, seed) * 42) img.data[i + 3] = 0;
    if (fbm(px / 256, py / 512, 8, 3, seed + 5) > 0.76) img.data[i + 3] = 0;
  }
  ctx.putImageData(img, 0, 0);
  void rng;
  return canvasTex(c);
}

/** Ahnenporträt; scratched = Gesicht ausgekratzt. */
export function makePortraitTexture(seed: number, opts: { scratched?: boolean; female?: boolean; hair?: string; robe?: string; label?: string } = {}): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 320);
  const rng = new Rng(seed);
  const g = ctx.createRadialGradient(128, 120, 10, 128, 160, 220);
  g.addColorStop(0, "#3b2a1e");
  g.addColorStop(1, "#0e0907");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 320);
  // Körper / Gewand
  ctx.fillStyle = opts.robe ?? "#1a0d10";
  ctx.beginPath();
  ctx.moveTo(30, 320);
  ctx.quadraticCurveTo(40, 200, 128, 190);
  ctx.quadraticCurveTo(216, 200, 226, 320);
  ctx.fill();
  // Kragen
  ctx.fillStyle = "#c9b48a";
  ctx.beginPath();
  ctx.moveTo(100, 200);
  ctx.lineTo(128, 236);
  ctx.lineTo(156, 200);
  ctx.lineTo(128, 214);
  ctx.fill();
  // Hals + Kopf
  ctx.fillStyle = "#b9a596";
  ctx.fillRect(116, 165, 24, 35);
  ctx.beginPath();
  ctx.ellipse(128, 130, 34, 46, 0, 0, Math.PI * 2);
  ctx.fill();
  // Haare
  ctx.fillStyle = opts.hair ?? "#140d0b";
  ctx.beginPath();
  if (opts.female) {
    ctx.ellipse(128, 112, 40, 36, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(88, 110, 14, 100);
    ctx.fillRect(154, 110, 14, 100);
  } else {
    ctx.ellipse(128, 104, 36, 24, 0, Math.PI, 0);
    ctx.fill();
  }
  // Gesichtszüge
  ctx.fillStyle = "#2a1a16";
  ctx.fillRect(110, 125, 12, 4);
  ctx.fillRect(134, 125, 12, 4);
  ctx.fillStyle = "#6a1a1a";
  ctx.fillRect(120, 156, 16, 3);
  ctx.strokeStyle = "rgba(60,40,30,0.6)";
  ctx.beginPath();
  ctx.moveTo(128, 128);
  ctx.lineTo(124, 146);
  ctx.lineTo(130, 147);
  ctx.stroke();
  if (opts.scratched) {
    ctx.strokeStyle = "rgba(200,180,150,0.85)";
    ctx.lineWidth = 3;
    for (let i = 0; i < 26; i++) {
      ctx.beginPath();
      const x = 96 + rng.next() * 64, y = 90 + rng.next() * 80;
      ctx.moveTo(x, y);
      ctx.lineTo(x + rng.range(-30, 30), y + rng.range(-30, 30));
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(15,8,6,0.75)";
    ctx.beginPath();
    ctx.ellipse(128, 132, 30, 40, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Craquelé + Firnis
  const img = ctx.getImageData(0, 0, 256, 320);
  for (let i = 0; i < img.data.length; i += 4) {
    const px = (i / 4) % 256, py = Math.floor(i / 4 / 256);
    const cr = ridged(px / 256, py / 320, 8, 3, seed);
    const k = (cr > 0.9 ? 0.6 : 1) * (0.8 + fbm(px / 256, py / 320, 3, 3, seed + 3) * 0.3);
    img.data[i] = img.data[i] * k * 1.05;
    img.data[i + 1] = img.data[i + 1] * k * 0.95;
    img.data[i + 2] = img.data[i + 2] * k * 0.75;
  }
  ctx.putImageData(img, 0, 0);
  if (opts.label) {
    ctx.fillStyle = "#8a7040";
    ctx.font = "bold 13px serif";
    ctx.textAlign = "center";
    ctx.fillText(opts.label, 128, 308);
  }
  return canvasTex(c);
}

export function makeBloodTexture(seed: number, kind: "pool" | "splatter" | "smear" | "hand" | "drops" | "writing", text = ""): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 256);
  const rng = new Rng(seed);
  ctx.clearRect(0, 0, 256, 256);
  const col = (a: number) => `rgba(${90 + rng.int(0, 30)},${4 + rng.int(0, 6)},${6 + rng.int(0, 6)},${a})`;
  if (kind === "pool") {
    ctx.fillStyle = col(0.95);
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      const r = 70 + fbm(Math.cos(a) * 0.5 + 0.5, Math.sin(a) * 0.5 + 0.5, 3, 3, seed) * 50;
      const x = 128 + Math.cos(a) * r, y = 128 + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.fill();
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      ctx.arc(128 + rng.range(-110, 110), 128 + rng.range(-110, 110), rng.range(2, 9), 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === "splatter" || kind === "drops") {
    const n = kind === "drops" ? 9 : 40;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = col(rng.range(0.7, 1));
      const x = kind === "drops" ? 128 + rng.range(-20, 20) : 128 + rng.range(-100, 100) * rng.next();
      const y = kind === "drops" ? 20 + i * 26 : 128 + rng.range(-100, 100) * rng.next();
      ctx.beginPath();
      ctx.ellipse(x, y, rng.range(3, kind === "drops" ? 8 : 18), rng.range(3, 12), rng.next() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === "smear") {
    ctx.lineCap = "round";
    for (let k = 0; k < 4; k++) {
      ctx.strokeStyle = col(0.75);
      ctx.lineWidth = rng.range(10, 26);
      ctx.beginPath();
      ctx.moveTo(10, 128 + rng.range(-40, 40));
      ctx.bezierCurveTo(80, rng.range(60, 200), 170, rng.range(60, 200), 246, 128 + rng.range(-40, 40));
      ctx.stroke();
    }
  } else if (kind === "hand") {
    ctx.fillStyle = col(0.92);
    ctx.beginPath();
    ctx.ellipse(128, 160, 42, 52, 0, 0, Math.PI * 2);
    ctx.fill();
    const fingers: [number, number, number][] = [[-38, -40, -0.5], [-16, -70, -0.15], [6, -78, 0], [28, -68, 0.15], [50, -12, 0.9]];
    ctx.lineCap = "round";
    ctx.strokeStyle = col(0.92);
    for (const [dx, dy, a] of fingers) {
      ctx.lineWidth = 17;
      ctx.beginPath();
      ctx.moveTo(128 + dx * 0.6, 140);
      ctx.lineTo(128 + dx + Math.sin(a) * 10, 128 + dy);
      ctx.stroke();
    }
    // Herablaufende Tropfen
    for (let i = 0; i < 5; i++) {
      ctx.lineWidth = rng.range(3, 6);
      const x = 100 + rng.next() * 56;
      ctx.beginPath();
      ctx.moveTo(x, 200);
      ctx.lineTo(x, 210 + rng.next() * 45);
      ctx.stroke();
    }
  } else if (kind === "writing") {
    ctx.fillStyle = col(0.9);
    ctx.font = "bold 46px 'Cinzel', serif";
    ctx.textAlign = "center";
    const lines = text.split("\n");
    lines.forEach((l, i) => ctx.fillText(l, 128, 90 + i * 56));
    ctx.strokeStyle = col(0.8);
    ctx.lineWidth = 3;
    for (let i = 0; i < 14; i++) {
      const x = 30 + rng.next() * 196;
      ctx.beginPath();
      ctx.moveTo(x, 80 + rng.next() * 100);
      ctx.lineTo(x, 180 + rng.next() * 70);
      ctx.stroke();
    }
  }
  return canvasTex(c);
}

export function makeCobwebTexture(seed: number): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 256);
  const rng = new Rng(seed);
  ctx.strokeStyle = "rgba(220,220,230,0.55)";
  ctx.lineWidth = 1;
  const spokes = 9;
  const ang: number[] = [];
  for (let i = 0; i < spokes; i++) ang.push((i / (spokes - 1)) * (Math.PI / 2) + rng.range(-0.05, 0.05));
  for (const a of ang) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * 360, Math.sin(a) * 360);
    ctx.stroke();
  }
  for (let r = 18; r < 300; r += rng.range(12, 22)) {
    ctx.beginPath();
    for (let i = 0; i < ang.length; i++) {
      const rr = r * (0.9 + rng.next() * 0.15);
      const x = Math.cos(ang[i]) * rr, y = Math.sin(ang[i]) * rr;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.quadraticCurveTo(Math.cos((ang[i] + ang[i - 1]) / 2) * rr * 0.92, Math.sin((ang[i] + ang[i - 1]) / 2) * rr * 0.92, x, y);
    }
    ctx.stroke();
  }
  // zerrissene Fäden
  ctx.strokeStyle = "rgba(220,220,230,0.3)";
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(rng.next() * 200, rng.next() * 200);
    ctx.quadraticCurveTo(rng.next() * 256, rng.next() * 256, rng.next() * 256, 256);
    ctx.stroke();
  }
  return canvasTex(c);
}

export function makeStainedGlassTexture(seed: number, theme: "rose" | "saint" | "moon" | "lineage" | "wolf" | "plain", accent = "#a01020"): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 512);
  const rng = new Rng(seed);
  const palette = ["#5a0a12", "#2a0a3a", "#0a1a40", "#3a2a08", accent, "#1a3a2a", "#601818"];
  // Glassegmente: Voronoi-Mosaik
  const img = ctx.createImageData(256, 512);
  const vr: VoronoiResult = { f1: 0, f2: 0, id: 0, cx: 0, cy: 0 };
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 256; x++) {
      voronoi(x / 256, y / 512, 7, seed, 0.9, vr);
      const i = (y * 256 + x) * 4;
      const e = vr.f2 - vr.f1;
      if (e < 0.06) {
        img.data[i] = img.data[i + 1] = img.data[i + 2] = 8;
      } else {
        const p = palette[Math.floor(hash2(vr.id, 2, seed) * palette.length)];
        const r = parseInt(p.slice(1, 3), 16), g = parseInt(p.slice(3, 5), 16), b = parseInt(p.slice(5, 7), 16);
        const k = 0.75 + fbm(x / 256, y / 512, 8, 3, seed) * 0.5;
        img.data[i] = r * k;
        img.data[i + 1] = g * k;
        img.data[i + 2] = b * k;
      }
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#080606";
  ctx.fillStyle = "rgba(0,0,0,0)";
  if (theme === "rose" || theme === "moon") {
    ctx.beginPath();
    ctx.arc(128, 180, 80, 0, Math.PI * 2);
    ctx.fillStyle = theme === "moon" ? "#b0141c" : "#7a1a40";
    ctx.fill();
    ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(128, 180);
      ctx.lineTo(128 + Math.cos(a) * 80, 180 + Math.sin(a) * 80);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(128, 180, 30, 0, Math.PI * 2);
    ctx.fillStyle = "#d8b060";
    ctx.fill();
    ctx.stroke();
  } else if (theme === "saint" || theme === "lineage") {
    // Figur mit Heiligenschein
    ctx.fillStyle = "#c8a050";
    ctx.beginPath();
    ctx.arc(128, 130, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#d8c0a0";
    ctx.beginPath();
    ctx.ellipse(128, 132, 22, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = theme === "lineage" ? accent : "#3a0a40";
    ctx.beginPath();
    ctx.moveTo(84, 440);
    ctx.lineTo(100, 190);
    ctx.lineTo(156, 190);
    ctx.lineTo(172, 440);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Kelch / Blutstropfen
    ctx.fillStyle = "#a0101a";
    ctx.beginPath();
    ctx.moveTo(128, 260);
    ctx.quadraticCurveTo(150, 300, 128, 316);
    ctx.quadraticCurveTo(106, 300, 128, 260);
    ctx.fill();
    ctx.stroke();
  } else if (theme === "wolf") {
    ctx.fillStyle = "#2a3a50";
    ctx.beginPath();
    ctx.moveTo(70, 300);
    ctx.lineTo(100, 200);
    ctx.lineTo(110, 150);
    ctx.lineTo(128, 190);
    ctx.lineTo(146, 150);
    ctx.lineTo(156, 200);
    ctx.lineTo(186, 300);
    ctx.lineTo(128, 360);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#d0a020";
    ctx.beginPath();
    ctx.arc(112, 240, 6, 0, Math.PI * 2);
    ctx.arc(144, 240, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  // Bleiruten-Rahmen
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, 246, 502);
  void rng;
  return canvasTex(c);
}

export function makeBookSpinesTexture(seed: number): THREE.CanvasTexture {
  const [c, ctx] = canvas(512, 128);
  const rng = new Rng(seed);
  let x = 0;
  const cols = ["#3a1410", "#1e2a1a", "#2a1e10", "#14182a", "#3a2a14", "#241014", "#101010", "#4a3020"];
  while (x < 512) {
    const w = rng.range(10, 26);
    ctx.fillStyle = rng.pick(cols);
    const h = rng.range(90, 128);
    ctx.fillRect(x, 128 - h, w - 1, h);
    ctx.fillStyle = "rgba(170,140,80,0.6)";
    ctx.fillRect(x + 2, 128 - h + 10, w - 5, 2);
    ctx.fillRect(x + 2, 128 - 18, w - 5, 2);
    if (rng.next() > 0.5) ctx.fillRect(x + w / 2 - 3, 128 - h * 0.6, 5, 10);
    x += w;
  }
  const img = ctx.getImageData(0, 0, 512, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const k = 0.7 + Math.random() * 0.15;
    img.data[i] *= k;
    img.data[i + 1] *= k;
    img.data[i + 2] *= k;
  }
  ctx.putImageData(img, 0, 0);
  return canvasTex(c);
}

/** Weicher Rauch-/Nebel-Sprite. */
export function makeSmokeTexture(seed: number): THREE.CanvasTexture {
  const [c, ctx] = canvas(128, 128);
  const img = ctx.createImageData(128, 128);
  for (let y = 0; y < 128; y++) {
    for (let x = 0; x < 128; x++) {
      const dx = x / 64 - 1, dy = y / 64 - 1;
      const d = Math.sqrt(dx * dx + dy * dy);
      const n = fbm(x / 128, y / 128, 3, 5, seed);
      const a = clamp01((1 - d) * 1.4) * (0.4 + n * 0.8);
      const i = (y * 128 + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
      img.data[i + 3] = a * a * 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvasTex(c, false);
}

/** Kreisförmiges Blutsiegel / Runenkreis (transparent). */
export function makeSealTexture(seed: number, color = "rgba(150,10,20,0.95)", runes = true): THREE.CanvasTexture {
  const [c, ctx] = canvas(512, 512);
  const rng = new Rng(seed);
  ctx.translate(256, 256);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 6;
  for (const r of [230, 200, 120]) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Heptagramm
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let i = 0; i <= 7; i++) {
    const a = (i * 3 * Math.PI * 2) / 7 - Math.PI / 2;
    const x = Math.cos(a) * 198, y = Math.sin(a) * 198;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  if (runes) {
    ctx.font = "28px serif";
    ctx.textAlign = "center";
    const glyphs = "ᚱᚨᚢᛞᚾᛟᚷᛗᛉᛋᛏᛒᛖᛚᛜᛞ";
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      ctx.save();
      ctx.rotate(a);
      ctx.fillText(glyphs[rng.int(0, glyphs.length - 1)], 0, -208);
      ctx.restore();
    }
  }
  ctx.beginPath();
  ctx.arc(0, 0, 40, 0, Math.PI * 2);
  ctx.fill();
  return canvasTex(c);
}

/** Symbol für Rätsel (Mond, Rabe, Krone, Wolf, Schlange, Rose, Tropfen, Auge). */
export function drawSymbol(ctx: CanvasRenderingContext2D, sym: string, cx: number, cy: number, s: number, color: string): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s / 100, s / 100);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  switch (sym) {
    case "mond":
      ctx.arc(0, 0, 36, Math.PI * 0.3, Math.PI * 1.7);
      ctx.arc(14, 0, 30, Math.PI * 1.6, Math.PI * 0.4, true);
      ctx.fill();
      break;
    case "rabe":
      ctx.moveTo(-40, 0);
      ctx.quadraticCurveTo(-10, -30, 0, -5);
      ctx.quadraticCurveTo(10, -30, 40, 0);
      ctx.quadraticCurveTo(10, -8, 4, 10);
      ctx.lineTo(0, 30);
      ctx.lineTo(-4, 10);
      ctx.quadraticCurveTo(-10, -8, -40, 0);
      ctx.fill();
      break;
    case "krone":
      ctx.moveTo(-36, 20);
      ctx.lineTo(-36, -18);
      ctx.lineTo(-18, 0);
      ctx.lineTo(0, -30);
      ctx.lineTo(18, 0);
      ctx.lineTo(36, -18);
      ctx.lineTo(36, 20);
      ctx.closePath();
      ctx.fill();
      break;
    case "wolf":
      ctx.moveTo(-30, -30);
      ctx.lineTo(-14, -6);
      ctx.lineTo(14, -6);
      ctx.lineTo(30, -30);
      ctx.lineTo(26, 10);
      ctx.lineTo(0, 36);
      ctx.lineTo(-26, 10);
      ctx.closePath();
      ctx.fill();
      break;
    case "schlange":
      ctx.moveTo(-30, 30);
      ctx.bezierCurveTo(40, 20, -40, -10, 20, -30);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(22, -30, 7, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "rose":
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.moveTo(0, 0);
        ctx.ellipse(Math.cos(a) * 16, Math.sin(a) * 16, 16, 10, a, 0, Math.PI * 2);
      }
      ctx.fill();
      break;
    case "tropfen":
      ctx.moveTo(0, -36);
      ctx.quadraticCurveTo(32, 10, 0, 34);
      ctx.quadraticCurveTo(-32, 10, 0, -36);
      ctx.fill();
      break;
    case "auge":
      ctx.ellipse(0, 0, 38, 20, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "schwert":
      ctx.moveTo(0, -40);
      ctx.lineTo(0, 30);
      ctx.moveTo(-16, 14);
      ctx.lineTo(16, 14);
      ctx.stroke();
      break;
    default:
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
  }
  ctx.restore();
}

export function makeSymbolTexture(sym: string, color = "#c8a860", bg = "#1a1416"): THREE.CanvasTexture {
  const [c, ctx] = canvas(128, 128);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = "#5a4a30";
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 120, 120);
  drawSymbol(ctx, sym, 64, 64, 80, color);
  return canvasTex(c);
}

/** Inschrift auf Stein / Holz. */
export function makeInscriptionTexture(lines: string[], opts: { w?: number; h?: number; color?: string; bg?: string | null; font?: string } = {}): THREE.CanvasTexture {
  const w = opts.w ?? 512, h = opts.h ?? 128;
  const [c, ctx] = canvas(w, h);
  if (opts.bg) {
    ctx.fillStyle = opts.bg;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.fillStyle = opts.color ?? "rgba(20,14,12,0.85)";
  ctx.font = opts.font ?? `${Math.floor(h / (lines.length + 1))}px 'Cinzel', serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  lines.forEach((l, i) => ctx.fillText(l, w / 2, (h / (lines.length + 1)) * (i + 1)));
  return canvasTex(c);
}

export { vnoise };
