import * as THREE from "three";
import * as S from "./Synth";
import { Music } from "./Music";
import { settings } from "../core/Settings";
import { events } from "../core/EventBus";
import type { ReverbKind } from "../world/Level";

const REVERBS: Record<ReverbKind, { len: number; decay: number; wet: number; damp: number }> = {
  crypt: { len: 3.8, decay: 2.6, wet: 0.5, damp: 2200 },
  hall: { len: 3.0, decay: 2.8, wet: 0.42, damp: 3500 },
  room: { len: 1.0, decay: 3.5, wet: 0.25, damp: 4000 },
  cathedral: { len: 6.5, decay: 2.0, wet: 0.6, damp: 3000 },
  outdoor: { len: 1.6, decay: 4.5, wet: 0.14, damp: 5000 },
  cave: { len: 4.5, decay: 2.2, wet: 0.55, damp: 1800 },
  forest: { len: 2.0, decay: 4.0, wet: 0.2, damp: 3000 },
  void: { len: 8.0, decay: 1.5, wet: 0.7, damp: 1500 },
};

interface Emitter {
  pos: THREE.Vector3;
  kind: string;
  next: number;
  radius: number;
  panner: PannerNode;
  gain: GainNode;
  loop?: AudioScheduledSourceNode[];
}

/** Zentrales Audiosystem: Busse, Hall, räumlicher Klang, Ambiente, Musik, Sprache. */
export class AudioManager {
  ctx: AudioContext | null = null;
  s!: S.SynthCtx;
  master!: GainNode;
  musicBus!: GainNode;
  sfxBus!: GainNode;
  voiceBus!: GainNode;
  ambBus!: GainNode;
  reverbIn!: GainNode;
  private convA!: ConvolverNode;
  private convB!: ConvolverNode;
  private convGainA!: GainNode;
  private convGainB!: GainNode;
  private useA = true;
  private reverbKind: ReverbKind | null = null;
  music!: Music;
  private ambLayers: { stop: () => void }[] = [];
  private ambKind = "";
  private ambTimers: { next: number; fn: (t: number) => number }[] = [];
  private emitters: Emitter[] = [];
  private voiceManifest: Record<string, string> = {};
  private sfxManifest: Record<string, string[]> = {};
  private sampleCache = new Map<string, AudioBuffer>();
  private currentVoice: AudioBufferSourceNode | null = null;
  surface = "stone";
  private listenerPos = new THREE.Vector3();
  ready = false;

  async init(): Promise<void> {
    if (this.ctx) {
      if (this.ctx.state === "suspended") await this.ctx.resume().catch(() => {});
      return;
    }
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    const ctx = this.ctx;
    this.s = { ctx, ...S.makeNoiseBuffers(ctx) };
    this.master = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 3;
    this.master.connect(comp).connect(ctx.destination);
    this.musicBus = ctx.createGain();
    this.sfxBus = ctx.createGain();
    this.voiceBus = ctx.createGain();
    this.ambBus = ctx.createGain();
    for (const b of [this.musicBus, this.sfxBus, this.voiceBus, this.ambBus]) b.connect(this.master);
    // Hall: zwei Faltungshall-Knoten zum Überblenden
    this.reverbIn = ctx.createGain();
    this.convA = ctx.createConvolver();
    this.convB = ctx.createConvolver();
    this.convGainA = ctx.createGain();
    this.convGainB = ctx.createGain();
    this.convGainB.gain.value = 0;
    this.reverbIn.connect(this.convA).connect(this.convGainA).connect(this.master);
    this.reverbIn.connect(this.convB).connect(this.convGainB).connect(this.master);
    this.setReverb("hall");
    this.music = new Music(this.s, this.musicBus);
    const musicSend = ctx.createGain();
    musicSend.gain.value = 0.5;
    this.music.out.connect(musicSend).connect(this.reverbIn);
    this.applyVolumes();
    events.on("settings:changed", () => this.applyVolumes());
    this.ready = true;
    this.loadManifests();
  }

  private async loadManifests(): Promise<void> {
    try {
      const r = await fetch("assets/audio/voice/manifest.json", { cache: "no-cache" });
      if (r.ok) this.voiceManifest = await r.json();
    } catch {
      /* keine Sprachaufnahmen vorhanden – Untertitel genügen */
    }
    try {
      const r = await fetch("assets/audio/sfx/manifest.json", { cache: "no-cache" });
      if (r.ok) this.sfxManifest = await r.json();
    } catch {
      /* prozedurale Klänge werden verwendet */
    }
  }

