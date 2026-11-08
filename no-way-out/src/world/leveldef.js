// Level-DSL: Kapitel beschreiben ihre Räume, Türen, Requisiten, Lichter, Gegner und Auslöser
// mit präzisen Koordinaten (1 Einheit = 1 m). Der LevelBuilder erzeugt daraus Geometrie, Kollision und Navigation.
import { Grid, F } from './grid.js';

export class LevelDef {
  constructor(w, h, opts = {}) {
    this.w = w; this.h = h;
    this.opts = opts;
    this.grid = new Grid(w, h);
    this.rooms = [];
    this.doors = [];
    this.props = [];
    this.lights = [];
    this.zombies = [];
    this.npcs = [];
    this.items = [];
    this.interacts = [];
    this.triggers = [];
    this.checkpoints = {};
    this.decals = [];
    this.signs = [];
    this.glassPanes = [];
    this.stairs = [];
    this.sounds = [];
    this.cameras = [];
    this.defaults = {
      floor: opts.floor || 'h_floor', wall: opts.wall || 'h_wall', ceil: opts.ceil || 'h_ceil',
      height: opts.height ?? 3, ambient: opts.ambient ?? 0.0,
    };
  }

  // Raum: begehbares Rechteck
  room(name, x, y, w, h, o = {}) {
    const r = {
      id: this.rooms.length, name, x, y, w, h,
      floor: o.floor || this.defaults.floor, wall: o.wall || this.defaults.wall, ceil: o.ceil ?? this.defaults.ceil,
      height: o.height ?? this.defaults.height, floorY: o.floorY ?? 0,
      outdoor: !!o.outdoor, ambient: o.ambient ?? this.defaults.ambient, tint: o.tint || null,
      rail: !!o.rail, label: o.label || null, reverb: o.reverb || null, noCeil: !!o.noCeil,
    };
    this.rooms.push(r);
    this.carve(x, y, w, h, r);
    return r;
  }
  carve(x, y, w, h, r) {
    const g = this.grid;
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
      if (!g.inb(i, j)) continue;
      const k = g.idx(i, j);
      g.f[k] = F.FLOOR;
      g.room[k] = r.id;
      g.floorY[k] = r.floorY;
      g.ceilY[k] = r.floorY + r.height;
    }
  }
  // Bereich wieder zu Wand machen (Säulen, Nischen)
  solid(x, y, w = 1, h = 1) {
    const g = this.grid;
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
      if (!g.inb(i, j)) continue;
      g.f[g.idx(i, j)] = F.SOLID; g.room[g.idx(i, j)] = -1;
    }
  }
  // Höhen eines Bereichs anpassen (z. B. Gleisbett, Bahnsteig)
  heights(x, y, w, h, floorY, ceilY) {
    const g = this.grid;
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
      const k = g.idx(i, j);
      if (floorY != null) g.floorY[k] = floorY;
      if (ceilY != null) g.ceilY[k] = ceilY;
    }
  }
  // Rampe / Treppe: Höhe steigt in Richtung dir ('+x','-x','+z','-z') um rise je Zelle
  ramp(x, y, w, h, dir, y0, totalRise, o = {}) {
    const g = this.grid;
    const along = dir === '+x' || dir === '-x' ? w : h;
    const per = totalRise / along;
    const sdir = { '+x': 1, '-x': 2, '+z': 3, '-z': 4 }[dir];
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
      const k = g.idx(i, j);
      let t;
      if (dir === '+x') t = i - x; else if (dir === '-x') t = x + w - 1 - i; else if (dir === '+z') t = j - y; else t = y + h - 1 - j;
      g.floorY[k] = y0 + per * t;
      g.slope[k] = sdir; g.rise[k] = per;
      if (o.ceil != null) g.ceilY[k] = Math.max(g.ceilY[k], y0 + per * (t + 1) + o.ceil);
    }
    this.stairs.push({ x, y, w, h, dir, y0, totalRise, stairs: !!o.stairs, mat: o.mat || 'concrete' });
  }
  // Niedriger Schacht (nur geduckt passierbar)
  vent(x, y, w, h, o = {}) {
    const g = this.grid;
    const r = this.room(o.name || 'vent', x, y, w, h, { floor: 'metal_dark', wall: 'metal_dark', ceil: 'metal_dark', height: o.height ?? 1.05, floorY: o.floorY ?? 0, ambient: 0 });
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) g.set(i, j, F.VENT | F.NOZOMBIE);
    return r;
  }
  // Glaswand (blockiert Bewegung, nicht Sicht)
  glass(x, y, w, h, o = {}) {
    const g = this.grid;
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
      const k = g.idx(i, j);
      const nbRoom = [g.room[g.idx(i - 1, j)], g.room[g.idx(i + 1, j)], g.room[g.idx(i, j - 1)], g.room[g.idx(i, j + 1)]].find((v) => v >= 0);
      g.f[k] = F.FLOOR | F.GLASS;
      if (nbRoom != null && nbRoom >= 0) { g.room[k] = nbRoom; g.floorY[k] = this.rooms[nbRoom].floorY; g.ceilY[k] = this.rooms[nbRoom].floorY + this.rooms[nbRoom].height; }
      this.glassPanes.push({ x: i, y: j, id: o.id || null, breakable: !!o.breakable, frost: !!o.frost });
    }
  }
  // Tür in einer Wandzelle
  door(x, y, o = {}) {
    const g = this.grid;
    const k = g.idx(x, y);
    // Achse bestimmen: Wand links/rechts => Tür liegt entlang X (Durchgang in Z)
    const axis = o.axis || ((g.isFloor(x, y - 1) || g.isFloor(x, y + 1)) ? 'x' : 'z');
    const nb = axis === 'x' ? [g.idx(x, y - 1), g.idx(x, y + 1)] : [g.idx(x - 1, y), g.idx(x + 1, y)];
    const rid = g.room[nb[0]] >= 0 ? g.room[nb[0]] : g.room[nb[1]];
    const r = this.rooms[rid] || { floorY: 0, height: 3 };
    g.f[k] = F.FLOOR | F.DOOR;
    g.room[k] = rid;
    g.floorY[k] = r.floorY;
    const dh = o.height ?? (o.kind === 'shutter' ? 2.8 : o.kind === 'security' ? 2.4 : 2.15);
    g.ceilY[k] = r.floorY + Math.min(r.height, dh);
    const d = {
      id: o.id || `door_${x}_${y}`, x, y, axis,
      kind: o.kind || 'normal', locked: !!o.locked, key: o.key || null, open: !!o.open,
      mat: o.mat || null, strength: o.strength ?? 3.2, lockedText: o.lockedText || null,
      autoClose: o.autoClose ?? 0, double: o.double || null, broken: false, prompt: o.prompt || null,
      noZombie: !!o.noZombie, sign: o.sign || null, height: dh,
    };
    this.doors.push(d);
    return d;
  }
  // Doppeltür über zwei Zellen
  door2(x, y, o = {}) {
    const g = this.grid;
    const ax = o.axis || ((g.isFloor(x, y - 1) || g.isFloor(x, y + 1)) ? 'x' : 'z');
    const id = o.id || `door2_${x}_${y}`;
    const a = this.door(x, y, { ...o, axis: ax, id: id + '_a', double: id });
    const b = ax === 'x' ? this.door(x + 1, y, { ...o, axis: ax, id: id + '_b', double: id }) : this.door(x, y + 1, { ...o, axis: ax, id: id + '_b', double: id });
    a.side = 0; b.side = 1;
    return [a, b];
  }

  prop(type, x, z, o = {}) { const p = { type, x, z, rot: o.rot ?? 0, o }; this.props.push(p); return p; }
  light(x, z, o = {}) { const l = { x, z, ...o }; this.lights.push(l); return l; }
  zombie(x, z, o = {}) { const zz = { x, z, ...o, id: o.id || `z${this.zombies.length}` }; this.zombies.push(zz); return zz; }
  npc(id, x, z, o = {}) { const n = { id, x, z, ...o }; this.npcs.push(n); return n; }
  item(type, x, z, o = {}) { const it = { type, x, z, ...o, id: o.id || `${type}_${this.items.length}` }; this.items.push(it); return it; }
  interact(id, x, z, o = {}) { const it = { id, x, z, ...o }; this.interacts.push(it); return it; }
  trigger(id, x, y, w, h, o = {}) { const t = { id, x, y, w, h, ...o }; this.triggers.push(t); return t; }
  checkpoint(id, x, z, yaw = 0) { this.checkpoints[id] = { id, x, z, yaw }; }
  decal(kind, x, z, o = {}) { this.decals.push({ kind, x, z, ...o }); }
  sign(text, x, z, o = {}) { this.signs.push({ text, x, z, ...o }); }
  sound(kind, x, z, o = {}) { this.sounds.push({ kind, x, z, ...o }); }
  camera(id, x, z, o = {}) { this.cameras.push({ id, x, z, ...o }); }

  // Hilfen für wiederkehrende Muster
  lightsAlong(x0, z0, x1, z1, step, o = {}) {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const n = Math.max(1, Math.floor(len / step));
    for (let i = 0; i <= n; i++) {
      const t = n === 0 ? 0 : i / n;
      const lo = typeof o === 'function' ? o(i) : o;
      if (lo === null) continue;
      this.light(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t, lo);
    }
  }
  roomOf(x, z) {
    const g = this.grid;
    const r = g.room[g.idx(Math.floor(x), Math.floor(z))];
    return r >= 0 ? this.rooms[r] : null;
  }
}
