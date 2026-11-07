import * as THREE from "three";
import { Level } from "../Level";
import { boxGeo, cylGeo, sphereGeo, planeGeo, scaleUV, mergeAll } from "./Geo";
import { materials } from "../../graphics/Materials";
import { noise3, Rng } from "../../graphics/Noise";

type V3 = [number, number, number];

function rot(x: number, z: number, a: number): [number, number] {
  const c = Math.cos(a), s = Math.sin(a);
  return [x * c + z * s, -x * s + z * c];
}

/** Hilfsfunktion: lokaler Punkt -> Weltpunkt (Rotation um Y). */
export function lp(base: V3, rotY: number, lx: number, ly: number, lz: number): V3 {
  const [rx, rz] = rot(lx, lz, rotY);
  return [base[0] + rx, base[1] + ly, base[2] + rz];
}

// ---------------------------------------------------------------------------
// Licht
// ---------------------------------------------------------------------------

export function candle(L: Level, pos: V3, h = 0.16, lit = true, r = 0.025): number {
  const g = cylGeo(r, r * 1.1, h, 8);
  L.geo(g, materials.wax(), [pos[0], pos[1] + h / 2, pos[2]], [0, 0, 0], 1, { cast: false });
  g.dispose();
  // Wachstropfen
  const drip = sphereGeo(r * 0.6, 6, 4);
  L.geo(drip, materials.wax(), [pos[0] + r * 0.8, pos[1] + h * 0.55, pos[2]], [0, 0, 0], [0.6, 1.6, 0.6], { cast: false });
  drip.dispose();
  if (!lit) return -1;
  return L.flame([pos[0], pos[1] + h + 0.005, pos[2]], 0.055 + r);
}

/** Gruppe von Kerzen mit einer gemeinsamen Lichtquelle. */
export function candleCluster(L: Level, pos: V3, n = 5, radius = 0.25, seed = 1, lightIntensity = 2.6, distance = 9, shadow = false): void {
  const rng = new Rng(seed);
  for (let i = 0; i < n; i++) {
    const a = rng.next() * Math.PI * 2;
    const d = rng.next() * radius;
    candle(L, [pos[0] + Math.cos(a) * d, pos[1], pos[2] + Math.sin(a) * d], rng.range(0.06, 0.28), true, rng.range(0.018, 0.035));
  }
  L.light({ pos: [pos[0], pos[1] + 0.45, pos[2]], intensity: lightIntensity, distance, flicker: 0.6, shadow });
}

export function candelabrum(L: Level, pos: V3, rotY = 0, arms = 5, lit = true, height = 1.5, intensity = 3.5, shadow = true): void {
  const iron = materials.surface("iron");
  const shaft = cylGeo(0.03, 0.04, height, 8);
  L.geo(shaft, iron, [pos[0], pos[1] + height / 2, pos[2]]);
  shaft.dispose();
  const foot = cylGeo(0.05, 0.22, 0.08, 10);
  L.geo(foot, iron, [pos[0], pos[1] + 0.04, pos[2]]);
  foot.dispose();
  const barW = 0.7;
  const bar = boxGeo(barW, 0.03, 0.03);
  L.geo(bar, iron, [pos[0], pos[1] + height - 0.05, pos[2]], [0, rotY, 0]);
  bar.dispose();
  for (let i = 0; i < arms; i++) {
    const off = -barW / 2 + (barW / (arms - 1)) * i;
    const p = lp(pos, rotY, off, height, 0);
    const cup = cylGeo(0.04, 0.025, 0.04, 8);
    L.geo(cup, iron, [p[0], p[1] - 0.02, p[2]]);
    cup.dispose();
    candle(L, p, 0.12 + (i % 2) * 0.05, lit, 0.022);
  }
  if (lit) L.light({ pos: [pos[0], pos[1] + height + 0.25, pos[2]], intensity, distance: 8, flicker: 0.55, shadow });
}

export function chandelier(L: Level, pos: V3, radius = 1.2, lit = true, fallen = false, intensity = 5): THREE.Group {
  const iron = materials.surface("iron");
  const grp = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.04, 6, 32), iron);
  ring.rotation.x = Math.PI / 2;
  ring.castShadow = true;
  grp.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.55, 0.03, 6, 24), iron);
  ring2.rotation.x = Math.PI / 2;
  ring2.position.y = 0.35;
  grp.add(ring2);
  const n = Math.round(radius * 8);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const c = new THREE.Mesh(cylGeo(0.022, 0.024, 0.14, 6), materials.wax());
    c.position.set(Math.cos(a) * radius, 0.08, Math.sin(a) * radius);
    grp.add(c);
  }
  if (!fallen) {
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const ch = new THREE.Mesh(cylGeo(0.008, 0.008, 3, 4), iron);
      const top = new THREE.Vector3(0, 3, 0);
      const bot = new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius);
      ch.position.copy(top).add(bot).multiplyScalar(0.5);
      ch.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), top.clone().sub(bot).normalize());
      ch.scale.y = top.distanceTo(bot) / 3;
      grp.add(ch);
    }
    const chain = new THREE.Mesh(cylGeo(0.012, 0.012, 6, 4), iron);
    chain.position.y = 6;
    grp.add(chain);
  }
  grp.position.set(...pos);
  if (fallen) {
    grp.rotation.set(0.25, 0.4, 0.18);
  }
  L.add(grp);
  if (lit && !fallen) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      L.flame([pos[0] + Math.cos(a) * radius, pos[1] + 0.155, pos[2] + Math.sin(a) * radius], 0.07);
    }
    L.light({ pos: [pos[0], pos[1] - 0.2, pos[2]], intensity, distance: 14, flicker: 0.4, shadow: true });
  }
  return grp;
}

