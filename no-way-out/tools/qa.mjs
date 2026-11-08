// Zusätzliche QA-Prüfungen: Tod -> Checkpoint, Schwierigkeitsgrade (Heilmittel), Speichern/Fortsetzen, Enden-Freischaltung
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const srv = http.createServer((req, res) => { const p = path.join(root, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : p.endsWith('.css') ? 'text/css' : p.endsWith('.mp3') ? 'audio/mpeg' : 'text/html' }); fs.createReadStream(p).pipe(res); }).listen(0);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 400, height: 225 } });
await page.addInitScript(() => { if (!sessionStorage.getItem('x')) { localStorage.clear(); sessionStorage.setItem('x', 1); } localStorage.setItem('nwo.settings.v1', JSON.stringify({ quality: 'low' })); });
const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await page.goto(`http://localhost:${srv.address().port}/index.html?debug`);
await page.waitForTimeout(500);
const R = async (label, fn, arg) => { const r = await page.evaluate(fn, arg); console.log(label.padEnd(44), JSON.stringify(r)); return r; };
// Schwierigkeitsgrade: Anzahl Heilmittel in Kapitel 1–5
for (const d of ['easy', 'normal', 'hard']) {
  const counts = [];
  for (const ch of ['ch1', 'ch2', 'ch3', 'ch4', 'ch5']) {
    await page.evaluate(async ([d, ch]) => { const g = window.NWO; g.difficulty = (await import('/dist/game.js').catch(() => null), g.difficulty); }, [d, ch]).catch(() => {});
    const n = await page.evaluate(async ([d, ch]) => { const g = window.NWO; g.noAutoPause = true; g.settings.difficulty = d; await g.newGame(d); await g.loadChapter(ch, 'start', null); return g.level.items.filter((i) => i.info.kind === 'heal').length; }, [d, ch]);
    counts.push(n);
  }
  console.log(`Heilmittel je Kapitel (${d.padEnd(6)})`.padEnd(44), JSON.stringify(counts), 'Summe', counts.reduce((a, b) => a + b, 0));
}
// Tod und Checkpoint
await page.evaluate(async () => { const g = window.NWO; await g.newGame('normal'); });
await page.waitForTimeout(500);
await R('Checkpoint vor dem Tod', async () => { const g = window.NWO; await g.simulateAsync(9); g.checkpoint('corridor'); return [g.lastSnapshot.checkpoint, g.save.hasSave()]; });
await R('Spieler stirbt', async () => { const g = window.NWO; g.godMode = false; g.player.damage(500, 'group'); await g.simulateAsync(0.5); return [g.mode, g.player.mode]; });
await page.waitForTimeout(2600);
await R('Todesbildschirm sichtbar', () => !!document.querySelector('.death'));
await R('Weiter vom Checkpoint', async () => { document.querySelector('.death [data-a=retry]').click(); await new Promise((r) => setTimeout(r, 1500)); const g = window.NWO; return [g.mode, g.player.mode, Math.round(g.player.hp), g.player.pos.x.toFixed(1), g.player.pos.z.toFixed(1)]; });
// Fortsetzen aus localStorage nach Neuladen
await page.reload(); await page.waitForTimeout(800);
await R('Fortsetzen-Knopf aktiv', () => !document.querySelector('[data-a=cont]').disabled);
await R('Fortsetzen lädt Checkpoint', async () => { const g = window.NWO; g.noAutoPause = true; await g.continueGame(); return [g.chapter.id, g.mode, g.state.hasPhone]; });
// Kapitelauswahl & Enden
await R('Kapitel freigeschaltet', () => window.NWO.save.meta().unlocked);
await R('Ende anzeigen (hope)', async () => { const g = window.NWO; g.playEnding('hope'); await new Promise((r) => setTimeout(r, 400)); return [g.mode, !!document.querySelector('.ending .page'), g.save.meta().endings]; });
console.log('Fehler:', errs.length ? errs.slice(0, 10).join('\n') : 'keine');
await browser.close(); srv.close();
