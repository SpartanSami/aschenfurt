import * as THREE from "three";
import { Ch1Drakenfels } from "./Ch1Drakenfels";
import { materials } from "../../graphics/Materials";
import { wall } from "../builders/Architecture";
import * as P from "../builders/Props";
import { boxGeo, planeGeo } from "../builders/Geo";
import { G } from "../../core/Context";
import { Character } from "../../characters/Character";
import { PRESETS } from "../../characters/Presets";
import * as H from "../../horror/HorrorEvents";
import { LULLABY } from "../../audio/Music";

type V3 = [number, number, number];
const v = (p: V3) => new THREE.Vector3(...p);
const box3 = (a: V3, b: V3) => new THREE.Box3(v(a), v(b));

/** Kapitel 5 – Die Rückkehr der Blutlinie: dieselbe Burg, verwandelt. */
export class Ch5Drakenfels extends Ch1Drakenfels {
  override readonly id: string = "ch5_drakenfels";
  override readonly chapter: number = 5;
  override readonly title: string = "Die Rückkehr der Blutlinie";
  override readonly location: string = "Burg Drakenfels";
  override music = "castle";
  protected override variant: 1 | 5 = 5;

  private mine5: Character | null = null;
  private ilyas5: Character | null = null;
  private bassem5: Character | null = null;
  private panel!: THREE.Mesh;
  private panelBlocker!: ReturnType<Ch1Drakenfels["col"]["addBlocker"]>;
  private cryptSlab!: THREE.Mesh;
  private cryptBlocker!: ReturnType<Ch1Drakenfels["col"]["addBlocker"]>;

  override async build(): Promise<void> {
    Object.assign(this.st, {
      passage: true, gateOpen: true, cloth: true, chestOpen: true, introDone: true, hollowDead: true, mondtafel: true, statueTurned: true, statueRemarked: true,
      "door:galleryEast": true, "door:study": true, "door:nursery": true, "door:hallSouth": true, "door:throne": true,
    });
    await super.build();
    // Die Burg blutet: rötere Nebel, stärkerer Mond
    this.env = { ...this.env, fogColor: 0x1c0608, ambientColor: 0x6a3a44, exposure: 1.25 };
    for (const z of this.zones) {
      z.env.fogColor = z.id === "yard" ? 0x2a0a10 : 0x1a0608;
      if (z.env.moonIntensity) z.env.moonIntensity *= 1.3;
      if (z.id === "crypt") z.env.music = "theFirst";
    }
    if (this.sky) this.sky.redness = 1;
    this.bleedingWalls();
    this.buildChamber();
    this.buildNurseryPanel();
    this.buildStudy5();
    this.buildCrypt5();
    this.buildGate5();
    this.spawn("start", [-5, 8.15, 32.6], 0);
    this.spawn("crypt", [2.5, 0.05, 6], Math.PI);
  }

  private bleedingWalls(): void {
    const y = 8;
    for (const x of [7, 12, 17, 22, 27]) for (let k = 0; k < 3; k++) this.decal(materials.blood("drops", 1000 + x * 3 + k), [x + (k - 1) * 0.3, y + 1.0 + k * 0.2, -12.42], 0.3, 1.6 + k * 0.3, 0, "z");
    for (const x of [-19, -13, -7, -1]) for (let k = 0; k < 3; k++) this.decal(materials.blood("drops", 1100 + x * 3 + k), [x + (k - 1) * 0.4, y + 2.4, -25.85], 0.35, 2.6, 0, "-z");
    for (let i = 0; i < 6; i++) this.decal(materials.blood("smear", 1200 + i), [-2 + i * 0.9, 0.02, 8 - i * 1.5], 1.2, 0.5, i);
  }

