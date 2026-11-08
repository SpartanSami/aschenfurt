// Zombie-KI: Zustandsmaschine (Ruhe, Patrouille, Untersuchen, Alarm, Verfolgung, Suche, Rückkehr,
// Angriff, Packen, Taumeln, Tür einschlagen, Versteck prüfen, schlafend/liegend, Aufstehen).
// Wahrnehmung über Sichtfeld, Entfernung, Licht, Bewegung, Taschenlampe und Geräusche.
import * as THREE from 'three';
import { Humanoid } from './humanoid.js';
import { moveAgent } from '../world/physics.js';
import { F } from '../world/grid.js';
import { angleDiff, clamp, RNG } from '../core/rng.js';
import { ZOMBIE_TYPES } from '../data/zombietypes.js';

export const ZS = {
  IDLE: 'idle', PATROL: 'patrol', DORMANT: 'dormant', GETUP: 'getup', INVESTIGATE: 'investigate', ALERT: 'alert',
  CHASE: 'chase', SEARCH: 'search', RETURN: 'return', ATTACK: 'attack', GRAB: 'grab', STAGGER: 'stagger',
  BASH: 'bash', CHECKHIDE: 'checkhide', SCRIPT: 'script',
};
const STATE_DE = { idle: 'Ruhe', patrol: 'Patrouille', dormant: 'Schlafend', getup: 'Aufstehen', investigate: 'Untersuchen', alert: 'Alarmiert', chase: 'Verfolgung', search: 'Suche', return: 'Rückkehr', attack: 'Angriff', grab: 'Packt', stagger: 'Taumelt', bash: 'Tür', checkhide: 'Versteck prüfen', script: 'Skript' };

let ZID = 0;
const tmpV = new THREE.Vector3();

export class Zombie {
  constructor(game, def) {
    this.game = game;
    this.def = def;
    this.id = def.id || 'z' + (ZID++);
    const type = ZOMBIE_TYPES[def.type || 'shambler'] || ZOMBIE_TYPES.shambler;
    this.type = type;
    this.rng = new RNG((def.x * 131 + def.z * 71) | 0);
    this.model = new Humanoid({ outfit: def.outfit || type.outfit || 'gown', skin: def.skin || this.rng.pick(['zombie', 'zombie2', 'zombie3']), pose: def.pose || 'stand', hair: def.hair ?? this.rng.pick([0x1a1410, 0x3a2a1a, 0x5a5048, 0x111111]), hairStyle: def.hairStyle || this.rng.pick(['short', 'short', 'long', 'none']), scale: def.scale || (0.94 + this.rng.next() * 0.12), tornSleeve: this.rng.chance(0.3), limp: def.limp });
    this.root = this.model.root;
    this.pos = new THREE.Vector3(def.x, game.level.grid.heightAt(def.x, def.z), def.z);
    this.home = { x: def.x, z: def.z, yaw: def.yaw ?? 0 };
    this.yaw = def.yaw ?? 0;
    this.radius = 0.3;
    this.alive = true;
    this.hearing = type.hearing;
    this.state = def.state || (def.pose && def.pose !== 'stand' ? ZS.DORMANT : def.patrol ? ZS.PATROL : ZS.IDLE);
    if (this.state === ZS.DORMANT && (!def.pose || def.pose === 'stand')) this.model.setPose('stand', true);
    this.stateT = 0;
    this.suspicion = 0;
    this.lastKnown = null; this.lastSeenT = -99; this.seen = false;
    this.target = null; this.path = null; this.pathI = 0; this.repathT = 0;
    this.speed = 0; this.groanT = 2 + this.rng.next() * 6; this.chaseGroanT = 0;
    this.attackT = 0; this.cooldown = 0;
    this.sawHide = null; this.hideCheckT = 0;
    this.patrolI = 0; this.waitT = 0;
    this.stuckT = 0; this.lastProgress = this.pos.clone(); this.stuckCount = 0;
    this.bashDoor = null;
    this.perceiveT = this.rng.next() * 0.2;
    this.time = 0;
    this.chaseRamp = 0;
    this.scripted = !!def.scripted;
    this.noAttack = !!def.noAttack;
    this.ghost = false;
    this.investigateT = 0;
    this.searchPoints = 0;
    this.footT = 0;
    this.lastAlertedBy = null;
    this.seenByPlayer = false;
    this.root.position.copy(this.pos); this.root.rotation.y = this.yaw;
    game.scene.add(this.root);
    if (def.state === 'chase') this.forceChase();
  }

