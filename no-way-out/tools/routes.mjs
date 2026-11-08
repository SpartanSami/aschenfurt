// Routen für den automatischen Durchspieltest. Jeder Schritt ist der Rumpf einer async-Funktion im Browser
// (AUTO = Autopilot, NWO = Spiel). Rückgabe false = Fehlschlag.
const S = (label, js) => ({ label, js });
const go = (x, z, o = {}) => `return await AUTO.goto(${x}, ${z}, ${JSON.stringify(o)});`;

export const ROUTES = {
  ch1: [
    S('Intro abwarten', 'await AUTO.wait(8); return NWO.state.flags.woke === true;'),
    S('Zum Telefon', go(10.6, 9.0)),
    S('Telefon nehmen', "return AUTO.interact('phone');"),
    S('Anruf annehmen + anhören', "await AUTO.wait(40); return NWO.state.done.has('c1_phone');"),
    S('Akte lesen', "await AUTO.goto(13.4, 11.2); return AUTO.interact('doc_akte');"),
    S('Raus in den Flur', go(11.5, 15.5)),
    S('Flur nach Osten', go(30, 16.3)),
    S('Stationszimmer: Flasche', "await AUTO.goto(25.1, 16.6); AUTO.interact('bottle1'); return NWO.player.carry === 'bottle';"),
    S('Weiter zum Wartebereich', go(43.5, 16.5)),
    S('Geduckt an Gestalt vorbei', "NWO.player.crouched = true; await AUTO.goto(45.5, 19.8); return await AUTO.goto(51.5, 20.3);"),
    S('Gestalt noch ruhig?', "return NWO.zombies.find(z => z.id === 'z_wait').state;"),
    S('In die Intensivstation', "NWO.player.crouched = false; return await AUTO.goto(51.5, 23);"),
    S('ITS Mitte -> Zombie erwacht', go(52.5, 26.8)),
    S('Flucht zum Westausgang', go(46.3, 29.5, { sprint: true })),
    S('Personalflur -> Umkleide', `await AUTO.goto(33.5, 30.0, { sprint: true }); return await AUTO.goto(33.5, 27.0, { sprint: true });`),
    S('Im Spind verstecken', "const h = NWO.level.hides.find(h => h.type==='locker' && h.z < 24 && h.x > 31 && h.x < 32); await AUTO.goto(h.exit.x, h.exit.z); NWO.player.enterHide(h); await AUTO.wait(2); return NWO.player.mode;"),
    S('Warten bis Verfolger aufgibt', "await AUTO.wait(50); return NWO.state.done.has('c1_its_wake') || NWO.zombies.find(z=>z.id==='z_its')?.state;"),
    S('Versteck verlassen', "if (NWO.player.mode==='hidden') NWO.player.exitHide(); await AUTO.wait(1.5); return NWO.player.mode;"),
    S('Zugangskarte nehmen', "await AUTO.goto(33.2, 26.4); AUTO.interact('card_op'); await AUTO.wait(0.5); return NWO.inventory.has('card_op');"),
    S('Zum OP-Trakt', go(27.0, 31.0)),
    S('OP-Tür entriegeln', "return AUTO.useDoor('d_op_a');"),
    S('OP-Flur nach Süden (geduckt, Licht aus)', "NWO.player.crouched = true; NWO.player.flashlight=false; await AUTO.goto(26.5, 44); return await AUTO.goto(27.2, 49.4);"),
    S('Versorgungsflur', "NWO.player.crouched = false; return await AUTO.goto(30.5, 51.5);"),
    S('Sicherheitsbüro + Kameras', "await AUTO.goto(42.5, 46.2); const r = AUTO.interact('sec_monitors'); await AUTO.wait(1); return r;"),
    S('Technikraum', go(34.7, 55.6)),
    S('Notstrom starten', "AUTO.interact('gen'); await AUTO.wait(3); return NWO.state.flags.power_on === true;"),
    S('Zum Aufzug rennen', go(52.0, 51.3, { sprint: true })),
    S('Aufzug rufen', "return AUTO.interact('elev_call');"),
    S('Warten auf Aufzug', "await AUTO.wait(6 * NWO.difficulty.chaseTime); return NWO.level.door('d_elev').target;"),
    S('Einsteigen', go(55.5, 51.5, { sprint: true })),
    S('Kapitelende', "await AUTO.wait(9); await new Promise(r => setTimeout(r, 6000)); return NWO.chapter.id;"),
  ],
};
