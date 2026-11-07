import * as THREE from "three";
import { Level } from "../Level";
import { materials, SurfaceName } from "../../graphics/Materials";
import { wall, vault, vaultRibs, column, stairs, moonShaft } from "../builders/Architecture";
import * as P from "../builders/Props";
import { planeGeo, boxGeo } from "../builders/Geo";
import { CameraParticles } from "../../graphics/Effects";
import { G } from "../../core/Context";
import { Character } from "../../characters/Character";
import { PRESETS } from "../../characters/Presets";
import * as H from "../../horror/HorrorEvents";
import { canvas, canvasTex } from "../../graphics/Textures";
import type { Enemy } from "../../gameplay/CombatSystem";
import type { LightSource } from "../../graphics/Lighting";

type V3 = [number, number, number];
const v = (p: V3) => new THREE.Vector3(...p);
const box3 = (a: V3, b: V3) => new THREE.Box3(v(a), v(b));

interface HouseWindow {
  id: string;
  name: string;
  sym: string;
  z: number;
  lights: LightSource[];
  flames: number[];
}

/** Kapitel 4 – Die Kirche des Blutes: Kathedrale von Ebon. */
export class Ch4Ebon extends Level {
  readonly id = "ch4_ebon";
  readonly chapter = 4;
  readonly title = "Die Kirche des Blutes";
  readonly location = "Kathedrale von Ebon";
  override music = "cathedral";

  private mine: Character | null = null;
  private malachias: Character | null = null;
  private acolytes: Character[] = [];
  private acolyteEnemies: Enemy[] = [];
  private windows: HouseWindow[] = [];
  private lit: string[] = [];
  private libDoor!: THREE.Mesh;
  private libBlocker!: ReturnType<Level["col"]["addBlocker"]>;
  private sealSlab!: THREE.Mesh;
  private sealBlocker!: ReturnType<Level["col"]["addBlocker"]>;
  private roseShadow!: THREE.Mesh;

  override requiredSurfaces(): SurfaceName[] {
    return ["cathedralStone", "castleStoneDark", "marbleFloor", "marble", "marbleBlack", "woodDark", "velvet", "gold", "iron", "clothDark", "leather", "bone", "cryptFloor", "cryptStone", "silver"];
  }

  async build(): Promise<void> {
    this.env = {
      ...this.env, fogColor: 0x120a0e, fogDensity: 0.018, ambientColor: 0x5a4650, ambientIntensity: 0.55, hemiSky: 0x6a4a5a, hemiGround: 0x140808,
      hemiIntensity: 0.45, moonIntensity: 3.5, reverb: "cathedral", ambience: "cathedral", surface: "stone", exposure: 1.3,
    };
    const moonDir = new THREE.Vector3(0.75, 0.6, 0.2).normalize();
    this.setupSky({ moonDir, redness: 1, cloudiness: 0.3, moonSize: 0.05 });
    this.setupMoonLight(0, 0xb03848, moonDir, { center: new THREE.Vector3(0, 10, -10), size: 100 });
    this.buildNave();
    this.buildChoir();
    this.buildSacristy();
    this.buildChapels();
    this.buildLineageWindows();
    this.buildLibrary();
    this.addParticles(new CameraParticles("dust", 450, 0xd0b090, 0.022, 16));
    this.zone("library", [-24, -1, -36], [-12, 10, -24], { reverb: "room", ambience: "cathedral", fogDensity: 0.02, surface: "wood" }, 2);
    this.zone("sacristy", [12, -1, 6], [20, 8, 16], { reverb: "room", fogDensity: 0.03 }, 2);
    this.zone("stairDown", [-2.5, -8, -52], [2.5, -0.2, -44], { reverb: "crypt", ambience: "underworld", music: "theFirst", fogDensity: 0.06 }, 3);
    this.spawn("start", [16.4, 0.05, 12.2], Math.PI / 2);
    this.spawn("nave", [0, 0.05, 18], 0);
    this.spawn("choir", [0, 0.05, -30], 0);
  }

