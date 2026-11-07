import * as THREE from "three";
import { canvas, canvasTex } from "../graphics/Textures";
import { noise3, Rng, fbm } from "../graphics/Noise";

// Prozedural modellierter Kopf mit Gesichtsknochen (Kiefer, Brauen, Mundwinkel)
// für Lippenbewegung und Mimik. Gesichtsmerkmale werden per Parameter variiert,
// damit jede Figur ein eigenständiges, wiedererkennbares Gesicht erhält.

export interface FaceParams {
  width?: number;
  length?: number;
  jaw?: number;
  chin?: number;
  cheek?: number;
  gaunt?: number;
  nose?: number;
  noseW?: number;
  noseHook?: number;
  brow?: number;
  lips?: number;
  female?: boolean;
  age?: number;
  skin: [number, number, number];
  pallor?: number; // vampirische Blässe 0..1
  eye: string; // Irisfarbe
  vampire?: boolean;
  browColor: string;
  browThick?: number;
  browArch?: number;
  lipColor?: string;
  stubble?: number;
  stubbleColor?: string;
  scars?: { x: number; y: number; len: number; ang: number }[];
  liner?: number; // Lidschatten / dunkle Augenringe
  faceless?: boolean;
  seed?: number;
}

export interface HairParams {
  style: "short" | "swept" | "long" | "updo" | "shaggy" | "curly" | "tonsure" | "bald" | "kerchief" | "braids" | "white" | "hood";
  color: string;
  beard?: "none" | "stubble" | "short" | "full" | "goatee";
  beardColor?: string;
  thickness?: number;
}

export interface HeadRig {
  group: THREE.Group;
  mesh: THREE.SkinnedMesh;
  jaw: THREE.Bone;
  browL: THREE.Bone;
  browR: THREE.Bone;
  mouthL: THREE.Bone;
  mouthR: THREE.Bone;
  eyes: THREE.Object3D[];
  lids: THREE.Mesh[];
  eyeMat: THREE.MeshStandardMaterial;
  materials: THREE.Material[];
  skinMat: THREE.MeshStandardMaterial;
}

function gauss(d2: number, r: number): number {
  return Math.exp(-d2 / (r * r));
}

/** Richtung auf der Einheitskugel -> UV der SphereGeometry. */
export function dirToUV(x: number, y: number, z: number): [number, number] {
  const l = Math.hypot(x, y, z);
  x /= l; y /= l; z /= l;
  let phi = Math.atan2(z, -x);
  if (phi < 0) phi += Math.PI * 2;
  const theta = Math.acos(THREE.MathUtils.clamp(y, -1, 1));
  return [phi / (Math.PI * 2), 1 - theta / Math.PI];
}

