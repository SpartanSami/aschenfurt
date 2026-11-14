// KAPITEL 3 – DAS PARKHAUS
// Parkhaus Am Klinikum: drei versetzte Ebenen mit Rampen, Autoalarme, Bewegungsmelder,
// Samis Auto (Stellplatz 17), İlyas im Kassenhäuschen, Strom fürs Rolltor -> Horde -> Flucht zwischen den Autos.
const PI = Math.PI;

function carRow(L, xs, z, rot, o = {}) {
  for (const [i, x] of xs.entries()) {
    if (x == null) continue;
    const alarm = o.alarms && o.alarms.includes(i);
    L.prop('car', x, z, { rot, alarm, van: o.vans && o.vans.includes(i), y: o.y, seed: x * 3 + z });
  }
}

export default {
  id: 'ch3', startFlag: 'c3_started', name: 'Das Parkhaus', tagline: 'Parkhaus Am Klinikum · Ebenen −3 bis −1',
  w: 100, h: 62,
  opts: { floor: 'concrete_floor', wall: 'concrete_wall', ceil: 'concrete', height: 2.7, ambient: 0.05 },
  env: { fog: 0x060605, fogDensity: 0.05, hemi: 0.02, exposure: 1.05, tint: 0xf4eee2, reverb: [2.6, 2.0], reverbMix: 0.45, sleeve: 0x8fb0c4 },

  build(L) {
    // ---------- Ebene −3 ----------
    L.room('Treppenhaus West', 3, 30, 4, 4, { floor: 'concrete', wall: 'concrete_wall' });
    L.door(7, 31, { id: 'd_west', kind: 'metal', open: true });
    L.room('Ebene −3', 8, 16, 37, 31);
    L.room('Rampe −3/−2', 45, 40, 12, 5, { height: 4.3 });
    L.ramp(45, 40, 12, 5, '+x', 0, 1.5, { ceil: 2.7, mat: 'concrete_floor' });
    // ---------- Ebene −2 ----------
    L.room('Ebene −2', 57, 16, 33, 31, { floorY: 1.5, height: 2.7 });
    L.room('Rampe −2/−1', 66, 9, 6, 7, { floorY: 1.5, height: 4.3 });
    L.ramp(66, 9, 6, 7, '-z', 1.5, 1.5, { ceil: 2.7, mat: 'concrete_floor' });
    L.door(80, 47, { id: 'shutter', kind: 'shutter', locked: true, lockedText: 'Rolltor – ohne Strom', height: 2.6 });
    L.room('Verbindungsgang', 79, 48, 3, 10, { floorY: 1.5, height: 2.8, floor: 's_floor', wall: 's_wall_tile' });
    L.ramp(79, 53, 3, 5, '-z', 0, 1.5, { stairs: true, mat: 'concrete' });
    L.room('U-Bahn-Zugang', 78, 58, 5, 3, { floor: 's_floor', wall: 's_wall_tile', height: 3 });
    // ---------- Ebene −1 ----------
    L.room('Ebene −1', 50, 1, 40, 8, { floorY: 3.0, height: 2.7 });
    L.door(60, 6, { id: 'd_booth', locked: true, lockedText: 'Von innen verriegelt', mat: 'door_metal', npcNoOpen: true });
    L.glass(58, 2, 6, 1, { id: 'booth' }); L.glass(58, 6, 6, 1, { id: 'booth' });
    L.glass(58, 3, 1, 3, { id: 'booth' }); L.glass(63, 3, 1, 3, { id: 'booth' });
    L.room('Ausfahrt Ost', 90, 2, 8, 6, { floorY: 3.0, outdoor: true, height: 9, floor: 'asphalt', wall: 'concrete_wall', ambient: 0.05, tint: 0xff9050 });

    // ================= Licht =================
    const tube = (x, z, mode = 'steady', mul = 0.8) => L.light(x, z, { kind: Math.abs(x * 7 + z) % 3 === 0 ? 'sodium' : 'tube', mode, mul });
    for (const z of [23.5, 37.5]) for (const x of [12, 20, 28, 36, 43]) tube(x, z, (x + z) % 4 === 0 ? 'broken' : (x === 28 ? 'flicker' : 'steady'), 0.7);
    tube(20, 30.6, 'off'); tube(36, 30.6, 'broken');
    L.light(5, 32, { kind: 'bulb', mode: 'flicker' });
    L.lightsAlong(47, 42, 55, 42, 4, { kind: 'tube', mode: 'flicker', mul: 0.6 });
    for (const z of [23.5, 37.5]) for (const x of [60, 68, 76, 84]) L.light(x, z, { kind: 'tube', mode: 'motion', motionRadius: 6, mul: 0.9 });
    L.light(88, 30.6, { kind: 'sodium', mode: 'broken' });
    L.light(80.5, 45.5, { kind: 'red', mul: 0.6, mode: 'pulse', id: 'shutterLamp' });
    L.light(80.5, 51, { kind: 'bulb', mul: 0.7, mode: 'flicker' });
    L.light(80, 59.5, { kind: 'panel', mul: 0.5, mode: 'broken' });
    L.light(69, 12, { kind: 'tube', mode: 'broken' });
    for (const x of [54, 70, 78]) L.light(x, 4.5, { kind: 'sodium', mul: 0.6, mode: x === 70 ? 'broken' : 'steady' });
    L.light(60.5, 4, { kind: 'panel', mul: 0.45, mode: 'flicker', speed: 0.3 });
    L.light(93, 4.5, { kind: 'fire', y: 4.2, range: 11 });
    L.light(86, 2, { kind: 'red', mode: 'strobe', mul: 0.5 });

    // ================= Requisiten =================
    // Ebene −3: Säulen
    for (const x of [16, 24, 32, 40]) { L.prop('pillar', x, 30.6, { label: '−3' }); }
    for (const x of [16, 32]) { L.prop('pillar', x, 22.2, { label: '−3', band: 0x2a6ab0 }); L.prop('pillar', x, 39.2, { label: '−3', band: 0x2a6ab0 }); }
    carRow(L, [10.5, 13.1, null, 18.6, 21.2, null, 26.6, 29.2, null, 34.6, 37.2, null, 42.4], 18.6, PI, { alarms: [4], vans: [7] });
    carRow(L, [10.5, null, 13.2, 18.6, null, 21.2, 26.6, 29.2, null, 34.6, null, 42.4], 28.2, PI, { alarms: [7] });
    carRow(L, [10.5, 13.1, null, 18.6, 21.2, 26.6, null, 29.2, 34.6, 37.2, null, 42.4], 33.0, 0, { alarms: [] });
    carRow(L, [10.5, null, 13.1, 18.6, null, 26.6, 29.2, null, 34.6, 37.2], 44.4, 0, { alarms: [8], vans: [2] });
    L.prop('concrete_barrier', 45.0, 39.1, { w: 2.6 });
    L.prop('cart_shop', 23.3, 25.5, { rot: 0.7 });
    L.prop('cone', 44, 40.4); L.prop('cone', 44.2, 44.4);
    L.prop('label', 7.97, 27, { text: 'EBENE −3', w: 1.6, h: 0.5, y: 1.9, rot: PI / 2, bg: '#1a1a1a', fg: '#e8c040' });
    L.prop('label', 44.97, 42, { text: 'AUSFAHRT ↑', w: 1.4, h: 0.35, y: 2.2, rot: -PI / 2, bg: '#1a1a1a', fg: '#e8c040' });
    L.prop('fire_ext', 8.5, 40.02, { rot: 0 });
    L.prop('body', 25.5, 37.2, { cloth: 'fabric_dark', rot: 2 });
    L.prop('boxes', 9.2, 46.0, { n: 3 });
    // Ebene −2
    for (const x of [64, 72, 80, 88]) L.prop('pillar', x, 30.6, { label: '−2', band: 0xb04a2a });
    for (const x of [64, 80]) { L.prop('pillar', x, 22.2, { label: '−2', band: 0xb04a2a }); }
    L.prop('pillar', 76.4, 41.6, { label: '17', band: 0xb04a2a });
    carRow(L, [59.4, null, 64.6, 67.2, null, 72.4, 75.0, null, 80.2, 82.8, null, 88.0], 18.6, PI, { y: 1.5, alarms: [5] });
    carRow(L, [59.4, 62.0, null, 67.2, 69.8, null, 75.0, 77.6, null, 82.8, 85.4], 28.2, PI, { y: 1.5, alarms: [4], vans: [1] });
    carRow(L, [59.4, null, 64.6, 67.2, null, null, null, 77.6, 80.2, null, 85.4, 88.0], 33.0, 0, { y: 1.5, alarms: [7] });
    carRow(L, [59.4, 62.0, null, 67.2, 69.8, null, null, 82.8, null, 88.0], 44.4, 0, { y: 1.5, alarms: [1] });
    L.prop('car', 75.0, 44.4, { rot: 0, y: 1.5, color: 0x7d8288, plate: 'VH-SY 17', id: 'samicar', prompt: 'Grauen Kombi durchsuchen' });
    L.prop('concrete_barrier', 72.5, 38.4, { w: 2.4, rot: PI / 2 });
    L.prop('concrete_barrier', 84.5, 25.0, { w: 2.4, rot: 0.3 });
    L.prop('cone', 79.2, 46.2); L.prop('cone', 81.8, 46.3);
    L.prop('label', 80.5, 46.97, { text: 'U-BAHN · VERBINDUNGSGANG', w: 2.6, h: 0.35, y: 2.3, rot: PI, bg: '#14365c', fg: '#ffffff', glow: true });
    L.prop('label', 89.97, 26, { text: 'EBENE −2', w: 1.6, h: 0.5, y: 1.9, rot: -PI / 2, bg: '#1a1a1a', fg: '#e8c040' });
    L.prop('body', 85.6, 37.6, { cloth: 'fabric_dark', rot: 0.5 });
    L.prop('cart_shop', 61.5, 39.5, { rot: 2 });
    // Ebene −1 + Kassenhäuschen
    L.prop('desk', 60.5, 3.3, { w: 2.6, d: 0.6, rot: 0, screen: 'text', screenOpts: { text: 'ROLLTOR U-BAHN\nSTATUS: AUS\nSTROM: BEREIT', color: '#ffd070' }, chair: false });
    L.prop('chair', 61.5, 4.4, { rot: 2.6 });
    L.prop('shelf', 59.2, 5.4, { w: 1.2, rot: PI / 2, h: 1.6 });
    L.prop('gate_arm', 84, 6.5, { len: 3, up: false, y: 3.0 });
    L.prop('ticket_machine', 82.6, 7.6, { y: 3.0, off: true });
    carRow(L, [52.5, 55.1, null, 66.0, 68.6, null, 74.2, null, 79.4], 3.3, PI, { y: 3.0, alarms: [4] });
    L.prop('car', 91.5, 3.6, { rot: 0.8, y: 3.0, burnt: true, vault: false });
    L.prop('car', 95.2, 6.3, { rot: -0.4, y: 3.0, burnt: true });
    L.prop('debris', 93.5, 6.3, { w: 2.2, rot: 0.3, y: 3.0 });
    L.prop('label', 89.97, 5, { text: 'AUSFAHRT OST – GESPERRT', w: 2.4, h: 0.35, y: 2.2, rot: -PI / 2, bg: '#a01818', fg: '#fff' });

    // ================= Decals =================
    L.decal('blood_pool', 25.4, 37.6, { size: 1.8 }); L.decal('blood_trail', 22, 37.4, { size: 3 });
    L.decal('blood_smear', 42, 38.8, { size: 1.4 });
    L.decal('blood_hand', 65.4, 26.0, { size: 0.5 });
    L.decal('blood_pool', 85.4, 37.8, { size: 1.6 });
    L.decal('blood_trail', 80.4, 40, { size: 3, rot: PI / 2 });
    L.decal('paper', 61, 5.2);

    // ================= Gegenstände =================
    L.item('doc', 13.1, 21.0, { id: 'doc_zettel', doc: 'c3_zettel', h: 1.0, rot: 0.1 });
    L.item('bandage', 9.0, 45.4, { id: 'b_l3', h: 0.9 });
    L.item('can', 30.2, 39.6, { id: 'can_l3', h: 0.02 });
    L.item('ammo', 26.1, 37.7, { id: 'ammo3_a', h: 0.03, rounds: 12 });
    L.item('ammo', 59.3, 4.6, { id: 'ammo3_b', h: 1.2, rounds: 13 });
    L.item('pills', 42.2, 20.7, { id: 'p_l3', h: 0.02, extra: true });
    L.item('medkit', 88.6, 39.4, { id: 'mk_l2', h: 0.02, notHard: true });
    L.item('bottle', 70.6, 24, { id: 'bottle_l2', h: 0.02 });
    L.item('doc', 61.2, 3.4, { id: 'doc_funk', doc: 'c3_funk', h: 0.78 });
    L.item('doc', 56.5, 8.4, { id: 'doc_aushang3', doc: 'c3_aushang', h: 0.02, rot: 0 });
    L.item('bandage', 59.3, 5.4, { id: 'b_booth', h: 1.2, notHard: true });
    // Zusätzliche Fundstücke am Wegesrand (liegen am Boden an der Wand und leuchten auf)
    L.item('ammo', 8.23, 38.5, { id: 'ammo_x0', h: 0.03, rounds: 10 });
    L.item('bandage', 77.5, 46.77, { id: 'band_x1', h: 0.03 });
    L.item('ammo', 65.5, 8.77, { id: 'ammo_x2', h: 0.03, rounds: 10 });
    L.item('bandage', 81.77, 50.5, { id: 'band_x3', h: 0.03, notHard: true });
    L.interact('booth_console', 60.5, 3.9, { prompt: 'Strom auf das Rolltor geben', y: 4.0, enabled: (g) => !!g.state.flags.ilyas_joined && !g.state.flags.power3 });

    // ================= Gegner =================
    L.zombie(19.6, 25.6, { id: 'z3a', type: 'sleeper', pose: 'lying', yaw: 1.2, outfit: 'civilian' });
    L.zombie(31.6, 43.0, { id: 'z3b', type: 'stalker', yaw: 0, outfit: 'security', stalker: true });
    L.zombie(12, 37.5, { id: 'z3c', type: 'wanderer', outfit: 'civilian2', patrol: [[12, 37.5], [42, 37.5], [42, 24], [12, 24]] });
    L.zombie(62.4, 24.6, { id: 'z2a', type: 'sleeper', pose: 'lying', yaw: 2.2, outfit: 'civilian' });
    L.zombie(78.4, 24.2, { id: 'z2b', type: 'sleeper', pose: 'sitting', yaw: PI, outfit: 'suit' });
    L.zombie(85.0, 38.4, { id: 'z2c', type: 'sleeper', pose: 'kneel', yaw: -2.5, outfit: 'civilian2', wake: 3 });
    L.zombie(60, 37.5, { id: 'z2d', type: 'wanderer', outfit: 'scrubs', patrol: [[60, 37.5], [88, 37.5], [88, 37.5], [60, 37.5]] });

    // ================= Auslöser =================
    L.trigger('l3', 8, 16, 10, 31);
    L.trigger('ramp1', 50, 40, 4, 5);
    L.trigger('l2', 57, 16, 6, 31, { yMin: 1.2 });
    L.trigger('trapcar', 63.5, 24.5, 4, 2.5, { yMin: 1.2 });
    L.trigger('carslam', 26, 34.5, 6, 3);
    L.trigger('ramp2', 66, 9, 6, 4);
    L.trigger('booth_near', 54, 1, 14, 8, { yMin: 2.5 });
    L.trigger('passage', 79, 48, 3, 4, { yMin: 1.0 });
    L.trigger('exit', 78, 58, 5, 3);
    L.checkpoint('start', 5, 31.5, -PI / 2);
    L.checkpoint('l2', 58.2, 40.4, -PI / 2);
    L.checkpoint('l1', 68.8, 8, 0);
    L.checkpoint('booth', 60.5, 7.5, PI);
  },

  ambience(g) {
    g.audio.loop('amb', 'garage_loop', { vol: 0.42, bus: 'amb', reverb: false });
  },

  onLoad(c, info) {
    const g = c.g;
    if (!info.restored) c.setClock('05:02');
    // Mine folgt
    if (!c.npc('mine')) c.addNpc('mine', 6.5, 31.5, { mode: 'follow' });
    // İlyas im Häuschen
    if (!c.get('ilyas_joined')) { const n = c.addNpc('ilyas', 61.6, 4.6, { mode: 'idle', yaw: PI }); n.forceCrouch = true; }
    else if (!c.npc('ilyas')) c.addNpc('ilyas', g.player.pos.x + 1, g.player.pos.z + 1, { mode: 'follow' });
    // Eingeschlossener im Auto (Deko)
    g.level._trap = g.decor({ x: 65.0, z: 28.6, yaw: PI, pose: 'sitting', outfit: 'civilian', skin: 'zombie2', hair: 0x2a2a2a, hairStyle: 'short' });
    g.level._trap.root.position.y = 1.5 + 0.38;
    if (c.get('power3')) { const d = c.door('shutter'); if (d) { d.setLocked(false); d.amount = d.target = 1; d._place(); d._applyFlags(); } }
    void g;
  },

  update(c, dt) {
    const t = c.g.level._trap;
    if (t && t._anim > 0) { t._anim -= dt; t.mode = 'bash'; t.poseBlend = 0.45; t.update(dt); if (t._anim <= 0) { t.mode = 'idle'; t.poseBlend = 1; t.update(0.05); } }
  },

  script: [
    {
      id: 'c3_start', when: 'start', if: (c) => !c.get('c3_started'), do: async (c) => {
        c.flag('c3_started');
        c.objective('Durchquere das Parkhaus. Finde einen Weg nach draußen.');
        await c.wait(3);
        c.msg('unknown', 'UNBEKANNT', 'Manche Autos sind scharf geschaltet. Renn nicht an ihnen vorbei.');
        await c.wait(4);
        await c.lines([{ s: 'mine', t: 'Wenn wir oben rauskommen … die Straße. Vielleicht ein Kontrollpunkt.', v: 'm3_a' }]);
      },
    },
    {
      id: 'c3_carslam', when: 'enter:carslam', do: async (c) => {
        c.sound('door_close', [24, 1, 44.5], { vol: 1, rate: 0.8 });
        c.shake(0.15);
        await c.wait(1.2);
        c.say('sami', 'Eine Autotür … da hinten.', { d: 2.2 });
        c.noise(24, 44.5, 6, 'event');
      },
    },
    {
      id: 'c3_ramp1', when: 'enter:ramp1', do: async (c) => { c.checkpoint('l2'); },
    },
    {
      id: 'c3_l2', when: 'enter:l2', do: async (c) => {
        await c.wait(2);
        c.msg('unknown', 'UNBEKANNT', 'Ebene minus zwei, Stellplatz 17. Grauer Kombi. Der Schlüssel liegt auf dem linken Hinterreifen.');
        c.objective('Ebene −2: Stellplatz 17 (optional). Weiter über die Rampe nach −1.');
        await c.wait(3);
        await c.lines([{ s: 'mine', t: 'Stellplatz 17 … Sami, das ist dein Platz. Woher weiß er das?', v: 'm3_b' }]);
      },
    },
    {
      id: 'c3_trap', when: 'enter:trapcar', do: async (c) => {
        const t = c.g.level._trap;
        c.sound('door_bash', [65.0, 2.5, 28.6], { vol: 1 });
        c.sound('glass_break', [65.0, 2.5, 28.6], { vol: 0.4, rate: 1.4 });
        c.g.audio.zombie('attack', { x: 65, y: 2.6, z: 28.6 }, 1);
        c.shake(0.35);
        if (t) t._anim = 2.4;
        c.noise(65, 28.6, 9, 'event');
      },
    },
    {
      id: 'c3_samicar', when: 'interact:samicar', do: async (c) => {
        const g = c.g;
        c.sound('unlock', [75, 2.5, 44.4]);
        await c.wait(0.6);
        c.photo('mine_sami', 'Handschuhfach: Mine und ich');
        c.photo('badge', 'Mitarbeiterausweis NEXARA – S. Yıldız');
        await c.doc('c3_ticket');
        const frag = { title: 'Aufnahme 3/5 – „Mine“', lines: FRAG3 };
        g.state.fragments.add('frag3'); c.flag('frag:frag3');
        c.voiceMemo('frag3', frag.title, frag.lines, { fragment: true, from: 'Diktiergerät' });
        g.hud.pickup('Aufnahme ' + g.state.fragments.size + '/5 gefunden');
        await c.lines(FRAG3, { channel: 'memo' });
        c.fact('In meinem Auto: ein Foto von Mine und mir. Wir wollten heiraten.');
        const m = c.npc('mine');
        if (m && Math.hypot(m.pos.x - g.player.pos.x, m.pos.z - g.player.pos.z) < 9) {
          await c.lines([
            { s: 'sami', t: 'Mine. Das Foto. Wir zwei.' },
            { s: 'mine', t: 'Ja. Wir … wir sind verlobt. Ich wollte es dir sagen.', v: 'm3_c' },
            { s: 'mine', t: 'Aber du hast mich angesehen wie eine Fremde. Wie hätte ich dir das erklären sollen?', v: 'm3_d' },
          ]);
          c.flag('mine_engaged');
        }
      },
    },
    {
      id: 'c3_ramp2', when: 'enter:ramp2', do: async (c) => {
        c.checkpoint('l1');
        await c.wait(2);
        c.voiceMemo('vm_c3', 'Sprachnachricht · UNBEKANNT', [{ s: 'unknown', t: 'Minus eins. Im Kassenhäuschen sitzt ein Mann. Er kennt den Weg unter die Stadt. Hör ihm zu – aber gib ihm nichts.', v: 'c3_vm' }], { from: 'UNBEKANNT' });
        c.msg('unknown', 'UNBEKANNT', '🎤 Sprachnachricht (0:07) – Telefon › Sprachmemos');
        c.objective('Ebene −1: Kassenhäuschen.');
      },
    },
    {
      id: 'c3_ilyas', when: 'enter:booth_near', do: async (c) => {
        const g = c.g, il = c.npc('ilyas');
        if (il) { il.forceCrouch = false; }
        await c.lines([
          { s: 'ilyas', t: 'Stehen bleiben! Keinen Schritt weiter! Seid ihr gebissen?', v: 'i3_a' },
          { s: 'sami', t: 'Nein. Wir wollen nur hier raus.' },
          { s: 'ilyas', t: 'Aksoy. Ich kenne dich. Arendts Ärztin. Eine von denen.', v: 'i3_b' },
          { s: 'mine', t: 'Und du bist der Techniker. Demir. Du hattest Dienst in der Nacht, oder?', v: 'm3_e' },
          { s: 'ilyas', t: '… Was willst du damit sagen?', v: 'i3_c' },
          { s: 'sami', t: 'Hört auf. Bitte. Wer bist du?' },
          { s: 'ilyas', t: 'İlyas. Haustechnik. Ich kenne jede Leitung in diesem verdammten Gebäude.', v: 'i3_d' },
          { s: 'ilyas', t: 'Die Straße könnt ihr vergessen. Draußen schießen sie auf alles, was sich bewegt.', v: 'i3_e' },
          { s: 'ilyas', t: 'Unter uns liegt die U-Bahn. Verbindungsgang auf minus zwei. Das Rolltor braucht Strom – den kann ich von hier geben.', v: 'i3_f' },
          { s: 'ilyas', t: 'Aber das Horn hören sie bis auf die Straße. Alle.', v: 'i3_g' },
        ]);
        c.sound('unlock', [60.5, 4, 6]);
        c.unlock('d_booth'); c.open('d_booth');
        c.flag('ilyas_joined');
        if (il) il.stay();
        c.objective('Gib Strom auf das Rolltor (Pult im Kassenhäuschen). Dann lauf.');
        c.checkpoint('booth');
        await c.wait(4);
        c.msg('unknown', 'UNBEKANNT', 'Trau niemandem, der etwas verkaufen will.');
        await c.wait(2);
        await c.lines([
          { s: 'ilyas', t: 'Wer schreibt dir da?', v: 'i3_h' },
          { s: 'sami', t: 'Jemand, der den Weg kennt.' },
          { s: 'ilyas', t: '… Hm.', v: 'i3_i' },
        ]);
      },
    },
    {
      id: 'c3_power', when: 'interact:booth_console', do: async (c) => {
        const g = c.g;
        c.flag('power3');
        c.sound('power_on', [60.5, 4, 3.5], { vol: 0.9 });
        await c.wait(0.8);
        c.loop('horn', 'klaxon', [80.5, 3.8, 46.5], { vol: 0.9, bus: 'sfx', ref: 6, rolloff: 0.6 });
        c.noise(80, 44, 40, 'alarm'); c.noise(70, 5, 40, 'alarm');
        const d = c.door('shutter'); d.setLocked(false); d.open(null, { force: true }); d.speed = 0.13;
        g.level.lights.byId('shutterLamp').color.setHex(0xffb020);
        await c.lines([{ s: 'ilyas', t: 'Das Tor geht hoch. Lauft! Runter auf minus zwei – Südseite!', v: 'i3_j' }]);
        for (const n of g.npcs) n.follow();
        c.objective('Lauf zum Rolltor auf Ebene −2 (Süd)!');
        const t = g.difficulty.chaseTime;
        await c.wait(1.5 * t);
        const spawn = (x, z, o) => { const s = c.spawn({ x, z, type: 'hunter', ...o }); s.forceChase(); return s; };
        spawn(93.5, 3.5, { outfit: 'civilian' }); spawn(94.5, 5.5, { outfit: 'soldier' });
        await c.wait(1.2 * t);
        spawn(92.5, 6.4, { outfit: 'civilian2' }); spawn(95.6, 4.2, { outfit: 'suit' });
        c.wake('z2b'); c.wake('z2c');
        await c.wait(2 * t);
        spawn(94.0, 2.8, { outfit: 'civilian' }); spawn(96, 6.5, { outfit: 'security' });
      },
    },
    {
      id: 'c3_passage', when: 'enter:passage', do: async (c) => {
        const g = c.g;
        for (const n of g.npcs) if (n.pos.z < 47.5) { n.teleport(80.5, 49.6 + (n.id === 'mine' ? 0.6 : 1.4)); n.follow(); }
        await c.lines([{ s: 'ilyas', t: 'Runter! Ich zieh die Notentriegelung!', v: 'i3_k' }]);
        const d = c.door('shutter'); d.crushing = true; d.close({ force: true }); d.speed = 0.9; d.setLocked(true);
        c.stopLoop('horn', 0.3);
        await c.wait(1.5);
        c.sound('door_bash', [80.5, 2.4, 47], { vol: 1 });
        c.shake(0.3);
      },
    },
    {
      id: 'c3_exit', when: 'enter:exit', do: async (c) => {
        await c.lines([{ s: 'mine', t: 'Sie hören nicht auf …', v: 'm3_f' }, { s: 'ilyas', t: 'Das Tor hält. Eine Weile.', v: 'i3_l' }]);
        c.setClock('05:21');
        await c.endChapter('ch4');
      },
    },
  ],
};

const FRAG3 = [
  { s: 'fragment', t: 'Wenn du mein Auto gefunden hast, weißt du jetzt, wie wir aussehen. Mine und ich.', v: 'f3_a' },
  { s: 'fragment', t: 'Wir wollten im Frühjahr heiraten. Klingt lächerlich, hier unten.', v: 'f3_b' },
  { s: 'fragment', t: 'Sie wird dich vielleicht anlügen, um dich zu schützen. Vielleicht hat sie einen Auftrag. Lass sie. Am Ende entscheidet sie richtig.', v: 'f3_c' },
  { s: 'fragment', t: 'Ich habe ihr nichts von meinem Plan erzählt. Sie hätte mich aufgehalten. Zu Recht.', v: 'f3_d' },
];
