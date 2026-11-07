// Erzeugt Sprachaufnahmen mit ElevenLabs für die Zeilen aus tools/voice/lines.json.
// Voraussetzung: npm run voice:lines und ELEVENLABS_API_KEY in der Umgebung.
//
//   ELEVENLABS_API_KEY=... npm run voice:generate
//   ELEVENLABS_API_KEY=... npm run voice:generate -- --only=ch1,mem --limit=20
//   ELEVENLABS_API_KEY=... npm run voice:generate -- --budget=9000   (höchstens so viele Credits verbrauchen)
//
// Bereits vorhandene Zeilen werden übersprungen – ein späterer Lauf (z. B. nach dem
// monatlichen Credit-Reset) macht einfach dort weiter. Reihenfolge: Kapitel 1, Erinnerungen,
// Blutdurst, dann Kapitel 2 bis 6. Die Dateien landen in public/assets/audio/voice/ und
// werden in manifest.json eingetragen; das Spiel spielt sie dann automatisch ab.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const outDir = path.join(root, "public/assets/audio/voice");
const key = process.env.ELEVENLABS_API_KEY;
if (!key) {
  console.error("Bitte ELEVENLABS_API_KEY setzen (https://elevenlabs.io -> Profil -> API Keys).");
  process.exit(1);
}
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")).map(([k, v]) => [k, v ?? true]));
const lines = JSON.parse(fs.readFileSync(path.join(here, "lines.json"), "utf8"));
const voices = JSON.parse(fs.readFileSync(path.join(here, "voices.json"), "utf8"));
fs.mkdirSync(outDir, { recursive: true });
const manifestPath = path.join(outDir, "manifest.json");
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : {};
const headers = { "xi-api-key": key, "Content-Type": "application/json" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const group = (id) => id.split(/[._]/)[0];
const ORDER = ["ch1", "mem", "hunger", "ch2", "ch3", "ch4", "ch5", "ch6"];
const rank = (id) => (ORDER.indexOf(group(id)) + 1 || 99);
const only = typeof args.only === "string" ? args.only.split(",") : null;

let todo = lines.filter((l) => (!only || only.includes(group(l.id))) && (args.force || !manifest[l.id]));
todo.sort((a, b) => rank(a.id) - rank(b.id));
if (args.limit) todo = todo.slice(0, Number(args.limit));

// Guthaben prüfen (braucht das Recht „User: Lesen“; ohne es wird nur das Budget beachtet)
let remaining = Infinity;
try {
  const r = await fetch("https://api.elevenlabs.io/v1/user/subscription", { headers });
  if (r.ok) {
    const s = await r.json();
    remaining = s.character_limit - s.character_count;
    console.log(`Plan: ${s.tier}, verbleibende Credits: ${remaining}`);
  }
} catch {
  /* Guthaben unbekannt */
}
const budget = Math.min(remaining - 20, args.budget ? Number(args.budget) : Infinity);
const factor = /turbo|flash/.test(voices.model_id) ? 0.5 : 1;
const estimate = (t) => Math.ceil(t.length * factor);
console.log(`${todo.length} Zeilen offen, geschätzt ${todo.reduce((s, l) => s + estimate(l.text), 0)} Credits, Budget ${budget === Infinity ? "unbegrenzt" : budget}.`);

let spent = 0, done = 0;
for (const l of todo) {
  if (spent + estimate(l.text) > budget) {
    console.log(`Budget erreicht – angehalten vor ${l.id}.`);
    break;
  }
  const v = { ...voices.default, ...(voices.speakers[l.speaker] ?? {}) };
  const file = l.id.replace(/[^a-zA-Z0-9_-]/g, "_") + ".mp3";
  const body = {
    text: l.text.replace(/[„“”]/g, '"').replace(/\s+/g, " ").trim(),
    model_id: voices.model_id,
    language_code: voices.language_code,
    voice_settings: { stability: v.stability, similarity_boost: v.similarity_boost, style: v.style ?? 0, use_speaker_boost: true },
  };
  let ok = false, fatal = false;
  for (let attempt = 0; attempt < 5 && !ok && !fatal; attempt++) {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${v.voice_id}?output_format=${voices.output_format}`, { method: "POST", headers, body: JSON.stringify(body) });
    if (r.status === 429 || r.status >= 500) {
      await sleep(2500 * (attempt + 1));
      continue;
    }
    if (!r.ok) {
      const msg = await r.text();
      console.error(`Fehler bei ${l.id}: ${r.status} ${msg}`);
      if (/quota|credits|payment|unauthorized|invalid_api_key/i.test(msg)) fatal = true;
      break;
    }
    fs.writeFileSync(path.join(outDir, file), Buffer.from(await r.arrayBuffer()));
    manifest[l.id] = file;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));
    spent += Number(r.headers.get("character-cost")) || estimate(l.text);
    ok = true;
  }
  if (fatal) break;
  if (ok) {
    done++;
    if (done % 10 === 0 || done === todo.length) console.log(`[${done}/${todo.length}] ${l.id} – ${spent} Credits verbraucht`);
  }
  await sleep(150);
}
console.log(`Fertig: ${done} Zeilen vertont, ${spent} Credits verbraucht. Manifest: ${manifestPath}`);
