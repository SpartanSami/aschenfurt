import * as THREE from "three";
import { G } from "../core/Context";
import { events } from "../core/EventBus";

export interface HorrorEvent {
  id: string;
  /** Auslösebereich (optional) */
  area?: THREE.Box3;
  /** zusätzliche Bedingung (Questzustand, Flags …) */
  when?: () => boolean;
  /** Spieler muss diesen Punkt ansehen */
  lookAt?: THREE.Vector3;
  lookCos?: number;
  /** Spieler darf diesen Punkt NICHT ansehen (z. B. Statue dreht den Kopf) */
  notLookingAt?: THREE.Vector3;
  /** Mindestzeit im Gebiet (s) */
  minTime?: number;
  /** Wartezeit nach Erfüllung der Bedingung */
  delay?: number;
  /** größeres Ereignis – unterliegt dem Pacing */
  major?: boolean;
  once?: boolean;
  run: () => Promise<void> | void;
}

/**
 * Zentrale Horror-Regie: prüft geskriptete Ereignisse gegen Spielzustand, Ort,
 * Blickrichtung und Zeit und sorgt für dosierte Abstände zwischen Schreckmomenten.
 */
export class HorrorDirector {
  private events: HorrorEvent[] = [];
  private pending = new Map<string, number>();
  private lastMajor = -999;
  private lastMinor = -999;
  private levelTime = 0;
  private tick = 0;
  running = new Set<string>();
  /** Mindestabstand zwischen großen Ereignissen (s) */
  majorGap = 35;
  minorGap = 6;

  register(e: HorrorEvent): void {
    if (e.once !== false && G.state.data.horrorDone[e.id]) return;
    this.events.push(e);
  }

  clear(): void {
    this.events = [];
    this.pending.clear();
    this.running.clear();
    this.levelTime = 0;
  }

  done(id: string): boolean {
    return !!G.state.data.horrorDone[id];
  }

  /** Ereignis sofort auslösen (z. B. aus einem Skript). */
  async fire(id: string): Promise<void> {
    const e = this.events.find((x) => x.id === id);
    if (e) await this.exec(e);
  }

  private async exec(e: HorrorEvent): Promise<void> {
    if (this.running.has(e.id)) return;
    if (e.once !== false) {
      if (G.state.data.horrorDone[e.id]) return;
      G.state.data.horrorDone[e.id] = true;
      this.events = this.events.filter((x) => x !== e);
    }
    this.running.add(e.id);
    if (e.major) this.lastMajor = this.levelTime;
    else this.lastMinor = this.levelTime;
    events.emit("horror:event", { eventId: e.id });
    try {
      await e.run();
    } catch (err) {
      console.error("[Horror]", e.id, err);
    } finally {
      this.running.delete(e.id);
    }
  }

  update(dt: number): void {
    if (!G.running || G.dialogue.active || G.story.busy) return;
    this.levelTime += dt;
    this.tick -= dt;
    if (this.tick > 0) return;
    this.tick = 0.15;
    const p = G.player.position;
    const head = G.camera.position;
    for (const e of [...this.events]) {
      if (this.running.has(e.id)) continue;
      if (e.minTime && this.levelTime < e.minTime) continue;
      if (e.area && !e.area.containsPoint(p)) {
        this.pending.delete(e.id);
        continue;
      }
      if (e.when && !e.when()) continue;
      if (e.lookAt && !G.level!.playerSees(e.lookAt, e.lookCos ?? 0.85)) continue;
      if (e.notLookingAt && G.level!.playerSees(e.notLookingAt, 0.5, false)) continue;
      if (e.major && this.levelTime - this.lastMajor < this.majorGap) continue;
      if (!e.major && this.levelTime - this.lastMinor < this.minorGap) continue;
      if (e.delay) {
        const t0 = this.pending.get(e.id);
        if (t0 === undefined) {
          this.pending.set(e.id, this.levelTime);
          continue;
        }
        if (this.levelTime - t0 < e.delay) continue;
      }
      void head;
      this.exec(e);
    }
  }
}
