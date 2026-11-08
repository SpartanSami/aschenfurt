// Zentrale Spielklasse: verbindet alle Systeme, steuert Spielzustände, Kapitel, Checkpoints,
// Tod/Neustart, Angriffe, Verstecke, Gegenstände und die Hauptschleife.
import * as THREE from 'three';
import { loadSettings, saveSettings, DIFFICULTY, QUALITY } from './core/config.js';
import { Input } from './core/input.js';
import { SaveManager } from './core/save.js';
import { bus } from './core/events.js';
import { Renderer } from './render/renderer.js';
import { setTextureQuality } from './render/textures.js';
import { FX } from './render/fx.js';
import { AudioEngine } from './systems/audio.js';
import { Phone } from './systems/phone.js';
import { Story } from './systems/story.js';
import { Inventory } from './systems/inventory.js';
import { Player } from './player/player.js';
import { Hands } from './player/hands.js';
import { NoiseSystem } from './ai/noise.js';
import { Zombie, ZS } from './ai/zombie.js';
import { NPC } from './ai/npc.js';
import { Humanoid } from './ai/humanoid.js';
import { Level } from './world/level.js';
import { LevelDef } from './world/leveldef.js';
import { HUD } from './ui/hud.js';
import { DocViewer } from './ui/docs.js';
import { Menu } from './ui/menu.js';
import { CHAPTERS, CHAPTER_ORDER } from './data/chapters/index.js';
import { RNG } from './core/rng.js';

function freshState() {
  return { flags: {}, done: new Set(), picked: new Set(), doors: {}, power: {}, removed: new Set(), hasPhone: false, fragments: new Set() };
}

export class Game {
  constructor(root) {
    this.root = root;
    this.canvas = root.querySelector('canvas');
    this.settings = loadSettings();
    this.difficulty = DIFFICULTY[this.settings.difficulty] || DIFFICULTY.normal;
    this.input = new Input(this.canvas, this.settings);
    this.renderer = new Renderer(this.canvas, this.settings);
    const q = QUALITY[this.settings.quality] || QUALITY.medium;
    setTextureQuality(q.texSize, Math.min(8, this.renderer.r.capabilities.getMaxAnisotropy()));
    this.audio = new AudioEngine(this.settings);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(this.settings.fov, window.innerWidth / window.innerHeight, 0.05, 90);
    this.scene.add(this.camera);
    this.hemi = new THREE.HemisphereLight(0x8090a0, 0x202020, 0.0);
    this.scene.add(this.hemi);
    // Taschenlampe (Smartphone-LED) – wirft Schatten
    this.flash = new THREE.SpotLight(0xfff2e0, 0, 24, 0.5, 0.55, 1.4);
    this.flash.castShadow = true;
    this.flash.shadow.mapSize.set(q.shadow, q.shadow);
    this.flash.shadow.camera.near = 0.15; this.flash.shadow.camera.far = 24;
    this.flash.shadow.bias = -0.0006; this.flash.shadow.normalBias = 0.03;
    this.scene.add(this.flash); this.scene.add(this.flash.target);
    this.flashDir = new THREE.Vector3(0, 0, -1);
    this.secCam = new THREE.PerspectiveCamera(70, 1, 0.1, 60);
    this.state = freshState();
    this.save = new SaveManager();
    this.inventory = new Inventory();
    this.noise = new NoiseSystem(this);
    this.player = new Player(this, this.camera);
    this.phone = new Phone(this);
    this.hands = new Hands(this, this.phone.canvas);
    this.story = new Story(this);
    this.fx = new FX(this);
    this.fx.attach(this.scene);
    this.ui = root.querySelector('#ui');
    this.hud = new HUD(this, this.ui);
    this.docs = new DocViewer(this, this.ui);
    this.menu = new Menu(this, this.ui);
    this.zombies = []; this.npcs = [];
    this.level = null; this.chapter = null;
    this.mode = 'menu'; this.modal = null;
    this.time = 0; this.fps = 60; this.threatLevel = 0;
    this.pathBudget = 4;
    this.qte = null;
    this.rng = new RNG(99);
    this.debug = /[?&]debug/.test(location.search);
    this.godMode = false;
    this.renderer.onResize = (w, h) => { this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.hands.resize(w, h); this.secCam.aspect = w / h; this.secCam.updateProjectionMatrix(); };
    this.renderer.resize();
    this.input.onLockChange = (locked) => {
      if (!locked && this.mode === 'play' && !this.modal && !this._allowUnlock) this.pause();
      this._allowUnlock = false;
    };
    this.audio.occlusionFn = (pos) => this.level ? !this.level.grid.losLight(this.camera.position.x, this.camera.position.z, pos.x, pos.z) : false;
    document.addEventListener('visibilitychange', () => { if (document.hidden && this.mode === 'play') this.pause(); });
    window.NWO = this;
    this.last = performance.now();
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
    this.menu.showMain();
  }

  // ---------------- Einstellungen ----------------
  applySettings() {
    saveSettings(this.settings);
    this.camera.fov = this.settings.fov; this.camera.updateProjectionMatrix();
    this.audio.applyVolumes();
    this.renderer.resize();
  }
  setQuality(name) {
    this.settings.quality = name;
    const q = QUALITY[name];
    this.renderer.setQuality(name);
    this.flash.shadow.mapSize.set(q.shadow, q.shadow);
    if (this.flash.shadow.map) { this.flash.shadow.map.dispose(); this.flash.shadow.map = null; }
    saveSettings(this.settings);
  }

