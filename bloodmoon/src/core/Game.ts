import * as THREE from "three";
import { G } from "./Context";
import { GameState } from "./GameState";
import { input } from "./Input";
import { settings } from "./Settings";
import { events } from "./EventBus";
import { Renderer } from "../graphics/Renderer";
import { AudioManager } from "../audio/AudioManager";
import { UIManager } from "../ui/UIManager";
import { PlayerController } from "../player/PlayerController";
import { PlayerAbilities } from "../player/PlayerAbilities";
import { PlayerInteraction } from "../player/PlayerInteraction";
import { QuestSystem } from "../gameplay/QuestSystem";
import { InventorySystem } from "../gameplay/InventorySystem";
import { CombatSystem } from "../gameplay/CombatSystem";
import { DialogueSystem } from "../story/DialogueSystem";
import { StoryManager } from "../story/StoryManager";
import { RelationshipSystem } from "../story/RelationshipSystem";
import { EndingManager } from "../story/EndingManager";
import { HorrorDirector } from "../horror/HorrorDirector";
import { LevelManager } from "../world/LevelManager";
import { SaveManager } from "../save/SaveManager";
import { updateSharedMaterials } from "../characters/Character";
import { registerLevels } from "../world/levels";
import { MenuScene } from "../world/levels/MenuScene";

interface Timer {
  at: number;
  resolve: () => void;
}

export class Game {
  paused = false;
  private last = 0;
  private timers: Timer[] = [];
  private menuScene: MenuScene | null = null;
  private deathPending = false;
  realTime = 0;
  /** maximaler Zeitschritt pro Frame (Tests können ihn erhöhen) */
  maxDt = 0.05;

  async init(container: HTMLElement, uiRoot: HTMLElement): Promise<void> {
    settings.load();
    G.game = this;
    G.state = new GameState();
    G.renderer = new Renderer(container);
    G.camera = G.renderer.camera;
    G.audio = new AudioManager();
    G.save = new SaveManager();
    G.ui = new UIManager(uiRoot);
    G.player = new PlayerController();
    G.abilities = new PlayerAbilities();
    G.interaction = new PlayerInteraction();
    G.quests = new QuestSystem();
    G.inventory = new InventorySystem();
    G.combat = new CombatSystem();
    G.dialogue = new DialogueSystem();
    G.story = new StoryManager();
    G.relations = new RelationshipSystem();
    G.endings = new EndingManager();
    G.horror = new HorrorDirector();
    G.levels = new LevelManager();
    G.level = null;
    G.time = 0;
    G.running = false;
    registerLevels(G.levels);
    input.attach(G.renderer.renderer.domElement);
    input.onLockChange = (l) => G.ui.onLockChange(l);
    G.renderer.renderer.domElement.addEventListener("click", () => {
      if (!G.ui.inMenu && !G.ui.modalOpen && G.running) input.requestLock();
    });
    G.ui.handlers = {
      newGame: () => this.newGame(),
      continueGame: () => {
        const l = G.save.latest();
        if (l) this.loadSlot(l.slot);
      },
      loadSlot: (s) => this.loadSlot(s),
      toMainMenu: () => this.toMainMenu(),
      quit: () => this.quit(),
    };
    events.on("player:died", () => this.onDeath());
    G.renderer.applySettings();
    (window as any).BLOODMOON = this.debugApi();
    requestAnimationFrame((t) => this.loop(t));
  }

  /** Startbildschirm mit Klick (für Audio-Freigabe) und anschließendem Hauptmenü. */
  async showTitle(splash: HTMLElement): Promise<void> {
    await this.enterMenuScene();
    splash.classList.add("ready");
    const start = async () => {
      splash.removeEventListener("click", start);
      window.removeEventListener("keydown", start);
      if (input.touch) {
        // Auf Smartphones: Vollbild und Querformat, soweit der Browser es erlaubt
        try {
          const fs = document.documentElement.requestFullscreen?.();
          fs?.then(() => (screen.orientation as any)?.lock?.("landscape")).catch(() => undefined);
        } catch {
          /* nicht unterstützt (z. B. iOS Safari) */
        }
      }
      await G.audio.init();
      G.audio.music.play("menu", 4);
      G.audio.setAmbience("exterior");
      G.audio.setReverb("outdoor");
      splash.style.opacity = "0";
      setTimeout(() => splash.remove(), 1200);
      G.ui.showMainMenu();
    };
    splash.addEventListener("click", start);
    window.addEventListener("keydown", start);
  }

