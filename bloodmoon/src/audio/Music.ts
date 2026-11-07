import { SynthCtx, piano, pad, choir, strings, drone, drum, bell, musicBox, NOTE } from "./Synth";

// Prozedurale, sparsam eingesetzte Musik. Stille ist ein Gestaltungsmittel:
// die meisten Cues bestehen aus Klangflächen mit seltenen Einzeltönen.

/** "Das Lied vom Mondbrunnen" – Ysoldes Wiegenlied (d-Moll). [MIDI, Schläge] */
export const LULLABY: [number, number][] = [
  [69, 1], [74, 1], [72, 1], [69, 2], [65, 1], [67, 1], [69, 1], [70, 1], [69, 3],
  [65, 1], [67, 1], [69, 1], [62, 2], [64, 1], [65, 1], [64, 1], [61, 1], [62, 3],
];
/** Zweite Strophe – kennt nur, wer sich wirklich erinnert. */
export const LULLABY_VERSE2: [number, number][] = [
  [74, 1], [72, 1], [70, 1], [69, 2], [67, 1], [65, 1], [67, 1], [69, 1], [62, 3],
];

const DMIN = [50, 53, 55, 57, 58, 60, 62, 65, 67, 69, 70, 72, 74];

interface Voice {
  next: number;
  fn: (t: number) => number; // plant Ereignis(se), gibt Pause bis zum nächsten zurück
}

export class Music {
  private s: SynthCtx;
  out: GainNode;
  private cueGain: GainNode | null = null;
  private voices: Voice[] = [];
  current = "silence";
  intensity = 0;

  constructor(s: SynthCtx, dest: AudioNode) {
    this.s = s;
    this.out = s.ctx.createGain();
    this.out.connect(dest);
  }

  play(cue: string, fade = 3): void {
    if (cue === this.current) return;
    const ctx = this.s.ctx;
    const now = ctx.currentTime;
    if (this.cueGain) {
      const old = this.cueGain;
      old.gain.cancelScheduledValues(now);
      old.gain.setValueAtTime(old.gain.value, now);
      old.gain.linearRampToValueAtTime(0.0001, now + fade);
      setTimeout(() => old.disconnect(), (fade + 8) * 1000);
    }
    this.current = cue;
    this.voices = [];
    if (cue === "silence") {
      this.cueGain = null;
      return;
    }
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(1, now + fade);
    g.connect(this.out);
    this.cueGain = g;
    this.voices = this.makeVoices(cue, now + 0.1, g);
  }

  update(): void {
    if (!this.cueGain) return;
    const now = this.s.ctx.currentTime;
    for (const v of this.voices) {
      let guard = 0;
      while (v.next < now + 0.5 && guard++ < 8) {
        const t = Math.max(v.next, now + 0.02);
        v.next = t + v.fn(t);
      }
    }
  }

  /** Spielt das Wiegenlied (z. B. in Erinnerungen, auf der Spieluhr). */
  lullaby(dest: AudioNode, t: number, verse2 = false, beat = 0.55, vol = 0.22, instrument: "box" | "piano" = "box"): number {
    const mel = verse2 ? LULLABY_VERSE2 : LULLABY;
    let tt = t;
    for (const [n, d] of mel) {
      if (instrument === "box") musicBox(this.s, dest, tt, NOTE(n + 12), vol);
      else piano(this.s, dest, tt, NOTE(n), vol, 3);
      tt += d * beat;
    }
    return tt - t;
  }