  applyVolumes(): void {
    if (!this.ctx) return;
    const d = settings.data;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(d.master, t, 0.05);
    this.musicBus.gain.setTargetAtTime(d.music * 0.8, t, 0.05);
    this.sfxBus.gain.setTargetAtTime(d.sfx, t, 0.05);
    this.voiceBus.gain.setTargetAtTime(d.voice, t, 0.05);
    this.ambBus.gain.setTargetAtTime(d.ambience * 0.9, t, 0.05);
  }

  private impulse(kind: ReverbKind): AudioBuffer {
    const ctx = this.ctx!;
    const p = REVERBS[kind];
    const len = Math.floor(ctx.sampleRate * p.len);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      let lp = 0;
      const a = Math.exp((-2 * Math.PI * p.damp) / ctx.sampleRate);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        const w = (Math.random() * 2 - 1) * Math.pow(1 - t, p.decay);
        lp = lp * a + w * (1 - a);
        d[i] = lp * (i < ctx.sampleRate * 0.01 ? i / (ctx.sampleRate * 0.01) : 1) * 1.6;
      }
    }
    return buf;
  }

  setReverb(kind: ReverbKind): void {
    if (!this.ctx || kind === this.reverbKind) return;
    this.reverbKind = kind;
    const t = this.ctx.currentTime;
    const wet = REVERBS[kind].wet;
    const target = this.useA ? this.convB : this.convA;
    const tg = this.useA ? this.convGainB : this.convGainA;
    const og = this.useA ? this.convGainA : this.convGainB;
    target.buffer = this.impulse(kind);
    tg.gain.cancelScheduledValues(t);
    tg.gain.setValueAtTime(tg.gain.value, t);
    tg.gain.linearRampToValueAtTime(wet, t + 1.2);
    og.gain.cancelScheduledValues(t);
    og.gain.setValueAtTime(og.gain.value, t);
    og.gain.linearRampToValueAtTime(0, t + 1.2);
    this.useA = !this.useA;
  }

  /** Ausgabeknoten (räumlich oder direkt) mit Hall-Send. */
  private out(pos?: THREE.Vector3 | null, vol = 1, bus: GainNode = this.sfxBus, send = 0.6): AudioNode {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    g.gain.value = vol;
    if (pos) {
      const p = ctx.createPanner();
      p.panningModel = "HRTF";
      p.distanceModel = "inverse";
      p.refDistance = 1.6;
      p.maxDistance = 80;
      p.rolloffFactor = 1.1;
      p.positionX.value = pos.x;
      p.positionY.value = pos.y;
      p.positionZ.value = pos.z;
      g.connect(p);
      p.connect(bus);
      const sg = ctx.createGain();
      sg.gain.value = send;
      p.connect(sg).connect(this.reverbIn);
    } else {
      g.connect(bus);
      const sg = ctx.createGain();
      sg.gain.value = send * 0.6;
      g.connect(sg).connect(this.reverbIn);
    }
    // Knoten nach einiger Zeit trennen (Garbage Collection)
    setTimeout(() => g.disconnect(), 15000);
    return g;
  }

  updateListener(cam: THREE.Camera): void {
    if (!this.ctx) return;
    const l = this.ctx.listener;
    const p = cam.getWorldPosition(this.listenerPos);
    const f = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
    const u = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
    if (l.positionX) {
      const t = this.ctx.currentTime;
      l.positionX.setTargetAtTime(p.x, t, 0.02);
      l.positionY.setTargetAtTime(p.y, t, 0.02);
      l.positionZ.setTargetAtTime(p.z, t, 0.02);
      l.forwardX.setTargetAtTime(f.x, t, 0.02);
      l.forwardY.setTargetAtTime(f.y, t, 0.02);
      l.forwardZ.setTargetAtTime(f.z, t, 0.02);
      l.upX.setTargetAtTime(u.x, t, 0.02);
      l.upY.setTargetAtTime(u.y, t, 0.02);
      l.upZ.setTargetAtTime(u.z, t, 0.02);
    } else {
      (l as any).setPosition(p.x, p.y, p.z);
      (l as any).setOrientation(f.x, f.y, f.z, u.x, u.y, u.z);
    }
  }

  update(): void {
    if (!this.ctx) return;
    this.music.update();
    const now = this.ctx.currentTime;
    for (const a of this.ambTimers) {
      if (a.next < now + 0.3) a.next = Math.max(a.next, now) + a.fn(Math.max(a.next, now + 0.05));
    }
    for (const e of this.emitters) {
      if (e.next < now + 0.3) {
        const d = e.pos.distanceTo(this.listenerPos);
        if (d < e.radius) e.next = Math.max(now, e.next) + this.emit(e, Math.max(e.next, now + 0.02));
        else e.next = now + 1;
      }
    }
  }

  // -------------------------------------------------------------------------
  // Soundeffekte
  // -------------------------------------------------------------------------

  sfx(name: string, pos?: THREE.Vector3 | null, vol = 1): void {
    if (!this.ctx || this.ctx.state !== "running") return;
    if (this.sfxManifest[name]?.length) {
      const files = this.sfxManifest[name];
      this.playSample("assets/audio/sfx/" + files[Math.floor(Math.random() * files.length)], pos, vol);
      return;
    }
    const s = this.s;
    const t = this.ctx.currentTime + 0.01;
    const o = this.out(pos, vol);
    switch (name) {
      case "step": S.footstep(s, this.out(null, vol * 0.5, this.sfxBus, 0.3), t, this.surface, 1); break;
      case "stepNpc": S.footstep(s, o, t, this.surface, 0.8); break;
      case "doorOpen": S.creak(s, o, t, 1.6, 1, 0.35); S.thud(s, o, t + 1.5, 70, 0.3, 0.4); break;
      case "doorCreak": S.creak(s, o, t, 3.5, 0.75, 0.4); break;
      case "doorSlam": S.thud(s, o, t, 55, 1, 0.8); S.rustle(s, o, t, 0.15, 0.3, 1500); break;
      case "gateOpen": S.chains(s, o, t, 2.2, 0.35); S.stoneGrind(s, o, t + 0.2, 2.2, 0.4); break;
      case "gateClose": S.chains(s, o, t, 0.8, 0.4); S.thud(s, o, t + 0.8, 45, 1, 1); break;
      case "locked": S.metalClank(s, o, t, 0.3, 700); S.metalClank(s, o, t + 0.12, 0.25, 650); S.thud(s, o, t + 0.05, 90, 0.25, 0.2); break;
      case "pickup": S.rustle(s, o, t, 0.25, 0.25, 2500); S.chime(s, o, t + 0.05, 1320, 0.05, 1.2); break;
      case "paper": S.rustle(s, o, t, 0.6, 0.35, 3500); break;
      case "stoneGrind": S.stoneGrind(s, o, t, 2.6, 0.8); break;
      case "click": S.metalClank(s, o, t, 0.25, 1800); break;
      case "solved": S.chime(s, o, t, 587, 0.12, 3); S.chime(s, o, t + 0.15, 880, 0.1, 3); S.thud(s, o, t, 50, 0.5, 1); break;
      case "wrong": S.thud(s, o, t, 70, 0.5, 0.4); S.metalClank(s, o, t, 0.2, 300); break;
      case "heartbeat": S.heartbeat(s, this.out(null, vol, this.sfxBus, 0.1), t, 0.9); break;
      case "whisper": S.whisper(s, o, t, 5, 0.6, 5); break;
      case "whisperName": S.whisper(s, o, t, 2, 0.75, 3); break;
      case "breath": S.breath(s, o, t, 0.3, true); break;
      case "stinger": S.stinger(s, this.out(null, vol, this.sfxBus, 0.9), t, 0.5, "swell"); break;
      case "scare": S.stinger(s, this.out(null, vol, this.sfxBus, 0.9), t, 0.7, "hit"); break;
      case "bloodSightOn": S.whoosh(s, this.out(null, vol * 0.6), t, 0.5, 0.5, false); S.heartbeat(s, this.out(null, 0.7), t + 0.1, 0.8); break;
      case "bloodSightOff": S.whoosh(s, this.out(null, vol * 0.4), t, 0.4, 0.3, true); break;
      case "nightOn": S.chime(s, this.out(null, vol * 0.5), t, 1760, 0.05, 1.5); S.whoosh(s, this.out(null, 0.4), t, 0.6, 0.3, true); break;
      case "shadowRun": S.whoosh(s, this.out(null, vol), t, 0.45, 0.8, true); S.thud(s, this.out(null, 0.5), t, 60, 0.4, 0.3); break;
      case "memoryIn": S.whoosh(s, this.out(null, vol, this.sfxBus, 1), t, 1.8, 0.5, false); S.chime(s, this.out(null, 0.5, this.sfxBus, 1), t + 0.4, 440, 0.08, 4); break;
      case "memoryOut": S.whoosh(s, this.out(null, vol, this.sfxBus, 1), t, 1.2, 0.4, true); break;
      case "howl": S.wolfHowl(s, o, t, 0.6, 0.9 + Math.random() * 0.2, 3.5 + Math.random()); break;
      case "growl": S.growl(s, o, t, 1.4, 0.7, 1); break;
      case "hiss": S.hiss(s, o, t, 0.9, 0.5); S.growl(s, o, t, 0.8, 0.3, 1.8); break;
      case "push": S.whoosh(s, this.out(null, vol), t, 0.3, 0.8, false); S.thud(s, o, t + 0.1, 50, 0.8, 0.5); break;
      case "hit": S.thud(s, o, t, 80, 0.9, 0.3); S.rustle(s, o, t, 0.1, 0.4, 900); break;
      case "hurt": S.thud(s, this.out(null, vol), t, 60, 0.8, 0.3); S.breath(s, this.out(null, 0.5), t + 0.05, 0.4, false); break;
      case "feed": S.heartbeat(s, this.out(null, vol), t, 1); S.heartbeat(s, this.out(null, vol), t + 0.8, 0.8); S.breath(s, this.out(null, 0.5), t + 1.4, 0.3, true); break;
      case "regen": S.chime(s, this.out(null, vol * 0.4), t, 660, 0.05, 2); S.whoosh(s, this.out(null, 0.3), t, 1.4, 0.25, true); break;
      case "crow": S.crow(s, o, t, 0.4); break;
      case "owl": S.owl(s, o, t, 0.3); break;
      case "bell": S.bell(s, o, t, 98, 0.8, 9); break;
      case "bellSmall": S.bell(s, o, t, 196, 0.5, 5); break;
      case "thunder": S.thunder(s, this.out(null, vol, this.ambBus, 0.8), t, 0.8, 1 + Math.random()); break;
      case "glass": S.glassShatter(s, o, t, 0.6); break;
      case "thud": S.thud(s, o, t, 60, 0.9, 0.6); break;
      case "chains": S.chains(s, o, t, 1.4, 0.35); break;
      case "drip": S.drip(s, o, t, 0.25); break;
      case "lullabyBox": this.music.lullaby(o, t, false, 0.55, 0.25); break;
      case "lullabyBox2": this.music.lullaby(o, t, true, 0.55, 0.25); break;
      case "note": break;
      case "rumble": S.thunder(s, this.out(null, vol, this.sfxBus, 0.8), t, 0.6, 2.5); break;
      case "chapterStart": S.bell(s, this.out(null, vol * 0.6, this.sfxBus, 1), t, 73.4, 0.6, 10); break;
      case "uiOpen": S.rustle(s, this.out(null, 0.5, this.sfxBus, 0.1), t, 0.2, 0.2, 2800); break;
      case "uiClick": S.metalClank(s, this.out(null, 0.25, this.sfxBus, 0.1), t, 0.08, 2400); break;
      case "uiHover": S.chime(s, this.out(null, 0.15, this.sfxBus, 0.1), t, 1800, 0.02, 0.2); break;
      case "notify": S.chime(s, this.out(null, 0.4, this.sfxBus, 0.5), t, 740, 0.05, 1.8); break;
      case "questDone": S.chime(s, this.out(null, 0.6, this.sfxBus, 0.8), t, 440, 0.07, 3); S.chime(s, this.out(null, 0.6, this.sfxBus, 0.8), t + 0.2, 659, 0.06, 3); break;
      case "ghostLaugh": S.whisper(s, o, t, 6, 0.4, 9); break;
      case "crackle": S.fireCrackleBurst(s, o, t, 0.2); break;
      default: break;
    }
  }

  /** Klavierton / Spieluhrton für Rätsel. */
  note(midi: number, kind: "box" | "piano" = "box", pos?: THREE.Vector3): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + 0.01;
    const o = this.out(pos ?? null, 1);
    if (kind === "box") S.musicBox(this.s, o, t, S.NOTE(midi + 12), 0.3);
    else S.piano(this.s, o, t, S.NOTE(midi), 0.3, 3);
  }

  footstep(surface: string, vol = 1): void {
    if (!this.ctx || this.ctx.state !== "running") return;
    S.footstep(this.s, this.out(null, vol * 0.45, this.sfxBus, 0.35), this.ctx.currentTime + 0.005, surface, 1);
  }

  private async playSample(url: string, pos?: THREE.Vector3 | null, vol = 1, bus?: GainNode): Promise<AudioBufferSourceNode | null> {
    if (!this.ctx) return null;
    try {
      let buf = this.sampleCache.get(url);
      if (!buf) {
        const r = await fetch(url);
        if (!r.ok) return null;
        buf = await this.ctx.decodeAudioData(await r.arrayBuffer());
        this.sampleCache.set(url, buf);
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.connect(this.out(pos, vol, bus ?? this.sfxBus));
      src.start();
      return src;
    } catch {
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // Sprache (ElevenLabs-Aufnahmen, falls vorhanden)
  // -------------------------------------------------------------------------

  hasVoice(lineId: string): boolean {
    return !!this.voiceManifest[lineId];
  }

  /** Spielt eine Sprachzeile; liefert die Dauer in Sekunden oder null. */
  async voice(lineId: string, speaker: string): Promise<number | null> {
    if (!this.ctx || !this.voiceManifest[lineId]) return null;
    this.stopVoice();
    const url = "assets/audio/voice/" + this.voiceManifest[lineId];
    try {
      let buf = this.sampleCache.get(url);
      if (!buf) {
        const r = await fetch(url);
        if (!r.ok) return null;
        buf = await this.ctx.decodeAudioData(await r.arrayBuffer());
        this.sampleCache.set(url, buf);
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      let chain: AudioNode = src;
      const ctx = this.ctx;
      // Der Erste: Ringmodulation + tiefer Hall; Erinnerungen: dumpfer, entfernter Klang
      if (speaker === "erste") {
        const rm = ctx.createGain();
        const mod = ctx.createOscillator();
        mod.frequency.value = 38;
        const mg = ctx.createGain();
        mg.gain.value = 0.5;
        mod.connect(mg).connect(rm.gain);
        mod.start();
        src.connect(rm);
        chain = rm;
        src.onended = () => mod.stop();
      } else if (speaker.startsWith("mem_")) {
        const f = ctx.createBiquadFilter();
        f.type = "bandpass";
        f.frequency.value = 1400;
        f.Q.value = 0.6;
        src.connect(f);
        chain = f;
      }
      const g = ctx.createGain();
      g.gain.value = 1;
      chain.connect(g).connect(this.voiceBus);
      const send = ctx.createGain();
      send.gain.value = speaker === "erste" ? 0.9 : speaker.startsWith("mem_") ? 0.7 : 0.18;
      g.connect(send).connect(this.reverbIn);
      src.start();
      this.currentVoice = src;
      return buf.duration;
    } catch {
      return null;
    }
  }

  stopVoice(): void {
    try {
      this.currentVoice?.stop();
    } catch {
      /* bereits beendet */
    }
    this.currentVoice = null;
  }

  // -------------------------------------------------------------------------
  // Ambiente
  // -------------------------------------------------------------------------

  setAmbience(kind: string): void {
    if (!this.ctx || kind === this.ambKind) return;
    this.ambKind = kind;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    for (const l of this.ambLayers) l.stop();
    this.ambLayers = [];
    this.ambTimers = [];
    const s = this.s;
    const loopNoise = (kindN: "white" | "pink" | "brown", filter: BiquadFilterType, f: number, q: number, vol: number, lfoRate = 0, lfoDepth = 0) => {
      const n = S.noiseSrc(s, kindN, true);
      const fl = ctx.createBiquadFilter();
      fl.type = filter;
      fl.frequency.value = f;
      fl.Q.value = q;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol, t + 3);
      n.connect(fl).connect(g).connect(this.ambBus);
      let lfo: OscillatorNode | null = null;
      if (lfoRate > 0) {
        lfo = ctx.createOscillator();
        lfo.frequency.value = lfoRate;
        const lg = ctx.createGain();
        lg.gain.value = lfoDepth;
        lfo.connect(lg).connect(fl.frequency);
        const lg2 = ctx.createGain();
        lg2.gain.value = vol * 0.5;
        lfo.connect(lg2).connect(g.gain);
        lfo.start(t);
      }
      n.start(t, Math.random() * 2);
      this.ambLayers.push({
        stop: () => {
          const tt = ctx.currentTime;
          g.gain.cancelScheduledValues(tt);
          g.gain.setValueAtTime(g.gain.value, tt);
          g.gain.linearRampToValueAtTime(0.0001, tt + 2.5);
          setTimeout(() => {
            try {
              n.stop();
              lfo?.stop();
            } catch {
              /* */
            }
            g.disconnect();
          }, 3000);
        },
      });
    };
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const amb = (vol: number) => this.outAmb(vol);
    const randomPos = (r = 15) => new THREE.Vector3(this.listenerPos.x + rnd(-r, r), this.listenerPos.y + rnd(-1, 3), this.listenerPos.z + rnd(-r, r));
    const add = (first: number, fn: (t: number) => number) => this.ambTimers.push({ next: t + first, fn });
    switch (kind) {
      case "crypt":
        loopNoise("brown", "lowpass", 140, 0.7, 0.18);
        loopNoise("pink", "bandpass", 420, 3, 0.02, 0.05, 120);
        add(2, (tt) => (S.drip(s, this.out(randomPos(8), 0.6), tt, 0.25), rnd(1.5, 5)));
        add(20, (tt) => (S.creak(s, this.out(randomPos(12), 0.35), tt, 2.4, 0.6, 0.25), rnd(25, 60)));
        break;
      case "castle":
        loopNoise("pink", "bandpass", 380, 1.2, 0.05, 0.07, 160);
        loopNoise("brown", "lowpass", 120, 0.7, 0.1);
        add(8, (tt) => (S.creak(s, this.out(randomPos(14), 0.3), tt, 2.0, 0.7 + Math.random() * 0.3, 0.2), rnd(18, 40)));
        add(15, (tt) => (S.whoosh(s, amb(0.25), tt, 3, 0.15, Math.random() > 0.5), rnd(12, 25)));
        add(4, (tt) => (S.drip(s, this.out(randomPos(10), 0.4), tt, 0.15), rnd(4, 12)));
        break;
      case "exterior":
        loopNoise("pink", "bandpass", 500, 0.8, 0.12, 0.09, 260);
        loopNoise("brown", "lowpass", 200, 0.7, 0.12, 0.05, 60);
        add(6, (tt) => (S.crow(s, this.out(randomPos(30), 0.6), tt, 0.3), rnd(15, 35)));
        add(25, (tt) => (S.wolfHowl(s, this.out(randomPos(60), 0.25), tt, 0.4, 0.9 + Math.random() * 0.2), rnd(40, 80)));
        break;
      case "village":
        loopNoise("white", "highpass", 2500, 0.5, 0.05);
        loopNoise("pink", "lowpass", 1200, 0.5, 0.1);
        loopNoise("pink", "bandpass", 500, 0.8, 0.06, 0.07, 200);
        add(10, (tt) => (S.thunder(s, amb(0.6), tt, 0.5, 2 + Math.random() * 2), rnd(35, 70)));
        add(5, (tt) => (S.creak(s, this.out(randomPos(20), 0.3), tt, 1.5, 0.9, 0.2), rnd(20, 40)));
        add(18, (tt) => (S.crow(s, this.out(randomPos(25), 0.5), tt, 0.3), rnd(25, 50)));
        break;
      case "forest":
        loopNoise("pink", "bandpass", 700, 0.6, 0.1, 0.06, 300);
        loopNoise("brown", "lowpass", 160, 0.7, 0.1);
        add(4, (tt) => (S.owl(s, this.out(randomPos(30), 0.6), tt, 0.25), rnd(20, 45)));
        add(12, (tt) => (S.wolfHowl(s, this.out(randomPos(50), 0.4), tt, 0.5, 0.85 + Math.random() * 0.3), rnd(30, 60)));
        add(7, (tt) => (S.rustle(s, this.out(randomPos(12), 0.5), tt, 0.8, 0.2, 1800), rnd(6, 16)));
        add(20, (tt) => (S.creak(s, this.out(randomPos(20), 0.2), tt, 3, 0.5, 0.2), rnd(25, 50)));
        break;
      case "cathedral":
        loopNoise("brown", "lowpass", 180, 0.7, 0.12);
        loopNoise("pink", "bandpass", 300, 2, 0.03, 0.03, 80);
        add(12, (tt) => (S.whisper(s, this.out(randomPos(18), 0.25), tt, 6, 0.3, 4), rnd(25, 50)));
        add(30, (tt) => (S.bell(s, amb(0.25), tt, 65, 0.4, 12), rnd(60, 100)));
        break;
      case "underworld":
        loopNoise("brown", "lowpass", 90, 1, 0.25, 0.04, 30);
        loopNoise("pink", "bandpass", 220, 4, 0.04, 0.11, 90);
        add(3, (tt) => (S.heartbeat(s, amb(0.25), tt, 0.5), rnd(2.2, 2.6)));
        add(8, (tt) => (S.whisper(s, this.out(randomPos(10), 0.35), tt, 8, 0.35, 6), rnd(10, 20)));
        add(15, (tt) => (S.drip(s, this.out(randomPos(8), 0.5), tt, 0.2), rnd(2, 6)));
        break;
      case "memory":
        loopNoise("pink", "bandpass", 900, 2, 0.03, 0.2, 400);
        break;
      default:
        break;
    }
  }

  private outAmb(vol: number): AudioNode {
    const g = this.ctx!.createGain();
    g.gain.value = vol;
    g.connect(this.ambBus);
    const sg = this.ctx!.createGain();
    sg.gain.value = 0.5;
    g.connect(sg).connect(this.reverbIn);
    setTimeout(() => g.disconnect(), 15000);
    return g;
  }

  // -------------------------------------------------------------------------
  // Räumliche Dauer-Emitter (Feuer, Wasser, Flüstern hinter Türen)
  // -------------------------------------------------------------------------

  addEmitter(pos: THREE.Vector3, kind: "fire" | "drip" | "whisper" | "water" | "wind", radius = 14): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const p = ctx.createPanner();
    p.panningModel = "HRTF";
    p.distanceModel = "inverse";
    p.refDistance = 1.2;
    p.rolloffFactor = 1.3;
    p.positionX.value = pos.x;
    p.positionY.value = pos.y;
    p.positionZ.value = pos.z;
    const g = ctx.createGain();
    g.connect(p).connect(this.ambBus);
    const e: Emitter = { pos: pos.clone(), kind, next: ctx.currentTime + Math.random(), radius, panner: p, gain: g };
    if (kind === "fire" || kind === "water" || kind === "wind") {
      const n = S.noiseSrc(this.s, kind === "fire" ? "brown" : "pink", true);
      const f = ctx.createBiquadFilter();
      f.type = kind === "fire" ? "lowpass" : "bandpass";
      f.frequency.value = kind === "fire" ? 600 : kind === "water" ? 1100 : 400;
      const lg = ctx.createGain();
      lg.gain.value = kind === "fire" ? 0.35 : 0.2;
      n.connect(f).connect(lg).connect(g);
      n.start();
      e.loop = [n];
    }
    this.emitters.push(e);
  }

  private emit(e: Emitter, t: number): number {
    switch (e.kind) {
      case "fire":
        for (let i = 0; i < 3; i++) S.fireCrackleBurst(this.s, e.gain, t + Math.random() * 0.2, 0.25);
        return 0.15 + Math.random() * 0.35;
      case "drip":
        S.drip(this.s, e.gain, t, 0.3);
        return 1 + Math.random() * 3;
      case "whisper":
        S.whisper(this.s, e.gain, t, 6, 0.4, 4);
        return 4 + Math.random() * 6;
      default:
        return 5;
    }
  }

  clearEmitters(): void {
    for (const e of this.emitters) {
      e.loop?.forEach((l) => {
        try {
          l.stop();
        } catch {
          /* */
        }
      });
      e.gain.disconnect();
      e.panner.disconnect();
    }
    this.emitters = [];
  }

  /** Dämpft alles außer Sprache (z. B. während Dialogen). */
  duck(on: boolean): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const v = on ? 0.45 : 1;
    this.ambBus.gain.setTargetAtTime(settings.data.ambience * 0.9 * v, t, 0.3);
    this.musicBus.gain.setTargetAtTime(settings.data.music * 0.8 * v, t, 0.3);
  }
}
