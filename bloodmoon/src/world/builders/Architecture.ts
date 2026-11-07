import * as THREE from "three";
import { Level } from "../Level";
import {
  boxGeo, wallWithOpeningGeo, pointedArchPoints, roundArchPoints, archFrameGeo, barrelVaultGeo,
  pointedVaultGeo, columnGeo, clusterPierGeo, cylGeo, planeGeo, scaleUV,
} from "./Geo";
import { materials } from "../../graphics/Materials";
import { lightShaft } from "../../graphics/Effects";

export interface Opening {
  at: number; // Abstand vom Wandanfang (Mitte der Öffnung)
  w: number;
  h: number;
  y?: number; // Brüstungshöhe
  kind?: "pointed" | "round" | "rect";
  spring?: number; // Kämpferhöhe relativ zur Öffnung
  frame?: THREE.Material | null;
  glass?: THREE.Material | null;
  tracery?: boolean;
  bars?: boolean;
}

function openingPoints(o: Opening): THREE.Vector2[] {
  const kind = o.kind ?? "pointed";
  const spring = o.spring ?? o.h - o.w * 0.75;
  if (kind === "rect") {
    return [new THREE.Vector2(-o.w / 2, 0), new THREE.Vector2(-o.w / 2, o.h), new THREE.Vector2(o.w / 2, o.h), new THREE.Vector2(o.w / 2, 0)];
  }
  if (kind === "round") return roundArchPoints(o.w, Math.max(0.1, o.h - o.w / 2));
  return pointedArchPoints(o.w, o.h, Math.max(0.1, spring), 10);
}

/** Wand zwischen zwei Punkten mit beliebig vielen Öffnungen. */
export function wall(L: Level, mat: THREE.Material, a: [number, number], b: [number, number], y0: number, h: number, t: number, openings: Opening[] = [], opts: { collide?: boolean } = {}): void {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const len = Math.hypot(dx, dz);
  const ux = dx / len, uz = dz / len;
  const rotY = Math.atan2(-uz, ux);
  const collide = opts.collide !== false;
  const at = (d: number): [number, number] => [a[0] + ux * d, a[1] + uz * d];
  const sorted = [...openings].sort((p, q) => p.at - q.at);
  let cursor = 0;
  const margin = 0.35;
  const solid = (from: number, to: number) => {
    if (to - from < 0.01) return;
    const mid = at((from + to) / 2);
    L.box(mat, [mid[0], y0 + h / 2, mid[1]], [to - from, h, t], { rotY, collide });
  };
  for (const o of sorted) {
    const pw = o.w + margin * 2;
    const from = o.at - pw / 2;
    solid(cursor, from);
    const oy = o.y ?? 0;
    const pts = openingPoints(o);
    const g = wallWithOpeningGeo(pw, h, t, pts, 0, oy);
    scaleUV(g, 1, 1);
    const c = at(o.at);
    L.geo(g, mat, [c[0], y0, c[1]], [0, rotY, 0]);
    g.dispose();
    if (collide) {
      // Kollision: Seitenteile, Sturz und Brüstung als Boxen
      const side = (off: number, w: number) => {
        const p = at(o.at + off);
        L.col.addBox([p[0], y0 + h / 2, p[1]], [w, h, t], rotY);
      };
      side(-(o.w / 2 + margin / 2), margin);
      side(o.w / 2 + margin / 2, margin);
      const top = oy + o.h * 0.92;
      if (top < h) L.col.addBox([c[0], y0 + top + (h - top) / 2, c[1]], [o.w, h - top, t], rotY);
      if (oy > 0) L.col.addBox([c[0], y0 + oy / 2, c[1]], [o.w, oy, t], rotY);
    }
    if (o.frame) archFrame(L, o.frame, [c[0], y0 + oy, c[1]], rotY, pts, 0.16, t + 0.12);
    if (o.glass) windowGlass(L, o.glass, [c[0], y0 + oy, c[1]], rotY, o, pts);
    if (o.bars) windowBars(L, [c[0], y0 + oy, c[1]], rotY, o);
    cursor = o.at + pw / 2;
  }
  solid(cursor, len);
}

