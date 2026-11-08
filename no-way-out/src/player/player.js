// First-Person-Spieler: Bewegung, Ausdauer, Schleichen, Klettern, Verstecken, Interaktion,
// Verletzungszustände, Heilung, Werfen, Kamera (Head-Bob, Wackeln, Verletzungs-Schwanken).
import * as THREE from 'three';
import { PLAYER, NOISE } from '../core/config.js';
import { clamp, damp, lerp, angleDiff } from '../core/rng.js';
import { moveAgent, findVault, spotFree, resolve } from '../world/physics.js';
import { ITEM_INFO } from '../world/items.js';
import { bus } from '../core/events.js';

export const HEALTH_STATES = { healthy: 'Gesund', injured: 'Verletzt', severe: 'Schwer verletzt', dead: 'Tot' };

export class Player {
  constructor(game, camera) {
    this.game = game;
    this.camera = camera;
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.vy = 0;
    this.yaw = 0; this.pitch = 0;
    this.radius = PLAYER.radius;
    this.crouched = false; this.crouchT = 0;
    this.sprinting = false;
    this.stamina = PLAYER.staminaMax; this.regenTimer = 0; this.exhausted = false;
    this.hp = 100;
    this.painkiller = 0;
    this.mode = 'normal';   // normal | vault | hidden | hideMove | grabbed | dead | locked | heal
    this.stepDist = 0; this.bobT = 0; this.bobAmt = 0; this.landDip = 0;
    this.trauma = 0; this.shakeT = 0;
    this.flashlight = false;
    this.target = null; this.holdT = 0;
    this.hide = null; this.breathHeld = false; this.breath = PLAYER.breathHoldMax;
    this.carry = null;
    this.heal = null;
    this.speedNow = 0;
    this.noiseLevel = 0;
    this.lastHitTime = -99;
    this.time = 0;
    this.moveAmount = 0;
    this.lookLock = null;
    this.forcedLook = null;
    this.camOffset = new THREE.Vector3();
    this.vaultAnim = null;
    this.camRoll = 0;
    this.lastGround = 0;
    this.headBobScale = 1;
    this.footSurface = 'hard';
  }

  get eyeHeight() { return lerp(PLAYER.eyeStand, PLAYER.eyeCrouch, this.crouchT); }
  get height() { return this.crouched ? 1.15 : 1.75; }
  get healthState() {
    if (this.hp <= 0) return 'dead';
    if (this.hp > 66) return 'healthy';
    if (this.hp > 33) return 'injured';
    return 'severe';
  }
  get injury() { // 0..1 Stärke der Beeinträchtigung
    const s = this.healthState;
    const m = this.game.difficulty.injuryMul;
    const pk = this.painkiller > 0 ? 0.5 : 1;
    return clamp((s === 'healthy' ? 0 : s === 'injured' ? 0.45 : 1) * m * pk, 0, 1.2);
  }

  spawn(x, z, yaw = 0) {
    this.pos.set(x, this.game.level.grid.heightAt(x, z), z);
    this.vel.set(0, 0, 0); this.vy = 0;
    this.yaw = yaw; this.pitch = 0;
    this.mode = 'normal';
    this.hide = null; this.vaultAnim = null; this.heal = null;
    this.stamina = this.staminaMax();
    this.trauma = 0;
    this.updateCamera(0);
  }

  staminaMax() { return PLAYER.staminaMax * (1 - this.injury * 0.55); }

