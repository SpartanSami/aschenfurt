// Touch-Steuerung für Smartphone und Tablet.
// Links: Bewegungsstick (ganz nach außen = rennen) und darüber „Zielen“ (tippen = an/aus, halten = solange gehalten).
// Rechts: umsehen per Wischen und genau vier Knöpfe – Benutzen, Lampe, Handy, Ducken.
// Alles Weitere erscheint nur, wenn es gebraucht wird:
//   • Der große Knopf wird beim Zielen zu „Schießen“ und vor einem Hindernis zu „Klettern“.
//   • „Zielen“ wird mit einer Flasche in der Hand zu „Werfen“.
//   • „Ducken“ wird im Versteck zu „Atem“ (Atem anhalten).
//   • „Laden“ erscheint, wenn das Magazin nicht voll ist; „Heilen“ neben der Lebensanzeige, wenn es etwas zu heilen gibt.
//   • Doppeltipp auf die rechte Bildschirmhälfte = schnelle 180°-Wende.
// Die Steuerung schreibt nur in input.touch – die übrigen Systeme bleiben unverändert.

export class TouchControls {
  constructor(game) {
    this.game = game;
    this.input = game.input;
    this.t = this.input.touch;
    const ui = document.getElementById('ui');
    // Grundebene liegt unter allen Menüs, Dokumenten und Entscheidungen
    this.base = document.createElement('div');
    this.base.className = 'touch-base';
    this.base.innerHTML = `
      <div class="t-zone t-move"><div class="t-stick"><div class="t-knob"></div></div></div>
      <div class="t-zone t-look"></div>
      <div class="t-left">
        <button class="t-btn t-aim" data-role="aim">Zielen</button>
        <button class="t-btn t-reload" data-t="reload">Laden</button>
      </div>
      <div class="t-btns">
        <button class="t-btn t-crouch" data-role="crouch">Ducken</button>
        <button class="t-btn" data-t="flashlight">Lampe</button>
        <button class="t-btn" data-t="phone">Handy</button>
        <button class="t-btn t-big" data-role="big">Benutzen</button>
      </div>
      <button class="t-btn t-heal" data-t="heal">✚ Heilen</button>
      <button class="t-btn t-pause" data-t="pause" aria-label="Pause">II</button>
`;
    ui.insertBefore(this.base, ui.firstChild);
    // Das Spiel läuft auf dem Handy nur im Querformat: Im Hochformat erscheint ein Hinweis, das Spiel pausiert.
    this.rot = document.createElement('div');
    this.rot.className = 'rotate-lock';
    this.rot.innerHTML = '<div><i>⟳</i><b>Bitte das Handy quer halten</b><span>NO WAY OUT läuft im Querformat.</span></div>';
    document.getElementById('app').appendChild(this.rot);
    const tryLock = () => { try { const o = screen.orientation; if (o && o.lock) o.lock('landscape').catch(() => {}); } catch (e) { /* nicht überall erlaubt */ } };
    window.addEventListener('pointerdown', tryLock, { once: true });
    // Kontextebene liegt über allem (Überwachungskameras, Losreißen)
    this.ctx = document.createElement('div');
    this.ctx.className = 'touch-ctx';
    this.ctx.innerHTML = `
      <div class="t-cam"><button class="t-btn" data-t="left">◀</button><button class="t-btn t-ok" data-t="interact">Schließen</button><button class="t-btn" data-t="right">▶</button></div>
      <div class="t-qte"><button class="t-btn t-huge" data-t="left">◀</button><span>Losreißen!</span><button class="t-btn t-huge" data-t="right">▶</button></div>`;
    ui.appendChild(this.ctx);
    this.knob = this.base.querySelector('.t-knob');
    this.stick = this.base.querySelector('.t-stick');
    this.bigBtn = this.base.querySelector('.t-big');
    this.aimBtn = this.base.querySelector('.t-aim');
    this.crouchBtn = this.base.querySelector('.t-crouch');
    this.aimLatched = false;
    this.bigAct = 'interact';
    this._vt = 0; this._canVault = false;
    this._bindButtons(this.base);
    this._bindButtons(this.ctx);
    for (const b of this.base.querySelectorAll('[data-role]')) this._bindRole(b);
    this._bindMove(this.base.querySelector('.t-move'));
    this._bindLook(this.base.querySelector('.t-look'));
    this.state = '';
  }

