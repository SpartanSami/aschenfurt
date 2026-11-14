// Minimalistisches HUD: Interaktionshinweise, Untertitel, Benachrichtigungen, Ausdauer, Zustand,
// Losreißen-Anzeige, Entscheidungen, Kapitel-Titel. Alles dezent und nur bei Bedarf sichtbar.
import { HEALTH_STATES } from '../player/player.js';
import { Input } from '../core/input.js';

const el = (tag, cls, parent, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (parent) parent.appendChild(e); return e; };

export class HUD {
  constructor(game, root) {
    this.game = game;
    this.root = el('div', 'hud', root);
    this.cross = el('div', 'hud-cross', this.root);
    this.prompt = el('div', 'hud-prompt', this.root);
    this.hold = el('div', 'hud-hold', this.root, '<svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15" class="bg"/><circle cx="18" cy="18" r="15" class="fg"/></svg>');
    this.holdFg = this.hold.querySelector('.fg');
    this.subs = el('div', 'hud-subs', this.root);
    this.toasts = el('div', 'hud-toasts', this.root);
    this.obj = el('div', 'hud-objective', this.root);
    this.notif = el('div', 'hud-notif', this.root);
    // Dezente Daueranzeige: Gesundheit, Ausdauer, Heilmittel
    this.vitals = el('div', 'hud-vitals', this.root, '<div class="v-row v-hp"><i>♥</i><div class="v-bar"><div></div></div></div><div class="v-row v-st"><i>⚡</i><div class="v-bar"><div></div></div></div><div class="v-meds"></div>');
    this.hpBar = this.vitals.querySelector('.v-hp .v-bar > div');
    this.stBar = this.vitals.querySelector('.v-st .v-bar > div');
    this.stWrap = this.vitals.querySelector('.v-st .v-bar');
    this.medsEl = this.vitals.querySelector('.v-meds');
    this.vitT = 0;
    this.status = el('div', 'hud-status', this.root);
    this.breath = el('div', 'hud-breath', this.root, '<span>Atem</span><div><div></div></div>');
    this.breathBar = this.breath.querySelector('div > div');
    this.qte = el('div', 'hud-qte', this.root);
    this.choiceEl = el('div', 'hud-choice', this.root);
    this.titleEl = el('div', 'hud-title', this.root);
    this.saveEl = el('div', 'hud-save', this.root, '◌ Fortschritt gespeichert');
    this.callEl = el('div', 'hud-call', this.root);
    this.camEl = el('div', 'hud-cam', this.root);
    this.debugEl = el('div', 'hud-debug', this.root);
    this.ammoEl = el('div', 'hud-ammo', this.root);
    this.ammoT = 0;
    // Auf Touch-Geräten lassen sich Anruf und Nachricht direkt antippen
    this.callEl.addEventListener('pointerdown', (e) => { e.preventDefault(); if (game.phone.incoming) game.input.touch.pending.add('interact'); });
    this.notif.addEventListener('pointerdown', (e) => { e.preventDefault(); if (game.mode === 'play' && !game.phone.open && game.state.hasPhone) { game.phone.show('messages'); this.notifT = 0; } });
    this.subQueue = [];
    this.statusT = 0; this.objT = 0; this.notifT = 0; this.saveT = 0;
    this.choiceState = null;
  }

  // Achtung: Die Grundregel im Stylesheet ist „display: none“ – ein leerer Wert würde die Anzeige versteckt lassen.
  setVisible(v) { this.root.style.display = v ? 'block' : 'none'; }