export function sconce(L: Level, pos: V3, rotY: number, lit = true, torch = true, intensity = 3.2): void {
  const iron = materials.surface("iron");
  const plate = boxGeo(0.14, 0.3, 0.04);
  L.geo(plate, iron, pos, [0, rotY, 0]);
  plate.dispose();
  const arm = lp(pos, rotY, 0, 0.05, 0.16);
  const ag = cylGeo(0.018, 0.018, 0.3, 5);
  L.geo(ag, iron, [(pos[0] + arm[0]) / 2, pos[1] - 0.05, (pos[2] + arm[2]) / 2], [Math.PI / 2.6, rotY, 0]);
  ag.dispose();
  if (torch) {
    const t = cylGeo(0.035, 0.025, 0.45, 6);
    L.geo(t, materials.surface("woodDark"), [arm[0], arm[1] + 0.12, arm[2]], [0, 0, 0]);
    t.dispose();
    const head = cylGeo(0.05, 0.04, 0.1, 6);
    L.geo(head, materials.surface("clothDark"), [arm[0], arm[1] + 0.36, arm[2]]);
    head.dispose();
    if (lit) {
      L.flame([arm[0], arm[1] + 0.4, arm[2]], 0.32, "torch");
      L.light({ pos: [arm[0], arm[1] + 0.6, arm[2]], color: new THREE.Color(1, 0.48, 0.18), intensity, distance: 9, flicker: 0.9, shadow: true });
    }
  } else {
    candle(L, [arm[0], arm[1] + 0.05, arm[2]], 0.16, lit, 0.03);
    if (lit) L.light({ pos: [arm[0], arm[1] + 0.35, arm[2]], intensity: intensity * 0.6, distance: 6, flicker: 0.5 });
  }
}

export function lantern(L: Level, pos: V3, lit = true, intensity = 2.5): void {
  const iron = materials.surface("iron");
  const cage = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const b = new THREE.Mesh(boxGeo(0.015, 0.28, 0.015), iron);
    b.position.set(Math.cos(a) * 0.09, 0.14, Math.sin(a) * 0.09);
    cage.add(b);
  }
  const top = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.12, 4), iron);
  top.position.y = 0.34;
  top.rotation.y = Math.PI / 4;
  cage.add(top);
  const bottom = new THREE.Mesh(boxGeo(0.18, 0.03, 0.18), iron);
  cage.add(bottom);
  const glass = new THREE.Mesh(boxGeo(0.16, 0.26, 0.16), materials.basic("lanternGlass", () => new THREE.MeshBasicMaterial({ color: new THREE.Color(1.2, 0.7, 0.3), transparent: true, opacity: lit ? 0.35 : 0.08, depthWrite: false })));
  glass.position.y = 0.15;
  cage.add(glass);
  cage.position.set(...pos);
  L.add(cage);
  if (lit) {
    L.flame([pos[0], pos[1] + 0.05, pos[2]], 0.08);
    L.light({ pos: [pos[0], pos[1] + 0.2, pos[2]], intensity, distance: 7, flicker: 0.35 });
  }
}

// ---------------------------------------------------------------------------
// Möbel
// ---------------------------------------------------------------------------

export function table(L: Level, pos: V3, w: number, d: number, h = 0.8, rotY = 0, mat = materials.surface("woodDark")): void {
  L.box(mat, [pos[0], pos[1] + h - 0.04, pos[2]], [w, 0.08, d], { rotY, collide: false });
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const p = lp(pos, rotY, sx * (w / 2 - 0.1), 0, sz * (d / 2 - 0.1));
      L.box(mat, [p[0], pos[1] + (h - 0.08) / 2, p[2]], [0.09, h - 0.08, 0.09], { rotY, collide: false });
    }
  }
  const stretcher = lp(pos, rotY, 0, 0, 0);
  L.box(mat, [stretcher[0], pos[1] + 0.2, stretcher[2]], [w - 0.3, 0.06, 0.06], { rotY, collide: false });
  L.col.addBox([pos[0], pos[1] + h / 2, pos[2]], [w, h, d], rotY);
}

export function chair(L: Level, pos: V3, rotY = 0, toppled = false, mat = materials.surface("woodDark"), high = false): void {
  const g: THREE.BufferGeometry[] = [];
  const seat = boxGeo(0.48, 0.06, 0.46);
  seat.translate(0, 0.46, 0);
  g.push(seat);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = boxGeo(0.05, 0.46, 0.05);
      leg.translate(sx * 0.2, 0.23, sz * 0.19);
      g.push(leg);
    }
  }
  const backH = high ? 1.1 : 0.55;
  for (const sx of [-1, 1]) {
    const post = boxGeo(0.05, backH, 0.05);
    post.translate(sx * 0.2, 0.49 + backH / 2, -0.21);
    g.push(post);
  }
  const back = boxGeo(0.4, backH * 0.6, 0.03);
  back.translate(0, 0.49 + backH * 0.55, -0.21);
  g.push(back);
  const merged = mergeAll(g);
  g.forEach((x) => x.dispose());
  if (toppled) {
    L.geo(merged, mat, [pos[0], pos[1] + 0.25, pos[2]], [Math.PI / 2, rotY, 0.2]);
  } else {
    L.geo(merged, mat, pos, [0, rotY, 0]);
    L.col.addBox([pos[0], pos[1] + 0.45, pos[2]], [0.5, 0.9, 0.5], rotY);
  }
  merged.dispose();
}

export function bench(L: Level, pos: V3, w: number, rotY = 0, mat = materials.surface("woodOld")): void {
  L.box(mat, [pos[0], pos[1] + 0.45, pos[2]], [w, 0.07, 0.38], { rotY, collide: false });
  for (const sx of [-1, 1]) {
    const p = lp(pos, rotY, sx * (w / 2 - 0.15), 0, 0);
    L.box(mat, [p[0], pos[1] + 0.21, p[2]], [0.07, 0.42, 0.34], { rotY, collide: false });
  }
  L.col.addBox([pos[0], pos[1] + 0.25, pos[2]], [w, 0.5, 0.4], rotY);
}

