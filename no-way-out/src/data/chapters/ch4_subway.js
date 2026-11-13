// KAPITEL 4 – DIE U-BAHN
// Station Klinikum: Verteilerebene, Treppe zum Bahnsteig, eingestürzter Bahnsteig -> durch Zug 3117 voller
// „Fahrgäste“. Betriebsraum: İlyas' Geständnis (Entscheidung). Dunkler Tunnel mit Nischen, Horde aus dem
// Querschlag, Bahnsteigkante Marktplatz (Klettern), İlyas wird gebissen -> Serum-Entscheidung.
const PI = Math.PI;

export default {
  id: 'ch4', startFlag: 'c4_started', name: 'Die U-Bahn', tagline: 'Linie U3 · Klinikum – Marktplatz',
  w: 112, h: 50,
  opts: { floor: 's_floor', wall: 's_wall_tile2', ceil: 'concrete', height: 3.4 },
  env: { fog: 0x040505, fogDensity: 0.06, hemi: 0.015, exposure: 1.05, tint: 0xeef0e8, reverb: [3.2, 1.8], reverbMix: 0.5, sleeve: 0x8fb0c4 },

  build(L) {
    L.room('Zugang', 3, 6, 5, 4, { wall: 's_wall_tile' });
    L.room('Verteilerebene', 8, 3, 22, 10);
    L.room('Treppe', 24, 13, 4, 8);
    L.ramp(24, 13, 4, 8, '-z', -3, 3, { stairs: true, mat: 's_floor' });
    L.room('Bahnsteig Klinikum', 12, 21, 64, 4, { floorY: -3, height: 4.2, wall: 's_wall_tile' });
    L.solid(44, 21, 4, 4);
    // Zug 3117
    L.room('Zug 3117', 16, 26, 56, 3, { floorY: -3, height: 2.35, floor: 's_floor', wall: 'train_int', ceil: 'train_int' });
    for (const x of [22, 30, 38, 56, 64]) L.door(x, 25, { id: 'td' + x, kind: 'slide', open: x !== 22, locked: x === 22, lockedText: 'Tür klemmt', height: 2.0 });
    L.glass(17, 25, 54, 1, { id: 'trainwin' });
    for (let x = 17; x <= 71; x++) if (![22, 30, 38, 56, 64].includes(x)) L.heights(x, 25, 1, 1, null, -0.65);
    L.solid(34, 26); L.solid(34, 28); L.solid(52, 26); L.solid(52, 28);
    // Betriebsraum
    L.room('Betriebsraum', 77, 19, 5, 5, { floorY: -3, height: 3, floor: 'concrete_floor', wall: 'concrete_wall', ceil: 'concrete' });
    L.door(76, 22, { id: 'd_betrieb', kind: 'metal' });
    // Tunnel
    L.room('Tunnel', 73, 25, 37, 5, { floorY: -4.1, height: 4.6, floor: 'gravel', wall: 'tunnel', ceil: 'tunnel', edge: 'concrete_dark' });
    L.room('Nische', 88, 23, 2, 2, { floorY: -4.1, height: 2.6, floor: 'gravel', wall: 'tunnel', ceil: 'tunnel' });
    L.room('Querschlag', 92, 30, 2, 6, { floorY: -4.1, height: 2.8, floor: 'gravel', wall: 'tunnel', ceil: 'tunnel' });
    // Station Marktplatz
    L.room('Bahnsteig Marktplatz', 96, 20, 14, 5, { floorY: -3, height: 4.2, wall: 's_wall_tile' });
    L.room('Stellwerk', 100, 13, 9, 6, { floorY: -3, height: 3, floor: 'concrete_floor', wall: 'concrete_wall', ceil: 'concrete' });
    L.door(104, 19, { id: 'd_stell', kind: 'metal' });
    L.room('Notausstieg', 104, 5, 3, 8, { height: 3.2, floor: 'concrete', wall: 'concrete_wall', ceil: 'concrete' });
    L.ramp(104, 5, 3, 8, '-z', -3, 3, { stairs: true, mat: 'concrete' });

    // ================= Licht =================
    for (const [x, z, m] of [[12, 5, 'steady'], [20, 5, 'broken'], [27, 5, 'flicker'], [12, 10, 'off'], [20, 10, 'steady'], [27, 10, 'broken']]) L.light(x, z, { kind: 'panel', mode: m, mul: 0.75 });
    L.light(5, 8, { kind: 'bulb', mode: 'flicker' });
    L.light(26, 16, { kind: 'tube', mode: 'flicker', mul: 0.7 });
    for (const x of [16, 26, 36, 50, 60, 70]) L.light(x, 22.5, { kind: 'tube', mode: x === 26 ? 'flicker' : x === 60 ? 'steady' : 'broken', mul: 0.7 });
    L.light(41, 22.5, { kind: 'emergency', mul: 0.8 });
    for (const x of [20, 28, 40, 47, 60, 68]) L.light(x, 27.5, { kind: 'tube', rot: false, group: 'train', mul: 0.35, mode: x === 47 ? 'off' : x % 3 ? 'broken' : 'flicker', speed: 0.6 });
    L.light(79.5, 21, { kind: 'bulb', mul: 0.8 });
    for (const x of [80, 92, 104]) L.light(x, 25.4, { kind: 'bulb', mode: x === 92 ? 'off' : 'broken', y: -1.2, mul: 0.6 });
    L.light(88.9, 23.4, { kind: 'red', mode: 'pulse', y: -2.2, mul: 0.25 });
    L.light(100, 22, { kind: 'tube', mode: 'flicker', mul: 0.7 });
    L.light(107, 22, { kind: 'tube', mode: 'steady', mul: 0.7 });
    L.light(104, 15.5, { kind: 'bulb', mul: 0.8 });
    L.light(103, 14, { kind: 'screen', color: 0x60ff90, mul: 1.5 });
    L.light(105.5, 7, { kind: 'bulb', mode: 'flicker' });

    // ================= Requisiten =================
    L.prop('station_sign', 19, 3.04, { text: 'KLINIKUM', w: 3.4, y: 2.6 });
    L.prop('timetable', 13, 3.04, { text: 'U3  Klinikum → Marktplatz\n— Betrieb eingestellt —' });
    for (const z of [4.5, 5.5, 6.5, 7.5, 8.5, 9.5]) L.prop('turnstile', 18, z, { rot: PI / 2 });
    L.prop('turnstile', 18, 10.5, { rot: PI / 2, open: true, broken: true });
    L.prop('ticket_machine', 15.5, 3.4, { off: false });
    L.prop('ticket_machine', 21.5, 3.4, { off: true });
    L.prop('kiosk', 11.5, 11.2, { text: 'KIOSK · ZEITUNGEN' });
    L.prop('bench', 25, 3.5, { w: 2.2 });
    L.prop('trash', 22.8, 11.6);
    L.prop('poster', 29.97, 7, { rot: -PI / 2, text: 'U3\nNORDSTADT', bg: '#14365c', fg: '#fff' });
    L.prop('body', 14, 7.5, { cloth: 'fabric_dark', rot: 2.2 });
    L.prop('station_sign', 30, 20.96, { text: 'KLINIKUM', w: 3.6, rot: PI, y: 2.8 });
    for (const x of [16, 34, 64]) L.prop('bench', x, 21.5, { w: 2.2 });
    L.prop('debris', 42.2, 23, { w: 2.2, rot: PI / 2 }); L.prop('debris', 49.3, 22.5, { w: 2.0, rot: PI / 2 + 0.3 });
    L.prop('vending', 72.5, 21.4, { rot: 0, color: 0x2a5a8a });
    L.prop('timetable', 60, 20.96, { rot: PI, text: 'Nächster Zug: —\nBetrieb eingestellt' });
    // Zugkarosserie (Außenansicht vom Bahnsteig)
    for (const [x0, x1] of [[17, 21], [23, 29], [31, 37], [39, 55], [57, 63], [65, 70]]) L.prop('trainbody', (x0 + x1 + 1) / 2, 25.5, { len: x1 - x0 + 1, y: -3 });
    // Zuginnen
    for (const [x0, x1] of [[17, 21], [23, 29], [31, 33], [35, 37], [39, 51], [53, 55], [57, 63], [65, 71]]) {
      const len = x1 - x0 + 1;
      if (len >= 2) L.prop('train_seat', (x0 + x1 + 1) / 2, 28.72, { w: len - 0.3, rot: PI });
    }
    for (const x of [26, 33.5, 42, 48, 60, 68]) L.prop('pole', x, 27.5, {});
    L.prop('label', 34.5, 27.5, { text: 'WAGEN 2', w: 0.8, h: 0.2, y: 2.0, rot: PI / 2, bg: '#1a1a1a', fg: '#e8e8e8' });
    // Betriebsraum
    L.prop('cabinet', 78, 19.3, { w: 1.5, mat: 'metal_dark' });
    L.prop('desk', 80.6, 22.8, { w: 1.4, rot: PI, monitor: false, papers: true });
    L.prop('locker', 81.6, 20.3, { rot: -PI / 2 });
    L.prop('boxes', 77.6, 23.3, { n: 2 });
    // Tunnel
    L.prop('rails', 91, 27.5, { len: 36, rot: PI / 2, y: -4.1, third: true });
    L.prop('cable_tray', 91, 29.6, { len: 36, rot: PI / 2, y: 2.5 });
    L.prop('pipe', 91, 25.2, { len: 36, rot: PI / 2, y: 3.1, r: 0.12 });
    L.prop('crate', 99, 26.0, { rot: 0.2, y: -4.1, s: 0.9 });
    L.prop('label', 92.97, 30.2, { text: 'QUERSCHLAG 3', w: 1.2, h: 0.25, y: 1.9, rot: PI, bg: '#e8e8e0', fg: '#222' });
    // Station Marktplatz
    L.prop('station_sign', 103, 20.04, { text: 'MARKTPLATZ', w: 4, y: 2.8 });
    L.prop('bench', 99, 20.5, { w: 2.2 });
    L.prop('body', 107.2, 22.4, { cloth: 'fabric_dark', rot: 1 });
    L.prop('console', 104.5, 13.5, { w: 3, screen: 'text', screenOpts: { text: 'STELLWERK MP\nFAHRSTROM: AUS\nU3: GESPERRT', color: '#7fff9a' } });
    L.prop('chair', 105, 14.8, { rot: 3 });
    L.prop('shelf', 101, 16, { rot: PI / 2, w: 2.4 });
    L.prop('cabinet', 108.2, 16.5, { w: 1.4, rot: -PI / 2, mat: 'metal_dark' });

    // ================= Decals =================
    L.decal('blood_pool', 14.2, 7.9, { size: 1.6 }); L.decal('blood_trail', 26, 18, { size: 3, rot: PI / 2 });
    L.decal('blood_smear', 39, 23, { size: 1.6 });
    L.decal('blood_pool', 44.5, 27.5, { size: 1.6 });
    L.decal('blood_hand', 52.5, 27.0, { size: 0.5 });
    L.decal('paper', 20, 6); L.decal('paper', 33, 22.4); L.decal('paper', 47, 27.2);
    L.decal('blood_pool', 107.2, 22.8, { size: 1.5 });

    // ================= Gegenstände =================
    L.item('bottle', 11.2, 11.2, { id: 'bottle4', h: 1.15 });
    L.item('can', 23, 4.0, { id: 'can4', h: 0.5 });
    L.item('bandage', 25.4, 3.5, { id: 'b4a', h: 0.5 });
    L.item('ammo', 14.6, 7.9, { id: 'ammo4_a', h: 0.03, rounds: 12 });
    L.item('ammo', 106.6, 22.0, { id: 'ammo4_b', h: 0.03, rounds: 12 });
    L.item('pills', 72.4, 22.2, { id: 'p4', h: 0.02, notHard: true });
    L.item('doc', 45.5, 28.4, { id: 'doc_zettel4', doc: 'c4_zettel', h: 0.5 });
    L.item('medkit', 62.5, 28.5, { id: 'mk4', h: 0.5, notHard: true });
    L.item('doc', 80.6, 22.9, { id: 'doc_stoer', doc: 'c4_stoerung', h: 0.78 });
    L.item('recorder', 77.9, 19.3, { id: 'frag4', h: 1.2, fragment: FRAG4 });
    L.item('bandage', 89.2, 23.4, { id: 'b4_niche', h: 0.02 });
    L.item('doc', 104.5, 13.9, { id: 'doc_plan', doc: 'c4_plan', h: 0.86 });
    L.item('bandage', 101.2, 16.5, { id: 'b4_stell', h: 1.2, extra: true });
    // Zusätzliche Fundstücke am Wegesrand (liegen am Boden an der Wand und leuchten auf)
    L.item('ammo', 23.5, 12.77, { id: 'ammo_x0', h: 0.03, rounds: 10 });
    L.item('bandage', 56.5, 28.77, { id: 'band_x1', h: 0.03 });
    L.item('ammo', 79.5, 19.23, { id: 'ammo_x2', h: 0.03, rounds: 10 });
    L.item('bandage', 101.5, 20.23, { id: 'band_x3', h: 0.03, notHard: true });

    // ================= Gegner =================
    L.zombie(12.8, 9.2, { id: 'z4k', type: 'sleeper', pose: 'kneel', yaw: -2.3, outfit: 'civilian', wake: 3 });
    L.zombie(27, 8, { id: 'z4w', type: 'wanderer', outfit: 'civilian2', patrol: [[27, 9], [22, 9], [22, 5], [27, 5]] });
    L.zombie(13.2, 22.6, { id: 'z4s', type: 'stalker', yaw: -PI / 2, outfit: 'security', stalker: true });
    L.zombie(25.2, 28.5, { id: 'zt1', type: 'sleeper', pose: 'sitting', yaw: 0, outfit: 'suit', wake: 4 });
    L.zombie(41.5, 28.5, { id: 'zt2', type: 'sleeper', pose: 'sitting', yaw: 0, outfit: 'civilian', wake: 4 });
    L.zombie(46.5, 26.3, { id: 'zt3', type: 'sleeper', pose: 'sitting', yaw: PI, outfit: 'civilian2', wake: 4 });
    L.zombie(50.0, 28.5, { id: 'zt4', type: 'sleeper', pose: 'sitting', yaw: 0, outfit: 'security', wake: 4 });
    L.zombie(61, 28.5, { id: 'zt5', type: 'sleeper', pose: 'lying', yaw: -PI / 2, outfit: 'civilian', wake: 3.5 });
    L.zombie(68.5, 27.4, { id: 'zt6', type: 'stalker', yaw: PI / 2, outfit: 'suit', stalker: true });
    L.zombie(66.5, 22.4, { id: 'z4p', type: 'sleeper', pose: 'sitting', yaw: 0, outfit: 'civilian2', wake: 3.5 });
    L.zombie(84, 27.0, { id: 'z4r', type: 'sleeper', pose: 'lying', yaw: 0.5, outfit: 'civilian' });
    L.zombie(88.9, 23.6, { id: 'z4n', type: 'stalker', yaw: PI, outfit: 'scrubs', stalker: true });
    // Kriecher am Bahnsteig, zwischen den Sitzenden kaum zu erkennen
    L.zombie(37.5, 21.6, { id: 'z4crawl', type: 'crawler', yaw: PI / 2, outfit: 'civilian' });

    // ================= Auslöser =================
    L.trigger('conc', 8, 3, 8, 10);
    L.trigger('stairs', 24, 15, 4, 3);
    L.trigger('train', 38, 26, 4, 3);
    L.trigger('plat_east', 48, 21, 6, 4);
    L.trigger('betrieb', 77, 19, 5, 5);
    L.trigger('tunnel_in', 76, 25, 4, 5);
    L.trigger('tunnel_mid', 93, 25, 3, 5);
    L.trigger('mp_plat', 96, 20, 14, 4, { yMin: -3.4 });
    L.trigger('stell', 100, 13, 9, 5);
    L.trigger('exit', 104, 5, 3, 2, { yMin: -0.6 });
    L.checkpoint('start', 5, 7.5, -PI / 2);
    L.checkpoint('platform', 26, 22.5, -PI / 2);
    L.checkpoint('betrieb', 79.5, 21.5, PI / 2);
    L.checkpoint('stellwerk', 104.5, 16.5, PI);
  },

  ambience(g) {
    g.audio.loop('amb', 'tunnel_loop', { vol: 0.45, bus: 'amb', reverb: false });
  },

  onLoad(c, info) {
    const g = c.g;
    if (!info.restored) c.setClock('05:21');
    if (!c.npc('mine')) c.addNpc('mine', 6.5, 8.2, { mode: 'follow' });
    if (!c.npc('ilyas')) c.addNpc('ilyas', 5.2, 6.8, { mode: 'follow' });
    const il = c.npc('ilyas'); if (il && c.get('ilyas_bitten')) il.injured = !c.get('ilyas_saved');
    void g;
  },

  script: [
    {
      id: 'c4_start', when: 'start', if: (c) => !c.get('c4_started'), do: async (c) => {
        c.flag('c4_started');
        c.objective('Zum Bahnsteig. Folge der U3 Richtung Marktplatz.');
        await c.wait(2.5);
        c.msg('unknown', 'UNBEKANNT', 'Die U-Bahn ist dunkel. Halte dich an das Licht – aber nicht zu lange.');
        c.g.hud.toast(`Drehkreuze: <kbd>${c.g.input.label('vault')}</kbd> klettern`);
      },
    },
    { id: 'c4_stairs', when: 'enter:stairs', do: async (c) => { c.checkpoint('platform'); await c.wait(3); await c.lines([{ s: 'ilyas', t: 'Der Bahnsteig ist eingestürzt. Da vorne. Wir müssen durch den Zug.', v: 'i4_a' }]); c.objective('Der Bahnsteig ist eingestürzt – gehe durch Zug 3117.'); } },
    {
      id: 'c4_train', when: 'enter:train', do: async (c) => {
        c.msg('unknown', 'UNBEKANNT', 'Im Zug sitzen noch Fahrgäste. Weck sie nicht. Kein Licht.');
        await c.wait(1.5);
        await c.lines([{ s: 'mine', t: '(flüsternd) Ganz langsam …', v: 'm4_a' }]);
      },
    },
    { id: 'c4_east', when: 'enter:plat_east', do: async (c) => { c.objective('Folge dem Bahnsteig nach Osten. Betriebsraum am Ende.'); } },
    {
      id: 'c4_confess', when: 'enter:betrieb', do: async (c) => {
        const g = c.g;
        c.close('d_betrieb');
        await c.wait(1.5);
        await c.lines([
          { s: 'ilyas', t: 'Wartet. Bevor wir da in den Tunnel gehen … ich muss euch was sagen.', v: 'i4_b' },
          { s: 'ilyas', t: 'Montagnacht. 03:17. Ich habe ARGUS abgeschaltet. Vier Minuten.', v: 'i4_c' },
          { s: 'ilyas', t: 'Jemand hat mich bezahlt. Anonym. Er wollte die EVE-Daten – für eine unabhängige Klinik. Für Kinder wie meine Defne.', v: 'i4_d' },
          { s: 'ilyas', t: 'Ich wusste nicht, dass die Schleusen von Sektion C an ARGUS hängen. Dass sie aufgehen, wenn er schläft.', v: 'i4_e' },
          { s: 'mine', t: 'Elf Menschen in Sektion C. Und alle, die danach kamen.', v: 'm4_b' },
          { s: 'ilyas', t: 'Ich weiß.', v: 'i4_f' },
          { s: 'ilyas', t: 'Er hat nie angerufen. Nur geschrieben. Immer derselbe Satz am Ende: „Nach vorne.“', v: 'i4_g' },
        ]);
        c.fact('İlyas hat ARGUS um 03:17 abgeschaltet – bezahlt von jemandem, der immer „Nach vorne“ schrieb. Wie der Anrufer.');
        c.photo('drawing', 'İlyas zeigt mir ein Bild: „Papa + Defne“');
        const ch = await c.choice('İlyas sieht dich an. Er wartet auf ein Urteil.', [
          { id: 'forgive', text: '„Du wolltest deine Tochter retten. Das war nicht falsch.“' },
          { id: 'condemn', text: '„Wegen dir sind sie alle tot.“' },
        ]);
        c.flag('ilyas_judged', ch);
        if (ch === 'forgive') await c.lines([{ s: 'ilyas', t: '… Danke. Das hat noch keiner zu mir gesagt.', v: 'i4_h' }]);
        else await c.lines([{ s: 'ilyas', t: 'Ja. Und dafür werde ich geradestehen. Aber nicht heute. Nicht hier unten.', v: 'i4_i' }]);
        await c.lines([{ s: 'ilyas', t: 'Die Daten sind hier drauf. Phase eins, Phase zwei, 017. Alles. Wenn wir rauskommen, geht das an die Presse.', v: 'i4_j' }]);
        c.flag('drive_known');
        c.checkpoint('betrieb');
        c.objective('Durch den Tunnel zur Station Marktplatz.');
      },
    },
    { id: 'c4_frag4', when: 'pickup:frag4', do: async (c) => { await c.wait(1); c.fact('Aufnahme 4: ICH habe jemanden bezahlt, ARGUS abzuschalten. Personalnummer 4471. İlyas.'); } },
    {
      id: 'c4_tunnel', when: 'enter:tunnel_in', do: async (c) => {
        await c.wait(1);
        c.msg('unknown', 'UNBEKANNT', 'Zwischen den Stationen gibt es Nischen. Nutze sie. Und bleib nicht stehen.');
        c.sound('train_far', null, { vol: 0.5, reverbSend: 1.2 });
        await c.wait(5);
        await c.lines([{ s: 'mine', t: 'War das … ein Zug?', v: 'm4_c' }, { s: 'ilyas', t: 'Kein Strom. Das war kein Zug.', v: 'i4_k' }]);
      },
    },
    {
      id: 'c4_horde', when: 'enter:tunnel_mid', do: async (c) => {
        const g = c.g;
        c.sound('door_slam', [93, -3, 33], { vol: 1 });
        await c.wait(0.6);
        c.lines([{ s: 'ilyas', t: 'Aus dem Querschlag! Lauft! Bahnsteig rechts – hoch da!', v: 'i4_l' }]);
        c.objective('Lauf! Klettere auf den Bahnsteig Marktplatz!');
        g.hud.toast(`Bahnsteigkante: <kbd>${g.input.label('vault')}</kbd> hochklettern`);
        const t = g.difficulty.chaseTime;
        for (const [i, z] of [33.5, 34.5, 32.5, 35].entries()) {
          const s = c.spawn({ x: 92.5 + (i % 2), z, type: 'hunter', outfit: ['civilian', 'suit', 'civilian2', 'security'][i] });
          s.forceChase();
          await c.wait(0.7 * t);
        }
      },
    },
    {
      id: 'c4_bite', when: 'enter:mp_plat', do: async (c) => {
        const g = c.g, il = c.npc('ilyas'), m = c.npc('mine');
        if (m && m.pos.y < -3.5) m.teleport(101, 21.2);
        await c.wait(0.4);
        g.audio.play('bite', { pos: il ? { x: il.pos.x, y: il.pos.y + 1, z: il.pos.z } : null, vol: 1 });
        c.lines([{ s: 'ilyas', t: 'Aaah! Er hat mich – mein Bein!', v: 'i4_m' }]);
        await c.wait(1.5);
        if (il) il.teleport(102, 21.5);
        c.flag('ilyas_bitten');
        await c.lines([{ s: 'mine', t: 'Ins Stellwerk! Die Tür da!', v: 'm4_d' }]);
        c.objective('Ins Stellwerk!');
      },
    },
    {
      id: 'c4_stell', when: 'enter:stell', do: async (c) => {
        const g = c.g, il = c.npc('ilyas'), m = c.npc('mine');
        c.close('d_stell', { force: true }); c.lock('d_stell');
        for (const n of [il, m]) if (n && n.pos.z > 19) n.teleport(n === il ? 103 : 106, 15.5);
        if (il) { il.stay(); il.injured = true; }
        c.checkpoint('stellwerk');
        await c.wait(1);
        await c.lines([
          { s: 'mine', t: 'İlyas. Zeig her. … Das ist ein Biss.', v: 'm4_e' },
          { s: 'ilyas', t: 'Ich spür es schon. Wie Ameisen unter der Haut.', v: 'i4_n' },
        ]);
        if (g.inventory.has('serum')) {
          await c.lines([{ s: 'mine', t: 'Sami. Das Serum. Es wirkt nur jetzt, solange der Biss frisch ist.', v: 'm4_f' }]);
          c.msg('unknown', 'UNBEKANNT', 'Das Serum ist für dich bestimmt.');
          await c.wait(2.5);
          const ch = await c.choice('Eine einzige Dosis S-17. İlyas ist gebissen.', [
            { id: 'give', text: 'İlyas das Serum geben.', hint: 'Er überlebt den Biss.' },
            { id: 'keep', text: 'Das Serum behalten.', hint: 'Sami behält eine vollständige Heilung für den Notfall.' },
          ]);
          if (ch === 'give') {
            g.inventory.remove('serum'); c.flag('ilyas_saved');
            if (il) il.injured = false;
            await c.lines([
              { s: 'ilyas', t: 'Warum? Nach allem, was ich …', v: 'i4_o' },
              c.get('ilyas_judged') === 'forgive'
                ? { s: 'sami', t: 'Weil Defne dich braucht.' }
                : { s: 'sami', t: 'Weil du hier rauskommen musst. Jemand muss dafür geradestehen.' },
              { s: 'mine', t: 'Es wirkt. Die Rötung geht schon zurück.', v: 'm4_g' },
            ]);
            c.fact('Ich habe İlyas das Serum gegeben.');
          } else {
            c.flag('serum_kept');
            await c.lines([{ s: 'ilyas', t: 'Schon gut. Ich hätte es auch behalten.', v: 'i4_p' }]);
            c.fact('Ich habe das Serum behalten. [H] heilt mich damit im Notfall vollständig.');
          }
        } else {
          await c.lines([
            { s: 'mine', t: 'Wenn wir nur das Serum hätten …', v: 'm4_h' },
            { s: 'ilyas', t: 'Bringt mich bis zur Brücke. Die will ich noch sehen.', v: 'i4_q' },
          ]);
          c.flag('ilyas_infected');
        }
        if (il) il.follow();
        c.objective('Durch den Notausstieg nach oben. Zum Kontrollpunkt Nord.');
        c.sound('unlock', [105.5, -2, 12.5]);
      },
    },
    {
      id: 'c4_exit', when: 'enter:exit', do: async (c) => {
        c.msg('unknown', 'UNBEKANNT', 'Der Notausstieg führt in die Linden-Passage. Von dort hoch zur Lindenstraße.');
        c.setClock('05:30');
        await c.endChapter('ch4b');
      },
    },
  ],
};

const FRAG4 = {
  title: 'Aufnahme 4/5 – „4471“',
  lines: [
    { s: 'fragment', t: 'Ich habe jemanden bezahlt, damit er ARGUS abschaltet. Vier Minuten. Genug, um die Daten und mich hier rauszubringen.', v: 'f4_a' },
    { s: 'fragment', t: 'Ich kenne nur seine Personalnummer. 4471. Er hat eine kranke Tochter. Deshalb hat er Ja gesagt.', v: 'f4_b' },
    { s: 'fragment', t: 'Ich wusste nicht, was Arendt mit den Schleusen gemacht hat. Ich schwöre es dir.', v: 'f4_c' },
    { s: 'fragment', t: 'Wenn du ihn triffst … er ist nicht schuld. Nicht allein.', v: 'f4_d' },
  ],
};
