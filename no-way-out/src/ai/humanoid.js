// Prozedural aufgebauter, gelenkiger Menschenkörper mit prozeduralen Animationen
// (Schlurfen, Hinken, Rennen, Greifen, Schlagen, Aufstehen, Sitzen, Knien, Suchen, Zucken).
// Wird für Zombies und Begleiter (Mine, İlyas) verwendet.
import * as THREE from 'three';
import { patchGrid } from '../render/materials.js';
import { getTex } from '../render/textures.js';
import { damp, clamp } from '../core/rng.js';
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

const matCache = new Map();
function mat(key, make) { if (!matCache.has(key)) matCache.set(key, patchGrid(make())); return matCache.get(key); }
function texMat(kind, opts, extra = {}) {
  return mat(kind + JSON.stringify(opts), () => { const t = getTex(kind, opts, 256); return new THREE.MeshStandardMaterial({ map: t.map, normalMap: t.normalMap, roughnessMap: t.roughnessMap, roughness: 1, ...extra }); });
}

export const OUTFITS = {
  gown: { top: ['cloth', { color: '#8fb0c4', pattern: true, dirt: 10, blood: 3 }], bottom: 'skin', skirt: true },
  gown_clean: { top: ['cloth', { color: '#9fc0d4', pattern: true, dirt: 2 }], bottom: 'skin', skirt: true },
  scrubs: { top: ['cloth', { color: '#3f7a72', dirt: 8, blood: 3 }], bottom: ['cloth', { color: '#3f7a72', dirt: 8, blood: 1 }] },
  labcoat: { top: ['cloth', { color: '#e6e8e6', dirt: 10, blood: 4 }], bottom: ['cloth', { color: '#3a3f4a', dirt: 4 }], coat: true },
  security: { top: ['cloth', { color: '#2a3442', dirt: 6, blood: 2 }], bottom: ['cloth', { color: '#222831', dirt: 4 }] },
  civilian: { top: ['cloth', { color: '#7a3a2a', dirt: 8, blood: 3 }], bottom: ['cloth', { color: '#2f4a6a', dirt: 6 }] },
  civilian2: { top: ['cloth', { color: '#5a5a32', dirt: 8, blood: 2 }], bottom: ['cloth', { color: '#3a3a3a', dirt: 6 }] },
  suit: { top: ['cloth', { color: '#24262c', dirt: 5, blood: 2 }], bottom: ['cloth', { color: '#24262c', dirt: 4 }] },
  hazmat: { top: ['cloth', { color: '#c8a020', dirt: 10, blood: 2 }], bottom: ['cloth', { color: '#c8a020', dirt: 10 }] },
  soldier: { top: ['cloth', { color: '#4a5236', dirt: 8, blood: 3 }], bottom: ['cloth', { color: '#4a5236', dirt: 8 }] },
  // Schaufensterpuppen (Kapitel 4, Passage)
  mannequin: { top: ['cloth', { color: '#3a3f5a', dirt: 1 }], bottom: ['cloth', { color: '#2a2a2e', dirt: 1 }], human: true },
  mannequin2: { top: ['cloth', { color: '#8a2a3a', dirt: 1 }], bottom: ['cloth', { color: '#c8c0b0', dirt: 1 }], human: true },
  mannequin3: { top: ['cloth', { color: '#d8d4c8', pattern: true, dirt: 1 }], bottom: ['cloth', { color: '#3a4a5a', dirt: 1 }], human: true, coat: true },
  // Begleiter
  mine: { top: ['cloth', { color: '#e8ecec', dirt: 3 }], bottom: ['cloth', { color: '#2c3440', dirt: 2 }], coat: true, human: true },
  ilyas: { top: ['cloth', { color: '#3a4a3e', dirt: 5 }], bottom: ['cloth', { color: '#2a2a30', dirt: 4 }], human: true },
};

const SKIN = {
  zombie: ['skin', { color: '#9a9484', wounds: 5 }],
  zombie2: ['skin', { color: '#8c8a7e', wounds: 7 }],
  zombie3: ['skin', { color: '#a8988a', wounds: 4 }],
  human: ['skin', { color: '#c49a7c', wounds: 0 }],
  human2: ['skin', { color: '#b88a6a', wounds: 0 }],
  plastic: ['metal', { color: '#d9d5cd', rough: 0.35, scratches: 3 }],
};