  // ===========================================================================
  // Ysoldes Gemächer (zwischen Arbeitszimmer und Kinderzimmer)
  // ===========================================================================
  private buildChamber(): void {
    const y = 8;
    const pl = materials.surface("plaster");
    this.floor(materials.surface("woodFloor"), 13.8, -24, 17.2, -16.8, y);
    wall(this, materials.surface("castleStone"), [13.4, -24.4], [17.6, -24.4], y, 3.6, 0.8);
    this.ceiling(materials.surface("woodDark"), 13.4, -24.4, 17.6, -16.4, y + 3.6, 0.3);
    void pl;
    P.bed(this, [15.5, y, -22.6], Math.PI / 2, true);
    // Frisiertisch mit Spiegel ohne Spiegelbild
    P.table(this, [14.2, y, -18.4], 0.6, 1.2, 0.8, Math.PI / 2, materials.surface("woodDark"));
    const mirror = new THREE.Mesh(planeGeo(0.9, 1.2), materials.basic("mirror", () => new THREE.MeshStandardMaterial({ color: 0x0a0a0e, roughness: 0.05, metalness: 1 })));
    mirror.position.set(13.85, y + 1.6, -18.4);
    mirror.rotation.y = Math.PI / 2;
    this.add(mirror);
    this.interact({ id: "mirror5", pos: v([14.0, y + 1.6, -18.4]), radius: 2.2, prompt: "In den Spiegel sehen", onInteract: () => G.story.say("ch5.mirror") });
    P.candleCluster(this, [14.3, y + 0.8, -18.0], 4, 0.15, 1300, 2.4, 7, true);
    P.portrait(this, [17.15, y + 2.0, -20], -Math.PI / 2, 0.8, 1.0, materials.portrait(1301, { female: false, hair: "#141010", robe: "#1a1010", label: "SAMI" }));
    // Schreibpult mit dem letzten Briefstück und den Erinnerungen
    P.table(this, [16.2, y, -17.6], 1.4, 0.7, 0.8, 0, materials.surface("woodDark"));
    if (!G.state.hasItem("ysolde_brief4")) {
      const letter = new THREE.Mesh(planeGeo(0.22, 0.3), materials.basic("paper", () => new THREE.MeshStandardMaterial({ color: 0xc8b890, roughness: 0.9, side: THREE.DoubleSide })));
      letter.rotation.set(-Math.PI / 2, 0, 0.2);
      letter.position.set(15.9, y + 0.81, -17.6);
      this.add(letter);
      this.interact({ id: "brief4", pos: v([15.9, y + 0.9, -17.6]), radius: 2.0, prompt: "Briefstück aufheben", angle: 0.6, enabled: () => !G.state.hasItem("ysolde_brief4"), onInteract: () => {
        letter.visible = false;
        G.inventory.add("ysolde_brief4");
        G.quests.start("q_briefe", false);
        G.quests.task("q_briefe", "b4");
        G.story.readDocument("ysolde_brief4");
        G.quests.start("q_letzte_erinnerung", false);
      } });
    }
    this.interact({ id: "reconstruct", pos: v([16.6, y + 1.0, -17.6]), radius: 2.4, prompt: () => (G.quests.taskDone("q_ritual", "rekonstruieren") ? "" : "Die Erinnerungen jener Nacht ordnen"), enabled: () => !G.quests.taskDone("q_ritual", "rekonstruieren"), onInteract: () => this.reconstruct() });
    this.memorySpot("mem_falsch", "m_falsch", [15.2, y + 0.005, -20.2], () => this.memFalse(), 1.1);
    const chest = P.chest(this, [16.6, y, -23.5], 0, G.quests.taskDone("q_ritual", "rekonstruieren"));
    void chest;
  }