  private async enterMenuScene(): Promise<void> {
    if (!this.menuScene) {
      this.menuScene = new MenuScene();
      await this.menuScene.build();
      this.menuScene.finalize();
    }
    this.menuScene.scene.add(G.camera);
    G.renderer.setScene(this.menuScene.scene);
    this.menuScene.applyEnv();
    G.renderer.uniforms.uFade.value = 0;
  }

  /** Wartet Spielzeit (pausiert mit dem Spiel). unscaled = Echtzeit. */
  wait(s: number, unscaled = false): Promise<void> {
    if (unscaled || this.paused) return new Promise((r) => setTimeout(r, s * 1000));
    return new Promise((resolve) => this.timers.push({ at: G.time + s, resolve }));
  }

  async newGame(): Promise<void> {
    G.ui.hideMainMenu();
    G.state.reset();
    G.player.health = 100;
    G.audio.music.play("silence", 2);
    await this.fadeOutMenu();
    await G.levels.load("ch1_drakenfels", "start", true);
  }

  async loadSlot(slot: string): Promise<void> {
    const f = G.save.read(slot);
    if (!f) {
      G.ui.notify("Spielstand konnte nicht gelesen werden.", "warn");
      return;
    }
    G.ui.hideMainMenu();
    G.ui.closeModal(false);
    await this.fadeOutMenu();
    G.state.load(f.state);
    if (!G.levels.has(G.state.data.levelId)) G.state.data.levelId = "ch1_drakenfels";
    await G.levels.load(G.state.data.levelId, G.state.data.spawnId, false);
    G.renderer.uniforms.uFade.value = 0;
    G.ui.resumeLock();
  }

  private async fadeOutMenu(): Promise<void> {
    const u = G.renderer.uniforms;
    for (let i = 0; i <= 20; i++) {
      u.uFade.value = i / 20;
      await new Promise((r) => setTimeout(r, 25));
    }
  }

  async toMainMenu(): Promise<void> {
    G.running = false;
    this.paused = false;
    G.dialogue.end();
    G.horror.clear();
    G.combat.clear();
    G.audio.clearEmitters();
    if (G.level) {
      G.level.dispose();
      G.level = null;
    }
    input.exitLock();
    input.enabled = true;
    G.renderer.uniforms.uFade.value = 0;
    G.renderer.uniforms.uMemory.value = 0;
    G.renderer.uniforms.uDistort.value = 0;
    G.abilities.reset();
    await this.enterMenuScene();
    G.audio.music.play("menu", 3);
    G.audio.setAmbience("exterior");
    G.audio.setReverb("outdoor");
    G.ui.showMainMenu();
  }

  private quit(): void {
    G.ui.confirm("BLOODMOON beenden?", () => {
      try {
        window.close();
      } catch {
        /* */
      }
      setTimeout(() => {
        document.body.innerHTML = `<div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#000;color:#8a8076;font-family:Cormorant Garamond,serif;font-size:24px;font-style:italic">Die Nacht ist vorüber. Du kannst dieses Fenster jetzt schließen.</div>`;
      }, 300);
    }, "Beenden");
  }

  private async onDeath(): Promise<void> {
    if (this.deathPending) return;
    this.deathPending = true;
    G.player.locked = true;
    G.audio.sfx("stinger");
    await G.story.fade(1, 2, 0x200002);
    G.ui.showDeath(async () => {
      this.deathPending = false;
      G.player.locked = false;
      G.renderer.uniforms.uFade.value = 0;
      const auto = G.save.read("auto");
      if (auto) await this.loadSlot("auto");
      else await this.newGame();
    });
  }

