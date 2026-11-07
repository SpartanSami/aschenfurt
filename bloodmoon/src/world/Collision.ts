import * as THREE from "three";
import { MeshBVH } from "three-mesh-bvh";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** Dynamisches Hindernis (z. B. geschlossene Tür) als achsenparallele Box. */
export interface Blocker {
  id: string;
  box: THREE.Box3;
  enabled: boolean;
}

/** Bewegliche Kreis-Kollider (NPCs, Gegner). */
export interface CircleCollider {
  pos: THREE.Vector3;
  radius: number;
  height: number;
  enabled: boolean;
  owner?: unknown;
}

const _segment = new THREE.Line3();
const _box = new THREE.Box3();
const _triPoint = new THREE.Vector3();
const _capPoint = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _newPos = new THREE.Vector3();
const _delta = new THREE.Vector3();
const _ray = new THREE.Ray();

export interface CapsuleBody {
  pos: THREE.Vector3; // Fußposition
  vel: THREE.Vector3;
  radius: number;
  height: number;
  onGround: boolean;
  /** optionaler Eigentümer – damit eigene Kreis-Kollider ignoriert werden */
  self?: CircleCollider;
}

export class CollisionWorld {
  private pending: THREE.BufferGeometry[] = [];
  bvh: MeshBVH | null = null;
  geometry: THREE.BufferGeometry | null = null;
  blockers: Blocker[] = [];
  circles: CircleCollider[] = [];
  gravity = -22;
  debugMesh: THREE.Mesh | null = null;

  addGeometry(geo: THREE.BufferGeometry, matrix?: THREE.Matrix4): void {
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    const pos = g.getAttribute("position");
    const clean = new THREE.BufferGeometry();
    clean.setAttribute("position", pos.clone());
    if (matrix) clean.applyMatrix4(matrix);
    this.pending.push(clean);
    if (g !== geo) g.dispose();
  }

  /** Box in Weltkoordinaten (Mittelpunkt, Größe, optionale Y-Rotation). */
  addBox(center: THREE.Vector3 | [number, number, number], size: [number, number, number], rotY = 0): void {
    const c = Array.isArray(center) ? new THREE.Vector3(...center) : center;
    const g = new THREE.BoxGeometry(size[0], size[1], size[2]);
    const m = new THREE.Matrix4().makeRotationY(rotY).setPosition(c);
    this.addGeometry(g, m);
    g.dispose();
  }