  // ===========================================================================
  private buildNave(): void {
    const st = materials.surface("cathedralStone");
    const dark = materials.surface("castleStoneDark");
    const fl = materials.surface("marbleFloor");
    this.floor(fl, -12, -40, 12, 24, 0);
    const clere = materials.stainedGlass(301, "saint", "#901020", 1.5);
    const clere2 = materials.stainedGlass(302, "lineage", "#5a1060", 1.3);
    // Außenwände der Seitenschiffe (Fenster folgen gesondert)
    wall(this, st, [-12.4, 24.4], [12.4, 24.4], 0, 12, 0.8, [{ at: 12.4, w: 4, h: 7, kind: "pointed", frame: dark }]);
    wall(this, st, [12.4, -40], [12.4, 24.4], 0, 9.5, 0.8, [
      { at: 16, w: 3.0, h: 4.2, kind: "pointed", frame: dark },
      { at: 28, w: 3.0, h: 4.2, kind: "pointed", frame: dark },
      { at: 40, w: 3.0, h: 4.2, kind: "pointed", frame: dark },
      { at: 51, w: 1.8, h: 3.0, kind: "pointed", frame: dark },
    ]);
    // Pfeiler, Arkadenwände mit Obergaden
    for (let z = 20; z >= -36; z -= 8) {
      column(this, dark, -6, z, 0, 0.7, 12, true);
      column(this, dark, 6, z, 0, 0.7, 12, true);
    }
    for (const sx of [-6, 6]) {
      const ops = [];
      for (let z = 16; z >= -32; z -= 8) ops.push({ at: 24 - z, w: 2.2, h: 5.0, y: 13.2, kind: "pointed" as const, glass: z % 16 === 0 ? clere : clere2, frame: dark });
      wall(this, st, [sx, 24], [sx, -40], 12, 9, 0.9, ops.map((o) => ({ ...o, y: o.y - 12 })));
      // Arkadenbögen zwischen den Pfeilern
      for (let z = 20; z > -36; z -= 8) {
        this.box(dark, [sx, 11.6, z - 4], [0.9, 0.8, 7.0], { collide: false });
      }
    }
    vault(this, st, -6, -40, 6, 24, 21, 9, "z", true);
    vaultRibs(this, dark, -6, -40, 6, 24, 21, 9, "z", 8, true);
    vault(this, st, -12, -40, -6, 24, 9.5, 2.6, "z", true);
    vault(this, st, 6, -40, 12, 24, 9.5, 2.6, "z", true);
    vaultRibs(this, dark, -12, -40, -6, 24, 9.5, 2.6, "z", 8, true);
    vaultRibs(this, dark, 6, -40, 12, 24, 9.5, 2.6, "z", 8, true);
    // Lichtschächte vom Obergaden (Ostseite, Mond)
    for (let z = 16; z >= -32; z -= 16) moonShaft(this, new THREE.Vector3(6, 16, z), new THREE.Vector3(-3, 0, z - 2), 2.2, 0xa03040, 0.05);
    // Orgelempore über dem Portal
    this.box(materials.surface("woodDark"), [0, 9, 21.5], [11.5, 0.5, 5], { collide: false });
    for (let i = 0; i < 17; i++) {
      const x = -6 + i * 0.75;
      const hh = 3 + Math.sin((i / 16) * Math.PI) * 5;
      const pipe = new THREE.CylinderGeometry(0.16, 0.16, hh, 10);
      this.geo(pipe, materials.surface("silver"), [x, 9.25 + hh / 2, 23.4]);
      pipe.dispose();
    }
    // Bänke
    for (let z = 16; z > -26; z -= 2.2) {
      P.pew(this, [-3, 0, z], 4.4, Math.PI);
      P.pew(this, [3, 0, z], 4.4, Math.PI);
    }
    // Kerzen an den Pfeilern, Statuen der Blutheiligen
    let k = 0;
    for (let z = 20; z >= -36; z -= 8) {
      for (const sx of [-1, 1]) {
        P.candleCluster(this, [sx * 5.0, 0, z], 7, 0.45, 400 + k++, 2.6, 9, k % 3 === 0);
        if (z < 16 && z > -32) P.statue(this, [sx * 7.6, 0, z + 0.01], sx > 0 ? -Math.PI / 2 : Math.PI / 2, k % 2 ? "angel" : "robed", dark, 0.9);
      }
      P.banner(this, [-5.4, 11, z - 4], Math.PI / 2, 1.2, 4.5, 500 + k, "#2a0608");
      P.banner(this, [5.4, 11, z - 4], -Math.PI / 2, 1.2, 4.5, 520 + k, "#2a0608");
    }
    P.chandelier(this, [0, 13, 6], 2.2, true, false, 6);
    P.chandelier(this, [0, 13, -18], 2.2, true, false, 6);
    // Blutrinnen im Boden, die zum Chor führen
    for (let z = 22; z > -40; z -= 2.5) this.decal(materials.blood("smear", 600 + Math.round(z)), [0, 0.015, z], 0.7, 2.6, Math.PI / 2);
    for (let z = 22; z > -40; z -= 5) this.decal(materials.hidden("smear", 640 + Math.round(z)), [0, 0.02, z], 1.2, 5, Math.PI / 2);
    P.rug(this, [0, 0, -2], 3, 40, 0, 650);
    this.trigger("naveEnter", [-6, -1, -10], [6, 10, 20], () => {
      G.quests.task("q_dynastie", "betreten");
      G.story.say("ch4.nave");
    });
    this.trigger("candles", [-6, -1, -30], [6, 10, -20], () => G.story.say("ch4.candles"));
  }