  get stateName() { return STATE_DE[this.state] || this.state; }

  setState(s) {
    if (this.state === s) return;
    const prev = this.state;
    this.state = s; this.stateT = 0;
    this.path = null;
    if (s === ZS.CHASE && prev !== ZS.ATTACK && prev !== ZS.STAGGER && prev !== ZS.GRAB && prev !== ZS.BASH) {
      this.chaseRamp = 0;
      this.game.onZombieChase(this);
    }
    if (s === ZS.SEARCH) this.searchPoints = 0;
  }

  forceChase() {
    const p = this.game.player.pos;
    this.lastKnown = { x: p.x, z: p.z }; this.lastSeenT = this.time;
    if (this.state === ZS.DORMANT) { this.setState(ZS.GETUP); this.afterGetup = ZS.CHASE; return; }
    this.setState(ZS.CHASE);
  }

  // ---------------- Wahrnehmung ----------------
  _perceive(dt) {
    const game = this.game, p = game.player, g = game.level.grid;
    this.seen = false;
    if (p.mode === 'dead' || game.godInvisible) return 0;
    const dx = p.pos.x - this.pos.x, dz = p.pos.z - this.pos.z;
    const d = Math.hypot(dx, dz);
    if (Math.abs(p.pos.y - this.pos.y) > 2.2 && d > 2) return 0;
    let vis = p.visibility();
    // Taschenlampe ins Gesicht
    let flash = false;
    if (p.flashlight && d < 22) {
      const cd = new THREE.Vector3(); game.camera.getWorldDirection(cd);
      const tz = new THREE.Vector3(-dx, 0, -dz).normalize();
      const cd2 = new THREE.Vector3(cd.x, 0, cd.z).normalize();
      if (cd2.dot(tz) > 0.9) { flash = true; vis = Math.max(vis, 1.35); }
    }
    if (vis <= 0.001) return 0;
    const type = this.type;
    const alertish = this.state === ZS.CHASE || this.state === ZS.ALERT || this.state === ZS.SEARCH || this.state === ZS.ATTACK;
    const range = (flash ? 20 : type.sight * (0.3 + 0.7 * Math.min(1, vis))) * (alertish ? 1.3 : 1);
    if (d > range) return 0;
    // Sichtfeld
    const fwdx = -Math.sin(this.yaw), fwdz = -Math.cos(this.yaw);
    const dot = (fwdx * dx + fwdz * dz) / Math.max(0.001, d);
    const fov = alertish ? -0.2 : Math.cos((type.fov * Math.PI / 180) / 2);
    const close = d < (p.sprinting ? 2.6 : p.crouched ? 1.0 : 1.7);
    if (dot < fov && !close) return 0;
    if (!g.los(this.pos.x, this.pos.z, p.pos.x, p.pos.z, p.crouched && !close)) return 0;
    this.seen = true;
    const s = vis * (1.15 - d / range) * (flash ? 1.6 : 1) * (close ? 2.5 : 1);
    return Math.max(0, s);
  }

