// Minimaler Event-Bus für lose Kopplung zwischen Systemen.
export class EventBus {
  constructor() { this.map = new Map(); }
  on(name, fn) {
    if (!this.map.has(name)) this.map.set(name, new Set());
    this.map.get(name).add(fn);
    return () => this.off(name, fn);
  }
  off(name, fn) { const s = this.map.get(name); if (s) s.delete(fn); }
  emit(name, ...args) {
    const s = this.map.get(name);
    if (!s) return;
    for (const fn of [...s]) {
      try { fn(...args); } catch (e) { console.error('[Event]', name, e); }
    }
  }
  clear() { this.map.clear(); }
}

export const bus = new EventBus();