/** Kirchenbank mit Lehne. */
export function pew(L: Level, pos: V3, w: number, rotY = 0): void {
  const mat = materials.surface("woodDark");
  bench(L, pos, w, rotY, mat);
  const back = lp(pos, rotY, 0, 0, -0.2);
  L.box(mat, [back[0], pos[1] + 0.8, back[2]], [w, 0.7, 0.05], { rotY, collide: false });
  for (const sx of [-1, 1]) {
    const p = lp(pos, rotY, sx * w / 2, 0, 0);
    L.box(mat, [p[0], pos[1] + 0.55, p[2]], [0.06, 1.1, 0.5], { rotY, collide: false });
  }
  L.col.addBox([back[0], pos[1] + 0.6, back[2]], [w, 1.2, 0.1], rotY);
}

export function throne(L: Level, pos: V3, rotY = 0): void {
  const wood = materials.surface("woodDark");
  const velvet = materials.surface("velvet");
  const gold = materials.surface("gold");
  L.box(materials.surface("castleStone"), [pos[0], pos[1] + 0.2, pos[2]], [2.4, 0.4, 2.0], { rotY });
  L.box(materials.surface("castleStone"), [pos[0], pos[1] + 0.5, pos[2]], [1.8, 0.2, 1.5], { rotY });
  const b = [pos[0], pos[1] + 0.6, pos[2]] as V3;
  L.box(wood, [b[0], b[1] + 0.25, b[2]], [1.0, 0.5, 0.8], { rotY, collide: false });
  L.box(velvet, [b[0], b[1] + 0.52, b[2]], [0.86, 0.06, 0.7], { rotY, collide: false });
  const back = lp(b, rotY, 0, 0, -0.38);
  L.box(wood, [back[0], b[1] + 1.4, back[2]], [1.0, 2.3, 0.12], { rotY, collide: false });
  L.box(velvet, [back[0] + Math.sin(rotY) * 0.07, b[1] + 1.3, back[2] + Math.cos(rotY) * 0.07], [0.7, 1.4, 0.03], { rotY, collide: false });
  for (const sx of [-1, 1]) {
    const arm = lp(b, rotY, sx * 0.48, 0, 0);
    L.box(wood, [arm[0], b[1] + 0.75, arm[2]], [0.1, 0.5, 0.8], { rotY, collide: false });
    const fin = lp(b, rotY, sx * 0.45, 0, -0.38);
    const cone = new THREE.ConeGeometry(0.07, 0.4, 6);
    L.geo(cone, gold, [fin[0], b[1] + 2.75, fin[2]]);
    cone.dispose();
  }
  const top = lp(b, rotY, 0, 0, -0.38);
  const spire = new THREE.ConeGeometry(0.1, 0.6, 6);
  L.geo(spire, gold, [top[0], b[1] + 2.85, top[2]]);
  spire.dispose();
  L.col.addBox([pos[0], pos[1] + 1.4, pos[2]], [1.1, 2.8, 0.9], rotY);
}

export function bookshelf(L: Level, pos: V3, rotY = 0, w = 1.8, h = 2.6, seed = 1, sparse = false): void {
  const wood = materials.surface("woodDark");
  const d = 0.42;
  const shelves = Math.floor(h / 0.42);
  for (const sx of [-1, 1]) {
    const p = lp(pos, rotY, sx * (w / 2 - 0.03), 0, 0);
    L.box(wood, [p[0], pos[1] + h / 2, p[2]], [0.06, h, d], { rotY, collide: false });
  }
  const backP = lp(pos, rotY, 0, 0, -d / 2 + 0.02);
  L.box(wood, [backP[0], pos[1] + h / 2, backP[2]], [w, h, 0.03], { rotY, collide: false });
  const books = materials.books(seed);
  const rng = new Rng(seed);
  for (let i = 0; i <= shelves; i++) {
    const y = pos[1] + 0.06 + i * (h - 0.1) / shelves;
    L.box(wood, [pos[0], y, pos[2]], [w - 0.06, 0.04, d], { rotY, collide: false });
    if (i < shelves) {
      // Buchreihe mit Lücken
      let x = -w / 2 + 0.08;
      while (x < w / 2 - 0.2) {
        const seg = rng.range(0.2, 0.7);
        if (!sparse || rng.next() > 0.5) {
          const bh = rng.range(0.24, 0.33);
          const p = lp(pos, rotY, x + seg / 2, 0, 0.02);
          const g = boxGeo(seg, bh, d * 0.75);
          // UV auf Buchrücken-Textur abbilden
          const uv = g.getAttribute("uv") as THREE.BufferAttribute;
          const u0 = rng.next() * 0.6;
          for (let k = 0; k < uv.count; k++) uv.setXY(k, u0 + (uv.getX(k) / Math.max(seg, 0.001)) * seg * 0.6, uv.getY(k) / Math.max(bh, 0.001));
          L.geo(g, books, [p[0], y + 0.02 + bh / 2, p[2]], [0, rotY, 0], 1, { cast: false });
          g.dispose();
        } else if (rng.next() > 0.6) {
          // umgefallenes Buch
          const p = lp(pos, rotY, x + 0.12, 0, 0.05);
          L.box(books, [p[0], y + 0.05, p[2]], [0.26, 0.05, 0.2], { rotY: rotY + rng.range(-0.3, 0.3), collide: false, cast: false });
        }
        x += seg + rng.range(0.02, 0.12);
      }
    }
  }
  L.col.addBox([pos[0], pos[1] + h / 2, pos[2]], [w, h, d], rotY);
}

export function chest(L: Level, pos: V3, rotY = 0, open = false): THREE.Group {
  const wood = materials.surface("woodOld");
  const iron = materials.surface("iron");
  const g = new THREE.Group();
  const body = new THREE.Mesh(boxGeo(0.9, 0.5, 0.55), wood);
  body.position.y = 0.25;
  body.castShadow = body.receiveShadow = true;
  g.add(body);
  for (const x of [-0.35, 0.35]) {
    const band = new THREE.Mesh(boxGeo(0.06, 0.52, 0.57), iron);
    band.position.set(x, 0.25, 0);
    g.add(band);
  }
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, 0.5, -0.275);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.275, 0.275, 0.9, 12, 1, false, 0, Math.PI), wood);
  lid.rotation.z = Math.PI / 2;
  lid.rotation.y = Math.PI / 2;
  lid.position.set(0, 0, 0.275);
  lid.scale.set(1, 1, 0.5);
  lid.castShadow = true;
  lidPivot.add(lid);
  g.add(lidPivot);
  if (open) lidPivot.rotation.x = -1.9;
  g.userData.lid = lidPivot;
  g.position.set(...pos);
  g.rotation.y = rotY;
  L.add(g);
  L.col.addBox([pos[0], pos[1] + 0.3, pos[2]], [0.9, 0.6, 0.55], rotY);
  return g;
}

