// Speichersystem: automatische Checkpoints (localStorage), Kapitelstarts für die Kapitelauswahl,
// freigeschaltete Kapitel und erreichte Enden. Robust gegen gesperrten/vollen Speicher.
const KEY = 'nwo.save.v1';
const META = 'nwo.meta.v1';

function read(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; } }
function write(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); return true; } catch (e) { console.warn('Speichern fehlgeschlagen', e); return false; } }

export class SaveManager {
  constructor() {
    this.mem = null; // Fallback, falls localStorage nicht verfügbar
    this.metaMem = null;
  }
  get() { return read(KEY) || this.mem; }
  hasSave() { const s = this.get(); return !!(s && s.snapshot); }
  saveSnapshot(snapshot) {
    const s = this.get() || {};
    s.version = 1;
    s.snapshot = snapshot;
    s.updated = Date.now();
    s.chapterStarts = s.chapterStarts || {};
    if (snapshot.checkpoint === 'start' && !s.chapterStarts[snapshot.chapter]) s.chapterStarts[snapshot.chapter] = snapshot;
    if (snapshot.checkpoint === 'start') s.chapterStarts[snapshot.chapter] = snapshot;
    this.mem = s;
    write(KEY, s);
    this.unlock(snapshot.chapter);
  }
  clear() { try { localStorage.removeItem(KEY); } catch (e) { /* */ } this.mem = null; }
  newRun() { const s = { version: 1, snapshot: null, chapterStarts: {}, updated: Date.now() }; this.mem = s; write(KEY, s); }
  chapterStart(id) { const s = this.get(); return s?.chapterStarts?.[id] || null; }
  meta() { return read(META) || this.metaMem || { unlocked: ['ch1'], endings: [], best: {} }; }
  setMeta(m) { this.metaMem = m; write(META, m); }
  unlock(ch) { const m = this.meta(); if (!m.unlocked.includes(ch)) { m.unlocked.push(ch); this.setMeta(m); } }
  addEnding(id) { const m = this.meta(); if (!m.endings.includes(id)) { m.endings.push(id); this.setMeta(m); } }
}