export function archFrame(L: Level, mat: THREE.Material, pos: [number, number, number], rotY: number, pts: THREE.Vector2[], frame = 0.16, depth = 0.5): void {
  const g = archFrameGeo(pts.slice(1, -1), frame, depth);
  L.geo(g, mat, pos, [0, rotY, 0]);
  g.dispose();
}

export function windowGlass(L: Level, mat: THREE.Material, pos: [number, number, number], rotY: number, o: Opening, pts?: THREE.Vector2[]): void {
  const p = pts ?? openingPoints(o);
  const shape = new THREE.Shape(p);
  const g = new THREE.ShapeGeometry(shape, 6);
  // UV 0..1 für Glasbild
  const pos3 = g.getAttribute("position");
  const uv = new Float32Array(pos3.count * 2);
  for (let i = 0; i < pos3.count; i++) {
    uv[i * 2] = pos3.getX(i) / o.w + 0.5;
    uv[i * 2 + 1] = pos3.getY(i) / o.h;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  const m = new THREE.Mesh(g, mat);
  m.position.set(...pos);
  m.rotation.y = rotY;
  L.add(m);
  if (o.tracery !== false) {
    const stone = materials.surface("castleStone");
    // Mittelpfosten und Querstreben
    const mull = boxGeo(0.07, o.h * 0.98, 0.12);
    L.geo(mull, stone, [pos[0], pos[1] + o.h * 0.49, pos[2]], [0, rotY, 0]);
    if (o.w > 1.2) {
      for (const off of [-o.w / 4, o.w / 4]) {
        const ox = Math.cos(rotY) * off, oz = -Math.sin(rotY) * off;
        L.geo(boxGeo(0.05, o.h * 0.7, 0.1), stone, [pos[0] + ox, pos[1] + o.h * 0.35, pos[2] + oz], [0, rotY, 0]);
      }
    }
    for (const yy of [0.33, 0.62]) {
      L.geo(boxGeo(o.w * 0.98, 0.05, 0.1), stone, [pos[0], pos[1] + o.h * yy, pos[2]], [0, rotY, 0]);
    }
    const ring = new THREE.TorusGeometry(o.w * 0.18, 0.035, 6, 20);
    L.geo(ring, stone, [pos[0], pos[1] + o.h * 0.8, pos[2]], [0, rotY, 0]);
    mull.dispose();
    ring.dispose();
  }
}

export function windowBars(L: Level, pos: [number, number, number], rotY: number, o: Opening): void {
  const iron = materials.surface("iron");
  const n = Math.max(2, Math.round(o.w / 0.18));
  for (let i = 1; i < n; i++) {
    const off = -o.w / 2 + (o.w / n) * i;
    const ox = Math.cos(rotY) * off, oz = -Math.sin(rotY) * off;
    const g = cylGeo(0.015, 0.015, o.h * 0.85, 5);
    L.geo(g, iron, [pos[0] + ox, pos[1] + o.h * 0.42, pos[2] + oz]);
    g.dispose();
  }
}

/** Gewölbe über rechteckigem Raum. axis = Längsachse. */
export function vault(L: Level, mat: THREE.Material, x0: number, z0: number, x1: number, z1: number, y: number, rise: number, axis: "x" | "z" = "z", pointed = true): void {
  const w = axis === "z" ? x1 - x0 : z1 - z0;
  const l = axis === "z" ? z1 - z0 : x1 - x0;
  const g = pointed ? pointedVaultGeo(w, l, rise, 12) : barrelVaultGeo(w, l, rise, 18);
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  L.geo(g, mat, [cx, y, cz], [0, axis === "z" ? 0 : Math.PI / 2, 0], 1, { cast: true });
  g.dispose();
  // Dachfläche darüber schließen (verhindert Lichtlecks)
  L.box(materials.dark(), [cx, y + rise + 0.3, cz], [x1 - x0 + 0.4, 0.2, z1 - z0 + 0.4], { collide: false, cast: false });
}

/** Gewölberippen quer zur Längsachse. */
export function vaultRibs(L: Level, mat: THREE.Material, x0: number, z0: number, x1: number, z1: number, y: number, rise: number, axis: "x" | "z", spacing: number, pointed = true): void {
  const w = axis === "z" ? x1 - x0 : z1 - z0;
  const l = axis === "z" ? z1 - z0 : x1 - x0;
  const pts = pointed ? pointedArchPoints(w, rise, 0, 12).slice(1, -1) : roundArchPoints(w, 0, 14).slice(1, -1);
  const inner = pts.map((p) => new THREE.Vector2(p.x * 0.985, p.y * 0.985));
  const n = Math.max(1, Math.floor(l / spacing));
  for (let i = 0; i <= n; i++) {
    const d = -l / 2 + (l / n) * i;
    const g = archFrameGeo(inner, 0.14, 0.22);
    const cx = (x0 + x1) / 2 + (axis === "x" ? d : 0);
    const cz = (z0 + z1) / 2 + (axis === "z" ? d : 0);
    L.geo(g, mat, [cx, y, cz], [0, axis === "z" ? 0 : Math.PI / 2, 0]);
    g.dispose();
  }
  // Scheitelrippe
  const ridge = boxGeo(axis === "x" ? l : 0.18, 0.14, axis === "z" ? l : 0.18);
  L.geo(ridge, mat, [(x0 + x1) / 2, y + rise * 0.985 - 0.07, (z0 + z1) / 2]);
  ridge.dispose();
}

export function column(L: Level, mat: THREE.Material, x: number, z: number, y: number, r: number, h: number, cluster = false): void {
  const g = cluster ? clusterPierGeo(r, h) : columnGeo(r, h, 18);
  L.geo(g, mat, [x, y, z]);
  g.dispose();
  L.col.addBox([x, y + h / 2, z], [r * 2.3, h, r * 2.3]);
}

/** Gerade Treppe. dir: Richtung des Aufstiegs. */
export function stairs(L: Level, mat: THREE.Material, x: number, z: number, y: number, dir: "x" | "-x" | "z" | "-z", width: number, steps: number, stepH: number, stepD: number, opts: { sideMat?: THREE.Material | null } = {}): { top: THREE.Vector3; end: THREE.Vector3 } {
  const sx = dir === "x" ? 1 : dir === "-x" ? -1 : 0;
  const sz = dir === "z" ? 1 : dir === "-z" ? -1 : 0;
  for (let i = 0; i < steps; i++) {
    const cy = y + stepH * (i + 0.5);
    const along = stepD * (i + 0.5);
    const cx = x + sx * along, cz = z + sz * along;
    // Stufen bis zum Boden füllen (Blockstufen)
    const hgt = stepH * (i + 1);
    const g = boxGeo(sx ? stepD : width, hgt, sz ? stepD : width);
    L.geo(g, mat, [cx, y + hgt / 2, cz]);
    g.dispose();
    void cy;
  }
  const a = new THREE.Vector3(x, y, z);
  const end = new THREE.Vector3(x + sx * stepD * steps, y + stepH * steps, z + sz * stepD * steps);
  L.col.addRamp(new THREE.Vector3(x - sx * 0.1, y + 0.02, z - sz * 0.1), end.clone().add(new THREE.Vector3(sx * 0.05, 0, sz * 0.05)), width);
  // Seitenwangen
  if (opts.sideMat) {
    const len = stepD * steps;
    for (const side of [-1, 1]) {
      const ox = sz ? side * (width / 2 + 0.1) : 0;
      const oz = sx ? side * (width / 2 + 0.1) : 0;
      const g = boxGeo(sx ? len : 0.2, 0.5, sz ? len : 0.2);
      const mid = new THREE.Vector3().addVectors(a, end).multiplyScalar(0.5);
      const pitch = Math.atan2(stepH * steps, len);
      L.geo(g, opts.sideMat, [mid.x + ox, mid.y + 0.3, mid.z + oz], [sz ? -pitch * sz : 0, 0, sx ? pitch * sx : 0]);
      g.dispose();
    }
  }
  return { top: end, end };
}

/** Zinnenkranz entlang einer Linie. */
export function battlements(L: Level, mat: THREE.Material, a: [number, number], b: [number, number], y: number, t: number, merlon = 0.7, gap = 0.5, mh = 0.9): void {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const len = Math.hypot(dx, dz);
  const ux = dx / len, uz = dz / len;
  const rotY = Math.atan2(-uz, ux);
  // Brustwehr
  L.box(mat, [a[0] + dx / 2, y + 0.45, a[1] + dz / 2], [len, 0.9, t], { rotY });
  let d = merlon / 2;
  while (d < len) {
    L.box(mat, [a[0] + ux * d, y + 0.9 + mh / 2, a[1] + uz * d], [Math.min(merlon, len - d + merlon / 2), mh, t], { rotY, collide: true });
    d += merlon + gap;
  }
}

/** Runder Turm mit Kegeldach. */
export function tower(L: Level, mat: THREE.Material, roofMat: THREE.Material, x: number, z: number, y: number, r: number, h: number, opts: { roof?: boolean; windows?: number; crenel?: boolean } = {}): void {
  const g = cylGeo(r, r * 1.04, h, 24);
  L.geo(g, mat, [x, y + h / 2, z]);
  g.dispose();
  L.col.addBox([x, y + h / 2, z], [r * 1.8, h, r * 1.8]);
  if (opts.roof !== false) {
    const cone = new THREE.ConeGeometry(r * 1.25, r * 2.6, 24, 1, true);
    scaleUV(cone, r * 6, r * 3);
    L.geo(cone, roofMat, [x, y + h + r * 1.3, z]);
    cone.dispose();
    const rim = cylGeo(r * 1.2, r * 1.2, 0.25, 24);
    L.geo(rim, mat, [x, y + h, z]);
    rim.dispose();
  } else if (opts.crenel) {
    const n = Math.floor((Math.PI * 2 * r) / 1.2);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const bg = boxGeo(0.6, 0.8, 0.5);
      L.geo(bg, mat, [x + Math.cos(a) * r, y + h + 0.4, z + Math.sin(a) * r], [0, -a, 0]);
      bg.dispose();
    }
  }
  const glow = materials.basic("towerWindow", () => new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 0.6, 0.25) }));
  const dark = materials.dark();
  for (let i = 0; i < (opts.windows ?? 0); i++) {
    const a = i * 2.1 + x;
    const wy = y + h * (0.4 + (i % 3) * 0.18);
    const pg = planeGeo(0.35, 0.8);
    L.geo(pg, i % 3 === 0 ? glow : dark, [x + Math.cos(a) * (r + 0.02), wy, z + Math.sin(a) * (r + 0.02)], [0, -a + Math.PI / 2, 0], 1, { cast: false });
    pg.dispose();
  }
}

