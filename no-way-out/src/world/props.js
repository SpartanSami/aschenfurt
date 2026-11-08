// Requisiten-Fabrik: baut Möbel, Geräte, Fahrzeuge etc. aus einfachen Grundkörpern.
// Jeder Builder liefert statische Teile (werden gebatcht), dynamische Objekte, Kollider,
// Versteckmöglichkeiten, Lichter und Interaktionen.
import * as THREE from 'three';
import { getMat, colorMat, emissiveMat, screenMat, signMat } from '../render/materials.js';

export const PROPS = {};

// ---------- Geometrie-Helfer ----------
export function boxGeo(w, h, d, uvs = 1) {
  const g = new THREE.BoxGeometry(w, h, d);
  if (!uvs) return g; // Schilder/Bildschirme: Textur genau einmal pro Fläche
  const uv = g.attributes.uv;
  const spans = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
    const i = f * 4 + k;
    uv.setXY(i, uv.getX(i) * spans[f][0] / uvs, uv.getY(i) * spans[f][1] / uvs);
  }
  return g;
}
const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler(), tmpS = new THREE.Vector3(1, 1, 1), tmpP = new THREE.Vector3();
function place(g, x, y, z, rx = 0, ry = 0, rz = 0) {
  tmpE.set(rx, ry, rz); tmpQ.setFromEuler(tmpE); tmpP.set(x, y, z);
  tmpM.compose(tmpP, tmpQ, tmpS);
  g.applyMatrix4(tmpM);
  return g;
}

export class PropCtx {
  constructor(o = {}) {
    this.o = o;
    this.parts = [];      // {geo, mat}
    this.dyn = [];        // Object3D (lokal)
    this.colliders = [];  // {x0,z0,x1,z1,y0,y1, vault, cover, tall, noFlag}
    this.hides = [];
    this.lights = [];
    this.interacts = [];
    this.flags = [];      // zusätzliche Zellmarkierungen
    this.sounds = [];
  }
  m(mat) { return typeof mat === 'string' ? getMat(mat) : mat; }
  // Quader, Mittelpunkt (x, y, z)
  box(w, h, d, mat, x, y, z, r = {}) {
    // Beschriftete Flächen (Schilder, Bildschirme) nicht kacheln, sondern einpassen
    const fit = typeof mat !== 'string' && mat && /^(sign|screen):/.test(mat.name || '');
    const g = place(boxGeo(w, h, d, fit ? 0 : (r.uvs || 1)), x, y, z, r.rx || 0, r.ry || 0, r.rz || 0);
    if (r.dyn) { const mesh = new THREE.Mesh(g, this.m(mat)); mesh.castShadow = true; mesh.receiveShadow = true; r.dyn.add(mesh); return mesh; }
    this.parts.push({ geo: g, mat });
    return g;
  }
  cyl(rt, rb, h, mat, x, y, z, r = {}) {
    const g = place(new THREE.CylinderGeometry(rt, rb, h, r.seg || 10, 1, !!r.open), x, y, z, r.rx || 0, r.ry || 0, r.rz || 0);
    if (r.dyn) { const mesh = new THREE.Mesh(g, this.m(mat)); mesh.castShadow = true; r.dyn.add(mesh); return mesh; }
    this.parts.push({ geo: g, mat });
    return g;
  }
  sphere(rad, mat, x, y, z, r = {}) {
    const g = new THREE.SphereGeometry(rad, r.seg || 10, r.segH || 8);
    if (r.sx || r.sy || r.sz) g.scale(r.sx || 1, r.sy || 1, r.sz || 1);
    place(g, x, y, z, r.rx || 0, r.ry || 0, r.rz || 0);
    if (r.dyn) { const mesh = new THREE.Mesh(g, this.m(mat)); mesh.castShadow = true; r.dyn.add(mesh); return mesh; }
    this.parts.push({ geo: g, mat });
    return g;
  }
  plane(w, h, mat, x, y, z, r = {}) {
    const g = place(new THREE.PlaneGeometry(w, h), x, y, z, r.rx || 0, r.ry || 0, r.rz || 0);
    if (r.dyn) { const mesh = new THREE.Mesh(g, this.m(mat)); r.dyn.add(mesh); return mesh; }
    this.parts.push({ geo: g, mat });
    return g;
  }
  col(x0, z0, x1, z1, y0, y1, f = {}) { this.colliders.push({ x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1), y0, y1, ...f }); }
  colBox(w, d, h, f = {}, cx = 0, cz = 0) { this.col(cx - w / 2, cz - d / 2, cx + w / 2, cz + d / 2, 0, h, f); }
  group() { const g = new THREE.Group(); this.dyn.push(g); return g; }
}

