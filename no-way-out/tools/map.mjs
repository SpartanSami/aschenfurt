// Draufsicht eines Kapitels speichern: node tools/map.mjs ch1 [scale]
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const [ch = 'ch1', sc = '10'] = process.argv.slice(2);
const srv = http.createServer((req, res) => { const p = path.join(root, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : p.endsWith('.css') ? 'text/css' : 'text/html' }); fs.createReadStream(p).pipe(res); }).listen(0);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 320, height: 200 } });
await page.addInitScript(() => localStorage.setItem('nwo.settings.v1', JSON.stringify({ quality: 'low' })));
const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await page.goto(`http://localhost:${srv.address().port}/index.html?debug`);
await page.waitForTimeout(500);
await page.evaluate((c) => window.NWO.startChapter(c), ch);
await page.waitForFunction(() => window.NWO.mode === 'play', null, { timeout: 60000 });
const url = await page.evaluate((s) => window.NWO.debugMap(parseInt(s, 10)), sc);
fs.writeFileSync(`tools/out/map_${ch}.png`, Buffer.from(url.split(',')[1], 'base64'));
console.log(errs.join('\n') || 'ok');
await browser.close(); srv.close();
