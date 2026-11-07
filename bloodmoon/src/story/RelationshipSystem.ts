import { G } from "../core/Context";
import { events } from "../core/EventBus";

const NAMES: Record<string, string> = { mine: "Mine", bassem: "Bassem", ilyas: "İlyas" };

/** Beziehungen zu den Hauptfiguren (-100 Feindschaft … +100 tiefes Vertrauen). */
export class RelationshipSystem {
  get(who: string): number {
    return G.state.rel(who);
  }

  change(who: string, delta: number, silent = false): void {
    const v = Math.max(-100, Math.min(100, this.get(who) + delta));
    G.state.data.relationships[who] = v;
    events.emit("relationship:changed", { who, delta, value: v });
    if (!silent && Math.abs(delta) >= 5) {
      const name = NAMES[who] ?? who;
      G.ui.notify(delta > 0 ? `${name} wird sich daran erinnern.` : `${name} wird das nicht vergessen.`, "info");
    }
  }

  label(who: string): string {
    const v = this.get(who);
    if (v <= -60) return "Feindschaft";
    if (v <= -25) return "Misstrauen";
    if (v < 10) return "Vorsicht";
    if (v < 40) return "Respekt";
    if (v < 70) return "Vertrauen";
    return "Tiefe Verbundenheit";
  }

  trusts(who: string, threshold = 25): boolean {
    return this.get(who) >= threshold;
  }
}
