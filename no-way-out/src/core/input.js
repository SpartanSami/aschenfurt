// Eingabesystem: Tastatur, Maus (Pointer Lock), Gamepad, Touch. Aktionen sind frei belegbar.
import { DEFAULT_BINDINGS } from './config.js';

export class Input {
  constructor(canvas, settings) {
    this.canvas = canvas;
    this.settings = settings;
    this.keys = new Set();
    this.pressedThisFrame = new Set();
    this.releasedThisFrame = new Set();
    this.mouseDX = 0; this.mouseDY = 0; this.wheel = 0;
    this.locked = false;
    this.enabled = true;
    this.captureCallback = null;  // für Tastenbelegung
    this.touch = { active: false, moveX: 0, moveY: 0, lookDX: 0, lookDY: 0, buttons: new Set(), pressed: new Set() };
    this.lastLockChange = 0;
    this.onLockChange = null;
    this.onLockFail = null;
    this.lockFailed = false;  // Pointer Lock verweigert (z. B. eingebettetes Fenster)
    this.dragLook = false;    // Umsehen per Ziehen ist aktiv, solange gespielt wird
    this.dragging = false;

    window.addEventListener('keydown', (e) => this._key(e, true));
    window.addEventListener('keyup', (e) => this._key(e, false));
    window.addEventListener('blur', () => { this.keys.clear(); });
    document.addEventListener('mousemove', (e) => {
      // Ersatz, falls der Browser den Mauszeiger nicht einfangen lässt: Umsehen mit gedrückter Maustaste
      if (this.locked || (this.dragLook && this.dragging)) { this.mouseDX += e.movementX || 0; this.mouseDY += e.movementY || 0; }
    });
    document.addEventListener('pointerlockerror', () => { this.lockFailed = true; if (this.onLockFail) this.onLockFail(); });
    document.addEventListener('mousedown', (e) => {
      const code = 'Mouse' + e.button;
      if (this.captureCallback) { e.preventDefault(); const cb = this.captureCallback; this.captureCallback = null; cb(code); return; }
      if (this.locked) { this.keys.add(code); this.pressedThisFrame.add(code); }
      else if (this.dragLook && e.target === this.canvas) { this.dragging = true; this.requestLock(); }
    });
    document.addEventListener('mouseup', (e) => {
      this.dragging = false;
      const code = 'Mouse' + e.button;
      this.keys.delete(code); this.releasedThisFrame.add(code);
    });
    document.addEventListener('wheel', (e) => { if (this.locked) this.wheel += Math.sign(e.deltaY); }, { passive: true });
    document.addEventListener('contextmenu', (e) => { if (this.locked) e.preventDefault(); });
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.canvas;
      this.lastLockChange = performance.now();
      if (!this.locked) this.keys.clear();
      if (this.onLockChange) this.onLockChange(this.locked);
    });
  }

  _key(e, down) {
    if (this.captureCallback && down) {
      e.preventDefault();
      const cb = this.captureCallback; this.captureCallback = null; cb(e.code); return;
    }
    // Tab/Leertaste/Pfeile sollen die Seite nicht scrollen oder den Fokus verschieben
    if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) && (this.locked || this.gameFocus)) e.preventDefault();
    if (e.repeat) return;
    if (down) { this.keys.add(e.code); this.pressedThisFrame.add(e.code); }
    else { this.keys.delete(e.code); this.releasedThisFrame.add(e.code); }
  }

  bindings() { return this.settings.bindings || DEFAULT_BINDINGS; }

  down(action) {
    const b = this.bindings()[action] || [];
    for (const k of b) if (this.keys.has(k)) return true;
    if (this.touch.buttons.has(action)) return true;
    return this._padDown(action);
  }
  pressed(action) {
    const b = this.bindings()[action] || [];
    for (const k of b) if (this.pressedThisFrame.has(k)) return true;
    if (this.touch.pressed.has(action)) return true;
    return this._padPressed(action);
  }
  released(action) {
    const b = this.bindings()[action] || [];
    for (const k of b) if (this.releasedThisFrame.has(k)) return true;
    return false;
  }
  rawPressed(code) { return this.pressedThisFrame.has(code); }
  // Aktion für diesen Frame verbrauchen (verhindert Doppelbelegung, z. B. Anruf annehmen vs. Tür öffnen)
  consume(action) {
    const b = this.bindings()[action] || [];
    for (const k of b) this.pressedThisFrame.delete(k);
    this.touch.pressed.delete(action);
    if (this.padButtons && Input.PAD[action] !== undefined) this.prevPadButtons[Input.PAD[action]] = true;
  }

  // Bewegungsvektor (x = rechts, y = vorwärts)
  moveAxis() {
    let x = 0, y = 0;
    if (this.down('forward')) y += 1;
    if (this.down('back')) y -= 1;
    if (this.down('left')) x -= 1;
    if (this.down('right')) x += 1;
    x += this.touch.moveX; y += this.touch.moveY;
    const p = this.pad;
    if (p) {
      const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
      if (Math.abs(ax) > 0.15) x += ax;
      if (Math.abs(ay) > 0.15) y -= ay;
    }
    const l = Math.hypot(x, y);
    if (l > 1) { x /= l; y /= l; }
    return { x, y };
  }

  lookDelta() {
    let dx = this.mouseDX, dy = this.mouseDY;
    dx += this.touch.lookDX; dy += this.touch.lookDY;
    const p = this.pad;
    if (p) {
      const rx = p.axes[2] || 0, ry = p.axes[3] || 0;
      if (Math.abs(rx) > 0.12) dx += rx * 14;
      if (Math.abs(ry) > 0.12) dy += ry * 14;
    }
    return { dx, dy };
  }

  // Gamepad (Standard-Mapping)
  _pollPad() {
    this.prevPadButtons = this.padButtons || [];
    this.pad = null; this.padButtons = [];
    if (!navigator.getGamepads) return;
    const pads = navigator.getGamepads();
    for (const p of pads) { if (p && p.connected) { this.pad = p; break; } }
    if (this.pad) this.padButtons = this.pad.buttons.map((b) => b.pressed);
  }
  static PAD = { interact: 0, vault: 1, crouch: 2, phone: 3, flashlight: 4, heal: 5, throw: 7, sprint: 10, pause: 9, forward: 12, back: 13, left: 14, right: 15 };
  padPressed(action) { return this._padPressed(action); }
  _padDown(action) {
    const i = Input.PAD[action];
    if (i === undefined || !this.padButtons) return false;
    if (action === 'sprint' && this.pad && (this.pad.buttons[6]?.pressed)) return true;
    return !!this.padButtons[i];
  }
  _padPressed(action) {
    const i = Input.PAD[action];
    if (i === undefined || !this.padButtons) return false;
    return !!this.padButtons[i] && !this.prevPadButtons[i];
  }

  beginFrame() { this._pollPad(); }
  endFrame() {
    this.pressedThisFrame.clear();
    this.releasedThisFrame.clear();
    this.mouseDX = 0; this.mouseDY = 0; this.wheel = 0;
    this.touch.lookDX = 0; this.touch.lookDY = 0;
    this.touch.pressed.clear();
  }

  requestLock() {
    if (this.locked) return;
    // Browser verlangen nach dem Verlassen eine kurze Pause vor dem erneuten Sperren
    const fail = () => { this.lockFailed = true; if (this.onLockFail) this.onLockFail(); };
    if (!this.canvas.requestPointerLock) { fail(); return; }
    try {
      const r = this.canvas.requestPointerLock();
      if (r && r.catch) r.catch(fail);
    } catch (e) { fail(); }
  }
  exitLock() { if (document.pointerLockElement) document.exitPointerLock(); }

  captureNextKey(cb) { this.captureCallback = cb; }

  static keyLabel(code) {
    if (!code) return '—';
    const map = {
      Space: 'Leertaste', ShiftLeft: 'Shift', ShiftRight: 'Shift R', ControlLeft: 'Strg', ControlRight: 'Strg R',
      Enter: 'Enter', Escape: 'Esc', Tab: 'Tab', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
      Mouse0: 'Linke Maustaste', Mouse1: 'Mittlere Maustaste', Mouse2: 'Rechte Maustaste', Backspace: 'Rücktaste',
      AltLeft: 'Alt',
    };
    if (map[code]) return map[code];
    if (code.startsWith('Key')) return code.slice(3);
    if (code.startsWith('Digit')) return code.slice(5);
    return code;
  }
  label(action) { const b = this.bindings()[action]; return Input.keyLabel(b && b[0]); }
}
