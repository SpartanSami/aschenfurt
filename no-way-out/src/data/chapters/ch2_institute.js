// KAPITEL 2 – DIE FORSCHUNGSEINRICHTUNG (PROJECT EVE)
// Halden-Institut, Ebene U3: Empfang, Dekontaminationsschleuse, Laborflur mit Glaswänden,
// Zellentrakt (Elif 009, Zelle 017), Mine im Beobachtungsraum (Entscheidung: Kryo-Box),
// Serverraum (ARGUS, Arendt), optional Kühlraum B (Serum S-17), Sterilisation: Schleusen-Flucht + Lüftungsschacht.
const PI = Math.PI;

export default {
  id: 'ch2', name: 'Die Forschungseinrichtung', tagline: 'Halden-Institut · Ebene U3 · PROJECT EVE',
  w: 92, h: 72,
  opts: { floor: 'l_floor', wall: 'l_wall', ceil: 'l_ceil', height: 3.2 },
  env: { fog: 0x0a0d10, fogDensity: 0.045, hemi: 0.03, exposure: 1.0, tint: 0xeef2f8, reverb: [1.8, 2.2], reverbMix: 0.38, sleeve: 0x8fb0c4 },

  build(L) {
    // Aufzug + Empfang
    L.room('Lastenaufzug', 4, 30, 3, 3, { floor: 'metal_dark', wall: 'metal', ceil: 'metal' });
    L.room('Empfang', 8, 25, 12, 12);
    L.door(7, 31, { id: 'd_elev2', kind: 'elevator', locked: true, noZombie: true });
    // Dekon-Schleuse
    L.room('Dekontamination', 21, 30, 4, 3, { wall: 'h_tile_wall', floor: 'h_tile_floor' });
    L.door(20, 31, { id: 'd_decon1', kind: 'lab' });
    L.door(25, 31, { id: 'd_decon2', kind: 'lab', locked: true, lockedText: 'Verriegelt – Dekontamination erforderlich' });
    // Laborflur + Labore
    L.room('Laborflur', 26, 30, 30, 3);
    L.room('Labor A', 27, 22, 9, 7, { wall: 'l_wall_dark' });
    L.door(31, 29, { id: 'd_labA', kind: 'lab', locked: true, lockedText: 'Labor A – Notverriegelung' });
    L.glass(27, 29, 9, 1, { id: 'labA' });
    L.room('Labor B', 37, 22, 9, 7);
    L.door(41, 29, { id: 'd_labB', kind: 'lab' });
    L.glass(37, 29, 9, 1, { id: 'labB' });
    L.room('Labor C', 47, 22, 9, 7, { wall: 'l_wall_dark' });
    L.door(51, 29, { id: 'd_labC' });
    L.room('Büro Dr. Arendt', 27, 34, 7, 6, { floor: 'h_floor2', wall: 'h_wall' });
    L.door(30, 33, { id: 'd_office' });
    L.room('Lager', 35, 34, 6, 5, { wall: 'l_wall_dark' });
    L.door(37, 33, { id: 'd_store' });
    L.room('Schutzanzüge', 42, 34, 6, 5, { wall: 'l_wall_dark' });
    L.door(44, 33, { id: 'd_hazmat' });
    // Vorraum + Beobachtung
    L.room('Vorraum Sektion B/C', 56, 26, 9, 11);
    L.room('Beobachtung', 56, 18, 9, 7, { wall: 'l_wall_dark', floor: 'h_floor2' });
    L.door(60, 25, { id: 'd_obs', kind: 'lab', locked: true, lockedText: 'Notverriegelung – von innen gesperrt', npcNoOpen: true });
    L.glass(57, 25, 3, 1, { id: 'obs1' });
    L.glass(61, 25, 3, 1, { id: 'obs2' });
    // Zellentrakt
    L.room('Zellentrakt', 65, 30, 23, 3, { wall: 'l_wall_dark' });
    const north = [[66, '003'], [70, '005'], [74, '007'], [78, '009'], [82, '011']];
    const south = [[66, '013'], [70, '015'], [74, '017'], [78, '019'], [82, '020']];
    for (const [x, n] of north) {
      L.room('Zelle ' + n, x, 25, 3, 4, { wall: 'l_wall', floor: 'l_floor' });
      L.door(x + 1, 29, { id: 'cell' + n, kind: 'lab', locked: n !== '003', open: n === '003', lockedText: 'Zelle ' + n + ' – verriegelt' });
      L.glass(x, 29, 3, 1, { id: 'g' + n });
      L.sign(n, x + 1.5, 29.6, { w: 0.5, h: 0.22, y: 2.6, face: 'n', bg: '#20324a', fg: '#fff' });
    }
    for (const [x, n] of south) {
      L.room('Zelle ' + n, x, 34, 3, 4, { wall: 'l_wall', floor: 'l_floor' });
      L.door(x + 1, 33, { id: 'cell' + n, kind: 'lab', locked: !(n === '017' || n === '013'), open: n === '017' || n === '013', lockedText: 'Zelle ' + n + ' – verriegelt' });
      L.glass(x, 33, 3, 1, { id: 'g' + n });
      L.sign(n, x + 1.5, 32.4, { w: 0.5, h: 0.22, y: 2.6, face: 's', bg: '#20324a', fg: '#fff' });
    }
    // Südtrakt: Server, Kühlraum
    L.door(60, 37, { id: 'd_south', kind: 'security', locked: true, lockedText: 'Sektion B Süd – verriegelt (Leitstand)' });
    L.room('Serverflur', 59, 38, 3, 10, { wall: 'l_wall_dark' });
    L.room('Serverraum', 63, 39, 10, 8, { floor: 'metal_dark', wall: 'l_wall_dark', ceil: 'l_ceil' });
    L.door(62, 42, { id: 'd_server' });
    L.room('Kühlgang', 50, 43, 9, 3, { wall: 'l_wall_dark' });
    L.room('Kühlraum B', 43, 40, 6, 9, { floor: 'metal_dark', wall: 'steel', ceil: 'steel', tint: 0x7fa8ff });
    L.door(49, 44, { id: 'd_cold', kind: 'metal' });
    // Quarantäneschleusen
    L.solid(59, 48); L.solid(61, 48);
    L.room('Schleuse A', 59, 49, 3, 4, { wall: 'h_tile_wall', floor: 'h_tile_floor' });
    L.solid(59, 53); L.solid(61, 53);
    L.room('Schleuse B', 59, 54, 3, 4, { wall: 'h_tile_wall', floor: 'h_tile_floor' });
    L.solid(59, 58); L.solid(61, 58);
    L.room('Schleuse C', 59, 59, 3, 4, { wall: 'h_tile_wall', floor: 'h_tile_floor' });
    L.solid(59, 63); L.solid(61, 63);
    L.room('Überlauf Sektion C', 63, 54, 4, 5, { wall: 'l_wall_dark' });
    L.door(62, 56, { id: 'd_overflow', kind: 'metal', locked: true, strength: 2 });
    L.door(60, 48, { id: 'q1', kind: 'security', open: true });
    L.door(60, 53, { id: 'q2', kind: 'security', locked: true });
    L.door(60, 58, { id: 'q3', kind: 'security', locked: true });
    L.door(60, 63, { id: 'q4', kind: 'security', locked: true });
    // Lüftungsschacht (Alternative)
    L.vent(55, 51, 4, 1, { name: 'Lüftungsschacht' });
    L.vent(55, 52, 1, 12, { name: 'Lüftungsschacht' });
    // Versorgungstunnel + Treppe
    L.room('Versorgungstunnel', 30, 64, 32, 3, { floor: 'concrete_floor', wall: 'concrete_wall', ceil: 'concrete', height: 3 });
    L.room('Treppenhaus', 22, 64, 8, 3, { floor: 'concrete', wall: 'concrete_wall', ceil: 'concrete', height: 5.4 });
    L.ramp(26, 64, 4, 3, '-x', 0, 2.0, { stairs: true, mat: 'concrete' });
    L.heights(22, 64, 4, 3, 2.0, 5.4);

    // ================= Licht =================
    for (const x of [10, 14, 18]) for (const z of [27.5, 31, 34.5]) L.light(x, z, { kind: 'lab', group: 'lab', mul: 0.85, mode: x === 18 && z === 34.5 ? 'flicker' : 'steady' });
    L.light(22.5, 31, { kind: 'lab', group: 'decon', mul: 0.7 });
    L.light(22.5, 30.2, { kind: 'red', group: 'deconRed', id: 'deconLamp', mul: 0.8 });
    L.lightsAlong(28, 31, 54, 31, 3.3, (i) => ({ kind: 'lab', group: 'lab', mode: i === 5 ? 'flicker' : 'steady', mul: 0.9 }));
    for (const x of [30, 33]) L.light(x, 25, { kind: 'lab', group: 'lab', mode: 'broken' });
    for (const x of [39, 43]) L.light(x, 25, { kind: 'lab', group: 'lab', mul: 0.8 });
    L.light(51, 25, { kind: 'lab', group: 'lab', mode: 'flicker', mul: 0.7 });
    L.light(30, 36.5, { kind: 'panel_warm', group: 'lab', mul: 0.6 });
    L.light(38, 36, { kind: 'lab', group: 'lab', mode: 'broken' });
    L.light(45, 36, { kind: 'lab', group: 'lab', mul: 0.6 });
    for (const z of [28, 34]) L.light(60.5, z, { kind: 'lab', group: 'lab', mul: 0.8 });
    L.light(60.5, 21, { kind: 'lab', group: 'obs', mul: 0.4, mode: 'flicker', speed: 0.4 });
    L.lightsAlong(67, 31, 86, 31, 4, (i) => ({ kind: 'lab', group: 'cells', mul: 0.55, mode: i % 2 ? 'broken' : 'flicker', speed: 0.5 }));
    for (const [x] of north) L.light(x + 1.5, 26.5, { kind: 'lab', group: 'cells', mul: 0.25, mode: x === 78 ? 'flicker' : 'steady' });
    for (const [x] of south) L.light(x + 1.5, 35.5, { kind: 'lab', group: 'cells', mul: 0.25, mode: x === 74 ? 'flicker' : 'broken' });
    for (const z of [40, 45]) L.light(60.5, z, { kind: 'lab', group: 'lab', mul: 0.6, mode: z === 45 ? 'flicker' : 'steady' });
    L.light(66, 42.5, { kind: 'screen', color: 0x4aa0ff, mul: 2 });
    L.light(70, 44, { kind: 'red', mul: 0.5, mode: 'pulse' });
    L.light(54, 44, { kind: 'lab', mul: 0.5, mode: 'broken' });
    L.light(45.5, 44, { kind: 'lab', color: 0xbfd8ff, mul: 0.35, mode: 'flicker', speed: 0.3 });
    for (const z of [50.5, 55.5, 60.5]) { L.light(60.5, z, { kind: 'lab', group: 'q', mul: 0.6 }); L.light(60.5, z + 1.2, { kind: 'emergency', group: 'qRed', on: false }); }
    L.light(65, 56, { kind: 'red', mul: 0.4 });
    L.lightsAlong(33, 65, 59, 65, 6.5, { kind: 'sodium', mul: 0.55 });
    L.light(25, 65, { kind: 'bulb', mul: 0.8, mode: 'flicker' });

    // ================= Requisiten =================
    // Empfang
    L.prop('counter', 13.5, 27.2, { w: 4.5, d: 0.8, monitors: 2, mat: 'plastic_white', papers: true });
    L.prop('chairs_row', 9.0, 33.0, { n: 4, rot: PI / 2 });
    L.prop('plant', 8.5, 25.5, {}); L.prop('plant', 19.4, 25.5, {});
    L.prop('label', 13.5, 25.02, { text: 'NEXARA  ·  HALDEN-INSTITUT', w: 3.6, h: 0.5, y: 2.5, bg: '#0b2a4a', fg: '#e8f4ff', glow: true });
    L.prop('hazmat', 19.6, 29.0, { rot: -PI / 2 });
    L.prop('hazmat', 19.6, 33.0, { rot: -PI / 2 });
    L.prop('gurney', 11.5, 35.2, { rot: 0.3, body: true, blood: true });
    L.prop('poster', 19.95, 34.5, { rot: -PI / 2, text: 'DEKON\nPFLICHT', bg: '#f0d020', fg: '#111' });
    // Dekon
    L.interact('decon_panel', 22.5, 30.08, { prompt: 'Dekontamination starten', y: 1.3, mesh: 'panel', rot: 0, enabled: (g) => !g.state.flags.decon_done });
    // Labore
    L.prop('labbench', 31.5, 25.5, { w: 3.6, shelf: true });
    L.prop('fumehood', 34.6, 22.5, {});
    L.prop('labbench', 41, 24.5, { w: 3.0, shelf: true });
    L.prop('labbench', 41, 27.2, { w: 3.0 });
    L.prop('freezer', 44.9, 22.6, {});
    L.prop('tank', 38, 23, {});
    L.prop('labbench', 51, 25, { w: 3.4 });
    L.prop('shelf', 54.6, 26, { rot: -PI / 2, w: 2.5 });
    L.prop('cart', 48.5, 27.5, { rot: 0.5 });
    // Büro Arendt
    L.prop('desk', 30, 35.2, { w: 1.8, d: 0.8, mat: 'wood', screen: 'text', screenOpts: { text: 'EVE · STATUS\nSEKTION C: ROT\n017: WERTANLAGE', color: '#ffb070' } });
    L.prop('shelf', 27.3, 37.5, { rot: PI / 2, w: 2.5 });
    L.prop('plant', 33.5, 39.4, {});
    L.prop('shelf', 36, 38.5, { rot: PI, w: 2 }); L.prop('boxes', 39.5, 37.5, { n: 4 });
    L.prop('hazmat', 42.2, 35, { rot: PI / 2 }); L.prop('hazmat', 42.2, 36.5, { rot: PI / 2 });
    L.prop('locker', 47.6, 35.5, { rot: -PI / 2 }); L.prop('locker', 47.6, 36.2, { rot: -PI / 2, hide: false });
    // Vorraum
    L.prop('chairs_row', 57, 33.5, { n: 3, rot: PI / 2 });
    L.prop('barrels', 63.4, 35.3, { n: 2, mat: 'plastic_yellow' });
    L.prop('gurney', 62.5, 28.5, { rot: 1.2, blood: true });
    L.prop('label', 60.5, 25.02, { text: 'LEITSTAND SEKTION B', w: 2.2, h: 0.3, y: 2.65, bg: '#20324a', fg: '#fff' });
    L.prop('label', 64.97, 31.5, { text: 'ZELLENTRAKT  B/C', w: 2.0, h: 0.3, y: 2.6, rot: -PI / 2, bg: '#20324a', fg: '#fff' });
    // Beobachtung (Mine)
    L.prop('console', 60.5, 18.5, { w: 5, screen: 'text', screenOpts: { text: 'ZELLEN 003–020\nSCHLEUSEN: AUTO\nSTERIL.: BEREIT', color: '#9fd3ff' } });
    L.prop('desk', 57, 22.5, { rot: PI / 2, monitor: false, papers: true });
    L.prop('shelf', 64.4, 21, { rot: -PI / 2, w: 2 });
    // Zellen
    for (const [x] of north) { L.prop('cellbed', x + 1.5, 26.1, { rot: PI / 2 }); }
    for (const [x] of south) { L.prop('cellbed', x + 1.5, 36.9, { rot: PI / 2 }); }
    L.sign('NACH VORNE', 75.5, 37.95, { w: 1.6, h: 0.45, y: 1.5, face: 's', bg: '#c8ccd0', fg: '#4a4646', font: 110 });
    L.sign('IIII IIII IIII II', 74.05, 35.6, { w: 1.2, h: 0.2, y: 1.2, face: 'w', bg: '#c8ccd0', fg: '#4a4646' });
    // Server
    for (const x of [65.2, 67.6, 70.0]) for (const z of [40.4, 42.2]) L.prop('serverrack', x, z, { rot: PI / 2 });
    L.prop('desk', 71.5, 45.4, { w: 1.6, d: 0.7, rot: PI, screen: 'text', screenOpts: { text: 'idemir@argus\n412 GB kopiert\n> _', color: '#7fffa0' } });
    L.prop('console', 64.5, 45.8, { w: 2.0, rot: PI, screen: 'text', screenOpts: { text: 'ARGUS 4.2\nNACHVORNE: AKTIV', color: '#7fe0e0' } });
    L.prop('cable_tray', 68, 39.2, { len: 9, y: 2.9, rot: PI / 2 });
    // Kühlraum
    for (const z of [40.6, 41.6, 42.6]) L.prop('freezer', 43.45, z, { rot: PI / 2 });
    for (const z of [45.4, 46.4, 47.4]) L.prop('freezer', 43.45, z, { rot: PI / 2, alarm: z === 46.4 });
    L.prop('freezer', 47.6, 40.5, { rot: -PI / 2 }); L.prop('freezer', 47.6, 47.5, { rot: -PI / 2 });
    L.prop('cart', 45.6, 47.6, { rot: 0.2 });
    L.prop('shelf', 46.2, 43.4, { w: 1.6, rot: 0 });
    // Schleusen / Tunnel
    L.prop('hazmat', 61.6, 50.0, { rot: -PI / 2 });
    L.prop('barrels', 59.5, 61.5, { n: 2, mat: 'plastic_yellow' });
    L.prop('body', 60.8, 55.4, { cloth: 'labcoat', rot: 0.4 });
    L.prop('pipe', 46, 64.2, { len: 30, y: 2.6, r: 0.18, rot: PI / 2 });
    L.prop('pipe', 46, 66.8, { len: 30, y: 2.2, r: 0.1, rot: PI / 2, mat: 'metal_dark' });
    L.prop('crate', 40, 66.2, { rot: 0 });
    L.prop('label', 61.97, 51, { text: 'QUARANTÄNESCHLEUSE', w: 1.8, h: 0.28, y: 2.6, rot: -PI / 2, bg: '#f0d020', fg: '#111' });

    // ================= Decals =================
    L.decal('blood_trail', 14, 31, { size: 3, rot: PI / 2 });
    L.decal('blood_pool', 11.8, 34.4, { size: 1.6 });
    L.decal('blood_hand', 32, 28.95, { wall: 's', y: 1.4, size: 0.5 });
    L.decal('blood_smear', 45, 31.4, { size: 1.6 });
    L.decal('blood_pool', 62.4, 29.2, { size: 1.4 });
    L.decal('blood_trail', 67.5, 35.5, { size: 2 });
    L.decal('blood_pool', 69, 44, { size: 1.4 });
    L.decal('blood_splat', 60.5, 55.8, { size: 2 });
    L.decal('paper', 58, 22.2); L.decal('paper', 31, 36.4); L.decal('paper', 42.5, 31.6);

    // ================= Gegenstände =================
    L.item('doc', 9.6, 29.1, { id: 'doc_decon', doc: 'c2_decon', h: 0.02, rot: 0.4 });
    L.item('doc', 41.5, 27.2, { id: 'doc_eve', doc: 'c2_eve', h: 0.92 });
    L.item('doc', 40.0, 24.5, { id: 'doc_ph1', doc: 'c2_phase1', h: 0.92 });
    L.item('doc', 30.6, 35.1, { id: 'doc_memo', doc: 'c2_memo', h: 0.78 });
    L.item('bandage', 39.6, 37.4, { id: 'b_store', h: 0.7 });
    L.item('medkit', 51.8, 25.2, { id: 'mk_labc', h: 0.92, notHard: true });
    L.item('pills', 46.5, 35.0, { id: 'p_hazmat', h: 0.02, extra: true });
    L.item('doc', 79.8, 29.7, { id: 'doc_elif', doc: 'c2_elif', h: 0.02 });
    L.item('doc', 76.2, 36.5, { id: 'doc_017', doc: 'c2_017', h: 0.6 });
    L.item('recorder', 74.6, 37.5, { id: 'frag2', h: 0.02, fragment: FRAG2 });
    L.item('doc', 71.6, 45.4, { id: 'doc_laptop', doc: 'c2_laptop', h: 0.78 });
    L.item('doc', 68.8, 43.6, { id: 'doc_badge', doc: 'c2_badge', h: 0.02 });
    L.item('serum', 45.6, 47.6, { id: 'serum', keyId: 'serum', name: 'Ampulle S-17', h: 0.93, noAuto: true });
    L.item('doc', 46.2, 43.4, { id: 'doc_s17', doc: 'c2_s17', h: 1.2 });
    L.item('bandage', 60.8, 50.2, { id: 'b_q', h: 0.02, notHard: true });
    L.item('bottle', 52, 44.5, { id: 'bottle_cg', h: 0.02 });
    L.interact('argus_term', 64.5, 45.2, { prompt: 'ARGUS-Terminal lesen', y: 1.1, repeat: true });
    L.interact('wall017', 75.5, 37.4, { prompt: 'Kratzspuren ansehen', y: 1.5 });

    // ================= Gegner =================
    L.zombie(14.5, 29.0, { id: 'z_rec', type: 'sleeper', pose: 'kneel', yaw: 0.3, outfit: 'labcoat', wake: 2.5 });
    L.zombie(29.5, 26.0, { id: 'z_la1', type: 'shambler', yaw: PI, outfit: 'labcoat', wander: 1.5 });
    L.zombie(33.0, 24.0, { id: 'z_la2', type: 'shambler', yaw: PI, outfit: 'labcoat', wander: 1.5 });
    L.zombie(28.5, 23.0, { id: 'z_la3', type: 'shambler', yaw: 2.6, outfit: 'scrubs', wander: 1.0 });
    L.zombie(44.5, 37.5, { id: 'z_hazmat', type: 'sleeper', pose: 'lying', yaw: PI / 2, outfit: 'hazmat' });
    L.zombie(71.5, 26.2, { id: 'z_c005', type: 'shambler', yaw: PI, outfit: 'gown', wander: 0.6 });
    L.zombie(79.5, 36.3, { id: 'z_c019', type: 'shambler', yaw: 0, outfit: 'gown', wander: 0.6 });
    L.zombie(79.5, 25.8, { id: 'z_elif', type: 'sleeper', pose: 'sitting', yaw: 0, outfit: 'gown_clean', hairStyle: 'long', hair: 0x2a1a10, scale: 0.92, wake: 99, blind: true });
    L.zombie(67.4, 36.4, { id: 'z_c013', type: 'sleeper', pose: 'lying', yaw: PI / 2, outfit: 'gown', wake: 4 });
    L.zombie(70.3, 44.2, { id: 'z_arendt', type: 'stalker', yaw: PI / 2, outfit: 'labcoat', stalker: true, hairStyle: 'long', hair: 0x8a7a68 });
    L.zombie(46.0, 41.6, { id: 'z_cold', type: 'stalker', yaw: -PI / 2 - 0.3, outfit: 'hazmat', stalker: true });
    for (const [i, [x, z]] of [[64, 55], [65.5, 57], [64.5, 57.8]].entries()) L.zombie(x, z, { id: 'z_over' + i, type: 'hunter', outfit: i === 1 ? 'hazmat' : 'labcoat', state: 'idle', wander: 0 });

    // ================= Auslöser =================
    L.trigger('rec', 8, 25, 12, 12);
    L.trigger('decon_in', 21, 30, 4, 3);
    L.trigger('labcorr', 26, 30, 10, 3);
    L.trigger('hall', 56, 26, 9, 11);
    L.trigger('cells', 66, 30, 6, 3);
    L.trigger('elif', 77, 30, 5, 3);
    L.trigger('cell017', 74, 34, 3, 4);
    L.trigger('southcorr', 59, 38, 3, 4);
    L.trigger('coldcorr', 50, 43, 6, 3);
    L.trigger('q_a', 59, 49, 3, 3);
    L.trigger('q_c', 59, 59, 3, 4);
    L.trigger('tunnel', 30, 64, 24, 3);
    L.trigger('exit', 22, 64, 3, 3, { yMin: 1.5 });
    L.checkpoint('start', 5.5, 31.5, -PI / 2);
    L.checkpoint('labs', 27, 31.5, -PI / 2);
    L.checkpoint('mine', 60.5, 22.5, PI);
    L.checkpoint('south', 60.5, 39.5, PI);
    L.checkpoint('tunnel', 52, 65.5, PI / 2);
  },

  ambience(g) {
    g.audio.loop('amb', 'lab_loop', { vol: 0.32, bus: 'amb', reverb: false });
  },

  onLoad(c, info) {
    const g = c.g;
    if (!info.restored) c.setClock('04:38');
    if (!c.get('mine_met')) {
      const m = c.addNpc('mine', 59.0, 20.8, { mode: 'idle', yaw: PI });
      m.forceCrouch = true;
    }
    if (c.get('sterile')) { c.lightMode('lab', 'off'); c.power('qRed', true); }
    // Elif sitzt summend in ihrer Zelle
    // Wandmonitor im Vorraum – ARGUS kann hier Nachrichten anzeigen
    g.level._hallMon = c.g.makeScreen({ x: 56.03, y: 2.1, z: 34.5, rotY: PI / 2, w: 1.4, h: 0.8, text: 'SEKTION B · LEITSTAND\nZELLEN: VERRIEGELT\nSTERIL.: BEREIT', color: '#9fd3ff' });
    if (c.get('mon_msg')) c.g.setScreen(g.level._hallMon, ARGUS_MSG, '#ff7a6a');
    const e = g.zombies.find((z) => z.id === 'z_elif');
    if (e) e.hearing = 0;
    void g;
  },

  script: [
    {
      id: 'c2_arrive', when: 'start', if: (c) => !c.get('c2_arrived'), do: async (c) => {
        c.flag('c2_arrived');
        c.lockPlayer(true);
        c.loop('elev_motor', 'elevator_motor', [5.5, 1.5, 31.5], { vol: 0.6, bus: 'sfx' });
        c.shake(0.3);
        await c.wait(2.5);
        c.stopLoop('elev_motor');
        c.sound('elevator_ding', [6.5, 2.2, 31], { vol: 0.9 });
        c.unlock('d_elev2'); c.open('d_elev2');
        c.lockPlayer(false);
        c.objective('Finde heraus, was hier unten passiert ist.');
        await c.wait(1.5);
        await c.pa([{ s: 'pa', t: 'Willkommen im Halden-Institut. Bitte durchlaufen Sie die Dekontamination.', v: 'pa_i1' }]);
      },
    },
    {
      id: 'c2_rec', when: 'enter:rec', do: async (c) => {
        await c.wait(2);
        c.msg('unknown', 'UNBEKANNT', 'Das Halden-Institut. NEXARA nennt es Forschung. Geh leise. Durch die Schleuse.');
        c.objective('Durchquere die Dekontaminationsschleuse.');
        c.close('d_elev2', { persist: false });
      },
    },
    {
      id: 'c2_decon', when: 'interact:decon_panel', once: false, if: (c) => !c.get('decon_done'), do: async (c) => {
        const g = c.g;
        if (!c.inZone('decon_in')) { c.toast('Erst die Schleuse betreten.'); return; }
        c.flag('decon_done');
        c.close('d_decon1', { force: true }); c.lock('d_decon1');
        c.sound('klaxon', [22.5, 2.5, 31], { vol: 0.5 });
        await c.wait(1.0);
        c.sound('hiss', [22.5, 2.8, 31], { vol: 0.9 });
        g.fx.puff(22.5, 2.8, 31, { n: 160, w: 3.5, d: 2.5, life: 4.5 });
        c.noise(22.5, 31, 6, 'event');
        await c.wait(3.6);
        c.sound('beep_card', [25, 1.5, 31]);
        g.level.lights.byId('deconLamp').color.setHex(0x30ff60);
        c.unlock('d_decon2'); c.open('d_decon2');
        c.unlock('d_decon1');
        c.checkpoint('labs');
      },
    },
    {
      id: 'c2_labA', when: 'enter:labcorr', do: async (c) => {
        await c.wait(1);
        c.say('sami', 'Die sind … eingesperrt.', { d: 2 });
        c.objective('Folge dem Laborflur nach Osten.');
      },
    },
    {
      id: 'c2_hall', when: 'enter:hall', do: async (c) => {
        const m = c.npc('mine');
        c.say('sami', 'Da drin – da ist jemand!', { d: 2 });
        await c.wait(2.5);
        if (m) m.forceCrouch = false;
        c.sound('notify', [60.5, 2.5, 25], { vol: 0.5 });
        await c.lines([
          { s: 'mine', t: 'Sami?! … Oh Gott. Sami! Du lebst!', v: 'm2_a', pos: { x: 60.5, y: 1.5, z: 24 } },
          { s: 'sami', t: 'Kennen Sie mich?' },
          { s: 'mine', t: 'Die Notverriegelung – ich muss sie von hier lösen. Das dauert. Geh nicht weg … bitte.', v: 'm2_b' },
        ]);
        c.msg('unknown', 'UNBEKANNT', 'Zelle 017. Osttrakt. Du solltest sehen, wo du warst.');
        c.objective('Sieh dir den Zellentrakt an. (Zelle 017)');
      },
    },
    {
      id: 'c2_elif', when: 'enter:elif', do: async (c) => {
        const z = c.zombie('z_elif');
        if (!z) return;
        c.sound('metal_creak', [79.5, 1, 26], { vol: 0.4 });
        await c.wait(1.2);
        z.model.setPose('sitting');
        z.state = 'dormant'; z.setState('getup'); z.afterGetup = 'script';
        await c.until(() => z.state === 'script' || z.state !== 'getup', 5);
        z.command({ type: 'goto', x: 79.5, z: 28.4, speed: 0.7, then: () => z.command({ type: 'bash', door: c.door('cell009') }) });
        await c.wait(2.5);
        c.say('sami', 'Elif …?', { d: 2.2 });
        await c.wait(3);
        c.say('sami', 'Das Armband. Neun. … Elif, ich bin’s.', { d: 3 });
        c.fact('Zelle 009: Elif. Meine Schwester. Sie ist nicht tot. Sie ist … eine von ihnen.');
      },
    },
    {
      id: 'c2_017', when: 'enter:cell017', do: async (c) => {
        c.flag('saw017');
        c.say('sami', 'Meine Zelle.', { d: 1.8 });
        await c.wait(2);
        c.objective('Zurück zum Leitstand.');
        // Die Kontaktperson übernimmt den Monitor im Vorraum
        c.flag('mon_msg');
        c.g.setScreen(c.g.level._hallMon, ARGUS_MSG, '#ff7a6a');
        c.sound('glitch', [56.3, 2.1, 34.5], { vol: 0.8 });
        c.msg('unknown', 'UNBEKANNT', 'Sieh auf den Monitor im Vorraum.');
      },
    },
    { id: 'c2_wall', when: 'interact:wall017', do: async (c) => { c.photo('wall017', 'Zelle 017 – in die Wand geritzt'); c.say('sami', '„Nach vorne.“ … Das habe ich geschrieben?', { d: 3 }); c.fact('In Zelle 017 steht „NACH VORNE“ in der Wand. Derselbe Satz wie vom Anrufer.'); } },
    { id: 'c2_frag2', when: 'pickup:frag2', do: async (c) => { await c.wait(1); c.fact('Aufnahme 2: Ich habe mich freiwillig gemeldet – wegen Elif. Und Mine hat getan, worum ich sie gebeten habe.'); } },
    {
      id: 'c2_meet', when: 'cond', cond: (c) => (c.get('saw017') && c.playerNear(60.5, 27, 4)) || (c.get('c2_hall_t') && c.g.story.time - c.get('c2_hall_t') > 120 && c.playerNear(60.5, 27, 5)), do: async (c) => {
        const g = c.g, m = c.npc('mine');
        c.sound('beep_card', [60.5, 1.5, 25]);
        c.unlock('d_obs'); c.open('d_obs');
        if (m) { m.forceCrouch = false; await m.goTo(60.5, 23.5); }
        c.look(60.5, 1.6, 23.5, 1.5);
        await c.lines([
          { s: 'mine', t: 'Du erinnerst dich nicht an mich. Es hat schon angefangen …', v: 'm2_c' },
          { s: 'sami', t: 'Was hat angefangen? Wer sind Sie?' },
          { s: 'mine', t: 'Mine. Mine Aksoy. Ich bin Ärztin im EVE-Programm. Ich … habe dich betreut.', v: 'm2_d' },
          { s: 'mine', t: 'Du bist Proband 017. Und du bist der Einzige, bei dem es funktioniert hat.', v: 'm2_e' },
          { s: 'sami', t: 'Bei dem was funktioniert hat?' },
          { s: 'mine', t: 'Später. Sie werden die Ebene sterilisieren. Wir müssen hier raus.', v: 'm2_f' },
        ]);
        c.unlook();
        await c.lines([
          { s: 'mine', t: 'Diese Box … das ist dein Blut. Die einzige Probe außerhalb von NEXARAs Tresor. Gib sie mir, ich weiß, wie man sie kühlt.', v: 'm2_g' },
        ]);
        const ch = await c.choice('Mine streckt die Hand nach der Kryo-Box „017“ aus.', [
          { id: 'give', text: 'Die Box Mine geben.', hint: '„Ich vertraue dir.“' },
          { id: 'keep', text: 'Die Box selbst behalten.', hint: '„Ich kenne dich nicht.“' },
        ]);
        if (ch === 'give') { c.flag('sample', 'mine'); await c.lines([{ s: 'mine', t: 'Danke. … Das hast du früher auch getan. Mir vertraut.', v: 'm2_h' }]); }
        else { c.flag('sample', 'sami'); c.give('sample', 'sample017', 'Kryo-Box „017“'); await c.lines([{ s: 'mine', t: 'Natürlich. Du kennst mich ja nicht.', v: 'm2_i' }]); }
        c.flag('mine_met');
        await c.lines([
          { s: 'mine', t: 'Im Kühlraum B liegt noch etwas: S-17. Ein Serum, aus deinem Blut. Eine einzige Dosis. Wenn jemand gebissen wird …', v: 'm2_j' },
          { s: 'mine', t: 'Der Weg nach draußen führt durch die Quarantäneschleusen. Ich öffne den Südtrakt.', v: 'm2_k' },
        ]);
        c.sound('beep_card', [60.5, 1.5, 37]);
        c.unlock('d_south'); c.open('d_south');
        if (m) m.follow();
        c.objective('Durch den Südtrakt zu den Quarantäneschleusen. (Optional: Serum S-17 aus Kühlraum B)');
        c.checkpoint('mine');
        await c.wait(6);
        c.msg('unknown', 'UNBEKANNT', 'Nach vorne. Immer nur nach vorne.');
        await c.wait(2.5);
        await c.lines([
          { s: 'mine', t: 'Wer schreibt dir?', v: 'm2_l' },
          { s: 'sami', t: 'Ich weiß es nicht. Er nennt keinen Namen. Er kennt den Weg.' },
          { s: 'mine', t: '„Nach vorne“ … Das hast du immer gesagt. Immer.', v: 'm2_m' },
        ]);
        c.fact('Mine kennt den Satz „Nach vorne“. Sie sagt, das hätte ich immer gesagt.');
      },
    },
    { id: 'c2_hall_t', when: 'enter:hall', do: async (c) => { c.flag('c2_hall_t', c.g.story.time); } },
    {
      id: 'c2_south', when: 'enter:southcorr', do: async (c) => {
        c.checkpoint('south');
        await c.wait(2);
        c.msg('unknown', 'UNBEKANNT', 'Kühlraum B, westlich. Eine Ampulle: S-17. Nimm sie mit. Du wirst sie brauchen.');
      },
    },
    { id: 'c2_argus', when: 'interact:argus_term', once: false, do: async (c) => { await c.doc('c2_argus'); if (!c.get('argus_fact')) { c.flag('argus_fact'); c.fact('ARGUS: Ein Skript namens NACHVORNE schreibt mir. Besitzer: s.yildiz. Das ist … mein Benutzername?'); } } },
    { id: 'c2_badge', when: 'closed:c2_badge', do: async (c) => { c.fact('Dr. Arendt, die Projektleiterin, ist eine von ihnen. Sie kann nicht die Stimme am Telefon sein.'); } },
    { id: 'c2_laptop', when: 'closed:c2_laptop', do: async (c) => { c.fact('Ein Techniker (idemir, 4471) hat ARGUS um 03:17 abgeschaltet und die EVE-Daten kopiert. Für „Defne“.'); } },
    {
      id: 'c2_serum', when: 'pickup:serum', do: async (c) => {
        c.flag('has_serum');
        await c.wait(0.6);
        if (c.npc('mine')) await c.lines([{ s: 'mine', t: 'Du hast es. Pass gut darauf auf, Sami. Das ist mehr wert als wir beide.', v: 'm2_n' }]);
        c.fact('Serum S-17: eine Dosis. Wirkt nur bei frischen Bissen (< 6 Std.).');
      },
    },
    // ---------- Sterilisation ----------
    {
      id: 'c2_sterile', when: 'enter:q_a', do: async (c) => {
        const g = c.g;
        c.flag('sterile');
        const mm = c.npc('mine'); if (mm && mm.pos.z < 49) mm.teleport(60.5, 49.6);
        c.close('q1', { force: true }); c.lock('q1');
        c.sound('klaxon', [60.5, 2.5, 50], { vol: 0.8 });
        c.lightMode('lab', 'off'); c.lightMode('q', 'flicker'); c.power('qRed', true);
        c.loop('alarm', 'alarm', [60.5, 2.5, 56], { vol: 0.35, bus: 'sfx' });
        c.pa([{ s: 'pa', t: 'Sterilisationsprotokoll eingeleitet. Alle Quarantäneschleusen schließen nacheinander.', v: 'pa_i3' }]);
        await c.wait(1.2);
        const t = g.difficulty.chaseTime;
        c.breakGlass('labA');
        c.chase(['z_la1', 'z_la2', 'z_la3']);
        c.unlock('q2'); c.open('q2');
        c.lines([{ s: 'mine', t: 'Lauf! Die Schleusen schließen nacheinander! Oder durch den Schacht da!', v: 'm2_o' }]);
        (async () => {
          await c.wait(3.2);
          await c.pa([{ s: 'unknown', name: 'UNBEKANNT', t: 'Der Schacht links von dir. Geduckt. Er führt an allen Schleusen vorbei.', v: 'c2_pa_contact' }]);
          await c.lines([{ s: 'mine', t: 'Die Stimme … aus den Lautsprechern?! Wer ist das, Sami?' }]);
          c.fact('Die Stimme vom Telefon kann auch über die Lautsprecher des Instituts sprechen. Sie hat Zugriff auf ARGUS.');
        })();
        c.objective('Durch die Schleusen – bevor sie schließen! (Alternativ: Lüftungsschacht)');
        c.g.hud.toast(`Schacht: nur geduckt <kbd>${c.g.input.label('crouch')}</kbd>`);
        await c.wait(2.5 * t);
        // Überlauf Sektion C bricht auf
        const od = c.door('d_overflow'); if (od) { od.setLocked(false); od.open(null, { force: true, fast: true }); od.broken = true; }
        c.sound('door_slam', [62, 1.2, 56], { vol: 1 });
        c.chase(['z_over0', 'z_over1', 'z_over2']);
        if (c.get('in_tunnel')) return;
        c.unlock('q3'); c.open('q3');
        await c.wait(5.5 * t);
        c.close('q2', { slow: true, force: true }); c.lock('q2');
        if (c.get('in_tunnel')) return;
        c.unlock('q4'); c.open('q4');
        await c.wait(6.5 * t);
        c.close('q3', { slow: true, force: true }); c.lock('q3');
        await c.wait(6.5 * t);
        c.close('q4', { slow: true, force: true }); c.lock('q4');
      },
    },
    {
      id: 'c2_tunnel', when: 'enter:tunnel', do: async (c) => {
        const g = c.g;
        c.flag('in_tunnel');
        for (const id of ['q2', 'q3', 'q4']) { const d = c.door(id); if (d && d.target > 0.5) { c.close(id, { force: true }); c.lock(id); } }
        c.stopLoop('alarm', 4);
        // Verfolger jenseits der Schleusen bleiben zurück
        for (const z of g.zombies) if (z.alive && z.pos.z < 63.5 && z.state === 'chase') { z.lastKnown = { x: z.pos.x, z: z.pos.z }; z.lastSeenT = -99; }
        const m = c.npc('mine'); if (m && m.pos.z < 63.5) { m.teleport(56, 65.5); m.follow(); }
        c.objective('Folge dem Versorgungstunnel zum Parkhaus.');
        c.checkpoint('tunnel');
        await c.wait(3);
        c.sound('door_bash', [60.5, 1.2, 63], { vol: 1 });
        await c.wait(2);
        await c.lines([
          { s: 'sami', t: 'Du hast mich im Krankenhaus versteckt. Ohne Namen.' },
          { s: 'mine', t: 'Sie hätten dich gesucht. Ohne Namen bist du nur ein weiterer Patient.', v: 'm2_p' },
          { s: 'sami', t: 'Und das Telefon neben mir?' },
          { s: 'mine', t: 'Deins. Ich dachte … wenn du aufwachst, sollst du nicht ganz allein sein.', v: 'm2_q' },
        ]);
      },
    },
    {
      id: 'c2_exit', when: 'enter:exit', do: async (c) => {
        c.msg('unknown', 'UNBEKANNT', 'Parkhaus Am Klinikum. Ebene minus drei. Achte auf die Autos.');
        await c.wait(1.5);
        c.setClock('05:02');
        await c.endChapter('ch3');
      },
    },
  ],
};

const ARGUS_MSG = 'ARGUS › NACHVORNE\nSIE IST HINTER DEM GLAS.\nVERTRAU IHR. EIN BISSCHEN.';

const FRAG2 = {
  title: 'Aufnahme 2/5 – „Zelle 017“',
  lines: [
    { s: 'fragment', t: 'Zelle 017. Hier habe ich die letzten acht Wochen gewohnt. Freiwillig. Klingt verrückt, oder?', v: 'f2_a' },
    { s: 'fragment', t: 'Elif war die Neun. Sie haben Mama gesagt, sie sei gestorben. Sie ist nicht gestorben. Sie ist da drüben.', v: 'f2_b' },
    { s: 'fragment', t: 'Ich habe dasselbe Gen. Ich habe mich gemeldet, weil ich Beweise wollte. Und weil ich Angst hatte.', v: 'f2_c' },
    { s: 'fragment', t: 'Sei nicht wütend auf Mine. Sie hat nur getan, worum ich sie gebeten habe.', v: 'f2_d' },
  ],
};