  // ---------------- Hauptupdate ----------------
  update(dt, input) {
    this.time += dt;
    if (this.painkiller > 0) this.painkiller -= dt;
    const look = this.mode !== 'dead' && this.mode !== 'locked';
    if (look && !this.game.phone.isOpen()) this._look(input);
    else if (look && this.game.phone.isOpen()) this._look(input, 0.35);
    switch (this.mode) {
      case 'normal':
        if (this.game.phone.isOpen()) { this._move(dt, input, 0); if (input.pressed('flashlight')) this.toggleFlashlight(); this.target = null; }
        else { this._move(dt, input); this._interact(dt, input); }
        break;
      case 'heal': this._healUpdate(dt); this._move(dt, input, 0.0); break;
      case 'vault': this._vaultUpdate(dt); break;
      case 'hidden': this._hiddenUpdate(dt, input); break;
      case 'hideMove': this._hideMoveUpdate(dt); break;
      case 'grabbed': this._move(dt, input, 0); break;
      case 'locked': this._move(dt, input, 0); break;
      case 'dead': break;
    }
    // Ausdauer
    if (this.mode !== 'hidden') {
      if (this.sprinting && this.speedNow > 1.5) {
        this.stamina -= PLAYER.sprintDrain * dt * (1 + this.injury * 0.4);
        this.regenTimer = PLAYER.regenDelay;
        if (this.stamina <= 0) { this.stamina = 0; this.exhausted = true; bus.emit('exhausted'); }
      } else {
        this.regenTimer -= dt;
        if (this.regenTimer <= 0) this.stamina = Math.min(this.staminaMax(), this.stamina + PLAYER.staminaRegen * dt * (this.crouched ? 1.25 : 1) * (this.speedNow < 0.3 ? 1.35 : 1));
      }
      if (this.exhausted && this.stamina >= PLAYER.exhaustedUntil) this.exhausted = false;
    }
    this.trauma = Math.max(0, this.trauma - dt * 0.9);
    this.landDip = damp(this.landDip, 0, 8, dt);
    this.updateCamera(dt);
  }

  _look(input, scale = 1) {
    const s = this.game.settings;
    const { dx, dy } = input.lookDelta();
    const sens = 0.0022 * s.sensitivity * scale;
    this.yaw -= dx * sens;
    this.pitch -= dy * sens * (s.invertY ? -1 : 1);
    this.pitch = clamp(this.pitch, -1.45, 1.45);
    if (this.mode === 'hidden' && this.hide) {
      const lim = this.hide.type === 'locker' ? 0.65 : this.hide.type === 'bed' ? 1.1 : 1.3;
      const d = angleDiff(this.hide.yaw, this.yaw);
      if (Math.abs(d) > lim) this.yaw = this.hide.yaw + Math.sign(d) * lim;
      this.pitch = clamp(this.pitch, this.hide.type === 'bed' ? -0.35 : -0.7, this.hide.type === 'bed' ? 0.25 : 0.6);
    }
    if (this.forcedLook) {
      // sanft zu einem Punkt drehen (Skript)
      const f = this.forcedLook;
      const tYaw = Math.atan2(-(f.x - this.pos.x), -(f.z - this.pos.z));
      this.yaw += angleDiff(this.yaw, tYaw) * Math.min(1, 0.06 * (f.speed || 1));
      const dist = Math.hypot(f.x - this.pos.x, f.z - this.pos.z);
      const tPitch = Math.atan2((f.y ?? 1.5) - (this.pos.y + this.eyeHeight), dist);
      this.pitch += (tPitch - this.pitch) * 0.05 * (f.speed || 1);
    }
  }

