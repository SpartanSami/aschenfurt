// Story-System: führt die datengetriebenen Kapitel-Skripte aus (Auslöser -> asynchrone Abläufe).
// Wartezeiten laufen über die Spielzeit (pausierbar) und werden beim Laden eines Checkpoints verworfen.
import * as THREE from 'three';
import { Zombie, ZS } from '../ai/zombie.js';
import { bus } from '../core/events.js';

const SPEAKERS = {
  sami: { name: 'Sami', color: '#d8e4f0' },
  mine: { name: 'Mine', color: '#f0a8c8' },
  ilyas: { name: 'İlyas', color: '#a8e0a8' },
  unknown: { name: 'UNBEKANNT', color: '#ff7a6a' },
  pa: { name: 'Durchsage', color: '#9fc8ff' },
  radio: { name: 'Funk', color: '#e8d08a' },
  argus: { name: 'ARGUS', color: '#7fe0e0' },
  fragment: { name: 'Aufnahme', color: '#ffd28a' },
  arendt: { name: 'Dr. Arendt', color: '#c8b8ff' },
  military: { name: 'Lautsprecher', color: '#e8d08a' },
};

class Cancelled extends Error {}

export class Story {
  constructor(game) {
    this.game = game;
    this.entries = [];
    this.waits = [];
    this.gen = 0;
    this.running = new Set();
    this.time = 0;
    this.lineQueue = Promise.resolve();
  }

  load(chapter) {
    this.cancelAll();
    this.chapter = chapter;
    this.entries = (chapter.script || []).map((e, i) => ({ ...e, id: e.id || `${chapter.id}_${i}` }));
    this.ctx = new StoryCtx(this.game, this);
  }
  cancelAll() {
    this.gen++;
    for (const w of this.waits) w.reject(new Cancelled());
    this.waits = [];
    this.running.clear();
    this.lineQueue = Promise.resolve();
  }

  wait(sec) {
    const gen = this.gen;
    return new Promise((resolve, reject) => {
      this.waits.push({ t: this.time + sec, resolve, reject, gen, cond: null });
    });
  }
  waitUntil(fn, timeout = Infinity) {
    const gen = this.gen;
    return new Promise((resolve, reject) => {
      this.waits.push({ t: this.time + timeout, resolve, reject, gen, cond: fn });
    });
  }

  update(dt) {
    this.time += dt;
    const now = this.time;
    for (let i = this.waits.length - 1; i >= 0; i--) {
      const w = this.waits[i];
      let ok = false;
      if (w.cond) { try { ok = w.cond(); } catch (e) { ok = true; } if (!ok && now >= w.t) ok = true; }
      else ok = now >= w.t;
      if (ok) { this.waits.splice(i, 1); w.resolve(); }
    }
    // Bedingungs-Auslöser
    for (const e of this.entries) {
      if (e.when === 'cond' && !this._isDone(e) && !this.running.has(e.id)) {
        let ok = false; try { ok = e.cond(this.ctx); } catch (err) { ok = false; }
        if (ok) this._run(e);
      }
    }
  }

  _isDone(e) { return this.game.state.done.has(e.id); }
  fire(name, data) {
    for (const e of this.entries) {
      const whens = Array.isArray(e.when) ? e.when : [e.when];
      if (!whens.includes(name)) continue;
      if (e.once !== false && (this._isDone(e) || this.running.has(e.id))) continue;
      if (e.if) { let ok = false; try { ok = e.if(this.ctx, data); } catch (err) { console.error(err); } if (!ok) continue; }
      this._run(e, data);
    }
  }
  async _run(e, data) {
    const gen = this.gen;
    this.running.add(e.id);
    if (this.game.debugLog) console.log('[Story]', e.id);
    try {
      await e.do(this.ctx, data);
      if (gen === this.gen) { if (e.once !== false) this.game.state.done.add(e.id); }
    } catch (err) {
      if (!(err instanceof Cancelled)) console.error('[Story] Fehler in', e.id, err);
    } finally {
      if (gen === this.gen) this.running.delete(e.id);
    }
  }

