// Samis Glock 17 (9 × 19 mm, 17 Schuss im Magazin).
// Zielen (rechte Maustaste / LT) macht langsam und genau, Schießen aus der Hüfte streut.
// Treffer werden per Strahl gegen Kopf (Kugel) und Körper (Kapsel) der Zombies geprüft;
// Wände, geschlossene Türen und Glas halten Kugeln auf. Jeder Schuss ist weithin hörbar.
import * as THREE from 'three';
import { F } from '../world/grid.js';

const MAG = 17;
const RANGE = 40;
const tmpO = new THREE.Vector3(), tmpD = new THREE.Vector3(), tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3(), tmpP = new THREE.Vector3();
const ray = new THREE.Ray();

export class Weapon {
  constructor(game) {
    this.game = game;
    this.reset();
    // Mündungsfeuer als echtes Licht in der Welt
    this.flashLight = new THREE.PointLight(0xffc070, 0, 9, 2);
    game.scene.add(this.flashLight);
  }
  reset() { this.has = false; this.mag = 0; this.reserve = 0; this.aiming = false; this.aimT = 0; this.cool = 0; this.reloadT = 0; this.readyT = 0; this.flashT = 0; this.kick = 0; this._hint = false; }
  serialize() { return { has: this.has, mag: this.mag, reserve: this.reserve }; }
  load(d) { this.reset(); if (d) { this.has = !!d.has; this.mag = d.mag | 0; this.reserve = d.reserve | 0; } }

  give(mag, reserve) { this.has = true; this.mag = Math.min(MAG, mag); this.reserve += reserve; }
  addAmmo(n) { this.reserve += n; }
  get reloading() { return this.reloadT > 0; }
  get drawn() { return this.has && (this.aiming || this.readyT > 0 || this.reloadT > 0); }

  // Darf Sami gerade schießen?
  _canUse() {
    const g = this.game, p = g.player;
    if (!this.has || g.mode !== 'play') return false;
    if (p.mode !== 'normal') return false;            // versteckt, gepackt, klettert, tot …
    if (p.heal || p.carry) return false;
    if (g.phone.isOpen() || g.phone.inCall || g.camView || g.qte) return false;
    return true;
  }

  update(dt, input) {
    const g = this.game, p = g.player;
    this.cool = Math.max(0, this.cool - dt);
    this.readyT = Math.max(0, this.readyT - dt);
    this.kick = Math.max(0, this.kick - dt * 6);
    if (this.flashT > 0) { this.flashT -= dt; this.flashLight.intensity = this.flashT > 0 ? 14 : 0; }
    if (!this.has) { this.aiming = false; return; }
    const usable = this._canUse();
    // Nachladen läuft weiter, solange nichts dazwischenkommt
    if (this.reloadT > 0) {
      if (!usable && p.mode !== 'normal') { this.reloadT = 0; }
      else {
        this.reloadT -= dt;
        if (this.reloadT <= 0) {
          const n = Math.min(MAG - this.mag, this.reserve);
          this.mag += n; this.reserve -= n;
          g.audio.play('reload_end', { vol: 0.7 });
          this.readyT = 1.2;
        }
      }
    }
    const touchAim = input.touchMode;
    this.aiming = usable && !p.sprinting && this.reloadT <= 0 && (input.down('aim') || (touchAim && this.readyT > 0.4));
    this.aimT += ((this.aiming ? 1 : 0) - this.aimT) * Math.min(1, dt * 10);
    if (!usable) return;
    if (input.pressed('reload')) this.startReload();
    if (input.pressed('fire')) {
      if (p.carry && !this._hint) { this._hint = true; g.hud.toast('Erst die Flasche werfen – die Hand ist belegt'); }
      this.fire(input);
    }
  }

