// Türen: Drehtüren (einfach/doppelt), Schiebetüren (Labor/Aufzug/Sicherheit), Rolltore.
// Zustand beeinflusst Kollision, Sichtlinien, Licht (Raster-Textur) und Geräuschausbreitung.
import * as THREE from 'three';
import { F } from './grid.js';
import { getMat } from '../render/materials.js';
import { bus } from '../core/events.js';

export class Door {
  constructor(level, def) {
    this.level = level;
    this.def = def;
    this.id = def.id;
    this.x = def.x; this.y = def.y;
    this.axis = def.axis;
    this.kind = def.kind;
    this.locked = def.locked;
    this.hp = def.strength;
    this.broken = false;
    this.amount = def.open ? 1 : 0;   // 0 = zu, 1 = offen
    this.target = this.amount;
    this.swing = 1;
    this.autoTimer = 0;
    this.partner = null;
    this.bashCooldown = 0;
    this.lastShut = this.isShut();
    const g = level.grid;
    this.fy = g.floorY[g.idx(def.x, def.y)];
    this.height = def.height || 2.15;
    this.center = new THREE.Vector3(def.x + 0.5, this.fy + 1.1, def.y + 0.5);
    this.sliding = ['slide', 'security', 'elevator', 'lab'].includes(this.kind);
    this.shutter = this.kind === 'shutter';
    this.zombieProof = this.sliding || this.shutter || def.noZombie;
    this._buildPanel();
    this.collider = level.addCollider({
      cx: def.x + 0.5, cz: def.y + 0.5, hx: this.axis === 'x' ? 0.5 : 0.09, hz: this.axis === 'x' ? 0.09 : 0.5,
      ang: 0, cos: 1, sin: 0, y0: this.fy, y1: this.fy + this.height, vault: false, door: this, enabled: true,
    });
    this._applyFlags();
    this._place();
  }

