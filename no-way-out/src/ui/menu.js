// Menüs: Hauptmenü, Schwierigkeitsgrad, Kapitelauswahl, Einstellungen (inkl. Tastenbelegung),
// Pause, Tod, Enden/Abspann. Atmosphärisch, aber schnell bedienbar.
import { DIFFICULTY, ACTION_NAMES, DEFAULT_BINDINGS } from '../core/config.js';
import { Input } from '../core/input.js';
import { CHAPTERS, CHAPTER_ORDER, CHAPTER_SEQ } from '../data/chapters/index.js';
import { ENDINGS } from '../data/story/endings.js';

const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

const DEATH_LINES = [
  'Es gibt keinen Weg zurück. Nur nach vorne.',
  'Sie hören dich, bevor sie dich sehen.',
  'Nicht jedes Versteck ist sicher.',
  'Ausdauer ist Leben. Renne nicht ohne Ziel.',
  'Dunkelheit schützt – Licht verrät.',
  'Ein geschlossener Weg ist besser als keiner.',
];

export class Menu {
  constructor(game, root) {
    this.game = game;
    this.root = h('<div class="menu"></div>');
    root.appendChild(this.root);
    this.loadingEl = h('<div class="loading"><div class="spin"></div><span>Lädt …</span></div>');
    root.appendChild(this.loadingEl);
    this.screen = null;
  }
  loading(b) { this.loadingEl.classList.toggle('show', b); }

  // Gamepad-Bedienung aller Menüs: Steuerkreuz/Stick wählt, A bestätigt, B = zurück
  padNav(inp) {
    if (!inp.pad || !this.screen) return;
    const btns = [...this.root.querySelectorAll('button:not(:disabled)')].filter((b) => b.offsetParent !== null);
    if (!btns.length) return;
    const ay = inp.pad.axes[1] || 0;
    const stickUp = ay < -0.6 && !(this._stickY < -0.6), stickDown = ay > 0.6 && !(this._stickY > 0.6);
    this._stickY = ay;
    let i = btns.indexOf(this._padFocus);
    if (inp.padPressed('forward') || stickUp) i = i <= 0 ? btns.length - 1 : i - 1;
    else if (inp.padPressed('back') || stickDown) i = i < 0 || i >= btns.length - 1 ? 0 : i + 1;
    else if (i < 0) return;
    if (btns[i] !== this._padFocus) {
      if (this._padFocus) this._padFocus.classList.remove('padsel');
      this._padFocus = btns[i]; this._padFocus.classList.add('padsel'); this._padFocus.focus?.();
      this.game.audio.play('ui', { vol: 0.3 });
    }
    if (inp.padPressed('interact') && this._padFocus) this._padFocus.click();
    if (inp.padPressed('vault')) { const back = this.root.querySelector('[data-a=back]'); if (back) back.click(); }
  }
  hideAll() { this.root.innerHTML = ''; this.root.className = 'menu'; this.screen = null; }
  _set(el, cls = '') { this.root.innerHTML = ''; this.root.className = 'menu show ' + cls; this.root.appendChild(el); this.screen = el; }

  showMain() {
    const g = this.game;
    const has = g.save.hasSave();
    const meta = g.save.meta();
    const el = h(`<div class="main-menu">
      <div class="title-wrap"><h1 class="glitch" data-t="NO WAY OUT">NO WAY OUT</h1><p class="tag">Du kannst nicht kämpfen. Du kannst nur überleben.</p></div>
      <nav>
        <button data-a="new">Neues Spiel</button>
        <button data-a="cont" ${has ? '' : 'disabled'}>Fortsetzen</button>
        <button data-a="chapters">Kapitel laden</button>
        <button data-a="settings">Einstellungen</button>
        <button data-a="difficulty">Schwierigkeitsgrad <small>${(DIFFICULTY[g.settings.difficulty] || DIFFICULTY.normal).name}</small></button>
        <button data-a="endings">Enden <small>${meta.endings.length}/3</small></button>
        <button data-a="credits">Mitwirkende</button>
        <button data-a="quit">Spiel verlassen</button>
      </nav>
      <div class="hint">Kopfhörer empfohlen · Maus &amp; Tastatur oder Gamepad · Speichert automatisch</div>
    </div>`);
    el.addEventListener('click', (e) => {
      const a = e.target.closest('button')?.dataset.a; if (!a) return;
      g.audio.init(); g.audio.play('ui', { vol: 0.6 });
      if (a === 'new') this.showDifficulty();
      if (a === 'cont') g.continueGame();
      if (a === 'chapters') this.showChapters();
      if (a === 'settings') this.showSettings(() => this.showMain());
      if (a === 'difficulty') this.showDifficultySetting(() => this.showMain());
      if (a === 'endings') this.showEndings();
      if (a === 'credits') this.showCredits();
      if (a === 'quit') this.showQuit();
    });
    this._set(el, 'main');
  }