  // ===========================================================================
  private buildChoir(): void {
    const st = materials.surface("cathedralStone");
    const dark = materials.surface("castleStoneDark");
    const mf = materials.surface("marbleFloor");
    this.floor(mf, -9, -54, -1.6, -40, 0);
    this.floor(mf, 1.6, -54, 9, -40, 0);
    this.floor(mf, -1.6, -54, 1.6, -50.6, 0);
    this.floor(mf, -1.6, -44, 1.6, -40, 0);
    this.box(materials.surface("marbleBlack"), [0, 0.2, -42.5], [12, 0.4, 3]);
    this.col.addRamp(v([0, 0.02, -40.3]), v([0, 0.4, -41.0]), 12);
    const rose = materials.stainedGlass(310, "rose", "#c01020", 2.2);
    const lancet = materials.stainedGlass(311, "saint", "#a01020", 1.4);
    wall(this, st, [-9.4, -54.4], [9.4, -54.4], 0, 26, 0.8, [
      { at: 9.4, w: 10, h: 10, y: 13, kind: "round", glass: rose, frame: dark, tracery: false },
      { at: 3.2, w: 2.0, h: 8, y: 2, kind: "pointed", glass: lancet, frame: dark },
      { at: 15.6, w: 2.0, h: 8, y: 2, kind: "pointed", glass: lancet, frame: dark },
    ]);
    wall(this, st, [-9.4, -54.4], [-9.4, -40], 0, 16, 0.8, [{ at: 7, w: 2.2, h: 8, y: 3, kind: "pointed", glass: lancet, frame: dark }]);
    wall(this, st, [9.4, -54.4], [9.4, -40], 0, 16, 0.8, [{ at: 7, w: 2.2, h: 8, y: 3, kind: "pointed", glass: lancet, frame: dark }]);
    this.box(st, [-10.7, 6, -40], [3, 12, 0.8]);
    this.box(st, [10.7, 6, -40], [3, 12, 0.8]);
    this.box(st, [0, 23, -40], [12, 4, 0.8], { collide: false });
    vault(this, st, -9, -54, 9, -40, 16, 9, "z", true);
    vaultRibs(this, dark, -9, -54, 9, -40, 16, 9, "z", 4.6, true);
    // Rosenfenster-Schatten (für die Vision)
    const [c, ctx] = canvas(256, 256);
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.beginPath();
    ctx.ellipse(128, 70, 26, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(40, 256);
    ctx.quadraticCurveTo(60, 110, 128, 104);
    ctx.quadraticCurveTo(196, 110, 216, 256);
    ctx.fill();
    for (let i = 0; i < 9; i++) {
      const a = Math.PI + (i / 8) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(128 + Math.cos(a) * 28, 66 + Math.sin(a) * 34);
      ctx.lineTo(128 + Math.cos(a) * 70, 66 + Math.sin(a) * 80);
      ctx.lineTo(128 + Math.cos(a + 0.12) * 30, 66 + Math.sin(a + 0.12) * 36);
      ctx.fill();
    }
    this.roseShadow = new THREE.Mesh(planeGeo(10, 10), new THREE.MeshBasicMaterial({ map: canvasTex(c), transparent: true, opacity: 0, depthWrite: false }));
    const ru = this.roseShadow.geometry.getAttribute("uv") as THREE.BufferAttribute;
    for (let i = 0; i < ru.count; i++) ru.setXY(i, ru.getX(i) / 10, ru.getY(i) / 10);
    this.roseShadow.position.set(0, 18, -53.95);
    this.roseShadow.renderOrder = 4;
    this.add(this.roseShadow);
    this.light({ pos: [0, 16, -50], color: new THREE.Color(1, 0.12, 0.1), intensity: 7, distance: 20, flicker: 0.05 });
    // Altar, Chorgestühl
    P.altar(this, [0, 0.4, -42.6], 0, materials.surface("marbleBlack"));
    P.pillarCandles(this, [-1.4, 1.48, -42.6], 700);
    P.pillarCandles(this, [1.4, 1.48, -42.6], 701);
    P.candelabrum(this, [-4, 0.4, -50], 0, 5, true, 2.2, 4, true);
    P.candelabrum(this, [4, 0.4, -50], 0, 5, true, 2.2, 4, false);
    for (const sx of [-1, 1]) {
      for (let z = -33; z >= -39; z -= 1.2) {
        this.box(materials.surface("woodDark"), [sx * 5.4, 0.5, z], [1.0, 1.0, 1.0], { collide: true });
        this.box(materials.surface("woodDark"), [sx * 5.9, 1.6, z], [0.12, 2.2, 1.1], { collide: false });
      }
    }
    const prayer = new THREE.Mesh(planeGeo(1.0, 0.6), materials.inscription(["ICH VERGESSE FÜR DICH · ICH VERGESSE FÜR DICH", "ICH VERGESSE FÜR DICH · ICH VERGESSE"], { w: 512, h: 128, color: "rgba(30,10,10,0.8)" }));
    prayer.position.set(-5.83, 1.6, -37.2);
    prayer.rotation.y = Math.PI / 2;
    this.add(prayer);
    // Malachias im Gestühl
    const m = new Character(PRESETS.malachias);
    m.root.position.set(-5.2, 0, -37.2);
    m.root.rotation.y = Math.PI / 2;
    m.setPose("sit", true);
    m.breathe = 0.1;
    m.turnToTarget = false;
    m.eyeGlow = 0.3;
    this.scene.add(m.root);
    this.onUpdate((dt, t) => m.update(dt, t));
    this.malachias = m;
    if (!G.state.is("malachiasDown")) {
      this.interact({ id: "malachias", pos: v([-5.0, 1.3, -37.2]), radius: 2.8, prompt: "Den sitzenden Prior ansprechen", onInteract: () => this.talkMalachias() });
    } else m.setPose("slump", true);
    this.interact({ id: "prayerWood", pos: v([-5.8, 1.6, -36.0]), radius: 2.2, prompt: "Die Schnitzereien lesen", onInteract: () => G.story.readDocument("malachias_gebet") });
    // Akolythen
    for (const [x, z] of [[3.6, -43], [-3.6, -43]] as [number, number][]) {
      if (G.state.is("malachiasDown")) break;
      const a = new Character(PRESETS.cultist);
      a.root.position.set(x, 0.4, z);
      a.root.rotation.y = x > 0 ? -Math.PI / 2 : Math.PI / 2;
      a.setPose("pray", true);
      this.scene.add(a.root);
      this.onUpdate((dt, t) => a.update(dt, t));
      this.acolytes.push(a);
    }
    G.horror.register({
      id: "ch4_malachiasHead", area: box3([-9, -1, -40], [9, 10, -28]), major: true,
      run: async () => {
        m.faceTarget = G.camera.position;
        G.audio.sfx("whisper", m.headWorld(), 1.2);
        await G.game.wait(3);
        m.faceTarget = null;
      },
    });
    // Siegel im Boden der Apsis
    this.sealSlab = new THREE.Mesh(boxGeo(3.2, 0.3, 6.6), materials.surface("marbleBlack"));
    this.sealSlab.position.set(0, -0.15, -47.3);
    this.add(this.sealSlab);
    this.sealSlab.add(new THREE.Mesh(planeGeo(0.01, 0.01)));
    const sealDecal = this.decal(materials.hidden("seal", 720, "", "rgba(220,30,40,0.95)"), [0, 0.02, -48.6], 3.0, 3.0);
    const sealWriting = this.decal(materials.blood("writing", 721, "ZWEI\nBLUTE"), [0, 0.015, -48.6], 1.8, 1.8, Math.PI);
    this.sealSlab.userData.decals = [sealDecal, sealWriting];
    this.sealBlocker = this.col.addBlocker("seal", box3([-1.6, -1, -50.6], [1.6, 0.02, -44]), true);
    // Abwärtstreppe unter dem Siegel (Abstieg nach Süden)
    const cs = materials.surface("cryptStone");
    this.box(cs, [-1.85, -3, -47.3], [0.5, 6.0, 6.6]);
    this.box(cs, [1.85, -3, -47.3], [0.5, 6.0, 6.6]);
    stairs(this, materials.surface("cryptFloor"), 0, -44.0, -6, "-z", 3.2, 20, 0.3, 0.33);
    this.floor(materials.surface("cryptFloor"), -2, -44, 2, -40.8, -6);
    this.box(cs, [-1.85, -3.3, -42.4], [0.5, 5.4, 3.2]);
    this.box(cs, [1.85, -3.3, -42.4], [0.5, 5.4, 3.2]);
    this.box(cs, [0, -3.3, -40.6], [4.2, 5.4, 0.4]);
    if (G.state.is("ebonSealOpen")) this.openSealImmediate();
    this.interact({ id: "seal", pos: v([0, 0.4, -48.6]), radius: 3, prompt: () => (G.state.is("ebonSealOpen") ? "" : "Das Siegel untersuchen"), enabled: () => !G.state.is("ebonSealOpen"), onInteract: () => this.trySeal() });
    this.trigger("down", [-2, -7, -44], [2, -4, -40.8], () => this.leave(), { once: false });
  }

  // ===========================================================================
  private buildSacristy(): void {
    const st = materials.surface("cathedralStone");
    this.floor(materials.surface("cryptFloor"), 12, 6, 20, 16, 0);
    wall(this, st, [12, 5.6], [20.4, 5.6], 0, 5, 0.8);
    wall(this, st, [12, 16.4], [20.4, 16.4], 0, 5, 0.8);
    wall(this, st, [20.4, 5.6], [20.4, 16.4], 0, 5, 0.8);
    this.ceiling(materials.surface("woodDark"), 12, 5.6, 20.4, 16.4, 5, 0.3);
    this.box(materials.dark(), [17.5, 0.02, 14.2], [1.4, 0.02, 1.4], { collide: false });
    this.box(materials.surface("ironRusty"), [18.3, 0.5, 14.2], [0.1, 1.0, 1.4], { collide: false });
    P.wardrobe(this, [19.6, 0, 9], -Math.PI / 2);
    P.table(this, [15, 0, 7.4], 2, 0.8, 0.85, 0, materials.surface("woodDark"));
    P.candleCluster(this, [15.2, 0.85, 7.3], 3, 0.2, 800, 2.4, 8, true);
    P.goblet(this, [14.6, 0.85, 7.4]);
    P.bottle(this, [15.8, 0.85, 7.6]);
    this.door({ id: "sacristy", pos: [12.4, 0, 11], rotY: Math.PI / 2, width: 1.7, height: 2.9, kind: "dark", hinge: "left", swing: 1.6 });
    this.trigger("tunnel", [14, -1, 10], [20, 4, 16], () => G.story.say("ch4.tunnel"));
  }

  // ===========================================================================
  private buildChapels(): void {
    const st = materials.surface("cathedralStone");
    const dark = materials.surface("castleStoneDark");
    const defs: { id: string; z: number }[] = [{ id: "rit1", z: -0 }, { id: "rit2", z: -12 }, { id: "rit3", z: -24 }];
    for (const d of defs) {
      const z0 = d.z - 2, z1 = d.z + 2;
      this.floor(materials.surface("cryptFloor"), 12.4, z0, 17, z1, 0);
      wall(this, st, [12.4, z0 - 0.3], [17.3, z0 - 0.3], 0, 5, 0.6);
      wall(this, st, [12.4, z1 + 0.3], [17.3, z1 + 0.3], 0, 5, 0.6);
      wall(this, st, [17.3, z0 - 0.3], [17.3, z1 + 0.3], 0, 5, 0.6);
      vault(this, st, 12.4, z0, 17, z1, 5, 1.6, "x", true);
    }
    // Öffnungen in der Ostwand für die Kapellen: Wandabschnitt ersetzen
    // (die Außenwand wurde mit Öffnungen bei at=24, 36, 48 gebaut)
    // Kapelle der Gabe
    this.box(dark, [16.2, 0.55, 0], [1.2, 1.1, 1.8]);
    this.decal(materials.blood("pool", 900), [16.2, 1.12, 0], 1.0, 1.5);
    P.chains(this, [16.8, 4.2, -0.6], 3.0, 2);
    this.decal(materials.hidden("smear", 901), [14, 0.02, 0], 3.2, 0.8, Math.PI / 2);
    this.inscribe([17.0, 2.6, 0], -Math.PI / 2, "WER GIBT, WIRD ERINNERT");
    P.candleCluster(this, [13.2, 0, 1.5], 4, 0.3, 902, 1.8, 7);
    this.interact({ id: "rit1", pos: v([16.0, 1.3, 0]), radius: 2.6, prompt: "Das Blutbecken untersuchen", onInteract: async () => {
      await G.story.say("ch4.rit1");
      await G.story.say("ch4.rit1b");
      this.ritualDone("rit1");
    } });
    // Kapelle des Vergessens – Spiegel
    const mirror = new THREE.Mesh(planeGeo(1.4, 2.4), materials.basic("mirror", () => new THREE.MeshStandardMaterial({ color: 0x0a0a0e, roughness: 0.05, metalness: 1 })));
    mirror.position.set(17.0, 1.6, -12);
    mirror.rotation.y = -Math.PI / 2;
    this.add(mirror);
    for (const [dy, dz, w, hh] of [[1.25, 0, 1.6, 0.1], [-1.25, 0, 1.6, 0.1], [0, 0.75, 0.1, 2.6], [0, -0.75, 0.1, 2.6]] as [number, number, number, number][]) {
      this.box(materials.surface("gold"), [16.98, 1.6 + dy, -12 + dz], [0.08, hh, w], { collide: false });
    }
    this.box(dark, [15.8, 0.5, -12], [0.8, 1.0, 0.8]);
    this.decal(materials.basic("ash2", () => new THREE.MeshStandardMaterial({ color: 0x2a2622, roughness: 1 })), [15.8, 1.02, -12], 0.6, 0.6);
    this.inscribe([17.0, 3.2, -13.4], -Math.PI / 2, "WAS DU VERGISST, GEHÖRT IHM");
    P.candleCluster(this, [13.2, 0, -10.6], 3, 0.3, 903, 1.6, 7);
    this.interact({ id: "rit2", pos: v([16.6, 1.6, -12]), radius: 2.8, prompt: "In den Spiegel sehen", onInteract: () => this.mirrorEvent() });
    // Kapelle des Gefäßes – der Stuhl
    const chairPos: V3 = [16.2, 0, -24];
    this.box(materials.surface("woodDark"), [chairPos[0], 0.35, chairPos[2]], [0.6, 0.7, 0.6]);
    this.box(materials.surface("woodDark"), [chairPos[0] + 0.28, 1.0, chairPos[2]], [0.08, 1.3, 0.6], { collide: false });
    for (const y of [0.55, 0.95]) this.box(materials.surface("leather"), [chairPos[0], y, chairPos[2]], [0.62, 0.05, 0.64], { collide: false });
    this.decal(materials.hidden("hand", 904), [chairPos[0] + 0.33, 1.1, chairPos[2]], 0.3, 0.3, 0, "-x");
    this.inscribe([17.0, 2.8, -25.4], -Math.PI / 2, "DAS GEFÄSS MUSS VOM ÄLTESTEN BLUT SEIN");
    P.candleCluster(this, [13.2, 0, -22.4], 3, 0.3, 905, 1.6, 7);
    this.interact({ id: "rit3", pos: v([16.0, 0.9, -24]), radius: 2.6, prompt: "Den Stuhl betrachten", onInteract: async () => {
      await G.story.say("ch4.rit3");
      await G.story.say("ch4.rit3b");
      G.story.learn("sami", 2);
      this.ritualDone("rit3");
    } });
  }

  private inscribe(pos: V3, rotY: number, text: string): void {
    const m = new THREE.Mesh(planeGeo(2.6, 0.4), materials.inscription([text], { w: 1024, h: 128, color: "rgba(20,10,10,0.85)" }));
    const uv = m.geometry.getAttribute("uv") as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 2.6, uv.getY(i) / 0.4);
    m.position.set(...pos);
    m.rotation.y = rotY;
    this.add(m);
  }