const rngFrom = (o) => { let s = Math.floor((o.seed ?? ((o.x || 0) * 73 + (o.z || 0) * 151)) * 9301 + 49297) % 233280; return () => (s = (s * 9301 + 49297) % 233280) / 233280; };

// ================= Krankenhaus =================
PROPS.bed = (c, o) => {
  const W = 0.95, L = 2.08;
  const frame = 'metal', mat = o.blood ? 'mattress_blood' : 'mattress';
  c.box(W - 0.08, 0.12, L - 0.1, frame, 0, 0.42, 0);
  c.box(0.08, 0.3, 0.08, frame, -0.38, 0.2, -0.9); c.box(0.08, 0.3, 0.08, frame, 0.38, 0.2, -0.9);
  c.box(0.08, 0.3, 0.08, frame, -0.38, 0.2, 0.9); c.box(0.08, 0.3, 0.08, frame, 0.38, 0.2, 0.9);
  for (const [x, z] of [[-0.38, -0.9], [0.38, -0.9], [-0.38, 0.9], [0.38, 0.9]]) c.cyl(0.05, 0.05, 0.04, 'rubber', x, 0.05, z, { rz: Math.PI / 2 });
  c.box(W - 0.12, 0.15, L - 0.18, mat, 0, 0.555, 0);
  if (!o.noSheet) c.box(W - 0.1, 0.03, L * 0.55, o.blood ? 'sheet_blood' : 'sheet', 0, 0.64, 0.35);
  c.box(0.55, 0.1, 0.35, 'sheet', 0, 0.68, -0.78);
  c.box(W, 0.55, 0.05, 'plastic_white', 0, 0.75, -L / 2);
  c.box(W, 0.4, 0.05, 'plastic_white', 0, 0.68, L / 2);
  c.box(0.03, 0.18, 1.1, 'chrome', -W / 2 + 0.02, 0.78, -0.1);
  if (!o.railDown) c.box(0.03, 0.18, 1.1, 'chrome', W / 2 - 0.02, 0.78, -0.1);
  if (o.body) { // Leiche unter Laken
    c.box(0.5, 0.18, 1.6, o.blood ? 'sheet_blood' : 'sheet', 0, 0.72, 0.05);
    c.sphere(0.13, 'sheet', 0, 0.75, -0.72, { sy: 0.8 });
  }
  c.col(-W / 2, -L / 2, W / 2, L / 2, 0, 0.85, { cover: false });
  if (o.hide) c.hides.push({ type: 'bed', ex: 0, ez: 0, ey: 0.22, exitX: o.exitSide === 'left' ? -1.0 : 1.0, exitZ: 0, yaw: o.exitSide === 'left' ? Math.PI / 2 : -Math.PI / 2, prompt: 'Unter das Bett kriechen' });
};
PROPS.bed_flipped = (c) => {
  // Umgekipptes Bett – Hindernis zum Überklettern
  c.box(2.0, 0.85, 0.12, 'metal', 0, 0.48, 0);
  c.box(1.9, 0.7, 0.16, 'mattress', 0, 0.45, 0.16, { rx: 0.25 });
  c.box(0.05, 0.9, 0.9, 'plastic_white', -1.0, 0.45, 0.3);
  for (const x of [-0.9, 0.9]) for (const z of [-0.25]) c.cyl(0.05, 0.05, 0.04, 'rubber', x, 0.9, z);
  c.col(-1.02, -0.35, 1.02, 0.4, 0, 0.92, { vault: true, cover: true });
};
PROPS.gurney = (c, o) => {
  c.box(0.62, 0.06, 1.9, 'steel', 0, 0.82, 0);
  c.box(0.6, 0.08, 1.85, o.blood ? 'mattress_blood' : 'mattress', 0, 0.88, 0);
  for (const z of [-0.8, 0.8]) for (const x of [-0.25, 0.25]) { c.box(0.04, 0.8, 0.04, 'steel', x, 0.42, z); c.cyl(0.05, 0.05, 0.04, 'rubber', x, 0.05, z, { rz: Math.PI / 2 }); }
  if (o.body) c.box(0.45, 0.2, 1.6, o.blood ? 'sheet_blood' : 'sheet', 0, 1.02, 0);
  c.col(-0.32, -0.95, 0.32, 0.95, 0, 0.95, { vault: !!o.vault });
};
PROPS.ivstand = (c, o) => {
  c.cyl(0.015, 0.015, 1.9, 'chrome', 0, 0.95, 0);
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; c.box(0.3, 0.02, 0.03, 'chrome', Math.cos(a) * 0.15, 0.05, Math.sin(a) * 0.15, { ry: -a }); }
  c.box(0.3, 0.015, 0.015, 'chrome', 0, 1.88, 0);
  if (!o.empty) c.box(0.1, 0.18, 0.04, colorMat(0xd8e6e2, 0.2, 0, { transparent: true, opacity: 0.7 }), 0.12, 1.72, 0);
  c.col(-0.12, -0.12, 0.12, 0.12, 0, 1.9, { noFlag: true });
};
PROPS.wheelchair = (c) => {
  c.box(0.45, 0.05, 0.45, 'fabric_dark', 0, 0.48, 0); c.box(0.45, 0.45, 0.05, 'fabric_dark', 0, 0.75, -0.22);
  for (const x of [-0.27, 0.27]) { c.cyl(0.3, 0.3, 0.03, 'rubber', x, 0.3, -0.05, { rz: Math.PI / 2, seg: 16 }); c.box(0.02, 0.3, 0.5, 'chrome', x - Math.sign(x) * 0.03, 0.6, 0); }
  c.col(-0.32, -0.35, 0.32, 0.35, 0, 0.95, { noFlag: true });
};
PROPS.counter = (c, o) => {
  const w = o.w || 3, d = o.d || 0.8, h = o.h || 1.08;
  c.box(w, h - 0.05, d - 0.1, o.mat || 'wood_light', 0, (h - 0.05) / 2, 0.05);
  c.box(w + 0.05, 0.05, d, 'plastic_white', 0, h - 0.025, 0);
  c.box(w, 0.05, d * 0.5, 'plastic_grey', 0, 0.78, -d * 0.2);
  if (o.monitors) for (let i = 0; i < o.monitors; i++) {
    const x = -w / 2 + (i + 0.5) * (w / o.monitors);
    c.box(0.5, 0.32, 0.03, o.alarm ? screenMat('alarm', { text: 'ALARM', sub: 'QUARANTÄNE · STATION 3' }) : screenMat('ui'), x, h + 0.25, -0.15, { ry: Math.PI });
    c.box(0.06, 0.12, 0.06, 'plastic_dark', x, h + 0.06, -0.15);
  }
  if (o.papers) for (let i = 0; i < 4; i++) c.box(0.21, 0.004, 0.3, 'paper', -w / 2 + 0.4 + i * 0.6, h + 0.003, 0.1, { ry: i * 0.4 });
  c.col(-w / 2, -d / 2, w / 2, d / 2, 0, h, { cover: true });
};
PROPS.desk = (c, o) => {
  const w = o.w || 1.4, d = o.d || 0.7;
  c.box(w, 0.04, d, o.mat || 'wood_light', 0, 0.74, 0);
  for (const x of [-w / 2 + 0.04, w / 2 - 0.04]) c.box(0.04, 0.72, d - 0.05, 'metal_dark', x, 0.36, 0);
  if (o.monitor !== false) { c.box(0.52, 0.32, 0.03, o.screen ? screenMat(o.screen, o.screenOpts || {}) : 'screen_off', 0, 1.0, -d / 2 + 0.15); c.box(0.05, 0.14, 0.05, 'plastic_dark', 0, 0.82, -d / 2 + 0.17); c.box(0.4, 0.02, 0.14, 'plastic_dark', 0, 0.77, 0.05); }
  if (o.papers) for (let i = 0; i < 3; i++) c.box(0.21, 0.004, 0.3, 'paper', w / 2 - 0.3 - i * 0.12, 0.765, 0.1, { ry: i * 0.5 });
  if (o.chair !== false) PROPS.chair(c, { x: 0.1, z: d / 2 + 0.25, rot: Math.PI * (o.chairTurn || 0) });
  c.col(-w / 2, -d / 2, w / 2, d / 2, 0, 0.78, { cover: false });
};
PROPS.chair = (c, o = {}) => {
  const x = o.x || 0, z = o.z || 0;
  c.box(0.46, 0.06, 0.44, 'fabric_dark', x, 0.46, z);
  c.box(0.46, 0.5, 0.05, 'fabric_dark', x, 0.75, z + 0.22);
  c.cyl(0.03, 0.03, 0.42, 'metal_dark', x, 0.22, z);
  c.box(0.5, 0.03, 0.06, 'metal_dark', x, 0.03, z); c.box(0.06, 0.03, 0.5, 'metal_dark', x, 0.03, z);
};
PROPS.locker = (c, o) => {
  const W = 0.55, D = 0.52, H = 1.95;
  const m = o.mat || 'metal';
  c.box(W, H, 0.03, m, 0, H / 2, -D / 2 + 0.015);
  c.box(0.03, H, D, m, -W / 2 + 0.015, H / 2, 0); c.box(0.03, H, D, m, W / 2 - 0.015, H / 2, 0);
  c.box(W, 0.03, D, m, 0, H - 0.015, 0); c.box(W, 0.05, D, m, 0, 0.025, 0);
  // Tür mit Lüftungsschlitzen (dynamisch, Scharnier links)
  const door = c.group(); door.position.set(-W / 2 + 0.02, 0, D / 2 - 0.01);
  const dmat = getMat(m);
  for (let i = 0; i < 9; i++) {
    const y0 = i < 6 ? 0.06 + i * 0.22 : 1.38 + (i - 6) * 0.19;
    const h = i < 6 ? 0.2 : 0.11;
    c.box(W - 0.04, h, 0.02, dmat, (W - 0.04) / 2, y0 + h / 2, 0, { dyn: door });
  }
  c.box(0.03, 0.12, 0.03, 'chrome', W - 0.1, 1.1, 0.02, { dyn: door });
  door.userData.kind = 'lockerDoor';
  c.col(-W / 2, -D / 2, W / 2, D / 2, 0, H, { tall: true });
  if (o.hide !== false) c.hides.push({ type: 'locker', ex: 0, ez: -0.02, ey: 1.52, exitX: 0, exitZ: 0.85, yaw: Math.PI, door, prompt: 'Im Spind verstecken' });
};
PROPS.cabinet = (c, o) => {
  const w = o.w || 1.0, d = o.d || 0.45, h = o.h || 2.0;
  c.box(w, h, d, o.mat || 'plastic_white', 0, h / 2, 0);
  c.box(w * 0.48, h * 0.9, 0.01, 'glass_frost', -w * 0.25, h * 0.52, d / 2 + 0.006);
  c.box(w * 0.48, h * 0.9, 0.01, 'glass_frost', w * 0.25, h * 0.52, d / 2 + 0.006);
  c.col(-w / 2, -d / 2, w / 2, d / 2, 0, h, { tall: true });
};
PROPS.shelf = (c, o) => {
  const w = o.w || 1.2, d = o.d || 0.5, h = o.h || 2.0;
  const r = rngFrom(o);
  for (const x of [-w / 2, w / 2]) for (const z of [-d / 2, d / 2]) c.box(0.04, h, 0.04, 'metal_dark', x, h / 2, z);
  for (let i = 0; i < 5; i++) {
    const y = 0.1 + i * (h - 0.15) / 4;
    c.box(w, 0.03, d, 'metal', 0, y, 0);
    if (i < 4) for (let k = 0; k < 3; k++) if (r() < 0.7) { const bw = 0.2 + r() * 0.2; c.box(bw, 0.15 + r() * 0.2, d * 0.7, r() < 0.5 ? 'wood' : 'plastic_white', -w / 2 + 0.2 + k * (w / 3), y + 0.13, 0); }
  }
  c.col(-w / 2, -d / 2, w / 2, d / 2, 0, h, { tall: true });
};
PROPS.curtain = (c, o) => {
  const w = o.w || 2.2;
  c.box(w, 0.03, 0.03, 'chrome', 0, 2.75, 0);
  const n = Math.ceil(w / 0.3);
  for (let i = 0; i < n; i++) c.box(w / n * 0.9, 2.05, 0.02, 'curtain', -w / 2 + (i + 0.5) * (w / n), 1.7, (i % 2) * 0.06, { ry: (i % 2 ? 0.2 : -0.2) });
  c.flags.push({ x0: -w / 2, z0: -0.1, x1: w / 2, z1: 0.1, tall: true });
};
PROPS.monitor_stand = (c, o) => {
  c.cyl(0.02, 0.02, 1.3, 'chrome', 0, 0.65, 0);
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; c.box(0.25, 0.02, 0.03, 'chrome', Math.cos(a) * 0.12, 0.04, Math.sin(a) * 0.12, { ry: -a }); }
  c.box(0.36, 0.28, 0.12, 'plastic_grey', 0, 1.42, 0);
  c.box(0.3, 0.2, 0.01, screenMat('ecg', { text: o.flat ? '---' : 'HF 0', color: o.flat ? '#ff5555' : '#2cff7a' }), 0, 1.43, 0.065);
  c.col(-0.15, -0.15, 0.15, 0.15, 0, 1.6, { noFlag: true });
  if (o.beep !== false) c.sounds.push({ kind: o.flat ? 'flatline' : 'beep', x: 0, z: 0 });
};
PROPS.optable = (c) => {
  c.box(0.6, 0.08, 2.0, 'steel', 0, 0.9, 0);
  c.box(0.58, 0.06, 1.9, 'fabric_dark', 0, 0.97, 0);
  c.cyl(0.18, 0.25, 0.85, 'steel', 0, 0.43, 0);
  c.col(-0.32, -1.0, 0.32, 1.0, 0, 1.0, {});
};
PROPS.oplamp = (c, o) => {
  const g = c.group(); g.position.set(0, o.y || 2.95, 0);
  c.cyl(0.02, 0.02, 0.7, 'chrome', 0, -0.35, 0, { dyn: g });
  c.cyl(0.38, 0.45, 0.14, 'plastic_white', 0, -0.75, 0, { dyn: g, seg: 20 });
  const lamp = c.cyl(0.33, 0.33, 0.02, emissiveMat(0xfff4e0, 3.0, 0xffffff), 0, -0.83, 0, { dyn: g, seg: 20 });
  g.userData.kind = o.swing ? 'swing' : 'static';
  g.userData.lampMesh = lamp;
};
PROPS.cart = (c, o) => {
  c.box(0.6, 0.03, 0.45, 'steel', 0, 0.9, 0); c.box(0.6, 0.03, 0.45, 'steel', 0, 0.45, 0); c.box(0.6, 0.03, 0.45, 'steel', 0, 0.12, 0);
  for (const x of [-0.28, 0.28]) for (const z of [-0.2, 0.2]) c.box(0.025, 0.9, 0.025, 'steel', x, 0.45, z);
  const r = rngFrom(o);
  for (let i = 0; i < 4; i++) c.box(0.06 + r() * 0.08, 0.05 + r() * 0.1, 0.06, r() < 0.5 ? 'plastic_white' : 'plastic_blue', -0.2 + i * 0.13, 0.95, -0.05 + r() * 0.1);
  c.col(-0.32, -0.25, 0.32, 0.25, 0, 0.95, { noFlag: !o.flag });
};
PROPS.sink = (c) => {
  c.box(0.6, 0.18, 0.45, 'plastic_white', 0, 0.85, 0);
  c.cyl(0.02, 0.02, 0.25, 'chrome', 0, 1.0, -0.15);
  c.box(0.5, 0.6, 0.02, colorMat(0xa8b4b8, 0.05, 0.9), 0, 1.45, -0.2);
  c.col(-0.3, -0.22, 0.3, 0.22, 0, 0.95, { noFlag: true });
};
PROPS.vending = (c, o) => {
  c.box(0.9, 1.85, 0.75, o.color ? colorMat(o.color, 0.4, 0.2) : 'plastic_red', 0, 0.925, 0);
  c.box(0.6, 1.3, 0.02, o.off ? 'glass_dark' : emissiveMat(0xdfe8ff, 0.9, 0x334455), -0.1, 1.05, 0.38);
  c.box(0.18, 0.3, 0.02, 'plastic_dark', 0.32, 1.2, 0.38);
  c.col(-0.45, -0.38, 0.45, 0.38, 0, 1.85, { tall: true });
  if (!o.off) c.lights.push({ x: 0, z: 0.6, y: 1.1, color: 0xcfe0ff, intensity: 1.6, range: 3.2, mode: o.flicker ? 'flicker' : 'steady', noMesh: true });
};
PROPS.chairs_row = (c, o) => {
  const n = o.n || 4;
  for (let i = 0; i < n; i++) {
    const x = -(n - 1) * 0.28 + i * 0.56;
    c.box(0.5, 0.05, 0.45, 'plastic_blue', x, 0.45, 0); c.box(0.5, 0.45, 0.04, 'plastic_blue', x, 0.72, -0.22, { rx: -0.1 });
  }
  c.box(n * 0.56, 0.05, 0.08, 'metal_dark', 0, 0.4, 0);
  c.box(0.05, 0.4, 0.3, 'metal_dark', -(n - 1) * 0.28, 0.2, 0); c.box(0.05, 0.4, 0.3, 'metal_dark', (n - 1) * 0.28, 0.2, 0);
  c.col(-n * 0.28, -0.25, n * 0.28, 0.25, 0, 0.9, { vault: !!o.vault });
};
PROPS.plant = (c) => {
  c.cyl(0.22, 0.17, 0.4, 'plastic_dark', 0, 0.2, 0); c.cyl(0.2, 0.2, 0.02, 'soil', 0, 0.39, 0);
  for (let i = 0; i < 7; i++) { const a = i * 0.9; c.box(0.06, 0.6, 0.18, 'plant', Math.cos(a) * 0.1, 0.7, Math.sin(a) * 0.1, { rz: Math.cos(a) * 0.4, rx: Math.sin(a) * 0.4 }); }
  c.col(-0.22, -0.22, 0.22, 0.22, 0, 1.0, { noFlag: true });
};
PROPS.boxes = (c, o) => {
  const r = rngFrom(o);
  const n = o.n || 4;
  for (let i = 0; i < n; i++) { const s = 0.35 + r() * 0.25; c.box(s, s * 0.8, s, 'wood', (r() - 0.5) * 0.7, (i % 2) * 0.38 + s * 0.4, (r() - 0.5) * 0.6, { ry: r() }); }
  c.col(-0.5, -0.45, 0.5, 0.45, 0, 0.9, { vault: o.vault !== false, cover: true });
};
PROPS.debris = (c, o) => {
  const r = rngFrom(o);
  const w = o.w || 1.6;
  for (let i = 0; i < 9; i++) c.box(0.3 + r() * 0.6, 0.04 + r() * 0.1, 0.3 + r() * 0.5, r() < 0.5 ? 'h_ceil' : 'concrete', (r() - 0.5) * w, 0.05 + r() * 0.35, (r() - 0.5) * 0.7, { rx: r() * 0.6, rz: r() * 0.6, ry: r() * 3 });
  c.box(w * 0.8, 0.5, 0.6, 'concrete_dark', 0, 0.25, 0, { rx: 0.1 });
  if (o.pipe) c.cyl(0.08, 0.08, w * 1.2, 'metal_rust', 0, 0.7, 0.1, { rz: Math.PI / 2 + 0.15 });
  c.col(-w / 2, -0.4, w / 2, 0.4, 0, 0.8, { vault: true, cover: false });
};
PROPS.body = (c, o) => {
  // Leiche (nicht animiert) – Kleidung je nach Variante
  const cloth = o.cloth || 'sheet';
  c.box(0.42, 0.2, 0.9, cloth, 0, 0.1, 0);
  c.box(0.36, 0.15, 0.85, 'fabric_dark', 0, 0.08, 0.85);
  c.sphere(0.12, 'skin_human', 0, 0.12, -0.6, { sy: 0.9 });
  c.box(0.12, 0.1, 0.6, cloth, -0.32, 0.06, -0.05, { ry: 0.5 });
  c.box(0.12, 0.1, 0.6, cloth, 0.32, 0.06, 0.1, { ry: -0.3 });
  if (o.sheet) c.box(0.65, 0.12, 2.0, o.blood ? 'sheet_blood' : 'sheet', 0, 0.2, 0.3);
};
PROPS.barrels = (c, o) => {
  const n = o.n || 3;
  for (let i = 0; i < n; i++) { const x = (i % 2) * 0.62 - 0.3, z = Math.floor(i / 2) * 0.62 - 0.3; c.cyl(0.29, 0.29, 0.88, o.mat || 'plastic_yellow', x, 0.44, z, { seg: 14 }); c.cyl(0.3, 0.3, 0.04, 'plastic_dark', x, 0.6, z, { seg: 14 }); }
  c.col(-0.6, -0.6, 0.6, 0.6, 0, 0.9, { cover: true });
};
PROPS.wallclock = (c) => { c.cyl(0.17, 0.17, 0.04, 'plastic_white', 0, 2.25, 0.02, { rx: Math.PI / 2, seg: 18 }); c.box(0.01, 0.12, 0.01, 'black', 0.03, 2.27, 0.05, { rz: -0.8 }); c.box(0.01, 0.08, 0.01, 'black', -0.02, 2.24, 0.05, { rz: 1.2 }); };
PROPS.whiteboard = (c, o) => { c.box(o.w || 1.6, 1.0, 0.03, 'paint_white', 0, 1.5, 0.015); c.box((o.w || 1.6) + 0.06, 0.04, 0.06, 'steel', 0, 0.98, 0.04); };
PROPS.poster = (c, o) => { c.box(o.w || 0.6, o.h || 0.85, 0.005, signMat(o.text || 'HÄNDE\nDESINFIZIEREN', { bg: o.bg || '#e8eef0', fg: o.fg || '#1d4f72', w: 256, h: 360, fontPx: 34 }), 0, o.y || 1.5, 0.006); };
PROPS.exit_sign = (c, o) => {
  c.box(0.42, 0.16, 0.05, signMat('🏃 NOTAUSGANG', { bg: '#0d8a44', glow: true, intensity: 2.2, w: 256, h: 96, fontPx: 34 }), 0, o.y || 2.45, 0.03);
  c.lights.push({ x: 0, z: 0.25, y: o.y || 2.45, color: 0x3cff8a, intensity: 0.7, range: 2.5, noMesh: true, mode: o.mode || 'steady' });
};
PROPS.label = (c, o) => { c.box(o.w || 0.9, o.h || 0.25, 0.02, signMat(o.text, { bg: o.bg || '#20324a', fg: o.fg || '#ffffff', glow: !!o.glow, w: 512, h: Math.round(512 * (o.h || 0.25) / (o.w || 0.9)), fontPx: o.font || Math.round(512 * (o.h || 0.25) / (o.w || 0.9) * 0.5) }), 0, o.y || 2.2, 0.012); };
PROPS.fire_ext = (c) => { c.cyl(0.08, 0.08, 0.5, 'paint_red', 0, 0.75, 0.1, { seg: 10 }); c.box(0.04, 0.08, 0.04, 'black', 0, 1.04, 0.1); };
PROPS.trash = (c) => { c.cyl(0.2, 0.18, 0.6, 'plastic_grey', 0, 0.3, 0, { seg: 12 }); c.col(-0.2, -0.2, 0.2, 0.2, 0, 0.6, { noFlag: true }); };
PROPS.toilet = (c) => { c.box(0.38, 0.4, 0.5, 'plastic_white', 0, 0.2, 0.05); c.box(0.4, 0.4, 0.18, 'plastic_white', 0, 0.55, -0.2); c.col(-0.2, -0.3, 0.2, 0.3, 0, 0.8, {}); };

