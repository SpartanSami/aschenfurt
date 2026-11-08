// Automatischer Durchspieltest: steuert Sami per Autopilot durch ein Kapitel (echte Bewegung, Kollision,
// Türen, Skripte, Checkpoints) und meldet Fehler, Feststecken und fehlende Story-Fortschritte.
// node tools/playtest.mjs <chapter|all> [--god] [--shots]
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { ROUTES } from './routes.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2);
const which = args[0] || 'ch1';
const shots = args.includes('--shots');
const srv = http.createServer((req, res) => { const p = path.join(root, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : p.endsWith('.css') ? 'text/css' : p.endsWith('.mp3') ? 'audio/mpeg' : 'text/html' }); fs.createReadStream(p).pipe(res); }).listen(0);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 480, height: 270 } });
await page.addInitScript(() => localStorage.setItem('nwo.settings.v1', JSON.stringify({ quality: 'low', difficulty: 'normal' })));
const errs = [];
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' | ')));
page.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); if (m.text().startsWith('[AUTO]')) console.log(m.text()); });
await page.goto(`http://localhost:${srv.address().port}/index.html?debug`);
await page.waitForTimeout(400);

// Autopilot im Browser
await page.evaluate(() => {
  const A = window.AUTO = {};
  const g = () => window.NWO;
  A.log = (...a) => console.log('[AUTO] ' + a.join(' '));
  A.walkable = (x, y) => {
    const G = g().level.grid; const v = G.get(x, y);
    if (!(v & 2) || (v & 1) || (v & 32)) return false;
    if ((v & 8) && !(v & 256)) return false;
    if (v & 1024) { const d = g().level.doors.find((dd) => dd.x === x && dd.y === y); if (!d || d.locked) return false; }
    // dünne Requisiten ohne Rastermarkierung ebenfalls meiden
    for (const c of g().level.collidersNear(x + 0.5, y + 0.5, 1)) {
      if (c.door || c.y1 < 0.3) continue;
      const dx = x + 0.5 - c.cx, dz = y + 0.5 - c.cz;
      const lx = dx * c.cos - dz * c.sin, lz = dx * c.sin + dz * c.cos;
      if (Math.abs(lx) <= c.hx + 0.3 && Math.abs(lz) <= c.hz + 0.3 && !c.vault) return false;
    }
    return true;
  };
  A.path = (x, z) => {
    const G = g().level.grid; const save = G.aiWalkable;
    G.aiWalkable = (cx, cy) => A.walkable(cx, cy);
    const save2 = G.aiStepCost;
    G.aiStepCost = function (ax, ay, bx, by) { if (!A.walkable(bx, by)) return Infinity; const dx = bx - ax, dy = by - ay; const ha = this.edgeHeight(ax, ay, dx, dy), hb = this.edgeHeight(bx, by, -dx, -dy); if (hb - ha > 1.3) return Infinity; let c = 1; if (this.f[this.idx(bx, by)] & 256) c += 6; if (hb - ha > 0.45) c += 8; return c; };
    const p = G.findPath(g().player.pos.x, g().player.pos.z, x, z, 20000);
    G.aiWalkable = save; G.aiStepCost = save2;
    return p;
  };
  // Läuft zu (x,z). Gibt true/false zurück.
  A.goto = async (x, z, o = {}) => {
    const game = g(), p = game.player, G = game.level.grid;
    let path = A.path(x, z);
    if (!path) { A.log('KEIN PFAD nach', x, z, 'von', p.pos.x.toFixed(1), p.pos.z.toFixed(1)); return false; }
    let i = 1, t = 0, lastProg = 0, best = 1e9;
    const sprint = !!o.sprint;
    const ok = await game.simulateAsync(o.timeout || 120, 1 / 30, (gm) => {
      A.tick();
      if (gm.mode !== 'play') return;
      if (p.mode !== 'normal') { gm.keyUp('KeyW'); return; }
      t += 1 / 30;
      const wp = i < path.length ? { x: path[i].x + 0.5, z: path[i].y + 0.5 } : { x, z };
      if (i >= path.length - 1) { wp.x = x; wp.z = z; }
      const d = Math.hypot(wp.x - p.pos.x, wp.z - p.pos.z);
      if (d < 0.35 && i < path.length - 1) { i++; }
      const fd = Math.hypot(x - p.pos.x, z - p.pos.z);
      if (fd < 0.45) { gm.keyUp('KeyW'); gm.keyUp('ShiftLeft'); return 'stop'; }
      if (fd < best - 0.2) { best = fd; lastProg = t; }
      if (t - lastProg > 6) { A.log('FESTGESTECKT bei', p.pos.x.toFixed(2), p.pos.z.toFixed(2), 'Ziel', x, z); A.stuck = true; gm.keyUp('KeyW'); return 'stop'; }
      // lokales Ausweichen bei Hängern
      gm.input.keys.delete('KeyA'); gm.input.keys.delete('KeyD');
      if (t - lastProg > 1.2) { const side = Math.floor((t - lastProg) / 0.8) % 2 ? 'KeyA' : 'KeyD'; gm.input.keys.add(side); }
      p.yaw = Math.atan2(-(wp.x - p.pos.x), -(wp.z - p.pos.z)); p.pitch = 0;
      // Türen öffnen
      for (const door of gm.level.doors) {
        if (!door.isShut() || door.locked) continue;
        if (Math.hypot(door.center.x - p.pos.x, door.center.z - p.pos.z) < 1.4) door.open(p.pos);
      }
      // Klettern
      const ci = Math.floor(p.pos.x - Math.sin(p.yaw) * 0.8), cj = Math.floor(p.pos.z - Math.cos(p.yaw) * 0.8);
      if (G.has(ci, cj, 256) || G.heightAt(p.pos.x - Math.sin(p.yaw) * 0.7, p.pos.z - Math.cos(p.yaw) * 0.7) - p.pos.y > 0.45) { if (Math.random() < 0.2) gm.tap('Space'); }
      gm.input.keys.add('KeyW');
      if (sprint) gm.input.keys.add('ShiftLeft');
    });
    game.keyUp('KeyW'); game.keyUp('ShiftLeft'); game.keyUp('KeyA'); game.keyUp('KeyD');
    const fd = Math.hypot(x - p.pos.x, z - p.pos.z);
    if (fd > 0.8) { A.log('Ziel nicht erreicht', x, z, 'Abstand', fd.toFixed(2)); return false; }
    return true;
  };
  A.tick = () => { const gm = g(); if (gm.phone.incoming && Math.random() < 0.3) gm.tap('KeyE'); if (gm.docs.isOpen()) gm.docs.close(); if (gm.qte && Math.random() < 0.5) gm.tap(Math.random() < 0.5 ? 'KeyA' : 'KeyD'); if (gm.camView) gm.tap('KeyE'); if (gm.modal === 'choice' && gm.hud.choiceState) { const st = gm.hud.choiceState; gm.hud.choiceState = null; st.done(A.choicePick ? A.choicePick(st.options) : st.options[0].id); } };
  A.wait = (s) => g().simulateAsync(s, 1 / 30, () => { A.tick(); });
  A.interact = (id) => {
    const gm = g();
    const ia = gm.level.interacts.find((o) => o.id === id && (!o.enabled || o.enabled()));
    if (!ia) { A.log('Interaktion nicht verfügbar:', id); return false; }
    const d = Math.hypot(ia.pos.x - gm.player.pos.x, ia.pos.z - gm.player.pos.z);
    if (d > 2.5) A.log('WARN Interaktion aus Distanz', d.toFixed(1), id);
    gm.player._doInteract(ia);
    return true;
  };
  A.useDoor = (id) => { const gm = g(); const d = gm.level.door(id); gm.player._doInteract({ kind: 'door', door: d }); return !d.locked; };
  A.state = () => { const gm = g(); return { ch: gm.chapter?.id, mode: gm.mode, pmode: gm.player.mode, hp: Math.round(gm.player.hp), x: +gm.player.pos.x.toFixed(1), z: +gm.player.pos.z.toFixed(1), obj: gm.phone.data.objective, flags: Object.keys(gm.state.flags).filter((k) => !k.startsWith('read:') && !k.startsWith('used:')).join(',') }; };
});

