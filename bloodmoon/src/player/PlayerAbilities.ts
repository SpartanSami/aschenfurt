import * as THREE from "three";
import { G } from "../core/Context";
import { input } from "../core/Input";
import { events } from "../core/EventBus";
import { materials } from "../graphics/Materials";

export interface AbilityDef {
  id: string;
  name: string;
  key?: string;
  active: boolean; // aktivierbar (Q / Zahlentaste)
  desc: string;
  detail: string;
  icon: string; // SVG-Pfad
}

export const ABILITIES: Record<string, AbilityDef> = {
  bloodsight: {
    id: "bloodsight", name: "Blutsicht", key: "1", active: true,
    desc: "Die Welt verblasst. Blut, Siegel und Spuren der Vergangenheit treten hervor.",
    detail: "Zeigt Blutspuren, verborgene Hinweise, magische Siegel und Erinnerungsblut. Steigert den Blutdurst langsam, solange sie aktiv ist.",
    icon: "M12 2 C7 9 5 12 5 15 a7 7 0 0 0 14 0 c0-3-2-6-7-13z",
  },
  nightvision: {
    id: "nightvision", name: "Nachtsicht", key: "2", active: true,
    desc: "Vampirische Wahrnehmung: Konturen in völliger Dunkelheit, warme Körper bleiben warm.",
    detail: "Hellt die Umgebung kalt und silbrig auf. Lebende Wesen heben sich ab. Steigert den Blutdurst leicht.",
    icon: "M2 12 C6 5 18 5 22 12 C18 19 6 19 2 12z M12 9 a3 3 0 1 0 0.01 0z",
  },
  shadowrun: {
    id: "shadowrun", name: "Schattenlauf", key: "3", active: true,
    desc: "Für einen Herzschlag lang bist du schneller als jedes Auge.",
    detail: "Ein übernatürlich schneller Vorstoß in Blick- oder Laufrichtung. Kurze Abklingzeit. Kostet Blutdurst.",
    icon: "M3 12 L14 6 L12 11 L21 12 L10 18 L12 13z",
  },
  bloodmemory: {
    id: "bloodmemory", name: "Bluterinnerung", active: false,
    desc: "Berühre altes Blut und sieh, was es gesehen hat.",
    detail: "Unter Blutsicht leuchten manche Blutspuren golden-rot. Mit [E] erlebst du Bruchstücke vergangener Ereignisse – unvollständig, manchmal trügerisch.",
    icon: "M12 3 a9 9 0 1 0 0.01 0z M12 7 v5 l3 3",
  },
  bloodhunger: {
    id: "bloodhunger", name: "Blutdurst", active: false,
    desc: "Der Hunger schärft die Sinne – und lockert den Griff um dich selbst.",
    detail: "Steigt durch Fähigkeiten langsam an. Hoher Blutdurst verstärkt die Blutsicht, öffnet neue Dialogoptionen und lässt dein Herz lauter schlagen. Blutphiolen, Nahrung und Regeneration verändern ihn.",
    icon: "M12 21 C5 15 3 11 6 7 C8 4 11 5 12 8 C13 5 16 4 18 7 C21 11 19 15 12 21z",
  },
  bloodpush: {
    id: "bloodpush", name: "Blutstoß", key: "LMT", active: false,
    desc: "Eine Welle aus Blutmagie stößt Gegner zurück und bringt sie ins Wanken.",
    detail: "Linke Maustaste. Wankende Gegner kannst du mit [E] überwältigen. Kostet Blutdurst.",
    icon: "M4 12 h10 M10 6 l6 6 l-6 6 M18 5 v14",
  },
  regen: {
    id: "regen", name: "Regeneration", key: "R", active: false,
    desc: "Wandle Durst in Heilung.",
    detail: "Halte [R], um Wunden zu schließen. Erhöht den Blutdurst deutlich.",
    icon: "M12 4 v16 M4 12 h16",
  },
};

export const ACTIVE_ORDER = ["bloodsight", "nightvision", "shadowrun"];

export class PlayerAbilities {
  bloodSightOn = false;
  nightVisionOn = false;
  bloodSightLevel = 0;
  nightVisionLevel = 0;
  shadowCooldown = 0;
  private heartTimer = 0;
  private lossTimer = 20;
  private hungerEmit = 0;
  /** Inszenierung kann Fähigkeiten sperren */
  blocked = false;
  runFx = 0;

  get hunger(): number {
    return G.state.data.player.hunger;
  }

  set hunger(v: number) {
    G.state.data.player.hunger = THREE.MathUtils.clamp(v, 0, 100);
  }

  has(id: string): boolean {
    return G.state.data.abilities.unlocked.includes(id);
  }

  unlock(id: string, silent = false): void {
    if (this.has(id)) return;
    G.state.data.abilities.unlocked.push(id);
    if (ABILITIES[id]?.active && !this.has(G.state.data.abilities.selected)) G.state.data.abilities.selected = id;
    events.emit("ability:unlocked", { abilityId: id });
    if (!silent) G.ui.abilityUnlocked(id);
  }

  get selected(): string {
    return G.state.data.abilities.selected;
  }

  select(id: string): void {
    if (!this.has(id) || !ABILITIES[id]?.active) return;
    G.state.data.abilities.selected = id;
    G.ui.hud.refresh();
  }

