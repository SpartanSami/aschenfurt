import * as THREE from "three";
import { Level } from "../Level";
import { scaleUV, cylGeo, mergeAll } from "./Geo";
import { materials } from "../../graphics/Materials";
import { noise3, Rng, fbm } from "../../graphics/Noise";
import { canvas, canvasTex } from "../../graphics/Textures";

type V3 = [number, number, number];

export type HeightFn = (x: number, z: number) => number;

/** Gelände mit Höhenfunktion; Kollision aus gröberem Netz. */
export function terrain(L: Level, mat: THREE.Material, cx: number, cz: number, sx: number, sz: number, seg: number, h: HeightFn): THREE.Mesh {
  const g = new THREE.PlaneGeometry(sx, sz, seg, Math.round((seg * sz) / sx));
  g.rotateX(-Math.PI / 2);
  const p = g.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + cx, z = p.getZ(i) + cz;
    p.setXYZ(i, x, h(x, z), z);
  }
  g.computeVertexNormals();
  scaleUV(g, sx, sz);
  const m = new THREE.Mesh(g, mat);
  m.receiveShadow = true;
  L.add(m);
  // Kollision
  const cs = Math.max(8, Math.round(seg / 2));
  const cg = new THREE.PlaneGeometry(sx, sz, cs, Math.round((cs * sz) / sx));
  cg.rotateX(-Math.PI / 2);
  const cp = cg.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < cp.count; i++) {
    const x = cp.getX(i) + cx, z = cp.getZ(i) + cz;
    cp.setXYZ(i, x, h(x, z), z);
  }
  L.col.addGeometry(cg);
  cg.dispose();
  return m;
}

/** Sanft hügelige Höhenfunktion. */
export function hills(seed: number, amp: number, scale: number, flat?: (x: number, z: number) => number): HeightFn {
  return (x, z) => {
    const n = (fbm(((x / scale) % 1 + 1) % 1, ((z / scale) % 1 + 1) % 1, 3, 4, seed) - 0.5) * 2;
    const k = flat ? flat(x, z) : 1;
    return n * amp * k;
  };
}

let needleMat: THREE.MeshStandardMaterial | null = null;
function needles(): THREE.MeshStandardMaterial {
  if (!needleMat) {
    needleMat = materials.tinted("grass", 0x3a5a40, 1);
  }
  return needleMat;
}

/** Nadelbaum (dunkle Tanne) aus verformten Kegeln. */
export function conifer(L: Level, pos: V3, h = 12, seed = 1, collide = true): void {
  const rng = new Rng(seed);
  const trunkH = h * 0.95;
  const r = h * 0.022;
  const trunk = cylGeo(r * 0.5, r * 1.3, trunkH, 7);
  L.geo(trunk, materials.surface("bark"), [pos[0], pos[1] + trunkH / 2, pos[2]]);
  trunk.dispose();
  const layers = 6;
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < layers; i++) {
    const t = i / layers;
    const lr = h * 0.24 * (1 - t * 0.8) * rng.range(0.85, 1.1);
    const lh = h * 0.3 * (1 - t * 0.4);
    const cone = new THREE.ConeGeometry(lr, lh, 9, 3, true);
    const p = cone.getAttribute("position") as THREE.BufferAttribute;
    for (let k = 0; k < p.count; k++) {
      const x = p.getX(k), y = p.getY(k), z = p.getZ(k);
      const n = 0.75 + noise3(x * 1.3 + seed, y * 1.3 + i, z * 1.3, seed) * 0.5;
      const droop = y < -lh * 0.3 ? -0.15 * lh : 0;
      p.setXYZ(k, x * n, y + droop * (Math.hypot(x, z) / lr), z * n);
    }
    cone.computeVertexNormals();
    cone.translate(0, h * 0.25 + t * h * 0.68, 0);
    cone.rotateY(rng.next() * 6.28);
    parts.push(cone);
  }
  const merged = mergeAll(parts);
  parts.forEach((p) => p.dispose());
  scaleUV(merged, 2, 2);
  L.geo(merged, needles(), pos, [0, 0, 0], 1, { cast: true });
  merged.dispose();
  if (collide) L.col.addBox([pos[0], pos[1] + 2, pos[2]], [r * 2.4, 4, r * 2.4]);
}

