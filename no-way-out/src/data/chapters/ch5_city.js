// KAPITEL 5 – DIE STADT
// Varnheim im Morgengrauen: Lindenstraße (Blockade + Horde), Haus Nr. 17 (Samis Wohnung, Aufnahme 5), Hinterhof,
// Gasse, Marktplatz im Regen (Schleichen), Kontrollpunkt Nord: Mines Geständnis, Generator, Totmannschalter
// -> finale Entscheidung -> drei Enden.
import { ZS } from '../../ai/zombie.js';
const PI = Math.PI;

export default {
  id: 'ch5', startFlag: 'c5_started', name: 'Die Stadt', tagline: 'Varnheim · 05:40 Uhr · Kontrollpunkt Nord',
  w: 64, h: 96,
  opts: { floor: 'asphalt', wall: 'facade1', ceil: null, height: 12 },
  env: { fog: 0x141c2a, fogDensity: 0.028, hemi: 0.55, hemiSky: 0x6a7aa8, hemiGround: 0x141414, exposure: 1.2, tint: 0xe4ecff, reverb: [2.2, 3.0], reverbMix: 0.28, rain: true, noiseMul: 0.72, sleeve: 0x8fb0c4 },

  build(L) {
    const out = { outdoor: true, ambient: 0.2, tint: 0x7a8ac0, wet: true };
    // Straße + Gehwege
    L.room('Lindenstraße', 12, 46, 8, 48, { ...out, floor: 'asphalt', wall: 'facade1' });
    L.room('Gehweg West', 9, 46, 3, 48, { ...out, floor: 'pavement', floorY: 0.12, wall: 'facade2' });
    L.room('Gehweg Ost', 20, 46, 3, 48, { ...out, floor: 'pavement', floorY: 0.12, wall: 'facade3' });
    // Haus Nr. 17
    L.room('Hausflur Nr. 17', 24, 66, 4, 9, { floor: 'h_floor2', wall: 'plaster', ceil: 'h_ceil', height: 2.9, ambient: 0 });
    L.door(23, 70, { id: 'd_house', mat: 'wood' });
    L.room('Wohnung Yıldız', 29, 64, 10, 11, { floor: 'wood_light', wall: 'h_wall', ceil: 'h_ceil', height: 2.8 });
    L.door(28, 69, { id: 'd_flat', mat: 'wood' });
    L.door(39, 66, { id: 'd_back', mat: 'wood' });
    L.room('Treppe (verschüttet)', 24, 76, 4, 2, { floor: 'h_floor2', wall: 'plaster', ceil: 'h_ceil', height: 2.9 });
    // Hof, Gasse
    L.room('Hinterhof', 40, 56, 14, 19, { ...out, floor: 'pavement', wall: 'brick', height: 10 });
    L.door(54, 60, { id: 'd_gate_yard', kind: 'metal' });
    L.room('Gasse', 55, 28, 4, 47, { ...out, floor: 'asphalt', wall: 'brick', height: 10 });
    // Marktplatz + Apotheke
    L.room('Marktplatz', 8, 24, 47, 22, { ...out, floor: 'pavement', wall: 'facade3', height: 14 });
    L.room('Apotheke', 2, 30, 5, 7, { floor: 'h_tile_floor', wall: 'h_tile_wall', ceil: 'h_ceil', height: 3, ambient: 0 });
    L.door(7, 33, { id: 'd_pharma', open: true });
    // Kontrollpunkt + Brücke
    L.room('Kontrollpunkt Nord', 14, 10, 34, 14, { ...out, floor: 'asphalt', wall: 'concrete_wall', height: 9 });
    L.door2(30, 9, { id: 'gate', kind: 'security', locked: true, lockedText: 'Tor – ohne Strom' });
    L.room('Alte Brücke', 24, 1, 14, 8, { ...out, floor: 'asphalt', wall: 'concrete', height: 12, wallH: 1.25, ambient: 0.05 });

    // ================= Licht =================
    for (const [x, z, on] of [[9.4, 88, 1], [22.6, 80, 0], [9.4, 72, 1], [22.6, 64, 1], [9.4, 56, 0], [22.6, 48, 1]]) L.prop('streetlamp', x, z, { rot: x < 15 ? PI / 2 : -PI / 2, off: !on, mode: (x * z) % 3 ? 'steady' : 'flicker' });
    L.light(26, 70, { kind: 'bulb', mode: 'broken', mul: 0.6 });
    L.light(33, 69, { kind: 'panel_warm', mode: 'flicker', speed: 0.4, mul: 0.6 });
    L.light(37, 72, { kind: 'bulb', color: 0xffc080, mul: 0.5 });
    L.light(46, 63, { kind: 'bulb', mode: 'flicker', y: 3.2 });
    L.light(57, 50, { kind: 'bulb', mode: 'broken', y: 3.5 });
    for (const [x, z] of [[14, 30], [30, 26], [44, 40], [52, 26]]) L.prop('streetlamp', x, z, { rot: 0, mode: x === 44 ? 'flicker' : 'steady' });
    L.light(4.5, 33, { kind: 'panel', mul: 0.6, mode: 'flicker' });
    L.light(4.5, 31, { kind: 'green', y: 2.6 });

    // ================= Requisiten =================
    // Straße Süd
    L.prop('fence', 15.5, 93.4, { w: 8 });
    L.prop('station_sign', 15.5, 93.3, { text: 'U  MARKTPLATZ', w: 3.0, y: 2.6 });
    L.prop('car', 13.6, 84, { rot: 0.2, color: 0x30304a });
    L.prop('car', 18.2, 77, { rot: PI - 0.4, burnt: true });
    L.prop('car', 13.4, 70, { rot: PI + 0.1, police: true, alarm: false, id: null });
    L.prop('barricade', 17.5, 66.2, { w: 2.4, rot: 0.3 });
    L.prop('bin', 10.2, 80); L.prop('bin', 21.8, 74.6); L.prop('tree', 10.2, 66); L.prop('tree', 21.8, 86);
    L.prop('dumpster', 10.4, 76, { rot: PI / 2, hide: true });
    L.prop('label', 22.98, 72.2, { text: 'Lindenstraße 17', w: 1.0, h: 0.3, y: 2.6, rot: -PI / 2, bg: '#1d3f5a', fg: '#fff' });
    // Blockade
    L.prop('bus', 15.5, 62, { rot: PI / 2, text: '3  KLINIKUM' });
    L.prop('fence', 9.4, 62.4, { w: 1.2 });
    L.prop('car', 22.0, 62.3, { rot: 0, van: true, ambulance: true });
    L.prop('barricade', 14, 64.4, { w: 2.2 }); L.prop('sandbags', 18, 64.6, { w: 2.0 });
    // Haus 17 + Wohnung
    L.prop('label', 27.97, 70.3, { text: 'Yıldız · Aksoy', w: 0.6, h: 0.14, y: 1.55, rot: -PI / 2, bg: '#e8e2d0', fg: '#222' });
    L.prop('debris', 26, 76.6, { w: 3.6 });
    L.prop('body', 25.6, 67.4, { cloth: 'fabric_dark', rot: 1 });
    L.prop('desk', 31, 72.8, { w: 1.6, d: 0.7, rot: PI, mat: 'wood', screen: 'text', screenOpts: { text: 'NACHVORNE.sh\nletzte Änderung:\nMo 01:52', color: '#9fd3ff' } });
    L.prop('shelf', 29.3, 66.7, { rot: PI / 2, w: 2.3, h: 1.9 });
    L.prop('bench', 34, 67.6, { w: 2.2, rot: PI });
    L.prop('desk', 34, 69.6, { w: 1.2, d: 0.6, monitor: false, chair: false, mat: 'wood_light' });
    L.prop('tv', 34, 64.05, { y: 1.4, text: 'KEIN SIGNAL', });
    L.prop('plant', 38.4, 64.6);
    L.prop('counter', 37.6, 72.2, { w: 2.4, d: 0.65, rot: -PI / 2, mat: 'wood_light' });
    L.prop('freezer', 38.5, 74.4, { rot: -PI / 2 });
    L.prop('bed', 30.6, 65.4, { rot: PI / 2, noSheet: false, hide: true, exitSide: 'right' });
    L.prop('poster', 38.97, 69.4, { rot: -PI / 2, text: 'LEUCHTTURM\nNORDENSTRAND', bg: '#2a3a5a', fg: '#f0e0c0' });
    // Hof
    L.prop('dumpster', 42, 72.5, { hide: true });
    L.prop('dumpster', 50.5, 57.2, { rot: PI, color: 0x5a3a2a });
    L.prop('tree', 47, 66, { s: 1.2 });
    L.prop('bin', 52.8, 70); L.prop('bin', 41.2, 58.4);
    L.prop('boxes', 44.5, 57.4, { n: 4 });
    // Gasse
    L.prop('dumpster', 57.6, 66, { rot: PI / 2, hide: true });
    L.prop('dumpster', 56.2, 46, { rot: -PI / 2, color: 0x3a4a5a });
    L.prop('boxes', 57.5, 55, { n: 3 }); L.prop('bin', 55.6, 38);
    // Marktplatz
    L.prop('fountain', 31, 34);
    for (const [x, z] of [[20, 30], [42, 30], [20, 40], [42, 40]]) L.prop('tree', x, z, {});
    for (const [x, z, r] of [[25, 30, 0], [37, 30, 0], [25, 38.4, PI], [37, 38.4, PI]]) L.prop('bench', x, z, { rot: r });
    L.prop('bus_stop', 12, 41, { rot: PI / 2 });
    L.prop('car', 20.5, 43.2, { rot: 1.4, police: true });
    L.prop('car', 46.5, 33.5, { rot: 0.3, van: true, ambulance: true });
    L.prop('car', 12.2, 27.5, { rot: -0.6, burnt: true, fireRange: 10 });
    L.prop('car', 50.8, 42, { rot: 2.2, alarm: true, color: 0x8a1a1a });
    L.prop('shopfront', 6.97, 33, { rot: PI / 2, text: 'APOTHEKE', w: 4, bg: '#1a6a2a' });
    L.prop('body', 28, 41, { cloth: 'fabric_dark', rot: 0.4 }); L.prop('body', 35.5, 27.6, { cloth: 'soldier', rot: 2 });
    L.prop('barricade', 26, 25.2, { w: 2.4 }); L.prop('barricade', 36, 25.2, { w: 2.4 });
    // Apotheke
    L.prop('counter', 4, 31, { w: 3.6, d: 0.7, mat: 'plastic_white' });
    L.prop('shelf', 2.4, 34.5, { rot: PI / 2, w: 3 }); L.prop('shelf', 5.6, 35.8, { rot: PI, w: 1.6 });
    // Kontrollpunkt
    L.prop('sandbags', 17, 22.6, { w: 5 }); L.prop('sandbags', 24, 22.6, { w: 5 });
    L.prop('sandbags', 38, 22.6, { w: 5 }); L.prop('sandbags', 45, 22.6, { w: 4 });
    L.prop('barricade', 30.5, 23.2, { w: 2.4 });
    L.prop('speaker_truck', 18.5, 15.5, { rot: -0.15 });
    L.prop('military_truck', 41.5, 17.5, { rot: 0.12 });
    L.prop('tent', 23, 12.6, {});
    L.prop('tent', 43.4, 11.8, { rot: PI });
    L.prop('generator', 27.5, 13.2, { id: 'gen5', prompt: 'Generator starten', hold: 2.0, rot: PI });
    L.prop('deadman', 35.8, 10.5, { id: 'deadman', prompt: 'Torsteuerung (Totmannschalter)', rot: 0 });
    L.prop('gate_checkpoint', 29.6, 9.5, { w: 2.8 });
    for (const [x, z] of [[16, 21.2], [45.6, 21.2], [25.6, 10.6]]) L.prop('floodlight', x, z, { rot: x > 40 ? PI * 0.8 : x < 20 ? -PI * 0.8 : 0 });
    L.prop('body', 21.5, 19.5, { cloth: 'soldier', rot: 1.4 }); L.prop('body', 38.5, 13.8, { cloth: 'soldier', rot: 3 });
    L.prop('crate', 33.5, 15, { rot: 0.3 }); L.prop('crate', 25.5, 18.6, { rot: -0.2, s: 0.8 });
    L.prop('cone', 29.4, 12.0); L.prop('cone', 32.4, 12.0);
    // Brücke
    L.prop('car', 27.5, 3.0, { rot: 0, van: true, color: 0xe8e8e8, lightsOn: true, plate: 'NEXARA 01' });
    L.prop('car', 34.2, 3.2, { rot: 0.05, van: true, color: 0xe8e8e8, lightsOn: true, plate: 'NEXARA 02' });
    L.light(27.5, 5.6, { kind: 'none', color: 0xf4f8ff, intensity: 9, range: 12, y: 0.9 });
    L.light(34.2, 5.8, { kind: 'none', color: 0xf4f8ff, intensity: 9, range: 12, y: 0.9 });
    L.prop('label', 31, 1.05, { text: 'NEXARA · SICHERHEIT', w: 3.2, h: 0.5, y: 1.0, bg: '#0b2a4a', fg: '#e8f4ff', glow: true });

    // ================= Decals =================
    L.decal('blood_pool', 25.6, 67.8, { size: 1.6 });
    L.decal('blood_trail', 14, 74, { size: 3, rot: 0.4 });
    L.decal('blood_pool', 28, 41.3, { size: 1.8 });
    L.decal('blood_smear', 21.5, 19.9, { size: 1.6 });
    L.decal('paper', 30, 36.5); L.decal('paper', 22, 28); L.decal('paper', 40, 33);

    // ================= Gegenstände =================
    L.item('doc', 37.5, 72.0, { id: 'doc_kuehl', doc: 'c5_zettel', h: 1.1 });
    L.item('recorder', 31.2, 72.9, { id: 'frag5', h: 0.78, fragment: FRAG5 });
    L.item('medkit', 37.6, 71.3, { id: 'mk5', h: 1.1, notHard: true });
    L.item('ammo', 26.2, 67.8, { id: 'ammo5_a', h: 0.03, rounds: 12 });
    L.item('ammo', 36.0, 28.1, { id: 'ammo5_b', h: 0.03, rounds: 20 });
    L.item('bandage', 25.2, 72.5, { id: 'b5h', h: 0.02 });
    L.item('doc', 22.5, 36.0, { id: 'doc_flug', doc: 'c5_flugblatt', h: 0.02 });
    L.item('medkit', 4.0, 31.0, { id: 'mk5p', h: 1.1 });
    L.item('bandage', 2.5, 34.0, { id: 'b5p', h: 1.2 });
    L.item('pills', 5.6, 35.8, { id: 'p5p', h: 1.2, notHard: true });
    L.item('bandage', 4.6, 35.8, { id: 'b5p2', h: 1.2, extra: true });
    L.item('bottle', 44.5, 57.4, { id: 'bottle5', h: 0.9 });
    L.item('can', 56, 39, { id: 'can5', h: 0.02 });
    L.item('doc', 23.4, 12.0, { id: 'doc_befehl', doc: 'c5_befehl', h: 0.9 });
    L.item('bandage', 33.5, 15.0, { id: 'b5cp', h: 0.85, notHard: true });
    // Zusätzliche Fundstücke am Wegesrand (liegen am Boden an der Wand und leuchten auf)
    L.item('ammo', 22.77, 72.5, { id: 'ammo_x0', h: 0.03, rounds: 10 });
    L.item('bandage', 37.5, 64.23, { id: 'band_x1', h: 0.03 });
    L.item('ammo', 58.77, 60.5, { id: 'ammo_x2', h: 0.03, rounds: 10 });
    L.item('bandage', 27.5, 10.23, { id: 'band_x3', h: 0.03, notHard: true });
    L.interact('grate', 46.2, 11.0, { prompt: 'Gitter des Entwässerungskanals öffnen', y: 0.4, mesh: 'panel', enabled: (g) => !!g.state.flags.secret_route });

    // ================= Gegner =================
    L.zombie(14.5, 79, { id: 'z5a', type: 'shambler', outfit: 'civilian', wander: 3 });
    L.zombie(19, 71.5, { id: 'z5b', type: 'sleeper', pose: 'lying', yaw: 2, outfit: 'civilian2' });
    for (const [i, [x, z]] of [[12, 56], [15, 53], [18, 57], [14, 49], [17.5, 50], [11, 51]].entries()) L.zombie(x, z, { id: 'zh' + i, type: 'shambler', outfit: ['civilian', 'civilian2', 'suit', 'security', 'civilian', 'soldier'][i], wander: 2.5 });
    L.zombie(25.4, 73.8, { id: 'z5n', type: 'sleeper', pose: 'sitting', yaw: PI, outfit: 'civilian2', wake: 3 });
    L.zombie(57, 62, { id: 'z5g', type: 'wanderer', outfit: 'civilian', patrol: [[57, 70], [57, 34]] });
    for (const [i, [x, z]] of [[28, 36], [34, 31], [27, 31.5], [36, 37], [24, 34], [39, 34], [31, 40.5]].entries()) L.zombie(x, z, { id: 'zm' + i, type: 'shambler', outfit: ['civilian', 'soldier', 'civilian2', 'suit', 'civilian', 'security', 'soldier'][i], wander: 3 });
    L.zombie(47.5, 26.2, { id: 'zms', type: 'stalker', yaw: PI / 2, outfit: 'soldier', stalker: true });
    L.zombie(14.5, 33, { id: 'zmk', type: 'sleeper', pose: 'kneel', yaw: -PI / 2, outfit: 'civilian', wake: 3 });

    // ================= Auslöser =================
    L.trigger('street', 9, 80, 14, 6);
    L.trigger('block', 9, 64, 14, 4);
    L.trigger('flat', 29, 64, 10, 11);
    L.trigger('yard', 40, 56, 14, 19);
    L.trigger('square', 8, 24, 47, 6);
    L.trigger('alleyN', 55, 28, 4, 14);
    L.trigger('cp', 14, 10, 34, 12);
    L.trigger('bridge', 24, 1, 14, 5);
    L.checkpoint('start', 15.5, 91, 0);
    L.checkpoint('flat', 32.5, 70.5, PI / 2);
    L.checkpoint('alley', 57, 52, 0);
    L.checkpoint('checkpoint', 30.5, 19.5, 0);
    L.checkpoint('final', 33.5, 12.4, 0);
  },

  ambience(g) {
    g.audio.loop('amb', 'wind_loop', { vol: 0.35, bus: 'amb', reverb: false });
    g.audio.loop('rain', 'rain_loop', { vol: 0.55, bus: 'amb', reverb: false });
    g.audio.loop('siren', 'siren_far', { vol: 0.25, bus: 'amb' });
  },

  onLoad(c, info) {
    const g = c.g;
    if (!info.restored) c.setClock('05:38');
    if (!c.npc('mine')) c.addNpc('mine', 14.5, 92.2, { mode: 'follow' });
    if (!c.npc('ilyas')) c.addNpc('ilyas', 16.5, 92.4, { mode: 'follow' });
    const il = c.npc('ilyas'); if (il) il.injured = !c.get('ilyas_saved');
    c.power('flood', !!c.get('gen5_on'));
    // Begleiter werden von Zombies ignoriert; im Finale bleiben sie nahe
  },

  script: [
    {
      id: 'c5_start', when: 'start', if: (c) => !c.get('c5_started'), do: async (c) => {
        c.flag('c5_started');
        c.objective('Erreiche den Kontrollpunkt Nord an der Alten Brücke – vor 06:00 Uhr.');
        await c.wait(2);
        await c.lines([{ s: 'mine', t: 'Regen. Gut. Dann hören sie uns schlechter.', v: 'm5_a' }]);
      },
    },
    {
      id: 'c5_speaker', when: 'start', once: false, if: (c) => !c.get('ending'), do: async (c) => {
        const go = async () => {
          for (let k = 0; k < 40 && !c.get('ending'); k++) {
            await c.lines([{ s: 'military', t: 'Achtung, Achtung. Hier spricht der Krisenstab. Der Sektor Klinikum wird um sechs Uhr geräumt. Begeben Sie sich sofort zum Kontrollpunkt Nord an der Alten Brücke.', v: 'mil_a', pos: { x: 18.5, y: 3.5, z: 15.5 } }], { parallel: true, channel: 'pa' });
            await c.wait(50);
          }
        };
        await c.wait(6);
        await go();
      },
    },
    {
      id: 'c5_block', when: 'enter:block', do: async (c) => {
        c.say('sami', 'Die Straße ist dicht. Und dahinter …', { d: 2.6 });
        await c.wait(2.5);
        c.msg('unknown', 'UNBEKANNT', 'Die Lindenstraße ist voll. Haus Nummer 17. Deine Wohnung. Durch den Hof.');
        c.objective('Lindenstraße 17: durch das Haus in den Hinterhof.');
        await c.wait(3);
        await c.lines([{ s: 'mine', t: 'Nummer 17 … Sami. Da wohnen wir. Da wohnst du.', v: 'm5_b' }]);
      },
    },
    {
      id: 'c5_flat', when: 'enter:flat', do: async (c) => {
        c.checkpoint('flat');
        await c.wait(1.5);
        c.say('sami', 'Unsere Wohnung.', { d: 2 });
        await c.wait(2.2);
        await c.lines([{ s: 'mine', t: 'Der Leuchtturm. Du hast das Bild über dem Sofa aufgehängt, als wir eingezogen sind. Schief. Absichtlich.', v: 'm5_c' }]);
        c.objective('Durch die Hintertür in den Hof. Dann durch die Gasse zum Marktplatz.');
      },
    },
    { id: 'c5_frag5', when: 'pickup:frag5', do: async (c) => { await c.wait(1); c.fact('Aufnahme 5: „Wenn du alle Aufnahmen gefunden hast, weißt du, wer dich anruft. Nimm den letzten Anruf an.“'); } },
    {
      id: 'c5_yard', when: 'enter:yard', do: async (c) => { await c.wait(1); c.msg('unknown', 'UNBEKANNT', 'Die Gasse führt zum Marktplatz. Bleib unten. Der Regen deckt deine Schritte – nicht dein Licht.'); },
    },
    { id: 'c5_alley', when: 'enter:alleyN', do: async (c) => { c.checkpoint('alley'); c.objective('Schleiche über den Marktplatz zum Kontrollpunkt Nord.'); } },
    {
      id: 'c5_cp', when: 'enter:cp', do: async (c) => {
        const g = c.g;
        c.checkpoint('checkpoint');
        c.objective('Kontrollpunkt Nord.');
        await c.wait(1.5);
        c.look(31, 1.5, 3, 0.8);
        await c.lines([
          { s: 'mine', t: 'Sami, warte. Da drüben auf der Brücke … das sind keine Soldaten. Das ist NEXARA.', v: 'm5_d' },
          { s: 'mine', t: 'Brenner hat mir einen Auftrag gegeben. Dich hierherzubringen. Zu ihnen. Sie sagen, nur sie können dich stabilisieren.', v: 'm5_e' },
          { s: 'sami', t: 'Und? Glaubst du das?' },
          g.state.flags['read:c2_memo']
            ? { s: 'mine', t: 'Ich habe es geglaubt. Bis ich Arendts Notiz gesehen habe. „Wertanlage.“', v: 'm5_f' }
            : { s: 'mine', t: 'Ich habe es geglaubt. Ich wollte es glauben. Weil ich dich nicht verlieren wollte.', v: 'm5_g' },
          { s: 'mine', t: 'Ich bringe dich nicht zu ihnen. Nie. Wir gehen über die Brücke – an ihnen vorbei, zu den Soldaten am anderen Ufer.', v: 'm5_h' },
        ]);
        c.unlook();
        c.fact('Mine hatte den Auftrag, mich an NEXARA auszuliefern. Sie hat sich dagegen entschieden.');
        if (c.get('ilyas_infected') || (c.get('ilyas_bitten') && !c.get('ilyas_saved'))) await c.lines([{ s: 'ilyas', t: 'Dann macht schnell. Mir bleibt nicht mehr viel Zeit.', v: 'i5_a' }]);
        else await c.lines([{ s: 'ilyas', t: 'Das Tor braucht Strom. Der Generator da drüben.', v: 'i5_b' }]);
        c.objective('Starte den Generator. Öffne das Tor zur Brücke.');
      },
    },
    {
      id: 'c5_gen', when: 'interact:gen5', do: async (c) => {
        const g = c.g;
        c.flag('gen5_on');
        c.sound('generator_start', [27.5, 1, 13.2], { vol: 1 });
        c.shake(0.3);
        await c.wait(2.4);
        c.loop('gen', 'buzz_loop', [27.5, 1, 13.2], { vol: 0.6, bus: 'sfx' });
        c.power('flood', true);
        c.sound('power_on', null, { vol: 0.7 });
        c.noise(28, 14, 45, 'alarm'); c.noise(30, 34, 30, 'alarm');
        c.checkpoint('final');
        await c.lines([
          { s: 'ilyas', t: 'Die Torsteuerung hat einen Totmannschalter. Einer muss ihn halten, solange das Tor offen ist. Lässt du los, geht es zu.', v: 'i5_c' },
          { s: 'mine', t: 'Sie kommen! Vom Platz – alle!', v: 'm5_i' },
        ]);
        c.objective('Zur Torsteuerung!');
        const t = g.difficulty.chaseTime;
        for (const z of g.zombies) if (z.alive && z.pos.z > 23 && z.pos.z < 46) { await c.wait(0.25); z.forceChase(); }
        await c.wait(3 * t);
        for (const [x, z, o] of [[15, 44, 'civilian'], [18, 45, 'suit'], [13, 45, 'civilian2'], [52, 44, 'soldier']]) { const s = c.spawn({ x, z, type: 'shambler', outfit: o }); s.forceChase(); }
      },
    },
    {
      id: 'c5_deadman_off', when: 'interact:deadman', once: false, if: (c) => !c.get('gen5_on'), do: async (c) => {
        c.say('sami', 'Kein Strom. Erst den Generator.', { d: 2 });
        c.toast('Die Torsteuerung braucht Strom: zuerst den Generator starten.');
      },
    },
    {
      id: 'c5_deadman', when: 'interact:deadman', once: false, if: (c) => c.get('gen5_on') && !c.get('final_choice'), do: async (c) => {
        const g = c.g;
        const frags = g.state.fragments.size;
        const infected = !c.get('ilyas_saved');
        const opts = [];
        if (!infected) opts.push({ id: 'hope', text: '„İlyas, überbrück den Schalter – wir halten sie auf!“', hint: 'Durchhalten, bis das Tor dauerhaft offen ist.' });
        else opts.push({ id: 'ilyas', text: 'İlyas den Schalter halten lassen.', hint: '„Ich bin sowieso schon unterwegs.“' });
        opts.push({ id: 'sami', text: 'Den Schalter selbst halten.', hint: 'Mine und İlyas gehen über die Brücke.' });
        if (frags >= 5) {
          g.audio.play('ring', { vol: 0.6, reverb: false });
          opts.push({ id: 'call', text: 'Den Anruf annehmen.', hint: 'UNBEKANNT ruft an. Diesmal hörst du bis zum Ende zu.' });
        }
        const ch = await c.choice(frags >= 5 ? 'Die Horde kommt. Das Telefon klingelt – UNBEKANNT (…017).' : 'Die Horde kommt. Jemand muss den Schalter halten.', opts);
        c.flag('final_choice', ch);
        if (ch === 'hope') await HOPE(c);
        else if (ch === 'ilyas') await TRAGEDY_A(c);
        else if (ch === 'sami') await TRAGEDY_B(c);
        else await SECRET(c);
      },
    },
    {
      id: 'c5_restore_final', when: 'restore:final', once: false, do: async (c) => { c.flag('final_choice', null); delete c.g.state.flags['used:deadman']; c.objective('Zur Torsteuerung!'); await c.wait(3); c.noise(28, 14, 45, 'alarm'); for (const z of c.g.zombies) if (z.alive && z.pos.z > 23 && z.pos.z < 46) z.forceChase(); },
    },
    {
      id: 'c5_bridge', when: 'enter:bridge', if: (c) => ['hope', 'ilyas'].includes(c.get('final_choice')) && c.get('gate_open'), do: async (c) => {
        const g = c.g;
        c.close('gate', { force: true }); c.lock('gate');
        c.flag('ending', c.get('final_choice') === 'hope' ? 'hope' : 'tragedy_a');
        for (const z of g.zombies) if (z.alive && z.pos.z > 9) { z.lastSeenT = -99; }
        await c.wait(2);
        await c.fade(1, 2.5);
        await c.ending(c.get('final_choice') === 'hope' ? 'hope' : 'tragedy');
      },
    },
    {
      id: 'c5_grate', when: 'interact:grate', do: async (c) => {
        c.flag('ending', 'secret');
        c.sound('door_close', [46.2, 0.5, 11], { vol: 1, rate: 0.6 });
        c.lockPlayer(true);
        await c.fade(1, 2.5);
        await c.ending('secret');
      },
    },
  ],
};

