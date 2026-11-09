// Zentrale, datengetriebene Konfiguration: Schwierigkeitsgrade, Spielerwerte, Standard-Einstellungen.

export const DIFFICULTY = {
  easy: {
    id: 'easy', name: 'LEICHT',
    desc: 'Mehr Heilmittel und Munition, großzügigere Reaktionsfenster, schwächere Zombies.',
    healBonus: 1,          // zusätzliche Heilmittel-Fundorte werden aktiv (Level-Markierung "extra")
    healRemove: false,     // Fundorte mit Markierung "notHard" bleiben
    qteMul: 1.45,          // längeres Zeitfenster beim Losreißen
    qtePresses: 7,         // nötige Tastenanschläge beim Losreißen
    zSpeed: 0.88,          // Verfolgungstempo der Zombies
    zDetect: 0.75,         // Entdeckungsgeschwindigkeit
    zHearing: 0.85,
    damage: 0.75,          // erlittener Schaden
    injuryMul: 0.7,        // Stärke der Verletzungsnachteile
    chaseTime: 1.3,        // Zeitpuffer in inszenierten Verfolgungen
    searchTime: 0.75,      // wie lange Zombies suchen
    hideCheck: 0.35,       // Wahrscheinlichkeit, dass ein Zombie ein beobachtetes Versteck öffnet
    zHp: 3,                // Treffer, die ein Zombie aushält (Körper 1, Kopf 4)
    ammoMul: 1.5,          // Menge der gefundenen Munition
  },
  normal: {
    id: 'normal', name: 'MITTEL',
    desc: 'Die vorgesehene Balance. Fehler haben spürbare Konsequenzen.',
    healBonus: 0, healRemove: false,
    qteMul: 1.0, qtePresses: 9,
    zSpeed: 1.0, zDetect: 1.0, zHearing: 1.0,
    damage: 1.0, injuryMul: 1.0, chaseTime: 1.0, searchTime: 1.0, hideCheck: 0.6,
    zHp: 4, ammoMul: 1.0,
  },
  hard: {
    id: 'hard', name: 'SCHWER',
    desc: 'Weniger Heilmittel und Munition, zähere und aggressivere Gegner, kürzere Reaktionsfenster.',
    healBonus: 0, healRemove: true,
    qteMul: 0.72, qtePresses: 11,
    zSpeed: 1.1, zDetect: 1.3, zHearing: 1.2,
    damage: 1.25, injuryMul: 1.25, chaseTime: 0.85, searchTime: 1.35, hideCheck: 0.85,
    zHp: 5, ammoMul: 0.6,
  },
};

export const PLAYER = {
  radius: 0.28,
  eyeStand: 1.66,
  eyeCrouch: 1.0,
  walk: 2.3,
  sprint: 4.9,
  crouch: 1.15,
  accel: 11,
  staminaMax: 100,
  sprintDrain: 19,
  staminaRegen: 15,
  regenDelay: 1.1,
  exhaustedUntil: 30,
  stepUp: 0.42,
  breathHoldMax: 9,
};

export const NOISE = {
  sprintStep: 11,
  walkStep: 3.6,
  crouchStep: 0.8,
  doorOpen: 5,
  doorSlam: 13,
  vault: 7,
  land: 6,
  throwImpact: 15,
  gasp: 7,
};

// Tablet/Smartphone (iPadOS meldet sich als Mac mit Touch-Bildschirm)
export const IS_TOUCH = typeof navigator !== 'undefined' && (/iP(hone|ad|od)|Android/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) || (navigator.maxTouchPoints > 1 && typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches));
export const DEFAULT_SETTINGS = {
  sensitivity: 1.0,
  invertY: false,
  fov: 72,
  headBob: 1.0,
  masterVol: 0.9,
  musicVol: 0.7,
  sfxVol: 0.9,
  voiceVol: 1.0,
  quality: 'medium',      // low | medium | high
  renderScale: 1.0,       // interne Auflösung
  bloom: true,
  grain: true,
  brightness: 1.0,
  subtitles: true,
  subtitleSize: 'm',
  crouchToggle: true,
  difficulty: 'normal',
  bindings: null,         // wird aus DEFAULT_BINDINGS befüllt
};

export const DEFAULT_BINDINGS = {
  forward: ['KeyW', 'ArrowUp'],
  back: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  sprint: ['ShiftLeft', 'ShiftRight'],
  crouch: ['KeyC', 'ControlRight'],
  interact: ['KeyE', 'Enter'],
  vault: ['Space'],
  phone: ['KeyQ', 'Tab'],
  flashlight: ['KeyF'],
  heal: ['KeyH'],
  throw: ['KeyG'],
  fire: ['Mouse0'],
  aim: ['Mouse2'],
  reload: ['KeyR'],
  pause: ['KeyP', 'Escape'],
};

export const ACTION_NAMES = {
  forward: 'Vorwärts', back: 'Rückwärts', left: 'Links', right: 'Rechts',
  sprint: 'Rennen', crouch: 'Schleichen / Ducken', interact: 'Interagieren',
  vault: 'Klettern / Atem anhalten', phone: 'Smartphone', flashlight: 'Taschenlampe',
  heal: 'Heilen', throw: 'Werfen', fire: 'Schießen', aim: 'Zielen', reload: 'Nachladen', pause: 'Pause',
};

const SKEY = 'nwo.settings.v1';

export function loadSettings() {
  let s = {};
  try { s = JSON.parse(localStorage.getItem(SKEY) || '{}') || {}; } catch (e) { s = {}; }
  const out = { ...DEFAULT_SETTINGS, ...s };
  out.bindings = { ...JSON.parse(JSON.stringify(DEFAULT_BINDINGS)), ...(s.bindings || {}) };
  // Ältere Spielstände: Linksklick war Werfen, jetzt Schießen
  if (s.bindings && s.bindings.throw && !s.bindings.fire) out.bindings.throw = s.bindings.throw.filter((k) => k !== 'Mouse0');
  return out;
}

export function saveSettings(s) {
  try { localStorage.setItem(SKEY, JSON.stringify(s)); } catch (e) { /* privat/gesperrt */ }
}

export const QUALITY = {
  low: { pixelRatio: 0.75, shadow: 512, lights: 6, gridShadow: false, msaa: 0, bloom: false, texSize: 256 },
  medium: { pixelRatio: 1.0, shadow: 1024, lights: 8, gridShadow: true, msaa: 0, bloom: true, texSize: 512 },
  high: { pixelRatio: 1.0, shadow: 2048, lights: 12, gridShadow: true, msaa: 4, bloom: true, texSize: 512 },
};