  onEnterZone(id) { this.fire('enter:' + id); }
  onExitZone(id) { this.fire('exit:' + id); }
  onInteract(id, obj) {
    const def = obj?.def || {};
    const handled = this.entries.some((e) => (Array.isArray(e.when) ? e.when : [e.when]).includes('interact:' + id));
    if (def.once !== false && !def.repeat) this.game.state.flags['used:' + id] = true;
    this.fire('interact:' + id, obj);
    if (!handled && def.text) this.game.hud.toast(def.text);
  }
  onEvent(name, data) { this.fire(name, data); }

  // Dialogzeilen nacheinander abspielen (mit Sprachaufnahme, falls vorhanden)
  playLines(lines, o = {}) {
    const run = async () => {
      for (const ln of lines) await this.playLine(ln, o);
    };
    if (o.parallel) return run();
    const p = this.lineQueue.then(run, run);
    this.lineQueue = p.catch(() => {});
    return p;
  }
  async playLine(ln, o = {}) {
    const game = this.game;
    const spk = SPEAKERS[ln.s] || { name: ln.s, color: '#ddd' };
    const name = ln.name || (ln.s === 'unknown' && o.speaker ? o.speaker : spk.name);
    let dur = ln.d ?? Math.max(1.6, ln.t.length * 0.062 + 0.8);
    let h = null;
    if (ln.v) {
      h = await game.audio.playVoice(ln.v, { filter: o.channel === 'phone' || ln.s === 'unknown' ? 'phone' : null, pos: ln.pos || (o.channel === 'pa' ? null : null), reverbSend: o.channel === 'pa' ? 0.9 : 0.2 });
      if (h && h.duration) dur = Math.max(h.duration + 0.25, 1.0);
    }
    if (ln.s === 'mine' || ln.s === 'ilyas') { const n = game.npc(ln.s); if (n) n.say(dur); }
    game.hud.subtitle(name, ln.t, spk.color, dur, o.channel);
    if (!h && (ln.s === 'mine' || ln.s === 'ilyas')) game.audio.play('breath_out', { vol: 0.15, pos: game.npc(ln.s)?.pos ? new THREE.Vector3(game.npc(ln.s).pos.x, 1.5, game.npc(ln.s).pos.z) : null });
    await this.wait(dur + (ln.gap ?? 0.15));
  }

  // Sprachmemo aus dem Telefon abspielen
  playVoiceMemo(v) {
    this.game.phone.close();
    this.playLines(v.lines, { channel: v.fragment ? 'memo' : 'phone', speaker: v.from });
    if (v.fragment) this.fire('memo:' + v.id);
  }
}