/** Toter, knorriger Baum mit rekursiven Ästen. */
export function deadTree(L: Level, pos: V3, h = 7, seed = 1, mat = materials.surface("bark"), collide = true): void {
  const rng = new Rng(seed);
  const parts: THREE.BufferGeometry[] = [];
  const branch = (start: THREE.Vector3, dir: THREE.Vector3, len: number, radius: number, depth: number) => {
    const pts: THREE.Vector3[] = [start.clone()];
    let p = start.clone();
    let d = dir.clone();
    const segs = 4;
    for (let i = 1; i <= segs; i++) {
      d.add(new THREE.Vector3(rng.range(-0.35, 0.35), rng.range(-0.1, 0.2), rng.range(-0.35, 0.35))).normalize();
      p = p.clone().addScaledVector(d, len / segs);
      pts.push(p);
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.TubeGeometry(curve, 6, radius, 6, false);
    // Verjüngung
    const pa = tube.getAttribute("position") as THREE.BufferAttribute;
    const ring = 7;
    for (let k = 0; k < pa.count; k++) {
      const seg = Math.floor(k / ring);
      const t = seg / 6;
      const c = curve.getPointAt(Math.min(1, t));
      const v = new THREE.Vector3(pa.getX(k), pa.getY(k), pa.getZ(k)).sub(c);
      v.multiplyScalar(1 - t * 0.7);
      pa.setXYZ(k, c.x + v.x, c.y + v.y, c.z + v.z);
    }
    tube.computeVertexNormals();
    scaleUV(tube, len, radius * 6);
    parts.push(tube);
    if (depth > 0) {
      const n = depth === 3 ? 3 : rng.int(2, 3);
      for (let i = 0; i < n; i++) {
        const t = rng.range(0.45, 0.95);
        const sp = curve.getPointAt(t);
        const nd = d.clone().add(new THREE.Vector3(rng.range(-1, 1), rng.range(0.1, 0.7), rng.range(-1, 1))).normalize();
        branch(sp, nd, len * rng.range(0.45, 0.65), radius * 0.45, depth - 1);
      }
    }
  };
  branch(new THREE.Vector3(0, -0.3, 0), new THREE.Vector3(0, 1, 0), h * 0.55, h * 0.045, 3);
  // Wurzeln
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + rng.next();
    branch(new THREE.Vector3(0, 0.4, 0), new THREE.Vector3(Math.cos(a), -0.45, Math.sin(a)).normalize(), h * 0.15, h * 0.03, 0);
  }
  const merged = mergeAll(parts);
  parts.forEach((p) => p.dispose());
  L.geo(merged, mat, pos, [0, rng.next() * 6.28, 0], 1, { cast: true });
  merged.dispose();
  if (collide) L.col.addBox([pos[0], pos[1] + 1.5, pos[2]], [h * 0.09, 3, h * 0.09]);
}

/** Felsbrocken. */
export function rock(L: Level, pos: V3, size = 1.5, seed = 1, mat = materials.surface("rock"), collide = true, squash = 0.7): void {
  const g = new THREE.IcosahedronGeometry(size, 3);
  const p = g.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = 0.65 + noise3(x * 1.2 / size + seed, y * 1.2 / size, z * 1.2 / size, seed) * 0.5 + noise3(x * 4 / size, y * 4 / size, z * 4 / size, seed + 3) * 0.12;
    p.setXYZ(i, x * n, y * n * squash, z * n);
  }
  g.computeVertexNormals();
  scaleUV(g, size * 2, size * 2);
  L.geo(g, mat, pos, [0, seed, 0], 1, { cast: true, collide });
  g.dispose();
}

let grassTex: THREE.Texture | null = null;
function grassBladeTexture(): THREE.Texture {
  if (grassTex) return grassTex;
  const [c, ctx] = canvas(128, 128);
  const rng = new Rng(7);
  for (let i = 0; i < 40; i++) {
    const x = rng.range(4, 124);
    const h = rng.range(50, 125);
    const lean = rng.range(-18, 18);
    const g = ctx.createLinearGradient(0, 128, 0, 128 - h);
    g.addColorStop(0, "#0c120a");
    g.addColorStop(1, rng.next() > 0.5 ? "#3a4a28" : "#4a4a2a");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - 2.5, 128);
    ctx.quadraticCurveTo(x + lean * 0.4, 128 - h * 0.5, x + lean, 128 - h);
    ctx.quadraticCurveTo(x + lean * 0.4 + 1, 128 - h * 0.5, x + 2.5, 128);
    ctx.fill();
  }
  grassTex = canvasTex(c);
  return grassTex;
}

/** Gras-Büschel als instanzierte Kreuz-Billboards. */
export function grassField(L: Level, count: number, area: { x0: number; z0: number; x1: number; z1: number }, height: HeightFn | number, seed = 1, avoid?: (x: number, z: number) => boolean, color = 0x8a9070): THREE.InstancedMesh {
  const g1 = new THREE.PlaneGeometry(0.8, 0.55);
  g1.translate(0, 0.27, 0);
  const g2 = g1.clone();
  g2.rotateY(Math.PI / 2);
  const g = mergeAll([g1, g2]);
  g1.dispose();
  g2.dispose();
  const mat = new THREE.MeshStandardMaterial({ map: grassBladeTexture(), alphaTest: 0.4, side: THREE.DoubleSide, roughness: 1, color });
  const mesh = new THREE.InstancedMesh(g, mat, count);
  const rng = new Rng(seed);
  const d = new THREE.Object3D();
  let n = 0;
  for (let i = 0; i < count * 2 && n < count; i++) {
    const x = rng.range(area.x0, area.x1), z = rng.range(area.z0, area.z1);
    if (avoid && avoid(x, z)) continue;
    const y = typeof height === "number" ? height : height(x, z);
    d.position.set(x, y, z);
    d.rotation.y = rng.next() * 6.28;
    d.scale.setScalar(rng.range(0.6, 1.4));
    d.updateMatrix();
    mesh.setMatrixAt(n++, d.matrix);
  }
  mesh.count = n;
  mesh.receiveShadow = true;
  L.add(mesh);
  L.disposables.push(mat);
  return mesh;
}

