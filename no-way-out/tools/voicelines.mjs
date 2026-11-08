// Sammelt alle Sprachzeilen (v-IDs) der Geräte-Stimmen aus den Kapiteln
import fs from 'node:fs';
const want = new Set(['unknown', 'fragment', 'pa', 'military']);
const out = new Map();
const walk = (o, seen = new Set()) => {
  if (!o || typeof o !== 'object' || seen.has(o)) return; seen.add(o);
  if (Array.isArray(o)) { o.forEach((x) => walk(x, seen)); return; }
  if (o.v && o.t && o.s && want.has(o.s)) out.set(o.v, { id: o.v, s: o.s, t: o.t });
  for (const k of Object.keys(o)) walk(o[k], seen);
};
// Skripte enthalten Zeilen in Funktionsrümpfen -> per Regex aus dem Quelltext lesen
for (const f of fs.readdirSync('src/data/chapters')) {
  const src = fs.readFileSync('src/data/chapters/' + f, 'utf8');
  const re = /\{\s*s:\s*'(\w+)'(?:,\s*name:\s*'[^']*')?,\s*t:\s*'((?:[^'\\]|\\.)*)',\s*v:\s*'(\w+)'/g;
  let m;
  while ((m = re.exec(src))) if (want.has(m[1])) out.set(m[3], { id: m[3], s: m[1], t: m[2].replace(/\\'/g, "'") });
}
const list = [...out.values()];
fs.writeFileSync('tools/out/voicelines.json', JSON.stringify(list, null, 1));
console.log(list.length, 'Zeilen,', list.reduce((a, l) => a + l.t.length, 0), 'Zeichen');
for (const l of list) console.log(l.id.padEnd(12), l.s.padEnd(9), l.t.length, l.t.slice(0, 70));
