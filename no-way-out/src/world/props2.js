// Requisiten für Parkhaus, U-Bahn und Stadt.
import { PROPS } from './props.js';
import { colorMat, emissiveMat, signMat, getMat } from '../render/materials.js';

const CAR_COLORS = [0x2a3a52, 0x6b1a1a, 0x8a8f94, 0x1c1c1e, 0xd8d8d2, 0x30452e, 0x7a6a50, 0x3c5a7a, 0x5a2a4a];

// Auto: Front zeigt nach +z
PROPS.car = (c, o) => {
  const L = o.van ? 4.9 : 4.35, W = o.van ? 1.95 : 1.8;
  const col = o.color ?? CAR_COLORS[Math.floor(((o.x || 0) * 7 + (o.z || 0) * 13)) % CAR_COLORS.length];
  const paint = colorMat(col, o.burnt ? 0.95 : 0.32, o.burnt ? 0 : 0.55);
  const glass = o.burnt ? getMat('black') : colorMat(0x0d1418, 0.05, 0.6, { transparent: true, opacity: 0.82 });
  const bh = o.van ? 0.95 : 0.62;
  c.box(W, bh, L, paint, 0, 0.3 + bh / 2, 0);
  const ch = o.van ? 0.85 : 0.52, cl = o.van ? L * 0.8 : L * 0.5;
  c.box(W * 0.9, ch, cl, paint, 0, 0.3 + bh + ch / 2, o.van ? -0.3 : -0.15);
  // Fenster
  c.box(W * 0.92, ch * 0.75, 0.02, glass, 0, 0.3 + bh + ch * 0.5, (o.van ? -0.3 : -0.15) + cl / 2 + 0.01, { rx: o.van ? 0 : -0.35 });
  c.box(W * 0.92, ch * 0.7, 0.02, glass, 0, 0.3 + bh + ch * 0.5, (o.van ? -0.3 : -0.15) - cl / 2 - 0.01, { rx: o.van ? 0 : 0.35 });
  for (const s of [-1, 1]) c.box(0.02, ch * 0.7, cl * 0.9, glass, s * (W * 0.45 + 0.012), 0.3 + bh + ch * 0.5, o.van ? -0.3 : -0.15);
  // Räder
  for (const zz of [L * 0.32, -L * 0.32]) for (const s of [-1, 1]) {
    c.cyl(0.33, 0.33, 0.24, 'tire', s * (W / 2 - 0.1), 0.33, zz, { rz: Math.PI / 2, seg: 14 });
    c.cyl(0.2, 0.2, 0.25, o.burnt ? 'metal_rust' : 'steel', s * (W / 2 - 0.1), 0.33, zz, { rz: Math.PI / 2, seg: 10 });
  }
  // Lichter
  const headOn = o.lightsOn;
  c.box(0.35, 0.1, 0.03, headOn ? emissiveMat(0xfff4d8, 3) : colorMat(0xd8dde0, 0.1, 0.5), -W / 2 + 0.3, 0.75, L / 2 + 0.01);
  c.box(0.35, 0.1, 0.03, headOn ? emissiveMat(0xfff4d8, 3) : colorMat(0xd8dde0, 0.1, 0.5), W / 2 - 0.3, 0.75, L / 2 + 0.01);
  c.box(0.3, 0.1, 0.03, emissiveMat(0xff1a10, o.alarmLights ? 1.5 : 0.25, 0x400000), -W / 2 + 0.25, 0.78, -L / 2 - 0.01);
  c.box(0.3, 0.1, 0.03, emissiveMat(0xff1a10, o.alarmLights ? 1.5 : 0.25, 0x400000), W / 2 - 0.25, 0.78, -L / 2 - 0.01);
  c.box(0.52, 0.12, 0.02, signMat(o.plate || 'VH-' + Math.floor(1000 + ((o.x || 1) * 37 + (o.z || 1) * 91) % 8999), { bg: '#f0f0ea', fg: '#111', w: 256, h: 56, fontPx: 34 }), 0, 0.52, -L / 2 - 0.02);
  if (o.police) {
    c.box(W * 0.95, 0.12, 0.6, colorMat(0xe0e4e8, 0.4), 0, 0.3 + bh + 0.02, 0.6);
    c.box(0.5, 0.1, 0.22, emissiveMat(0x2050ff, 3), -0.3, 0.3 + bh + ch + 0.06, -0.15);
    c.box(0.5, 0.1, 0.22, emissiveMat(0x2050ff, 3), 0.3, 0.3 + bh + ch + 0.06, -0.15);
    c.lights.push({ x: -0.6, z: -0.15, y: 0.3 + bh + ch + 0.3, kind: 'blue', noMesh: true, id: o.lightId });
  }
  if (o.ambulance) {
    c.box(W + 0.01, 0.18, L * 0.9, colorMat(0xd84a10, 0.5), 0, 0.3 + bh * 0.55, 0);
    c.box(0.4, 0.1, 0.22, emissiveMat(0x3060ff, 3), 0, 0.3 + bh + ch + 0.06, 0.7);
    c.lights.push({ x: 0, z: 0.7, y: 0.3 + bh + ch + 0.3, kind: 'blue', noMesh: true });
  }
  if (o.burnt) c.lights.push({ x: 0, z: 0.3, y: 1.2, kind: 'fire', noMesh: true, range: o.fireRange || 9 });
  if (o.alarm) {
    c.sounds.push({ kind: 'caralarm_idle', x: 0, z: 0 });
    c.lights.push({ x: 0, z: L / 2 + 0.5, y: 0.75, color: 0xffc070, intensity: 5, range: 7, noMesh: true, mode: 'off', group: 'caralarm' });
    c.lights.push({ x: 0, z: -L / 2 - 0.5, y: 0.8, color: 0xff3020, intensity: 3, range: 5, noMesh: true, mode: 'off', group: 'caralarm' });
  }
  c.col(-W / 2, -L / 2, W / 2, L / 2, 0, o.van ? 2.1 : 1.45, { cover: true, tall: !!o.van, vault: !!o.vault, alarm: !!o.alarm });
  if (o.hideBehind) c.hides.push({ type: 'vehicle', ex: (o.hideSide || 1) * (W / 2 + 0.5), ez: 0, ey: 0.95, exitX: (o.hideSide || 1) * (W / 2 + 0.8), exitZ: 0.6, yaw: (o.hideSide || 1) > 0 ? -Math.PI / 2 : Math.PI / 2, prompt: 'Hinter dem Fahrzeug kauern' });
  if (o.id) c.interacts.push({ id: o.id, x: W / 2 + 0.4, z: 0.3, y: 1.0, prompt: o.prompt || 'Fahrzeug untersuchen', radius: 1.4 });
};
PROPS.pillar = (c, o) => {
  const s = o.s || 0.6;
  c.box(s, o.h || 2.6, s, o.mat || 'concrete', 0, (o.h || 2.6) / 2, 0, { uvs: 2 });
  c.box(s + 0.01, 0.5, s + 0.01, o.band ? colorMat(o.band, 0.7) : 'paint_yellow', 0, 1.0, 0);
  if (o.label) for (const r of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) c.box(0.34, 0.34, 0.01, signMat(o.label, { bg: '#1a1a1a', fg: '#e8c040', w: 128, h: 128, fontPx: 70 }), Math.sin(r) * (s / 2 + 0.008), 1.65, Math.cos(r) * (s / 2 + 0.008), { ry: r });
  c.col(-s / 2, -s / 2, s / 2, s / 2, 0, o.h || 2.6, { tall: true });
};
PROPS.concrete_barrier = (c, o) => {
  const w = o.w || 2.0;
  c.box(w, 0.25, 0.6, 'concrete', 0, 0.125, 0); c.box(w, 0.55, 0.25, 'concrete', 0, 0.52, 0);
  c.box(w, 0.08, 0.26, 'paint_red', 0, 0.62, 0);
  c.col(-w / 2, -0.3, w / 2, 0.3, 0, 0.82, { vault: true, cover: false });
};
PROPS.gate_arm = (c, o) => {
  c.box(0.35, 1.1, 0.35, 'paint_yellow', 0, 0.55, 0);
  c.box(o.len || 3.2, 0.1, 0.08, colorMat(0xe8e8e8, 0.5), (o.len || 3.2) / 2, 1.0, 0, { rz: o.up ? 1.3 : 0 });
  c.col(-0.2, -0.2, 0.2, 0.2, 0, 1.1, {});
};
PROPS.ticket_machine = (c, o) => {
  c.box(0.6, 1.6, 0.45, colorMat(o.color || 0x1e4a7a, 0.4, 0.3), 0, 0.8, 0);
  c.box(0.35, 0.25, 0.02, o.off ? 'screen_off' : emissiveMat(0x7fc0ff, 1.2, 0x102030), 0, 1.25, 0.23);
  c.col(-0.3, -0.23, 0.3, 0.23, 0, 1.6, { tall: false, cover: true });
};
PROPS.cone = (c) => { c.cyl(0.02, 0.17, 0.5, colorMat(0xff5a10, 0.6), 0, 0.27, 0, { seg: 12 }); c.box(0.36, 0.03, 0.36, colorMat(0xff5a10, 0.6), 0, 0.015, 0); };
PROPS.cart_shop = (c) => {
  c.box(0.55, 0.45, 0.85, colorMat(0x9aa0a4, 0.35, 0.8, { wireframe: true }), 0, 0.75, 0);
  c.box(0.5, 0.02, 0.8, 'chrome', 0, 0.52, 0);
  for (const x of [-0.22, 0.22]) for (const z of [-0.35, 0.35]) c.cyl(0.05, 0.05, 0.03, 'rubber', x, 0.05, z, { rz: Math.PI / 2 });
  c.col(-0.3, -0.45, 0.3, 0.45, 0, 1.0, { noFlag: true });
};
PROPS.booth_desk = (c) => { PROPS.desk(c, { w: 1.6, d: 0.6, screen: 'ui', chair: true }); };