export function barrel(L: Level, pos: V3, toppled = false): void {
  const p: THREE.Vector2[] = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    p.push(new THREE.Vector2(0.3 + Math.sin(t * Math.PI) * 0.06, t * 0.9));
  }
  const g = new THREE.LatheGeometry(p, 14);
  scaleUV(g, 2, 0.9);
  L.geo(g, materials.surface("woodOld"), toppled ? [pos[0], pos[1] + 0.33, pos[2]] : pos, toppled ? [Math.PI / 2, 0, 0.4] : [0, 0, 0]);
  g.dispose();
  for (const y of [0.15, 0.75]) {
    const r = new THREE.TorusGeometry(0.33, 0.015, 4, 20);
    r.rotateX(Math.PI / 2);
    if (!toppled) L.geo(r, materials.surface("ironRusty"), [pos[0], pos[1] + y, pos[2]]);
    r.dispose();
  }
  L.col.addBox([pos[0], pos[1] + 0.45, pos[2]], toppled ? [0.9, 0.66, 0.9] : [0.66, 0.9, 0.66]);
}

export function crate(L: Level, pos: V3, s = 0.7, rotY = 0): void {
  L.box(materials.surface("woodOld"), [pos[0], pos[1] + s / 2, pos[2]], [s, s, s], { rotY });
  L.box(materials.surface("woodDark"), [pos[0], pos[1] + s / 2, pos[2]], [s + 0.02, 0.08, s + 0.02], { rotY, collide: false });
}

// ---------------------------------------------------------------------------
// Gräber, Särge, Altäre
// ---------------------------------------------------------------------------

export function sarcophagus(L: Level, pos: V3, rotY = 0, lid: "closed" | "shifted" | "broken" | "none" = "closed", mat = materials.surface("castleStoneDark")): THREE.Object3D | null {
  const w = 1.0, l = 2.3, h = 0.9;
  L.box(mat, [pos[0], pos[1] + 0.08, pos[2]], [w + 0.2, 0.16, l + 0.2], { rotY });
  // Wanne aus vier Wänden (innen hohl)
  const t = 0.14;
  const side = (lx: number, lz: number, sw: number, sl: number) => {
    const p = lp(pos, rotY, lx, 0, lz);
    L.box(mat, [p[0], pos[1] + 0.16 + h / 2, p[2]], [sw, h, sl], { rotY });
  };
  side(-w / 2 + t / 2, 0, t, l);
  side(w / 2 - t / 2, 0, t, l);
  side(0, -l / 2 + t / 2, w, t);
  side(0, l / 2 - t / 2, w, t);
  L.box(materials.dark(), [pos[0], pos[1] + 0.3, pos[2]], [w - t * 2, 0.05, l - t * 2], { rotY, collide: false });
  // Relief: Wappenplatte
  const fp = lp(pos, rotY, 0, 0, l / 2 + 0.005);
  const crest = new THREE.Mesh(planeGeo(0.5, 0.5), materials.basic("crestPlate", () => {
    const m = materials.tapestry(7).clone();
    m.color = new THREE.Color(0.5, 0.45, 0.42);
    return m;
  }));
  crest.position.set(fp[0], pos[1] + 0.6, fp[2]);
  crest.rotation.y = rotY;
  L.add(crest);
  if (lid === "none") return null;
  const lidG = new THREE.Group();
  const slab = new THREE.Mesh(boxGeo(w + 0.12, 0.16, l + 0.12), mat);
  slab.castShadow = slab.receiveShadow = true;
  lidG.add(slab);
  // Liegende Figur auf dem Deckel (Gisant)
  const effigy = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 1.2, 4, 10), mat);
  effigy.rotation.x = Math.PI / 2;
  effigy.scale.set(1, 1, 0.55);
  effigy.position.y = 0.14;
  lidG.add(effigy);
  const head = new THREE.Mesh(sphereGeo(0.14, 10, 8), mat);
  head.position.set(0, 0.16, -0.85);
  lidG.add(head);
  lidG.position.set(pos[0], pos[1] + 0.16 + h + 0.08, pos[2]);
  lidG.rotation.y = rotY;
  if (lid === "shifted") {
    lidG.position.add(new THREE.Vector3(...lp([0, 0, 0], rotY, 0.45, 0, 0.2)));
    lidG.rotation.z = -0.12;
  } else if (lid === "broken") {
    lidG.position.set(...lp(pos, rotY, 0.9, -0.55, 0.3));
    lidG.rotation.set(0.05, rotY + 0.35, -1.1);
  }
  L.add(lidG);
  if (lid === "closed") L.col.addBox([pos[0], pos[1] + 0.6, pos[2]], [w + 0.12, 1.2, l + 0.12], rotY);
  else if (lid === "broken") L.col.addBox([lidG.position.x, pos[1] + 0.4, lidG.position.z], [0.5, 0.8, 2.2], rotY + 0.35);
  return lidG;
}

export function coffin(L: Level, pos: V3, rotY = 0, open = false, upright = false): void {
  const shape = new THREE.Shape([
    new THREE.Vector2(-0.22, -1), new THREE.Vector2(0.22, -1), new THREE.Vector2(0.32, 0.45),
    new THREE.Vector2(0.24, 1), new THREE.Vector2(-0.24, 1), new THREE.Vector2(-0.32, 0.45),
  ]);
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.4, bevelEnabled: false });
  g.translate(0, 0, -0.2);
  const wood = materials.surface("woodDark");
  if (upright) {
    L.geo(g, wood, [pos[0], pos[1] + 1, pos[2]], [0, rotY, 0], 1, { collide: true });
  } else {
    g.rotateX(-Math.PI / 2);
    L.geo(g, wood, [pos[0], pos[1] + 0.2, pos[2]], [0, rotY, 0], 1, { collide: true });
    if (open) {
      const lidG = new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: false });
      lidG.rotateX(-Math.PI / 2);
      const p = lp(pos, rotY, 0.5, 0, 0.1);
      L.geo(lidG, wood, [p[0], pos[1] + 0.03, p[2]], [0, rotY + 0.3, 0.05]);
      lidG.dispose();
    }
  }
  g.dispose();
}