// ---------- Ausgänge der finalen Entscheidung ----------
async function HOPE(c) {
  const g = c.g, il = c.npc('ilyas'), m = c.npc('mine');
  await c.lines([{ s: 'ilyas', t: 'Gib mir dreißig Sekunden! Ich brücke den Schalter mit dem Generator! Haltet sie von mir weg – lauft, lockt sie!', v: 'i5_d' }]);
  if (il) { il.goTo(35.8, 11.3); il.holdPose = true; }
  if (m) m.follow();
  const total = Math.round(26 / g.difficulty.chaseTime);
  for (let s = total; s > 0; s -= 5) {
    c.objective(`Überlebe! İlyas braucht noch ${s} Sekunden.`);
    await c.wait(Math.min(5, s));
  }
  if (il) il.holdPose = false;
  c.sound('beep_card', [35.8, 1.5, 10.5]); c.sound('klaxon', [30.5, 3, 9.5], { vol: 0.8 });
  c.unlock('gate'); c.open('gate');
  c.flag('gate_open');
  await c.lines([{ s: 'ilyas', t: 'Er hält! Jetzt – durch das Tor!', v: 'i5_e' }]);
  c.objective('Durch das Tor auf die Brücke!');
  if (il) il.goTo(29, 4, { run: true }); if (m) m.goTo(32, 4, { run: true });
}
async function TRAGEDY_A(c) {
  const g = c.g, il = c.npc('ilyas'), m = c.npc('mine');
  await c.lines([
    { s: 'ilyas', t: 'Lass mich. Ich bin sowieso schon unterwegs. Das spür ich doch.', v: 'i5_f' },
    { s: 'ilyas', t: 'Sag Defne … sag ihr, Papa ist bis zum Schluss geblieben.', v: 'i5_g' },
  ]);
  if (il) { il.teleport(35.8, 11.4, 0); il.stay(); il.holdPose = true; }
  c.unlock('gate'); c.open('gate'); c.flag('gate_open');
  c.sound('klaxon', [30.5, 3, 9.5], { vol: 0.8 });
  c.objective('Durch das Tor!');
  if (m) m.goTo(31.5, 4, { run: true });
  g.chaseSpeedMul = 0.8;
}
async function TRAGEDY_B(c) {
  const g = c.g, il = c.npc('ilyas'), m = c.npc('mine');
  g.godMode = true;
  c.lockPlayer(true);
  await c.lines([
    { s: 'sami', t: 'Geht. Ich halte ihn.' },
    { s: 'mine', t: 'Nein! Sami, nein – das lasse ich nicht zu!', v: 'm5_j' },
    { s: 'ilyas', t: 'Mine. Komm. Er hat sich entschieden.', v: 'i5_h' },
  ]);
  c.unlock('gate'); c.open('gate');
  c.sound('klaxon', [30.5, 3, 9.5], { vol: 0.8 });
  if (m) m.goTo(30, 3.5, { run: true }); if (il) il.goTo(31.5, 4, { run: true });
  c.look(30.5, 1.4, 5, 0.6);
  await c.wait(6);
  c.close('gate', { force: true, slow: true });
  await c.wait(2);
  c.unlook();
  c.look(30.5, 1.4, 22, 0.5);
  for (const z of g.zombies) if (z.alive) z.forceChase();
  await c.wait(3.5);
  c.flag('ending', 'tragedy_b');
  await c.fade(1, 2);
  await c.ending('tragedy');
}
async function SECRET(c) {
  const g = c.g;
  // Die Horde hält inne – wie im Licht gebannt
  for (const z of g.zombies) if (z.alive) { z.command({ type: 'face', x: g.player.pos.x, z: g.player.pos.z }); }
  const callP = c.call('UNBEKANNT (…017)', [
    { s: 'unknown', t: 'Wenn du diesen Anruf annimmst, hast du alle Aufnahmen gefunden. Dann weißt du es schon.', v: 'c5_final_a' },
    { s: 'unknown', t: 'Ich habe dir versprochen, dass ich dich hier raushole. Ich halte meine Versprechen. Meistens.', v: 'c5_final_b' },
    { s: 'fragment', name: 'Sami (Aufnahme)', t: 'Hallo, Sami. Ja. Das ist meine Stimme. Unsere. Ohne Filter.', v: 'c5_final_c' },
    { s: 'fragment', name: 'Sami (Aufnahme)', t: 'Unter dem Kontrollpunkt verläuft der alte Entwässerungskanal. Das Gitter hinter dem Sanitätszelt. Ich habe es vor drei Tagen geöffnet. NEXARA kennt diesen Weg nicht.', v: 'c5_final_d' },
    { s: 'fragment', name: 'Sami (Aufnahme)', t: 'Nimm Mine und İlyas mit. Und dann: nach vorne. Immer nur nach vorne.', v: 'c5_final_e' },
  ], { timeout: 6, ring: false });
  g.phone.answer();
  await callP;
  g.phone.addCall('UNBEKANNT (…017) – du selbst', 'in');
  c.fact('Die Stimme am Telefon war ich. Aufgenommen vor drei Tagen.');
  c.flag('secret_route');
  for (const z of g.zombies) if (z.alive && z.state === 'script') { z.cmd = null; z.state = null; z.setState(ZS.IDLE); z.forceChase(); }
  c.objective('Zum Entwässerungskanal – das Gitter hinter dem Sanitätszelt!');
  await c.lines([{ s: 'mine', t: 'Sami? Wer war das?', v: 'm5_k' }, { s: 'sami', t: 'Ich. Komm. Hier entlang!' }]);
  for (const n of g.npcs) n.follow();
}

const FRAG5 = {
  title: 'Aufnahme 5/5 – „Zuhause“',
  lines: [
    { s: 'fragment', t: 'Wenn du hier bist, hast du es fast geschafft. Zuhause. Komisch, oder? Ich nehme das hier am Schreibtisch auf, Mine schläft nebenan.', v: 'f5_a' },
    { s: 'fragment', t: 'Morgen gehe ich zurück in Zelle 017. Am Montag schaltet 4471 ARGUS ab. Dann laufen wir. Und in drei Tagen weiß ich nichts mehr davon.', v: 'f5_b' },
    { s: 'fragment', t: 'Wenn du alle Aufnahmen gefunden hast, weißt du, wer dich die ganze Zeit anruft. Nimm den letzten Anruf an. Hör bis zum Ende zu.', v: 'f5_c' },
  ],
};
