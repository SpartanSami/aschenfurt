// Datengetriebene Zombie-Typen. Alle Typen sind klassische, langsame Zombies –
// sie unterscheiden sich nur in Verhalten und Wahrnehmung, nicht durch Mutationen.
export const ZOMBIE_TYPES = {
  shambler: {
    name: 'Schlurfer', outfit: 'gown',
    walk: 0.62, chase: 3.05, turn: 1.6, turnChase: 4.2,
    sight: 15, fov: 115, hearing: 1.0, detect: 1.0,
    reach: 1.15, windup: 0.6, grab: 0.5, damage: 26,
    wake: 3.5, getup: 2.3, alertDelay: 0.75, search: 10, callRadius: 9, bash: 1.0,
  },
  // liegt/sitzt scheinbar tot herum, reagiert erst auf deutliche Geräusche oder Nähe
  sleeper: {
    name: 'Schläfer', outfit: 'gown',
    walk: 0.6, chase: 3.0, turn: 1.5, turnChase: 4.0,
    sight: 9, fov: 100, hearing: 0.9, detect: 0.9,
    reach: 1.15, windup: 0.55, grab: 0.6, damage: 28,
    wake: 4.5, getup: 1.9, alertDelay: 0.5, search: 9, callRadius: 9, bash: 1.0,
  },
  // steht regungslos im Dunkeln, kaum hörbar – schwer zu erkennen
  stalker: {
    name: 'Lauerer', outfit: 'scrubs', quiet: true, stationary: true,
    walk: 0.55, chase: 3.2, turn: 1.2, turnChase: 4.5,
    sight: 11, fov: 120, hearing: 1.15, detect: 1.25,
    reach: 1.2, windup: 0.5, grab: 0.65, damage: 30,
    wake: 3.0, getup: 1.5, alertDelay: 0.45, search: 12, callRadius: 7, bash: 1.1,
  },
  // läuft feste Wege ab
  wanderer: {
    name: 'Wanderer', outfit: 'labcoat',
    walk: 0.7, chase: 3.05, turn: 1.7, turnChase: 4.2,
    sight: 16, fov: 115, hearing: 1.0, detect: 1.0,
    reach: 1.15, windup: 0.6, grab: 0.5, damage: 26,
    wake: 3.5, getup: 2.2, alertDelay: 0.7, search: 11, callRadius: 10, bash: 1.0,
  },
  // inszenierte Verfolger (Skript)
  hunter: {
    name: 'Verfolger', outfit: 'civilian',
    walk: 0.7, chase: 3.25, turn: 1.8, turnChase: 5.0,
    sight: 18, fov: 140, hearing: 1.2, detect: 1.4,
    reach: 1.2, windup: 0.55, grab: 0.55, damage: 28,
    wake: 2.0, getup: 1.4, alertDelay: 0.3, search: 14, callRadius: 11, bash: 1.4,
  },
};
