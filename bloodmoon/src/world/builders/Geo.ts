import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// Geometrie-Helfer mit UV-Koordinaten in Metern (1 UV-Einheit = 1 m),
// damit Materialien unabhängig von der Objektgröße korrekt kacheln.

export function scaleUV(geo: THREE.BufferGeometry, su: number, sv: number): THREE.BufferGeometry {
  const uv = geo.getAttribute("uv") as THREE.BufferAttribute | undefined;
  if (!uv) return geo;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
  uv.needsUpdate = true;
  return geo;
}

export function offsetUV(geo: THREE.BufferGeometry, ou: number, ov: number): THREE.BufferGeometry {
  const uv = geo.getAttribute("uv") as THREE.BufferAttribute | undefined;
  if (!uv) return geo;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) + ou, uv.getY(i) + ov);
  return geo;
}

/** Box mit metrischen UVs pro Seite. */
export function boxGeo(w: number, h: number, d: number): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.getAttribute("uv") as THREE.BufferAttribute;
  // Reihenfolge: +x, -x, +y, -y, +z, -z (je 4 Vertices)
  const dims: [number, number][] = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      uv.setXY(i, uv.getX(i) * dims[f][0], uv.getY(i) * dims[f][1]);
    }
  }
  return g;
}

export function planeGeo(w: number, h: number, segW = 1, segH = 1): THREE.BufferGeometry {
  return scaleUV(new THREE.PlaneGeometry(w, h, segW, segH), w, h);
}

export function cylGeo(rt: number, rb: number, h: number, seg = 16, open = false, thetaStart = 0, thetaLen = Math.PI * 2): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(rt, rb, h, seg, 1, open, thetaStart, thetaLen);
  const circ = Math.max(rt, rb) * thetaLen;
  return scaleUV(g, circ, h);
}

export function sphereGeo(r: number, ws = 16, hs = 12): THREE.BufferGeometry {
  return scaleUV(new THREE.SphereGeometry(r, ws, hs), r * Math.PI * 2, r * Math.PI);
}

/** Spitzbogen-Kontur (gotisch) als Punktfolge; Basis bei y=0, Scheitel bei y=h. */
export function pointedArchPoints(w: number, h: number, spring: number, seg = 10): THREE.Vector2[] {
  const half = w / 2;
  const r = w; // gleichseitiger Spitzbogen
  const angApex = Math.acos(-half / r);
  const archH = Math.max(0.01, h - spring);
  const k = archH / (r * Math.sin(angApex));
  const left: THREE.Vector2[] = [];
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    const ang = Math.PI - t * (Math.PI - angApex);
    left.push(new THREE.Vector2(half + Math.cos(ang) * r, spring + Math.sin(ang) * r * k));
  }
  const pts: THREE.Vector2[] = [new THREE.Vector2(-half, 0), ...left];
  for (let i = left.length - 2; i >= 0; i--) pts.push(new THREE.Vector2(-left[i].x, left[i].y));
  pts.push(new THREE.Vector2(half, 0));
  return pts;
}

/** Rundbogen-Kontur. */
export function roundArchPoints(w: number, spring: number, seg = 12): THREE.Vector2[] {
  const half = w / 2;
  const pts: THREE.Vector2[] = [new THREE.Vector2(-half, 0), new THREE.Vector2(-half, spring)];
  for (let i = 1; i < seg; i++) {
    const a = Math.PI - (i / seg) * Math.PI;
    pts.push(new THREE.Vector2(Math.cos(a) * half, spring + Math.sin(a) * half));
  }
  pts.push(new THREE.Vector2(half, spring), new THREE.Vector2(half, 0));
  return pts;
}

