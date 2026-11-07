import * as THREE from "three";
import { CollisionWorld, Blocker } from "./Collision";
import { StaticBatch, boxGeo, planeGeo } from "./builders/Geo";
import { FlameSystem, Sky, CameraParticles, Rain, FogBanks } from "../graphics/Effects";
import { LightPool, LightSource } from "../graphics/Lighting";
import { materials, SurfaceName } from "../graphics/Materials";
import { G } from "../core/Context";

export type Surface = "stone" | "wood" | "dirt" | "grass" | "water" | "metal" | "flesh";
export type ReverbKind = "crypt" | "hall" | "room" | "outdoor" | "cathedral" | "cave" | "forest" | "void";

export interface EnvPreset {
  fogColor: number;
  fogDensity: number;
  ambientColor: number;
  ambientIntensity: number;
  hemiSky: number;
  hemiGround: number;
  hemiIntensity: number;
  moonIntensity: number;
  exposure: number;
  reverb: ReverbKind;
  ambience: string;
  surface: Surface;
  rain: number;
  music?: string;
}

export const defaultEnv: EnvPreset = {
  fogColor: 0x07060a,
  fogDensity: 0.05,
  ambientColor: 0x6a5c68,
  ambientIntensity: 0.6,
  hemiSky: 0x6a5c80,
  hemiGround: 0x1a1010,
  hemiIntensity: 0.4,
  moonIntensity: 0,
  exposure: 1,
  reverb: "hall",
  ambience: "castle",
  surface: "stone",
  rain: 0,
};

export interface Interactable {
  id: string;
  pos: THREE.Vector3;
  radius: number;
  prompt: string | (() => string);
  enabled: () => boolean;
  onInteract: () => void;
  bloodSightOnly?: boolean;
  /** benötigter Blickwinkel (Kosinus); kleiner = großzügiger */
  angle?: number;
  object?: THREE.Object3D;
}

export interface Trigger {
  id: string;
  box: THREE.Box3;
  once: boolean;
  fired: boolean;
  inside: boolean;
  condition?: () => boolean;
  onEnter?: () => void;
  onExit?: () => void;
  onStay?: (dt: number) => void;
}

export interface Zone {
  id: string;
  box: THREE.Box3;
  env: Partial<EnvPreset>;
  priority: number;
}

export interface DoorOpts {
  id: string;
  pos: [number, number, number];
  rotY: number;
  width?: number;
  height?: number;
  thickness?: number;
  kind?: "wood" | "iron" | "dark";
  hinge?: "left" | "right";
  swing?: number; // Öffnungswinkel (Vorzeichen = Richtung)
  locked?: { item?: string; flag?: string; message: string; consume?: boolean } | null;
  onOpen?: () => void;
  prompt?: string;
  autoClose?: boolean;
  arched?: boolean;
}

export class Door {
  pivot = new THREE.Group();
  leaf = new THREE.Group();
  blocker: Blocker;
  isOpen = false;
  angle = 0;
  target = 0;
  speed = 1.6;
  opts: DoorOpts;
  level: Level;

