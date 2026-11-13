// Smartphone: physisches Gerät in der Hand, Oberfläche wird auf eine Canvas-Textur gezeichnet.
// Apps: Taschenlampe, Nachrichten, Sprachnachrichten, Notizen (Ziele/Dokumente/Erkenntnisse), Fotos, Anrufe, Status.
// Der Akku ist unbegrenzt (bleibt immer bei 100 %).
import { HEALTH_STATES } from '../player/player.js';
import { DOCS } from '../data/story/documents.js';
import { drawPhoto } from './photos.js';

const W = 360, H = 740;
export const APPS = [
  { id: 'flashlight', name: 'Taschenlampe', icon: '◉', color: '#f2c94c' },
  { id: 'messages', name: 'Nachrichten', icon: '✉', color: '#4caf7a' },
  { id: 'voice', name: 'Sprachmemos', icon: '◖', color: '#e05a5a' },
  { id: 'notes', name: 'Notizen', icon: '≡', color: '#e8b04a' },
  { id: 'photos', name: 'Fotos', icon: '▣', color: '#5a8ae0' },
  { id: 'calls', name: 'Anrufe', icon: '✆', color: '#3ac0a0' },
  { id: 'status', name: 'Zustand', icon: '♥', color: '#c05a8a' },
  { id: 'map', name: 'Karte', icon: '⌖', color: '#7fb0c8' },
];

export class Phone {
  constructor(game) {
    this.game = game;
    this.canvas = document.createElement('canvas');
    this.canvas.width = W; this.canvas.height = H;
    this.ctx = this.canvas.getContext('2d');
    this.open = false;
    this.app = 'home'; this.sel = 0; this.scroll = 0; this.threadId = null; this.photoId = null; this.notesTab = 0;
    this.inCall = null; this.incoming = null;
    this.dirty = true; this.dirtyTex = true;
    this.clock = '04:12';
    this.reset();
  }

  reset() {
    this.data = { threads: {}, order: [], voice: [], calls: [], docs: [], facts: [], photos: [], objective: '' };
  }
  serialize() { return JSON.parse(JSON.stringify(this.data)); }
  load(d) { this.data = JSON.parse(JSON.stringify(d)); for (const k of ['threads', 'order', 'voice', 'calls', 'docs', 'facts', 'photos']) if (!this.data[k]) this.data[k] = k === 'threads' ? {} : []; this.dirty = true; }

  isOpen() { return this.open; }
  toggle() { if (this.game.player.mode === 'grabbed' || this.game.player.mode === 'dead') return; this.open ? this.close() : this.show(); }
  show(app = null) {
    if (!this.game.state.hasPhone) { this.game.hud.toast('Du hast kein Telefon.'); return; }
    this.open = true; this.dirty = true;
    if (app) this.openApp(app);
    this.game.audio.play('ui', { vol: 0.6 });
  }
  close() { this.open = false; this.app = this.app === 'call' ? 'home' : this.app; this.dirty = true; }