  private async mirrorEvent(): Promise<void> {
    await G.story.say("ch4.rit2");
    if (!this.st.mirror) {
      this.st.mirror = true;
      // Gestalt hinter dem Spiegel (eine Kammer hinter dem Glas)
      const ghost = new Character(PRESETS.ysolde, { ghost: true });
      ghost.root.position.set(18.6, 0, -11.6);
      ghost.root.rotation.y = -Math.PI / 2;
      ghost.setPose("stand", true);
      this.scene.add(ghost.root);
      const upd = (dt: number, t: number) => ghost.update(dt, t);
      this.onUpdate(upd);
      const mm = materials.basic("mirror", () => new THREE.MeshStandardMaterial()) as THREE.MeshStandardMaterial;
      mm.transparent = true;
      mm.opacity = 0.55;
      G.audio.sfx("whisperName", v([17, 1.6, -12]), 1);
      await G.story.say("ch4.rit2b");
      await G.story.say("ch4.mirrorShape");
      await H.flicker(v([15, 2, -12]), 6, 0.6, 0.3);
      ghost.dispose();
      this.updaters = this.updaters.filter((u) => u !== upd);
      mm.opacity = 1;
      mm.transparent = false;
      H.soundBehind("breath");
    }
    await G.story.say("ch4.rit2c");
    this.ritualDone("rit2");
  }

