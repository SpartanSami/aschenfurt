// Raumdetails: verteilt automatisch Schmutz, Papier, Schutt, Pfützen, Laub, Wasserflecken an Wänden und
// heruntergefallene Deckenplatten über alle begehbaren Zellen eines Levels.
// Reine Dekoration ohne Kollision. Jede Sorte ist ein einziges InstancedMesh (ein Zeichenaufruf pro Sorte).
// Die Verteilung ist deterministisch (gleicher Zufallsstart je Kapitel) und hält Abstand zu Gegenständen
// und Schaltern, damit nichts Wichtiges verdeckt wird.
import * as THREE from 'three';
import { F } from './grid.js';
import { RNG, hashStr } from '../core/rng.js';
import { getTex } from '../render/textures.js';
import { patchGrid } from '../render/materials.js';

// Stil je Kapitel: Häufigkeit der einzelnen Sorten (1 = normal)
const STYLE = {
  ch1: { paper: 1.0, debris: 0.8, grime: 1.0, leak: 1.0, puddle: 0.15, ceiling: 1.0 },
  ch1b: { paper: 1.2, debris: 1.0, grime: 1.2, leak: 1.2, puddle: 0.3, ceiling: 1.0 },
  ch2: { paper: 1.2, debris: 0.8, grime: 0.8, leak: 0.8, puddle: 0.1, ceiling: 0.8 },
  ch2b: { paper: 0.15, debris: 0.8, grime: 1.4, leak: 1.6, puddle: 1.4, ceiling: 0, rust: true },
  ch3: { paper: 0.5, debris: 1.2, grime: 1.3, leak: 0.8, puddle: 0.8, ceiling: 0, oil: true },
  ch4: { paper: 1.0, debris: 1.0, grime: 1.3, leak: 1.2, puddle: 0.8, ceiling: 0.3 },
  ch4b: { paper: 1.3, debris: 0.8, grime: 1.0, leak: 0.8, puddle: 0.4, ceiling: 0.6 },
  ch5: { paper: 0.8, debris: 1.0, grime: 0.8, leak: 0.3, puddle: 1.2, ceiling: 0 },
};
const DEF_STYLE = { paper: 0.6, debris: 0.6, grime: 0.8, leak: 0.6, puddle: 0.3, ceiling: 0.3 };

const mats = new Map();
function decalMat(kind, opts, extra = {}) {
  const key = kind + JSON.stringify(opts) + JSON.stringify(extra);
  if (mats.has(key)) return mats.get(key);
  const t = getTex(kind, opts, opts.size || 128, opts.h || opts.size || 128);
  const m = patchGrid(new THREE.MeshStandardMaterial({
    map: t.map, roughnessMap: t.roughnessMap, roughness: 1, metalness: 0, transparent: true, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, ...extra,
  }));
  mats.set(key, m);
  return m;
}
function solidMat(key, make) { if (!mats.has(key)) mats.set(key, patchGrid(make())); return mats.get(key); }