  // ---------- Inhalte ----------
  thread(id, name) {
    if (!this.data.threads[id]) { this.data.threads[id] = { name: name || id, msgs: [], unread: 0 }; this.data.order.unshift(id); }
    return this.data.threads[id];
  }
  addMessage(id, name, text, o = {}) {
    const t = this.thread(id, name);
    t.msgs.push({ from: o.me ? 'me' : 'them', text, time: o.time || this.clock, photo: o.photo || null, old: !!o.old });
    if (!o.me && !o.old) {
      t.unread++;
      this.data.order = [id, ...this.data.order.filter((x) => x !== id)];
    }
    this.dirty = true;
  }
  receive(id, name, text, o = {}) {
    this.addMessage(id, name, text, o);
    if (o.photo && !this.data.photos.find((p) => p.id === o.photo)) this.data.photos.unshift({ id: o.photo, title: o.photoTitle || 'Empfangenes Bild', time: this.clock });
    this.game.audio.play('vibrate', { vol: 0.7, reverb: false });
    this.game.audio.play('notify', { vol: 0.25, reverb: false, delay: 0.1 });
    this.game.hud.notify(name, text.length > 60 ? text.slice(0, 58) + '…' : text);
    this.game.noise.emit(this.game.player.pos.x, this.game.player.pos.z, 1.6, 'phone');
  }
  addVoice(id, title, lines, o = {}) {
    if (this.data.voice.find((v) => v.id === id)) return;
    this.data.voice.unshift({ id, title, lines, time: o.time || this.clock, heard: false, from: o.from || '', fragment: !!o.fragment });
    this.dirty = true;
  }
  addCall(name, kind, time) { this.data.calls.unshift({ name, kind, time: time || this.clock }); this.dirty = true; }
  addDoc(id) { if (!this.data.docs.includes(id)) { this.data.docs.unshift(id); this.dirty = true; } }
  addFact(text) { if (!this.data.facts.includes(text)) { this.data.facts.push(text); this.dirty = true; this.game.hud.toast('Neue Erkenntnis in „Notizen“'); } }
  addPhoto(id, title) { if (!this.data.photos.find((p) => p.id === id)) { this.data.photos.unshift({ id, title, time: this.clock }); this.dirty = true; } }
  setObjective(text) { this.data.objective = text; this.dirty = true; }
  unreadTotal() { return Object.values(this.data.threads).reduce((a, t) => a + t.unread, 0); }

  // Anrufe: Promise wird nach dem Gespräch (oder verpasst) aufgelöst
  incomingCall(name, lines, o = {}) {
    return new Promise((resolve) => {
      this.incoming = { name, lines, o, resolve, t: 0, timeout: o.timeout ?? 14 };
      this.game.hud.callBanner(name);
      this.ringH = this.game.audio.play(o.ring ? 'ring' : 'vibrate', { loop: true, vol: o.ring ? 0.5 : 0.7, reverb: false });
      if (o.ring) this.game.noise.emit(this.game.player.pos.x, this.game.player.pos.z, 9, 'phone');
      this.dirty = true;
    });
  }
  answer() {
    const c = this.incoming;
    if (!c) return;
    this.incoming = null;
    if (this.ringH) this.ringH.stop(0.05);
    this.game.hud.callBanner(null);
    this.inCall = { name: c.name, t: 0 };
    this.app = 'call'; this.dirty = true;
    this.addCall(c.name, 'in');
    this.game.story.playLines(c.lines, { channel: 'phone', speaker: c.name }).then(() => {
      this.inCall = null; this.app = 'home'; this.dirty = true;
      this.game.audio.play('ui', { vol: 0.5 });
      c.resolve('answered');
    });
  }
  _miss() {
    const c = this.incoming;
    this.incoming = null;
    if (this.ringH) this.ringH.stop(0.05);
    this.game.hud.callBanner(null);
    this.addCall(c.name, 'missed');
    this.addVoice('vm_' + Date.now(), 'Mailbox: ' + c.name, c.lines, { from: c.name });
    this.game.hud.notify(c.name, 'Neue Sprachnachricht');
    c.resolve('missed');
  }

  // ---------- Bedienung ----------
  openApp(id) {
    if (id === 'flashlight') { this.game.player.toggleFlashlight(); this.dirty = true; return; }
    this.app = id; this.sel = 0; this.scroll = 0; this.dirty = true;
    this.game.audio.play('ui', { vol: 0.5 });
  }
  back() {
    this.game.audio.play('ui', { vol: 0.4, rate: 0.8 });
    if (this.app === 'thread') { this.app = 'messages'; this.sel = 0; }
    else if (this.app === 'photo') { this.app = 'photos'; }
    else if (this.app === 'home') { this.close(); }
    else { this.app = 'home'; this.sel = APPS.findIndex((a) => a.id === this.app) || 0; }
    this.scroll = 0; this.dirty = true;
  }

