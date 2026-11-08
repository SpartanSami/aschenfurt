import * as THREE from "three";
import { Level } from "../Level";
import { wall, timberFrame, gableRoof, Opening } from "./Architecture";
import { materials } from "../../graphics/Materials";
import { planeGeo } from "./Geo";

export type Facing = "n" | "s" | "e" | "w";

export interface HouseOpts {
  floors?: 1 | 2;
  lit?: boolean;
  boarded?: boolean;
  doorOpen?: boolean;
  chimney?: boolean;
  wallMat?: THREE.Material;
  roofMat?: THREE.Material;
  sign?: THREE.Material;
  height?: number;
  interior?: boolean;
}

export interface HouseInfo {
  door: THREE.Vector3;
  doorYaw: number;
  upperWindow: THREE.Vector3;
  facingDir: THREE.Vector3;
}

/**
 * Fachwerkhaus (achsenparallel). facing = Seite der Haustür.
 * Gibt Türposition (außen) und Fenster des Obergeschosses zurück.
 */
export function house(L: Level, cx: number, cz: number, w: number, d: number, y0: number, facing: Facing, opts: HouseOpts = {}): HouseInfo {
  const plaster = opts.wallMat ?? materials.surface("plasterDirty");
  const timber = materials.surface("timber");
  const roof = opts.roofMat ?? materials.surface("roofTiles");
  const stone = materials.surface("castleStoneDark");
  const floors = opts.floors ?? 2;
  const fh = opts.height ?? 2.9;
  const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2;
  // Sockel (in den Hang hinein)
  L.box(stone, [cx, y0 - 0.6, cz], [w + 0.3, 1.6, d + 0.3]);
  const t = 0.3;
  const litGlass = materials.basic("houseLit", () => new THREE.MeshBasicMaterial({ color: new THREE.Color(1.7, 0.85, 0.35) }));
  const darkGlass = materials.basic("houseDark", () => new THREE.MeshBasicMaterial({ color: new THREE.Color(0.02, 0.02, 0.03) }));
  const winGlass = opts.lit ? litGlass : darkGlass;
  const sideLen = (s: Facing) => (s === "n" || s === "s" ? w : d);
  const openingsFor = (s: Facing, floor: number): Opening[] => {
    const len = sideLen(s);
    const o: Opening[] = [];
    if (floor === 0 && s === facing) {
      o.push({ at: len / 2, w: 1.15, h: 2.2, kind: "rect" });
      if (len > 5) o.push({ at: len / 2 - 2.2, w: 0.9, h: 1.0, y: 1.0, kind: "rect", glass: winGlass, tracery: false });
      if (len > 5) o.push({ at: len / 2 + 2.2, w: 0.9, h: 1.0, y: 1.0, kind: "rect", glass: winGlass, tracery: false });
    } else {
      const n = Math.max(1, Math.floor(len / 3));
      for (let i = 0; i < n; i++) o.push({ at: (len / (n + 1)) * (i + 1), w: 0.85, h: 1.0, y: 1.0, kind: "rect", glass: floor > 0 && opts.lit && i === 0 ? litGlass : darkGlass, tracery: false });
    }
    return o;
  };
  for (let f = 0; f < floors; f++) {
    const y = y0 + f * fh;
    const over = f * 0.25;
    const ax0 = x0 - over, ax1 = x1 + over, az0 = z0 - over, az1 = z1 + over;
    wall(L, plaster, [ax0, az0], [ax1, az0], y, fh, t, openingsFor("n", f));
    wall(L, plaster, [ax0, az1], [ax1, az1], y, fh, t, openingsFor("s", f));
    wall(L, plaster, [ax0, az0], [ax0, az1], y, fh, t, openingsFor("w", f));
    wall(L, plaster, [ax1, az0], [ax1, az1], y, fh, t, openingsFor("e", f));
    timberFrame(L, timber, [ax0, az0 - t / 2], [ax1, az0 - t / 2], y, fh);
    timberFrame(L, timber, [ax0, az1 + t / 2], [ax1, az1 + t / 2], y, fh);
    timberFrame(L, timber, [ax0 - t / 2, az0], [ax0 - t / 2, az1], y, fh);
    timberFrame(L, timber, [ax1 + t / 2, az0], [ax1 + t / 2, az1], y, fh);
    // Geschossdecke
    L.box(timber, [cx, y + fh, cz], [w + over * 2 + 0.35, 0.2, d + over * 2 + 0.35], { collide: f < floors - 1 });
  }
  const top = y0 + floors * fh;
  const axis = w >= d ? "x" : "z";
  const over = (floors - 1) * 0.25;
  gableRoof(L, roof, plaster, x0 - over, z0 - over, x1 + over, z1 + over, top, Math.min(w, d) * 0.65, axis, 0.5);
  if (opts.chimney !== false) {
    L.box(stone, [x0 + w * 0.25, top + Math.min(w, d) * 0.5, cz], [0.7, Math.min(w, d) * 0.9 + 1.2, 0.7]);
  }
  // Boden innen
  L.box(materials.surface("woodOld"), [cx, y0 + 0.05, cz], [w - 0.2, 0.1, d - 0.2], { collide: true, cast: false });
  // Tür
  const dir = facing === "n" ? new THREE.Vector3(0, 0, -1) : facing === "s" ? new THREE.Vector3(0, 0, 1) : facing === "e" ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(-1, 0, 0);
  const doorWall = facing === "n" ? z0 : facing === "s" ? z1 : facing === "e" ? x1 : x0;
  const door = facing === "n" || facing === "s" ? new THREE.Vector3(cx, y0, doorWall) : new THREE.Vector3(doorWall, y0, cz);
  const doorYaw = facing === "n" || facing === "s" ? 0 : Math.PI / 2;
  if (opts.interior) L.markRoom(x0, z0, x1, z1, { floorY: y0 });
  if (!opts.interior) {
    // geschlossene Tür als Blende
    const panel = new THREE.Mesh(planeGeo(1.15, 2.2), materials.surface("woodOld"));
    const uv = panel.geometry.getAttribute("uv") as THREE.BufferAttribute;
    void uv;
    panel.position.copy(door).addScaledVector(dir, 0.02).add(new THREE.Vector3(0, 1.1, 0));
    panel.lookAt(panel.position.clone().add(dir));
    L.add(panel);
    L.col.addBox([door.x, y0 + 1.1, door.z], facing === "n" || facing === "s" ? [1.3, 2.2, 0.4] : [0.4, 2.2, 1.3]);
    if (opts.boarded) {
      for (let i = 0; i < 3; i++) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.15, 0.05), materials.surface("woodOld"));
        b.position.copy(door).addScaledVector(dir, 0.06).add(new THREE.Vector3(0, 0.6 + i * 0.65, 0));
        b.lookAt(b.position.clone().add(dir));
        b.rotateZ((i - 1) * 0.35);
        L.add(b);
      }
    }
  }
  if (opts.sign) {
    const s = new THREE.Mesh(planeGeo(1.2, 0.6), opts.sign);
    const uv = s.geometry.getAttribute("uv") as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 1.2, uv.getY(i) / 0.6);
    s.position.copy(door).addScaledVector(dir, 0.9).add(new THREE.Vector3(1.2, 2.7, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), doorYaw));
    s.lookAt(s.position.clone().add(new THREE.Vector3(dir.z, 0, -dir.x)));
    L.add(s);
  }
  const upperWindow = door.clone().add(new THREE.Vector3(0, fh + 1.5, 0)).addScaledVector(dir, 0.3);
  return { door: door.clone().addScaledVector(dir, 0.9), doorYaw, upperWindow, facingDir: dir };
}

/** Pfütze: dunkle, spiegelnde Fläche. */
export function puddle(L: Level, x: number, y: number, z: number, s = 1.5): void {
  const m = materials.basic("puddle", () => new THREE.MeshStandardMaterial({ color: 0x0a0a0e, roughness: 0.04, metalness: 0.6, transparent: true, opacity: 0.85 }));
  const g = new THREE.CircleGeometry(s, 18);
  const p = g.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 1; i < p.count; i++) {
    const a = Math.atan2(p.getY(i), p.getX(i));
    const k = 0.75 + Math.sin(a * 3 + x) * 0.15 + Math.sin(a * 5 + z) * 0.1;
    p.setXY(i, p.getX(i) * k, p.getY(i) * k * 0.7);
  }
  const mesh = new THREE.Mesh(g, m);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y + 0.025, z);
  mesh.receiveShadow = true;
  mesh.renderOrder = 1;
  L.add(mesh);
}