// ---------------- U-Bahn ----------------
PROPS.bench = (c, o) => {
  const w = o.w || 2.0;
  c.box(w, 0.06, 0.45, 'wood', 0, 0.46, 0); c.box(w, 0.4, 0.05, 'wood', 0, 0.72, -0.2, { rx: -0.12 });
  for (const x of [-w / 2 + 0.15, w / 2 - 0.15]) c.box(0.06, 0.46, 0.4, 'metal_dark', x, 0.23, 0);
  c.col(-w / 2, -0.25, w / 2, 0.25, 0, 0.8, { vault: true, cover: false });
};
PROPS.rails = (c, o) => {
  const L = o.len || 20;
  for (const x of [-0.72, 0.72]) { c.box(0.08, 0.15, L, 'steel', x, 0.075, 0); }
  for (let z = -L / 2 + 0.3; z < L / 2; z += 0.65) c.box(2.2, 0.08, 0.24, 'wood', 0, 0.04, z);
  if (o.third) c.box(0.12, 0.12, L, 'metal_rust', 1.25, 0.25, 0);
};
PROPS.timetable = (c, o) => { c.box(1.0, 0.6, 0.04, signMat(o.text || 'U3  Richtung Marktplatz\n—  Betrieb eingestellt  —', { bg: '#0d1b2a', fg: '#ffcc33', glow: !o.off, w: 512, h: 300, fontPx: 46 }), 0, 2.4, 0.02); };
PROPS.station_sign = (c, o) => { c.box(o.w || 3.2, 0.5, 0.05, signMat(o.text || 'KLINIKUM', { bg: '#14365c', fg: '#ffffff', glow: !!o.glow, w: 1024, h: 160, fontPx: 96 }), 0, o.y || 2.6, 0.025); };
PROPS.cable_tray = (c, o) => { const L = o.len || 10; c.box(0.4, 0.06, L, 'metal_dark', 0, o.y || 3.3, 0); for (let i = 0; i < 4; i++) c.cyl(0.025, 0.025, L, i % 2 ? 'rubber' : colorMat(0x7a3a1a, 0.6), -0.12 + i * 0.08, (o.y || 3.3) + 0.05, 0, { rx: Math.PI / 2, seg: 6 }); };
PROPS.pipe = (c, o) => { const L = o.len || 10; c.cyl(o.r || 0.12, o.r || 0.12, L, o.mat || 'metal_rust', 0, o.y || 2.6, 0, { rx: Math.PI / 2, seg: 10 }); };
PROPS.train_seat = (c, o) => {
  const w = o.w || 1.8;
  c.box(w, 0.08, 0.5, 'fabric_seat', 0, 0.45, 0); c.box(w, 0.5, 0.08, 'fabric_seat', 0, 0.75, -0.24);
  c.box(w, 0.42, 0.45, 'metal_dark', 0, 0.21, 0);
  c.col(-w / 2, -0.28, w / 2, 0.28, 0, 0.95, { cover: false });
};
PROPS.pole = (c) => { c.cyl(0.025, 0.025, 2.3, 'chrome', 0, 1.15, 0); c.col(-0.05, -0.05, 0.05, 0.05, 0, 2.3, { noFlag: true }); };
PROPS.escalator = (c, o) => {
  const L = o.len || 6, rise = o.rise || 3;
  const steps = Math.round(L / 0.4);
  for (let i = 0; i < steps; i++) c.box(1.1, 0.06, 0.38, 'metal_dark', 0, (i / steps) * rise + 0.03, -L / 2 + i * (L / steps) + 0.2);
  for (const x of [-0.65, 0.65]) c.box(0.1, 0.9, L * 1.05, 'steel', x, rise / 2 + 0.45, 0, { rx: -Math.atan2(rise, L) });
};