  _move(dt, input, speedScale = 1) {
    const level = this.game.level;
    const g = level.grid;
    // Ducken
    if (speedScale > 0) {
      if (this.game.settings.crouchToggle) { if (input.pressed('crouch')) this.crouched = !this.crouched; }
      else this.crouched = input.down('crouch');
    }
    if (!this.crouched && this.crouchT > 0.05) {
      // aufstehen nur mit genug Kopffreiheit
      const k = g.idx(Math.floor(this.pos.x), Math.floor(this.pos.z));
      if (g.ceilY[k] - this.pos.y < 1.78) this.crouched = true;
    }
    this.crouchT = damp(this.crouchT, this.crouched ? 1 : 0, 10, dt);
    const ax = speedScale > 0 ? input.moveAxis() : { x: 0, y: 0 };
    const phoneOpen = this.game.phone.isOpen();
    const wantSprint = speedScale > 0 && input.down('sprint') && ax.y > 0.3 && !this.crouched && !this.exhausted && !phoneOpen && this.stamina > 1;
    this.sprinting = wantSprint;
    const inj = this.injury;
    let speed = this.crouched ? PLAYER.crouch : wantSprint ? PLAYER.sprint * (1 - inj * 0.32) : PLAYER.walk * (1 - inj * 0.2);
    if (phoneOpen) speed *= 0.55;
    if (this.carry) speed *= 0.97;
    if (this.exhausted && !this.crouched) speed *= 0.85;
    speed *= speedScale;
    // Hinken bei schwerer Verletzung
    if (this.healthState === 'severe' && this.painkiller <= 0) speed *= 0.85 + 0.15 * Math.abs(Math.sin(this.bobT * 0.5));
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
    const rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    const tx = (fx * ax.y + rx * ax.x) * speed, tz = (fz * ax.y + rz * ax.x) * speed;
    const acc = (Math.hypot(tx, tz) > Math.hypot(this.vel.x, this.vel.z) ? PLAYER.accel : PLAYER.accel * 1.4) * (1 - inj * 0.3);
    this.vel.x = damp(this.vel.x, tx, acc * 0.6, dt);
    this.vel.z = damp(this.vel.z, tz, acc * 0.6, dt);
    const ox = this.pos.x, oz = this.pos.z;
    moveAgent(level, this.pos, this.vel.x * dt, this.vel.z * dt, { radius: this.radius, height: this.height });
    // Agenten-Separation (Begleiter nicht blockierend, Zombies schon)
    for (const z of this.game.zombies) {
      if (!z.alive || z.ghost) continue;
      const dx = this.pos.x - z.pos.x, dz = this.pos.z - z.pos.z;
      const d = Math.hypot(dx, dz), m = this.radius + z.radius;
      if (d < m && d > 0.001) { const k = (m - d) / d * 0.6; this.pos.x += dx * k; this.pos.z += dz * k; }
    }
    resolve(level, this.pos, this.radius, this.height, {});
    const moved = Math.hypot(this.pos.x - ox, this.pos.z - oz);
    this.speedNow = dt > 0 ? moved / dt : 0;
    // Höhe / Schwerkraft
    const ground = g.heightAt(this.pos.x, this.pos.z);
    if (this.pos.y > ground + 0.05) {
      this.vy -= 18 * dt;
      this.pos.y += this.vy * dt;
      if (this.pos.y <= ground) {
        const impact = -this.vy;
        this.pos.y = ground; this.vy = 0;
        if (impact > 3.5) { this.landDip = Math.min(0.25, impact * 0.04); this.game.noise.emit(this.pos.x, this.pos.z, NOISE.land, 'land'); this.game.audio.play('land', { vol: 0.8 }); if (impact > 7) this.damage(15, 'fall'); }
      }
    } else {
      const diff = ground - this.pos.y;
      this.pos.y = diff > 0 ? lerp(this.pos.y, ground, Math.min(1, dt * 18)) : ground;
      this.vy = 0;
    }
    // Schritte
    if (moved > 0.0005) {
      const stride = this.crouched ? 0.62 : this.sprinting ? 0.95 : 0.76;
      this.stepDist += moved;
      this.bobT += moved / stride * Math.PI;
      if (this.stepDist >= stride) {
        this.stepDist -= stride;
        this._footstep();
      }
    }
    this.moveAmount = damp(this.moveAmount, clamp(this.speedNow / PLAYER.walk, 0, 2), 8, dt);
  }