/** Kamin mit Sims und Rauchfang. */
export function fireplace(L: Level, mat: THREE.Material, x: number, z: number, y: number, rotY: number, lit = false): THREE.Vector3 {
  const local = (lx: number, ly: number, lz: number): [number, number, number] => {
    const c = Math.cos(rotY), s = Math.sin(rotY);
    return [x + lx * c + lz * s, y + ly, z - lx * s + lz * c];
  };
  L.box(mat, local(-1.0, 0.8, 0), [0.4, 1.6, 0.8], { rotY });
  L.box(mat, local(1.0, 0.8, 0), [0.4, 1.6, 0.8], { rotY });
  L.box(mat, local(0, 1.75, 0.05), [2.6, 0.3, 0.95], { rotY });
  L.box(mat, local(0, 2.9, -0.15), [2.0, 2.0, 0.6], { rotY });
  L.box(materials.dark(), local(0, 0.8, -0.3), [1.7, 1.6, 0.1], { rotY, collide: false });
  // Feuerrost / Asche
  L.box(materials.surface("iron"), local(0, 0.12, 0), [1.2, 0.08, 0.5], { rotY, collide: false });
  const firePos = new THREE.Vector3(...local(0, 0.15, 0));
  if (lit) {
    for (let i = 0; i < 5; i++) L.flame(firePos.clone().add(new THREE.Vector3((i - 2) * 0.18, 0, (i % 2) * 0.1)), 0.35 + (i % 2) * 0.1, "torch");
    L.light({ pos: firePos.clone().add(new THREE.Vector3(0, 0.5, 0)), color: new THREE.Color(1, 0.5, 0.2), intensity: 6, distance: 9, flicker: 0.9, shadow: true });
  }
  return firePos;
}