// ---------------- Stadt ----------------
PROPS.streetlamp = (c, o) => {
  c.cyl(0.07, 0.1, 5.6, 'metal_dark', 0, 2.8, 0, { seg: 8 });
  c.box(0.1, 0.1, 1.2, 'metal_dark', 0, 5.55, 0.55);
  c.box(0.35, 0.12, 0.5, 'metal_dark', 0, 5.5, 1.1);
  if (!o.off) { c.box(0.3, 0.02, 0.4, emissiveMat(0xffc888, 3.5), 0, 5.43, 1.1); c.lights.push({ x: 0, z: 1.1, y: 5.3, kind: 'street', noMesh: true, mode: o.mode || 'steady', group: o.group }); }
  c.col(-0.12, -0.12, 0.12, 0.12, 0, 5.6, { noFlag: true });
};
PROPS.trafficlight = (c, o) => {
  c.cyl(0.06, 0.06, 3.2, 'metal_dark', 0, 1.6, 0);
  c.box(0.3, 0.8, 0.25, 'plastic_dark', 0, 3.3, 0.1);
  c.box(0.16, 0.16, 0.02, emissiveMat(0xffa000, 2.5), 0, 3.3, 0.235);
  c.lights.push({ x: 0, z: 0.5, y: 3.3, color: 0xffa000, intensity: 2.2, range: 5, noMesh: true, mode: 'strobe' });
  c.col(-0.08, -0.08, 0.08, 0.08, 0, 3.2, { noFlag: true });
};
PROPS.tree = (c, o) => {
  c.cyl(0.12, 0.18, 2.6, 'wood', 0, 1.3, 0, { seg: 8 });
  const r = (o.s || 1);
  for (let i = 0; i < 6; i++) { const a = i * 1.05; c.sphere(0.9 * r, 'plant', Math.cos(a) * 0.5 * r, 3.0 + (i % 3) * 0.4, Math.sin(a) * 0.5 * r, { sy: 0.7, seg: 7, segH: 5 }); }
  c.box(1.2, 0.05, 1.2, 'metal_dark', 0, 0.02, 0);
  c.col(-0.2, -0.2, 0.2, 0.2, 0, 2.6, {});
};
PROPS.dumpster = (c, o) => {
  c.box(1.8, 1.15, 1.1, colorMat(o.color || 0x2a4a3a, 0.6, 0.3), 0, 0.6, 0);
  c.box(1.85, 0.06, 1.15, 'plastic_dark', 0, 1.2, 0, { rx: o.open ? -1 : 0 });
  c.col(-0.9, -0.55, 0.9, 0.55, 0, 1.2, { cover: true });
  if (o.hide) c.hides.push({ type: 'vehicle', ex: 0, ez: -1.0, ey: 0.9, exitX: 0, exitZ: -1.3, yaw: 0, prompt: 'Hinter den Container kauern' });
};
PROPS.sandbags = (c, o) => {
  const w = o.w || 2.4;
  for (let row = 0; row < 3; row++) for (let i = 0; i < Math.round(w / 0.55); i++) c.box(0.55, 0.2, 0.4, 'sandbag', -w / 2 + 0.28 + i * 0.55 + (row % 2) * 0.12, 0.1 + row * 0.2, 0, { ry: (i % 2) * 0.08 });
  c.col(-w / 2, -0.25, w / 2, 0.25, 0, 0.62, { vault: true, cover: false });
};
PROPS.barricade = (c, o) => {
  const w = o.w || 2.2;
  for (const x of [-w / 2 + 0.1, w / 2 - 0.1]) { c.box(0.08, 0.95, 0.5, colorMat(0xe8e8e8, 0.5), x, 0.47, 0, { rx: 0.3 }); }
  c.box(w, 0.2, 0.04, signMat('▰▱▰▱▰▱▰▱▰▱▰▱', { bg: '#d02020', fg: '#ffffff', w: 512, h: 48, fontPx: 40 }), 0, 0.85, 0.05);
  c.box(w, 0.2, 0.04, colorMat(0xd02020, 0.5), 0, 0.55, 0.05);
  c.col(-w / 2, -0.25, w / 2, 0.25, 0, 0.95, { vault: true, cover: true });
};
PROPS.fence = (c, o) => {
  const w = o.w || 3.5;
  c.box(w, 2.0, 0.04, colorMat(0x8a9096, 0.4, 0.8, { wireframe: true }), 0, 1.0, 0);
  for (let x = -w / 2; x <= w / 2 + 0.01; x += w / 2) c.box(0.05, 2.0, 0.3, 'metal_dark', x, 1.0, 0);
  c.col(-w / 2, -0.08, w / 2, 0.08, 0, 2.0, {});
};
PROPS.military_truck = (c) => {
  c.box(2.4, 1.0, 6.4, 'military', 0, 1.1, 0);
  c.box(2.3, 1.2, 1.8, 'military', 0, 2.1, 2.2);
  c.box(2.4, 1.6, 4.2, colorMat(0x4a5038, 0.95), 0, 2.4, -1.0);
  for (const z of [2.2, -0.8, -2.2]) for (const s of [-1, 1]) c.cyl(0.5, 0.5, 0.35, 'tire', s * 1.05, 0.5, z, { rz: Math.PI / 2, seg: 14 });
  c.box(2.1, 0.5, 0.02, colorMat(0x0c1214, 0.05, 0.6), 0, 2.3, 3.11);
  c.col(-1.2, -3.2, 1.2, 3.2, 0, 3.2, { tall: true });
};
PROPS.generator = (c, o) => {
  c.box(1.6, 1.1, 0.9, colorMat(0x5a6a3a, 0.6, 0.3), 0, 0.55, 0);
  c.box(0.5, 0.35, 0.02, 'plastic_dark', 0.35, 0.8, 0.46);
  c.cyl(0.07, 0.07, 0.5, 'metal_dark', -0.6, 1.3, -0.2);
  c.col(-0.8, -0.45, 0.8, 0.45, 0, 1.1, { cover: true });
  if (o.id) c.interacts.push({ id: o.id, x: 0.3, z: 0.75, y: 0.9, prompt: o.prompt || 'Generator starten', radius: 1.2, hold: o.hold || 1.5 });
};
PROPS.tent = (c) => {
  c.box(4.0, 0.05, 4.0, colorMat(0x4a5036, 0.95), 0, 2.5, 0);
  for (const x of [-1.9, 1.9]) for (const z of [-1.9, 1.9]) c.box(0.06, 2.5, 0.06, 'metal_dark', x, 1.25, z);
  c.box(4.0, 2.3, 0.04, colorMat(0x4a5036, 0.95, 0, { side: 2 }), 0, 1.3, -1.95);
};
PROPS.bus_stop = (c) => {
  c.box(3.0, 0.06, 1.3, 'metal_dark', 0, 2.5, 0);
  c.box(3.0, 2.3, 0.03, 'glass', 0, 1.25, -0.6);
  c.box(0.06, 2.5, 0.06, 'metal_dark', -1.45, 1.25, -0.6); c.box(0.06, 2.5, 0.06, 'metal_dark', 1.45, 1.25, -0.6);
  c.box(1.1, 1.8, 0.04, signMat('NACH VORNE\nSEHEN', { bg: '#202830', fg: '#c8d0d8', glow: true, w: 256, h: 420, fontPx: 34, intensity: 0.8 }), 1.0, 1.3, -0.56);
  PROPS.bench(c, { w: 1.6 });
};
PROPS.shopfront = (c, o) => {
  const w = o.w || 4;
  c.box(w, 0.6, 0.12, signMat(o.text || 'APOTHEKE', { bg: o.bg || '#1a5a2a', fg: '#ffffff', glow: !o.off, w: 1024, h: 160, fontPx: 96, intensity: 1.2 }), 0, 3.25, 0.06);
  if (o.broken) for (let i = 0; i < 5; i++) c.box(0.3 + i * 0.07, 0.01, 0.2, 'glass', -w / 2 + 0.5 + i * 0.6, 0.01, 0.6 + (i % 2) * 0.3, { ry: i });
};
PROPS.bin = (c) => { c.cyl(0.25, 0.25, 0.9, colorMat(0xd06010, 0.6), 0, 0.45, 0, { seg: 12 }); c.col(-0.25, -0.25, 0.25, 0.25, 0, 0.9, { noFlag: true }); };
PROPS.gate_checkpoint = (c, o) => {
  // statische Pfosten (das Tor selbst ist eine Tür vom Typ 'slide')
  for (const x of [-0.2, (o.w || 4) + 0.2]) { c.box(0.4, 3.0, 0.4, 'military', x, 1.5, 0); }
  c.box((o.w || 4) + 0.8, 0.4, 0.4, 'military', (o.w || 4) / 2, 3.2, 0);
  c.box(1.6, 0.4, 0.05, signMat('KONTROLLPUNKT NORD', { bg: '#2a3020', fg: '#e8e0c0', w: 512, h: 128, fontPx: 60 }), (o.w || 4) / 2, 3.2, 0.23);
};
PROPS.deadman = (c, o) => {
  c.box(0.5, 1.2, 0.4, 'military', 0, 0.6, 0);
  c.box(0.3, 0.2, 0.05, emissiveMat(0xffb000, 1.5), 0, 1.0, 0.21);
  c.col(-0.25, -0.2, 0.25, 0.2, 0, 1.2, {});
  if (o.id) c.interacts.push({ id: o.id, x: 0, z: 0.6, y: 1.0, prompt: o.prompt || 'Torsteuerung', radius: 1.2 });
};

