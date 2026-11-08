// Geräuschausbreitung: Geräusche breiten sich entlang begehbarer Wege aus (Flood-Fill über das Raster),
// geschlossene Türen und Glas dämpfen, durch Wände dringt nur ein schwacher Rest.
import { F } from '../world/grid.js';

export class NoiseSystem {
  constructor(game) {
    this.game = game;
    this.recent = [];   // für Debug-Anzeige
    this.time = 0;
  }

  emit(x, z, radius, kind = 'noise', opts = {}) {
    if (radius <= 0) return;
    const evt = { x, z, radius, kind, time: this.time, src: opts.src || null, field: null, fake: !!opts.fake };
    this.recent.push(evt);
    if (this.recent.length > 40) this.recent.shift();
    for (const zb of this.game.zombies) {
      if (!zb.alive || zb === opts.src) continue;
      const d = Math.hypot(zb.pos.x - x, zb.pos.z - z);
      const r = radius * (this.game.difficulty.zHearing || 1) * (zb.hearing || 1);
      if (d > r) continue;
      const loud = this.loudnessAt(evt, zb.pos.x, zb.pos.z, r);
      if (loud > 0) zb.onNoise(evt, loud);
    }
    if (this.game.onNoise) this.game.onNoise(evt);
    return evt;
  }

  // 0..1 Lautheit an Position (berücksichtigt Weglänge und Wände)
  loudnessAt(evt, tx, tz, radius) {
    const g = this.game.level.grid;
    const straight = Math.hypot(tx - evt.x, tz - evt.z);
    if (straight > radius) return 0;
    // direkter Sichtkontakt: volle Ausbreitung
    if (g.losLight(evt.x, evt.z, tx, tz)) return 1 - straight / radius;
    const pd = this.pathDist(evt, tx, tz, radius);
    let l = pd < Infinity ? 1 - pd / radius : 0;
    // gedämpft durch die Wand
    const wall = 1 - straight / (radius * 0.35);
    if (wall > 0) l = Math.max(l, wall * 0.6);
    return Math.max(0, l);
  }

  pathDist(evt, tx, tz, radius) {
    const g = this.game.level.grid;
    if (!evt.field) evt.field = this._flood(evt, radius, g);
    const k = Math.floor(tz) * g.w + Math.floor(tx);
    const v = evt.field.get(k);
    return v === undefined ? Infinity : v;
  }

  _flood(evt, radius, g) {
    const field = new Map();
    const sx = Math.floor(evt.x), sz = Math.floor(evt.z);
    if (!g.inb(sx, sz)) return field;
    const start = sz * g.w + sx;
    field.set(start, 0);
    // einfache Dijkstra-Variante mit Bucket-Liste (Kosten in 0,5er-Schritten)
    let frontier = [start];
    const best = field;
    let guard = 0;
    while (frontier.length && guard++ < 4000) {
      const next = [];
      for (const k of frontier) {
        const d0 = best.get(k);
        const x = k % g.w, y = (k / g.w) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (!g.inb(nx, ny)) continue;
          const nk = ny * g.w + nx;
          const v = g.f[nk];
          if (!(v & F.FLOOR) || (v & F.SOLID)) continue;
          let c = 1;
          if (v & F.DOORSHUT) c += 4;
          if (v & F.GLASS) c += 3;
          const nd = d0 + c;
          if (nd > radius) continue;
          const old = best.get(nk);
          if (old === undefined || nd < old) { best.set(nk, nd); next.push(nk); }
        }
      }
      frontier = next;
    }
    return field;
  }

  update(dt) { this.time += dt; }
}