  _buildPanel() {
    const d = this.def;
    const matName = d.mat || ({ normal: 'door_h', security: 'door_metal', slide: 'door_lab', lab: 'door_lab', elevator: 'steel', shutter: 'metal', metal: 'door_metal' }[this.kind] || 'door_h');
    const mat = getMat(matName);
    this.pivot = new THREE.Group();
    const w = this.sliding ? 1.0 : 0.92;
    const h = this.shutter ? this.height : this.height - 0.08;
    let panel;
    if (this.shutter) {
      panel = new THREE.Group();
      for (let i = 0; i < Math.ceil(h / 0.12); i++) {
        const s = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.11, 0.05), mat);
        s.position.set(0.5, 0.06 + i * 0.12, 0); s.castShadow = true; panel.add(s);
      }
    } else {
      panel = new THREE.Mesh(new THREE.BoxGeometry(w, h, this.sliding ? 0.08 : 0.05), mat);
      panel.castShadow = true; panel.receiveShadow = true;
      panel.position.set(w / 2, h / 2, 0);
      // Griff
      if (!this.sliding) {
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.06), getMat('chrome'));
        handle.position.set(w - 0.12, 1.02 - h / 2, 0.05); panel.add(handle);
        const handle2 = handle.clone(); handle2.position.z = -0.05; panel.add(handle2);
      } else if (this.kind === 'security' || this.kind === 'lab') {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, 0.085), getMat('plastic_yellow'));
        stripe.position.set(0, -h / 2 + 0.25, 0); panel.add(stripe);
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 0.09), getMat('glass_dark'));
        win.position.set(0, 0.35, 0); panel.add(win);
      }
    }
    this.panel = panel;
    this.pivot.add(panel);
    this.level.root.add(this.pivot);
    // Statuslampe für verriegelbare Türen
    if (this.sliding && this.kind !== 'elevator') {
      this.lamp = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.04), new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xff2020, emissiveIntensity: 2 }));
      this.level.root.add(this.lamp);
    }
  }

  // Rahmen (statisch, gebatcht)
  buildFrame(batch) {
    const d = this.def, fy = this.fy, h = this.height;
    const mat = this.sliding || this.shutter ? 'metal_dark' : 'plastic_white';
    const add = (w, hh, dd, x, y, z) => { const g = new THREE.BoxGeometry(w, hh, dd); g.translate(x, y, z); batch.geo(mat, g, d.x, d.y); };
    if (this.axis === 'x') {
      add(0.06, h, 0.22, d.x + 0.03, fy + h / 2, d.y + 0.5);
      add(0.06, h, 0.22, d.x + 0.97, fy + h / 2, d.y + 0.5);
      add(1.0, 0.06, 0.22, d.x + 0.5, fy + h - 0.03, d.y + 0.5);
    } else {
      add(0.22, h, 0.06, d.x + 0.5, fy + h / 2, d.y + 0.03);
      add(0.22, h, 0.06, d.x + 0.5, fy + h / 2, d.y + 0.97);
      add(0.22, 0.06, 1.0, d.x + 0.5, fy + h - 0.03, d.y + 0.5);
    }
    if (this.lamp) {
      if (this.axis === 'x') this.lamp.position.set(d.x + 0.9, fy + h + 0.12, d.y + 0.5 + 0.13);
      else this.lamp.position.set(d.x + 0.5 + 0.13, fy + h + 0.12, d.y + 0.9);
    }
  }

  isShut() { return this.sliding || this.shutter ? this.amount < 0.55 : this.amount < 0.2; }
  isOpen() { return this.amount > 0.85; }

  _applyFlags() {
    const g = this.level.grid;
    const shut = this.isShut();
    if (shut) g.set(this.x, this.y, F.DOORSHUT); else g.clear(this.x, this.y, F.DOORSHUT);
    // Zombies: verschlossene oder zombiesichere geschlossene Türen sind unpassierbar
    if (shut && (this.locked || this.zombieProof)) g.set(this.x, this.y, F.DOORLOCK); else g.clear(this.x, this.y, F.DOORLOCK);
    this.collider.enabled = shut;
    if (shut !== this.lastShut) {
      this.lastShut = shut;
      this.level.gridDirty = true; this.level.ambDirty = true;
    }
    if (this.lamp) this.lamp.material.emissive.setHex(this.locked ? 0xff2020 : 0x20ff60);
  }

  _place() {
    const d = this.def;
    const p = this.pivot;
    const side = d.side ?? 0; // Doppeltür: 0 links, 1 rechts
    if (this.shutter) {
      p.position.set(d.x, this.fy + this.amount * (this.height - 0.25), d.y + 0.5);
      if (this.axis === 'z') { p.rotation.y = -Math.PI / 2; p.position.set(d.x + 0.5, this.fy + this.amount * (this.height - 0.25), d.y); }
      return;
    }
    if (this.sliding) {
      const off = this.amount * 0.96 * (side ? 1 : -1);
      if (this.axis === 'x') { p.position.set(d.x + off, this.fy, d.y + 0.5); p.rotation.y = 0; }
      else { p.position.set(d.x + 0.5, this.fy, d.y + 1 - off); p.rotation.y = Math.PI / 2; }
      return;
    }
    const ang = this.amount * 1.72 * this.swing;
    if (this.axis === 'x') {
      if (side === 0) { p.position.set(d.x + 0.04, this.fy, d.y + 0.5); p.rotation.y = ang; }
      else { p.position.set(d.x + 0.96, this.fy, d.y + 0.5); p.rotation.y = Math.PI - ang; }
    } else {
      if (side === 0) { p.position.set(d.x + 0.5, this.fy, d.y + 0.96); p.rotation.y = Math.PI / 2 + ang; }
      else { p.position.set(d.x + 0.5, this.fy, d.y + 0.04); p.rotation.y = -Math.PI / 2 - ang; }
    }
  }

  // Öffnungsrichtung weg von der handelnden Position
  _swingFrom(pos) {
    if (!pos) return;
    const d = this.def;
    if (this.axis === 'x') {
      const fromSouth = pos.z > d.y + 0.5; // kommt von +z -> schwingt nach -z
      this.swing = fromSouth ? 1 : -1;
    } else {
      const fromEast = pos.x > d.x + 0.5;  // kommt von +x -> schwingt nach -x
      this.swing = fromEast ? 1 : -1;
    }
  }

  open(pos = null, opts = {}) {
    if (this.locked && !opts.force) return false;
    if (this.target === 1) return true;
    if (this.amount < 0.05) this._swingFrom(pos);
    this.target = 1;
    this.speed = opts.fast ? 4.5 : this.sliding ? 1.6 : 2.4;
    if (this.def.autoClose) this.autoTimer = this.def.autoClose;
    if (!opts.silent) bus.emit('door', { door: this, action: 'open', loud: !!opts.fast, pos: this.center });
    if (this.partner && !opts.noPartner) this.partner.open(pos, { ...opts, noPartner: true, silent: true });
    return true;
  }
  close(opts = {}) {
    if (this.broken) return false;
    if (this.target === 0) return true;
    if (!opts.force && this._agentInDoorway()) return false;
    this.target = 0;
    this.speed = opts.fast ? 4 : this.sliding ? (opts.slow ? 0.55 : 1.4) : 2.4;
    if (!opts.silent) bus.emit('door', { door: this, action: 'close', loud: !!opts.fast, pos: this.center });
    if (this.partner && !opts.noPartner) this.partner.close({ ...opts, noPartner: true, silent: true });
    return true;
  }
  toggle(pos, fast) { return this.target > 0.5 ? this.close({ fast }) : this.open(pos, { fast }); }
  setLocked(b) {
    this.locked = b;
    if (this.partner && this.partner.locked !== b) this.partner.setLocked(b);
    this._applyFlags();
  }

  _agentInDoorway() {
    const game = this.level.game;
    const cx = this.def.x + 0.5, cz = this.def.y + 0.5;
    const near = (p, r) => Math.abs(p.x - cx) < (this.axis === 'x' ? 0.5 : 0.1) + r && Math.abs(p.z - cz) < (this.axis === 'x' ? 0.1 : 0.5) + r;
    if (game.player && near(game.player.pos, game.player.radius)) return true;
    for (const z of game.zombies || []) if (z.alive && near(z.pos, 0.3)) return true;
    for (const n of game.npcs || []) if (n.active && near(n.pos, 0.3)) return true;
    return false;
  }

  // Zombie schlägt gegen die Tür. Rückgabe true, wenn sie aufbricht.
  bash(force, fromPos) {
    if (this.bashCooldown > 0) return false;
    this.bashCooldown = 0.25;
    bus.emit('door', { door: this, action: 'bash', pos: this.center });
    if (this.zombieProof || this.locked) return false;
    this.hp -= force;
    if (this.hp <= 0) {
      this.broken = true;
      this._swingFrom(fromPos);
      this.target = 1; this.speed = 6;
      bus.emit('door', { door: this, action: 'burst', loud: true, pos: this.center });
      return true;
    }
    return false;
  }

  update(dt) {
    this.bashCooldown -= dt;
    if (this.amount !== this.target) {
      const s = this.speed || 2;
      if (this.target > this.amount) this.amount = Math.min(this.target, this.amount + dt * s);
      else {
        // nicht schließen, wenn jemand im Weg steht
        if (this.amount < 0.6 && this._agentInDoorway() && !this.sliding) { this.target = this.amount; }
        else if (this.sliding && this.amount < 0.7 && this._agentInDoorway() && !this.crushing) { this.target = 1; this.autoTimer = 1.0; }
        else this.amount = Math.max(this.target, this.amount - dt * s);
        if (this.amount === 0) bus.emit('door', { door: this, action: 'shut', pos: this.center });
      }
      this._place();
      this._applyFlags();
    }
    if (this.autoTimer > 0 && this.target === 1 && this.amount === 1) {
      this.autoTimer -= dt;
      if (this.autoTimer <= 0) this.close({ slow: this.def.slowClose });
    }
  }
}
