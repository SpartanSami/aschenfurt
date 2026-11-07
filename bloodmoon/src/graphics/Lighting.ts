import * as THREE from "three";
import { settings, qualityProfiles } from "../core/Settings";

/** Umrechnung der Level-Intensitäten in physikalische Einheiten von Three.js */
export const LIGHT_SCALE = 5;

export interface LightSource {
  pos: THREE.Vector3;
  color: THREE.Color;
  intensity: number;
  distance: number;
  flicker: number; // 0 = ruhig, 1 = starkes Flackern
  enabled: boolean;
  /** Multiplikator für Inszenierungen (Flackern, Erlöschen) */
  scale: number;
  shadow: boolean;
  phase: number;
  id?: string;
}

/**
 * Feste Anzahl echter Punktlichter, die jedes Frame den wichtigsten Lichtquellen
 * in Kameranähe zugeordnet werden. Vermeidet Shader-Neukompilierung und hält die
 * Performance trotz hunderter Kerzen stabil.
 */
export class LightPool {
  sources: LightSource[] = [];
  lights: THREE.PointLight[] = [];
  private assigned: (LightSource | null)[] = [];
  private fade: number[] = [];
  private timer = 0;
  group = new THREE.Group();

  constructor() {
    const q = qualityProfiles[settings.data.quality];
    for (let i = 0; i < q.lightPool; i++) {
      const l = new THREE.PointLight(0xffaa66, 0, 10, 1.45);
      if (i === 0 && q.pointShadows) {
        l.castShadow = true;
        l.shadow.mapSize.set(512, 512);
        l.shadow.bias = -0.004;
        l.shadow.normalBias = 0.03;
        l.shadow.camera.near = 0.15;
        l.shadow.radius = 3;
      }
      this.lights.push(l);
      this.assigned.push(null);
      this.fade.push(0);
      this.group.add(l);
    }
  }

  add(src: Partial<LightSource> & { pos: THREE.Vector3 }): LightSource {
    const s: LightSource = {
      pos: src.pos.clone(),
      color: src.color ? new THREE.Color(src.color) : new THREE.Color(1, 0.62, 0.3),
      intensity: src.intensity ?? 4,
      distance: src.distance ?? 8,
      flicker: src.flicker ?? 0.5,
      enabled: src.enabled ?? true,
      scale: src.scale ?? 1,
      shadow: src.shadow ?? false,
      phase: Math.random() * 100,
      id: src.id,
    };
    this.sources.push(s);
    return s;
  }

  clear(): void {
    this.sources = [];
    this.assigned.fill(null);
    this.lights.forEach((l) => (l.intensity = 0));
  }

  update(dt: number, time: number, camPos: THREE.Vector3, camDir: THREE.Vector3): void {
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = 0.15;
      this.reassign(camPos, camDir);
    }
    for (let i = 0; i < this.lights.length; i++) {
      const l = this.lights[i];
      const s = this.assigned[i];
      if (!s) {
        this.fade[i] = Math.max(0, this.fade[i] - dt * 4);
        l.intensity *= this.fade[i];
        if (this.fade[i] <= 0) l.intensity = 0;
        continue;
      }
      this.fade[i] = Math.min(1, this.fade[i] + dt * 3);
      const f = s.flicker;
      const t = time + s.phase;
      const flick = 1 - f * 0.18 * (Math.sin(t * 9.7) * 0.5 + Math.sin(t * 23.1) * 0.3 + Math.sin(t * 4.3) * 0.2 + 0.5) - f * 0.06 * Math.random();
      l.position.copy(s.pos);
      if (f > 0.2) {
        l.position.x += Math.sin(t * 7.1) * 0.015 * f;
        l.position.z += Math.cos(t * 6.3) * 0.015 * f;
      }
      l.color.copy(s.color);
      l.distance = s.distance;
      l.intensity = s.enabled ? s.intensity * LIGHT_SCALE * s.scale * flick * this.fade[i] : 0;
    }
  }

  private reassign(camPos: THREE.Vector3, camDir: THREE.Vector3): void {
    const scored: { s: LightSource; score: number }[] = [];
    const tmp = new THREE.Vector3();
    for (const s of this.sources) {
      if (!s.enabled || s.scale <= 0.01) continue;
      tmp.subVectors(s.pos, camPos);
      const d = tmp.length();
      if (d > s.distance + 18) continue;
      const facing = d > 0.01 ? tmp.dot(camDir) / d : 1;
      // Lichter vor der Kamera und mit großer Reichweite bevorzugen
      const score = (s.intensity * s.distance) / (1 + d * d * 0.15) * (facing > -0.2 ? 1.4 : 0.8);
      scored.push({ s, score });
    }
    scored.sort((a, b) => b.score - a.score);
    const chosen = scored.slice(0, this.lights.length).map((x) => x.s);
    // Schattenlicht (Index 0): bestes Schatten-fähiges Licht
    const next: (LightSource | null)[] = new Array(this.lights.length).fill(null);
    const shadowCand = chosen.find((s) => s.shadow) ?? null;
    const rest = chosen.filter((s) => s !== shadowCand);
    if (this.lights[0].castShadow) {
      next[0] = shadowCand;
    } else if (shadowCand) {
      rest.unshift(shadowCand);
    }
    // Stabile Zuordnung: bereits zugewiesene Lichter behalten ihren Slot
    const start = this.lights[0].castShadow ? 1 : 0;
    const pending = [...rest];
    for (let i = start; i < this.lights.length; i++) {
      const cur = this.assigned[i];
      const k = cur ? pending.indexOf(cur) : -1;
      if (k >= 0) {
        next[i] = cur;
        pending.splice(k, 1);
      }
    }
    for (let i = start; i < this.lights.length; i++) {
      if (!next[i] && pending.length) {
        next[i] = pending.shift()!;
        this.fade[i] = 0;
      }
    }
    if (next[0] !== this.assigned[0]) this.fade[0] = 0;
    this.assigned = next;
  }

  /** Lichter in einem Radius flackern / erlöschen lassen (Horror-Inszenierung). */
  sourcesNear(p: THREE.Vector3, radius: number): LightSource[] {
    return this.sources.filter((s) => s.pos.distanceTo(p) < radius);
  }
}