  // ---------------- Spielablauf ----------------
  async newGame(diffId) {
    this.audio.init();
    this.settings.difficulty = diffId; saveSettings(this.settings);
    this.difficulty = DIFFICULTY[diffId];
    this.state = freshState();
    this.inventory.reset(); this.phone.reset();
    this.player.hp = 100;
    this.save.newRun();
    await this.loadChapter('ch1', 'start', null);
  }
  async continueGame() {
    this.audio.init();
    const s = this.save.get();
    if (!s || !s.snapshot) return;
    await this.restore(s.snapshot);
  }
  async startChapter(id) {
    this.audio.init();
    const snap = this.save.chapterStart(id);
    if (snap) await this.restore(snap);
    else { this.state = freshState(); this.inventory.reset(); this.phone.reset(); await this.loadChapter(id, 'start', null); }
  }
  async restore(snap) {
    this.difficulty = DIFFICULTY[snap.difficulty] || this.difficulty;
    const st = freshState();
    st.flags = { ...snap.flags }; st.done = new Set(snap.done); st.picked = new Set(snap.picked);
    st.doors = { ...snap.doors }; st.power = { ...snap.power }; st.removed = new Set(snap.removed);
    st.hasPhone = snap.hasPhone; st.fragments = new Set(snap.fragments || []);
    this.state = st;
    this.inventory.load(snap.inventory);
    this.phone.load(snap.phone);
    this.phone.clock = snap.clock || this.phone.clock;
    this.player.hp = snap.hp;
    this.player.painkiller = 0;
    await this.loadChapter(snap.chapter, snap.checkpoint, snap);
  }

  async loadChapter(id, cp = 'start', snap = null) {
    this.mode = 'loading';
    this.menu.hideAll();
    this.menu.loading(true);
    this.input.requestLock();
    await new Promise((r) => setTimeout(r, 30));
    this._teardown();
    const chapter = CHAPTERS[id];
    this.chapter = chapter;
    if (!snap && cp === 'start') { // frischer Kapitelstart: Welt-Zustand zurücksetzen
      this.state.doors = {}; this.state.power = {}; this.state.removed = new Set(); this.state.picked = new Set([...this.state.picked].filter((x) => !x.startsWith(id + ':')));
    }
    const def = new LevelDef(chapter.w, chapter.h, chapter.opts || {});
    chapter.build(def, this);
    const level = new Level(this, chapter, def);
    this.level = level;
    level.build(this.scene, this.renderer.quality);
    // Welt-Zustand anwenden
    for (const d of level.doors) {
      const s = this.state.doors[d.id];
      if (!s) continue;
      if (s.locked !== undefined) d.setLocked(s.locked);
      if (s.broken) { d.broken = true; }
      if (s.open !== undefined) { d.amount = d.target = s.open ? 1 : 0; d._place(); d._applyFlags(); }
    }
    for (const [g, on] of Object.entries(this.state.power)) level.lights.setPower(g, on);
    for (const gl of level.glass) if (this.state.flags['glass:' + gl.id]) { gl.broken = true; gl.pane.visible = false; level.grid.clear(gl.x, gl.y, 32); }
    level.updateGridTex(); level.updateAmbient();
    // Umgebung
    const env = chapter.env || {};
    this.scene.fog = new THREE.FogExp2(env.fog ?? 0x050607, env.fogDensity ?? 0.055);
    this.scene.background = new THREE.Color(env.bg ?? 0x020203);
    this.hemi.color.setHex(env.hemiSky ?? 0x6070a0); this.hemi.groundColor.setHex(env.hemiGround ?? 0x101010);
    this.hemi.intensity = env.hemi ?? 0.05;
    this.renderer.r.toneMappingExposure = env.exposure ?? 1.0;
    this.renderer.fx.uTint.value.set(env.tint ?? 0xffffff);
    this.chapterNoiseMul = env.noiseMul ?? 1;
    this.storyDate = env.date || 'Donnerstag, 13. November';
    this.hands.setSleeve(env.sleeve ?? 0x8fb0c4);
    // Gegner
    for (const zd of def.zombies) {
      if (this.state.removed.has(zd.id)) continue;
      if (zd.spawnIf && !zd.spawnIf(this.state.flags)) continue;
      this.zombies.push(new Zombie(this, zd));
    }
    // Begleiter aus dem Speicherstand
    if (snap && snap.npcs) for (const n of snap.npcs) this.addNpc(n.id, n.x, n.z, { mode: n.mode });
    // Story
    this.story.load(chapter);
    const cpd = def.checkpoints[cp] || def.checkpoints.start;
    this.player.spawn(cpd.x, cpd.z, cpd.yaw);
    this.player.flashlight = snap ? !!snap.flashlight : this.player.flashlight;
    this.hands.setFlashlight(this.player.flashlight);
    this.player.carry = null; this.hands.setCarry(null);
    for (const n of this.npcs) if (n.mode === 'follow') { const sp = n._spotBehindPlayer() || { x: cpd.x, z: cpd.z }; n.teleport(sp.x, sp.z, cpd.yaw); }
    this.audio.init();
    this.audio.stopAllLoops();
    if (env.reverb) this.audio.setReverb(env.reverb[0], env.reverb[1]);
    if (env.reverbMix != null) this.audio.setReverbMix(env.reverbMix);
    if (chapter.ambience) chapter.ambience(this);
    for (const e of level.emitters) this._startEmitter(e);
    this.audio.music && this.audio.music.setForced(null);
    this.fx.setRain(!!env.rain);
    this.fx.fade = 1; this.fx.fadeTo(0, 1.5);
    this.menu.loading(false);
    this.mode = 'play';
    this.hud.setVisible(true);
    const ctx = this.story.ctx;
    if (chapter.onLoad) chapter.onLoad(ctx, { restored: !!snap, checkpoint: cp, snap });
    this.story.fire('start');
    if (snap) this.story.fire('restore:' + cp);
    if (!snap && cp === 'start') this.checkpoint('start');
    this.input.requestLock();
  }