  private buildNurseryPanel(): void {
    const y = 8;
    // Spieluhr in der Spielzeugtruhe
    this.interact({ id: "musicbox", pos: v([22.8, y + 0.7, -21.6]), radius: 2.2, prompt: "Spielzeugtruhe öffnen", enabled: () => !G.state.hasItem("spieluhr") && !G.quests.taskDone("q_ritual", "gemaecher"), onInteract: async () => {
      G.inventory.add("spieluhr");
      await G.story.say("ch5.musicbox");
      G.audio.sfx("lullabyBox", v([22.8, y + 0.8, -21.6]));
      G.ui.notify("Auf dem Deckel der Spieluhr ist eine Tonfolge eingraviert: a · d' · c · a · f · g", "info");
    } });
    // Geheime Tapetentür in der Westwand des Kinderzimmers
    this.panel = new THREE.Mesh(boxGeo(0.25, 2.3, 1.2), materials.surface("woodDark"));
    this.panel.position.set(17.6, y + 1.15, -19.2);
    this.add(this.panel);
    const keys = new THREE.Mesh(planeGeo(0.6, 0.16), materials.inscription(["d e f g a b c d'"], { w: 512, h: 128, bg: "#2a1a10", color: "#c8a868" }));
    const ku = keys.geometry.getAttribute("uv") as THREE.BufferAttribute;
    for (let i = 0; i < ku.count; i++) ku.setXY(i, ku.getX(i) / 0.6, ku.getY(i) / 0.16);
    keys.position.set(17.74, y + 1.3, -19.2);
    keys.rotation.y = Math.PI / 2;
    this.add(keys);
    this.panelBlocker = this.col.addBlocker("panel", box3([17.2, y, -19.9], [18.0, y + 2.4, -18.5]), true);
    if (G.quests.taskDone("q_ritual", "gemaecher")) this.openPanel(true);
    this.interact({ id: "panel", pos: v([17.8, y + 1.3, -19.2]), radius: 2.2, prompt: "Die Tasten in der Vertäfelung", enabled: () => !G.quests.taskDone("q_ritual", "gemaecher"), onInteract: () => this.panelPuzzle() });
  }

  private async panelPuzzle(): Promise<void> {
    await G.story.say("ch5.panel");
    if (!G.state.hasItem("spieluhr") && !G.state.is("verse1")) {
      await G.story.say("ch5.panelHint");
      return;
    }
    const target = LULLABY.slice(0, 6).map(([n]) => n);
    const ok = await G.ui.puzzle.notes({
      title: "Die Melodie der Tapetentür",
      desc: G.state.is("verse1")
        ? "Acht kleine Elfenbeintasten. Du kennst diese Melodie – sie hat dich als Kind in den Schlaf gesungen. Die ersten sechs Töne."
        : "Acht kleine Elfenbeintasten. Die Spieluhr spielt eine Melodie; auf ihrem Deckel stehen sechs Töne. Spiele sie nach.",
      keys: [["d", 62], ["e", 64], ["f", 65], ["g", 67], ["a", 69], ["b", 70], ["c", 72], ["d'", 74]].map(([l, m]) => ({ label: l as string, midi: m as number })),
      length: 6,
      validate: (seq) => {
        const right = seq.filter((x, i) => x === target[i]).length;
        if (right === 6) return null;
        const firstWrong = seq.findIndex((x, i) => x !== target[i]);
        return `Die Mechanik klemmt beim ${firstWrong + 1}. Ton. ${G.state.hasItem("spieluhr") ? "Hör dir die Spieluhr noch einmal an." : ""}`;
      },
    });
    if (ok) {
      G.quests.task("q_ritual", "gemaecher");
      await this.openPanel(false);
      await G.story.say("ch5.chamber");
      G.save.checkpoint();
    }
  }

  private async openPanel(instant: boolean): Promise<void> {
    this.panelBlocker.enabled = false;
    if (instant) {
      this.panel.position.z = -20.5;
      return;
    }
    G.audio.sfx("doorCreak", this.panel.position, 0.8);
    for (let i = 0; i <= 30; i++) {
      this.panel.position.z = -19.2 - (i / 30) * 1.3;
      await G.game.wait(0.03);
    }
  }

  private async memFalse(): Promise<void> {
    await G.story.playMemory("m_falsch", [
      { ghost: "mi", preset: PRESETS.mine, pos: [15.4, 8, -21.0], yaw: 0, pose: "reach" },
      { ghost: "ys", preset: PRESETS.ysolde, pos: [16.4, 8, -20.0], yaw: Math.PI / 2, pose: "lie" },
      { look: [15.4, 9.4, -21] },
      { say: "mem.falsch.1" },
      { say: "mem.falsch.2" },
      { wait: 1 },
    ]);
    this.checkFragments();
  }

  private checkFragments(): boolean {
    const have = ["m_festmahl", "m_ritual", "m_falsch", "m_siegel"].every((m) => G.state.hasMemory(m));
    if (have && !this.st.fragHint) {
      this.st.fragHint = true;
      G.story.say("ch5.fragments");
    }
    return have;
  }

