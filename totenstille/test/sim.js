/* Zufalls-Durchläufe durch die ganze Story: findet Sackgassen, Fehler und zählt die Enden. */
const fs = require("fs"), vm = require("vm"), path = require("path");
const src = path.join(__dirname, "..", "src");
const ctx = vm.createContext({ console });
for (const f of ["kern.js", "story1.js", "story2.js", "story3.js", "story4.js"]) {
  vm.runInContext(fs.readFileSync(path.join(src, f), "utf8"), ctx, { filename: f });
}
const run = (code) => vm.runInContext(code, ctx);
ctx.__pick = null;
run(`
function __spiel(job, pick) {
  S = neuerStand("Sami", job);
  let id = betrete("prolog"), schritte = 0, pfad = [];
  const texte = [];
  while (schritte++ < 80) {
    const d = szeneDaten(id);
    texte.push(...d.text);
    if (d.ende) {
      texte.push(...schicksale(d.ende.art, d.ende.id));
      bilanz(d.ende.art).forEach(r => texte.push(r.join(": ")));
      return { ende: d.ende.id, szene: id, t: S.t, hp: S.hp, pfad, texte, S: JSON.parse(JSON.stringify(S)) };
    }
    if (d.wahlen) {
      d.wahlen.forEach(w => texte.push(w.l));
      const i = pick(id, d.wahlen);
      pfad.push(id + ":" + i);
      const r = entscheide(id, i);
      texte.push(...r.t, ...r.notizen);
      id = betrete(r.nx);
    } else {
      if (d.eingabe) S[d.eingabe.schluessel] = d.eingabe.std(S);
      id = betrete(d.weiter);
    }
  }
  throw new Error("Endlosschleife: " + pfad.join(" "));
}
`);
const jobs = ["Immobilienmakler", "Krankenschwester", "Polizist", "Elektriker", "Erzieherin", "Student", "Koch"];
const N = +process.argv[2] || 20000;
const enden = {}, arche = {}, zeiten = [];
let fehler = 0, schlecht = new Set();
const szenenGesehen = new Set(), wahlGesehen = new Set();
for (let n = 0; n < N; n++) {
  const job = jobs[n % jobs.length];
  ctx.__pick = (id, w) => Math.floor(Math.random() * 4);
  try {
    const r = run(`__spiel(${JSON.stringify(job)}, __pick)`);
    enden[r.ende] = (enden[r.ende] || 0) + 1;
    arche[job] = arche[job] || {}; arche[job][r.ende] = (arche[job][r.ende] || 0) + 1;
    if (r.ende !== "tod" && r.ende !== "zuspaet") zeiten.push(r.t);
    r.pfad.forEach(p => { wahlGesehen.add(p); szenenGesehen.add(p.split(":")[0]); });
    for (const t of r.texte) {
      if (/undefined|null|NaN|\[object|\$\{|false|true/.test(t)) schlecht.add(t.slice(0, 160));
    }
  } catch (e) { fehler++; if (fehler < 6) console.log("FEHLER", job, e.message, e.stack.split("\n")[1]); }
}
console.log("Durchläufe:", N, "Fehler:", fehler);
console.log("Enden:", Object.entries(enden).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + " " + (100 * v / N).toFixed(1) + "%").join(" | "));
zeiten.sort((a, b) => a - b);
const u = (t) => { const m = (22 * 60 + 10 + t) % 1440; return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); };
console.log("Ankunft (ohne Tod/Zu spät): früh", u(zeiten[0]), "median", u(zeiten[zeiten.length >> 1]), "spät", u(zeiten[zeiten.length - 1]));
console.log("Szenen mit Wahl:", szenenGesehen.size, "· gewählte Optionen:", wahlGesehen.size);
const alle = run("Object.keys(SZ).filter(k => SZ[k].wahl)");
for (const id of alle) for (let i = 0; i < 4; i++) if (!wahlGesehen.has(id + ":" + i)) console.log("nie gewählt:", id, i);
if (schlecht.size) { console.log("VERDÄCHTIGE TEXTE:"); [...schlecht].slice(0, 20).forEach(s => console.log("  ", s)); }
console.log("Beruf × Ende:"); for (const j of jobs) console.log("  ", j.padEnd(18), run(`berufArt(${JSON.stringify(j)})`).padEnd(6), JSON.stringify(arche[j]));

// Zusatz: wo gestorben wird, Zustand am Ende, Verteilung der Ankunftszeit
{
  const todWo = {}, hpEnd = {}, bucket = {};
  for (let n = 0; n < 6000; n++) {
    const r = run(`__spiel(${JSON.stringify(jobs[n % jobs.length])}, __pick)`);
    if (r.ende === "tod") todWo[r.szene + "@" + r.pfad[r.pfad.length - 1].split(":")[0]] = (todWo[r.szene + "@" + r.pfad[r.pfad.length - 1].split(":")[0]] || 0) + 1;
    else hpEnd[r.hp] = (hpEnd[r.hp] || 0) + 1;
    const b = r.ende === "zuspaet" ? "zu spät" : r.ende === "tod" ? "tod" : u(Math.floor(r.t / 30) * 30);
    bucket[b] = (bucket[b] || 0) + 1;
  }
  console.log("Tod nach Szene:", JSON.stringify(todWo));
  console.log("Zustand am Ende:", JSON.stringify(hpEnd));
  console.log("Ankunft:", Object.keys(bucket).sort().map(k => k + " " + bucket[k]).join(" | "));
}
