import * as THREE from "three";
import { canvas, canvasTex } from "../graphics/Textures";
import { Rng } from "../graphics/Noise";
import { voidMaterial } from "./Character";

// Werwolfgestalt mit Schalen-Fell (Shell Fur) und prozeduraler Animation.

let furTex: THREE.Texture | null = null;
function furTexture(): THREE.Texture {
  if (furTex) return furTex;
  const [c, ctx] = canvas(256, 256);
  const img = ctx.createImageData(256, 256);
  const rng = new Rng(17);
  for (let i = 0; i < 256 * 256; i++) img.data[i * 4 + 3] = 0;
  for (let k = 0; k < 9000; k++) {
    const x = Math.floor(rng.next() * 256), y = Math.floor(rng.next() * 256);
    const h = rng.next();
    for (let dy = 0; dy < 2; dy++) {
      for (let dx = 0; dx < 2; dx++) {
        const i = (((y + dy) % 256) * 256 + ((x + dx) % 256)) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
        img.data[i + 3] = Math.max(img.data[i + 3], h * 255);
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  furTex = canvasTex(c, false, true);
  furTex.repeat.set(6, 6);
  return furTex;
}

function furShells(base: THREE.Mesh, color: THREE.Color, length: number, layers = 6): THREE.Mesh[] {
  const out: THREE.Mesh[] = [];
  for (let i = 1; i <= layers; i++) {
    const t = i / layers;
    const m = new THREE.MeshStandardMaterial({
      color: color.clone().multiplyScalar(0.6 + t * 0.6),
      alphaMap: furTexture(),
      alphaTest: 0.15 + t * 0.55,
      transparent: false,
      roughness: 1,
      side: THREE.DoubleSide,
    });
    const off = length * t;
    m.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>\n transformed += normal * ${off.toFixed(4)} + vec3(0.0, ${(-off * 0.4).toFixed(4)}, 0.0);`);
    };
    const s = new THREE.Mesh(base.geometry, m);
    s.castShadow = i === 1;
    out.push(s);
  }
  return out;
}

export type WolfState = "idle" | "prowl" | "run" | "lunge" | "howl" | "stagger" | "crouch" | "dead";

export class Werewolf {
  root = new THREE.Group();
  private hips = new THREE.Group();
  private chest = new THREE.Group();
  private neck = new THREE.Group();
  private head = new THREE.Group();
  private jaw = new THREE.Group();
  private arms: { sh: THREE.Group; el: THREE.Group }[] = [];
  private legs: { th: THREE.Group; kn: THREE.Group; an: THREE.Group }[] = [];
  private tail = new THREE.Group();
  private eyeMat: THREE.MeshStandardMaterial;
  private mats: THREE.Material[] = [];
  state: WolfState = "idle";
  private t = Math.random() * 10;
  locomotion = 0;
  faceTarget: THREE.Vector3 | null = null;
  disposed = false;
  scale: number;

  constructor(opts: { color?: number; eye?: number; scale?: number; corrupted?: boolean; void?: boolean } = {}) {
    this.scale = opts.scale ?? 1;
    const col = new THREE.Color(opts.color ?? 0x2a2018);
    const skin = opts.void ? voidMaterial() : new THREE.MeshStandardMaterial({ color: col.clone().multiplyScalar(0.7), roughness: 0.95 });
    this.mats.push(skin);
    this.eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: new THREE.Color(opts.eye ?? 0xffa020), emissiveIntensity: 3 });
    this.mats.push(this.eyeMat);
    const bone = new THREE.MeshStandardMaterial({ color: 0xd8ccb0, roughness: 0.4 });
    this.mats.push(bone);
    const fur = (m: THREE.Mesh, len = 0.035) => {
      if (opts.void) return;
      furShells(m, col, len).forEach((s) => m.add(s));
    };
    const mesh = (g: THREE.BufferGeometry, parent: THREE.Object3D, furLen = 0.035) => {
      const m = new THREE.Mesh(g, skin);
      m.castShadow = true;
      parent.add(m);
      if (furLen > 0) fur(m, furLen);
      return m;
    };
    const body = new THREE.Group();
    body.scale.setScalar(this.scale);
    this.root.add(body);
    body.add(this.hips);
    this.hips.position.set(0, 1.05, 0);
    // Becken
    const pelvis = new THREE.SphereGeometry(0.2, 14, 10);
    pelvis.scale(1.1, 0.8, 0.9);
    mesh(pelvis, this.hips);
    // Brustkorb (nach vorn geneigt)
    this.hips.add(this.chest);
    this.chest.position.set(0, 0.15, 0.05);
    this.chest.rotation.x = 0.55;
    const torso = new THREE.SphereGeometry(0.32, 18, 14);
    torso.scale(1.15, 1.25, 0.95);
    torso.translate(0, 0.32, 0.02);
    mesh(torso, this.chest, 0.05);
    // Nacken & Kopf
    this.chest.add(this.neck);
    this.neck.position.set(0, 0.62, 0.12);
    this.neck.rotation.x = -0.3;
    const neckG = new THREE.CylinderGeometry(0.13, 0.18, 0.3, 12);
    neckG.translate(0, 0.1, 0.04);
    mesh(neckG, this.neck, 0.06);
    this.neck.add(this.head);
    this.head.position.set(0, 0.25, 0.08);
    this.head.rotation.x = -0.25;
    const skull = new THREE.SphereGeometry(0.15, 16, 12);
    skull.scale(1, 0.95, 1.15);
    mesh(skull, this.head, 0.03);
    const snout = new THREE.CylinderGeometry(0.055, 0.1, 0.26, 12);
    snout.rotateX(Math.PI / 2);
    snout.translate(0, -0.03, 0.22);
    mesh(snout, this.head, 0.015);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshStandardMaterial({ color: 0x050404, roughness: 0.3 }));
    nose.position.set(0, -0.0, 0.35);
    this.head.add(nose);
    this.head.add(this.jaw);
    this.jaw.position.set(0, -0.07, 0.08);
    const jawG = new THREE.CylinderGeometry(0.04, 0.075, 0.24, 10);
    jawG.rotateX(Math.PI / 2);
    jawG.translate(0, -0.02, 0.12);
    mesh(jawG, this.jaw, 0.01);
    // Zähne
    const rng = new Rng(9);
    for (let i = 0; i < 10; i++) {
      const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.035, 4), bone);
      const s = i % 2 ? 1 : -1;
      tooth.position.set(s * (0.03 + rng.next() * 0.015), -0.065, 0.2 + Math.floor(i / 2) * 0.03);
      tooth.rotation.x = Math.PI;
      this.head.add(tooth);
    }
    // Ohren
    for (const s of [-1, 1]) {
      const ear = new THREE.ConeGeometry(0.05, 0.16, 6);
      const e = mesh(ear, this.head, 0.015);
      e.position.set(s * 0.09, 0.14, -0.04);
      e.rotation.set(-0.3, 0, s * -0.35);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), this.eyeMat);
      eye.position.set(s * 0.065, 0.04, 0.14);
      this.head.add(eye);
    }
    // Arme
    for (const s of [-1, 1]) {
      const sh = new THREE.Group();
      sh.position.set(s * 0.38, 0.55, 0.05);
      this.chest.add(sh);
      const up = new THREE.CylinderGeometry(0.1, 0.075, 0.45, 10);
      up.translate(0, -0.22, 0);
      mesh(up, sh, 0.04);
      const el = new THREE.Group();
      el.position.y = -0.45;
      sh.add(el);
      const lo = new THREE.CylinderGeometry(0.075, 0.055, 0.45, 10);
      lo.translate(0, -0.22, 0);
      mesh(lo, el, 0.03);
      const hand = new THREE.SphereGeometry(0.08, 10, 8);
      hand.scale(1, 1.2, 0.6);
      hand.translate(0, -0.5, 0.02);
      mesh(hand, el, 0.01);
      for (let f = 0; f < 4; f++) {
        const claw = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.09, 4), bone);
        claw.position.set(-0.04 + f * 0.027, -0.6, 0.04);
        claw.rotation.x = Math.PI - 0.4;
        el.add(claw);
      }
      sh.rotation.set(-0.5, 0, s * -0.2);
      el.rotation.x = -0.6;
      this.arms.push({ sh, el });
    }
    // Beine (digitigrad)
    for (const s of [-1, 1]) {
      const th = new THREE.Group();
      th.position.set(s * 0.17, -0.05, 0);
      this.hips.add(th);
      const tg = new THREE.CylinderGeometry(0.12, 0.08, 0.45, 10);
      tg.translate(0, -0.22, 0);
      mesh(tg, th, 0.04);
      const kn = new THREE.Group();
      kn.position.y = -0.45;
      th.add(kn);
      const sg = new THREE.CylinderGeometry(0.07, 0.05, 0.4, 8);
      sg.translate(0, -0.2, 0);
      mesh(sg, kn, 0.03);
      const an = new THREE.Group();
      an.position.y = -0.4;
      kn.add(an);
      const fg = new THREE.CylinderGeometry(0.045, 0.04, 0.3, 8);
      fg.translate(0, -0.15, 0);
      mesh(fg, an, 0.02);
      const paw = new THREE.SphereGeometry(0.07, 8, 6);
      paw.scale(1, 0.5, 1.6);
      paw.translate(0, -0.3, 0.06);
      mesh(paw, an, 0.0);
      th.rotation.x = -0.55;
      kn.rotation.x = 1.0;
      an.rotation.x = -0.7;
      this.legs.push({ th, kn, an });
    }
    // Schwanz
    this.tail.position.set(0, 0.0, -0.2);
    this.hips.add(this.tail);
    const tailG = new THREE.ConeGeometry(0.08, 0.6, 8);
    tailG.translate(0, -0.3, 0);
    mesh(tailG, this.tail, 0.06);
    this.tail.rotation.x = -2.4;
    if (opts.corrupted) this.eyeMat.emissive.set(0xff1a10);
  }

  setState(s: WolfState): void {
    this.state = s;
  }

  update(dt: number): void {
    if (this.disposed) return;
    this.t += dt;
    const t = this.t;
    const br = Math.sin(t * (this.state === "run" ? 8 : 2.2));
    this.chest.scale.set(1 + br * 0.015, 1 + br * 0.01, 1 + br * 0.02);
    let jawOpen = 0.05 + Math.max(0, br) * 0.05;
    let headX = -0.25 + Math.sin(t * 0.7) * 0.05;
    let chestX = 0.55;
    const move = this.locomotion > 0.2 || this.state === "prowl" || this.state === "run";
    if (move) {
      const speed = this.state === "run" || this.locomotion > 4 ? 10 : 5.5;
      const ph = t * speed;
      const amp = this.state === "run" || this.locomotion > 4 ? 0.7 : 0.4;
      this.legs[0].th.rotation.x = -0.55 + Math.sin(ph) * amp;
      this.legs[1].th.rotation.x = -0.55 - Math.sin(ph) * amp;
      this.legs[0].kn.rotation.x = 1.0 + Math.max(0, Math.cos(ph)) * amp;
      this.legs[1].kn.rotation.x = 1.0 + Math.max(0, -Math.cos(ph)) * amp;
      this.arms[0].sh.rotation.x = -0.5 - Math.sin(ph) * amp * 0.8;
      this.arms[1].sh.rotation.x = -0.5 + Math.sin(ph) * amp * 0.8;
      this.hips.position.y = 1.05 + Math.abs(Math.sin(ph)) * 0.06;
      chestX = 0.55 + (this.state === "run" ? 0.25 : 0.1);
    } else {
      for (const l of this.legs) {
        l.th.rotation.x += (-0.55 - l.th.rotation.x) * Math.min(1, dt * 5);
        l.kn.rotation.x += (1.0 - l.kn.rotation.x) * Math.min(1, dt * 5);
      }
      this.hips.position.y += (1.05 - this.hips.position.y) * Math.min(1, dt * 5);
      for (const a of this.arms) a.sh.rotation.x += (-0.5 + Math.sin(t * 1.3) * 0.05 - a.sh.rotation.x) * Math.min(1, dt * 4);
    }
    if (this.state === "lunge") {
      chestX = 0.95;
      jawOpen = 0.5;
      for (const a of this.arms) {
        a.sh.rotation.x = -1.6;
        a.el.rotation.x = -0.2;
      }
    } else {
      for (const a of this.arms) a.el.rotation.x += (-0.6 - a.el.rotation.x) * Math.min(1, dt * 5);
    }
    if (this.state === "howl") {
      headX = -1.1;
      chestX = 0.1;
      jawOpen = 0.45;
    }
    if (this.state === "stagger") {
      chestX = 0.2 + Math.sin(t * 20) * 0.08;
      headX = 0.3;
    }
    if (this.state === "crouch") {
      chestX = 0.9;
      this.hips.position.y += (0.75 - this.hips.position.y) * Math.min(1, dt * 4);
    }
    if (this.state === "dead") {
      this.root.rotation.z += (1.5 - this.root.rotation.z) * Math.min(1, dt * 3);
      this.hips.position.y += (0.3 - this.hips.position.y) * Math.min(1, dt * 3);
    }
    this.chest.rotation.x += (chestX - this.chest.rotation.x) * Math.min(1, dt * 6);
    this.head.rotation.x += (headX - this.head.rotation.x) * Math.min(1, dt * 5);
    this.jaw.rotation.x += (jawOpen - this.jaw.rotation.x) * Math.min(1, dt * 10);
    this.tail.rotation.z = Math.sin(t * 1.4) * 0.2;
    if (this.faceTarget) {
      const hw = new THREE.Vector3();
      this.head.getWorldPosition(hw);
      const d = this.faceTarget.clone().sub(hw);
      let rel = Math.atan2(d.x, d.z) - this.root.rotation.y;
      while (rel > Math.PI) rel -= Math.PI * 2;
      while (rel < -Math.PI) rel += Math.PI * 2;
      this.head.rotation.y += (THREE.MathUtils.clamp(rel, -0.8, 0.8) - this.head.rotation.y) * Math.min(1, dt * 4);
    }
    this.eyeMat.emissiveIntensity = 2.5 + Math.sin(t * 3) * 0.5;
  }

  headWorld(): THREE.Vector3 {
    const v = new THREE.Vector3();
    this.head.getWorldPosition(v);
    return v;
  }

  dispose(): void {
    this.disposed = true;
    this.root.parent?.remove(this.root);
    this.root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.geometry.dispose();
        const mm = m.material as THREE.Material;
        if (mm !== voidMaterial()) mm.dispose();
      }
    });
  }
}