  _footstep() {
    const r = this.crouched ? NOISE.crouchStep : this.sprinting ? NOISE.sprintStep : NOISE.walkStep;
    const mul = this.game.chapterNoiseMul || 1;
    this.game.noise.emit(this.pos.x, this.pos.z, r * mul, 'step');
    this.game.audio.footstep(this.surface(), this.crouched ? 0.25 : this.sprinting ? 1 : 0.55);
  }
  surface() {
    const g = this.game.level.grid;
    const room = this.game.level.def.rooms[g.room[g.idx(Math.floor(this.pos.x), Math.floor(this.pos.z))]];
    if (!room) return 'hard';
    const f = room.floor || '';
    if (f.includes('metal')) return 'metal';
    if (f.includes('gravel')) return 'gravel';
    if (room.wet) return 'wet';
    if (f.includes('asphalt') || f.includes('concrete') || f.includes('pavement') || f.includes('tunnel')) return 'concrete';
    return 'hard';
  }

  // ---------------- Interaktion ----------------
  _interact(dt, input) {
    const game = this.game;
    this.target = this._findTarget();
    if (this.target && this.target.hold) {
      if (input.down('interact')) {
        this.holdT += dt;
        if (this.holdT >= this.target.hold) { this.holdT = 0; this._doInteract(this.target); }
      } else this.holdT = 0;
    } else {
      this.holdT = 0;
      if (input.pressed('interact') && this.target) this._doInteract(this.target);
    }
    // Klettern
    if (input.pressed('vault')) this.tryVault();
    if (input.pressed('heal')) this.startHeal();
    if (input.pressed('flashlight')) this.toggleFlashlight();
    if (input.pressed('throw') && this.carry) this.throwCarry();
    // Auto-Aufnahme von Heilmitteln/Schlüsseln in unmittelbarer Nähe
    for (const it of game.level.items) {
      if (!it.alive || it.info.kind === 'doc' || it.info.kind === 'throw' || it.noAuto) continue;
      if (Math.hypot(it.pos.x - this.pos.x, it.pos.z - this.pos.z) < 0.75 && Math.abs(it.pos.y - this.pos.y) < 1.4) game.pickUp(it);
    }
  }

  _findTarget() {
    const game = this.game, level = game.level;
    const eye = new THREE.Vector3(this.pos.x, this.pos.y + this.eyeHeight, this.pos.z);
    const dir = new THREE.Vector3(); this.camera.getWorldDirection(dir);
    let best = null, bestScore = -Infinity;
    const consider = (obj, pos, radius) => {
      const to = new THREE.Vector3().subVectors(pos, eye);
      const d = to.length();
      if (d > (radius ?? 1.1) + 0.9) return;
      to.normalize();
      const dot = to.dot(dir);
      if (dot < (d < 0.8 ? 0.3 : 0.72)) return;
      if (!level.grid.los(eye.x, eye.z, pos.x, pos.z, false, obj.ignoreCells)) return;
      const score = dot * 2 - d * 0.6;
      if (score > bestScore) { bestScore = score; best = obj; }
    };
    for (const ia of level.interacts) { if (!ia.enabled || ia.enabled()) consider(ia, ia.pos, ia.radius); }
    for (const d of level.doors) {
      if (d.def.noInteract || d.kind === 'shutter' || d.kind === 'elevator') continue;
      const p = d.center.clone();
      const ignore = new Set([d.y * level.grid.w + d.x]);
      const o = { kind: 'door', door: d, hold: 0, ignoreCells: ignore, prompt: () => this._doorPrompt(d) };
      consider(o, p, 1.0);
    }
    for (const h of level.hides) {
      if (h.occupied) continue;
      const p = new THREE.Vector3(h.x, this.pos.y + 0.8, h.z);
      consider({ kind: 'hide', hide: h, hold: 0, prompt: () => h.prompt }, p, 1.0);
    }
    return best;
  }
  _doorPrompt(d) {
    if (d.broken) return null;
    if (d.locked) return d.def.lockedText || 'Verschlossen';
    if (d.sliding && d.def.kind !== 'normal') return d.target > 0.5 ? 'Tür schließen' : 'Tür öffnen';
    return d.target > 0.5 ? 'Tür schließen' : (this.sprinting ? 'Tür aufstoßen' : 'Tür öffnen');
  }