  private async reconstruct(): Promise<void> {
    if (!this.checkFragments()) {
      await G.story.say("ch5.needMore");
      const missing = [["m_ritual", "Krypta (Bluterinnerung am Siegelkreis)"], ["m_falsch", "Ysoldes Gemächer (Bluterinnerung am Boden)"], ["m_festmahl", "Thronsaal"], ["m_siegel", "Krypta (am Sarkophag)"]].filter(([m]) => !G.state.hasMemory(m)).map(([, w]) => w);
      if (missing.length) G.ui.notify("Fehlende Bruchstücke: " + missing.join(", "), "info");
      return;
    }
    if (!G.state.is("fakeFound")) {
      await G.dialogue.start("ch5_reconstruct");
      if (!G.state.is("fakeFound")) return;
    }
    const ok = await G.ui.puzzle.order({
      title: "Die Nacht der Blutkrone",
      desc: "Ordne die echten Bruchstücke so, wie sie geschehen sind. Klicke zwei Bruchstücke an, um sie zu tauschen.",
      items: [
        { id: "siegel", text: "Meine Mutter kniet an meinem Sarkophag und spricht zu mir, während ich schlafe." },
        { id: "rauch", text: "Im Kreis der Krypta steigt ein Rauch ohne Licht in mich hinein." },
        { id: "fest", text: "Mein Vater erhebt das Glas auf den Erben. Anselm lässt seinen Becher fallen." },
        { id: "haende", text: "Meine Mutter schneidet sich die Hände auf und legt sie auf meine Brust." },
      ],
      validate: (ids) => {
        const sol = ["fest", "rauch", "haende", "siegel"];
        if (ids.every((x, i) => x === sol[i])) return null;
        if (ids[0] !== "fest") return "Alles begann oben, im Saal – bevor jemand hinabstieg.";
        if (ids[3] !== "siegel") return "Sie konnte erst an meinem Sarg knien, nachdem ich darin lag.";
        return "Der Rauch kam, bevor sie die Tür schloss. Sonst hätte sie nichts schließen müssen.";
      },
    });
    if (!ok) return;
    G.quests.task("q_ritual", "rekonstruieren");
    G.story.learn("sami", 3);
    G.story.learn("ysolde", 2);
    G.inventory.add("kryptaschluessel");
    await G.story.say("ch5.key");
    G.save.checkpoint();
    await this.mineConfronts();
  }

  private async mineConfronts(): Promise<void> {
    if (G.quests.taskDone("q_ritual", "mine")) return;
    const m = this.ensureMine([16.0, 8, -16.0], Math.PI);
    m.setPose("handsClasped", true);
    await G.game.wait(0.8);
    G.player.lookAt(m.headWorld(), 3);
    await G.game.wait(1);
    await G.dialogue.start("ch5_mine", m);
    G.quests.task("q_ritual", "mine");
    if (G.state.is("mineLeft")) {
      m.fadeOut(1.5);
    }
    G.save.checkpoint();
  }

  private ensureMine(pos: V3, yaw: number): Character {
    if (!this.mine5) {
      const c = new Character(PRESETS.mine);
      this.scene.add(c.root);
      this.onUpdate((dt, t) => c.update(dt, t));
      this.col.circles.push({ pos: c.root.position, radius: 0.35, height: 1.7, enabled: true });
      this.mine5 = c;
    }
    this.mine5.root.visible = true;
    this.mine5.root.position.set(...pos);
    this.mine5.root.rotation.y = yaw;
    return this.mine5;
  }