  showDifficulty() {
    const g = this.game;
    const cur = g.settings.difficulty || 'normal';
    const el = h(`<div class="panel diff"><h2>Schwierigkeitsgrad</h2><p class="sub">Die Geschichte bleibt auf allen Stufen gleich – nur die Herausforderung ändert sich.</p>
      <div class="cards">${Object.values(DIFFICULTY).map((d) => `<button class="card ${d.id === cur ? 'sel' : ''}" data-d="${d.id}"><b>${d.name}</b>${d.id === 'normal' ? '<em>empfohlen</em>' : ''}<span>${d.desc}</span></button>`).join('')}</div>
      <div class="row"><button data-a="back">Zurück</button><button data-a="go" class="primary">Spiel starten</button></div></div>`);
    let sel = cur;
    el.addEventListener('click', (e) => {
      const c = e.target.closest('.card');
      if (c) { sel = c.dataset.d; el.querySelectorAll('.card').forEach((x) => x.classList.toggle('sel', x === c)); g.audio.play('ui', { vol: 0.5 }); return; }
      const a = e.target.closest('button')?.dataset.a;
      if (a === 'back') this.showMain();
      if (a === 'go') { if (g.save.hasSave() && !this._confirmNew) { this._confirmNew = true; e.target.textContent = 'Spielstand überschreiben?'; return; } this._confirmNew = false; g.newGame(sel); }
    });
    this._set(el);
  }

  // Schwierigkeitsgrad ändern (Hauptmenü: für neue Spiele und den Spielstand; Pause: sofort)
  showDifficultySetting(back) {
    const g = this.game;
    const cur = g.mode === 'paused' ? g.difficulty.id : (g.settings.difficulty || 'normal');
    const el = h(`<div class="panel diff"><h2>Schwierigkeitsgrad</h2><p class="sub">${g.mode === 'paused' ? 'Gilt sofort für Gegner, Schaden und Reaktionsfenster. Die Menge der Heilmittel passt sich beim nächsten Laden eines Abschnitts an.' : 'Gilt für neue Spiele und für den gespeicherten Spielstand.'}</p>
      <div class="cards">${Object.values(DIFFICULTY).map((d) => `<button class="card ${d.id === cur ? 'sel' : ''}" data-d="${d.id}"><b>${d.name}</b>${d.id === 'normal' ? '<em>empfohlen</em>' : ''}<span>${d.desc}</span></button>`).join('')}</div>
      <div class="row"><button data-a="back">Zurück</button></div></div>`);
    el.addEventListener('click', (e) => {
      const c = e.target.closest('.card');
      if (c) {
        const id = c.dataset.d;
        g.settings.difficulty = id; g.applySettings();
        g.difficulty = DIFFICULTY[id];
        g.save.setDifficulty(id);
        if (g.lastSnapshot) g.lastSnapshot.difficulty = id;
        el.querySelectorAll('.card').forEach((x) => x.classList.toggle('sel', x === c));
        g.audio.play('ui', { vol: 0.5 });
        return;
      }
      if (e.target.closest('button')?.dataset.a === 'back') back();
    });
    this._set(el, g.mode === 'menu' ? 'main' : 'overlay');
  }

  showChapters() {
    const g = this.game;
    const meta = g.save.meta();
    const el = h(`<div class="panel chapters"><h2>Kapitel laden</h2><div class="list">${CHAPTER_SEQ.map((id) => {
      const ch = CHAPTERS[id]; const ok = meta.unlocked.includes(id) || g.debug;
      const num = CHAPTER_ORDER.indexOf(id) >= 0 ? String(CHAPTER_ORDER.indexOf(id) + 1) : String(CHAPTER_ORDER.indexOf(id.replace(/b$/, '')) + 1) + '·2';
      const name = ch.part ? `${ch.name} – ${ch.partName}` : ch.name;
      return `<button class="chap" data-c="${id}" ${ok ? '' : 'disabled'}><span>${num}</span><b>${ok ? name : '— gesperrt —'}</b><small>${ok ? ch.tagline || '' : 'Erreiche diesen Abschnitt im Spiel'}</small></button>`;
    }).join('')}</div><div class="row"><button data-a="back">Zurück</button></div></div>`);
    el.addEventListener('click', (e) => {
      const c = e.target.closest('.chap'); if (c && !c.disabled) { g.startChapter(c.dataset.c); return; }
      if (e.target.closest('button')?.dataset.a === 'back') this.showMain();
    });
    this._set(el);
  }