  _doInteract(t) {
    const game = this.game;
    if (t.kind === 'door') {
      const d = t.door;
      if (d.broken) return;
      if (d.locked) {
        if (d.def.key && game.inventory.has(d.def.key)) {
          d.setLocked(false); game.hud.toast('Mit ' + game.inventory.name(d.def.key) + ' entriegelt');
          game.audio.play('unlock', { pos: d.center }); game.story.onEvent('unlock:' + d.id);
          d.open(this.pos);
        } else {
          game.audio.play('locked', { pos: d.center });
          game.story.onEvent('locked:' + d.id);
          if (d.def.lockedHint) game.hud.toast(d.def.lockedHint);
        }
        return;
      }
      const fast = this.sprinting;
      if (d.target > 0.5) d.close({ fast }); else d.open(this.pos, { fast });
      game.hands.reach();
      return;
    }
    if (t.kind === 'hide') { this.enterHide(t.hide); return; }
    if (t.interact) { game.hands.reach(); t.interact(game); }
  }

  // ---------------- Klettern ----------------
  tryVault() {
    if (this.mode !== 'normal' || this.carry === 'heavy') return false;
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
    const v = findVault(this.game.level, this.pos, fx, fz, 1.15);
    if (!v) return false;
    if (this.exhausted && v.top - this.pos.y > 0.9) { this.game.hud.toast('Zu erschöpft zum Klettern'); return false; }
    this.mode = 'vault';
    const dur = (v.kind === 'ledge' ? 1.0 : 0.72) * (1 + this.injury * 0.6);
    this.vaultAnim = { t: 0, dur, from: this.pos.clone(), to: new THREE.Vector3(v.land.x, v.land.y, v.land.z), top: v.top };
    this.game.noise.emit(this.pos.x, this.pos.z, NOISE.vault, 'vault');
    this.game.audio.play('vault', { vol: 0.8 });
    this.game.hands.vault();
    this.stamina = Math.max(0, this.stamina - 8);
    this.crouched = false;
    return true;
  }
  _vaultUpdate(dt) {
    const a = this.vaultAnim;
    a.t += dt;
    const t = clamp(a.t / a.dur, 0, 1);
    const e = t * t * (3 - 2 * t);
    this.pos.x = lerp(a.from.x, a.to.x, e);
    this.pos.z = lerp(a.from.z, a.to.z, e);
    const arc = Math.sin(t * Math.PI);
    this.pos.y = lerp(a.from.y, a.to.y, e) + arc * Math.max(0.15, a.top - Math.max(a.from.y, a.to.y) + 0.1);
    this.pitch = damp(this.pitch, -0.25 * arc, 6, dt);
    if (t >= 1) {
      this.pos.copy(a.to);
      this.mode = 'normal'; this.vaultAnim = null;
      this.vel.multiplyScalar(0.5);
      this.landDip = 0.08;
    }
  }