  constructor(level: Level, o: DoorOpts) {
    this.level = level;
    this.opts = o;
    const w = o.width ?? 1.4;
    const h = o.height ?? 2.6;
    const t = o.thickness ?? 0.12;
    const hingeSide = o.hinge === "right" ? 1 : -1;
    this.pivot.position.set(o.pos[0], o.pos[1], o.pos[2]);
    this.pivot.rotation.y = o.rotY;
    // Scharnier an der Seite
    const hingeOffset = new THREE.Vector3(hingeSide * w / 2, 0, 0);
    const hinge = new THREE.Group();
    hinge.position.copy(hingeOffset);
    this.pivot.add(hinge);
    hinge.add(this.leaf);
    this.leaf.position.set(-hingeSide * w / 2, 0, 0);
    const wood = materials.surface(o.kind === "iron" ? "ironRusty" : o.kind === "dark" ? "woodDark" : "woodOld");
    const iron = materials.surface("iron");
    // Türblatt aus Bohlen
    const planks = 5;
    for (let i = 0; i < planks; i++) {
      const pw = w / planks;
      const g = boxGeo(pw - 0.008, h, t);
      const m = new THREE.Mesh(g, wood);
      m.position.set(-w / 2 + pw * (i + 0.5), h / 2, 0);
      m.castShadow = true;
      m.receiveShadow = true;
      this.leaf.add(m);
    }
    // Eisenbeschläge
    for (const y of [0.35, h * 0.5, h - 0.35]) {
      const band = new THREE.Mesh(boxGeo(w * 0.96, 0.08, t + 0.03), iron);
      band.position.set(0, y, 0);
      band.castShadow = true;
      this.leaf.add(band);
    }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.015, 6, 14), iron);
    ring.position.set(hingeSide * -w * 0.32, h * 0.48, t / 2 + 0.03);
    this.leaf.add(ring);
    const ring2 = ring.clone();
    ring2.position.z = -t / 2 - 0.03;
    this.leaf.add(ring2);
    this.hingeGroup = hinge;

    // Blocker in Weltkoordinaten
    const box = new THREE.Box3();
    const c = new THREE.Vector3(o.pos[0], o.pos[1] + h / 2, o.pos[2]);
    const half = new THREE.Vector3(w / 2, h / 2, Math.max(t, 0.25) / 2).applyAxisAngle(new THREE.Vector3(0, 1, 0), o.rotY);
    box.setFromCenterAndSize(c, new THREE.Vector3(Math.abs(half.x) * 2 + 0.05, h, Math.abs(half.z) * 2 + 0.05));
    this.blocker = level.col.addBlocker(o.id, box, true);
    level.root.add(this.pivot);
    level.doors.push(this);

    if (level.st[`door:${o.id}`]) {
      this.isOpen = true;
      this.angle = this.target = o.swing ?? -1.6;
      this.blocker.enabled = false;
      this.applyAngle();
    }

    level.interact({
      id: "door:" + o.id,
      pos: new THREE.Vector3(o.pos[0], o.pos[1] + 1.2, o.pos[2]),
      radius: 2.4,
      prompt: () => (this.isOpen ? "" : o.prompt ?? "Tür öffnen"),
      enabled: () => !this.isOpen || !!o.autoClose,
      onInteract: () => this.tryOpen(),
      angle: 0.75,
    });
  }

  private hingeGroup: THREE.Group;

  tryOpen(): boolean {
    if (this.isOpen) return true;
    const l = this.opts.locked;
    if (l) {
      const hasItem = l.item ? G.state.hasItem(l.item) : true;
      const hasFlag = l.flag ? G.state.is(l.flag) : true;
      if (!hasItem || !hasFlag) {
        G.ui.notify(l.message, "warn");
        G.audio.sfx("locked", this.worldPos());
        return false;
      }
      if (l.item && l.consume) G.inventory.remove(l.item);
      if (l.item) G.ui.notify(`${G.inventory.name(l.item)} benutzt.`, "item");
    }
    this.open();
    return true;
  }

  open(silent = false): void {
    if (this.isOpen) return;
    this.isOpen = true;
    this.target = this.opts.swing ?? -1.6;
    this.level.st[`door:${this.opts.id}`] = true;
    if (!silent) G.audio.sfx(this.opts.kind === "iron" ? "gateOpen" : "doorOpen", this.worldPos());
    this.opts.onOpen?.();
  }

  close(slow = false): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.target = 0;
    this.speed = slow ? 0.35 : 1.6;
    this.level.st[`door:${this.opts.id}`] = false;
    G.audio.sfx(slow ? "doorCreak" : "doorSlam", this.worldPos());
  }

  worldPos(): THREE.Vector3 {
    return new THREE.Vector3(this.opts.pos[0], this.opts.pos[1] + 1.2, this.opts.pos[2]);
  }

  private applyAngle(): void {
    this.hingeGroup.rotation.y = this.angle;
  }

  update(dt: number): void {
    if (Math.abs(this.angle - this.target) > 0.001) {
      const dir = Math.sign(this.target - this.angle);
      this.angle += dir * Math.min(Math.abs(this.target - this.angle), dt * this.speed);
      this.applyAngle();
    } else if (!this.isOpen) {
      this.speed = 1.6;
    }
    this.blocker.enabled = Math.abs(this.angle) < 0.6;
  }
}

/** Basisklasse aller Spielbereiche. */
export abstract class Level {
  abstract readonly id: string;
  abstract readonly chapter: number;
  abstract readonly title: string;
  abstract readonly location: string;
  /** Musik-Cue beim Betreten */
  music = "castle";

  scene = new THREE.Scene();
  root = new THREE.Group();
  col = new CollisionWorld();
  batch = new StaticBatch();
  flames = new FlameSystem();
  lightPool = new LightPool();
  interactables: Interactable[] = [];
  triggers: Trigger[] = [];
  zones: Zone[] = [];
  doors: Door[] = [];
  updaters: ((dt: number, t: number) => void)[] = [];
  spawns: Record<string, { pos: THREE.Vector3; yaw: number }> = {};
  env: EnvPreset = { ...defaultEnv };
  sky: Sky | null = null;
  particles: CameraParticles[] = [];
  rain: Rain | null = null;
  fogBanks: FogBanks | null = null;
  ambient = new THREE.AmbientLight(0xffffff, 0.5);
  hemi = new THREE.HemisphereLight(0x223344, 0x080404, 0.3);
  moon: THREE.DirectionalLight | null = null;
  disposables: { dispose(): void }[] = [];