export function altar(L: Level, pos: V3, rotY = 0, mat = materials.surface("marbleBlack"), cloth = true): void {
  L.box(mat, [pos[0], pos[1] + 0.5, pos[2]], [2.2, 1.0, 1.0], { rotY });
  L.box(mat, [pos[0], pos[1] + 1.04, pos[2]], [2.4, 0.08, 1.15], { rotY });
  if (cloth) {
    L.box(materials.surface("velvet"), [pos[0], pos[1] + 1.085, pos[2]], [1.2, 0.02, 1.17], { rotY, collide: false });
    const front = lp(pos, rotY, 0, 0, 0.585);
    L.box(materials.surface("velvet"), [front[0], pos[1] + 0.8, front[2]], [1.2, 0.55, 0.02], { rotY, collide: false });
  }
}

export function lectern(L: Level, pos: V3, rotY = 0, withBook = true): THREE.Vector3 {
  const wood = materials.surface("woodDark");
  L.box(wood, [pos[0], pos[1] + 0.5, pos[2]], [0.12, 1.0, 0.12], { rotY, collide: false });
  L.box(wood, [pos[0], pos[1] + 0.03, pos[2]], [0.5, 0.06, 0.4], { rotY, collide: false });
  const top = boxGeo(0.6, 0.04, 0.45);
  L.geo(top, wood, [pos[0], pos[1] + 1.1, pos[2]], [-0.35, rotY, 0]);
  top.dispose();
  if (withBook) {
    const pages = boxGeo(0.5, 0.05, 0.36);
    L.geo(pages, materials.basic("pages", () => new THREE.MeshStandardMaterial({ color: 0xc8b890, roughness: 0.9 })), [pos[0], pos[1] + 1.15, pos[2]], [-0.35, rotY, 0]);
    pages.dispose();
  }
  L.col.addBox([pos[0], pos[1] + 0.6, pos[2]], [0.5, 1.2, 0.4], rotY);
  return new THREE.Vector3(pos[0], pos[1] + 1.2, pos[2]);
}

// ---------------------------------------------------------------------------
// Knochen, Schutt, Spinnweben
// ---------------------------------------------------------------------------

let skullGeoCache: THREE.BufferGeometry | null = null;
export function skullGeo(): THREE.BufferGeometry {
  if (skullGeoCache) return skullGeoCache;
  const g = new THREE.SphereGeometry(0.1, 14, 10);
  const p = g.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    // Hinterkopf länger, Kiefer schmaler
    if (z < 0) z *= 1.2;
    if (y < -0.02) {
      x *= 0.8;
      z = z * 0.9 + 0.01;
    }
    // Augenhöhlen
    for (const sx of [-1, 1]) {
      const dx = x - sx * 0.035, dy = y - 0.005, dz = z - 0.085;
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d < 0.035) {
        const k = (0.035 - d) / 0.035;
        z -= k * 0.03;
      }
    }
    // Nasenöffnung
    {
      const dx = x, dy = y + 0.035, dz = z - 0.09;
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d < 0.018) z -= 0.012;
    }
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  skullGeoCache = g;
  return g;
}

export function skull(L: Level, pos: V3, rotY = 0, tilt = 0): void {
  L.geo(skullGeo(), materials.surface("bone"), pos, [tilt, rotY, tilt * 0.5], 1, { cast: true });
}

export function bones(L: Level, pos: V3, count = 6, seed = 1, spread = 0.5): void {
  const rng = new Rng(seed);
  const bone = materials.surface("bone");
  for (let i = 0; i < count; i++) {
    const len = rng.range(0.2, 0.45);
    const g = new THREE.CapsuleGeometry(0.02, len, 3, 6);
    L.geo(g, bone, [pos[0] + rng.range(-spread, spread), pos[1] + 0.025, pos[2] + rng.range(-spread, spread)], [Math.PI / 2, rng.next() * 6.28, 0], 1, { cast: false });
    g.dispose();
  }
}

/** Sitzendes Skelett (z. B. gegen eine Wand gelehnt). */
export function skeleton(L: Level, pos: V3, rotY = 0, pose: "sitting" | "lying" = "sitting"): void {
  const bone = materials.surface("bone");
  const add = (g: THREE.BufferGeometry, lx: number, ly: number, lz: number, rx = 0, rz = 0) => {
    const p = lp(pos, rotY, lx, ly, lz);
    L.geo(g, bone, p, [rx, rotY, rz], 1, { cast: true });
    g.dispose();
  };
  if (pose === "sitting") {
    add(skullGeo().clone(), 0, 0.92, 0.02, 0.5, 0.2);
    for (let i = 0; i < 5; i++) add(new THREE.TorusGeometry(0.11 - i * 0.008, 0.012, 4, 12, Math.PI * 1.4), 0, 0.72 - i * 0.07, 0.03, Math.PI / 2, 0);
    add(new THREE.CapsuleGeometry(0.02, 0.4, 3, 6), 0, 0.55, -0.02, 0.15);
    add(new THREE.CapsuleGeometry(0.025, 0.38, 3, 6), -0.1, 0.18, 0.22, Math.PI / 2);
    add(new THREE.CapsuleGeometry(0.025, 0.38, 3, 6), 0.1, 0.18, 0.22, Math.PI / 2);
    add(new THREE.CapsuleGeometry(0.02, 0.36, 3, 6), -0.12, 0.08, 0.45, 0.1);
    add(new THREE.CapsuleGeometry(0.02, 0.36, 3, 6), 0.12, 0.08, 0.45, -0.1);
    add(new THREE.CapsuleGeometry(0.016, 0.28, 3, 6), -0.17, 0.55, 0.05, 0.2, 0.3);
    add(new THREE.CapsuleGeometry(0.016, 0.28, 3, 6), 0.17, 0.55, 0.05, 0.2, -0.3);
    add(new THREE.CapsuleGeometry(0.014, 0.26, 3, 6), -0.2, 0.3, 0.18, 1.2);
    add(new THREE.CapsuleGeometry(0.014, 0.26, 3, 6), 0.2, 0.3, 0.18, 1.2);
  } else {
    add(skullGeo().clone(), 0, 0.1, -0.85, 0, 0.6);
    for (let i = 0; i < 5; i++) add(new THREE.TorusGeometry(0.11, 0.012, 4, 12, Math.PI * 1.4), 0, 0.08, -0.6 + i * 0.07, 0, 0);
    add(new THREE.CapsuleGeometry(0.025, 0.9, 3, 6), -0.1, 0.03, 0.35, Math.PI / 2);
    add(new THREE.CapsuleGeometry(0.025, 0.85, 3, 6), 0.12, 0.03, 0.3, Math.PI / 2, 0.15);
  }
}