  private loop(now: number): void {
    requestAnimationFrame((t) => this.loop(t));
    const dt = Math.min(this.maxDt, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    this.realTime += dt;
    try {
      this.frame(dt);
    } catch (err) {
      console.error("[Spielschleife]", err);
    }
    input.endFrame();
  }

  private frame(dt: number): void {
    const L = G.level;
    if (!this.paused) {
      G.time += dt;
      if (this.timers.length) {
        const due = this.timers.filter((t) => t.at <= G.time);
        if (due.length) {
          this.timers = this.timers.filter((t) => t.at > G.time);
          due.forEach((t) => t.resolve());
        }
      }
      if (G.running && L) {
        G.state.data.playTime += dt;
        G.player.update(dt);
        G.abilities.update(dt);
        G.combat.update(dt);
        G.interaction.update(dt);
        G.dialogue.update(dt);
        this.checkTriggers(dt);
        G.horror.update(dt);
        G.levels.update(dt);
        L.update(dt, G.time);
        const cam = G.camera.position;
        L.sky?.update(G.time, cam);
        L.particles.forEach((p) => p.update(G.time, cam));
        L.rain?.update(G.time, cam);
        L.fogBanks?.update(G.time, G.camera);
        L.lightPool.update(dt, G.time, cam, G.camera.getWorldDirection(new THREE.Vector3()));
      } else if (this.menuScene && G.ui.inMenu) {
        this.menuScene.update(dt, this.realTime);
      }
    }
    G.ui.update(dt);
    if (G.audio.ready) {
      G.audio.updateListener(G.camera);
      G.audio.update();
    }
    updateSharedMaterials(G.time);
    G.renderer.render(dt, this.realTime);
  }

  private checkTriggers(dt: number): void {
    const L = G.level!;
    const p = G.player.position;
    const probe = p.clone().add(new THREE.Vector3(0, 0.9, 0));
    for (const t of L.triggers) {
      const inside = t.box.containsPoint(probe);
      if (inside && !t.inside) {
        t.inside = true;
        if ((!t.once || !t.fired) && (!t.condition || t.condition())) {
          t.fired = true;
          if (t.once) L.st["trig:" + t.id] = true;
          try {
            t.onEnter?.();
          } catch (err) {
            console.error("[Auslöser]", t.id, err);
          }
        } else if (t.once && !t.fired) {
          t.inside = false; // Bedingung später erneut prüfen
        }
      } else if (!inside && t.inside) {
        t.inside = false;
        t.onExit?.();
      } else if (inside && t.onStay) t.onStay(dt);
    }
  }

  private debugApi() {
    return {
      G,
      goto: (id: string, spawn = "start") => G.levels.load(id, spawn, true),
      tp: (x: number, y: number, z: number, yaw?: number) => G.player.teleport(new THREE.Vector3(x, y, z), yaw),
      give: (id: string, n = 1) => G.inventory.add(id, n),
      unlock: (id: string) => G.abilities.unlock(id),
      unlockAll: () => ["bloodsight", "nightvision", "shadowrun", "bloodmemory", "bloodhunger", "bloodpush", "regen"].forEach((a) => G.abilities.unlock(a, true)),
      flag: (k: string, v: boolean | number | string = true) => G.state.set(k, v),
      newGame: () => this.newGame(),
      pos: () => G.player.position.toArray().map((v) => +v.toFixed(2)),
      setMaxDt: (v: number) => (this.maxDt = v),
      look: (yaw: number, pitch = 0) => {
        G.player.yaw = yaw;
        G.player.pitch = pitch;
      },
      unfade: () => (G.renderer.uniforms.uFade.value = 0),
      state: () => G.state.data,
      lineup: async (names?: string[]) => {
        const { Character } = await import("../characters/Character");
        const { PRESETS } = await import("../characters/Presets");
        const list = names ?? ["sami", "mine", "bassem", "ilyas", "ysolde", "corvin", "berta", "gerold", "lene", "hollow"];
        const cam = G.camera;
        const fwd = new THREE.Vector3();
        cam.getWorldDirection(fwd);
        fwd.y = 0;
        fwd.normalize();
        const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
        const base = G.player.position.clone().addScaledVector(fwd, 3.2);
        const lamp = new THREE.PointLight(0xffe2c8, 14, 14, 1.4);
        lamp.position.copy(base).addScaledVector(fwd, -1.6).add(new THREE.Vector3(0.8, 2.6, 0));
        G.level!.scene.add(lamp);
        list.forEach((n, i) => {
          const c = new Character(PRESETS[n]);
          c.root.position.copy(base).addScaledVector(right, (i - (list.length - 1) / 2) * 0.85);
          c.root.rotation.y = Math.atan2(-fwd.x, -fwd.z);
          c.faceTarget = cam.position;
          G.level!.scene.add(c.root);
          G.level!.updaters.push((dt, t) => c.update(dt, t));
        });
      },
      noclip: false,
    };
  }
}
