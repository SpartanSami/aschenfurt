// Optional: erzeugt Soundeffekte mit der ElevenLabs Sound-Generation-API.
// Das Spiel verwendet sie anstelle der prozeduralen Klänge, sobald sie im Manifest stehen.
// Aufruf: ELEVENLABS_API_KEY=... npm run sfx:generate
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, "../../public/assets/audio/sfx");
const key = process.env.ELEVENLABS_API_KEY;
if (!key) {
  console.error("Bitte ELEVENLABS_API_KEY setzen.");
  process.exit(1);
}
const SFX = {
  doorOpen: "heavy old wooden castle door creaking open slowly, stone hall reverb",
  doorSlam: "heavy wooden door slamming shut in a stone corridor",
  howl: "distant lone wolf howl at night in a foggy forest",
  growl: "deep menacing werewolf growl, close",
  whisper: "unintelligible ghostly whispers, eerie, close to the ear",
  scare: "sudden horror stinger, dissonant strings hit",
  bell: "single toll of a large old church bell, distant",
  stoneGrind: "heavy stone slab grinding and sliding open",
  gateOpen: "iron portcullis chains rattling and rising",
  thunder: "rolling distant thunder",
  crow: "single crow cawing at night",
};
fs.mkdirSync(outDir, { recursive: true });
const manifestPath = path.join(outDir, "manifest.json");
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : {};
for (const [name, prompt] of Object.entries(SFX)) {
  if (manifest[name]?.length) continue;
  const r = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({ text: prompt, prompt_influence: 0.5 }),
  });
  if (!r.ok) {
    console.error(name, r.status, await r.text());
    continue;
  }
  const file = `${name}.mp3`;
  fs.writeFileSync(path.join(outDir, file), Buffer.from(await r.arrayBuffer()));
  manifest[name] = [file];
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));
  console.log("ok", name);
}
