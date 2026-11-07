// Exportiert alle Sprachzeilen (Dialoge + Monologe) nach tools/voice/lines.json.
// Aufruf: npm run voice:lines
import { writeFileSync } from "fs";
import { DIALOGUES } from "../../src/story/data/dialogues";
import { LINES } from "../../src/story/data/lines";

interface Out {
  id: string;
  speaker: string;
  text: string;
}

const out: Out[] = [];
for (const [id, l] of Object.entries(LINES)) out.push({ id, speaker: l.s, text: l.t });
for (const d of Object.values(DIALOGUES)) {
  for (const [nodeId, n] of Object.entries(d.nodes)) {
    if (!n.text) continue;
    out.push({ id: `${d.id}.${nodeId}`, speaker: n.speaker, text: n.text });
  }
}
writeFileSync(new URL("./lines.json", import.meta.url), JSON.stringify(out, null, 2), "utf8");
const chars = out.reduce((s, l) => s + l.text.length, 0);
console.log(`${out.length} Zeilen exportiert (${chars} Zeichen) -> tools/voice/lines.json`);