  // ===========================================================================
  // Arbeitszimmer: İlyas und Anselms Chiffrierscheibe
  // ===========================================================================
  private buildStudy5(): void {
    const y = 8;
    if (G.relations.get("ilyas") >= -10) {
      const il = new Character(PRESETS.ilyas);
      il.root.position.set(8.8, y, -22.55);
      il.root.rotation.y = 0;
      il.setPose("sit", true);
      this.scene.add(il.root);
      this.onUpdate((dt, t) => il.update(dt, t));
      this.ilyas5 = il;
      this.interact({ id: "ilyas5", pos: v([8.8, y + 1.3, -22.3]), radius: 2.6, prompt: "Mit İlyas sprechen", onInteract: () => G.dialogue.start("ch5_ilyas", il) });
      this.trigger("ilyasSee", [5, y, -21], [13, y + 3, -16.5], () => G.story.say("ch5.ilyasHere"));
    }
    this.decal(materials.hidden("hand", 1400), [9.75, y + 0.7, -21.32], 0.25, 0.25, 0, "z");
    this.interact({ id: "cipherDesk", pos: v([9.7, y + 0.7, -21.3]), radius: 2.0, prompt: "Unter die Tischplatte greifen", angle: 0.6, bloodSightOnly: true, enabled: () => !G.state.is("anselmDecoded"), onInteract: () => this.cipher() });
  }

  private async cipher(): Promise<void> {
    await G.story.say("ch5.desk");
    if (!G.state.hasItem("rabenchronik")) {
      G.ui.notify("Ohne die verschlüsselten Seiten der Rabenchronik nützt die Scheibe nichts.", "warn");
      return;
    }
    const sol = ["mond", "rabe", "krone", "tropfen"];
    const ok = await G.ui.puzzle.dials({
      title: "Anselms Chiffrierscheibe",
      desc: "Vier Messingringe mit eingravierten Zeichen. Am Rand steht in Anselms Hand: „Der Schlüssel ist der Wahlspruch des Hauses – in der Reihenfolge, in der er gesprochen wird.“",
      labels: ["Erster Ring", "Zweiter Ring", "Dritter Ring", "Vierter Ring"],
      symbols: ["mond", "rabe", "krone", "tropfen", "wolf", "schlange", "rose", "auge"],
      validate: (vals) => {
        const r = vals.filter((x, i) => x === sol[i]).length;
        if (r === 4) return null;
        return `${r} von 4 Ringen ergeben lesbare Silben. ${G.state.is("mottoKnown") ? "Erst wacht der Mond …" : "Der Wahlspruch steht über dem Kamin – und zwei Worte darin sind nur mit Blutsicht lesbar."}`;
      },
    });
    if (!ok) return;
    G.state.set("anselmDecoded");
    G.inventory.add("anselm_bericht");
    G.quests.task("q_ritual", "ilyas");
    G.story.readDocument("anselm_bericht");
    await G.story.say("ch5.decoded");
    if (this.ilyas5) await G.dialogue.start("ch5_ilyas", this.ilyas5);
    G.save.checkpoint();
  }

  // ===========================================================================
  // Krypta: die letzte Erinnerung und der Abstieg
  // ===========================================================================
  private buildCrypt5(): void {
    this.memorySpot("mem_ritual", "m_ritual", [2.2, 0.005, -1.8], () => this.memRitual(), 1.2);
    this.cryptSlab = new THREE.Mesh(boxGeo(1.6, 0.25, 2.4), materials.surface("cryptStone"));
    this.cryptSlab.position.set(0, 0.12, 5.2);
    this.add(this.cryptSlab);
    this.decal(materials.hidden("seal", 1500, "", "rgba(230,40,40,0.95)"), [0, 0.26, 5.2], 1.6, 2.2);
    this.cryptBlocker = this.col.addBlocker("cryptSlab", box3([-0.8, -3, 4.0], [0.8, 0.25, 6.4]), true);
    // Treppe unter der Platte (nur sichtbar, wenn geöffnet)
    for (let i = 0; i < 6; i++) this.box(materials.surface("cryptFloor"), [0, -0.25 - i * 0.25, 4.4 + i * 0.3], [1.4, 0.1, 0.3], { collide: false, cast: false });
    this.box(materials.dark(), [0, -2.2, 5.2], [1.6, 0.1, 2.4], { collide: false, cast: false });
    this.interact({ id: "cryptOpen", pos: v([0, 0.5, 5.2]), radius: 2.4, prompt: () => (this.st.cryptOpen ? "Hinabsteigen" : "Das Siegel vor dem Sarkophag"), onInteract: () => this.openCrypt() });
    this.trigger("crypt5", [-5, -1, -10], [5, 6, 10], () => G.story.say("ch5.crypt"));
  }