/** Formt einen Punkt der Einheitskugel zum Kopf (Rückgabe in Metern). */
export function sculpt(dx: number, dy: number, dz: number, p: FaceParams, out = new THREE.Vector3()): THREE.Vector3 {
  const w = p.width ?? 1, len = p.length ?? 1;
  const fem = p.female ? 1 : 0;
  let rx = 0.077 * w * (1 - fem * 0.05);
  const ry = 0.113 * len;
  const rz = 0.099;
  let x = dx * rx, y = dy * ry, z = dz * rz;
  if (p.faceless) {
    // glatte, maskenhafte Fläche
    if (dz > 0) z *= 0.92;
    return out.set(x, y, z);
  }
  // Kiefer verjüngen
  if (dy < 0) {
    const k = Math.pow(-dy, 1.4) * (0.34 - 0.12 * ((p.jaw ?? 1) - 1) + fem * 0.06);
    x *= 1 - k;
    if (dz < -0.2) z *= 1 - Math.pow(-dy, 2) * 0.25;
  }
  // Hinterkopf
  if (dz < 0 && dy > -0.4) z *= 1.06;
  // Kinn
  if (dy < -0.55 && dz > 0.3) {
    const t = (-dy - 0.55) / 0.45;
    z += (p.chin ?? 1) * 0.011 * t * dz;
    y -= (p.chin ?? 1) * 0.004 * t;
  }
  // Stirn leicht abflachen
  if (dy > 0.5 && dz > 0.4) z *= 1 - (dy - 0.5) * 0.12;
  const n = new THREE.Vector3(dx, dy, dz);
  let push = 0;
  for (const sx of [-1, 1]) {
    // Wangenknochen
    push += (p.cheek ?? 1) * 0.006 * gauss((dx - sx * 0.6) ** 2 + (dy + 0.08) ** 2 + (dz - 0.74) ** 2, 0.22);
    // hohle Wangen
    push -= (p.gaunt ?? 0) * 0.01 * gauss((dx - sx * 0.55) ** 2 + (dy + 0.38) ** 2 + (dz - 0.72) ** 2, 0.2);
    // Augenhöhlen
    push -= 0.012 * gauss((dx - sx * 0.33) ** 2 + (dy - 0.17) ** 2 + (dz - 0.92) ** 2, 0.16);
    // Brauenbogen
    push += (p.brow ?? 1) * (0.0045 - fem * 0.0015) * gauss((dx - sx * 0.34) ** 2 + (dy - 0.37) ** 2 + (dz - 0.88) ** 2, 0.15);
    // Nasenflügel
    push += 0.004 * (p.noseW ?? 1) * gauss((dx - sx * 0.12) ** 2 + (dy + 0.27) ** 2 + (dz - 0.95) ** 2, 0.07);
  }
  // Nase: Rücken + Spitze
  if (dz > 0.6) {
    const nw = 0.085 * (p.noseW ?? 1);
    const across = Math.exp(-(dx * dx) / (nw * nw));
    const nl = p.nose ?? 1;
    let prof = 0;
    if (dy < 0.3 && dy > -0.3) {
      const t = (0.3 - dy) / 0.55; // 0 an der Wurzel, 1 an der Spitze
      prof = (0.004 + t * t * 0.019 * nl) * (dy < -0.22 ? Math.max(0, 1 - (-0.22 - dy) / 0.08) : 1);
      // Höcker
      prof += (p.noseHook ?? 0) * 0.004 * gauss((dy - 0.05) ** 2, 0.1);
    }
    z += prof * across;
    if (dy < -0.18 && dy > -0.3) y -= 0.004 * across * nl;
  }
  // Lippen
  if (dz > 0.7 && Math.abs(dx) < 0.32) {
    const lw = Math.exp(-(dx * dx) / 0.05);
    const lp = p.lips ?? 1;
    push += lp * 0.0045 * lw * gauss((dy + 0.45) ** 2, 0.05);
    push += lp * 0.005 * lw * gauss((dy + 0.57) ** 2, 0.055);
    push -= 0.003 * lw * gauss((dy + 0.51) ** 2, 0.02);
  }
  out.set(x, y, z).addScaledVector(n, push);
  return out;
}

function featurePos(p: FaceParams, x: number, y: number, z: number): THREE.Vector3 {
  const n = new THREE.Vector3(x, y, z).normalize();
  return sculpt(n.x, n.y, n.z, p);
}

// ---------------------------------------------------------------------------
// Gesichtstextur
// ---------------------------------------------------------------------------

function rgb(c: [number, number, number], k = 1): string {
  return `rgb(${Math.round(Math.min(255, c[0] * 255 * k))},${Math.round(Math.min(255, c[1] * 255 * k))},${Math.round(Math.min(255, c[2] * 255 * k))})`;
}