  private ritualDone(id: string): void {
    this.st[id] = true;
    const n = ["rit1", "rit2", "rit3"].filter((r) => this.st[r]).length;
    G.ui.notify(`Blutritual ${n}/3 untersucht`, "quest");
    if (n === 3 && !G.quests.taskDone("q_dynastie", "rituale")) {
      G.quests.task("q_dynastie", "rituale");
      G.story.say("ch4.ritsDone");
    }
    if (n >= 2) this.spawnMine();
  }

  private spawnMine(): void {
    if (this.mine || G.quests.taskDone("q_dynastie", "mine")) {
      if (!this.mine && G.quests.taskDone("q_dynastie", "mine")) this.placeMine([0, 0.4, -43.2], Math.PI);
      return;
    }
    this.placeMine([0, 0.4, -42.6], Math.PI);
    G.story.say("ch4.mineAppears");
    this.interact({ id: "mine", pos: v([0, 2.0, -42.6]), radius: 3.2, prompt: "Mit Mine sprechen", enabled: () => !G.quests.taskDone("q_dynastie", "mine"), onInteract: async () => {
      await G.dialogue.start("ch4_mine", this.mine);
      G.save.checkpoint();
    } });
  }

  private placeMine(pos: V3, yaw: number): Character {
    if (!this.mine) {
      const m = new Character(PRESETS.mine);
      this.scene.add(m.root);
      this.onUpdate((dt, t) => m.update(dt, t));
      this.col.circles.push({ pos: m.root.position, radius: 0.35, height: 1.7, enabled: true });
      this.mine = m;
    }
    this.mine.root.position.set(...pos);
    this.mine.root.rotation.y = yaw;
    this.mine.setPose("handsClasped", true);
    return this.mine;
  }