  onNoise(evt, loud) {
    if (!this.alive || this.state === ZS.SCRIPT) return;
    const isPlayer = ['step', 'vault', 'land', 'door', 'gasp', 'hide', 'phone', 'breath'].includes(evt.kind);
    if (this.state === ZS.CHASE || this.state === ZS.ATTACK || this.state === ZS.GRAB || this.state === ZS.BASH) {
      if (isPlayer && loud > 0.2) { this.lastKnown = { x: evt.x, z: evt.z }; this.lastSeenT = Math.max(this.lastSeenT, this.time - 0.6); }
      return;
    }
    if (this.state === ZS.STAGGER) return;
    const strength = loud * evt.radius;
    if (this.state === ZS.DORMANT) {
      if (strength >= this.type.wake * (this.def.wake ?? 1)) {
        this.setState(ZS.GETUP);
        this.afterGetup = loud > 0.7 && isPlayer ? ZS.ALERT : ZS.INVESTIGATE;
        this.noiseTarget = { x: evt.x, z: evt.z };
      }
      return;
    }
    if (loud < 0.1) return;
    if (evt.kind === 'zgroan' && evt.src) {
      // ein anderer Zombie hat etwas entdeckt -> dorthin
      const lk = evt.src.lastKnown;
      this.noiseTarget = lk ? { x: lk.x + this.rng.range(-1.5, 1.5), z: lk.z + this.rng.range(-1.5, 1.5) } : { x: evt.x, z: evt.z };
      if (this.state !== ZS.INVESTIGATE || loud > 0.4) { this.setState(ZS.INVESTIGATE); this.investigateT = 0; }
      return;
    }
    if (isPlayer && loud > 0.75 && Math.hypot(evt.x - this.pos.x, evt.z - this.pos.z) < 3.2) {
      this.lastKnown = { x: evt.x, z: evt.z }; this.lastSeenT = this.time - 0.5;
      this.setState(ZS.ALERT); return;
    }
    this.noiseTarget = { x: evt.x, z: evt.z };
    if (this.state !== ZS.INVESTIGATE || loud > (this.investLoud || 0)) {
      this.investLoud = loud;
      this.setState(ZS.INVESTIGATE); this.investigateT = 0;
    }
  }