  private async memRitual(): Promise<void> {
    await G.story.playMemory("m_ritual", [
      { ghost: "co", preset: PRESETS.corvin, pos: [-2.6, 0, 1], yaw: Math.PI / 2, pose: "raiseArms" },
      { ghost: "ma", preset: PRESETS.malachias, pos: [2.8, 0, 1.6], yaw: -Math.PI / 2, pose: "raiseArms" },
      { ghost: "sa", preset: PRESETS.sami, pos: [0, 0.9, 1], yaw: 0, pose: "lie" },
      { ghost: "ys", preset: PRESETS.ysolde, pos: [-0.9, 0, 2.4], yaw: Math.PI / 2, pose: "kneel" },
      { look: [0, 1.4, 1] },
      { say: "mem.rit.1" },
      { sfx: "rumble" },
      { do: () => G.player.shake(0.03, 2) },
      { say: "mem.rit.2" },
      { pose: "ys", to: "reach" },
      { say: "mem.rit.3" },
      { say: "mem.rit.4" },
      { say: "mem.rit.5" },
      { wait: 1.2 },
    ]);
    this.checkFragments();
  }

  private async openCrypt(): Promise<void> {
    if (this.st.cryptOpen) return this.descend();
    const need: string[] = [];
    if (!G.state.hasItem("kryptaschluessel")) need.push("Den Blutschlüssel (Ysoldes Gemächer)");
    if (!G.quests.taskDone("q_ritual", "mine")) need.push("Mit Mine sprechen");
    if (!G.quests.taskDone("q_ritual", "bassem")) need.push("Bassem rufen (am äußeren Tor)");
    if (!G.quests.taskDone("q_ritual", "ilyas")) need.push("Anselms Bericht entschlüsseln (Arbeitszimmer)");
    if (need.length) {
      await G.story.say(G.state.hasItem("kryptaschluessel") ? "ch5.notReady" : "ch5.cryptLocked");
      G.ui.notify("Noch offen: " + need.join(" · "), "info");
      return;
    }
    this.st.cryptOpen = true;
    G.inventory.remove("kryptaschluessel");
    G.audio.sfx("stoneGrind", this.cryptSlab.position);
    G.player.shake(0.03, 2.5);
    for (let i = 0; i <= 40; i++) {
      this.cryptSlab.position.x = (i / 40) * 1.8;
      await G.game.wait(0.04);
    }
    this.cryptBlocker.enabled = false;
    G.quests.task("q_ritual", "krypta");
    await G.story.say("ch5.cryptOpen");
    G.save.checkpoint();
  }

  private async descend(): Promise<void> {
    G.quests.complete("q_ritual");
    if (G.levels.has("ch6_erste")) {
      await G.story.goTo("ch6_erste", "start", { chapter: 6, title: "Der Erste", sub: "Was zuerst war, erinnert sich an alles. Außer an das, was man vor ihm versteckt hat." });
    } else {
      await G.story.fade(1, 2);
      await G.ui.chapterCard(5, "Ende des fünften Kapitels", "Fortsetzung folgt.");
      G.game.toMainMenu();
    }
  }

  // ===========================================================================
  // Äußeres Tor: Bassem rufen
  // ===========================================================================
  private buildGate5(): void {
    this.interact({ id: "howl", pos: v([-13, 9.6, 56.5]), radius: 3.2, prompt: "Nach Bassem rufen", enabled: () => !G.quests.taskDone("q_ritual", "bassem"), onInteract: () => this.callBassem() });
    this.trigger("enter5", [-16, 7, -2], [-10, 12, 10], () => {
      G.quests.task("q_ritual", "betreten");
      G.story.say("ch5.enter");
    });
  }