export function rubble(L: Level, center: V3, radius = 1.2, count = 14, seed = 1, mat = materials.surface("castleStone")): void {
  const rng = new Rng(seed);
  for (let i = 0; i < count; i++) {
    const s = rng.range(0.12, 0.45);
    const g = new THREE.IcosahedronGeometry(s, 1);
    const p = g.getAttribute("position") as THREE.BufferAttribute;
    for (let k = 0; k < p.count; k++) {
      const x = p.getX(k), y = p.getY(k), z = p.getZ(k);
      const n = 0.7 + noise3(x * 6 + i, y * 6, z * 6, seed) * 0.6;
      p.setXYZ(k, x * n, y * n * 0.7, z * n);
    }
    g.computeVertexNormals();
    scaleUV(g, s * 3, s * 3);
    const a = rng.next() * Math.PI * 2;
    const d = Math.sqrt(rng.next()) * radius;
    L.geo(g, mat, [center[0] + Math.cos(a) * d, center[1] + s * 0.3, center[2] + Math.sin(a) * d], [rng.next() * 3, rng.next() * 3, rng.next() * 3], 1, { cast: true });
    g.dispose();
  }
}

/** Spinnweben in einer Ecke. normalYaw: Richtung, in die die Ecke offen ist. */
export function cobweb(L: Level, pos: V3, rotY: number, size = 1, seed = 1, tilt = 0.6): void {
  const g = planeGeo(size, size);
  const uv = g.getAttribute("uv") as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / size, uv.getY(i) / size);
  g.translate(size / 2, -size / 2, 0);
  const m = new THREE.Mesh(g, materials.cobweb(seed));
  m.position.set(...pos);
  m.rotation.set(0, rotY, 0);
  m.rotateX(tilt);
  m.renderOrder = 3;
  L.add(m);
}

// ---------------------------------------------------------------------------
// Stoffe, Bilder
// ---------------------------------------------------------------------------

export function banner(L: Level, pos: V3, rotY: number, w = 1.2, h = 3.2, seed = 1, base?: string): THREE.Mesh {
  const g = new THREE.PlaneGeometry(w, h, 6, 12);
  g.translate(0, -h / 2, 0);
  const p = g.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    const x = p.getX(i);
    p.setZ(i, Math.sin(x * 4 + y * 1.3) * 0.04 * (-y / h));
  }
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, materials.tapestry(seed, base));
  m.position.set(...pos);
  m.rotation.y = rotY;
  m.castShadow = true;
  L.add(m);
  const rod = cylGeo(0.025, 0.025, w + 0.25, 6);
  L.geo(rod, materials.surface("iron"), pos, [0, rotY, Math.PI / 2]);
  rod.dispose();
  return m;
}

export function portrait(L: Level, pos: V3, rotY: number, w: number, h: number, mat: THREE.Material): THREE.Mesh {
  const frame = materials.surface("gold");
  const t = 0.09;
  const parts: [number, number, number, number][] = [
    [0, h / 2 + t / 2, w + t * 2, t], [0, -h / 2 - t / 2, w + t * 2, t],
    [-w / 2 - t / 2, 0, t, h], [w / 2 + t / 2, 0, t, h],
  ];
  for (const [lx, ly, fw, fh] of parts) {
    const p = lp(pos, rotY, lx, ly, 0);
    L.box(frame, p, [fw, fh, 0.07], { rotY, collide: false });
  }
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  const pp = lp(pos, rotY, 0, 0, 0.01);
  pic.position.set(...pp);
  pic.rotation.y = rotY;
  L.add(pic);
  return pic;
}

export function rug(L: Level, pos: V3, w: number, d: number, rotY = 0, seed = 3): void {
  const m = materials.tapestry(seed, "#2a0808", "#4a1414");
  L.decal(m, [pos[0], pos[1] + 0.012, pos[2]], w, d, rotY);
}

// ---------------------------------------------------------------------------
// Statuen
// ---------------------------------------------------------------------------

