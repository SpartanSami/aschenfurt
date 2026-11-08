// KAPITEL 1 – DAS KRANKENHAUS
// Station 3 des Klinikums St. Elisabeth: Erwachen, erste Begegnung, Schleichen, Intensivstation (Verfolgung + Versteck),
// OP-Trakt im Dunkeln, Sicherheitsbüro (Kameras), Notstrom -> Horde -> Lastenaufzug in letzter Sekunde.
const PI = Math.PI;

export default {
  id: 'ch1', name: 'Das Krankenhaus', tagline: 'Klinikum St. Elisabeth · Station 3',
  w: 80, h: 62,
  opts: { floor: 'h_floor', wall: 'h_wall', ceil: 'h_ceil', height: 3 },
  env: { fog: 0x07090a, fogDensity: 0.05, hemi: 0.02, exposure: 1.0, tint: 0xeef4ef, reverb: [1.5, 2.6], reverbMix: 0.32, date: 'Donnerstag, 13. November', sleeve: 0x8fb0c4 },

  build(L) {
    // ---------- Station 3 ----------
    L.room('Stationsflur', 4, 14, 40, 3, { rail: true });
    L.room('Wartebereich', 44, 13, 14, 8, { floor: 'h_floor2' });
    L.room('Treppenhaus Ost', 59, 13, 4, 5, { floor: 'concrete', wall: 'concrete_wall', ceil: 'concrete' });
    L.door(58, 15, { id: 'stair_east', kind: 'metal', locked: true, lockedText: 'Treppenhaus – Quarantäne. Verriegelt.' });
    L.room('Untersuchung 3', 9, 7, 6, 6, { wall: 'h_wall_green', floor: 'h_tile_floor' });
    L.door(11, 13, { id: 'd_exam' });
    L.room('Zimmer 302', 16, 8, 6, 5);
    L.door(18, 13, { id: 'd302', open: true });
    L.room('Zimmer 303', 23, 8, 6, 5, { wall: 'h_wall_dirty' });
    L.door(25, 13, { id: 'd303', locked: true, lockedText: 'Abgeschlossen. Etwas wirft sich von innen dagegen.', mat: 'door_h_blood' });
    L.room('Zimmer 304', 30, 8, 6, 5, { wall: 'h_wall_dirty' });
    L.door(32, 13, { id: 'd304', open: true });
    L.room('Zimmer 305', 37, 8, 6, 5);
    L.door(39, 13, { id: 'd305' });
    L.room('Stationszimmer', 20, 17, 8, 4, { floor: 'h_floor2' });
    L.room('Lager', 30, 18, 5, 4, { wall: 'h_tile_wall', floor: 'h_tile_floor' });
    L.door(32, 17, { id: 'd_lager' });
    L.room('WC', 36, 18, 4, 3, { wall: 'h_tile_wall', floor: 'h_tile_floor' });
    L.door(37, 17, { id: 'd_wc' });

    // ---------- Intensivstation ----------
    L.room('Intensivstation', 46, 22, 16, 13, { floor: 'h_floor', wall: 'h_wall_green' });
    L.door2(51, 21, { id: 'd_its' });
    L.room('Personalflur', 26, 29, 19, 3, { rail: true, wall: 'h_wall_dirty' });
    L.door(45, 29, { id: 'd_its_west' });
    L.room('Umkleide', 30, 23, 8, 5, { floor: 'h_tile_floor', wall: 'h_tile_wall' });
    L.door(33, 28, { id: 'd_umkleide' });

    // ---------- OP-Trakt ----------
    L.room('OP-Flur', 26, 33, 3, 17, { floor: 'h_tile_floor', wall: 'h_tile_wall' });
    L.door2(26, 32, { id: 'd_op', locked: true, key: 'card_op', lockedText: 'OP-Trakt – Zugangskarte erforderlich', kind: 'lab' });
    L.room('OP-Saal 1', 30, 35, 8, 7, { floor: 'h_tile_floor', wall: 'h_tile_wall' });
    L.door(29, 38, { id: 'd_op1', open: true });
    L.room('OP-Saal 2', 30, 43, 8, 6, { floor: 'h_tile_floor', wall: 'h_tile_wall' });
    L.door(29, 45, { id: 'd_op2', open: true });
    L.room('Sterilgut', 19, 35, 6, 6, { floor: 'h_tile_floor', wall: 'h_tile_wall' });
    L.door(25, 37, { id: 'd_steril' });
    L.room('Aufwachraum', 19, 42, 6, 7, { wall: 'h_wall_green' });
    L.door(25, 45, { id: 'd_aufwach' });

    // ---------- Versorgung ----------
    L.room('Versorgungsflur', 26, 50, 27, 3, { floor: 'h_floor2', wall: 'h_wall_dirty' });
    L.room('Sicherheitsbüro', 40, 44, 6, 5, { floor: 'h_floor2' });
    L.door(42, 49, { id: 'd_sec' });
    L.room('Ruheraum', 47, 44, 5, 5, { floor: 'h_floor2', wall: 'h_wall_dirty' });
    L.door(49, 49, { id: 'd_break', strength: 7.5 });
    L.room('Technikraum', 31, 54, 8, 5, { floor: 'concrete_floor', wall: 'concrete_wall', ceil: 'concrete', height: 3.2 });
    L.door(34, 53, { id: 'd_tech', kind: 'metal' });
    L.room('Lastenaufzug', 54, 50, 3, 3, { floor: 'metal_dark', wall: 'metal', ceil: 'metal' });
    L.door(53, 51, { id: 'd_elev', kind: 'elevator', locked: true, lockedText: 'Lastenaufzug – kein Strom', noZombie: true });

    // ---------- Beobachtungsraum U3 (nur über Kamera sichtbar) ----------
    L.room('Beobachtung U3', 70, 40, 6, 5, { floor: 'l_floor', wall: 'l_wall', ceil: 'l_ceil' });

    // ================= Licht =================
    L.lightsAlong(6, 15.5, 42, 15.5, 4, (i) => ({ kind: 'panel', mode: i === 2 ? 'flicker' : i === 5 ? 'broken' : i === 7 ? 'flicker' : 'steady', mul: 0.8 }));
    L.light(12, 9.5, { kind: 'panel', mode: 'flicker', mul: 0.7 });
    L.light(33, 10.5, { kind: 'panel', mode: 'broken' });
    L.light(40, 10.5, { kind: 'panel_warm', mul: 0.5 });
    L.light(24, 18.5, { kind: 'panel', mul: 0.8 });
    L.light(32.5, 20, { kind: 'panel', mode: 'broken' });
    L.light(38, 19.5, { kind: 'panel', mode: 'flicker', mul: 0.6 });
    L.light(50.5, 16, { kind: 'panel', mode: 'flicker', speed: 0.6, cone: true });
    L.light(46, 18, { kind: 'panel', mode: 'off' });
    L.light(55, 17, { kind: 'panel', mode: 'broken' });
    // ITS: gedämpft, Monitore
    for (const [x, z] of [[49, 25], [58, 25], [49, 31], [58, 31]]) L.light(x, z, { kind: 'panel', mul: 0.45, group: 'its', mode: x === 58 && z === 31 ? 'broken' : 'steady' });
    L.light(53.5, 28, { kind: 'panel_warm', mul: 0.55, group: 'its' });
    L.lightsAlong(28, 30, 43, 30, 5, (i) => ({ kind: 'panel', mode: i === 1 ? 'broken' : 'steady', mul: 0.7 }));
    L.light(34, 25, { kind: 'panel', mode: 'flicker', mul: 0.7 });
    // OP-Trakt (ohne Strom, nur Notlicht)
    L.lightsAlong(27.5, 35, 27.5, 47, 4, { kind: 'panel', group: 'op' });
    for (const z of [34, 41, 48]) L.light(27.5, z, { kind: 'emergency', group: 'emerg' });
    L.light(34, 38, { kind: 'panel', group: 'op' });
    L.light(34, 45.5, { kind: 'panel', group: 'op' });
    L.light(22, 37.5, { kind: 'panel', group: 'op' });
    L.light(22, 45, { kind: 'panel', group: 'op' });
    // Versorgung
    L.lightsAlong(29, 51, 51, 51, 5, { kind: 'tube', group: 'tech' });
    for (const x of [31, 45]) L.light(x, 51, { kind: 'emergency', group: 'emerg' });
    L.light(43, 46.5, { kind: 'panel', group: 'ups', mul: 0.45, mode: 'flicker', speed: 0.3 });
    L.light(35, 56, { kind: 'bulb', group: 'emerg', mode: 'flicker' });
    L.light(55.5, 51.5, { kind: 'panel', group: 'tech', mul: 0.6 });
    L.light(73, 42.5, { kind: 'lab', mul: 0.35, mode: 'flicker' });

    // ================= Requisiten =================
    // Untersuchung 3 (Start)
    L.prop('gurney', 12.2, 9.0, { rot: PI / 2 });
    L.prop('cart', 10.1, 8.0, {});
    L.prop('ivstand', 13.3, 8.0, {});
    L.prop('monitor_stand', 13.9, 9.7, { flat: false });
    L.prop('cabinet', 13.6, 7.25, { w: 1.4 });
    L.prop('sink', 9.3, 11.2, { rot: PI / 2 });
    L.prop('desk', 14.25, 11.6, { rot: -PI / 2, screen: 'text', screenOpts: { text: 'PROBAND 017\nSEDIERUNG: AUS\nNICHT MELDEN', color: '#ffb0a0' } });
    L.prop('poster', 9.03, 9.2, { rot: PI / 2, text: 'HÄNDE\nDESINFIZIEREN' });
    // Flur
    L.prop('gurney', 7.4, 16.4, { rot: PI / 2, body: true, blood: true });
    L.prop('wheelchair', 15.5, 14.4, { rot: 0.4 });
    L.prop('ivstand', 21.4, 16.6, {});
    L.prop('plant', 4.4, 14.4, {});
    L.prop('trash', 28.5, 16.6, {});
    L.prop('bed_flipped', 35.5, 15.0, { rot: PI / 2 + 0.15 });
    L.prop('cart', 41.5, 14.4, { rot: 0.3 });
    L.prop('wallclock', 19, 13.02, {});
    L.prop('exit_sign', 43.5, 13.02, { mode: 'flicker' });
    L.prop('poster', 13.5, 16.97, { rot: PI, text: 'STATION 3\nINNERE MEDIZIN', bg: '#1d3f5a', fg: '#ffffff' });
    L.sign('STATION 3 · Zimmer 301–312', 6, 13.03, { w: 1.6, h: 0.3, y: 2.35 });
    L.sign('302', 18.8, 13.03, { w: 0.3, h: 0.18, y: 2.3, bg: '#1d3f5a', fg: '#fff' });
    L.sign('303', 25.8, 13.03, { w: 0.3, h: 0.18, y: 2.3, bg: '#1d3f5a', fg: '#fff' });
    L.sign('304', 32.8, 13.03, { w: 0.3, h: 0.18, y: 2.3, bg: '#1d3f5a', fg: '#fff' });
    L.sign('305', 39.8, 13.03, { w: 0.3, h: 0.18, y: 2.3, bg: '#1d3f5a', fg: '#fff' });
    L.sign('Untersuchung 3', 12, 13.03, { w: 0.8, h: 0.18, y: 2.3 });
    // Zimmer
    L.prop('bed', 17.3, 10.2, { rot: 0, hide: true, exitSide: 'right' });
    L.prop('bed', 20.3, 10.2, { rot: 0, railDown: true, noSheet: true });
    L.prop('ivstand', 18.6, 8.5, { empty: true });
    L.prop('bed', 24.5, 10.2, { blood: true });
    L.prop('bed', 33.5, 10.0, { body: true, blood: true });
    L.prop('monitor_stand', 34.8, 8.6, { flat: true });
    L.prop('bed', 38.4, 10.2, { hide: true, exitSide: 'right' });
    L.prop('cabinet', 41.6, 8.3, { w: 1.0, h: 1.9 });
    // Stationszimmer
    L.prop('counter', 23.2, 17.55, { w: 5.2, d: 0.7, monitors: 2, alarm: true, papers: true });
    L.prop('desk', 21.2, 19.8, { rot: PI, screen: 'ui', chair: false });
    L.prop('shelf', 27.3, 19.5, { rot: -PI / 2, w: 1.4 });
    L.prop('chair', 25, 19, { rot: 2 });
    // Lager / WC
    L.prop('locker', 30.35, 18.8, { rot: PI / 2 });
    L.prop('locker', 30.35, 19.5, { rot: PI / 2, hide: false });
    L.prop('shelf', 34.2, 20.0, { rot: -PI / 2, w: 2.2, d: 0.45 });
    L.prop('boxes', 31.8, 21.2, { n: 3, vault: false });
    L.prop('toilet', 38.8, 19.6, { rot: -PI / 2 });
    L.prop('sink', 36.4, 19.6, { rot: PI / 2 });
    // Wartebereich
    L.prop('chairs_row', 47.4, 18.6, { n: 5 });
    L.prop('chairs_row', 53.8, 18.6, { n: 5 });
    L.prop('chairs_row', 47.4, 13.55, { n: 4, rot: PI });
    L.prop('vending', 56.9, 14.2, { rot: -PI / 2, flicker: true });
    L.prop('plant', 44.4, 20.5, {});
    L.prop('plant', 57.5, 20.5, {});
    L.prop('desk', 53.0, 13.5, { w: 1.6, d: 0.6, monitor: false, chair: false, papers: true });
    L.prop('whiteboard', 47.5, 13.02, { w: 1.4 });
    L.prop('tv', 51.2, 13.02, { y: 2.1 });
    L.prop('wheelchair', 44.8, 16.5, { rot: 1.2 });
    L.sign('INTENSIVSTATION ↓', 51.9, 20.97, { w: 1.6, h: 0.3, y: 2.4, face: 's', bg: '#2a4a3a', fg: '#fff' });
    L.sign('TREPPENHAUS OST →', 57.97, 15.5, { w: 1.4, h: 0.28, y: 2.45, face: 'e', bg: '#e9ecef' });
    // Intensivstation
    for (const z of [23.9, 27.2, 30.5, 33.6]) {
      L.prop('bed', 47.25, z, { rot: PI / 2, blood: z === 27.2, hide: z === 30.5, exitSide: 'left' });
      L.prop('monitor_stand', 47.0, z - 0.85, { flat: z === 23.9 });
      if (z < 33) L.prop('curtain', 47.4, z + 1.65, { w: 2.3 });
      L.prop('bed', 60.75, z, { rot: -PI / 2, body: z === 23.9 });
      L.prop('monitor_stand', 61.0, z - 0.85, { flat: z !== 30.5 });
      if (z < 33) L.prop('curtain', 60.6, z + 1.65, { w: 2.3 });
    }
    L.prop('counter', 53.6, 28.4, { w: 3.6, d: 0.8, monitors: 3 });
    L.prop('counter', 53.6, 30.2, { w: 3.6, d: 0.8, rot: PI });
    L.prop('cart', 56.5, 24.0, { rot: 0.8 });
    L.prop('ivstand', 49.4, 30.0, {});
    L.prop('wheelchair', 57.8, 33.4, { rot: 2.4 });
    // Personalbereich
    L.prop('cart', 39.5, 29.4, { rot: 0.1 });
    L.prop('body', 41.5, 31.0, { cloth: 'scrubs', rot: 1.2 });
    for (let i = 0; i < 6; i++) L.prop('locker', 30.4 + i * 0.6, 23.28, { rot: 0, hide: i === 2 || i === 4 });
    for (let i = 0; i < 3; i++) L.prop('locker', 35.6 + i * 0.6, 23.28, { rot: 0, hide: i === 1 });
    L.prop('bench', 33.5, 25.6, { w: 3.0 });
    L.prop('locker', 37.7, 26.2, { rot: -PI / 2, hide: false });
    // OP-Trakt
    L.prop('gurney', 27.6, 40.2, { rot: 0.1, vault: true, blood: true });
    L.prop('cart', 26.4, 36.0, { rot: 0.4 });
    L.prop('optable', 34, 38, {});
    L.prop('oplamp', 34, 38, { y: 3.0, swing: false });
    L.prop('cart', 36.2, 36.3, { flag: true });
    L.prop('cabinet', 31.0, 35.25, { w: 1.6, mat: 'steel' });
    L.prop('optable', 34.2, 45.6, {});
    L.prop('body', 34.2, 45.4, { sheet: true, blood: true, y: 0.98 });
    L.prop('oplamp', 34.2, 45.6, { y: 3.0, swing: true });
    L.prop('cart', 36.6, 44.0, { rot: 1 });
    L.prop('monitor_stand', 31.2, 47.6, { flat: true });
    L.prop('shelf', 20.0, 37.5, { rot: PI / 2, w: 3.5 });
    L.prop('shelf', 23.6, 39.8, { rot: PI, w: 1.6 });
    L.prop('freezer', 23.5, 35.5, { rot: PI });
    L.prop('gurney', 20.6, 44.0, { rot: PI / 2, body: true });
    L.prop('gurney', 20.6, 46.8, { rot: PI / 2 });
    L.prop('monitor_stand', 23.8, 43.0, { beep: true });
    L.sign('OP-TRAKT', 27.5, 31.97, { w: 1.2, h: 0.28, y: 2.5, face: 's', bg: '#1d3f5a', fg: '#fff' });
    // Versorgungsflur
    L.prop('cart', 30.5, 50.4, { rot: 0.2 });
    L.prop('barrels', 47.0, 52.3, { n: 2, mat: 'plastic_blue' });
    L.prop('boxes', 38.5, 52.3, { n: 4 });
    L.prop('pipe', 39, 50.2, { len: 26, y: 2.65, r: 0.1, rot: PI / 2 });
    L.prop('fire_ext', 44.5, 49.95, {});
    L.sign('LASTENAUFZUG', 52.97, 51.0, { w: 1.2, h: 0.28, y: 2.45, face: 'e', bg: '#e9ecef' });
    // Sicherheitsbüro
    L.prop('console', 43.0, 44.6, { w: 2.6, rot: 0, screen: 'ui' });
    L.prop('desk', 41.0, 47.4, { rot: PI / 2, monitor: false, papers: true });
    L.prop('body', 44.5, 47.5, { cloth: 'fabric_dark', rot: 2.2 });
    L.prop('locker', 45.55, 46.0, { rot: -PI / 2, hide: true });
    // Ruheraum
    L.prop('desk', 49.5, 46.0, { w: 1.4, d: 0.8, monitor: false, chair: false, mat: 'wood' });
    L.prop('chair', 48.4, 46.8, { rot: 0.5 });
    L.prop('freezer', 51.4, 44.6, { rot: -PI / 2 });
    L.prop('vending', 47.6, 44.5, { rot: 0, off: true, color: 0x2a3a4a });
    // Technikraum
    L.prop('generator', 35, 57.2, { id: 'gen', prompt: 'Notstrom starten', hold: 2.0, rot: PI });
    L.prop('cabinet', 32.0, 54.3, { w: 1.6, mat: 'metal_dark' });
    L.prop('cabinet', 38.2, 55.5, { w: 1.4, rot: -PI / 2, mat: 'metal_dark' });
    L.prop('barrels', 31.8, 57.5, { n: 3, mat: 'metal_rust' });
    L.prop('pipe', 35, 54.3, { len: 8, y: 2.8, r: 0.15, rot: PI / 2, mat: 'metal_dark' });
    // Aufzug
    L.prop('label', 55.5, 50.02, { text: 'Max. 2000 kg · 26 Personen', w: 0.6, h: 0.14, y: 1.6 });
    // Beobachtungsraum (Kamera)
    L.prop('console', 72.5, 40.6, { w: 3.0, screen: 'text', screenOpts: { text: 'SEKTION C\nEINDÄMMUNG: FEHLER', color: '#ff7070' } });
    L.prop('labbench', 74.5, 43.6, { w: 2.0, rot: PI / 2 });

    // ================= Decals =================
    L.decal('blood_smear', 25.5, 13.6, { size: 1.0 });
    L.decal('blood_pool', 7.6, 16.0, { size: 1.6 });
    L.decal('blood_trail', 30, 15.5, { size: 2.2, rot: 0 });
    L.decal('blood_hand', 25.02, 13.5, { wall: 'w', y: 1.2, size: 0.4 });
    L.decal('blood_splat', 33.6, 10.6, { size: 1.4 });
    L.decal('paper', 22.4, 15.6); L.decal('paper', 23.0, 16.1); L.decal('paper', 47.5, 16.5);
    L.decal('blood_pool', 56.8, 27.6, { size: 1.8 });
    L.decal('blood_trail', 41.5, 30.4, { size: 2.6, rot: PI });
    L.decal('blood_smear', 33.4, 28.4, { size: 1.4, rot: PI / 2 });
    L.decal('blood_hand', 33.4, 28.0, { wall: 'n', y: 1.0, size: 0.4 });
    L.decal('blood_pool', 34.2, 46.4, { size: 2.2 });
    L.decal('blood_trail', 27.5, 43, { size: 3, rot: PI / 2 });
    L.decal('blood_pool', 44.4, 47.2, { size: 1.6 });
    L.decal('blood_splat', 50.0, 51.0, { size: 1.0 });

    // ================= Gegenstände & Dokumente =================
    L.item('phone', 10.1, 8.0, { id: 'phone', h: 0.93, noAuto: true });
    L.item('doc', 14.1, 11.9, { id: 'doc_akte', doc: 'c1_akte', h: 0.78 });
    L.item('bandage', 20.4, 11.6, { id: 'b302', h: 0.65 });
    L.item('doc', 22.2, 17.5, { id: 'doc_dienst', doc: 'c1_dienstplan', h: 1.1 });
    L.item('bottle', 25.1, 17.5, { id: 'bottle1', h: 1.1 });
    L.item('doc', 49.5, 13.15, { id: 'doc_aushang', doc: 'c1_aushang', h: 1.45 });
    L.item('bandage', 33.4, 21.2, { id: 'b_lager', h: 0.75, extra: true });
    L.item('pills', 34.2, 20.0, { id: 'p_lager', h: 1.2, notHard: true });
    L.item('bandage', 53.6, 28.4, { id: 'b_its', h: 1.1, notHard: true });
    L.item('keycard', 33.2, 25.6, { id: 'card_op', keyId: 'card_op', name: 'Zugangskarte OP-Trakt', h: 0.5 });
    L.item('doc', 34.2, 25.5, { id: 'doc_kerstin', doc: 'c1_kerstin', h: 0.5 });
    L.item('medkit', 36.2, 36.3, { id: 'mk_op1', h: 0.93 });
    L.item('pills', 23.8, 46.0, { id: 'p_aufwach', h: 0.02, extra: true });
    L.item('doc', 23.4, 39.8, { id: 'doc_liefer', doc: 'c1_lieferschein', h: 1.0 });
    L.item('doc', 41.0, 47.2, { id: 'doc_wach', doc: 'c1_wachbuch', h: 0.78 });
    L.item('recorder', 49.6, 46.2, { id: 'frag1', h: 0.78, fragment: FRAG1 });
    L.item('doc', 37.0, 54.2, { id: 'doc_nea', doc: 'c1_notstrom', h: 1.4 });
    L.item('can', 40.5, 52.3, { id: 'can1', h: 0.9 });
    L.item('bandage', 36.8, 57.3, { id: 'b_tech', h: 0.9, notHard: true });

    L.interact('tv', 51.2, 13.1, { prompt: 'Nachrichten lesen', y: 2.0, radius: 1.8, repeat: true, mesh: null });
    L.interact('sec_monitors', 43.0, 45.2, { prompt: 'Überwachungskameras ansehen', y: 1.1, repeat: true });
    L.interact('elev_call', 52.6, 50.08, { prompt: 'Aufzug rufen', y: 1.2, radius: 1.2, mesh: 'panel', rot: 0, enabled: (g) => !!g.state.flags.power_on && !g.state.flags.elev_called });

    // ================= Gegner =================
    L.zombie(25.6, 11.6, { id: 'z303', type: 'shambler', yaw: PI, outfit: 'gown', wander: 0 });
    L.zombie(50.5, 16.3, { id: 'z_wait', type: 'stalker', yaw: -PI / 2, stalker: true, outfit: 'scrubs' });
    L.zombie(57.3, 27.6, { id: 'z_its', type: 'sleeper', pose: 'lying', yaw: PI / 2, outfit: 'gown', wake: 3 });
    L.zombie(36.5, 40.6, { id: 'z_op1', type: 'stalker', yaw: PI / 2 + 0.6, stalker: true, outfit: 'scrubs' });
    L.zombie(32.8, 45.4, { id: 'z_kneel', type: 'sleeper', pose: 'kneel', yaw: -PI / 2, outfit: 'scrubs', wake: 3 });
    L.zombie(21.2, 47.7, { id: 'z_aufwach', type: 'sleeper', pose: 'lying', yaw: 0, outfit: 'gown', wake: 4 });
    L.zombie(48.4, 47.6, { id: 'z_break', type: 'sleeper', pose: 'sitting', yaw: PI, outfit: 'security', wake: 3.5 });

    // ================= Auslöser & Checkpoints =================
    L.trigger('corr_start', 9, 14, 6, 3);
    L.trigger('corr_303', 22, 14, 7, 3);
    L.trigger('corr_east', 38, 14, 6, 3);
    L.trigger('wait_in', 44, 13, 4, 8);
    L.trigger('its_in', 46, 22, 16, 3);
    L.trigger('its_mid', 52, 25, 4, 7);
    L.trigger('staff', 26, 29, 18, 3);
    L.trigger('op_in', 26, 33, 3, 3);
    L.trigger('tech_in', 26, 50, 6, 3);
    L.trigger('elev_car', 54, 50, 3, 3);
    L.checkpoint('start', 11.6, 10.6, 0);
    L.checkpoint('corridor', 12, 15.5, -PI / 2);
    L.checkpoint('its', 52, 19.5, PI);
    L.checkpoint('umkleide', 33.5, 26.5, PI);
    L.checkpoint('op', 27.5, 31, PI);
    L.checkpoint('technik', 34.5, 54.6, PI);
  },

  ambience(g) {
    g.audio.loop('amb', 'hvac_loop', { vol: 0.35, bus: 'amb', reverb: false });
  },

  onLoad(c, info) {
    const g = c.g;
    c.setClock(info.restored ? g.phone.clock : '04:12');
    // OP-Trakt und Versorgung ohne Strom (bis Notstrom)
    if (!c.get('power_on')) { c.power('op', false); c.power('tech', false); }
    else { c.power('op', true); c.power('tech', true); g.audio.loop('alarm', 'alarm', { pos: { x: 40, y: 2.5, z: 51 }, vol: 0.3, bus: 'sfx' }); }
    g.decor({ x: 71.0, z: 43.6, yaw: -PI / 2 - 0.4, pose: 'sitting' });
    if (info.restored && info.checkpoint !== 'start') g.player.crouched = false;
  },

  script: [
    // ---------- Erwachen ----------
    {
      id: 'c1_intro', when: 'start', if: (c) => !c.get('woke'), do: async (c) => {
        const g = c.g, p = g.player;
        p.mode = 'locked'; p.crouched = true; p.crouchT = 1; p.pitch = -0.35;
        g.fx.fade = 1; g.fx.fadeTo(0.35, 3);
        g.fx.damageFlash(0.6);
        await c.wait(2.5);
        g.fx.fadeTo(0, 2);
        c.say('sami', 'Wo … bin ich?', { d: 2.4 });
        await c.wait(2.6);
        c.sound('vibrate', null, { vol: 0.8, reverb: false });
        c.look(10.1, 1.0, 8.0, 0.8);
        await c.wait(1.6);
        c.unlook();
        p.mode = 'normal'; p.crouched = false;
        c.flag('woke');
        c.objective('Nimm das Telefon.');
        g.hud.toast(`<kbd>${g.input.label('interact')}</kbd> Interagieren · <kbd>${g.input.label('forward')}${g.input.label('left')}${g.input.label('back')}${g.input.label('right')}</kbd> Bewegen`);
      },
    },
    {
      id: 'c1_phone', when: 'pickup:phone', do: async (c) => {
        const g = c.g;
        c.oldMsg('elif', 'Elif', 'Abi, sie sagen, die Studie hilft wirklich. Ich hab trotzdem Angst.', { time: 'Mär.' });
        c.oldMsg('elif', 'Elif', 'Sag Mama nichts, ok? Erst wenn es mir besser geht. ❤', { time: 'Mär.' });
        c.oldMsg('elif', 'Ich', 'Ich bin bei dir. Nach vorne, Elif. Immer nur nach vorne.', { time: 'Mär.', me: true });
        c.oldMsg('nexara', 'NEXARA Info', 'Ihre Schicht im Halden-Institut wurde bestätigt. Zutritt Sektion B: freigegeben (Profil 017).', { time: 'Fr.' });
        c.photo('lighthouse', 'Leuchtturm Nordenstrand – mit Elif');
        g.phone.addCall('UNBEKANNT (…017)', 'missed', 'Mo. 03:31');
        g.hud.toast(`<kbd>${g.input.label('phone')}</kbd> Smartphone · <kbd>${g.input.label('flashlight')}</kbd> Taschenlampe`);
        await c.wait(1.2);
        c.msg('unknown', 'UNBEKANNT', 'Du bist wach. Gut.');
        await c.wait(3.5);
        c.msg('unknown', 'UNBEKANNT', 'Sag nichts. Sei leise. Ich rufe dich an.');
        await c.wait(3);
        await c.call('UNBEKANNT', [
          { s: 'unknown', t: 'Hör mir zu. Du bist im Klinikum St. Elisabeth, Station drei.', v: 'c1_call_a' },
          { s: 'unknown', t: 'Du warst drei Tage bewusstlos. Was du da draußen hörst … das sind keine Menschen mehr.', v: 'c1_call_b' },
          { s: 'sami', t: 'Wer ist da? Woher kennen Sie meinen Namen?', d: 2.6 },
          { s: 'unknown', t: 'Beweg dich langsam. Bleib im Dunkeln. Sie hören dich, bevor sie dich sehen.', v: 'c1_call_c' },
          { s: 'sami', t: 'Antworten Sie mir!', d: 1.6 },
          { s: 'unknown', t: 'Ich bringe dich hier raus. Nach vorne, Sami. Immer nur nach vorne.', v: 'c1_call_d' },
        ], { timeout: 25 });
        c.objective('Verlasse Station 3.');
        c.fact('Ein unbekannter Anrufer kennt meinen Namen. Er hat nicht auf meine Fragen reagiert.');
        await c.wait(2);
        c.checkpoint('start');
      },
    },
    { id: 'c1_akte_read', when: 'closed:c1_akte', do: async (c) => { await c.wait(0.4); c.say('sami', 'Proband 017 … das bin ich?', { d: 2.5 }); c.fact('In meiner Akte steht kein Name, nur „Proband 017“. Unterschrieben mit „M.“'); } },
    {
      id: 'c1_corr', when: 'enter:corr_start', if: (c) => c.get('woke'), do: async (c) => {
        c.checkpoint('corridor');
        await c.wait(1.0);
        await c.pa([{ s: 'pa', t: 'Achtung. Für das gesamte Klinikum gilt eine Quarantänemaßnahme. Bitte bleiben Sie in Ihren Zimmern.', v: 'pa_h1' }, { s: 'pa', t: 'Medizinisches Personal meldet sich umgehend bei der Stationsleitung.', v: 'pa_h2' }]);
      },
    },
    {
      id: 'c1_303', when: 'enter:corr_303', do: async (c) => {
        const z = c.zombie('z303');
        const d = c.door('d303');
        if (!z || !d) return;
        c.say('sami', 'Hallo? Ist da jemand?', { d: 2 });
        await c.wait(1.6);
        z.command({ type: 'bash', door: d });
        c.shake(0.15);
        await c.wait(2.5);
        c.say('sami', '…', { d: 1 });
        await c.until(() => !c.inZone('corr_303'), 30);
        await c.wait(4);
        z.release();
        z.cmd = null; z.setState('idle');
      },
    },
    {
      id: 'c1_tv', when: 'interact:tv', once: false, do: async (c) => { c.doc('c1_tv'); },
    },
    {
      id: 'c1_wait', when: 'enter:wait_in', do: async (c) => {
        c.say('sami', 'Da … steht jemand.', { d: 2 });
        await c.wait(1.5);
        c.msg('unknown', 'UNBEKANNT', 'Bewegung im Wartebereich. Duck dich. Bleib hinter den Sitzreihen.');
        c.objective('Schleiche an der Gestalt vorbei.');
        c.g.hud.toast(`<kbd>${c.g.input.label('crouch')}</kbd> Schleichen · im Dunkeln und geduckt bist du kaum zu sehen`);
        await c.wait(6);
        c.msg('unknown', 'UNBEKANNT', 'Treppenhaus Ost ist verriegelt. Quarantäne. Nimm den Weg über die Intensivstation.', { photo: 'route1', photoTitle: 'Weg zum Lastenaufzug' });
        c.objective('Gelange über die Intensivstation zum Lastenaufzug.');
      },
    },
    { id: 'c1_stair', when: 'locked:stair_east', do: async (c) => { c.say('sami', 'Verriegelt.', { d: 1.4 }); } },
    {
      id: 'c1_its_in', when: 'enter:its_in', do: async (c) => {
        c.checkpoint('its');
        c.objective('Durchquere die Intensivstation. Ausgang im Westen.');
      },
    },
    {
      id: 'c1_its_wake', when: 'enter:its_mid', do: async (c) => {
        const z = c.zombie('z_its');
        if (!z) return;
        c.sound('metal_creak', [57.3, 0.5, 27.6], { vol: 0.8 });
        await c.wait(1.0);
        c.wake('z_its', 'chase');
        c.flag('its_woke');
        await c.wait(1.2);
        c.objective('Lauf! Westausgang – versteck dich im Personalbereich.');
        c.g.hud.toast(`<kbd>${c.g.input.label('sprint')}</kbd> Rennen · Ausdauer ist begrenzt`);
        // Warten, bis der Verfolger aufgibt
        let calm = 0;
        await c.until(() => {
          const zz = c.zombie('z_its');
          const p = c.g.player;
          if (!zz) return true;
          if (p.mode === 'hidden' && !c.get('hint_breath')) { c.flag('hint_breath'); c.msg('unknown', 'UNBEKANNT', 'Ruhig atmen. Wenn er nah ist: Luft anhalten. Nicht zu lange.'); c.g.hud.toast(`Im Versteck: <kbd>${c.g.input.label('vault')}</kbd> gedrückt halten = Atem anhalten`); }
          const busy = ['chase', 'attack', 'grab', 'alert', 'checkhide', 'bash', 'getup', 'search'].includes(zz.state);
          calm = busy ? 0 : calm + 1 / 30;
          return calm > 3 && p.pos.z > 22 && p.pos.x < 45;
        }, 180);
        if (c.g.player.mode === 'hidden') await c.until(() => c.g.player.mode !== 'hidden', 60);
        c.checkpoint('umkleide');
        c.objective('Finde einen Weg in den OP-Trakt.');
      },
    },
    { id: 'c1_card', when: 'pickup:card_op', do: async (c) => { c.objective('Öffne den OP-Trakt mit der Zugangskarte.'); } },
    {
      id: 'c1_op_open', when: 'unlock:d_op_a', do: async (c) => {
        c.checkpoint('op');
        await c.wait(1.0);
        c.msg('unknown', 'UNBEKANNT', 'Kein Strom im OP-Trakt. Nimm das Licht. Aber leuchte ihnen nicht ins Gesicht.');
        c.objective('Durchquere den OP-Trakt zum Versorgungsflur.');
      },
    },
    { id: 'c1_op_open_b', when: 'unlock:d_op_b', do: async (c) => { c.fire('unlock:d_op_a'); } },
    {
      id: 'c1_tech', when: 'enter:tech_in', do: async (c) => {
        c.objective('Der Lastenaufzug braucht Strom. Starte die Notstromanlage im Technikraum.');
        await c.wait(2);
        c.msg('unknown', 'UNBEKANNT', 'Der Aufzug braucht Strom. Die Notstromanlage weckt alles, was noch hier ist. Sei bereit zu laufen.');
        c.checkpoint('technik');
      },
    },
    {
      id: 'c1_cams', when: 'interact:sec_monitors', once: false, do: async (c) => {
        const g = c.g;
        await g.viewCameras([
          { label: 'CAM 07 · LASTENAUFZUG EG/U3', x: 51.2, y: 2.7, z: 52.6, tx: 53.5, ty: 1.0, tz: 51.0 },
          { label: 'CAM 02 · WARTEBEREICH STATION 3', x: 57.3, y: 2.7, z: 20.4, tx: 50.5, ty: 1.2, tz: 16 },
          { label: 'CAM 11 · U3 · BEOBACHTUNG (NEXARA)', note: 'ARGUS › NACHVORNE: SIE IST WICHTIG. FINDE SIE.', x: 75.3, y: 2.6, z: 40.4, tx: 71.0, ty: 0.7, tz: 43.6, onView: (cx) => { if (!cx.get('saw_mine')) { cx.flag('saw_mine'); cx.fact('Kamera U3: Eine Frau im Laborkittel kauert im Beobachtungsraum. Sie lebt.'); } } },
          { label: 'CAM 04 · TECHNIK / NEA-2', x: 31.6, y: 2.8, z: 54.4, tx: 35.5, ty: 0.8, tz: 57.5 },
        ]);
        if (c.get('saw_mine') && !c.get('saw_mine_said')) { c.flag('saw_mine_said'); c.say('sami', 'Wer ist sie? … Ich kenne sie. Ich weiß nicht, woher.', { d: 3.5 }); }
      },
    },
    { id: 'c1_frag1', when: 'pickup:frag1', do: async (c) => { await c.wait(1); c.fact('Aufnahme 1: Meine eigene Stimme. „Ich bin du.“ Ich habe mir selbst Nachrichten hinterlassen.'); } },
    // ---------- Notstrom -> Horde ----------
    {
      id: 'c1_power', when: 'interact:gen', do: async (c) => {
        const g = c.g;
        c.flag('power_on');
        c.sound('generator_start', [35, 1, 57.2], { vol: 1 });
        c.shake(0.3);
        await c.wait(2.6);
        c.loop('gen', 'buzz_loop', [35, 1, 57.2], { vol: 0.5, bus: 'sfx' });
        c.power('op', true); c.power('tech', true);
        c.lightMode('tech', 'flicker');
        c.sound('power_on', null, { vol: 0.8 });
        c.loop('alarm', 'alarm', [40, 2.5, 51], { vol: 0.35, bus: 'sfx' });
        c.noise(35, 56, 50, 'alarm');
        c.noise(28, 44, 30, 'alarm');
        c.objective('Zum Lastenaufzug – ruf ihn!');
        c.msg('unknown', 'UNBEKANNT', 'Jetzt hören sie dich alle. Lauf.');
        await c.wait(2.2);
        c.lightMode('tech', 'steady');
        const t = g.difficulty.chaseTime;
        const a = c.spawn({ x: 27.4, z: 38.5, type: 'hunter', outfit: 'scrubs' }); a.forceChase();
        await c.wait(1.0 * t);
        const b = c.spawn({ x: 27.6, z: 34.2, type: 'hunter', outfit: 'gown' }); b.forceChase();
        c.wake('z_kneel', 'chase');
        c.wake('z_break', 'chase');
        await c.wait(2.0 * t);
        const d = c.spawn({ x: 21.5, z: 38, type: 'hunter', outfit: 'labcoat' }); d.forceChase();
      },
    },
    {
      id: 'c1_elev', when: 'interact:elev_call', do: async (c) => {
        const g = c.g;
        c.flag('elev_called');
        c.sound('click', [52.6, 1.2, 50.3]);
        c.loop('elev_motor', 'elevator_motor', [55.5, 1.5, 51.5], { vol: 0.6, bus: 'sfx' });
        c.objective('Der Aufzug kommt … halte durch.');
        await c.wait(3.6 * g.difficulty.chaseTime);
        c.stopLoop('elev_motor');
        c.sound('elevator_ding', [53.5, 2.2, 51], { vol: 0.9 });
        c.unlock('d_elev');
        c.open('d_elev');
        c.objective('Rein in den Aufzug!');
        await c.until(() => c.inZone('elev_car'), 120);
        const d = c.door('d_elev');
        d.crushing = true;
        c.close('d_elev', { force: true });
        c.lock('d_elev');
        await c.wait(1.6);
        c.sound('door_bash', [53, 1.2, 51], { vol: 1 });
        c.shake(0.4);
        await c.wait(0.8);
        c.sound('door_bash', [53, 1.2, 51], { vol: 1 });
        c.loop('elev_motor', 'elevator_motor', [55.5, 1.5, 51.5], { vol: 0.8, bus: 'sfx' });
        c.shake(0.5);
        c.stopLoop('alarm', 3);
        await c.wait(3.0);
        c.setClock('04:26');
        await c.endChapter('ch1b');
      },
    },
  ],
};

const FRAG1 = {
  title: 'Aufnahme 1/5 – „Für dich“',
  lines: [
    { s: 'fragment', t: 'Wenn du das hörst, hat der erste Teil funktioniert. Du bist wach. Du lebst.', v: 'f1_a' },
    { s: 'fragment', t: 'Ich weiß, wie das klingt. Aber hör zu: Ich bin du. Sami. Ich nehme das auf, solange ich mich noch erinnere.', v: 'f1_b' },
    { s: 'fragment', t: 'In ein paar Tagen ist alles weg. Das Labor. Die letzten zwei Jahre. Vielleicht auch ihr Gesicht.', v: 'f1_c' },
    { s: 'fragment', t: 'Folge der Stimme am Telefon. Sie kennt den Weg. Und hör nicht auf zu laufen.', v: 'f1_d' },
  ],
};