  _teardown() {
    this.story.cancelAll();
    for (const z of this.zombies) z.despawn();
    for (const n of this.npcs) n.despawn();
    this.zombies = []; this.npcs = [];
    if (this.level) this.level.dispose(this.scene);
    this.level = null;
    this.fx.clear();
    this.audio.stopAllLoops();
    this.qte = null;
    this.player.forcedLook = null;
    this.hud.qteShow(null);
    this.hud.callBanner(null);
    this.phone.incoming = null; this.phone.inCall = null; this.phone.open = false;
    this.fx.camMode = false; this.hud.camOverlay(null); this.camView = null;
  }

  _startEmitter(e) {
    const pos = new THREE.Vector3(e.x, e.y, e.z);
    const id = 'em_' + e.x.toFixed(1) + '_' + e.z.toFixed(1);
    if (e.kind === 'beep') { e._t = Math.random(); e._id = id; e._pos = pos; e.kind2 = 'beep'; }
    else if (e.kind === 'flatline') this.audio.loop(id, 'flatline', { pos, vol: 0.12, bus: 'sfx', ref: 1, rolloff: 2 });
    else if (e.kind === 'drip') { e._t = Math.random() * 3; e._pos = pos; e.kind2 = 'drip'; }
    else if (e.kind === 'buzz') this.audio.loop(id, 'buzz_loop', { pos, vol: 0.12, bus: 'sfx', ref: 1, rolloff: 2 });
    else if (e.kind === 'fire') this.audio.loop(id, 'fire_loop', { pos, vol: 0.5, bus: 'sfx', ref: 2, rolloff: 1.5 });
    else if (e.kind === 'alarm') this.audio.loop(id, 'alarm', { pos, vol: e.vol ?? 0.25, bus: 'sfx', ref: 3, rolloff: 1 });
    else if (e.kind === 'caralarm_idle') { e._t = Math.random() * 2; e._pos = pos; e.kind2 = 'caridle'; }
    else if (e.kind === 'loop') this.audio.loop(e.id || id, e.sound, { pos, vol: e.vol ?? 0.3, bus: 'sfx', ref: e.ref ?? 2, rolloff: e.rolloff ?? 1.4 });
  }
  _tickEmitters(dt) {
    for (const e of this.level.emitters) {
      if (!e.kind2) continue;
      e._t -= dt;
      if (e._t > 0) continue;
      if (e.kind2 === 'beep') { e._t = 1.0; if (this.camera.position.distanceTo(e._pos) < 12) this.audio.play('beep', { pos: e._pos, vol: 0.18, ref: 1, rolloff: 2, reverbSend: 0.2 }); }
      else if (e.kind2 === 'drip') { e._t = 0.8 + Math.random() * 3.5; if (this.camera.position.distanceTo(e._pos) < 14) this.audio.play('drip', { pos: e._pos, vol: 0.35, ref: 1, rolloff: 1.5, reverbSend: 1 }); }
      else if (e.kind2 === 'caridle') { e._t = 1.5; if (this.camera.position.distanceTo(e._pos) < 10) this.audio.play('caralarm_idle', { pos: e._pos, vol: 0.2, ref: 1 }); }
    }
  }

  // ---------------- Checkpoints ----------------
  snapshot(cp) {
    const doors = {};
    for (const d of this.level.doors) doors[d.id] = { locked: d.locked, open: d.target > 0.5, broken: d.broken };
    return {
      chapter: this.chapter.id, checkpoint: cp, difficulty: this.difficulty.id,
      flags: JSON.parse(JSON.stringify(this.state.flags)), done: [...this.state.done], picked: [...this.state.picked],
      doors, power: { ...this.state.power }, removed: [...this.state.removed], hasPhone: this.state.hasPhone,
      fragments: [...this.state.fragments],
      inventory: this.inventory.serialize(), hp: Math.max(this.player.hp, cp === 'start' ? this.player.hp : 1), phone: this.phone.serialize(), clock: this.phone.clock,
      flashlight: this.player.flashlight,
      npcs: this.npcs.filter((n) => n.active).map((n) => ({ id: n.id, mode: n.mode === 'goto' ? 'follow' : n.mode, x: n.pos.x, z: n.pos.z })),
    };
  }
  checkpoint(cp) {
    if (!this.level) return;
    if (!this.level.def.checkpoints[cp]) console.warn('Checkpoint ohne Position:', cp);
    const snap = this.snapshot(cp);
    this.lastSnapshot = snap;
    this.save.saveSnapshot(snap);
    this.hud.saved();
  }
  reloadCheckpoint() {
    const snap = this.lastSnapshot || this.save.get()?.snapshot;
    if (snap) this.restore(snap);
  }