/** Wandstück (w x h, Tiefe d) mit Öffnung entlang der Kontur pts (lokal, Basis auf Boden). */
export function wallWithOpeningGeo(w: number, h: number, d: number, pts: THREE.Vector2[], openingX = 0, openingY = 0): THREE.BufferGeometry {
  const p = pts.map((v) => new THREE.Vector2(v.x + openingX, v.y + openingY));
  let shape: THREE.Shape;
  if (openingY <= 0.001) {
    // Tür bis zum Boden: U-förmige Außenkontur statt Loch
    shape = new THREE.Shape();
    shape.moveTo(-w / 2, 0);
    shape.lineTo(p[0].x, 0);
    for (let i = 1; i < p.length - 1; i++) shape.lineTo(p[i].x, p[i].y);
    shape.lineTo(p[p.length - 1].x, 0);
    shape.lineTo(w / 2, 0);
    shape.lineTo(w / 2, h);
    shape.lineTo(-w / 2, h);
    shape.lineTo(-w / 2, 0);
  } else {
    shape = new THREE.Shape();
    shape.moveTo(-w / 2, 0);
    shape.lineTo(w / 2, 0);
    shape.lineTo(w / 2, h);
    shape.lineTo(-w / 2, h);
    shape.lineTo(-w / 2, 0);
    const hole = new THREE.Path();
    hole.moveTo(p[0].x, p[0].y);
    for (let i = 1; i < p.length; i++) hole.lineTo(p[i].x, p[i].y);
    hole.lineTo(p[0].x, p[0].y);
    shape.holes.push(hole);
  }
  const g = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false, curveSegments: 4 });
  g.translate(0, 0, -d / 2);
  return g;
}

/** Bogenrahmen (Laibung) – Profil entlang der Öffnungskontur. */
export function archFrameGeo(pts: THREE.Vector2[], frame: number, depth: number): THREE.BufferGeometry {
  const outer: THREE.Vector2[] = [];
  // Rahmen nach außen versetzen (vereinfachte Normalen-Verschiebung)
  for (let i = 0; i < pts.length; i++) {
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(pts.length - 1, i + 1)];
    const t = new THREE.Vector2().subVectors(next, prev).normalize();
    const n = new THREE.Vector2(-t.y, t.x); // links
    outer.push(new THREE.Vector2(pts[i].x - n.x * frame, Math.max(0, pts[i].y - n.y * frame)));
  }
  const shape = new THREE.Shape(outer.concat([...pts].reverse()));
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 4 });
  g.translate(0, 0, -depth / 2);
  return g;
}

/** Tonnengewölbe (halbe Röhre), entlang Z, Breite w, Länge l, Scheitelhöhe rise. */
export function barrelVaultGeo(w: number, l: number, rise: number, seg = 16): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(w / 2, w / 2, l, seg, 1, true, -Math.PI / 2, Math.PI);
  g.rotateX(Math.PI / 2);
  g.rotateZ(Math.PI / 2);
  g.scale(1, rise / (w / 2), 1);
  // Innenseite sichtbar machen: Normalen umdrehen
  const idx = g.getIndex()!;
  for (let i = 0; i < idx.count; i += 3) {
    const a = idx.getX(i);
    idx.setX(i, idx.getX(i + 2));
    idx.setX(i + 2, a);
  }
  const n = g.getAttribute("normal") as THREE.BufferAttribute;
  for (let i = 0; i < n.count; i++) n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i));
  scaleUV(g, (Math.PI * w) / 2, l);
  return g;
}

/** Spitztonne (gotisches Gewölbe) als Lathe-artige Extrusion entlang Z. */
export function pointedVaultGeo(w: number, l: number, rise: number, seg = 10): THREE.BufferGeometry {
  const pts = pointedArchPoints(w, rise, 0, seg).slice(1, -1); // ohne Bodenpunkte
  // nur Bogen ab Kämpfer
  const prof = pts.map((p) => new THREE.Vector2(p.x, p.y));
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let acc = 0;
  const lens = [0];
  for (let i = 1; i < prof.length; i++) {
    acc += prof[i].distanceTo(prof[i - 1]);
    lens.push(acc);
  }
  for (let i = 0; i < prof.length; i++) {
    for (const z of [-l / 2, l / 2]) {
      positions.push(prof[i].x, prof[i].y, z);
      uvs.push(lens[i], z + l / 2);
    }
  }
  for (let i = 0; i < prof.length - 1; i++) {
    const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1;
    indices.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

/** Säule: Basis, Schaft, Kapitell (Lathe). */
export function columnGeo(r: number, h: number, seg = 16): THREE.BufferGeometry {
  const p: THREE.Vector2[] = [];
  const base = Math.min(0.35, h * 0.08);
  const cap = Math.min(0.45, h * 0.09);
  p.push(new THREE.Vector2(0, 0));
  p.push(new THREE.Vector2(r * 1.45, 0));
  p.push(new THREE.Vector2(r * 1.45, base * 0.35));
  p.push(new THREE.Vector2(r * 1.25, base * 0.5));
  p.push(new THREE.Vector2(r * 1.3, base * 0.75));
  p.push(new THREE.Vector2(r * 1.05, base));
  p.push(new THREE.Vector2(r, base * 1.2));
  p.push(new THREE.Vector2(r * 0.94, h * 0.5));
  p.push(new THREE.Vector2(r, h - cap * 1.2));
  p.push(new THREE.Vector2(r * 1.1, h - cap));
  p.push(new THREE.Vector2(r * 1.25, h - cap * 0.6));
  p.push(new THREE.Vector2(r * 1.55, h - cap * 0.25));
  p.push(new THREE.Vector2(r * 1.55, h));
  p.push(new THREE.Vector2(0, h));
  const g = new THREE.LatheGeometry(p, seg);
  return scaleUV(g, Math.PI * 2 * r, h);
}

/** Bündelpfeiler (gotisch): mehrere Dienste um einen Kern. */
export function clusterPierGeo(r: number, h: number): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  parts.push(columnGeo(r, h, 16));
  const n = 8;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const c = cylGeo(r * 0.28, r * 0.28, h * 0.92, 8);
    c.translate(Math.cos(a) * r * 0.95, h * 0.46 + h * 0.04, Math.sin(a) * r * 0.95);
    parts.push(c);
  }
  return mergeAll(parts);
}