  update(dt, input) {
    if (this.incoming) {
      this.incoming.t += dt;
      if (input.pressed('interact') || input.pressed('phone')) { input.consume('interact'); input.consume('phone'); this.answer(); return; }
      if (this.incoming && this.incoming.t > this.incoming.timeout) this._miss();
    }
    if (this.inCall) { this.inCall.t += dt; if (Math.floor(this.inCall.t) !== this._lastSec) { this._lastSec = Math.floor(this.inCall.t); this.dirty = true; } }
    const pm = this.game.player.mode;
    if (input.pressed('phone') && pm !== 'grabbed' && pm !== 'dead' && pm !== 'vault' && !this.inCall) { input.consume('phone'); this.toggle(); }
    if (!this.open) { if (this.dirty) this.draw(); return; }
    // Navigation
    const up = input.pressed('forward') || input.wheel < 0, down = input.pressed('back') || input.wheel > 0;
    const left = input.pressed('left'), right = input.pressed('right');
    const ok = input.pressed('interact') || input.rawPressed('Mouse0');
    const bk = input.rawPressed('Backspace') || input.rawPressed('Mouse2') || input.pressed('crouch');
    if (bk) { this.back(); }
    else if (this.app === 'home') {
      const cols = 2;
      if (up) this.sel = Math.max(0, this.sel - cols);
      if (down) this.sel = Math.min(APPS.length - 1, this.sel + cols);
      if (left) this.sel = Math.max(0, this.sel - 1);
      if (right) this.sel = Math.min(APPS.length - 1, this.sel + 1);
      if (up || down || left || right) { this.dirty = true; this.game.audio.play('ui', { vol: 0.25, rate: 1.4 }); }
      if (ok) this.openApp(APPS[this.sel].id);
    } else if (['messages', 'voice', 'photos', 'calls', 'notes'].includes(this.app)) {
      const n = this._listLen();
      if (this.app === 'notes' && (left || right)) { this.notesTab = (this.notesTab + (right ? 1 : 2)) % 3; this.sel = 0; this.dirty = true; }
      if (up) { this.sel = Math.max(0, this.sel - 1); this.dirty = true; }
      if (down) { this.sel = Math.min(Math.max(0, n - 1), this.sel + 1); this.dirty = true; }
      if (ok && n > 0) this._select();
    } else if (this.app === 'map') {
      const am = this.game.automap;
      if (left) { am.zoom = Math.max(4, am.zoom - 2); this.dirty = true; }
      if (right) { am.zoom = Math.min(13, am.zoom + 2); this.dirty = true; }
      // Karte läuft mit, solange sie offen ist
      this._mapT = (this._mapT || 0) - dt;
      if (this._mapT <= 0) { this._mapT = 0.15; this.dirty = true; }
    } else if (this.app === 'thread' || this.app === 'status') {
      if (up) { this.scroll = Math.max(0, this.scroll - 60); this.dirty = true; }
      if (down) { this.scroll += 60; this.dirty = true; }
    }
    input.consume('interact'); input.consume('crouch'); input.consume('heal');
    if (this.dirty) this.draw();
  }
  _listLen() {
    const d = this.data;
    if (this.app === 'messages') return d.order.length;
    if (this.app === 'voice') return d.voice.length;
    if (this.app === 'photos') return d.photos.length;
    if (this.app === 'calls') return d.calls.length;
    if (this.app === 'notes') return this.notesTab === 1 ? d.docs.length : this.notesTab === 2 ? d.facts.length : 0;
    return 0;
  }
  _select() {
    const d = this.data;
    if (this.app === 'messages') {
      this.threadId = d.order[this.sel]; this.app = 'thread'; this.scroll = 99999;
      d.threads[this.threadId].unread = 0; this.dirty = true;
    } else if (this.app === 'voice') {
      const v = d.voice[this.sel]; v.heard = true; this.dirty = true;
      this.game.story.playVoiceMemo(v);
    } else if (this.app === 'photos') { this.photoId = d.photos[this.sel].id; this.app = 'photo'; this.dirty = true; }
    else if (this.app === 'notes' && this.notesTab === 1) { this.game.docs.open(d.docs[this.sel], { fromPhone: true }); }
  }