/** Steinstatue einer verhüllten Gestalt. Gibt den Kopf zurück (für Horror-Ereignisse). */
export function statue(L: Level, pos: V3, rotY: number, kind: "robed" | "knight" | "angel" = "robed", mat = materials.surface("castleStone"), scale = 1): THREE.Group {
  const g = new THREE.Group();
  const ped = new THREE.Mesh(boxGeo(0.9, 0.8, 0.9), mat);
  ped.position.y = 0.4;
  ped.castShadow = ped.receiveShadow = true;
  g.add(ped);
  const prof: THREE.Vector2[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const r = t < 0.65 ? 0.36 - t * 0.18 : t < 0.8 ? 0.24 + (t - 0.65) * 0.6 : 0.33 - (t - 0.8) * 1.2;
    prof.push(new THREE.Vector2(Math.max(0.05, r), t * 1.75));
  }
  const robe = new THREE.Mesh(new THREE.LatheGeometry(prof, 16), mat);
  robe.position.y = 0.8;
  robe.castShadow = true;
  g.add(robe);
  const headPivot = new THREE.Group();
  headPivot.position.y = 0.8 + 1.85;
  const head = new THREE.Mesh(sphereGeo(0.15, 14, 10), mat);
  head.scale.set(0.9, 1.1, 1);
  headPivot.add(head);
  if (kind === "robed" || kind === "angel") {
    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), mat);
    hood.position.set(0, 0.03, -0.03);
    hood.scale.set(1, 1.15, 1.1);
    headPivot.add(hood);
  } else {
    const helm = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.3, 12), mat);
    helm.position.y = 0.03;
    headPivot.add(helm);
  }
  // Nase/Gesicht als Ausrichtungshinweis
  const nose = new THREE.Mesh(boxGeo(0.04, 0.07, 0.06), mat);
  nose.position.set(0, -0.01, 0.14);
  headPivot.add(nose);
  g.add(headPivot);
  // Arme: gefaltete Hände
  for (const sx of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.5, 4, 8), mat);
    arm.position.set(sx * 0.2, 0.8 + 1.3, 0.12);
    arm.rotation.set(-0.9, 0, sx * 0.5);
    g.add(arm);
  }
  if (kind === "angel") {
    for (const sx of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.6, 4, 1), mat);
      wing.scale.z = 0.15;
      wing.position.set(sx * 0.35, 0.8 + 1.4, -0.25);
      wing.rotation.set(0.1, 0, sx * -0.35);
      g.add(wing);
    }
  }
  g.position.set(...pos);
  g.rotation.y = rotY;
  g.scale.setScalar(scale);
  g.traverse((o) => ((o as THREE.Mesh).castShadow = true));
  L.add(g);
  L.col.addBox([pos[0], pos[1] + 1.3 * scale, pos[2]], [0.9 * scale, 2.6 * scale, 0.9 * scale], rotY);
  g.userData.head = headPivot;
  return g;
}

export function gravestone(L: Level, pos: V3, rotY = 0, seed = 1, tilt = 0): void {
  const rng = new Rng(seed);
  const mat = materials.surface(rng.next() > 0.5 ? "castleStoneDark" : "rock");
  const kind = rng.int(0, 2);
  const h = rng.range(0.7, 1.2);
  if (kind === 0) {
    const shape = new THREE.Shape();
    shape.moveTo(-0.3, 0);
    shape.lineTo(0.3, 0);
    shape.lineTo(0.3, h - 0.3);
    shape.absarc(0, h - 0.3, 0.3, 0, Math.PI, false);
    shape.lineTo(-0.3, 0);
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.14, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 1 });
    g.translate(0, 0, -0.07);
    L.geo(g, mat, pos, [tilt, rotY, tilt * 0.5], 1, { collide: true });
    g.dispose();
  } else if (kind === 1) {
    L.box(mat, [pos[0], pos[1] + h * 0.45, pos[2]], [0.12, h * 0.9, 0.12], { rotY });
    L.box(mat, [pos[0], pos[1] + h * 0.65, pos[2]], [0.55, 0.12, 0.12], { rotY });
  } else {
    L.box(mat, [pos[0], pos[1] + h * 0.35, pos[2]], [0.55, h * 0.7, 0.18], { rotY });
  }
  // Grabhügel
  const mound = new THREE.SphereGeometry(0.5, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  scaleUV(mound, 2, 1);
  const front = lp(pos, rotY, 0, 0, 1.0);
  L.geo(mound, materials.surface("dirt"), [front[0], pos[1] - 0.05, front[2]], [0, rotY, 0], [0.9, 0.35, 2.0], { cast: false });
  mound.dispose();
}

export function well(L: Level, pos: V3): void {
  const stone = materials.surface("castleStone");
  const ring = cylGeo(1.0, 1.05, 0.9, 20, true);
  L.geo(ring, stone, [pos[0], pos[1] + 0.45, pos[2]]);
  ring.dispose();
  const inner = cylGeo(0.82, 0.82, 0.9, 20, true);
  L.geo(inner, stone, [pos[0], pos[1] + 0.45, pos[2]]);
  inner.dispose();
  const rim = new THREE.TorusGeometry(0.92, 0.12, 6, 24);
  rim.rotateX(Math.PI / 2);
  scaleUV(rim, 6, 1);
  L.geo(rim, stone, [pos[0], pos[1] + 0.92, pos[2]]);
  rim.dispose();
  L.box(materials.dark(), [pos[0], pos[1] + 0.2, pos[2]], [1.5, 0.05, 1.5], { collide: false, cast: false });
  const wood = materials.surface("woodDark");
  for (const s of [-1, 1]) L.box(wood, [pos[0] + s * 0.95, pos[1] + 1.4, pos[2]], [0.12, 1.9, 0.12], { collide: false });
  L.box(wood, [pos[0], pos[1] + 2.3, pos[2]], [2.2, 0.12, 0.12], { collide: false });
  const roofG = new THREE.ConeGeometry(1.4, 0.8, 4);
  roofG.rotateY(Math.PI / 4);
  scaleUV(roofG, 4, 1);
  L.geo(roofG, materials.surface("roofTiles"), [pos[0], pos[1] + 2.75, pos[2]]);
  roofG.dispose();
  const bucket = cylGeo(0.14, 0.11, 0.22, 10);
  L.geo(bucket, materials.surface("woodOld"), [pos[0] + 0.1, pos[1] + 1.4, pos[2]]);
  bucket.dispose();
  L.col.addBox([pos[0], pos[1] + 0.5, pos[2]], [2.1, 1.0, 2.1]);
}

export function goblet(L: Level, pos: V3, toppled = false): void {
  const p = [new THREE.Vector2(0, 0), new THREE.Vector2(0.04, 0), new THREE.Vector2(0.008, 0.02), new THREE.Vector2(0.008, 0.08), new THREE.Vector2(0.04, 0.1), new THREE.Vector2(0.045, 0.17), new THREE.Vector2(0.04, 0.17)];
  const g = new THREE.LatheGeometry(p, 10);
  L.geo(g, materials.surface("silver"), toppled ? [pos[0], pos[1] + 0.04, pos[2]] : pos, toppled ? [Math.PI / 2, Math.random() * 6, 0] : [0, 0, 0], 1, { cast: false });
  g.dispose();
}