PROPS.stripe = (c, o) => { c.box(0.12, 0.006, o.len || 5, 'paint_white', 0, 0.004, 0); };
PROPS.stall_row = (c, o) => {
  // Markierungen für eine Reihe Stellplätze (entlang x, Tiefe in z)
  const n = o.n || 6, w = o.w || 2.6, d = o.d || 5;
  for (let i = 0; i <= n; i++) c.box(0.12, 0.006, d, 'paint_white', -n * w / 2 + i * w, 0.004, 0);
};

PROPS.turnstile = (c, o) => {
  if (o.open) { c.box(0.15, 1.0, 0.9, 'steel', -0.42, 0.5, 0); c.col(-0.5, -0.45, -0.34, 0.45, 0, 1.0, { noFlag: true }); return; }
  c.box(0.25, 1.0, 0.9, 'steel', -0.35, 0.5, 0);
  c.box(0.25, 1.0, 0.9, 'steel', 0.35, 0.5, 0);
  c.box(0.6, 0.06, 0.06, 'chrome', 0, 0.85, 0.2, { ry: 0.5 });
  c.box(0.08, 0.06, 0.04, o.broken ? 'black' : 'plastic_red', -0.35, 1.02, 0.2);
  c.col(-0.48, -0.45, 0.48, 0.45, 0, 1.0, { vault: !o.open, cover: true });
};
PROPS.trainbody = (c, o) => {
  const len = o.len || 4;
  c.box(len, 0.95, 0.1, 'train_ext', 0, 0.475, 0);
  c.box(len, 0.35, 0.1, 'train_ext', 0, 2.2, 0);
  c.box(len, 0.06, 0.12, colorMat(0xb0261c, 0.5), 0, 0.98, 0);
};
PROPS.kiosk = (c, o) => {
  c.box(2.6, 1.1, 1.2, 'wood', 0, 0.55, 0);
  c.box(2.7, 0.06, 1.3, 'plastic_dark', 0, 1.12, 0);
  c.box(2.6, 0.5, 0.05, signMat(o.text || 'KIOSK', { bg: '#1a3a6a', fg: '#ffd040', w: 512, h: 96, fontPx: 60 }), 0, 2.3, 0.62);
  c.col(-1.3, -0.6, 1.3, 0.6, 0, 1.15, { cover: true });
};