  subtitle(name, text, color, dur, channel) {
    if (!this.game.settings.subtitles) return;
    const line = el('div', 'sub-line' + (channel === 'phone' ? ' phone' : channel === 'pa' ? ' pa' : ''), this.subs, `<b style="color:${color}">${name}</b>${channel === 'phone' ? ' <i>(Telefon)</i>' : channel === 'pa' ? ' <i>(Lautsprecher)</i>' : ''}: ${text}`);
    this.subs.dataset.size = this.game.settings.subtitleSize || 'm';
    setTimeout(() => { line.classList.add('out'); setTimeout(() => line.remove(), 500); }, dur * 1000);
    while (this.subs.children.length > 3) this.subs.firstChild.remove();
  }
  toast(text, dur = 2.8) {
    const t = el('div', 'toast', this.toasts, text);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 600); }, dur * 1000);
    while (this.toasts.children.length > 4) this.toasts.firstChild.remove();
  }
  pickup(name) { this.toast('＋ ' + name); }
  // Das Ziel bleibt klein und blass stehen; bei einer Änderung leuchtet es einige Sekunden auf
  objective(text) {
    this.obj.innerHTML = text ? `<small>ZIEL</small><span>${text}</span>` : '';
    this.obj.classList.toggle('has', !!text);
    if (text) { this.obj.classList.remove('show'); void this.obj.offsetWidth; this.obj.classList.add('show'); this.objT = 7; }
  }
  notify(from, text) {
    this.notif.innerHTML = `<b>📱 ${from}</b><span>${text}</span><small>${this.game.input.touchMode ? 'antippen zum Lesen' : '[' + this.game.input.label('phone') + '] Telefon'}</small>`;
    this.notif.classList.add('show'); this.notifT = 5;
  }
  callBanner(name) {
    if (!name) { this.callEl.classList.remove('show'); return; }
    this.callEl.innerHTML = `<b>📞 Eingehender Anruf</b><span>${name}</span><small>${this.game.input.touchMode ? 'antippen zum Annehmen' : '[' + this.game.input.label('interact') + '] annehmen'}</small>`;
    this.callEl.classList.add('show');
  }
  saved() { this.saveEl.classList.add('show'); this.saveT = 2.5; }
  showStatus() { this.statusT = 3.5; }
  showAmmo() { this.ammoT = 4; }

  titleCard(a, b, dur = 4.5) {
    this.titleEl.innerHTML = `<small>${a}</small><div>${b}</div>`;
    this.titleEl.classList.add('show');
    return new Promise((res) => setTimeout(() => { this.titleEl.classList.remove('show'); res(); }, dur * 1000));
  }

  // Entscheidung: options [{id, text, hint?}] -> Promise(id)
  choice(title, options) {
    this.game.input.exitLock();
    return new Promise((resolve) => {
      this.choiceEl.innerHTML = `<h3>${title}</h3>`;
      const list = el('div', 'opts', this.choiceEl);
      const buttons = options.map((o, i) => {
        const b = el('button', 'opt' + (i === 0 ? ' sel' : ''), list, `<span>${i + 1}</span>${o.text}${o.hint ? `<small>${o.hint}</small>` : ''}`);
        b.onclick = () => done(o.id);
        b.onmouseenter = () => select(i);
        return b;
      });
      let sel = 0;
      const select = (i) => { sel = (i + buttons.length) % buttons.length; buttons.forEach((b, k) => b.classList.toggle('sel', k === sel)); };
      this.choiceEl.classList.add('show');
      this.game.setModal('choice');
      const keyH = (e) => { const n = parseInt(e.key, 10); if (n >= 1 && n <= options.length) done(options[n - 1].id); };
      window.addEventListener('keydown', keyH);
      const done = (id) => {
        window.removeEventListener('keydown', keyH);
        this.choiceEl.classList.remove('show');
        this.game.setModal(null);
        this.game.input.requestLock();
        this.game.audio.play('ui', { vol: 0.6 });
        resolve(id);
      };
      // Bedienung per Tastatur (W/S/↑/↓ + E/Enter) und Gamepad (Steuerkreuz/Stick + A)
      this.choiceState = { done, options, move: (d) => select(sel + d), confirm: () => done(options[sel].id) };
    });
  }

  qteShow(progress, timeLeft) {
    if (progress == null) { this.qte.classList.remove('show'); return; }
    const L = this.game.input.label('left'), R = this.game.input.label('right');
    this.qte.innerHTML = `<b>LOSREISSEN!</b><span>[${L}] [${R}] abwechselnd drücken</span><div class="bar"><div style="width:${Math.min(100, progress * 100)}%"></div></div><div class="time"><div style="width:${Math.max(0, timeLeft * 100)}%"></div></div>`;
    this.qte.classList.add('show');
  }

  camOverlay(text) {
    if (!text) { this.camEl.classList.remove('show'); return; }
    this.camEl.innerHTML = text; this.camEl.classList.add('show');
  }

  update(dt) {
    const g = this.game, p = g.player;
    // Interaktionshinweis
    const t = p.target;
    let txt = null;
    if (t && p.mode === 'normal' && !g.phone.isOpen()) {
      const pr = t.prompt ? t.prompt() : null;
      if (pr) txt = `<kbd>${g.input.label('interact')}</kbd> ${pr}${t.hold ? ' <small>(halten)</small>' : ''}`;
    }
    if (p.mode === 'hidden') txt = `<kbd>${g.input.label('interact')}</kbd> Versteck verlassen &nbsp; <kbd>${g.input.label('breath')}</kbd> ${g.input.touchMode ? 'halten = Atem anhalten' : 'Atem anhalten'}`;
    if (p.carry && p.mode === 'normal' && !txt) txt = `<kbd>${g.input.label('throw')}</kbd> Werfen`;
    if (txt !== this._lastPrompt) { this.prompt.innerHTML = txt || ''; this.prompt.classList.toggle('show', !!txt); this._lastPrompt = txt; }
    // Halten-Ring
    const hp = t && t.hold ? p.holdT / t.hold : 0;
    this.hold.classList.toggle('show', hp > 0.01);
    this.holdFg.style.strokeDashoffset = String(94.2 * (1 - hp));
    // Fadenkreuz nur bei Ziel – beim Zielen mit der Glock als Zielkreuz
    this.cross.classList.toggle('active', !!t);
    const w = g.weapon;
    this.cross.classList.toggle('aim', !!(w && w.aimT > 0.5));
    // Munition: mit Waffe immer blass sichtbar, beim Ziehen/Schießen hell
    this.ammoT -= dt;
    if (w && w.has) {
      const txt = `<b>${w.mag}</b><span>/ ${w.reserve}</span>${w.reloading ? '<em>lädt nach …</em>' : w.mag === 0 && w.reserve === 0 ? '<em>leer</em>' : ''}`;
      if (txt !== this._ammoTxt) { this.ammoEl.innerHTML = txt; this._ammoTxt = txt; }
      this.ammoEl.classList.add('has');
      this.ammoEl.classList.toggle('show', w.drawn || this.ammoT > 0);
      this.ammoEl.classList.toggle('low', w.mag <= 3);
    } else this.ammoEl.classList.remove('show', 'has');
    this.cross.style.opacity = p.mode === 'normal' && !g.phone.isOpen() ? '' : '0';
    // Gesundheit und Ausdauer
    const sm = p.staminaMax();
    const hpW = Math.max(0, Math.min(100, p.hp)).toFixed(0), stW = Math.max(0, p.stamina).toFixed(0);
    if (hpW !== this._hpW) { this._hpW = hpW; this.hpBar.style.width = hpW + '%'; this.vitT = 4; }
    if (stW !== this._stW) { this._stW = stW; this.stBar.style.width = stW + '%'; }
    this.stWrap.style.setProperty('--max', sm.toFixed(0) + '%');
    const hs = p.healthState;
    if (hs !== this._vitHS) { this._vitHS = hs; this.vitals.dataset.hs = hs; }
    this.vitals.classList.toggle('exhausted', p.exhausted);
    this.vitT -= dt;
    this.vitals.classList.toggle('active', this.vitT > 0 || p.stamina < sm - 1 || hs !== 'healthy' || !!p.heal);
    const inv = g.inventory;
    const meds = `✚ ${inv.count('bandage')} · ▣ ${inv.count('medkit')} · ◍ ${inv.count('pills')}`;
    if (meds !== this._meds) { this._meds = meds; this.medsEl.textContent = meds; }
    // Atem im Versteck
    const showB = p.mode === 'hidden';
    this.breath.classList.toggle('show', showB);
    if (showB) this.breathBar.style.width = (p.breath / 9 * 100).toFixed(0) + '%';
    this.breath.classList.toggle('holding', p.breathHeld);
    // Zustandstext (nur bei Änderung und beim Heilen)
    this.statusT -= dt;
    const st = p.healthState;
    if (this._lastHS !== st) { this._lastHS = st; this.statusT = 4; }
    const showStatus = this.statusT > 0 || !!p.heal;
    if (showStatus) this.status.innerHTML = `<span class="hs ${st}">${HEALTH_STATES[st]}</span>` + (p.heal ? `<div class="healbar"><div style="width:${Math.min(100, p.heal.t / p.heal.dur * 100)}%"></div></div>` : '');
    this.status.classList.toggle('show', showStatus);
    this.objT -= dt; if (this.objT <= 0) this.obj.classList.remove('show');
    this.obj.classList.toggle('hide', p.mode === 'dead' || !!g.camView);
    this.notifT -= dt; if (this.notifT <= 0) this.notif.classList.remove('show');
    this.saveT -= dt; if (this.saveT <= 0) this.saveEl.classList.remove('show');
    if (g.debug) this._debug();
  }

  _debug() {
    const g = this.game, p = g.player;
    const zs = g.zombies.filter((z) => z.alive).map((z) => `${z.id}: ${z.stateName} s=${z.suspicion.toFixed(2)} d=${Math.hypot(z.pos.x - p.pos.x, z.pos.z - p.pos.z).toFixed(1)}`).join('<br>');
    this.debugEl.innerHTML = `pos ${p.pos.x.toFixed(1)}, ${p.pos.z.toFixed(1)} y=${p.pos.y.toFixed(2)} yaw ${p.yaw.toFixed(2)}<br>hp ${p.hp.toFixed(0)} st ${p.stamina.toFixed(0)} vis ${p.visibility().toFixed(2)} licht ${g.level.lights.lightLevelAt(p.pos.x, p.pos.z).toFixed(2)}<br>threat ${g.threatLevel} fps ${g.fps.toFixed(0)} calls ${g.renderer.scenePass.stats?.calls} tris ${g.renderer.scenePass.stats?.tris}<br>${zs}`;
  }
}

export { Input };
