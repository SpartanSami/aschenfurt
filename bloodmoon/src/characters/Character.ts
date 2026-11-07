import * as THREE from "three";
import { buildHead, FaceParams, HairParams, HeadRig } from "./Head";
import { materials, SurfaceName } from "../graphics/Materials";
import { noise3 } from "../graphics/Noise";

// Prozedurale Figur mit hierarchischem Skelett, Kleidung und prozeduraler Animation
// (Atmen, Gewichtsverlagerung, Blickverfolgung, Blinzeln, Gehen, Gesten, Mimik).

export type Pose =
  | "stand" | "sit" | "kneel" | "lie" | "crouch" | "armsCrossed" | "handsClasped" | "reach" | "cower"
  | "pray" | "hangHead" | "holdLantern" | "point" | "feral" | "raiseArms" | "slump" | "guard" | "lookUp";

export type Mood = "neutral" | "kalt" | "wuetend" | "traurig" | "aengstlich" | "laechelnd" | "nachdenklich";

export interface OutfitParams {
  top: "coat" | "dress" | "tunic" | "robe" | "vest" | "rags";
  topMat: SurfaceName;
  topTint?: number;
  skirt: number; // Länge 0 (keiner) .. 1 (bodenlang)
  skirtMat?: SurfaceName;
  skirtTint?: number;
  legMat: SurfaceName;
  legTint?: number;
  bootMat: SurfaceName;
  collar?: "high" | "fur" | "none" | "hood" | "ruff" | "cowl";
  mantle?: "fur" | "cloth" | "none";
  mantleMat?: SurfaceName;
  belt?: boolean;
  bag?: boolean;
  trim?: SurfaceName;
  sleeveMat?: SurfaceName;
  hoodUp?: boolean;
  gem?: number;
}

export interface CharacterPreset {
  id: string;
  name: string;
  height: number;
  build: "slim" | "normal" | "broad" | "gaunt" | "child" | "heavy";
  female?: boolean;
  face: FaceParams;
  hair: HairParams;
  outfit: OutfitParams;
  vampire?: boolean;
  handSkin?: [number, number, number];
}

interface Joints {
  hips: THREE.Group;
  spine: THREE.Group;
  chest: THREE.Group;
  neck: THREE.Group;
  head: THREE.Group;
  shL: THREE.Group;
  shR: THREE.Group;
  elL: THREE.Group;
  elR: THREE.Group;
  hdL: THREE.Group;
  hdR: THREE.Group;
  thL: THREE.Group;
  thR: THREE.Group;
  knL: THREE.Group;
  knR: THREE.Group;
}

type JKey = keyof Joints;
type PoseDef = Partial<Record<JKey, [number, number, number]>> & { hipY?: number; hipZ?: number };