  async endChapter(next) {
    this.fx.fadeTo(1, 1.2);
    this.audio.music.setForced(0);
    await this.story.wait(1.3);
    const idx = CHAPTER_ORDER.indexOf(next);
    const ch = CHAPTERS[next];
    if (!ch) return;
    this.mode = 'loading';
    await this.hud.titleCard(`KAPITEL ${idx + 1}`, ch.name, 3.6);
    await this.loadChapter(next, 'start', null);
  }

  async playEnding(id) {
    this.save.addEnding(id);
    this.mode = 'ending';
    this.input.exitLock();
    this.hud.setVisible(false);
    this.audio.music.setForced(0);
    await this.menu.ending(id);
  }

  // ---------------- Modal / Pause ----------------
  setModal(m) { this.modal = m; }
  pause() {
    if (this.mode !== 'play') return;
    this.mode = 'paused';
    this.audio.suspend();
    this.menu.showPause();
  }
  resume() {
    if (this.mode !== 'paused') return;
    this.menu.hideAll();
    this.mode = 'play';
    this.audio.resume();
    this.input.requestLock();
    this.last = performance.now();
  }
  toMainMenu() {
    this._teardown();
    this.mode = 'menu';
    this.hud.setVisible(false);
    this.audio.resume();
    this.audio.stopAllLoops();
    if (this.audio.music) this.audio.music.setForced(0);
    this.menu.showMain();
  }

  // Statische Figur als Dekoration (z. B. auf einer Überwachungskamera)
  decor(o) {
    const h = new Humanoid({ outfit: o.outfit || 'mine', skin: o.skin || 'human', hair: o.hair ?? 0x1a110c, hairStyle: o.hairStyle || 'long', scale: o.scale || 0.95, limp: 0 });
    h.setPose(o.pose || 'sitting', true);
    for (let i = 0; i < 30; i++) h.update(0.05);
    h.root.position.set(o.x, this.level.grid.heightAt(o.x, o.z), o.z);
    h.root.rotation.y = o.yaw || 0;
    this.level.root.add(h.root);
    return h;
  }

  // ---------------- Begleiter ----------------
  npc(id) { return this.npcs.find((n) => n.id === id && n.active); }
  addNpc(id, x, z, o = {}) {
    const ex = this.npc(id); if (ex) { ex.teleport(x, z); if (o.mode) ex.mode = o.mode; return ex; }
    const n = new NPC(this, id, x, z, o);
    this.npcs.push(n);
    return n;
  }

  // ---------------- Gegenstände ----------------
  pickUp(it) {
    const info = it.info;
    const kind = info.kind;
    if (kind === 'heal') {
      if (!this.inventory.canAdd(it.type)) { if (!it._warned) { this.hud.toast('Mehr ' + info.name + ' kann Sami nicht tragen'); it._warned = true; } return; }
      this.inventory.add(it.type);
      this.hud.pickup(info.name); this.hud.showStatus();
    } else if (kind === 'key') {
      this.inventory.add(it.type, it.keyId || it.id, it.name || info.name);
      this.hud.pickup(it.name || info.name);
    } else if (kind === 'doc') {
      this.audio.play('paper', { vol: 0.5 });
      this.docs.open(it.doc || it.id);
      this.story.fire('pickup:' + it.id);
      return;
    } else if (kind === 'fragment') {
      this.state.fragments.add(it.id);
      this.state.flags['frag:' + it.id] = true;
      const f = it.fragment;
      if (f) { this.phone.addVoice(it.id, f.title, f.lines, { fragment: true, from: 'Diktiergerät' }); this.story.playLines(f.lines, { channel: 'memo' }); }
      this.hud.pickup('Aufnahme ' + this.state.fragments.size + '/5 gefunden');
    } else if (kind === 'throw') {
      if (this.player.carry) { this.hud.toast('Die Hand ist schon belegt'); return; }
      this.player.carry = it.type; this.hands.setCarry(it.type);
      this.hud.toast(info.name + ' genommen — werfen, um abzulenken');
    } else if (kind === 'story') {
      if (it.type === 'phone') { this.state.hasPhone = true; }
      else this.inventory.add(it.type, it.keyId || it.id, it.name || info.name);
      this.state.flags['has:' + (it.keyId || it.id)] = true;
      this.hud.pickup(it.name || info.name);
    }
    this.audio.play('pickup', { vol: 0.6 });
    this.level.removeItem(it);
    this.state.picked.add(it.pid);
    this.story.fire('pickup:' + it.id);
  }