/** Busch / Farn aus verformten Kugeln. */
export function bush(L: Level, pos: V3, size = 0.8, seed = 1): void {
  const rng = new Rng(seed);
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 4; i++) {
    const g = new THREE.IcosahedronGeometry(size * rng.range(0.5, 0.8), 1);
    const p = g.getAttribute("position") as THREE.BufferAttribute;
    for (let k = 0; k < p.count; k++) {
      const x = p.getX(k), y = p.getY(k), z = p.getZ(k);
      const n = 0.7 + noise3(x * 3 + i, y * 3, z * 3, seed) * 0.6;
      p.setXYZ(k, x * n, y * n * 0.7, z * n);
    }
    g.translate(rng.range(-size * 0.5, size * 0.5), size * 0.35, rng.range(-size * 0.5, size * 0.5));
    parts.push(g);
  }
  const m = mergeAll(parts);
  parts.forEach((p) => p.dispose());
  scaleUV(m, 2, 2);
  L.geo(m, materials.tinted("grass", 0x5a6a4a, 1), pos, [0, 0, 0], 1, { cast: true });
  m.dispose();
}

/** Pilze (leicht leuchtend im Schwarzen Forst). */
export function mushrooms(L: Level, pos: V3, n = 5, seed = 1, glow = false): void {
  const rng = new Rng(seed);
  const capMat = glow
    ? materials.basic("mushGlow", () => new THREE.MeshStandardMaterial({ color: 0x6a8a90, emissive: 0x2a6a7a, emissiveIntensity: 1.2, roughness: 0.6 }))
    : materials.basic("mush", () => new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.8 }));
  for (let i = 0; i < n; i++) {
    const s = rng.range(0.03, 0.08);
    const p: V3 = [pos[0] + rng.range(-0.4, 0.4), pos[1], pos[2] + rng.range(-0.4, 0.4)];
    const stem = cylGeo(s * 0.3, s * 0.4, s * 2, 5);
    L.geo(stem, materials.surface("bone"), [p[0], p[1] + s, p[2]], [0, 0, 0], 1, { cast: false });
    stem.dispose();
    const cap = new THREE.SphereGeometry(s, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2);
    L.geo(cap, capMat, [p[0], p[1] + s * 2, p[2]], [0, 0, 0], [1, 0.6, 1], { cast: false });
    cap.dispose();
  }
}

/** Ferne Berge als Silhouette (ohne Kollision). */
export function mountains(L: Level, center: V3, radius: number, height: number, seed = 1, color = 0x0a090c): void {
  const seg = 96;
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    const n = fbm(i / seg, 0.5, 6, 5, seed);
    const hh = height * (0.35 + n * 0.9);
    const x = center[0] + Math.cos(a) * radius, z = center[2] + Math.sin(a) * radius;
    pos.push(x, center[1] - 20, z, x, center[1] + hh, z);
    if (i < seg) {
      const b = i * 2;
      idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, fog: false }));
  m.renderOrder = -5;
  L.add(m);
}

/** Holzzaun entlang einer Linie. */
export function fence(L: Level, a: [number, number], b: [number, number], y: HeightFn | number, broken = 0.2, seed = 1): void {
  const rng = new Rng(seed);
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const len = Math.hypot(dx, dz);
  const n = Math.max(1, Math.round(len / 1.6));
  const wood = materials.surface("woodOld");
  const hy = (x: number, z: number) => (typeof y === "number" ? y : y(x, z));
  for (let i = 0; i <= n; i++) {
    const x = a[0] + (dx * i) / n, z = a[1] + (dz * i) / n;
    L.box(wood, [x, hy(x, z) + 0.55, z], [0.1, 1.1, 0.1], { rotY: rng.range(-0.1, 0.1), collide: false });
    if (i < n && rng.next() > broken) {
      const mx = a[0] + (dx * (i + 0.5)) / n, mz = a[1] + (dz * (i + 0.5)) / n;
      const rotY = Math.atan2(-dz, dx);
      L.box(wood, [mx, hy(mx, mz) + 0.8, mz], [len / n, 0.08, 0.05], { rotY, collide: false });
      L.box(wood, [mx, hy(mx, mz) + 0.4, mz], [len / n, 0.08, 0.05], { rotY: rotY + rng.range(-0.05, 0.05), collide: false });
    }
  }
  L.col.addBox([(a[0] + b[0]) / 2, hy((a[0] + b[0]) / 2, (a[1] + b[1]) / 2) + 0.6, (a[1] + b[1]) / 2], [len, 1.2, 0.15], Math.atan2(-dz, dx));
}
