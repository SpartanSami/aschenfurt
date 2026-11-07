import { G } from "../core/Context";
import { events } from "../core/EventBus";
import { ITEMS } from "../story/data/items";
import type { ItemDef } from "../story/types";

export class InventorySystem {
  defs: Record<string, ItemDef> = ITEMS;

  count(id: string): number {
    return G.state.data.inventory[id] ?? 0;
  }

  has(id: string): boolean {
    return this.count(id) > 0;
  }

  name(id: string): string {
    return this.defs[id]?.name ?? id;
  }

  add(id: string, n = 1, silent = false): void {
    if (!this.defs[id]) console.warn("[Inventar] unbekannter Gegenstand", id);
    G.state.data.inventory[id] = this.count(id) + n;
    events.emit("item:added", { itemId: id, count: n });
    if (!silent) {
      G.ui.notify(`Erhalten: ${this.name(id)}${n > 1 ? ` (${n})` : ""}`, "item");
      G.audio.sfx("pickup");
    }
  }

  remove(id: string, n = 1): void {
    const c = this.count(id) - n;
    if (c <= 0) delete G.state.data.inventory[id];
    else G.state.data.inventory[id] = c;
    events.emit("item:removed", { itemId: id, count: n });
  }

  items(): { def: ItemDef; count: number }[] {
    return Object.entries(G.state.data.inventory)
      .filter(([, c]) => c > 0)
      .map(([id, count]) => ({ def: this.defs[id] ?? { id, name: id, desc: "", category: "quest", icon: "quest" }, count }));
  }

  /** Gegenstand benutzen (z. B. Blutphiole). Gibt true zurück, wenn verbraucht. */
  use(id: string): boolean {
    if (!this.has(id)) return false;
    if (id === "blutphiole") {
      if (G.abilities.hunger < 8) {
        G.ui.notify("Du verspürst keinen Durst.", "info");
        return false;
      }
      this.remove(id);
      G.abilities.addHunger(-35);
      G.player.heal(30);
      G.audio.sfx("feed");
      G.ui.notify("Das alte Blut ist bitter. Aber es stillt.", "info");
      G.state.inc("vialsUsed");
      return true;
    }
    if (id === "kraeuterbuendel") {
      this.remove(id);
      G.player.heal(50);
      G.audio.sfx("regen");
      G.ui.notify("Die Kräuter brennen in den Wunden – und schließen sie.", "info");
      return true;
    }
    const doc = this.defs[id];
    if (doc?.category === "dokument") {
      G.story.readDocument(id);
      return false;
    }
    G.ui.notify("Das lässt sich hier nicht benutzen.", "info");
    return false;
  }
}