  // ---------- Zeichnen ----------
  draw() {
    this.dirty = false; this.dirtyTex = true;
    if (this.onDraw) { try { this.onDraw(); } catch (e) { console.error(e); } }
    const c = this.ctx;
    c.fillStyle = '#07090c'; c.fillRect(0, 0, W, H);
    this._wallpaper(c);
    this._status(c);
    if (this.inCall || this.app === 'call') this._drawCall(c);
    else if (!this.open) this._lock(c);
    else if (this.app === 'home') this._home(c);
    else if (this.app === 'messages') this._list(c, 'Nachrichten', this.data.order.map((id) => { const t = this.data.threads[id]; const last = t.msgs[t.msgs.length - 1]; return { title: t.name, sub: last ? (last.from === 'me' ? 'Du: ' : '') + last.text : '', badge: t.unread, right: last ? last.time : '' }; }), 'Keine Nachrichten');
    else if (this.app === 'thread') this._thread(c);
    else if (this.app === 'voice') this._list(c, 'Sprachmemos', this.data.voice.map((v) => ({ title: v.title, sub: (v.fragment ? 'Aufnahme · ' : '') + (v.from || 'Sprachnachricht'), right: v.time, badge: v.heard ? 0 : '●' })), 'Keine Aufnahmen');
    else if (this.app === 'calls') this._list(c, 'Anrufe', this.data.calls.map((k) => ({ title: k.name, sub: k.kind === 'missed' ? 'Verpasst' : k.kind === 'in' ? 'Eingehend' : 'Ausgehend', right: k.time, red: k.kind === 'missed' })), 'Keine Anrufe');
    else if (this.app === 'photos') this._photos(c);
    else if (this.app === 'photo') this._photo(c);
    else if (this.app === 'notes') this._notes(c);
    else if (this.app === 'status') this._statusApp(c);
    else if (this.app === 'map') this._mapApp(c);
    if (this.open && this.app !== 'call') {
      c.fillStyle = 'rgba(255,255,255,0.35)'; c.font = '13px sans-serif'; c.textAlign = 'center';
      c.fillText(this.app === 'home' ? 'WASD wählen · E öffnen · Q schließen' : this.app === 'map' ? 'A/D zoomen · C/Rücktaste zurück' : 'W/S · E wählen · C/Rücktaste zurück', W / 2, H - 22);
      c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(W / 2 - 55, H - 12, 110, 4);
    }
  }
  _wallpaper(c) {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0d141c'); g.addColorStop(1, '#05070a');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
  _status(c) {
    c.fillStyle = '#e8ecf0'; c.font = 'bold 15px sans-serif'; c.textAlign = 'left';
    c.fillText(this.clock, 22, 28);
    c.textAlign = 'right'; c.font = '12px sans-serif';
    c.fillText('Kein Netz  ·  WLAN: ARGUS-GAST  ·  100 %', W - 18, 27);
    c.strokeStyle = '#e8ecf0'; c.lineWidth = 1.2;
  }
  _lock(c) {
    c.textAlign = 'center'; c.fillStyle = '#e8ecf0';
    c.font = '200 76px sans-serif'; c.fillText(this.clock, W / 2, 190);
    c.font = '16px sans-serif'; c.fillStyle = '#9aa6b2'; c.fillText(this.game.storyDate || 'Donnerstag, 13. November', W / 2, 222);
    if (this.game.player.flashlight) {
      c.fillStyle = 'rgba(242,201,76,0.9)'; c.beginPath(); c.arc(W / 2, 470, 44, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#1a1405'; c.font = 'bold 15px sans-serif'; c.fillText('LICHT AN', W / 2, 476);
    }
    const n = this.unreadTotal();
    if (n) { c.fillStyle = 'rgba(255,255,255,0.12)'; this._rr(c, 24, 260, W - 48, 64, 14); c.fill(); c.fillStyle = '#e8ecf0'; c.font = '15px sans-serif'; c.fillText(`${n} neue Nachricht${n > 1 ? 'en' : ''}`, W / 2, 298); }
  }
  _home(c) {
    c.textAlign = 'center';
    const obj = this.data.objective;
    if (obj) { c.fillStyle = 'rgba(255,255,255,0.08)'; this._rr(c, 20, 52, W - 40, 70, 14); c.fill(); c.fillStyle = '#9aa6b2'; c.font = '12px sans-serif'; c.fillText('AKTUELLES ZIEL', W / 2, 74); c.fillStyle = '#e8ecf0'; c.font = '15px sans-serif'; this._wrap(c, obj, W / 2, 96, W - 70, 18, 'center', 2); }
    APPS.forEach((a, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 40 + col * 150, y = 150 + row * 128;
      const selected = i === this.sel;
      c.fillStyle = selected ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.04)';
      this._rr(c, x - 10, y - 10, 150, 116, 18); c.fill();
      c.fillStyle = a.color; this._rr(c, x + 32, y, 66, 66, 16); c.fill();
      c.fillStyle = '#0b0d10'; c.font = 'bold 34px sans-serif'; c.fillText(a.icon, x + 65, y + 46);
      c.fillStyle = '#e8ecf0'; c.font = '14px sans-serif'; c.fillText(a.name, x + 65, y + 90);
      let badge = 0;
      if (a.id === 'messages') badge = this.unreadTotal();
      if (a.id === 'voice') badge = this.data.voice.filter((v) => !v.heard).length;
      if (a.id === 'flashlight' && this.game.player.flashlight) { c.fillStyle = '#f2c94c'; c.font = 'bold 11px sans-serif'; c.fillText('AN', x + 65, y + 104); }
      if (badge) { c.fillStyle = '#e53935'; c.beginPath(); c.arc(x + 96, y + 4, 12, 0, Math.PI * 2); c.fill(); c.fillStyle = '#fff'; c.font = 'bold 13px sans-serif'; c.fillText(String(badge), x + 96, y + 9); }
    });
  }
  _mapApp(c) {
    const am = this.game.automap;
    this._header(c, 'Karte');
    c.textAlign = 'right'; c.fillStyle = '#8a96a2'; c.font = '13px sans-serif';
    c.fillText(this._clip(c, am.roomName(), 190), W - 22, 76);
    c.save(); this._rr(c, 12, 96, W - 24, 590, 14); c.clip();
    am.draw(c, 12, 96, W - 24, 590);
    c.restore();
    c.textAlign = 'left'; c.fillStyle = '#6a7682'; c.font = '12px sans-serif';
    c.fillText('Erkundet: ' + Math.round(am.explored() * 100) + ' %', 22, 704);
    c.fillStyle = '#3f9a68'; c.fillText('■ offen', 146, 704); c.fillStyle = '#c49a2a'; c.fillText('■ zu', 202, 704); c.fillStyle = '#c04848'; c.fillText('■ verschlossen', 240, 704);
  }
  _header(c, title) {
    c.textAlign = 'left'; c.fillStyle = '#e8ecf0'; c.font = 'bold 26px sans-serif'; c.fillText(title, 22, 78);
  }
  _list(c, title, rows, empty) {
    this._header(c, title);
    if (!rows.length) { c.fillStyle = '#6a7682'; c.font = '15px sans-serif'; c.textAlign = 'center'; c.fillText(empty, W / 2, 200); return; }
    const top = 100, rh = 74;
    const first = Math.max(0, this.sel - 6);
    rows.slice(first, first + 8).forEach((r, k) => {
      const i = first + k, y = top + k * rh;
      if (i === this.sel) { c.fillStyle = 'rgba(255,255,255,0.12)'; this._rr(c, 12, y, W - 24, rh - 6, 12); c.fill(); }
      c.textAlign = 'left'; c.fillStyle = r.red ? '#ff6b6b' : '#e8ecf0'; c.font = 'bold 16px sans-serif';
      c.fillText(this._clip(c, r.title, 230), 26, y + 28);
      c.fillStyle = '#8a96a2'; c.font = '13px sans-serif'; c.fillText(this._clip(c, r.sub || '', 280), 26, y + 50);
      if (r.right) { c.textAlign = 'right'; c.fillStyle = '#6a7682'; c.font = '12px sans-serif'; c.fillText(r.right, W - 26, y + 28); }
      if (r.badge) { c.fillStyle = '#e53935'; c.beginPath(); c.arc(W - 36, y + 46, 9, 0, Math.PI * 2); c.fill(); c.fillStyle = '#fff'; c.font = 'bold 11px sans-serif'; c.textAlign = 'center'; c.fillText(String(r.badge), W - 36, y + 50); }
    });
  }
  _thread(c) {
    const t = this.data.threads[this.threadId];
    if (!t) { this.app = 'messages'; return; }
    c.fillStyle = 'rgba(255,255,255,0.06)'; c.fillRect(0, 40, W, 56);
    c.textAlign = 'center'; c.fillStyle = '#e8ecf0'; c.font = 'bold 18px sans-serif'; c.fillText(t.name, W / 2, 75);
    // Layout berechnen
    c.font = '15px sans-serif';
    const items = [];
    let y = 0;
    for (const m of t.msgs) {
      const lines = this._lines(c, m.text, 220);
      const h = lines.length * 20 + 22 + (m.photo ? 150 : 0);
      items.push({ m, lines, y, h });
      y += h + 12;
    }
    const viewTop = 106, viewH = H - viewTop - 50;
    const maxScroll = Math.max(0, y - viewH);
    this.scroll = Math.min(this.scroll, maxScroll);
    c.save(); c.beginPath(); c.rect(0, viewTop, W, viewH); c.clip();
    for (const it of items) {
      const yy = viewTop + it.y - this.scroll;
      if (yy > H || yy + it.h < viewTop) continue;
      const me = it.m.from === 'me';
      const bw = Math.min(250, Math.max(...it.lines.map((l) => c.measureText(l).width)) + 28);
      const x = me ? W - bw - 16 : 16;
      c.fillStyle = me ? '#2f6fd6' : (it.m.old ? '#1d242c' : '#26303a');
      this._rr(c, x, yy, bw, it.h, 16); c.fill();
      c.fillStyle = '#eef2f6'; c.textAlign = 'left';
      it.lines.forEach((l, i) => c.fillText(l, x + 14, yy + 24 + i * 20));
      if (it.m.photo) drawPhoto(c, it.m.photo, x + 10, yy + it.lines.length * 20 + 18, bw - 20, 130);
      c.fillStyle = 'rgba(255,255,255,0.45)'; c.font = '10px sans-serif'; c.textAlign = 'right';
      c.fillText(it.m.time, x + bw - 10, yy + it.h - 6);
      c.font = '15px sans-serif';
    }
    c.restore();
  }
  _photos(c) {
    this._header(c, 'Fotos');
    const ps = this.data.photos;
    if (!ps.length) { c.fillStyle = '#6a7682'; c.font = '15px sans-serif'; c.textAlign = 'center'; c.fillText('Keine Fotos', W / 2, 200); return; }
    ps.slice(0, 8).forEach((p, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 18 + col * 166, y = 100 + row * 150;
      drawPhoto(c, p.id, x, y, 156, 116);
      if (i === this.sel) { c.strokeStyle = '#fff'; c.lineWidth = 3; c.strokeRect(x - 2, y - 2, 160, 120); }
      c.fillStyle = '#9aa6b2'; c.font = '11px sans-serif'; c.textAlign = 'left'; c.fillText(this._clip(c, p.title, 150), x, y + 132);
    });
  }
  _photo(c) {
    const p = this.data.photos.find((x) => x.id === this.photoId);
    if (!p) { this.app = 'photos'; return; }
    drawPhoto(c, p.id, 10, 140, W - 20, 340);
    c.fillStyle = '#e8ecf0'; c.font = 'bold 17px sans-serif'; c.textAlign = 'center'; this._wrap(c, p.title, W / 2, 520, W - 50, 22, 'center', 3);
    c.fillStyle = '#6a7682'; c.font = '12px sans-serif'; c.fillText(p.time, W / 2, 600);
  }
  _notes(c) {
    this._header(c, 'Notizen');
    const tabs = ['Ziel', 'Dokumente', 'Erkenntnisse'];
    tabs.forEach((t, i) => { c.fillStyle = i === this.notesTab ? '#e8b04a' : 'rgba(255,255,255,0.08)'; this._rr(c, 16 + i * 112, 92, 104, 32, 10); c.fill(); c.fillStyle = i === this.notesTab ? '#1a1205' : '#c8d0d8'; c.font = 'bold 13px sans-serif'; c.textAlign = 'center'; c.fillText(t, 68 + i * 112, 113); });
    c.textAlign = 'left';
    if (this.notesTab === 0) {
      c.fillStyle = '#e8ecf0'; c.font = '17px sans-serif'; this._wrap(c, this.data.objective || '—', 24, 170, W - 48, 24, 'left', 8);
      c.fillStyle = '#6a7682'; c.font = '12px sans-serif'; c.fillText('A/D: Reiter wechseln', 24, H - 50);
    } else if (this.notesTab === 1) {
      const docs = this.data.docs;
      if (!docs.length) { c.fillStyle = '#6a7682'; c.font = '15px sans-serif'; c.fillText('Noch keine Dokumente gefunden.', 24, 180); return; }
      const first = Math.max(0, this.sel - 7);
      docs.slice(first, first + 9).forEach((id, k) => {
        const i = first + k, y = 140 + k * 56;
        if (i === this.sel) { c.fillStyle = 'rgba(255,255,255,0.12)'; this._rr(c, 12, y, W - 24, 50, 10); c.fill(); }
        c.fillStyle = '#e8ecf0'; c.font = 'bold 14px sans-serif'; c.fillText(this._clip(c, DOCS[id]?.title || id, 300), 24, y + 22);
        c.fillStyle = '#8a96a2'; c.font = '12px sans-serif'; c.fillText(this._clip(c, DOCS[id]?.where || '', 300), 24, y + 40);
      });
    } else {
      const f = this.data.facts;
      if (!f.length) { c.fillStyle = '#6a7682'; c.font = '15px sans-serif'; c.fillText('Noch keine Erkenntnisse.', 24, 180); return; }
      let y = 160;
      const first = Math.max(0, this.sel - 3);
      for (let i = first; i < f.length && y < H - 70; i++) {
        c.fillStyle = i === this.sel ? '#e8b04a' : '#5a6672'; c.fillRect(20, y - 13, 3, 16);
        c.fillStyle = '#d8dee4'; c.font = '14px sans-serif';
        y = this._wrap(c, f[i], 32, y, W - 56, 19, 'left', 6) + 14;
      }
    }
  }
  _statusApp(c) {
    this._header(c, 'Zustand');
    const p = this.game.player, inv = this.game.inventory;
    const st = p.healthState;
    const col = st === 'healthy' ? '#5ad08a' : st === 'injured' ? '#e8b04a' : '#e05a5a';
    c.fillStyle = col; c.font = 'bold 24px sans-serif'; c.textAlign = 'left'; c.fillText(HEALTH_STATES[st], 24, 130);
    c.fillStyle = '#8a96a2'; c.font = '13px sans-serif';
    c.fillText(st === 'healthy' ? 'Keine nennenswerten Verletzungen.' : st === 'injured' ? 'Blutende Wunden. Langsamer, kürzer außer Atem.' : 'Kritisch. Ein weiterer Biss kann tödlich sein.', 24, 154);
    const rows = [['Verbände', inv.count('bandage')], ['Erste-Hilfe-Sets', inv.count('medkit')], ['Schmerzmittel', inv.count('pills')]];
    rows.forEach(([n, v], i) => { const y = 200 + i * 40; c.fillStyle = 'rgba(255,255,255,0.06)'; this._rr(c, 16, y, W - 32, 34, 8); c.fill(); c.fillStyle = '#e8ecf0'; c.font = '15px sans-serif'; c.fillText(n, 28, y + 23); c.textAlign = 'right'; c.fillText(String(v), W - 30, y + 23); c.textAlign = 'left'; });
    c.fillStyle = '#9aa6b2'; c.font = '12px sans-serif'; c.fillText('[H] heilen – verbraucht das passende Heilmittel', 24, 340);
    c.fillStyle = '#e8ecf0'; c.font = 'bold 15px sans-serif'; c.fillText('Gegenstände', 24, 386);
    const keys = [...inv.keys.values()];
    c.font = '14px sans-serif'; c.fillStyle = '#c8d0d8';
    if (!keys.length) c.fillText('—', 24, 412);
    keys.slice(0, 10).forEach((k, i) => c.fillText('• ' + k, 24, 412 + i * 22));
    if (p.carry) { c.fillStyle = '#e8b04a'; c.fillText('In der Hand: ' + (p.carry === 'bottle' ? 'Glasflasche' : 'Blechdose') + ' [G/Linksklick werfen]', 24, 660); }
  }
  _drawCall(c) {
    const call = this.inCall || { name: this.incoming?.name || '', t: 0 };
    c.textAlign = 'center';
    c.fillStyle = '#1b2530'; c.beginPath(); c.arc(W / 2, 220, 70, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#6a7682'; c.font = 'bold 60px sans-serif'; c.fillText('?', W / 2, 242);
    c.fillStyle = '#e8ecf0'; c.font = 'bold 26px sans-serif'; c.fillText(call.name, W / 2, 340);
    const s = Math.floor(call.t); c.fillStyle = '#8a96a2'; c.font = '16px sans-serif';
    c.fillText(this.inCall ? `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` : 'Eingehender Anruf', W / 2, 370);
    c.fillStyle = '#e53935'; c.beginPath(); c.arc(W / 2, 610, 34, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff'; c.font = 'bold 26px sans-serif'; c.fillText('✆', W / 2, 620);
  }

  // ---------- Text-Helfer ----------
  _rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  _clip(c, t, w) { if (c.measureText(t).width <= w) return t; while (t.length > 1 && c.measureText(t + '…').width > w) t = t.slice(0, -1); return t + '…'; }
  _lines(c, text, w) {
    const out = [];
    for (const para of String(text).split('\n')) {
      let line = '';
      for (const word of para.split(' ')) {
        const tryL = line ? line + ' ' + word : word;
        if (c.measureText(tryL).width > w && line) { out.push(line); line = word; } else line = tryL;
      }
      out.push(line);
    }
    return out;
  }
  _wrap(c, text, x, y, w, lh, align = 'left', max = 99) {
    c.textAlign = align;
    const lines = this._lines(c, text, w).slice(0, max);
    lines.forEach((l, i) => c.fillText(l, x, y + i * lh));
    return y + (lines.length - 1) * lh;
  }
}