  // ===========================================================================
  private buildLineageWindows(): void {
    const st = materials.surface("cathedralStone");
    const dark = materials.surface("castleStoneDark");
    const defs: { id: string; name: string; sym: string; z: number; theme: "saint" | "wolf" | "rose" | "moon" | "lineage"; accent: string }[] = [
      { id: "morwen", name: "Morwen", sym: "rose", z: 18, theme: "rose", accent: "#8a1a50" },
      { id: "ebon", name: "Ebon", sym: "auge", z: 8, theme: "saint", accent: "#2a2a6a" },
      { id: "drakenfels", name: "Drakenfels", sym: "rabe", z: -2, theme: "moon", accent: "#a01020" },
      { id: "valcourt", name: "Valcourt", sym: "schlange", z: -12, theme: "lineage", accent: "#1a5a3a" },
    ];
    const ops = defs.map((d) => ({ at: 24 - d.z, w: 2.4, h: 6, y: 2.2, kind: "pointed" as const, glass: materials.stainedGlass(330 + d.z, d.theme, d.accent, 1.6), frame: dark }));
    ops.push({ at: 24 + 30, w: 2.0, h: 3.0, y: 0, kind: "pointed", glass: undefined as any, frame: dark });
    wall(this, st, [-12.4, 24], [-12.4, -40], 0, 9.5, 0.8, ops);
    for (const d of defs) {
      const plate = new THREE.Mesh(planeGeo(0.6, 0.6), materials.symbol(d.sym, "#d0b070", "#1a1414"));
      plate.position.set(-11.95, 1.9, d.z);
      plate.rotation.y = Math.PI / 2;
      this.add(plate);
      const base: V3 = [-10.9, 0, d.z];
      const lights: LightSource[] = [];
      const flames: number[] = [];
      // Kandelaber (erloschen) – eigene Flammen, damit sie einzeln zünden
      const shaft = new THREE.CylinderGeometry(0.04, 0.05, 1.5, 8);
      this.geo(shaft, materials.surface("iron"), [base[0], 0.75, base[2]]);
      shaft.dispose();
      for (let i = 0; i < 3; i++) {
        const p: V3 = [base[0], 1.5, base[2] - 0.3 + i * 0.3];
        P.candle(this, p, 0.14, false, 0.025);
        const f = this.flame([p[0], p[1] + 0.145, p[2]], 0.08);
        this.flames.setVisible(f, this.st["lit_" + d.id] ? 1 : 0);
        flames.push(f);
      }
      const l = this.light({ pos: [base[0], 2.0, base[2]], intensity: 3, distance: 8, flicker: 0.5 });
      l.enabled = !!this.st["lit_" + d.id];
      lights.push(l);
      this.windows.push({ id: d.id, name: d.name, sym: d.sym, z: d.z, lights, flames });
      this.interact({ id: "win_" + d.id, pos: v([-10.9, 1.6, d.z]), radius: 2.6, prompt: () => `Lichter des Hauses ${d.name} entzünden`, enabled: () => !G.quests.taskDone("q_dynastie", "bibliothek") && !this.lit.includes(d.id), onInteract: () => this.lightWindow(d.id) });
      this.trigger("winSee_" + d.id, [-12, -1, d.z - 2], [-8, 6, d.z + 2], () => G.story.say("ch4.window" + d.name[0].toUpperCase() + d.name.slice(1)));
    }
    // Fresko des Stammbaums
    const fresco = new THREE.Mesh(planeGeo(3.2, 4), (() => {
      const [c, ctx] = canvas(256, 320);
      ctx.fillStyle = "#3a2a1c";
      ctx.fillRect(0, 0, 256, 320);
      ctx.strokeStyle = "#a88848";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(128, 300);
      ctx.lineTo(128, 60);
      ctx.moveTo(128, 230);
      ctx.lineTo(60, 170);
      ctx.moveTo(128, 170);
      ctx.lineTo(196, 110);
      ctx.moveTo(128, 120);
      ctx.lineTo(70, 60);
      ctx.stroke();
      ctx.font = "bold 20px serif";
      ctx.fillStyle = "#d8c090";
      ctx.textAlign = "center";
      ctx.fillText("EBON", 128, 316);
      ctx.fillText("VALCOURT", 60, 160);
      ctx.fillText("MORWEN", 196, 100);
      ctx.fillText("DRAKENFELS", 70, 50);
      return new THREE.MeshStandardMaterial({ map: canvasTex(c), roughness: 0.8 });
    })());
    const fu = fresco.geometry.getAttribute("uv") as THREE.BufferAttribute;
    for (let i = 0; i < fu.count; i++) fu.setXY(i, fu.getX(i) / 3.2, fu.getY(i) / 4);
    fresco.position.set(-11.95, 4.2, -22);
    fresco.rotation.y = Math.PI / 2;
    this.add(fresco);
    this.interact({ id: "fresco", pos: v([-11.8, 3, -22]), radius: 4, prompt: "Den Stammbaum betrachten", onInteract: () => {
      G.story.readDocument("stammbaum");
      G.quests.task("q_dynastie", "dynastie");
      if (!this.st.fresco) {
        this.st.fresco = true;
        G.story.say("ch4.fresco");
      }
    } });
    P.candleCluster(this, [-10.8, 0, -22], 5, 0.4, 950, 2.4, 9, true);
  }

  private lightWindow(id: string): void {
    const order = ["ebon", "valcourt", "morwen", "drakenfels"];
    const w = this.windows.find((x) => x.id === id)!;
    this.lit.push(id);
    w.lights.forEach((l) => (l.enabled = true));
    w.flames.forEach((f) => this.flames.setVisible(f, 1));
    G.audio.sfx("crackle", v([-10.9, 1.7, w.z]), 1.4);
    const ok = this.lit.every((x, i) => x === order[i]);
    if (!ok) {
      setTimeout(() => {
        G.audio.sfx("wrong", v([-10.9, 1.7, w.z]));
        for (const x of this.windows) {
          x.lights.forEach((l) => (l.enabled = false));
          x.flames.forEach((f) => this.flames.setVisible(f, 0));
        }
        this.lit = [];
        G.story.say("ch4.wrongOrder");
        if (!this.st.fresco) G.ui.notify("Vielleicht verrät der Stammbaum im Seitenschiff die Ordnung des Blutes.", "info");
      }, 900);
      return;
    }
    if (this.lit.length === 4) this.openLibrary();
  }