  constructor() {
    this.scene.add(this.root);
    this.scene.add(this.ambient);
    this.scene.add(this.hemi);
    this.scene.add(this.lightPool.group);
    this.scene.add(this.flames.mesh);
    this.scene.fog = new THREE.FogExp2(0x000000, 0.05);
  }

  /** Persistenter Level-Zustand (Türen, Gegenstände, Ereignisse). */
  get st(): Record<string, boolean | number | string> {
    return G.state.level(this.id);
  }

  /** Oberflächen, die vorab generiert werden (Ladebildschirm). */
  requiredSurfaces(): SurfaceName[] {
    return ["castleStone", "castleFloor", "woodDark", "iron"];
  }

  abstract build(): Promise<void> | void;
  /** Wird nach dem Laden aufgerufen (Quests, Skripte). */
  abstract start(spawnId: string, fresh: boolean): void;

  finalize(): void {
    this.batch.build(this.root);
    this.col.build();
  }

  update(dt: number, t: number): void {
    for (const d of this.doors) d.update(dt);
    for (const u of this.updaters) u(dt, t);
    this.flames.update(t);
  }

  dispose(): void {
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
    });
    this.flames.dispose();
    this.col.dispose();
    this.sky?.dispose();
    this.particles.forEach((p) => p.dispose());
    this.rain?.dispose();
    this.fogBanks?.dispose();
    this.disposables.forEach((d) => d.dispose());
  }

  // -------------------------------------------------------------------------
  // Bausteine
  // -------------------------------------------------------------------------

  /** Statische Box (zusammengefasst) mit optionaler Kollision. */
  box(mat: THREE.Material, center: [number, number, number], size: [number, number, number], opts: { rotY?: number; collide?: boolean; cast?: boolean } = {}): void {
    const g = boxGeo(size[0], size[1], size[2]);
    const m = new THREE.Matrix4().makeRotationY(opts.rotY ?? 0).setPosition(center[0], center[1], center[2]);
    this.batch.add(g, m, mat, opts.cast ?? true, true);
    g.dispose();
    if (opts.collide !== false) this.col.addBox(center, size, opts.rotY ?? 0);
  }

  /** Box über Min/Max. */
  boxMM(mat: THREE.Material, min: [number, number, number], max: [number, number, number], collide = true): void {
    this.box(mat, [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2], [max[0] - min[0], max[1] - min[1], max[2] - min[2]], { collide });
  }

  /** Beliebige Geometrie statisch hinzufügen. */
  geo(geo: THREE.BufferGeometry, mat: THREE.Material, pos: [number, number, number] = [0, 0, 0], rot: [number, number, number] = [0, 0, 0], scale: [number, number, number] | number = 1, opts: { collide?: boolean; cast?: boolean } = {}): void {
    const s = typeof scale === "number" ? [scale, scale, scale] : scale;
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(...pos),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(rot[0], rot[1], rot[2], "YXZ")),
      new THREE.Vector3(s[0], s[1], s[2]),
    );
    this.batch.add(geo, m, mat, opts.cast ?? true, true);
    if (opts.collide) this.col.addGeometry(geo, m);
  }

  floor(mat: THREE.Material, x0: number, z0: number, x1: number, z1: number, y = 0, thickness = 0.3): void {
    this.box(mat, [(x0 + x1) / 2, y - thickness / 2, (z0 + z1) / 2], [x1 - x0, thickness, z1 - z0], { cast: false });
  }

  ceiling(mat: THREE.Material, x0: number, z0: number, x1: number, z1: number, y: number, thickness = 0.4): void {
    this.box(mat, [(x0 + x1) / 2, y + thickness / 2, (z0 + z1) / 2], [x1 - x0, thickness, z1 - z0], { collide: true, cast: true });
  }

  /** Flaches Dekor (Teppich, Blutlache) auf dem Boden. */
  decal(mat: THREE.Material, pos: [number, number, number], w: number, d: number, rotY = 0, normal: "up" | "x" | "-x" | "z" | "-z" = "up"): THREE.Mesh {
    const g = planeGeo(w, d);
    // planeGeo hat metrische UVs – Decals brauchen 0..1
    const uv = g.getAttribute("uv") as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / w, uv.getY(i) / d);
    const m = new THREE.Mesh(g, mat);
    m.position.set(...pos);
    if (normal === "up") {
      m.rotation.set(-Math.PI / 2, 0, rotY);
    } else if (normal === "x") m.rotation.set(0, Math.PI / 2, rotY);
    else if (normal === "-x") m.rotation.set(0, -Math.PI / 2, rotY);
    else if (normal === "z") m.rotation.set(0, 0, rotY);
    else m.rotation.set(0, Math.PI, rotY);
    m.renderOrder = 2;
    m.receiveShadow = true;
    this.root.add(m);
    return m;
  }

  light(o: Omit<Partial<LightSource>, "pos"> & { pos: THREE.Vector3 | [number, number, number] }): LightSource {
    const pos = Array.isArray(o.pos) ? new THREE.Vector3(...o.pos) : o.pos;
    return this.lightPool.add({ ...o, pos });
  }

  flame(pos: [number, number, number] | THREE.Vector3, scale = 0.06, kind: "candle" | "torch" = "candle"): number {
    const p = Array.isArray(pos) ? new THREE.Vector3(...pos) : pos;
    return this.flames.add(p, scale, kind);
  }

  interact(i: Omit<Interactable, "radius" | "enabled"> & { radius?: number; enabled?: () => boolean }): Interactable {
    const it: Interactable = { radius: 2.2, enabled: () => true, ...i };
    this.interactables.push(it);
    return it;
  }

  removeInteractable(id: string): void {
    this.interactables = this.interactables.filter((i) => i.id !== id);
  }

  trigger(id: string, min: [number, number, number], max: [number, number, number], onEnter: () => void, opts: Partial<Omit<Trigger, "id" | "box">> = {}): Trigger {
    const t: Trigger = {
      id,
      box: new THREE.Box3(new THREE.Vector3(...min), new THREE.Vector3(...max)),
      once: opts.once ?? true,
      fired: false,
      inside: false,
      condition: opts.condition,
      onEnter,
      onExit: opts.onExit,
      onStay: opts.onStay,
    };
    if (t.once && this.st["trig:" + id]) t.fired = true;
    this.triggers.push(t);
    return t;
  }

  zone(id: string, min: [number, number, number], max: [number, number, number], env: Partial<EnvPreset>, priority = 1): void {
    this.zones.push({ id, box: new THREE.Box3(new THREE.Vector3(...min), new THREE.Vector3(...max)), env, priority });
  }

  spawn(id: string, pos: [number, number, number], yaw: number): void {
    this.spawns[id] = { pos: new THREE.Vector3(...pos), yaw };
  }

  door(o: DoorOpts): Door {
    return new Door(this, o);
  }

  onUpdate(fn: (dt: number, t: number) => void): void {
    this.updaters.push(fn);
  }

  add(o: THREE.Object3D): THREE.Object3D {
    this.root.add(o);
    return o;
  }

  setupSky(opts: ConstructorParameters<typeof Sky>[0] = {}): Sky {
    this.sky = new Sky(opts);
    this.scene.add(this.sky.mesh);
    return this.sky;
  }

  setupMoonLight(intensity: number, color: THREE.ColorRepresentation, dir: THREE.Vector3, area: { center: THREE.Vector3; size: number }): THREE.DirectionalLight {
    const l = new THREE.DirectionalLight(color, intensity);
    l.position.copy(area.center).addScaledVector(dir.clone().normalize(), 60);
    l.target.position.copy(area.center);
    l.castShadow = true;
    const s = area.size / 2;
    l.shadow.camera.left = -s;
    l.shadow.camera.right = s;
    l.shadow.camera.top = s;
    l.shadow.camera.bottom = -s;
    l.shadow.camera.near = 1;
    l.shadow.camera.far = 140;
    l.shadow.mapSize.set(2048, 2048);
    l.shadow.bias = -0.0008;
    l.shadow.normalBias = 0.04;
    this.scene.add(l);
    this.scene.add(l.target);
    this.moon = l;
    return l;
  }

  addParticles(p: CameraParticles): void {
    this.particles.push(p);
    this.scene.add(p.points);
  }

  addRain(r: Rain): void {
    this.rain = r;
    this.scene.add(r.lines);
  }

  addFogBanks(f: FogBanks): void {
    this.fogBanks = f;
    this.scene.add(f.mesh);
  }

  /** Bedingung: Spieler sieht auf Punkt (im Sichtkegel und nicht verdeckt). */
  playerSees(p: THREE.Vector3, cosAngle = 0.8, checkOcclusion = true): boolean {
    const cam = G.camera;
    const dir = new THREE.Vector3();
    cam.getWorldDirection(dir);
    const to = p.clone().sub(cam.position);
    const d = to.length();
    if (d < 0.01) return true;
    if (to.dot(dir) / d < cosAngle) return false;
    if (!checkOcclusion) return true;
    return this.col.lineOfSight(cam.position, p);
  }
}