  private async callBassem(): Promise<void> {
    await G.story.say("ch5.howl");
    G.audio.sfx("howl", G.camera.position.clone().add(new THREE.Vector3(0, 1, 0)), 1.3);
    await G.game.wait(3.5);
    const comes = G.state.is("bassemPromise") || G.relations.get("bassem") >= -10;
    if (!comes) {
      await G.story.say("ch5.noAnswer");
      G.quests.task("q_ritual", "bassem");
      G.story.decide("bassemAllied", "none", "Niemand vom Wolfsbund antwortete auf den Ruf");
      return;
    }
    G.audio.sfx("howl", v([-13, 10, 90]), 1.4);
    if (G.state.is("bassemPromise")) setTimeout(() => G.audio.sfx("howl", v([10, 10, 95]), 1.2), 900);
    await G.story.say("ch5.bassemComes");
    const b = new Character(PRESETS.bassem);
    b.root.position.set(-13, this.terrainH(-13, 66), 66);
    b.root.rotation.y = Math.PI;
    this.scene.add(b.root);
    this.onUpdate((dt, t) => b.update(dt, t));
    this.bassem5 = b;
    await b.walkTo(v([-13, this.terrainH(-13, 59.5), 59.5]), 3.5);
    b.setPose("armsCrossed");
    await G.dialogue.start("ch5_bassem", b);
    G.quests.task("q_ritual", "bassem");
    G.save.checkpoint();
  }

  // ===========================================================================
  override start(_spawn: string, fresh: boolean): void {
    G.quests.start("q_ritual");
    G.renderer.uniforms.uFade.value = 0;
    // Verlorene wandern durch die Hallen
    G.combat.spawn({ kind: "hollow", pos: v([24, 8.05, -14]), patrol: [v([24, 8.05, -14]), v([9, 8.05, -14])], leash: 14 });
    G.combat.spawn({ kind: "hollow", pos: v([-4, 8.05, -9]), patrol: [v([-4, 8.05, -9]), v([-18, 8.05, -9]), v([-18, 8.05, -19]), v([-4, 8.05, -19])], leash: 16 });
    G.horror.register({
      id: "ch5_echo", area: box3([4, 7, -16], [26, 12, -12]), major: true,
      run: () => this.echoProcession(),
    });
    G.horror.register({ id: "ch5_hollows", area: box3([-24, 7, -26], [4, 14, -2]), run: () => G.story.say("ch5.hollowHall") });
    if (fresh) {
      G.story.cutscene(async () => {
        await G.story.say("ch5.well");
        await G.story.say("ch5.changed");
        const m = this.ensureMine([-2.2, this.terrainH(-2, 29) + 0.02, 29.2], -Math.PI / 2 - 0.4);
        m.faceTarget = G.camera.position;
        G.player.lookAt(m.headWorld(), 2);
        await G.game.wait(1.2);
      }).then(async () => {
        if (this.mine5) await G.dialogue.start("ch5_mine_arrive", this.mine5);
        this.mine5?.fadeOut(2);
        G.save.checkpoint();
      });
    }
    G.audio.addEmitter(v([0, 0.3, 5.2]), "whisper", 8);
    G.audio.addEmitter(v([0, 0.3, -0.9]), "fire", 6);
  }

  private async echoProcession(): Promise<void> {
    const y = 8;
    const cast: [string, typeof PRESETS.corvin][] = [["co", PRESETS.corvin], ["ys", PRESETS.ysolde], ["sa", PRESETS.sami], ["ma", PRESETS.malachias], ["an", PRESETS.anselm]];
    await G.story.say("ch5.echo");
    const ghosts: Character[] = [];
    cast.forEach(([, p], i) => {
      const c = new Character(p, { ghost: true });
      c.root.position.set(5.5 + i * 1.3, y, -14 + (i % 2 ? 0.6 : -0.6));
      c.root.rotation.y = Math.PI / 2;
      this.scene.add(c.root);
      this.onUpdate((dt, t) => c.update(dt, t));
      c.fadeIn(1);
      ghosts.push(c);
      setTimeout(() => c.walkTo(v([28.5, y, -14 + (i % 2 ? 0.6 : -0.6)]), 14 - i * 0.5), 600 + i * 400);
    });
    await G.game.wait(9);
    ghosts.forEach((g) => g.fadeOut(1.5));
    await H.flicker(v([20, y + 2, -14]), 14, 0.6, 0.2);
    await G.game.wait(2);
    ghosts.forEach((g) => g.dispose());
  }
}