  // ===========================================================================
  private buildLibrary(): void {
    const st = materials.surface("cathedralStone");
    const wood = materials.surface("woodDark");
    this.floor(materials.surface("woodFloor"), -24, -36, -12, -24, 0);
    wall(this, st, [-24.4, -36.4], [-12.4, -36.4], 0, 8, 0.8);
    wall(this, st, [-24.4, -23.6], [-12.4, -23.6], 0, 8, 0.8);
    wall(this, st, [-24.4, -36.4], [-24.4, -23.6], 0, 8, 0.8);
    this.ceiling(wood, -24.4, -36.4, -12.4, -23.6, 8, 0.4);
    for (let x = -23; x < -12; x += 2) this.box(wood, [x, 7.7, -30], [0.3, 0.5, 12.8], { collide: false });
    // Geheimtür (Wandsegment in der Seitenschiffwand bei z=-30)
    this.libDoor = new THREE.Mesh(boxGeo(0.8, 3.0, 2.0), st);
    this.libDoor.position.set(-12.4, 1.5, -30);
    this.add(this.libDoor);
    this.libBlocker = this.col.addBlocker("library", box3([-12.9, 0, -31.1], [-11.9, 3, -28.9]), true);
    if (G.quests.taskDone("q_dynastie", "bibliothek")) {
      this.libDoor.position.y = -1.6;
      this.libBlocker.enabled = false;
      this.lit = ["ebon", "valcourt", "morwen", "drakenfels"];
    }
    for (let i = 0; i < 5; i++) {
      P.bookshelf(this, [-23.6, 0, -34.6 + i * 2.4], Math.PI / 2, 2.2, 3.6, 960 + i, i % 2 === 1);
      P.bookshelf(this, [-14 - i * 2.0, 0, -36], 0, 1.9, 3.6, 970 + i);
    }
    P.table(this, [-18.5, 0, -29], 3, 1.2, 0.8, 0, wood);
    P.candleCluster(this, [-18.0, 0.8, -29.2], 5, 0.3, 980, 3, 9, true);
    P.chandelier(this, [-18, 6.5, -30], 1.2, true, false, 3);
    const diary = P.lectern(this, [-21.5, 0, -26], Math.PI * 0.85);
    this.interact({ id: "diary", pos: diary, radius: 2.4, prompt: "Ysoldes Tagebuch lesen", onInteract: async () => {
      if (!G.state.hasItem("ysolde_tagebuch")) G.inventory.add("ysolde_tagebuch");
      await G.story.say("ch4.diary");
      G.story.readDocument("ysolde_tagebuch");
      if (!G.quests.taskDone("q_dynastie", "aufzeichnungen")) {
        G.quests.task("q_dynastie", "aufzeichnungen");
        setTimeout(() => G.story.say("ch4.diaryAfter"), 500);
        G.story.learn("sami", 2);
        G.story.learn("ysolde", 2);
        G.save.checkpoint();
      }
    } });
    // Pakt von Ebon (gerahmt)
    P.portrait(this, [-19, 2.6, -23.95], Math.PI, 1.4, 1.0, materials.inscription(["DER PAKT VON EBON", "EBON · VALCOURT · MORWEN · DRAKENFELS"], { w: 512, h: 384, bg: "#c8b088", color: "rgba(60,20,10,0.9)" }));
    this.interact({ id: "pakt", pos: v([-19, 2.4, -24.2]), radius: 3, prompt: "Die Urkunde lesen", onInteract: () => {
      if (!G.state.hasItem("pakt_ebon")) G.inventory.add("pakt_ebon");
      G.story.readDocument("pakt_ebon");
    } });
    // Gebetbuch mit Brief III
    if (!G.state.hasItem("ysolde_brief3")) {
      const book = new THREE.Mesh(boxGeo(0.3, 0.06, 0.22), materials.surface("velvet"));
      book.position.set(-17.4, 0.83, -28.8);
      book.rotation.y = 0.3;
      this.add(book);
      this.interact({ id: "brief3", pos: v([-17.4, 0.95, -28.8]), radius: 2.2, prompt: "Gebetbuch öffnen", angle: 0.6, enabled: () => !G.state.hasItem("ysolde_brief3"), onInteract: () => {
        book.visible = false;
        G.inventory.add("ysolde_brief3");
        G.quests.start("q_briefe", false);
        G.quests.task("q_briefe", "b3");
        G.story.readDocument("ysolde_brief3");
      } });
    }
    this.memorySpot("mem_dorn", "m_bibliothek", [-15.2, 0.005, -32.6], () => this.memDorn(), 1.2);
  }

  private async openLibrary(): Promise<void> {
    if (G.quests.taskDone("q_dynastie", "bibliothek")) return;
    G.quests.task("q_dynastie", "dynastie", true);
    G.quests.task("q_dynastie", "bibliothek");
    G.audio.sfx("solved");
    await G.game.wait(0.8);
    G.audio.sfx("stoneGrind", v([-12.4, 1.5, -30]));
    G.player.shake(0.02, 2);
    for (let i = 0; i <= 50; i++) {
      this.libDoor.position.y = 1.5 - (i / 50) * 3.1;
      await G.game.wait(0.04);
    }
    this.libBlocker.enabled = false;
    await G.story.say("ch4.libraryOpen");
    G.save.checkpoint();
  }

  private async memDorn(): Promise<void> {
    await G.story.playMemory("m_bibliothek", [
      { ghost: "ys", preset: PRESETS.ysolde, pos: [-16.4, 0, -31.8], yaw: Math.PI / 2, pose: "reach" },
      { ghost: "mi", preset: PRESETS.mine, pos: [-14.6, 0, -31.8], yaw: -Math.PI / 2, pose: "stand" },
      { look: [-15.5, 1.4, -31.8] },
      { say: "mem.dorn.1" },
      { say: "mem.dorn.2" },
      { say: "mem.dorn.3" },
      { say: "mem.dorn.4" },
      { say: "mem.dorn.5" },
      { wait: 1 },
    ]);
    G.story.learn("mine", 3);
  }

  // ===========================================================================
  private async talkMalachias(): Promise<void> {
    if (!this.malachias || G.state.is("malachiasDown")) return;
    await G.dialogue.start("ch4_malachias", this.malachias);
    if (G.state.is("malachiasFight") && !this.acolyteEnemies.length) this.startAcolyteFight();
  }