PROPS.fountain = (c) => {
  c.cyl(2.2, 2.3, 0.6, 'concrete', 0, 0.3, 0, { seg: 20 });
  c.cyl(1.9, 1.9, 0.05, colorMat(0x1a2a30, 0.05, 0.3), 0, 0.5, 0, { seg: 20 });
  c.cyl(0.35, 0.45, 1.6, 'concrete', 0, 1.1, 0, { seg: 10 });
  c.cyl(0.9, 0.6, 0.2, 'concrete', 0, 1.9, 0, { seg: 14 });
  c.col(-2.2, -2.2, 2.2, 2.2, 0, 0.6, { vault: true, cover: false });
};
PROPS.bus = (c, o) => {
  const L = 11.5;
  const paint = colorMat(o.color || 0xd8c020, 0.5, 0.2);
  c.box(2.5, 2.6, L, paint, 0, 1.6, 0);
  c.box(2.52, 0.9, L - 1, colorMat(0x0d1418, 0.05, 0.6, { transparent: true, opacity: 0.8 }), 0, 2.2, 0);
  for (const z of [L * 0.35, -L * 0.35]) for (const s of [-1, 1]) c.cyl(0.5, 0.5, 0.3, 'tire', s * 1.15, 0.5, z, { rz: Math.PI / 2, seg: 14 });
  c.box(2.0, 0.3, 0.05, signMat(o.text || '3  MARKTPLATZ', { bg: '#111', fg: '#ff9a20', glow: true, w: 512, h: 64, fontPx: 44 }), 0, 2.75, L / 2 + 0.02);
  c.col(-1.25, -L / 2, 1.25, L / 2, 0, 3.0, { tall: true });
};
PROPS.floodlight = (c, o) => {
  c.cyl(0.05, 0.08, 3.2, 'metal_dark', 0, 1.6, 0);
  c.box(0.6, 0.4, 0.3, 'metal_dark', 0, 3.3, 0, { rx: 0.4 });
  c.lights.push({ x: 0, z: 0.6, y: 3.1, color: 0xf0f4ff, intensity: 22, range: 15, noMesh: true, group: o.group || 'flood' });
  c.col(-0.15, -0.15, 0.15, 0.15, 0, 3.2, { noFlag: true });
};
PROPS.speaker_truck = (c) => {
  PROPS.military_truck(c, {});
  c.box(0.5, 0.5, 0.5, 'metal_dark', 0.6, 3.5, 2.0); c.box(0.5, 0.5, 0.5, 'metal_dark', -0.6, 3.5, 2.0);
};

