// First-Person-Viewmodel: Samis Hände, das Smartphone (mit echtem Bildschirm als Textur),
// Taschenlampe und kurze Interaktionsanimationen (Greifen, Klettern, Verbinden, Werfen).
import * as THREE from 'three';
import { damp, clamp } from '../core/rng.js';
import { makeItemMesh } from '../world/items.js';

function skinMat() { return new THREE.MeshStandardMaterial({ color: 0xc7987a, roughness: 0.65 }); }

function buildHand(mirror = 1) {
  const g = new THREE.Group();
  const skin = skinMat();
  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.028, 0.095), skin); g.add(palm);
  for (let i = 0; i < 4; i++) {
    const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.0095, 0.06 - Math.abs(i - 1.5) * 0.008, 3, 6), skin);
    f.rotation.x = Math.PI / 2 - 0.5; f.position.set((-0.03 + i * 0.02) * mirror, -0.008, -0.07);
    g.add(f);
  }
  const th = new THREE.Mesh(new THREE.CapsuleGeometry(0.011, 0.045, 3, 6), skin);
  th.rotation.set(Math.PI / 2 - 0.3, 0, 0.9 * mirror); th.position.set(0.05 * mirror, -0.005, -0.02); g.add(th);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.036, 0.32, 10), skin);
  arm.rotation.x = Math.PI / 2; arm.position.set(0, -0.005, 0.2); g.add(arm);
  const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.22, 10), new THREE.MeshStandardMaterial({ color: 0x8fb0c4, roughness: 0.9 }));
  sleeve.rotation.x = Math.PI / 2; sleeve.position.set(0, -0.005, 0.38); g.add(sleeve);
  g.userData.sleeve = sleeve;
  return g;
}

// Glock 17 im Viewmodel (Lauf zeigt nach -z, Griff nach unten in die Hand)
function buildGlock() {
  const g = new THREE.Group();
  const poly = new THREE.MeshStandardMaterial({ color: 0x1c1e20, roughness: 0.6, metalness: 0.1 });
  const steel = new THREE.MeshStandardMaterial({ color: 0x2b2d30, roughness: 0.32, metalness: 0.75 });
  const add = (geo, mat, x, y, z, rx = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.x = rx; g.add(m); return m; };
  add(new THREE.BoxGeometry(0.03, 0.032, 0.19), steel, 0, 0.058, -0.06);           // Schlitten
  add(new THREE.BoxGeometry(0.028, 0.02, 0.17), poly, 0, 0.034, -0.052);          // Griffstück oben
  add(new THREE.BoxGeometry(0.03, 0.105, 0.05), poly, 0, -0.012, 0.012, -0.28);   // Griff
  add(new THREE.BoxGeometry(0.004, 0.022, 0.04), poly, 0, 0.012, -0.03);          // Abzugsbügel
  add(new THREE.BoxGeometry(0.006, 0.008, 0.006), steel, 0, 0.078, -0.148);       // Korn
  add(new THREE.BoxGeometry(0.02, 0.008, 0.006), steel, 0, 0.078, 0.03);          // Kimme
  const mz = add(new THREE.CylinderGeometry(0.006, 0.006, 0.004, 8), new THREE.MeshBasicMaterial({ color: 0x050505 }), 0, 0.058, -0.156, Math.PI / 2);
  // Mündungsfeuer
  const flashMat = new THREE.MeshBasicMaterial({ color: 0xffc070, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const fl = new THREE.Group();
  for (let i = 0; i < 3; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.09), flashMat); p.rotation.z = i * 1.05; fl.add(p); }
  fl.position.set(0, 0.058, -0.2); fl.visible = false; g.add(fl);
  g.userData.flash = fl; void mz;
  return g;
}

