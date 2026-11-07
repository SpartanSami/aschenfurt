import * as THREE from "three";
import { Level, Door } from "../Level";
import { materials, SurfaceName } from "../../graphics/Materials";
import { wall, vault, vaultRibs, column, stairs, battlements, tower, fireplace, moonShaft, archFrame } from "../builders/Architecture";
import * as P from "../builders/Props";
import { terrain, deadTree, rock, grassField, bush } from "../builders/Nature";
import { boxGeo, planeGeo, pointedArchPoints } from "../builders/Geo";
import { CameraParticles, FogBanks, Flock } from "../../graphics/Effects";
import { G } from "../../core/Context";
import { Character } from "../../characters/Character";
import { PRESETS } from "../../characters/Presets";
import * as H from "../../horror/HorrorEvents";
import { makeInscriptionTexture } from "../../graphics/Textures";
import { fbm } from "../../graphics/Noise";
import type { Enemy } from "../../gameplay/CombatSystem";

type V3 = [number, number, number];
const v = (p: V3) => new THREE.Vector3(...p);
const box3 = (a: V3, b: V3) => new THREE.Box3(v(a), v(b));

/** Kapitel 1 – Das Erwachen: Burg Drakenfels. */
export class Ch1Drakenfels extends Level {
  readonly id = "ch1_drakenfels";
  readonly chapter = 1;
  readonly title = "Das Erwachen";
  readonly location = "Burg Drakenfels";
  override music = "crypt";

  private passageSlab!: THREE.Mesh;
  private passageBlocker!: ReturnType<Level["col"]["addBlocker"]>;
  private portcullis!: THREE.Group;
  private portBlocker!: ReturnType<Level["col"]["addBlocker"]>;
  private portState: "down" | "rising" | "up" | "falling" = "down";
  private portT = 0;
  private statue!: THREE.Group;
  private statueSeen = false;
  private statueTurned = false;
  private cloth!: THREE.Mesh;
  private ruprecht: Character | null = null;
  private chest!: THREE.Group;
  private horseMesh: THREE.Object3D | null = null;
  private horseOnChest: THREE.Object3D | null = null;
  private galleryDoor!: Door;
  private hollow: Enemy | null = null;
  private mineFigure: Character | null = null;
  private terrainH = (x: number, z: number) => 8 + (fbm((((x + 500) / 80) % 1 + 1) % 1, (((z + 500) / 80) % 1 + 1) % 1, 3, 3, 9) - 0.5) * 0.6;

  override requiredSurfaces(): SurfaceName[] {
    return ["cryptStone", "cryptFloor", "castleStone", "castleStoneDark", "castleFloor", "woodDark", "woodOld", "woodFloor", "iron", "ironRusty", "bone", "velvet", "gold", "silver", "clothLinen", "plaster", "grass", "forest", "bark", "rock", "roofSlate", "marbleBlack", "leather", "clothDark"];
  }

  async build(): Promise<void> {
    this.env = {
      ...this.env, fogColor: 0x0a0a10, fogDensity: 0.05, ambientColor: 0x5a5060, ambientIntensity: 0.5,
      hemiSky: 0x605878, hemiGround: 0x140c0c, hemiIntensity: 0.35, reverb: "crypt", ambience: "crypt", surface: "stone", exposure: 1.25,
    };
    const moonDir = new THREE.Vector3(0.3, 0.72, 0.62).normalize();
    this.setupSky({ moonDir, redness: 0.9, cloudiness: 0.5, moonSize: 0.05 });
    this.buildCrypt();
    this.buildOssuary();
    this.buildStairwell();
    this.buildGallery();
    this.buildStudy();
    this.buildNursery();
    this.buildThroneHall();
    this.buildGatehouse();
    this.buildCourtyard();
    this.setupMoonLight(0, 0xb04048, moonDir, { center: new THREE.Vector3(-10, 10, 10), size: 90 });
    this.addParticles(new CameraParticles("dust", 380, 0xb8a890, 0.022, 12));
    this.setupZones();
    this.spawn("start", [1.35, 0.05, 2.4], Math.PI / 2);
    this.spawn("ossuary", [6.6, 0.05, -6.5], -Math.PI / 2);
    this.spawn("gallery", [28.6, 8.05, -14], Math.PI / 2);
    this.spawn("hall", [2.4, 8.05, -14], Math.PI / 2);
    this.spawn("gate", [-13, 8.05, 0.5], Math.PI);
    this.spawn("courtyard", [-13, 8.1, 15], Math.PI);
  }

  private setupZones(): void {
    this.zone("crypt", [-6, -1, -11], [6, 7, 11], { reverb: "crypt", ambience: "crypt", fogDensity: 0.05, ambientIntensity: 0.5, music: "crypt" });
    this.zone("ossuary", [5, -1, -10], [30, 5, -5], { reverb: "crypt", ambience: "crypt", fogDensity: 0.08, ambientIntensity: 0.12, hemiIntensity: 0.06, fogColor: 0x050508 });
    this.zone("stair", [30, -1, -20], [40, 13, -4], { reverb: "hall", ambience: "castle", fogDensity: 0.04, ambientIntensity: 0.5, music: "castle" });
    this.zone("gallery", [4, 7, -16.5], [30, 15, -11.5], { reverb: "hall", ambience: "castle", fogDensity: 0.035, ambientIntensity: 0.55, surface: "stone" });
    this.zone("study", [5, 7, -24], [13, 13, -16], { reverb: "room", ambience: "castle", fogDensity: 0.03, ambientIntensity: 0.55, surface: "wood" }, 2);
    this.zone("nursery", [18, 7, -22], [24, 13, -16], { reverb: "room", ambience: "castle", fogDensity: 0.03, ambientIntensity: 0.5, surface: "wood" }, 2);
    this.zone("hall", [-24, 7, -26], [4, 24, -2], { reverb: "cathedral", ambience: "castle", fogDensity: 0.028, ambientIntensity: 0.6, moonIntensity: 4.5, fogColor: 0x160c12 });
    this.zone("gatehouse", [-22, 7, -2], [-10, 15, 10], { reverb: "hall", ambience: "castle", fogDensity: 0.045, ambientIntensity: 0.5, moonIntensity: 1.5 });
    this.zone("yard", [-45, 4, 10], [25, 40, 70], { reverb: "outdoor", ambience: "exterior", fogDensity: 0.022, fogColor: 0x1a0c12, ambientIntensity: 0.55, hemiIntensity: 0.7, hemiSky: 0x7a3a4a, moonIntensity: 3.2, surface: "grass", exposure: 1.2 }, 0);
  }

