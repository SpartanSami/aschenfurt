// Touch-Steuerung für Tablet und Smartphone (z. B. iPad):
// linke Bildschirmhälfte = Bewegungsstick (ganz nach außen = rennen), rechte Hälfte = umsehen per Wischen,
// Knöpfe rechts unten für die Aktionen. Je nach Lage (Smartphone offen, Kameras, gepackt) erscheinen passende Knöpfe.
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
      <div class="t-btns">
        <button class="t-btn t-big" data-t="interact" data-hold="1">Benutzen</button>
        <button class="t-btn" data-t="vault" data-hold="1">Klettern</button>
        <button class="t-btn" data-t="crouch" data-hold="1">Ducken</button>
        <button class="t-btn" data-t="throw">Werfen</button>
        <button class="t-btn" data-t="heal">Heilen</button>
        <button class="t-btn" data-t="flashlight">Lampe</button>
        <button class="t-btn" data-t="phone">Handy</button>
      </div>
      <button class="t-btn t-fire" data-t="fire">Schießen</button>
      <button class="t-btn t-reload" data-t="reload">Laden</button>
      <button class="t-btn t-pause" data-t="pause" aria-label="Pause">II</button>
      <div class="t-rotate">Tipp: Handy quer halten – mehr Sicht, mehr Platz zum Steuern</div>`;
    ui.insertBefore(this.base, ui.firstChild);
    // Kontextebene liegt über allem (Smartphone-Menü, Überwachungskameras, Losreißen)
    this.ctx = document.createElement('div');
    this.ctx.className = 'touch-ctx';
    this.ctx.innerHTML = `
      <div class="t-pad">
        <button class="t-btn" data-t="forward">▲</button>
        <div class="t-row"><button class="t-btn" data-t="left">◀</button><button class="t-btn t-ok" data-t="interact">OK</button><button class="t-btn" data-t="right">▶</button></div>
        <button class="t-btn" data-t="back">▼</button>
      </div>
      <div class="t-side"><button class="t-btn" data-t="crouch">Zurück</button><button class="t-btn" data-t="phone">Handy zu</button></div>
      <div class="t-cam"><button class="t-btn" data-t="left">◀</button><button class="t-btn t-ok" data-t="interact">Schließen</button><button class="t-btn" data-t="right">▶</button></div>
      <div class="t-qte"><button class="t-btn t-huge" data-t="left">◀</button><span>Losreißen!</span><button class="t-btn t-huge" data-t="right">▶</button></div>`;
    ui.appendChild(this.ctx);
    this.knob = this.base.querySelector('.t-knob');
    this.stick = this.base.querySelector('.t-stick');
    this._bindButtons(this.base);
    this._bindButtons(this.ctx);
    this._bindMove(this.base.querySelector('.t-move'));
    this._bindLook(this.base.querySelector('.t-look'));
    this.state = '';
  }

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
    let id = null, lx = 0, ly = 0;
    zone.addEventListener('pointerdown', (e) => {
      if (id !== null) return;
      e.preventDefault(); id = e.pointerId; lx = e.clientX; ly = e.clientY;
      try { zone.setPointerCapture(id); } catch (err) { /* */ }
    });
    zone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return;
      e.preventDefault();
      // Wischen dreht die Sicht etwas kräftiger als die Maus, damit eine Daumenbewegung reicht
      this.t.lookDX += (e.clientX - lx) * 1.6; this.t.lookDY += (e.clientY - ly) * 1.6;
      lx = e.clientX; ly = e.clientY;
    });
    const end = (e) => { if (e.pointerId === id) id = null; };
    zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end); zone.addEventListener('lostpointercapture', end);
  }

  // Pro Bild: passende Ebene zeigen
  update() {
    const g = this.game;
    const armed = !!(g.weapon && g.weapon.has);
    if (armed !== this._armed) { this._armed = armed; this.base.classList.toggle('armed', armed); }
    let st = '';
    if (g.mode === 'play') {
      if (g.qte) st = 'qte';
      else if (g.camView) st = 'cam';
      else if (g.phone.open) st = 'phone';
      else if (g.modal === 'choice' || g.docs.isOpen()) st = 'none';
      else st = 'play';
    }
    if (st === this.state) return;
    this.state = st;
    this.base.classList.toggle('show', st === 'play');
    this.ctx.className = 'touch-ctx' + (st === 'phone' || st === 'cam' || st === 'qte' ? ' show ' + st : '');
    // Beim Wechsel alle gehaltenen Eingaben lösen
    if (st !== 'play') { this.t.moveX = 0; this.t.moveY = 0; this.t.buttons.clear(); this.knob.style.transform = ''; this.stick.classList.remove('show', 'run'); }
  }
}
