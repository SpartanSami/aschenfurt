import * as THREE from "three";
import { Level, Door } from "../Level";
import { materials, SurfaceName } from "../../graphics/Materials";
import { wall, vault, stairs, tower, gableRoof, moonShaft } from "../builders/Architecture";
import * as P from "../builders/Props";
import { terrain, deadTree, rock, grassField, bush, fence, mountains, conifer } from "../builders/Nature";
import { house, puddle } from "../builders/Village";
import { planeGeo } from "../builders/Geo";
import { CameraParticles, FogBanks, Rain, Flock } from "../../graphics/Effects";
import { G } from "../../core/Context";
import { Character } from "../../characters/Character";
import { PRESETS } from "../../characters/Presets";
import * as H from "../../horror/HorrorEvents";
import { fbm } from "../../graphics/Noise";
import type { Enemy } from "../../gameplay/CombatSystem";

type V3 = [number, number, number];
const v = (p: V3) => new THREE.Vector3(...p);
const box3 = (a: V3, b: V3) => new THREE.Box3(v(a), v(b));

/** Kapitel 2 – Das Dorf der Verdammten: Rabenfurt. */
export class Ch2Rabenfurt extends Level {
  readonly id = "ch2_rabenfurt";
  readonly chapter = 2;
  readonly title = "Das Dorf der Verdammten";
  readonly location = "Rabenfurt";
  override music = "village";

  private berta: Character | null = null;
  private ilyas: Character | null = null;
  private lene: Character | null = null;
  private gerold: Character | null = null;
  private villagers: Character[] = [];
  private ilyasDoor!: Door;
  private chapelDoor!: Door;
  private trapOpen = false;
  private trap!: THREE.Mesh;
  private crackLight: ReturnType<Level["light"]> | null = null;
  private crackMat!: THREE.MeshBasicMaterial;
  private guards: Enemy[] = [];
  private lightningT = 8;
  private leneFollow = false;

  h = (x: number, z: number): number => {
    const n = (fbm((((x + 300) / 90) % 1 + 1) % 1, (((z + 300) / 90) % 1 + 1) % 1, 3, 4, 21) - 0.5) * 0.9;
    const hill = 3.2 * THREE.MathUtils.smoothstep(-z, 22, 34);
    const road = Math.abs(x) < 3 ? 0.4 : 1;
    if (x > -5.3 && x < 5.3 && z > -50.3 && z < -31.7) return -3;
    return n * road + hill;
  };

  override requiredSurfaces(): SurfaceName[] {
    return ["plasterDirty", "plaster", "timber", "roofTiles", "roofSlate", "castleStone", "castleStoneDark", "cobble", "mud", "grass", "woodOld", "woodDark", "cryptStone", "cryptFloor", "clothLinen", "clothWolf", "clothDark", "leatherBrown", "bark", "rock", "iron", "fur", "velvet"];
  }

  async build(): Promise<void> {
    this.env = {
      ...this.env, fogColor: 0x10121a, fogDensity: 0.03, ambientColor: 0x5a6070, ambientIntensity: 0.55, hemiSky: 0x4a5878, hemiGround: 0x141010,
      hemiIntensity: 0.6, moonIntensity: 1.6, reverb: "outdoor", ambience: "village", surface: "dirt", rain: 1, exposure: 1.25,
    };
    const moonDir = new THREE.Vector3(-0.4, 0.5, -0.75).normalize();
    this.setupSky({ moonDir, redness: 0.92, cloudiness: 0.85, moonSize: 0.045, zenith: 0x05060a, horizon: 0x141018 });
    this.setupMoonLight(0, 0x8a5060, moonDir, { center: new THREE.Vector3(0, 0, -10), size: 110 });
    const h = this.h;
    terrain(this, materials.surface("mud"), 0, -10, 130, 150, 110, h);
    mountains(this, [0, 0, -10], 180, 50, 7, 0x080810);
    this.buildVillage();
    this.buildChapel();
    this.buildCrypt();
    this.addRain(new Rain(2600, 34));
    this.addParticles(new CameraParticles("spores", 120, 0x8090a0, 0.02, 20));
    const fb = new FogBanks(50, 0x5a6070, 0.1);
    for (let i = 0; i < 50; i++) {
      const x = -60 + Math.random() * 120, z = -70 + Math.random() * 130;
      fb.add(new THREE.Vector3(x, h(x, z) + 1, z), 9 + Math.random() * 10);
    }
    this.addFogBanks(fb);
    const flock = new Flock(new THREE.Vector3(0, 22, -40), 8, 18);
    this.scene.add(flock.group);
    this.onUpdate((dt, t) => {
      flock.update(t);
      this.updateLightning(dt);
      this.updateLeneFollow(dt);
    });
    this.zone("crypt", [-5.2, -3, -50.4], [5.2, 2.7, -32],  { reverb: "crypt", ambience: "crypt", fogDensity: 0.05, fogColor: 0x140808, rain: 0, ambientIntensity: 0.4, hemiIntensity: 0.15, moonIntensity: 0, surface: "stone", music: "tension" }, 3);
    this.zone("chapel", [-5.5, 2.5, -50.5], [5.5, 12, -31.5], { reverb: "cathedral", ambience: "cathedral", fogDensity: 0.03, rain: 0, ambientIntensity: 0.5, hemiIntensity: 0.2, moonIntensity: 0.6, surface: "stone" }, 2);
    this.zone("ilyasHouse", [-21, -1, -1.5], [-13.5, 3, 5.5], { reverb: "room", ambience: "village", rain: 0, fogDensity: 0.02, surface: "wood" }, 2);
    this.zone("square", [-14, -2, -6], [14, 8, 20], { surface: "stone" }, 1);
    this.spawn("start", [0, h(0, 62) + 0.1, 62], 0);
    this.spawn("square", [0, h(0, 18) + 0.1, 18], 0);
    this.spawn("chapel", [0, 3.3, -29], 0);
    this.spawn("north", [26, h(26, -46) + 0.1, -46], -0.6);
  }

