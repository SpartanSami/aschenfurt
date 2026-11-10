// KAPITEL 1, TEIL 2 – NOTAUFNAHME & PATHOLOGIE
// Der Lastenaufzug hält im Erdgeschoss: Ohne NEXARA-Freigabe fährt er nicht nach U3.
// Versorgungsgang (fressender Schläfer), Zentrale Notaufnahme (Schleichen zwischen den Kabinen),
// Wartezimmer hinter Glas (die Scheibe bricht -> Verfolgung), Brandschutztür, Treppe in den Keller,
// Kellerflur, Pathologie (Kühlfächer, toter NEXARA-Kurier mit Zugangskarte) -> Lastenaufzug U3.
const PI = Math.PI;
const K = -3.2; // Bodenhöhe Keller

export default {
  id: 'ch1b', name: 'Das Krankenhaus', part: true, partName: 'Erdgeschoss · Notaufnahme',
  tagline: 'Klinikum St. Elisabeth · Notaufnahme & Pathologie',
  w: 62, h: 50,
  opts: { floor: 'h_floor', wall: 'h_wall', ceil: 'h_ceil', height: 3 },
  env: { fog: 0x07090a, fogDensity: 0.05, hemi: 0.02, exposure: 1.0, tint: 0xeef4ef, reverb: [1.6, 2.4], reverbMix: 0.34, date: 'Donnerstag, 13. November', sleeve: 0x8fb0c4 },

  build(L) {
    // ---------- Erdgeschoss ----------
    L.room('Lastenaufzug', 4, 24, 3, 3, { floor: 'metal_dark', wall: 'metal', ceil: 'metal' });
    L.door(7, 25, { id: 'd_lift', kind: 'elevator', locked: true, lockedText: 'Lastenaufzug – Weiterfahrt U3 gesperrt', noZombie: true });
    L.room('Versorgungsgang EG', 8, 23, 13, 4, { floor: 'h_floor2', wall: 'h_wall_dirty' });
    L.door(21, 24, { id: 'd_er_back', kind: 'normal' });
    L.room('Zentrale Notaufnahme', 22, 17, 20, 14, { floor: 'h_floor', wall: 'h_wall_green' });
    L.room('Wartebereich Notaufnahme', 30, 8, 12, 8, { floor: 'h_floor2' });
    L.glass(32, 16, 9, 1, { id: 'wait' });
    L.door2(30, 16, { id: 'd_wait', locked: true, lockedText: 'Von außen verriegelt. Jemand hat „NICHT ÖFFNEN“ darauf geschrieben.' });
    L.room('Flur Ost', 43, 18, 9, 3, { floor: 'h_floor2', wall: 'h_wall' });
    L.door(42, 19, { id: 'd_er_east', open: true });
    L.room('Schockraum', 44, 22, 7, 5, { floor: 'h_tile_floor', wall: 'h_tile_wall' });
    L.door(47, 21, { id: 'd_shock', open: true });
    L.room('Treppenhaus Süd', 53, 17, 5, 5, { floor: 'concrete', wall: 'concrete_wall', ceil: 'concrete' });
    L.door(52, 19, { id: 'd_fire', kind: 'metal', open: true, strength: 6, lockedText: 'Brandschutztür – verriegelt' });
    L.room('Treppe', 54, 22, 3, 7, { floor: 'concrete', wall: 'concrete_wall', ceil: 'concrete' });
    L.ramp(54, 22, 3, 7, '-z', K, -K, { stairs: true, mat: 'concrete' });

    // ---------- Keller ----------
    const kel = { floorY: K, floor: 'concrete_floor', wall: 'concrete_wall', ceil: 'concrete', wet: true };
    L.room('Treppenabsatz K', 54, 29, 3, 4, kel);
    L.room('Kellerflur', 15, 33, 42, 3, kel);
    L.room('Lastenaufzug U1–U3', 11, 33, 3, 3, { floorY: K, floor: 'metal_dark', wall: 'metal', ceil: 'metal' });
    L.door(14, 34, { id: 'd_lift_u3', kind: 'elevator', locked: true, key: 'card_nexara', lockedText: 'Lastenaufzug U1–U3 · NEXARA-Zugangskarte erforderlich', noZombie: true });
    L.room('Pathologie', 19, 37, 14, 10, { floorY: K, floor: 'h_tile_floor', wall: 'h_tile_wall', ceil: 'h_ceil' });
    L.door2(25, 36, { id: 'd_patho', kind: 'normal' });
    L.room('Büro Pathologie', 34, 37, 7, 5, { floorY: K, floor: 'h_floor2', wall: 'h_wall_dirty', ceil: 'h_ceil' });
    L.door(37, 36, { id: 'd_patho_off' });
    L.room('Wäscherei', 43, 37, 8, 6, { floorY: K, floor: 'concrete_floor', wall: 'h_tile_wall', ceil: 'concrete' });
    L.door(46, 36, { id: 'd_laundry' });

    // ================= Licht =================
    L.light(5.5, 25.5, { kind: 'panel', mul: 0.5, group: 'lift', mode: 'flicker', speed: 0.5 });
    L.lightsAlong(10, 24.5, 19, 24.5, 4.5, (i) => ({ kind: 'tube', mode: i === 1 ? 'broken' : 'steady', mul: 0.6 }));
    // Notaufnahme: wenig Licht, die Kabinen bleiben dunkel
    L.light(25, 24.5, { kind: 'panel', mode: 'flicker', mul: 0.55 });
    L.light(33, 24, { kind: 'panel', mul: 0.6 });
    L.light(39.5, 24.5, { kind: 'panel', mode: 'broken' });
    L.light(28, 19.5, { kind: 'panel', mode: 'off' });
    L.light(36, 29, { kind: 'panel', mode: 'off' });
    L.light(24, 29.4, { kind: 'emergency', group: 'emerg' });
    L.light(41, 18, { kind: 'emergency', group: 'emerg' });
    // Wartebereich hell – man sieht, was dort steht
    L.light(33, 11.5, { kind: 'panel_warm', mul: 0.75 });
    L.light(38.5, 11.5, { kind: 'panel_warm', mul: 0.75, mode: 'flicker', speed: 0.25 });
    L.light(36, 14.5, { kind: 'panel_warm', mul: 0.6 });
    // Flur Ost, Schockraum, Treppenhaus
    L.light(46, 19.5, { kind: 'panel', mul: 0.5, mode: 'flicker' });
    L.light(50.5, 19.5, { kind: 'emergency', group: 'emerg' });
    L.light(47.5, 24.5, { kind: 'lab', mul: 0.45, mode: 'flicker', speed: 0.4 });
    L.light(55.5, 19, { kind: 'bulb', mul: 0.8 });
    L.light(55.5, 26, { kind: 'bulb', mul: 0.6, mode: 'flicker' });
    // Keller
    L.lightsAlong(19, 34.5, 53, 34.5, 5, (i) => ({ kind: 'tube', mode: i === 2 ? 'broken' : i === 4 ? 'flicker' : 'steady', mul: 0.55, group: 'keller' }));
    L.light(12.5, 34.5, { kind: 'panel', mul: 0.45, group: 'keller' });
    L.light(23, 41, { kind: 'lab', mul: 0.45, group: 'patho' });
    L.light(29, 41, { kind: 'lab', mul: 0.45, group: 'patho', mode: 'flicker', speed: 0.3 });
    L.light(25.5, 45, { kind: 'lab', mul: 0.35, group: 'patho', mode: 'broken' });
    L.light(37.5, 39.5, { kind: 'panel_warm', mul: 0.45 });
    L.light(55.5, 31, { kind: 'bulb', mul: 0.5, group: 'keller' });
    L.light(47, 40, { kind: 'tube', mul: 0.45, mode: 'flicker' });

    // ================= Requisiten =================
    // Aufzug
    L.sign('EG · WEITERFAHRT U3: FREIGABE ERFORDERLICH', 4.03, 25.5, { w: 1.2, h: 0.22, y: 1.75, face: 'w', bg: '#101010', fg: '#ff5040', glow: true });
    L.prop('label', 5.5, 24.02, { text: 'Max. 2000 kg · 26 Personen', w: 0.6, h: 0.14, y: 1.6 });
    // Versorgungsgang
    L.prop('cart', 9.6, 23.5, { rot: 0.1 });
    L.prop('boxes', 12.0, 26.3, { n: 3 });
    L.prop('gurney', 14.3, 23.5, { rot: PI / 2 + 0.1 });
    L.prop('body', 17.5, 24.6, { cloth: 'scrubs', rot: 1.4, blood: true });
    L.prop('barrels', 20.2, 26.4, { n: 2, mat: 'plastic_blue' });
    L.prop('pipe', 14, 23.15, { len: 12, y: 2.65, r: 0.08, rot: PI / 2 });
    L.sign('NOTAUFNAHME →', 20.97, 24, { w: 1.2, h: 0.26, y: 2.35, face: 'e', bg: '#a01818', fg: '#fff' });
    // Notaufnahme – Kabinen Nord (West) und Süd
    L.prop('curtain', 26, 19, { rot: PI / 2, w: 3.6 });
    L.prop('curtain', 24, 21.2, { w: 3.0 });
    L.prop('gurney', 23.4, 18.6, { rot: 0, body: true, blood: true });
    L.prop('monitor_stand', 25.2, 17.7, { flat: true });
    L.prop('bed', 28.4, 18.9, { rot: 0, hide: true, exitSide: 'left' });
    L.prop('ivstand', 29.4, 17.6, {});
    for (const x of [26, 30, 34, 38]) L.prop('curtain', x, 29.1, { rot: PI / 2, w: 3.6 });
    L.prop('curtain', 24.6, 27.4, { w: 2.6 });
    L.prop('curtain', 32.6, 27.4, { w: 2.2 });
    L.prop('curtain', 40.0, 27.4, { w: 2.0 });
    L.prop('gurney', 23.8, 29.3, { rot: PI / 2 });
    L.prop('monitor_stand', 25.4, 30.2, { flat: true });
    L.prop('bed', 28.0, 29.6, { rot: PI / 2, blood: true });
    L.prop('gurney', 32.0, 29.4, { rot: PI / 2, blood: true });
    L.prop('bed', 36.0, 29.6, { rot: PI / 2, hide: true, exitSide: 'left' });
    L.prop('gurney', 40.0, 29.5, { rot: PI / 2, body: true });
    L.prop('monitor_stand', 41.4, 28.4, { flat: false });
    // Leitstelle
    L.prop('counter', 33.0, 23, { w: 4.4, d: 0.8, monitors: 2, papers: true });
    L.prop('counter', 33.0, 24.6, { w: 4.4, d: 0.7, rot: PI });
    L.prop('chair', 31.5, 23.9, { rot: 2.4 });
    L.prop('whiteboard', 27.5, 30.97, { w: 1.6, rot: PI });
    L.prop('wheelchair', 37.6, 22, { rot: 0.7 });
    L.prop('cart', 27.0, 25.8, { rot: -0.3 });
    L.prop('bed_flipped', 37.5, 25.6, { rot: 0.2 });
    L.prop('ivstand', 30.4, 21.6, {});
    L.prop('trash', 41.4, 22.2, {});
    L.prop('exit_sign', 41.97, 19, { mode: 'flicker', rot: -PI / 2 });
    L.sign('ZENTRALE NOTAUFNAHME', 22.03, 21, { w: 1.8, h: 0.3, y: 2.4, face: 'w', bg: '#a01818', fg: '#fff' });
    L.sign('WARTEBEREICH', 31.0, 16.97, { w: 1.2, h: 0.24, y: 2.45, face: 'n', bg: '#e9ecef' });
    L.sign('TREPPENHAUS SÜD · KELLER →', 41.97, 21.5, { w: 1.6, h: 0.26, y: 2.4, face: 'e', bg: '#e9ecef' });
    // Barrikade vor der Wartezimmertür
    L.prop('gurney', 30.9, 17.6, { rot: 0.15, vault: false });
    L.prop('poster', 30.5, 16.97, { rot: 0, text: 'NICHT\nÖFFNEN', bg: '#f2f2f2', fg: '#b01010', y: 1.5 });
    // Wartebereich
    L.prop('chairs_row', 33.5, 10, { n: 5 });
    L.prop('chairs_row', 38.5, 10, { n: 5 });
    L.prop('chairs_row', 33.5, 12.6, { n: 5, rot: PI });
    L.prop('chairs_row', 38.5, 12.6, { n: 5, rot: PI });
    L.prop('vending', 41.4, 9.2, { rot: -PI / 2, flicker: true });
    L.prop('tv', 30.03, 11.5, { y: 2.1, rot: PI / 2 });
    L.prop('plant', 30.5, 8.5, {});
    L.prop('desk', 35.8, 8.5, { w: 1.8, d: 0.6, monitor: true, chair: false, papers: true });
    L.sign('HAUPTEINGANG – GESPERRT · QUARANTÄNE', 36, 8.03, { w: 2.2, h: 0.3, y: 2.45, face: 'n', bg: '#ffd400', fg: '#111' });
    // Flur Ost / Schockraum
    L.prop('gurney', 44.5, 20.4, { rot: PI / 2 + 0.2, blood: true, vault: true });
    L.prop('fire_ext', 50.6, 18.05, {});
    L.prop('optable', 47.5, 24.5, {});
    L.prop('oplamp', 47.5, 24.5, { y: 3.0, swing: true });
    L.prop('cart', 45.0, 23, { rot: 0.5 });
    L.prop('monitor_stand', 49.6, 23, { beep: true });
    L.prop('cabinet', 50.5, 25.5, { w: 1.2, rot: -PI / 2, mat: 'steel' });
    L.sign('SCHOCKRAUM', 47.5, 21.03, { w: 1.0, h: 0.22, y: 2.35, face: 'n', bg: '#e9ecef' });
    // Treppenhaus
    L.prop('label', 53.4, 21.94, { text: 'BRANDSCHUTZTÜR\nSCHLIESSEN', w: 0.4, h: 0.2, y: 1.55, rot: PI });
    L.sign('K · PATHOLOGIE · WÄSCHEREI', 57.97, 19.5, { w: 1.6, h: 0.26, y: 2.4, face: 'e', bg: '#e9ecef' });
    // Keller
    L.prop('pipe', 36, 33.15, { len: 40, y: 2.7, r: 0.12, rot: PI / 2, mat: 'metal_rust' });
    L.prop('pipe', 36, 35.85, { len: 40, y: 2.55, r: 0.07, rot: PI / 2, mat: 'metal_dark' });
    L.prop('cart', 50.2, 35.45, { rot: 1.5 });
    L.prop('boxes', 41.5, 35.4, { n: 3 });
    L.prop('barrels', 33.0, 35.4, { n: 2, mat: 'metal_rust' });
    L.prop('gurney', 29.0, 33.6, { rot: PI / 2, body: true });
    L.prop('wheelchair', 43.2, 33.4, { rot: 2.0 });
    L.sign('← LASTENAUFZUG U1–U3', 25.5, 33.03, { w: 1.6, h: 0.26, y: K + 2.3, face: 'n', bg: '#e9ecef' });
    L.sign('PATHOLOGIE', 25.5, 35.97, { w: 1.2, h: 0.24, y: K + 2.45, face: 's', bg: '#e9ecef' });
    L.prop('label', 15.03, 34.6, { text: 'NEXARA · NUR BEFUGTE', w: 0.6, h: 0.14, y: 1.5, rot: PI / 2 });
    // Pathologie
    L.prop('optable', 22.5, 40.5, {});
    L.prop('body', 22.5, 40.3, { sheet: true, y: K + 0.98 });
    L.prop('optable', 28.5, 40.5, {});
    L.prop('body', 28.5, 40.3, { sheet: true, blood: true, y: K + 0.98 });
    L.prop('optable', 25.5, 43, {});
    L.prop('oplamp', 25.5, 43, { y: 3.0, swing: false });
    L.prop('morgue', 22.4, 46.45, { rot: PI, cols: 4, base: 0 });
    L.prop('morgue', 27.8, 46.45, { rot: PI, cols: 4, base: 12, open: 7 });
    L.prop('sink', 19.4, 39, { rot: PI / 2 });
    L.prop('cabinet', 32.4, 38.4, { w: 1.4, rot: -PI / 2, mat: 'steel' });
    L.prop('cart', 30.5, 42.2, { rot: 0.4 });
    L.prop('gurney', 20.4, 44.2, { rot: 0.1, body: true });
    // Kurier
    L.prop('body', 31.4, 44.8, { cloth: 'fabric_dark', rot: -2.4 });
    L.prop('crate', 32.2, 45.9, { w: 0.6, h: 0.4, d: 0.4, mat: 'metal' });
    // Büro
    L.prop('desk', 36.5, 38.4, { rot: 0, screen: 'text', screenOpts: { text: 'OBDUKTIONEN\nAUSGESETZT\nANW. NEXARA', color: '#ffb0a0' } });
    L.prop('shelf', 40.3, 39.5, { rot: -PI / 2, w: 2.0 });
    L.prop('cabinet', 34.6, 40.8, { w: 1.0, rot: PI / 2 });
    L.prop('chair', 38.5, 40.4, { rot: 2.2 });
    // Wäscherei
    for (const x of [44.0, 45.0, 46.0]) L.prop('cabinet', x, 37.4, { w: 0.9, h: 1.1, mat: 'steel' });
    L.prop('cart', 48.0, 39, { rot: 0.3 });
    L.prop('cart', 45.5, 41.4, { rot: -0.6 });
    L.prop('shelf', 50.5, 39.5, { rot: -PI / 2, w: 2.4 });
    L.prop('locker', 43.35, 40.5, { rot: PI / 2, hide: true });
    L.prop('locker', 43.35, 41.2, { rot: PI / 2 });

    // ================= Decals =================
    L.decal('blood_pool', 17.4, 25.0, { size: 1.8 });
    L.decal('blood_trail', 19.5, 25.0, { size: 2.4, rot: PI / 2 });
    L.decal('blood_smear', 21.6, 24.5, { size: 1.0 });
    L.decal('blood_pool', 23.4, 19.5, { size: 1.4 });
    L.decal('blood_hand', 34.5, 16.98, { wall: 'n', y: 1.3, size: 0.4 });
    L.decal('blood_hand', 37.2, 16.98, { wall: 'n', y: 1.1, size: 0.4 });
    L.decal('blood_trail', 35, 26.5, { size: 3.0, rot: 0.2 });
    L.decal('paper', 32.5, 22.0); L.decal('paper', 34.2, 21.6); L.decal('paper', 29.0, 24.5);
    L.decal('blood_splat', 47.5, 25.4, { size: 1.6 });
    L.decal('blood_trail', 46, 34.4, { size: 2.6, rot: PI / 2 });
    L.decal('blood_pool', 31.0, 44.2, { size: 1.6 });
    L.decal('blood_smear', 24.0, 45.6, { size: 1.0 });

    // ================= Gegenstände & Dokumente =================
    L.item('bottle', 12.6, 26.3, { id: 'b1b_bottle', h: 0.9 });
    L.item('bandage', 9.8, 23.5, { id: 'b1b_cart', h: 0.95, notHard: true });
    L.item('doc', 33.6, 23.0, { id: 'doc_triage', doc: 'c1b_triage', h: 1.1 });
    L.item('pills', 32.0, 22.95, { id: 'p1b_lst', h: 1.1, extra: true });
    L.item('can', 27.0, 25.8, { id: 'c1b_can', h: 0.95 });
    L.item('bandage', 45.0, 23.0, { id: 'b1b_shock', h: 0.95 });
    L.item('ammo', 34.6, 24.6, { id: 'ammo1b_a', h: 1.08, rounds: 12 });
    L.item('medkit', 36.0, 38.4, { id: 'mk1b_off', h: 0.78 });
    L.item('doc', 37.0, 38.4, { id: 'doc_patho', doc: 'c1b_patho', h: 0.78 });
    L.item('pills', 50.5, 39, { id: 'p1b_laundry', h: 1.2, notHard: true });
    L.item('bottle', 41.5, 35, { id: 'b1b_bottle2', h: 0.95 });
    L.item('keycard', 31.0, 44.4, { id: 'card_nexara', keyId: 'card_nexara', name: 'NEXARA-Zugangskarte (Kurier)', h: 0.08 });
    L.item('doc', 30.4, 45.4, { id: 'doc_kurier', doc: 'c1b_kurier', h: 0.03 });
    L.item('ammo', 31.9, 45.4, { id: 'ammo1b_b', h: 0.03, rounds: 15 });

    L.interact('fire_btn', 53.35, 21.9, { prompt: 'Brandschutztür schließen', y: 1.35, radius: 1.3, mesh: 'panel', rot: PI, enabled: (g) => !g.state.flags.fire_closed });

    // ================= Gegner =================
    L.zombie(17.4, 25.4, { id: 'z_feed', type: 'sleeper', pose: 'kneel', yaw: 0.2, outfit: 'scrubs', wake: 2.6 });
    L.zombie(24.0, 28.6, { id: 'z_bay1', type: 'sleeper', pose: 'lying', yaw: PI / 2, outfit: 'gown', wake: 3 });
    L.zombie(32.2, 28.4, { id: 'z_bay3', type: 'sleeper', pose: 'sitting', yaw: 0, outfit: 'gown', wake: 3 });
    L.zombie(28.0, 26.3, { id: 'z_er_w', type: 'wanderer', outfit: 'scrubs', patrol: [[24, 26.3], [39, 26.3]] });
    L.zombie(40.6, 26.4, { id: 'z_er_st', type: 'stalker', stalker: true, yaw: PI / 2 + 0.3, outfit: 'labcoat' });
    const crowd = [[32.6, 15.2, 'civilian'], [34.3, 14.6, 'suit'], [35.6, 15.3, 'gown'], [36.9, 14.2, 'civilian2'], [38.1, 15.1, 'civilian'], [39.6, 14.7, 'scrubs'], [35.0, 13.4, 'civilian2']];
    crowd.forEach(([x, z, outfit], i) => L.zombie(x, z, { id: 'w' + (i + 1), type: 'shambler', state: 'dormant', wake: 99, yaw: PI + (i % 3 - 1) * 0.35, outfit, spawnIf: (f) => !f['glass:wait'] }));
    L.zombie(48.6, 25.6, { id: 'z_shock', type: 'sleeper', pose: 'lying', yaw: -PI / 2, outfit: 'gown', wake: 2.8 });
    L.zombie(40.0, 34.4, { id: 'z_k_w', type: 'wanderer', outfit: 'security', patrol: [[33, 34.5], [52, 34.5]] });
    L.zombie(49.0, 41.4, { id: 'z_laundry', type: 'shambler', yaw: PI / 2, outfit: 'scrubs' });
    // Kriecher im dunklen Westteil des Kellerflurs: liegt still an der Nordwand, bis Sami mit der Karte zurückrennt
    L.zombie(17.2, 33.4, { id: 'z_crawl1', type: 'crawler', yaw: -PI / 2, outfit: 'gown', state: 'dormant', wake: 99 });
    L.zombie(21.2, 42.6, { id: 'z_p1', type: 'sleeper', pose: 'lying', yaw: 0.4, outfit: 'gown', wake: 3.2 });
    L.zombie(29.6, 38.6, { id: 'z_p2', type: 'sleeper', pose: 'lying', yaw: -1.4, outfit: 'gown', wake: 3.2 });

    // ================= Auslöser & Checkpoints =================
    L.trigger('corr', 9, 23, 4, 4);
    L.trigger('er_in', 22, 17, 3, 14);
    L.trigger('er_east', 35, 17, 7, 14);
    L.trigger('flur_ost', 43, 18, 9, 3);
    L.trigger('stairs', 53, 17, 5, 5);
    L.trigger('keller', 54, 30, 3, 3);
    L.trigger('patho_in', 19, 37, 14, 3);
    L.trigger('lift_car', 11, 33, 3, 3);
    L.trigger('crawl_wake', 19, 33, 5, 3);
    L.checkpoint('start', 5.5, 25.5, -PI / 2);
    L.checkpoint('corr', 10.5, 24.8, -PI / 2);
    L.checkpoint('er', 23.0, 24.0, -PI / 2);
    L.checkpoint('stairs', 55.5, 20.5, PI);
    L.checkpoint('keller', 55.5, 31.0, PI);
    L.checkpoint('patho', 25.5, 38, PI);
  },

  ambience(g) {
    g.audio.loop('amb', 'hvac_loop', { vol: 0.3, bus: 'amb', reverb: false });
  },

  onLoad(c, info) {
    const g = c.g;
    c.setClock(info.restored ? g.phone.clock : '04:27');
    if (c.get('fire_closed')) {
      // Hinter der Brandschutztür: die Menge aus dem Wartezimmer
      g.audio.loop('bash', 'buzz_loop', { pos: { x: 51.5, y: 1.5, z: 19.5 }, vol: 0.08, bus: 'sfx' });
    }
  },

  script: [
    // ---------- Halt im Erdgeschoss ----------
    {
      id: 'c1b_start', when: 'start', if: (c) => !c.get('c1b_started'), do: async (c) => {
        const g = c.g, p = g.player;
        p.mode = 'locked';
        c.loop('lift_motor', 'elevator_motor', [5.5, 1.5, 25.5], { vol: 0.7, bus: 'sfx' });
        c.shake(0.25);
        await c.wait(2.2);
        c.stopLoop('lift_motor', 0.4);
        c.sound('metal_creak', [5.5, 2.5, 25.5], { vol: 0.9 });
        c.shake(0.5);
        c.lightMode('lift', 'strobe');
        await c.wait(1.0);
        c.lightMode('lift', 'flicker');
        c.say('sami', 'Nein … nicht jetzt. Warum hält er?', { d: 2.6 });
        await c.wait(2.4);
        c.look(4.1, 1.75, 25.5, 1.2);
        await c.wait(1.6);
        c.unlook();
        c.say('sami', '„Weiterfahrt U3: Freigabe erforderlich.“', { d: 2.6 });
        await c.wait(2.8);
        c.sound('elevator_ding', [6.5, 2.2, 25.5], { vol: 0.8 });
        c.unlock('d_lift'); c.open('d_lift');
        p.mode = 'normal';
        await c.wait(1.2);
        await c.call('UNBEKANNT', [
          { s: 'unknown', t: 'Der Aufzug fährt ohne Freigabe nicht nach U3. NEXARA hat die Schächte gesperrt.', v: 'c1b_call_a' },
          { s: 'sami', t: 'Woher wissen Sie, wo ich bin?', d: 2.0 },
          { s: 'unknown', t: 'Laut Zutrittsprotokoll ging vor Stunden eine NEXARA-Karte in die Pathologie. Sie kam nie wieder heraus. Wer sie trug, liegt noch dort.', v: 'c1b_call_b' },
          { s: 'unknown', t: 'Durch die Notaufnahme, dann die Treppe in den Keller. Und weck nicht, was dort liegt.', v: 'c1b_call_c' },
        ], { timeout: 25 });
        c.objective('Finde den NEXARA-Kurier in der Pathologie (Keller). Weg: durch die Notaufnahme.');
        c.fact('Der Lastenaufzug fährt nur mit NEXARA-Freigabe nach U3. Laut Zutrittsprotokoll liegt eine NEXARA-Karte in der Pathologie – beim Kurier, der sie trug.');
        c.flag('c1b_started');
        c.checkpoint('corr');
      },
    },
    {
      id: 'c1b_corr', when: 'enter:corr', do: async (c) => {
        await c.wait(1.0);
        if (!c.zombie('z_feed') || c.zombie('z_feed').state !== 'dormant') return;
        c.say('sami', '(flüsternd) Er … isst.', { d: 2 });
        await c.wait(1.5);
        c.msg('unknown', 'UNBEKANNT', 'Er ist beschäftigt. Geh geduckt an der Wand vorbei. Nicht rennen.');
      },
    },
    {
      id: 'c1b_er', when: 'enter:er_in', do: async (c) => {
        c.checkpoint('er');
        c.objective('Durchquere die Notaufnahme. Ausgang Ost, dann das Treppenhaus Süd.');
        await c.wait(1.5);
        await c.pa([
          { s: 'pa', t: 'Code Grau in der Zentralen Notaufnahme. Der Wartebereich bleibt verschlossen.', v: 'pa_er1' },
          { s: 'pa', t: 'Öffnen Sie die Türen nicht. Ich wiederhole: Öffnen Sie die Türen nicht.', v: 'pa_er2' },
        ], { parallel: true });
        await c.wait(2);
        c.msg('unknown', 'UNBEKANNT', 'In den Kabinen liegen sie da, wo man sie hingelegt hat. Bleib im Gang. Bleib im Dunkeln.');
      },
    },
    { id: 'c1b_triage', when: 'closed:c1b_triage', do: async (c) => { await c.wait(0.4); c.say('sami', 'Drei Tage. Und keiner hat es gemeldet.', { d: 2.6 }); c.fact('Triage-Protokoll: Seit Dienstag 03:40 Bissverletzungen. NEXARA untersagte Meldungen an das Gesundheitsamt.'); } },
    // ---------- Das Wartezimmer ----------
    {
      id: 'c1b_glass', when: 'enter:er_east', if: (c) => !c.get('glass:wait'), do: async (c) => {
        const g = c.g, p = g.player;
        const crowd = ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7'].map((id) => c.zombie(id)).filter(Boolean);
        c.sound('glass_knock', [36.5, 1.4, 16.5], { vol: 1 });
        await c.wait(0.6);
        c.sound('glass_knock', [34.5, 1.4, 16.5], { vol: 1 });
        c.look(36.5, 1.5, 15.0, 1.5);
        c.sting();
        await c.wait(1.2);
        c.unlook();
        c.say('sami', 'Das ganze Wartezimmer …', { d: 2.2 });
        for (const z of crowd) z.forceChase();
        let t = 0, cracks = 0;
        // Fäuste gegen das Glas, bis Sami am Ostausgang ist oder die Scheibe nachgibt
        while (t < 13) {
          const dt = 0.3 + Math.random() * 0.5;
          await c.wait(dt); t += dt;
          c.sound('glass_knock', [32.5 + Math.random() * 8, 1.4, 16.5], { vol: 0.8 + Math.random() * 0.3 });
          if (t > 3.5 && cracks === 0) { cracks = 1; c.sound('glass_crack', [36, 1.6, 16.5], { vol: 1 }); c.objective('Raus hier! Flur Ost – und schließ die Brandschutztür hinter dir!'); c.msg('unknown', 'UNBEKANNT', 'Treppenhaus Süd. Die Brandschutztür hat einen Schalter. Schließ sie.'); }
          if (t > 7 && cracks === 1) { cracks = 2; c.sound('glass_crack', [34, 1.6, 16.5], { vol: 1 }); }
          if (cracks >= 1 && (p.pos.x > 41.2 || c.inZone('flur_ost') || c.inZone('stairs'))) break;
        }
        c.sound('glass_crack', [37, 1.6, 16.5], { vol: 1 });
        await c.wait(0.9);
        c.breakGlass('wait');
        c.sound('glass_break', [36, 1.4, 16.5], { vol: 1 });
        c.shake(0.3);
        c.noise(36, 17, 22, 'glass');
        for (const z of crowd) if (z.alive) z.forceChase();
        c.objective('Lauf! Treppenhaus Süd – Brandschutztür schließen!');
        g.hud.toast(`Am Schalter <kbd>${g.input.label('interact')}</kbd>: Brandschutztür schließen und verriegeln`);
      },
    },
    {
      id: 'c1b_fire', when: 'interact:fire_btn', do: async (c) => {
        const g = c.g;
        c.flag('fire_closed');
        c.sound('click', [53.35, 1.35, 21.9]);
        const d = c.door('d_fire');
        if (d) d.crushing = true;
        c.close('d_fire', { force: true });
        c.lock('d_fire');
        c.sound('door_slam', [52.5, 1.2, 19.5], { vol: 1 });
        c.shake(0.2);
        await c.wait(1.2);
        c.say('sami', 'Verriegelt. Hält sie?', { d: 2 });
        await c.wait(1.5);
        c.sound('door_bash', [52.5, 1.2, 19.5], { vol: 1 });
        await c.wait(0.9);
        c.sound('door_bash', [52.5, 1.2, 19.5], { vol: 1 });
        c.objective('Die Treppe hinunter in den Keller. Zur Pathologie.');
        // Checkpoint erst, wenn kein Verfolger im Treppenhaus steht
        const safe = () => !g.zombies.some((z) => z.alive && z.pos.x > 52.6 && ['chase', 'attack', 'grab'].includes(z.state));
        await c.until(safe, 30);
        if (safe() && g.player.mode !== 'dead') c.checkpoint('stairs');
      },
    },
    {
      id: 'c1b_stairs_hint', when: 'enter:stairs', if: (c) => !c.get('fire_closed') && c.get('glass:wait'), do: async (c) => {
        await c.wait(0.8);
        if (!c.get('fire_closed')) c.toast(`Schalter neben der Tür: <kbd>${c.g.input.label('interact')}</kbd> Brandschutztür schließen`);
      },
    },
    // ---------- Keller ----------
    {
      id: 'c1b_keller', when: 'enter:keller', do: async (c) => {
        c.checkpoint('keller');
        await c.wait(1.2);
        c.say('sami', 'Kalt hier unten.', { d: 1.8 });
        await c.wait(2);
        c.msg('unknown', 'UNBEKANNT', 'Pathologie, Westflügel. Der Kurier liegt da, wo ihn niemand mehr sucht.');
        c.objective('Finde die Pathologie im Westflügel des Kellers.');
      },
    },
    {
      id: 'c1b_patho', when: 'enter:patho_in', do: async (c) => {
        if (!c.get('card_taken')) c.checkpoint('patho');
        await c.wait(1.4);
        c.sound('drawer_bang', [26.6, K + 1.1, 46.5], { vol: 0.9 });
        await c.wait(1.0);
        c.say('sami', '…!', { d: 1 });
        await c.wait(1.6);
        c.sound('drawer_bang', [26.6, K + 1.1, 46.5], { vol: 1 });
        await c.wait(0.5);
        c.sound('drawer_bang', [26.6, K + 1.1, 46.5], { vol: 0.8 });
        await c.wait(1.0);
        c.say('sami', 'In den Kühlfächern … da ist jemand drin.', { d: 2.6 });
        await c.wait(2.4);
        c.msg('unknown', 'UNBEKANNT', 'Die Fächer sind verriegelt. Lass sie zu. Der Kurier liegt hinten links, vor den Kühlfächern.');
        c.objective('Durchsuche den Kurier (hinten links, vor den Kühlfächern).');
      },
    },
    {
      id: 'c1b_patho_doc', when: 'closed:c1b_patho', do: async (c) => {
        await c.wait(0.5);
        c.say('sami', 'Elif … ein Totenschein ohne Leichnam?', { d: 3 });
        c.fact('Pathologie-Eingangsbuch: Für „Proband 009 – Y., Elif“ wurde ein Totenschein ausgestellt. Ein Leichnam ist nie eingegangen.');
        await c.wait(3.2);
        c.say('sami', 'Dann ist sie vielleicht gar nicht …', { d: 2.4 });
      },
    },
    {
      id: 'c1b_card', when: 'pickup:card_nexara', do: async (c) => {
        const g = c.g;
        c.flag('card_taken');
        await c.wait(0.6);
        c.say('sami', 'NEXARA-Sicherheit. Er sollte etwas abholen …', { d: 2.6 });
        c.objective('Zum Lastenaufzug U1–U3 am Westende des Kellerflurs!');
        await c.wait(2.4);
        c.sound('drawer_bang', [26.6, K + 1.1, 46.5], { vol: 1 });
        c.lightMode('patho', 'strobe');
        await c.wait(0.6);
        c.sound('drawer_bang', [26.6, K + 1.1, 46.5], { vol: 1 });
        c.sound('metal_creak', [26.6, K + 1.1, 46.5], { vol: 1 });
        await c.wait(0.8);
        c.lightMode('patho', 'flicker');
        const t = g.difficulty.chaseTime;
        const a = c.spawn({ x: 27.4, z: 45.1, type: 'hunter', outfit: 'gown', pose: 'lying', yaw: PI });
        a.forceChase();
        c.wake('z_p1', 'chase'); c.wake('z_p2', 'chase');
        c.noise(26, 42, 20, 'bang');
        await c.wait(2.5 * t);
        const b = c.spawn({ x: 23.0, z: 45.1, type: 'hunter', outfit: 'gown', pose: 'lying', yaw: PI });
        b.forceChase();
      },
    },
    {
      // Auf der Flucht: Der „Tote“ an der Nordwand des Kellerflurs zieht sich auf Sami zu (Ausweichen an der Südwand)
      id: 'c1b_crawl', when: 'enter:crawl_wake', if: (c) => c.get('card_taken'), do: async (c) => {
        await c.wait(0.2);
        c.wake('z_crawl1', 'chase');
        c.say('sami', 'Der da bewegt sich noch …', { d: 1.8 });
      },
    },
    {
      id: 'c1b_lift_unlock', when: 'unlock:d_lift_u3', do: async (c) => {
        c.objective('Rein in den Aufzug!');
        c.sound('elevator_ding', [12.5, K + 2.2, 34.5], { vol: 0.8 });
      },
    },
    {
      id: 'c1b_lift', when: 'enter:lift_car', if: (c) => c.get('card_taken'), do: async (c) => {
        const d = c.door('d_lift_u3');
        if (d) d.crushing = true;
        c.close('d_lift_u3', { force: true });
        c.lock('d_lift_u3');
        await c.wait(1.2);
        c.sound('door_bash', [14, K + 1.2, 34.5], { vol: 1 });
        c.shake(0.4);
        await c.wait(0.7);
        c.loop('lift_motor', 'elevator_motor', [12.5, K + 1.5, 34.5], { vol: 0.8, bus: 'sfx' });
        c.sound('beep_card', [11.2, K + 1.3, 34.5]);
        c.shake(0.5);
        await c.wait(2.5);
        c.msg('unknown', 'UNBEKANNT', 'Ebene U3. Halden-Institut. Du warst schon einmal hier.');
        await c.wait(2.5);
        c.setClock('04:38');
        await c.endChapter('ch2');
      },
    },
  ],
};
