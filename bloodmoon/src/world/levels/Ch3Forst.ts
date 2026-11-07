import * as THREE from "three";
import { Level } from "../Level";
import { materials, SurfaceName } from "../../graphics/Materials";
import { wall, tower } from "../builders/Architecture";
import * as P from "../builders/Props";
import { terrain, deadTree, rock, grassField, bush, conifer, mushrooms, mountains } from "../builders/Nature";
import { planeGeo, cylGeo } from "../builders/Geo";
import { CameraParticles, FogBanks, smokeTexture } from "../../graphics/Effects";
import { G } from "../../core/Context";
import { Character } from "../../characters/Character";
import { Werewolf } from "../../characters/Creatures";
import { PRESETS } from "../../characters/Presets";
import * as H from "../../horror/HorrorEvents";
import { fbm, Rng } from "../../graphics/Noise";
import type { Enemy } from "../../gameplay/CombatSystem";

type V3 = [number, number, number];
const v = (p: V3) => new THREE.Vector3(...p);
const box3 = (a: V3, b: V3) => new THREE.Box3(v(a), v(b));

const PATH: [number, number][] = [[0, 96], [6, 70], [8, 52], [-4, 32], [-6, 14], [4, 0], [2, -20], [-6, -38], [0, -60], [10, -82], [14, -100], [14, -108]];
const CAMP: [number, number] = [-34, -22];
const CIRCLE: [number, number] = [30, -58];
const TOWER: [number, number] = [14, -114];

function distToPath(x: number, z: number): number {
  let best = 1e9;
  for (let i = 0; i < PATH.length - 1; i++) {
    const [ax, az] = PATH[i], [bx, bz] = PATH[i + 1];
    const dx = bx - ax, dz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    best = Math.min(best, Math.hypot(x - (ax + dx * t), z - (az + dz * t)));
  }
  return best;
}

/** Kapitel 3 – Der Wald ohne Morgen: der Schwarze Forst. */
export class Ch3Forst extends Level {
  readonly id = "ch3_forst";
  readonly chapter = 3;
  readonly title = "Der Wald ohne Morgen";
  readonly location = "Der Schwarze Forst";
  override music = "forest";

  private bassem: Character | null = null;
  private nadira: Enemy | null = null;
  private bassemWolf: Werewolf | null = null;
  private stonesRead = new Set<string>();

  h = (x: number, z: number): number => {
    const n = (fbm((((x + 500) / 140) % 1 + 1) % 1, (((z + 500) / 140) % 1 + 1) % 1, 3, 5, 31) - 0.5) * 7;
    const d = distToPath(x, z);
    const flat = THREE.MathUtils.smoothstep(d, 2, 10);
    const sites = Math.min(Math.hypot(x - CAMP[0], z - CAMP[1]) / 14, Math.hypot(x - CIRCLE[0], z - CIRCLE[1]) / 12, Math.hypot(x - TOWER[0], z - TOWER[1]) / 10, 1);
    return n * (0.25 + 0.75 * flat) * Math.max(0.15, sites) + 2;
  };

  override requiredSurfaces(): SurfaceName[] {
    return ["forest", "dirt", "bark", "barkPale", "grass", "rock", "rockDark", "castleStone", "castleStoneDark", "clothWolf", "leatherBrown", "fur", "furGrey", "ironRusty", "silver", "bone", "woodOld", "roofSlate", "cryptFloor"];
  }