  // ---------------- Angriffe ----------------
  resolveZombieAttack(z) {
    const p = this.player;
    const d = Math.hypot(p.pos.x - z.pos.x, p.pos.z - z.pos.z);
    if (['hidden', 'dead', 'vault', 'hideMove'].includes(p.mode) || this.qte) return;
    if (d > z.type.reach + 0.4 || !this.level.grid.los(z.pos.x, z.pos.z, p.pos.x, p.pos.z)) { this.audio.play('whoosh', { pos: new THREE.Vector3(z.pos.x, 1.4, z.pos.z), vol: 0.5 }); return; }
    if (this.time < (p.invulnUntil || 0)) return;
    const others = this.zombies.filter((o) => o !== z && o.alive && [ZS.ATTACK, ZS.GRAB, ZS.CHASE].includes(o.state) && Math.hypot(o.pos.x - p.pos.x, o.pos.z - p.pos.z) < 1.5);
    const look = new THREE.Vector3(); this.camera.getWorldDirection(look);
    const to = new THREE.Vector3(z.pos.x - p.pos.x, 0, z.pos.z - p.pos.z).normalize();
    const behind = new THREE.Vector3(look.x, 0, look.z).normalize().dot(to) < -0.35;
    if (others.length >= 2 || (others.length >= 1 && p.healthState !== 'healthy')) {
      p.damage(58, 'group');
      this.hud.toast('Umzingelt!');
      p.invulnUntil = this.time + 1.0;
      return;
    }
    if (behind) {
      p.damage(z.type.damage + 8, 'ambush');
      this._knock(z, 0.5);
      p.invulnUntil = this.time + 1.0;
      return;
    }
    const grabChance = z.type.grab * (p.sprinting ? 0.6 : 1);
    if (this.rng.next() < grabChance && p.mode === 'normal') { this.startGrab(z); return; }
    p.damage(z.type.damage, 'hit');
    this._knock(z, 0.4);
    p.invulnUntil = this.time + 0.8;
  }
  _knock(z, amt) {
    const p = this.player;
    const dx = p.pos.x - z.pos.x, dz = p.pos.z - z.pos.z, d = Math.hypot(dx, dz) || 1;
    p.vel.x += dx / d * amt * 6; p.vel.z += dz / d * amt * 6;
  }
  startGrab(z) {
    const p = this.player;
    p.mode = 'grabbed'; p.interruptHeal();
    this.phone.close();
    z.setState(ZS.GRAB);
    const diff = this.difficulty;
    this.qte = { z, need: diff.qtePresses, count: 0, t: 0, window: 2.7 * diff.qteMul, last: null };
    this.audio.play('bite', { vol: 0.4, rate: 0.7 });
    this.audio.music.sting('chase_hit');
    p.trauma = 0.6;
    this.story.fire('grabbed');
  }
  _updateQTE(dt) {
    const q = this.qte, p = this.player, z = q.z, inp = this.input;
    q.t += dt;
    const head = new THREE.Vector3(z.pos.x, z.pos.y + 1.55, z.pos.z);
    p.forcedLook = { x: head.x, y: head.y, z: head.z, speed: 3 };
    for (const k of ['left', 'right']) if (inp.pressed(k)) { q.count += q.last === k ? 0.35 : 1; q.last = k; this.audio.play('cloth', { vol: 0.4, rate: 1.5 }); p.trauma = Math.min(1, p.trauma + 0.12); }
    if (inp.pressed('interact') || inp.pressed('vault')) { q.count += 0.55; }
    // Zombie zieht den Spieler heran
    const dx = z.pos.x - p.pos.x, dz = z.pos.z - p.pos.z, d = Math.hypot(dx, dz);
    if (d > 0.75) { p.pos.x += dx / d * dt * 0.8; p.pos.z += dz / d * dt * 0.8; }
    this.hud.qteShow(q.count / q.need, 1 - q.t / q.window);
    // weitere Zombies
    const other = this.zombies.find((o) => o !== z && o.alive && o.state === ZS.CHASE && Math.hypot(o.pos.x - p.pos.x, o.pos.z - p.pos.z) < 1.2);
    if (other) {
      this._endQTE();
      p.damage(62, 'group');
      if (p.hp > 0) { z.staggerDur = 1.0; z.setState(ZS.STAGGER); p.mode = 'normal'; p.invulnUntil = this.time + 1.2; }
      return;
    }
    if (q.count >= q.need) {
      this._endQTE();
      z.staggerDur = 2.4; z.setState(ZS.STAGGER);
      const kx = -dx / (d || 1), kz = -dz / (d || 1);
      z.pos.x -= kx * 0.9; z.pos.z -= kz * 0.9;
      p.mode = 'normal'; p.invulnUntil = this.time + 1.8;
      p.stamina = Math.min(p.staminaMax(), p.stamina + 25); p.exhausted = false;
      this.hands.push();
      this.audio.play('hit', { vol: 0.7 });
      this.hud.toast('Losgerissen!');
      this.story.fire('escapedGrab');
    } else if (q.t >= q.window) {
      this._endQTE();
      p.damage(z.type.damage * 1.7, 'bite');
      if (p.hp > 0) { z.staggerDur = 1.3; z.setState(ZS.STAGGER); p.mode = 'normal'; p.invulnUntil = this.time + 1.6; }
    }
  }
  _endQTE() { this.qte = null; this.hud.qteShow(null); this.player.forcedLook = null; }