  private makeVoices(cue: string, t0: number, out: GainNode): Voice[] {
    const s = this.s;
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
    const v: Voice[] = [];
    const sparsePiano = (minGap: number, maxGap: number, vol = 0.12, lo = 4, hi = 12): Voice => ({
      next: t0 + rnd(3, 8),
      fn: (t) => {
        const n = DMIN[Math.floor(rnd(lo, hi))];
        piano(s, out, t, NOTE(n), vol, 5);
        if (Math.random() > 0.65) piano(s, out, t + rnd(0.6, 1.4), NOTE(n - pick([3, 4, 5, 7])), vol * 0.7, 5);
        return rnd(minGap, maxGap);
      },
    });
    const droneVoice = (root: number, vol = 0.06, len = 24): Voice => ({
      next: t0,
      fn: (t) => {
        drone(s, out, t, NOTE(root), len, vol);
        return len - 6;
      },
    });
    switch (cue) {
      case "menu":
        v.push({
          next: t0,
          fn: (t) => {
            const chords = [[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 49, 52]];
            const c = pick(chords);
            choir(s, out, t, c.map(NOTE), 14, 0.07, pick(["a", "o", "u"] as const), 4);
            pad(s, out, t, c.map((n) => NOTE(n - 12)), 14, 0.05, 500, 4);
            return 11;
          },
        });
        v.push({ next: t0 + 6, fn: (t) => (bell(s, out, t, NOTE(38), 0.25, 9), rnd(16, 26)) });
        v.push({ next: t0 + 12, fn: (t) => (this.lullaby(out, t, false, 0.62, 0.09, "piano"), rnd(40, 60)) });
        break;
      case "crypt":
        v.push(droneVoice(26, 0.07, 30));
        v.push(sparsePiano(9, 18, 0.07, 0, 7));
        v.push({ next: t0 + 15, fn: (t) => (strings(s, out, t, NOTE(pick([38, 41, 45])), 10, 0.035), rnd(20, 35)) });
        break;
      case "castle":
        v.push(droneVoice(26, 0.05, 30));
        v.push(sparsePiano(8, 16, 0.08));
        v.push({ next: t0 + 20, fn: (t) => (choir(s, out, t, [NOTE(pick([50, 53, 57]))], 9, 0.04, "u", 3), rnd(25, 45)) });
        break;
      case "village":
        v.push(droneVoice(31, 0.045, 30));
        v.push({ next: t0 + 4, fn: (t) => (strings(s, out, t, NOTE(pick([43, 45, 46, 50])), 8, 0.04), rnd(10, 18)) });
        v.push(sparsePiano(12, 22, 0.06, 5, 12));
        break;
      case "forest":
        v.push(droneVoice(28, 0.05, 30));
        v.push({ next: t0 + 5, fn: (t) => (choir(s, out, t, [NOTE(pick([45, 48, 50, 52]))], 10, 0.045, "u", 4), rnd(14, 26)) });
        v.push({ next: t0 + 9, fn: (t) => (strings(s, out, t, NOTE(pick([33, 36, 38])), 12, 0.03, 6), rnd(25, 40)) });
        break;
      case "cathedral":
        v.push({
          next: t0,
          fn: (t) => {
            const chords = [[50, 57, 62, 65], [46, 53, 58, 62], [48, 55, 60, 64], [45, 52, 57, 61]];
            const c = pick(chords);
            choir(s, out, t, c.map(NOTE), 12, 0.05, "o", 3);
            pad(s, out, t, [NOTE(c[0] - 12), NOTE(c[0] - 24)], 12, 0.05, 700, 3);
            return 10;
          },
        });
        v.push({ next: t0 + 7, fn: (t) => (bell(s, out, t, NOTE(pick([33, 38])), 0.18, 10), rnd(30, 50)) });
        break;
      case "tension":
        v.push({
          next: t0,
          fn: (t) => {
            strings(s, out, t, NOTE(pick([38, 39])), 8, 0.05, 9);
            strings(s, out, t, NOTE(pick([26, 27])), 8, 0.05, 7);
            return 7;
          },
        });
        v.push({ next: t0 + 1, fn: (t) => (drum(s, out, t, 0.25, 48), 1.6 + Math.random() * 0.2) });
        break;
      case "combat":
        v.push({
          next: t0,
          fn: (t) => {
            for (let i = 0; i < 4; i++) drum(s, out, t + i * 0.42, i === 0 ? 0.5 : 0.3, i % 2 ? 60 : 45);
            return 1.68;
          },
        });
        v.push({ next: t0, fn: (t) => (strings(s, out, t, NOTE(pick([38, 39, 41])), 3.4, 0.06, 11), 3.36) });
        break;
      case "memory":
        v.push({ next: t0, fn: (t) => (pad(s, out, t, [NOTE(50), NOTE(57), NOTE(62)], 16, 0.05, 600, 3), 14) });
        v.push({ next: t0 + 1.5, fn: (t) => this.lullaby(out, t, false, 0.6, 0.12) + rnd(6, 12) });
        break;
      case "theFirst":
        v.push(droneVoice(21, 0.09, 28));
        v.push({ next: t0 + 2, fn: (t) => (choir(s, out, t, [NOTE(38), NOTE(39), NOTE(45)], 10, 0.05, "u", 4), rnd(10, 16)) });
        v.push({ next: t0 + 8, fn: (t) => (strings(s, out, t, NOTE(pick([74, 75, 81])), 6, 0.02, 12), rnd(12, 20)) });
        break;
      case "finale":
        v.push({
          next: t0,
          fn: (t) => {
            const c = pick([[50, 53, 57, 62], [46, 50, 53, 58], [44, 48, 51, 56]]);
            choir(s, out, t, c.map(NOTE), 8, 0.07, "a", 1.5);
            strings(s, out, t, NOTE(c[0] - 12), 8, 0.06, 0);
            return 7.5;
          },
        });
        v.push({ next: t0 + 2, fn: (t) => (drum(s, out, t, 0.45, 40), 3.75) });
        break;
      case "ending1":
        v.push({ next: t0, fn: (t) => (pad(s, out, t, [NOTE(50), NOTE(54), NOTE(57)], 14, 0.05, 900, 4), 12) });
        v.push({ next: t0 + 3, fn: (t) => (this.lullaby(out, t, true, 0.7, 0.1, "piano"), 30) });
        break;
      case "ending2":
        v.push(droneVoice(26, 0.08, 30));
        v.push({ next: t0, fn: (t) => (choir(s, out, t, [NOTE(38), NOTE(45), NOTE(50)], 12, 0.08, "a", 2), 10) });
        v.push({ next: t0 + 1, fn: (t) => (drum(s, out, t, 0.3, 36), 5) });
        break;
      case "ending3":
        v.push({ next: t0, fn: (t) => (choir(s, out, t, [NOTE(50), NOTE(57), NOTE(64)], 14, 0.06, "o", 4), 12) });
        v.push({ next: t0 + 4, fn: (t) => (this.lullaby(out, t, false, 0.66, 0.1, "box") + this.lullaby(out, t + 13, true, 0.66, 0.1, "box"), 40) });
        break;
      default:
        break;
    }
    return v;
  }
}