/** Mondlichtschacht durch ein Fenster. */
export function moonShaft(L: Level, from: THREE.Vector3, to: THREE.Vector3, width: number, color: THREE.ColorRepresentation = 0x9a3a40, opacity = 0.06): THREE.Mesh {
  const len = from.distanceTo(to);
  const m = lightShaft(width, len, color, opacity);
  m.position.copy(from);
  const dir = new THREE.Vector3().subVectors(to, from).normalize();
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
  L.add(m);
  return m;
}

/** Strebepfeiler an einer Außenwand. */
export function buttress(L: Level, mat: THREE.Material, x: number, z: number, y: number, rotY: number, h: number): void {
  const c = Math.cos(rotY), s = Math.sin(rotY);
  for (let i = 0; i < 3; i++) {
    const hh = h * (1 - i * 0.28);
    const d = 0.6 + i * 0.5;
    L.box(mat, [x + s * d, y + hh / 2, z + c * d], [0.7, hh, 0.9], { rotY });
  }
}

/** Pfosten-Fachwerk-Fassade (für Häuser in Rabenfurt). */
export function timberFrame(L: Level, mat: THREE.Material, a: [number, number], b: [number, number], y0: number, h: number, t = 0.08): void {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const len = Math.hypot(dx, dz);
  const ux = dx / len, uz = dz / len;
  const nx = -uz, nz = ux;
  const rotY = Math.atan2(-uz, ux);
  const off = 0.04;
  const at = (d: number, side = 1): [number, number] => [a[0] + ux * d + nx * off * side, a[1] + uz * d + nz * off * side];
  for (const side of [1, -1]) {
    // Schwelle und Rähm
    for (const yy of [y0 + 0.1, y0 + h - 0.1, y0 + h * 0.5]) {
      const p = at(len / 2, side);
      L.box(mat, [p[0], yy, p[1]], [len, 0.16, t], { rotY, collide: false });
    }
    const posts = Math.max(2, Math.round(len / 1.4));
    for (let i = 0; i <= posts; i++) {
      const p = at((len / posts) * i, side);
      L.box(mat, [p[0], y0 + h / 2, p[1]], [0.16, h, t], { rotY, collide: false });
      if (i < posts && i % 2 === 0) {
        // Diagonalstrebe (Andreaskreuz-Anteil)
        const p2 = at((len / posts) * (i + 0.5), side);
        const segW = len / posts;
        const diag = Math.hypot(segW, h * 0.5);
        const ang = Math.atan2(h * 0.5, segW);
        const g = boxGeo(diag, 0.12, t);
        L.geo(g, mat, [p2[0], y0 + h * 0.25, p2[1]], [0, rotY, ang]);
        g.dispose();
      }
    }
  }
}