// Befehlssatz für Kapitel-Skripte
export class StoryCtx {
  constructor(game, story) { this.game = game; this.story = story; }
  get g() { return this.game; }
  get flags() { return this.game.state.flags; }
  wait(s) { return this.story.wait(s); }
  until(fn, timeout) { return this.story.waitUntil(fn, timeout); }
  say(s, t, o = {}) { return this.story.playLines([{ s, t, ...o }], o); }
  lines(arr, o = {}) { return this.story.playLines(arr, o); }
  flag(k, v = true) { this.game.state.flags[k] = v; this.story.fire('flag:' + k); }
  get(k) { return this.game.state.flags[k]; }
  objective(text) { this.game.phone.setObjective(text); this.game.hud.objective(text); }
  msg(thread, name, text, o = {}) { this.game.phone.receive(thread, name, text, o); }
  oldMsg(thread, name, text, o = {}) { this.game.phone.addMessage(thread, name, text, { ...o, old: true }); }
  call(name, lines, o = {}) { return this.game.phone.incomingCall(name, lines, o); }
  async pa(lines, o = {}) { this.game.audio.play('pa_chime', { vol: 0.7, reverbSend: 1 }); await this.wait(1.6); return this.story.playLines(lines, { channel: 'pa', ...o }); }
  voiceMemo(id, title, lines, o = {}) { this.game.phone.addVoice(id, title, lines, o); }
  doc(id) { return this.game.docs.open(id); }
  give(type, id, name) { this.game.inventory.add(type, id, name); if (name) this.game.hud.pickup(name); }
  take(id) { this.game.inventory.remove(id); }
  fact(text) { this.game.phone.addFact(text); }
  photo(id, title) { this.game.phone.addPhoto(id, title); }
  door(id) { const d = this.game.level.door(id) || this.game.level.door(id + '_a'); if (!d) console.warn('Tür fehlt', id); return d; }
  unlock(id) { const d = this.door(id); if (d) { d.setLocked(false); this.game.state.doors[id] = { ...(this.game.state.doors[id] || {}), locked: false }; } }
  lock(id) { const d = this.door(id); if (d) { d.setLocked(true); this.game.state.doors[id] = { ...(this.game.state.doors[id] || {}), locked: true }; } }
  open(id, o = {}) { const d = this.door(id); if (d) { d.open(o.from || null, { force: true, ...o }); if (o.persist !== false) this.game.state.doors[id] = { ...(this.game.state.doors[id] || {}), open: true }; } }
  close(id, o = {}) { const d = this.door(id); if (d) { d.close({ force: true, ...o }); if (o.persist !== false) this.game.state.doors[id] = { ...(this.game.state.doors[id] || {}), open: false }; } }
  power(group, on) { this.game.level.lights.setPower(group, on); this.game.state.power[group] = on; this.game.level.powerChanged(); }
  lightMode(filter, mode) { this.game.level.lights.setMode(typeof filter === 'function' ? filter : (f) => f.group === filter || f.id === filter, mode); this.game.level.powerChanged(); }
  sound(name, pos, o = {}) { return this.game.audio.play(name, { pos: pos ? new THREE.Vector3(pos[0], pos[1] ?? 1.5, pos[2]) : null, ...o }); }
  loop(id, name, pos, o = {}) { return this.game.audio.loop(id, name, { pos: pos ? new THREE.Vector3(pos[0], pos[1] ?? 1.5, pos[2]) : null, ...o }); }
  stopLoop(id, f) { this.game.audio.stopLoop(id, f); }
  noise(x, z, r, kind = 'event') { this.game.noise.emit(x, z, r, kind); }
  music(level) { this.game.audio.music && this.game.audio.music.setForced(level); }
  sting() { this.game.audio.music && this.game.audio.music.sting(); }
  shake(a) { this.game.player.trauma = Math.min(1, this.game.player.trauma + a); }
  fade(to, s = 1) { this.game.fx.fadeTo(to, s); return this.wait(s); }
  checkpoint(id) { return this.game.checkpoint(id); }
  endChapter(next) { return this.game.endChapter(next); }
  ending(id) { return this.game.playEnding(id); }
  choice(title, options) { return this.game.hud.choice(title, options); }
  look(x, y, z, speed = 1) { this.game.player.forcedLook = { x, y, z, speed }; }
  unlook() { this.game.player.forcedLook = null; }
  lockPlayer(b) { this.game.player.mode = b ? 'locked' : 'normal'; }
  breakGlass(id) { this.game.level.breakGlass(id); this.game.state.flags['glass:' + id] = true; }
  toast(t) { this.game.hud.toast(t); }
  title(a, b) { return this.game.hud.titleCard(a, b); }
  npc(id) { return this.game.npc(id); }
  addNpc(id, x, z, o) { return this.game.addNpc(id, x, z, o); }
  zombie(id) { return this.game.zombies.find((z) => z.id === id && z.alive); }
  spawn(def) {
    const z = new Zombie(this.game, { ...def, id: def.id || 'sz' + Math.floor(Math.random() * 1e6) });
    this.game.zombies.push(z);
    return z;
  }
  chase(ids) { for (const id of ids) { const z = this.zombie(id); if (z) z.forceChase(); } }
  despawn(id) { const z = this.zombie(id); if (z) { z.despawn(); this.game.state.removed.add(id); } }
  wake(id, then = ZS.CHASE) {
    const z = this.zombie(id); if (!z) return;
    const p = this.game.player.pos;
    z.lastKnown = { x: p.x, z: p.z }; z.lastSeenT = z.time; z.noiseTarget = { x: p.x, z: p.z };
    if (z.state === ZS.DORMANT) { z.afterGetup = then; z.setState(ZS.GETUP); } else if (then === ZS.CHASE) z.forceChase();
  }
  inZone(id) { const t = this.game.level.trigger(id); return !!(t && t.inside); }
  playerNear(x, z, r) { const p = this.game.player.pos; return Math.hypot(p.x - x, p.z - z) < r; }
  setClock(t) { this.game.phone.clock = t; this.game.phone.dirty = true; }
  emit(name) { bus.emit(name); this.story.fire(name); }
  fire(name) { this.story.fire(name); }
  rain(on) { this.game.fx.setRain(on); }
  carry(type) { this.game.player.carry = type; this.game.hands.setCarry(type); }
}
