// KAPITEL 4, TEIL 2 – DIE LINDEN-PASSAGE
// Der Notausstieg der Station Marktplatz endet in der Einkaufspassage unter der Lindenstraße.
// Hauptgang verschüttet -> durch das Modegeschäft (Schaufensterpuppen – nicht alle aus Plastik),
// Fernsehwand mit Nachrichten (NEXARA beschuldigt İlyas), Drogerie (Heilmittel, Suchplakat),
// Mines Telefon, Frischmarkt voller Infizierter (Ablenkung mit Würfen), Anlieferung: Rolltor -> Lindenstraße.
const PI = Math.PI;

// Schaufensterpuppen [x, z, yaw, outfit]
const DUMMIES = [
  [25.0, 15.8, PI, 'mannequin'], [27.6, 15.8, PI + 0.3, 'mannequin2'], [30.2, 15.8, PI - 0.2, 'mannequin3'], [34.0, 15.8, PI, 'mannequin'],
  [23.0, 12.0, 1.2, 'mannequin2'], [26.5, 10.2, 0.4, 'mannequin3'], [29.2, 12.8, -0.8, 'mannequin'], [31.6, 9.4, 0.2, 'mannequin2'],
  [33.6, 12.6, 2.4, 'mannequin3'], [36.6, 9.8, -1.0, 'mannequin'], [35.4, 14.2, 2.9, 'mannequin2'], [21.4, 9.0, 0.8, 'mannequin3'],
];