  // ===========================================================================
  // Dorf
  // ===========================================================================
  private buildVillage(): void {
    const h = this.h;
    // Kopfsteinpflaster des Platzes und Straße
    for (let x = -12; x <= 12; x += 2.4) for (let z = 0; z <= 20; z += 2.4) this.decal(materials.surface("cobble"), [x, h(x, z) + 0.03, z], 2.5, 2.5);
    for (let z = 22; z < 70; z += 2.4) this.decal(materials.surface("cobble"), [0, h(0, z) + 0.03, z], 3.2, 2.5);
    for (let z = -2; z > -30; z -= 2.2) this.decal(materials.surface("cobble"), [0, h(0, z) + 0.03, z], 2.6, 2.3);
    P.well(this, [0, h(0, 10), 10]);
    P.lantern(this, [1.4, h(1, 10) + 1.0, 10.6], true, 3);
    for (const [x, z] of [[5, 4], [-6, 15], [8, 17], [-3, 22], [2, 36], [-1, -12]] as [number, number][]) puddle(this, x, h(x, z), z, 1.2 + Math.abs(Math.sin(x)) * 0.8);
    // Häuser
    const inn = materials.inscription(["ZUM", "KRÄHENKRUG"], { w: 256, h: 128, bg: "#2a1a10", color: "#c8a868" });
    house(this, 18, 6, 7, 6, h(18, 6), "w", { lit: true });
    house(this, 16, -12, 9, 7, h(16, -12), "w", { lit: true, sign: inn, floors: 2 });
    const ilyasHouse = house(this, -17.5, 2, 7, 7, h(-17.5, 2), "e", { lit: true, interior: true, height: 3.0 });
    house(this, -16, 20, 6, 6, h(-16, 20), "e", { boarded: true });
    house(this, 16, 24, 6, 7, h(16, 24), "w", { boarded: true, floors: 1 });
    house(this, -19, -15, 7, 6, h(-19, -15), "e", { floors: 2 });
    house(this, 7, -24, 6, 6, h(7, -24), "s", { boarded: true, floors: 1 });
    house(this, -8, -24, 6, 5, h(-8, -24), "s", { floors: 1 });
    house(this, 20, 42, 6, 6, h(20, 42), "w", { floors: 1, boarded: true });
    house(this, -20, 40, 7, 6, h(-20, 40), "e", { floors: 2 });
    // Scheune
    const by = h(-30, 26);
    wall(this, materials.surface("woodOld"), [-35, 21], [-25, 21], by, 4.5, 0.25);
    wall(this, materials.surface("woodOld"), [-35, 31], [-25, 31], by, 4.5, 0.25);
    wall(this, materials.surface("woodOld"), [-35, 21], [-35, 31], by, 4.5, 0.25);
    wall(this, materials.surface("woodOld"), [-25, 21], [-25, 31], by, 4.5, 0.25, [{ at: 5, w: 3, h: 3.6, kind: "rect" }]);
    gableRoof(this, materials.surface("roofSlate"), materials.surface("woodOld"), -35, 21, -25, 31, by + 4.5, 3, "z", 0.6);
    P.barrel(this, [-26, by, 23]);
    P.crate(this, [-27, by, 29], 0.8);
    // Zäune, Bäume
    fence(this, [-30, 10], [-30, -6], h, 0.3, 3);
    fence(this, [26, 14], [26, 34], h, 0.3, 4);
    fence(this, [-10, 48], [-28, 48], h, 0.4, 5);
    deadTree(this, [10, h(10, 34), 34], 8, 31);
    deadTree(this, [-9, h(-9, 33), 33], 9, 32);
    deadTree(this, [28, h(28, -4), -4], 10, 33);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const x = Math.cos(a) * 55, z = -10 + Math.sin(a) * 60;
      conifer(this, [x, h(x, z), z], 12 + (i % 3) * 3, i + 40);
    }
    for (let i = 0; i < 10; i++) bush(this, [-24 + i * 5.5, h(-24 + i * 5.5, 52), 52 + (i % 2) * 3], 0.9, i + 60);
    rock(this, [24, h(24, 18), 18], 1.2, 3);
    grassField(this, 1800, { x0: -55, z0: -60, x1: 55, z1: 70 }, h, 9, (x, z) => (Math.abs(x) < 13 && z > -4 && z < 22) || Math.abs(x) < 2.2 || (Math.abs(x) < 7 && z < -30 && z > -52));
    // Licht
    P.lantern(this, [12.8, h(13, -12) + 2.2, -9.4], true, 3);
    P.lantern(this, [-13, h(-13, 2) + 2.2, 0.4], true, 2.5);
    P.lantern(this, [0.8, h(0, 40) + 1.8, 40], true, 2.4);
    for (const [x, z] of [[14, 6], [-17.5, 2], [16, -12]] as [number, number][]) this.light({ pos: [x, h(x, z) + 4.4, z], color: new THREE.Color(1, 0.6, 0.3), intensity: 2, distance: 10, flicker: 0.2 });
    // Berta am Brunnen
    const b = new Character(PRESETS.berta);
    b.root.position.set(-1.8, h(-1.8, 10.5), 10.5);
    b.root.rotation.y = Math.PI * 0.6;
    b.setPose("handsClasped", true);
    this.scene.add(b.root);
    this.onUpdate((dt, t) => b.update(dt, t));
    this.col.circles.push({ pos: b.root.position, radius: 0.35, height: 1.6, enabled: true });
    this.berta = b;
    P.lantern(this, [-1.4, h(-1.4, 11) + 0.02, 11.1], true, 2);
    this.interact({ id: "berta", pos: b.headWorld(), radius: 3, prompt: "Mit der alten Frau sprechen", onInteract: async () => {
      await G.dialogue.start("ch2_berta", b);
      this.checkResidents();
    } });
    // Konrad hinter der Tür des Krähenkrugs
    this.interact({ id: "konrad", pos: v([11.6, h(12, -12) + 1.4, -12]), radius: 2.6, prompt: "An die Tür klopfen", onInteract: async () => {
      if (!G.state.is("metKonrad")) {
        G.audio.sfx("thud", v([11.6, 1.4, -12]), 0.5);
        await G.story.say("ch2.innDoor");
      }
      await G.dialogue.start("ch2_konrad");
      this.checkResidents();
    } });
    // İlyas' Haus
    const hy = h(-17.5, 2);
    this.ilyasDoor = this.door({
      id: "ilyas", pos: [ilyasHouse.door.x - 0.9, hy, 2], rotY: Math.PI / 2, width: 1.1, height: 2.15, kind: "wood", hinge: "left", swing: 1.6,
      locked: { flag: "ilyasDoorOpen", message: "Verriegelt. Oben am Fenster bewegt sich ein Vorhang." },
      prompt: "Klopfen",
    });
    this.buildIlyasInterior(hy);
    this.trigger("ilyasApproach", [-14, hy - 1, -1], [-9, hy + 4, 5], () => this.ilyasWindow());
    // Lene schläft im Haus der Berta – Schlafwandeln
    G.horror.register({
      id: "ch2_lene", major: true, when: () => G.state.is("talkedIlyas") && !G.state.flag("leneFate"), minTime: 4,
      run: () => this.leneSleepwalk(),
    });
    this.trigger("arrive", [-6, -2, 54], [6, 6, 60], () => G.story.say("ch2.arrive"));
    this.trigger("square", [-12, -2, 0], [12, 6, 20], () => {
      G.quests.task("q_rabenfurt", "erkunden");
      G.story.say("ch2.square");
    });
    this.trigger("ilyasHouseSee", [-13, -2, -4], [-4, 6, 8], () => G.story.say("ch2.ilyasHouse"), { condition: () => !G.state.is("talkedIlyas") });
    // Ausgang nach Norden
    for (let z = -32; z > -64; z -= 2.4) {
      const x = 8 + (-32 - z) * 0.8;
      this.decal(materials.surface("mud"), [x, h(x, z) + 0.04, z], 3, 2.6, -0.7);
    }
    this.trigger("north", [18, -2, -70], [40, 10, -50], () => this.toForest(), { once: false });
  }

  private checkResidents(): void {
    if (G.state.is("metBerta") && G.state.is("metKonrad")) G.quests.task("q_rabenfurt", "bewohner");
  }

  private buildIlyasInterior(y: number): void {
    const wood = materials.surface("woodDark");
    P.table(this, [-18.6, y, 1], 1.8, 1.0, 0.8, Math.PI / 2, wood);
    P.chair(this, [-19.5, y, 1], Math.PI / 2, false, wood);
    P.candleCluster(this, [-18.4, y + 0.8, 0.6], 3, 0.15, 17, 2.4, 7, true);
    P.bookshelf(this, [-20.6, y, 4.2], Math.PI / 2, 2.0, 2.6, 41, true);
    P.bookshelf(this, [-16, y, 5.2], Math.PI, 2.0, 2.6, 42);
    for (let i = 0; i < 6; i++) {
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.35, 8), materials.surface("clothLinen"));
      s.rotation.z = Math.PI / 2;
      s.rotation.y = i * 0.6;
      s.position.set(-18.7 + Math.sin(i) * 0.4, y + 0.85, 1.3 + Math.cos(i * 2) * 0.3);
      this.add(s);
    }
    P.lectern(this, [-15.2, y, -0.8], -Math.PI / 2);
    P.rug(this, [-17.5, y + 0.1, 2], 4, 3, 0, 43);
    const il = new Character(PRESETS.ilyas);
    il.root.position.set(-14.9, y + 3.0, 3.1);
    il.root.rotation.y = Math.PI / 2;
    il.setPose("guard", true);
    this.scene.add(il.root);
    this.onUpdate((dt, t) => il.update(dt, t));
    this.ilyas = il;
    if (G.state.is("ilyasDoorOpen")) this.moveIlyasDown();
    this.interact({ id: "ilyasTalk", pos: v([-18.6, y + 1.5, 1.8]), radius: 3, prompt: "Mit İlyas sprechen", enabled: () => G.state.is("ilyasDoorOpen"), onInteract: async () => {
      await G.dialogue.start("ch2_ilyas", il);
      if (G.state.hasItem("ilyas_karte")) G.save.checkpoint();
    } });
  }

  private moveIlyasDown(): void {
    if (!this.ilyas) return;
    const y = this.h(-17.5, 2);
    this.ilyas.root.position.set(-18.6, y + 0.1, 2.1);
    this.ilyas.root.rotation.y = Math.PI / 2;
    this.ilyas.setPose("armsCrossed", true);
    this.col.circles.push({ pos: this.ilyas.root.position, radius: 0.35, height: 1.7, enabled: true });
  }

  private async ilyasWindow(): Promise<void> {
    if (G.state.is("ilyasDoorOpen") || !this.ilyas) return;
    await G.story.say("ch2.ilyasDoor");
    this.ilyas.faceTarget = G.camera.position;
    await G.dialogue.start("ch2_ilyas_window", this.ilyas);
    if (G.state.is("ilyasShot") && !this.st.shot) {
      this.st.shot = true;
      G.audio.sfx("thud", this.ilyas.headWorld(), 0.6);
      G.player.damage(15, this.ilyas.root.position);
      await G.story.say("ch2.bolt");
      await G.dialogue.start("ch2_ilyas_window", this.ilyas);
    }
    G.state.set("ilyasDoorOpen");
    await G.story.cutscene(async () => {
      await H.flicker(this.ilyas!.headWorld(), 4, 0.3);
      this.moveIlyasDown();
      await G.game.wait(1.5);
      G.audio.sfx("doorOpen", v([-14, 1.2, 2]));
      this.ilyasDoor.open(true);
    });
  }

  // ===========================================================================
  // Lene
  // ===========================================================================
  private async leneSleepwalk(): Promise<void> {
    const h = this.h;
    const l = new Character(PRESETS.lene);
    l.root.position.set(13.2, h(13.2, 6), 6);
    l.root.rotation.y = -Math.PI / 2;
    l.setPose("hangHead", true);
    this.scene.add(l.root);
    this.onUpdate((dt, t) => l.update(dt, t));
    this.lene = l;
    G.quests.start("q_lene");
    G.audio.sfx("lullabyBox", l.headWorld(), 0.5);
    await G.story.say("ch2.lene1");
    await G.story.say("ch2.lene2");
    G.quests.task("q_lene", "folgen");
    await G.story.say("ch2.leneFollow");
    const path: V3[] = [[8, 0, 3], [2, 0, -2], [0, 0, -12], [0, 0, -24], [0, 0, -29], [0, 3.2, -31.4], [0, 3.2, -40], [2.4, 3.2, -44.4], [3.5, 3.2, -45.0], [3.5, -1.5, -39.3], [0.8, -1.5, -42.2]];
    for (const p of path) {
      if (p[1] === 0) p[1] = h(p[0], p[2]);
      const to = v(p);
      // auf den Spieler warten
      while (G.player.position.distanceTo(l.root.position) > 16) await G.game.wait(0.3);
      if (p[2] === -31.4 && !this.chapelDoor.isOpen) {
        await G.game.wait(0.5);
        this.chapelDoor.open();
      }
      if (p[2] === -45.0 && !this.trapOpen) {
        this.openTrap();
        await G.game.wait(1);
      }
      if (Math.random() > 0.6) G.audio.sfx("lullabyBox", l.headWorld(), 0.35);
      const d = to.distanceTo(l.root.position);
      await l.walkTo(to, d / 0.9);
    }
    l.setPose("kneel");
  }

  private updateLeneFollow(_dt: number): void {
    if (!this.leneFollow || !this.lene) return;
    const l = this.lene;
    const p = G.player.position;
    const d = l.root.position.distanceTo(p);
    if (d > 2.6) {
      const dir = p.clone().sub(l.root.position).setY(0).normalize();
      const step = Math.min(d - 2, 2.4 * 0.016 * 3);
      l.root.position.addScaledVector(dir, step);
      const gy = G.level!.col.groundHeight(l.root.position.x, l.root.position.z, l.root.position.y + 2);
      if (gy !== null) l.root.position.y = gy;
      l.root.rotation.y = Math.atan2(dir.x, dir.z);
      l.locomotion = 2.2;
    } else l.locomotion = 0;
    if (d > 30) l.root.position.copy(p).add(new THREE.Vector3(1, 0, 1));
    // bei Berta angekommen
    if (this.berta && l.root.position.distanceTo(this.berta.root.position) < 4 && G.state.flag("leneFate") === "saved") {
      this.leneFollow = false;
      l.locomotion = 0;
      l.setPose("handsClasped");
      l.faceTarget = this.berta.headWorld();
      G.ui.notify("Sprich mit Berta.", "info");
    }
  }

  // ===========================================================================
  // Kapelle
  // ===========================================================================
  private buildChapel(): void {
    const st = materials.surface("castleStone");
    const dark = materials.surface("castleStoneDark");
    const y = 3.2;
    // Boden mit Öffnung für die Falltür
    const fl = materials.surface("castleFloor");
    this.box(fl, [0, y - 0.2, -36.75], [10.8, 0.4, 10.9]);
    this.box(fl, [-1.4, y - 0.2, -46.4], [8.0, 0.4, 8.4]);
    this.box(fl, [4.9, y - 0.2, -46.4], [1.0, 0.4, 8.4]);
    this.box(fl, [3.5, y - 0.2, -48.6], [1.8, 0.4, 4.0]);
    // Fundament (verdeckt die Senke im Gelände)
    this.box(dark, [0, -0.2, -30.6], [13, 6.8, 1.6]);
    this.box(dark, [0, -0.2, -51.4], [13, 6.8, 1.6]);
    this.box(dark, [-6.1, -0.2, -41], [1.6, 6.8, 22]);
    this.box(dark, [6.1, -0.2, -41], [1.6, 6.8, 22]);
    const glass = materials.stainedGlass(51, "saint", "#7a1020", 1.1);
    wall(this, st, [-5.4, -50.4], [5.4, -50.4], y, 7, 0.8);
    wall(this, st, [-5.4, -31.6], [5.4, -31.6], y, 7, 0.8, [{ at: 5.4, w: 1.8, h: 3, kind: "pointed", frame: dark }]);
    wall(this, st, [-5.4, -50.4], [-5.4, -31.6], y, 7, 0.8, [6, 12].map((a) => ({ at: a, w: 1.0, h: 3, y: 2.6, kind: "pointed" as const, glass, frame: dark })));
    wall(this, st, [5.4, -50.4], [5.4, -31.6], y, 7, 0.8, [6, 12].map((a) => ({ at: a, w: 1.0, h: 3, y: 2.6, kind: "pointed" as const, glass, frame: dark })));
    vault(this, st, -5, -50, 5, -32, y + 7, 3, "z", true);
    gableRoof(this, materials.surface("roofSlate"), st, -5.8, -50.8, 5.8, -31.2, y + 7, 4.5, "z", 0.4);
    tower(this, st, materials.surface("roofSlate"), -6.6, -31.4, y - 1, 2.0, 13, { windows: 1 });
    P.lantern(this, [1.4, y + 2.6, -30.9], true, 3);
    P.sconce(this, [-4.9, y + 2.4, -36], Math.PI / 2, true, false, 2);
    P.sconce(this, [4.9, y + 2.4, -42], -Math.PI / 2, true, false, 2);
    this.chapelDoor = this.door({
      id: "chapel", pos: [0, y, -31.6], rotY: 0, width: 1.7, height: 2.9, kind: "dark", hinge: "left", swing: -1.6, prompt: "Kapellentür öffnen",
      locked: { item: "kapellenschluessel", message: "Die Kapelle ist verschlossen. Der Kirchenvogt wird einen Schlüssel haben." },
      onOpen: () => {
        G.quests.task("q_rabenfurt", "kapelle", true);
        G.story.say("ch2.chapelEnter");
      },
    });
    // Innenraum
    for (let z = -34.5; z > -43; z -= 1.6) {
      P.pew(this, [-2.4, y, z], 3.0, Math.PI);
      P.pew(this, [2.4, y, z], 3.0, Math.PI);
    }
    P.altar(this, [0, y, -48.2], 0, materials.surface("castleStoneDark"));
    P.pillarCandles(this, [-1.2, y + 1.1, -48.2], 61);
    P.candleCluster(this, [1.2, y + 1.1, -48.3], 6, 0.3, 62, 2.6, 8, true);
    P.lectern(this, [-3.2, y, -45.5], Math.PI * 0.8);
    this.interact({ id: "sermon", pos: v([-3.2, y + 1.2, -45.5]), radius: 2.4, prompt: "Aufzeichnungen lesen", onInteract: () => {
      if (!G.state.hasItem("gerold_predigt")) G.inventory.add("gerold_predigt", 1, true);
      G.story.readDocument("gerold_predigt");
    } });
    P.statue(this, [-4.2, y, -49.2], Math.PI * 0.2, "angel", dark, 0.8);
    P.statue(this, [4.2, y, -49.2], -Math.PI * 0.2, "robed", dark, 0.8);
    P.banner(this, [0, y + 6.5, -49.9], 0, 1.4, 4, 63, "#3a0a10");
    P.cobweb(this, [-4.9, y + 6.5, -31.9], Math.PI * 0.75, 1.4, 64);
    // Fußspuren (Blutsicht)
    for (let i = 0; i < 9; i++) {
      const z = -33 - i * 1.4;
      const x = i < 7 ? 0.3 * Math.sin(i) : 1.2 + (i - 7) * 1.1;
      this.decal(materials.hidden("drops", 100 + i), [x, y + 0.01, z], 0.5, 0.8, 0);
    }
    this.trigger("footprints", [-3, y - 1, -46], [3, y + 3, -40], () => G.story.say("ch2.footprints"), { condition: () => G.abilities.bloodSightLevel > 0.5 });
    // Falltür
    this.trap = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 4.4), materials.surface("woodOld"));
    this.trap.position.set(3.5, y + 0.02, -44.4);
    this.add(this.trap);
    const trapBlock = this.col.addBlocker("trap", box3([2.6, y - 0.3, -46.6], [4.4, y + 0.05, -42.2]), true);
    void trapBlock;
    this.interact({ id: "trap", pos: v([3.5, y + 0.2, -44.4]), radius: 2.4, prompt: "Falltür öffnen", angle: 0.5, bloodSightOnly: false, enabled: () => !this.trapOpen, onInteract: () => this.openTrap() });
    if (this.st.trap) this.openTrap(true);
    moonShaft(this, new THREE.Vector3(-5.2, y + 4.5, -38), new THREE.Vector3(-1, y, -38.5), 1.0, 0x8a3040, 0.05);
    // Friedhof
    for (let i = 0; i < 24; i++) {
      const side = i % 2 ? 1 : -1;
      const x = side * (8 + (i % 5) * 2.4);
      const z = -32 - Math.floor(i / 2) * 1.9;
      P.gravestone(this, [x, this.h(x, z), z], Math.sin(i) * 0.3, 70 + i, Math.sin(i * 7) * 0.2);
    }
    deadTree(this, [-12, this.h(-12, -46), -46], 8, 77);
    deadTree(this, [13, this.h(13, -40), -40], 7, 78);
    G.horror.register({
      id: "ch2_chapelFigure", area: box3([-4, y - 1, -44], [4, y + 3, -34]), major: true, when: () => !!this.chapelDoor && this.chapelDoor.isOpen,
      run: async () => {
        await H.figure({ preset: "villagerF", pos: [-3.6, y, -42.2], yaw: Math.PI / 2, pose: "pray", vanish: "lookAway", maxTime: 25 });
      },
    });
  }

  private async openTrap(instant = false): Promise<void> {
    if (this.trapOpen) return;
    this.trapOpen = true;
    this.st.trap = true;
    const b = this.col.blockers.find((x) => x.id === "trap");
    if (b) b.enabled = false;
    if (instant) {
      this.trap.position.set(2.5, 3.2 + 0.9, -44.4);
      this.trap.rotation.z = Math.PI / 2;
      return;
    }
    G.audio.sfx("doorCreak", this.trap.position, 0.8);
    G.story.say("ch2.trapdoor");
    for (let i = 0; i <= 25; i++) {
      this.trap.rotation.z = (i / 25) * (Math.PI / 2);
      this.trap.position.set(3.5 - (i / 25) * 1.0, 3.2 + (i / 25) * 0.9, -44.4);
      await G.game.wait(0.03);
    }
  }

  // ===========================================================================
  // Gruft unter der Kapelle
  // ===========================================================================
  private buildCrypt(): void {
    const st = materials.surface("cryptStone");
    const fl = materials.surface("cryptFloor");
    const dark = materials.surface("castleStoneDark");
    const y = -1.5;
    this.floor(fl, -5, -50, 5, -32.4, y);
    wall(this, st, [-5.0, -50.2], [5.0, -50.2], y, 2.6, 0.4);
    wall(this, st, [-5.0, -32.2], [5.0, -32.2], y, 2.6, 0.4);
    wall(this, st, [-5.0, -50.2], [-5.0, -32.2], y, 2.6, 0.4);
    wall(this, st, [5.0, -50.2], [5.0, -32.2], y, 2.6, 0.4);
    vault(this, st, -4.8, -50, 4.8, -32.4, y + 2.6, 1.4, "z", false, false);
    // Treppe von der Falltür (Aufstieg Richtung Norden)
    stairs(this, dark, 3.5, -39.1, y, "-z", 1.6, 19, 0.2474, 0.33);
    wall(this, st, [2.55, -45.4], [2.55, -39.1], y, 4.6, 0.25);
    // Der tote Späher in der Nordwestecke
    const scout = new Character({ ...PRESETS.villagerM, id: "tarek", outfit: { ...PRESETS.villagerM.outfit, mantle: "fur", topMat: "leatherBrown" }, face: { ...PRESETS.villagerM.face, skin: [0.6, 0.45, 0.36], seed: 131, pallor: 0.5 } });
    scout.root.position.set(-4.1, y, -47.6);
    scout.root.rotation.y = Math.PI / 2;
    scout.setPose("slump", true);
    scout.breathe = 0;
    this.scene.add(scout.root);
    let scoutT = 0;
    this.onUpdate((dt, t) => {
      if (scoutT < 3) {
        scoutT += dt;
        scout.update(dt, t);
      }
    });
    this.decal(materials.blood("pool", 140), [-3.9, y + 0.02, -47.4], 1.6, 1.2);
    this.decal(materials.blood("hand", 141), [-4.75, y + 1.0, -47.8], 0.5, 0.5, 0.3, "x");
    for (let i = 0; i < 4; i++) this.decal(materials.blood("smear", 142 + i), [-4.76, y + 0.6 + i * 0.3, -46.6 - i * 0.2], 0.8, 0.3, 1.2, "x");
    this.interact({ id: "scout", pos: v([-4.0, y + 0.8, -47.5]), radius: 2.4, prompt: "Den Toten untersuchen", enabled: () => !G.state.hasItem("wolfszahn"), onInteract: async () => {
      G.inventory.add("wolfszahn");
      G.inventory.add("spaeherbrief");
      G.quests.task("q_rabenfurt", "wolfsbund");
      await G.story.say("ch2.scout");
      G.story.readDocument("spaeherbrief");
      G.story.learn("bassem", 1);
      G.story.learn("nadira", 1);
    } });
    // Riss mit rotem Licht
    this.crackMat = materials.basic("crack", () => new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 0.15, 0.1), transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending, map: materials.hidden("smear", 150).map })) as THREE.MeshBasicMaterial;
    this.decal(this.crackMat, [-0.5, y + 0.03, -43.5], 3.6, 1.2, 0.4);
    this.crackLight = this.light({ pos: [-0.5, y + 0.4, -43.5], color: new THREE.Color(1, 0.08, 0.05), intensity: 5, distance: 9, flicker: 0.4 });
    P.rubble(this, [-0.5, y, -43.5], 2.2, 10, 151, dark);
    P.candleCluster(this, [3.8, y, -48.8], 5, 0.4, 152, 2, 8);
    P.candleCluster(this, [-3.8, y, -34], 4, 0.4, 153, 1.6, 7);
    this.memorySpot("mem_kap", "m_kapelle", [1.4, y, -41.4], () => this.memChapel(), 1.1);
    P.bones(this, [-4, y, -38], 6, 154, 0.6);
    P.skull(this, [4.2, y + 0.1, -34], -1, 0.3);
    // Träumende Dorfbewohner, Gerold
    if (!G.state.decided("gerold")) {
      const ring: [string, number][] = [["villagerM", 0.3], ["villagerF", 1.6], ["villagerM", 2.9], ["villagerF", 4.3]];
      for (const [p, a] of ring) {
        const c = new Character({ ...PRESETS[p], face: { ...PRESETS[p].face, seed: 160 + a * 10, pallor: 0.3 } });
        c.root.position.set(-0.5 + Math.cos(a) * 2.4, y, -43.5 + Math.sin(a) * 2.0);
        c.root.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a));
        c.setPose("pray", true);
        c.breathe = 0.4;
        this.scene.add(c.root);
        this.onUpdate((dt, t) => c.update(dt, t));
        this.villagers.push(c);
      }
      const g = new Character(PRESETS.gerold);
      g.root.position.set(-0.5, y, -48.8);
      g.root.rotation.y = 0;
      g.setPose("raiseArms", true);
      this.scene.add(g.root);
      this.onUpdate((dt, t) => g.update(dt, t));
      this.col.circles.push({ pos: g.root.position, radius: 0.4, height: 1.7, enabled: true });
      this.gerold = g;
      this.interact({ id: "gerold", pos: v([-0.5, y + 1.6, -48.8]), radius: 3.4, prompt: "Vater Gerold ansprechen", enabled: () => !G.state.decided("gerold"), onInteract: () => this.confrontGerold() });
    }
    this.trigger("cryptEnter", [2.5, y - 1, -41], [4.6, y + 3, -38.4], async () => {
      G.quests.task("q_rabenfurt", "kapelle");
      await G.story.say("ch2.crypt");
      if (!G.state.decided("gerold")) this.spawnGuards();
    });
  }

  private spawnGuards(): void {
    if (this.guards.length || G.state.decided("gerold")) return;
    G.story.say("ch2.stealth");
    const mk = (pos: V3, patrol: V3[]) =>
      G.combat.spawn({ kind: "corrupted", pos: v(pos), human: true, patrol: patrol.map(v), leash: 12, onDeath: () => G.state.inc("guardsDown") });
    this.guards.push(mk([-3.2, -1.45, -38], [[-3.2, -1.45, -38], [-3.6, -1.45, -42], [-1.8, -1.45, -36]]));
    this.guards.push(mk([1.6, -1.45, -47.6], [[1.6, -1.45, -47.6], [-2.4, -1.45, -48.4], [1.8, -1.45, -45.6]]));
  }

  private async memChapel(): Promise<void> {
    const y = -1.5;
    await G.story.playMemory("m_kapelle", [
      { ghost: "ge", preset: PRESETS.gerold, pos: [-0.5, y, -45.6], yaw: 0, pose: "pray" },
      { look: [-0.5, y + 0.8, -44.5] },
      { say: "mem.kap.1" },
      { sfx: "whisper", pos: [-0.5, y + 0.2, -43.5] },
      { say: "mem.kap.2" },
      { say: "mem.kap.3" },
      { say: "mem.kap.4" },
      { wait: 1 },
    ]);
    G.story.learn("erste", 1);
  }

  private async confrontGerold(): Promise<void> {
    if (!this.gerold) return;
    await G.dialogue.start("ch2_gerold", this.gerold);
    const fate = G.state.decided("gerold");
    if (!fate) return;
    const g = this.gerold;
    await G.story.cutscene(async () => {
      if (fate === "killed" || fate === "fed") {
        G.audio.sfx(fate === "fed" ? "feed" : "hit", g.headWorld());
        G.renderer.uniforms.uPulse.value = 1;
        g.setPose("lie");
        await G.game.wait(1.2);
      } else {
        g.setPose(fate === "spared" ? "cower" : "kneel");
        await G.game.wait(1);
      }
      // Der Riss erlischt, die Stimme spricht
      G.audio.sfx("rumble");
      G.player.shake(0.03, 1.5);
      G.player.lookAt(v([-0.5, -1.3, -43.5]), 2);
      await G.story.say("ch2.voice");
      for (let i = 20; i >= 0; i--) {
        this.crackMat.opacity = (i / 20) * 0.95;
        if (this.crackLight) this.crackLight.scale = i / 20;
        await G.game.wait(0.05);
      }
      await G.story.say("ch2.afterVoice");
      for (const v2 of this.villagers) v2.setPose("cower");
      for (const e of this.guards) if (e.alive) e.die("takedown");
      await G.game.wait(1);
      await G.story.say("ch2.villagersWake");
      G.state.set("chapelDone");
      G.story.learn("erste", 2);
    });
    if (this.lene) {
      await G.dialogue.start("ch2_lene", this.lene);
      this.lene.setPose("hangHead");
      this.leneFollow = true;
      G.story.say("ch2.leneOut");
    } else {
      G.state.set("leneFate", "saved");
    }
    for (const v2 of this.villagers) {
      const exit = v([3.5, -1.5, -39.6]);
      v2.setPose("stand");
      v2.walkTo(exit, 6).then(() => v2.fadeOut(1));
    }
    G.save.checkpoint();
  }

  // ===========================================================================
  private updateLightning(dt: number): void {
    this.lightningT -= dt;
    const inside = this.zones.some((z) => z.env.rain === 0 && z.box.containsPoint(G.player.position));
    if (this.lightningT <= 0) {
      this.lightningT = 18 + Math.random() * 25;
      if (inside) return;
      const base = this.hemi.intensity;
      this.hemi.intensity = base + 6;
      setTimeout(() => (this.hemi.intensity = base + 1), 70);
      setTimeout(() => (this.hemi.intensity = base + 4), 140);
      setTimeout(() => (this.hemi.intensity = base), 260);
      setTimeout(() => G.audio.sfx("thunder"), 600 + Math.random() * 1500);
    }
  }

  private async toForest(): Promise<void> {
    if (G.story.busy) return;
    if (!G.state.is("chapelDone") || !G.state.hasItem("ilyas_karte")) {
      G.story.say("ch2.notYet");
      if (G.state.is("chapelDone")) G.ui.notify("İlyas wollte wissen, was du in der Kapelle gefunden hast.", "info");
      G.player.teleport(G.player.position.clone().add(new THREE.Vector3(-3, 0.3, 3)), G.player.yaw);
      return;
    }
    G.quests.task("q_rabenfurt", "wald");
    await G.story.say("ch2.toForest");
    G.quests.complete("q_rabenfurt");
    G.save.checkpoint();
    if (G.levels.has("ch3_forst")) {
      await G.story.goTo("ch3_forst", "start", { chapter: 3, title: "Der Wald ohne Morgen", sub: "Hinter den Grenzsteinen gilt ein Eid, der älter ist als dein Name." });
    } else {
      await G.story.fade(1, 2);
      await G.ui.chapterCard(2, "Ende des zweiten Kapitels", "Fortsetzung folgt.");
      G.game.toMainMenu();
    }
  }

  start(_spawn: string, fresh: boolean): void {
    G.quests.start("q_rabenfurt");
    G.renderer.uniforms.uFade.value = 0;
    if (fresh) G.save.checkpoint();
    G.audio.addEmitter(v([-0.5, -1.2, -43.5]), "whisper", 10);
    G.audio.addEmitter(v([0, 0.5, 10]), "water", 8);
    void this.berta;
  }
}
