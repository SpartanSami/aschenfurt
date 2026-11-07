import { events } from "./EventBus";

export type Quality = "niedrig" | "mittel" | "hoch" | "ultra";

export interface SettingsData {
  master: number;
  music: number;
  sfx: number;
  voice: number;
  ambience: number;
  sensitivity: number;
  invertY: boolean;
  fov: number;
  quality: Quality;
  renderScale: number;
  brightness: number;
  subtitles: boolean;
  subtitleSize: "klein" | "mittel" | "gross";
  headBob: boolean;
  showFps: boolean;
}

const KEY = "bloodmoon.settings.v1";

export const defaultSettings: SettingsData = {
  master: 0.85,
  music: 0.6,
  sfx: 0.85,
  voice: 1,
  ambience: 0.8,
  sensitivity: 1,
  invertY: false,
  fov: 72,
  quality: "hoch",
  renderScale: 1,
  brightness: 1.12,
  subtitles: true,
  subtitleSize: "mittel",
  headBob: true,
  showFps: false,
};

class SettingsStore {
  data: SettingsData = { ...defaultSettings };

  load(): void {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) this.data = { ...defaultSettings, ...JSON.parse(raw) };
    } catch {
      this.data = { ...defaultSettings };
    }
  }

  save(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch {
      /* Speicher nicht verfügbar – Einstellungen gelten nur für diese Sitzung */
    }
    events.emit("settings:changed", {});
  }

  update(patch: Partial<SettingsData>): void {
    this.data = { ...this.data, ...patch };
    this.save();
  }

  reset(): void {
    this.data = { ...defaultSettings };
    this.save();
  }
}

export const settings = new SettingsStore();

export const qualityProfiles: Record<Quality, {
  pixelRatio: number;
  shadows: boolean;
  shadowSize: number;
  pointShadows: boolean;
  bloom: boolean;
  lightPool: number;
  texSize: number;
  particles: number;
  antialias: boolean;
}> = {
  niedrig: { pixelRatio: 0.75, shadows: false, shadowSize: 512, pointShadows: false, bloom: false, lightPool: 4, texSize: 256, particles: 0.4, antialias: false },
  mittel: { pixelRatio: 1, shadows: true, shadowSize: 1024, pointShadows: false, bloom: true, lightPool: 6, texSize: 512, particles: 0.7, antialias: true },
  hoch: { pixelRatio: 1, shadows: true, shadowSize: 2048, pointShadows: true, bloom: true, lightPool: 8, texSize: 512, particles: 1, antialias: true },
  ultra: { pixelRatio: 1.5, shadows: true, shadowSize: 2048, pointShadows: true, bloom: true, lightPool: 10, texSize: 1024, particles: 1.3, antialias: true },
};
