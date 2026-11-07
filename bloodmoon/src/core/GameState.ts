// Zentraler, vollständig serialisierbarer Spielzustand.

export type QuestStatus = "inactive" | "active" | "done" | "failed";

export interface QuestProgress {
  status: QuestStatus;
  tasks: Record<string, boolean>;
  startedAt?: number;
}

export interface GameStateData {
  version: number;
  chapter: number;
  levelId: string;
  spawnId: string;
  player: {
    pos: [number, number, number] | null;
    yaw: number;
    pitch: number;
    health: number;
    hunger: number;
  };
  abilities: { unlocked: string[]; selected: string };
  inventory: Record<string, number>;
  quests: Record<string, QuestProgress>;
  trackedQuest: string | null;
  flags: Record<string, boolean | number | string>;
  decisions: Record<string, { value: string; label: string; chapter: number }>;
  relationships: Record<string, number>;
  dialogueSeen: Record<string, number>;
  horrorDone: Record<string, boolean>;
  memories: string[];
  documents: string[];
  people: Record<string, number>; // Person -> Kenntnisstufe
  levelState: Record<string, Record<string, boolean | number | string>>;
  playTime: number;
  savedAt: number;
}

export const STATE_VERSION = 3;

export function createDefaultState(): GameStateData {
  return {
    version: STATE_VERSION,
    chapter: 1,
    levelId: "ch1_drakenfels",
    spawnId: "start",
    player: { pos: null, yaw: 0, pitch: 0, health: 100, hunger: 35 },
    abilities: { unlocked: [], selected: "bloodsight" },
    inventory: {},
    quests: {},
    trackedQuest: null,
    flags: {},
    decisions: {},
    relationships: { mine: 0, bassem: -30, ilyas: -15 },
    dialogueSeen: {},
    horrorDone: {},
    memories: [],
    documents: [],
    people: { sami: 1 },
    levelState: {},
    playTime: 0,
    savedAt: 0,
  };
}

/** Zustand-Container mit bequemen Hilfsfunktionen. */
export class GameState {
  data: GameStateData = createDefaultState();

  reset(): void {
    this.data = createDefaultState();
  }

  load(data: GameStateData): void {
    const def = createDefaultState();
    // Fehlende Felder älterer Speicherstände auffüllen.
    this.data = { ...def, ...data, player: { ...def.player, ...data.player }, abilities: { ...def.abilities, ...data.abilities } };
    this.data.relationships = { ...def.relationships, ...data.relationships };
    this.data.version = STATE_VERSION;
  }

  snapshot(): GameStateData {
    return JSON.parse(JSON.stringify(this.data));
  }

  flag(name: string): boolean | number | string | undefined {
    return this.data.flags[name];
  }

  is(name: string): boolean {
    return !!this.data.flags[name];
  }

  set(name: string, value: boolean | number | string = true): void {
    this.data.flags[name] = value;
  }

  inc(name: string, by = 1): number {
    const v = (Number(this.data.flags[name]) || 0) + by;
    this.data.flags[name] = v;
    return v;
  }

  level(levelId: string): Record<string, boolean | number | string> {
    let ls = this.data.levelState[levelId];
    if (!ls) {
      ls = {};
      this.data.levelState[levelId] = ls;
    }
    return ls;
  }

  rel(who: string): number {
    return this.data.relationships[who] ?? 0;
  }

  decided(id: string): string | undefined {
    return this.data.decisions[id]?.value;
  }

  hasMemory(id: string): boolean {
    return this.data.memories.includes(id);
  }

  hasItem(id: string): boolean {
    return (this.data.inventory[id] ?? 0) > 0;
  }
}