  private startAcolyteFight(): void {
    G.story.say("ch4.fightAcolytes");
    for (const a of this.acolytes) {
      const pos = a.root.position.clone();
      a.dispose();
      this.acolyteEnemies.push(G.combat.spawn({ kind: "cultist", pos, aggressive: true, leash: 25 }));
    }
    this.acolytes = [];
    const check = setInterval(() => {
      if (!G.level || G.level !== this) return clearInterval(check);
      if (this.acolyteEnemies.every((e) => !e.alive)) {
        clearInterval(check);
        this.interact({ id: "malachiasBlood", pos: v([-5.0, 1.3, -37.2]), radius: 2.6, prompt: "Vom Prior trinken", enabled: () => !G.state.is("malachiasDown"), onInteract: async () => {
          G.state.set("malachiasDown");
          G.story.decide("malachias", "fed", "Vom uralten Prior Malachias getrunken");
          await G.story.cutscene(async () => {
            G.player.lookAt(this.malachias!.headWorld(), 4);
            G.audio.sfx("feed");
            G.renderer.uniforms.uPulse.value = 1;
            await G.game.wait(1.2);
            this.malachias!.setPose("slump");
            G.abilities.addHunger(-60);
            G.player.heal(100);
            await G.story.say("ch4.malachiasBlood");
          });
        } });
        G.ui.notify("Der Prior ist schutzlos.", "info");
      }
    }, 500);
  }

  private async trySeal(): Promise<void> {
    if (!G.quests.taskDone("q_dynastie", "aufzeichnungen")) {
      await G.story.say("ch4.seal");
      await G.story.say("ch4.notYet");
      return;
    }
    if (G.state.is("malachiasDown")) {
      G.story.decide("sealBlood", "malachias", "Das Siegel mit dem Blut des Priors geöffnet");
      return this.openSeal();
    }
    if (G.state.is("mineGaveBlood")) return this.openSeal();
    await G.story.say("ch4.sealNeed");
    if (G.quests.taskDone("q_dynastie", "mine")) {
      const m = this.placeMine([3.2, 0, -48.6], -Math.PI / 2);
      await G.dialogue.start("ch4_mine_seal", m);
      if (G.state.is("mineGaveBlood")) {
        G.audio.sfx("feed", m.headWorld(), 0.5);
        await this.openSeal();
      } else {
        G.ui.notify("Prior Malachias sitzt im Chorgestühl.", "info");
      }
    } else {
      G.ui.notify("Du brauchst eine zweite, ältere Blutlinie.", "info");
    }
  }

  private openSealImmediate(): void {
    this.sealSlab.position.y = -1;
    this.sealSlab.visible = false;
    (this.sealSlab.userData.decals as THREE.Mesh[]).forEach((d) => (d.visible = false));
    this.sealBlocker.enabled = false;
  }

  private async openSeal(): Promise<void> {
    if (G.state.is("ebonSealOpen")) return;
    G.state.set("ebonSealOpen");
    G.player.damage(6);
    await G.story.cutscene(async () => {
      G.player.lookAt(v([0, 0.4, -48.6]), 3);
      G.audio.sfx("stoneGrind", v([0, 0.4, -48.6]));
      await G.story.say("ch4.sealOpen");
      (this.sealSlab.userData.decals as THREE.Mesh[]).forEach((d) => (d.visible = false));
      for (let i = 0; i <= 40; i++) {
        this.sealSlab.position.y = -0.15 - (i / 40) * 1.4;
        this.sealSlab.position.x = (i / 40) * 0.6;
        await G.game.wait(0.04);
      }
      this.sealBlocker.enabled = false;
      this.sealSlab.visible = false;
      G.quests.task("q_dynastie", "zugang");
      // Vision am Rosenfenster
      G.player.lookAt(v([0, 18, -54]), 1.5);
      G.audio.sfx("rumble");
      G.levels.playMusic("theFirst");
      await G.game.wait(1.5);
      await G.story.say("ch4.rose");
      const m = this.roseShadow.material as THREE.MeshBasicMaterial;
      for (let i = 0; i <= 40; i++) {
        m.opacity = (i / 40) * 0.92;
        this.roseShadow.position.y = 17 + (i / 40) * 1.5;
        await G.game.wait(0.05);
      }
      G.player.shake(0.03, 2);
      await G.story.say("ch4.erste1");
      await G.story.say("ch4.erste2");
      for (let i = 40; i >= 0; i--) {
        m.opacity = (i / 40) * 0.92;
        await G.game.wait(0.03);
      }
      G.story.learn("erste", 2);
      await G.story.say("ch4.afterVision");
    });
    G.save.checkpoint();
  }

  private async leave(): Promise<void> {
    if (G.story.busy || !G.state.is("ebonSealOpen")) return;
    G.quests.complete("q_dynastie");
    G.save.checkpoint();
    if (G.levels.has("ch5_drakenfels")) {
      await G.story.goTo("ch5_drakenfels", "start", { chapter: 5, title: "Die Rückkehr der Blutlinie", sub: "Du kehrst zurück, wo du erwacht bist. Diesmal weißt du, wonach du suchst." });
    } else {
      await G.story.fade(1, 2);
      await G.ui.chapterCard(4, "Ende des vierten Kapitels", "Fortsetzung folgt.");
      G.game.toMainMenu();
    }
  }

  start(_spawn: string, fresh: boolean): void {
    G.quests.start("q_dynastie");
    G.renderer.uniforms.uFade.value = 0;
    if (fresh) G.save.checkpoint();
    if (["rit1", "rit2", "rit3"].filter((r) => this.st[r]).length >= 2) this.spawnMine();
    if (G.state.is("malachiasFight") && !G.state.is("malachiasDown")) this.startAcolyteFight();
    G.audio.addEmitter(v([0, 1, -47.6]), "whisper", 14);
  }
}
