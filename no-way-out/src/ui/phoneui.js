// Große Handy-Ansicht für Touch-Geräte.
// Auf einem echten Smartphone ist das 3D-Telefon in Samis Hand zu klein zum Lesen. Deshalb erscheint dort
// dasselbe Telefon als bildschirmfüllende, direkt antippbare Ansicht mit normal großer Schrift. Sie passt sich
// Hoch- und Querformat an, Listen lassen sich mit dem Finger schieben, nichts wird am unteren Rand abgeschnitten.
// Inhalte und Zustand kommen unverändert aus systems/phone.js.
import { APPS } from '../systems/phone.js';
import { HEALTH_STATES } from '../player/player.js';
import { DOCS } from '../data/story/documents.js';
import { drawPhoto } from '../systems/photos.js';

const esc = (t) => String(t ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const TITLES = { home: '', messages: 'Nachrichten', voice: 'Sprachmemos', notes: 'Notizen', photos: 'Fotos', photo: 'Foto', calls: 'Anrufe', status: 'Zustand', map: 'Karte', call: 'Anruf' };

export class PhoneUI {
  constructor(game, root, before) {
    this.game = game; this.phone = game.phone;
    this.el = document.createElement('div');
    this.el.className = 'tphone';
    this.el.innerHTML = `<div class="tp-panel">
      <header class="tp-head"><button class="tp-nav" data-a="back">‹ Zurück</button><b class="tp-title"></b><span class="tp-clock"></span><button class="tp-nav tp-x" data-a="close" aria-label="Handy schließen">✕</button></header>
      <div class="tp-body"></div></div>`;
    root.insertBefore(this.el, before || null);
    this.body = this.el.querySelector('.tp-body');
    this.titleEl = this.el.querySelector('.tp-title');
    this.clockEl = this.el.querySelector('.tp-clock');
    this.backBtn = this.el.querySelector('[data-a=back]');
    this.view = null; this.shown = false; this.mapT = 0;
    this.el.addEventListener('click', (e) => this._click(e));
    // Jede Änderung am Telefon (neue Nachricht, App-Wechsel …) zeichnet auch diese Ansicht neu
    this.phone.onDraw = () => { if (this.shown) this.render(); };
  }

  // Pro Bild: ein-/ausblenden, Karte nachführen
  update(dt) {
    const g = this.game, ph = this.phone;
    // Während eines Anrufs bleibt die Sicht frei (Untertitel lesen)
    if (ph.open && ph.inCall) ph.close();
    const show = ph.open && g.mode === 'play' && !g.docs.isOpen();
    if (show !== this.shown) {
      this.shown = show;
      this.el.classList.toggle('show', show);
      if (show) { this.view = null; this.render(); }
    }
    if (!show) return;
    this.el.classList.toggle('danger', g.threatLevel >= 2.6);
    if (ph.app === 'map') { this.mapT -= dt; if (this.mapT <= 0) { this.mapT = 0.2; this._drawMap(); } }
  }

  _click(e) {
    const ph = this.phone, g = this.game;
    const t = e.target.closest('[data-a],[data-app],[data-thread],[data-voice],[data-doc],[data-photo],[data-tab]');
    if (!t) { if (e.target === this.el) ph.close(); return; }   // Tipp neben das Telefon schließt es
    const d = t.dataset;
    g.audio.unlock && g.audio.unlock();
    if (d.a === 'back') { ph.back(); return; }
    if (d.a === 'close') { ph.close(); g.audio.play('ui', { vol: 0.4, rate: 0.8 }); return; }
    if (d.a === 'zoomin') { g.automap.zoom = Math.min(16, g.automap.zoom + 2); this._drawMap(); return; }
    if (d.a === 'zoomout') { g.automap.zoom = Math.max(4, g.automap.zoom - 2); this._drawMap(); return; }
    if (d.a === 'heal') { ph.close(); g.player.startHeal(); return; }
    if (d.app) { ph.openApp(d.app); this.render(); return; }
    if (d.thread) { ph.threadId = d.thread; ph.app = 'thread'; ph.data.threads[d.thread].unread = 0; ph.dirty = true; g.audio.play('ui', { vol: 0.5 }); this.render(); return; }
    if (d.voice) {
      const v = ph.data.voice[+d.voice]; if (!v) return;
      v.heard = true; ph.dirty = true;
      ph.close();                                   // Sicht frei für die Untertitel der Aufnahme
      g.story.playVoiceMemo(v);
      return;
    }
    if (d.doc) { g.docs.open(d.doc, { fromPhone: true }); return; }
    if (d.photo) { ph.photoId = d.photo; ph.app = 'photo'; ph.dirty = true; this.render(); return; }
    if (d.tab) { ph.notesTab = +d.tab; ph.dirty = true; this.render(); }
  }

  render() {
    const ph = this.phone, g = this.game, D = ph.data;
    let app = ph.app;
    if (app === 'thread' && !D.threads[ph.threadId]) app = ph.app = 'messages';
    const key = app + '|' + (ph.threadId || '') + '|' + (ph.photoId || '') + '|' + ph.notesTab;
    const sameView = key === this.view;
    const keepScroll = sameView ? this.body.scrollTop : 0;
    const atBottom = this.body.scrollHeight - this.body.scrollTop - this.body.clientHeight < 40;
    this.view = key;
    this.titleEl.textContent = app === 'thread' ? D.threads[ph.threadId].name : TITLES[app] ?? '';
    this.clockEl.textContent = ph.clock;
    this.backBtn.style.visibility = app === 'home' ? 'hidden' : '';
    let h = '';
    if (app === 'home') {
      if (D.objective) h += `<div class="tp-obj"><small>AKTUELLES ZIEL</small>${esc(D.objective)}</div>`;
      h += '<div class="tp-apps">';
      for (const a of APPS) {
        let badge = 0, state = '';
        if (a.id === 'messages') badge = ph.unreadTotal();
        if (a.id === 'voice') badge = D.voice.filter((v) => !v.heard).length;
        if (a.id === 'flashlight') state = g.player.flashlight ? 'AN' : 'AUS';
        h += `<button class="tp-app" data-app="${a.id}"><i style="background:${a.color}">${a.icon}${badge ? `<em>${badge}</em>` : ''}</i><span>${a.name}${state ? ` · ${state}` : ''}</span></button>`;
      }
      h += '</div>';
    } else if (app === 'messages') {
      if (!D.order.length) h = '<p class="tp-empty">Keine Nachrichten</p>';
      for (const id of D.order) {
        const t = D.threads[id], last = t.msgs[t.msgs.length - 1];
        h += `<button class="tp-row" data-thread="${esc(id)}"><b>${esc(t.name)}${t.unread ? `<em>${t.unread}</em>` : ''}</b><span>${last ? (last.from === 'me' ? 'Du: ' : '') + esc(last.text) : ''}</span><time>${last ? esc(last.time) : ''}</time></button>`;
      }
    } else if (app === 'thread') {
      const t = D.threads[ph.threadId];
      t.unread = 0;
      h = '<div class="tp-thread">' + t.msgs.map((m, i) => `<div class="tp-msg ${m.from === 'me' ? 'me' : 'them'}${m.old ? ' old' : ''}"><p>${esc(m.text).replace(/\n/g, '<br>')}</p>${m.photo ? `<canvas class="tp-pic" data-pic="${esc(m.photo)}" width="460" height="300"></canvas>` : ''}<time>${esc(m.time)}</time></div>`).join('') + '</div>';
    } else if (app === 'voice') {
      if (!D.voice.length) h = '<p class="tp-empty">Keine Aufnahmen</p>';
      D.voice.forEach((v, i) => { h += `<button class="tp-row" data-voice="${i}"><b>▶ ${esc(v.title)}${v.heard ? '' : '<em>neu</em>'}</b><span>${v.fragment ? 'Aufnahme · ' : ''}${esc(v.from || 'Sprachnachricht')} – antippen zum Abspielen</span><time>${esc(v.time || '')}</time></button>`; });
    } else if (app === 'calls') {
      if (!D.calls.length) h = '<p class="tp-empty">Keine Anrufe</p>';
      for (const k of D.calls) h += `<div class="tp-row${k.kind === 'missed' ? ' red' : ''}"><b>${esc(k.name)}</b><span>${k.kind === 'missed' ? 'Verpasst' : k.kind === 'in' ? 'Eingehend' : 'Ausgehend'}</span><time>${esc(k.time)}</time></div>`;
    } else if (app === 'notes') {
      const tabs = ['Ziel', 'Dokumente', 'Erkenntnisse'];
      h = '<div class="tp-tabs">' + tabs.map((t, i) => `<button data-tab="${i}" class="${i === ph.notesTab ? 'sel' : ''}">${t}</button>`).join('') + '</div>';
      if (ph.notesTab === 0) h += `<p class="tp-text">${esc(D.objective || '—')}</p>`;
      else if (ph.notesTab === 1) {
        if (!D.docs.length) h += '<p class="tp-empty">Noch keine Dokumente gefunden.</p>';
        for (const id of D.docs) h += `<button class="tp-row" data-doc="${esc(id)}"><b>${esc(DOCS[id]?.title || id)}</b><span>${esc(DOCS[id]?.where || '')}</span></button>`;
      } else {
        if (!D.facts.length) h += '<p class="tp-empty">Noch keine Erkenntnisse.</p>';
        h += D.facts.map((f) => `<p class="tp-fact">${esc(f)}</p>`).join('');
      }
    } else if (app === 'photos') {
      if (!D.photos.length) h = '<p class="tp-empty">Keine Fotos</p>';
      else h = '<div class="tp-photos">' + D.photos.map((p) => `<button data-photo="${esc(p.id)}"><canvas class="tp-pic" data-pic="${esc(p.id)}" width="312" height="232"></canvas><span>${esc(p.title)}</span></button>`).join('') + '</div>';
    } else if (app === 'photo') {
      const p = D.photos.find((x) => x.id === ph.photoId);
      if (!p) { ph.app = 'photos'; return this.render(); }
      h = `<canvas class="tp-pic big" data-pic="${esc(p.id)}" width="680" height="460"></canvas><p class="tp-text center"><b>${esc(p.title)}</b><br><small>${esc(p.time)}</small></p>`;
    } else if (app === 'status') {
      const p = g.player, inv = g.inventory, st = p.healthState;
      const keys = [...inv.keys.values()];
      h = `<div class="tp-status ${st}"><b>${HEALTH_STATES[st]}</b><span>${st === 'healthy' ? 'Keine nennenswerten Verletzungen.' : st === 'injured' ? 'Blutende Wunden. Langsamer, kürzer außer Atem.' : 'Kritisch. Ein weiterer Biss kann tödlich sein.'}</span></div>
        <div class="tp-kv"><span>Verbände</span><b>${inv.count('bandage')}</b></div><div class="tp-kv"><span>Erste-Hilfe-Sets</span><b>${inv.count('medkit')}</b></div><div class="tp-kv"><span>Schmerzmittel</span><b>${inv.count('pills')}</b></div>
        ${g.weapon.has ? `<div class="tp-kv"><span>Glock 17 · Munition</span><b>${g.weapon.mag} / ${g.weapon.reserve}</b></div>` : ''}
        ${p.canHeal() ? '<button class="tp-action" data-a="heal">✚ Jetzt heilen</button>' : ''}
        <h4>Gegenstände</h4>${keys.length ? keys.map((k) => `<p class="tp-fact">${esc(k)}</p>`).join('') : '<p class="tp-empty left">—</p>'}
        ${p.carry ? `<p class="tp-text">In der Hand: ${p.carry === 'bottle' ? 'Glasflasche' : 'Blechdose'} (links „Werfen“)</p>` : ''}`;
    } else if (app === 'map') {
      h = `<div class="tp-mapwrap"><canvas class="tp-map"></canvas><div class="tp-zoom"><button data-a="zoomout">−</button><button data-a="zoomin">+</button></div></div>
        <p class="tp-legend"><span class="room"></span><i style="color:#3f9a68">■ offen</i> <i style="color:#c49a2a">■ zu</i> <i style="color:#c04848">■ verschlossen</i> <i style="color:#f2e6a0">● Gegenstand</i></p>`;
    } else if (app === 'call') {
      h = `<p class="tp-empty">📞 ${esc(ph.inCall?.name || ph.incoming?.name || '')}</p>`;
    }
    this.body.innerHTML = h;
    this.body.dataset.app = app;
    // Fotos zeichnen
    for (const c of this.body.querySelectorAll('canvas[data-pic]')) { try { drawPhoto(c.getContext('2d'), c.dataset.pic, 0, 0, c.width, c.height); } catch (e) { /* Foto fehlt */ } }
    if (app === 'map') { this.mapT = 0; this._drawMap(); }
    // Verläufe zeigen das Neueste; sonst bleibt die Leseposition erhalten
    if (app === 'thread') this.body.scrollTop = !sameView || atBottom ? this.body.scrollHeight : keepScroll;
    else this.body.scrollTop = keepScroll;
  }

  _drawMap() {
    const cv = this.body.querySelector('.tp-map'); if (!cv) return;
    const g = this.game, r = cv.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = Math.round(r.width * dpr), H = Math.round(r.height * dpr);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    const c = cv.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.automap.draw(c, 0, 0, r.width, r.height);
    const room = this.body.querySelector('.tp-legend .room');
    if (room) { const t = g.automap.roomName() + ' · erkundet ' + Math.round(g.automap.explored() * 100) + ' %'; if (room.textContent !== t) room.textContent = t; }
  }
}