export default {
  id: 'ch4b', startFlag: 'c4b_started', name: 'Die U-Bahn', part: true, partName: 'Linden-Passage',
  tagline: 'Linden-Passage · Ebene −1 · Frischmarkt',
  w: 80, h: 36,
  opts: { floor: 's_floor', wall: 'plaster', ceil: 'h_ceil', height: 4.0 },
  env: { fog: 0x06070a, fogDensity: 0.05, hemi: 0.025, exposure: 1.05, tint: 0xf0ece4, reverb: [2.4, 2.0], reverbMix: 0.4, sleeve: 0x8fb0c4 },

  build(L) {
    // ---------- Räume ----------
    L.room('Betriebsgang', 3, 19, 6, 4, { floor: 'concrete', wall: 'concrete_wall', ceil: 'concrete', height: 3 });
    L.door(9, 20, { id: 'd_service', kind: 'metal' });
    L.room('Linden-Passage', 10, 18, 42, 7);
    L.solid(32, 18, 1, 7); // eingestürzter Abschnitt des Hauptgangs
    L.room('Café Linde', 12, 26, 9, 6, { floor: 'wood', wall: 'brick' });
    L.door2(15, 25, { id: 'd_cafe', open: true });
    L.glass(12, 25, 3, 1, { id: 'cafe_a' }); L.glass(17, 25, 4, 1, { id: 'cafe_b' });
    L.room('Mode Krüger', 20, 8, 19, 9, { floor: 'wood_light', wall: 'plaster' });
    L.door2(22, 17, { id: 'd_mode_w', open: true });
    L.glass(24, 17, 8, 1, { id: 'mode_win_a' }); L.glass(33, 17, 3, 1, { id: 'mode_win_b' });
    L.door2(36, 17, { id: 'd_mode_e', open: true });
    L.room('Drogerie', 40, 10, 10, 7, { floor: 'h_floor2', wall: 'h_tile_wall' });
    L.door2(42, 17, { id: 'd_drog', open: true });
    L.glass(44, 17, 6, 1, { id: 'drog_win' });
    L.room('Elektro Max', 40, 26, 10, 6, { floor: 'h_floor', wall: 'plaster' });
    L.glass(40, 25, 10, 1, { id: 'elektro_win' });
    L.room('Frischmarkt', 53, 6, 16, 26, { floor: 'h_floor', wall: 'h_tile_wall', height: 4.2 });
    L.door2(52, 20, { id: 'd_markt', kind: 'slide', open: true });
    L.glass(52, 18, 1, 2, { id: 'markt_a' }); L.glass(52, 22, 1, 3, { id: 'markt_b' });
    L.room('Anlieferung', 70, 7, 8, 8, { floor: 'concrete_floor', wall: 'concrete_wall', ceil: 'concrete', height: 4.5 });
    L.door(69, 10, { id: 'd_anl', kind: 'metal', strength: 9 });
    L.room('Rampe Lindenstraße', 72, 1, 2, 5, { floor: 'asphalt', wall: 'concrete_wall', outdoor: true, height: 6, ambient: 0.12, tint: 0x7a8ac0, wet: true });
    L.ramp(72, 1, 2, 5, '-z', 0, 1.6, { mat: 'concrete' });
    L.door2(72, 6, { id: 'gate', kind: 'shutter', locked: true, lockedText: 'Rolltor – öffnet nur über den Motorschalter' });

    // ================= Licht =================
    L.light(5.5, 20.5, { kind: 'bulb', mul: 0.6, mode: 'flicker' });
    // Passage: Notbeleuchtung, einzelne Paneele
    L.lightsAlong(13, 21, 30, 21, 5.5, (i) => ({ kind: 'panel', mode: i === 1 ? 'broken' : i === 2 ? 'flicker' : 'steady', mul: 0.55, group: 'mall' }));
    L.lightsAlong(35, 21, 50, 21, 5, (i) => ({ kind: 'panel', mode: i === 1 ? 'flicker' : 'steady', mul: 0.5, group: 'mall' }));
    for (const x of [11, 28, 38, 50]) L.light(x, 18.3, { kind: 'emergency', group: 'emerg' });
    L.light(16.5, 28.5, { kind: 'bulb', mul: 0.6, mode: 'flicker', speed: 0.4 });
    // Modegeschäft: Schaufensterspots, innen fast dunkel
    for (const x of [26, 32]) L.light(x, 15.6, { kind: 'bulb', mul: 0.8 });
    L.light(28.5, 11, { kind: 'panel_warm', mul: 0.35, mode: 'flicker', speed: 0.3 });
    L.light(36.5, 12, { kind: 'panel_warm', mode: 'off' });
    // Drogerie
    L.light(44.5, 13, { kind: 'panel', mul: 0.5, mode: 'flicker' });
    // Elektro (Fernseher leuchten selbst)
    L.light(45, 29, { kind: 'panel', mode: 'off' });
    // Frischmarkt: nur einige Röhren
    for (const [x, z, m] of [[57, 10, 'steady'], [63, 10, 'broken'], [57, 18, 'flicker'], [63, 19.5, 'steady'], [57, 27, 'off'], [63, 27, 'flicker'], [67, 14, 'steady'], [55, 21, 'steady']]) L.light(x, z, { kind: 'tube', mode: m, mul: 0.55, group: 'markt' });
    // Anlieferung + Rampe
    L.light(73.5, 11, { kind: 'sodium', mul: 0.6 });
    L.light(76, 8, { kind: 'red', mul: 0.6, id: 'gate_lamp', mode: 'off' });
    L.light(73, 2.5, { kind: 'street', mul: 0.5 });

    // ================= Requisiten =================
    // Betriebsgang
    L.sign('NOTAUSSTIEG U-BAHN ↓', 3.03, 20.5, { w: 1.4, h: 0.26, y: 2.3, face: 'w', bg: '#0d8a44', fg: '#fff' });
    L.prop('boxes', 7.5, 22.3, { n: 2 });
    L.prop('pipe', 6, 19.2, { len: 6, y: 2.6, r: 0.08, rot: PI / 2 });
    // Passage
    L.prop('shopfront', 29, 17.94, { text: 'MODE KRÜGER', w: 6, bg: '#202020' });
    L.prop('shopfront', 45, 17.94, { text: 'DROGERIE', w: 4, bg: '#6a1a5a' });
    L.prop('shopfront', 16.5, 25.06, { rot: PI, text: 'CAFÉ LINDE', w: 4, bg: '#4a2a1a' });
    L.prop('shopfront', 45, 25.06, { rot: PI, text: 'ELEKTRO MAX', w: 5, bg: '#103a8a' });
    L.prop('shopfront', 51.94, 21, { rot: -PI / 2, text: 'FRISCHMARKT', w: 6, bg: '#1a6a2a' });
    L.prop('bench', 14, 21, { w: 2.0, rot: PI / 2 });
    L.prop('plant', 11, 23.6, {});
    L.prop('plant', 21, 18.5, {});
    L.prop('bin', 25, 23.6, {});
    L.prop('kiosk', 27.5, 21.5, { text: 'ZEITUNGEN · LOTTO' });
    L.prop('debris', 31.2, 19.5, { w: 1.8, pipe: true, rot: 0.3 });
    L.prop('debris', 31.2, 22.6, { w: 1.8, rot: -0.2 });
    L.prop('barricade', 30.4, 21.0, { w: 2.2, rot: PI / 2 });
    L.sign('GESPERRT – EINSTURZGEFAHR', 31.97, 21.0, { w: 2.0, h: 0.3, y: 1.6, face: 'e', bg: '#ffd400', fg: '#111' });
    L.prop('bench', 40, 21, { w: 2.0, rot: PI / 2 });
    L.prop('plant', 47.5, 18.5, {});
    L.prop('cart_shop', 48.5, 22.6, { rot: 0.6 });
    L.prop('cart_shop', 50.2, 19.2, { rot: 2.1 });
    L.prop('bin', 39, 23.6, {});
    L.prop('poster', 10.03, 21, { rot: PI / 2, text: 'LINDEN-\nPASSAGE\n\nÖffnungszeiten\n9–20 Uhr', bg: '#1a3a5a', fg: '#ffffff' });
    // Café
    for (const [x, z] of [[13.5, 27.5], [16.5, 27.5], [13.5, 30], [16.5, 30.2]]) { L.prop('desk', x, z, { w: 0.8, d: 0.8, monitor: false, chair: false, mat: 'wood' }); L.prop('chair', x - 0.6, z + 0.1, { rot: PI / 2 }); }
    L.prop('counter', 19.4, 28.5, { w: 3.0, d: 0.7, rot: -PI / 2 });
    L.prop('vending', 20.4, 30.9, { rot: PI, off: true });
    // Modegeschäft
    for (const [x, z, r] of [[23.5, 10.5, 0], [27.2, 14.2, 0], [32.2, 13.6, 0.1], [35.6, 11.6, PI / 2], [28.4, 9.0, 0], [24.6, 13.6, PI / 2], [30.6, 11.2, PI / 2]]) L.prop('rack', x, z, { w: 1.6, rot: r });
    L.prop('counter', 37.4, 15.0, { w: 2.2, d: 0.7, rot: -PI / 2 });
    L.prop('curtain', 20.9, 13.5, { rot: PI / 2, w: 1.6 });
    L.prop('curtain', 20.9, 11.4, { rot: PI / 2, w: 1.6 });
    for (const [x, z] of DUMMIES) L.prop('mannequin_base', x, z, {});
    L.prop('mannequin_base', 30.6, 14.6, {});
    L.prop('poster', 38.97, 11.5, { rot: -PI / 2, text: 'HERBST\n−30 %', bg: '#ffffff', fg: '#c01010' });
    // Drogerie
    L.prop('shelf', 41.2, 12.8, { rot: PI / 2, w: 2.6, d: 0.5 });
    L.prop('shelf', 44.0, 12.5, { rot: PI / 2, w: 2.6, d: 0.5 });
    L.prop('shelf', 47.0, 12.5, { rot: PI / 2, w: 2.6, d: 0.5 });
    L.prop('counter', 48.0, 15.6, { w: 2.0, d: 0.7 });
    L.prop('boxes', 49.3, 10.6, { n: 2 });
    // Elektro: Fernsehwand im Schaufenster
    for (const [x, y] of [[41.5, 1.3], [43.0, 1.3], [44.5, 1.3], [46.0, 1.3], [47.5, 1.3], [42.2, 2.1], [43.7, 2.1], [45.2, 2.1], [46.7, 2.1]]) L.prop('tv', x, 26.2, { rot: PI, y, text: '+++ EILMELDUNG +++\nNEXARA: SABOTAGE\nTECHNIKER GESUCHT' });
    L.prop('shelf', 45, 30.6, { w: 4.0, d: 0.5 });
    L.prop('boxes', 41.0, 30.6, { n: 3 });
    // Frischmarkt
    for (const x of [58.5, 61.5, 64.5]) {
      L.prop('market_shelf', x, 10.5, { rot: PI / 2, w: 5, text: x === 58.5 ? 'GETRÄNKE' : x === 61.5 ? 'KONSERVEN' : 'BACKWAREN' });
      L.prop('market_shelf', x, 16.0, { rot: PI / 2, w: 5, empty: 0.6 });
      L.prop('market_shelf', x, 23.5, { rot: PI / 2, w: 5, text: 'HAUSHALT' });
      L.prop('market_shelf', x, 28.5, { rot: PI / 2, w: 3, empty: 0.5 });
    }
    L.prop('counter', 55.2, 17.2, { w: 2.4, d: 0.7, monitors: 1 });
    L.prop('counter', 55.2, 24.2, { w: 2.4, d: 0.7, monitors: 1 });
    for (const z of [14, 16, 18, 22, 24, 26, 28]) L.prop('freezer', 68.4, z, { rot: -PI / 2, alarm: z === 22 });
    L.prop('boxes', 56, 7.0, { n: 4 });
    L.prop('boxes', 61, 7.0, { n: 3 });
    L.prop('cart_shop', 54.5, 12.0, { rot: 0.4 });
    L.prop('cart_shop', 60.0, 19.8, { rot: 1.6 });
    L.prop('cart_shop', 66.5, 30.4, { rot: -0.6 });
    L.prop('body', 62.8, 20.6, { cloth: 'fabric_dark', rot: 1.8 });
    L.sign('ANLIEFERUNG · NUR PERSONAL', 68.97, 10.0, { w: 1.6, h: 0.26, y: 2.6, face: 'e', bg: '#e9ecef' });
    // Anlieferung
    L.prop('crate', 75.5, 12.6, {});
    L.prop('crate', 76.6, 9.8, { rot: PI / 2 });
    L.prop('barrels', 71.0, 13.6, { n: 3, mat: 'plastic_blue' });
    L.prop('boxes', 74.0, 13.8, { n: 4 });
    L.prop('label', 74.5, 7.02, { text: 'ROLLTOR · MOTOR', w: 0.8, h: 0.18, y: 1.9 });

    // ================= Decals =================
    L.decal('blood_trail', 20, 21.5, { size: 3, rot: PI / 2 });
    L.decal('blood_pool', 33.5, 13.2, { size: 1.2 });
    L.decal('paper', 27.0, 20.5); L.decal('paper', 28.3, 22.4); L.decal('paper', 44.8, 20.8);
    L.decal('blood_splat', 46, 13.5, { size: 1.2 });
    L.decal('blood_pool', 62.8, 21.2, { size: 2.0 });
    L.decal('blood_smear', 52.6, 20.8, { size: 1.2 });
    L.decal('blood_hand', 69.02, 11.0, { wall: 'w', y: 1.2, size: 0.4 });

    // ================= Gegenstände & Dokumente =================
    L.item('bottle', 19.3, 28.0, { id: 'b4b_cafe', h: 1.08 });
    L.item('can', 37.4, 15.2, { id: 'c4b_mode', h: 1.08 });
    L.item('medkit', 48.0, 15.6, { id: 'mk4b_drog', h: 1.08, notHard: true });
    L.item('bandage', 44.0, 12.5, { id: 'b4b_drog1', h: 1.0 });
    L.item('bandage', 47.0, 12.0, { id: 'b4b_drog2', h: 0.6, extra: true });
    L.item('pills', 41.2, 13.4, { id: 'p4b_drog', h: 1.25 });
    L.item('doc', 48.6, 15.4, { id: 'doc_notiz', doc: 'c4b_notiz', h: 1.08 });
    L.item('bottle', 55.2, 17.2, { id: 'b4b_m1', h: 1.08 });
    L.item('bottle', 55.2, 24.2, { id: 'b4b_m2', h: 1.08 });
    L.item('can', 54.5, 9.0, { id: 'c4b_m3', h: 0.05 });
    L.item('bottle', 57.0, 7.0, { id: 'b4b_m4', h: 0.9 });
    L.item('can', 60.0, 13.4, { id: 'c4b_m5', h: 0.05 });
    L.item('bottle', 66.4, 20.4, { id: 'b4b_m6', h: 0.05 });
    L.item('ammo', 19.4, 29.3, { id: 'ammo4b_a', h: 1.08, rounds: 12 });
    L.item('ammo', 75.5, 12.6, { id: 'ammo4b_b', h: 0.82, rounds: 15 });

    L.interact('tv_news', 45, 24.4, { prompt: 'Nachrichten ansehen', y: 1.6, radius: 2.2, repeat: true, mesh: null });
    L.interact('gate_btn', 74.5, 7.1, { prompt: 'Rolltor öffnen (gedrückt halten)', y: 1.35, radius: 1.3, mesh: 'panel', rot: 0, hold: 1.5, enabled: (g) => !g.state.flags.gate_started });

    // ================= Gegner =================
    L.zombie(18, 22.5, { id: 'zp_w', type: 'wanderer', outfit: 'civilian2', patrol: [[24, 22.8], [14, 22.8], [14, 20.6], [24, 20.6]] });
    L.zombie(14.4, 28.6, { id: 'zp_cafe1', type: 'sleeper', pose: 'sitting', yaw: -PI / 2, outfit: 'civilian', wake: 3 });
    L.zombie(18.0, 30.6, { id: 'zp_cafe2', type: 'sleeper', pose: 'lying', yaw: 0.5, outfit: 'suit', wake: 3 });
    L.zombie(28.0, 10.8, { id: 'zm_1', type: 'stalker', stalker: true, yaw: 0.6, outfit: 'civilian' });
    L.zombie(33.4, 10.2, { id: 'zm_2', type: 'stalker', stalker: true, yaw: 1.2, outfit: 'civilian2' });
    L.zombie(25.6, 10.0, { id: 'zm_3', type: 'stalker', stalker: true, yaw: -0.6, outfit: 'suit' });
    L.zombie(30.6, 14.6, { id: 'z_dummy', type: 'hunter', state: 'dormant', wake: 99, yaw: PI - 0.4, outfit: 'mannequin2', skin: 'plastic', hairStyle: 'none' });
    L.zombie(45.6, 11.4, { id: 'zd_1', type: 'sleeper', pose: 'lying', yaw: 1.2, outfit: 'civilian', wake: 3.2 });
    L.zombie(44.5, 23.6, { id: 'zp_st', type: 'stalker', stalker: true, yaw: 0.3, outfit: 'civilian' });
    L.zombie(57.0, 14.0, { id: 's1', type: 'wanderer', outfit: 'civilian', patrol: [[57, 8], [57, 30]] });
    L.zombie(63.0, 26.0, { id: 's2', type: 'wanderer', outfit: 'civilian2', patrol: [[63, 30], [63, 8]] });
    L.zombie(60.0, 19.8, { id: 's3', type: 'shambler', yaw: 0.4, outfit: 'suit' });
    L.zombie(66.8, 11.0, { id: 's4', type: 'shambler', yaw: PI / 2, outfit: 'civilian' });
    L.zombie(66.6, 16.5, { id: 's5', type: 'shambler', yaw: 2.4, outfit: 'scrubs' });
    L.zombie(54.4, 27.4, { id: 's6', type: 'sleeper', pose: 'lying', yaw: -0.6, outfit: 'civilian2', wake: 3 });
    L.zombie(60.2, 7.4, { id: 's7', type: 'shambler', yaw: PI, outfit: 'civilian' });
    L.zombie(67.4, 25.0, { id: 's8', type: 'stalker', stalker: true, yaw: PI / 2, outfit: 'suit' });
    L.zombie(65.2, 19.8, { id: 's9', type: 'shambler', yaw: -1.2, outfit: 'civilian2' });

    // ================= Auslöser & Checkpoints =================
    L.trigger('mall_in', 10, 18, 4, 7);
    L.trigger('block', 26, 18, 5, 7);
    L.trigger('mode_in', 22, 13, 4, 4);
    L.trigger('dummy', 29, 13, 3, 3);
    L.trigger('mode_out', 36, 17, 3, 3);
    L.trigger('tv', 40, 21, 10, 4);
    L.trigger('drog_in', 40, 10, 10, 7);
    L.trigger('markt_in', 53, 18, 3, 7);
    L.trigger('anl', 70, 7, 8, 8);
    L.trigger('exit', 72, 1, 2, 2);
    L.checkpoint('start', 4.5, 20.5, -PI / 2);
    L.checkpoint('mall', 12, 21, -PI / 2);
    L.checkpoint('mode', 37, 19.5, -PI / 2);
    L.checkpoint('markt', 50.5, 21, -PI / 2);
    L.checkpoint('anl', 71.5, 11, -PI / 2);
  },

  ambience(g) {
    g.audio.loop('amb', 'hvac_loop', { vol: 0.25, bus: 'amb', reverb: false });
  },

  onLoad(c, info) {
    const g = c.g;
    if (!info.restored) c.setClock('05:30');
    if (!c.npc('mine')) c.addNpc('mine', 5.0, 21.6, { mode: 'follow' });
    if (!c.npc('ilyas')) c.addNpc('ilyas', 4.0, 19.6, { mode: 'follow' });
    const il = c.npc('ilyas'); if (il && c.get('ilyas_bitten')) il.injured = !c.get('ilyas_saved');
    // Schaufensterpuppen (statische Figuren auf ihren Sockeln)
    for (const [x, z, yaw, outfit] of DUMMIES) g.decor({ x, z, yaw, pose: 'stand', outfit, skin: 'plastic', hairStyle: 'none', scale: 1.0, merge: true });
    if (c.get('gate_open')) { c.unlock('gate'); c.open('gate'); }
    // Regen über der Rampe
    g.audio.loop('rain_ramp', 'rain_loop', { pos: { x: 73, y: 3, z: 2 }, vol: 0.35, bus: 'sfx' });
  },

  script: [
    {
      id: 'c4b_start', when: 'start', if: (c) => !c.get('c4b_started'), do: async (c) => {
        c.objective('Durchquere die Linden-Passage. Ausgang über die Anlieferung des Frischmarkts.');
        await c.wait(1.5);
        await c.lines([
          { s: 'mine', t: 'Die Linden-Passage. Hier hast du mir letzten Winter Handschuhe gekauft. Die falsche Größe.' },
          { s: 'ilyas', t: 'Wir sind direkt unter der Lindenstraße. Die Anlieferung vom Supermarkt führt hoch.' },
        ]);
        c.msg('unknown', 'UNBEKANNT', 'Linden-Passage. Der Hauptgang ist eingestürzt. Geh durch die Geschäfte. Ausgang: Anlieferung des Frischmarkts.');
        c.flag('c4b_started');
        c.checkpoint('start');
      },
    },
    {
      id: 'c4b_mall', when: 'enter:mall_in', do: async (c) => {
        c.checkpoint('mall');
        await c.wait(2.5);
        await c.pa([
          { s: 'pa', t: 'Liebe Kundinnen und Kunden, die Linden-Passage schließt in wenigen Minuten.', v: 'pa_mall1' },
          { s: 'pa', t: 'Wir danken für Ihren Besuch und wünschen Ihnen einen schönen Abend.', v: 'pa_mall2' },
        ], { parallel: true });
        await c.wait(1);
        c.lines([{ s: 'ilyas', t: 'Die Ansage läuft in Schleife. Seit drei Tagen vermutlich.' }]);
      },
    },
    {
      id: 'c4b_block', when: 'enter:block', do: async (c) => {
        c.say('sami', 'Der Gang ist verschüttet.', { d: 2 });
        await c.wait(2.2);
        await c.lines([{ s: 'mine', t: 'Durch den Modeladen. Der hat zwei Eingänge.' }]);
        c.objective('Der Hauptgang ist verschüttet: Durch „Mode Krüger“ auf die andere Seite.');
      },
    },
    {
      id: 'c4b_mode', when: 'enter:mode_in', do: async (c) => {
        await c.lines([{ s: 'ilyas', t: 'Ich hasse diese Puppen. Die gucken einen an.' }]);
        await c.wait(1.0);
        c.msg('unknown', 'UNBEKANNT', 'Nicht alles, was da steht, ist aus Plastik. Sieh genau hin. Duck dich.');
        c.toast('Puppen bewegen sich nicht. Achte auf Haut, Haltung – und Geräusche.');
      },
    },
    {
      id: 'c4b_dummy', when: 'enter:dummy', do: async (c) => {
        const z = c.zombie('z_dummy');
        if (!z || z.state !== 'dormant') return;
        await c.until(() => c.playerNear(z.pos.x, z.pos.z, 1.9) || !c.inZone('dummy'), 20);
        if (!c.zombie('z_dummy')) return;
        c.sting();
        c.sound('cloth', [z.pos.x, 1.5, z.pos.z], { vol: 1 });
        z.forceChase();
        c.shake(0.2);
        await c.wait(0.8);
        c.say('sami', 'Die da … lebt!', { d: 1.6 });
      },
    },
    {
      id: 'c4b_mode_out', when: 'enter:mode_out', do: async (c) => {
        c.checkpoint('mode');
        c.objective('Weiter nach Osten. Zum Frischmarkt am Ende der Passage.');
      },
    },
    // ---------- Fernsehwand ----------
    {
      id: 'c4b_tv', when: 'enter:tv', do: async (c) => {
        const g = c.g;
        c.sound('glitch', [45, 1.6, 26], { vol: 0.5 });
        await c.lines([
          { s: 'news', t: 'Varnheim. Nach dem Ausbruch einer unbekannten Infektion rund um das Klinikum St. Elisabeth erhebt die NEXARA Pharma AG schwere Vorwürfe gegen einen eigenen Mitarbeiter.', v: 'news_a', pos: { x: 45, y: 1.8, z: 26.2 } },
          { s: 'news', t: 'Der Haustechniker İlyas D. soll in der Nacht zum Dienstag die Sicherheitssysteme des Instituts sabotiert haben. Die Polizei bittet um Hinweise.', v: 'news_b', pos: { x: 45, y: 1.8, z: 26.2 } },
          { s: 'news', t: 'Ein Unternehmenssprecher betonte, die Forschung des Hauses sei zu jedem Zeitpunkt sicher gewesen.', v: 'news_c', pos: { x: 45, y: 1.8, z: 26.2 } },
        ], { channel: 'pa' });
        const forgave = c.get('ilyas_judged') === 'forgive';
        await c.lines([
          { s: 'ilyas', t: 'Das … bin ich. Vier Minuten. Und jetzt bin ich das Gesicht von allem.' },
          forgave
            ? { s: 'sami', t: 'Du hast ARGUS abgeschaltet. Die Schleusen hat Arendt an ARGUS gekoppelt. Das zeigen wir ihnen.', d: 4 }
            : { s: 'sami', t: 'Du hast es getan, İlyas. Aber du warst nicht allein.', d: 3 },
          { s: 'mine', t: 'Sie brauchen einen Schuldigen, bevor jemand fragt, was in U3 passiert ist.' },
        ]);
        c.msg('unknown', 'UNBEKANNT', 'Die Festplatte. Die Daten sind der einzige Beweis. Pass auf ihn auf.');
        c.fact('Nachrichten: NEXARA beschuldigt İlyas öffentlich der Sabotage. Kein Wort über PROJECT EVE.');
        void g;
      },
    },
    { id: 'c4b_tv_doc', when: 'interact:tv_news', once: false, do: async (c) => { c.doc('c4b_news'); } },
    // ---------- Drogerie ----------
    {
      id: 'c4b_drog', when: 'enter:drog_in', do: async (c) => {
        await c.wait(0.8);
        await c.lines([{ s: 'mine', t: 'Verbandszeug, Schmerzmittel. Nimm mit, was du tragen kannst.' }]);
      },
    },
    {
      id: 'c4b_notiz', when: 'closed:c4b_notiz', do: async (c) => {
        await c.wait(0.4);
        c.say('sami', 'Das bin ich. Warum sucht NEXARA ausgerechnet mich?', { d: 3 });
        await c.wait(3);
        await c.lines([{ s: 'mine', t: '… Lass uns weitergehen. Bitte.' }]);
        c.fact('Ein NEXARA-Handzettel sucht mich – mit Foto. Belohnung, Übergabe am Kontrollpunkt Nord. Mine wollte nicht darüber reden.');
      },
    },
    // ---------- Mines Telefon ----------
    {
      id: 'c4b_minephone', when: 'enter:markt_in', if: (c) => !c.get('mine_phone'), do: async (c) => {
        const g = c.g, m = c.npc('mine');
        c.flag('mine_phone');
        c.checkpoint('markt');
        if (m) c.sound('vibrate', [m.pos.x, 1.1, m.pos.z], { vol: 0.9 });
        await c.wait(1.2);
        await c.lines([
          { s: 'sami', t: 'Dein Telefon.', d: 1.4 },
          { s: 'mine', t: 'Die Klinik. Die rufen seit Stunden an. … Ich gehe nicht ran.' },
        ]);
        c.fact('Mines Telefon hat geklingelt. Sie hat abgelehnt: „Die Klinik.“ Sie hat das Display schnell weggedreht.');
        await c.wait(1.5);
        c.msg('unknown', 'UNBEKANNT', 'Der Frischmarkt ist voll. Sie stehen zwischen den Regalen. Wirf etwas – sie folgen dem Lärm. Anlieferung: hinten rechts.');
        c.objective('Durch den Frischmarkt zur Anlieferung (Ostwand). Lenke sie mit Würfen ab.');
        g.hud.toast(`<kbd>${g.input.label('throw')}</kbd> Werfen · Flaschen und Dosen locken Infizierte an den Aufschlagort`);
      },
    },
    // ---------- Anlieferung ----------
    {
      id: 'c4b_anl', when: 'enter:anl', do: async (c) => {
        if (!c.get('gate_started')) c.checkpoint('anl');
        await c.wait(1);
        c.objective('Öffne das Rolltor zur Lindenstraße (Motorschalter).');
        c.say('sami', 'Das Tor. Da ist ein Motor.', { d: 2 });
      },
    },
    {
      id: 'c4b_gate', when: 'interact:gate_btn', do: async (c) => {
        const g = c.g;
        c.flag('gate_started');
        c.sound('click', [74.5, 1.35, 7.1]);
        c.loop('gate_motor', 'elevator_motor', [73, 3.5, 6.5], { vol: 0.9, bus: 'sfx' });
        c.loop('gate_klaxon', 'klaxon', [74, 3, 7], { vol: 0.5, bus: 'sfx' });
        c.lightMode('gate_lamp', 'rotate');
        c.noise(70, 12, 40, 'alarm');
        c.shake(0.2);
        await c.wait(1.2);
        await c.lines([{ s: 'ilyas', t: 'Der Motor ist laut. Zu laut!' }]);
        for (const id of ['s1', 's2', 's3', 's4', 's5', 's7', 's8', 's9']) { const z = c.zombie(id); if (z) z.forceChase(); }
        c.wake('s6', 'chase');
        c.objective('Das Tor fährt hoch … halte durch! Schließ die Tür zum Markt.');
        g.hud.toast(`Tür schließen (<kbd>${g.input.label('interact')}</kbd>) hält sie kurz auf`);
        for (const n of [c.npc('mine'), c.npc('ilyas')]) if (n && n.pos.x < 69.5) n.teleport(n.id === 'mine' ? 75.5 : 76.5, 8.4);
        await c.wait(7 * g.difficulty.chaseTime);
        c.stopLoop('gate_klaxon', 0.5);
        c.unlock('gate'); c.open('gate');
        c.flag('gate_open');
        c.sound('metal_creak', [73, 3, 6], { vol: 1 });
        await c.wait(1.5);
        c.stopLoop('gate_motor', 1);
        c.objective('Hoch zur Lindenstraße!');
        await c.lines([{ s: 'mine', t: 'Raus! Jetzt!' }]);
      },
    },
    {
      id: 'c4b_exit', when: 'enter:exit', if: (c) => c.get('gate_open'), do: async (c) => {
        c.msg('unknown', 'UNBEKANNT', 'Lindenstraße. Dann der Marktplatz. Dann die Brücke. Es ist gleich sechs.');
        c.setClock('05:39');
        await c.endChapter('ch5');
      },
    },
  ],
};
