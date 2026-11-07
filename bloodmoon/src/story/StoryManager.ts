import * as THREE from "three";
import { G } from "../core/Context";
import { events } from "../core/EventBus";
import { LINES } from "./data/lines";
import { DOCUMENTS } from "./data/documents";
import { MEMORIES } from "./data/memories";
import { PEOPLE } from "./data/people";
import { SPEAKERS } from "./data/speakers";
import type { LineDef } from "./types";
import { Character, CharacterPreset, Pose } from "../characters/Character";

type V3 = [number, number, number];

export type MemStep =
  | { say: string }
  | { wait: number }
  | { ghost: string; preset: CharacterPreset; pos: V3; yaw: number; pose?: Pose }
  | { move: string; to: V3; dur: number }
  | { pose: string; to: Pose }
  | { look: V3 }
  | { remove: string }
  | { sfx: string; pos?: V3 }
  | { do: () => void | Promise<void> };

/** Erzählsteuerung: Untertitel, innere Stimme, Erinnerungen, Dokumente, Entscheidungen. */
export class StoryManager {
  busy = false;
  private sayToken = 0;

  line(id: string): LineDef {
    return LINES[id] ?? { s: "erzaehler", t: `[${id}]` };
  }

  /** Zeigt eine Zeile als Untertitel (mit Sprachausgabe, falls vorhanden). */
  async say(idOrLine: string | LineDef, opts: { minDur?: number; pos?: THREE.Vector3 } = {}): Promise<void> {
    const line = typeof idOrLine === "string" ? this.line(idOrLine) : idOrLine;
    const id = typeof idOrLine === "string" ? idOrLine : "";
    const token = ++this.sayToken;
    const sp = SPEAKERS[line.s];
    G.ui.subtitle(sp?.name ?? "", line.t, sp?.color ?? "#ccc");
    let dur = Math.max(opts.minDur ?? 2.2, 1.2 + line.t.length * 0.058);
    if (id) {
      const vd = await G.audio.voice(id, line.s);
      if (vd) dur = Math.max(vd + 0.4, opts.minDur ?? 0);
    }
    await G.game.wait(dur);
    if (token === this.sayToken) G.ui.subtitle("", "", "");
  }

  async sayAll(ids: string[]): Promise<void> {
    for (const id of ids) await this.say(id);
  }

  wait(s: number): Promise<void> {
    return G.game.wait(s);
  }

  async fade(to: number, dur = 1, color = 0x000000): Promise<void> {
    const u = G.renderer.uniforms;
    u.uFadeColor.value.set(color);
    const from = u.uFade.value;
    const steps = Math.max(1, Math.round(dur * 30));
    for (let i = 1; i <= steps; i++) {
      u.uFade.value = from + (to - from) * (i / steps);
      await G.game.wait(dur / steps, true);
    }
    u.uFade.value = to;
  }

  /** Führt eine Inszenierung aus und sperrt dabei die Steuerung. */
  async cutscene(fn: () => Promise<void>, lockLook = false): Promise<void> {
    this.busy = true;
    G.player.locked = true;
    G.player.lookLocked = lockLook;
    try {
      await fn();
    } catch (err) {
      console.error("[Inszenierung]", err);
    } finally {
      this.busy = false;
      G.player.locked = false;
      G.player.lookLocked = false;
      G.player.lookAt(null);
    }
  }

  // -------------------------------------------------------------------------
  // Erinnerungen
  // -------------------------------------------------------------------------