  showEndings() {
    const meta = this.game.save.meta();
    const el = h(`<div class="panel"><h2>Enden</h2><div class="list">${Object.values(ENDINGS).map((e) => {
      const seen = meta.endings.includes(e.id);
      return `<div class="end ${seen ? 'seen' : ''}"><b>${seen ? e.title : '???'}</b><small>${seen ? e.summary : e.hint}</small></div>`;
    }).join('')}</div><div class="row"><button data-a="back">Zurück</button></div></div>`);
    el.addEventListener('click', (e) => { if (e.target.closest('button')?.dataset.a === 'back') this.showMain(); });
    this._set(el);
  }

  showCredits() {
    const el = h(`<div class="panel credits"><h2>Mitwirkende</h2>
      <p><b>NO WAY OUT</b> – ein First-Person-Survival-Horror-Spiel.</p>
      <p>Konzept: Sami Kuru<br>Umsetzung, Programmierung, Leveldesign, Story, prozedurale Grafik &amp; Audio: entwickelt mit Claude (Anthropic)</p>
      <p>Engine: three.js (MIT-Lizenz) · Alle Texturen, Modelle, Geräusche und Musik werden zur Laufzeit prozedural erzeugt.</p>
      <p>Sprachaufnahmen (sofern vorhanden): synthetisiert mit ElevenLabs.</p>
      <p class="small">Alle Personen, Firmen und Orte sind frei erfunden.</p>
      <div class="row"><button data-a="back">Zurück</button></div></div>`);
    el.addEventListener('click', (e) => { if (e.target.closest('button')?.dataset.a === 'back') (this.game.mode === 'menu' ? this.showMain() : null); });
    this._set(el);
  }

  showQuit() {
    const el = h(`<div class="panel"><h2>Spiel verlassen</h2><p>Dein Fortschritt ist gespeichert. Du kannst dieses Fenster bzw. diesen Tab jetzt schließen.</p><div class="row"><button data-a="back">Zurück</button><button data-a="close">Fenster schließen</button></div></div>`);
    el.addEventListener('click', (e) => { const a = e.target.closest('button')?.dataset.a; if (a === 'back') this.showMain(); if (a === 'close') { window.close(); } });
    this._set(el);
  }