// Kühlzellenwand der Pathologie: Raster aus Edelstahl-Schubladen. o.open = Index einer offenen Lade
PROPS.morgue = (c, o) => {
  const cols = o.cols || 3, rows = 3, w = cols * 0.8, h = 2.1;
  c.box(w + 0.1, h + 0.1, 0.12, 'steel', 0, h / 2 + 0.05, -0.36);
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const x = -w / 2 + 0.4 + i * 0.8, y = 0.4 + j * 0.68, k = i * rows + j;
    if (k === o.open) {
      // herausgezogene Lade mit Leichensack
      c.box(0.66, 0.06, 1.7, 'steel', x, y - 0.24, 0.55);
      c.box(0.5, 0.22, 1.5, colorMat(0x1b1d20, 0.6, 0.0), x, y - 0.1, 0.55);
      c.box(0.7, 0.58, 0.04, 'steel', x, y, 1.4);
    } else {
      c.box(0.7, 0.58, 0.04, 'steel', x, y, -0.28);
      c.box(0.2, 0.04, 0.05, 'chrome', x, y + 0.12, -0.24);
      c.box(0.12, 0.08, 0.01, signMat(String(k + 1 + (o.base || 0)), { bg: '#e8e8e8', fg: '#222', w: 64, h: 40, fontPx: 26 }), x, y - 0.14, -0.255);
    }
  }
  c.col(-w / 2 - 0.05, -0.45, w / 2 + 0.05, -0.2, 0, h, { tall: true });
  if (o.open != null) { const i = Math.floor(o.open / rows); const x = -w / 2 + 0.4 + i * 0.8; c.col(x - 0.35, -0.2, x + 0.35, 1.45, 0, 0.8, { vault: false, cover: true }); }
};
// Kleiderständer mit Kleidung (Bekleidungsgeschäft)
PROPS.rack = (c, o) => {
  const w = o.w || 1.6;
  const r = rngFrom2(o);
  for (const x of [-w / 2, w / 2]) { c.box(0.04, 1.5, 0.04, 'chrome', x, 0.75, 0); c.box(0.04, 0.03, 0.5, 'chrome', x, 0.02, 0); }
  c.box(w, 0.03, 0.03, 'chrome', 0, 1.48, 0);
  const cols = [0x2a3a5a, 0x5a2a2a, 0x1a1a1a, 0x8a8070, 0x3a5a3a, 0xa0a0a8, 0x6a4a2a];
  const n = Math.floor(w / 0.12);
  for (let i = 0; i < n; i++) {
    if (r() < 0.25) continue;
    const x = -w / 2 + 0.08 + i * (w - 0.16) / Math.max(1, n - 1);
    c.box(0.05, 0.7 + r() * 0.3, 0.42, colorMat(cols[Math.floor(r() * cols.length)], 0.9, 0), x, 1.08 - r() * 0.1, 0, { ry: (r() - 0.5) * 0.3 });
  }
  c.col(-w / 2, -0.25, w / 2, 0.25, 0, 1.5, { tall: true, cover: true });
};
// Supermarktregal (beidseitig bestückt)
PROPS.market_shelf = (c, o) => {
  const w = o.w || 3.0, d = 0.9, h = o.h || 1.8;
  const r = rngFrom2(o);
  c.box(w, h, 0.06, 'metal', 0, h / 2, 0);
  c.box(w, 0.1, d, 'metal_dark', 0, 0.05, 0);
  const cols = [0xc83a2a, 0x2a6ac8, 0xe8c020, 0x2a9a4a, 0xe8e8e0, 0x8a3ab0, 0xe87a20];
  for (let i = 0; i < 4; i++) {
    const y = 0.15 + i * (h - 0.25) / 3.6;
    c.box(w, 0.03, d, 'metal', 0, y, 0);
    for (const side of [-1, 1]) {
      let x = -w / 2 + 0.1;
      while (x < w / 2 - 0.15) {
        const bw = 0.12 + r() * 0.2;
        if (r() < (o.empty ?? 0.35)) { x += bw + 0.03; continue; }
        const bh = 0.12 + r() * 0.22;
        c.box(bw, bh, 0.3, colorMat(cols[Math.floor(r() * cols.length)], 0.6, 0), x + bw / 2, y + bh / 2 + 0.02, side * 0.24);
        x += bw + 0.03;
      }
    }
  }
  c.box(w, 0.08, 0.02, signMat(o.text || '', { bg: '#f0f0f0', fg: '#c02020', w: 512, h: 32, fontPx: 22 }), 0, 0.12, d / 2 + 0.01);
  c.col(-w / 2, -d / 2, w / 2, d / 2, 0, h, { tall: true });
};
function rngFrom2(o) { let s = Math.floor(((o.x || 0) * 73 + (o.z || 0) * 151) * 9301 + 49297) % 233280; return () => (s = (s * 9301 + 49297) % 233280) / 233280; }
// Sockel einer Schaufensterpuppe (die Puppe selbst ist eine statische Figur)
PROPS.mannequin_base = (c) => {
  c.cyl(0.24, 0.26, 0.04, 'chrome', 0, 0.02, 0, { seg: 16 });
  c.cyl(0.02, 0.02, 0.9, 'chrome', 0, 0.45, -0.05);
  c.col(-0.2, -0.2, 0.2, 0.2, 0, 0.9, { noFlag: true });
};
// Absperrventil an der Wand (Dampfleitung): Rohrstutzen mit Handrad
PROPS.valve = (c) => {
  c.cyl(0.09, 0.09, 0.35, 'metal_rust', 0, 1.3, 0.17, { rx: Math.PI / 2 });
  c.cyl(0.2, 0.2, 0.03, 'paint_red', 0, 1.3, 0.36, { rx: Math.PI / 2, seg: 14 });
  c.cyl(0.05, 0.05, 2.6, 'metal_rust', 0, 1.3, 0.05);
};
// Pumpe (Motorblock mit Spirale)
PROPS.pump = (c, o) => {
  c.box(1.4, 0.9, 0.9, colorMat(0x2a5a7a, 0.6, 0.4), 0, 0.45, 0);
  c.cyl(0.5, 0.5, 0.7, colorMat(0x2a5a7a, 0.6, 0.4), 0.9, 0.55, 0, { rz: Math.PI / 2, seg: 16 });
  c.cyl(0.14, 0.14, 2.4, 'metal_rust', 0.9, 1.9, 0, { seg: 10 });
  c.box(0.5, 0.3, 0.02, signMat(o.text || 'P1', { bg: '#e8e8e8', fg: '#111', w: 128, h: 64, fontPx: 40 }), -0.2, 0.7, 0.46);
  c.col(-0.7, -0.45, 1.4, 0.45, 0, 1.0, { cover: true });
};