  // ---------------- Verstecken ----------------
  enterHide(h) {
    if (this.carry === 'heavy') return;
    this.hide = h; h.occupied = true;
    this.mode = 'hideMove';
    this.hideAnim = { t: 0, dur: 0.9, from: this.pos.clone(), fromYaw: this.yaw, fromEye: this.eyeHeight, enter: true };
    this.crouched = h.type !== 'locker';
    if (h.door) { h.door.rotation.y = -1.6; }
    this.game.audio.play(h.type === 'locker' ? 'locker_open' : 'cloth', { pos: new THREE.Vector3(h.x, this.pos.y + 1, h.z) });
    this.game.noise.emit(h.x, h.z, h.type === 'locker' ? 3.5 : 2, 'hide');
    this.game.onHideEnter(h);
    this.breath = PLAYER.breathHoldMax; this.breathHeld = false;
  }
  exitHide() {
    const h = this.hide;
    if (!h) return;
    this.mode = 'hideMove';
    this.hideAnim = { t: 0, dur: 0.8, from: this.pos.clone(), enter: false };
    if (h.door) h.door.rotation.y = -1.6;
    this.game.audio.play(h.type === 'locker' ? 'locker_open' : 'cloth', { pos: new THREE.Vector3(h.x, this.pos.y + 1, h.z) });
    this.game.noise.emit(h.x, h.z, 2.5, 'hide');
  }
  _hideMoveUpdate(dt) {
    const a = this.hideAnim, h = this.hide;
    a.t += dt;
    const t = clamp(a.t / a.dur, 0, 1), e = t * t * (3 - 2 * t);
    if (a.enter) {
      this.pos.x = lerp(a.from.x, h.enter.x, e); this.pos.z = lerp(a.from.z, h.enter.z, e);
      this.pos.y = lerp(a.from.y, h.floorY, e);
      this.yaw = a.fromYaw + angleDiff(a.fromYaw, h.yaw) * e;
      if (t >= 1) {
        this.mode = 'hidden';
        if (h.door) h.door.rotation.y = 0;
        this.game.audio.play(h.type === 'locker' ? 'locker_close' : 'cloth', { pos: new THREE.Vector3(h.x, this.pos.y + 1, h.z), vol: 0.6 });
      }
    } else {
      const ex = h.exit;
      const ey = this.game.level.grid.heightAt(ex.x, ex.z);
      this.pos.x = lerp(a.from.x, ex.x, e); this.pos.z = lerp(a.from.z, ex.z, e); this.pos.y = lerp(a.from.y, ey, e);
      if (t >= 1) {
        if (h.door) h.door.rotation.y = 0;
        h.occupied = false; this.hide = null; this.mode = 'normal';
        this.crouched = h.type !== 'locker';
        if (!spotFree(this.game.level, this.pos.x, this.pos.z, this.pos.y, this.radius)) resolve(this.game.level, this.pos, this.radius, this.height, {});
        this.game.onHideExit(h);
      }
    }
  }
  _hiddenUpdate(dt, input) {
    // Atem anhalten
    const hold = input.down('vault');
    if (hold && this.breath > 0) {
      this.breathHeld = true;
      this.breath -= dt;
      if (this.breath <= 0) { this.breath = 0; this.breathHeld = false; this.gasp(); }
    } else {
      if (this.breathHeld) this.game.audio.play('exhale', { vol: 0.5 });
      this.breathHeld = false;
      this.breath = Math.min(PLAYER.breathHoldMax, this.breath + dt * 0.8);
    }
    // Stamina erholt sich im Versteck
    this.stamina = Math.min(this.staminaMax(), this.stamina + PLAYER.staminaRegen * dt * 0.8);
    if (this.exhausted && this.stamina >= PLAYER.exhaustedUntil) this.exhausted = false;
    if (input.pressed('interact')) this.exitHide();
    if (input.pressed('flashlight')) this.toggleFlashlight();
    if (input.pressed('heal')) this.startHeal();
    if (this.heal) this._healUpdate(dt);
    this.speedNow = 0;
  }
  gasp() {
    this.game.audio.play('gasp', { vol: 1 });
    this.game.noise.emit(this.pos.x, this.pos.z, 7, 'gasp');
    this.breath = 0;
    this.breathCooldown = 3;
  }
  // Atemgeräusch im Versteck (Hörradius in m)
  breathingRadius() {
    if (this.breathHeld) return 0;
    const st = 1 - this.stamina / PLAYER.staminaMax;
    return 0.6 + st * 2.6 + this.injury * 1.3;
  }

