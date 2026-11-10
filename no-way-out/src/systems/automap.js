// Automatische Karte für die Handy-App „Karte“: Aufgedeckt wird, was Sami tatsächlich gesehen hat –
// der Raum, in dem er steht, und alles in Sichtlinie im Umkreis (auch durch offene Türen).
// Gezeichnet werden Böden, Wände, Türen (offen / zu / verschlossen), Glas, Wasser, gesehene Gegenstände
// und Samis Position mit Blickrichtung. Der aufgedeckte Bereich wird mit dem Checkpoint gespeichert.
import { F } from '../world/grid.js';

const RADIUS = 7;

export class AutoMap {
  constructor(game) { this.game = game; this.seen = null; this.t = 0; this.lastRoom = -1; this.chapter = null; this.zoom = 9; }

  // Neues Level: leere Karte (oder gespeicherte Karte desselben Kapitels)
  reset(level, saved) {
    const g = level.grid;
    this.seen = new Uint8Array(g.w * g.h);
    this.chapter = level.chapter.id; this.lastRoom = -1; this.t = 0;
    if (saved && saved.chapter === this.chapter && saved.data) this._decode(saved.data);
  }
  serialize() { return this.seen ? { chapter: this.chapter, data: this._encode() } : null; }

  _encode() {
    // Bitfeld als Base64
    const s = this.seen, n = Math.ceil(s.length / 8), b = new Uint8Array(n);
    for (let i = 0; i < s.length; i++) if (s[i]) b[i >> 3] |= 1 << (i & 7);
    let str = ''; for (let i = 0; i < n; i++) str += String.fromCharCode(b[i]);
    return btoa(str);
  }
  _decode(data) {
    try {
      const str = atob(data);
      for (let i = 0; i < this.seen.length; i++) if ((str.charCodeAt(i >> 3) >> (i & 7)) & 1) this.seen[i] = 1;
    } catch (e) { /* beschädigt: leer lassen */ }
  }

  update(dt) {
    const g = this.game, lv = g.level;
    if (!lv || !this.seen) return;
    this.t -= dt;
    if (this.t > 0) return;
    this.t = 0.2;
    const grid = lv.grid, p = g.player.pos;
    const pi = Math.floor(p.x), pj = Math.floor(p.z);
    if (!grid.inb(pi, pj)) return;
    // ganzer Raum, sobald Sami ihn betritt
    const rid = grid.room[grid.idx(pi, pj)];
    if (rid >= 0 && rid !== this.lastRoom) {
      this.lastRoom = rid;
      const r = lv.def.rooms[rid];
      if (r && r.w * r.h <= 400) for (let j = r.y; j < r.y + r.h; j++) for (let i = r.x; i < r.x + r.w; i++) if (grid.inb(i, j) && grid.room[grid.idx(i, j)] === rid) this.seen[grid.idx(i, j)] = 1;
    }
    // Sichtlinie im Umkreis
    for (let j = pj - RADIUS; j <= pj + RADIUS; j++) for (let i = pi - RADIUS; i <= pi + RADIUS; i++) {
      if (!grid.inb(i, j)) continue;
      const k = grid.idx(i, j);
      if (this.seen[k]) continue;
      const f = grid.f[k];
      if (!(f & F.FLOOR) || (f & F.SOLID)) continue;
      if ((i - pi) * (i - pi) + (j - pj) * (j - pj) > RADIUS * RADIUS) continue;
      if (grid.losLight(p.x, p.z, i + 0.5, j + 0.5)) this.seen[k] = 1;
    }
  }

