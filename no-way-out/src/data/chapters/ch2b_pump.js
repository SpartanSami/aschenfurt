// KAPITEL 2, TEIL 2 – VERSORGUNGSEBENE & PUMPWERK
// Der Versorgungstunnel zum Parkhaus ist geflutet. Leitungsgang mit Dampfventilen (Dampfstöße locken Infizierte an),
// Werkstatt, Pumpwerk mit geflutetem Becken (Ertrunkene, Waten ist langsam und laut, Ablenkung mit Würfen),
// Schaltwarte: Notstrom öffnet das Schott – und weckt alles. Rückweg über den Südsteg, Notausgang -> Parkhaus.
const PI = Math.PI;
const VALVES = [[12, 25.05], [22, 25.05], [31, 25.05]];

export default {
  id: 'ch2b', startFlag: 'c2b_started', name: 'Die Forschungseinrichtung', part: true, partName: 'Versorgungsebene · Pumpwerk',
  tagline: 'Halden-Institut · Ebene U4 · Pumpwerk',
  w: 66, h: 34,
  opts: { floor: 'concrete_floor', wall: 'concrete_wall', ceil: 'concrete', height: 3 },
  env: { fog: 0x05070a, fogDensity: 0.05, hemi: 0.05, exposure: 1.05, tint: 0xe8eef2, reverb: [3.0, 1.9], reverbMix: 0.45, sleeve: 0x8fb0c4 },

  build(L) {
    // ---------- Räume ----------
    L.room('Leitungsgang', 4, 25, 36, 3, { wet: true });
    L.room('Werkstatt', 18, 19, 8, 5, { floor: 'concrete', wall: 'h_tile_wall' });
    L.door(21, 24, { id: 'd_werk' });
    L.room('Pumpwerk', 41, 12, 16, 17, { height: 4.5, wet: true });
    L.door(40, 26, { id: 'd_pump', kind: 'metal' });
    // Geflutetes Becken mit Rampen
    L.heights(45, 16, 8, 9, -1.2, null);
    L.ramp(45, 18, 3, 3, '-x', -1.2, 1.2, { mat: 'concrete' });
    L.ramp(50, 18, 3, 3, '+x', -1.2, 1.2, { mat: 'concrete' });
    L.water(45, 16, 8, 9, { level: -0.45 });
    // Nordsteg eingestürzt, Südsteg durch Wartungsgitter gesperrt
    L.solid(48, 12, 2, 4);
    L.solid(48, 25, 1, 4);
    L.door(48, 26, { id: 'd_grate', kind: 'security', locked: true, lockedText: 'Wartungsgitter – verriegelt. Steuerung: Schaltwarte.' });
    L.room('Schaltwarte', 58, 21, 6, 7, { floor: 'h_floor2', wall: 'l_wall_dark', ceil: 'l_ceil' });
    L.door(57, 24, { id: 'd_warte' });
    L.door2(42, 11, { id: 'schott', kind: 'security', locked: true, lockedText: 'Schott zum Parkhaus – Steuerung in der Schaltwarte' });
    L.room('Notausgang Parkhaus', 42, 2, 2, 9, { floor: 'concrete', height: 4.5 });
    L.ramp(42, 2, 2, 7, '-z', 0, 2.1, { stairs: true, mat: 'concrete' });

    // ================= Licht =================
    L.lightsAlong(7, 26, 37, 26, 5, (i) => ({ kind: 'tube', mode: i === 2 ? 'broken' : i === 4 ? 'flicker' : 'steady', mul: 0.5 }));
    L.light(22, 21, { kind: 'bulb', mul: 0.6, mode: 'flicker' });
    // Pumpwerk: ohne Strom nur Notlicht – mit Notstrom die Hallenleuchten
    for (const [x, z] of [[43, 14], [43, 26], [54.5, 14], [54.5, 26], [49, 20.5]]) L.light(x, z, { kind: 'sodium', mul: 0.9, group: 'pump' });
    for (const [x, z] of [[41.5, 19], [56.5, 19], [47, 12.3], [52, 28.6]]) L.light(x, z, { kind: 'emergency', group: 'emerg' });
    L.light(60.5, 24, { kind: 'panel', mul: 0.5, group: 'pump' });
    L.light(62.5, 26.5, { kind: 'emergency', group: 'emerg' });
    L.light(42.5, 6, { kind: 'bulb', mul: 0.6 });
    // schwaches Grundlicht ohne Strom: Silhouetten im Becken
    L.light(42.5, 16.5, { kind: 'bulb', mul: 0.7, mode: 'flicker', speed: 0.3 });
    L.light(55.5, 16.5, { kind: 'bulb', mul: 0.55 });
    L.light(42.5, 24.5, { kind: 'bulb', mul: 0.5 });
    L.light(53.5, 24.5, { kind: 'bulb', mul: 0.5 });
    L.light(60.8, 22.4, { kind: 'screen', mul: 1.6 });

    // ================= Requisiten =================
    for (const [x, z] of VALVES) L.prop('valve', x, z, {});
    L.prop('pipe', 22, 25.12, { len: 34, y: 2.5, r: 0.12, rot: PI / 2, mat: 'metal_rust' });
    L.prop('pipe', 22, 27.88, { len: 34, y: 2.6, r: 0.08, rot: PI / 2, mat: 'metal_dark' });
    L.prop('pipe', 22, 27.85, { len: 34, y: 0.3, r: 0.15, rot: PI / 2, mat: 'metal_rust' });
    L.prop('boxes', 16.5, 27.4, { n: 3 });
    L.prop('barrels', 28.4, 27.4, { n: 2, mat: 'metal_rust' });
    L.prop('cart', 36.8, 25.6, { rot: 0.4 });
    L.sign('PUMPWERK →', 39.97, 25.4, { w: 1.0, h: 0.24, y: 2.2, face: 'e', bg: '#e9ecef' });
    L.sign('VERSORGUNGSEBENE U4', 4.03, 26.0, { w: 1.4, h: 0.26, y: 2.2, face: 'w', bg: '#e9ecef' });
    // Werkstatt
    L.prop('labbench', 20.0, 19.6, { w: 3.0 });
    L.prop('shelf', 25.3, 21.5, { rot: -PI / 2, w: 2.4 });
    L.prop('locker', 18.4, 22.5, { rot: PI / 2, hide: true });
    L.prop('locker', 18.4, 21.8, { rot: PI / 2 });
    L.prop('cabinet', 23.5, 19.4, { w: 1.2, mat: 'metal_dark' });
    // Pumpwerk
    L.prop('pump', 42.6, 13.6, { text: 'P1' });
    L.prop('pump', 54.0, 13.4, { text: 'P2', rot: PI });
    L.prop('pump', 54.2, 27.2, { text: 'P3', rot: PI });
    L.prop('tank', 42.6, 23.0, {});
    L.prop('debris', 47.4, 13.6, { w: 2.0, pipe: true, rot: PI / 2 });
    L.prop('debris', 50.6, 14.2, { w: 1.6, rot: PI / 2 + 0.3 });
    L.prop('pipe', 49, 12.3, { len: 14, y: 3.9, r: 0.25, rot: PI / 2, mat: 'metal_rust' });
    L.prop('pipe', 44.7, 20.5, { len: 8, y: 0.9, r: 0.04, mat: 'paint_yellow' });
    L.prop('pipe', 53.3, 20.5, { len: 8, y: 0.9, r: 0.04, mat: 'paint_yellow' });
    L.prop('crate', 42.0, 20.4, { rot: PI / 2, s: 0.8 });
    L.prop('barrels', 55.6, 22.4, { n: 2, mat: 'plastic_blue' });
    L.prop('boxes', 44.0, 27.6, { n: 3 });
    L.sign('SCHALTWARTE →', 56.97, 23.0, { w: 1.2, h: 0.26, y: 2.3, face: 'e', bg: '#e9ecef' });
    L.sign('SCHOTT · NOTAUSGANG PARKHAUS', 43.0, 11.97, { w: 2.2, h: 0.3, y: 2.6, face: 'n', bg: '#0d8a44', fg: '#fff' });
    L.sign('BECKEN 2 · ZUTRITT VERBOTEN', 46.0, 12.03, { w: 1.6, h: 0.26, y: 2.2, face: 'n', bg: '#ffd400', fg: '#111' });
    // Schaltwarte
    L.prop('console', 60.8, 21.6, { w: 3.6, screen: 'text', screenOpts: { text: 'PUMPWERK U4\nP1 P2 P3: AUS\nNOTSTROM: BEREIT', color: '#ffb060' } });
    L.prop('desk', 62.6, 25.6, { rot: -PI / 2, monitor: false, papers: true });
    L.prop('cabinet', 58.6, 26.8, { w: 1.2, rot: PI / 2, mat: 'metal_dark' });
    L.prop('chair', 60.6, 22.6, { rot: 0.4 });

    // ================= Decals =================
    L.decal('blood_trail', 30, 26.5, { size: 2.6, rot: PI / 2 });
    L.prop('body', 28.0, 25.25, { cloth: 'scrubs', rot: 1.5, blood: true });
    L.decal('blood_hand', 40.02, 25.4, { wall: 'w', y: 1.2, size: 0.4 });
    L.decal('blood_smear', 56.0, 24.0, { size: 1.0 });
    L.decal('paper', 61.5, 23.5); L.decal('paper', 59.0, 25.8);

    // ================= Gegenstände & Dokumente =================
    L.item('bandage', 20.4, 19.6, { id: 'b2b_werk', h: 0.95 });
    L.item('ammo', 19.2, 19.6, { id: 'ammo2b_a', h: 0.95, rounds: 8 });
    L.item('doc', 21.2, 19.6, { id: 'doc_wartung', doc: 'c2b_wartung', h: 0.95 });
    L.item('pills', 25.3, 21.0, { id: 'p2b_werk', h: 1.2, notHard: true });
    L.item('can', 16.5, 26.9, { id: 'c2b_can1', h: 0.6 });
    L.item('bottle', 42.0, 20.4, { id: 'b2b_b1', h: 0.66 });
    L.item('bottle', 42.4, 21.0, { id: 'b2b_b2', h: 0.05 });
    L.item('can', 43.6, 17.0, { id: 'c2b_can2', h: 0.05 });
    L.item('bandage', 62.6, 25.2, { id: 'b2b_warte', h: 0.78, extra: true });
    L.item('doc', 62.6, 26.0, { id: 'doc_schicht', doc: 'c2b_schicht', h: 0.78 });
    L.item('ammo', 62.6, 24.9, { id: 'ammo2b_b', h: 0.78, rounds: 12 });
    // Zusätzliche Fundstücke am Wegesrand (liegen am Boden an der Wand und leuchten auf)
    L.item('ammo', 23.5, 25.23, { id: 'ammo_x0', h: 0.03, rounds: 10 });
    L.item('bandage', 34.5, 25.23, { id: 'band_x1', h: 0.03 });
    L.item('ammo', 41.23, 22.5, { id: 'ammo_x2', h: 0.03, rounds: 10 });
    L.item('bandage', 61.5, 27.77, { id: 'band_x3', h: 0.03, notHard: true });

    L.interact('power_lever', 59.2, 21.2, { prompt: 'Notstrom einschalten (gedrückt halten)', y: 1.2, radius: 1.3, mesh: 'panel', rot: 0, hold: 1.5, enabled: (g) => !g.state.flags.pump_power });

    // ================= Gegner =================
    L.zombie(30, 26, { id: 'zl_1', type: 'wanderer', outfit: 'hazmat', patrol: [[37, 26], [14, 26]] });
    L.zombie(28.0, 25.5, { id: 'zl_2', type: 'sleeper', pose: 'kneel', yaw: 0.15, outfit: 'labcoat', wake: 2.8 });
    L.zombie(35.0, 27.4, { id: 'zl_3', type: 'sleeper', pose: 'sitting', yaw: PI - 0.3, outfit: 'scrubs', wake: 3 });
    L.zombie(23.6, 21.6, { id: 'zw_1', type: 'sleeper', pose: 'lying', yaw: 1.0, outfit: 'civilian2', wake: 3 });
    // Kriecher in der hinteren Werkstatt-Ecke: liegt reglos da, bis Sami das Wartungsbuch gelesen hat.
    // Er liegt bewusst abseits der Tür, damit er sie nicht verstopft, bevor Sami überhaupt hineinkommt.
    L.zombie(25.2, 23.3, { id: 'zw_crawl', type: 'crawler', yaw: PI / 2, outfit: 'hazmat', state: 'dormant', wake: 99 });
    L.zombie(48.6, 19.4, { id: 'zd_1', type: 'shambler', yaw: 0.3, outfit: 'hazmat' });
    L.zombie(49.8, 22.6, { id: 'zd_2', type: 'shambler', yaw: 2.2, outfit: 'civilian' });
    L.zombie(46.6, 23.4, { id: 'zd_3', type: 'shambler', yaw: -2.6, outfit: 'labcoat' });
    L.zombie(51.4, 16.8, { id: 'zd_4', type: 'shambler', yaw: 1.4, outfit: 'scrubs' });
    L.zombie(54.6, 17.0, { id: 'zp_w', type: 'wanderer', outfit: 'security', patrol: [[54.6, 13.5], [54.6, 26.5]] });
    L.zombie(61.0, 22.8, { id: 'zs_1', type: 'sleeper', pose: 'sitting', yaw: 0.2, outfit: 'hazmat', wake: 2.6 });

    // ================= Auslöser & Checkpoints =================
    L.trigger('werk', 18, 19, 8, 5);
    L.trigger('pump_in', 41, 22, 4, 7);
    L.trigger('east', 53, 16, 4, 12);
    L.trigger('warte', 58, 21, 6, 7);
    L.trigger('notaus', 42, 5, 2, 6);
    L.trigger('exit', 42, 2, 2, 2, { yMin: 1.2 });
    L.checkpoint('start', 5.5, 26, -PI / 2);
    L.checkpoint('pump', 42.6, 26.6, 0);
    L.checkpoint('warte', 59.5, 25.5, PI / 2);
    L.checkpoint('notaus', 42.6, 8.8, 0);
  },

  ambience(g) {
    g.audio.loop('amb', 'garage_loop', { vol: 0.3, bus: 'amb', reverb: false });
  },

  onLoad(c, info) {
    const g = c.g;
    if (!info.restored) c.setClock('04:55');
    if (!c.npc('mine')) c.addNpc('mine', 4.6, 25.6, { mode: 'follow' });
    // Stromkreis und Türen werden über den Spielstand wiederhergestellt; ohne Notstrom bleibt die Halle dunkel
    if (!c.get('pump_power')) c.power('pump', false);
    // Tropfen und Rauschen im Becken
    g.audio.loop('pump_water', 'rain_loop', { pos: { x: 49, y: 0, z: 20 }, vol: 0.12, bus: 'sfx' });
  },

  script: [
    {
      id: 'c2b_start', when: 'start', if: (c) => !c.get('c2b_started'), do: async (c) => {
        const g = c.g;
        c.objective('Der Tunnel zum Parkhaus ist geflutet. Weg über Pumpwerk und Schaltwarte.');
        await c.wait(1.5);
        await c.lines([
          { s: 'mine', t: 'Wasser. Der Tunnel zum Parkhaus steht bis zur Decke.' },
          { s: 'sami', t: 'Gibt es einen anderen Weg?', d: 1.8 },
          { s: 'mine', t: 'Das Pumpwerk. Von dort führt ein Notausgang hoch ins Parkhaus.' },
        ]);
        c.msg('unknown', 'UNBEKANNT', 'Pumpwerk, dann Schaltwarte. Sie öffnet das Schott. Die Ventile blasen Dampf ab – sie gehen dem Zischen nach. Nutze es.');
        g.hud.toast('Dampfstöße sind laut: Infizierte gehen dem Zischen nach – dann ist der Weg kurz frei.');
        c.flag('c2b_started');
        c.checkpoint('start');
      },
    },
    {
      // Dampfventile: periodische Stöße mit echtem Geräusch, das Infizierte anlockt
      id: 'c2b_steam', when: 'start', once: false, do: async (c) => {
        const g = c.g;
        let k = 0;
        for (let n = 0; n < 2000; n++) {
          await c.wait(2.6 + Math.random() * 1.2);
          const [x, z] = VALVES[k % VALVES.length]; k++;
          if (!g.level || !g.fx) return;
          c.sound('hiss', [x, 1.3, z + 0.3], { vol: 0.9 });
          g.fx.puff(x, 1.2, z + 0.5, { rise: true, n: 80, w: 0.8, d: 0.8, life: 2.6, size: 0.45 });
          c.noise(x, z + 0.6, 7, 'steam');
        }
      },
    },
    {
      id: 'c2b_werk', when: 'enter:werk', do: async (c) => {
        await c.wait(0.6);
        await c.lines([{ s: 'mine', t: 'Die Werkstatt der Haustechnik. İlyas hat hier gearbeitet, glaube ich.' }]);
      },
    },
    {
      id: 'c2b_wartung', when: 'closed:c2b_wartung', do: async (c) => {
        await c.wait(0.4);
        c.say('sami', 'Sie haben die Pumpen absichtlich aus gelassen.', { d: 2.6 });
        c.fact('Wartungsbuch: Die Pumpen von Ebene U4 wurden auf Anweisung der NEXARA-Sicherheit nicht wieder angefahren. Das Wasser soll Spuren aus Sektion C bedecken.');
        // Der „Tote“ in der Ecke regt sich
        await c.wait(1.6);
        if (c.zombie('zw_crawl')) { c.sound('metal_creak', [25.2, 0.3, 23.3], { vol: 0.7 }); c.wake('zw_crawl', 'chase'); }
      },
    },
    {
      id: 'c2b_pump', when: 'enter:pump_in', do: async (c) => {
        const g = c.g;
        c.checkpoint('pump');
        await c.wait(1.0);
        c.say('sami', 'Da unten … sie stehen im Wasser.', { d: 2.4 });
        await c.wait(2.4);
        await c.lines([{ s: 'mine', t: 'Die Spätschicht. Sie wollten die Pumpen retten.' }]);
        c.objective('Durch das Becken zur Schaltwarte (Ostseite). Im Wasser bist du langsam und laut.');
        g.hud.toast(`Im Wasser: langsamer und lauter. <kbd>${g.input.label('throw')}</kbd> Werfen lenkt sie ab.`);
      },
    },
    { id: 'c2b_schott', when: 'locked:schott_a', do: async (c) => { c.say('sami', 'Das Schott. Die Steuerung ist in der Schaltwarte.', { d: 2.4 }); } },
    { id: 'c2b_schott_b', when: 'locked:schott_b', do: async (c) => { c.fire('locked:schott_a'); } },
    {
      id: 'c2b_east', when: 'enter:east', do: async (c) => {
        await c.wait(0.5);
        c.msg('unknown', 'UNBEKANNT', 'Schaltwarte, Ostwand. Der Notstrom öffnet das Schott. Danach hast du keine Zeit.');
      },
    },
    {
      id: 'c2b_warte', when: 'enter:warte', if: (c) => !c.get('pump_power'), do: async (c) => {
        c.checkpoint('warte');
        await c.wait(1.0);
        await c.lines([
          { s: 'mine', t: 'Der Notstrom. Wenn du den Hebel ziehst, springt hier alles an. Auch der Alarm.' },
          { s: 'sami', t: 'Und dann?', d: 1.4 },
          { s: 'mine', t: 'Dann laufen wir. Über den Südsteg zum Schott.' },
        ]);
        c.objective('Notstrom einschalten. Danach sofort über den Südsteg zum Schott (Nordwest).');
      },
    },
    { id: 'c2b_schicht', when: 'closed:c2b_schicht', do: async (c) => { await c.wait(0.4); c.fact('Schichtbuch Schaltwarte: Der letzte Eintrag endet mitten im Satz. „Sie kommen durch das Wasser“.'); } },
    {
      id: 'c2b_power', when: 'interact:power_lever', do: async (c) => {
        const g = c.g;
        c.flag('pump_power');
        c.sound('generator_start', [60, 1, 21.5], { vol: 0.9 });
        c.shake(0.3);
        await c.wait(1.6);
        c.power('pump', true);
        c.sound('power_on', null, { vol: 0.8 });
        c.loop('pump_klaxon', 'klaxon', [49, 4, 20], { vol: 0.45, bus: 'sfx' });
        c.lightMode('emerg', 'strobe');
        c.noise(50, 20, 40, 'alarm');
        c.pa([{ s: 'pa', t: 'Achtung. Notstrom aktiv. Schott Nord öffnet. Becken zwei: Pumpen starten.', v: 'pa_pump1' }], { parallel: true });
        c.unlock('d_grate'); c.open('d_grate');
        c.objective('Zum Schott (Nordwest)! Über den Südsteg – das Gitter ist offen.');
        c.wake('zs_1', 'chase');
        await c.wait(0.8);
        await c.lines([{ s: 'mine', t: 'Sie kommen aus dem Wasser! Lauf!' }]);
        const t = g.difficulty.chaseTime;
        for (const id of ['zd_1', 'zd_2', 'zp_w', 'zd_3', 'zd_4']) { const z = c.zombie(id); if (z) z.forceChase(); await c.wait(0.7 * t); }
        await c.wait(1.0 * t);
        c.unlock('schott'); c.open('schott');
        c.sound('slide_door', [42.9, 1.2, 11.5], { vol: 1 });
        for (const id of ['zl_1', 'zl_2']) { const z = c.zombie(id); if (z) z.forceChase(); }
      },
    },
    {
      id: 'c2b_notaus', when: 'enter:notaus', if: (c) => c.get('pump_power'), do: async (c) => {
        const g = c.g;
        const m = c.npc('mine');
        if (m && m.pos.z > 11.5) m.teleport(42.6, 9.6);
        await c.wait(0.4);
        const d = c.door('schott'); if (d) d.crushing = true;
        c.close('schott', { force: true }); c.lock('schott');
        c.stopLoop('pump_klaxon', 2);
        c.sound('door_slam', [42.9, 1.2, 11.5], { vol: 1 });
        const safe = () => !g.zombies.some((z) => z.alive && z.pos.z < 11 && ['chase', 'attack', 'grab'].includes(z.state));
        await c.until(safe, 20);
        if (safe() && g.player.mode !== 'dead') c.checkpoint('notaus');
        c.objective('Die Treppe hoch ins Parkhaus.');
        await c.wait(1.5);
        await c.lines([
          { s: 'sami', t: 'Elif … warst du bei ihr? Am Ende?', d: 2.4 },
          { s: 'mine', t: 'Jeden Tag. Sie hat nach dir gefragt. Bis sie nicht mehr fragen konnte.' },
          { s: 'mine', t: 'Und dann hast du dich gemeldet. Als Nummer siebzehn.' },
        ]);
      },
    },
    {
      id: 'c2b_exit', when: 'enter:exit', do: async (c) => {
        c.msg('unknown', 'UNBEKANNT', 'Parkhaus Am Klinikum. Ebene minus drei. Achte auf die Autos.');
        await c.wait(1.5);
        c.setClock('05:02');
        await c.endChapter('ch3');
      },
    },
  ],
};