export function plate(L: Level, pos: V3): void {
  const g = cylGeo(0.13, 0.1, 0.02, 14);
  L.geo(g, materials.surface("silver"), [pos[0], pos[1] + 0.01, pos[2]], [0, 0, 0], 1, { cast: false });
  g.dispose();
}

export function bottle(L: Level, pos: V3, rotX = 0): void {
  const p = [new THREE.Vector2(0, 0), new THREE.Vector2(0.045, 0), new THREE.Vector2(0.045, 0.16), new THREE.Vector2(0.015, 0.22), new THREE.Vector2(0.015, 0.28), new THREE.Vector2(0, 0.28)];
  const g = new THREE.LatheGeometry(p, 10);
  L.geo(g, materials.basic("bottleGlass", () => new THREE.MeshStandardMaterial({ color: 0x0a1a0e, roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.85 })), pos, [rotX, 0, 0], 1, { cast: false });
  g.dispose();
}

/** Verwester Festschmaus (Kapitel 1: eingefrorener Moment des Rituals). */
export function rottenFeast(L: Level, x0: number, x1: number, z: number, y: number, seed = 1): void {
  const rng = new Rng(seed);
  for (let x = x0; x <= x1; x += 0.9) {
    for (const side of [-0.45, 0.45]) {
      plate(L, [x + rng.range(-0.1, 0.1), y, z + side]);
      goblet(L, [x + 0.25 + rng.range(-0.05, 0.05), y, z + side * 0.7], rng.next() > 0.7);
    }
    if (rng.next() > 0.6) bottle(L, [x + 0.4, y, z + rng.range(-0.2, 0.2)]);
    if (rng.next() > 0.7) candle(L, [x, y, z], rng.range(0.05, 0.12), false, 0.03);
  }
  // Tischtuch
  L.box(materials.surface("clothLinen"), [(x0 + x1) / 2, y - 0.03, z], [x1 - x0 + 1.2, 0.02, 1.3], { collide: false, cast: false });
}

export function cage(L: Level, pos: V3, h = 1.8, r = 0.5, hanging = true): THREE.Group {
  const iron = materials.surface("ironRusty");
  const g = new THREE.Group();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const b = new THREE.Mesh(cylGeo(0.012, 0.012, h, 4), iron);
    b.position.set(Math.cos(a) * r, h / 2, Math.sin(a) * r);
    g.add(b);
  }
  for (const y of [0, h]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.02, 4, 20), iron);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    g.add(ring);
  }
  if (hanging) {
    const ch = new THREE.Mesh(cylGeo(0.01, 0.01, 4, 4), iron);
    ch.position.y = h + 2;
    g.add(ch);
  }
  g.position.set(...pos);
  L.add(g);
  return g;
}

export function chains(L: Level, top: V3, length: number, n = 2): void {
  const iron = materials.surface("ironRusty");
  for (let i = 0; i < n; i++) {
    const links = Math.floor(length / 0.07);
    for (let k = 0; k < links; k++) {
      const t = new THREE.TorusGeometry(0.03, 0.007, 4, 8);
      L.geo(t, iron, [top[0] + i * 0.25, top[1] - k * 0.07, top[2]], [0, k % 2 ? Math.PI / 2 : 0, Math.PI / 2], 1, { cast: false });
      t.dispose();
    }
  }
}

export function bed(L: Level, pos: V3, rotY = 0, canopy = true): void {
  const wood = materials.surface("woodDark");
  L.box(wood, [pos[0], pos[1] + 0.3, pos[2]], [1.6, 0.4, 2.2], { rotY });
  L.box(materials.surface("clothLinen"), [pos[0], pos[1] + 0.55, pos[2]], [1.5, 0.15, 2.1], { rotY, collide: false });
  L.box(materials.surface("velvet"), lp(pos, rotY, 0, 0.64, 0.25), [1.55, 0.05, 1.4], { rotY, collide: false });
  if (canopy) {
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const p = lp(pos, rotY, sx * 0.75, 0, sz * 1.05);
        L.box(wood, [p[0], pos[1] + 1.2, p[2]], [0.1, 2.4, 0.1], { rotY, collide: false });
      }
    }
    L.box(materials.surface("velvet"), [pos[0], pos[1] + 2.4, pos[2]], [1.7, 0.08, 2.3], { rotY, collide: false });
    const back = lp(pos, rotY, 0, 0, -1.08);
    L.box(materials.surface("velvet"), [back[0], pos[1] + 1.4, back[2]], [1.6, 2.0, 0.03], { rotY, collide: false });
  }
}

export function wardrobe(L: Level, pos: V3, rotY = 0): void {
  const wood = materials.surface("woodDark");
  L.box(wood, [pos[0], pos[1] + 1.1, pos[2]], [1.4, 2.2, 0.6], { rotY });
  const f = lp(pos, rotY, 0, 0, 0.31);
  L.box(materials.surface("woodOld"), [f[0], pos[1] + 1.1, f[2]], [0.02, 1.9, 0.02], { rotY, collide: false });
}

export function pillarCandles(L: Level, pos: V3, seed = 1): void {
  // Hohe Altarkerzen auf Ständern
  const rng = new Rng(seed);
  for (let i = 0; i < 3; i++) {
    const p: V3 = [pos[0] + (i - 1) * 0.35, pos[1], pos[2] + rng.range(-0.1, 0.1)];
    const h = rng.range(0.9, 1.3);
    const stand = cylGeo(0.03, 0.09, h, 8);
    L.geo(stand, materials.surface("iron"), [p[0], p[1] + h / 2, p[2]]);
    stand.dispose();
    candle(L, [p[0], p[1] + h, p[2]], rng.range(0.2, 0.4), true, 0.04);
  }
  L.light({ pos: [pos[0], pos[1] + 1.6, pos[2]], intensity: 3, distance: 7, flicker: 0.5 });
}