  // Einfache Knöpfe mit fester Aktion
  _bindButtons(root) {
    for (const b of root.querySelectorAll('[data-t]')) {
      const a = b.dataset.t, hold = !!b.dataset.hold;
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault(); e.stopPropagation();
        try { b.setPointerCapture(e.pointerId); } catch (err) { /* */ }
        this.t.pending.add(a);
        if (hold) this.t.buttons.add(a);
        b.classList.add('on');
        this.game.audio.unlock && this.game.audio.unlock();
      });
      const up = () => { if (hold) this.t.buttons.delete(a); b.classList.remove('on'); };
      b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
      b.addEventListener('contextmenu', (e) => e.preventDefault());
    }
  }

  // Welche Aktion ein Knopf mit wechselnder Aufgabe gerade auslöst
  _roleAction(role) {
    const p = this.game.player;
    if (role === 'big') return this.bigAct;
    if (role === 'crouch') return p.mode === 'hidden' ? 'vault' : 'crouch';
    if (role === 'aim') return p.carry ? 'throw' : 'aim';
    return role;
  }

  // Knöpfe mit wechselnder Aufgabe (großer Knopf, Zielen/Werfen, Ducken/Atem)
  _bindRole(b) {
    const role = b.dataset.role;
    let id = null, held = null, lx = 0, ly = 0, downT = 0, wasLatched = false, drag = false;
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      if (id !== null) return;
      try { b.setPointerCapture(e.pointerId); } catch (err) { /* */ }
      id = e.pointerId; lx = e.clientX; ly = e.clientY; downT = performance.now();
      this.game.audio.unlock && this.game.audio.unlock();
      const a = this._roleAction(role);
      drag = false;
      if (a === 'aim') {
        // tippen = umschalten, halten = solange gehalten
        wasLatched = this.aimLatched;
        this.t.buttons.add('aim'); held = 'aim';
      } else {
        this.t.pending.add(a);
        if (a === 'fire') { held = null; drag = true; }       // Einzelschuss; Daumen kann dabei nachzielen
        else if (a === 'throw') held = null;
        else { this.t.buttons.add(a); held = a; }
      }
      b.classList.add('on');
    });
    b.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return;
      if (drag) { this.t.lookDX += (e.clientX - lx) * 1.6; this.t.lookDY += (e.clientY - ly) * 1.6; }
      lx = e.clientX; ly = e.clientY;
    });
    const up = (e) => {
      if (id === null || (e && e.pointerId !== undefined && e.pointerId !== id)) return;
      id = null;
      if (held === 'aim') {
        const tap = performance.now() - downT < 280;
        if (wasLatched) { this.aimLatched = false; this.t.buttons.delete('aim'); }
        else if (tap) this.aimLatched = true;
        else this.t.buttons.delete('aim');
      } else if (held) this.t.buttons.delete(held);
      held = null; drag = false;
      if (!(role === 'aim' && this.aimLatched)) b.classList.remove('on');
    };
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
    b.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  _bindMove(zone) {
    const R = 56;
    let id = null, ox = 0, oy = 0;
    const set = (x, y) => {
      let dx = x - ox, dy = y - oy; const l = Math.hypot(dx, dy);
      if (l > R) { dx *= R / l; dy *= R / l; }
      this.knob.style.transform = `translate(${dx}px, ${dy}px)`;
      const m = Math.min(1, l / R);
      this.t.moveX = dx / R; this.t.moveY = -dy / R;
      // ganz nach außen geschoben = rennen
      if (m > 0.93) this.t.buttons.add('sprint'); else this.t.buttons.delete('sprint');
      this.stick.classList.toggle('run', m > 0.93);
    };
    zone.addEventListener('pointerdown', (e) => {
      if (id !== null) return;
      e.preventDefault(); id = e.pointerId;
      try { zone.setPointerCapture(id); } catch (err) { /* */ }
      ox = e.clientX; oy = e.clientY;
      const r = zone.getBoundingClientRect();
      this.stick.style.left = (ox - r.left) + 'px'; this.stick.style.top = (oy - r.top) + 'px';
      this.stick.classList.add('show');
      set(ox, oy);
    });
    zone.addEventListener('pointermove', (e) => { if (e.pointerId === id) { e.preventDefault(); set(e.clientX, e.clientY); } });
    const end = (e) => {
      if (e.pointerId !== id) return;
      id = null; this.t.moveX = 0; this.t.moveY = 0; this.t.buttons.delete('sprint');
      this.knob.style.transform = ''; this.stick.classList.remove('show', 'run');
    };
    zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end); zone.addEventListener('lostpointercapture', end);
  }

  _bindLook(zone) {
    let id = null, lx = 0, ly = 0, sx = 0, sy = 0, downT = 0, moved = 0;
    let lastTap = 0, tapX = 0, tapY = 0;
    zone.addEventListener('pointerdown', (e) => {
      if (id !== null) return;
      e.preventDefault(); id = e.pointerId; lx = sx = e.clientX; ly = sy = e.clientY; downT = performance.now(); moved = 0;
      try { zone.setPointerCapture(id); } catch (err) { /* */ }
    });
    zone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return;
      e.preventDefault();
      // Wischen dreht die Sicht etwas kräftiger als die Maus, damit eine Daumenbewegung reicht
      this.t.lookDX += (e.clientX - lx) * 1.6; this.t.lookDY += (e.clientY - ly) * 1.6;
      moved = Math.max(moved, Math.hypot(e.clientX - sx, e.clientY - sy));
      lx = e.clientX; ly = e.clientY;
    });
    const end = (e) => {
      if (e.pointerId !== id) return;
      id = null;
      // Doppeltipp (zwei kurze Tipper an fast derselben Stelle) = schnelle Wende
      const now = performance.now();
      if (e.type === 'pointerup' && now - downT < 220 && moved < 14) {
        if (now - lastTap < 340 && Math.hypot(sx - tapX, sy - tapY) < 70) { this.t.pending.add('turn'); lastTap = 0; }
        else { lastTap = now; tapX = sx; tapY = sy; }
      }
    };
    zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end); zone.addEventListener('lostpointercapture', end);
  }

  _label(el, text) { if (el._txt !== text) { el._txt = text; el.textContent = text; } }

  // Pro Bild: passende Ebene zeigen, Knöpfe an die Lage anpassen
  update() {
    const g = this.game, p = g.player, w = g.weapon;
    // Hochformat: pausieren, bis das Gerät quer gehalten wird
    const portrait = window.innerHeight > window.innerWidth * 1.05;
    if (portrait !== this._portrait) { this._portrait = portrait; this.rot.classList.toggle('show', portrait); }
    if (portrait && g.mode === 'play' && !g.noAutoPause) g.pause();
    let st = '';
    if (g.mode === 'play') {
      if (g.qte) st = 'qte';
      else if (g.camView) st = 'cam';
      else if (g.phone.open) st = 'phone';
      else if (g.modal === 'choice' || g.docs.isOpen()) st = 'none';
      else st = 'play';
    }
    if (st !== this.state) {
      this.state = st;
      this.base.classList.toggle('show', st === 'play');
      this.ctx.className = 'touch-ctx' + (st === 'cam' || st === 'qte' ? ' show ' + st : '');
      // Beim Wechsel alle gehaltenen Eingaben lösen
      if (st !== 'play') {
        this.t.moveX = 0; this.t.moveY = 0; this.t.buttons.clear(); this.aimLatched = false; this.aimBtn.classList.remove('on');
        this.knob.style.transform = ''; this.stick.classList.remove('show', 'run');
      }
    }
    if (st !== 'play') return;
    const armed = !!(w && w.has), carry = !!p.carry;
    const usable = armed && w._canUse();
    // Zielen bleibt nicht hängen, wenn es gerade nicht geht (Rennen, Heilen, Flasche in der Hand …)
    if (this.aimLatched && (!usable || carry || p.sprinting)) { this.aimLatched = false; this.t.buttons.delete('aim'); this.aimBtn.classList.remove('on'); }
    const aiming = usable && !carry && this.t.buttons.has('aim');
    // Aufgabe des großen Knopfs
    const now = performance.now();
    if (now - this._vt > 120) { this._vt = now; this._canVault = p.mode === 'normal' && !p.target && p.canVault(); }
    let act = 'interact', label = 'Benutzen';
    if (aiming) { act = 'fire'; label = 'Schießen'; }
    else if (p.mode === 'hidden') label = 'Raus';
    else if (!p.target && this._canVault) { act = 'vault'; label = 'Klettern'; }
    this.bigAct = act;
    this._label(this.bigBtn, label);
    this.bigBtn.classList.toggle('fire', act === 'fire');
    this._label(this.aimBtn, carry ? 'Werfen' : 'Zielen');
    this._label(this.crouchBtn, p.mode === 'hidden' ? 'Atem' : 'Ducken');
    this.crouchBtn.classList.toggle('lit', p.mode !== 'hidden' && !!p.crouched);
    const cls = this.base.classList;
    cls.toggle('armed', armed || carry);
    cls.toggle('canreload', armed && !carry && w.mag < w.magSize && w.reserve > 0 && !w.reloading);
    cls.toggle('canheal', p.canHeal());
  }
}