  // ---------------- Einstellungen ----------------
  showSettings(back) {
    const g = this.game, s = g.settings;
    const tab = this._tab || 'ctrl';
    const slider = (k, label, min, max, step, fmt = (v) => v) => `<label class="set"><span>${label}</span><input type="range" data-k="${k}" min="${min}" max="${max}" step="${step}" value="${s[k]}"><em>${fmt(s[k])}</em></label>`;
    const check = (k, label) => `<label class="set chk"><span>${label}</span><input type="checkbox" data-k="${k}" ${s[k] ? 'checked' : ''}></label>`;
    const select = (k, label, opts) => `<label class="set"><span>${label}</span><select data-k="${k}">${opts.map(([v, n]) => `<option value="${v}" ${String(s[k]) === String(v) ? 'selected' : ''}>${n}</option>`).join('')}</select></label>`;
    const pct = (v) => Math.round(v * 100) + ' %';
    let body = '';
    if (tab === 'ctrl') {
      body = slider('sensitivity', 'Mausempfindlichkeit', 0.2, 3, 0.05, (v) => Number(v).toFixed(2)) + check('invertY', 'Y-Achse invertieren') + check('crouchToggle', 'Ducken umschalten (statt halten)') + slider('headBob', 'Kopfbewegung', 0, 1.5, 0.05, pct) +
        `<h4>Tastenbelegung <button class="mini" data-a="resetkeys">Standard</button></h4><div class="binds">${Object.keys(ACTION_NAMES).map((a) => `<div class="bind"><span>${ACTION_NAMES[a]}</span><button data-bind="${a}">${(s.bindings[a] || []).map((c) => Input.keyLabel(c)).join(' / ')}</button></div>`).join('')}</div>`;
    } else if (tab === 'gfx') {
      body = select('quality', 'Grafikqualität', [['low', 'Niedrig'], ['medium', 'Mittel'], ['high', 'Hoch']]) + slider('renderScale', 'Auflösung (Renderskalierung)', 0.5, 1, 0.05, pct) + slider('fov', 'Sichtfeld', 60, 95, 1, (v) => v + '°') +
        slider('brightness', 'Helligkeit', 0.7, 1.6, 0.02, pct) + check('bloom', 'Leuchteffekte (Bloom)') + check('grain', 'Filmkörnung') + `<label class="set"><span>Vollbild</span><button class="mini" data-a="fs">${document.fullscreenElement ? 'Beenden' : 'Aktivieren'}</button></label>`;
    } else if (tab === 'audio') {
      body = slider('masterVol', 'Gesamtlautstärke', 0, 1, 0.01, pct) + slider('musicVol', 'Musik', 0, 1, 0.01, pct) + slider('sfxVol', 'Soundeffekte', 0, 1, 0.01, pct) + slider('voiceVol', 'Stimmen', 0, 1, 0.01, pct);
    } else {
      body = check('subtitles', 'Untertitel') + select('subtitleSize', 'Untertitelgröße', [['s', 'Klein'], ['m', 'Mittel'], ['l', 'Groß']]);
    }
    const el = h(`<div class="panel settings"><h2>Einstellungen</h2>
      <div class="tabs">${[['ctrl', 'Steuerung'], ['gfx', 'Grafik'], ['audio', 'Audio'], ['acc', 'Untertitel']].map(([k, n]) => `<button data-tab="${k}" class="${k === tab ? 'sel' : ''}">${n}</button>`).join('')}</div>
      <div class="body">${body}</div><div class="row"><button data-a="back">Zurück</button></div></div>`);
    el.addEventListener('input', (e) => {
      const k = e.target.dataset.k; if (!k) return;
      const v = e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'range' ? parseFloat(e.target.value) : e.target.value;
      s[k] = v;
      const em = e.target.parentElement.querySelector('em');
      if (em) em.textContent = k === 'sensitivity' ? Number(v).toFixed(2) : k === 'fov' ? v + '°' : Math.round(v * 100) + ' %';
      if (k === 'quality') g.setQuality(v);
      g.applySettings();
    });
    el.addEventListener('click', (e) => {
      const t = e.target.closest('[data-tab]'); if (t) { this._tab = t.dataset.tab; this.showSettings(back); return; }
      const b = e.target.closest('[data-bind]');
      if (b) {
        b.textContent = '… Taste drücken'; b.classList.add('wait');
        g.input.captureNextKey((code) => {
          if (code !== 'Escape') { s.bindings[b.dataset.bind] = [code]; g.applySettings(); }
          this.showSettings(back);
        });
        return;
      }
      const a = e.target.closest('button')?.dataset.a;
      if (a === 'back') back();
      if (a === 'resetkeys') { s.bindings = structuredClone(DEFAULT_BINDINGS); g.applySettings(); this.showSettings(back); }
      if (a === 'fs') { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.().catch(() => {}); setTimeout(() => this.showSettings(back), 300); }
    });
    this._set(el, this.game.mode === 'menu' ? 'main' : 'overlay');
  }

  // ---------------- Pause ----------------
  showPause() {
    const g = this.game;
    const obj = g.phone.data.objective;
    const el = h(`<div class="panel pause"><h2>Pause</h2>${obj ? `<p class="obj"><small>ZIEL</small>${obj}</p>` : ''}
      <nav><button data-a="resume" class="primary">Fortsetzen</button><button data-a="settings">Einstellungen</button><button data-a="difficulty">Schwierigkeitsgrad</button><button data-a="cp">Letzten Checkpoint laden</button><button data-a="help">Steuerung</button><button data-a="menu">Hauptmenü</button></nav>
      <p class="small">${CHAPTERS[g.chapter?.id]?.name || ''} · ${g.difficulty.name}</p></div>`);
    el.addEventListener('click', (e) => {
      const a = e.target.closest('button')?.dataset.a;
      if (a === 'resume') g.resume();
      if (a === 'settings') this.showSettings(() => this.showPause());
      if (a === 'difficulty') this.showDifficultySetting(() => this.showPause());
      if (a === 'cp') { this.hideAll(); g.mode = 'play'; g.audio.resume(); g.reloadCheckpoint(); }
      if (a === 'help') this.showHelp();
      if (a === 'menu') g.toMainMenu();
    });
    const keyH = (e) => { if (e.code === 'Escape' || e.code === 'KeyP') { if (this.screen === el) { window.removeEventListener('keydown', keyH); g.resume(); } } };
    setTimeout(() => window.addEventListener('keydown', keyH), 250);
    this._set(el, 'overlay');
  }
  showHelp() {
    const g = this.game, L = (a) => g.input.label(a);
    const el = h(`<div class="panel help"><h2>Steuerung</h2><div class="grid">
      <span>Bewegen</span><b>${L('forward')} ${L('left')} ${L('back')} ${L('right')}</b>
      <span>Rennen (begrenzte Ausdauer)</span><b>${L('sprint')}</b>
      <span>Schleichen / Ducken</span><b>${L('crouch')}</b>
      <span>Interagieren / Tür / Verstecken</span><b>${L('interact')}</b>
      <span>Klettern · im Versteck: Atem anhalten</span><b>${L('vault')}</b>
      <span>Smartphone</span><b>${L('phone')}</b>
      <span>Taschenlampe</span><b>${L('flashlight')}</b>
      <span>Heilen</span><b>${L('heal')}</b>
      <span>Gegenstand werfen (Ablenkung)</span><b>${L('throw')}</b>
      <span>Losreißen, wenn gepackt</span><b>${L('left')} / ${L('right')} abwechselnd</b>
    </div><p class="small">Zombies hören Schritte, Türen und Würfe, sehen Bewegung und Licht. Im Dunkeln und geduckt bist du schwer zu sehen. Verstecke helfen – aber nicht immer.</p><div class="row"><button data-a="back">Zurück</button></div></div>`);
    el.addEventListener('click', (e) => { if (e.target.closest('button')?.dataset.a === 'back') this.showPause(); });
    this._set(el, 'overlay');
  }

