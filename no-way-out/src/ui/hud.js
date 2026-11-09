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
    this.stam = el('div', 'hud-stamina', this.root, '<div></div>');
    this.stamBar = this.stam.firstChild;
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
    this.subQueue = [];
    this.statusT = 0; this.objT = 0; this.notifT = 0; this.saveT = 0;
    this.choiceState = null;
  }

  setVisible(v) { this.root.style.display = v ? '' : 'none'; }

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
  objective(text) {
    this.obj.innerHTML = `<small>ZIEL</small>${text}`;
    this.obj.classList.add('show'); this.objT = 6;
  }
  notify(from, text) {
    this.notif.innerHTML = `<b>📱 ${from}</b><span>${text}</span><small>[${this.game.input.label('phone')}] Telefon</small>`;
    this.notif.classList.add('show'); this.notifT = 5;
  }
  callBanner(name) {
    if (!name) { this.callEl.classList.remove('show'); return; }
    this.callEl.innerHTML = `<b>📞 Eingehender Anruf</b><span>${name}</span><small>[${this.game.input.label('interact')}] annehmen</small>`;
    this.callEl.classList.add('show');
  }
  saved() { this.saveEl.classList.add('show'); this.saveT = 2.5; }
  showStatus() { this.statusT = 3.5; }

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
    if (p.mode === 'hidden') txt = `<kbd>${g.input.label('interact')}</kbd> Versteck verlassen &nbsp; <kbd>${g.input.label('vault')}</kbd> Atem anhalten`;
    if (p.carry && p.mode === 'normal' && !txt) txt = `<kbd>${g.input.label('throw')}</kbd> Werfen`;
    if (txt !== this._lastPrompt) { this.prompt.innerHTML = txt || ''; this.prompt.classList.toggle('show', !!txt); this._lastPrompt = txt; }
    // Halten-Ring
    const hp = t && t.hold ? p.holdT / t.hold : 0;
    this.hold.classList.toggle('show', hp > 0.01);
    this.holdFg.style.strokeDashoffset = String(94.2 * (1 - hp));
    // Fadenkreuz nur bei Ziel
    this.cross.classList.toggle('active', !!t);
    this.cross.style.opacity = p.mode === 'normal' && !g.phone.isOpen() ? '' : '0';
    // Ausdauer
    const sm = p.staminaMax();
    const showSt = p.stamina < sm - 1 && p.mode !== 'hidden';
    this.stam.classList.toggle('show', showSt);
    this.stam.classList.toggle('exhausted', p.exhausted);
    this.stamBar.style.width = (p.stamina / 100 * 100).toFixed(1) + '%';
    this.stam.style.setProperty('--max', (sm / 100 * 100).toFixed(1) + '%');
    // Atem im Versteck
    const showB = p.mode === 'hidden';
    this.breath.classList.toggle('show', showB);
    if (showB) this.breathBar.style.width = (p.breath / 9 * 100).toFixed(0) + '%';
    this.breath.classList.toggle('holding', p.breathHeld);
    // Zustand
    this.statusT -= dt;
    const st = p.healthState;
    if (this._lastHS !== st) { this._lastHS = st; this.statusT = 4; }
    const heals = g.inventory;
    this.status.innerHTML = `<span class="hs ${st}">${HEALTH_STATES[st]}</span><span>✚ ${heals.count('bandage')} · ▣ ${heals.count('medkit')} · ◍ ${heals.count('pills')}</span>`;
    this.status.classList.toggle('show', this.statusT > 0 || p.heal);
    if (p.heal) { this.status.innerHTML += `<div class="healbar"><div style="width:${Math.min(100, p.heal.t / p.heal.dur * 100)}%"></div></div>`; }
    this.objT -= dt; if (this.objT <= 0) this.obj.classList.remove('show');
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