function paintFace(p: FaceParams, hair: HairParams): THREE.CanvasTexture {
  const W = 1024, H = 512;
  const [c, ctx] = canvas(W, H);
  const rng = new Rng(p.seed ?? 3);
  const pallor = p.pallor ?? 0;
  const k = 0.74;
  const skin: [number, number, number] = [
    (p.skin[0] * (1 - pallor * 0.15) + pallor * 0.08) * k,
    (p.skin[1] * (1 - pallor * 0.1) + pallor * 0.06) * k,
    (p.skin[2] * (1 - pallor * 0.02) + pallor * 0.1) * k,
  ];
  ctx.fillStyle = rgb(skin);
  ctx.fillRect(0, 0, W, H);
  const P = (x: number, y: number, z: number): [number, number] => {
    const [u, v] = dirToUV(x, y, z);
    return [u * W, (1 - v) * H];
  };
  const scaleX = W / (Math.PI * 2);
  // Hautstruktur
  const img = ctx.getImageData(0, 0, W, H);
  for (let yy = 0; yy < H; yy++) {
    for (let xx = 0; xx < W; xx++) {
      const i = (yy * W + xx) * 4;
      const n = fbm(xx / W, yy / H, 32, 3, p.seed ?? 3) - 0.5;
      const k = 1 + n * 0.08;
      img.data[i] *= k;
      img.data[i + 1] *= k;
      img.data[i + 2] *= k;
    }
  }
  ctx.putImageData(img, 0, 0);
  // Wangen / Blässe
  for (const sx of [-1, 1]) {
    const [cx, cy] = P(sx * 0.55, -0.2, 0.8);
    const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 40);
    g.addColorStop(0, pallor > 0.5 ? "rgba(140,150,190,0.12)" : "rgba(200,90,80,0.16)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - 50, cy - 50, 100, 100);
  }
  // Augenringe / Lidschatten
  for (const sx of [-1, 1]) {
    const [cx, cy] = P(sx * 0.33, 0.13, 0.93);
    const g = ctx.createRadialGradient(cx, cy + 4, 2, cx, cy + 4, 26);
    const a = 0.07 + (p.liner ?? 0) * 0.22 + (p.vampire ? 0.08 : 0) + (p.age ?? 0) * 0.12;
    g.addColorStop(0, `rgba(40,20,30,${a})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - 30, cy - 30, 60, 60);
  }
  // Augenbrauen
  ctx.strokeStyle = p.browColor;
  ctx.lineCap = "round";
  for (const sx of [-1, 1]) {
    const th = (p.browThick ?? 1) * (p.female ? 3.2 : 5);
    const pts: [number, number][] = [];
    for (let t = 0; t <= 1.0001; t += 0.1) {
      const bx = sx * (0.14 + t * 0.32);
      const by = 0.33 + Math.sin(t * Math.PI) * 0.04 * (p.browArch ?? 1) - t * 0.02;
      pts.push(P(bx, by, 0.93));
    }
    for (let k = 0; k < 3; k++) {
      ctx.lineWidth = th * (1 - k * 0.25);
      ctx.globalAlpha = 0.55 + k * 0.15;
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y + k * 0.6) : ctx.moveTo(x, y + k * 0.6)));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  // Lippen
  {
    const [cx, cy] = P(0, -0.51, 1);
    const lw = 0.2 * scaleX * 1.05;
    ctx.fillStyle = p.lipColor ?? (p.female ? "rgba(120,40,50,0.85)" : "rgba(140,85,80,0.55)");
    ctx.beginPath();
    ctx.ellipse(cx, cy - 4, lw, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx, cy + 5, lw * 0.85, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(40,15,20,0.7)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx - lw, cy);
    ctx.quadraticCurveTo(cx, cy + 2, cx + lw, cy);
    ctx.stroke();
  }
  // Nasenschatten / Nasenlöcher
  for (const sx of [-1, 1]) {
    const [nx, ny] = P(sx * 0.07, -0.27, 0.97);
    ctx.fillStyle = "rgba(50,25,25,0.35)";
    ctx.beginPath();
    ctx.ellipse(nx, ny, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Bartschatten
  const st = Math.max(p.stubble ?? 0, hair.beard === "stubble" ? 0.6 : 0);
  if (st > 0) {
    const sc = p.stubbleColor ?? hair.beardColor ?? hair.color;
    for (let i = 0; i < 3500 * st; i++) {
      const dx = rng.range(-0.7, 0.7);
      const dy = rng.range(-0.95, -0.3);
      if (Math.abs(dx) < 0.22 && dy > -0.62 && dy < -0.42) continue;
      const [x, y] = P(dx, dy, Math.sqrt(Math.max(0.05, 1 - dx * dx - dy * dy)));
      ctx.fillStyle = sc;
      ctx.globalAlpha = 0.25 * st;
      ctx.fillRect(x, y, 1.6, 1.6);
    }
    ctx.globalAlpha = 1;
  }
  // Narben
  for (const s of p.scars ?? []) {
    const [x, y] = P(s.x, s.y, Math.sqrt(Math.max(0.05, 1 - s.x * s.x - s.y * s.y)));
    ctx.strokeStyle = "rgba(170,100,95,0.85)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - Math.cos(s.ang) * s.len, y - Math.sin(s.ang) * s.len);
    ctx.lineTo(x + Math.cos(s.ang) * s.len, y + Math.sin(s.ang) * s.len);
    ctx.stroke();
    ctx.strokeStyle = "rgba(90,40,40,0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  // Ohren-/Halsschatten unten
  const g = ctx.createLinearGradient(0, H * 0.82, 0, H);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(30,10,15,0.35)");
  ctx.fillStyle = g;
  ctx.fillRect(0, H * 0.82, W, H * 0.18);
  return canvasTex(c);
}

function paintEye(color: string, vampire: boolean): [THREE.CanvasTexture, THREE.CanvasTexture] {
  const [c, ctx] = canvas(128, 64);
  ctx.fillStyle = "#d9d2c8";
  ctx.fillRect(0, 0, 128, 64);
  const cx = 32, cy = 32;
  // Äderchen
  ctx.strokeStyle = "rgba(160,40,40,0.25)";
  for (let i = 0; i < 10; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + (Math.random() - 0.5) * 60, cy + (Math.random() - 0.5) * 50);
    ctx.lineTo(cx + (Math.random() - 0.5) * 20, cy + (Math.random() - 0.5) * 20);
    ctx.stroke();
  }
  const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 11);
  g.addColorStop(0, color);
  g.addColorStop(0.75, color);
  g.addColorStop(1, "#1a1010");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 8.5, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#050303";
  ctx.beginPath();
  ctx.ellipse(cx, cy, 3, 4.2, 0, 0, Math.PI * 2);
  ctx.fill();
  const [ec, ectx] = canvas(128, 64);
  ectx.fillStyle = "#000";
  ectx.fillRect(0, 0, 128, 64);
  if (vampire) {
    const eg = ectx.createRadialGradient(cx, cy, 1, cx, cy, 11);
    eg.addColorStop(0, "#ff2a20");
    eg.addColorStop(0.7, "#c01010");
    eg.addColorStop(1, "#000");
    ectx.fillStyle = eg;
    ectx.beginPath();
    ectx.ellipse(cx, cy, 9, 11.5, 0, 0, Math.PI * 2);
    ectx.fill();
  }
  return [canvasTex(c), canvasTex(ec)];
}

function hairTexture(color: string, seed: number): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 256);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 256, 256);
  const rng = new Rng(seed);
  for (let i = 0; i < 1400; i++) {
    const x = rng.next() * 256;
    const l = rng.range(30, 120);
    ctx.strokeStyle = rng.next() > 0.5 ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.22)";
    ctx.lineWidth = rng.range(0.5, 1.5);
    ctx.beginPath();
    const y = rng.next() * 256;
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + rng.range(-6, 6), y + l / 2, x + rng.range(-8, 8), y + l);
    ctx.stroke();
  }
  const t = canvasTex(c, true, true);
  return t;
}

// ---------------------------------------------------------------------------
// Aufbau
// ---------------------------------------------------------------------------

export function buildHead(p: FaceParams, hair: HairParams, opts: { ghostMat?: THREE.Material; voidMat?: THREE.Material } = {}): HeadRig {
  const group = new THREE.Group();
  const geo = new THREE.SphereGeometry(1, 72, 54);
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  const dirs: THREE.Vector3[] = [];
  const tmp = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    const d = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
    dirs.push(d);
    sculpt(d.x, d.y, d.z, p, tmp);
    pos.setXYZ(i, tmp.x, tmp.y, tmp.z);
  }
  geo.computeVertexNormals();

  // Knochen
  const root = new THREE.Bone();
  const jaw = new THREE.Bone();
  const browL = new THREE.Bone();
  const browR = new THREE.Bone();
  const mouthL = new THREE.Bone();
  const mouthR = new THREE.Bone();
  const jawPivot = featurePos(p, 0, -0.05, -0.15);
  jaw.position.set(0, jawPivot.y, 0.0);
  root.add(jaw);
  const bl = featurePos(p, 0.34, 0.36, 0.88), br = featurePos(p, -0.34, 0.36, 0.88);
  browL.position.copy(bl);
  browR.position.copy(br);
  root.add(browL, browR);
  const ml = featurePos(p, 0.22, -0.51, 0.95), mr = featurePos(p, -0.22, -0.51, 0.95);
  mouthL.position.copy(ml).sub(jaw.position);
  mouthR.position.copy(mr).sub(jaw.position);
  jaw.add(mouthL, mouthR);
  const bones = [root, jaw, browL, browR, mouthL, mouthR];

  // Gewichte
  const skinIndex: number[] = [];
  const skinWeight: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    const d = dirs[i];
    const w = [0, 0, 0, 0, 0, 0];
    // Unterkiefer: alles unterhalb der Mundlinie im vorderen/unteren Bereich
    if (!p.faceless) {
      const below = THREE.MathUtils.smoothstep(-d.y, 0.47, 0.6);
      const front = THREE.MathUtils.smoothstep(d.z, -0.35, 0.2);
      w[1] = below * front;
      w[2] = gauss((d.x - 0.34) ** 2 + (d.y - 0.36) ** 2 + (d.z - 0.88) ** 2, 0.13);
      w[3] = gauss((d.x + 0.34) ** 2 + (d.y - 0.36) ** 2 + (d.z - 0.88) ** 2, 0.13);
      w[4] = gauss((d.x - 0.22) ** 2 + (d.y + 0.5) ** 2 + (d.z - 0.95) ** 2, 0.1);
      w[5] = gauss((d.x + 0.22) ** 2 + (d.y + 0.5) ** 2 + (d.z - 0.95) ** 2, 0.1);
    }
    w[0] = Math.max(0, 1 - w[1] - w[2] - w[3]);
    const idx = w.map((v, k) => [v, k]).sort((a, b) => b[0] - a[0]).slice(0, 4);
    const sum = idx.reduce((s, x) => s + x[0], 0) || 1;
    for (const [v, k] of idx) {
      skinIndex.push(k);
      skinWeight.push(v / sum);
    }
  }
  geo.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(skinIndex, 4));
  geo.setAttribute("skinWeight", new THREE.Float32BufferAttribute(skinWeight, 4));

  const faceTex = p.faceless ? null : paintFace(p, hair);
  const skinMat = (opts.ghostMat as THREE.MeshStandardMaterial) ?? (opts.voidMat as THREE.MeshStandardMaterial) ?? new THREE.MeshStandardMaterial({
    map: faceTex, roughness: 0.72, metalness: 0,
  });
  const mesh = new THREE.SkinnedMesh(geo, skinMat);
  mesh.add(root);
  mesh.bind(new THREE.Skeleton(bones));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  group.add(mesh);
  const materials: THREE.Material[] = [skinMat];

  // Mundinnenraum
  const mouthIn = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), opts.ghostMat ?? opts.voidMat ?? new THREE.MeshBasicMaterial({ color: 0x120506 }));
  const mi = featurePos(p, 0, -0.5, 0.9);
  mouthIn.position.set(0, mi.y, mi.z - 0.03);
  mouthIn.scale.set(1.4, 0.8, 1);
  group.add(mouthIn);

  // Augen + Lider
  const [eyeTex, eyeEm] = paintEye(p.eye, !!p.vampire);
  const eyeMat = (opts.ghostMat as THREE.MeshStandardMaterial) ?? new THREE.MeshStandardMaterial({
    map: eyeTex, roughness: 0.15, emissive: new THREE.Color(1, 0.1, 0.05), emissiveMap: eyeEm, emissiveIntensity: 0,
  });
  if (!opts.ghostMat) materials.push(eyeMat);
  const eyes: THREE.Object3D[] = [];
  const lids: THREE.Mesh[] = [];
  if (!p.faceless) {
    for (const sx of [1, -1]) {
      const c = featurePos(p, sx * 0.33, 0.17, 0.92);
      const eyeR = 0.0122;
      const pivot = new THREE.Object3D();
      pivot.position.set(c.x * 0.97, c.y, c.z - eyeR * 0.55);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(eyeR, 16, 12), eyeMat);
      pivot.add(ball);
      group.add(pivot);
      eyes.push(pivot);
      const lid = new THREE.Mesh(new THREE.SphereGeometry(eyeR * 1.12, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), skinMat instanceof THREE.MeshStandardMaterial && !opts.ghostMat ? new THREE.MeshStandardMaterial({ color: new THREE.Color(...p.skin).multiplyScalar(0.58), roughness: 0.75 }) : skinMat);
      lid.position.copy(pivot.position);
      lid.rotation.x = -0.75;
      group.add(lid);
      lids.push(lid);
      if (lid.material !== skinMat) materials.push(lid.material as THREE.Material);
    }
    // Ohren
    for (const sx of [1, -1]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), skinMat instanceof THREE.MeshStandardMaterial && !opts.ghostMat && !opts.voidMat ? new THREE.MeshStandardMaterial({ color: new THREE.Color(...p.skin).multiplyScalar(0.62), roughness: 0.72 }) : skinMat);
      const ep = featurePos(p, sx * 0.98, 0.02, -0.08);
      ear.position.copy(ep);
      ear.scale.set(0.35, 1.05, 0.7);
      ear.rotation.y = sx * 0.4;
      if (p.vampire) ear.scale.y = 1.15;
      group.add(ear);
      if (ear.material !== skinMat) materials.push(ear.material as THREE.Material);
    }
  }

  // Haare & Bart als Schalen über dem Kopf
  if (hair.style !== "bald" && hair.style !== "hood") {
    const hm = buildHairShell(geo, dirs, p, hair, false, opts.ghostMat ?? opts.voidMat);
    hm.forEach((m) => {
      group.add(m);
      if (!opts.ghostMat && !opts.voidMat) materials.push(m.material as THREE.Material);
    });
  }
  if (hair.beard && hair.beard !== "none" && hair.beard !== "stubble") {
    const bm = buildHairShell(geo, dirs, p, hair, true, opts.ghostMat ?? opts.voidMat);
    bm.forEach((m) => {
      // Bart folgt dem Kiefer
      jaw.add(m);
      m.position.sub(jaw.position);
      if (!opts.ghostMat && !opts.voidMat) materials.push(m.material as THREE.Material);
    });
  }
  return { group, mesh, jaw, browL, browR, mouthL, mouthR, eyes, lids, eyeMat, materials, skinMat };
}

function hairMask(d: THREE.Vector3, style: HairParams["style"]): number {
  const s = THREE.MathUtils.smoothstep;
  // Haaransatz vorn
  const front = d.z > 0 ? s(d.y, 0.48, 0.6) : 1;
  // seitlich über den Ohren, hinten bis zum Nacken
  const side = s(d.y, d.z > -0.2 ? 0.05 : -0.65, d.z > -0.2 ? 0.2 : -0.45);
  let m = Math.min(front, side);
  if (style === "tonsure") m *= 1 - s(d.y, 0.75, 0.85);
  if (style === "kerchief") m = d.y > 0.25 || (d.z < 0 && d.y > -0.5) ? 1 : 0;
  return m;
}

function beardMask(d: THREE.Vector3, kind: HairParams["beard"]): number {
  const s = THREE.MathUtils.smoothstep;
  if (d.z < -0.3) return 0;
  let m = s(-d.y, 0.22, 0.32) * s(d.z, -0.3, 0.1);
  // Mund freilassen
  const mouth = Math.exp(-((d.x * d.x) / 0.06 + ((d.y + 0.51) ** 2) / 0.006));
  m *= 1 - mouth;
  if (kind === "goatee") m *= Math.exp(-(d.x * d.x) / 0.04) * s(-d.y, 0.55, 0.65);
  if (kind === "short") m *= 0.8;
  return m;
}

function buildHairShell(base: THREE.BufferGeometry, dirs: THREE.Vector3[], p: FaceParams, hair: HairParams, beard: boolean, overrideMat?: THREE.Material): THREE.Mesh[] {
  const out: THREE.Mesh[] = [];
  const g = new THREE.BufferGeometry();
  const src = base.getAttribute("position") as THREE.BufferAttribute;
  const nor = base.getAttribute("normal") as THREE.BufferAttribute;
  const positions = new Float32Array(src.count * 3);
  const th = (hair.thickness ?? 1) * (beard ? (hair.beard === "full" ? 0.016 : 0.008) : hair.style === "shaggy" ? 0.022 : hair.style === "curly" ? 0.018 : hair.style === "updo" ? 0.02 : 0.012);
  for (let i = 0; i < src.count; i++) {
    const d = dirs[i];
    const m = beard ? beardMask(d, hair.beard) : hairMask(d, hair.style);
    const n = noise3(d.x * 9, d.y * 9, d.z * 9, 4);
    const strands = beard ? 0.6 + n * 0.8 : hair.style === "curly" ? 0.6 + noise3(d.x * 22, d.y * 22, d.z * 22, 2) * 0.9 : 0.75 + n * 0.5;
    let off = m > 0.02 ? th * m * strands : -0.004;
    // Scheitel / Schwung nach hinten
    if (!beard && hair.style === "swept" && d.y > 0.6 && d.z > 0) off *= 1.3;
    positions[i * 3] = src.getX(i) + nor.getX(i) * off;
    positions[i * 3 + 1] = src.getY(i) + nor.getY(i) * off + (beard ? -m * 0.004 : 0);
    positions[i * 3 + 2] = src.getZ(i) + nor.getZ(i) * off;
  }
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  g.setAttribute("uv", base.getAttribute("uv").clone());
  g.setIndex(base.getIndex()!.clone());
  g.computeVertexNormals();
  const color = beard ? hair.beardColor ?? hair.color : hair.color;
  const mat = overrideMat ?? new THREE.MeshStandardMaterial({
    map: hairTexture(color, p.seed ?? 5), roughness: 0.55, metalness: 0.05, color: 0xffffff,
  });
  const m = new THREE.Mesh(g, mat);
  m.castShadow = true;
  out.push(m);
  if (!beard) {
    // Zusätzliche Haarpartien
    const extra = (geo: THREE.BufferGeometry, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) => {
      const mm = new THREE.Mesh(geo, mat);
      mm.position.set(x, y, z);
      mm.rotation.set(rx, ry, rz);
      mm.castShadow = true;
      out.push(mm);
    };
    if (hair.style === "long" || hair.style === "white") {
      const len = hair.style === "white" ? 0.36 : 0.42;
      const back = new THREE.CylinderGeometry(0.085, 0.11, len, 18, 6, true, Math.PI * 0.55, Math.PI * 1.9);
      const bp = back.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < bp.count; i++) {
        const y = bp.getY(i);
        const k = 1 + Math.sin(bp.getX(i) * 60) * 0.03 + (y < 0 ? -y * 0.15 : 0);
        bp.setXYZ(i, bp.getX(i) * k, y, bp.getZ(i) * k * 0.75 - 0.02);
      }
      back.computeVertexNormals();
      extra(back, 0, -0.08 - len / 2 + 0.12, -0.02);
      // Strähnen ums Gesicht
      for (const sx of [-1, 1]) {
        const strand = new THREE.CapsuleGeometry(0.014, 0.16, 3, 8);
        extra(strand, sx * 0.07, -0.04, 0.045, 0.05, 0, sx * 0.08);
      }
    } else if (hair.style === "updo") {
      const bun = new THREE.SphereGeometry(0.055, 14, 10);
      extra(bun, 0, 0.07, -0.085);
      const braid = new THREE.TorusGeometry(0.075, 0.012, 6, 24);
      extra(braid, 0, 0.085, -0.01, Math.PI / 2 - 0.25, 0, 0);
    } else if (hair.style === "braids") {
      for (const sx of [-1, 1]) {
        const br = new THREE.CapsuleGeometry(0.016, 0.2, 3, 8);
        extra(br, sx * 0.07, -0.12, -0.04, 0.15, 0, sx * 0.15);
      }
    } else if (hair.style === "shaggy") {
      const back = new THREE.SphereGeometry(0.09, 14, 10, 0, Math.PI * 2, Math.PI * 0.4, Math.PI * 0.5);
      extra(back, 0, -0.04, -0.035, 0.2, 0, 0);
    }
  }
  return out;
}
