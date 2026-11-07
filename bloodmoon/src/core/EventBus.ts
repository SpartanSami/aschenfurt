// Einfacher, typisierter Event-Bus für lose gekoppelte Systeme.

export interface GameEvents {
  "quest:started": { questId: string };
  "quest:task": { questId: string; taskId: string };
  "quest:completed": { questId: string };
  "quest:failed": { questId: string };
  "item:added": { itemId: string; count: number };
  "item:removed": { itemId: string; count: number };
  "document:read": { docId: string };
  "memory:unlocked": { memoryId: string };
  "ability:unlocked": { abilityId: string };
  "ability:changed": { abilityId: string; active: boolean };
  "relationship:changed": { who: string; delta: number; value: number };
  "decision:made": { id: string; value: string };
  "dialogue:start": { dialogueId: string };
  "dialogue:end": { dialogueId: string };
  "horror:event": { eventId: string };
  "level:loaded": { levelId: string };
  "chapter:start": { chapter: number };
  "player:damaged": { amount: number; health: number };
  "player:died": {};
  "hunger:changed": { value: number };
  "notify": { text: string; kind?: "info" | "quest" | "item" | "memory" | "warn" };
  "save:done": { slot: string };
  "settings:changed": {};
  "ui:modal": { open: boolean };
}

type Handler<T> = (payload: T) => void;

export class EventBus {
  private handlers = new Map<string, Set<Handler<any>>>();

  on<K extends keyof GameEvents>(type: K, fn: Handler<GameEvents[K]>): () => void {
    let set = this.handlers.get(type);
    if (!set) {
      set = new Set();
      this.handlers.set(type, set);
    }
    set.add(fn);
    return () => set!.delete(fn);
  }

  emit<K extends keyof GameEvents>(type: K, payload: GameEvents[K]): void {
    const set = this.handlers.get(type);
    if (!set) return;
    for (const fn of [...set]) {
      try {
        fn(payload);
      } catch (err) {
        console.error(`[EventBus] Fehler in Handler für ${type}`, err);
      }
    }
  }
}

export const events = new EventBus();
