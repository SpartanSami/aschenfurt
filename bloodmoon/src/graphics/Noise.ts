// Deterministische, kachelbare Rausch-Funktionen für prozedurale Texturen und Geometrie.

export class Rng {
  private s: number;
  constructor(seed = 1) {
    this.s = (seed >>> 0) || 1;
  }
  next(): number {
    // Mulberry32
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(a: number, b: number): number {
    return a + (b - a) * this.next();
  }
  int(a: number, b: number): number {
    return Math.floor(this.range(a, b + 1));
  }
  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

export function hash2(x: number, y: number, seed: number): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967296;
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

function mod(a: number, n: number): number {
  return ((a % n) + n) % n;
}

/** Kachelbares Value-Noise. x,y in Gitterzellen, period = Anzahl Zellen pro Kachel. */
export function vnoise(x: number, y: number, period: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = smooth(x - xi);
  const yf = smooth(y - yi);
  const x0 = mod(xi, period), x1 = mod(xi + 1, period);
  const y0 = mod(yi, period), y1 = mod(yi + 1, period);
  const a = hash2(x0, y0, seed);
  const b = hash2(x1, y0, seed);
  const c = hash2(x0, y1, seed);
  const d = hash2(x1, y1, seed);
  return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
}

/** Fraktales Rauschen, u,v in [0,1), kachelbar. */
export function fbm(u: number, v: number, basePeriod: number, octaves: number, seed: number, gain = 0.5): number {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let p = basePeriod;
  for (let o = 0; o < octaves; o++) {
    sum += amp * vnoise(u * p, v * p, p, seed + o * 31);
    norm += amp;
    amp *= gain;
    p *= 2;
  }
  return sum / norm;
}

/** Rauschen mit Rippen (für Risse, Adern). */
export function ridged(u: number, v: number, basePeriod: number, octaves: number, seed: number): number {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let p = basePeriod;
  for (let o = 0; o < octaves; o++) {
    const n = 1 - Math.abs(vnoise(u * p, v * p, p, seed + o * 17) * 2 - 1);
    sum += amp * n * n;
    norm += amp;
    amp *= 0.5;
    p *= 2;
  }
  return sum / norm;
}

export interface VoronoiResult {
  f1: number;
  f2: number;
  id: number;
  cx: number;
  cy: number;
}

/** Kachelbares Voronoi (Zellrauschen). */
export function voronoi(u: number, v: number, cells: number, seed: number, jitter = 0.85, out?: VoronoiResult): VoronoiResult {
  const x = u * cells;
  const y = v * cells;
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  let f1 = 1e9, f2 = 1e9, id = 0, cx = 0, cy = 0;
  for (let j = -1; j <= 1; j++) {
    for (let i = -1; i <= 1; i++) {
      const gx = xi + i;
      const gy = yi + j;
      const wx = mod(gx, cells);
      const wy = mod(gy, cells);
      const px = gx + 0.5 + (hash2(wx, wy, seed) - 0.5) * jitter;
      const py = gy + 0.5 + (hash2(wx, wy, seed + 7) - 0.5) * jitter;
      const dx = px - x;
      const dy = py - y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < f1) {
        f2 = f1;
        f1 = d;
        id = wx + wy * cells;
        cx = px;
        cy = py;
      } else if (d < f2) {
        f2 = d;
      }
    }
  }
  const r = out ?? { f1: 0, f2: 0, id: 0, cx: 0, cy: 0 };
  r.f1 = f1;
  r.f2 = f2;
  r.id = id;
  r.cx = cx;
  r.cy = cy;
  return r;
}

/** Einfaches 3D-Value-Noise (nicht kachelbar) für Geometrie-Verformung. */
export function noise3(x: number, y: number, z: number, seed = 0): number {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = smooth(x - xi), yf = smooth(y - yi), zf = smooth(z - zi);
  const h = (a: number, b: number, c: number) => hash2(a * 7919 + c * 104729, b, seed);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  const c000 = h(xi, yi, zi), c100 = h(xi + 1, yi, zi);
  const c010 = h(xi, yi + 1, zi), c110 = h(xi + 1, yi + 1, zi);
  const c001 = h(xi, yi, zi + 1), c101 = h(xi + 1, yi, zi + 1);
  const c011 = h(xi, yi + 1, zi + 1), c111 = h(xi + 1, yi + 1, zi + 1);
  return l(
    l(l(c000, c100, xf), l(c010, c110, xf), yf),
    l(l(c001, c101, xf), l(c011, c111, xf), yf),
    zf,
  );
}

export function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

export function sstep(a: number, b: number, x: number): number {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