// ============== Labor / Forschung ==============
PROPS.labbench = (c, o) => {
  const w = o.w || 2.4, d = o.d || 0.8;
  const r = rngFrom(o);
  c.box(w, 0.86, d, 'l_wall_dark', 0, 0.43, 0);
  c.box(w + 0.04, 0.04, d + 0.04, 'plastic_dark', 0, 0.88, 0);
  for (let i = 0; i < 6; i++) {
    const x = -w / 2 + 0.25 + r() * (w - 0.5), z = (r() - 0.5) * d * 0.6;
    const k = r();
    if (k < 0.3) { c.box(0.35, 0.3, 0.35, 'plastic_white', x, 1.05, z); c.cyl(0.08, 0.08, 0.02, 'plastic_dark', x, 1.21, z); }
    else if (k < 0.6) c.cyl(0.04, 0.05, 0.18, colorMat(0x9ec7d1, 0.05, 0, { transparent: true, opacity: 0.6 }), x, 0.99, z);
    else if (k < 0.8) { c.box(0.12, 0.35, 0.18, 'plastic_dark', x, 1.07, z); c.cyl(0.02, 0.02, 0.15, 'chrome', x, 1.3, z + 0.05, { rx: 0.4 }); }
    else c.box(0.3, 0.004, 0.22, 'paper', x, 0.902, z, { ry: r() });
  }
  if (o.shelf) { c.box(w, 0.03, 0.3, 'steel', 0, 1.6, -d / 2 + 0.15); for (let i = 0; i < 6; i++) c.cyl(0.04, 0.04, 0.2, colorMat(i % 2 ? 0x8a6a2a : 0x4a7a9a, 0.2, 0, { transparent: true, opacity: 0.8 }), -w / 2 + 0.2 + i * 0.35, 1.72, -d / 2 + 0.15); }
  c.col(-w / 2, -d / 2, w / 2, d / 2, 0, 0.92, { cover: true });
};
PROPS.fumehood = (c) => {
  c.box(1.5, 0.9, 0.8, 'l_wall_dark', 0, 0.45, 0);
  c.box(1.5, 0.08, 0.8, 'plastic_dark', 0, 0.92, 0);
  c.box(1.5, 0.6, 0.8, 'plastic_white', 0, 2.1, 0);
  c.box(0.05, 1.0, 0.8, 'plastic_white', -0.72, 1.4, 0); c.box(0.05, 1.0, 0.8, 'plastic_white', 0.72, 1.4, 0);
  c.box(1.4, 0.9, 0.02, 'glass', 0, 1.35, 0.35);
  c.lights.push({ x: 0, z: 0.1, y: 1.75, color: 0xe8f4ff, intensity: 1.2, range: 2.4, noMesh: true, mode: 'flicker' });
  c.col(-0.75, -0.4, 0.75, 0.4, 0, 2.4, { tall: true });
};
PROPS.freezer = (c, o) => {
  c.box(0.8, 1.95, 0.8, 'steel', 0, 0.975, 0);
  c.box(0.7, 0.1, 0.01, emissiveMat(o.alarm ? 0xff3030 : 0x38c8ff, 1.5), 0, 1.75, 0.405);
  c.box(0.03, 0.6, 0.04, 'chrome', 0.3, 1.1, 0.42);
  c.col(-0.4, -0.4, 0.4, 0.4, 0, 1.95, { tall: true });
};
PROPS.serverrack = (c, o) => {
  c.box(0.6, 2.0, 1.0, 'metal_dark', 0, 1.0, 0);
  const r = rngFrom(o);
  for (let i = 0; i < 14; i++) {
    c.box(0.54, 0.1, 0.02, 'plastic_dark', 0, 0.2 + i * 0.12, 0.505);
    const col = r() < 0.15 ? 0xff7a1a : r() < 0.5 ? 0x2cff6a : 0x3aa0ff;
    c.box(0.02, 0.02, 0.01, emissiveMat(col, 2.5), -0.2 + r() * 0.4, 0.2 + i * 0.12, 0.52);
  }
  c.col(-0.3, -0.5, 0.3, 0.5, 0, 2.0, { tall: true });
};
PROPS.console = (c, o) => {
  const w = o.w || 2.4;
  c.box(w, 0.8, 0.7, 'metal_dark', 0, 0.4, 0);
  c.box(w, 0.06, 0.8, 'plastic_dark', 0, 0.83, 0.05, { rx: -0.15 });
  const n = Math.max(1, Math.round(w / 0.8));
  for (let i = 0; i < n; i++) { const x = -w / 2 + (i + 0.5) * (w / n); c.box(0.6, 0.38, 0.03, screenMat(o.screen || 'ui', o.screenOpts || {}), x, 1.15, -0.2, { rx: 0.05 }); }
  c.col(-w / 2, -0.4, w / 2, 0.4, 0, 1.0, { cover: true });
};
PROPS.cellbed = (c) => { c.box(0.8, 0.08, 1.9, 'steel', 0, 0.45, 0); c.box(0.75, 0.1, 1.8, 'fabric_dark', 0, 0.54, 0); c.box(0.8, 0.45, 0.06, 'steel', 0, 0.22, 0.9); c.box(0.8, 0.45, 0.06, 'steel', 0, 0.22, -0.9); c.col(-0.4, -0.95, 0.4, 0.95, 0, 0.6, {}); };
PROPS.hazmat = (c) => {
  c.box(0.05, 0.05, 0.25, 'chrome', 0, 1.9, 0.12);
  c.box(0.45, 0.75, 0.25, 'plastic_yellow', 0, 1.42, 0.2); c.sphere(0.17, 'plastic_yellow', 0, 1.95, 0.2);
  c.box(0.3, 0.12, 0.02, 'glass_dark', 0, 1.97, 0.36);
  c.box(0.16, 0.7, 0.18, 'plastic_yellow', -0.12, 0.7, 0.2); c.box(0.16, 0.7, 0.18, 'plastic_yellow', 0.12, 0.7, 0.2);
};
PROPS.tank = (c, o) => {
  c.cyl(0.42, 0.42, 0.25, 'steel', 0, 0.125, 0, { seg: 18 });
  c.cyl(0.38, 0.38, 1.5, colorMat(0x6a9a8a, 0.05, 0, { transparent: true, opacity: 0.35, depthWrite: false }), 0, 1.0, 0, { seg: 18 });
  c.cyl(0.42, 0.42, 0.18, 'steel', 0, 1.82, 0, { seg: 18 });
  if (o.glow !== false) c.lights.push({ x: 0, z: 0, y: 1.0, color: 0x6affc8, intensity: 0.8, range: 2.5, noMesh: true, mode: 'pulse' });
  c.col(-0.42, -0.42, 0.42, 0.42, 0, 1.9, { tall: true });
};
PROPS.crate = (c, o) => {
  const s = o.s || 1;
  c.box(1.2 * s, 0.8 * s, 0.8 * s, o.mat || 'metal_dark', 0, 0.4 * s, 0);
  c.box(1.22 * s, 0.06, 0.82 * s, 'plastic_yellow', 0, 0.65 * s, 0);
  c.col(-0.6 * s, -0.4 * s, 0.6 * s, 0.4 * s, 0, 0.8 * s, { vault: s <= 1, cover: true });
};

PROPS.tv = (c, o) => {
  const y = o.y || 2.0;
  c.box(1.1, 0.66, 0.07, 'plastic_dark', 0, y, 0.04);
  c.box(1.0, 0.56, 0.01, screenMat('text', { text: o.text || '+++ EILMELDUNG +++\nKLINIKUM ABGERIEGELT\nKRISENSTAB TAGT', color: '#ffffff', bg: '#7a0d0d' }), 0, y, 0.08);
  c.lights.push({ x: 0, z: 0.6, y, color: 0xff7a6a, intensity: 1.0, range: 3.2, noMesh: true, mode: 'flicker' });
};