  // ===========================================================================
  // Krypta
  // ===========================================================================
  private buildCrypt(): void {
    const st = materials.surface("cryptStone");
    const fl = materials.surface("cryptFloor");
    const dark = materials.surface("castleStoneDark");
    this.floor(fl, -5.4, -10.4, 5.4, 10.4, 0);
    const H = 3.1, T = 0.8;
    wall(this, st, [-5.4, -10], [5.4, -10], 0, H, T);
    wall(this, st, [-5.4, 10], [5.4, 10], 0, H, T, [{ at: 5.4, w: 2.2, h: 3.0, kind: "round", frame: dark }]);
    wall(this, st, [-5, -10.4], [-5, 10.4], 0, H, T);
    wall(this, st, [5, -10.4], [5, 10.4], 0, H, T, [{ at: 3.9, w: 2.0, h: 2.7, kind: "round", frame: dark }]);
    vault(this, st, -5, -10, 5, 10, H, 3.0, "z", true);
    vaultRibs(this, dark, -5, -10, 5, 10, H, 3.0, "z", 4, true);
    // Giebelwände über dem Kämpfer schließen
    for (const z of [-10, 10]) {
      const pts = pointedArchPoints(10, 3.0, 0, 10);
      const shape = new THREE.Shape([new THREE.Vector2(-5.4, 0), new THREE.Vector2(5.4, 0), new THREE.Vector2(5.4, 3.2), new THREE.Vector2(-5.4, 3.2)]);
      shape.holes.push(new THREE.Path(pts.slice(1, -1).map((p) => new THREE.Vector2(p.x * 0.999, p.y * 0.999 + 0.0001)).reverse()));
      void shape;
      this.box(st, [0, H + 1.6, z + (z < 0 ? -0.1 : 0.1)], [10.8, 3.2, 0.6], { collide: false });
    }
    // Wandpfeiler unter den Rippen
    for (let z = -10; z <= 10; z += 5) {
      for (const x of [-4.55, 4.55]) {
        if (Math.abs(z) === 10) continue;
        this.box(dark, [x, H / 2, z], [0.5, H, 0.6]);
      }
    }
    // Grabnischen in den Seitenwänden
    const nicheZ = [-8.2, -3.6, 1.4, 6.2, 8.4];
    for (const side of [-1, 1]) {
      for (const z of nicheZ) {
        if (side === 1 && z < -2) continue; // Platz für den Geheimgang
        for (const y of [0.55, 1.75]) {
          const x = side * 4.45;
          this.box(dark, [x, y + 0.42, z], [0.25, 0.08, 1.9], { collide: false });
          this.box(dark, [x, y - 0.42, z], [0.25, 0.08, 1.9], { collide: false });
          this.box(dark, [x, y, z - 0.95], [0.25, 0.9, 0.08], { collide: false });
          this.box(dark, [x, y, z + 0.95], [0.25, 0.9, 0.08], { collide: false });
          this.box(materials.dark(), [side * 4.56, y, z], [0.02, 0.8, 1.8], { collide: false, cast: false });
          P.skull(this, [x - side * 0.05, y - 0.28, z + Math.sin(z * 3) * 0.4], side > 0 ? -Math.PI / 2 : Math.PI / 2, 0.2);
          if (y < 1) P.bones(this, [x - side * 0.05, y - 0.38, z], 3, Math.floor(z * 10 + y), 0.3);
        }
      }
    }
    // Sarkophag mit zerbrochenem Deckel
    P.sarcophagus(this, [0, 0, 1], 0, "broken");
    this.interact({
      id: "sarc", pos: v([0, 1.0, 1]), radius: 2.6, prompt: "Inschrift lesen", angle: 0.7,
      onInteract: () => {
        G.story.readDocument("sarkophag");
        if (!this.st.sarcRead) {
          this.st.sarcRead = true;
          setTimeout(() => G.story.say("ch1.wake2"), 400);
          this.unlockBloodSight(8);
        }
      },
    });
    // Blutsiegel (nur in Blutsicht)
    this.decal(materials.hidden("seal", 3), [0, 0.02, 1], 6.4, 6.4);
    // Schleifspur vom Sarkophag zum Raben
    const trail: [number, number, number][] = [[0.9, 0.02, 0.2], [1.8, 0.02, -1.2], [2.6, 0.02, -2.6], [3.4, 0.02, -3.8], [4.0, 0.02, -4.6]];
    trail.forEach((p, i) => this.decal(materials.hidden(i % 2 ? "smear" : "drops", 20 + i), p, 1.2, 0.9, -0.9 + i * 0.1));
    this.decal(materials.hidden("hand", 31), [4.56, 1.45, -4.3], 0.45, 0.45, 0, "-x");
    // Steinerner Rabe neben dem Geheimgang
    const raven = materials.symbol("rabe", "#8a7a68", "#2a2624");
    const rv = new THREE.Mesh(boxGeo(0.12, 0.6, 0.6), raven);
    rv.position.set(4.52, 1.45, -4.3);
    this.add(rv);
    this.interact({
      id: "raven", pos: v([4.5, 1.45, -4.3]), radius: 2.4, prompt: "Steinernen Raben drücken",
      bloodSightOnly: true, enabled: () => !this.st.passage,
      onInteract: () => this.openPassage(),
    });
    // Geheimgang-Platte
    this.passageSlab = new THREE.Mesh(boxGeo(0.7, 2.9, 2.2), st);
    this.passageSlab.position.set(5, 1.45, -6.1);
    this.passageSlab.castShadow = this.passageSlab.receiveShadow = true;
    this.add(this.passageSlab);
    this.passageBlocker = this.col.addBlocker("passage", box3([4.6, 0, -7.2], [5.4, 3, -5]), true);
    if (this.st.passage) {
      this.passageSlab.position.y = -1.6;
      this.passageBlocker.enabled = false;
    }
    // Gitter im Süden (Gang eingestürzt)
    const bars = new THREE.Group();
    for (let i = 0; i < 9; i++) {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.9, 6), materials.surface("ironRusty"));
      b.position.set(-1 + i * 0.25, 1.45, 10);
      bars.add(b);
    }
    for (const y of [0.4, 2.2]) {
      const b = new THREE.Mesh(boxGeo(2.2, 0.06, 0.06), materials.surface("ironRusty"));
      b.position.set(0, y, 10);
      bars.add(b);
    }
    this.add(bars);
    this.col.addBox([0, 1.5, 10], [2.4, 3, 0.3]);
    P.rubble(this, [0, 0, 11.6], 1.3, 18, 4, materials.surface("cryptStone"));
    this.box(st, [0, 1.5, 12.6], [2.6, 3, 0.4]);
    this.interact({ id: "gate", pos: v([0, 1.3, 9.8]), radius: 2.4, prompt: "Gitter untersuchen", onInteract: () => {
      G.story.say("ch1.gate");
      this.unlockBloodSight(4);
    } });
    // Kerzen
    P.candleCluster(this, [0.5, 0, -0.9], 7, 0.4, 3, 3.2, 9, true);
    P.candelabrum(this, [-3.7, 0, -2.4], 0, 3, true, 1.5, 2.4, false);
    P.candelabrum(this, [3.7, 0, 6.2], 0, 3, true, 1.5, 2.2, false);
    P.candleCluster(this, [-0.9, 0, 2.6], 4, 0.3, 5, 1.6, 5);
    // die frische Kerze
    this.box(st, [-4.4, 1.2, -9.4], [0.8, 0.12, 0.5], { collide: false });
    P.candle(this, [-4.4, 1.26, -9.4], 0.22, true, 0.03);
    this.light({ pos: [-4.3, 1.8, -9.2], intensity: 1.2, distance: 5, flicker: 0.3 });
    this.interact({ id: "candle", pos: v([-4.4, 1.45, -9.4]), radius: 2.3, prompt: "Kerze betrachten", onInteract: () => {
      G.story.say("ch1.candle");
      G.state.set("sawCandle");
    } });
    // Brief I
    if (!G.state.hasItem("ysolde_brief1")) {
      const letter = new THREE.Mesh(planeGeo(0.22, 0.3), materials.basic("paper", () => new THREE.MeshStandardMaterial({ color: 0xc8b890, roughness: 0.9, side: THREE.DoubleSide })));
      letter.rotation.set(-Math.PI / 2, 0, 0.4);
      letter.position.set(1.0, 0.03, 3.3);
      this.add(letter);
      this.interact({ id: "letter1", pos: v([1.0, 0.1, 3.3]), radius: 2.2, prompt: "Brief aufheben", angle: 0.6, enabled: () => !G.state.hasItem("ysolde_brief1"), onInteract: () => {
        G.inventory.add("ysolde_brief1");
        G.quests.start("q_briefe", false);
        G.quests.task("q_briefe", "b1");
        letter.visible = false;
        G.story.readDocument("ysolde_brief1");
      } });
    }
    // Blutphiole in einer Nische
    this.pickupVial("vial1", [-4.35, 0.42, 6.2]);
    // Erinnerungsblut
    this.decal(materials.hidden("pool", 41, "", undefined), [0, 0.025, 2.75], 1.3, 1.1);
    const memGlow = this.decal(materials.basic("memGlow", () => new THREE.MeshBasicMaterial({ color: new THREE.Color(2, 1.1, 0.4), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })), [0, 0.03, 2.75], 0.7, 0.6);
    this.onUpdate((_dt, t) => {
      (memGlow.material as THREE.MeshBasicMaterial).opacity = G.state.hasMemory("m_siegel") ? 0 : G.abilities.bloodSightLevel * (0.4 + Math.sin(t * 3) * 0.2);
    });
    this.interact({ id: "mem_siegel", pos: v([0, 0.2, 2.75]), radius: 2.3, prompt: "Bluterinnerung berühren", angle: 0.5, bloodSightOnly: true, enabled: () => !G.state.hasMemory("m_siegel"), onInteract: () => this.memSiegel() });
    // Mondlicht durch einen Luftschacht
    this.box(materials.surface("iron"), [0, 6.0, -6], [0.8, 0.05, 0.8], { collide: false });
    moonShaft(this, new THREE.Vector3(0, 6, -6), new THREE.Vector3(0.4, 0, -5), 0.8, 0x8a4a50, 0.07);
    const spot = new THREE.SpotLight(0xa05058, 40, 10, 0.35, 0.6, 1.5);
    spot.position.set(0, 6, -6);
    spot.target.position.set(0.4, 0, -5);
    this.scene.add(spot, spot.target);
    P.cobweb(this, [-4.6, 3.0, -9.6], Math.PI / 4, 1.4, 1);
    P.cobweb(this, [4.6, 3.0, 9.6], -Math.PI * 0.75, 1.2, 2);
    P.cobweb(this, [-4.6, 2.8, 9.6], Math.PI * 0.75, 1.1, 3);
    // Wappenrelief an der Nordwand
    const crest = new THREE.Mesh(planeGeo(1.6, 1.6), (() => {
      const m = materials.tapestry(7).clone();
      m.color = new THREE.Color(0.45, 0.42, 0.4);
      return m;
    })());
    const uv = crest.geometry.getAttribute("uv") as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 1.6, uv.getY(i) / 1.6 * 0.5 + 0.28);
    crest.position.set(0, 2.2, -9.58);
    this.add(crest);
  }

  private unlockBloodSight(delay: number): void {
    if (G.abilities.has("bloodsight") || this.st.bsPending) return;
    this.st.bsPending = true;
    setTimeout(async () => {
      if (G.abilities.has("bloodsight")) return;
      await G.story.say("ch1.smell");
      G.abilities.unlock("bloodsight");
      G.abilities.unlock("bloodhunger", true);
      G.ui.notify("Drücke [1] oder [Q], um die Blutsicht zu öffnen.", "info");
    }, delay * 1000);
  }

  private async openPassage(): Promise<void> {
    if (this.st.passage) return;
    this.st.passage = true;
    G.story.say("ch1.lever");
    G.audio.sfx("stoneGrind", v([5, 1.4, -6]));
    G.player.shake(0.02, 2.4);
    const start = this.passageSlab.position.y;
    for (let i = 0; i <= 60; i++) {
      this.passageSlab.position.y = start - (i / 60) * 3.05;
      await G.game.wait(0.042);
    }
    this.passageBlocker.enabled = false;
  }

  private async memSiegel(): Promise<void> {
    if (!G.abilities.has("bloodmemory")) G.abilities.unlock("bloodmemory");
    await G.story.say("ch1.memhint");
    await G.story.playMemory("m_siegel", [
      { ghost: "ys", preset: PRESETS.ysolde, pos: [-0.85, 0, 1.2], yaw: Math.PI / 2, pose: "kneel" },
      { ghost: "mi", preset: PRESETS.mine, pos: [-2.6, 0, -2.2], yaw: Math.PI * 0.75, pose: "holdLantern" },
      { look: [-0.8, 1.0, 1.2] },
      { wait: 1.2 },
      { say: "mem.siegel.1" },
      { look: [-2.6, 1.5, -2.2] },
      { say: "mem.siegel.2" },
      { look: [-0.8, 1.0, 1.2] },
      { say: "mem.siegel.3" },
      { wait: 0.8 },
      { look: [-2.6, 1.5, -2.2] },
      { say: "mem.siegel.4" },
      { wait: 1 },
    ]);
    await G.story.say("ch1.afterSiegel");
    this.checkMemories();
  }

  private checkMemories(): void {
    if (G.state.hasMemory("m_siegel") && G.state.hasMemory("m_festmahl")) G.quests.task("q_erwachen", "erinnerung");
  }

  private pickupVial(id: string, pos: V3): void {
    if (this.st[id]) return;
    const g = new THREE.Group();
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.13, 10), materials.basic("vialGlass", () => new THREE.MeshStandardMaterial({ color: 0x5a0a10, emissive: 0x400005, emissiveIntensity: 0.6, roughness: 0.1, transparent: true, opacity: 0.9 })));
    glass.position.y = 0.065;
    const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 8), materials.surface("woodOld"));
    cork.position.y = 0.145;
    g.add(glass, cork);
    g.position.set(...pos);
    this.add(g);
    this.interact({ id, pos: v(pos).add(new THREE.Vector3(0, 0.1, 0)), radius: 2.2, prompt: "Blutphiole nehmen", angle: 0.6, enabled: () => !this.st[id], onInteract: () => {
      this.st[id] = true;
      g.visible = false;
      G.inventory.add("blutphiole");
      if (!this.st.vialLine) {
        this.st.vialLine = true;
        G.story.say("ch1.vial");
        G.ui.notify("Blutphiolen kannst du im Inventar [Tab] benutzen.", "info");
      }
    } });
  }

  // ===========================================================================
  // Gebeingang
  // ===========================================================================
  private buildOssuary(): void {
    const st = materials.surface("cryptStone");
    const fl = materials.surface("cryptFloor");
    const dark = materials.surface("castleStoneDark");
    this.floor(fl, 5, -7.8, 30, -5.2, 0);
    wall(this, st, [5, -7.9], [30, -7.9], 0, 2.6, 0.5, [{ at: 19, w: 1.6, h: 2.3, kind: "round", frame: dark }]);
    wall(this, st, [5, -5.1], [30, -5.1], 0, 2.6, 0.5);
    vault(this, st, 5, -7.7, 30, -5.3, 2.6, 1.2, "x", false);
    for (let x = 7; x < 30; x += 3) {
      this.box(dark, [x, 1.3, -7.6], [0.35, 2.6, 0.25], { collide: false });
      this.box(dark, [x, 1.3, -5.4], [0.35, 2.6, 0.25], { collide: false });
    }
    // Alkoven
    this.floor(fl, 23, -10, 25.4, -7.8, 0);
    wall(this, st, [23, -10], [25.4, -10], 0, 2.6, 0.4);
    wall(this, st, [23, -10], [23, -7.9], 0, 2.6, 0.4);
    wall(this, st, [25.4, -10], [25.4, -7.9], 0, 2.6, 0.4);
    this.ceiling(dark, 23, -10, 25.4, -7.8, 2.4);
    P.candle(this, [24.8, 0, -9.6], 0.08, true, 0.03);
    this.light({ pos: [24.7, 0.4, -9.4], intensity: 0.6, distance: 3.5, flicker: 0.4 });
    // Schädelwände (instanziert)
    const skullG = P.skullGeo();
    const count = 2 * 2 * 70;
    const im = new THREE.InstancedMesh(skullG, materials.surface("bone"), count);
    const d = new THREE.Object3D();
    let n = 0;
    for (const side of [-1, 1]) {
      const z = side < 0 ? -7.55 : -5.45;
      for (const y of [0.95, 1.45]) {
        for (let x = 5.6; x < 29.6 && n < count; x += 0.36) {
          if (side < 0 && x > 23 && x < 25.4) continue;
          d.position.set(x + Math.sin(x * 7) * 0.04, y + Math.sin(x * 13) * 0.03, z);
          d.rotation.set(Math.sin(x * 3) * 0.2, side < 0 ? 0 : Math.PI, Math.sin(x * 5) * 0.2);
          d.scale.setScalar(0.9 + Math.sin(x * 11) * 0.1);
          d.updateMatrix();
          im.setMatrixAt(n++, d.matrix);
        }
      }
    }
    im.count = n;
    im.castShadow = true;
    im.receiveShadow = true;
    this.add(im);
    // Gebeinstapel unten
    for (let x = 6; x < 29; x += 1.4) {
      P.bones(this, [x, 0, -7.35], 5, Math.floor(x * 7), 0.4);
      P.bones(this, [x + 0.7, 0, -5.65], 5, Math.floor(x * 9), 0.4);
    }
    P.sconce(this, [6.2, 1.8, -7.65], 0, true, true, 2.2);
    P.cobweb(this, [5.3, 2.5, -7.6], Math.PI / 4, 0.9, 4);
    P.cobweb(this, [29.6, 2.4, -5.4], -Math.PI * 0.75, 1, 5);
    // Durchgang zum Treppenhaus
    this.box(dark, [30, 1.3, -6.5], [0.6, 0.2, 2.4], { collide: false });

    this.trigger("ossEnter", [6.5, 0, -8], [8, 3, -5], () => {
      G.quests.task("q_erwachen", "krypta");
      G.save.checkpoint();
    });
    this.trigger("nv", [9, 0, -8], [10.5, 3, -5], async () => {
      if (G.abilities.has("nightvision")) return;
      await G.story.say("ch1.dark");
      G.abilities.unlock("nightvision");
      G.ui.notify("Drücke [2] für die Nachtsicht.", "info");
    });
    G.horror.register({
      id: "ch1_steps", area: box3([12, -1, -8], [17, 4, -5]), major: false,
      run: async () => {
        G.story.say("ch1.steps");
        await H.phantomSteps([20, 0, -6.5], [28, 0, -6.5], 9, 0.5);
      },
    });
    G.horror.register({
      id: "ch1_alcove", area: box3([17.5, -1, -8], [22, 4, -5]), major: true,
      run: async () => {
        await H.figure({ preset: "hollow", pos: [24.2, 0, -9.2], yaw: 0, pose: "hangHead", vanish: "approach", dist: 4.5, maxTime: 60, headTilt: 0.35 });
        await H.flicker(v([24, 1, -7]), 8, 0.4, 0.3);
        G.audio.sfx("whisper", v([24, 1.5, -9]));
        await G.story.say("ch1.figureGone");
      },
    });
  }

  // ===========================================================================
  // Treppenhaus
  // ===========================================================================
  private buildStairwell(): void {
    const st = materials.surface("castleStone");
    const fl = materials.surface("castleFloor");
    const dark = materials.surface("castleStoneDark");
    this.floor(fl, 30, -20, 40, -4, 0);
    const T = 0.8;
    wall(this, st, [30, -20.4], [40, -20.4], 0, 12.6, T);
    wall(this, st, [30, -3.6], [40, -3.6], 0, 12.6, T, [{ at: 5.2, w: 2.2, h: 5.2, y: 5.6, kind: "pointed", glass: materials.stainedGlass(4, "moon", "#a01020", 1.4), frame: dark }]);
    wall(this, st, [40.4, -20.4], [40.4, -3.6], 0, 12.6, T);
    wall(this, st, [29.6, -20.4], [29.6, -3.6], 0, 12.6, T, [
      { at: 13.9, w: 2.0, h: 2.6, kind: "round", frame: dark },
      { at: 6.4, w: 1.8, h: 3.0, y: 8, kind: "pointed", frame: dark },
    ]);
    this.ceiling(materials.surface("woodDark"), 30, -20.4, 40, -3.6, 12.6, 0.3);
    for (let x = 31; x < 40; x += 2) this.box(materials.surface("woodDark"), [x, 12.4, -12], [0.3, 0.4, 16.8], { collide: false });
    // Treppe 1 (Ostwand, nach Norden)
    stairs(this, dark, 38.6, -6, 0, "-z", 2.2, 16, 0.25, 0.5);
    // Absatz 1
    this.box(dark, [38.4, 2, -17.2], [3.2, 4, 6.4]);
    // Treppe 2 (Nordwand, nach Westen)
    stairs(this, dark, 36.8, -18.6, 4, "-x", 2.4, 16, 0.25, 0.375);
    // Absatz 2 (oben, Westseite)
    this.box(dark, [31.4, 7.8, -16.4], [2.8, 0.4, 8]);
    this.box(dark, [31.4, 3.8, -18.8], [2.8, 7.6, 3.2]);
    // Brüstungen
    this.box(dark, [37.25, 0.45 + 2, -10], [0.25, 0.9, 8], { collide: true });
    this.col.addRamp(v([37.25, 0.2, -6]), v([37.25, 4.2, -14]), 0.25);
    this.box(dark, [37.25, 4.45, -15.2], [0.25, 0.9, 2.4]);
    this.box(dark, [34, 6.45, -17.25], [5.6, 0.9, 0.25]);
    this.box(dark, [32.9, 8.45, -14.4], [0.25, 0.9, 4.0]);
    this.box(dark, [32.9, 8.45, -19.4], [0.25, 0.9, 1.2]);
    // Licht
    P.candelabrum(this, [39.4, 4, -19.4], 0, 5, true, 1.4, 3, true);
    P.sconce(this, [30.2, 1.9, -9], Math.PI / 2, true, true, 2.6);
    moonShaft(this, new THREE.Vector3(35.2, 10, -3.6), new THREE.Vector3(34, 0, -12), 2.2, 0x9a3040, 0.05);
    const spot = new THREE.SpotLight(0xb04048, 90, 24, 0.32, 0.7, 1.3);
    spot.position.set(35.2, 9, -3.2);
    spot.target.position.set(34, 0, -12);
    spot.castShadow = true;
    spot.shadow.mapSize.set(1024, 1024);
    this.scene.add(spot, spot.target);
    P.cobweb(this, [39.9, 12.2, -19.9], Math.PI * 0.25 - Math.PI / 2, 1.8, 6);
    P.banner(this, [30.15, 11, -9], Math.PI / 2, 1.3, 4, 8);
    // Gestalt oben auf dem Absatz – danach liegt dort das Holzpferd
    G.horror.register({
      id: "ch1_stairFigure", area: box3([32, -1, -16], [38, 3, -4]), major: true, lookAt: v([31.6, 9.4, -15.4]), lookCos: 0.86,
      run: async () => {
        await G.story.say("ch1.stairFigure");
        await H.figure({ preset: "ysolde", ghost: true, pos: [31.6, 8, -15.4], yaw: Math.PI / 2 + 0.3, pose: "stand", vanish: "flicker", maxTime: 8 });
        this.spawnHorse();
      },
    });
    if (G.horror.done("ch1_stairFigure")) this.spawnHorse();
    this.trigger("stairTop", [30, 8, -16], [33, 11, -12], () => G.save.checkpoint());
  }

  private spawnHorse(): void {
    if (G.state.hasItem("holzpferd") || G.quests.isDone("q_holzpferd") || this.horseMesh) return;
    const g = this.horseGroup();
    g.position.set(31.6, 8, -15.2);
    g.rotation.y = 0.6;
    this.add(g);
    this.horseMesh = g;
    this.interact({ id: "horse", pos: v([31.6, 8.2, -15.2]), radius: 2.2, prompt: "Holzpferd aufheben", angle: 0.5, enabled: () => !!this.horseMesh?.visible, onInteract: () => {
      g.visible = false;
      G.inventory.add("holzpferd");
      G.quests.task("q_holzpferd", "finden");
      G.story.say("ch1.horse");
    } });
  }

  private horseGroup(): THREE.Group {
    const w = materials.tinted("woodOld", 0xc8a070);
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.14, 4, 8), w);
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.12;
    const head = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.08, 4, 8), w);
    head.position.set(0.12, 0.2, 0);
    head.rotation.z = -0.6;
    g.add(body, head);
    for (const [x, z] of [[-0.07, 0.03], [-0.07, -0.03], [0.07, 0.03], [0.07, -0.03]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.09, 5), w);
      leg.position.set(x, 0.045, z);
      g.add(leg);
    }
    const base = new THREE.Mesh(boxGeo(0.26, 0.015, 0.1), w);
    g.add(base);
    return g;
  }

  // ===========================================================================
  // Ahnengalerie
  // ===========================================================================
  private buildGallery(): void {
    const st = materials.surface("castleStone");
    const fl = materials.surface("woodFloor");
    const dark = materials.surface("castleStoneDark");
    const y = 8;
    this.floor(fl, 4, -16, 30, -12, y);
    const glass = materials.stainedGlass(9, "plain", "#601020", 1.0);
    wall(this, st, [4, -11.6], [29.6, -11.6], y, 4.4, 0.8, [7, 12, 17, 22, 27].map((x) => ({ at: x - 4, w: 1.4, h: 2.8, y: 1.2, kind: "pointed" as const, glass, frame: dark })));
    wall(this, st, [4, -16.4], [29.6, -16.4], y, 4.4, 0.8, [
      { at: 5, w: 1.8, h: 3.0, kind: "pointed", frame: dark },
      { at: 17, w: 1.8, h: 3.0, kind: "pointed", frame: dark },
    ]);
    vault(this, st, 4, -16, 30, -12, y + 4.4, 2.4, "x", true);
    vaultRibs(this, dark, 4, -16, 30, -12, y + 4.4, 2.4, "x", 3.2, true);
    this.galleryDoor = this.door({ id: "galleryEast", pos: [29.6, y, -14], rotY: Math.PI / 2, width: 1.9, height: 2.6, kind: "dark", hinge: "left", swing: 1.7 });
    // Porträts
    const pY = y + 2.2;
    const portraits: [number, number, boolean][] = [[11.6, 1, true], [16.2, 2, true], [24.2, 3, true], [27.6, 4, false]];
    for (const [x, seed, female] of portraits) {
      P.portrait(this, [x, pY, -15.95], 0, 1.1, 1.4, materials.portrait(seed, { scratched: true, female, hair: "#1a1010" }));
    }
    // Ysoldes verhülltes Porträt
    P.portrait(this, [6.4, pY, -15.95], 0, 1.2, 1.5, materials.portrait(53, { female: true, hair: "#1a1214", robe: "#4a1418", label: "YSOLDE" }));
    const clothG = new THREE.PlaneGeometry(1.5, 1.85, 8, 10);
    const cp = clothG.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < cp.count; i++) cp.setZ(i, Math.sin(cp.getX(i) * 7 + cp.getY(i) * 3) * 0.03 + 0.05);
    clothG.computeVertexNormals();
    this.cloth = new THREE.Mesh(clothG, materials.surface("clothLinen"));
    this.cloth.position.set(6.4, pY - 0.05, -15.85);
    this.cloth.castShadow = true;
    this.add(this.cloth);
    if (this.st.cloth) this.cloth.visible = false;
    this.interact({ id: "cloth", pos: v([6.4, pY, -15.7]), radius: 2.6, prompt: () => (this.st.cloth ? "Porträt betrachten" : "Tuch abnehmen"), onInteract: () => this.revealPortrait() });
    // Kamin mit Brief II
    this.box(dark, [14, y + 1.6, -15.8], [2.2, 3.2, 0.4], { collide: false });
    fireplace(this, dark, 14, -15.4, y, 0, false);
    if (!G.state.hasItem("ysolde_brief2")) {
      const ash = new THREE.Mesh(planeGeo(0.25, 0.2), materials.basic("burnt", () => new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 1 })));
      ash.rotation.set(-Math.PI / 2, 0, 0.5);
      ash.position.set(14.2, y + 0.18, -15.2);
      this.add(ash);
      this.interact({ id: "letter2", pos: v([14.2, y + 0.3, -15.2]), radius: 2.2, prompt: "Verkohltes Papier aufheben", angle: 0.6, enabled: () => !G.state.hasItem("ysolde_brief2"), onInteract: () => {
        ash.visible = false;
        G.inventory.add("ysolde_brief2");
        G.quests.task("q_briefe", "b2");
        G.story.say("ch1.letter2");
        G.story.readDocument("ysolde_brief2");
      } });
    }
    // Wandteppiche, Kandelaber, Teppich
    P.banner(this, [19.4, y + 4, -15.95], 0, 1.4, 3.4, 10);
    P.banner(this, [9.2, y + 4, -12.05], Math.PI, 1.0, 3.0, 11, "#1a1a2a");
    P.rug(this, [17, y, -14], 22, 2.2, 0, 12);
    P.candelabrum(this, [20.6, y, -12.7], 0, 3, true, 1.6, 2.8, true);
    P.candelabrum(this, [8, y, -12.7], 0, 3, true, 1.6, 2.4, false);
    P.sconce(this, [26, y + 2.2, -15.9], 0, true, false, 1.8);
    P.cobweb(this, [4.4, y + 4.2, -15.6], Math.PI / 4, 1.2, 7);
    // Blutspur an der Südwand, die abrupt endet
    for (let i = 0; i < 4; i++) this.decal(materials.blood("smear", 70 + i), [27.6 - i * 1.0, y + 1.0 + i * 0.12, -12.42], 1.1, 0.5, i * 0.06, "z");
    this.decal(materials.blood("hand", 75), [23.8, y + 1.5, -12.42], 0.4, 0.4, 0, "z");
    // Ritterstatue am Westende
    this.statue = P.statue(this, [5.2, y, -14], Math.PI / 2, "knight", materials.surface("castleStoneDark"));
    if (this.st.statueTurned) {
      H.turnHead(this.statue, -0.9, 0.1);
      this.statueTurned = true;
    }
    // Horror: Tür schließt sich langsam
    G.horror.register({
      id: "ch1_doorClose", area: box3([10, y - 1, -16], [16, y + 4, -12]), major: true, when: () => this.galleryDoor.isOpen,
      run: async () => {
        this.galleryDoor.close(true);
        await G.game.wait(2.2);
        G.story.say("ch1.doorClosed");
      },
    });
    G.horror.register({
      id: "ch1_whisper", area: box3([18, y - 1, -16], [23, y + 4, -12]), major: false,
      run: () => {
        H.whisperAt([21, y + 1.6, -17.5], "whisperName");
        G.story.say("ch1.whisper");
      },
    });
    this.trigger("galleryEnter", [26, y, -16], [29.5, y + 4, -12], () => G.story.say("ch1.gallery"));
    this.trigger("bloodwall", [21, y, -14], [26, y + 4, -12], () => G.story.say("ch1.bloodwall"), { condition: () => this.playerSees(v([24, y + 1.4, -12.4]), 0.7) });
    // Statue beobachten
    this.onUpdate(() => {
      if (this.statueTurned && this.st.statueRemarked) return;
      const head = v([5.2, y + 2.6, -14]);
      const inGallery = G.player.position.x > 6 && G.player.position.x < 30 && G.player.position.y > 7 && G.player.position.z > -16.5 && G.player.position.z < -11.5;
      if (!inGallery) return;
      const sees = this.playerSees(head, 0.9, false);
      if (!this.statueTurned) {
        if (sees) this.statueSeen = true;
        else if (this.statueSeen && G.player.position.x < 22 && !this.playerSees(head, 0.3, false)) {
          this.statueTurned = true;
          this.st.statueTurned = true;
          const toP = G.player.position.clone().sub(v([5.2, y, -14]));
          H.turnHead(this.statue, Math.atan2(toP.x, toP.z) - Math.PI / 2 - 0.4, 0.15);
          G.audio.sfx("stoneGrind", head, 0.15);
        }
      } else if (sees && !this.st.statueRemarked) {
        this.st.statueRemarked = true;
        G.story.say("ch1.statue");
      }
    });
  }

  private async revealPortrait(): Promise<void> {
    if (this.st.cloth) {
      G.story.say("ch1.portrait");
      return;
    }
    this.st.cloth = true;
    G.story.say("ch1.portraitCloth");
    G.audio.sfx("paper", this.cloth.position);
    for (let i = 0; i < 30; i++) {
      this.cloth.position.y -= 0.06;
      this.cloth.rotation.x += 0.02;
      this.cloth.scale.y *= 0.97;
      await G.game.wait(0.03);
    }
    this.cloth.visible = false;
    await G.game.wait(1.2);
    G.audio.sfx("stinger", null, 0.4);
    await G.story.say("ch1.portrait");
    G.story.learn("ysolde", 1);
    G.story.learn("corvin", 1);
  }

  // ===========================================================================
  // Arbeitszimmer
  // ===========================================================================
  private buildStudy(): void {
    const st = materials.surface("castleStone");
    const fl = materials.surface("woodFloor");
    const wood = materials.surface("woodDark");
    const y = 8;
    this.floor(fl, 5, -24, 13, -16, y);
    wall(this, st, [4.6, -24.4], [13.4, -24.4], y, 4.2, 0.8);
    wall(this, st, [4.6, -24.4], [4.6, -16], y, 4.2, 0.8);
    wall(this, st, [13.4, -24.4], [13.4, -16], y, 4.2, 0.8);
    this.ceiling(wood, 4.6, -24.4, 13.4, -16, y + 4.2, 0.3);
    for (let x = 6; x < 13; x += 1.5) this.box(wood, [x, y + 4.0, -20.2], [0.25, 0.35, 8.4], { collide: false });
    this.door({ id: "study", pos: [9, y, -16.4], rotY: 0, width: 1.6, height: 2.7, kind: "dark", hinge: "left", swing: -1.6 });
    // Kamin mit Inschrift
    fireplace(this, materials.surface("castleStoneDark"), 5.1, -20, y, Math.PI / 2, false);
    const insc = new THREE.Mesh(planeGeo(2.0, 0.9), materials.inscription(["ERST WACHT DER MOND · DANN SCHWEIGT DER ████", "DANN FÄLLT DIE KRONE · ZULETZT BLEIBT NUR DAS ████"], { w: 1024, h: 256, bg: "#3a3634", color: "rgba(20,14,12,0.9)" }));
    const iu = insc.geometry.getAttribute("uv") as THREE.BufferAttribute;
    for (let i = 0; i < iu.count; i++) iu.setXY(i, iu.getX(i) / 2, iu.getY(i) / 0.9);
    insc.position.set(5.45, y + 3.25, -20);
    insc.rotation.y = Math.PI / 2;
    this.add(insc);
    // Blutschrift (nur in Blutsicht)
    const bw = new THREE.Mesh(planeGeo(2.0, 0.9), materials.hidden("writing", 77, "      RABE\n        BLUT"));
    const bu = bw.geometry.getAttribute("uv") as THREE.BufferAttribute;
    for (let i = 0; i < bu.count; i++) bu.setXY(i, bu.getX(i) / 2, bu.getY(i) / 0.9);
    bw.position.set(5.47, y + 3.25, -19.6);
    bw.rotation.y = Math.PI / 2;
    this.add(bw);
    this.interact({ id: "motto", pos: v([5.5, y + 3.2, -20]), radius: 3.4, prompt: "Inschrift lesen", angle: 0.8, onInteract: () => {
      if (G.abilities.bloodSightLevel > 0.5) {
        G.story.readDocument("kamin_inschrift_blut");
        G.quests.task("q_wappen", "inschrift");
        if (!this.st.mottoBlood) {
          this.st.mottoBlood = true;
          setTimeout(() => G.story.say("ch1.mottoBlood"), 300);
        }
      } else {
        G.story.readDocument("kamin_inschrift");
        G.quests.start("q_wappen", false);
        if (!this.st.motto) {
          this.st.motto = true;
          setTimeout(() => G.story.say("ch1.motto"), 300);
        }
      }
    } });
    // Schreibtisch & Notizen
    P.table(this, [8.8, y, -21.8], 2.0, 1.0, 0.8, 0, wood);
    P.chair(this, [8.8, y, -22.7], 0, false, wood, true);
    P.candleCluster(this, [9.4, y + 0.8, -21.6], 3, 0.15, 9, 2.2, 6, true);
    P.bottle(this, [8.0, y + 0.8, -21.5]);
    const notes = new THREE.Mesh(planeGeo(0.3, 0.4), materials.basic("paper", () => new THREE.MeshStandardMaterial({ color: 0xc8b890, roughness: 0.9, side: THREE.DoubleSide })));
    notes.rotation.set(-Math.PI / 2, 0, 0.2);
    notes.position.set(8.6, y + 0.81, -21.6);
    this.add(notes);
    if (G.state.hasItem("corvin_notiz")) notes.visible = false;
    this.interact({ id: "notes", pos: v([8.6, y + 0.9, -21.6]), radius: 2.2, prompt: "Notizen nehmen", angle: 0.6, enabled: () => !G.state.hasItem("corvin_notiz"), onInteract: () => {
      notes.visible = false;
      G.inventory.add("corvin_notiz");
      G.story.readDocument("corvin_notiz");
      G.story.learn("corvin", 1);
    } });
    P.bookshelf(this, [7.0, y, -24.0], 0, 2.2, 3.6, 13);
    P.bookshelf(this, [11.0, y, -24.0], 0, 2.2, 3.6, 14, true);
    P.bookshelf(this, [13.0, y, -19.5], -Math.PI / 2, 2.0, 3.4, 15);
    P.rug(this, [9, y, -20], 4, 3, 0, 16);
    P.candelabrum(this, [6.2, y, -17.2], 0, 3, true, 1.5, 2.6, false);
    // Truhe mit Symbolrädern
    this.chest = P.chest(this, [12.2, y, -17.4], -Math.PI / 2, !!this.st.chestOpen);
    const plate = new THREE.Mesh(planeGeo(0.5, 0.18), materials.symbol("krone", "#b09060", "#2a2018"));
    plate.position.set(11.92, y + 0.3, -17.4);
    plate.rotation.y = -Math.PI / 2;
    this.add(plate);
    this.interact({ id: "chest", pos: v([12.2, y + 0.6, -17.4]), radius: 2.2, prompt: () => (this.st.chestOpen ? "" : "Symbolräder der Truhe drehen"), enabled: () => !this.st.chestOpen, onInteract: () => this.chestPuzzle() });
    this.trigger("studyEnter", [5, y, -21], [13, y + 3, -16.5], () => G.story.say("ch1.study"));
  }

  private async chestPuzzle(): Promise<void> {
    G.quests.start("q_wappen", false);
    if (!this.st.chestHint) {
      this.st.chestHint = true;
      G.story.say("ch1.chestHint");
    }
    const solution = ["mond", "rabe", "krone", "tropfen"];
    const ok = await G.ui.puzzle.dials({
      title: "Die Truhe des Grafen",
      desc: "Vier Räder aus geschwärztem Silber. Jedes trägt acht Symbole. Darüber, in den Deckel graviert: „Wie das Haus spricht, so öffnet es sich.“",
      labels: ["Erstes", "Zweites", "Drittes", "Viertes"],
      symbols: ["mond", "rabe", "krone", "tropfen", "wolf", "schlange", "rose", "auge"],
      validate: (vals) => {
        const right = vals.filter((x, i) => x === solution[i]).length;
        if (right === 4) return null;
        const knowsBlood = !!this.st.mottoBlood;
        const base = right === 0 ? "Keines der Räder rastet ein." : right === 1 ? "Ein Rad rastet ein, die anderen schnappen zurück." : `${right} Räder rasten ein, die übrigen schnappen zurück.`;
        return base + (knowsBlood ? " Der Wahlspruch hat vier Sätze – in jedem steht ein Zeichen." : " Der Wahlspruch über dem Kamin … zwei seiner Worte sind zerkratzt. Vielleicht lassen sie sich mit anderen Augen lesen.");
      },
    });
    if (!ok) return;
    this.st.chestOpen = true;
    G.quests.task("q_wappen", "truhe");
    const lid = this.chest.userData.lid as THREE.Object3D;
    G.audio.sfx("doorCreak", v([12.2, 8.5, -17.4]), 0.6);
    for (let i = 0; i <= 30; i++) {
      lid.rotation.x = -1.9 * (i / 30);
      await G.game.wait(0.03);
    }
    G.inventory.add("siegelring");
    G.inventory.add("rotes_buch");
    G.quests.task("q_erwachen", "aufzeichnungen");
    await G.story.say("ch1.chestOpen");
    G.story.readDocument("rotes_buch");
    G.story.learn("erste", 1);
    G.save.checkpoint();
  }

  // ===========================================================================
  // Kinderzimmer
  // ===========================================================================
  private buildNursery(): void {
    const pl = materials.surface("plaster");
    const fl = materials.surface("woodFloor");
    const wood = materials.surface("woodOld");
    const y = 8;
    this.floor(fl, 18, -22, 24, -16, y);
    wall(this, pl, [17.6, -22.4], [24.4, -22.4], y, 3.6, 0.8);
    wall(this, pl, [17.6, -22.4], [17.6, -16], y, 3.6, 0.8);
    wall(this, pl, [24.4, -22.4], [24.4, -16], y, 3.6, 0.8, [{ at: 3.2, w: 1.0, h: 1.8, y: 1.0, kind: "round", glass: materials.glassMoon(1.4), frame: materials.surface("woodDark") }]);
    this.ceiling(materials.surface("woodDark"), 17.6, -22.4, 24.4, -16, y + 3.6, 0.3);
    this.door({ id: "nursery", pos: [21, y, -16.4], rotY: 0, width: 1.5, height: 2.6, kind: "wood", hinge: "right", swing: 1.6 });
    // kleines Bett, Schaukelstuhl, Spielzeugtruhe
    this.box(wood, [19.2, y + 0.3, -20.8], [1.0, 0.4, 1.7]);
    this.box(materials.surface("clothLinen"), [19.2, y + 0.55, -20.8], [0.9, 0.12, 1.6], { collide: false });
    this.box(wood, [19.2, y + 0.75, -21.65], [1.0, 0.9, 0.08], { collide: false });
    P.chair(this, [22.8, y, -19.2], -2.2, false, wood, true);
    const toyChest = P.chest(this, [22.8, y, -21.6], 0, false);
    void toyChest;
    P.cobweb(this, [17.9, y + 3.4, -22.1], Math.PI / 4, 1, 8);
    P.candle(this, [22.4, y + 0.61, -21.6], 0.1, true, 0.03);
    this.light({ pos: [22.4, y + 1.2, -21.3], intensity: 1.6, distance: 6, flicker: 0.5 });
    moonShaft(this, new THREE.Vector3(24.3, y + 2, -19.2), new THREE.Vector3(20, y, -19.6), 1.0, 0x9a3a40, 0.05);
    // Spielzeug auf dem Boden
    for (let i = 0; i < 6; i++) this.box(materials.tinted("woodOld", 0xa08060), [20 + Math.sin(i * 2) * 1.2, y + 0.05, -18.5 + Math.cos(i * 3) * 1], [0.1, 0.1, 0.1], { rotY: i, collide: false });
    if (G.quests.isDone("q_holzpferd")) this.placeHorseOnChest();
    this.interact({ id: "toychest", pos: v([22.8, y + 0.6, -21.6]), radius: 2.2, prompt: () => (G.state.hasItem("holzpferd") ? "Holzpferd zurückstellen" : "Spielzeugtruhe"), enabled: () => !G.quests.isDone("q_holzpferd"), onInteract: () => {
      if (!G.state.hasItem("holzpferd")) {
        G.ui.notify("Eine leere Spielzeugtruhe. Auf dem Deckel ist ein heller Fleck im Staub – als hätte dort lange etwas gestanden.", "info");
        return;
      }
      this.memLullaby();
    } });
    this.trigger("nurseryEnter", [18, y, -22], [24, y + 3, -17], () => G.story.say("ch1.nursery"));
  }

  private placeHorseOnChest(): void {
    if (this.horseOnChest) return;
    const g = this.horseGroup();
    g.position.set(22.8, 8.62, -21.6);
    g.rotation.y = 1.2;
    this.add(g);
    this.horseOnChest = g;
  }

  private async memLullaby(): Promise<void> {
    G.inventory.remove("holzpferd");
    this.placeHorseOnChest();
    G.audio.sfx("lullabyBox", v([22.8, 8.8, -21.6]));
    await G.game.wait(2);
    await G.story.playMemory("m_wiegenlied", [
      { ghost: "ys", preset: PRESETS.ysolde, pos: [20.4, 8, -20.6], yaw: Math.PI * 0.3, pose: "sit" },
      { look: [19.4, 8.6, -20.8] },
      { do: () => G.audio.sfx("lullabyBox", v([20.4, 9, -20.6])) },
      { say: "mem.lied.1" },
      { say: "mem.lied.2" },
      { wait: 2 },
      { say: "mem.lied.3" },
      { wait: 1 },
    ]);
    G.state.set("verse1");
    G.quests.task("q_holzpferd", "zurueck");
    await G.story.say("ch1.afterLullaby");
  }

  // ===========================================================================
  // Thronsaal
  // ===========================================================================
  private buildThroneHall(): void {
    const st = materials.surface("castleStone");
    const dark = materials.surface("castleStoneDark");
    const fl = materials.surface("castleFloor");
    const y = 8;
    this.floor(fl, -24, -26, 4, -2, y);
    const glassMoon = materials.stainedGlass(21, "moon", "#b01420", 1.5);
    const glassSaint = materials.stainedGlass(22, "saint", "#8a1020", 1.2);
    const wins = (xs: number[], g: THREE.Material) => xs.map((x, i) => ({ at: x + 24, w: 2.0, h: 5.4, y: 2.4, kind: "pointed" as const, glass: i % 2 ? glassSaint : g, frame: dark }));
    wall(this, st, [-24.4, -1.6], [4.4, -1.6], y, 8.4, 1, [...wins([-19, -7], glassMoon), { at: 11, w: 2.4, h: 3.4, kind: "pointed", frame: dark }]);
    wall(this, st, [-24.4, -26.4], [4.4, -26.4], y, 8.4, 1, wins([-19, -13, -7, -1], glassMoon));
    wall(this, st, [-24.4, -26.4], [-24.4, -1.6], y, 8.4, 1, [{ at: 12.4, w: 3, h: 6.5, y: 1.6, kind: "pointed", glass: materials.stainedGlass(23, "rose", "#a01020", 1.4), frame: dark }]);
    wall(this, st, [4.4, -26.4], [4.4, -1.6], y, 8.4, 1, [{ at: 12.4, w: 2.1, h: 3.2, kind: "pointed", frame: dark }]);
    // Säulenreihen, Mittelschiff-Gewölbe, Seitenschiffdecken
    for (let x = -20; x <= 0; x += 4) {
      column(this, dark, x, -8, y, 0.45, 8.4, true);
      column(this, dark, x, -20, y, 0.45, 8.4, true);
    }
    this.box(dark, [-10, y + 8.9, -8], [29, 1.0, 1.0], { collide: false });
    this.box(dark, [-10, y + 8.9, -20], [29, 1.0, 1.0], { collide: false });
    vault(this, st, -24, -20, 4, -8, y + 9.4, 6, "x", true);
    vaultRibs(this, dark, -24, -20, 4, -8, y + 9.4, 6, "x", 4, true);
    this.ceiling(dark, -24.4, -26.4, 4.4, -20, y + 9.4, 0.4);
    this.ceiling(dark, -24.4, -8, 4.4, -1.6, y + 9.4, 0.4);
    this.box(st, [-10, y + 9.4 + 3, -20.2], [29, 6, 0.6], { collide: false });
    this.box(st, [-10, y + 9.4 + 3, -7.8], [29, 6, 0.6], { collide: false });
    // Tür von der Galerie (Wappentür)
    this.door({
      id: "throne", pos: [4.4, y, -14], rotY: Math.PI / 2, width: 2.0, height: 3.0, kind: "dark", hinge: "right", swing: -1.7, prompt: "Wappentür öffnen",
      locked: { item: "siegelring", message: "Das Portal trägt das Wappen des Hauses. In der Mitte eine Vertiefung, wie für einen Ring." },
      onOpen: () => {
        G.quests.task("q_erwachen", "thronsaal");
        G.story.say("ch1.throneEnter");
        G.levels.playMusic("castle");
        G.save.checkpoint();
      },
    });
    const crestDoor = new THREE.Mesh(planeGeo(0.7, 0.9), materials.symbol("rabe", "#c8a060", "#1a1210"));
    crestDoor.position.set(4.62, y + 1.9, -14);
    crestDoor.rotation.y = Math.PI / 2;
    this.add(crestDoor);
    this.trigger("throneDoorHint", [4.5, y, -16], [7, y + 3, -12], () => {
      if (!G.state.hasItem("siegelring")) G.story.say("ch1.throneDoor");
    });
    // Thron
    P.throne(this, [-21.4, y, -14], Math.PI / 2);
    P.banner(this, [-23.8, y + 8, -10.5], Math.PI / 2, 1.6, 5.5, 31);
    P.banner(this, [-23.8, y + 8, -17.5], Math.PI / 2, 1.6, 5.5, 32);
    P.pillarCandles(this, [-19.6, y, -11.2], 4);
    P.pillarCandles(this, [-19.6, y, -16.8], 5);
    // Festtafel
    P.table(this, [-10.8, y, -14], 13, 1.5, 0.82, 0, materials.surface("woodDark"));
    P.rottenFeast(this, -16.6, -5.2, -14, y + 0.82, 3);
    for (let x = -16; x <= -6; x += 1.4) {
      const top = Math.sin(x * 3.3) > 0.6;
      P.chair(this, [x, y, -15.15], 0, top, materials.surface("woodDark"), true);
      P.chair(this, [x + 0.7, y, -12.85], Math.PI, Math.sin(x * 5.1) > 0.7, materials.surface("woodDark"), true);
    }
    P.chair(this, [-17.8, y, -14], -Math.PI / 2, false, materials.surface("woodDark"), true);
    // Gefallener Kronleuchter
    P.chandelier(this, [-8.6, y + 0.35, -10.6], 1.6, false, true);
    P.rubble(this, [-8.6, y, -10.6], 1.8, 12, 9, dark);
    // Kronleuchter, der noch hängt (erloschen bis auf drei Kerzen)
    P.chandelier(this, [-2, y + 7, -14], 1.4, true, false, 4);
    // Mondtafel
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.08, 40), materials.surface("gold"));
    disc.rotation.x = Math.PI / 2;
    disc.position.set(-16.5, y + 2.6, -25.85);
    this.add(disc);
    const discFace = new THREE.Mesh(new THREE.CircleGeometry(0.75, 40), materials.inscription(["826 · 906 · 986", "1066 · 1146", "1226"], { w: 512, h: 512, bg: "#5a4428", color: "rgba(40,20,10,0.9)" }));
    discFace.position.set(-16.5, y + 2.6, -25.8);
    this.add(discFace);
    for (let i = 0; i < 5; i++) {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), materials.basic("redEnamel", () => new THREE.MeshStandardMaterial({ color: 0x8a0a10, emissive: 0x500005, emissiveIntensity: 1 })));
      const a = Math.PI * 0.5 + (i / 5) * Math.PI * 2;
      dot.position.set(-16.5 + Math.cos(a) * 0.62, y + 2.6 + Math.sin(a) * 0.62, -25.78);
      this.add(dot);
    }
    this.interact({ id: "mondtafel", pos: v([-16.5, y + 2.6, -25.6]), radius: 3.2, prompt: "Mondtafel untersuchen", onInteract: async () => {
      G.story.readDocument("mondtafel");
      if (!this.st.mondtafel) {
        this.st.mondtafel = true;
        G.inventory.add("mondtafel", 1, true);
        G.quests.task("q_erwachen", "mond");
        setTimeout(() => G.story.say("ch1.mondtafel"), 400);
      }
    } });
    // Mondsicht durch die Fenster
    this.trigger("moonLook", [-24, y, -14], [4, y + 6, -2], () => G.story.say("ch1.moon"), { condition: () => this.playerSees(v([-7, y + 5, -1.6]), 0.75, false) || this.playerSees(v([-19, y + 5, -1.6]), 0.75, false) });
    this.trigger("feast", [-6, y, -18], [0, y + 4, -10], () => G.story.say("ch1.feast"));
    for (const x of [-19, -7]) moonShaft(this, new THREE.Vector3(x, y + 6.5, -1.8), new THREE.Vector3(x + 1.2, y, -10.5), 2.0, 0xa03040, 0.06);
    P.candelabrum(this, [1.6, y, -9.4], 0, 5, true, 1.7, 3, true);
    P.candelabrum(this, [1.6, y, -18.6], 0, 5, true, 1.7, 3, false);
    // Erinnerung am Kopf der Tafel
    this.decal(materials.blood("pool", 88), [-16.3, y + 0.84, -14.3], 0.7, 0.5);
    P.goblet(this, [-16.2, y + 0.83, -14.5], true);
    this.decal(materials.hidden("pool", 89), [-16.3, y + 0.85, -14.3], 0.9, 0.7);
    this.interact({ id: "mem_fest", pos: v([-16.3, y + 1.0, -14.3]), radius: 2.4, prompt: "Bluterinnerung berühren", angle: 0.55, bloodSightOnly: true, enabled: () => !G.state.hasMemory("m_festmahl"), onInteract: () => this.memFeast() });
    // Ruprecht, der Kellermeister
    if (!G.state.is("ruprechtGone")) {
      const r = new Character(PRESETS.hollow);
      r.root.position.set(-4.0, y, -14);
      r.root.rotation.y = -Math.PI / 2;
      r.setPose("slump", true);
      r.breathe = 0.15;
      r.turnToTarget = false;
      this.scene.add(r.root);
      this.onUpdate((dt, t) => r.update(dt, t));
      this.col.circles.push({ pos: r.root.position, radius: 0.4, height: 1.6, enabled: true });
      this.ruprecht = r;
      P.chair(this, [-4.0, y, -14], -Math.PI / 2, false, materials.surface("woodDark"), true);
      this.interact({ id: "ruprecht", pos: v([-4.0, y + 1.1, -14]), radius: 2.6, prompt: "Die sitzende Gestalt ansprechen", enabled: () => !G.state.is("ruprechtGone"), onInteract: () => this.talkRuprecht() });
      G.horror.register({
        id: "ch1_seated", area: box3([-2, y - 1, -18], [4.4, y + 4, -10]), major: true,
        run: async () => {
          await G.story.say("ch1.seated");
          r.faceTarget = G.camera.position;
          G.audio.sfx("breath", r.headWorld(), 1);
          r.setPose("hangHead");
        },
      });
    }
    // Südtür zum Torhaus
    this.door({
      id: "hallSouth", pos: [-13, y, -1.6], rotY: 0, width: 2.2, height: 3.2, kind: "dark", hinge: "left", swing: 1.6, prompt: "Südtor öffnen",
      locked: { flag: "ch1HallDone", message: "Nicht, bevor ich weiß, was hier geschehen ist. Diese Halle hat mir etwas zu sagen." },
      onOpen: () => G.save.checkpoint(),
    });
    this.onUpdate(() => {
      if (!G.state.is("ch1HallDone") && G.quests.taskDone("q_erwachen", "mond") && G.state.hasMemory("m_festmahl")) G.state.set("ch1HallDone");
    });
    P.cobweb(this, [3.9, y + 8.2, -25.9], Math.PI / 4 - Math.PI / 2, 2.2, 9);
    P.cobweb(this, [-23.9, y + 8.2, -2.1], Math.PI * 0.75 - Math.PI / 2, 2.0, 10);
    P.rug(this, [-12, y, -14], 18, 3, 0, 33);
  }

  private async talkRuprecht(): Promise<void> {
    if (!this.ruprecht) return;
    await G.dialogue.start("ch1_ruprecht", this.ruprecht);
    if (G.state.is("ruprechtGone") && this.ruprecht) {
      const r = this.ruprecht;
      this.ruprecht = null;
      await G.story.cutscene(async () => {
        G.player.lookAt(r.headWorld(), 3);
        await H.flicker(r.headWorld(), 6, 0.8, 0.2);
        r.fadeOut(1.5);
        G.audio.sfx("ghostLaugh", r.headWorld(), 0.5);
        await G.game.wait(1.6);
        r.dispose();
        const c = this.col.circles.find((x) => x.pos === r.root.position);
        if (c) c.enabled = false;
        await G.story.say("ch1.rupGone");
      });
    }
  }

  private async memFeast(): Promise<void> {
    const y = 8;
    await G.story.playMemory("m_festmahl", [
      { ghost: "co", preset: PRESETS.corvin, pos: [-17.6, y, -14], yaw: Math.PI / 2, pose: "raiseArms" },
      { ghost: "ys", preset: PRESETS.ysolde, pos: [-15.6, y, -15.3], yaw: 0, pose: "sit" },
      { ghost: "an", preset: PRESETS.anselm, pos: [-18.6, y, -15.8], yaw: Math.PI / 3, pose: "handsClasped" },
      { ghost: "g1", preset: PRESETS.cultist, pos: [-12.6, y, -12.9], yaw: Math.PI, pose: "sit" },
      { ghost: "g2", preset: PRESETS.malachias, pos: [-11.2, y, -15.2], yaw: 0, pose: "sit" },
      { look: [-17.6, y + 1.9, -14] },
      { wait: 1 },
      { say: "mem.fest.1" },
      { pose: "co", to: "stand" },
      { say: "mem.fest.2" },
      { say: "mem.fest.3" },
      { sfx: "glass", pos: [-18.6, y + 1, -15.8] },
      { look: [-18.6, y + 1.5, -15.8] },
      { say: "mem.fest.4" },
      { look: [-17.6, y + 1.9, -14] },
      { say: "mem.fest.5" },
      { look: [-15.6, y + 1.3, -15.3] },
      { say: "mem.fest.6" },
      { wait: 1 },
    ]);
    G.story.learn("anselm", 1);
    G.story.learn("corvin", 1);
    this.checkMemories();
  }

  // ===========================================================================
  // Torhaus
  // ===========================================================================
  private buildGatehouse(): void {
    const st = materials.surface("castleStone");
    const dark = materials.surface("castleStoneDark");
    const fl = materials.surface("castleFloor");
    const y = 8;
    this.floor(fl, -16, -1.6, -10, 12, y);
    wall(this, st, [-16.4, -1.6], [-16.4, 10], y, 5, 0.8, [{ at: 4.6, w: 1.8, h: 2.8, kind: "round", frame: dark }]);
    wall(this, st, [-9.6, -1.6], [-9.6, 10], y, 5, 0.8);
    vault(this, st, -16, -1.6, -10, 10, y + 5, 2.2, "z", false);
    // Wachraum
    this.floor(fl, -22, 0, -16.4, 6, y);
    wall(this, st, [-22.4, -0.4], [-16.4, -0.4], y, 4, 0.8);
    wall(this, st, [-22.4, 6.4], [-16.4, 6.4], y, 4, 0.8);
    wall(this, st, [-22.4, -0.4], [-22.4, 6.4], y, 4, 0.8);
    this.ceiling(materials.surface("woodDark"), -22.4, -0.4, -16.4, 6.4, y + 4, 0.3);
    P.table(this, [-19.5, y, 2.5], 1.6, 0.9, 0.8, 0.3, materials.surface("woodOld"));
    P.chair(this, [-20.4, y, 3.5], 2, true, materials.surface("woodOld"));
    P.barrel(this, [-21.6, y, 5.4]);
    P.barrel(this, [-21.6, y, 0.6], true);
    P.skeleton(this, [-21.8, y, 3.2], Math.PI / 2, "sitting");
    P.candle(this, [-19.2, y + 0.8, 2.4], 0.06, true, 0.03);
    this.light({ pos: [-19.2, y + 1.3, 2.4], intensity: 1.4, distance: 6, flicker: 0.6 });
    P.sconce(this, [-10.0, y + 2.2, 4], -Math.PI / 2, true, true, 2.6);
    this.pickupVial("vial2", [-19.0, y + 0.8, 2.9]);
    // Hebel
    const lever = new THREE.Group();
    const base = new THREE.Mesh(boxGeo(0.3, 0.5, 0.2), materials.surface("iron"));
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 6), materials.surface("iron"));
    arm.position.y = 0.3;
    arm.rotation.z = -0.6;
    lever.add(base, arm);
    lever.position.set(-9.95, y + 1.2, 0.4);
    lever.rotation.y = -Math.PI / 2;
    this.add(lever);
    this.interact({ id: "lever", pos: v([-10.0, y + 1.3, 0.4]), radius: 2.2, prompt: () => (this.portState === "down" ? "Hebel ziehen" : ""), enabled: () => this.portState === "down" && !this.st.gateOpen, onInteract: () => this.pullLever(arm) });
    // Fallgitter
    this.portcullis = new THREE.Group();
    const iron = materials.surface("ironRusty");
    for (let i = 0; i < 12; i++) {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.6, 6), iron);
      b.position.set(-15.7 + i * 0.52, 2.3, 0);
      b.castShadow = true;
      this.portcullis.add(b);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.25, 6), iron);
      tip.rotation.x = Math.PI;
      tip.position.set(-15.7 + i * 0.52, -0.1, 0);
      this.portcullis.add(tip);
    }
    for (const yy of [0.6, 1.8, 3.0, 4.2]) {
      const b = new THREE.Mesh(boxGeo(6, 0.08, 0.08), iron);
      b.position.set(-13, yy, 0);
      this.portcullis.add(b);
    }
    this.portcullis.position.set(0, y, 10);
    this.add(this.portcullis);
    this.portBlocker = this.col.addBlocker("portcullis", box3([-16, y, 9.8], [-10, y + 5, 10.2]), true);
    if (this.st.gateOpen) {
      this.portcullis.position.y = y + 3.8;
      this.portBlocker.enabled = false;
    }
    this.onUpdate((dt) => this.updatePortcullis(dt));
    this.trigger("gatehouse", [-16, y, 0], [-10, y + 4, 4], () => this.startGatehouseFight());
    this.trigger("pastGate", [-16, y, 10.6], [-10, y + 4, 13], () => {
      if (!this.st.gateOpen) {
        this.st.gateOpen = true;
        this.portBlocker.enabled = false;
        this.portcullis.position.y = 8 + 3.8;
        this.portState = "up";
      }
      G.save.checkpoint();
    });
  }

  private startGatehouseFight(): void {
    if (this.st.hollowDead) return;
    G.story.say("ch1.gatehouse");
    setTimeout(() => {
      if (this.hollow || this.st.hollowDead) return;
      G.audio.sfx("hiss", v([-19, 9.5, 3]));
      this.hollow = G.combat.spawn({
        kind: "hollow", pos: v([-19.5, 8.05, 3.2]), yaw: Math.PI / 2, aggressive: true,
        onDeath: async () => {
          this.st.hollowDead = true;
          await G.game.wait(1.5);
          await G.story.say("ch1.takedown");
          if (!G.abilities.has("regen")) {
            G.abilities.unlock("regen");
            await G.story.say("ch1.regen");
            G.ui.notify("Halte [R], um Wunden mit Blut zu schließen.", "info");
          }
          G.save.checkpoint();
        },
      });
    }, 2500);
    // Blutstoß erlernen, sobald der Verlorene nahe ist
    const check = () => {
      if (!this.hollow || this.st.hollowDead) return;
      if (this.hollow.pos.distanceTo(G.player.position) < 4.5 && !G.abilities.has("bloodpush")) {
        G.story.say("ch1.hollowAttack").then(async () => {
          G.abilities.unlock("bloodpush");
          await G.story.say("ch1.pushLearn");
          G.ui.notify("Linke Maustaste: Blutstoß. Wankende Gegner mit [E] überwältigen.", "info");
        });
        return;
      }
      setTimeout(check, 200);
    };
    setTimeout(check, 3000);
  }

  private async pullLever(arm: THREE.Mesh): Promise<void> {
    if (!this.st.hollowDead && this.hollow?.alive) {
      G.ui.notify("Nicht jetzt.", "warn");
      return;
    }
    arm.rotation.z = 0.6;
    G.audio.sfx("gateOpen", v([-13, 10, 10]));
    this.portState = "rising";
    this.portT = 0;
    setTimeout(() => (arm.rotation.z = -0.6), 3500);
    if (!G.abilities.has("shadowrun")) {
      await G.game.wait(2.2);
      await G.story.say("ch1.portcullis");
      G.abilities.unlock("shadowrun");
      G.abilities.select("shadowrun");
      await G.story.say("ch1.portcullis2");
      G.ui.notify("Drücke [3] für den Schattenlauf – zieh den Hebel erneut und lauf.", "info");
    }
  }

  private updatePortcullis(dt: number): void {
    const y0 = 8;
    if (this.st.gateOpen) return;
    this.portT += dt;
    if (this.portState === "rising") {
      this.portcullis.position.y = y0 + Math.min(3.8, this.portT * 5);
      if (this.portT > 0.76) {
        this.portState = "up";
        this.portT = 0;
        this.portBlocker.enabled = false;
      }
    } else if (this.portState === "up") {
      if (this.portT > (G.abilities.has("shadowrun") ? 1.15 : 0.6)) {
        this.portState = "falling";
        this.portT = 0;
        G.audio.sfx("gateClose", v([-13, 10, 10]));
      }
    } else if (this.portState === "falling") {
      this.portcullis.position.y = y0 + Math.max(0, 3.8 - this.portT * 12);
      if (this.portcullis.position.y < y0 + 1.6) this.portBlocker.enabled = true;
      if (this.portT > 0.35) {
        this.portState = "down";
        this.portcullis.position.y = y0;
        // Spieler unter dem Gitter? Zurückschieben
        const p = G.player.position;
        if (p.x > -16 && p.x < -10 && Math.abs(p.z - 10) < 0.4) p.z = 9.4;
      }
    }
  }

  // ===========================================================================
  // Burghof
  // ===========================================================================
  private buildCourtyard(): void {
    const st = materials.surface("castleStone");
    const dark = materials.surface("castleStoneDark");
    const roof = materials.surface("roofSlate");
    const h = this.terrainH;
    terrain(this, materials.surface("grass"), -10, 34, 64, 50, 64, h);
    // Fassade der Burg (Nordseite)
    wall(this, st, [-42, 10.2], [22, 10.2], 7.5, 15, 1.2, [
      { at: 29, w: 6, h: 5.2, kind: "round", frame: dark },
      ...[-34, -24, -4, 6, 14].map((x) => ({ at: x + 42, w: 1.4, h: 3, y: 9, kind: "pointed" as const, glass: materials.glassMoon(0.9), frame: dark })),
    ]);
    battlements(this, st, [-42, 10.2], [22, 10.2], 22.5, 1.2);
    // Ringmauern
    wall(this, st, [-42, 10], [-42, 59], 7, 10, 1.6);
    wall(this, st, [22, 10], [22, 59], 7, 10, 1.6);
    wall(this, st, [-42, 59], [22, 59], 7, 10, 1.6, [{ at: 29, w: 4.4, h: 6.4, kind: "pointed", frame: dark }]);
    battlements(this, st, [-41, 10], [-41, 59], 17, 0.8);
    battlements(this, st, [21, 10], [21, 59], 17, 0.8);
    battlements(this, st, [-42, 58.4], [22, 58.4], 17, 0.8);
    // Wehrgang Ost (für Mines Silhouette)
    this.box(dark, [20.4, 16.6, 34], [2.6, 0.4, 48], { collide: false });
    for (const [x, z, r, hh] of [[-42, 10, 4, 22], [22, 10, 4, 24], [-42, 59, 3.5, 18], [22, 59, 3.5, 18], [-19, 61.5, 2.6, 15], [-7, 61.5, 2.6, 15]] as [number, number, number, number][]) {
      tower(this, st, roof, x, z, 7, r, hh, { windows: 2 });
    }
    // Hof-Ausstattung
    P.well(this, [-5, h(-5, 30), 30]);
    deadTree(this, [-28, h(-28, 22), 22], 9, 21);
    deadTree(this, [10, h(10, 26), 26], 8, 22);
    deadTree(this, [-34, h(-34, 46), 46], 10, 23);
    deadTree(this, [14, h(14, 50), 50], 7.5, 24);
    P.statue(this, [-22, h(-22, 34), 34], 0.8, "angel", dark);
    P.statue(this, [4, h(4, 40), 40], -0.6, "robed", dark, 0.95);
    for (let i = 0; i < 7; i++) P.gravestone(this, [12 + (i % 4) * 2, h(12, 16), 16 + Math.floor(i / 4) * 3], Math.sin(i) * 0.3, 40 + i, Math.sin(i * 3) * 0.15);
    P.rubble(this, [-36, h(-36, 30), 30], 2.5, 14, 25, st);
    P.rubble(this, [16, h(16, 36), 36], 1.8, 10, 26, st);
    rock(this, [-30, h(-30, 52), 52], 1.4, 7);
    for (let i = 0; i < 8; i++) bush(this, [-38 + i * 7.5, h(-38 + i * 7.5, 56), 56 - (i % 2) * 2], 0.9, i + 50);
    P.lantern(this, [-13, 8 + 2.6, 11.2], true, 2.5);
    P.lantern(this, [-13, 8 + 3, 57.6], true, 3.5);
    grassField(this, 1400, { x0: -40, z0: 12, x1: 20, z1: 57 }, (x, z) => h(x, z), 5, (x, z) => Math.abs(x + 13) < 2.2 || Math.hypot(x + 5, z - 30) < 2);
    // Weg zum Tor
    for (let z = 12; z < 58; z += 2.2) this.decal(materials.surface("cobble"), [-13, h(-13, z) + 0.03, z], 3.6, 2.2, 0);
    const fb = new FogBanks(40, 0x5a4a52, 0.13);
    for (let i = 0; i < 40; i++) {
      const x = -40 + Math.random() * 60, z = 12 + Math.random() * 46;
      fb.add(new THREE.Vector3(x, h(x, z) + 1, z), 8 + Math.random() * 8);
    }
    this.addFogBanks(fb);
    const flock = new Flock(new THREE.Vector3(-10, 34, 34), 10, 22);
    this.scene.add(flock.group);
    this.onUpdate((_dt, t) => flock.update(t));
    this.trigger("yard", [-16, 6, 12], [-10, 12, 16], () => G.story.say("ch1.outside"));
    // Mine auf dem Wehrgang
    G.horror.register({
      id: "ch1_mine", area: box3([-30, 6, 28], [20, 14, 46]), major: true, minTime: 1,
      run: () => this.showMine(),
    });
    this.trigger("end", [-17, 6, 50], [-9, 14, 58], () => this.endChapter(), { condition: () => G.horror.done("ch1_mine") });
  }

  private async showMine(): Promise<void> {
    const c = new Character(PRESETS.mine);
    c.root.position.set(20.2, 16.8, 40);
    c.root.rotation.y = -Math.PI / 2;
    c.setPose("stand", true);
    c.faceTarget = G.camera.position;
    this.scene.add(c.root);
    this.onUpdate((dt, t) => {
      c.faceTarget = G.camera.position;
      c.update(dt, t);
    });
    this.mineFigure = c;
    this.light({ pos: [19, 18.5, 40], color: new THREE.Color(0.9, 0.3, 0.3), intensity: 3, distance: 6, flicker: 0.1 });
  }

  private async endChapter(): Promise<void> {
    await G.story.cutscene(async () => {
      const mp = v([20.2, 18.4, 40]);
      G.player.lookAt(mp, 1.6);
      await G.game.wait(1.6);
      G.audio.sfx("whisper", mp, 0.5);
      await G.story.say("ch1.voice");
      await G.game.wait(0.6);
      if (this.mineFigure) {
        await H.flicker(mp, 20, 0.5, 0.2);
        this.mineFigure.fadeOut(0.3);
      }
      await G.game.wait(1);
      await G.story.say("ch1.voiceAfter");
      G.player.lookAt(v([-13, 10, 70]), 1.2);
      await G.story.say("ch1.road");
      G.story.learn("mine", 1);
      G.quests.task("q_erwachen", "verlassen");
      G.quests.complete("q_erwachen");
    });
    G.save.checkpoint();
    if (G.levels.has("ch2_rabenfurt")) {
      await G.story.goTo("ch2_rabenfurt", "start", { chapter: 2, title: "Das Dorf der Verdammten", sub: "Rabenfurt hat überlebt. Die Frage ist, wie." });
    } else {
      await G.story.fade(1, 2);
      await G.ui.chapterCard(1, "Ende des ersten Kapitels", "Fortsetzung folgt.");
      G.game.toMainMenu();
    }
  }

  start(_spawn: string, fresh: boolean): void {
    if (!G.quests.isActive("q_erwachen") && !G.quests.isDone("q_erwachen")) G.quests.start("q_erwachen");
    G.story.learn("sami", 1);
    if (fresh && _spawn === "start" && !this.st.introDone) {
      this.st.introDone = true;
      G.renderer.uniforms.uFade.value = 1;
      G.player.pitch = -0.55;
      G.story.cutscene(async () => {
        await G.game.wait(1.5);
        await G.story.say("ch1.intro1");
        await G.story.say("ch1.intro2");
        G.audio.sfx("stoneGrind", v([0, 1, 1]), 0.6);
        await G.game.wait(1.2);
        await G.story.fade(0, 4);
        await G.story.say("ch1.wake1");
      }).then(() => {
        G.ui.notify("Bewegen: W A S D · Umschauen: Maus · Sprinten: Shift · Schleichen: Strg", "info");
        setTimeout(() => G.ui.notify("Interagieren: [E] · Tagebuch: [J] · Inventar: [Tab]", "info"), 3500);
        G.save.checkpoint();
      });
      // Falls der Spieler die Blutsicht noch nicht über eine Interaktion gefunden hat
      setTimeout(() => this.unlockBloodSight(0), 40000);
    } else {
      G.renderer.uniforms.uFade.value = 0;
      if (!G.abilities.has("bloodsight") && G.state.data.playTime > 10) this.unlockBloodSight(2);
    }
    // Ambient-Emitter
    G.audio.addEmitter(v([0, 0.3, -0.9]), "fire", 6);
    G.audio.addEmitter(v([24.5, 0.5, -9.4]), "whisper", 7);
    G.audio.addEmitter(v([-4, 1, 8]), "drip", 10);
  }
}

void archFrame;