/** Satteldach über rechteckigem Grundriss (Firstrichtung entlang axis). */
export function gableRoof(L: Level, mat: THREE.Material, wallMat: THREE.Material, x0: number, z0: number, x1: number, z1: number, y: number, rise: number, axis: "x" | "z" = "x", overhang = 0.4): void {
  const w = (axis === "x" ? z1 - z0 : x1 - x0) + overhang * 2;
  const l = (axis === "x" ? x1 - x0 : z1 - z0) + overhang * 2;
  const half = w / 2;
  const slope = Math.hypot(half, rise);
  const ang = Math.atan2(rise, half);
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  for (const side of [-1, 1]) {
    const g = boxGeo(axis === "x" ? l : slope, 0.12, axis === "x" ? slope : l);
    const off = (half / 2) * side;
    if (axis === "x") L.geo(g, mat, [cx, y + rise / 2, cz + off], [side * ang, 0, 0]);
    else L.geo(g, mat, [cx + off, y + rise / 2, cz], [0, 0, -side * ang]);
    g.dispose();
  }
  // Giebeldreiecke
  const shape = new THREE.Shape([new THREE.Vector2(-half + overhang, 0), new THREE.Vector2(half - overhang, 0), new THREE.Vector2(0, rise - 0.1)]);
  const tri = new THREE.ShapeGeometry(shape);
  scaleUV(tri, 1, 1);
  const gl = (axis === "x" ? x1 - x0 : z1 - z0) / 2;
  for (const s of [-1, 1]) {
    if (axis === "x") L.geo(tri, wallMat, [cx + gl * s, y, cz], [0, s * Math.PI / 2, 0], 1, { cast: false });
    else L.geo(tri, wallMat, [cx, y, cz + gl * s], [0, s > 0 ? 0 : Math.PI, 0], 1, { cast: false });
  }
  tri.dispose();
}