/** Geometrien vereinheitlichen und zusammenführen. */
export function normalizeGeo(g: THREE.BufferGeometry): THREE.BufferGeometry {
  let ng = g.index ? g.toNonIndexed() : g;
  if (!ng.getAttribute("normal")) ng.computeVertexNormals();
  if (!ng.getAttribute("uv")) {
    const n = ng.getAttribute("position").count;
    ng.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(n * 2), 2));
  }
  for (const name of Object.keys(ng.attributes)) {
    if (name !== "position" && name !== "normal" && name !== "uv") ng.deleteAttribute(name);
  }
  ng.clearGroups();
  return ng;
}

export function mergeAll(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const norm = geos.map(normalizeGeo);
  const m = mergeGeometries(norm, false)!;
  norm.forEach((g) => g.dispose());
  return m;
}

/** Sammelt statische Geometrie und fasst sie pro Material zusammen (wenige Draw Calls). */
export class StaticBatch {
  private groups = new Map<THREE.Material, { geos: THREE.BufferGeometry[]; cast: boolean; receive: boolean }>();

  add(geo: THREE.BufferGeometry, matrix: THREE.Matrix4 | null, mat: THREE.Material, cast = true, receive = true): void {
    const g = normalizeGeo(geo.clone());
    if (matrix) g.applyMatrix4(matrix);
    let grp = this.groups.get(mat);
    if (!grp) {
      grp = { geos: [], cast, receive };
      this.groups.set(mat, grp);
    }
    grp.cast ||= cast;
    grp.geos.push(g);
  }

  build(parent: THREE.Object3D): THREE.Mesh[] {
    const out: THREE.Mesh[] = [];
    for (const [mat, grp] of this.groups) {
      if (!grp.geos.length) continue;
      // in Blöcke aufteilen, damit Frustum Culling greift (räumlich grob sortieren)
      const chunks = new Map<string, THREE.BufferGeometry[]>();
      for (const g of grp.geos) {
        g.computeBoundingBox();
        const c = g.boundingBox!.getCenter(new THREE.Vector3());
        const key = `${Math.floor(c.x / 24)}:${Math.floor(c.y / 24)}:${Math.floor(c.z / 24)}`;
        let arr = chunks.get(key);
        if (!arr) {
          arr = [];
          chunks.set(key, arr);
        }
        arr.push(g);
      }
      for (const arr of chunks.values()) {
        const merged = mergeGeometries(arr, false);
        arr.forEach((g) => g.dispose());
        if (!merged) continue;
        merged.computeBoundingSphere();
        const mesh = new THREE.Mesh(merged, mat);
        mesh.castShadow = grp.cast;
        mesh.receiveShadow = grp.receive;
        mesh.matrixAutoUpdate = false;
        mesh.updateMatrix();
        parent.add(mesh);
        out.push(mesh);
      }
    }
    this.groups.clear();
    return out;
  }
}