  pullFromHide(z, h) {
    const p = this.player;
    if (p.mode !== 'hidden' || p.hide !== h) return;
    if (h.door) h.door.rotation.y = -1.7;
    this.audio.play('door_slam', { pos: new THREE.Vector3(h.x, 1.2, h.z), vol: 0.8 });
    p.hide = null; h.occupied = false;
    p.pos.set(h.exit.x, this.level.grid.heightAt(h.exit.x, h.exit.z), h.exit.z);
    p.crouched = false; p.crouchT = 0;
    p.mode = 'normal';
    setTimeout(() => { if (h.door) h.door.rotation.y = 0; }, 900);
    this.hud.toast('Entdeckt!');
    this.startGrab(z);
  }
  onHideEnter(h) {
    for (const z of this.zombies) {
      if (!z.alive) continue;
      const alert = [ZS.CHASE, ZS.ALERT, ZS.ATTACK, ZS.SEARCH, ZS.INVESTIGATE].includes(z.state);
      if (alert && (z.time - z.lastSeenT < 1.4 || z.seen)) z.sawHide = h;
    }
    this.story.fire('hide');
  }
  onHideExit() { this.story.fire('unhide'); }
  onZombieChase(z) {
    if (this.time - (this._lastChaseSting || -99) > 12) { this.audio.music.sting(); this._lastChaseSting = this.time; }
    this.story.fire('chase', z);
  }
  onPlayerDeath(kind) {
    const p = this.player;
    if (this.mode !== 'play') return;
    p.mode = 'dead';
    this._endQTE();
    this.phone.close();
    this.mode = 'dead';
    this.deathT = 0;
    this.audio.music.setForced(0);
    this.audio.play('sting', { vol: 0.6, rate: 0.6 });
    this.fx.fadeTo(0.85, 2.5);
    this.renderer.fx.uFadeColor.value.setRGB(0.18, 0.0, 0.0);
    this.deathKind = kind;
    setTimeout(() => { this.input.exitLock(); this.menu.showDeath(kind); }, 2300);
  }

  // Überwachungskameras
  viewCameras(list) {
    this.camView = { list, i: 0 };
    this.fx.camMode = true;
    this.player.mode = 'locked';
    this._setCam();
    return new Promise((res) => { this.camView.res = res; });
  }
  _setCam() {
    const c = this.camView.list[this.camView.i];
    this.secCam.position.set(c.x, c.y ?? 2.7, c.z);
    this.secCam.lookAt(c.tx, c.ty ?? 0.8, c.tz);
    this.hud.camOverlay(`<b>● REC</b> ${c.label}<br><small>[${this.input.label('left')}]/[${this.input.label('right')}] Kamera wechseln · [${this.input.label('interact')}] beenden</small>`);
    if (c.onView) c.onView(this.story.ctx);
  }
  _updateCams() {
    const v = this.camView, inp = this.input;
    if (inp.pressed('left')) { v.i = (v.i + v.list.length - 1) % v.list.length; this._setCam(); this.audio.play('glitch', { vol: 0.3 }); }
    if (inp.pressed('right')) { v.i = (v.i + 1) % v.list.length; this._setCam(); this.audio.play('glitch', { vol: 0.3 }); }
    if (inp.pressed('interact') || inp.pressed('phone')) {
      inp.consume('interact');
      this.fx.camMode = false; this.hud.camOverlay(null);
      this.player.mode = 'normal';
      const r = v.res; this.camView = null; if (r) r();
    }
  }

  teleportPlayer(x, z, yaw) { this.player.spawn(x, z, yaw ?? this.player.yaw); }

  // ---------------- Hauptschleife ----------------
  _loop(now) {
    requestAnimationFrame(this._loop);
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (dt > 0.1) dt = 0.1;
    if (dt <= 0) dt = 0.001;
    this.fps = this.fps * 0.95 + (1 / dt) * 0.05;
    this.input.beginFrame();
    try { this.update(dt); } catch (e) { console.error(e); if (this.debug) this.hud.toast('Fehler: ' + e.message); }
    this.render(dt);
    this.input.endFrame();
  }

  update(dt) {
    const inp = this.input;
    if (this.debug) this._debugKeys();
    if (this.mode === 'play') {
      this.time += dt;
      if (this.docs.isOpen()) { this.docs.update(inp); }
      else if (this.modal === 'choice') { /* Welt pausiert */ }
      else if (this.camView) {
        this._updateCams();
        this._world(dt * 1.0, true);
      } else {
        this.phone.update(dt, inp);
        if (this.qte) { this._updateQTE(dt); this.player.update(dt, inp); }
        else this.player.update(dt, inp);
        this._world(dt, false);
      }
      this.hands.update(dt);
      this.hud.update(dt);
    } else if (this.mode === 'dead') {
      this.deathT += dt;
      const p = this.player;
      p.pos.y = Math.max(this.level.grid.heightAt(p.pos.x, p.pos.z) - 1.25, p.pos.y - dt * 1.6);
      this.camera.position.y = Math.max(0.35, this.camera.position.y - dt * 1.4);
      this.camera.rotation.z = Math.min(0.9, this.camera.rotation.z + dt * 0.6);
      for (const z of this.zombies) if (z.alive) z.update(dt * 0.5);
      this.fx.update(dt);
    } else if (this.mode === 'ending' || this.mode === 'menu') {
      this.fx.update && this.level && this.fx.update(dt);
    }
    // Audio-Hörer
    if (this.audio.ready) {
      const fwd = new THREE.Vector3(); (this.camView ? this.camera : this.camera).getWorldDirection(fwd);
      this.audio.setListener(this.camera.position, fwd);
      if (this.mode === 'play' || this.mode === 'dead') this.audio.update(dt, this);
    }
  }

