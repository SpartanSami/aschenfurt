// Storyorientiertes Inventar: Heilmittel werden gezählt, Schlüssel/Storygegenstände als Menge geführt.
import { ITEM_INFO } from '../world/items.js';

export class Inventory {
  constructor() { this.counts = {}; this.keys = new Map(); this.carryLimitMsg = null; }
  reset() { this.counts = {}; this.keys = new Map(); }
  count(type) { return this.counts[type] || 0; }
  canAdd(type) { const info = ITEM_INFO[type]; return !info || !info.max || this.count(type) < info.max; }
  add(type, id = null, name = null) {
    const info = ITEM_INFO[type] || {};
    if (info.kind === 'heal') {
      if (!this.canAdd(type)) return false;
      this.counts[type] = this.count(type) + 1;
      return true;
    }
    this.keys.set(id || type, name || info.name || type);
    return true;
  }
  take(type) { if (this.count(type) <= 0) return false; this.counts[type]--; return true; }
  has(id) { return this.keys.has(id); }
  remove(id) { this.keys.delete(id); }
  name(id) { return this.keys.get(id) || id; }
  healTotal() { return this.count('bandage') + this.count('medkit') + this.count('pills'); }
  serialize() { return { counts: { ...this.counts }, keys: [...this.keys.entries()] }; }
  load(d) { this.counts = { ...(d?.counts || {}) }; this.keys = new Map(d?.keys || []); }
}
