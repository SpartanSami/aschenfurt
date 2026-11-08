// Raster der Spielwelt (1 Zelle = 1 m). Grundlage für Kollision, Sichtlinien, Geräuschausbreitung und Pfadsuche.

export const F = {
  SOLID: 1,      // Wand / Fels
  FLOOR: 2,      // begehbarer Boden
  DOOR: 4,       // Türzelle (Zustand im Door-Objekt)
  PROP: 8,       // Requisit blockiert Bewegung
  TALL: 16,      // blockiert Sicht (Spind, Regal, Auto bei geducktem Ziel)
  GLASS: 32,     // blockiert Bewegung, nicht Sicht
  VENT: 64,      // niedriger Schacht – nur geduckt, für Zombies tabu
  NOZOMBIE: 128, // Zombies betreten diese Zelle nie
  VAULT: 256,    // Hindernis, über das man klettern kann
  COVER: 512,    // Deckung (blockiert Sicht auf geduckte Ziele)
  DOORLOCK: 1024,// Tür verschlossen (für KI unpassierbar)
  DOORSHUT: 2048,// Tür geschlossen (blockiert Sicht/Licht)
};

export class Grid {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.f = new Uint16Array(w * h);
    this.room = new Int16Array(w * h).fill(-1);
    this.floorY = new Float32Array(w * h);
    this.ceilY = new Float32Array(w * h).fill(3);
    this.slope = new Uint8Array(w * h);      // 0 keine, 1:+x 2:-x 3:+z 4:-z
    this.rise = new Float32Array(w * h);
    this.cost = new Float32Array(w * h).fill(1);
    this.door = new Array(w * h).fill(null);
    for (let i = 0; i < w * h; i++) this.f[i] = F.SOLID;
  }
  idx(x, y) { return y * this.w + x; }
  inb(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  get(x, y) { return this.inb(x, y) ? this.f[y * this.w + x] : F.SOLID; }
  has(x, y, flag) { return (this.get(x, y) & flag) !== 0; }
  set(x, y, flag) { if (this.inb(x, y)) this.f[y * this.w + x] |= flag; }
  clear(x, y, flag) { if (this.inb(x, y)) this.f[y * this.w + x] &= ~flag; }
  isFloor(x, y) { const v = this.get(x, y); return (v & F.FLOOR) !== 0 && (v & F.SOLID) === 0; }

  // Bodenhöhe an einer Weltposition (berücksichtigt Rampen/Treppen)
  heightAt(wx, wz) {
    const x = Math.floor(wx), y = Math.floor(wz);
    if (!this.inb(x, y)) return 0;
    const i = y * this.w + x;
    const base = this.floorY[i];
    const s = this.slope[i];
    if (!s) return base;
    const fx = wx - x, fz = wz - y;
    const r = this.rise[i];
    if (s === 1) return base + r * fx;
    if (s === 2) return base + r * (1 - fx);
    if (s === 3) return base + r * fz;
    return base + r * (1 - fz);
  }
  // Höhe an einer Kante einer Zelle (für Stufenprüfung) – Mittelwert der Kante
  edgeHeight(x, y, dx, dy) {
    const cx = x + 0.5 + dx * 0.49, cz = y + 0.5 + dy * 0.49;
    return this.heightAt(cx, cz);
  }

  // Blockiert die Zelle Licht/Sicht?
  blocksSight(x, y, targetCrouched = false) {
    const v = this.get(x, y);
    if (v & F.SOLID) return true;
    if (v & F.DOORSHUT) return true;
    if (v & F.TALL) return true;
    if (targetCrouched && (v & F.COVER)) return true;
    return false;
  }
  blocksLight(x, y) {
    const v = this.get(x, y);
    return (v & (F.SOLID | F.DOORSHUT)) !== 0;
  }

  // Sichtlinie (DDA) zwischen zwei Weltpunkten (XZ)
  los(ax, az, bx, bz, targetCrouched = false, ignoreCells = null) {
    let x = Math.floor(ax), y = Math.floor(az);
    const ex = Math.floor(bx), ey = Math.floor(bz);
    const dx = bx - ax, dz = bz - az;
    const stepX = dx > 0 ? 1 : -1, stepY = dz > 0 ? 1 : -1;
    const tDX = dx !== 0 ? Math.abs(1 / dx) : Infinity;
    const tDY = dz !== 0 ? Math.abs(1 / dz) : Infinity;
    let tMX = dx !== 0 ? (dx > 0 ? (x + 1 - ax) : (ax - x)) * tDX : Infinity;
    let tMY = dz !== 0 ? (dz > 0 ? (y + 1 - az) : (az - y)) * tDY : Infinity;
    let guard = 0;
    while (!(x === ex && y === ey) && guard++ < 400) {
      if (tMX < tMY) { tMX += tDX; x += stepX; } else { tMY += tDY; y += stepY; }
      if (x === ex && y === ey) break;
      if (ignoreCells && ignoreCells.has(y * this.w + x)) continue;
      if (this.blocksSight(x, y, targetCrouched)) return false;
    }
    return true;
  }
  losLight(ax, az, bx, bz) {
    let x = Math.floor(ax), y = Math.floor(az);
    const ex = Math.floor(bx), ey = Math.floor(bz);
    const dx = bx - ax, dz = bz - az;
    const stepX = dx > 0 ? 1 : -1, stepY = dz > 0 ? 1 : -1;
    const tDX = dx !== 0 ? Math.abs(1 / dx) : Infinity;
    const tDY = dz !== 0 ? Math.abs(1 / dz) : Infinity;
    let tMX = dx !== 0 ? (dx > 0 ? (x + 1 - ax) : (ax - x)) * tDX : Infinity;
    let tMY = dz !== 0 ? (dz > 0 ? (y + 1 - az) : (az - y)) * tDY : Infinity;
    let guard = 0;
    while (!(x === ex && y === ey) && guard++ < 400) {
      if (tMX < tMY) { tMX += tDX; x += stepX; } else { tMY += tDY; y += stepY; }
      if (x === ex && y === ey) break;
      if (this.blocksLight(x, y)) return false;
    }
    return true;
  }

  // Für die KI begehbar?
  aiWalkable(x, y) {
    const v = this.get(x, y);
    if ((v & F.FLOOR) === 0) return false;
    if (v & (F.SOLID | F.GLASS | F.VENT | F.NOZOMBIE | F.DOORLOCK)) return false;
    if ((v & F.PROP) && !(v & F.VAULT)) return false;
    return true;
  }

  // Kosten einer Bewegung von Zelle a nach b (Infinity = unpassierbar)
  aiStepCost(ax, ay, bx, by) {
    if (!this.aiWalkable(bx, by)) return Infinity;
    // Höhenunterschied: hochsteigen max. 0.45 m, herunterfallen bis 1.6 m
    const ddx = bx - ax, ddy = by - ay;
    const ha = this.edgeHeight(ax, ay, ddx, ddy), hb = this.edgeHeight(bx, by, -ddx, -ddy);
    if (hb - ha > 0.45) return Infinity;
    if (ha - hb > 1.6) return Infinity;
    let c = this.cost[by * this.w + bx];
    const v = this.f[by * this.w + bx];
    if (v & F.VAULT) c += 4;
    if (v & F.DOORSHUT) c += 3;
    if (ha - hb > 0.45) c += 2;
    return c;
  }

  // A*-Pfadsuche mit 8 Richtungen (ohne Ecken schneiden). Rückgabe: Liste von Zellen [{x,y}]
  findPath(sx, sy, gx, gy, maxNodes = 6000) {
    sx = Math.floor(sx); sy = Math.floor(sy); gx = Math.floor(gx); gy = Math.floor(gy);
    if (!this.inb(sx, sy) || !this.inb(gx, gy)) return null;
    if (!this.aiWalkable(gx, gy)) {
      const alt = this.nearestWalkable(gx, gy, 3);
      if (!alt) return null;
      gx = alt.x; gy = alt.y;
    }
    if (!this.aiWalkable(sx, sy)) {
      const alt = this.nearestWalkable(sx, sy, 2);
      if (!alt) return null;
      sx = alt.x; sy = alt.y;
    }
    const W = this.w, N = this.w * this.h;
    if (!this._g || this._g.length !== N) {
      this._g = new Float32Array(N); this._from = new Int32Array(N); this._mark = new Uint32Array(N); this._closed = new Uint32Array(N); this._gen = 0;
    }
    const gen = ++this._gen;
    const g = this._g, from = this._from, mark = this._mark, closed = this._closed;
    const heap = new MinHeap();
    const start = sy * W + sx, goal = gy * W + gx;
    const hfun = (i) => { const x = i % W, y = (i / W) | 0; const dx = Math.abs(x - gx), dy = Math.abs(y - gy); return (dx + dy) + (1.414 - 2) * Math.min(dx, dy); };
    g[start] = 0; mark[start] = gen; from[start] = -1;
    heap.push(start, hfun(start));
    let expanded = 0;
    const dirs = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
    while (heap.size) {
      const cur = heap.pop();
      if (cur === goal) break;
      if (closed[cur] === gen) continue;
      closed[cur] = gen;
      if (++expanded > maxNodes) return null;
      const cx = cur % W, cy = (cur / W) | 0;
      for (const [dx, dy, dc] of dirs) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= this.h) continue;
        if (dx && dy) { // Diagonale nur, wenn beide Nachbarn frei sind
          if (!this.aiWalkable(cx + dx, cy) || !this.aiWalkable(cx, cy + dy)) continue;
        }
        const sc = this.aiStepCost(cx, cy, nx, ny);
        if (sc === Infinity) continue;
        const ni = ny * W + nx;
        const ng = g[cur] + dc * sc;
        if (mark[ni] !== gen || ng < g[ni]) {
          mark[ni] = gen; g[ni] = ng; from[ni] = cur;
          heap.push(ni, ng + hfun(ni));
        }
      }
    }
    if (mark[goal] !== gen) return null;
    const path = [];
    let c = goal, guard = 0;
    while (c !== -1 && guard++ < 10000) { path.push({ x: c % W, y: (c / W) | 0 }); c = from[c]; }
    path.reverse();
    return path;
  }

  nearestWalkable(x, y, r) {
    for (let d = 1; d <= r; d++) {
      for (let oy = -d; oy <= d; oy++) for (let ox = -d; ox <= d; ox++) {
        if (Math.max(Math.abs(ox), Math.abs(oy)) !== d) continue;
        if (this.aiWalkable(x + ox, y + oy)) return { x: x + ox, y: y + oy };
      }
    }
    return null;
  }

  // Erreichbarkeit (Flood-Fill) – für QA-Tests
  reachable(sx, sy, walkFn) {
    const seen = new Uint8Array(this.w * this.h);
    const q = [[sx, sy]]; seen[sy * this.w + sx] = 1;
    while (q.length) {
      const [x, y] = q.pop();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (!this.inb(nx, ny)) continue;
        const i = ny * this.w + nx;
        if (seen[i]) continue;
        if (!walkFn(x, y, nx, ny)) continue;
        seen[i] = 1; q.push([nx, ny]);
      }
    }
    return seen;
  }
}

class MinHeap {
  constructor() { this.k = []; this.p = []; }
  get size() { return this.k.length; }
  push(key, pri) {
    const k = this.k, p = this.p;
    k.push(key); p.push(pri);
    let i = k.length - 1;
    while (i > 0) {
      const pa = (i - 1) >> 1;
      if (p[pa] <= p[i]) break;
      [k[pa], k[i]] = [k[i], k[pa]]; [p[pa], p[i]] = [p[i], p[pa]];
      i = pa;
    }
  }
  pop() {
    const k = this.k, p = this.p;
    const top = k[0];
    const lk = k.pop(), lp = p.pop();
    if (k.length) {
      k[0] = lk; p[0] = lp;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1, r = l + 1;
        let m = i;
        if (l < k.length && p[l] < p[m]) m = l;
        if (r < k.length && p[r] < p[m]) m = r;
        if (m === i) break;
        [k[m], k[i]] = [k[i], k[m]]; [p[m], p[i]] = [p[i], p[m]];
        i = m;
      }
    }
    return top;
  }
}