// Sammelt Transformationen und baut daraus ein InstancedMesh
class Bucket {
  constructor(geo, mat, o = {}) { this.geo = geo; this.mat = mat; this.o = o; this.list = []; }
  add(pos, rot, scale, color) { this.list.push({ pos: pos.clone(), rot: rot.clone(), scale: scale.clone(), color: color ? color.clone() : null }); }
  build(root) {
    if (!this.list.length) return null;
    const im = new THREE.InstancedMesh(this.geo, this.mat, this.list.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion();
    this.list.forEach((e, i) => {
      q.setFromEuler(e.rot);
      m.compose(e.pos, q, e.scale);
      im.setMatrixAt(i, m);
      if (e.color) im.setColorAt(i, e.color);
    });
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.receiveShadow = !!this.o.receive; im.castShadow = !!this.o.cast;
    im.renderOrder = this.o.order || 0;
    im.frustumCulled = false; // Instanzen sind über das ganze Level verteilt
    im.name = 'clutter:' + (this.o.name || '');
    root.add(im);
    return im;
  }
}

export function buildClutter(level, chapterId, opts = {}) {
  const g = level.grid, def = level.def;
  const st = { ...DEF_STYLE, ...(STYLE[chapterId] || {}), ...(def.opts.clutter || {}) };
  const dens = opts.density ?? 1;
  const rng = new RNG(hashStr('clutter:' + chapterId));
  const rooms = def.rooms;
  // Zellen, die frei bleiben: Gegenstände, Schalter, Türen (mit Rand)
  const keep = new Set();
  const mark = (x, z, r) => { for (let j = Math.floor(z - r); j <= Math.floor(z + r); j++) for (let i = Math.floor(x - r); i <= Math.floor(x + r); i++) keep.add(j * g.w + i); };
  for (const it of def.items) mark(it.x, it.z, 1.2);
  for (const ia of def.interacts) if (ia.x != null) mark(ia.x, ia.z, 0.8);
  const inWater = (x, z) => (def.waters || []).some((w) => x >= w.x - 0.5 && x < w.x + w.w + 0.5 && z >= w.y - 0.5 && z < w.y + w.h + 0.5);
  const isSolid = (i, j) => !g.inb(i, j) || (g.f[g.idx(i, j)] & F.SOLID) !== 0;

  const plane = new THREE.PlaneGeometry(1, 1); plane.rotateX(-Math.PI / 2);   // liegt flach, Normale nach oben
  const wallPlane = new THREE.PlaneGeometry(1, 1); wallPlane.translate(0, -0.5, 0); // Oberkante im Ursprung
  const rock = new THREE.IcosahedronGeometry(1, 0);
  const panel = new THREE.BoxGeometry(0.6, 0.016, 0.6); panel.translate(0, 0, 0.3);  // Scharnier an einer Kante
  const hole = new THREE.PlaneGeometry(0.6, 0.6); hole.rotateX(Math.PI / 2);      // Normale nach unten

  const B = {
    grime: new Bucket(plane, decalMat('grime', { size: 128, rust: !!st.rust }), { receive: true, order: 1, name: 'grime' }),
    oil: new Bucket(plane, decalMat('grime', { size: 128, oil: true }), { receive: true, order: 1, name: 'oil' }),
    puddle: new Bucket(plane, decalMat('puddle', { size: 128 }, { roughness: 1, metalness: 0.1, envMapIntensity: 0 }), { receive: true, order: 1, name: 'puddle' }),
    leak: new Bucket(wallPlane, decalMat('leak', { size: 64, h: 128, rust: !!st.rust }), { receive: true, order: 1, name: 'leak' }),
    leaf: new Bucket(plane, decalMat('leaf', { size: 64 }, { alphaTest: 0.4, transparent: false, depthWrite: true }), { receive: true, name: 'leaf' }),
    rock: new Bucket(rock, solidMat('rock', () => new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, flatShading: true })), { receive: true, name: 'rock' }),
    panel: new Bucket(panel, solidMat('ceilpanel', () => new THREE.MeshStandardMaterial({ color: 0xc4c0b6, roughness: 0.9 })), { cast: true, receive: true, name: 'panel' }),
    hole: new Bucket(hole, solidMat('ceilhole', () => new THREE.MeshStandardMaterial({ color: 0x060606, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })), { name: 'hole' }),
  };
  const litter = [0, 1, 2, 3].map((v) => new Bucket(plane, solidMat('litter' + v, () => {
    const t = getTex('litter', { v, color: v === 3 ? '#2a5aa8' : undefined }, 128);
    return new THREE.MeshStandardMaterial({ map: t.map, normalMap: t.normalMap, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  }), { receive: true, name: 'litter' + v }));

  const P = new THREE.Vector3(), R = new THREE.Euler(), S = new THREE.Vector3(), C = new THREE.Color();
  let yo = 0;
  const lift = () => { yo = (yo + 1) % 7; return 0.004 + yo * 0.0012; };   // gegen Flimmern übereinanderliegender Flecken
  let count = 0;

  for (let j = 0; j < g.h; j++) for (let i = 0; i < g.w; i++) {
    const k = g.idx(i, j), f = g.f[k];
    if (!(f & F.FLOOR) || (f & (F.SOLID | F.DOOR | F.GLASS | F.VENT))) continue;
    if (g.slope[k]) continue;
    const room = rooms[g.room[k]];
    if (!room) continue;
    const cx = i + 0.5, cz = j + 0.5;
    if (inWater(cx, cz)) continue;
    const fy = g.floorY[k], cy = g.ceilY[k];
    const free = !keep.has(j * g.w + i) && !(f & (F.PROP | F.TALL));
    const walls = [];
    if (isSolid(i, j - 1)) walls.push('n'); if (isSolid(i, j + 1)) walls.push('s');
    if (isSolid(i + 1, j)) walls.push('e'); if (isSolid(i - 1, j)) walls.push('w');
    const outdoor = room.outdoor, wet = room.wet || outdoor;
    // Bodenflecken (Schmutz, Öl in der Garage)
    if (rng.chance(0.07 * st.grime * dens)) {
      const s = rng.range(0.7, 1.9);
      P.set(cx + rng.range(-0.3, 0.3), fy + lift(), cz + rng.range(-0.3, 0.3)); R.set(0, rng.range(0, 6.28), 0); S.set(s, 1, s * rng.range(0.6, 1.2));
      (st.oil && rng.chance(0.45) ? B.oil : B.grime).add(P, R, S); count++;
    }
    // Pfützen (nasse Räume, draußen, Pumpwerk)
    if (rng.chance((wet ? 0.08 : 0.012) * st.puddle * dens)) {
      const s = rng.range(0.6, 1.6);
      P.set(cx + rng.range(-0.25, 0.25), fy + lift(), cz + rng.range(-0.25, 0.25)); R.set(0, rng.range(0, 6.28), 0); S.set(s, 1, s * rng.range(0.5, 1.0));
      B.puddle.add(P, R, S); count++;
    }
    // Papier, Zeitungen, Pappe, Flugblätter – bevorzugt an Wänden
    if (free && rng.chance((walls.length ? 0.12 : 0.04) * st.paper * dens)) {
      const n = rng.int(1, 3);
      const w0 = walls.length ? rng.pick(walls) : null;
      for (let q = 0; q < n; q++) {
        let x = cx + rng.range(-0.35, 0.35), z = cz + rng.range(-0.35, 0.35);
        if (w0 === 'n') z = j + rng.range(0.12, 0.35); if (w0 === 's') z = j + 1 - rng.range(0.12, 0.35);
        if (w0 === 'e') x = i + 1 - rng.range(0.12, 0.35); if (w0 === 'w') x = i + rng.range(0.12, 0.35);
        const v = outdoor ? rng.pick([1, 1, 2, 3]) : rng.pick([0, 0, 0, 1, 2, 3]);
        const sz = v === 2 ? rng.range(0.3, 0.5) : v === 1 ? rng.range(0.32, 0.45) : 0.21;
        P.set(x, fy + 0.005 + q * 0.003, z); R.set(rng.range(-0.06, 0.06), rng.range(0, 6.28), rng.range(-0.06, 0.06)); S.set(sz, 1, sz * (v === 2 ? rng.range(0.7, 1.1) : 1.41));
        litter[v].add(P, R, S); count++;
      }
    }
    // Laub draußen
    if (outdoor && free && rng.chance(0.3 * dens)) {
      const n = rng.int(2, 6);
      for (let q = 0; q < n; q++) {
        P.set(cx + rng.range(-0.45, 0.45), fy + 0.006 + q * 0.001, cz + rng.range(-0.45, 0.45)); R.set(0, rng.range(0, 6.28), 0);
        const s = rng.range(0.06, 0.12); S.set(s, 1, s * 1.3);
        C.setHSL(rng.range(0.05, 0.12), rng.range(0.45, 0.7), rng.range(0.18, 0.32));
        B.leaf.add(P, R, S, C); count++;
      }
    }
    // Schutt und Putzbrocken an Wänden
    if (free && rng.chance((walls.length ? 0.1 : 0.02) * st.debris * dens)) {
      const n = rng.int(2, 6);
      const w0 = walls.length ? rng.pick(walls) : null;
      const base = rng.range(0.32, 0.55);
      for (let q = 0; q < n; q++) {
        let x = cx + rng.range(-0.4, 0.4), z = cz + rng.range(-0.4, 0.4);
        if (w0 === 'n') z = j + rng.range(0.06, 0.3); if (w0 === 's') z = j + 1 - rng.range(0.06, 0.3);
        if (w0 === 'e') x = i + 1 - rng.range(0.06, 0.3); if (w0 === 'w') x = i + rng.range(0.06, 0.3);
        const s = rng.range(0.018, 0.06) * (q === 0 ? 1.5 : 1);
        P.set(x, fy + s * 0.45, z); R.set(rng.range(0, 6.28), rng.range(0, 6.28), rng.range(0, 6.28)); S.set(s, s * rng.range(0.5, 0.9), s * rng.range(0.8, 1.3));
        C.setRGB(base * rng.range(0.85, 1.05), base * rng.range(0.83, 1.0), base * rng.range(0.78, 0.95));
        B.rock.add(P, R, S, C); count++;
      }
    }
    // Wasserflecken an Wänden (von oben nach unten), nur bei normal hohen Wänden
    if (!outdoor && walls.length && cy - fy < 6 && rng.chance(0.07 * st.leak * dens)) {
      const side = rng.pick(walls);
      const top = Math.min(cy, fy + 3.2) - 0.01;
      const h = rng.range(0.9, Math.min(2.6, top - fy - 0.1)), w = rng.range(0.5, 1.1);
      const off = 0.006;
      const map = { n: [cx + rng.range(-0.2, 0.2), j + off, 0], s: [cx + rng.range(-0.2, 0.2), j + 1 - off, Math.PI], e: [i + 1 - off, cz + rng.range(-0.2, 0.2), -Math.PI / 2], w: [i + off, cz + rng.range(-0.2, 0.2), Math.PI / 2] }[side];
      P.set(map[0], top, map[1]); R.set(0, map[2], 0); S.set(w, h, 1);
      B.leak.add(P, R, S); count++;
    }
    // Heruntergeklappte Deckenplatte mit dunklem Loch darüber (nur Innenräume mit Decke)
    if (!outdoor && !room.noCeil && free && cy - fy > 2.6 && cy - fy < 3.6 && rng.chance(0.012 * st.ceiling * dens)) {
      const a = rng.range(0, 6.28);
      P.set(cx, cy - 0.006, cz); R.set(0, a, 0); S.set(1, 1, 1);
      B.hole.add(P, R, S);
      // Platte hängt an einer Kante herunter (Scharnier an der Lochkante)
      const hx = cx - Math.sin(a) * 0.3, hz = cz - Math.cos(a) * 0.3;
      P.set(hx, cy - 0.02, hz); R.set(rng.range(0.7, 1.25), a, rng.range(-0.1, 0.1), 'YXZ'); S.set(1, 1, 1);
      B.panel.add(P, R, S); count++;
      R.set(0, 0, 0, 'XYZ');
    }
  }
  const root = new THREE.Group(); root.name = 'clutter';
  for (const b of [...Object.values(B), ...litter]) b.build(root);
  level.root.add(root);
  return count;
}