  _world(dt, camMode) {
    const p = this.player;
    this.pathBudget = 5;
    for (const z of this.zombies) z.update(dt);
    for (const n of this.npcs) n.update(dt);
    this.level.update(dt, this.camera.position);
    this._tickEmitters(dt);
    // Auslösezonen
    for (const t of this.level.triggers) {
      const inside = p.pos.x >= t.x && p.pos.x <= t.x + t.w && p.pos.z >= t.y && p.pos.z <= t.y + t.h && (t.yMin == null || p.pos.y >= t.yMin);
      if (inside && !t.inside) { t.inside = true; this.story.onEnterZone(t.id); }
      else if (!inside && t.inside) { t.inside = false; this.story.onExitZone(t.id); }
    }
    this.story.update(dt);
    this.noise.update(dt);
    this.fx.update(dt);
    // Bedrohung (für Musik)
    let th = 0;
    for (const z of this.zombies) {
      if (!z.alive) continue;
      const d = Math.hypot(z.pos.x - p.pos.x, z.pos.z - p.pos.z);
      if ([ZS.CHASE, ZS.ATTACK, ZS.GRAB, ZS.BASH].includes(z.state) && d < 40) th = Math.max(th, 3);
      else if (z.state === ZS.ALERT && d < 30) th = Math.max(th, 2.6);
      else if ((z.state === ZS.SEARCH || z.state === ZS.CHECKHIDE) && d < 22) th = Math.max(th, 2);
      else if (z.state === ZS.INVESTIGATE && d < 16) th = Math.max(th, z.suspicion > 0.3 ? 2 : 1.3);
      else if (d < 8 && z.state !== ZS.DORMANT) th = Math.max(th, 1);
    }
    this.threatLevel = th;
    // Taschenlampe
    const fl = this.flash;
    const camDir = new THREE.Vector3(); this.camera.getWorldDirection(camDir);
    this.flashDir.lerp(camDir, 1 - Math.exp(-14 * dt)).normalize();
    const right = new THREE.Vector3().crossVectors(camDir, new THREE.Vector3(0, 1, 0)).normalize();
    fl.position.copy(this.camera.position).addScaledVector(right, -0.16).add(new THREE.Vector3(0, -0.18, 0)).addScaledVector(camDir, 0.15);
    fl.target.position.copy(fl.position).addScaledVector(this.flashDir, 10);
    fl.intensity = p.flashlight && p.mode !== 'hidden' ? 26 : (p.flashlight && p.mode === 'hidden' ? 8 : 0);
    fl.visible = p.flashlight;
    void camMode;
  }

  render(dt) {
    if (!this.level) {
      this.renderer.render(this.menuScene || this.scene, this.camera, null, null, dt);
      return;
    }
    const cam = this.camView ? this.secCam : this.camera;
    const vm = this.camView || this.mode === 'dead' ? null : this.hands.scene;
    this.renderer.render(this.scene, cam, vm, this.hands.camera, dt);
  }

