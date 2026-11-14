// Mehrere Ansichten eines Kapitels rendern: node tools/views.mjs <chapter> <prefix> '<json views>'
// view: {x,z,yaw,pitch,flash,wait,js}
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const [chapter = 'test', prefix = 'v', viewsJson = '[]'] = process.argv.slice(2);
const views = JSON.parse(viewsJson);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.mp3': 'audio/mpeg' };
const srv = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
}).listen(0);
const port = srv.address().port;
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const W = parseInt(process.env.W || '800', 10), H = parseInt(process.env.H || '450', 10);
const page = await browser.newPage({ viewport: { width: W, height: H } });
const Q = process.env.Q || 'low';
await page.addInitScript((q) => { try { localStorage.setItem('nwo.settings.v1', JSON.stringify({ quality: q })); } catch (e) {} }, Q);
const logs = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); });
page.on('pageerror', (e) => logs.push('PAGEERROR: ' + e.message + '\n' + e.stack));
await page.goto(`http://localhost:${port}/index.html?debug`);
await page.waitForTimeout(800);
await page.evaluate((c) => { window.NWO.startChapter(c); }, chapter);
await page.waitForTimeout(2500);
let i = 0;
for (const v of views) {
  const r = await page.evaluate((v) => {
    const g = window.NWO;
    if (v.x !== undefined) { g.player.spawn(v.x, v.z, v.yaw || 0); }
    if (v.pitch !== undefined) g.player.pitch = v.pitch;
    if (v.flash !== undefined) { g.player.flashlight = !!v.flash; g.hands.setFlashlight(!!v.flash); }
    if (v.js) return eval(v.js);
    return null;
  }, v);
  if (r !== null && r !== undefined) console.log('JS', i, JSON.stringify(r).slice(0, 2000));
  await page.waitForTimeout(v.wait || 1200);
  if (v.shot !== false) await page.screenshot({ path: `tools/out/${prefix}${i}.png`, timeout: 120000 });
  i++;
}
console.log(logs.slice(0, 30).join('\n'));
await browser.close(); srv.close();
