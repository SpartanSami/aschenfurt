import * as THREE from "three";
import { Level } from "../Level";
import { materials, SurfaceName } from "../../graphics/Materials";
import { stairs } from "../builders/Architecture";
import * as P from "../builders/Props";
import { rock } from "../builders/Nature";
import { boxGeo, planeGeo, cylGeo } from "../builders/Geo";
import { CameraParticles, FogBanks } from "../../graphics/Effects";
import { G } from "../../core/Context";
import { Character, voidMaterial } from "../../characters/Character";
import { Werewolf } from "../../characters/Creatures";
import { PRESETS } from "../../characters/Presets";
import * as H from "../../horror/HorrorEvents";
import { noise3, Rng } from "../../graphics/Noise";
import type { EndingId } from "../../story/data/endings";

type V3 = [number, number, number];
const v = (p: V3) => new THREE.Vector3(...p);
const box3 = (a: V3, b: V3) => new THREE.Box3(v(a), v(b));

const YB = -9; // Ebene der Gänge
const YH = -20; // Ebene des Herzens
const HEART: [number, number] = [-125, -33];

/** Kapitel 6 – Der Erste: die Kammern unter Vareth. */
export class Ch6Erste extends Level {
  readonly id = "ch6_erste";
  readonly chapter = 6;
  readonly title = "Der Erste";
  readonly location = "Die Kammern unter Vareth";
  override music = "theFirst";

  private loops = 0;
  private fakeWall!: THREE.Mesh;
  private fakeBlocker!: ReturnType<Level["col"]["addBlocker"]>;
  private ysReal: Character | null = null;
  private ysFake: Character | null = null;
  private bridge: THREE.Mesh[] = [];
  private bridgeBlocker!: ReturnType<Level["col"]["addBlocker"]>;
  private giant: Character | null = null;
  private reflection: Character | null = null;
  private ring!: THREE.Mesh;
  private stones: THREE.Mesh[] = [];
  private mine6: Character | null = null;
  private ilyas6: Character | null = null;

  override requiredSurfaces(): SurfaceName[] {
    return ["flesh", "rockDark", "rock", "bone", "cryptFloor", "cryptStone", "castleStoneDark"];
  }

  async build(): Promise<void> {
    this.env = {
      ...this.env, fogColor: 0x180406, fogDensity: 0.045, ambientColor: 0x6a2a30, ambientIntensity: 0.55, hemiSky: 0x7a2a34, hemiGround: 0x100204,
      hemiIntensity: 0.4, moonIntensity: 0, reverb: "cave", ambience: "underworld", surface: "flesh", exposure: 1.3,
    };
    this.buildDescent();
    this.buildLoop();
    this.buildTrial();
    this.buildWolfCave();
    this.buildHeart();
    this.addParticles(new CameraParticles("embers", 220, 0xff4020, 0.03, 18));
    this.addParticles(new CameraParticles("ash", 300, 0x6a3030, 0.025, 16));
    this.zone("descent", [-3, YB - 1, -16], [3, 6, 5], { reverb: "cave", fogDensity: 0.05 }, 1);
    this.zone("loop", [-3, YB - 1, -56], [3, YB + 6, -15], { reverb: "crypt", fogDensity: 0.07, fogColor: 0x120204 }, 2);
    this.zone("trial", [-62, YB - 1, -56], [-18, YB + 20, -10], { reverb: "cathedral", fogDensity: 0.035, music: "memory" }, 2);
    this.zone("heart", [-160, YH - 5, -70], [-92, 30, 4], { reverb: "void", fogDensity: 0.011, music: "finale", ambientIntensity: 0.9, hemiIntensity: 0.7, fogColor: 0x2a0608 }, 2);
    this.spawn("start", [0, 0.05, 2.6], 0);
    this.spawn("trial", [-24, YB + 0.05, -33], Math.PI / 2);
    this.spawn("heart", [-104, YH + 0.05, -33], Math.PI / 2);
  }

  private fleshWall(min: V3, max: V3): void {
    this.boxMM(materials.surface("flesh"), min, max, true);
  }