export class Hands {
  constructor(game, phoneCanvas) {
    this.game = game;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(52, 1, 0.01, 10);
    this.amb = new THREE.AmbientLight(0xffffff, 0.3); this.scene.add(this.amb);
    this.key = new THREE.DirectionalLight(0xffffff, 0.6); this.key.position.set(0.5, 1, 0.3); this.scene.add(this.key);
    this.flash = new THREE.PointLight(0xfff4e8, 0, 1.2, 2); this.scene.add(this.flash);

    // Linke Hand + Telefon
    this.left = new THREE.Group(); this.scene.add(this.left);
    const lh = buildHand(-1); lh.rotation.set(0.1, 0, -0.25); this.left.add(lh);
    this.phone = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.074, 0.152, 0.009), new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.35, metalness: 0.6 }));
    this.phone.add(body);
    this.screenTex = new THREE.CanvasTexture(phoneCanvas);
    this.screenTex.colorSpace = THREE.SRGBColorSpace;
    this.screenTex.anisotropy = 4;
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.068, 0.145), new THREE.MeshBasicMaterial({ map: this.screenTex, toneMapped: false }));
    scr.position.z = 0.0048; this.phone.add(scr);
    this.screenMesh = scr;
    const cam = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.003, 10), new THREE.MeshStandardMaterial({ color: 0x050505 }));
    cam.rotation.x = Math.PI / 2; cam.position.set(-0.022, 0.06, -0.006); this.phone.add(cam);
    this.led = new THREE.Mesh(new THREE.CircleGeometry(0.004, 10), new THREE.MeshBasicMaterial({ color: 0x222222 }));
    this.led.rotation.y = Math.PI; this.led.position.set(-0.01, 0.06, -0.0047); this.phone.add(this.led);
    this.phone.position.set(0.0, 0.035, -0.03); this.phone.rotation.set(-0.15, 0, 0);
    this.left.add(this.phone);

    // Rechte Hand
    this.right = new THREE.Group(); this.scene.add(this.right);
    const rh = buildHand(1); rh.rotation.set(0.1, 0, 0.25); this.right.add(rh);
    this.rightHand = rh;
    this.carryMesh = null;
    this.healMesh = null;
    this.gun = buildGlock(); this.gun.visible = false;
    this.gun.position.set(0.0, 0.035, -0.045); this.right.add(this.gun);
    this.shotT = 0;

    this.leftPose = new THREE.Vector3(-0.22, -0.42, -0.3); this.leftRot = new THREE.Euler();
    this.rightPose = new THREE.Vector3(0.25, -0.5, -0.32);
    this.anim = null; this.animT = 0;
    this.flashlightOn = false;
    this.time = 0;
    this.bob = 0;
    this.visibleLeft = 0; this.visibleRight = 0;
    this.left.visible = false; this.right.visible = false;
    this.sleeveColor = 0x8fb0c4;
  }

  setSleeve(hex) {
    this.sleeveColor = hex;
    for (const h of [this.left, this.right]) h.traverse((o) => { if (o === o.parent?.userData?.sleeve) o.material.color.setHex(hex); });
    this.left.children[0].userData.sleeve.material.color.setHex(hex);
    this.right.children[0].userData.sleeve.material.color.setHex(hex);
  }

  resize(w, h) { this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); }

  reach() { this.anim = 'reach'; this.animT = 0; }
  vault() { this.anim = 'vault'; this.animT = 0; }
  heal(type) {
    this.anim = 'heal'; this.animT = 0;
    if (this.healMesh) this.right.remove(this.healMesh);
    this.healMesh = makeItemMesh(type === 'medkit' ? 'medkit' : type === 'pills' ? 'pills' : 'bandage');
    this.healMesh.scale.setScalar(type === 'medkit' ? 0.5 : 1.2);
    this.healMesh.position.set(0, 0.03, -0.08);
    this.right.add(this.healMesh);
  }
  cancel() { this.anim = null; if (this.healMesh) { this.right.remove(this.healMesh); this.healMesh = null; } }
  throw() { this.anim = 'throw'; this.animT = 0; }
  push() { this.anim = 'push'; this.animT = 0; }
  shoot() { this.shotT = 0.06; }
  setFlashlight(on) { this.flashlightOn = on; this.led.material.color.setHex(on ? 0xffffff : 0x222222); }
  setCarry(type) {
    if (this.carryMesh) { this.right.remove(this.carryMesh); this.carryMesh = null; }
    if (type) { this.carryMesh = makeItemMesh(type); this.carryMesh.position.set(0, 0.02, -0.06); this.carryMesh.rotation.set(-1.2, 0, 0); this.right.add(this.carryMesh); }
  }

  update(dt) {
    const game = this.game, p = game.player;
    this.time += dt;
    const phoneOpen = game.phone.isOpen();
    const call = game.phone.inCall;
    const hidden = p.mode === 'hidden' || p.mode === 'hideMove';
    // Telefonhaltung
    let lt, lr;
    if (phoneOpen) { lt = new THREE.Vector3(-0.055, -0.115, -0.25); lr = new THREE.Euler(0.05, 0.12, 0.02); }
    else if (call) { lt = new THREE.Vector3(-0.17, -0.2, -0.3); lr = new THREE.Euler(0.15, 0.4, 0.15); }
    else if (this.flashlightOn) { lt = new THREE.Vector3(-0.2, -0.27, -0.36); lr = new THREE.Euler(-1.15, 0.1, 0.1); }
    else { lt = new THREE.Vector3(-0.25, -0.7, -0.3); lr = new THREE.Euler(-1.2, 0, 0); }
    const showLeft = phoneOpen || call || this.flashlightOn;
    this.visibleLeft = damp(this.visibleLeft, showLeft ? 1 : 0, 9, dt);
    const lowered = 1 - this.visibleLeft;
    const bobAmp = clamp(p.bobAmt, 0, 2) * 0.006;
    const bx = Math.sin(p.bobT) * bobAmp, by = Math.abs(Math.sin(p.bobT)) * bobAmp * 1.4;
    const sway = Math.sin(this.time * 1.2) * 0.003 * (1 + p.injury * 3);
    this.leftPose.lerp(lt, 1 - Math.exp(-10 * dt));
    this.left.position.set(this.leftPose.x + bx + sway, this.leftPose.y - by - lowered * 0.25, this.leftPose.z);
    this.left.rotation.x = damp(this.left.rotation.x, lr.x, 10, dt);
    this.left.rotation.y = damp(this.left.rotation.y, lr.y, 10, dt);
    this.left.rotation.z = damp(this.left.rotation.z, lr.z, 10, dt);
    this.left.visible = this.visibleLeft > 0.02 && !(hidden && !showLeft);
    this.screenTex.needsUpdate = game.phone.dirtyTex || false;
    game.phone.dirtyTex = false;

    // Rechte Hand: Animationen
    let rt = new THREE.Vector3(0.24, -0.62, -0.32), rrx = -0.6, show = false;
    if (this.carryMesh) { rt.set(0.2, -0.3, -0.38); rrx = -0.2; show = true; }
    if (this.anim) {
      this.animT += dt;
      const a = this.anim, t = this.animT;
      if (a === 'reach') { const k = Math.sin(clamp(t / 0.4, 0, 1) * Math.PI); rt.set(0.14, -0.26 + k * 0.05, -0.36 - k * 0.22); rrx = -0.1; show = true; if (t > 0.4) this.anim = null; }
      else if (a === 'vault') { const k = Math.sin(clamp(t / 0.6, 0, 1) * Math.PI); rt.set(0.16, -0.32 - k * 0.1, -0.42); rrx = 0.4 * k; show = true; this.left.position.set(-0.16, -0.32 - k * 0.1, -0.42); this.left.visible = true; if (t > 0.6) this.anim = null; }
      else if (a === 'heal') { rt.set(0.08 + Math.sin(t * 7) * 0.04, -0.33 + Math.cos(t * 7) * 0.02, -0.3); rrx = -0.5; show = true; if (!p.heal) this.cancel(); }
      else if (a === 'throw') { const k = clamp(t / 0.35, 0, 1); rt.set(0.22 - k * 0.1, -0.2 - k * 0.3, -0.35 - k * 0.2); rrx = -0.6 + k; show = true; if (t > 0.35) this.anim = null; }
      else if (a === 'push') { const k = Math.sin(clamp(t / 0.35, 0, 1) * Math.PI); rt.set(0.12, -0.24, -0.3 - k * 0.3); rrx = 0.3; show = true; this.left.position.set(-0.12, -0.24, -0.3 - k * 0.3); this.left.visible = true; if (t > 0.35) this.anim = null; }
    } else if (this.healMesh) { this.right.remove(this.healMesh); this.healMesh = null; }
    // Glock: bereit, zielen, nachladen, Rückstoß
    const w = game.weapon;
    const gunOn = !!(w && w.drawn && !this.carryMesh && !this.anim && p.mode === 'normal');
    this.gun.visible = gunOn && this.visibleRight > 0.2;
    this.rightHand.visible = true;
    if (gunOn) {
      const a = w.aimT;
      // Hüfte: leicht seitlich, damit das Profil der Waffe sichtbar ist – Zielen: tief und mittig über Kimme und Korn
      rt.set(0.17 - a * 0.135, -0.21 + a * 0.045, -0.44 - a * 0.04); rrx = -0.03 + a * 0.02;
      this.gun.rotation.y = 0.16 * (1 - a) - 0.02 * a;
      if (w.reloading) { const k = Math.sin(this.time * 9) * 0.03; rt.set(0.14, -0.3 + k, -0.36); rrx = -0.75; }
      rt.z += w.kick * 0.05; rrx += w.kick * 0.32;
      show = true;
    }
    this.shotT = Math.max(0, this.shotT - dt);
    this.gun.userData.flash.visible = this.shotT > 0;
    if (this.shotT > 0) this.gun.userData.flash.rotation.z = Math.random() * 3;
    if (p.mode === 'grabbed') { const k = 0.5 + 0.5 * Math.sin(this.time * 18); rt.set(0.12, -0.22, -0.28 - k * 0.06); rrx = 0.2; show = true; this.left.position.set(-0.12, -0.22, -0.28 - (1 - k) * 0.06); this.left.rotation.set(0.2, 0, 0); this.left.visible = true; }
    this.visibleRight = damp(this.visibleRight, show ? 1 : 0, 12, dt);
    this.rightPose.lerp(rt, 1 - Math.exp(-14 * dt));
    this.right.position.set(this.rightPose.x + bx, this.rightPose.y - by - (1 - this.visibleRight) * 0.3, this.rightPose.z);
    this.right.rotation.x = damp(this.right.rotation.x, rrx, 12, dt);
    this.right.visible = this.visibleRight > 0.02;

    // Beleuchtung der Hände an die Umgebung anpassen
    const lvl = game.level ? game.level.lights.lightLevelAt(p.pos.x, p.pos.z) : 0.5;
    this.amb.intensity = 0.06 + lvl * 0.5;
    this.key.intensity = 0.05 + lvl * 0.6;
    this.flash.intensity = this.flashlightOn ? 0.5 : 0;
    this.flash.position.copy(this.left.position).add(new THREE.Vector3(0.02, 0.1, -0.05));
  }
}
