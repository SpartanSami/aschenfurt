import * as THREE from "three";
import { G } from "../core/Context";
import { Character, CharacterPreset, Pose } from "../characters/Character";
import { PRESETS } from "../characters/Presets";
import type { Door } from "../world/Level";

// Wiederverwendbare Bausteine für Horror-Inszenierungen.

type V3 = [number, number, number];

export function v(p: V3): THREE.Vector3 {
  return new THREE.Vector3(...p);
}

/** Lichter im Umkreis flackern lassen; optional kurzer Ausfall. */
export async function flicker(pos: THREE.Vector3, radius: number, duration = 1.2, blackout = 0): Promise<void> {
  const L = G.level;
  if (!L) return;
  const src = L.lightPool.sourcesNear(pos, radius);
  const steps = Math.round(duration * 20);
  for (let i = 0; i < steps; i++) {
    for (const s of src) s.scale = Math.random() > 0.45 ? 1 : 0.05 + Math.random() * 0.3;
    await G.game.wait(0.05);
  }
  if (blackout > 0) {
    for (const s of src) s.scale = 0.02;
    await G.game.wait(blackout);
  }
  for (const s of src) s.scale = 1;
}

/** Statische Gestalt, die verschwindet, sobald der Spieler nahe kommt oder wegsieht. */
export async function figure(opts: {
  preset?: CharacterPreset | string;
  pos: V3;
  yaw?: number;
  pose?: Pose;
  vanish?: "approach" | "lookAway" | "flicker" | "time";
  dist?: number;
  maxTime?: number;
  ghost?: boolean;
  void?: boolean;
  onShow?: (c: Character) => void;
  headTilt?: number;
}): Promise<void> {
  const L = G.level;
  if (!L) return;
  const preset = typeof opts.preset === "string" ? PRESETS[opts.preset] : opts.preset ?? PRESETS.hollow;
  const c = new Character(preset, { ghost: opts.ghost, void: opts.void });
  c.root.position.set(...opts.pos);
  c.root.rotation.y = opts.yaw ?? 0;
  c.setPose(opts.pose ?? "hangHead", true);
  c.breathe = 0.2;
  c.headTilt = opts.headTilt ?? 0;
  L.scene.add(c.root);
  const upd = (dt: number, t: number) => c.update(dt, t);
  L.updaters.push(upd);
  opts.onShow?.(c);
  const p = v(opts.pos).add(new THREE.Vector3(0, 1.5, 0));
  let t = 0;
  let seen = false;
  const maxT = opts.maxTime ?? 40;
  while (t < maxT) {
    await G.game.wait(0.1);
    t += 0.1;
    const sees = L.playerSees(p, 0.8);
    if (sees) seen = true;
    const d = G.player.position.distanceTo(v(opts.pos));
    if (opts.vanish === "approach" && d < (opts.dist ?? 5)) break;
    if (opts.vanish === "lookAway" && seen && !L.playerSees(p, 0.55, false)) break;
    if (opts.vanish === "time" && t > (opts.dist ?? 3)) break;
    if (opts.vanish === "flicker" && seen && t > 1.5) {
      await flicker(p, 12, 0.6, 0.4);
      break;
    }
  }
  L.updaters = L.updaters.filter((u) => u !== upd);
  c.dispose();
}

/** Schritte, die sich entlang eines Pfades bewegen (ohne sichtbare Quelle). */
export async function phantomSteps(from: V3, to: V3, count = 8, interval = 0.55, surface = "stone"): Promise<void> {
  const a = v(from), b = v(to);
  const prev = G.audio.surface;
  for (let i = 0; i < count; i++) {
    const p = a.clone().lerp(b, i / Math.max(1, count - 1));
    G.audio.surface = surface;
    G.audio.sfx("stepNpc", p, 1.3);
    G.audio.surface = prev;
    await G.game.wait(interval + Math.random() * 0.05);
  }
}

export function soundBehind(name: string, dist = 2.2): void {
  const back = new THREE.Vector3();
  G.camera.getWorldDirection(back);
  back.multiplyScalar(-dist).add(G.camera.position);
  G.audio.sfx(name, back, 1.2);
}

export function whisperAt(pos: V3, name = "whisper"): void {
  G.audio.sfx(name, v(pos), 1.4);
}

/** Tür schließt sich langsam hinter dem Spieler. */
export async function slowClose(door: Door): Promise<void> {
  door.close(true);
}

/** Material über Zeit einblenden (z. B. Blutschrift an zuvor sauberer Wand). */
export async function fadeInMesh(mesh: THREE.Mesh, duration = 3, maxOpacity = 1): Promise<void> {
  const m = mesh.material as THREE.MeshStandardMaterial;
  m.transparent = true;
  mesh.visible = true;
  const steps = Math.round(duration * 20);
  for (let i = 0; i <= steps; i++) {
    m.opacity = (i / steps) * maxOpacity;
    await G.game.wait(0.05);
  }
}

/** Kurzer Erinnerungsbruch: Bildverzerrung, optional Umgebungswechsel. */
export async function memoryBreak(duration = 1.5, during?: () => void, after?: () => void): Promise<void> {
  const u = G.renderer.uniforms;
  G.audio.sfx("memoryIn");
  const steps = 20;
  for (let i = 0; i <= steps; i++) {
    u.uDistort.value = (i / steps) * 1.4;
    u.uMemory.value = (i / steps) * 0.6;
    await G.game.wait(0.03);
  }
  during?.();
  await G.game.wait(duration);
  after?.();
  for (let i = steps; i >= 0; i--) {
    u.uDistort.value = (i / steps) * 1.4;
    u.uMemory.value = (i / steps) * 0.6;
    await G.game.wait(0.03);
  }
  u.uDistort.value = 0;
  u.uMemory.value = 0;
}

/** Statue dreht den Kopf, wenn der Spieler nicht hinsieht. */
export function turnHead(statue: THREE.Object3D, yaw: number, pitch = 0.15): void {
  const head = statue.userData.head as THREE.Object3D | undefined;
  if (head) head.rotation.set(pitch, yaw, 0);
}

export async function scarePulse(strength = 1): Promise<void> {
  const u = G.renderer.uniforms;
  u.uPulse.value = strength;
  G.player.shake(0.04 * strength, 0.4);
}