  // ---------------- Heilung ----------------
  startHeal() {
    const inv = this.game.inventory;
    if (this.heal) return;
    if (this.hp >= 100) { this.game.hud.toast('Keine Verletzungen'); return; }
    let type = null;
    const missing = 100 - this.hp;
    if (missing >= 45 && inv.count('medkit')) type = 'medkit';
    else if (inv.count('bandage')) type = 'bandage';
    else if (inv.count('medkit')) type = 'medkit';
    else if (inv.count('pills')) type = 'pills';
    if (!type && inv.has('serum') && this.game.state.flags.serum_kept && this.hp <= 45) {
      inv.remove('serum'); this.hp = 100; this.painkiller = 60;
      this.game.hud.toast('Serum S-17 injiziert – vollständig geheilt'); this.game.audio.play('pills', { vol: 0.6 });
      this.game.state.flags.serum_used = true; bus.emit('healed', this.hp); return;
    }
    if (!type) { this.game.hud.toast(inv.has('serum') && this.game.state.flags.serum_kept ? 'Das Serum nur im Notfall (schwer verletzt)' : 'Keine Heilmittel'); return; }
    const info = ITEM_INFO[type];
    this.heal = { type, t: 0, dur: info.useTime };
    if (this.mode === 'normal') this.mode = 'heal';
    this.game.hands.heal(type);
    this.game.audio.play(type === 'pills' ? 'pills' : 'bandage', { vol: 0.8 });
  }
  _healUpdate(dt) {
    const h = this.heal;
    if (!h) { if (this.mode === 'heal') this.mode = 'normal'; return; }
    h.t += dt;
    if (h.t >= h.dur) {
      const info = ITEM_INFO[h.type];
      if (this.game.inventory.take(h.type)) {
        this.hp = Math.min(100, this.hp + info.heal);
        if (info.painkiller) this.painkiller = info.painkiller;
        this.game.hud.toast(info.name + ' benutzt — ' + HEALTH_STATES[this.healthState]);
        bus.emit('healed', this.hp);
      }
      this.heal = null;
      if (this.mode === 'heal') this.mode = 'normal';
    }
  }
  interruptHeal() { if (this.heal) { this.heal = null; this.game.hands.cancel(); if (this.mode === 'heal') this.mode = 'normal'; } }

  // ---------------- Schaden ----------------
  damage(amount, kind = 'hit') {
    if (this.game.godMode) amount = 0;
    const a = amount * this.game.difficulty.damage;
    // Schwer verletzt: ein weiterer schwerer Treffer ist tödlich
    const before = this.healthState;
    this.hp -= a;
    if (before === 'severe' && (kind === 'bite' || kind === 'group') && a > 0) this.hp = 0;
    this.trauma = Math.min(1, this.trauma + 0.7);
    this.lastHitTime = this.time;
    this.interruptHeal();
    this.game.fx.damageFlash(Math.min(1, a / 40));
    this.game.audio.play(kind === 'bite' ? 'bite' : 'hit', { vol: 1 });
    this.game.audio.play('pain', { vol: 0.9 });
    if (this.hp <= 0) { this.hp = 0; this.game.onPlayerDeath(kind); }
    bus.emit('damaged', this.hp, kind);
  }

  // ---------------- Taschenlampe / Werfen ----------------
  toggleFlashlight() {
    this.flashlight = !this.flashlight;
    this.game.audio.play('click', { vol: 0.5 });
    this.game.hands.setFlashlight(this.flashlight);
  }
  throwCarry() {
    const t = this.carry;
    this.carry = null;
    const dir = new THREE.Vector3(); this.camera.getWorldDirection(dir);
    const start = new THREE.Vector3(this.pos.x, this.pos.y + this.eyeHeight - 0.1, this.pos.z).addScaledVector(dir, 0.4);
    this.game.fx.throwObject(t, start, dir.multiplyScalar(11).add(new THREE.Vector3(0, 2.2, 0)));
    this.game.hands.throw();
    this.game.audio.play('whoosh', { vol: 0.6 });
  }