  // ---------------- Tod ----------------
  showDeath(kind) {
    const g = this.game;
    const line = DEATH_LINES[Math.floor(Math.random() * DEATH_LINES.length)];
    const cause = kind === 'group' ? 'Von mehreren Infizierten überwältigt.' : kind === 'bite' ? 'Gebissen.' : kind === 'fall' ? 'Zu tief gestürzt.' : 'Tödlich verletzt.';
    const el = h(`<div class="death"><h1>DU BIST TOT</h1><p>${cause}</p><p class="quote">„${line}“</p><nav><button data-a="retry" class="primary">Weiter vom Checkpoint</button><button data-a="menu">Hauptmenü</button></nav></div>`);
    el.addEventListener('click', (e) => {
      const a = e.target.closest('button')?.dataset.a;
      if (a === 'retry') { this.hideAll(); g.renderer.fx.uFadeColor.value.setRGB(0, 0, 0); g.mode = 'play'; g.reloadCheckpoint(); }
      if (a === 'menu') { g.renderer.fx.uFadeColor.value.setRGB(0, 0, 0); g.toMainMenu(); }
    });
    const keyH = (e) => { if (['KeyE', 'Enter', 'Space'].includes(e.code) && this.screen === el) { window.removeEventListener('keydown', keyH); el.querySelector('[data-a=retry]').click(); } };
    window.addEventListener('keydown', keyH);
    this._set(el, 'overlay dead');
  }

  // ---------------- Ende ----------------
  ending(id) {
    const g = this.game;
    const e = ENDINGS[id];
    return new Promise((resolve) => {
      const pages = e.pages(g.state.flags, g);
      let i = 0;
      const el = h(`<div class="ending"><div class="ending-inner"><small class="etitle">ENDE · ${e.title.toUpperCase()}</small><div class="page"></div><div class="next">[Klick / E] weiter</div></div></div>`);
      const page = el.querySelector('.page');
      const show = () => {
        if (i >= pages.length) { finish(); return; }
        page.classList.remove('in'); void page.offsetWidth;
        page.innerHTML = pages[i]; page.classList.add('in');
        g.audio.play('ui', { vol: 0.3, rate: 0.6 });
      };
      const next = () => { i++; show(); };
      this._endingNext = () => { if (i < pages.length) next(); };
      const keyH = (ev) => { if (['KeyE', 'Enter', 'Space'].includes(ev.code)) next(); };
      const finish = () => {
        this._endingNext = null;
        window.removeEventListener('keydown', keyH);
        const meta = g.save.meta();
        const c = h(`<div class="panel credits endc"><h2>${e.title}</h2><p>${e.summary}</p><p class="small">Erreichte Enden: ${meta.endings.length}/3</p>${meta.endings.length < 3 ? `<p class="small hint">${Object.values(ENDINGS).filter((x) => !meta.endings.includes(x.id)).map((x) => '• ' + x.hint).join('<br>')}</p>` : '<p class="small">Du hast alle Enden gesehen. Danke fürs Spielen.</p>'}<div class="row"><button data-a="menu" class="primary">Hauptmenü</button></div></div>`);
        c.addEventListener('click', (ev) => { if (ev.target.closest('button')?.dataset.a === 'menu') { g.toMainMenu(); resolve(); } });
        this._set(c, 'main');
      };
      el.addEventListener('click', next);
      window.addEventListener('keydown', keyH);
      this._set(el, 'main');
      show();
    });
  }
}
