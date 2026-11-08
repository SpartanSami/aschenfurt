import * as THREE from "three";
import { G } from "../core/Context";
import { events } from "../core/EventBus";
import { Level, EnvPreset, defaultEnv } from "./Level";
import { materials } from "../graphics/Materials";
import { placeRoomCandles } from "./RoomCandles";

type LevelCtor = () => Level;

/** Registrierung, Laden und Umgebungssteuerung der Spielbereiche. */
export class LevelManager {
  private registry = new Map<string, LevelCtor>();
  private env: EnvPreset = { ...defaultEnv };
  private fogColor = new THREE.Color();
  private activeZone = "";
  private currentMusic = "";
  loading = false;

  register(id: string, ctor: LevelCtor): void {
    this.registry.set(id, ctor);
  }

  has(id: string): boolean {
    return this.registry.has(id);
  }

  async load(id: string, spawnId = "start", fresh = true, onProgress?: (f: number, msg: string) => void): Promise<void> {
    const ctor = this.registry.get(id);
    if (!ctor) throw new Error("Unbekanntes Gebiet: " + id);
    this.loading = true;
    G.running = false;
    const prog = onProgress ?? ((f: number, msg: string) => G.ui.loading(f, msg));
    prog(0.02, "Die Dunkelheit sammelt sich …");
    await new Promise((r) => setTimeout(r, 30));
    // Altes Gebiet abbauen
    if (G.level) {
      G.horror.clear();
      G.combat.clear();
      G.audio.clearEmitters();
      G.level.dispose();
      G.level = null;
    }
    G.abilities.reset();
    const level = ctor();
    prog(0.1, "Stein, Holz und Staub entstehen …");
    await materials.warm(level.requiredSurfaces(), (f) => prog(0.1 + f * 0.55, "Stein, Holz und Staub entstehen …"));
    prog(0.7, `${level.location} wird errichtet …`);
    await new Promise((r) => setTimeout(r, 10));
    await level.build();
    level.finalize(placeRoomCandles);
    prog(0.9, "Schatten werden gesetzt …");
    G.level = level;
    level.scene.add(G.camera);
    G.renderer.setScene(level.scene);
    G.state.data.levelId = id;
    G.state.data.chapter = level.chapter;
    G.state.data.spawnId = spawnId;

    // Spieler platzieren
    const saved = G.state.data.player.pos;
    if (!fresh && saved) {
      G.player.teleport(new THREE.Vector3(...saved), G.state.data.player.yaw, G.state.data.player.pitch);
      G.player.health = G.state.data.player.health || 100;
    } else {
      const sp = level.spawns[spawnId] ?? level.spawns.start ?? { pos: new THREE.Vector3(0, 1, 0), yaw: 0 };
      G.player.teleport(sp.pos.clone(), sp.yaw);
    }
    this.activeZone = "";
    this.env = { ...level.env };
    this.applyEnvImmediate();
    // Shader vorkompilieren, um Ruckler zu vermeiden
    try {
      G.renderer.renderer.compile(level.scene, G.camera);
    } catch {
      /* optional */
    }
    prog(1, "");
    level.start(spawnId, fresh);
    this.currentMusic = "";
    this.playMusic(level.music);
    this.loading = false;
    G.running = true;
    G.ui.loading(-1, "");
    events.emit("level:loaded", { levelId: id });
    G.ui.hud.refresh();
  }

  playMusic(cue: string): void {
    if (cue === this.currentMusic) return;
    this.currentMusic = cue;
    G.audio.music?.play(cue, 4);
  }

  private zoneEnv(): { env: EnvPreset; id: string } {
    const L = G.level!;
    const p = G.player.position;
    let best: { id: string; env: Partial<EnvPreset>; pr: number } | null = null;
    for (const z of L.zones) {
      if (z.box.containsPoint(p) && (!best || z.priority > best.pr)) best = { id: z.id, env: z.env, pr: z.priority };
    }
    return { env: { ...L.env, ...(best?.env ?? {}) }, id: best?.id ?? "" };
  }

  applyEnvImmediate(): void {
    if (!G.level) return;
    const { env, id } = this.zoneEnv();
    this.env = { ...env };
    this.activeZone = id;
    this.applyToScene(1);
    this.applyEnvAudio();
  }

  applyEnvAudio(): void {
    if (!G.level) return;
    const { env } = this.zoneEnv();
    G.audio.setReverb(env.reverb);
    G.audio.setAmbience(env.ambience);
    G.audio.surface = env.surface;
  }

  private applyToScene(k: number): void {
    const L = G.level!;
    const { env: target } = this.zoneEnv();
    const e = this.env;
    const lerp = (a: number, b: number) => a + (b - a) * k;
    e.fogDensity = lerp(e.fogDensity, target.fogDensity);
    e.ambientIntensity = lerp(e.ambientIntensity, target.ambientIntensity);
    e.hemiIntensity = lerp(e.hemiIntensity, target.hemiIntensity);
    e.moonIntensity = lerp(e.moonIntensity, target.moonIntensity);
    e.exposure = lerp(e.exposure, target.exposure);
    e.rain = lerp(e.rain, target.rain);
    this.fogColor.set(e.fogColor).lerp(new THREE.Color(target.fogColor), k);
    e.fogColor = this.fogColor.getHex();
    const fog = L.scene.fog as THREE.FogExp2;
    fog.color.copy(this.fogColor);
    const nv = G.abilities.nightVisionLevel;
    fog.density = e.fogDensity * (1 - nv * 0.45);
    L.scene.background = this.fogColor.clone().multiplyScalar(0.6);
    L.ambient.color.set(target.ambientColor);
    L.ambient.intensity = e.ambientIntensity * 1.6 * (1 + nv * 2.2);
    L.hemi.color.set(target.hemiSky);
    L.hemi.groundColor.set(target.hemiGround);
    L.hemi.intensity = e.hemiIntensity * 1.5 * (1 + nv * 3);
    if (L.moon) L.moon.intensity = e.moonIntensity;
    G.renderer.baseExposure = e.exposure;
    if (L.rain) L.rain.opacity = e.rain;
  }

  update(dt: number): void {
    if (!G.level) return;
    const { id, env } = this.zoneEnv();
    if (id !== this.activeZone) {
      this.activeZone = id;
      G.audio.setReverb(env.reverb);
      G.audio.setAmbience(env.ambience);
      G.audio.surface = env.surface;
      if ((env as any).music) this.playMusic((env as any).music);
    }
    this.applyToScene(1 - Math.exp(-dt * 1.5));
  }
}