  // ---------------- Kamera ----------------
  updateCamera(dt) {
    const s = this.game.settings;
    const cam = this.camera;
    const bobS = (s.headBob ?? 1) * this.headBobScale;
    const mv = clamp(this.speedNow / PLAYER.walk, 0, 2.2);
    this.bobAmt = damp(this.bobAmt, this.mode === 'normal' || this.mode === 'heal' ? mv : 0, 6, dt);
    const inj = this.injury;
    const bobY = Math.sin(this.bobT * 2) * 0.028 * this.bobAmt * bobS * (this.sprinting ? 1.5 : 1);
    const bobX = Math.sin(this.bobT) * 0.022 * this.bobAmt * bobS;
    // Verletzung: unregelmäßiges Schwanken
    const sway = inj * 0.025 * Math.sin(this.time * 1.3) + inj * 0.012 * Math.sin(this.time * 3.7);
    // Hinken
    const limp = this.healthState === 'severe' && this.painkiller <= 0 ? Math.max(0, Math.sin(this.bobT)) * 0.05 * this.bobAmt : 0;
    // Atmung (Ruhe)
    const breathe = Math.sin(this.time * (1.4 + (1 - this.stamina / 100) * 2.5)) * 0.006 * (1 + inj);
    let eye = this.eyeHeight;
    if (this.mode === 'hidden' || this.mode === 'hideMove') {
      const h = this.hide;
      const target = h ? (h.type === 'locker' ? 1.52 : h.type === 'bed' ? 0.22 : 0.95) : this.eyeHeight;
      eye = this.mode === 'hidden' ? target : lerp(this.hideAnim?.fromEye ?? this.eyeHeight, target, clamp((this.hideAnim?.t || 0) / (this.hideAnim?.dur || 1), 0, 1));
      if (this.hideAnim && !this.hideAnim.enter) eye = lerp(target, this.eyeHeight, clamp(this.hideAnim.t / this.hideAnim.dur, 0, 1));
    }
    const shake = this.trauma * this.trauma;
    this.shakeT += dt * 30;
    const sx = (Math.sin(this.shakeT * 1.1) + Math.sin(this.shakeT * 2.3)) * 0.02 * shake;
    const sy = (Math.sin(this.shakeT * 1.7) + Math.sin(this.shakeT * 3.1)) * 0.02 * shake;
    const rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    cam.position.set(
      this.pos.x + rx * (bobX + sx) + this.camOffset.x,
      this.pos.y + eye + bobY - limp - this.landDip + breathe + sy + this.camOffset.y,
      this.pos.z + rz * (bobX + sx) + this.camOffset.z,
    );
    this.camRoll = damp(this.camRoll, -bobX * 0.6 + sway + (this.healthState === 'severe' ? Math.sin(this.time * 0.7) * 0.02 : 0), 8, dt);
    cam.rotation.set(this.pitch + sy * 0.5 + sway * 0.4, this.yaw + sx * 0.5, this.camRoll, 'YXZ');
    cam.updateMatrixWorld();
  }

  // Sichtbarkeit für die Gegner (0 = unsichtbar)
  visibility() {
    if (this.mode === 'hidden') return 0;
    if (this.mode === 'hideMove') return 0.35;
    const lvl = this.game.level.lights.lightLevelAt(this.pos.x, this.pos.z);
    let v = 0.12 + lvl * 0.9;
    if (this.flashlight) v += 0.55;
    if (this.game.phone.isOpen()) v += 0.2;
    v *= this.crouched ? 0.5 : 1;
    const mv = this.speedNow;
    v *= mv < 0.2 ? 0.6 : this.sprinting ? 1.35 : 1.0;
    return clamp(v, 0, 1.6);
  }
}
