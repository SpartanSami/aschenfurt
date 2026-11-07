import { G } from "../core/Context";
import { events } from "../core/EventBus";
import type { QuestDef } from "../story/types";
import { QUESTS } from "../story/data/quests";

/** Verwaltet Haupt-, Neben-, Charakter- und Rätselquests. */
export class QuestSystem {
  defs: Record<string, QuestDef> = QUESTS;

  private prog(id: string) {
    const d = G.state.data;
    if (!d.quests[id]) d.quests[id] = { status: "inactive", tasks: {} };
    return d.quests[id];
  }

  status(id: string) {
    return G.state.data.quests[id]?.status ?? "inactive";
  }

  isActive(id: string): boolean {
    return this.status(id) === "active";
  }

  isDone(id: string): boolean {
    return this.status(id) === "done";
  }

  taskDone(id: string, task: string): boolean {
    return !!G.state.data.quests[id]?.tasks[task];
  }

  start(id: string, track = true): void {
    const def = this.defs[id];
    if (!def) {
      console.warn("[Quest] unbekannt:", id);
      return;
    }
    const p = this.prog(id);
    if (p.status !== "inactive") return;
    p.status = "active";
    p.startedAt = G.state.data.playTime;
    if (track || !G.state.data.trackedQuest) G.state.data.trackedQuest = id;
    events.emit("quest:started", { questId: id });
    G.ui.notify(`${def.type === "haupt" ? "Hauptquest" : def.type === "charakter" ? "Charakterquest" : def.type === "raetsel" ? "Rätsel" : def.type === "verborgen" ? "Verborgene Entdeckung" : "Nebenquest"}: ${def.title}`, "quest");
    G.ui.hud.refresh();
  }

  /** Aufgabe erledigen (startet die Quest bei Bedarf). */
  task(id: string, task: string, silent = false): void {
    const def = this.defs[id];
    if (!def) return;
    const p = this.prog(id);
    if (p.status === "done" || p.status === "failed") return;
    if (p.status === "inactive") this.start(id, false);
    if (p.tasks[task]) return;
    p.tasks[task] = true;
    const t = def.tasks.find((x) => x.id === task);
    events.emit("quest:task", { questId: id, taskId: task });
    if (t && !silent) G.ui.notify(`✓ ${t.text}`, "quest");
    // automatisch abschließen, wenn alle Pflichtaufgaben erledigt sind
    const required = def.tasks.filter((x) => !x.optional);
    if (required.every((x) => p.tasks[x.id])) this.complete(id);
    G.ui.hud.refresh();
  }

  complete(id: string): void {
    const def = this.defs[id];
    const p = this.prog(id);
    if (p.status === "done") return;
    p.status = "done";
    for (const t of def.tasks) if (!t.optional) p.tasks[t.id] = true;
    events.emit("quest:completed", { questId: id });
    G.ui.notify(`Abgeschlossen: ${def.title}`, "quest");
    G.audio.sfx("questDone");
    if (G.state.data.trackedQuest === id) {
      const next = this.active().find((q) => q.type === "haupt") ?? this.active()[0];
      G.state.data.trackedQuest = next?.id ?? null;
    }
    G.ui.hud.refresh();
  }

  fail(id: string): void {
    const p = this.prog(id);
    if (p.status === "done") return;
    p.status = "failed";
    events.emit("quest:failed", { questId: id });
    G.ui.notify(`Gescheitert: ${this.defs[id]?.title}`, "warn");
    G.ui.hud.refresh();
  }

  active(): QuestDef[] {
    return Object.values(this.defs).filter((q) => this.status(q.id) === "active");
  }

  all(status: string): QuestDef[] {
    return Object.values(this.defs).filter((q) => this.status(q.id) === status);
  }

  objective(): { quest: string; text: string } | null {
    const id = G.state.data.trackedQuest;
    if (!id || !this.isActive(id)) {
      const a = this.active().find((q) => q.type === "haupt");
      if (!a) return null;
      G.state.data.trackedQuest = a.id;
      return this.objective();
    }
    const def = this.defs[id];
    const p = this.prog(id);
    const t = def.tasks.find((x) => !p.tasks[x.id] && !x.hidden && !x.optional) ?? def.tasks.find((x) => !p.tasks[x.id] && !x.hidden);
    return t ? { quest: def.title, text: t.text } : null;
  }
}
