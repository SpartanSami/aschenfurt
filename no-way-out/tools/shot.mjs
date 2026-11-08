// Hilfsskript: Spiel headless starten, Skript ausführen, Screenshot speichern.
// node tools/shot.mjs <out.png> "<query>" "<js-to-eval-after-load>" [waitMs]
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const [out = 'tools/out/shot.png', query = '', js = '', waitMs = '2500'] = process.argv.slice(2);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.mp3': 'audio/mpeg', '.png': 'image/png' };
const srv = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
}).listen(0);
const port = srv.address().port;
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const W = parseInt(process.env.W || '960', 10), H = parseInt(process.env.H || '540', 10);
const page = await browser.newPage({ viewport: { width: W, height: H } });
const Q = process.env.Q || 'medium';
await page.addInitScript((q) => { try { const s = JSON.parse(localStorage.getItem('nwo.settings.v1') || '{}'); s.quality = q; localStorage.setItem('nwo.settings.v1', JSON.stringify(s)); } catch (e) {} }, Q);
const logs = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning' || m.text().startsWith('[')) logs.push(m.type() + ': ' + m.text()); });
page.on('pageerror', (e) => logs.push('PAGEERROR: ' + e.message));
await page.goto(`http://localhost:${port}/index.html${query}`);
await page.waitForTimeout(1500);
if (js) {
  try { const r = await page.evaluate(js); if (r !== undefined) console.log('RESULT:', JSON.stringify(r).slice(0, 3000)); } catch (e) { console.log('EVAL ERROR', e.message); }
}
await page.waitForTimeout(parseInt(waitMs, 10));
await page.screenshot({ path: out, timeout: 120000 });
console.log(logs.slice(0, 40).join('\n'));
await browser.close(); srv.close();