  async build(): Promise<void> {
    this.env = {
      ...this.env, fogColor: 0x141a18, fogDensity: 0.032, ambientColor: 0x5a6a62, ambientIntensity: 0.6, hemiSky: 0x506a60, hemiGround: 0x0c0a08,
      hemiIntensity: 0.9, moonIntensity: 3.6, reverb: "forest", ambience: "forest", surface: "dirt", exposure: 1.4,
    };
    const moonDir = new THREE.Vector3(0.5, 0.55, -0.65).normalize();
    this.setupSky({ moonDir, redness: 0.95, cloudiness: 0.45, moonSize: 0.05, zenith: 0x040606, horizon: 0x0e1410 });
    this.setupMoonLight(0, 0xa04a50, moonDir, { center: new THREE.Vector3(5, 0, -10), size: 160 });
    const h = this.h;
    terrain(this, materials.surface("forest"), 0, -10, 200, 250, 140, h);
    mountains(this, [0, 0, -10], 240, 80, 11, 0x050706);
    // Pfad
    for (let i = 0; i < PATH.length - 1; i++) {
      const [ax, az] = PATH[i], [bx, bz] = PATH[i + 1];
      const len = Math.hypot(bx - ax, bz - az);
      const n = Math.ceil(len / 2.2);
      const rot = Math.atan2(bx - ax, bz - az);
      for (let k = 0; k < n; k++) {
        const x = ax + ((bx - ax) * k) / n, z = az + ((bz - az) * k) / n;
        this.decal(materials.surface("dirt"), [x, h(x, z) + 0.05, z], 3.4, 2.6, rot);
      }
    }
    this.buildForest();
    this.buildStones();
    this.buildCamp();
    this.buildCircle();
    this.buildTower();
    this.addParticles(new CameraParticles("spores", 260, 0x9ab0a0, 0.025, 22));
    this.addParticles(new CameraParticles("dust", 160, 0x507060, 0.02, 14));
    const fb = new FogBanks(70, 0x4a5a52, 0.11);
    const rng = new Rng(5);
    for (let i = 0; i < 70; i++) {
      const x = rng.range(-70, 70), z = rng.range(-120, 100);
      fb.add(new THREE.Vector3(x, h(x, z) + 1.2, z), rng.range(10, 20));
    }
    this.addFogBanks(fb);
    this.zone("tower", [TOWER[0] - 5, -5, TOWER[1] - 5], [TOWER[0] + 5, 20, TOWER[1] + 5], { reverb: "room", ambience: "forest", surface: "stone" }, 2);
    this.zone("circle", [CIRCLE[0] - 12, -5, CIRCLE[1] - 12], [CIRCLE[0] + 12, 20, CIRCLE[1] + 12], { surface: "grass" }, 1);
    this.spawn("start", [0, h(0, 94) + 0.1, 94], 0);
    this.spawn("bassem", [3, h(3, 8) + 0.1, 8], 0);
    this.spawn("circle", [CIRCLE[0] - 14, h(CIRCLE[0] - 14, CIRCLE[1]) + 0.1, CIRCLE[1]], -Math.PI / 2);
    this.spawn("tower", [12, h(12, -100) + 0.1, -100], 0);
    this.registerHorror();
  }

  private buildForest(): void {
    const h = this.h;
    const rng = new Rng(77);
    const blocked = (x: number, z: number) =>
      distToPath(x, z) < 5 || Math.hypot(x - CAMP[0], z - CAMP[1]) < 12 || Math.hypot(x - CIRCLE[0], z - CIRCLE[1]) < 11 || Math.hypot(x - TOWER[0], z - TOWER[1]) < 9 || Math.hypot(x - 6, z + 2) < 9;
    let n = 0;
    for (let i = 0; i < 900 && n < 230; i++) {
      const x = rng.range(-80, 80), z = rng.range(-130, 105);
      if (blocked(x, z)) continue;
      const near = distToPath(x, z);
      if (near > 40 && rng.next() > 0.5) continue;
      if (rng.next() > 0.82) deadTree(this, [x, h(x, z) - 0.2, z], rng.range(7, 12), i, materials.surface(rng.next() > 0.5 ? "bark" : "barkPale"));
      else conifer(this, [x, h(x, z) - 0.2, z], rng.range(12, 22), i);
      n++;
    }
    for (let i = 0; i < 60; i++) {
      const x = rng.range(-60, 60), z = rng.range(-120, 100);
      if (distToPath(x, z) < 3.5) continue;
      rock(this, [x, h(x, z) - 0.3, z], rng.range(0.6, 2.2), i, materials.surface(rng.next() > 0.5 ? "rock" : "rockDark"));
    }
    for (let i = 0; i < 90; i++) {
      const x = rng.range(-50, 50), z = rng.range(-120, 100);
      if (distToPath(x, z) < 3) continue;
      bush(this, [x, h(x, z), z], rng.range(0.6, 1.2), i + 300);
    }
    for (let i = 0; i < 40; i++) {
      const x = rng.range(-40, 40), z = rng.range(-110, 90);
      if (distToPath(x, z) < 2.5) continue;
      mushrooms(this, [x, h(x, z), z], rng.int(3, 7), i, rng.next() > 0.5);
    }
    grassField(this, 2200, { x0: -50, z0: -120, x1: 50, z1: 100 }, h, 13, (x, z) => distToPath(x, z) < 2.2, 0x708068);
    // Großer Felsen an der Lichtung
    rock(this, [8, h(8, -2) - 0.5, -2], 3.2, 91, materials.surface("rockDark"), true, 0.8);
  }

