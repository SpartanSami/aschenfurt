// Begleiter (Mine, İlyas): folgen Sami, passen Tempo und Haltung an, verstecken sich mit ihm,
// können per Skript gesteuert werden. Zombies ignorieren Begleiter (bewusste Designentscheidung,
// damit keine frustrierenden Eskort-Passagen entstehen – Gefahr für Begleiter entsteht nur per Inszenierung).
import * as THREE from 'three';
import { Humanoid } from './humanoid.js';
import { moveAgent, resolve } from '../world/physics.js';
import { angleDiff, clamp, damp } from '../core/rng.js';

export const NPC_DEFS = {
  mine: { name: 'Mine', outfit: 'mine', skin: 'human', hair: 0x1a110c, hairStyle: 'long', scale: 0.95, color: '#e8a0c0' },
  ilyas: { name: 'İlyas', outfit: 'ilyas', skin: 'human2', hair: 0x0e0c0a, hairStyle: 'short', scale: 1.03, color: '#9fd0a0' },
};

export class NPC {
  constructor(game, id, x, z, o = {}) {
    this.game = game;
    this.id = id;
    const d = NPC_DEFS[id];
    this.name = d.name; this.color = d.color;
    this.model = new Humanoid({ outfit: d.outfit, skin: d.skin, hair: d.hair, hairStyle: d.hairStyle, scale: d.scale, limp: 0 });
    this.root = this.model.root;
    this.pos = new THREE.Vector3(x, game.level.grid.heightAt(x, z), z);
    this.yaw = o.yaw ?? 0;
    this.radius = 0.28;
    this.active = true;
    this.mode = o.mode || 'idle';   // idle | follow | goto | hold
    this.path = null; this.pathI = 0; this.repathT = 0;
    this.speed = 0;
    this.gotoT = null;
    this.followDist = o.followDist ?? (id === 'mine' ? 1.9 : 2.6);
    this.talking = 0;
    this.injured = false;
    this.root.position.copy(this.pos);
    game.scene.add(this.root);
    this.lastSeen = 0;
    this.time = 0;
  }

  say(dur) { this.talking = dur; }
  follow() { this.mode = 'follow'; this.path = null; }
  stay() { this.mode = 'idle'; this.path = null; }
  goTo(x, z, opts = {}) {
    return new Promise((res) => { this.mode = 'goto'; this.gotoT = { x, z, run: !!opts.run, res }; this.path = null; this.repathT = 0; });
  }
  teleport(x, z, yaw) { this.pos.set(x, this.game.level.grid.heightAt(x, z), z); if (yaw !== undefined) this.yaw = yaw; this.path = null; }

  _walkable(x, y) {
    const g = this.game.level.grid;
    const v = g.get(x, y);
    if (!(v & 2) || (v & 1) || (v & 32) || (v & 1024)) return false; // FLOOR, SOLID, GLASS, DOORLOCK
    if ((v & 8) && !(v & 256)) return false;
    return true;
  }

  update(dt) {
    if (!this.active) return;
    this.time += dt;
    const game = this.game, p = game.player, g = game.level.grid;
    let tx = null, tz = null, run = false;
    if (this.mode === 'follow') {
      const d = Math.hypot(p.pos.x - this.pos.x, p.pos.z - this.pos.z);
      // Seitlich hinter dem Spieler bleiben
      if (d > this.followDist) {
        const bx = -Math.sin(p.yaw), bz = -Math.cos(p.yaw);
        const side = this.id === 'mine' ? 0.6 : -0.6;
        tx = p.pos.x - bx * (this.followDist * 0.7) + Math.cos(p.yaw) * side;
        tz = p.pos.z - bz * (this.followDist * 0.7) - Math.sin(p.yaw) * side;
        if (!g.isFloor(Math.floor(tx), Math.floor(tz))) { tx = p.pos.x; tz = p.pos.z; }
        run = d > 4.5 || p.sprinting;
      }
      // Weit zurückgefallen und außer Sicht: aufschließen (nie im Blickfeld des Spielers)
      if (d > 16) {
        const seen = this._inPlayerView();
        if (!seen) {
          const near = this._spotBehindPlayer();
          if (near) this.teleport(near.x, near.z, p.yaw);
        }
      }
    } else if (this.mode === 'goto' && this.gotoT) {
      tx = this.gotoT.x; tz = this.gotoT.z; run = this.gotoT.run;
      if (Math.hypot(tx - this.pos.x, tz - this.pos.z) < 0.4) { const r = this.gotoT.res; this.gotoT = null; this.mode = 'idle'; tx = null; if (r) r(); }
    }
    // Haltung an den Spieler anpassen
    const crouch = (this.mode === 'follow' && (p.crouched || p.mode === 'hidden')) || this.forceCrouch ? 1 : 0;
    this.model.crouch = damp(this.model.crouch, crouch, 6, dt);
    let speed = 0;
    if (tx !== null) {
      const sp = run ? 4.6 : crouch ? 1.2 : 2.2;
      speed = this._goTo(tx, tz, sp, dt);
    } else {
      this.speed = 0;
      // zum Spieler schauen, wenn nah
      const d = Math.hypot(p.pos.x - this.pos.x, p.pos.z - this.pos.z);
      if (d < 6 && (this.talking > 0 || this.mode === 'follow')) {
        const want = Math.atan2(-(p.pos.x - this.pos.x), -(p.pos.z - this.pos.z));
        this.yaw += clamp(angleDiff(this.yaw, want), -3 * dt, 3 * dt);
      }
    }
    void speed;
    // nicht in den Spieler laufen
    const dx = this.pos.x - p.pos.x, dz = this.pos.z - p.pos.z, dd = Math.hypot(dx, dz);
    if (dd < 0.6 && dd > 0.001) { this.pos.x += dx / dd * (0.6 - dd) * 0.5; this.pos.z += dz / dd * (0.6 - dd) * 0.5; resolve(game.level, this.pos, this.radius, 1.6, {}); }
    this.pos.y = damp(this.pos.y, g.heightAt(this.pos.x, this.pos.z), 12, dt);
    this.talking = Math.max(0, this.talking - dt);
    const m = this.model;
    m.speed = this.speed;
    m.mode = this.talking > 0 && this.speed < 0.2 ? 'talk' : this.injured ? 'injured' : this.holdPose ? 'hold' : 'idle';
    const want = Math.atan2(-(p.pos.x - this.pos.x), -(p.pos.z - this.pos.z));
    m.lookYaw = this.talking > 0 ? clamp(angleDiff(this.yaw, want), -1, 1) : 0;
    m.update(dt);
    this.root.position.copy(this.pos);
    this.root.rotation.y = this.yaw;
  }

