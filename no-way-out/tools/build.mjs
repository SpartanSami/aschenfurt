// Build: bündelt src/ zu dist/game.js (IIFE, läuft auch per Doppelklick ohne Server)
// und erzeugt NoWayOut.html als Einzeldatei-Version.
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const watch = process.argv.includes('--watch');
// Sprach-Manifest erzeugen
{
  const vdir0 = path.join(root, 'assets/audio');
  const ids = fs.existsSync(vdir0) ? fs.readdirSync(vdir0).filter((f) => f.endsWith('.mp3')).map((f) => f.replace(/\.mp3$/, '')) : [];
  fs.writeFileSync(path.join(root, 'src/data/story/voicemanifest.js'), '// Automatisch erzeugt (tools/build.mjs): verfügbare Sprachaufnahmen in assets/audio\nexport const VOICE_IDS = new Set(' + JSON.stringify(ids) + ');\n');
}
const opts = {
  entryPoints: [path.join(root, 'src/main.js')],
  bundle: true, format: 'iife', target: ['es2020'],
  outfile: path.join(root, 'dist/game.js'),
  minify: !process.argv.includes('--dev'), sourcemap: process.argv.includes('--dev') ? 'inline' : false,
  legalComments: 'none', logLevel: 'info',
};
await build(opts);
// Einzeldatei
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'dist/game.js'), 'utf8');
let voice = '';
const vdir = path.join(root, 'assets/audio');
if (fs.existsSync(vdir)) {
  const files = fs.readdirSync(vdir).filter((f) => f.endsWith('.mp3'));
  if (files.length) {
    const map = {};
    for (const f of files) map[f.replace(/\.mp3$/, '')] = fs.readFileSync(path.join(vdir, f)).toString('base64');
    voice = `<script>window.NWO_VOICE=${JSON.stringify(map)};</script>`;
  }
}
// Wichtig: Ersetzung per Funktion. Bei einem Ersetzungs-Text würden Zeichenfolgen wie „$&“ im
// minifizierten Code als Platzhalter gelesen und HTML mitten in den Code einfügen.
const single = html
  .replace('<link rel="stylesheet" href="style.css">', () => `<style>${css}</style>`)
  .replace('<script src="dist/game.js"></script>', () => `${voice}<script>${js.replace(/<\/script>/gi, () => '<\\/script>')}</script>`);
// Prüfen, dass der Code unverändert in der Einzeldatei steckt
if (!single.includes(js.replace(/<\/script>/gi, () => '<\\/script>'))) throw new Error('Einzeldatei: eingebetteter Code weicht vom Bundle ab');
if ((single.match(/<\/script>/gi) || []).length !== (voice ? 2 : 1)) throw new Error('Einzeldatei: unerwartete </script>-Anzahl');
fs.writeFileSync(path.join(root, 'NoWayOut.html'), single);
console.log('Einzeldatei:', (fs.statSync(path.join(root, 'NoWayOut.html')).size / 1024 / 1024).toFixed(2), 'MB');