  /** Box über min/max-Ecken. */
  addBoxMinMax(min: [number, number, number], max: [number, number, number]): void {
    const size: [number, number, number] = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
    this.addBox([(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2], size);
  }

  /** Rampe (für Treppen): von a nach b, Breite w, unten eine dünne Platte. */
  addRamp(a: THREE.Vector3, b: THREE.Vector3, width: number): void {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const horiz = Math.hypot(dir.x, dir.z);
    const g = new THREE.BoxGeometry(width, 0.2, len + 0.1);
    const yaw = Math.atan2(dir.x, dir.z);
    const pitch = -Math.atan2(dir.y, horiz);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, 0, "YXZ"));
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    // Oberfläche auf die Linie a-b legen
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(q).multiplyScalar(-0.1);
    m.compose(mid.add(up), q, new THREE.Vector3(1, 1, 1));
    this.addGeometry(g, m);
    g.dispose();
  }

  addMesh(mesh: THREE.Mesh): void {
    mesh.updateMatrixWorld(true);
    this.addGeometry(mesh.geometry, mesh.matrixWorld);
  }

  addBlocker(id: string, box: THREE.Box3, enabled = true): Blocker {
    const b = { id, box, enabled };
    this.blockers.push(b);
    return b;
  }

  build(): void {
    if (this.pending.length === 0) {
      // Leere Welt: kleine Platte, damit BVH gültig ist
      this.addBox([0, -1000, 0], [1, 1, 1]);
    }
    this.geometry = mergeGeometries(this.pending, false);
    this.pending.forEach((g) => g.dispose());
    this.pending = [];
    this.bvh = new MeshBVH(this.geometry, { targetLeafSize: 8 });
  }

  dispose(): void {
    this.geometry?.dispose();
    this.geometry = null;
    this.bvh = null;
    this.blockers = [];
    this.circles = [];
  }

  /** Bewegt eine Kapsel mit Kollisionsauflösung. horizontal: gewünschte Bewegung (m/s). */
  move(body: CapsuleBody, horizontal: THREE.Vector3, dt: number, steps = 4): void {
    const sdt = dt / steps;
    for (let s = 0; s < steps; s++) {
      if (body.onGround) body.vel.y = sdt * this.gravity;
      else body.vel.y += sdt * this.gravity;
      body.vel.y = Math.max(body.vel.y, -30);
      body.pos.x += (horizontal.x + body.vel.x) * sdt;
      body.pos.z += (horizontal.z + body.vel.z) * sdt;
      body.pos.y += body.vel.y * sdt;
      this.resolve(body, sdt);
    }
  }

  private resolve(body: CapsuleBody, sdt: number): void {
    if (!this.bvh) return;
    const r = body.radius;
    _segment.start.set(body.pos.x, body.pos.y + r, body.pos.z);
    _segment.end.set(body.pos.x, body.pos.y + body.height - r, body.pos.z);
    _box.makeEmpty();
    _box.expandByPoint(_segment.start);
    _box.expandByPoint(_segment.end);
    _box.min.addScalar(-r);
    _box.max.addScalar(r);

    this.bvh.shapecast({
      intersectsBounds: (box) => box.intersectsBox(_box),
      intersectsTriangle: (tri) => {
        const distance = tri.closestPointToSegment(_segment, _triPoint, _capPoint);
        if (distance < r) {
          const depth = r - distance;
          _dir.subVectors(_capPoint, _triPoint).normalize();
          _segment.start.addScaledVector(_dir, depth);
          _segment.end.addScaledVector(_dir, depth);
        }
        return false;
      },
    });

    _newPos.set(_segment.start.x, _segment.start.y - r, _segment.start.z);
    _delta.subVectors(_newPos, body.pos);
    body.onGround = _delta.y > Math.abs(sdt * body.vel.y * 0.25);
    const offset = Math.max(0, _delta.length() - 1e-5);
    _delta.normalize().multiplyScalar(offset);
    body.pos.add(_delta);
    if (!body.onGround) {
      _delta.normalize();
      body.vel.addScaledVector(_delta, -_delta.dot(body.vel));
    } else {
      body.vel.set(0, 0, 0);
    }

    // Dynamische Blocker (Türen) – Kreis gegen Rechteck in XZ
    for (const b of this.blockers) {
      if (!b.enabled) continue;
      if (body.pos.y + body.height < b.box.min.y || body.pos.y > b.box.max.y) continue;
      const cx = THREE.MathUtils.clamp(body.pos.x, b.box.min.x, b.box.max.x);
      const cz = THREE.MathUtils.clamp(body.pos.z, b.box.min.z, b.box.max.z);
      let dx = body.pos.x - cx;
      let dz = body.pos.z - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 < r * r) {
        if (d2 < 1e-8) {
          // Mittelpunkt in der Box: zur nächsten Kante schieben
          const pens = [
            body.pos.x - b.box.min.x, b.box.max.x - body.pos.x,
            body.pos.z - b.box.min.z, b.box.max.z - body.pos.z,
          ];
          const i = pens.indexOf(Math.min(...pens));
          if (i === 0) body.pos.x = b.box.min.x - r;
          else if (i === 1) body.pos.x = b.box.max.x + r;
          else if (i === 2) body.pos.z = b.box.min.z - r;
          else body.pos.z = b.box.max.z + r;
        } else {
          const d = Math.sqrt(d2);
          dx /= d;
          dz /= d;
          body.pos.x = cx + dx * r;
          body.pos.z = cz + dz * r;
        }
      }
    }

    // Charaktere
    for (const c of this.circles) {
      if (!c.enabled || c === body.self) continue;
      if (body.pos.y + body.height < c.pos.y || body.pos.y > c.pos.y + c.height) continue;
      const dx = body.pos.x - c.pos.x;
      const dz = body.pos.z - c.pos.z;
      const min = r + c.radius;
      const d2 = dx * dx + dz * dz;
      if (d2 < min * min && d2 > 1e-8) {
        const d = Math.sqrt(d2);
        body.pos.x = c.pos.x + (dx / d) * min;
        body.pos.z = c.pos.z + (dz / d) * min;
      }
    }
  }

  /** Erster Treffer eines Strahls gegen statische Geometrie (Distanz oder null). */
  raycast(origin: THREE.Vector3, dir: THREE.Vector3, far = 100): number | null {
    if (!this.bvh) return null;
    _ray.origin.copy(origin);
    _ray.direction.copy(dir).normalize();
    const hit = this.bvh.raycastFirst(_ray, THREE.DoubleSide, 0, far);
    if (!hit) return null;
    return hit.distance <= far ? hit.distance : null;
  }

  /** Sichtlinie zwischen zwei Punkten frei? (auch Türen werden berücksichtigt) */
  lineOfSight(a: THREE.Vector3, b: THREE.Vector3): boolean {
    _dir.subVectors(b, a);
    const len = _dir.length();
    if (len < 1e-4) return true;
    const d = this.raycast(a, _dir, len);
    if (d !== null && d < len - 0.05) return false;
    _ray.origin.copy(a);
    _ray.direction.copy(_dir).normalize();
    for (const bl of this.blockers) {
      if (!bl.enabled) continue;
      const p = _ray.intersectBox(bl.box, _triPoint);
      if (p && p.distanceTo(a) < len - 0.05) return false;
    }
    return true;
  }

  /** Bodenhöhe unter einem Punkt. */
  groundHeight(x: number, z: number, fromY = 50): number | null {
    const d = this.raycast(_capPoint.set(x, fromY, z), _dir.set(0, -1, 0), fromY + 50);
    return d === null ? null : fromY - d;
  }

  createDebugMesh(): THREE.Mesh | null {
    if (!this.geometry) return null;
    const m = new THREE.Mesh(this.geometry, new THREE.MeshBasicMaterial({ wireframe: true, color: 0x00ff88, transparent: true, opacity: 0.25 }));
    this.debugMesh = m;
    return m;
  }
}