async function runChapter(ch) {
  const route = ROUTES[ch];
  if (!route) { console.log('Keine Route für', ch); return false; }
  console.log(`\n=== ${ch} ===`);
  await page.evaluate((c) => { window.NWO.startChapter(c); }, ch);
  await page.waitForFunction(() => window.NWO.mode === 'play', null, { timeout: 60000 });
  await page.evaluate((god) => { window.NWO.godMode = god; window.NWO.godInvisible = god; window.NWO.noAutoPause = true; }, args.includes('--god'));
  let ok = true;
  for (const [k, step] of route.entries()) {
    const res = await page.evaluate(`(async () => { ${step.js.replace(/__CHOICE__/g, process.env.CHOICE || 'hope')} })()`);
    const st = await page.evaluate(() => window.AUTO.state());
    console.log(`${String(k).padStart(2)} ${step.label.padEnd(36)} -> ${JSON.stringify(res)} | ${st.mode}/${st.pmode} hp${st.hp} @${st.x},${st.z} | ${st.obj}`);
    if (shots) await page.screenshot({ path: `tools/out/pt_${ch}_${k}.png` });
    if (res === false || st.pmode === 'dead') { ok = false; console.log('!! Schritt fehlgeschlagen'); break; }
  }
  return ok;
}

const list = which === 'all' ? Object.keys(ROUTES) : [which];
let allOk = true;
for (const ch of list) { const ok = await runChapter(ch); allOk = allOk && ok; }
console.log('\nFehler:', errs.length ? '\n' + errs.slice(0, 20).join('\n') : 'keine');
console.log(allOk && !errs.length ? 'ERGEBNIS: OK' : 'ERGEBNIS: PROBLEME');
await browser.close(); srv.close();
process.exit(allOk && !errs.length ? 0 : 1);