  startReload() {
    const g = this.game;
    if (this.reloadT > 0 || this.mag >= MAG) return;
    if (this.reserve <= 0) { g.hud.toast('Keine Munition mehr'); return; }
    this.reloadT = 1.5;
    g.audio.play('reload', { vol: 0.75 });
    g.noise.emit(g.player.pos.x, g.player.pos.z, 2.5, 'step');
  }

  fire(input) {
    const g = this.game, p = g.player;
    if (this.cool > 0 || this.reloadT > 0) return;
    this.readyT = 1.6;
    if (this.mag <= 0) {
      g.audio.play('dryfire', { vol: 0.7 });
      this.cool = 0.3;
      if (this.reserve > 0) this.startReload(); else g.hud.toast('Keine Munition mehr');
      return;
    }
    // Schussrichtung: Kamera, plus Streuung (Hüfte > Bewegung > gezielt)
    g.camera.getWorldPosition(tmpO);
    g.camera.getWorldDirection(tmpD);
    const moving = Math.hypot(p.vel.x, p.vel.z) > 0.6;
    let spread = this.aimT > 0.6 ? 0.006 : 0.04;
    if (moving) spread += this.aimT > 0.6 ? 0.008 : 0.02;
    spread += p.injury * 0.012;
    // Zielhilfe für Gamepad und Touch: zum nächsten Zombie in einem schmalen Kegel
    const assist = input.touchMode || !!input.pad;
    // Geschützte Figuren (Elif): Liegt sie grob in der Schusslinie, schießt Sami nicht
    const prot = this._pick(tmpO, tmpD, 0.1, 25, true);
    const target = prot || this._pick(tmpO, tmpD, assist ? 0.12 : 0, 22);
    if (target && target.zombie.def.protect) {
      // Auf Elif schießt Sami nicht
      if (!this._protectSaid) { this._protectSaid = true; g.story.playLines([{ s: 'sami', t: target.zombie.def.protect, d: 2.4 }]); }
      this.readyT = 0; this.cool = 0.5;
      return;
    }
    if (target && assist) { tmpD.copy(target.aim).sub(tmpO).normalize(); spread *= 0.4; }
    tmpD.x += (Math.random() - 0.5) * 2 * spread; tmpD.y += (Math.random() - 0.5) * 2 * spread; tmpD.z += (Math.random() - 0.5) * 2 * spread;
    tmpD.normalize();
    this.mag--;
    this.cool = 0.28;
    this.kick = 1;
    this.flashT = 0.05;
    tmpA.copy(tmpO).addScaledVector(tmpD, 0.6); this.flashLight.position.copy(tmpA); this.flashLight.intensity = 14;
    // Rückstoß
    p.pitch = Math.min(1.45, p.pitch + 0.035 + Math.random() * 0.015);
    p.yaw += (Math.random() - 0.5) * 0.012;
    p.trauma = Math.min(1, p.trauma + 0.12);
    g.audio.play('gunshot', { vol: 1, reverbSend: 0.9 });
    setTimeout(() => g.audio.play('casing', { vol: 0.35, pos: new THREE.Vector3(p.pos.x + 0.4, p.pos.y + 0.05, p.pos.z) }), 380);
    g.noise.emit(p.pos.x, p.pos.z, 28, 'gunshot');
    g.hands.shoot();
    // Treffer
    const hit = this._pick(tmpO, tmpD, 0, RANGE);
    const wall = this._wallDist(tmpO, tmpD);
    if (hit && hit.t < wall) {
      const z = hit.zombie;
      const dmg = hit.head ? 4 : 1;
      g.fx.puff(hit.point.x, hit.point.y, hit.point.z, { n: hit.head ? 50 : 30, w: 0.25, d: 0.25, size: 0.12, life: 0.9, color: 0x6a0c0a });
      g.audio.play('hit', { pos: hit.point.clone(), vol: 0.5 });
      const killed = z.takeHit(dmg, hit.head);
      if (killed) g.stats && (g.stats.kills = (g.stats.kills || 0) + 1);
    } else if (wall < RANGE) {
      tmpA.copy(tmpO).addScaledVector(tmpD, wall - 0.03);
      g.fx.puff(tmpA.x, tmpA.y, tmpA.z, { n: 18, w: 0.15, d: 0.15, size: 0.08, life: 0.7, color: 0xb8b0a0 });
      g.audio.play('click', { pos: tmpA.clone(), vol: 0.4 });
    }
    if (this.mag === 0 && this.reserve > 0) setTimeout(() => this.startReload(), 250);
  }

