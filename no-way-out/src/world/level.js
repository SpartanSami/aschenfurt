// Level-Laufzeit: erzeugt aus einer LevelDef die 3D-Welt, Kollision, Türen, Verstecke,
// Gegenstände, Interaktionen, Auslöser und die Licht-/Ambient-Texturen für den Shader.
import * as THREE from 'three';
import { F } from './grid.js';
import { Batcher } from './batcher.js';
import { PROPS, PropCtx } from './props.js';
import './props2.js';
import { getMat, colorMat, emissiveMat, decalMat, signMat, UV_SCALE, V_FULL, GRID_UNIFORMS } from '../render/materials.js';
import { LightSystem } from '../render/lighting.js';
import { Door } from './door.js';
import { makeItemMesh, ITEM_INFO } from './items.js';

const LIGHT_KINDS = {
  panel: { color: 0xeef3ff, intensity: 9, range: 7.5, mesh: 'panel' },
  panel_warm: { color: 0xfff0d8, intensity: 8, range: 7, mesh: 'panel' },
  lab: { color: 0xf0f8ff, intensity: 11, range: 8, mesh: 'panel' },
  tube: { color: 0xe6f0ff, intensity: 8, range: 8, mesh: 'tube' },
  sodium: { color: 0xffb35a, intensity: 9, range: 9, mesh: 'tube' },
  bulb: { color: 0xffd9a0, intensity: 5, range: 6, mesh: 'bulb' },
  emergency: { color: 0xff2a1a, intensity: 5, range: 7, mesh: 'emergency', mode: 'pulse' },
  red: { color: 0xff3020, intensity: 4, range: 6, mesh: 'bulb' },
  street: { color: 0xffc070, intensity: 18, range: 13, mesh: 'none' },
  moon: { color: 0x7f9cff, intensity: 3, range: 14, mesh: 'none' },
  fire: { color: 0xff7a2a, intensity: 14, range: 10, mesh: 'none', mode: 'fire' },
  blue: { color: 0x2a5aff, intensity: 10, range: 9, mesh: 'none', mode: 'rotate' },
  none: { color: 0xffffff, intensity: 3, range: 4, mesh: 'none' },
  screen: { color: 0x9fd0ff, intensity: 1.4, range: 3, mesh: 'none' },
  green: { color: 0x3cff8a, intensity: 1.2, range: 3, mesh: 'none' },
};

const SELF_Y = new Set(['oplamp', 'poster', 'exit_sign', 'label', 'tv', 'station_sign', 'cable_tray', 'pipe']);

export class Level {
  constructor(game, chapter, def) {
    this.game = game;
    this.chapter = chapter;
    this.def = def;
    this.grid = def.grid;
    this.root = new THREE.Group(); this.root.name = 'level';
    this.colliders = [];
    this.colHash = new Map();
    this.doors = []; this.doorById = new Map();
    this.hides = [];
    this.items = [];
    this.interacts = [];
    this.triggers = [];
    this.dynamic = [];     // animierte Objekte
    this.emitters = [];    // Ambient-Geräuschquellen
    this.glass = [];
    this.cams = def.cameras || [];
    this.time = 0;
    this.gridDirty = true; this.ambDirty = true; this.ambTimer = 0;
  }