  addHunger(v: number): void {
    this.hunger = this.hunger + v;
  }

  activate(id: string): void {
    if (!this.has(id) || this.blocked) return;
    if (id === "bloodsight") this.setBloodSight(!this.bloodSightOn);
    else if (id === "nightvision") this.setNightVision(!this.nightVisionOn);
    else if (id === "shadowrun") this.shadowRun();
  }

  setBloodSight(on: boolean): void {
    if (on === this.bloodSightOn) return;
    this.bloodSightOn = on;
    G.audio.sfx(on ? "bloodSightOn" : "bloodSightOff");
    if (on) G.renderer.uniforms.uPulse.value = 0.6;
    events.emit("ability:changed", { abilityId: "bloodsight", active: on });
    G.ui.hud.refresh();
  }

  setNightVision(on: boolean): void {
    if (on === this.nightVisionOn) return;
    this.nightVisionOn = on;
    G.audio.sfx(on ? "nightOn" : "bloodSightOff");
    events.emit("ability:changed", { abilityId: "nightvision", active: on });
    G.ui.hud.refresh();
  }

  shadowRun(): boolean {
    if (this.shadowCooldown > 0 || G.player.locked) return false;
    const dir = new THREE.Vector3();
    G.camera.getWorldDirection(dir);
    dir.y = 0;
    if (dir.lengthSq() < 0.01) return false;
    G.player.dash(dir.normalize(), 0.34);
    this.shadowCooldown = 2.2;
    this.addHunger(5);
    this.runFx = 1;
    G.audio.sfx("shadowRun");
    events.emit("ability:changed", { abilityId: "shadowrun", active: true });
    return true;
  }

  reset(): void {
    this.bloodSightOn = false;
    this.nightVisionOn = false;
    this.bloodSightLevel = 0;
    this.nightVisionLevel = 0;
    this.shadowCooldown = 0;
  }

  update(dt: number): void {
    const canUse = !G.player.locked && !G.dialogue.active && !this.blocked;
    if (canUse) {
      if (input.wasPressed("KeyQ")) this.activate(this.selected);
      for (let i = 0; i < ACTIVE_ORDER.length; i++) {
        if (input.wasPressed("Digit" + (i + 1))) {
          const id = ACTIVE_ORDER[i];
          if (this.has(id)) {
            this.select(id);
            this.activate(id);
          }
        }
      }
      if (input.wheel !== 0) {
        const avail = ACTIVE_ORDER.filter((a) => this.has(a));
        if (avail.length) {
          const i = avail.indexOf(this.selected);
          const n = (i + (input.wheel > 0 ? 1 : -1) + avail.length) % avail.length;
          this.select(avail[n]);
        }
      }
    }
    if (this.blocked) {
      this.bloodSightOn = false;
      this.nightVisionOn = false;
    }
    this.shadowCooldown = Math.max(0, this.shadowCooldown - dt);
    this.runFx = Math.max(0, this.runFx - dt * 3);

    // Pegel weich überblenden
    const k = 1 - Math.exp(-dt * 5);
    this.bloodSightLevel += ((this.bloodSightOn ? 1 : 0) - this.bloodSightLevel) * k;
    this.nightVisionLevel += ((this.nightVisionOn ? 1 : 0) - this.nightVisionLevel) * k;

    // Blutdurst
    if (G.running && !G.dialogue.active) {
      let rate = 0.02;
      if (this.bloodSightOn) rate += 0.22;
      if (this.nightVisionOn) rate += 0.12;
      this.hunger = this.hunger + rate * dt;
    }
    const h = this.hunger;
    const hungerFx = THREE.MathUtils.smoothstep(h, 60, 100);
    this.hungerEmit -= dt;
    if (this.hungerEmit <= 0) {
      this.hungerEmit = 1;
      events.emit("hunger:changed", { value: h });
    }
    if (h > 68 && G.running) {
      this.heartTimer -= dt;
      if (this.heartTimer <= 0) {
        this.heartTimer = THREE.MathUtils.lerp(3.2, 1.1, hungerFx);
        G.audio.sfx("heartbeat", null, 0.4 + hungerFx * 0.6);
      }
    }
    // Kontrollverlust (rein erzählerisch / visuell, keine Strafe)
    if (h > 90 && G.running && !G.dialogue.active) {
      this.lossTimer -= dt;
      if (this.lossTimer <= 0) {
        this.lossTimer = 25 + Math.random() * 20;
        G.story.hungerFlash();
      }
    }

    // Visuelle Wirkung
    const u = G.renderer.uniforms;
    const bloodBoost = 1 + hungerFx * 0.5;
    u.uBloodSight.value = this.bloodSightLevel;
    u.uNightVision.value = this.nightVisionLevel;
    u.uHunger.value = hungerFx * 0.8;
    u.uShadowRun.value = Math.max(this.runFx, G.player.dashing ? 1 : 0);
    u.uPulse.value = Math.max(0, u.uPulse.value - dt * 1.5);
    G.renderer.exposureBoost = this.nightVisionLevel * 2.4;
    for (const m of materials.hiddenMaterials) m.opacity = this.bloodSightLevel * 0.95 * bloodBoost;
    for (const m of materials.bloodMaterials) m.emissiveIntensity = 0.02 + this.bloodSightLevel * 2.2 * bloodBoost;
  }
}