  // ---------------- Bewegung ----------------
  _goTo(x, z, speed, dt, opts = {}) {
    const g = this.game.level.grid;
    this.repathT -= dt;
    const tgtChanged = !this.target || Math.hypot(this.target.x - x, this.target.z - z) > (opts.repathDist || 1.0);
    if (!this.path || (tgtChanged && this.repathT <= 0) || this.repathT < -2) {
      if (this.game.pathBudget > 0) {
        this.game.pathBudget--;
        this.target = { x, z };
        this.path = g.findPath(this.pos.x, this.pos.z, x, z);
        this.pathI = 1;
        this.repathT = opts.repath ?? 0.45;
        if (!this.path) { this.path = []; this.noPath = true; } else this.noPath = false;
      }
    }
    if (!this.path || !this.path.length) {
      // direkte Annäherung wenn sehr nah und frei
      const d = Math.hypot(x - this.pos.x, z - this.pos.z);
      if (d < 1.6 && g.los(this.pos.x, this.pos.z, x, z)) return this._steer(x, z, speed, dt, opts);
      this.speed = 0; return d;
    }
    // Wegpunkt vorausschauend wählen
    while (this.pathI < this.path.length - 1) {
      const n = this.path[this.pathI];
      if (Math.hypot(n.x + 0.5 - this.pos.x, n.y + 0.5 - this.pos.z) < 0.55) this.pathI++;
      else break;
    }
    let wp = this.path[Math.min(this.pathI, this.path.length - 1)];
    // Abkürzen, wenn der übernächste Punkt direkt erreichbar ist
    const look = this.path[Math.min(this.pathI + 2, this.path.length - 1)];
    if (look && this._walkLine(this.pos.x, this.pos.z, look.x + 0.5, look.y + 0.5)) wp = look;
    let tx = wp.x + 0.5, tz = wp.y + 0.5;
    const last = this.pathI >= this.path.length - 1 || wp === this.path[this.path.length - 1];
    if (last) { tx = x; tz = z; }
    this._steer(tx, tz, speed, dt, opts);
    return Math.hypot(x - this.pos.x, z - this.pos.z);
  }
  _walkLine(ax, az, bx, bz) {
    const g = this.game.level.grid;
    const d = Math.hypot(bx - ax, bz - az);
    const n = Math.ceil(d / 0.35);
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      const x = ax + (bx - ax) * t, z = az + (bz - az) * t;
      if (!g.aiWalkable(Math.floor(x), Math.floor(z))) return false;
      const v = g.get(Math.floor(x), Math.floor(z));
      if (v & (F.VAULT | F.DOORSHUT)) return false;
    }
    return true;
  }
  _steer(tx, tz, speed, dt, opts = {}) {
    const dx = tx - this.pos.x, dz = tz - this.pos.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.05) { this.speed = 0; return; }
    const want = Math.atan2(-dx, -dz);
    const turn = (this.state === ZS.CHASE ? this.type.turnChase : this.type.turn) * dt;
    const diff = angleDiff(this.yaw, want);
    this.yaw += clamp(diff, -turn, turn);
    // langsamer in scharfen Kurven
    const align = Math.max(0.2, Math.cos(Math.min(Math.PI / 2, Math.abs(diff))));
    // in Kletterzellen verlangsamen
    const g = this.game.level.grid;
    const inVault = g.has(Math.floor(this.pos.x), Math.floor(this.pos.z), F.VAULT);
    this.climbing = inVault;
    const sp = speed * align * (inVault ? 0.35 : 1);
    this.speed = sp;
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
    const step = Math.min(sp * dt, d);
    // Separation
    let sx = 0, sz = 0;
    for (const o of this.game.zombies) {
      if (o === this || !o.alive) continue;
      const ox = this.pos.x - o.pos.x, oz = this.pos.z - o.pos.z;
      const od = Math.hypot(ox, oz);
      if (od < 0.7 && od > 0.001) { sx += ox / od * (0.7 - od); sz += oz / od * (0.7 - od); }
    }
    const ignore = this.game.level.colliders.filter ? null : null;
    void ignore;
    const hits = moveAgent(this.game.level, this.pos, fx * step + sx * dt * 2, fz * step + sz * dt * 2, { radius: this.radius, height: 1.7, zombie: true, ignore: inVault ? this._vaultSet() : null });
    for (const h of hits) if (h.door && h.door.isShut() && opts.allowBash !== false) { this.bashDoor = h.door; }
    // Bodenhöhe
    const gh = g.heightAt(this.pos.x, this.pos.z);
    this.pos.y += (gh - this.pos.y) * Math.min(1, dt * (gh < this.pos.y ? 6 : 12));
  }
  _vaultSet() {
    const s = new Set();
    for (const c of this.game.level.collidersNear(this.pos.x, this.pos.z, 1.5)) if (c.vault) s.add(c);
    return s;
  }
  _face(x, z, dt, rate = 3) {
    const want = Math.atan2(-(x - this.pos.x), -(z - this.pos.z));
    this.yaw += clamp(angleDiff(this.yaw, want), -rate * dt, rate * dt);
  }

  // ---------------- Update ----------------
  update(dt) {
    if (!this.alive) return;
    this.time += dt; this.stateT += dt;
    const game = this.game, p = game.player, diff = game.difficulty, type = this.type;
    const m = this.model;
    // Wahrnehmung (gestaffelt)
    this.perceiveT -= dt;
    let sight = 0;
    const canPerceive = this.state !== ZS.DORMANT || this.def.pose === 'kneel' || this.def.pose === 'sitting';
    if (this.perceiveT <= 0 && canPerceive && this.state !== ZS.SCRIPT) {
      this.perceiveT = 0.12;
      sight = this._perceive(dt);
      this._sight = sight;
      if (this.seen) { this.lastKnown = { x: p.pos.x, z: p.pos.z }; this.lastSeenT = this.time; }
    } else sight = this._sight || 0;
    const seenRecently = this.time - this.lastSeenT < 0.25;
    if (seenRecently && sight > 0) this.suspicion = Math.min(1.5, this.suspicion + sight * dt * type.detect * diff.zDetect * 1.25);
    else this.suspicion = Math.max(0, this.suspicion - dt * 0.22);
    // Atemgeräusche im Versteck hören
    if (p.mode === 'hidden' && this.state !== ZS.DORMANT && this.state !== ZS.SCRIPT) {
      const d = Math.hypot(p.pos.x - this.pos.x, p.pos.z - this.pos.z);
      if (d < p.breathingRadius() * this.hearing && d < 4) { this.breathHeard = (this.breathHeard || 0) + dt; } else this.breathHeard = Math.max(0, (this.breathHeard || 0) - dt * 0.5);
    }
    // Geräusche
    this.groanT -= dt;
    if (this.groanT <= 0) {
      this.groanT = (this.state === ZS.CHASE ? 2.2 : 7) + this.rng.next() * (type.quiet ? 22 : 8);
      if (this.state !== ZS.DORMANT || this.rng.chance(0.3)) {
        const kind = this.state === ZS.CHASE ? 'chase' : this.state === ZS.SEARCH || this.state === ZS.INVESTIGATE ? 'search' : 'idle';
        if (!type.quiet || this.state === ZS.CHASE || this.rng.chance(0.25)) game.audio.zombie(kind, tmpV.set(this.pos.x, this.pos.y + 1.6, this.pos.z), kind === 'idle' ? 0.55 : 0.85);
        m._groanFlash = 0.6;
      }
    }
    this.cooldown -= dt;

    switch (this.state) {
      case ZS.IDLE: this._idle(dt); break;
      case ZS.PATROL: this._patrol(dt); break;
      case ZS.DORMANT: this.speed = 0; m.mode = 'idle'; if (this.def.pose === 'kneel' || this.def.pose === 'sitting') this._dormantSight(); break;
      case ZS.GETUP:
        this.speed = 0; m.mode = 'idle';
        if (m.standUp(dt, type.getup)) { this.setState(this.afterGetup || ZS.INVESTIGATE); if (this.state === ZS.CHASE || this.state === ZS.ALERT) game.audio.zombie('alert', tmpV.set(this.pos.x, this.pos.y + 1.4, this.pos.z), 1); }
        break;
      case ZS.INVESTIGATE: this._investigate(dt); break;
      case ZS.ALERT: this._alert(dt); break;
      case ZS.CHASE: this._chase(dt); break;
      case ZS.SEARCH: this._search(dt); break;
      case ZS.RETURN: this._return(dt); break;
      case ZS.ATTACK: this._attack(dt); break;
      case ZS.GRAB: this.speed = 0; m.mode = 'grab'; this._face(p.pos.x, p.pos.z, dt, 8); break;
      case ZS.STAGGER: this.speed = 0; m.mode = 'stagger'; if (this.stateT > (this.staggerDur || 1.8)) this.setState(ZS.CHASE); break;
      case ZS.BASH: this._bash(dt); break;
      case ZS.CHECKHIDE: this._checkHide(dt); break;
      case ZS.SCRIPT: this._script(dt); break;
    }
    // Reaktionen auf Sicht in ruhigen Zuständen
    if ([ZS.IDLE, ZS.PATROL, ZS.INVESTIGATE, ZS.RETURN, ZS.SEARCH].includes(this.state)) {
      if (this.suspicion >= 1) { this.setState(ZS.ALERT); }
      else if (this.suspicion > 0.35 && this.state !== ZS.INVESTIGATE && this.state !== ZS.SEARCH && this.lastKnown) {
        this.noiseTarget = { ...this.lastKnown }; this.setState(ZS.INVESTIGATE); this.investigateT = 0; this.cautious = true;
      }
    }
    // Animation
    m.speed = this.speed;
    m.mode = this.state === ZS.CHASE ? (this.climbing ? 'climb' : 'chase') : this.state === ZS.SEARCH || (this.state === ZS.INVESTIGATE && this.speed < 0.1) || this.state === ZS.CHECKHIDE ? 'search'
      : this.state === ZS.ALERT ? 'alert' : this.state === ZS.ATTACK ? 'attack' : this.state === ZS.GRAB ? 'grab' : this.state === ZS.STAGGER ? 'stagger' : this.state === ZS.BASH ? 'bash' : this.climbing ? 'climb' : 'idle';
    m.attackT = this.attackT;
    // Kopf schaut zum Ziel
    let lookYaw = 0;
    if (this.lastKnown && (this.state === ZS.ALERT || this.state === ZS.CHASE || this.state === ZS.INVESTIGATE)) {
      const want = Math.atan2(-(this.lastKnown.x - this.pos.x), -(this.lastKnown.z - this.pos.z));
      lookYaw = clamp(angleDiff(this.yaw, want), -1.1, 1.1);
    }
    m.lookYaw = lookYaw;
    m.update(dt, { alertGroan: (m._groanFlash = Math.max(0, (m._groanFlash || 0) - dt)) > 0.2 });
    this.root.position.copy(this.pos);
    this.root.rotation.y = this.yaw;
    // Schlurfgeräusche
    if (this.speed > 0.2) {
      this.footT -= dt * this.speed;
      if (this.footT <= 0) { this.footT = this.state === ZS.CHASE ? 0.75 : 0.62; game.audio.play('step_concrete', { variant: this.rng.int(0, 3), pos: tmpV.set(this.pos.x, this.pos.y + 0.1, this.pos.z), vol: this.state === ZS.CHASE ? 0.55 : 0.28, rate: 0.7, jitter: 0.2, ref: 1, rolloff: 1.6 }); }
    }
    // Feststecken erkennen
    if (this.speed > 0.3) {
      this.stuckT += dt;
      if (this.stuckT > 1.6) {
        if (this.pos.distanceTo(this.lastProgress) < 0.25) { this.path = null; this.repathT = 0; this.stuckCount++; if (this.stuckCount > 4 && this.state !== ZS.CHASE) { this.setState(ZS.IDLE); this.stuckCount = 0; } }
        else this.stuckCount = 0;
        this.stuckT = 0; this.lastProgress.copy(this.pos);
      }
    }
  }

  _dormantSight() {
    // sitzende/kniende Zombies bemerken Bewegung in der Nähe
    if (this.suspicion > 0.6) { this.setState(ZS.GETUP); this.afterGetup = ZS.ALERT; }
  }

  _idle(dt) {
    this.waitT -= dt;
    if (this.def.stalker || this.type.stationary) {
      this.speed = 0;
      // langsam zum Ursprungsblick zurück drehen
      this.yaw += angleDiff(this.yaw, this.home.yaw) * Math.min(1, dt * 0.5);
      return;
    }
    if (this.wanderTarget) {
      const d = this._goTo(this.wanderTarget.x, this.wanderTarget.z, this.type.walk * 0.7, dt, { repath: 2 });
      if (d < 0.4 || this.noPath) { this.wanderTarget = null; this.waitT = 4 + this.rng.next() * 9; }
    } else {
      this.speed = 0;
      if (this.waitT <= 0) {
        const r = this.def.wander ?? 2.5;
        if (r > 0) {
          const x = this.home.x + this.rng.range(-r, r), z = this.home.z + this.rng.range(-r, r);
          if (this.game.level.grid.aiWalkable(Math.floor(x), Math.floor(z))) this.wanderTarget = { x, z };
        }
        this.waitT = 3 + this.rng.next() * 6;
      }
    }
  }
  _patrol(dt) {
    const pts = this.def.patrol;
    if (this.waitT > 0) { this.waitT -= dt; this.speed = 0; return; }
    const t = pts[this.patrolI % pts.length];
    const d = this._goTo(t[0], t[1], this.type.walk, dt, { repath: 3 });
    if (d < 0.45 || this.noPath) { this.patrolI++; this.waitT = 0.8 + this.rng.next() * 2.5; }
  }
  _investigate(dt) {
    const t = this.noiseTarget;
    if (!t) { this.setState(ZS.RETURN); return; }
    if (this.stateT < 0.6) { this.speed = 0; this._face(t.x, t.z, dt, 2.5); return; }  // kurz innehalten und hinsehen
    const sp = this.type.walk * (this.cautious ? 0.8 : 1.1);
    const d = this._goTo(t.x, t.z, sp, dt);
    if (d < 0.9 || this.noPath) {
      this.speed = 0;
      this.investigateT += dt;
      if (this.investigateT > 2.5 + this.rng.next() * 2) { this.cautious = false; this.investLoud = 0; this.setState(ZS.SEARCH); }
    }
    if (this.stateT > 25) this.setState(ZS.RETURN);
  }
  _alert(dt) {
    const p = this.game.player;
    this.speed = 0;
    if (this.lastKnown) this._face(this.lastKnown.x, this.lastKnown.z, dt, 5);
    if (this.stateT < 0.05) {
      this.game.audio.zombie('alert', tmpV.set(this.pos.x, this.pos.y + 1.6, this.pos.z), 1);
      this.model._groanFlash = 1;
    }
    if (this.stateT > this.type.alertDelay / Math.max(0.6, this.game.difficulty.zSpeed)) {
      this.setState(ZS.CHASE);
    }
    void p;
  }
  _chase(dt) {
    const game = this.game, p = game.player;
    this.chaseRamp = Math.min(1, this.chaseRamp + dt / 1.2);
    const sp = this.type.chase * game.difficulty.zSpeed * (0.45 + 0.55 * this.chaseRamp) * (this.def.speedMul || 1) * (game.chaseSpeedMul || 1);
    const tracking = this.time - this.lastSeenT < 1.0 && p.mode !== 'hidden';
    let tx, tz;
    if (tracking) { tx = p.pos.x; tz = p.pos.z; this.lastKnown = { x: tx, z: tz }; }
    else if (this.lastKnown) { tx = this.lastKnown.x; tz = this.lastKnown.z; }
    else { this.setState(ZS.SEARCH); return; }
    // regelmäßiges Knurren lockt andere an
    this.chaseGroanT -= dt;
    if (this.chaseGroanT <= 0) {
      this.chaseGroanT = 3.5 + this.rng.next() * 3;
      game.noise.emit(this.pos.x, this.pos.z, this.type.callRadius, 'zgroan', { src: this });
    }
    if (this.bashDoor) { this.setState(ZS.BASH); return; }
    const d = this._goTo(tx, tz, sp, dt, { repath: 0.35, repathDist: 0.6 });
    // Angriff
    const pd = Math.hypot(p.pos.x - this.pos.x, p.pos.z - this.pos.z);
    if (pd < this.type.reach && tracking && this.cooldown <= 0 && !this.noAttack && p.mode !== 'hidden' && p.mode !== 'dead' && Math.abs(p.pos.y - this.pos.y) < 1.0) {
      this.setState(ZS.ATTACK); this.attackT = 0; this.game.audio.zombie('attack', tmpV.set(this.pos.x, this.pos.y + 1.6, this.pos.z), 1);
      return;
    }
    // Spieler versteckt sich vor meinen Augen
    if (p.mode === 'hidden' && this.sawHide && pd < 14) {
      if (Math.hypot(this.sawHide.x - this.pos.x, this.sawHide.z - this.pos.z) < 1.6) { this.setState(ZS.CHECKHIDE); return; }
      this.lastKnown = { x: this.sawHide.exit.x, z: this.sawHide.exit.z };
    }
    if (!tracking && d < 1.0) { this.setState(ZS.SEARCH); }
    if (this.noPath && !tracking && this.stateT > 2) this.setState(ZS.SEARCH);
  }
  _attack(dt) {
    const game = this.game, p = game.player;
    const wind = this.type.windup / (game.difficulty.zSpeed > 1 ? 1.15 : game.difficulty.zSpeed < 1 ? 0.85 : 1);
    this.speed = 0;
    this._face(p.pos.x, p.pos.z, dt, 6);
    if (this.attackT < 1) {
      this.attackT = Math.min(1, this.stateT / wind);
      // leichtes Nachrücken
      const pd = Math.hypot(p.pos.x - this.pos.x, p.pos.z - this.pos.z);
      if (pd > 0.9) this._steer(p.pos.x, p.pos.z, 1.2, dt, { allowBash: false });
      if (this.attackT >= 1) {
        this.attackT = 1.01;
        game.resolveZombieAttack(this);
      }
    } else if (this.stateT > wind + 0.55) {
      this.attackT = 0;
      this.cooldown = 0.6;
      if (this.state === ZS.ATTACK) this.setState(ZS.CHASE);
    }
  }
  _bash(dt) {
    const door = this.bashDoor;
    this.speed = 0;
    if (!door || !door.isShut() || door.broken) { this.bashDoor = null; this.setState(ZS.CHASE); return; }
    this._face(door.center.x, door.center.z, dt, 4);
    this.bashT = (this.bashT || 0) - dt;
    if (this.bashT <= 0) {
      this.bashT = 0.85 + this.rng.next() * 0.3;
      const burst = door.bash(this.type.bash, this.pos);
      this.game.noise.emit(door.center.x, door.center.z, 9, 'bash', { src: this });
      if (burst) { this.bashDoor = null; this.setState(ZS.CHASE); return; }
    }
    // Spieler wieder sichtbar und Tür nicht nötig? weiter jagen
    if (door.zombieProof || door.locked) {
      if (this.stateT > 6 + this.rng.next() * 4) { this.bashDoor = null; this.setState(ZS.SEARCH); }
    }
    if (this.time - this.lastSeenT < 0.3 && this.stateT > 1.5 && this.game.level.grid.los(this.pos.x, this.pos.z, this.game.player.pos.x, this.game.player.pos.z)) { this.bashDoor = null; this.setState(ZS.CHASE); }
  }
  _search(dt) {
    const dur = (this.type.search + this.rng.next() * 4) * this.game.difficulty.searchTime;
    if (!this.searchTarget || this.searchWait <= 0 && this._arrived) {
      if (this.searchPoints >= 3 || this.stateT > dur) { this.searchTarget = null; this.setState(this.def.patrol ? ZS.PATROL : ZS.RETURN); return; }
      const base = this.lastKnown || this.pos;
      const g = this.game.level.grid;
      for (let k = 0; k < 8; k++) {
        const x = base.x + this.rng.range(-5, 5), z = base.z + this.rng.range(-5, 5);
        if (g.aiWalkable(Math.floor(x), Math.floor(z)) && g.los(base.x, base.z, x, z)) { this.searchTarget = { x, z }; break; }
      }
      if (!this.searchTarget) this.searchTarget = { x: base.x, z: base.z };
      this._arrived = false; this.searchWait = 1.5 + this.rng.next() * 2; this.searchPoints++;
    }
    if (!this._arrived) {
      const d = this._goTo(this.searchTarget.x, this.searchTarget.z, this.type.walk * 1.15, dt);
      if (d < 0.6 || this.noPath) this._arrived = true;
    } else { this.speed = 0; this.searchWait -= dt; }
    // Atmen gehört? Versteck prüfen
    const p = this.game.player;
    if (p.mode === 'hidden' && p.hide && (this.breathHeard || 0) > 1.2) { this.sawHide = p.hide; this.setState(ZS.CHECKHIDE); }
  }
  _return(dt) {
    const d = this._goTo(this.home.x, this.home.z, this.type.walk, dt, { repath: 3 });
    if (d < 0.5 || this.noPath) {
      this.setState(this.def.patrol ? ZS.PATROL : (this.def.returnDormant ? ZS.IDLE : ZS.IDLE));
      this.waitT = 2;
    }
  }
  _checkHide(dt) {
    const h = this.sawHide;
    const p = this.game.player;
    if (!h) { this.setState(ZS.SEARCH); return; }
    const d = this._goTo(h.exit.x, h.exit.z, this.type.walk * 1.2, dt);
    if (d > 0.7 && this.stateT < 8) return;
    this.speed = 0;
    this._face(h.x, h.z, dt, 3);
    this.hideCheckT += dt;
    if (this.hideCheckT < 1.6 + this.rng.next()) return;
    this.hideCheckT = 0;
    const inside = p.mode === 'hidden' && p.hide === h;
    let chance = this.game.difficulty.hideCheck * (1 - h.safe * 0.5);
    if ((this.breathHeard || 0) > 1) chance += 0.35;
    if (p.breathHeld) chance *= 0.45;
    if (inside && this.rng.next() < chance) {
      this.sawHide = null;
      this.game.pullFromHide(this, h);
      return;
    }
    // nichts gefunden – weitersuchen
    this.sawHide = null;
    this.lastKnown = { x: h.x + this.rng.range(-3, 3), z: h.z + this.rng.range(-3, 3) };
    this.setState(ZS.SEARCH);
  }
  _script(dt) {
    const c = this.cmd;
    if (!c) { this.speed = 0; return; }
    if (c.type === 'goto') {
      const d = this._goTo(c.x, c.z, c.speed || this.type.walk, dt);
      if (d < 0.5 || this.noPath) { this.speed = 0; if (c.then) { const t = c.then; this.cmd = null; t(); } else this.cmd = null; }
    } else if (c.type === 'face') { this.speed = 0; this._face(c.x, c.z, dt, 3); }
    else if (c.type === 'bash') { this.speed = 0; this.model.mode = 'bash'; this.bashT = (this.bashT || 0) - dt; if (this.bashT <= 0) { this.bashT = 0.9; const door = c.door; if (door) { door.bash(0, this.pos); } } }
  }
  command(cmd) { this.setState(ZS.SCRIPT); this.cmd = cmd; }
  release(state = ZS.IDLE) { this.cmd = null; this.state = null; this.setState(state); }

  despawn() {
    this.alive = false;
    this.game.scene.remove(this.root);
  }
}