  async playMemory(memId: string, steps: MemStep[]): Promise<void> {
    if (this.busy) return;
    const def = MEMORIES[memId];
    const L = G.level!;
    const ghosts = new Map<string, Character>();
    const prevMusic = G.audio.music?.current ?? "silence";
    await this.cutscene(async () => {
      G.abilities.setBloodSight(false);
      G.abilities.blocked = true;
      G.audio.sfx("memoryIn");
      G.audio.setAmbience("memory");
      G.audio.music?.play("memory", 2);
      const u = G.renderer.uniforms;
      for (let i = 0; i <= 20; i++) {
        u.uMemory.value = i / 20;
        u.uDistort.value = Math.sin((i / 20) * Math.PI) * 0.8;
        await G.game.wait(0.04);
      }
      if (def) G.ui.memoryTitle(def.title);
      for (const st of steps) {
        if ("say" in st) await this.say(st.say);
        else if ("wait" in st) await G.game.wait(st.wait);
        else if ("ghost" in st) {
          const c = new Character(st.preset, { ghost: true });
          c.root.position.set(...st.pos);
          c.root.rotation.y = st.yaw;
          if (st.pose) c.setPose(st.pose);
          L.scene.add(c.root);
          L.updaters.push((dt, t) => c.update(dt, t));
          ghosts.set(st.ghost, c);
          c.fadeIn(0.8);
        } else if ("move" in st) {
          ghosts.get(st.move)?.walkTo(new THREE.Vector3(...st.to), st.dur);
        } else if ("pose" in st) {
          ghosts.get(st.pose)?.setPose(st.to);
        } else if ("look" in st) {
          G.player.lookAt(new THREE.Vector3(...st.look), 2);
        } else if ("remove" in st) {
          const c = ghosts.get(st.remove);
          if (c) {
            c.fadeOut(0.8);
            ghosts.delete(st.remove);
          }
        } else if ("sfx" in st) {
          G.audio.sfx(st.sfx, st.pos ? new THREE.Vector3(...st.pos) : null);
        } else if ("do" in st) {
          await st.do();
        }
      }
      for (const c of ghosts.values()) c.fadeOut(1);
      await G.game.wait(0.6);
      G.audio.sfx("memoryOut");
      for (let i = 20; i >= 0; i--) {
        u.uMemory.value = i / 20;
        u.uDistort.value = Math.sin((i / 20) * Math.PI) * 0.6;
        await G.game.wait(0.04);
      }
      u.uMemory.value = 0;
      u.uDistort.value = 0;
      G.abilities.blocked = false;
      G.levels.applyEnvAudio();
      G.audio.music?.play(prevMusic === "memory" ? "castle" : prevMusic, 3);
    });
    for (const c of ghosts.values()) c.dispose();
    if (def && !G.state.hasMemory(memId)) {
      G.state.data.memories.push(memId);
      events.emit("memory:unlocked", { memoryId: memId });
      G.ui.notify(`Erinnerung: ${def.title}`, "memory");
    }
  }

  // -------------------------------------------------------------------------
  // Dokumente, Personen, Entscheidungen
  // -------------------------------------------------------------------------

  readDocument(id: string): void {
    const doc = DOCUMENTS[id];
    if (!doc) return;
    G.audio.sfx("paper");
    const first = !G.state.data.documents.includes(id);
    if (first) {
      G.state.data.documents.push(id);
      events.emit("document:read", { docId: id });
    }
    G.ui.openDocument(doc);
    if (first) G.ui.notify(`Dokument im Tagebuch: ${doc.title}`, "info");
  }

  learn(person: string, level: number): void {
    const cur = G.state.data.people[person] ?? 0;
    if (level <= cur) return;
    G.state.data.people[person] = level;
    if (cur === 0 && PEOPLE[person]) G.ui.notify(`Neue Person im Tagebuch: ${PEOPLE[person].name}`, "info");
  }

  decide(id: string, value: string, label: string): void {
    G.state.data.decisions[id] = { value, label, chapter: G.state.data.chapter };
    events.emit("decision:made", { id, value });
  }

  /** Kurzer Kontrollverlust bei sehr hohem Blutdurst – rein atmosphärisch. */
  async hungerFlash(): Promise<void> {
    const u = G.renderer.uniforms;
    G.audio.sfx("heartbeat", null, 1);
    G.audio.sfx("whisper");
    const lines = ["hunger.1", "hunger.2", "hunger.3", "hunger.4"];
    this.say(lines[Math.floor(Math.random() * lines.length)]);
    for (let i = 0; i < 30; i++) {
      u.uDistort.value = Math.sin((i / 30) * Math.PI) * 0.7;
      u.uPulse.value = Math.sin((i / 30) * Math.PI) * 0.5;
      await G.game.wait(0.04);
    }
    u.uDistort.value = 0;
  }

  async chapterCard(chapter: number, title: string, sub: string): Promise<void> {
    G.audio.sfx("chapterStart");
    await G.ui.chapterCard(chapter, title, sub);
  }

  /** Wechsel in ein anderes Gebiet mit Abblende. */
  async goTo(levelId: string, spawnId = "start", card?: { chapter: number; title: string; sub: string }): Promise<void> {
    this.busy = true;
    G.player.locked = true;
    await this.fade(1, 1.5);
    if (card) {
      G.state.data.chapter = card.chapter;
      await this.chapterCard(card.chapter, card.title, card.sub);
    }
    await G.levels.load(levelId, spawnId, true);
    this.busy = false;
    G.player.locked = false;
    await this.fade(0, 1.5);
  }
}