  build(scene, quality) {
    const def = this.def, g = this.grid;
    this.lights = new LightSystem(scene, g, quality.lights);
    const batch = new Batcher();
    this._buildStatic(batch);
    for (const s of def.stairs) if (s.stairs) this._buildStairs(batch, s);
    for (const p of def.props) this._placeProp(batch, p);
    for (const d of def.doors) { const door = new Door(this, d); this.doors.push(door); this.doorById.set(d.id, door); door.buildFrame(batch); }
    for (const dd of this.doors) if (dd.def.double) dd.partner = this.doors.find((o) => o !== dd && o.def.double === dd.def.double) || null;
    for (const gp of def.glassPanes) this._buildGlass(gp);
    // Wasserflächen
    for (const w of def.waters || []) {
      const mat = colorMat(w.color, 0.14, 0.35, { transparent: true, opacity: 0.9 }).clone();
      mat.depthWrite = false; mat.name = 'water';
      // schwacher Eigenschimmer, damit die Oberfläche auch im Dunkeln als Wasser lesbar bleibt
      mat.emissive = new THREE.Color(w.color); mat.emissiveIntensity = 0.45;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w.w, w.h), mat);
      m.rotation.x = -Math.PI / 2; m.position.set(w.x + w.w / 2, w.level, w.y + w.h / 2); m.renderOrder = 2;
      this.root.add(m);
    }
    for (const l of def.lights) this._addLight(l);
    for (const d of def.decals) this._addDecal(d);
    for (const s of def.signs) this._addSign(batch, s);
    for (const it of def.items) this._addItem(it);
    for (const ia of def.interacts) this._addInteract(ia);
    for (const t of def.triggers) this.triggers.push({ ...t, inside: false });
    for (const s of def.sounds) this.emitters.push({ ...s, y: s.y ?? 1.5 });
    batch.build(this.root);
    scene.add(this.root);
    // Raster- und Ambient-Texturen
    const W = g.w, H = g.h;
    this.gridData = new Uint8Array(W * H * 4);
    this.gridTex = new THREE.DataTexture(this.gridData, W, H, THREE.RGBAFormat);
    this.gridTex.magFilter = THREE.NearestFilter; this.gridTex.minFilter = THREE.NearestFilter;
    this.ambData = new Uint8Array(W * H * 4);
    this.ambTex = new THREE.DataTexture(this.ambData, W, H, THREE.RGBAFormat);
    this.ambTex.magFilter = THREE.LinearFilter; this.ambTex.minFilter = THREE.LinearFilter;
    GRID_UNIFORMS.uGridTex.value = this.gridTex;
    GRID_UNIFORMS.uAmbTex.value = this.ambTex;
    GRID_UNIFORMS.uGridSize.value.set(W, H);
    GRID_UNIFORMS.uGridOn.value = quality.gridShadow ? 1 : 0;
    this.updateGridTex();
    this.updateAmbient();
  }

  // ---------------- Statische Geometrie ----------------
  _buildStatic(batch) {
    const g = this.grid, rooms = this.def.rooms;
    const W = g.w, H = g.h;
    const solidAt = (x, y) => !g.inb(x, y) || (g.f[g.idx(x, y)] & F.SOLID) !== 0;
    const aoCorner = (cx, cz) => {
      let n = 0;
      if (solidAt(cx - 1, cz - 1)) n++; if (solidAt(cx, cz - 1)) n++; if (solidAt(cx - 1, cz)) n++; if (solidAt(cx, cz)) n++;
      return [1, 0.8, 0.64, 0.56, 0.5][n];
    };
    const uvs = (mat) => UV_SCALE[mat] || [2, 2];
    const cellH = (i, j, fx, fz) => {
      const k = g.idx(i, j), s = g.slope[k], b = g.floorY[k], r = g.rise[k];
      if (!s) return b;
      if (s === 1) return b + r * fx; if (s === 2) return b + r * (1 - fx); if (s === 3) return b + r * fz; return b + r * (1 - fz);
    };
    const stairCells = new Set();
    for (const s of this.def.stairs) if (s.stairs) for (let j = s.y; j < s.y + s.h; j++) for (let i = s.x; i < s.x + s.w; i++) stairCells.add(g.idx(i, j));
    const wallFace = (mat, x0, z0, x1, z1, yb0, yb1, yt0, yt1, n, baseY) => {
      // Wand in drei Bändern (AO unten/oben)
      const vfull = V_FULL[mat];
      const [su, sv] = uvs(mat);
      const u0 = (n[0] !== 0 ? z0 : x0) / su * (n[0] > 0 || n[2] < 0 ? -1 : 1);
      const u1 = (n[0] !== 0 ? z1 : x1) / su * (n[0] > 0 || n[2] < 0 ? -1 : 1);
      const vOf = (y) => vfull ? (y - baseY) / vfull : y / sv;
      const hgt = Math.max(yt0 - yb0, yt1 - yb1);
      const bands = hgt > 1.4 ? [0, 0.55 / hgt, 1 - 0.35 / hgt, 1] : [0, 1];
      const aoB = hgt > 1.4 ? [0.6, 0.97, 0.95, 0.76] : [0.7, 0.85];
      for (let b = 0; b < bands.length - 1; b++) {
        const ta = bands[b], tb = bands[b + 1];
        const ya0 = yb0 + (yt0 - yb0) * ta, ya1 = yb1 + (yt1 - yb1) * ta;
        const yc0 = yb0 + (yt0 - yb0) * tb, yc1 = yb1 + (yt1 - yb1) * tb;
        batch.quad(mat,
          [[x0, ya0, z0], [x1, ya1, z1], [x1, yc1, z1], [x0, yc0, z0]], n,
          [[u0, vOf(ya0)], [u1, vOf(ya1)], [u1, vOf(yc1)], [u0, vOf(yc0)]],
          [aoB[b], aoB[b], aoB[b + 1], aoB[b + 1]]);
      }
    };
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const k = g.idx(i, j);
      const v = g.f[k];
      if (!(v & F.FLOOR) || (v & F.SOLID)) continue;
      const room = rooms[g.room[k]] || rooms[0];
      const fy = g.floorY[k], cy = room.outdoor && room.wallH != null ? fy + room.wallH : g.ceilY[k];
      // Boden
      if (!stairCells.has(k)) {
        const [su, sv] = uvs(room.floor);
        const h00 = cellH(i, j, 0, 0), h01 = cellH(i, j, 0, 1), h11 = cellH(i, j, 1, 1), h10 = cellH(i, j, 1, 0);
        batch.quad(room.floor, [[i, h00, j], [i, h01, j + 1], [i + 1, h11, j + 1], [i + 1, h10, j]], [0, 1, 0],
          [[i / su, -j / sv], [i / su, -(j + 1) / sv], [(i + 1) / su, -(j + 1) / sv], [(i + 1) / su, -j / sv]],
          [aoCorner(i, j), aoCorner(i, j + 1), aoCorner(i + 1, j + 1), aoCorner(i + 1, j)]);
      }
      // Decke
      if (!room.outdoor && !room.noCeil && room.ceil) {
        const [su, sv] = uvs(room.ceil);
        batch.quad(room.ceil, [[i, cy, j], [i + 1, cy, j], [i + 1, cy, j + 1], [i, cy, j + 1]], [0, -1, 0],
          [[i / su, j / sv], [(i + 1) / su, j / sv], [(i + 1) / su, (j + 1) / sv], [i / su, (j + 1) / sv]],
          [aoCorner(i, j) * 0.9, aoCorner(i + 1, j) * 0.9, aoCorner(i + 1, j + 1) * 0.9, aoCorner(i, j + 1) * 0.9]);
      }
      // Wände / Stufen / Stürze zu den 4 Nachbarn
      const dirs = [
        [1, 0, [i + 1, j, i + 1, j + 1], [-1, 0, 0]],
        [-1, 0, [i, j + 1, i, j], [1, 0, 0]],
        [0, 1, [i + 1, j + 1, i, j + 1], [0, 0, -1]],
        [0, -1, [i, j, i + 1, j], [0, 0, 1]],
      ];
      for (const [dx, dy, e, n] of dirs) {
        const ni = i + dx, nj = j + dy;
        const [x0, z0, x1, z1] = e;
        // Höhe an den beiden Kantenpunkten dieser Zelle
        const fa = (fx, fz) => cellH(i, j, fx, fz);
        const ex0 = x0 - i, ez0 = z0 - j, ex1 = x1 - i, ez1 = z1 - j;
        const yb0 = fa(ex0, ez0), yb1 = fa(ex1, ez1);
        if (solidAt(ni, nj)) {
          wallFace(room.wall, x0, z0, x1, z1, yb0, yb1, cy, cy, n, fy);
          continue;
        }
        const nk = g.idx(ni, nj);
        const nroom = rooms[g.room[nk]] || room;
        // Stufe: Nachbar höher
        const nh0 = cellH(ni, nj, x0 - ni, z0 - nj), nh1 = cellH(ni, nj, x1 - ni, z1 - nj);
        if (nh0 > yb0 + 0.02 || nh1 > yb1 + 0.02) {
          wallFace(nroom.edge || 'concrete_dark', x0, z0, x1, z1, yb0, yb1, Math.max(nh0, yb0), Math.max(nh1, yb1), n, yb0);
        }
        // Sturz: Nachbar hat niedrigere Decke
        const ncy = g.ceilY[nk];
        if (!room.outdoor && ncy < cy - 0.02 && !(nroom.outdoor)) {
          wallFace(room.wall, x0, z0, x1, z1, ncy, ncy, cy, cy, n, fy);
        } else if (room.outdoor && !nroom.outdoor && ncy < cy - 0.02) {
          // Gebäudeöffnung von außen: Fassade über dem Eingang
          wallFace(room.wall, x0, z0, x1, z1, ncy, ncy, cy, cy, n, fy);
        }
      }
      // Handlauf im Flur
      if (room.rail) {
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          if (!solidAt(i + dx, j + dy)) continue;
          const geo = new THREE.BoxGeometry(dx ? 0.06 : 1.0, 0.12, dx ? 1.0 : 0.06);
          geo.translate(i + 0.5 + dx * 0.47, fy + 0.92, j + 0.5 + dy * 0.47);
          batch.geo('wood_light', geo, i, j);
        }
      }
    }
  }

  _buildStairs(batch, s) {
    const n = s.dir === '+x' || s.dir === '-x' ? s.w : s.h;
    const steps = Math.max(2, Math.round(s.totalRise / 0.18));
    const len = n;
    for (let k = 0; k < steps; k++) {
      const t0 = k / steps, t1 = (k + 1) / steps;
      const h = s.y0 + s.totalRise * (k + 1) / steps;
      let geo;
      const depth = (t1 - t0) * len;
      const bottom = Math.min(s.y0, 0) - 0.05;
      if (s.dir === '+x' || s.dir === '-x') {
        geo = new THREE.BoxGeometry(depth, h - bottom, s.h);
        const xc = s.dir === '+x' ? s.x + (t0 + t1) / 2 * len : s.x + s.w - (t0 + t1) / 2 * len;
        geo.translate(xc, (h + bottom) / 2, s.y + s.h / 2);
      } else {
        geo = new THREE.BoxGeometry(s.w, h - bottom, depth);
        const zc = s.dir === '+z' ? s.y + (t0 + t1) / 2 * len : s.y + s.h - (t0 + t1) / 2 * len;
        geo.translate(s.x + s.w / 2, (h + bottom) / 2, zc);
      }
      batch.geo(s.mat, geo, s.x, s.y);
    }
  }

  _buildGlass(gp) {
    const g = this.grid;
    const alongX = g.has(gp.x - 1, gp.y, F.GLASS | F.SOLID) || g.has(gp.x + 1, gp.y, F.GLASS | F.SOLID);
    const fy = g.floorY[g.idx(gp.x, gp.y)], cy = g.ceilY[g.idx(gp.x, gp.y)];
    const h = cy - fy;
    const grp = new THREE.Group();
    const pane = new THREE.Mesh(new THREE.BoxGeometry(alongX ? 1 : 0.03, h - 0.1, alongX ? 0.03 : 1), getMat(gp.frost ? 'glass_frost' : 'glass'));
    pane.position.set(gp.x + 0.5, fy + h / 2, gp.y + 0.5);
    pane.renderOrder = 2;
    grp.add(pane);
    const frameMat = getMat('steel');
    for (const yy of [fy + 0.04, cy - 0.03]) {
      const f = new THREE.Mesh(new THREE.BoxGeometry(alongX ? 1 : 0.08, 0.08, alongX ? 0.08 : 1), frameMat);
      f.position.set(gp.x + 0.5, yy, gp.y + 0.5); grp.add(f);
    }
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, h, 0.06), frameMat);
    post.position.set(gp.x + (alongX ? 0 : 0.5), fy + h / 2, gp.y + (alongX ? 0.5 : 0)); grp.add(post);
    this.root.add(grp);
    this.glass.push({ ...gp, grp, pane, broken: false });
  }

  // Wassertiefe an einer Position (0 = trocken)
  waterDepth(x, z, y) {
    for (const w of this.def.waters || []) if (x >= w.x && x < w.x + w.w && z >= w.y && z < w.y + w.h && y < w.level) return w.level - y;
    return 0;
  }

  breakGlass(id) {
    const g = this.grid;
    for (const gl of this.glass) {
      if (gl.id !== id || gl.broken) continue;
      gl.broken = true;
      gl.pane.visible = false;
      g.clear(gl.x, gl.y, F.GLASS);
      this.game.fx?.glassBurst(gl.x + 0.5, 1.2, gl.y + 0.5);
    }
  }

  // ---------------- Requisiten ----------------
  _placeProp(batch, p) {
    const builder = PROPS[p.type];
    if (!builder) { console.warn('Unbekanntes Requisit', p.type); return; }
    const c = new PropCtx(p.o);
    builder(c, { ...p.o, x: p.x, z: p.z });
    // Requisiten, die ihre Höhe selbst setzen (Lampen, Schilder, Rohre …), stehen immer auf dem örtlichen Boden;
    // ihr o.y gilt relativ dazu. Bei allen anderen ist o.y eine absolute Höhe (z. B. Leiche auf einem Tisch).
    const fy = SELF_Y.has(p.type) ? this.grid.heightAt(p.x, p.z) : (p.o.y ?? this.grid.heightAt(p.x, p.z));
    const m = new THREE.Matrix4().compose(new THREE.Vector3(p.x, fy, p.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, p.rot, 0)), new THREE.Vector3(1, 1, 1));
    for (const part of c.parts) {
      part.geo.applyMatrix4(m);
      batch.geo(part.mat, part.geo, p.x, p.z);
    }
    let grp = null;
    if (c.dyn.length) {
      grp = new THREE.Group();
      grp.position.set(p.x, fy, p.z); grp.rotation.y = p.rot;
      for (const d of c.dyn) { grp.add(d); this.dynamic.push(d); }
      this.root.add(grp);
    }
    const cos = Math.cos(p.rot), sin = Math.sin(p.rot);
    const toWorld = (lx, lz) => ({ x: p.x + lx * cos + lz * sin, z: p.z - lx * sin + lz * cos });
    for (const cl of c.colliders) {
      const cx = (cl.x0 + cl.x1) / 2, cz = (cl.z0 + cl.z1) / 2;
      const w = toWorld(cx, cz);
      const col = { cx: w.x, cz: w.z, hx: (cl.x1 - cl.x0) / 2, hz: (cl.z1 - cl.z0) / 2, ang: p.rot, cos, sin, y0: fy + cl.y0, y1: fy + cl.y1, vault: !!cl.vault, id: p.o.id || null, enabled: true, alarm: !!cl.alarm };
      this.addCollider(col);
      if (!cl.noFlag) {
        const fl = F.PROP | (cl.tall || cl.y1 > 1.75 ? F.TALL : 0) | ((cl.cover !== false && cl.y1 >= 0.85) || cl.cover ? F.COVER : 0) | (cl.vault ? F.VAULT : 0);
        this._flagOBB(col, fl, cl.vault ? 0.3 : 0.12);
      }
    }
    for (const fl of c.flags) {
      const cx = (fl.x0 + fl.x1) / 2, cz = (fl.z0 + fl.z1) / 2; const w = toWorld(cx, cz);
      this._flagOBB({ cx: w.x, cz: w.z, hx: (fl.x1 - fl.x0) / 2 + 0.3, hz: (fl.z1 - fl.z0) / 2 + 0.3, cos, sin }, fl.tall ? F.TALL : F.COVER, 0);
    }
    for (const h of c.hides) {
      const e = toWorld(h.ex, h.ez), x = toWorld(h.exitX, h.exitZ);
      this.hides.push({
        id: p.o.id || `hide_${this.hides.length}`, type: h.type, x: p.x, z: p.z,
        enter: { x: e.x, y: fy + h.ey, z: e.z }, floorY: fy, exit: { x: x.x, z: x.z }, yaw: p.rot + (h.yaw || 0),
        door: h.door || null, prompt: h.prompt, safe: p.o.safe ?? (h.type === 'locker' ? 0.85 : 0.7), occupied: false,
      });
      if (h.door) h.door.userData.hideIndex = this.hides.length - 1;
    }
    for (const l of c.lights) {
      const w = toWorld(l.x, l.z);
      this._addLight({ ...l, x: w.x, z: w.z, y: fy + (l.y ?? 2.9), kind: l.kind || 'none', mesh: l.noMesh ? 'none' : l.mesh, group: p.o.group || l.group, id: p.o.lightId || l.id });
    }
    for (const s of c.sounds) { const w = toWorld(s.x, s.z); this.emitters.push({ kind: s.kind, x: w.x, z: w.z, y: fy + 1.2 }); }
    for (const ia of c.interacts) { const w = toWorld(ia.x, ia.z); this._addInteract({ ...ia, x: w.x, z: w.z, y: fy + (ia.y ?? 1) }); }
    if (grp) grp.userData.prop = p;
    return grp;
  }

  _flagOBB(col, flags, shrink) {
    const g = this.grid;
    const r = Math.max(col.hx, col.hz) * 1.5 + 1;
    for (let j = Math.floor(col.cz - r); j <= Math.ceil(col.cz + r); j++) for (let i = Math.floor(col.cx - r); i <= Math.ceil(col.cx + r); i++) {
      if (!g.inb(i, j)) continue;
      const dx = i + 0.5 - col.cx, dz = j + 0.5 - col.cz;
      const lx = dx * col.cos - dz * col.sin, lz = dx * col.sin + dz * col.cos;
      if (Math.abs(lx) <= col.hx + shrink && Math.abs(lz) <= col.hz + shrink) {
        if (g.isFloor(i, j)) g.set(i, j, flags);
      }
    }
  }

  // ---------------- Kollider ----------------
  addCollider(c) {
    this.colliders.push(c);
    const r = Math.hypot(c.hx, c.hz);
    c.cells = [];
    for (let j = Math.floor(c.cz - r); j <= Math.floor(c.cz + r); j++) for (let i = Math.floor(c.cx - r); i <= Math.floor(c.cx + r); i++) {
      const k = j * this.grid.w + i;
      if (!this.colHash.has(k)) this.colHash.set(k, []);
      this.colHash.get(k).push(c);
      c.cells.push(k);
    }
    return c;
  }
  removeCollider(c) {
    for (const k of c.cells || []) { const a = this.colHash.get(k); if (a) { const i = a.indexOf(c); if (i >= 0) a.splice(i, 1); } }
    const i = this.colliders.indexOf(c); if (i >= 0) this.colliders.splice(i, 1);
  }
  collidersNear(x, z, r) {
    const out = new Set();
    for (let j = Math.floor(z - r); j <= Math.floor(z + r); j++) for (let i = Math.floor(x - r); i <= Math.floor(x + r); i++) {
      const a = this.colHash.get(j * this.grid.w + i);
      if (a) for (const c of a) if (c.enabled) out.add(c);
    }
    return out;
  }

  // ---------------- Lichter ----------------
  _addLight(l) {
    const kind = LIGHT_KINDS[l.kind || 'panel'] || LIGHT_KINDS.panel;
    const g = this.grid;
    const cell = g.idx(Math.floor(l.x), Math.floor(l.z));
    const y = l.y ?? (g.inb(Math.floor(l.x), Math.floor(l.z)) ? g.ceilY[cell] - 0.04 : 2.9);
    const mats = [];
    const meshType = l.mesh || kind.mesh;
    const color = l.color ?? kind.color;
    if (meshType !== 'none') {
      const em = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: new THREE.Color(color), emissiveIntensity: 2.2, roughness: 0.6 });
      mats.push(em);
      let mesh;
      const housing = getMat('plastic_white');
      if (meshType === 'panel') {
        const grp = new THREE.Group();
        const fr = new THREE.Mesh(new THREE.BoxGeometry(l.rot ? 0.34 : 1.24, 0.05, l.rot ? 1.24 : 0.34), housing);
        const pn = new THREE.Mesh(new THREE.BoxGeometry(l.rot ? 0.28 : 1.18, 0.02, l.rot ? 1.18 : 0.28), em);
        pn.position.y = -0.03; grp.add(fr); grp.add(pn); mesh = grp;
      } else if (meshType === 'tube') {
        const grp = new THREE.Group();
        const fr = new THREE.Mesh(new THREE.BoxGeometry(l.rot ? 0.12 : 1.3, 0.06, l.rot ? 1.3 : 0.12), getMat('metal_dark'));
        const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 8), em);
        tb.rotation.z = l.rot ? 0 : Math.PI / 2; if (l.rot) tb.rotation.x = Math.PI / 2;
        tb.position.y = -0.06; grp.add(fr); grp.add(tb); mesh = grp;
      } else if (meshType === 'bulb') {
        const grp = new THREE.Group();
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), em); b.position.y = -0.12;
        const cage = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.18, 8, 1, true), new THREE.MeshStandardMaterial({ color: 0x333333, wireframe: true }));
        cage.position.y = -0.12; grp.add(b); grp.add(cage); mesh = grp;
      } else if (meshType === 'emergency') {
        const grp = new THREE.Group();
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.14, 12), em); b.position.y = -0.08;
        grp.add(b); mesh = grp;
      }
      if (mesh) {
        mesh.position.set(l.x, y, l.z);
        mesh.traverse((o) => { if (o.isMesh) { o.castShadow = false; } });
        this.root.add(mesh);
      }
      if (l.cone) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(1.2, y - 0.2, 16, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.035, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
        cone.position.set(l.x, (y - 0.2) / 2 + 0.1, l.z);
        cone.userData.baseOpacity = 0.035;
        this.root.add(cone);
        l._cone = cone;
      }
    }
    const fx = this.lights.add({
      x: l.x, y, z: l.z, color, intensity: (l.intensity ?? kind.intensity) * (l.mul ?? 1), range: l.range ?? kind.range,
      mode: l.mode || kind.mode || 'steady', group: l.group || 'main', on: l.on !== false, mats,
      emissiveBase: l.emissive ?? 2.2, id: l.id || null, cone: l._cone || null, speed: l.speed, motionRadius: l.motionRadius,
      buzz: l.buzz,
    });
    return fx;
  }

  // ---------------- Decals / Schilder ----------------
  _addDecal(d) {
    const mat = decalMat(d.kind);
    const s = d.size || (d.kind === 'paper' ? 0.3 : 1.2);
    const geo = new THREE.PlaneGeometry(s * (d.sx || 1), s * (d.sy || (d.kind === 'paper' ? 1.4 : 1)));
    const m = new THREE.Mesh(geo, mat);
    if (d.wall) {
      // an Wand: d.wall = 'n'|'s'|'e'|'w' (Wand liegt in dieser Richtung)
      const fy = this.grid.heightAt(d.x, d.z);
      const map = { n: [0, -1, 0], s: [0, 1, Math.PI], e: [1, 0, -Math.PI / 2], w: [-1, 0, Math.PI / 2] }[d.wall];
      const x = Math.floor(d.x) + 0.5 + map[0] * 0.495, z = Math.floor(d.z) + 0.5 + map[1] * 0.495;
      m.position.set(d.wall === 'e' || d.wall === 'w' ? x : d.x, fy + (d.y ?? 1.2), d.wall === 'n' || d.wall === 's' ? z : d.z);
      m.rotation.y = map[2];
    } else {
      m.rotation.x = -Math.PI / 2; m.rotation.z = d.rot ?? (d.x * 3.1 + d.z * 1.7);
      m.position.set(d.x, this.grid.heightAt(d.x, d.z) + 0.006, d.z);
    }
    m.receiveShadow = true;
    m.renderOrder = 1;
    this.root.add(m);
  }
  _addSign(batch, s) {
    const w = s.w || 1.2, h = s.h || 0.3;
    const mat = signMat(s.text, { bg: s.bg || '#e9ecef', fg: s.fg || '#16324f', glow: !!s.glow, intensity: s.intensity, w: 512, h: Math.max(32, Math.round(512 * h / w)), fontPx: s.font || Math.round(512 * h / w * 0.55) });
    const geo = new THREE.BoxGeometry(w, h, 0.02);
    const m = new THREE.Mesh(geo, mat);
    const rot = { n: 0, s: Math.PI, e: -Math.PI / 2, w: Math.PI / 2 }[s.face || 'n'] ?? (s.rot || 0);
    m.position.set(s.x, s.y ?? 2.3, s.z); m.rotation.y = rot;
    this.root.add(m);
  }

  // ---------------- Gegenstände ----------------
  _addItem(it) {
    const diff = this.game.difficulty;
    if (it.extra && !diff.healBonus) return;      // nur auf Leicht
    if (it.notHard && diff.healRemove) return;   // nicht auf Schwer
    const pid = this.chapter.id + ':' + it.id;
    if (this.game.state.picked.has(pid)) return;
    const mesh = makeItemMesh(it.type);
    const fy = it.y ?? this.grid.heightAt(it.x, it.z) + (it.h ?? 0.78);
    mesh.position.set(it.x, fy, it.z);
    mesh.rotation.y = it.rot ?? (it.x * 2.3);
    this.root.add(mesh);
    const info = ITEM_INFO[it.type] || { name: it.type };
    const obj = { ...it, pid, mesh, kind: 'item', pos: new THREE.Vector3(it.x, fy, it.z), radius: 0.6, info, alive: true };
    this.items.push(obj);
    this.interacts.push({
      id: it.id, kind: 'item', pos: obj.pos, radius: 1.0, item: obj,
      prompt: () => (info.verb || 'Aufheben') + ': ' + (it.name || info.name),
      enabled: () => obj.alive,
      interact: (game) => game.pickUp(obj),
    });
  }
  removeItem(obj) {
    obj.alive = false;
    this.root.remove(obj.mesh);
  }

  _addInteract(ia) {
    const fy = ia.y ?? this.grid.heightAt(ia.x, ia.z) + 1.0;
    const obj = {
      id: ia.id, kind: ia.kind || 'script', pos: new THREE.Vector3(ia.x, fy, ia.z), radius: ia.radius ?? 1.1,
      prompt: () => (typeof ia.prompt === 'function' ? ia.prompt(this.game) : ia.prompt || 'Benutzen'),
      enabled: () => (ia.enabled ? ia.enabled(this.game) : !this.game.state.flags['used:' + ia.id] || ia.repeat),
      hold: ia.hold || 0,
      interact: (game) => game.story.onInteract(ia.id, obj),
      def: ia,
    };
    if (ia.mesh) {
      const mesh = makeItemMesh(ia.mesh);
      mesh.position.copy(obj.pos); mesh.rotation.y = ia.rot || 0;
      this.root.add(mesh); obj.mesh = mesh;
    }
    this.interacts.push(obj);
    return obj;
  }

  // ---------------- Raster-/Ambient-Texturen ----------------
  updateGridTex() {
    const g = this.grid, d = this.gridData;
    for (let i = 0; i < g.w * g.h; i++) {
      const b = g.blocksLight(i % g.w, (i / g.w) | 0) ? 255 : 0;
      d[i * 4] = b; d[i * 4 + 1] = 0; d[i * 4 + 2] = 0; d[i * 4 + 3] = 255;
    }
    this.gridTex.needsUpdate = true;
    this.gridDirty = false;
  }

  updateAmbient() {
    const g = this.grid, W = g.w, H = g.h;
    const acc = new Float32Array(W * H * 3);
    const rooms = this.def.rooms;
    for (let k = 0; k < W * H; k++) {
      const r = g.room[k];
      if (r < 0 || !(g.f[k] & F.FLOOR) || (g.f[k] & F.SOLID)) continue;
      const room = rooms[r];
      if (room.ambient) {
        const c = new THREE.Color(room.tint || 0x8090b0);
        acc[k * 3] += c.r * room.ambient; acc[k * 3 + 1] += c.g * room.ambient; acc[k * 3 + 2] += c.b * room.ambient;
      }
    }
    for (const f of this.lights.fixtures) {
      if (!f.on || !this.lights.powered(f) || f.mode === 'off') continue;
      let nominal = f.intensity * 0.012;
      if (f.mode === 'broken') nominal *= 0.12; else if (f.mode === 'flicker') nominal *= 0.8; else if (f.mode === 'rotate') nominal *= 0.35;
      else if (f.mode === 'motion') nominal *= f.motionTimer > 0 ? 1 : 0;
      if (nominal <= 0) continue;
      const R = Math.ceil(f.range * 1.15);
      const fx = Math.floor(f.x), fz = Math.floor(f.z);
      for (let j = fz - R; j <= fz + R; j++) for (let i = fx - R; i <= fx + R; i++) {
        if (i < 0 || j < 0 || i >= W || j >= H) continue;
        const k = j * W + i;
        if (!(g.f[k] & F.FLOOR) || (g.f[k] & F.SOLID)) continue;
        const dx = i + 0.5 - f.x, dz = j + 0.5 - f.z;
        const d2 = dx * dx + dz * dz;
        if (d2 > R * R) continue;
        if (!g.losLight(f.x, f.z, i + 0.5, j + 0.5)) continue;
        const a = nominal / (1 + d2 * 0.16);
        acc[k * 3] += f.color.r * a; acc[k * 3 + 1] += f.color.g * a; acc[k * 3 + 2] += f.color.b * a;
      }
    }
    // weichzeichnen (3x3), Wände zählen als dunkel
    const out = this.ambData;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      let r = 0, gg = 0, b = 0, n = 0;
      const k0 = j * W + i;
      const isFloor = (g.f[k0] & F.FLOOR) && !(g.f[k0] & F.SOLID);
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
        const x = i + ox, y = j + oy;
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        const k = y * W + x;
        const wgt = ox === 0 && oy === 0 ? 4 : 1;
        // nur benachbarte Zellen mit Sichtverbindung mitteln (kein Durchsickern durch Wände)
        if (!((g.f[k] & F.FLOOR) && !(g.f[k] & F.SOLID))) { n += wgt * 0.5; continue; }
        r += acc[k * 3] * wgt; gg += acc[k * 3 + 1] * wgt; b += acc[k * 3 + 2] * wgt; n += wgt;
      }
      let vr = 0, vg = 0, vb = 0;
      if (n > 0) { vr = r / n; vg = gg / n; vb = b / n; }
      if (!isFloor) {
        // Wandzellen: Mittelwert der Nachbarn, damit Wandoberflächen nicht schwarz abtasten
        vr *= 0.8; vg *= 0.8; vb *= 0.8;
      }
      const enc = (v) => Math.min(255, Math.sqrt(Math.max(0, v) / 1.2) * 255);
      out[k0 * 4] = enc(vr); out[k0 * 4 + 1] = enc(vg); out[k0 * 4 + 2] = enc(vb); out[k0 * 4 + 3] = 255;
    }
    this.ambTex.needsUpdate = true;
    this.ambDirty = false;
  }

  // ---------------- Laufzeit ----------------
  update(dt, camPos) {
    this.time += dt;
    for (const d of this.doors) d.update(dt);
    this.lights.update(dt, camPos);
    // Bewegungsmelder-Lichter verändern Ambient
    for (const f of this.lights.fixtures) {
      if (f.mode !== 'motion') continue;
      const on = f.motionTimer > 0;
      if (on !== f._lastMotion) { f._lastMotion = on; this.ambDirty = true; }
    }
    if (this.gridDirty) this.updateGridTex();
    this.ambTimer -= dt;
    if (this.ambDirty && this.ambTimer <= 0) { this.updateAmbient(); this.ambTimer = 0.3; }
    // dynamische Objekte (schwingende OP-Lampe etc.)
    for (const o of this.dynamic) {
      if (o.userData.kind === 'swing') { o.rotation.z = Math.sin(this.time * 1.3) * 0.22; o.rotation.x = Math.sin(this.time * 0.9 + 1) * 0.1; }
    }
    for (const it of this.items) if (it.alive && it.mesh) { it.mesh.rotation.y += dt * 0.0; }
  }

  powerChanged() { this.ambDirty = true; this.ambTimer = 0; }

  trigger(id) { return this.triggers.find((t) => t.id === id); }
  door(id) { return this.doorById.get(id); }
  hideById(id) { return this.hides.find((h) => h.id === id); }

  dispose(scene) {
    scene.remove(this.root);
    this.lights.dispose();
    this.root.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); } });
    this.gridTex.dispose(); this.ambTex.dispose();
  }
}
