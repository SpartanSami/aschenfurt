// Lichtsystem: Leuchten ("Fixtures") mit Flackern/Stromkreisen + fester Pool echter Punktlichter,
// die jeweils den relevantesten Leuchten nahe der Kamera zugewiesen werden (konstante Shader-Kosten).
import * as THREE from 'three';
import { RNG } from '../core/rng.js';

const rng = new RNG(4242);

export class LightSystem {
  constructor(scene, grid, poolSize = 8) {
    this.scene = scene;
    this.grid = grid;
    this.fixtures = [];
    this.groups = new Map(); // Stromkreis -> an/aus
    this.time = 0;
    this.selTimer = 0;
    this.pool = [];
    this.root = new THREE.Group();
    this.root.name = 'lightPool';
    scene.add(this.root);
    for (let i = 0; i < poolSize; i++) {
      const l = new THREE.PointLight(0xffffff, 0, 8, 2);
      l.castShadow = false;
      this.root.add(l);
      this.pool.push({ light: l, fixture: null, fade: 0 });
    }
    this.listenerPos = new THREE.Vector3();
  }

  add(f) {
    const fx = {
      x: f.x, y: f.y ?? 2.9, z: f.z,
      color: new THREE.Color(f.color ?? 0xf2f4ff),
      intensity: f.intensity ?? 10,
      range: f.range ?? 7,
      mode: f.mode || 'steady',
      group: f.group || 'main',
      on: f.on !== false,
      mats: f.mats || [],
      emissiveBase: f.emissiveBase ?? 2.2,
      cur: 1, state: 1, timer: rng.range(0, 3), phase: rng.range(0, 6.28),
      motionRadius: f.motionRadius ?? 5, motionTimer: 0,
      id: f.id || null,
      cone: f.cone || null,
      buzz: f.buzz ?? (f.mode === 'flicker' || f.mode === 'broken'),
      speed: f.speed ?? 1,
    };
    if (!this.groups.has(fx.group)) this.groups.set(fx.group, true);
    this.fixtures.push(fx);
    return fx;
  }

  setPower(group, on) { this.groups.set(group, on); }
  powered(fx) { return this.groups.get(fx.group) !== false; }
  setMode(filter, mode) { for (const f of this.fixtures) if (filter(f)) f.mode = mode; }
  byId(id) { return this.fixtures.find((f) => f.id === id); }