const POSES: Record<Pose, PoseDef> = {
  stand: { shL: [0, 0, 0.08], shR: [0, 0, -0.08], elL: [-0.12, 0, 0], elR: [-0.12, 0, 0] },
  sit: { hipY: -0.48, thL: [-1.5, 0, 0.05], thR: [-1.5, 0, -0.05], knL: [1.5, 0, 0], knR: [1.5, 0, 0], shL: [-0.35, 0, 0.1], shR: [-0.35, 0, -0.1], elL: [-0.9, 0, 0], elR: [-0.9, 0, 0], spine: [0.08, 0, 0] },
  kneel: { hipY: -0.5, thL: [-1.4, 0, 0.06], thR: [0.1, 0, -0.04], knL: [1.4, 0, 0], knR: [1.6, 0, 0], spine: [0.15, 0, 0], shL: [-0.2, 0, 0.1], shR: [-0.2, 0, -0.1], elL: [-0.5, 0, 0], elR: [-0.5, 0, 0] },
  lie: { hipY: -0.82, hipZ: 0, spine: [-1.55, 0, 0], thL: [1.5, 0, 0.05], thR: [1.5, 0, -0.05], shL: [0, 0, 0.2], shR: [0, 0, -0.2] },
  crouch: { hipY: -0.38, spine: [0.55, 0, 0], neck: [-0.35, 0, 0], thL: [-1.2, 0, 0.15], thR: [-1.2, 0, -0.15], knL: [1.9, 0, 0], knR: [1.9, 0, 0], shL: [-0.6, 0, 0.3], shR: [-0.6, 0, -0.3], elL: [-0.6, 0, 0], elR: [-0.6, 0, 0] },
  armsCrossed: { shL: [-0.55, 0.5, 0.25], shR: [-0.55, -0.5, -0.25], elL: [-1.65, 0, 0], elR: [-1.65, 0, 0] },
  handsClasped: { shL: [-0.35, 0.3, 0.15], shR: [-0.35, -0.3, -0.15], elL: [-1.0, 0, 0], elR: [-1.0, 0, 0] },
  reach: { shR: [-1.35, 0, -0.1], elR: [-0.2, 0, 0], shL: [0, 0, 0.1], spine: [0.1, 0, 0] },
  cower: { hipY: -0.35, spine: [0.6, 0, 0], neck: [0.3, 0, 0], thL: [-1.4, 0, 0.2], thR: [-1.4, 0, -0.2], knL: [2.1, 0, 0], knR: [2.1, 0, 0], shL: [-1.4, 0.4, 0.3], shR: [-1.4, -0.4, -0.3], elL: [-1.8, 0, 0], elR: [-1.8, 0, 0] },
  pray: { hipY: -0.5, thL: [-1.4, 0, 0.06], thR: [-1.4, 0, -0.06], knL: [2.4, 0, 0], knR: [2.4, 0, 0], spine: [0.12, 0, 0], neck: [0.35, 0, 0], shL: [-0.7, 0.4, 0.15], shR: [-0.7, -0.4, -0.15], elL: [-1.3, 0, 0], elR: [-1.3, 0, 0] },
  hangHead: { neck: [0.7, 0, 0], spine: [0.15, 0, 0], shL: [0.1, 0, 0.05], shR: [0.1, 0, -0.05] },
  holdLantern: { shR: [-0.45, 0, -0.15], elR: [-0.9, 0, 0], shL: [0, 0, 0.08] },
  point: { shR: [-1.5, 0.3, -0.1], elR: [0, 0, 0] },
  feral: { hipY: -0.15, spine: [0.45, 0, 0], neck: [-0.4, 0, 0], shL: [-0.5, 0, 0.45], shR: [-0.5, 0, -0.45], elL: [-0.7, 0, 0], elR: [-0.7, 0, 0], thL: [-0.35, 0, 0.12], thR: [-0.35, 0, -0.12], knL: [0.6, 0, 0], knR: [0.6, 0, 0] },
  raiseArms: { shL: [-2.6, 0, 0.35], shR: [-2.6, 0, -0.35], elL: [-0.2, 0, 0], elR: [-0.2, 0, 0], neck: [-0.35, 0, 0] },
  slump: { hipY: -0.48, thL: [-1.5, 0, 0.1], thR: [-1.5, 0, -0.1], knL: [1.5, 0, 0], knR: [1.5, 0, 0], spine: [0.4, 0, 0.1], neck: [0.6, 0, 0.2], shL: [0.2, 0, 0.1], shR: [0.2, 0, -0.1] },
  guard: { shL: [-0.7, 0.3, 0.3], shR: [-0.7, -0.3, -0.3], elL: [-1.2, 0, 0], elR: [-1.2, 0, 0], spine: [0.15, 0, 0], thL: [-0.2, 0, 0.12], thR: [0.1, 0, -0.12], knL: [0.3, 0, 0] },
  lookUp: { neck: [-0.5, 0, 0], shL: [0, 0, 0.12], shR: [0, 0, -0.12] },
};

const MOODS: Record<Mood, { brow: number; browIn: number; mouth: number; jaw: number }> = {
  neutral: { brow: 0, browIn: 0, mouth: 0, jaw: 0 },
  kalt: { brow: -0.0015, browIn: 0.05, mouth: -0.001, jaw: 0 },
  wuetend: { brow: -0.004, browIn: 0.22, mouth: -0.0025, jaw: 0.02 },
  traurig: { brow: 0.002, browIn: -0.2, mouth: -0.003, jaw: 0 },
  aengstlich: { brow: 0.004, browIn: -0.12, mouth: -0.0015, jaw: 0.05 },
  laechelnd: { brow: 0.0015, browIn: 0, mouth: 0.0035, jaw: 0 },
  nachdenklich: { brow: 0.001, browIn: 0.12, mouth: -0.0008, jaw: 0 },
};

let ghostMatShared: THREE.MeshStandardMaterial | null = null;
export function ghostMaterial(): THREE.MeshStandardMaterial {
  if (ghostMatShared) return ghostMatShared;
  const m = new THREE.MeshStandardMaterial({
    color: 0x000000, emissive: new THREE.Color(1.0, 0.38, 0.22), emissiveIntensity: 0.9,
    transparent: true, opacity: 0.38, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.FrontSide,
  });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = { value: 0 };
    (m as any).userData.shader = sh;
    sh.fragmentShader = sh.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      `#include <emissivemap_fragment>
       float rim = 1.0 - abs(dot(normalize(vViewPosition), normal));
       totalEmissiveRadiance *= (0.15 + pow(rim, 1.6) * 1.8);`,
    );
  };
  ghostMatShared = m;
  return m;
}

