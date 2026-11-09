// Effekte: Wurfobjekte (Ablenkung), Glassplitter, Staub im Lichtkegel, Regen, Nebel/Dekontamination,
// Bildschirm-Effekte (Treffer, Verletzung, Überblendungen).
import * as THREE from 'three';
import { makeItemMesh } from '../world/items.js';
import { NOISE } from '../core/config.js';
import { clamp, damp } from '../core/rng.js';

export class FX {
  constructor(game) {
    this.game = game;
    this.projectiles = [];
    this.shards = [];
    this.damage = 0;
    this.fade = 0; this.fadeTarget = 0; this.fadeSpeed = 1;
    this.root = new THREE.Group(); this.root.name = 'fx';
    this.pulseT = 0;
    this.camMode = false;
    this._dust();
  }
  attach(scene) { scene.add(this.root); if (this.dust) scene.add(this.dust); if (this.rain) scene.add(this.rain); }

  _dust() {
    const n = 500;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 12; pos[i * 3 + 1] = Math.random() * 3; pos[i * 3 + 2] = (Math.random() - 0.5) * 12; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const c = document.createElement('canvas'); c.width = c.height = 32;
    const x = c.getContext('2d'); const gr = x.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 32, 32);
    this.dustTex = new THREE.CanvasTexture(c);
    const m = new THREE.PointsMaterial({ size: 0.018, map: this.dustTex, transparent: true, opacity: 0.35, depthWrite: false, color: 0xcfc8b8, blending: THREE.AdditiveBlending });
    this.dust = new THREE.Points(g, m);
    this.dust.frustumCulled = false;
  }

  setRain(on) {
    if (on && !this.rain) {
      const n = 3000;
      const pos = new Float32Array(n * 6);
      for (let i = 0; i < n; i++) {
        const x = (Math.random() - 0.5) * 30, y = Math.random() * 14, z = (Math.random() - 0.5) * 30;
        pos.set([x, y, z, x + 0.02, y - 0.35, z + 0.01], i * 6);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      this.rain = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x9fb0c8, transparent: true, opacity: 0.14, depthWrite: false }));
      this.rain.frustumCulled = false;
      this.game.scene.add(this.rain);
    } else if (!on && this.rain) { this.game.scene.remove(this.rain); this.rain.geometry.dispose(); this.rain = null; }
  }

  throwObject(type, pos, vel) {
    const mesh = makeItemMesh(type);
    mesh.position.copy(pos);
    this.root.add(mesh);
    this.projectiles.push({ type, mesh, vel: vel.clone(), t: 0, bounces: 0 });
  }

  glassBurst(x, y, z) {
    const mat = new THREE.MeshStandardMaterial({ color: 0xbfd4dc, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.6 });
    for (let i = 0; i < 26; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.06 + Math.random() * 0.1, 0.05 + Math.random() * 0.12), mat);
      m.position.set(x + (Math.random() - 0.5) * 0.8, y + Math.random() * 1.2, z + (Math.random() - 0.5) * 0.8);
      m.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      this.root.add(m);
      this.shards.push({ m, v: new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 2, (Math.random() - 0.5) * 3), life: 2 + Math.random() });
    }
    this.game.audio.play('glass_break', { pos: new THREE.Vector3(x, y, z), vol: 1 });
  }

  // Nebelstoß (Dekontamination, Dampf)
  puff(x, y, z, o = {}) {
    const n = o.n || 120;
    const pos = new Float32Array(n * 3), vel = [];
    for (let i = 0; i < n; i++) { pos.set([x + (Math.random() - 0.5) * (o.w || 2), y + Math.random() * 0.5, z + (Math.random() - 0.5) * (o.d || 2)], i * 3); vel.push([(Math.random() - 0.5) * 0.6, o.rise ? 0.4 + Math.random() * 0.9 : -0.2 - Math.random() * 0.5, (Math.random() - 0.5) * 0.6]); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ size: o.size || 0.35, map: this.dustTex, transparent: true, opacity: 0.35, depthWrite: false, color: o.color || 0xdfe8f0 });
    const pts = new THREE.Points(g, m);
    this.root.add(pts);
    this.puffs = this.puffs || [];
    this.puffs.push({ pts, vel, life: o.life || 4, max: o.life || 4 });
  }

  damageFlash(a) { this.damage = Math.min(1, this.damage + a); }
  fadeTo(target, seconds = 1) { this.fadeTarget = target; this.fadeSpeed = seconds > 0 ? 1 / seconds : 100; }

  update(dt) {
    const game = this.game;
    const level = game.level;
    // Projektile
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.t += dt;
      p.vel.y -= 9.81 * dt;
      const m = p.mesh;
      const nx = m.position.x + p.vel.x * dt, ny = m.position.y + p.vel.y * dt, nz = m.position.z + p.vel.z * dt;
      m.rotation.x += dt * 9; m.rotation.z += dt * 6;
      let hit = false;
      const g = level.grid;
      const ci = Math.floor(nx), cj = Math.floor(nz);
      const ground = g.heightAt(nx, nz);
      const ceil = g.inb(ci, cj) ? g.ceilY[g.idx(ci, cj)] : 3;
      if (!g.isFloor(ci, cj) || g.has(ci, cj, 2048) || g.has(ci, cj, 32)) hit = true; // Wand, geschlossene Tür, Glas
      if (ny <= ground + 0.05) hit = true;
      if (ny >= ceil - 0.05) { p.vel.y = -Math.abs(p.vel.y) * 0.3; }
      for (const c of level.collidersNear(nx, nz, 0.6)) {
        if (ny < c.y1 && ny > c.y0 && Math.abs(nx - c.cx) < c.hx + 0.6 && Math.abs(nz - c.cz) < c.hz + 0.6) {
          const dx = nx - c.cx, dz = nz - c.cz; const lx = dx * c.cos - dz * c.sin, lz = dx * c.sin + dz * c.cos;
          if (Math.abs(lx) < c.hx && Math.abs(lz) < c.hz) hit = true;
        }
      }
      // Zombie getroffen? -> nur Lärm, kein Schaden
      if (hit || p.t > 4) {
        const ix = hit ? m.position.x : nx, iz = hit ? m.position.z : nz;
        game.noise.emit(ix, iz, NOISE.throwImpact, 'throw', { fake: true });
        game.audio.play(p.type === 'bottle' ? 'glass_break' : 'can_clatter', { pos: new THREE.Vector3(ix, Math.max(ground + 0.1, m.position.y), iz), vol: 1 });
        this.root.remove(m);
        this.projectiles.splice(i, 1);
        game.story.onEvent('thrown');
        continue;
      }
      m.position.set(nx, ny, nz);
    }
    for (let i = this.shards.length - 1; i >= 0; i--) {
      const s = this.shards[i];
      s.life -= dt;
      s.v.y -= 9.8 * dt;
      s.m.position.addScaledVector(s.v, dt);
      const gy = level.grid.heightAt(s.m.position.x, s.m.position.z) + 0.01;
      if (s.m.position.y < gy) { s.m.position.y = gy; s.v.set(0, 0, 0); s.m.rotation.x = -Math.PI / 2; }
      if (s.life < -20) { this.root.remove(s.m); this.shards.splice(i, 1); }
    }
    if (this.puffs) for (let i = this.puffs.length - 1; i >= 0; i--) {
      const pf = this.puffs[i]; pf.life -= dt;
      const a = pf.pts.geometry.attributes.position;
      for (let k = 0; k < a.count; k++) { a.setXYZ(k, a.getX(k) + pf.vel[k][0] * dt, Math.max(0.05, a.getY(k) + pf.vel[k][1] * dt), a.getZ(k) + pf.vel[k][2] * dt); }
      a.needsUpdate = true;
      pf.pts.material.opacity = 0.35 * Math.min(1, pf.life / pf.max * 2);
      if (pf.life <= 0) { this.root.remove(pf.pts); pf.pts.geometry.dispose(); this.puffs.splice(i, 1); }
    }
    // Staub um die Kamera
    if (this.dust) {
      const cam = game.camera;
      this.dust.position.set(Math.floor(cam.position.x / 12) * 12, game.player.pos.y, Math.floor(cam.position.z / 12) * 12);
      const pos = this.dust.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) + Math.sin(game.time * 0.3 + i) * 0.0008 - 0.0004;
        if (y < 0) y += 3;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
      this.dust.material.opacity = game.player.flashlight ? 0.45 : 0.12;
    }
    if (this.rain) {
      const cam = game.camera;
      this.rain.position.set(cam.position.x, 0, cam.position.z);
      const pos = this.rain.geometry.attributes.position;
      const arr = pos.array;
      for (let i = 0; i < arr.length; i += 6) {
        arr[i + 1] -= dt * 16; arr[i + 4] -= dt * 16;
        if (arr[i + 4] < 0) { arr[i + 1] += 14; arr[i + 4] += 14; }
      }
      pos.needsUpdate = true;
    }
    // Bildschirm
    const u = game.renderer.fx;
    this.damage = Math.max(0, this.damage - dt * 1.4);
    const pl = game.player;
    const inj = pl.injury;
    this.pulseT += dt * (1.2 + inj * 1.5);
    u.uDamage.value = this.damage;
    u.uInjury.value = damp(u.uInjury.value, Math.min(1, inj), 3, dt);
    u.uPulse.value = 0.5 + 0.5 * Math.sin(this.pulseT * Math.PI * 2);
    u.uBlur.value = damp(u.uBlur.value, pl.healthState === 'severe' ? 0.8 : pl.exhausted ? 0.25 : 0, 3, dt);
    u.uVignette.value = damp(u.uVignette.value, (pl.mode === 'hidden' ? 0.75 : 0.32) + (pl.crouched ? 0.08 : 0), 4, dt);
    if (this.fade !== this.fadeTarget) {
      const d = this.fadeTarget - this.fade;
      const st = dt * this.fadeSpeed;
      this.fade = Math.abs(d) <= st ? this.fadeTarget : this.fade + Math.sign(d) * st;
    }
    u.uFade.value = clamp(this.fade, 0, 1);
    u.uCam.value = this.camMode ? 1 : 0;
  }

  clear() {
    for (const p of this.projectiles) this.root.remove(p.mesh);
    for (const s of this.shards) this.root.remove(s.m);
    if (this.puffs) for (const pf of this.puffs) this.root.remove(pf.pts);
    this.projectiles = []; this.shards = []; this.puffs = [];
  }
}
