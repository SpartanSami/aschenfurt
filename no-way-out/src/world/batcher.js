// Statisches Batching: sammelt Quads und Requisiten-Geometrie pro Material und 16x16-m-Chunk
// und verschmilzt sie zu wenigen Draw-Calls (Frustum-Culling bleibt chunkweise wirksam).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { getMat } from '../render/materials.js';

const CHUNK = 16;

export class Batcher {
  constructor() {
    this.quads = new Map();   // key -> {mat, pos:[], nrm:[], uv:[], col:[], idx:[]}
    this.geos = new Map();    // key -> {mat, list:[geo]}
  }
  _qb(matName, cx, cz) {
    const key = matName + '|' + cx + '|' + cz;
    let b = this.quads.get(key);
    if (!b) { b = { mat: matName, pos: [], nrm: [], uv: [], col: [], idx: [] }; this.quads.set(key, b); }
    return b;
  }
  // v: 4 Eckpunkte [x,y,z], n: Normale, uv: 4x [u,v], c: 4 Helligkeiten
  quad(matName, v, n, uv, c) {
    const mx = (v[0][0] + v[2][0]) / 2, mz = (v[0][2] + v[2][2]) / 2;
    const b = this._qb(matName, Math.floor(mx / CHUNK), Math.floor(mz / CHUNK));
    const base = b.pos.length / 3;
    for (let i = 0; i < 4; i++) {
      b.pos.push(v[i][0], v[i][1], v[i][2]);
      b.nrm.push(n[0], n[1], n[2]);
      b.uv.push(uv[i][0], uv[i][1]);
      const k = c ? c[i] : 1;
      b.col.push(k, k, k);
    }
    b.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  // Geometrie (bereits in Weltkoordinaten transformiert) hinzufügen
  geo(mat, geometry, worldX, worldZ) {
    const name = typeof mat === 'string' ? mat : (mat.name || mat.uuid);
    const key = name + '|' + Math.floor(worldX / CHUNK) + '|' + Math.floor(worldZ / CHUNK);
    let b = this.geos.get(key);
    if (!b) { b = { mat, list: [] }; this.geos.set(key, b); }
    b.list.push(geometry);
  }
  build(parent, opts = {}) {
    const meshes = [];
    for (const b of this.quads.values()) {
      if (!b.pos.length) continue;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(b.nrm, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2));
      g.setAttribute('color', new THREE.Float32BufferAttribute(b.col, 3));
      g.setIndex(b.idx);
      g.computeBoundingSphere(); g.computeBoundingBox();
      const mat = vcMat(b.mat);
      const m = new THREE.Mesh(g, mat);
      m.castShadow = true; m.receiveShadow = true;
      m.matrixAutoUpdate = false; m.updateMatrix();
      parent.add(m); meshes.push(m);
    }
    for (const b of this.geos.values()) {
      const list = b.list.map((g) => normalizeGeo(g));
      let merged = null;
      try { merged = mergeGeometries(list, false); } catch (e) { merged = null; }
      if (!merged) { console.warn('Merge fehlgeschlagen', b.mat); continue; }
      merged.computeBoundingSphere(); merged.computeBoundingBox();
      const mat = typeof b.mat === 'string' ? getMat(b.mat) : b.mat;
      const m = new THREE.Mesh(merged, mat);
      m.castShadow = !opts.noShadow; m.receiveShadow = true;
      m.matrixAutoUpdate = false; m.updateMatrix();
      parent.add(m); meshes.push(m);
      for (const g of list) g.dispose();
    }
    this.quads.clear(); this.geos.clear();
    return meshes;
  }
}

// Variante eines Materials mit Vertex-Farben (Ambient Occlusion)
const vcCache = new Map();
function vcMat(name) {
  if (vcCache.has(name)) return vcCache.get(name);
  const base = getMat(name);
  const m = base.clone();
  m.vertexColors = true;
  m.onBeforeCompile = base.onBeforeCompile;
  m.customProgramCacheKey = base.customProgramCacheKey;
  m.userData = { ...base.userData };
  m.name = name + '+vc';
  vcCache.set(name, m);
  return m;
}

// Alle Geometrien auf gleiche Attribute bringen (position, normal, uv), nicht-indiziert
function normalizeGeo(g) {
  let ng = g.index ? g.toNonIndexed() : g;
  if (ng !== g) g.dispose();
  if (!ng.attributes.normal) ng.computeVertexNormals();
  if (!ng.attributes.uv) {
    const n = ng.attributes.position.count;
    ng.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(n * 2), 2));
  }
  for (const k of Object.keys(ng.attributes)) if (!['position', 'normal', 'uv'].includes(k)) ng.deleteAttribute(k);
  ng.morphAttributes = {};
  ng.clearGroups();
  return ng;
}