  // Nächster Zombie entlang des Strahls; cone > 0 = Zielhilfe (Winkelabstand in Bogenmaß)
  _pick(o, d, cone, range, protectedOnly = false) {
    const g = this.game;
    ray.set(o, d);
    let best = null;
    for (const z of g.zombies) {
      if (!z.alive || z.dead) continue;
      if (protectedOnly ? !z.def.protect : (cone > 0 && z.def.protect)) continue;
      const dx = z.pos.x - o.x, dz = z.pos.z - o.z;
      const dist = Math.hypot(dx, dz);
      if (dist > range) continue;
      const head = z.model.headWorld(tmpP).clone();
      const lying = z.model.pose !== 'stand' && z.model.poseBlend > 0.5;
      if (cone > 0) {
        // Winkel zwischen Blickrichtung und Ziel (Kopf bei stehenden, Körpermitte bei liegenden)
        const aim = lying ? head.clone() : new THREE.Vector3(z.pos.x, z.pos.y + 1.15, z.pos.z);
        const v = aim.clone().sub(o); const len = v.length(); v.normalize();
        const ang = Math.acos(Math.min(1, v.dot(d)));
        if (ang > cone) continue;
        if (!g.level.grid.los(o.x, o.z, aim.x, aim.z)) continue;
        if (!best || ang < best.ang) best = { zombie: z, aim, ang, t: len };
        continue;
      }
      let t = null, isHead = false;
      // Kopf
      const th = ray.intersectSphere(new THREE.Sphere(head, 0.17), tmpA) ? ray.origin.distanceTo(tmpA) : null;
      if (th != null) { t = th; isHead = true; }
      // Körper
      if (lying) {
        const c = new THREE.Vector3(z.pos.x, z.pos.y + 0.3, z.pos.z);
        if (ray.intersectSphere(new THREE.Sphere(c, 0.55), tmpA)) { const tb = ray.origin.distanceTo(tmpA); if (t == null || tb < t - 0.05) { t = tb; isHead = false; } }
      } else {
        tmpA.set(z.pos.x, z.pos.y + 0.25, z.pos.z); tmpB.set(z.pos.x, z.pos.y + 1.42, z.pos.z);
        const pr = new THREE.Vector3(), ps = new THREE.Vector3();
        const d2 = ray.distanceSqToSegment(tmpA, tmpB, pr, ps);
        if (d2 < 0.27 * 0.27) { const tb = ray.origin.distanceTo(pr); if (t == null || tb < t - 0.05) { t = tb; isHead = false; } }
      }
      if (t != null && (!best || t < best.t)) best = { zombie: z, t, head: isHead, point: ray.at(t, new THREE.Vector3()) };
    }
    return best;
  }

  // Entfernung bis zum ersten Hindernis (Wand, geschlossene Tür, Glas, Boden, Decke)
  _wallDist(o, d) {
    const grid = this.game.level.grid;
    const step = 0.06;
    for (let t = 0.2; t < RANGE; t += step) {
      const x = o.x + d.x * t, y = o.y + d.y * t, z = o.z + d.z * t;
      const cx = Math.floor(x), cz = Math.floor(z);
      if (!grid.inb(cx, cz)) return t;
      const f = grid.get(cx, cz);
      if (f & (F.SOLID | F.DOORSHUT | F.GLASS)) return t;
      const k = grid.idx(cx, cz);
      if (y < grid.floorY[k] - 0.02 || y > grid.ceilY[k]) return t;
    }
    return RANGE;
  }
}