  _flicker(f, dt, px, pz) {
    f.timer -= dt * f.speed;
    switch (f.mode) {
      case 'steady': return 1;
      case 'off': return 0;
      case 'flicker': {
        if (f.timer <= 0) {
          if (f.state === 1 && rng.chance(0.35)) { f.state = 0; f.timer = rng.range(0.03, 0.12); }
          else { f.state = 1; f.timer = rng.chance(0.25) ? rng.range(0.04, 0.2) : rng.range(0.8, 4); }
        }
        return f.state ? 1 : 0.08;
      }
      case 'broken': {
        if (f.timer <= 0) {
          if (f.state === 0) { f.state = 1; f.timer = rng.range(0.03, 0.25); }
          else { f.state = 0; f.timer = rng.chance(0.3) ? rng.range(0.04, 0.15) : rng.range(0.6, 3.5); }
        }
        return f.state ? 0.9 : 0.02;
      }
      case 'pulse': return 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(this.time * 2.2 + f.phase));
      case 'strobe': return (Math.floor(this.time * 2.4 + f.phase) % 2) ? 1 : 0.05;
      case 'rotate': return Math.max(0, Math.sin(this.time * 7 + f.phase)) ** 2;
      case 'fire': return 0.65 + 0.2 * Math.sin(this.time * 13 + f.phase) + 0.15 * Math.sin(this.time * 31 + f.phase * 2) + rng.range(-0.08, 0.08);
      case 'motion': {
        const d = Math.hypot(px - f.x, pz - f.z);
        if (d < f.motionRadius) f.motionTimer = 14;
        f.motionTimer -= dt;
        const target = f.motionTimer > 0 ? 1 : 0;
        // kurzes Zünden beim Einschalten
        if (target && f.state === 0) { f.state = 1; f.ignite = 0.35; }
        if (!target) f.state = 0;
        if (f.ignite > 0) { f.ignite -= dt; return rng.chance(0.5) ? 1 : 0.1; }
        return target;
      }
      default: return 1;
    }
  }

  update(dt, camPos) {
    this.time += dt;
    const px = camPos.x, pz = camPos.z;
    for (const f of this.fixtures) {
      const dx = f.x - px, dz = f.z - pz;
      const near = dx * dx + dz * dz < 55 * 55;
      let v = 0;
      if (f.on && this.powered(f)) v = near ? this._flicker(f, dt, px, pz) : (f.mode === 'off' ? 0 : 1);
      f.cur = v;
      if (near || f.lastEm !== v) {
        const e = f.emissiveBase * (v < 0.05 ? 0.0 : v);
        for (const m of f.mats) { if (m.emissiveIntensity !== e) m.emissiveIntensity = e; }
        if (f.cone) f.cone.material.opacity = f.cone.userData.baseOpacity * v;
        f.lastEm = v;
      }
    }
    this.selTimer -= dt;
    if (this.selTimer <= 0) { this.selTimer = 0.12; this._select(px, pz); }
    for (const s of this.pool) {
      if (!s.fixture) { s.light.intensity = 0; continue; }
      s.fade = Math.min(1, s.fade + dt * 5);
      const f = s.fixture;
      s.light.intensity = f.intensity * f.cur * s.fade;
    }
  }

  _select(px, pz) {
    const g = this.grid;
    const cands = [];
    for (const f of this.fixtures) {
      if (!f.on || !this.powered(f) || f.mode === 'off') continue;
      const d = Math.hypot(f.x - px, f.z - pz);
      if (d > f.range + 16) continue;
      let score = (f.intensity * (0.3 + 0.7 * Math.max(f.cur, f.mode === 'broken' || f.mode === 'motion' ? 0.3 : 0))) / (1 + (d * d) / (f.range * f.range));
      if (!g.losLight(f.x, f.z, px, pz)) score *= 0.3;
      cands.push({ f, score });
    }
    cands.sort((a, b) => b.score - a.score);
    const chosen = new Set(cands.slice(0, this.pool.length).map((c) => c.f));
    // bestehende Zuweisungen behalten
    const free = [];
    for (const s of this.pool) {
      if (s.fixture && chosen.has(s.fixture)) chosen.delete(s.fixture);
      else { s.fixture = null; free.push(s); }
    }
    for (const f of chosen) {
      const s = free.pop();
      if (!s) break;
      s.fixture = f; s.fade = 0;
      s.light.position.set(f.x, f.y - 0.12, f.z);
      s.light.color.copy(f.color);
      s.light.distance = f.range;
    }
  }

  // Helligkeit an einer Position (0 = dunkel, ~1 = hell beleuchtet) – für die Sichtbarkeit des Spielers
  lightLevelAt(x, z) {
    const g = this.grid;
    let sum = 0;
    for (const f of this.fixtures) {
      if (f.cur <= 0.02 || !f.on || !this.powered(f)) continue;
      const dx = f.x - x, dz = f.z - z;
      const d2 = dx * dx + dz * dz;
      if (d2 > f.range * f.range) continue;
      if (!g.losLight(f.x, f.z, x, z)) continue;
      const h = f.y - 1.0;
      const att = 1 - Math.sqrt(d2) / f.range;
      sum += (f.intensity / 10) * f.cur * att * att / (1 + (d2 + h * h) * 0.15);
    }
    return Math.min(1.5, sum);
  }

  // Für das Sounddesign: flackernde Leuchten in der Nähe (Brummen)
  nearbyBuzz(x, z, r = 6) {
    let best = null, bd = r;
    for (const f of this.fixtures) {
      if (!f.buzz || !f.on || !this.powered(f)) continue;
      const d = Math.hypot(f.x - x, f.z - z);
      if (d < bd) { bd = d; best = f; }
    }
    return best ? { f: best, d: bd } : null;
  }

  dispose() {
    this.scene.remove(this.root);
    for (const s of this.pool) s.light.dispose();
  }
}