let voidMatShared: THREE.MeshStandardMaterial | null = null;
/** Material des Ersten: lichtschluckende Schwärze mit rotem Saum. */
export function voidMaterial(): THREE.MeshStandardMaterial {
  if (voidMatShared) return voidMatShared;
  const m = new THREE.MeshStandardMaterial({ color: 0x010001, roughness: 1, emissive: new THREE.Color(0.9, 0.03, 0.02), emissiveIntensity: 1 });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = { value: 0 };
    (m as any).userData.shader = sh;
    sh.vertexShader = sh.vertexShader.replace(
      "#include <common>",
      `#include <common>
       uniform float uTime;`,
    ).replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
       float wob = sin(position.y * 23.0 + uTime * 3.0) * cos(position.x * 17.0 - uTime * 2.3);
       transformed += normal * wob * 0.008;`,
    );
    sh.fragmentShader = sh.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      `#include <emissivemap_fragment>
       float rim = 1.0 - abs(dot(normalize(vViewPosition), normal));
       totalEmissiveRadiance *= pow(rim, 3.0) * 1.4;`,
    );
  };
  voidMatShared = m;
  return m;
}

export function updateSharedMaterials(t: number): void {
  for (const m of [ghostMatShared, voidMatShared]) {
    const sh = m && (m as any).userData.shader;
    if (sh) sh.uniforms.uTime.value = t;
  }
}

function lathe(profile: [number, number][], seg = 20, depth = 0.72, folds = 0, foldAmp = 0): THREE.BufferGeometry {
  const pts = profile.map(([r, y]) => new THREE.Vector2(Math.max(0.001, r), y));
  const g = new THREE.LatheGeometry(pts, seg);
  const p = g.getAttribute("position") as THREE.BufferAttribute;
  const ymin = profile[0][1], ymax = profile[profile.length - 1][1];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const a = Math.atan2(z, x);
    const t = (ymax - y) / Math.max(0.001, ymax - ymin);
    const f = folds > 0 ? 1 + Math.sin(a * folds + noise3(x * 5, y * 3, z * 5) * 2) * foldAmp * t * t : 1;
    p.setXYZ(i, x * f, y, z * depth * f);
  }
  g.computeVertexNormals();
  const uv = g.getAttribute("uv") as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 1.5, uv.getY(i) * (ymax - ymin));
  return g;
}

function limb(r0: number, r1: number, len: number, mat: THREE.Material, seg = 10): THREE.Mesh {
  const g = new THREE.CylinderGeometry(r1, r0, len, seg, 1, false);
  g.translate(0, -len / 2, 0);
  const m = new THREE.Mesh(g, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  // Gelenkkugel oben
  const j = new THREE.Mesh(new THREE.SphereGeometry(r0 * 1.02, seg, 8), mat);
  j.castShadow = true;
  m.add(j);
  return m;
}

export class Character {
  preset: CharacterPreset;
  root = new THREE.Group();
  j!: Joints;
  head!: HeadRig;
  mats: THREE.Material[] = [];
  ghost: boolean;
  isVoid: boolean;
  pose: Pose = "stand";
  private poseFrom: PoseDef = POSES.stand;
  private poseT = 1;
  faceTarget: THREE.Vector3 | null = null;
  /** Ganzkörper zum Ziel drehen */
  turnToTarget = true;
  private mood: Mood = "neutral";
  private moodCur = { ...MOODS.neutral };
  private talkTime = 0;
  private blinkT = 2;
  private t = Math.random() * 10;
  private walk: { from: THREE.Vector3; to: THREE.Vector3; dur: number; t: number; resolve?: () => void } | null = null;
  private walkPhase = 0;
  walkSpeed = 0;
  /** extern gesteuerte Fortbewegung (m/s) – animiert die Beine */
  locomotion = 0;
  private opacity = 1;
  private fadeDir = 0;
  private fadeSpeed = 1;
  eyeGlow = 0;
  private scaleH: number;
  skirt: THREE.Mesh | null = null;
  lantern: THREE.Object3D | null = null;
  disposed = false;
  /** zusätzliche Kopfneigung (z. B. für Horror: „Kopf schief“) */
  headTilt = 0;
  breathe = 1;
  frozen = false;

  constructor(preset: CharacterPreset, opts: { ghost?: boolean; void?: boolean } = {}) {
    this.preset = preset;
    this.ghost = !!opts.ghost;
    this.isVoid = !!opts.void;
    this.scaleH = preset.height / 1.82;
    this.build();
  }

  private mat(surface: SurfaceName, tint?: number): THREE.Material {
    if (this.ghost) return ghostMaterial();
    if (this.isVoid) return voidMaterial();
    return tint !== undefined ? materials.tinted(surface, tint) : materials.surface(surface);
  }

  private skinMat(): THREE.Material {
    if (this.ghost) return ghostMaterial();
    if (this.isVoid) return voidMaterial();
    const s = this.preset.handSkin ?? this.preset.face.skin;
    const p = this.preset.face.pallor ?? 0;
    const m = new THREE.MeshStandardMaterial({
      color: new THREE.Color(s[0] * (1 - p * 0.12) + p * 0.07, s[1] * (1 - p * 0.08) + p * 0.05, s[2] + p * 0.08),
      roughness: 0.6,
    });
    this.mats.push(m);
    return m;
  }

  private build(): void {
    const P = this.preset;
    const o = P.outfit;
    const broad = P.build === "broad" ? 1.18 : P.build === "heavy" ? 1.25 : P.build === "slim" ? 0.92 : P.build === "gaunt" ? 0.85 : P.build === "child" ? 0.8 : 1;
    const fem = P.female ? 1 : 0;
    const shoulderW = (0.19 - fem * 0.025) * broad;
    const skin = this.skinMat();
    const top = this.mat(o.topMat, o.topTint);
    const legs = this.mat(o.legMat, o.legTint);
    const boots = this.mat(o.bootMat);
    const sleeve = o.sleeveMat ? this.mat(o.sleeveMat) : top;
    const trim = o.trim ? this.mat(o.trim) : null;

    const g = (name: string) => {
      const x = new THREE.Group();
      x.name = name;
      return x;
    };
    const j: Joints = {
      hips: g("hips"), spine: g("spine"), chest: g("chest"), neck: g("neck"), head: g("head"),
      shL: g("shL"), shR: g("shR"), elL: g("elL"), elR: g("elR"), hdL: g("hdL"), hdR: g("hdR"),
      thL: g("thL"), thR: g("thR"), knL: g("knL"), knR: g("knR"),
    };
    this.j = j;
    const body = new THREE.Group();
    body.scale.setScalar(this.scaleH);
    this.root.add(body);
    body.add(j.hips);
    j.hips.position.set(0, 0.97, 0);
    j.hips.add(j.spine);
    j.spine.position.set(0, 0.08, 0);
    j.spine.add(j.chest);
    j.chest.position.set(0, 0.26, 0);
    j.chest.add(j.neck);
    j.neck.position.set(0, 0.2, 0.0);
    j.neck.add(j.head);
    j.head.position.set(0, 0.1, 0.01);

    // Becken
    const pelvis = new THREE.Mesh(lathe([[0.001, -0.1], [0.14 * broad + fem * 0.02, -0.08], [0.15 * broad + fem * 0.03, 0.0], [0.135 * broad, 0.09]], 18, 0.7), legs);
    pelvis.castShadow = true;
    j.hips.add(pelvis);
    // Rumpf
    const torsoProf: [number, number][] = [
      [0.135 * broad, -0.02], [0.13 * broad - fem * 0.015, 0.08], [0.145 * broad, 0.18],
      [0.16 * broad + fem * 0.01, 0.28], [shoulderW * 0.95, 0.4], [shoulderW * 0.7, 0.47], [0.06, 0.5],
    ];
    const torso = new THREE.Mesh(lathe(torsoProf, 22, 0.66), top);
    torso.castShadow = true;
    torso.receiveShadow = true;
    j.spine.add(torso);
    if (P.female && o.top === "dress") {
      const bust = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10), top);
      bust.scale.set(1.7, 0.75, 0.75);
      bust.position.set(0, 0.29, 0.06);
      j.spine.add(bust);
    }
    // Hals
    const neckMesh = limb(0.048 * broad, 0.042 * broad, 0.13, skin);
    neckMesh.position.y = 0.12;
    j.neck.add(neckMesh);
    // Kragen
    if (o.collar === "high") {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.085, 0.14, 18, 1, true, Math.PI * 0.15, Math.PI * 1.7), top);
      c.material = top;
      (c.material as THREE.Material).side = THREE.FrontSide;
      c.position.set(0, 0.06, -0.005);
      c.rotation.y = Math.PI;
      j.neck.add(c);
      const cIn = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.083, 0.14, 18, 1, true, Math.PI * 0.15, Math.PI * 1.7), top);
      cIn.scale.set(-1, 1, 1);
      cIn.position.copy(c.position);
      cIn.rotation.y = Math.PI;
      j.neck.add(cIn);
    } else if (o.collar === "fur") {
      const f = new THREE.Mesh(new THREE.TorusGeometry(0.13 * broad, 0.06, 8, 20), this.mat("fur"));
      f.rotation.x = Math.PI / 2;
      f.scale.set(1.25, 1, 0.8);
      f.position.y = 0.02;
      j.neck.add(f);
    } else if (o.collar === "ruff") {
      const f = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.025, 6, 20), this.mat("clothLinen"));
      f.rotation.x = Math.PI / 2;
      j.neck.add(f);
    } else if (o.collar === "cowl") {
      const f = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.05, 8, 20), top);
      f.rotation.x = Math.PI / 2;
      f.scale.set(1.1, 1, 0.85);
      f.position.y = 0.0;
      j.neck.add(f);
    }

    // Kopf
    const ghostOpt = this.ghost ? { ghostMat: ghostMaterial() } : this.isVoid ? { voidMat: voidMaterial() } : {};
    this.head = buildHead({ ...P.face, female: P.female, vampire: P.vampire ?? P.face.vampire }, P.hair, ghostOpt);
    this.head.group.position.y = 0.11;
    j.head.add(this.head.group);
    if (!this.ghost && !this.isVoid) this.mats.push(...this.head.materials);
    if (o.collar === "hood" || P.hair.style === "hood") {
      const hood = new THREE.Mesh(new THREE.SphereGeometry(0.135, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.72), top);
      hood.scale.set(1, 1.18, 1.15);
      hood.position.set(0, 0.12, -0.025);
      hood.rotation.x = -0.25;
      (hood.material as THREE.Material).side = THREE.DoubleSide;
      j.head.add(hood);
      const drape = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 0.25, 16, 1, true, Math.PI * 0.2, Math.PI * 1.6), top);
      drape.rotation.y = Math.PI;
      drape.position.set(0, -0.05, -0.02);
      j.head.add(drape);
    }

    // Arme
    const armLen = 0.3, foreLen = 0.27;
    for (const [sh, el, hd, side] of [[j.shL, j.elL, j.hdL, 1], [j.shR, j.elR, j.hdR, -1]] as [THREE.Group, THREE.Group, THREE.Group, number][]) {
      j.chest.add(sh);
      sh.position.set(side * shoulderW, 0.13, -0.01);
      const up = limb(0.05 * broad, 0.043 * broad, armLen, sleeve);
      sh.add(up);
      sh.add(el);
      el.position.y = -armLen;
      const fo = limb(0.042 * broad, 0.033 * broad, foreLen, sleeve);
      el.add(fo);
      if (trim) {
        const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.036 * broad, 0.008, 5, 12), trim);
        cuff.rotation.x = Math.PI / 2;
        cuff.position.y = -foreLen + 0.03;
        el.add(cuff);
      }
      el.add(hd);
      hd.position.y = -foreLen;
      // Hand: Handfläche + Finger + Daumen
      const palm = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.085, 0.026), skin);
      palm.position.y = -0.045;
      palm.castShadow = true;
      hd.add(palm);
      for (let f = 0; f < 4; f++) {
        const fl = 0.055 + (f === 1 || f === 2 ? 0.01 : 0);
        const fg = new THREE.Mesh(new THREE.CapsuleGeometry(0.0085, fl, 2, 6), skin);
        fg.position.set(-0.026 + f * 0.0175, -0.09 - fl / 2, 0.004);
        fg.rotation.x = 0.25;
        hd.add(fg);
      }
      const th = new THREE.Mesh(new THREE.CapsuleGeometry(0.01, 0.04, 2, 6), skin);
      th.position.set(side * -0.04, -0.045, 0.012);
      th.rotation.z = side * -0.7;
      hd.add(th);
      hd.rotation.y = side * 0.5;
    }
    // Schulterkugeln
    for (const side of [1, -1]) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.062 * broad, 12, 10), top);
      s.position.set(side * shoulderW * 0.96, 0.13, -0.01);
      s.scale.set(1.1, 0.85, 1);
      s.castShadow = true;
      j.chest.add(s);
    }

    // Beine
    const thighLen = 0.45, shinLen = 0.44;
    for (const [th, kn, side] of [[j.thL, j.knL, 1], [j.thR, j.knR, -1]] as [THREE.Group, THREE.Group, number][]) {
      j.hips.add(th);
      th.position.set(side * 0.09 * broad, -0.04, 0);
      th.add(limb(0.072 * broad + fem * 0.006, 0.055 * broad, thighLen, legs));
      th.add(kn);
      kn.position.y = -thighLen;
      kn.add(limb(0.054 * broad, 0.042, shinLen * 0.6, legs));
      const boot = limb(0.05, 0.045, shinLen * 0.45, boots);
      boot.position.y = -shinLen * 0.55;
      kn.add(boot);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.07, 0.24), boots);
      foot.position.set(0, -shinLen - 0.005, 0.05);
      foot.castShadow = true;
      kn.add(foot);
    }

    // Rock / Mantelschoß
    if (o.skirt > 0) {
      const len = 0.15 + o.skirt * 0.83;
      const flare = o.top === "dress" ? 0.34 : o.top === "robe" ? 0.3 : 0.24;
      const prof: [number, number][] = [];
      for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        prof.push([0.15 * broad + fem * 0.02 + t * t * (flare - 0.15) + t * 0.04, 0.05 - t * len]);
      }
      prof.reverse();
      const sm = this.mat(o.skirtMat ?? o.topMat, o.skirtTint ?? o.topTint);
      const sk = new THREE.Mesh(lathe(prof, 28, 0.85, o.top === "dress" ? 14 : 9, o.top === "dress" ? 0.06 : 0.05), sm);
      (sk.material as THREE.Material).side = THREE.DoubleSide;
      sk.castShadow = true;
      sk.receiveShadow = true;
      j.hips.add(sk);
      this.skirt = sk;
    }
    // Umhang / Mantel über den Schultern
    if (o.mantle && o.mantle !== "none") {
      const mm = o.mantle === "fur" ? this.mat("fur") : this.mat(o.mantleMat ?? "clothDark");
      const cape = new THREE.Mesh(new THREE.CylinderGeometry(shoulderW * 1.15, shoulderW * 1.7, o.mantle === "fur" ? 0.3 : 0.9, 20, 4, true, Math.PI * 0.6, Math.PI * 0.8), mm);
      cape.rotation.y = Math.PI;
      cape.position.set(0, o.mantle === "fur" ? 0.32 : -0.0, -0.06);
      if (o.mantle !== "fur") cape.geometry.translate(0, -0.1, 0);
      (cape.material as THREE.Material).side = THREE.DoubleSide;
      cape.castShadow = true;
      j.chest.add(cape);
    }
    if (o.belt) {
      const b = new THREE.Mesh(new THREE.TorusGeometry(0.145 * broad, 0.018, 4, 22), this.mat("leatherBrown"));
      b.rotation.x = Math.PI / 2;
      b.scale.set(1, 0.7, 1);
      b.position.y = 0.0;
      j.spine.add(b);
      const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.035, 0.012), this.mat("iron"));
      buckle.position.set(0, 0, 0.1 * broad);
      j.spine.add(buckle);
    }
    if (o.bag) {
      const bag = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.17, 0.08), this.mat("leatherBrown"));
      bag.position.set(-0.2 * broad, -0.08, 0.02);
      bag.rotation.y = 0.2;
      j.hips.add(bag);
      const strap = new THREE.Mesh(new THREE.TorusGeometry(0.22 * broad, 0.008, 4, 30), this.mat("leatherBrown"));
      strap.rotation.set(0.1, Math.PI / 2, 0.55);
      strap.position.set(0, 0.26, 0);
      strap.scale.set(1, 1.35, 0.55);
      j.spine.add(strap);
      const scroll = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.22, 8), this.mat("clothLinen"));
      scroll.position.set(-0.22 * broad, 0.03, 0.0);
      scroll.rotation.z = 0.3;
      j.hips.add(scroll);
    }
    if (trim && o.top === "coat") {
      // Silberne Schließen am Mantel
      for (let i = 0; i < 4; i++) {
        const c = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.012, 0.01), trim);
        c.position.set(0, 0.12 + i * 0.07, 0.105 * broad);
        j.spine.add(c);
      }
    }
    if (o.gem !== undefined) {
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.012), this.ghost ? ghostMaterial() : new THREE.MeshStandardMaterial({ color: o.gem, emissive: o.gem, emissiveIntensity: 0.6, roughness: 0.1 }));
      gem.position.set(0, 0.04, 0.05);
      j.neck.add(gem);
      const choker = new THREE.Mesh(new THREE.TorusGeometry(0.047, 0.005, 4, 18), this.mat("leather"));
      choker.rotation.x = Math.PI / 2;
      choker.position.y = 0.05;
      j.neck.add(choker);
    }
    this.root.traverse((x) => {
      const m = x as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = !this.ghost;
        m.receiveShadow = !this.ghost;
        if (this.ghost) m.renderOrder = 8;
      }
    });
    this.applyPose(POSES.stand, 1);
  }

  setPose(p: Pose, instant = false): void {
    this.poseFrom = this.currentPoseSnapshot();
    this.pose = p;
    this.poseT = instant ? 1 : 0;
    if (instant) this.applyPose(POSES[p], 1);
  }

  private currentPoseSnapshot(): PoseDef {
    const s: PoseDef = { hipY: this.j.hips.position.y - 0.97 };
    for (const k of Object.keys(this.j) as JKey[]) {
      const r = this.j[k].rotation;
      s[k] = [r.x, r.y, r.z];
    }
    return s;
  }

  private applyPose(target: PoseDef, k: number): void {
    const from = this.poseFrom;
    for (const key of Object.keys(this.j) as JKey[]) {
      if (key === "head") continue;
      const a = from[key] ?? [0, 0, 0];
      const b = target[key] ?? (POSES.stand[key] ?? [0, 0, 0]);
      this.j[key].rotation.set(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k);
    }
    const hy0 = from.hipY ?? 0, hy1 = target.hipY ?? 0;
    this.j.hips.position.y = 0.97 + hy0 + (hy1 - hy0) * k;
  }

  setMood(m: Mood): void {
    this.mood = m;
  }

  talk(seconds: number): void {
    this.talkTime = Math.max(this.talkTime, seconds);
  }

  /** Läuft linear zu einem Punkt. */
  walkTo(to: THREE.Vector3, dur: number): Promise<void> {
    return new Promise((resolve) => {
      if (this.walk?.resolve) this.walk.resolve();
      this.walk = { from: this.root.position.clone(), to: to.clone(), dur: Math.max(0.1, dur), t: 0, resolve };
      const d = to.clone().sub(this.root.position);
      if (d.lengthSq() > 0.001) this.root.rotation.y = Math.atan2(d.x, d.z);
      this.walkSpeed = d.length() / dur;
    });
  }

  headWorld(): THREE.Vector3 {
    const v = new THREE.Vector3();
    this.j.head.getWorldPosition(v);
    v.y += 0.09 * this.scaleH;
    return v;
  }

  fadeIn(seconds: number): void {
    this.opacity = 0;
    this.fadeDir = 1;
    this.fadeSpeed = 1 / seconds;
  }

  fadeOut(seconds: number): void {
    this.fadeDir = -1;
    this.fadeSpeed = 1 / seconds;
  }

  update(dt: number, _time: number): void {
    if (this.disposed) return;
    if (this.frozen) return;
    this.t += dt;
    const t = this.t;
    // Posenübergang
    if (this.poseT < 1) {
      this.poseT = Math.min(1, this.poseT + dt * 2.2);
      const e = this.poseT * this.poseT * (3 - 2 * this.poseT);
      this.applyPose(POSES[this.pose], e);
    }
    // Gehen
    let walking = false;
    if (this.walk) {
      const w = this.walk;
      w.t += dt;
      const k = Math.min(1, w.t / w.dur);
      this.root.position.lerpVectors(w.from, w.to, k);
      walking = k < 1;
      if (k >= 1) {
        const r = w.resolve;
        this.walk = null;
        this.walkSpeed = 0;
        r?.();
      }
    }
    if (this.locomotion > 0.15) {
      walking = true;
      this.walkSpeed = this.locomotion;
    }
    const j = this.j;
    const standLike = this.pose === "stand" || this.pose === "armsCrossed" || this.pose === "handsClasped" || this.pose === "holdLantern" || this.pose === "feral" || this.pose === "guard" || this.pose === "hangHead" || this.pose === "lookUp";
    if (walking && standLike) {
      this.walkPhase += dt * Math.max(3.5, this.walkSpeed * 4.2);
      const s = Math.sin(this.walkPhase);
      const amp = Math.min(0.55, 0.25 + this.walkSpeed * 0.18);
      j.thL.rotation.x = s * amp;
      j.thR.rotation.x = -s * amp;
      j.knL.rotation.x = Math.max(0, -Math.cos(this.walkPhase)) * amp * 1.3;
      j.knR.rotation.x = Math.max(0, Math.cos(this.walkPhase)) * amp * 1.3;
      if (this.pose === "stand") {
        j.shL.rotation.x = -s * amp * 0.6;
        j.shR.rotation.x = s * amp * 0.6;
      }
      j.hips.position.y = 0.97 + (POSES[this.pose].hipY ?? 0) + Math.abs(Math.cos(this.walkPhase)) * 0.025;
      if (this.skirt) this.skirt.rotation.x = s * 0.05;
    } else if (this.poseT >= 1 && standLike) {
      // Gewichtsverlagerung
      const sway = Math.sin(t * 0.4) * 0.02;
      j.hips.rotation.z = sway;
      j.spine.rotation.z = -sway * 0.8;
      const pd = POSES[this.pose];
      j.thL.rotation.x += ((pd.thL?.[0] ?? 0) - j.thL.rotation.x) * Math.min(1, dt * 5);
      j.thR.rotation.x += ((pd.thR?.[0] ?? 0) - j.thR.rotation.x) * Math.min(1, dt * 5);
      j.knL.rotation.x += ((pd.knL?.[0] ?? 0) - j.knL.rotation.x) * Math.min(1, dt * 5);
      j.knR.rotation.x += ((pd.knR?.[0] ?? 0) - j.knR.rotation.x) * Math.min(1, dt * 5);
      if (this.skirt) this.skirt.rotation.x *= 0.9;
    }
    // Atmen
    const br = Math.sin(t * 1.5) * 0.012 * this.breathe;
    j.chest.scale.set(1 + br * 0.4, 1 + br * 0.2, 1 + br);
    j.chest.rotation.x = (POSES[this.pose].chest?.[0] ?? 0) + br * 0.4;

    // Gesten beim Sprechen
    if (this.talkTime > 0) {
      this.talkTime -= dt;
      const jawOpen = Math.max(0, Math.sin(t * 15) * 0.5 + Math.sin(t * 9.3) * 0.5) * 0.17;
      this.head.jaw.rotation.x = jawOpen + this.moodCur.jaw;
      if (standLike && this.pose !== "armsCrossed") {
        j.elR.rotation.x = (POSES[this.pose].elR?.[0] ?? -0.12) - 0.25 - Math.sin(t * 1.7) * 0.15;
        j.hdR.rotation.z = Math.sin(t * 2.1) * 0.15;
      }
      j.neck.rotation.x = (POSES[this.pose].neck?.[0] ?? 0) + Math.sin(t * 3.1) * 0.03;
    } else {
      this.head.jaw.rotation.x += (this.moodCur.jaw - this.head.jaw.rotation.x) * Math.min(1, dt * 8);
    }

    // Mimik
    const mt = MOODS[this.mood];
    const mk = Math.min(1, dt * 4);
    this.moodCur.brow += (mt.brow - this.moodCur.brow) * mk;
    this.moodCur.browIn += (mt.browIn - this.moodCur.browIn) * mk;
    this.moodCur.mouth += (mt.mouth - this.moodCur.mouth) * mk;
    this.moodCur.jaw += (mt.jaw - this.moodCur.jaw) * mk;
    this.head.browL.position.y = this.head.browL.userData.y0 ?? (this.head.browL.userData.y0 = this.head.browL.position.y);
    this.head.browL.position.y = this.head.browL.userData.y0 + this.moodCur.brow;
    this.head.browR.position.y = (this.head.browR.userData.y0 ?? (this.head.browR.userData.y0 = this.head.browR.position.y)) + this.moodCur.brow;
    this.head.browL.rotation.z = -this.moodCur.browIn;
    this.head.browR.rotation.z = this.moodCur.browIn;
    this.head.mouthL.position.y = (this.head.mouthL.userData.y0 ?? (this.head.mouthL.userData.y0 = this.head.mouthL.position.y)) + this.moodCur.mouth;
    this.head.mouthR.position.y = (this.head.mouthR.userData.y0 ?? (this.head.mouthR.userData.y0 = this.head.mouthR.position.y)) + this.moodCur.mouth;

    // Blinzeln
    this.blinkT -= dt;
    let lid = -0.75;
    if (this.blinkT < 0.12) lid = 0.25;
    if (this.blinkT <= 0) this.blinkT = 2 + Math.random() * 4;
    if (this.mood === "kalt" || this.mood === "wuetend") lid += 0.18;
    for (const l of this.head.lids) l.rotation.x += (lid - l.rotation.x) * Math.min(1, dt * 30);

    // Blickverfolgung
    const baseNeck = POSES[this.pose].neck ?? [0, 0, 0];
    if (this.faceTarget) {
      const hw = this.headWorld();
      const local = this.faceTarget.clone().sub(hw);
      const yawWorld = Math.atan2(local.x, local.z);
      let rel = yawWorld - this.root.rotation.y;
      while (rel > Math.PI) rel -= Math.PI * 2;
      while (rel < -Math.PI) rel += Math.PI * 2;
      if (this.turnToTarget && Math.abs(rel) > 0.9 && standLike && !this.walk) {
        this.root.rotation.y += Math.sign(rel) * Math.min(Math.abs(rel) - 0.6, dt * 2.2);
      }
      const yaw = THREE.MathUtils.clamp(rel, -1.1, 1.1);
      const pitch = THREE.MathUtils.clamp(-Math.atan2(local.y, Math.hypot(local.x, local.z)), -0.5, 0.5);
      j.head.rotation.y += (yaw - j.head.rotation.y) * Math.min(1, dt * 4);
      j.head.rotation.x += (pitch - j.head.rotation.x) * Math.min(1, dt * 4);
      for (const e of this.head.eyes) {
        e.rotation.y = THREE.MathUtils.clamp((rel - j.head.rotation.y) * 0.6, -0.35, 0.35);
        e.rotation.x = THREE.MathUtils.clamp((pitch - j.head.rotation.x) * 0.6, -0.25, 0.25);
      }
    } else {
      j.head.rotation.y += (Math.sin(t * 0.23) * 0.12 - j.head.rotation.y) * Math.min(1, dt * 1.5);
      j.head.rotation.x += (baseNeck[0] * 0.3 + Math.sin(t * 0.31) * 0.04 - j.head.rotation.x) * Math.min(1, dt * 1.5);
    }
    j.head.rotation.z = this.headTilt;

    // Augenleuchten (Vampire)
    if (!this.ghost && !this.isVoid) this.head.eyeMat.emissiveIntensity = this.eyeGlow * 3;

    // Ein-/Ausblenden
    if (this.fadeDir !== 0) {
      this.opacity = THREE.MathUtils.clamp(this.opacity + this.fadeDir * dt * this.fadeSpeed, 0, 1);
      this.root.traverse((x) => {
        const m = x as THREE.Mesh;
        if (m.isMesh) m.visible = this.opacity > 0.02;
      });
      this.root.scale.setScalar(this.ghost ? 0.96 + this.opacity * 0.04 : 1);
      if (this.ghost) ghostMaterial().opacity = 0.38;
      if (this.fadeDir < 0 && this.opacity <= 0) {
        this.fadeDir = 0;
        this.root.visible = false;
      } else if (this.fadeDir > 0 && this.opacity >= 1) this.fadeDir = 0;
    }
  }

  dispose(): void {
    this.disposed = true;
    this.root.parent?.remove(this.root);
    this.root.traverse((x) => {
      const m = x as THREE.Mesh;
      if (m.isMesh) m.geometry.dispose();
    });
    for (const m of this.mats) {
      const mm = m as THREE.MeshStandardMaterial;
      mm.map?.dispose();
      mm.emissiveMap?.dispose();
      m.dispose();
    }
  }
}
