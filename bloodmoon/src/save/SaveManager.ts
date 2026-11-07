import { G } from "../core/Context";
import { events } from "../core/EventBus";
import type { GameStateData } from "../core/GameState";

export interface SaveMeta {
  slot: string;
  chapter: number;
  location: string;
  objective: string;
  playTime: number;
  savedAt: number;
}

interface SaveFile {
  meta: SaveMeta;
  state: GameStateData;
}

const PREFIX = "bloodmoon.save.";
export const SLOTS = ["auto", "slot1", "slot2", "slot3"];

/** Speicherstände im lokalen Browserspeicher (bleiben nach Neustart erhalten). */
export class SaveManager {
  available = true;

  constructor() {
    try {
      localStorage.setItem(PREFIX + "test", "1");
      localStorage.removeItem(PREFIX + "test");
    } catch {
      this.available = false;
    }
  }

  private capture(): GameStateData {
    const st = G.state.data;
    const p = G.player;
    st.player.pos = [p.body.pos.x, p.body.pos.y + 0.05, p.body.pos.z];
    st.player.yaw = p.yaw;
    st.player.pitch = p.pitch;
    st.player.health = p.health;
    st.savedAt = Date.now();
    return G.state.snapshot();
  }

  save(slot: string, silent = false): boolean {
    if (!this.available || !G.level) return false;
    const state = this.capture();
    const obj = G.quests.objective();
    const file: SaveFile = {
      meta: {
        slot,
        chapter: state.chapter,
        location: G.level.location,
        objective: obj?.text ?? "",
        playTime: state.playTime,
        savedAt: state.savedAt,
      },
      state,
    };
    try {
      localStorage.setItem(PREFIX + slot, JSON.stringify(file));
      if (!silent) G.ui.notify(slot === "auto" ? "Automatisch gespeichert" : "Spiel gespeichert", "info");
      events.emit("save:done", { slot });
      return true;
    } catch (err) {
      console.error("[Speichern]", err);
      G.ui.notify("Speichern fehlgeschlagen – der Browserspeicher ist voll oder gesperrt.", "warn");
      return false;
    }
  }

  /** Kontrollpunkt (automatisches Speichern an wichtigen Stellen). */
  checkpoint(): void {
    this.save("auto", false);
  }

  read(slot: string): SaveFile | null {
    if (!this.available) return null;
    try {
      const raw = localStorage.getItem(PREFIX + slot);
      if (!raw) return null;
      const f = JSON.parse(raw) as SaveFile;
      if (!f.state || !f.meta) return null;
      return f;
    } catch {
      return null;
    }
  }

  list(): SaveMeta[] {
    return SLOTS.map((s) => this.read(s)?.meta).filter((m): m is SaveMeta => !!m);
  }

  latest(): SaveMeta | null {
    const l = this.list();
    if (!l.length) return null;
    return l.sort((a, b) => b.savedAt - a.savedAt)[0];
  }

  remove(slot: string): void {
    try {
      localStorage.removeItem(PREFIX + slot);
    } catch {
      /* */
    }
  }

  exportSlot(slot: string): string | null {
    const f = this.read(slot);
    return f ? btoa(unescape(encodeURIComponent(JSON.stringify(f)))) : null;
  }

  importSlot(slot: string, data: string): boolean {
    try {
      const f = JSON.parse(decodeURIComponent(escape(atob(data.trim())))) as SaveFile;
      if (!f.state || !f.meta) return false;
      f.meta.slot = slot;
      localStorage.setItem(PREFIX + slot, JSON.stringify(f));
      return true;
    } catch {
      return false;
    }
  }
}

export function formatPlayTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h} Std. ${m} Min.` : `${m} Min.`;
}