  // ===========================================================================
  private buildStones(): void {
    const h = this.h;
    const stones: [string, number, number, number][] = [["s1", -3.5, 72, 0.3], ["s2", 12.5, 46, -0.6], ["s3", -10, 22, 0.5]];
    for (const [id, x, z, rot] of stones) {
      const y = h(x, z);
      this.box(materials.surface("rockDark"), [x, y + 1.0, z], [0.9, 2.4, 0.5], { rotY: rot });
      const ins = new THREE.Mesh(planeGeo(0.7, 1.4), materials.inscription(["ᚹ ᛟ ᛚ ᚠ", "· EID ·", "ᚾ ᚨ ᚲ ᚺ ᛏ", "ᛗ ᛟ ᚾ ᛞ"], { w: 256, h: 512, color: "rgba(10,8,6,0.85)" }));
      const uv = ins.geometry.getAttribute("uv") as THREE.BufferAttribute;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 0.7, uv.getY(i) / 1.4);
      const fwd = new THREE.Vector3(Math.sin(rot), 0, Math.cos(rot));
      ins.position.set(x, y + 1.2, z).addScaledVector(fwd, 0.26);
      ins.rotation.y = rot;
      this.add(ins);
      const blood = new THREE.Mesh(planeGeo(0.7, 0.7), materials.hidden("hand", 200 + x));
      const bu = blood.geometry.getAttribute("uv") as THREE.BufferAttribute;
      for (let i = 0; i < bu.count; i++) bu.setXY(i, bu.getX(i) / 0.7, bu.getY(i) / 0.7);
      blood.position.set(x, y + 0.7, z).addScaledVector(fwd, 0.27);
      blood.rotation.y = rot;
      this.add(blood);
      this.interact({ id, pos: v([x, y + 1.2, z]).addScaledVector(fwd, 0.3), radius: 2.6, prompt: "Grenzstein untersuchen", onInteract: () => this.readStone(id) });
    }
  }

  private readStone(id: string): void {
    const first = !this.st["stone_" + id];
    this.st["stone_" + id] = true;
    const read = ["s1", "s2", "s3"].filter((s) => this.st["stone_" + s]).length;
    if (first) {
      G.quests.start("q_grenze");
      G.ui.notify(`Grenzstein ${read}/3 untersucht`, "quest");
      if (read === 1) G.story.say("ch3.stone1");
    }
    if (read === 3) {
      if (!G.state.hasItem("grenzstein_abrieb")) G.inventory.add("grenzstein_abrieb");
      G.story.readDocument("grenzstein_abrieb");
      if (first) setTimeout(() => G.story.say("ch3.stones"), 600);
      G.quests.task("q_grenze", "grenzsteine");
    } else {
      G.ui.notify("Die Schrift ist uralt. Erst alle drei Steine zusammen ergeben den Eid.", "info");
    }
  }

  // ===========================================================================
  private buildCamp(): void {
    const h = this.h;
    const [cx, cz] = CAMP;
    const rng = new Rng(13);
    const cloth = materials.surface("clothWolf");
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      const x = cx + Math.cos(a) * 8, z = cz + Math.sin(a) * 8;
      const y = h(x, z);
      const tent = new THREE.ConeGeometry(2.0, 3.2, 7, 1, true);
      const p = tent.getAttribute("position") as THREE.BufferAttribute;
      for (let k = 0; k < p.count; k++) p.setX(k, p.getX(k) * (1 + Math.sin(k * 3.1) * 0.06));
      tent.computeVertexNormals();
      this.geo(tent, cloth, [x, y + 1.5, z], [rng.range(-0.15, 0.15), rng.next() * 6, rng.range(-0.15, 0.15)], 1, { collide: true });
      tent.dispose();
      // Stangen
      for (let k = 0; k < 3; k++) {
        const pole = cylGeo(0.04, 0.04, 3.8, 5);
        this.geo(pole, materials.surface("woodOld"), [x + Math.cos(k * 2) * 0.2, y + 1.9, z + Math.sin(k * 2) * 0.2], [Math.cos(k * 2) * 0.2, 0, Math.sin(k * 2) * 0.2]);
        pole.dispose();
      }
      // Risse
      this.decal(materials.blood("splatter", 210 + i), [x + 1.6, y + 0.04, z], 1.6, 1.4, rng.next() * 6);
    }
    // Totems
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const x = cx + Math.cos(a) * 3.5, z = cz + Math.sin(a) * 3.5;
      const y = h(x, z);
      const pole = cylGeo(0.12, 0.15, 3.4, 7);
      this.geo(pole, materials.surface("barkPale"), [x, y + 1.7, z], [0, 0, 0], 1, { collide: true });
      pole.dispose();
      P.skull(this, [x, y + 3.5, z], a, 0.2);
      const fur = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.8, 6, 1, true), materials.surface("fur"));
      fur.position.set(x, y + 2.8, z);
      this.add(fur);
    }
    // Feuerstelle (kalt), Knochen, Ketten
    const y0 = h(cx, cz);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      rock(this, [cx + Math.cos(a) * 1.1, y0, cz + Math.sin(a) * 1.1], 0.3, 400 + i, materials.surface("rockDark"), false);
    }
    this.decal(materials.basic("ash", () => new THREE.MeshStandardMaterial({ color: 0x1a1612, roughness: 1, transparent: true, map: smokeTexture() })), [cx, y0 + 0.05, cz], 2, 2);
    P.bones(this, [cx + 4, y0, cz - 3], 8, 410, 1);
    P.bones(this, [cx - 5, y0, cz + 2], 6, 411, 1);
    P.chains(this, [cx + 2, y0 + 2.6, cz + 5.8], 2.2, 2);
    // Kratzspuren an Bäumen und Blut
    for (let i = 0; i < 5; i++) this.decal(materials.blood("smear", 220 + i), [cx + rng.range(-7, 7), y0 + 0.05, cz + rng.range(-7, 7)], 1.4, 0.6, rng.next() * 6);
    // Spuren zum Lager (Blutsicht)
    for (let i = 0; i < 14; i++) {
      const t = i / 13;
      const x = THREE.MathUtils.lerp(-4, cx + 6, t), z = THREE.MathUtils.lerp(-14, cz + 2, t) + Math.sin(i) * 1.2;
      this.decal(materials.hidden("drops", 230 + i), [x, h(x, z) + 0.06, z], 0.6, 0.9, Math.atan2(cx - x, cz - z));
    }
    this.trigger("tracks", [-12, -5, -24], [2, 20, -8], () => {
      G.quests.task("q_grenze", "spuren");
      G.story.say("ch3.tracks");
    }, { condition: () => G.abilities.bloodSightLevel > 0.5 || G.quests.taskDone("q_grenze", "bassem") });
    this.trigger("camp", [cx - 10, -5, cz - 10], [cx + 10, 20, cz + 10], async () => {
      G.quests.task("q_grenze", "spuren", true);
      G.quests.task("q_grenze", "lager");
      await G.story.say("ch3.camp");
      await G.story.say("ch3.campBodies");
    });
    this.memorySpot("mem_harun", "m_harun", [cx + 2.2, y0 + 0.01, cz + 5.0], () => this.memHarun(), 1.2);
    this.interact({ id: "campChains", pos: v([cx + 2.1, y0 + 1.8, cz + 5.8]), radius: 2.6, prompt: "Ketten untersuchen", onInteract: () => G.story.say("ch3.chains") });
  }

  private async memHarun(): Promise<void> {
    const [cx, cz] = CAMP;
    const y = this.h(cx, cz);
    await G.story.playMemory("m_harun", [
      { ghost: "co", preset: PRESETS.corvin, pos: [cx + 4.5, y, cz + 2.5], yaw: -Math.PI / 2, pose: "stand" },
      { ghost: "w1", preset: PRESETS.cultist, pos: [cx + 1.2, y, cz + 4.2], yaw: Math.PI, pose: "guard" },
      { ghost: "ha", preset: { ...PRESETS.bassem, id: "harun", face: { ...PRESETS.bassem.face, age: 0.6, seed: 230 } }, pos: [cx + 2, y, cz + 5.4], yaw: Math.PI, pose: "kneel" },
      { ghost: "bo", preset: { ...PRESETS.bassem, id: "young", height: 1.3, build: "child" }, pos: [cx - 2.5, y, cz + 3.5], yaw: Math.PI / 2, pose: "reach" },
      { look: [cx + 2, y + 1, cz + 5.4] },
      { sfx: "chains", pos: [cx + 2, y + 1, cz + 5.4] },
      { say: "mem.zehnt.1" },
      { look: [cx - 2.5, y + 1, cz + 3.5] },
      { say: "mem.zehnt.2" },
      { look: [cx + 4.5, y + 1.6, cz + 2.5] },
      { say: "mem.zehnt.3" },
      { wait: 1 },
    ]);
    G.story.learn("corvin", 2);
    // Bassem erscheint
    if (!G.state.is("bassemCampTalk")) {
      G.state.set("bassemCampTalk");
      const b = this.ensureBassem([cx - 3, y, cz - 4], Math.PI * 0.25);
      await G.game.wait(1);
      await G.dialogue.start("ch3_bassem_camp", b);
      G.save.checkpoint();
    }
  }

  private ensureBassem(pos: V3, yaw: number): Character {
    if (!this.bassem) {
      const b = new Character(PRESETS.bassem);
      this.scene.add(b.root);
      this.onUpdate((dt, t) => b.update(dt, t));
      this.col.circles.push({ pos: b.root.position, radius: 0.4, height: 1.9, enabled: true });
      this.bassem = b;
      b.eyeGlow = 0;
    }
    this.bassem.root.visible = true;
    this.bassem.root.position.set(...pos);
    this.bassem.root.rotation.y = yaw;
    this.bassem.setPose("armsCrossed", true);
    return this.bassem;
  }

  // ===========================================================================
  private buildCircle(): void {
    const h = this.h;
    const [cx, cz] = CIRCLE;
    const y0 = h(cx, cz);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const x = cx + Math.cos(a) * 7.5, z = cz + Math.sin(a) * 7.5;
      const hh = 2.6 + Math.sin(i * 2.7) * 0.8;
      this.box(materials.surface("rock"), [x, h(x, z) + hh / 2 - 0.3, z], [1.0, hh, 0.7], { rotY: -a + Math.PI / 2 });
    }
    this.box(materials.surface("rockDark"), [cx, y0 + 0.45, cz], [2.6, 0.9, 1.4]);
    this.decal(materials.blood("pool", 250), [cx, y0 + 0.92, cz], 1.4, 0.9);
    P.chains(this, [cx - 1.2, y0 + 0.9, cz + 0.7], 0.5, 1);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      const sx = cx + Math.cos(a) * 1.6, sz = cz + Math.sin(a) * 1.0;
      const chainG = cylGeo(0.02, 0.02, 1.6, 4);
      this.geo(chainG, materials.surface("silver"), [sx, y0 + 0.5, sz], [0, a, 1.2]);
      chainG.dispose();
    }
    this.decal(materials.hidden("seal", 251, "", "rgba(200,160,40,0.9)"), [cx, y0 + 0.05, cz], 12, 12);
    this.light({ pos: [cx, y0 + 3, cz], color: new THREE.Color(0.9, 0.3, 0.3), intensity: 2, distance: 14, flicker: 0.1 });
    this.memorySpot("mem_eid", "m_steinkreis", [cx + 1.6, y0 + 0.01, cz + 2.0], () => this.memEid(), 1.2);
    this.trigger("circle", [cx - 11, -5, cz - 11], [cx + 11, 25, cz + 11], () => this.nadiraEncounter(), { condition: () => !G.state.flag("nadiraFate") });
    this.onUpdate(() => {
      if (!this.nadira || !this.nadira.alive) return;
      const d = Math.hypot(G.player.position.x - cx, G.player.position.z - cz);
      if (d > 48) this.nadiraFlees();
    });
  }

  private async nadiraEncounter(): Promise<void> {
    if (G.state.flag("nadiraFate") || this.nadira) return;
    const [cx, cz] = CIRCLE;
    const y0 = this.h(cx, cz);
    G.quests.start("q_nadira", false);
    G.quests.task("q_nadira", "finden");
    const wolf = new Werewolf({ color: 0x3a2e24, eye: 0xffb030, scale: 0.92 });
    wolf.root.position.set(cx, y0 + 0.9, cz);
    wolf.setState("crouch");
    this.scene.add(wolf.root);
    let wt = 0;
    const upd = (dt: number) => {
      wt += dt;
      wolf.faceTarget = G.camera.position;
      wolf.update(dt);
    };
    this.onUpdate(upd);
    await G.story.cutscene(async () => {
      G.player.lookAt(v([cx, y0 + 1.8, cz]), 2);
      await G.story.say("ch3.circle");
      wolf.setState("howl");
      G.audio.sfx("howl", v([cx, y0 + 2, cz]), 1.3);
      await G.game.wait(2.5);
    });
    this.updaters = this.updaters.filter((u) => u !== upd);
    wolf.dispose();
    void wt;
    this.nadira = G.combat.spawn({
      kind: "wolf", pos: v([cx, y0 + 0.95, cz + 1.5]), aggressive: true, human: true, scale: 0.92, leash: 30, takedownLabel: "Nadira dein Blut anbieten",
      onDeath: (_e, how) => this.resolveNadira(how === "takedown" ? "calmed" : "killed"),
    });
    G.ui.notify("Bring sie ins Wanken (Blutstoß) und biete ihr dann dein Blut an [E].", "info");
    if (G.state.is("bassemAtCircle")) setTimeout(() => this.bassemTransforms(), 3500);
  }

  private async bassemTransforms(): Promise<void> {
    if (!this.nadira || !this.nadira.alive) return;
    const [cx, cz] = CIRCLE;
    const pos: V3 = [cx - 9, this.h(cx - 9, cz + 3), cz + 3];
    const b = this.ensureBassem(pos, Math.PI / 2);
    b.setPose("guard");
    G.audio.sfx("growl", b.headWorld(), 1);
    G.story.say("ch3.transform");
    // Verwandlung: Rauch, Licht, brechende Knochen
    const smoke: THREE.Mesh[] = [];
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: smokeTexture(), color: 0x2a2420, transparent: true, opacity: 0.0, depthWrite: false }));
      m.position.set(pos[0] + (Math.random() - 0.5), pos[1] + 0.5 + Math.random() * 1.5, pos[2] + (Math.random() - 0.5));
      this.scene.add(m);
      smoke.push(m);
    }
    const lights = H.flicker(v(pos), 10, 1.2);
    for (let i = 0; i <= 30; i++) {
      const k = i / 30;
      b.root.scale.set(1 + k * 0.25, 1 + k * 0.2, 1 + k * 0.25);
      b.eyeGlow = k;
      b.headTilt = Math.sin(i * 1.7) * 0.2 * k;
      smoke.forEach((m, j) => {
        m.lookAt(G.camera.position);
        m.scale.setScalar(1 + k * 3 + j * 0.2);
        (m.material as THREE.MeshBasicMaterial).opacity = Math.sin(k * Math.PI) * 0.7;
      });
      if (i % 6 === 0) G.audio.sfx("hit", v(pos), 0.4);
      G.player.shake(0.01, 0.1);
      await G.game.wait(0.05);
    }
    await lights;
    b.root.visible = false;
    const w = new Werewolf({ color: 0x1c1410, eye: 0xd09020, scale: 1.12 });
    w.root.position.set(...pos);
    w.root.rotation.y = Math.PI / 2;
    this.scene.add(w.root);
    this.bassemWolf = w;
    this.onUpdate((dt) => w.update(dt));
    w.setState("howl");
    G.audio.sfx("howl", v(pos), 1.4);
    await G.game.wait(1.5);
    smoke.forEach((m) => {
      m.parent?.remove(m);
      m.geometry.dispose();
    });
    // Bassem hält seine Schwester fest
    w.setState("run");
    const target = this.nadira?.pos.clone() ?? v([cx, 0, cz]);
    const start = w.root.position.clone();
    for (let i = 0; i <= 20; i++) {
      w.root.position.lerpVectors(start, target.clone().add(new THREE.Vector3(-1.2, 0, 0)), i / 20);
      w.root.rotation.y = Math.atan2(target.x - start.x, target.z - start.z);
      await G.game.wait(0.03);
    }
    w.setState("lunge");
    if (this.nadira?.alive) {
      this.nadira.stagger(9);
      G.ui.notify("Bassem hält sie fest! Jetzt – [E]", "warn");
    }
    await G.game.wait(1);
    w.setState("idle");
  }

  private async resolveNadira(fate: "calmed" | "killed" | "fled"): Promise<void> {
    if (G.state.flag("nadiraFate")) return;
    G.state.set("nadiraFate", fate);
    G.quests.task("q_nadira", "entscheiden");
    const [cx, cz] = CIRCLE;
    const pos = this.nadira?.pos.clone() ?? v([cx, this.h(cx, cz), cz]);
    if (fate === "calmed") {
      G.story.decide("nadira", "calmed", "Nadira mit dem eigenen Blut beruhigt");
      G.player.damage(20);
      G.abilities.addHunger(18);
      await G.story.say("ch3.nadiraCalm");
    }
    if (this.nadira) {
      G.combat.remove(this.nadira);
      this.nadira = null;
    }
    if (fate === "calmed") {
      const n = new Character(PRESETS.nadira);
      n.root.position.copy(pos);
      n.setPose("kneel", true);
      this.scene.add(n.root);
      this.onUpdate((dt, t) => n.update(dt, t));
      n.faceTarget = G.camera.position;
      await G.story.say("ch3.nadiraCalmed");
      await G.dialogue.start("ch3_nadira", n);
      G.relations.change("bassem", G.state.is("bassemAtCircle") ? 30 : 20);
      if (this.bassemWolf && this.bassem) {
        this.bassemWolf.dispose();
        this.bassemWolf = null;
        this.bassem.root.visible = true;
        this.bassem.root.scale.setScalar(1);
        this.bassem.eyeGlow = 0;
        this.bassem.root.position.copy(pos).add(new THREE.Vector3(-1.4, 0, 0.6));
        this.bassem.setPose("kneel");
        this.bassem.faceTarget = n.headWorld();
        await G.story.say("ch3.bassemThanks");
      }
      G.inventory.add("nadiras_band");
    } else if (fate === "killed") {
      G.story.decide("nadira", "killed", "Nadira getötet");
      await G.story.say("ch3.nadiraKilled");
      if (this.bassemWolf) {
        await G.story.say("ch3.bassemGrief");
        this.bassemWolf.setState("howl");
        G.audio.sfx("howl", this.bassemWolf.root.position, 1.5);
        G.relations.change("bassem", -40);
      } else G.relations.change("bassem", -25);
    } else {
      G.story.decide("nadira", "fled", "Nadira entkommen lassen");
      await G.story.say("ch3.nadiraFled");
    }
    G.quests.complete("q_nadira");
    G.save.checkpoint();
  }

  private nadiraFlees(): void {
    if (!this.nadira) return;
    this.resolveNadira("fled");
  }

  private async memEid(): Promise<void> {
    const [cx, cz] = CIRCLE;
    const y = this.h(cx, cz);
    const ring: { ghost: string; preset: typeof PRESETS.bassem; pos: V3; yaw: number; pose: "handsClasped" | "stand" }[] = [];
    const ps = [PRESETS.bassem, PRESETS.ysolde, PRESETS.nadira, PRESETS.malachias, PRESETS.villagerM, PRESETS.corvin];
    ps.forEach((p, i) => {
      const a = (i / ps.length) * Math.PI * 2;
      ring.push({ ghost: "g" + i, preset: p, pos: [cx + Math.cos(a) * 3, y, cz + Math.sin(a) * 2.6], yaw: Math.atan2(-Math.cos(a), -Math.sin(a)), pose: "handsClasped" });
    });
    await G.story.playMemory("m_steinkreis", [
      ...ring,
      { look: [cx, y + 1, cz] },
      { say: "mem.eid.1" },
      { say: "mem.eid.2" },
      { say: "mem.eid.3" },
      { wait: 1 },
    ]);
    G.quests.task("q_grenze", "ritual");
  }

  // ===========================================================================
  private buildTower(): void {
    const h = this.h;
    const [tx, tz] = TOWER;
    const y0 = h(tx, tz);
    const st = materials.surface("castleStoneDark");
    // Ruinenturm: runde Wand mit Türöffnung (aus Segmenten)
    const r = 4.2;
    const seg = 18;
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
      if (i === 4 || i === 5) continue; // Tür nach Süden-Osten
      const hh = 9 + Math.sin(i * 1.9) * 3 - (i > 10 && i < 14 ? 4 : 0);
      wall(this, st, [tx + Math.cos(a0) * r, tz + Math.sin(a0) * r], [tx + Math.cos(a1) * r, tz + Math.sin(a1) * r], y0 - 0.5, hh, 0.9);
    }
    this.floor(materials.surface("cryptFloor"), tx - r, tz - r, tx + r, tz + r, y0 + 0.1);
    const crest = new THREE.Mesh(planeGeo(1.2, 1.2), materials.symbol("rabe", "#9a8060", "#1a1210"));
    const a = (4.5 / seg) * Math.PI * 2;
    crest.position.set(tx + Math.cos(a) * (r + 0.47), y0 + 3.6, tz + Math.sin(a) * (r + 0.47));
    crest.lookAt(crest.position.clone().add(new THREE.Vector3(Math.cos(a), 0, Math.sin(a))));
    this.add(crest);
    for (let i = 0; i < 4; i++) this.decal(materials.blood("smear", 260 + i), [tx + Math.cos(a) * (r + 0.47) + i * 0.1, y0 + 1.2 + i * 0.4, tz + Math.sin(a) * (r + 0.47)], 1.2, 0.25, 0.8, "z");
    P.rubble(this, [tx - 2, y0, tz + 1], 2, 12, 270, st);
    P.table(this, [tx - 1.6, y0 + 0.1, tz - 1.8], 1.6, 0.8, 0.8, 0.4, materials.surface("woodOld"));
    P.candle(this, [tx - 1.4, y0 + 0.9, tz - 1.6], 0.08, true, 0.03);
    this.light({ pos: [tx - 1.4, y0 + 1.5, tz - 1.6], intensity: 2.5, distance: 8, flicker: 0.5 });
    P.chains(this, [tx + 2.6, y0 + 3, tz - 2.4], 2.4, 2);
    P.cage(this, [tx + 2.4, y0 + 0.1, tz + 1.8], 1.8, 0.6, false);
    this.interact({ id: "zehntListe", pos: v([tx - 1.6, y0 + 1.0, tz - 1.8]), radius: 2.4, prompt: "Verzeichnis lesen", onInteract: () => {
      if (!G.state.hasItem("blutzehnt_liste")) G.inventory.add("blutzehnt_liste");
      G.story.readDocument("blutzehnt_liste");
    } });
    // Luke mit Blutsiegel
    const hatch = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.12, 20), materials.surface("ironRusty"));
    hatch.position.set(tx + 0.6, y0 + 0.17, tz + 0.2);
    this.add(hatch);
    this.decal(materials.hidden("seal", 280), [tx + 0.6, y0 + 0.25, tz + 0.2], 1.9, 1.9);
    this.interact({ id: "hatch", pos: v([tx + 0.6, y0 + 0.4, tz + 0.2]), radius: 2.4, prompt: () => (G.quests.taskDone("q_grenze", "eingang") ? "Hinabsteigen" : "Blutsiegel mit eigenem Blut öffnen"), onInteract: () => this.openHatch(hatch) });
    this.trigger("towerSee", [tx - 12, -5, tz - 2], [tx + 12, 25, tz + 16], () => G.story.say("ch3.tower"));
    this.trigger("towerBassem", [tx - 8, -5, tz + 4], [tx + 8, 25, tz + 12], async () => {
      if (G.state.is("bassemEnd")) return;
      G.state.set("bassemEnd");
      const b = this.ensureBassem([tx + 5, h(tx + 5, tz + 8), tz + 8], -Math.PI / 2);
      b.setPose("armsCrossed");
      if (this.bassemWolf) {
        this.bassemWolf.dispose();
        this.bassemWolf = null;
      }
      b.root.scale.setScalar(1);
      b.eyeGlow = 0;
      await G.game.wait(0.5);
      await G.dialogue.start("ch3_bassem_end", b);
    }, { condition: () => !!G.state.flag("nadiraFate") || G.relations.get("bassem") < -10 });
  }

  private async openHatch(hatch: THREE.Mesh): Promise<void> {
    if (!G.quests.taskDone("q_grenze", "ritual") || !G.state.flag("nadiraFate")) {
      G.story.say("ch3.notYet");
      if (!G.state.flag("nadiraFate")) G.ui.notify("Bassem bat dich, Nadira am Steinkreis im Osten zu finden.", "info");
      else G.ui.notify("Am Steinkreis wartet eine Bluterinnerung.", "info");
      return;
    }
    if (!G.quests.taskDone("q_grenze", "eingang")) {
      await G.story.say("ch3.hatch");
      G.player.damage(8);
      G.audio.sfx("stoneGrind", hatch.position);
      for (let i = 0; i <= 20; i++) {
        hatch.rotation.z = (i / 20) * 1.4;
        hatch.position.x += 0.03;
        hatch.position.y += 0.03;
        await G.game.wait(0.04);
      }
      G.quests.task("q_grenze", "eingang");
      await G.story.say("ch3.hatchOpen");
    }
    G.quests.task("q_grenze", "durchqueren");
    G.quests.complete("q_grenze");
    G.save.checkpoint();
    if (G.levels.has("ch4_ebon")) {
      await G.story.goTo("ch4_ebon", "start", { chapter: 4, title: "Die Kirche des Blutes", sub: "Ebon wurde für einen Gott gebaut, den niemand sehen sollte." });
    } else {
      await G.story.fade(1, 2);
      await G.ui.chapterCard(3, "Ende des dritten Kapitels", "Fortsetzung folgt.");
      G.game.toMainMenu();
    }
  }

  // ===========================================================================
  private registerHorror(): void {
    const h = this.h;
    G.horror.register({
      id: "ch3_eyes", area: box3([-20, -5, 40], [20, 30, 66]), major: false, minTime: 6,
      run: async () => {
        const pts: V3[] = [[-16, h(-16, 50) + 1.2, 50], [-15.6, h(-16, 50) + 1.2, 50]];
        const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 1.6, 0.2) });
        const eyes = pts.map((p) => {
          const m = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), mat);
          m.position.set(...p);
          this.scene.add(m);
          return m;
        });
        await G.story.say("ch3.eyes");
        let t = 0;
        while (t < 20 && !this.playerSees(eyes[0].position, 0.97, false)) {
          await G.game.wait(0.2);
          t += 0.2;
        }
        await G.game.wait(0.8);
        eyes.forEach((e) => this.scene.remove(e));
        G.audio.sfx("growl", eyes[0].position, 0.8);
      },
    });
    G.horror.register({
      id: "ch3_shape", area: box3([-20, -5, -10], [20, 30, 12]), major: true, when: () => !G.quests.taskDone("q_grenze", "bassem"),
      run: async () => {
        const w = new Werewolf({ color: 0x2a2018, scale: 1.1 });
        const from = v([-24, h(-24, 4), 4]), to = v([22, h(22, -8), -8]);
        w.root.position.copy(from);
        w.setState("run");
        this.scene.add(w.root);
        G.audio.sfx("growl", from, 1);
        await G.story.say("ch3.shape");
        for (let i = 0; i <= 60; i++) {
          w.root.position.lerpVectors(from, to, i / 60);
          w.root.position.y = h(w.root.position.x, w.root.position.z);
          w.root.rotation.y = Math.atan2(to.x - from.x, to.z - from.z);
          w.update(0.04);
          await G.game.wait(0.04);
        }
        w.dispose();
        this.meetBassem();
      },
    });
    // Falls das Schattenereignis bereits war, Bassem direkt bereitstellen
    if (G.horror.done("ch3_shape") && !G.quests.taskDone("q_grenze", "bassem")) setTimeout(() => this.meetBassem(), 500);
    G.horror.register({ id: "ch3_howl1", area: box3([-30, -5, 20], [30, 30, 40]), run: () => G.audio.sfx("howl", v([40, 6, 10]), 1.2) });
    G.horror.register({ id: "ch3_howl2", area: box3([-30, -5, -80], [30, 30, -60]), run: () => G.audio.sfx("howl", v([-40, 6, -90]), 1.2) });
  }

  private meetBassem(): void {
    if (G.quests.taskDone("q_grenze", "bassem")) return;
    const b = this.ensureBassem([8, this.h(8, -2) + 2.4, -2], -Math.PI * 0.6);
    b.setPose("guard", true);
    b.eyeGlow = 0.6;
    this.trigger("bassemMeet", [-4, -5, -10], [14, 30, 6], async () => {
      await G.story.cutscene(async () => {
        G.player.lookAt(b.headWorld(), 2.5);
        G.audio.sfx("growl", b.headWorld(), 1);
        await G.game.wait(1);
      });
      await G.dialogue.start("ch3_bassem_meet", b);
      b.eyeGlow = 0;
      G.save.checkpoint();
      // Bassem geht in den Wald
      b.setPose("stand");
      const to = v([-14, this.h(-14, -6), -6]);
      b.walkTo(to, 7).then(() => (b.root.visible = false));
    });
  }

  start(_spawn: string, fresh: boolean): void {
    G.quests.start("q_grenze");
    G.renderer.uniforms.uFade.value = 0;
    if (fresh) {
      G.story.say("ch3.enter");
      G.save.checkpoint();
    }
  }
}