  // ---------- Test-/Debug-Hilfen (für automatisierte Durchspieltests) ----------
  simulate(seconds, step = 1 / 30, each = null) {
    const n = Math.ceil(seconds / step);
    for (let i = 0; i < n; i++) {
      this.input.beginFrame();
      if (each) { const r = each(this, i * step); if (r === 'stop') { this.input.endFrame(); return i * step; } }
      this.update(step);
      this.input.endFrame();
    }
    return seconds;
  }
  // Draufsicht des Levels als PNG-DataURL (Debug/QA)
  debugMap(sc = 8) {
    const g = this.level.grid, c = document.createElement('canvas');
    c.width = g.w * sc; c.height = g.h * sc;
    const x = c.getContext('2d');
    x.fillStyle = '#111'; x.fillRect(0, 0, c.width, c.height);
    for (let j = 0; j < g.h; j++) for (let i = 0; i < g.w; i++) {
      const v = g.f[g.idx(i, j)];
      if (!(v & 2) || (v & 1)) continue;
      let col = '#556';
      if (v & 4) col = (v & 1024) ? '#a33' : '#3a3';
      else if (v & 32) col = '#4aa';
      else if (v & 64) col = '#753';
      else if (v & 256) col = '#aa4';
      else if (v & 8) col = (v & 16) ? '#866' : '#665';
      else if (v & 16) col = '#646';
      const fy = g.floorY[g.idx(i, j)];
      x.fillStyle = col; x.fillRect(i * sc, j * sc, sc - 1, sc - 1);
      if (fy !== 0) { x.fillStyle = 'rgba(255,255,255,' + Math.min(0.5, Math.abs(fy) * 0.1) + ')'; x.fillRect(i * sc, j * sc, sc - 1, sc - 1); }
    }
    x.font = (sc * 1.2) + 'px sans-serif';
    for (const r of this.level.def.rooms) { x.fillStyle = 'rgba(255,255,255,.5)'; x.fillText(r.name, r.x * sc + 2, r.y * sc + sc * 1.2); }
    for (const t of this.level.triggers) { x.strokeStyle = 'rgba(255,200,0,.6)'; x.strokeRect(t.x * sc, t.y * sc, t.w * sc, t.h * sc); }
    for (const f of this.level.lights.fixtures) { x.fillStyle = f.group === 'main' ? '#ff8' : '#f80'; x.fillRect(f.x * sc - 1, f.z * sc - 1, 3, 3); }
    for (const it of this.level.items) { x.fillStyle = '#0ff'; x.beginPath(); x.arc(it.pos.x * sc, it.pos.z * sc, sc * 0.3, 0, 7); x.fill(); }
    for (const ia of this.level.interacts) if (ia.kind !== 'item') { x.fillStyle = '#f0f'; x.fillRect(ia.pos.x * sc - 2, ia.pos.z * sc - 2, 4, 4); }
    for (const h of this.level.hides) { x.strokeStyle = '#0f0'; x.strokeRect(h.x * sc - 3, h.z * sc - 3, 6, 6); }
    for (const z of this.zombies) if (z.alive) { x.fillStyle = '#f33'; x.beginPath(); x.arc(z.pos.x * sc, z.pos.z * sc, sc * 0.4, 0, 7); x.fill(); x.strokeStyle = '#f33'; x.beginPath(); x.moveTo(z.pos.x * sc, z.pos.z * sc); x.lineTo((z.pos.x - Math.sin(z.yaw)) * sc, (z.pos.z - Math.cos(z.yaw)) * sc); x.stroke(); }
    for (const cp of Object.values(this.level.def.checkpoints)) { x.fillStyle = '#fff'; x.fillText('★' + cp.id, cp.x * sc, cp.z * sc); }
    const p = this.player.pos; x.fillStyle = '#4f4'; x.beginPath(); x.arc(p.x * sc, p.z * sc, sc * 0.45, 0, 7); x.fill();
    return c.toDataURL('image/png');
  }

  // Wie simulate, aber Promise-Fortsetzungen (Story-Skripte) laufen zwischen den Frames
  async simulateAsync(seconds, step = 1 / 30, each = null) {
    const n = Math.ceil(seconds / step);
    for (let i = 0; i < n; i++) {
      this.input.beginFrame();
      if (each) { const r = each(this, i * step); if (r === 'stop') { this.input.endFrame(); return i * step; } }
      this.update(step);
      this.input.endFrame();
      for (let k = 0; k < 4; k++) await null;
      if (this._simAbort) { this._simAbort = false; return i * step; }
    }
    return seconds;
  }
  keyDown(code) { this.input.keys.add(code); this.input.pressedThisFrame.add(code); }
  keyUp(code) { this.input.keys.delete(code); this.input.releasedThisFrame.add(code); }
  tap(code) { this.input.pressedThisFrame.add(code); }

  _debugKeys() {
    const i = this.input;
    if (i.rawPressed('F3')) { this.hud.debugEl.classList.toggle('show'); }
    if (i.rawPressed('F4')) { this.godMode = !this.godMode; this.hud.toast('Unverwundbar: ' + (this.godMode ? 'an' : 'aus')); }
    if (i.rawPressed('F7')) { this.godInvisible = !this.godInvisible; this.hud.toast('Unsichtbar: ' + (this.godInvisible ? 'an' : 'aus')); }
    if (i.rawPressed('F8') && this.chapter) { const k = CHAPTER_ORDER.indexOf(this.chapter.id); if (k < CHAPTER_ORDER.length - 1) this.loadChapter(CHAPTER_ORDER[k + 1], 'start', null); }
  }
}

bus.on('door', (e) => {
  const g = window.NWO; if (!g || !g.level) return;
  const d = e.door;
  const pos = e.pos;
  if (e.action === 'open') { g.audio.play(d.sliding ? 'slide_door' : d.shutter ? 'slide_door' : 'door_open', { pos, vol: e.loud ? 1 : 0.7, rate: d.shutter ? 0.6 : 1 }); g.noise.emit(pos.x, pos.z, e.loud ? 13 : (d.sliding ? 6 : 5), 'door'); }
  else if (e.action === 'close') { g.noise.emit(pos.x, pos.z, e.loud ? 13 : 4.5, 'door'); if (d.sliding || d.shutter) g.audio.play('slide_door', { pos, vol: 0.7, rate: d.shutter ? 0.6 : 0.9 }); }
  else if (e.action === 'shut') { g.audio.play(d.sliding ? 'door_close' : 'door_close', { pos, vol: 0.8 }); }
  else if (e.action === 'bash') { g.audio.play('door_bash', { pos, vol: 1, jitter: 0.15 }); }
  else if (e.action === 'burst') { g.audio.play('door_slam', { pos, vol: 1 }); g.noise.emit(pos.x, pos.z, 15, 'door'); }
});

export { LevelDef };
