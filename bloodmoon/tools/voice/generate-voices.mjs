// Erzeugt Sprachaufnahmen mit ElevenLabs für alle Zeilen aus tools/voice/lines.json.
// Voraussetzung: npm run voice:lines (einmalig) und ELEVENLABS_API_KEY in der Umgebung.
// Aufruf:  ELEVENLABS_API_KEY=... npm run voice:generate [-- --only=ch1 --limit=50 --force]
// Bereits vorhandene Dateien werden übersprungen. Die Dateien landen in public/assets/audio/voice/
// und werden in manifest.json eingetragen – das Spiel spielt sie dann automatisch ab.
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let todo = lines.filter((l) => (!args.only || l.id.startsWith(args.only)) && (args.force || !manifest[l.id]));
if (args.limit) todo = todo.slice(0, Number(args.limit));
console.log(`${todo.length} Zeilen werden vertont …`);

for (const [i, l] of todo.entries()) {
  const v = { ...voices.default, ...(voices.speakers[l.speaker] ?? {}) };
  const file = l.id.replace(/[^a-zA-Z0-9_-]/g, "_") + ".mp3";
  const body = {
    text: l.text.replace(/[„“]/g, '"'),
    model_id: voices.model_id,
    voice_settings: { stability: v.stability, similarity_boost: v.similarity_boost, style: v.style, use_speaker_boost: true },
  };
  for (let attempt = 0; attempt < 5; attempt++) {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${v.voice_id}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify(body),
    });
    if (r.status === 429 || r.status >= 500) {
      await sleep(2000 * (attempt + 1));
      continue;
    }
    if (!r.ok) {
      console.error(`Fehler bei ${l.id}: ${r.status} ${await r.text()}`);
      break;
    }
    fs.writeFileSync(path.join(outDir, file), Buffer.from(await r.arrayBuffer()));
    manifest[l.id] = file;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));
    console.log(`[${i + 1}/${todo.length}] ${l.id} (${l.speaker})`);
    break;
  }
  await sleep(250);
}
console.log("Fertig. Manifest:", manifestPath);