  private rib(x: number, z: number, y: number, w: number, h: number, alongX = false, thick = 0.35): void {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-w / 2, 0, 0), new THREE.Vector3(-w / 2.4, h * 0.7, 0), new THREE.Vector3(0, h, 0),
      new THREE.Vector3(w / 2.4, h * 0.7, 0), new THREE.Vector3(w / 2, 0, 0),
    ]);
    const g = new THREE.TubeGeometry(curve, 24, thick, 8, false);
    this.geo(g, materials.surface("bone"), [x, y, z], [0, alongX ? Math.PI / 2 : 0, 0]);
    g.dispose();
  }

  // ===========================================================================
  private buildDescent(): void {
    const fl = materials.surface("flesh");
    this.floor(materials.surface("cryptFloor"), -2, 0, 2, 4, 0);
    stairs(this, materials.surface("rockDark"), 0, -15, YB, "z", 3.6, 30, 0.3, 0.5);
    this.fleshWall([-3, YB - 1, -16], [-2, 6, 4]);
    this.fleshWall([2, YB - 1, -16], [3, 6, 4]);
    this.fleshWall([-3, 0, 4], [3, 6, 5]);
    this.box(fl, [0, 6.2, -6], [6, 0.4, 22], { collide: false });
    for (let z = 2; z > -16; z -= 3) this.rib(0, z, YB + (z + 15) * 0.6, 4.2, 5.5, false, 0.25);
    this.light({ pos: [0, -2, -6], color: new THREE.Color(1, 0.15, 0.1), intensity: 4, distance: 14, flicker: 0.3 });
    this.light({ pos: [0, YB + 3, -14], color: new THREE.Color(1, 0.15, 0.1), intensity: 3, distance: 10, flicker: 0.3 });
    this.trigger("descend", [-2, -3, -8], [2, 3, 0], () => {
      G.quests.task("q_erste", "abstieg", true);
      G.story.say("ch6.descend");
    });
    this.trigger("walls", [-2, YB - 1, -16], [2, YB + 3, -12], () => G.story.say("ch6.walls"));
  }

  // ===========================================================================
  private buildLoop(): void {
    const fl = materials.surface("flesh");
    this.floor(materials.surface("rockDark"), -2, -56, 2, -15, YB);
    // Ostwand durchgehend, Westwand mit (verborgener) Öffnung bei z ≈ -33
    this.fleshWall([2, YB, -56], [3, YB + 5, -15]);
    this.fleshWall([-3, YB, -56], [-2, YB + 5, -34.6]);
    this.fleshWall([-3, YB, -31.4], [-2, YB + 5, -15]);
    this.fleshWall([-3, YB, -57], [3, YB + 5, -56]);
    this.box(fl, [0, YB + 5.2, -35.5], [6, 0.4, 41], { collide: true, cast: false });
    for (let z = -17; z > -56; z -= 4) this.rib(0, z, YB, 4.2, 4.6, false, 0.22);
    // Scheinwand
    this.fakeWall = new THREE.Mesh(boxGeo(1.0, 5, 3.2), fl);
    this.fakeWall.position.set(-2.5, YB + 2.5, -33);
    this.add(this.fakeWall);
    this.fakeBlocker = this.col.addBlocker("fakeWall", box3([-3, YB, -34.6], [-2, YB + 5, -31.4]), true);
    if (this.st.wallOpen) this.openFakeWall(true);
    // Blutspur in die Wand (Blutsicht)
    for (let i = 0; i < 6; i++) this.decal(materials.hidden("drops", 1600 + i), [1.2 - i * 0.6, YB + 0.03, -30 - i * 0.55], 0.5, 0.8, 0.9);
    this.decal(materials.hidden("hand", 1610), [-1.98, YB + 1.4, -33], 0.5, 0.5, 0, "x");
    this.interact({ id: "fakeWall", pos: v([-1.9, YB + 1.4, -33]), radius: 2.4, prompt: "Die Hand auf die Wand legen", bloodSightOnly: true, enabled: () => !this.st.wallOpen, onInteract: () => this.openFakeWall(false) });
    for (let z = -20; z > -56; z -= 8) this.light({ pos: [1.6, YB + 3, z], color: new THREE.Color(1, 0.2, 0.12), intensity: 2.6, distance: 9, flicker: 0.6 });
    // Schleife
    this.trigger("loop", [-2, YB - 1, -53], [2, YB + 4, -51], () => this.loopBack(), { once: false });
  }

  private async loopBack(): Promise<void> {
    if (this.st.wallOpen) return;
    this.loops++;
    const p = G.player.position;
    G.player.teleport(new THREE.Vector3(p.x, p.y, p.z + 28), G.player.yaw, G.player.pitch);
    G.renderer.uniforms.uDistort.value = 0.6;
    setTimeout(() => (G.renderer.uniforms.uDistort.value = 0), 250);
    if (this.loops === 1) {
      await G.story.say("ch6.loop1");
      H.whisperAt([0, YB + 1.5, -50], "whisper");
      await G.story.say("ch6.fakeMine");
    } else if (this.loops === 2) {
      await G.story.say("ch6.fakeIlyas");
      await G.story.say("ch6.loop2");
      await G.story.say("ch6.loopHint");
    } else if (this.loops === 3) {
      await G.story.say("ch6.fakeYsolde");
      await G.story.say("ch6.notThem");
      G.ui.notify("Nutze die Blutsicht [1].", "info");
    }
  }

  private async openFakeWall(instant: boolean): Promise<void> {
    this.st.wallOpen = true;
    this.fakeBlocker.enabled = false;
    if (instant) {
      this.fakeWall.visible = false;
      return;
    }
    await G.story.say("ch6.loopExit");
    G.audio.sfx("memoryIn");
    const m = (this.fakeWall.material as THREE.Material).clone() as THREE.MeshStandardMaterial;
    m.transparent = true;
    this.fakeWall.material = m;
    for (let i = 20; i >= 0; i--) {
      m.opacity = i / 20;
      await G.game.wait(0.04);
    }
    this.fakeWall.visible = false;
  }

  // ===========================================================================
  private buildTrial(): void {
    const fl = materials.surface("flesh");
    // Durchgang nach Westen
    this.floor(materials.surface("rockDark"), -20, -34.6, -2, -31.4, YB);
    this.fleshWall([-20, YB, -35.6], [-2, YB + 5, -34.6]);
    this.fleshWall([-20, YB, -31.4], [-2, YB + 5, -30.4]);
    this.box(fl, [-11, YB + 5.2, -33], [18, 0.4, 5], { collide: true, cast: false });
    // Halle
    this.floor(materials.surface("rockDark"), -28, -56, -20, -10, YB);
    this.floor(materials.surface("rockDark"), -62, -56, -44, -10, YB);
    this.floor(materials.surface("flesh"), -44, -56, -28, -46, YB);
    this.floor(materials.surface("flesh"), -44, -20, -28, -10, YB);
    this.fleshWall([-62, YB, -57], [-20, YB + 22, -56]);
    this.fleshWall([-62, YB, -10], [-20, YB + 22, -9]);
    this.fleshWall([-20, YB, -56], [-19, YB + 22, -35.6]);
    this.fleshWall([-20, YB, -30.4], [-19, YB + 22, -10]);
    this.fleshWall([-63, YB, -56], [-62, YB + 22, -34.6]);
    this.fleshWall([-63, YB, -31.4], [-62, YB + 22, -10]);
    this.box(fl, [-41, YB + 22.2, -33], [44, 0.4, 48], { collide: false, cast: false });
    for (let x = -24; x > -62; x -= 6) this.rib(x, -33, YB, 46, 20, true, 0.6);
    // Blutsee (nicht betretbar)
    const lake = new THREE.Mesh(planeGeo(16, 26), materials.basic("bloodLake", () => new THREE.MeshStandardMaterial({ color: 0x2a0204, roughness: 0.03, metalness: 0.6, emissive: 0x200000, emissiveIntensity: 0.6 })));
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(-36, YB - 0.2, -33);
    this.add(lake);
    this.box(materials.surface("rockDark"), [-36, YB - 1.4, -33], [16, 2, 26], { collide: false, cast: false });
    this.bridgeBlocker = this.col.addBlocker("lake", box3([-44, YB - 2, -46], [-28, YB + 4, -20]), true);
    // Gehfläche über den Trittsteinen (zugänglich, sobald die Brücke steht)
    this.col.addBox([-36, YB - 0.05, -33], [16.4, 0.2, 4.4]);
    // Podeste mit den zwei Gestalten
    for (const z of [-27, -39]) {
      const g = cylGeo(1.2, 1.4, 1.2, 18);
      this.geo(g, materials.surface("castleStoneDark"), [-49, YB + 0.6, z], [0, 0, 0], 1, { collide: true });
      g.dispose();
      this.light({ pos: [-48, YB + 4, z], color: new THREE.Color(1, 0.6, 0.5), intensity: 3.5, distance: 9, flicker: 0.1 });
    }
    // Brücke aus Trittsteinen (taucht nach der Prüfung auf)
    for (let i = 0; i < 6; i++) {
      const s = new THREE.Mesh(cylGeo(1.1, 1.3, 0.6, 12), materials.surface("rockDark"));
      s.position.set(-29.5 - i * 2.6, YB - 2.5, -33 + Math.sin(i) * 0.8);
      this.add(s);
      this.bridge.push(s);
    }
    if (this.st.trialDone) this.raiseBridge(true);
    // Prüfungsstein am Ufer
    this.box(materials.surface("castleStoneDark"), [-26.5, YB + 0.5, -33], [1, 1, 1.4]);
    this.interact({ id: "trial", pos: v([-26.5, YB + 1.2, -33]), radius: 3.5, prompt: () => (this.st.trialDone ? "" : "Zu den beiden Frauen sprechen"), enabled: () => !this.st.trialDone, onInteract: () => this.trial() });
    this.trigger("lake", [-28, YB - 1, -40], [-20, YB + 4, -26], async () => {
      if (this.st.trialDone) return;
      await G.story.say("ch6.lake");
      this.spawnMothers();
      await G.story.say("ch6.twoMothers");
    });
    const fb = new FogBanks(20, 0x5a2a2a, 0.12);
    for (let i = 0; i < 20; i++) fb.add(new THREE.Vector3(-36 + (Math.random() - 0.5) * 14, YB + 0.4, -33 + (Math.random() - 0.5) * 22), 6 + Math.random() * 6);
    this.addFogBanks(fb);
  }

  private spawnMothers(): void {
    if (this.ysReal || this.st.trialDone) return;
    const real = new Character(PRESETS.ysolde);
    real.root.position.set(-49, YB + 1.2, -27);
    real.root.rotation.y = Math.PI / 2;
    real.setPose("handsClasped", true);
    const fake = new Character(PRESETS.ysolde);
    fake.root.position.set(-49, YB + 1.2, -39);
    fake.root.rotation.y = Math.PI / 2;
    fake.setPose("handsClasped", true);
    for (const c of [real, fake]) {
      this.scene.add(c.root);
      this.onUpdate((dt, t) => {
        c.faceTarget = G.camera.position;
        c.update(dt, t);
      });
    }
    // Nur das echte Blut leuchtet unter der Blutsicht
    this.decal(materials.hidden("drops", 1700), [-48.7, YB + 2.1, -27], 0.5, 0.8, 0, "x");
    this.ysReal = real;
    this.ysFake = fake;
  }

  private async trial(): Promise<void> {
    this.spawnMothers();
    await G.dialogue.start("ch6_pruefung", this.ysReal);
    if (!G.state.is("chosenReal") && !G.state.is("chosenFake")) return;
    this.st.trialDone = true;
    G.quests.task("q_erste", "pruefung");
    if (G.state.is("chosenReal")) {
      this.ysFake?.fadeOut(1);
      G.audio.sfx("ghostLaugh", this.ysFake!.headWorld(), 0.6);
      await G.game.wait(1);
      await G.story.playMemory("m_ysolde", [
        { look: [-49, YB + 2.8, -27] },
        { do: () => G.audio.sfx("lullabyBox2", v([-49, YB + 2.5, -27])) },
        { say: "mem.ys.1" },
        { say: "mem.ys.2" },
        { wait: 1 },
        { say: "mem.ys.3" },
      ]);
      G.state.set("verse2");
      G.quests.task("q_letzte_erinnerung", "lied");
      G.story.learn("ysolde", 3);
      await G.story.say("ch6.real");
      this.ysReal?.fadeOut(3);
    } else {
      G.story.decide("pruefung", "fake", "Bei der Prüfung die falsche Mutter gewählt");
      this.ysReal?.setPose("reach");
      G.audio.sfx("scare");
      await H.scarePulse(1);
      this.ysReal?.fadeOut(0.6);
      if (this.ysFake) {
        this.ysFake.headTilt = 0.6;
        setTimeout(() => this.ysFake?.fadeOut(2), 1500);
      }
      await G.story.say("ch6.fakeChosen");
      await G.story.say("ch6.shades");
      for (let i = 0; i < 3; i++) G.combat.spawn({ kind: "shade", pos: v([-24, YB + 0.05, -26 - i * 6]), aggressive: true, leash: 30 });
    }
    await this.raiseBridge(false);
    G.save.checkpoint();
  }

  private async raiseBridge(instant: boolean): Promise<void> {
    this.bridgeBlocker.enabled = false;
    // Kollision der Trittsteine (als Brückenband)
    this.col.addBlocker("lakeN", box3([-44, YB - 2, -46], [-28, YB + 4, -35.2]), true);
    this.col.addBlocker("lakeS", box3([-44, YB - 2, -30.8], [-28, YB + 4, -20]), true);
    const yTop = YB - 0.25;
    if (!this.st.bridgeCol) {
      this.st.bridgeCol = true;
    }
    if (instant) {
      this.bridge.forEach((s) => (s.position.y = yTop));
    } else {
      G.audio.sfx("stoneGrind", v([-36, YB, -33]));
      for (let i = 0; i <= 40; i++) {
        this.bridge.forEach((s, k) => (s.position.y = THREE.MathUtils.lerp(YB - 2.5, yTop, Math.max(0, Math.min(1, (i / 40) * 1.5 - k * 0.08)))));
        await G.game.wait(0.04);
      }
    }
  }

  // ===========================================================================
  private buildWolfCave(): void {
    const fl = materials.surface("flesh");
    this.floor(materials.surface("rockDark"), -92, -40, -62, -26, YB);
    this.fleshWall([-92, YB, -41], [-62, YB + 8, -40]);
    this.fleshWall([-92, YB, -26], [-62, YB + 8, -25]);
    this.box(fl, [-77, YB + 8.2, -33], [30, 0.4, 16], { collide: false, cast: false });
    const rng = new Rng(3);
    for (let i = 0; i < 10; i++) rock(this, [-64 - rng.next() * 26, YB, -39 + rng.next() * 2 + (i % 2) * 11], rng.range(0.6, 1.4), i + 900, materials.surface("rockDark"));
    for (let x = -64; x > -92; x -= 5) this.rib(x, -33, YB, 16, 7, true, 0.4);
    P.bones(this, [-70, YB, -33], 14, 910, 2);
    P.skull(this, [-72, YB + 0.1, -30], 1, 0.2);
    // Inschrift an der Nordwand
    const ins = new THREE.Mesh(planeGeo(6, 3), materials.inscription(["◎ ◎ ⟡ ᛟ ⊕ ⊗ ◎", "⟁ ⊕ ᛞ ◎ ⟡ ⊗ ⟁", "◎◎ ⟡ ✋ ⟡ ◎◎"], { w: 1024, h: 512, color: "rgba(255,60,40,0.85)" }));
    const iu = ins.geometry.getAttribute("uv") as THREE.BufferAttribute;
    for (let i = 0; i < iu.count; i++) iu.setXY(i, iu.getX(i) / 6, iu.getY(i) / 3);
    ins.position.set(-77, YB + 3, -39.9);
    this.add(ins);
    this.light({ pos: [-77, YB + 3, -37], color: new THREE.Color(1, 0.2, 0.15), intensity: 3, distance: 9, flicker: 0.2 });
    this.interact({ id: "inscription", pos: v([-77, YB + 2.6, -39.6]), radius: 4, prompt: "Die Inschrift betrachten", onInteract: async () => {
      await G.story.say("ch6.inscription");
      await G.dialogue.start("ch6_inschrift", this.ilyas6);
    } });
    this.trigger("wolves", [-72, YB - 1, -40], [-66, YB + 5, -26], () => this.wolfAmbush());
    if (G.state.is("ilyasAllied")) {
      const il = new Character(PRESETS.ilyas);
      il.root.position.set(-74.5, YB, -37.4);
      il.root.rotation.y = Math.PI;
      il.setPose("holdLantern", true);
      this.scene.add(il.root);
      this.onUpdate((dt, t) => {
        il.faceTarget = G.camera.position.distanceTo(il.root.position) < 8 ? G.camera.position : null;
        il.update(dt, t);
      });
      this.col.circles.push({ pos: il.root.position, radius: 0.35, height: 1.7, enabled: true });
      P.lantern(this, [-74.1, YB + 0.95, -37.0], true, 2.5);
      this.ilyas6 = il;
    }
    // Rampe hinab zum Herzen
    this.col.addRamp(v([-92, YB + 0.02, -33]), v([-102, YH + 0.02, -33]), 6);
    const ramp = new THREE.Mesh(boxGeo(6, 0.4, Math.hypot(10, YB - YH)), materials.surface("rockDark"));
    ramp.position.set(-97, (YB + YH) / 2 - 0.2, -33);
    ramp.rotation.set(0, Math.PI / 2, 0);
    ramp.rotateX(-Math.atan2(YB - YH, 10));
    this.add(ramp);
    this.fleshWall([-102, YH, -37], [-92, YB + 8, -36]);
    this.fleshWall([-102, YH, -30], [-92, YB + 8, -29]);
  }

  private async wolfAmbush(): Promise<void> {
    if (this.st.wolves) return;
    this.st.wolves = true;
    await G.story.say("ch6.wolves");
    G.audio.sfx("howl", v([-88, YB + 2, -33]), 1.4);
    if (G.state.is("bassemAllied")) {
      const wolves = [0, 1].map((i) => {
        const w = new Werewolf({ corrupted: true });
        w.root.position.set(-86, YB, -31 - i * 3);
        w.root.rotation.y = Math.PI / 2;
        w.setState("prowl");
        this.scene.add(w.root);
        return w;
      });
      const bassem = new Werewolf({ color: 0x1c1410, eye: 0xd09020, scale: 1.12 });
      bassem.root.position.set(-62, YB, -33);
      bassem.root.rotation.y = -Math.PI / 2;
      bassem.setState("run");
      this.scene.add(bassem.root);
      let t = 0;
      const upd = (dt: number) => {
        t += dt;
        wolves.forEach((w) => w.update(dt));
        bassem.update(dt);
        bassem.root.position.x = Math.max(-84, -62 - t * 9);
        if (t > 2.6) {
          bassem.setState("lunge");
          wolves.forEach((w, i) => {
            w.setState("stagger");
            w.root.position.x -= dt * 4;
            w.root.position.z += (i ? -1 : 1) * dt * 2;
          });
        }
      };
      this.onUpdate(upd);
      await G.game.wait(2.4);
      await G.story.say("ch6.bassemHolds");
      await G.game.wait(4);
      this.updaters = this.updaters.filter((u) => u !== upd);
      wolves.forEach((w) => w.dispose());
      bassem.dispose();
    } else {
      for (let i = 0; i < 2; i++) G.combat.spawn({ kind: "wolf", pos: v([-88, YB + 0.05, -31 - i * 3]), aggressive: true, leash: 14 });
      G.ui.notify("Schattenlauf [3] bringt dich an ihnen vorbei.", "info");
    }
  }

  // ===========================================================================
  private buildHeart(): void {
    const [hx, hz] = HEART;
    const fl = materials.surface("flesh");
    // Boden: große Scheibe aus Fleischstein
    const disc = new THREE.CircleGeometry(28, 48);
    disc.rotateX(-Math.PI / 2);
    const pos = disc.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const r = Math.hypot(x, z);
      pos.setY(i, r > 8 ? noise3(x * 0.2, 0, z * 0.2, 3) * 0.6 : 0);
    }
    disc.computeVertexNormals();
    const uv = disc.getAttribute("uv") as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 56, uv.getY(i) * 56);
    this.geo(disc, fl, [hx, YH, hz], [0, 0, 0], 1, { collide: true, cast: false });
    disc.dispose();
    // Umfassungswand (unsichtbare Kollision) und Höhlenkuppel
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.18) continue; // Eingang im Osten
      this.col.addBox([hx + Math.cos(a) * 27, YH + 6, hz + Math.sin(a) * 27], [6, 12, 1], -a + Math.PI / 2);
    }
    const dome = new THREE.IcosahedronGeometry(40, 4);
    const dp = dome.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < dp.count; i++) {
      const x = dp.getX(i), y = dp.getY(i), z = dp.getZ(i);
      const n = 0.85 + noise3(x * 0.06, y * 0.06, z * 0.06, 7) * 0.35;
      dp.setXYZ(i, x * n, Math.max(-4, y * n * 0.75), z * n);
    }
    dome.computeVertexNormals();
    const domeMat = materials.basic("domeFlesh", () => {
      const m = materials.surface("flesh").clone();
      m.side = THREE.BackSide;
      return m;
    });
    const domeMesh = new THREE.Mesh(dome, domeMat);
    domeMesh.position.set(hx, YH, hz);
    this.add(domeMesh);
    // Riesige Rippen wie ein Brustkorb
    for (let i = -3; i <= 3; i++) this.rib(hx + i * 6, hz, YH, 50, 26 - Math.abs(i) * 2, true, 0.9);
    // Siegelring
    this.ring = new THREE.Mesh(new THREE.TorusGeometry(7, 0.5, 12, 64), materials.basic("sealRing", () => new THREE.MeshStandardMaterial({ color: 0x1a0204, emissive: 0xff2010, emissiveIntensity: 2, roughness: 0.4 })));
    this.ring.position.set(hx - 13, YH + 8, hz);
    this.ring.rotation.y = Math.PI / 2;
    this.add(this.ring);
    const sealFace = new THREE.Mesh(new THREE.CircleGeometry(6.5, 48), materials.hidden("seal", 1800, "", "rgba(255,60,40,0.9)"));
    sealFace.position.copy(this.ring.position);
    sealFace.rotation.y = Math.PI / 2;
    this.add(sealFace);
    this.light({ pos: [hx - 12, YH + 8, hz], color: new THREE.Color(1, 0.1, 0.06), intensity: 14, distance: 36, flicker: 0.15 });
    this.light({ pos: [hx + 8, YH + 6, hz], color: new THREE.Color(1, 0.3, 0.2), intensity: 6, distance: 24, flicker: 0.2 });
    this.light({ pos: [hx - 30, YH + 18, hz], color: new THREE.Color(1, 0.05, 0.04), intensity: 20, distance: 40, flicker: 0.05 });
    this.light({ pos: [hx, YH + 14, hz + 18], color: new THREE.Color(0.8, 0.15, 0.2), intensity: 8, distance: 30, flicker: 0.1 });
    this.light({ pos: [hx, YH + 14, hz - 18], color: new THREE.Color(0.8, 0.15, 0.2), intensity: 8, distance: 30, flicker: 0.1 });
    // Gegenlicht hinter dem Ersten
    const back = new THREE.PointLight(0xff2010, 600, 60, 1.4);
    back.position.set(hx - 34, YH + 16, hz);
    this.scene.add(back);
    // Plattform
    const plat = cylGeo(6, 6.5, 0.6, 32);
    this.geo(plat, materials.surface("castleStoneDark"), [hx + 3, YH + 0.3, hz], [0, 0, 0], 1, { collide: true });
    plat.dispose();
    this.col.addRamp(v([hx + 9.6, YH + 0.02, hz]), v([hx + 8.8, YH + 0.6, hz]), 4);
    this.decal(materials.hidden("seal", 1801, "", "rgba(255,200,80,0.9)"), [hx + 3, YH + 0.62, hz], 10, 10);
    // Schwebende Steine
    const rng = new Rng(17);
    for (let i = 0; i < 14; i++) {
      const g = new THREE.IcosahedronGeometry(rng.range(0.6, 2.2), 1);
      const s = new THREE.Mesh(g, materials.surface("rockDark"));
      const a = rng.next() * Math.PI * 2;
      const r = rng.range(10, 22);
      s.position.set(hx + Math.cos(a) * r, YH + rng.range(4, 18), hz + Math.sin(a) * r);
      s.userData = { a, r, y: s.position.y, sp: rng.range(0.02, 0.06) };
      this.add(s);
      this.stones.push(s);
    }
    this.onUpdate((_dt, t) => {
      for (const s of this.stones) {
        const d = s.userData;
        s.position.set(hx + Math.cos(d.a + t * d.sp) * d.r, d.y + Math.sin(t * 0.5 + d.a) * 0.6, hz + Math.sin(d.a + t * d.sp) * d.r);
        s.rotation.x += 0.002;
        s.rotation.y += 0.003;
      }
      this.ring.rotation.x = Math.sin(t * 0.2) * 0.05;
      (this.ring.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.6 + Math.sin(t * 2) * 0.5;
    });
    // Der Erste: kolossale, gesichtslose Gestalt
    const giant = new Character(PRESETS.erste, { void: true });
    giant.root.position.set(hx - 22, YH - 2, hz);
    giant.root.rotation.y = Math.PI / 2;
    giant.root.scale.setScalar(7.5);
    giant.setPose("raiseArms", true);
    giant.breathe = 2;
    giant.turnToTarget = false;
    this.scene.add(giant.root);
    this.onUpdate((dt, t) => {
      giant.faceTarget = G.camera.position;
      giant.update(dt, t);
    });
    this.giant = giant;
    // Tentakel
    for (let i = 0; i < 8; i++) {
      const pts: THREE.Vector3[] = [];
      const a = (i / 8) * Math.PI * 2;
      for (let k = 0; k <= 6; k++) pts.push(new THREE.Vector3(Math.cos(a) * (2 + k * 2.2), k * 2.4 - 2 + Math.sin(k + i) * 1.5, Math.sin(a) * (2 + k * 2.2)));
      const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, 0.5, 8, false);
      const m = new THREE.Mesh(tube, voidMaterial());
      m.position.set(hx - 22, YH, hz);
      this.add(m);
    }
    // Spiegelbild
    const refl = new Character(PRESETS.sami, { void: true });
    refl.root.position.set(hx - 4, YH, hz);
    refl.root.rotation.y = Math.PI / 2;
    refl.setPose("stand", true);
    this.scene.add(refl.root);
    this.onUpdate((dt, t) => {
      refl.faceTarget = G.camera.position;
      refl.update(dt, t);
    });
    refl.root.visible = false;
    this.reflection = refl;
    this.trigger("heartEnter", [hx + 18, YH - 2, hz - 6], [hx + 26, YH + 6, hz + 6], async () => {
      await G.story.say("ch6.heart");
      G.player.lookAt(v([hx - 22, YH + 14, hz]), 1.5);
      await G.game.wait(1);
      await G.story.say("ch6.giant");
      await G.story.say("ch6.erste1");
      await G.story.say("ch6.erste2");
      G.player.lookAt(null);
    });
    this.trigger("platform", [hx - 2, YH - 1, hz - 6], [hx + 8, YH + 4, hz + 6], () => this.finale());
  }

  // ===========================================================================
  private async finale(): Promise<void> {
    if (this.st.finale) return;
    this.st.finale = true;
    const [hx, hz] = HEART;
    G.combat.clear();
    await G.story.cutscene(async () => {
      if (this.reflection) {
        this.reflection.root.visible = true;
        this.reflection.fadeIn(2);
        G.player.lookAt(this.reflection.headWorld(), 2);
        await G.game.wait(2);
        await G.story.say("ch6.reflection");
        await G.story.say("ch6.erste3");
      }
      // Verbündete
      if (this.ilyas6) {
        this.ilyas6.root.position.set(hx + 8, YH + 0.6, hz + 4);
        this.ilyas6.root.rotation.y = -Math.PI / 2;
        await G.story.say("ch6.ilyasFinal");
      }
      if (G.state.is("bassemAllied")) {
        G.audio.sfx("howl", v([hx + 30, YH + 4, hz]), 1.2);
        await G.story.say("ch6.bassemFinal");
      }
    });
    const minePresent = G.state.is("mineAllied") || G.state.is("mineKeepsDagger") || G.state.is("mineLeft");
    if (minePresent) {
      const m = new Character(PRESETS.mine);
      m.root.position.set(hx + 5.5, YH + 0.6, hz - 4);
      m.root.rotation.y = -Math.PI * 0.7;
      m.setPose(G.state.hasItem("schlafdorn") ? "handsClasped" : "guard", true);
      this.scene.add(m.root);
      this.onUpdate((dt, t) => m.update(dt, t));
      this.mine6 = m;
      if (!G.state.hasItem("schlafdorn")) {
        await G.story.say("ch6.mineHere");
        await G.dialogue.start("ch6_mine_heart", m);
      }
      await G.story.say("ch6.mineFinal");
    }
    await G.dialogue.start("ch6_final", this.reflection);
    const choice = G.state.flag("endingChoice") as EndingId | undefined;
    if (!choice) {
      // Dialog wurde abgebrochen – erneut anbieten
      this.st.finale = false;
      return;
    }
    G.quests.task("q_erste", "entscheidung");
    await this.endingCinematic(choice);
  }

  private async endingCinematic(id: EndingId): Promise<void> {
    const [hx, hz] = HEART;
    const u = G.renderer.uniforms;
    await G.story.cutscene(async () => {
      if (id === "blutlinie") {
        await G.story.say("ch6.end1");
        G.audio.sfx("feed");
        for (let i = 0; i < 40; i++) {
          u.uPulse.value = Math.sin(i * 0.4) * 0.8;
          (this.ring.material as THREE.MeshStandardMaterial).emissiveIntensity = 2 + i * 0.3;
          if (this.giant) this.giant.root.scale.setScalar(7.5 * (1 - i / 60));
          await G.game.wait(0.08);
        }
        G.audio.sfx("rumble");
        G.player.shake(0.05, 3);
        await G.story.fade(1, 3, 0xffffff);
      } else if (id === "herrschaft") {
        await G.story.say("ch6.end2");
        G.audio.sfx("stinger");
        for (let i = 0; i < 50; i++) {
          if (this.giant) {
            this.giant.root.scale.setScalar(7.5 * (1 - i / 50));
            this.giant.root.position.lerp(v([hx + 3, YH, hz]), 0.05);
          }
          u.uHunger.value = i / 50;
          u.uDistort.value = (i / 50) * 1.2;
          await G.game.wait(0.07);
        }
        await G.story.fade(1, 3, 0x300000);
      } else {
        G.audio.music?.play("silence", 1);
        await G.story.say("ch6.end3a");
        G.audio.sfx("lullabyBox2", G.camera.position);
        await G.story.say("ch6.end3b");
        for (let i = 0; i < 60; i++) {
          if (this.giant) {
            this.giant.root.position.y += 0.2;
            this.giant.root.scale.setScalar(7.5 * (1 - i / 80));
          }
          (this.ring.material as THREE.MeshStandardMaterial).emissiveIntensity = Math.max(0, 2 - i / 20);
          u.uMemory.value = i / 60;
          await G.game.wait(0.08);
        }
        const ys = new Character(PRESETS.ysolde, { ghost: true });
        ys.root.position.set(hx - 2, YH + 0.6, hz);
        ys.root.rotation.y = Math.PI / 2;
        ys.setPose("stand", true);
        this.scene.add(ys.root);
        this.onUpdate((dt, t) => ys.update(dt, t));
        ys.fadeIn(2);
        G.player.lookAt(ys.headWorld(), 2);
        await G.game.wait(3);
        await G.story.fade(1, 4, 0xffffff);
      }
    });
    u.uMemory.value = 0;
    u.uDistort.value = 0;
    u.uHunger.value = 0;
    G.quests.complete("q_erste");
    await G.endings.play(id);
  }

  start(_spawn: string, fresh: boolean): void {
    G.quests.start("q_erste");
    G.renderer.uniforms.uFade.value = 0;
    if (fresh) G.save.checkpoint();
    G.audio.addEmitter(v([-36, YB, -33]), "whisper", 18);
    G.audio.addEmitter(v([HEART[0] - 13, YH + 6, HEART[1]]), "whisper", 30);
    void this.mine6;
  }
}