  // Zeichnet die Karte in ein Rechteck des Handy-Bildschirms
  draw(c, X, Y, W, H) {
    const g = this.game, lv = g.level;
    c.save();
    c.fillStyle = '#0a0f14'; c.fillRect(X, Y, W, H);
    if (!lv || !this.seen) { c.restore(); return; }
    c.beginPath(); c.rect(X, Y, W, H); c.clip();
    const grid = lv.grid, z = this.zoom, p = g.player.pos;
    const ox = X + W / 2 - p.x * z, oy = Y + H / 2 - p.z * z;
    const i0 = Math.max(0, Math.floor((X - ox) / z) - 1), i1 = Math.min(grid.w - 1, Math.ceil((X + W - ox) / z) + 1);
    const j0 = Math.max(0, Math.floor((Y - oy) / z) - 1), j1 = Math.min(grid.h - 1, Math.ceil((Y + H - oy) / z) + 1);
    const seen = (i, j) => grid.inb(i, j) && this.seen[grid.idx(i, j)] === 1;
    const solid = (i, j) => !grid.inb(i, j) || (grid.f[grid.idx(i, j)] & F.SOLID) !== 0;
    const doorAt = new Map();
    for (const d of lv.doors) doorAt.set(grid.idx(d.x, d.y), d);
    // Böden
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const k = grid.idx(i, j);
      if (!this.seen[k]) continue;
      const f = grid.f[k];
      let col = (grid.room[k] & 1) ? '#22303a' : '#26353f';
      if (f & F.DOOR) {
        const d = doorAt.get(k);
        col = d ? (d.locked ? '#c04848' : d.target > 0.5 ? '#3f9a68' : '#c49a2a') : (f & F.DOORLOCK ? '#c04848' : f & F.DOORSHUT ? '#c49a2a' : '#3f9a68');
      } else if (f & F.GLASS) col = '#4f9fb4';
      else if (lv.waterDepth && lv.waterDepth(i + 0.5, j + 0.5, grid.floorY[k] + 0.01) > 0) col = '#1d4654';
      else if (grid.slope[k]) col = '#33495a';
      else if (f & F.VENT) col = '#4a4030';
      c.fillStyle = col;
      c.fillRect(ox + i * z, oy + j * z, z + 0.5, z + 0.5);
    }
    // Wände: Kante zwischen gesehenem Boden und massiver Nachbarzelle
    c.strokeStyle = '#c8d2da'; c.lineWidth = Math.max(1.2, z * 0.22); c.lineCap = 'square';
    c.beginPath();
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      if (!seen(i, j)) continue;
      const x = ox + i * z, y = oy + j * z;
      if (solid(i, j - 1)) { c.moveTo(x, y); c.lineTo(x + z, y); }
      if (solid(i, j + 1)) { c.moveTo(x, y + z); c.lineTo(x + z, y + z); }
      if (solid(i - 1, j)) { c.moveTo(x, y); c.lineTo(x, y + z); }
      if (solid(i + 1, j)) { c.moveTo(x + z, y); c.lineTo(x + z, y + z); }
    }
    c.stroke();
    // Gegenstände, die Sami schon gesehen hat (liegen noch da)
    for (const it of lv.items) {
      if (!it.alive) continue;
      const i = Math.floor(it.pos.x), j = Math.floor(it.pos.z);
      if (!seen(i, j)) continue;
      const ammo = it.type === 'ammo' || it.type === 'glock';
      c.fillStyle = ammo ? '#e0b04a' : '#f2e6a0';
      c.beginPath(); c.arc(ox + it.pos.x * z, oy + it.pos.z * z, Math.max(2, z * 0.28), 0, Math.PI * 2); c.fill();
    }
    // Raumnamen
    if (z >= 6) {
      c.font = `${Math.round(Math.min(13, 8 + z * 0.45))}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
      for (const r of lv.def.rooms) {
        if (r.w * r.h < 10 || !r.name) continue;
        const ci = Math.floor(r.x + r.w / 2), cj = Math.floor(r.y + r.h / 2);
        if (!seen(ci, cj)) continue;
        const tx = ox + (r.x + r.w / 2) * z, ty = oy + (r.y + r.h / 2) * z;
        if (tx < X - 60 || tx > X + W + 60 || ty < Y - 10 || ty > Y + H + 10) continue;
        c.fillStyle = 'rgba(10,15,20,0.6)'; const tw = c.measureText(r.name).width; c.fillRect(tx - tw / 2 - 3, ty - 8, tw + 6, 16);
        c.fillStyle = 'rgba(220,230,238,0.85)'; c.fillText(r.name, tx, ty);
      }
    }
    // Sami: Pfeil in Blickrichtung
    const yaw = g.player.yaw, fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    const cx = X + W / 2, cy = Y + H / 2, s = Math.max(6, z * 0.9);
    c.fillStyle = '#4fd17a'; c.strokeStyle = '#0a0f14'; c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(cx + fx * s * 1.3, cy + fz * s * 1.3);
    c.lineTo(cx - fx * s * 0.7 + fz * s * 0.75, cy - fz * s * 0.7 - fx * s * 0.75);
    c.lineTo(cx - fx * s * 0.25, cy - fz * s * 0.25);
    c.lineTo(cx - fx * s * 0.7 - fz * s * 0.75, cy - fz * s * 0.7 + fx * s * 0.75);
    c.closePath(); c.fill(); c.stroke();
    // Nordpfeil
    c.fillStyle = 'rgba(220,230,238,0.7)'; c.font = 'bold 12px sans-serif'; c.textAlign = 'center';
    c.fillText('N', X + W - 16, Y + 16); c.beginPath(); c.moveTo(X + W - 16, Y + 22); c.lineTo(X + W - 20, Y + 30); c.lineTo(X + W - 12, Y + 30); c.fill();
    c.restore();
  }

  // Name des Raums, in dem Sami steht
  roomName() {
    const lv = this.game.level; if (!lv) return '';
    const p = this.game.player.pos, grid = lv.grid;
    const i = Math.floor(p.x), j = Math.floor(p.z);
    if (!grid.inb(i, j)) return '';
    const r = lv.def.rooms[grid.room[grid.idx(i, j)]];
    return r ? r.name : '';
  }
  // Anteil der aufgedeckten Fläche (für die Anzeige)
  explored() {
    const lv = this.game.level; if (!lv || !this.seen) return 0;
    const f = lv.grid.f; let n = 0, s = 0;
    for (let k = 0; k < f.length; k++) if ((f[k] & F.FLOOR) && !(f[k] & F.SOLID)) { n++; if (this.seen[k]) s++; }
    return n ? s / n : 0;
  }
}