  _goTo(x, z, speed, dt) {
    const g = this.game.level.grid;
    this.repathT -= dt;
    if (!this.path || this.repathT <= 0) {
      this.repathT = 0.6;
      this.path = this._findPath(x, z);
      this.pathI = 1;
    }
    let tx = x, tz = z;
    if (this.path && this.path.length > 1) {
      while (this.pathI < this.path.length - 1 && Math.hypot(this.path[this.pathI].x + 0.5 - this.pos.x, this.path[this.pathI].y + 0.5 - this.pos.z) < 0.55) this.pathI++;
      const wp = this.path[Math.min(this.pathI, this.path.length - 1)];
      if (this.pathI < this.path.length - 1) { tx = wp.x + 0.5; tz = wp.y + 0.5; }
    }
    const dx = tx - this.pos.x, dz = tz - this.pos.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.05) { this.speed = 0; return 0; }
    const want = Math.atan2(-dx, -dz);
    this.yaw += clamp(angleDiff(this.yaw, want), -6 * dt, 6 * dt);
    const step = Math.min(speed * dt, d);
    const ox = this.pos.x, oz = this.pos.z;
    moveAgent(this.game.level, this.pos, dx / d * step, dz / d * step, { radius: this.radius, height: this.model.crouch > 0.5 ? 1.1 : 1.65 });
    this.speed = Math.hypot(this.pos.x - ox, this.pos.z - oz) / Math.max(dt, 1e-4);
    // Türen auf dem Weg öffnen
    for (const door of this.game.level.doors) {
      if (!door.isShut() || door.locked || door.kind === 'shutter' || door.kind === 'elevator' || door.def.npcNoOpen) continue;
      if (Math.hypot(door.center.x - this.pos.x, door.center.z - this.pos.z) < 1.1) door.open(this.pos, { silent: false });
    }
    void g;
    return d;
  }

  _findPath(x, z) {
    // eigene Pfadsuche mit Begleiter-Regeln (Schächte erlaubt)
    const g = this.game.level.grid;
    const saveFn = g.aiWalkable;
    g.aiWalkable = (cx, cy) => this._walkable(cx, cy);
    const p = g.findPath(this.pos.x, this.pos.z, x, z, 4000);
    g.aiWalkable = saveFn;
    return p;
  }

  _inPlayerView() {
    const cam = this.game.camera;
    const dir = new THREE.Vector3(); cam.getWorldDirection(dir);
    const to = new THREE.Vector3(this.pos.x - cam.position.x, 0, this.pos.z - cam.position.z).normalize();
    const vis = this.game.level.grid.los(cam.position.x, cam.position.z, this.pos.x, this.pos.z);
    return vis && to.dot(new THREE.Vector3(dir.x, 0, dir.z).normalize()) > 0.3;
  }
  _spotBehindPlayer() {
    const p = this.game.player, g = this.game.level.grid;
    const bx = Math.sin(p.yaw), bz = Math.cos(p.yaw);
    for (let r = 2; r <= 5; r += 0.5) {
      const x = p.pos.x + bx * r, z = p.pos.z + bz * r;
      if (this._walkable(Math.floor(x), Math.floor(z)) && g.los(p.pos.x, p.pos.z, x, z)) {
        const cam = this.game.camera; const dir = new THREE.Vector3(); cam.getWorldDirection(dir);
        const to = new THREE.Vector3(x - cam.position.x, 0, z - cam.position.z).normalize();
        if (to.dot(new THREE.Vector3(dir.x, 0, dir.z).normalize()) < 0) return { x, z };
      }
    }
    return null;
  }

  despawn() { this.active = false; this.game.scene.remove(this.root); }
}