function limb(r, len, m) {
  const g = new THREE.CapsuleGeometry(r, len, 4, 8);
  g.translate(0, -len / 2 - r * 0.6, 0);
  const mesh = new THREE.Mesh(g, m); mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}

export class Humanoid {
  constructor(o = {}) {
    const outfit = OUTFITS[o.outfit || 'gown'];
    const skinDef = SKIN[o.skin || (outfit.human ? 'human' : 'zombie')];
    const skin = texMat(skinDef[0], skinDef[1]);
    const top = Array.isArray(outfit.top) ? texMat(outfit.top[0], outfit.top[1]) : skin;
    const bottom = Array.isArray(outfit.bottom) ? texMat(outfit.bottom[0], outfit.bottom[1]) : skin;
    const dark = mat('eyes', () => new THREE.MeshStandardMaterial({ color: 0x050303, roughness: 0.4 }));
    // Zombieaugen: milchig-trüb, nass glänzend und mit schwachem Schimmer – im Lichtkegel gut sichtbar
    const zEye = mat('eyes_z', () => new THREE.MeshStandardMaterial({ color: 0xa8a48c, roughness: 0.12, metalness: 0.0, emissive: 0x3a3418, emissiveIntensity: 0.55 }));
    const teethM = mat('teeth', () => new THREE.MeshStandardMaterial({ color: 0x9a9078, roughness: 0.35 }));
    const hairM = mat('hair' + (o.hair || 0x1a1410), () => new THREE.MeshStandardMaterial({ color: o.hair || 0x1a1410, roughness: 0.8 }));
    const s = o.scale || 1;
    this.root = new THREE.Group();
    this.body = new THREE.Group(); this.root.add(this.body);
    this.body.scale.setScalar(s);
    const J = (parent, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
    this.hips = J(this.body, 0, 0.95, 0);
    const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.2), bottom); pelvis.castShadow = true; this.hips.add(pelvis);
    this.spine = J(this.hips, 0, 0.08, 0);
    const torsoG = new THREE.CylinderGeometry(0.19, 0.15, 0.52, 10); torsoG.scale(1, 1, 0.62); torsoG.translate(0, 0.27, 0);
    const torso = new THREE.Mesh(torsoG, top); torso.castShadow = true; torso.receiveShadow = true; this.spine.add(torso);
    if (outfit.skirt) { const sk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.45, 10, 1, true), top); sk.scale.z = 0.7; sk.position.y = -0.12; sk.castShadow = true; this.hips.add(sk); sk.material.side = THREE.DoubleSide; }
    if (outfit.coat) { const ct = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.26, 0.55, 10, 1, true), top); ct.scale.z = 0.68; ct.position.y = -0.15; ct.castShadow = true; this.hips.add(ct); }
    this.neck = J(this.spine, 0, 0.56, 0);
    const neckM = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.1, 8), skin); neckM.position.y = 0.04; this.neck.add(neckM);
    this.head = J(this.neck, 0, 0.1, 0);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 12), skin); skull.scale.set(0.9, 1.08, 1.0); skull.position.set(0, 0.1, 0); skull.castShadow = true; this.head.add(skull);
    const isHuman = !!outfit.human && o.skin !== 'plastic';
    for (const sx of [-0.038, 0.038]) {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), isHuman || o.skin === 'plastic' ? dark : zEye); e.position.set(sx, 0.12, -0.09); e.scale.set(1, 0.7, 0.5); this.head.add(e);
      // eingefallene, dunkle Augenhöhlen bei Zombies
      if (!outfit.human) { const so = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), dark); so.position.set(sx, 0.125, -0.078); so.scale.set(1.15, 0.85, 0.45); this.head.add(so); }
    }
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.03), skin); nose.position.set(0, 0.09, -0.105); this.head.add(nose);
    this.jaw = J(this.head, 0, 0.05, -0.02);
    const jawM = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.035, 0.08), skin); jawM.position.set(0, -0.02, -0.05); this.jaw.add(jawM);
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.012, 0.02), dark); mouth.position.set(0, 0.04, -0.105); this.head.add(mouth);
    if (!outfit.human) {
      // Zähne oben und im Unterkiefer (sichtbar, wenn der Kiefer aufklappt)
      const up = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.012, 0.012), teethM); up.position.set(0, 0.038, -0.1); this.head.add(up);
      const lo = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.012, 0.012), teethM); lo.position.set(0, -0.006, -0.086); this.jaw.add(lo);
    }
    if (o.hairStyle !== 'none') {
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.118, 12, 8, 0, Math.PI * 2, 0, o.hairStyle === 'long' ? Math.PI * 0.62 : Math.PI * 0.45), hairM);
      hair.scale.set(0.95, 1.08, 1.04); hair.position.set(0, 0.11, 0.005); this.head.add(hair);
      if (o.hairStyle === 'long') { const back = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.26, 0.06), hairM); back.position.set(0, -0.02, 0.08); this.head.add(back); }
    }
    // Arme
    const armMat = o.shortSleeves ? skin : top;
    this.shL = J(this.spine, -0.21, 0.48, 0); this.shR = J(this.spine, 0.21, 0.48, 0);
    this.shL.add(limb(0.052, 0.22, armMat)); this.shR.add(limb(0.052, 0.22, o.tornSleeve ? skin : armMat));
    this.elL = J(this.shL, 0, -0.3, 0); this.elR = J(this.shR, 0, -0.3, 0);
    this.elL.add(limb(0.045, 0.2, skin)); this.elR.add(limb(0.045, 0.2, skin));
    for (const el of [this.elL, this.elR]) { const h = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.035), skin); h.position.y = -0.32; h.castShadow = true; el.add(h); el.userData.hand = h; }
    // Beine
    this.hipL = J(this.hips, -0.1, -0.06, 0); this.hipR = J(this.hips, 0.1, -0.06, 0);
    this.hipL.add(limb(0.072, 0.32, bottom)); this.hipR.add(limb(0.072, 0.32, bottom));
    this.knL = J(this.hipL, 0, -0.44, 0); this.knR = J(this.hipR, 0, -0.44, 0);
    this.knL.add(limb(0.058, 0.32, bottom === skin ? skin : bottom)); this.knR.add(limb(0.058, 0.32, bottom === skin ? skin : bottom));
    for (const kn of [this.knL, this.knR]) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.22), dark); f.position.set(0, -0.43, -0.05); f.castShadow = true; kn.add(f); }

    if (o.legless) { this.hipL.visible = false; this.hipR.visible = false; }
    this.human = !!outfit.human;
    this.flinch = 0; this.flinchHead = false; this.deathStyle = 0;
    this.phase = Math.random() * 10;
    this.limp = o.limp ?? (this.human ? 0 : Math.random() < 0.6 ? (Math.random() < 0.5 ? -1 : 1) * (0.3 + Math.random() * 0.5) : 0);
    this.tilt = this.human ? 0 : (Math.random() - 0.5) * 0.6;
    this.armStyle = this.human ? 0 : Math.floor(Math.random() * 3);
    this.twitchT = 1 + Math.random() * 4; this.twitch = 0;
    this.pose = o.pose || 'stand';    // stand | lying | sitting | kneel
    this.poseBlend = this.pose === 'stand' ? 0 : 1;
    this.mode = 'idle';
    this.speed = 0;
    this.attackT = 0; this.jawOpen = 0;
    this.lookYaw = 0; this.lookPitch = 0;
    this.time = Math.random() * 10;
    this.crouch = 0;
  }

  // Zielwinkel der Gelenke je nach Modus berechnen und weich anfahren
  update(dt, st = {}) {
    this.time += dt;
    const sp = this.speed;
    const chase = this.mode === 'chase';
    const stride = this.pose === 'crawl' ? 0.42 : chase ? 0.72 : this.human ? (sp > 2.5 ? 1.25 : 0.85) : 0.62;
    this.phase += (sp / stride) * Math.PI * dt;
    const ph = this.phase;
    const walkAmt = clamp(sp / (this.human ? 1.2 : 0.6), 0, 1);
    const T = {};
    const set = (k, x = 0, y = 0, z = 0) => { T[k] = [x, y, z]; };
    // Grundhaltung
    const lean = this.human ? (sp > 2.5 ? 0.25 : 0.05) + this.crouch * 0.5 : chase ? 0.3 : 0.18;
    const limpL = this.limp < 0 ? 1 - Math.abs(this.limp) : 1, limpR = this.limp > 0 ? 1 - Math.abs(this.limp) : 1;
    const legA = (chase ? 0.5 : this.human ? (sp > 2.5 ? 0.8 : 0.45) : 0.38) * walkAmt;
    set('hipL', Math.sin(ph) * legA * limpL - this.crouch * 0.9, 0, 0);
    set('hipR', -Math.sin(ph) * legA * limpR - this.crouch * 0.9, 0, 0);
    set('knL', Math.max(0, -Math.sin(ph + 1.2)) * legA * 1.4 * limpL + this.crouch * 1.4, 0, 0);
    set('knR', Math.max(0, Math.sin(ph + 1.2)) * legA * 1.4 * limpR + this.crouch * 1.4, 0, 0);
    set('spine', lean + Math.sin(ph * 2) * 0.03 * walkAmt, Math.sin(ph) * 0.1 * walkAmt, (this.human ? 0 : Math.sin(ph) * 0.07 * walkAmt) + this.limp * 0.06);
    set('hips', 0, 0, this.human ? 0 : Math.sin(ph) * 0.04 * walkAmt);
    // Arme
    if (this.human) {
      const aa = 0.35 * walkAmt * (sp > 2.5 ? 1.6 : 1);
      set('shL', -Math.sin(ph) * aa, 0, -0.08); set('shR', Math.sin(ph) * aa, 0, 0.08);
      set('elL', -0.25 - (sp > 2.5 ? 0.9 : 0), 0, 0); set('elR', -0.25 - (sp > 2.5 ? 0.9 : 0), 0, 0);
    } else if (chase) {
      const fl = Math.sin(this.time * 3.5) * 0.12;
      set('shL', -1.35 + fl, 0.15, -0.15); set('shR', -1.25 - fl, -0.15, 0.15);
      set('elL', -0.35, 0, 0); set('elR', -0.25, 0, 0);
    } else {
      const sw = Math.sin(ph) * 0.18 * walkAmt;
      if (this.armStyle === 1) { set('shL', -0.9 + sw * 0.5, 0, -0.1); set('shR', sw, 0, 0.12); set('elL', -0.3, 0, 0); set('elR', -0.1, 0, 0); }
      else if (this.armStyle === 2) { set('shL', -sw + 0.1, 0, -0.18); set('shR', sw + 0.1, 0, 0.2); set('elL', -0.1, 0, 0); set('elR', -0.15, 0, 0); }
      else { set('shL', -sw, 0, -0.08); set('shR', sw - 0.5, 0, 0.1); set('elL', -0.15, 0, 0); set('elR', -0.6, 0, 0); }
    }
    // Kopf
    let hx = this.human ? -0.05 : 0.15, hy = this.lookYaw, hz = this.tilt;
    hx += this.lookPitch;
    if (!this.human) {
      this.twitchT -= dt;
      if (this.twitchT <= 0) { this.twitch = (Math.random() - 0.5) * 1.4; this.twitchT = 1.5 + Math.random() * 5; }
      this.twitch = damp(this.twitch, 0, 6, dt);
      hz += this.twitch * 0.6; hy += this.twitch * 0.4;
    }
    if (this.mode === 'search') { hy += Math.sin(this.time * 1.4) * 0.9; hx += Math.sin(this.time * 3.1) * 0.08 - 0.15; }
    if (this.mode === 'alert') { hx -= 0.1; }
    set('neck', hx * 0.4, hy * 0.4, hz * 0.4); set('head', hx * 0.6, hy * 0.6, hz * 0.6);
    // Spezielle Modi
    let jaw = (this.human ? 0.02 : 0.15) + Math.max(0, Math.sin(this.time * 2.3)) * 0.1;
    if (this.mode === 'attack') {
      const a = this.attackT; // 0..1 Ausholen, >1 Zuschlagen
      if (a < 1) { set('spine', -0.15 * a + 0.2, 0, 0); set('shL', -2.3 * a, 0.5 * a, -0.5 * a); set('shR', -2.3 * a, -0.5 * a, 0.5 * a); set('elL', -0.6, 0, 0); set('elR', -0.6, 0, 0); jaw = 0.4 * a; }
      else { set('spine', 0.55, 0, 0); set('shL', -1.5, -0.25, 0); set('shR', -1.5, 0.25, 0); set('elL', -0.1, 0, 0); set('elR', -0.1, 0, 0); jaw = 0.55; }
    } else if (this.mode === 'grab') {
      const k = Math.sin(this.time * 14) * 0.08;
      set('spine', 0.5 + k, 0, 0); set('shL', -1.45, -0.4, 0); set('shR', -1.45, 0.4, 0); set('elL', -0.55, 0, 0); set('elR', -0.55, 0, 0);
      set('neck', 0.3, 0, 0); set('head', 0.2 + k * 2, 0, 0); jaw = 0.4 + Math.abs(Math.sin(this.time * 9)) * 0.3;
    } else if (this.mode === 'bash') {
      const k = Math.sin(this.time * 7);
      set('spine', 0.35, 0, 0); set('shL', -1.6 - k * 0.5, 0, 0); set('shR', -1.6 + k * 0.5, 0, 0); set('elL', -0.4, 0, 0); set('elR', -0.4, 0, 0); jaw = 0.35;
    } else if (this.mode === 'stagger') {
      const k = Math.sin(this.time * 6);
      set('spine', -0.25, 0, k * 0.2); set('shL', -0.6, 0, -0.8); set('shR', -0.4, 0, 0.9); set('elL', -0.8, 0, 0); set('elR', -0.6, 0, 0);
    } else if (this.mode === 'climb') {
      set('spine', 0.6, 0, 0); set('shL', -1.7, 0, 0); set('shR', -1.7, 0, 0); set('hipL', -0.8, 0, 0); set('knL', 1.2, 0, 0);
    } else if (this.mode === 'talk') {
      set('shR', -0.3 + Math.sin(this.time * 2) * 0.2, 0, 0.1); set('elR', -0.9, 0, 0); jaw = Math.abs(Math.sin(this.time * 11)) * 0.12;
    } else if (this.mode === 'injured') {
      set('spine', 0.25, 0, 0.1); set('shL', -0.5, 0.4, -0.3); set('elL', -1.6, 0, 0);
    } else if (this.mode === 'hold') {
      set('shL', -1.2, 0, 0); set('shR', -1.2, 0, 0); set('elL', -0.7, 0, 0); set('elR', -0.7, 0, 0);
    }
    if (st.alertGroan) jaw = 0.5;
    // Kriechen und Sterben ersetzen die Gelenkziele vollständig
    if (this.pose === 'crawl') jaw = this._crawlTargets(T, jaw);
    else if (this.pose === 'dead') jaw = this._deadTargets(T);
    // Treffer: kurzes Zurückzucken, ein Kopftreffer reißt den Kopf nach hinten
    if (this.flinch > 0) {
      const f = this.flinch, sd = this.flinchSide || 1;
      this.flinch = Math.max(0, f - dt * 4);
      const add = (k, x, y = 0, z = 0) => { const a = T[k] || [0, 0, 0]; T[k] = [a[0] + x, a[1] + y, a[2] + z]; };
      add('spine', -0.45 * f, 0.1 * f * sd, 0.18 * f * sd);
      add('neck', -(this.flinchHead ? 0.8 : 0.2) * f); add('head', -(this.flinchHead ? 1.0 : 0.25) * f, 0.2 * f * sd, 0.35 * f * sd);
      add('shL', 0.6 * f, 0, -0.35 * f); add('shR', 0.6 * f, 0, 0.35 * f);
      jaw = Math.max(jaw, 0.35 * f);
    }
    this.jawOpen = damp(this.jawOpen, jaw, 12, dt);
    this.jaw.rotation.x = this.jawOpen;
    // Haltung (liegen / sitzen / knien) einblenden
    const pb = this.poseBlend;
    if (pb > 0.001 && this.pose !== 'crawl' && this.pose !== 'dead') {
      const P = this._poseTargets(this.pose);
      for (const k of Object.keys(P)) {
        const a = T[k] || [0, 0, 0], b = P[k];
        T[k] = [a[0] + (b[0] - a[0]) * pb, a[1] + (b[1] - a[1]) * pb, a[2] + (b[2] - a[2]) * pb];
      }
    }
    const rate = this.mode === 'attack' || this.mode === 'grab' || this.flinch > 0 ? 22 : this.pose === 'dead' ? 14 : this.human ? 12 : 9;
    for (const k of Object.keys(T)) {
      const j = this[k];
      // Konvention der Zielwerte: positiv = nach vorne beugen / Knie anwinkeln; Geometrie erwartet umgekehrtes Vorzeichen
      j.rotation.x = damp(j.rotation.x, -T[k][0], rate, dt);
      j.rotation.y = damp(j.rotation.y, T[k][1], rate, dt);
      j.rotation.z = damp(j.rotation.z, T[k][2], rate, dt);
    }
    // Hüfthöhe
    const bob = Math.abs(Math.sin(ph)) * 0.03 * walkAmt;
    let hipY = 0.95 - bob - Math.abs(this.limp) * 0.02 * Math.max(0, Math.sin(ph)) - this.crouch * 0.32;
    let hipZ = 0, rootRX = 0, rootRZ = 0, bx = 0, by = 0, bz = 0;
    if (this.pose === 'crawl') {
      // flach auf dem Bauch, Oberkörper leicht aufgerichtet; Brust liegt über dem Standpunkt
      hipY = 0.95; rootRX = -Math.PI / 2 + (this.dead ? 0.06 : 0.3); bz = 0.9; by = this.dead ? 0.0 : 0.02 + Math.abs(Math.sin(ph)) * 0.025;
    } else if (this.pose === 'dead') {
      // erst sacken die Knie weg, dann kippt der Körper um (Drehpunkt an den Füßen)
      const a = sstep(0, 0.45, pb), b = sstep(0.3, 1, pb);
      hipY = 0.95 - 0.16 * a * (1 - b);
      const s = this.deathStyle;
      if (s === 0) rootRX = Math.PI / 2 * b; else if (s === 1) rootRX = -Math.PI / 2 * b;
      else rootRZ = (s === 2 ? 1 : -1) * Math.PI / 2 * b;
      by = 0.12 * b;
    } else if (pb > 0.001) {
      const py = this.pose === 'lying' ? 0.12 : this.pose === 'sitting' ? 0.18 : this.pose === 'kneel' ? 0.52 : 0.95;
      hipY = hipY + (py - hipY) * pb;
      if (this.pose === 'lying') { rootRX = -Math.PI / 2 * pb; hipZ = 0; bz = 0.8 * pb; }
    }
    this.hips.position.y = hipY;
    this.hips.position.z = hipZ;
    this.body.rotation.x = rootRX;
    this.body.rotation.z = rootRZ;
    this.body.position.set(bx, by, bz);
  }

  // Kriechen (beinloser oder verkrüppelter Zombie): Arme ziehen den Körper abwechselnd nach vorn
  _crawlTargets(T, jaw) {
    for (const k of Object.keys(T)) delete T[k];
    const ph = this.phase, set = (k, x = 0, y = 0, z = 0) => { T[k] = [x, y, z]; };
    if (this.dead) {
      set('shL', -2.2, 0, -0.5); set('shR', -1.2, 0, 0.6); set('elL', -0.2, 0, 0); set('elR', -0.6, 0, 0);
      set('spine', 0, 0, 0.05); set('hips', 0, 0, 0); set('neck', 0.1, 0.4, 0.2); set('head', 0.1, 0.6, 0.3);
      set('hipL', 0, 0, -0.08); set('hipR', 0, 0, 0.1); set('knL', 0.1, 0, 0); set('knR', 0.2, 0, 0);
      return 0.35;
    }
    const moving = this.speed > 0.05;
    const sL = moving ? Math.sin(ph) : Math.sin(this.time * 0.8) * 0.15, sR = moving ? Math.sin(ph + Math.PI) : -sL;
    set('shL', -1.7 - 0.95 * sL, 0, -0.25); set('shR', -1.7 - 0.95 * sR, 0, 0.25);
    set('elL', -0.25 - 0.7 * Math.max(0, Math.cos(ph)), 0, 0); set('elR', -0.25 - 0.7 * Math.max(0, -Math.cos(ph)), 0, 0);
    set('spine', -0.15, 0.12 * sL, 0.1 * sL); set('hips', 0, 0, -0.06 * sL);
    set('neck', -0.45, 0.15 * Math.sin(this.time * 0.7), 0.1 + this.tilt * 0.3); set('head', -0.35 + this.twitch * 0.2, this.lookYaw * 0.5, this.tilt * 0.5);
    set('hipL', -0.1, 0, -0.08); set('hipR', -0.05, 0, 0.1); set('knL', 0.3, 0, 0); set('knR', 0.15, 0, 0);
    if (this.mode === 'attack' || this.mode === 'grab' || this.mode === 'bash') {
      // nach den Knöcheln greifen
      const k = Math.sin(this.time * 12) * 0.12;
      set('shL', -2.75 + k, 0.1, -0.15); set('shR', -2.75 - k, -0.1, 0.15); set('elL', -0.3, 0, 0); set('elR', -0.3, 0, 0);
      set('neck', -0.6, 0, 0); set('head', -0.4, 0, 0);
      return 0.5 + Math.abs(Math.sin(this.time * 9)) * 0.2;
    }
    return Math.max(jaw, 0.2);
  }

  // Sterben: Knie geben nach, Arme werden schlaff, Kopf fällt zur Seite
  _deadTargets(T) {
    for (const k of Object.keys(T)) delete T[k];
    const pb = this.poseBlend, a = sstep(0, 0.45, pb), b = sstep(0.3, 1, pb), s = this.deathStyle;
    const side = s === 3 ? -1 : 1;
    const set = (k, x = 0, y = 0, z = 0) => { T[k] = [x, y, z]; };
    set('spine', 0.35 * a * (1 - b) + (s === 1 ? -0.1 : 0.1) * b, 0, 0.1 * b * side);
    set('neck', 0.3 * a, 0.3 * b * side, 0.2 * b * side); set('head', 0.4 * a * (1 - b), 0.7 * b * side, 0.3 * b * side);
    set('shL', -0.4 * a + (s === 0 ? -0.5 : s === 1 ? 0.3 : -0.3) * b, 0.2 * b, -0.15 - 0.35 * b); set('shR', -0.3 * a + (s === 0 ? -0.15 : s === 1 ? 0.4 : -0.6) * b, -0.3 * b, 0.15 + 0.5 * b);
    set('elL', -0.5 * a - 0.35 * b, 0, 0); set('elR', -0.4 * a - 0.15 * b, 0, 0);
    set('hipL', -0.55 * a * (1 - b) - 0.15 * b, 0, -0.05 - 0.12 * b); set('hipR', -0.5 * a * (1 - b) + 0.1 * b, 0, 0.05 + 0.1 * b);
    set('knL', 1.05 * a * (1 - b) + 0.35 * b, 0, 0); set('knR', 1.0 * a * (1 - b) + 0.1 * b, 0, 0);
    return 0.25 + 0.2 * b;
  }

  // Treffer anzeigen (side: von welcher Seite der Treffer kam, ±1)
  hit(head, side = 1) { this.flinch = 1; this.flinchHead = !!head; this.flinchSide = side; }

  _poseTargets(p) {
    if (p === 'lying') return { hips: [0, 0, 0], spine: [0, 0, 0], neck: [0.1, 0, 0], head: [0, 0.6, 0.2], shL: [0.1, 0, -0.4], shR: [0.2, 0, 0.6], elL: [-0.3, 0, 0], elR: [-0.2, 0, 0], hipL: [0, 0, -0.08], hipR: [0, 0, 0.12], knL: [0.2, 0, 0], knR: [0, 0, 0] };
    if (p === 'sitting') return { hips: [0, 0, 0], spine: [-0.25, 0, 0.1], neck: [0.5, 0, 0], head: [0.4, 0.3, 0.3], shL: [0.2, 0, -0.2], shR: [0.1, 0, 0.25], elL: [-0.5, 0, 0], elR: [-0.3, 0, 0], hipL: [-1.5, 0, -0.15], hipR: [-1.45, 0, 0.2], knL: [0.2, 0, 0], knR: [0.5, 0, 0] };
    if (p === 'kneel') { const k = Math.sin(this.time * 4) * 0.12; return { hips: [0, 0, 0], spine: [0.9 + k, 0, 0], neck: [0.4, 0, 0], head: [0.3 + k, 0, 0], shL: [-0.9, 0, -0.1], shR: [-0.8, 0, 0.1], elL: [-0.9, 0, 0], elR: [-1.0, 0, 0], hipL: [-0.2, 0, -0.1], hipR: [-0.2, 0, 0.1], knL: [1.9, 0, 0], knR: [1.9, 0, 0] }; }
    return {};
  }

  setPose(p, instant = false) { this.pose = p; if (instant) this.poseBlend = p === 'stand' ? 0 : 1; }
  // Aufstehen: poseBlend -> 0 über die Dauer
  standUp(dt, dur = 2.2) {
    if (this.pose === 'crawl') return true;   // Kriecher stehen nie auf
    this.poseBlend = Math.max(0, this.poseBlend - dt / dur); if (this.poseBlend === 0) this.pose = 'stand'; return this.poseBlend === 0;
  }

  headWorld(out = new THREE.Vector3()) { this.head.getWorldPosition(out); return out; }
}
